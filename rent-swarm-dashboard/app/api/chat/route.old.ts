import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY!);

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
}

export async function POST(req: NextRequest) {
    try {
        const { messages, context }: ChatRequest = await req.json();

        if (!messages || messages.length === 0) {
            return NextResponse.json(
                { error: 'Messages are required' },
                { status: 400 }
            );
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        // Build context string from user's data
        let contextString = "";
        if (context?.bookmarks && context.bookmarks.length > 0) {
            contextString += `\n\nUser's Saved Listings (Bookmarks):\n`;
            context.bookmarks.forEach((b, i) => {
                contextString += `${i + 1}. ${b.address} - $${b.price}/mo, ${b.beds}bd/${b.baths}ba, ${b.sqft} sqft\n`;
            });
        }
        if (context?.listings && context.listings.length > 0) {
            contextString += `\n\nRecent Search Results:\n`;
            context.listings.slice(0, 5).forEach((l, i) => {
                contextString += `${i + 1}. ${l.address} - $${l.price}/mo, ${l.beds}bd/${l.baths}ba\n`;
            });
        }

        const systemPrompt = `You are the Rent-Swarm Brain, an expert AI housing assistant embedded in a rental search application.

Your capabilities:
- Answer questions about apartments, neighborhoods, and rental markets
- Compare listings and calculate price per square foot
- Provide negotiation tips and strategies
- Explain lease terms and potential red flags
- Give insights about specific cities and neighborhoods

Tone: Friendly, knowledgeable, and concise. Use bullet points when comparing items. Be direct.

${contextString ? `Current User Context:${contextString}` : "User has no saved listings yet."}

Respond helpfully to the user's question.`;

        // Convert messages to Gemini format
        const geminiMessages = messages.map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
        }));

        // Prepend system prompt to first user message or as separate
        const contents = [
            { role: 'user', parts: [{ text: systemPrompt }] },
            { role: 'model', parts: [{ text: "Understood. I'm the Rent-Swarm Brain, ready to help with housing questions." }] },
            ...geminiMessages
        ];

        const result = await model.generateContent({ contents });
        const responseText = result.response.text();

        return NextResponse.json({
            role: 'assistant',
            content: responseText
        });

    } catch (error) {
        console.error('Chat API error:', error);
        return NextResponse.json(
            { error: 'Failed to generate response', details: String(error) },
            { status: 500 }
        );
    }
}
