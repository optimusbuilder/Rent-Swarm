import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { getAllLegalSections } from "@/lib/rag/legal-references";

export const leaseAnalyzerTool = new DynamicStructuredTool({
  name: "analyze_lease_clauses",
  description: "Query lease analysis results and provide information about lease red flags, tenant rights, and legal compliance. Use this when the user asks about lease terms, red flags, or legal advice. IMPORTANT: Set provideAdvice=true when giving specific legal recommendations (requires user confirmation).",
  schema: z.object({
    query: z.string().describe("The user's question about lease terms or tenant rights"),
    jurisdiction: z.string().optional().describe("City/state for jurisdiction-specific laws (e.g., 'Austin, Texas', 'Seattle, Washington')"),
    provideAdvice: z.boolean().optional().describe("Set to true when providing specific legal advice or recommendations (triggers human-in-the-loop confirmation)"),
  }),
  func: async (input, config) => {
    const { query, jurisdiction, provideAdvice } = input;

    // HUMAN-IN-THE-LOOP: If providing legal advice, require user confirmation
    if (provideAdvice === true) {
      return JSON.stringify({
        requiresConfirmation: true,
        action: "provide_legal_advice",
        reason: "Providing specific legal advice about lease clauses requires explicit user confirmation to ensure you understand this is informational guidance, not professional legal counsel.",
        data: { query, jurisdiction },
      });
    }

    // Get legal references for the jurisdiction
    const legalSections = getAllLegalSections(jurisdiction);

    // Search for relevant legal sections based on query
    const queryLower = query.toLowerCase();
    const relevantSections = legalSections.filter((section) => {
      // Match by keywords or ID
      const keywordMatch = section.keywords.some((keyword) =>
        queryLower.includes(keyword.toLowerCase())
      );
      const idMatch = queryLower.includes(section.id.replace(/-/g, " "));
      const titleMatch = queryLower.includes(section.title.toLowerCase());

      return keywordMatch || idMatch || titleMatch;
    });

    // Common lease topics mapping
    const topicMapping: any = {
      "security deposit": "security-deposit",
      "pet": "pet-deposits",
      "fees": "security-deposit",
      "eviction": "eviction-protections",
      "notice": "eviction-protections",
      "repair": "habitability",
      "maintenance": "habitability",
      "habitability": "habitability",
      "discrimination": "discrimination",
      "retaliation": "retaliation",
      "privacy": "entry-rights",
      "entry": "entry-rights",
    };

    // If no direct matches, try topic mapping
    if (relevantSections.length === 0) {
      for (const [topic, sectionId] of Object.entries(topicMapping)) {
        if (queryLower.includes(topic)) {
          const topicSection = legalSections.find((s) => s.id === sectionId);
          if (topicSection) {
            relevantSections.push(topicSection);
          }
        }
      }
    }

    if (relevantSections.length === 0) {
      return JSON.stringify({
        success: false,
        message: `No specific legal information found for "${query}". ${
          jurisdiction
            ? `Legal references for ${jurisdiction} are available.`
            : "Try specifying a jurisdiction for more specific guidance."
        } For detailed legal analysis, set provideAdvice=true (requires confirmation).`,
        sections: [],
        availableTopics: [
          "Security deposits",
          "Eviction protections",
          "Habitability requirements",
          "Pet deposits and fees",
          "Discrimination protections",
          "Entry and privacy rights",
          "Retaliation protections",
        ],
      });
    }

    // Return relevant legal information
    return JSON.stringify({
      success: true,
      message: `Found ${relevantSections.length} relevant legal reference(s) for "${query}"${
        jurisdiction ? ` in ${jurisdiction}` : ""
      }`,
      query,
      jurisdiction: jurisdiction || "General",
      sections: relevantSections.slice(0, 3).map((s) => ({
        id: s.id,
        title: s.title,
        text: s.text,
        jurisdiction: s.jurisdiction || jurisdiction || "General",
        violationExamples: s.violation_examples || [],
      })),
      disclaimer:
        "This information is for educational purposes only and does not constitute legal advice. Consult with a qualified attorney for specific legal guidance.",
      needsAdvice: relevantSections.length > 0
        ? "For specific recommendations about your situation, invoke this tool again with provideAdvice=true"
        : null,
    });
  },
});
