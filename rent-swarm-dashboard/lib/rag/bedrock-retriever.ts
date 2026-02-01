import {
  BedrockAgentRuntimeClient,
  RetrieveCommand,
  RetrieveCommandInput,
} from "@aws-sdk/client-bedrock-agent-runtime";

/**
 * AWS Bedrock Knowledge Base Retriever
 * Retrieves relevant documents from a Bedrock knowledge base for lease analysis
 */

export interface BedrockDocument {
  content: string;
  score: number;
  metadata?: {
    source?: string;
    location?: {
      s3Location?: {
        uri: string;
      };
    };
  };
}

export interface RetrievalResult {
  documents: BedrockDocument[];
  query: string;
}

export class BedrockKnowledgeBaseRetriever {
  private client: BedrockAgentRuntimeClient;
  private knowledgeBaseId: string;

  constructor(knowledgeBaseId?: string, region?: string) {
    // Get configuration from environment variables
    this.knowledgeBaseId = knowledgeBaseId || process.env.BEDROCK_KNOWLEDGE_BASE_ID || '';
    const awsRegion = region || process.env.AWS_REGION || 'us-east-1';

    if (!this.knowledgeBaseId) {
      throw new Error('BEDROCK_KNOWLEDGE_BASE_ID is required but not set');
    }

    // Initialize Bedrock Agent Runtime client
    this.client = new BedrockAgentRuntimeClient({
      region: awsRegion,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }

  /**
   * Retrieve relevant documents from the knowledge base
   * @param query - The search query (e.g., "What are red flags in security deposit clauses?")
   * @param maxResults - Maximum number of results to return (default: 5)
   * @returns Array of relevant documents with content and scores
   */
  async retrieve(query: string, maxResults: number = 5): Promise<RetrievalResult> {
    try {
      const input: RetrieveCommandInput = {
        knowledgeBaseId: this.knowledgeBaseId,
        retrievalQuery: {
          text: query,
        },
        retrievalConfiguration: {
          vectorSearchConfiguration: {
            numberOfResults: maxResults,
            overrideSearchType: "HYBRID", // Use both semantic and keyword search
          },
        },
      };

      const command = new RetrieveCommand(input);
      const response = await this.client.send(command);

      // Extract documents from response
      const documents: BedrockDocument[] = (response.retrievalResults || []).map((result) => ({
        content: result.content?.text || '',
        score: result.score || 0,
        metadata: {
          source: result.location?.s3Location?.uri,
          location: result.location,
        },
      }));

      // Sort by score (highest first)
      documents.sort((a, b) => b.score - a.score);

      return {
        documents,
        query,
      };
    } catch (error) {
      console.error('Bedrock retrieval error:', error);
      throw new Error(`Failed to retrieve from Bedrock knowledge base: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Retrieve legal information about a specific lease clause type
   * @param clauseType - Type of clause (e.g., "security deposit", "habitability", "late fees")
   * @param jurisdiction - Optional jurisdiction filter (e.g., "Austin, Texas")
   * @returns Relevant legal information from the knowledge base
   */
  async retrieveLegalInfo(clauseType: string, jurisdiction?: string): Promise<RetrievalResult> {
    // Build a targeted query for the knowledge base
    let query = `Legal requirements and red flags for ${clauseType} clauses in lease agreements`;

    if (jurisdiction) {
      query += ` in ${jurisdiction}`;
    }

    query += `. What are the good practices and what should tenants watch out for?`;

    return this.retrieve(query, 5);
  }

  /**
   * Format retrieved documents into a context string for the LLM
   * @param documents - Retrieved documents from Bedrock
   * @returns Formatted context string
   */
  static formatContext(documents: BedrockDocument[]): string {
    if (documents.length === 0) {
      return 'No relevant information found in the knowledge base.';
    }

    let context = '### Retrieved Legal Knowledge:\n\n';

    documents.forEach((doc, index) => {
      const source = doc.metadata?.source
        ? `\n**Source:** ${doc.metadata.source.split('/').pop()}`
        : '';

      context += `#### Document ${index + 1} (Relevance: ${(doc.score * 100).toFixed(1)}%)\n`;
      context += `${doc.content}${source}\n\n`;
    });

    return context;
  }
}
