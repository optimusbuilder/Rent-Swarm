import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

export const listingSearchTool = new DynamicStructuredTool({
  name: "search_listings",
  description: "Search and filter rental listings based on price, location, bedrooms, and other criteria. Use this when the user asks to find, search, filter, or compare listings.",
  schema: z.object({
    minPrice: z.number().optional().describe("Minimum monthly rent in dollars"),
    maxPrice: z.number().optional().describe("Maximum monthly rent in dollars"),
    city: z.string().optional().describe("City name to filter by (case-insensitive partial match)"),
    minBeds: z.number().optional().describe("Minimum number of bedrooms"),
    maxBeds: z.number().optional().describe("Maximum number of bedrooms"),
    sortBy: z.enum(["price", "sqft", "scamScore"]).optional().describe("Sort results by this field"),
  }),
  func: async (input, config) => {
    const { minPrice, maxPrice, city, minBeds, maxBeds, sortBy } = input;

    // Get listings from context (passed via config.metadata)
    const listings = config?.metadata?.listings || [];

    if (listings.length === 0) {
      return JSON.stringify({
        success: false,
        message: "No listings available to search. The user should use the Scout feature to find listings first.",
        results: [],
      });
    }

    // Filter listings based on criteria
    let filtered = listings.filter((listing: any) => {
      if (minPrice !== undefined && listing.price < minPrice) return false;
      if (maxPrice !== undefined && listing.price > maxPrice) return false;
      if (city && !listing.city?.toLowerCase().includes(city.toLowerCase())) return false;
      if (minBeds !== undefined && listing.beds < minBeds) return false;
      if (maxBeds !== undefined && listing.beds > maxBeds) return false;
      return true;
    });

    // Sort if requested
    if (sortBy) {
      filtered.sort((a: any, b: any) => {
        const aVal = a[sortBy] ?? 0;
        const bVal = b[sortBy] ?? 0;
        return aVal - bVal;
      });
    }

    // Return top 10 results
    const results = filtered.slice(0, 10);

    return JSON.stringify({
      success: true,
      message: `Found ${filtered.length} listings matching criteria. Showing top ${results.length} results.`,
      totalMatches: filtered.length,
      results: results.map((l: any) => ({
        id: l.id,
        address: l.address,
        city: l.city,
        price: l.price,
        beds: l.beds,
        baths: l.baths,
        sqft: l.sqft,
        pricePerSqft: l.sqft > 0 ? (l.price / l.sqft).toFixed(2) : null,
        link: l.link,
        scamScore: l.scamScore,
      })),
    });
  },
});
