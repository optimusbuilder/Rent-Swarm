import { createChatGraph } from "./graph";
import { MongoDBChatMessageHistory } from "../memory/mongo-memory";
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import { v4 as uuidv4 } from "uuid";
import { AgentResponse, AgentContext, HumanInLoopState } from "./state";

export interface ChatAgentInput {
  sessionId?: string;
  userId: string;
  userMessage: string;
  context: AgentContext;
}

export class ChatAgent {
  private graph: ReturnType<typeof createChatGraph>;

  constructor() {
    this.graph = createChatGraph();
  }

  /**
   * Build the system prompt with user context
   */
  private buildSystemPrompt(context: AgentContext): SystemMessage {
    const { bookmarks = [], listings = [] } = context;

    let contextInfo = "";
    if (bookmarks.length > 0) {
      contextInfo += `\n\nUser's Saved Listings (Bookmarks):\n`;
      bookmarks.slice(0, 5).forEach((b, i) => {
        contextInfo += `${i + 1}. ${b.address}, ${b.city} - $${b.price}/mo, ${b.beds}bd/${b.baths}ba, ${b.sqft} sqft\n`;
      });
    }

    if (listings.length > 0) {
      contextInfo += `\n\nRecent Search Results (${listings.length} total):\n`;
      listings.slice(0, 3).forEach((l, i) => {
        contextInfo += `${i + 1}. ${l.address}, ${l.city} - $${l.price}/mo, ${l.beds}bd/${l.baths}ba\n`;
      });
    }

    const systemPrompt = `You are the Rent-Swarm Brain, an expert AI housing assistant embedded in a rental search application.

Your capabilities and tools:
- **search_listings**: Search and filter rental listings by price, city, bedrooms, etc.
- **calculate_price_metrics**: Calculate price per sqft, affordability (30% rule), and compare listings
- **query_bookmarks**: Access user's saved/bookmarked listings
- **get_market_insights**: Get market data, average rents, and trends for cities/neighborhoods
- **analyze_lease_clauses**: Query legal information about lease terms and tenant rights (set provideAdvice=true for specific recommendations - requires confirmation)

Guidelines:
- Be concise, friendly, and direct
- **IMPORTANT**: Use tools when you need real data - don't make up prices, addresses, or facts
- When comparing listings, use calculate_price_metrics tool to get accurate price/sqft data
- For legal questions, use analyze_lease_clauses tool (general info without provideAdvice, specific advice with provideAdvice=true)
- Reference specific listings by address when discussing them
- Provide bullet points when comparing multiple options
${contextInfo || "\n\nUser has no saved listings or recent searches yet. Suggest they use the Scout feature to find rentals."}

Respond helpfully to the user's question using the appropriate tools.`;

    return new SystemMessage(systemPrompt);
  }

  /**
   * Check if tool results indicate human-in-the-loop requirement
   */
  private checkForHumanInLoop(messages: any[]): HumanInLoopState | undefined {
    // Check the last few messages for tool results
    for (let i = messages.length - 1; i >= Math.max(0, messages.length - 3); i--) {
      const msg = messages[i];

      if (msg.content && typeof msg.content === "string") {
        try {
          const parsed = JSON.parse(msg.content);
          if (parsed.requiresConfirmation) {
            return {
              required: true,
              reason: parsed.reason || "Action requires confirmation",
              action: parsed.action,
              data: parsed.data,
            };
          }
        } catch (e) {
          // Not JSON or doesn't have requiresConfirmation
          continue;
        }
      }
    }

    return undefined;
  }

  /**
   * Invoke the agent with a user message (non-streaming)
   */
  async invoke(input: ChatAgentInput): Promise<AgentResponse> {
    const { sessionId: inputSessionId, userId, userMessage, context } = input;

    // Generate or use existing session ID
    const sessionId = inputSessionId || uuidv4();

    // Load conversation history
    const memory = new MongoDBChatMessageHistory(sessionId, userId);
    const history = await memory.getMessages();

    // Build system prompt
    const systemPrompt = this.buildSystemPrompt(context);

    // Invoke graph
    const result = await this.graph.invoke({
      messages: [systemPrompt, ...history, new HumanMessage(userMessage)],
      context: { ...context, userId },
      iterations: 0,
    });

    // Extract last message
    const lastMessage = result.messages[result.messages.length - 1] as AIMessage;
    const responseContent = typeof lastMessage.content === "string"
      ? lastMessage.content
      : JSON.stringify(lastMessage.content);

    // Check for human-in-the-loop requirement
    const humanInLoop = this.checkForHumanInLoop(result.messages);

    // Save messages to memory (only user and assistant messages, not system)
    await memory.addMessage(new HumanMessage(userMessage));
    await memory.addMessage(new AIMessage(responseContent));

    return {
      sessionId,
      response: responseContent,
      toolCalls: lastMessage.tool_calls || [],
      humanInLoop,
    };
  }

  /**
   * Stream responses from the agent (for token-by-token streaming)
   */
  async *stream(input: ChatAgentInput): AsyncGenerator<any> {
    const { sessionId: inputSessionId, userId, userMessage, context } = input;

    // Generate or use existing session ID
    const sessionId = inputSessionId || uuidv4();

    // Load conversation history
    const memory = new MongoDBChatMessageHistory(sessionId, userId);
    const history = await memory.getMessages();

    // Build system prompt
    const systemPrompt = this.buildSystemPrompt(context);

    // Stream from graph
    const stream = await this.graph.stream({
      messages: [systemPrompt, ...history, new HumanMessage(userMessage)],
      context: { ...context, userId },
      iterations: 0,
    });

    let fullResponse = "";
    let lastMessage: AIMessage | null = null;

    for await (const chunk of stream) {
      // Graph streams are structured as { [nodeName]: updates }
      if (chunk.agent) {
        const messages = chunk.agent.messages || [];
        if (messages.length > 0) {
          lastMessage = messages[messages.length - 1] as AIMessage;
          const content = typeof lastMessage.content === "string"
            ? lastMessage.content
            : JSON.stringify(lastMessage.content);

          fullResponse = content;
          yield { content, sessionId };
        }
      }
    }

    // Save to memory after streaming completes
    await memory.addMessage(new HumanMessage(userMessage));
    if (lastMessage) {
      await memory.addMessage(lastMessage);
    }
  }
}
