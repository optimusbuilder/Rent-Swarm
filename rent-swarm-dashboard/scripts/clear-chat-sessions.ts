/**
 * Clear all chat sessions from MongoDB
 * Run this if you're experiencing "System message should be the first one" errors
 *
 * Usage: npx tsx scripts/clear-chat-sessions.ts
 */

import { connectToDatabase } from '../lib/db';
import { ChatSession } from '../lib/models/ChatSession';

async function clearSessions() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await connectToDatabase();

    console.log('🗑️  Clearing all chat sessions...');
    const result = await ChatSession.deleteMany({});

    console.log(`✅ Deleted ${result.deletedCount} chat session(s)`);
    console.log('💡 Start a fresh conversation to test the fix');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing sessions:', error);
    process.exit(1);
  }
}

clearSessions();
