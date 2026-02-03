import { StateGraph, END, START } from "@langchain/langgraph";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { AgentState } from "./state";
import { tools } from "../tools";
import { AIMessage, BaseMessage } from "@langchain/core/messages";

// Initialize Gemini model with tool binding and exponential backoff retry
const createModel = (systemInstruction?: string) => {
  const model = new ChatGoogleGenerativeAI({
    modelName: "gemini-2.0-flash",
    temperature: 0.7,
    apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
    ...(systemInstruction && { systemInstruction }),
    // Exponential backoff retry for rate limiting (429 errors)
    maxRetries: 5,
    // LangChain uses exponential backoff by default with these retries
    callbacks: [
      {
        handleLLMError: async (error: any) => {
          console.error(`[LangChain] LLM Error: ${error.message}`);
        },
      },
    ],
  });

  return model.bindTools(tools);
};

// Define agent nodes
async function callModel(state: AgentState) {
  // Pass context to tools via configuration
  const config = {
    metadata: {
      ...state.context,
    },
  };

  // CRITICAL: Extract SystemMessage content for Gemini's systemInstruction parameter
  // Gemini doesn't support SystemMessage in the messages array - it needs to be passed
  // as systemInstruction in the model config
  const firstMessage = state.messages[0];
  const isFirstMessageSystem = firstMessage?._getType() === 'system';

  let systemInstruction: string | undefined;
  let messagesToSend;

  if (isFirstMessageSystem) {
    // Extract system message content and remove it from messages array
    systemInstruction = (firstMessage as any).content;
    messagesToSend = state.messages.slice(1); // Skip the SystemMessage
    console.log("=== SYSTEM INSTRUCTION ===");
    console.log(systemInstruction);
  } else {
    // No system message - filter out any that might exist
    messagesToSend = state.messages.filter(msg => msg._getType() !== 'system');
  }

  console.log("=== MESSAGES TO SEND ===");
  console.log(JSON.stringify(messagesToSend.map(m => ({ type: m._getType(), content: typeof m.content === 'string' ? m.content.substring(0, 100) : 'non-string' }))));

  const model = createModel(systemInstruction);
  const response = await model.invoke(messagesToSend, config);

  return {
    messages: [...state.messages, response],
    iterations: state.iterations + 1,
  };
}

// Tool execution node
const toolNode = new ToolNode(tools);

// Conditional edge function - decides where to go next
function shouldContinue(state: AgentState): string {
  const lastMessage = state.messages[state.messages.length - 1] as AIMessage;

  // Check if we've exceeded iteration limit (safety)
  if (state.iterations >= 10) {
    console.warn("Max iterations reached, ending conversation");
    return END;
  }

  // Check if the last message has tool calls
  if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
    return "tools";
  }

  // No tool calls, we're done
  return END;
}

// Build and compile the graph
export function createChatGraph() {
  const workflow = new StateGraph<AgentState>({
    channels: {
      messages: {
        value: (left?: BaseMessage[], right?: BaseMessage[]) => {
          if (!left) return right || [];
          if (!right) return left;
          return [...left, ...right];
        },
        default: () => [],
      },
      context: {
        value: (left: any, right: any) => ({ ...left, ...right }),
        default: () => ({ listings: [], bookmarks: [], userId: undefined }),
      },
      humanInLoop: {
        value: (left: any, right: any) => ({ ...left, ...right }),
        default: () => undefined,
      },
      iterations: {
        value: (left?: number, right?: number) => (right !== undefined ? right : left || 0),
        default: () => 0,
      },
    },
  });

  // Add nodes
  workflow.addNode("agent", callModel);
  workflow.addNode("tools", toolNode);

  // Define the edges
  workflow.addEdge(START, "agent");
  workflow.addConditionalEdges("agent", shouldContinue, {
    tools: "tools",
    [END]: END,
  });
  workflow.addEdge("tools", "agent");

  // Compile and return
  return workflow.compile();
}
