import { NextRequest, NextResponse } from 'next/server';
import { ChatAgent } from '@/lib/agents/chat-agent';
import { LangChainStreamAdapter } from '@/lib/streaming/langchain-stream';

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

    // For demo purposes, use a mock user ID
    // In production, get this from next-auth session:
    // const session = await getServerSession();
    // const userId = session?.user?.email || 'anonymous';
    const userId = 'demo-user';

    // Extract the last user message
    const userMessage = messages[messages.length - 1].content;

    // Initialize agent
    const agent = new ChatAgent();

    // Check if client wants streaming
    const acceptHeader = req.headers.get('accept') || '';
    const wantsStream = acceptHeader.includes('text/event-stream');

    if (wantsStream) {
      // STREAMING RESPONSE
      try {
        const stream = agent.stream({
          sessionId,
          userId,
          userMessage,
          context: context || { listings: [], bookmarks: [] },
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
      // NON-STREAMING RESPONSE
      const result = await agent.invoke({
        sessionId,
        userId,
        userMessage,
        context: context || { listings: [], bookmarks: [] },
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
