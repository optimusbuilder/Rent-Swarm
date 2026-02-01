import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

export const marketInsightsTool = new DynamicStructuredTool({
  name: "get_market_insights",
  description: "Get market insights, average rent trends, and neighborhood data for a specific city or area. Use this when the user asks about market conditions, rent trends, or neighborhood information.",
  schema: z.object({
    city: z.string().describe("City name (e.g., 'Austin', 'San Francisco', 'Seattle')"),
    neighborhood: z.string().optional().describe("Specific neighborhood or area within the city (optional)"),
  }),
  func: async (input, config) => {
    const { city, neighborhood } = input;

    // Get listings from context to calculate real market data
    const listings = config?.metadata?.listings || [];
    const bookmarks = config?.metadata?.bookmarks || [];

    // Filter listings for the specified city
    const cityListings = listings.filter((l: any) =>
      l.city?.toLowerCase().includes(city.toLowerCase())
    );

    if (cityListings.length === 0) {
      return JSON.stringify({
        success: false,
        message: `No listing data available for ${city}. Use the Scout feature to search for listings in this area first.`,
        insights: null,
      });
    }

    // Calculate market statistics
    const prices = cityListings.map((l: any) => l.price).filter((p: number) => p > 0);
    const sqfts = cityListings.map((l: any) => l.sqft).filter((s: number) => s > 0);
    const pricesPerSqft = cityListings
      .filter((l: any) => l.sqft > 0)
      .map((l: any) => l.price / l.sqft);

    const avgPrice = prices.length > 0 ? prices.reduce((a: number, b: number) => a + b, 0) / prices.length : 0;
    const medianPrice = prices.length > 0 ? prices.sort((a, b) => a - b)[Math.floor(prices.length / 2)] : 0;
    const avgPricePerSqft = pricesPerSqft.length > 0
      ? pricesPerSqft.reduce((a, b) => a + b, 0) / pricesPerSqft.length
      : 0;

    // Bed count distribution
    const bedCounts: any = {};
    cityListings.forEach((l: any) => {
      const beds = l.beds || 0;
      bedCounts[beds] = (bedCounts[beds] || 0) + 1;
    });

    // Neighborhood filtering
    let neighborhoodData = null;
    if (neighborhood) {
      const neighborhoodListings = cityListings.filter((l: any) =>
        l.address?.toLowerCase().includes(neighborhood.toLowerCase()) ||
        l.city?.toLowerCase().includes(neighborhood.toLowerCase())
      );

      if (neighborhoodListings.length > 0) {
        const neighborhoodPrices = neighborhoodListings.map((l: any) => l.price);
        const neighborhoodAvg = neighborhoodPrices.reduce((a: number, b: number) => a + b, 0) / neighborhoodPrices.length;

        neighborhoodData = {
          neighborhood,
          listings: neighborhoodListings.length,
          avgPrice: Math.round(neighborhoodAvg),
          priceRange: {
            min: Math.min(...neighborhoodPrices),
            max: Math.max(...neighborhoodPrices),
          },
        };
      }
    }

    return JSON.stringify({
      success: true,
      city,
      neighborhood: neighborhood || null,
      insights: {
        totalListings: cityListings.length,
        avgPrice: Math.round(avgPrice),
        medianPrice: Math.round(medianPrice),
        avgPricePerSqft: avgPricePerSqft.toFixed(2),
        priceRange: {
          min: Math.min(...prices),
          max: Math.max(...prices),
        },
        bedCountDistribution: bedCounts,
        neighborhoodData,
      },
      message: neighborhood && !neighborhoodData
        ? `Found data for ${city} but no specific listings for ${neighborhood} neighborhood`
        : `Market insights for ${city}${neighborhood ? ` - ${neighborhood}` : ""} based on ${cityListings.length} listing(s)`,
    });
  },
});
