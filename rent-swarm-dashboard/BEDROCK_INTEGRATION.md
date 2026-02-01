# AWS Bedrock Knowledge Base Integration

## Overview

The Rent-Swarm chat agent now integrates with AWS Bedrock Knowledge Bases to provide AI-powered lease analysis using your S3-based PDF knowledge base. The integration uses Amazon Titan Embeddings for semantic search and retrieval.

## Architecture

```
User Query → Chat Agent → Lease Analyzer Tool → Bedrock Knowledge Base (S3 PDFs)
                                              ↓
                                         Titan Embeddings
                                              ↓
                                      Retrieve Top 3-5 Docs
                                              ↓
                                      Format Context for LLM
                                              ↓
                                   Gemini 2.0 Flash + Context
                                              ↓
                                      Enhanced Response
```

## Files Created/Modified

### New Files

1. **`lib/rag/bedrock-retriever.ts`** - AWS Bedrock Knowledge Base retriever
   - `BedrockKnowledgeBaseRetriever` class
   - Methods: `retrieve()`, `retrieveLegalInfo()`, `formatContext()`
   - Uses AWS SDK v3 for Bedrock Agent Runtime

### Modified Files

1. **`lib/tools/lease-analyzer.ts`** - Enhanced with Bedrock retrieval
   - Tries Bedrock first (if configured)
   - Falls back to local legal references
   - Combines both sources in response

2. **`.env`** - Added AWS credentials
   - `AWS_REGION`
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `BEDROCK_KNOWLEDGE_BASE_ID`

3. **`package.json`** - Added dependencies
   - `@aws-sdk/client-bedrock-agent-runtime`
   - `@aws-sdk/client-bedrock-runtime`

## Setup Instructions

### 1. Get Your AWS Credentials

You mentioned you already have these, but here's where to find them:

#### AWS Access Keys
1. Go to AWS Console → IAM → Users → [Your User]
2. Security credentials tab → Create access key
3. Copy `Access Key ID` and `Secret Access Key`

#### Bedrock Knowledge Base ID
1. Go to AWS Console → Amazon Bedrock → Knowledge bases
2. Find your S3-based knowledge base
3. Copy the Knowledge base ID (format: `XXXXXXXXXX`)

#### AWS Region
- Use the region where your knowledge base is deployed (e.g., `us-east-1`, `us-west-2`)

### 2. Update `.env` File

Replace the placeholder values in `.env`:

```env
# AWS Bedrock (for RAG knowledge base retrieval)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
BEDROCK_KNOWLEDGE_BASE_ID=ABCDEFGHIJ
```

### 3. Restart Your Dev Server

```bash
# Stop your current dev server (Ctrl+C)
npm run dev
```

## How It Works

### Retrieval Flow

1. **User asks about lease clauses** via chat:
   ```
   User: "What should I watch out for in security deposit clauses?"
   ```

2. **Chat Agent calls `analyze_lease_clauses` tool** with the query

3. **Bedrock Retrieval happens automatically**:
   - Query: "Legal requirements and red flags for security deposit clauses..."
   - Bedrock searches your S3 PDFs using Titan embeddings
   - Returns top 3-5 most relevant document chunks
   - Each result includes content, relevance score, and S3 source

4. **Response combines both sources**:
   - Bedrock knowledge base documents (your PDFs)
   - Local legal references (existing system)
   - Formatted context is sent to Gemini for final answer

### Example Response Structure

```json
{
  "success": true,
  "message": "Found 2 source(s) of legal information (including 3 documents from knowledge base)",
  "query": "security deposit red flags",
  "jurisdiction": "Austin, Texas",
  "bedrockContext": "### Retrieved Legal Knowledge:\n\n#### Document 1 (Relevance: 85.3%)\n[Content from your PDF]...",
  "bedrockDocumentCount": 3,
  "sections": [...local legal references...],
  "disclaimer": "..."
}
```

## Configuration Options

### Retrieval Parameters

In `lib/rag/bedrock-retriever.ts`, you can adjust:

```typescript
// Number of documents to retrieve (default: 5)
const result = await retriever.retrieve(query, 5);

// Search type (default: HYBRID - semantic + keyword)
overrideSearchType: "HYBRID"
// Options: "HYBRID", "SEMANTIC", "NONE"
```

### Cost Optimization

- Bedrock charges per query and per token retrieved
- Default: 5 documents per query (adjust based on your budget)
- Consider caching frequently asked questions

## Testing

### Test 1: Basic Retrieval

Ask the chat agent:
```
"What are red flags in security deposit clauses?"
```

Expected behavior:
- Tool calls `analyze_lease_clauses`
- Bedrock retrieves relevant PDFs from S3
- Response includes both Bedrock context and local references

### Test 2: Jurisdiction-Specific

Ask:
```
"Tell me about eviction rules in Austin, Texas"
```

Expected behavior:
- Bedrock query includes "Austin, Texas" context
- Returns jurisdiction-specific documents

### Test 3: Fallback

1. Temporarily remove `BEDROCK_KNOWLEDGE_BASE_ID` from `.env`
2. Restart server
3. Ask same question

Expected behavior:
- Falls back to local legal references
- No Bedrock context in response
- Tool still works

## Troubleshooting

### Error: "BEDROCK_KNOWLEDGE_BASE_ID is required"

**Cause**: Missing environment variable

**Fix**: Add `BEDROCK_KNOWLEDGE_BASE_ID` to `.env` file

---

### Error: "Failed to retrieve from Bedrock knowledge base"

**Possible causes**:
1. Invalid AWS credentials
2. Wrong region
3. Knowledge base ID doesn't exist
4. IAM permissions issue

**Debug steps**:
```bash
# Check if credentials are loaded
console.log('AWS Region:', process.env.AWS_REGION);
console.log('KB ID:', process.env.BEDROCK_KNOWLEDGE_BASE_ID);
```

**Required IAM permissions**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:Retrieve"
      ],
      "Resource": "*"
    }
  ]
}
```

---

### No Bedrock results returned

**Possible causes**:
1. Knowledge base is empty
2. Query doesn't match any documents
3. Similarity threshold too high

**Fix**: Check your S3 bucket has PDFs ingested into the knowledge base

---

### Response doesn't include Bedrock context

**Check**:
1. Look for `bedrockDocumentCount` in tool response
2. If 0, Bedrock didn't find relevant docs
3. If null, Bedrock wasn't called (check credentials)

## Advanced Usage

### Custom Retrieval Queries

Modify `lib/tools/lease-analyzer.ts` to use specialized queries:

```typescript
// Instead of direct retrieval
const result = await retriever.retrieve(query, 3);

// Use specialized legal query builder
const result = await retriever.retrieveLegalInfo(
  "security deposit",
  jurisdiction
);
```

### Multi-Source Fusion

Current implementation combines:
- Bedrock knowledge base (your PDFs)
- Local legal references (hardcoded)

Future enhancement: Use Bedrock for all sources and remove local references.

## Monitoring

### LangSmith Tracing

If you have LangSmith enabled (`.env`):
```env
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=your_langsmith_key
```

You'll see:
- Tool invocations
- Bedrock retrieval latency
- Retrieved document content
- Final LLM responses

### Cost Tracking

Track Bedrock usage in AWS CloudWatch:
- Queries per day
- Tokens retrieved
- Estimated cost

## Next Steps

1. ✅ Set up AWS credentials in `.env`
2. ✅ Test with a sample query
3. 🔄 Monitor retrieval quality
4. 🔄 Adjust retrieval parameters based on results
5. 🔄 Consider adding more PDFs to S3 knowledge base

## Production Deployment

Before deploying to EC2:

1. **Use AWS IAM roles instead of access keys**:
   - Attach IAM role to EC2 instance
   - Remove `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` from `.env`
   - SDK will automatically use instance role

2. **Enable CloudWatch logging**:
   ```typescript
   console.error('Bedrock retrieval error:', error);
   // Send to CloudWatch Logs
   ```

3. **Set up alerting**:
   - Alert on failed Bedrock queries
   - Monitor retrieval latency
   - Track costs

## Summary

Your Rent-Swarm chat agent now uses AWS Bedrock to retrieve relevant legal information from your S3-based PDF knowledge base. The integration:

- ✅ Uses Amazon Titan Embeddings for semantic search
- ✅ Retrieves top 3-5 most relevant documents
- ✅ Combines Bedrock results with local references
- ✅ Falls back gracefully if Bedrock is unavailable
- ✅ Works with existing LangChain/LangGraph architecture

Just add your AWS credentials to `.env` and test it out!
