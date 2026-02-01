import { BaseMessage } from "@langchain/core/messages";

export interface AgentContext {
  listings: any[];
  bookmarks: any[];
  userId?: string;
}

export interface HumanInLoopState {
  required: boolean;
  reason: string;
  action?: string;
  approved?: boolean;
  data?: any;
}

export interface AgentState {
  messages: BaseMessage[];
  context: AgentContext;
  humanInLoop?: HumanInLoopState;
  iterations: number;
}

export interface AgentResponse {
  sessionId: string;
  response: string;
  toolCalls?: any[];
  humanInLoop?: HumanInLoopState;
}
