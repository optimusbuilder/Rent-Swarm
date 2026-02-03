import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { ChatAgent } from '@/lib/agents/chat-agent';
import { LangChainStreamAdapter } from '@/lib/streaming/langchain-stream';
import { AgentContext } from '@/lib/agents/state';
import connectToDatabase from '@/lib/db';
import User from '@/lib/models/User';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: Message[];
  context?: {
    listings?: any[];
    bookmarks?: any[];
  };
  sessionId?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json();
    const { messages, context, sessionId } = body;

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages are required' },
        { status: 400 }
      );
    }

    // Get user session for authentication
    const session = await getServerSession(authOptions) as any;

    // Debug logging
    console.log("=== Session Debug Info ===");
    console.log("Session exists:", !!session);
    console.log("Session.user exists:", !!session?.user);
    console.log("Session.user.id:", session?.user?.id);
    console.log("Session.user.email:", session?.user?.email);

    const userId = session?.user?.id || null;

    // Log warning if no authenticated user
    if (!userId) {
      console.warn('Chat request without authenticated user - bookmark features will be limited');
    }

    console.log("Fetching bookmarks...");
    console.log(`USER ID: ${userId}`);

    // Fetch bookmarks from database if not provided in context and user is authenticated
    // Ensure context always has required arrays (non-undefined) for AgentContext type
    const enrichedContext: AgentContext = {
      listings: context?.listings || [],
      bookmarks: context?.bookmarks || [],
      userId: userId || undefined,
    };

    if (userId /*&& !(!enrichedContext.bookmarks || enrichedContext.bookmarks.length === 0)*/) {
      try {
        await connectToDatabase();
        const user = await User.findById(userId);
        if (user && user.bookmarks) {
          // Ensure bookmarks is always an array
          enrichedContext.bookmarks = Array.isArray(user.bookmarks) ? user.bookmarks : [];
          console.log(`Actual bookmarks: ${user.bookmarks}`);
          console.log(`Fetched ${enrichedContext.bookmarks.length} bookmarks from database for user ${userId}`);
        } else {
          console.log(`No bookmarks present.`);
        }
      } catch (error) {
        console.error('Error fetching bookmarks for chat context:', error);
        // Continue with empty bookmarks rather than failing
      }
    }

    console.log("Post bookmarks.");

    // Extract the last user message
    const userMessage = messages[messages.length - 1].content;

    // Initialize agent
    const agent = new ChatAgent();

    // Check if client wants streaming
    const acceptHeader = req.headers.get('accept') || '';
    const wantsStream = acceptHeader.includes('text/event-stream');

    console.log(`STREM: ${wantsStream}`);

    if (wantsStream) {
      // STREAMING RESPONSE
      try {
        const stream = agent.stream({
          sessionId,
          userId,
          userMessage,
          context: enrichedContext,
        });

        const readableStream = LangChainStreamAdapter.toReadableStream(stream, 'sse');

        return new Response(readableStream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        });
      } catch (streamError) {
        console.error('Streaming error:', streamError);
        return NextResponse.json(
          { error: 'Streaming failed', details: String(streamError) },
          { status: 500 }
        );
      }
    } else {
      // console.log(`My context: ${JSON.stringify(enrichedContext.bookmarks[0])}`);
      // NON-STREAMING RESPONSE
      const result = await agent.invoke({
        sessionId,
        userId,
        userMessage,
        context: enrichedContext,
      });

      // Check if human-in-the-loop confirmation is required
      if (result.humanInLoop?.required) {
        return NextResponse.json({
          role: 'assistant',
          content: `⚠️ ${result.humanInLoop.reason}\n\nWould you like me to proceed?`,
          sessionId: result.sessionId,
          confirmation: result.humanInLoop,
        });
      }

      return NextResponse.json({
        role: 'assistant',
        content: result.response,
        sessionId: result.sessionId,
        toolCalls: result.toolCalls,
      });
    }
  } catch (error) {
    console.error('Chat API error:', error);

    // Detailed error logging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    return NextResponse.json(
      {
        error: 'Failed to generate response',
        details: process.env.NODE_ENV === 'development'
          ? String(error)
          : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
