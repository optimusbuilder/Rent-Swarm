import mongoose, { Schema, model, models, Document } from "mongoose";

export interface IChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  toolCalls?: any[];
}

export interface IChatSession extends Document {
  sessionId: string;
  userId: string;
  messages: IChatMessage[];
  metadata: {
    context: any;
    lastAccessed: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema({
  role: {
    type: String,
    enum: ["user", "assistant", "system"],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  toolCalls: {
    type: Array,
    default: [],
  },
});

const ChatSessionSchema = new Schema<IChatSession>(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: String,
      required: true,
    },
    messages: {
      type: [ChatMessageSchema],
      default: [],
    },
    metadata: {
      context: {
        type: Schema.Types.Mixed,
        default: {},
      },
      lastAccessed: {
        type: Date,
        default: Date.now,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Create composite index for efficient queries
// Note: sessionId already has unique index from schema definition
ChatSessionSchema.index({ userId: 1, createdAt: -1 });

const ChatSession = models.ChatSession || model<IChatSession>("ChatSession", ChatSessionSchema);

export default ChatSession;
