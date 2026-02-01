export interface ChatMemoryMetadata {
  context?: {
    listings?: any[];
    bookmarks?: any[];
  };
  lastAccessed?: Date;
}

export interface ChatMemoryOptions {
  sessionId: string;
  userId: string;
}
