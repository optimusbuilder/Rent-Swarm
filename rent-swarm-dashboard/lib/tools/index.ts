// Export all tools for easy import by the agent
export { listingSearchTool } from "./listing-search";
export { priceCalculatorTool } from "./price-calculator";
export { bookmarkManagerTool } from "./bookmark-manager";
export { marketInsightsTool } from "./market-insights";
export { leaseAnalyzerTool } from "./lease-analyzer";

// Export as array for binding to LangChain model
import { listingSearchTool } from "./listing-search";
import { priceCalculatorTool } from "./price-calculator";
import { bookmarkManagerTool } from "./bookmark-manager";
import { marketInsightsTool } from "./market-insights";
import { leaseAnalyzerTool } from "./lease-analyzer";

export const tools = [
  listingSearchTool,
  priceCalculatorTool,
  bookmarkManagerTool,
  marketInsightsTool,
  leaseAnalyzerTool,
];
