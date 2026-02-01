import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

export const priceCalculatorTool = new DynamicStructuredTool({
  name: "calculate_price_metrics",
  description: "Calculate price per square foot, affordability ratios, and compare listings. Use this when the user asks about affordability, price comparisons, or which listing has the best value.",
  schema: z.object({
    listingIds: z.array(z.string()).optional().describe("Specific listing IDs to analyze (if empty, analyzes all bookmarks)"),
    monthlyIncome: z.number().optional().describe("User's monthly income in dollars (for affordability calculation using 30% rule)"),
  }),
  func: async (input, config) => {
    const { listingIds, monthlyIncome } = input;

    // Get listings and bookmarks from context
    const listings = config?.metadata?.listings || [];
    const bookmarks = config?.metadata?.bookmarks || [];

    // Determine which listings to analyze
    let targetListings: any[] = [];

    if (listingIds && listingIds.length > 0) {
      // Find specific listings by ID
      targetListings = listings.filter((l: any) =>
        listingIds.includes(String(l.id)) || listingIds.includes(l.id)
      );
    } else if (bookmarks.length > 0) {
      // Use bookmarks if no specific IDs provided
      targetListings = bookmarks;
    } else if (listings.length > 0) {
      // Fall back to recent search results
      targetListings = listings.slice(0, 5);
    }

    if (targetListings.length === 0) {
      return JSON.stringify({
        success: false,
        message: "No listings to analyze. Please provide listing IDs, save some bookmarks, or search for listings first.",
        metrics: [],
      });
    }

    // Calculate metrics for each listing
    const metrics = targetListings.map((listing: any) => {
      const pricePerSqft = listing.sqft > 0 ? listing.price / listing.sqft : 0;

      let affordability: any = null;
      if (monthlyIncome && monthlyIncome > 0) {
        const maxAffordableRent = monthlyIncome * 0.3; // 30% rule
        const affordabilityRatio = (listing.price / monthlyIncome) * 100; // What % of income
        const isAffordable = listing.price <= maxAffordableRent;

        affordability = {
          maxAffordableRent: Math.round(maxAffordableRent),
          affordabilityRatio: affordabilityRatio.toFixed(1) + "%",
          isAffordable,
          explanation: isAffordable
            ? `This listing is affordable (${affordabilityRatio.toFixed(1)}% of income, under the recommended 30%)`
            : `This listing exceeds the 30% rule (${affordabilityRatio.toFixed(1)}% of income)`,
        };
      }

      return {
        id: listing.id,
        address: listing.address,
        city: listing.city,
        price: listing.price,
        sqft: listing.sqft,
        pricePerSqft: pricePerSqft.toFixed(2),
        affordability,
      };
    });

    // Find best value (lowest price per sqft)
    const validMetrics = metrics.filter((m: any) => m.sqft > 0);
    const bestValue = validMetrics.length > 0
      ? validMetrics.reduce((best: any, current: any) =>
          parseFloat(current.pricePerSqft) < parseFloat(best.pricePerSqft) ? current : best
        )
      : null;

    return JSON.stringify({
      success: true,
      message: `Analyzed ${metrics.length} listing(s)`,
      metrics,
      bestValue: bestValue ? {
        address: bestValue.address,
        pricePerSqft: bestValue.pricePerSqft,
        price: bestValue.price,
        sqft: bestValue.sqft,
      } : null,
      summary: monthlyIncome
        ? {
            maxAffordableRent: Math.round(monthlyIncome * 0.3),
            affordableListings: metrics.filter((m: any) => m.affordability?.isAffordable).length,
            totalAnalyzed: metrics.length,
          }
        : null,
    });
  },
});
