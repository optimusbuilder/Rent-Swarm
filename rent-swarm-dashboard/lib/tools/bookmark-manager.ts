import { DynamicStructuredTool } from "@langchain/core/tools";
import { RunnableConfig } from "@langchain/core/runnables";
import { z } from "zod";
import connectToDatabase from "../db";
import User from "../models/User";

interface ToolMetadata {
  bookmarks?: any[];
  listings?: any[];
  userId?: string;
}

export const bookmarkManagerTool = new DynamicStructuredTool({
  name: "query_bookmarks",
  description: "Query the user's saved/bookmarked listings. Use this when the user asks about their saved listings, favorites, or bookmarks.",
  schema: z.object({
    action: z.enum(["list", "query"]).describe("'list' to show all bookmarks, 'query' to search bookmarks"),
    searchQuery: z.string().optional().describe("Search term to filter bookmarks by address, city, or other fields (only used when action is 'query')"),
  }),
  func: async (input, runManager, config?: RunnableConfig) => {
    const { action, searchQuery } = input;

    // Extract metadata safely
    const metadata = (config?.metadata || {}) as ToolMetadata;

    // Try to get bookmarks from context first (faster)
    let bookmarks = metadata.bookmarks || [];

    // If no bookmarks in context and we have a userId, fetch from database
    if (bookmarks.length === 0 && metadata.userId) {
      try {
        await connectToDatabase();
        const user = await User.findById(metadata.userId);
        if (user && user.bookmarks) {
          bookmarks = user.bookmarks;
        }
      } catch (error) {
        console.error("Error fetching bookmarks from database:", error);
        // Fall through to handle empty bookmarks
      }
    }

    if (bookmarks.length === 0) {
      const hasUserId = !!metadata.userId;
      return JSON.stringify({
        success: false,
        message: hasUserId
          ? "You have no saved listings yet. Save some listings from search results to bookmark them."
          : "Unable to access bookmarks. Please ensure you are logged in.",
        bookmarks: [],
        requiresAuth: !hasUserId,
      });
    }

    let results = bookmarks;

    // If query action, filter bookmarks
    if (action === "query" && searchQuery) {
      const queryLower = searchQuery.toLowerCase();
      results = bookmarks.filter((b: any) => {
        return (
          b.address?.toLowerCase().includes(queryLower) ||
          b.city?.toLowerCase().includes(queryLower) ||
          String(b.price).includes(searchQuery) ||
          String(b.beds).includes(searchQuery)
        );
      });

      if (results.length === 0) {
        return JSON.stringify({
          success: false,
          message: `No bookmarks match "${searchQuery}". You have ${bookmarks.length} total bookmark(s).`,
          bookmarks: [],
          totalBookmarks: bookmarks.length,
        });
      }
    }

    return JSON.stringify({
      success: true,
      message: action === "query"
        ? `Found ${results.length} bookmark(s) matching "${searchQuery}"`
        : `You have ${results.length} saved listing(s)`,
      bookmarks: results.map((b: any) => ({
        id: b.id,
        address: b.address,
        city: b.city,
        price: b.price,
        beds: b.beds,
        baths: b.baths,
        sqft: b.sqft,
        pricePerSqft: b.sqft > 0 ? (b.price / b.sqft).toFixed(2) : null,
        link: b.link,
      })),
      totalBookmarks: bookmarks.length,
    });
  },
});
