import { BaseListChatMessageHistory } from "@langchain/core/chat_history";
import { BaseMessage, HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import connectToDatabase from "../db";
import ChatSession from "../models/ChatSession";

export class MongoDBChatMessageHistory extends BaseListChatMessageHistory {
  lc_namespace = ["langchain", "stores", "message", "mongodb"];

  private sessionId: string;
  private userId: string;

  constructor(sessionId: string, userId: string) {
    super();
    this.sessionId = sessionId;
    this.userId = userId;
  }

  async getMessages(): Promise<BaseMessage[]> {
    await connectToDatabase();

    const session = await ChatSession.findOne({ sessionId: this.sessionId });
    if (!session || !session.messages) {
      return [];
    }

    return session.messages.map((msg: any) => {
      const messageContent = msg.content;
      switch (msg.role) {
        case "user":
          return new HumanMessage(messageContent);
        case "system":
          return new SystemMessage(messageContent);
        case "assistant":
        default:
          return new AIMessage(messageContent);
      }
    });
  }

  async addMessage(message: BaseMessage): Promise<void> {
    await connectToDatabase();

    const messageType = message._getType();
    let role: "user" | "assistant" | "system";

    switch (messageType) {
      case "human":
        role = "user";
        break;
      case "system":
        role = "system";
        break;
      case "ai":
      default:
        role = "assistant";
        break;
    }

    await ChatSession.findOneAndUpdate(
      { sessionId: this.sessionId },
      {
        $push: {
          messages: {
            role,
            content: typeof message.content === "string" ? message.content : JSON.stringify(message.content),
            timestamp: new Date(),
            toolCalls: (message as any).tool_calls || [],
          },
        },
        $set: {
          "metadata.lastAccessed": new Date(),
          userId: this.userId,
        },
      },
      { upsert: true, new: true }
    );
  }

  async addMessages(messages: BaseMessage[]): Promise<void> {
    for (const message of messages) {
      await this.addMessage(message);
    }
  }

  async clear(): Promise<void> {
    await connectToDatabase();
    await ChatSession.deleteOne({ sessionId: this.sessionId });
  }
}
