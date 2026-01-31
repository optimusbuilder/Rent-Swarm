/**
 * Simple text similarity matching for RAG
 * Uses keyword matching and text overlap to find relevant legal clauses
 */

import { LegalSection, getJurisdictionForSection } from './legal-references';

interface MatchResult {
  section: LegalSection;
  sectionJurisdiction: string; // The jurisdiction this legal section belongs to
  score: number;
  confidence: 'high' | 'medium' | 'low';
  matchedKeywords: string[];
  matchedText: string;
  excerptRelevant: boolean; // Whether the excerpt actually supports the violation claim
}

/**
 * Calculate enhanced similarity score between lease text and legal section
 * Uses multiple matching strategies for better accuracy
 */
function calculateSimilarity(
  leaseText: string,
  section: LegalSection
): number {
  const leaseLower = leaseText.toLowerCase();
  let score = 0;
  const matchedKeywords: string[] = [];

  // Strategy 1: Check for violation examples (highest weight - exact phrases)
  // More conservative: only exact or very close matches, and exclude legal requirement descriptions
  for (const example of section.violation_examples) {
    const exampleLower = example.toLowerCase();
    
    // Skip if this is clearly describing legal requirements, not a lease violation
    // For automatic renewal, exclude phrases that describe what "must" be done (legal requirements)
    if (section.id === 'automatic-renewal') {
      const requirementPhrases = [
        'must be separate', 'must be signed', 'must be acknowledged', 
        'prohibited by law', 'required by law', 'an automatic renewal term',
        'automatic renewal term in a lease must', 'must:', 'ending tenancy'
      ];
      if (requirementPhrases.some(phrase => leaseLower.includes(phrase))) {
        continue; // Skip - this is describing the law, not a violation
      }
      
      // Also skip if it's just mentioning "automatic renewal" without implementing it
      // Must have implementation language like "shall automatically renew" or "will renew"
      if (leaseLower.includes('automatic renewal') && 
          !leaseLower.includes('shall automatically') && 
          !leaseLower.includes('will automatically') &&
          !leaseLower.includes('renews automatically') &&
          !leaseLower.includes('lease will renew')) {
        // If it has "must" or "required" context, it's describing requirements, not implementing
        if (leaseLower.includes('must') || leaseLower.includes('required') || 
            leaseLower.includes('prohibited')) {
          continue; // Skip - just describing requirements
        }
      }
    }
    
    // Exact match gets highest score
    if (leaseLower.includes(exampleLower)) {
      score += 15;
      matchedKeywords.push(example);
    } else {
      // Partial match - but be more strict (require 80%+ of words)
      const exampleWords = exampleLower.split(/\s+/).filter(w => w.length > 3);
      const matchingWords = exampleWords.filter(word => leaseLower.includes(word));
      // Only count if most words match (reduces false positives)
      if (matchingWords.length >= Math.ceil(exampleWords.length * 0.8)) {
        score += 8; // Reduced from 10
        matchedKeywords.push(example);
      }
    }
  }

  // Strategy 2: Check for keywords with context (medium-high weight)
  // More conservative: reduce weights slightly and filter ambiguous words
  for (const keyword of section.keywords) {
    const keywordLower = keyword.toLowerCase();
    
    // Skip ambiguous single words that cause false positives
    // "refund" alone is too ambiguous - could be application fee refund, pet fee refund, etc.
    if (section.id === 'security-deposit' && keywordLower === 'refund' && 
        !leaseLower.includes('deposit') && !leaseLower.includes('security')) {
      continue; // Skip standalone "refund" unless deposit context exists
    }
    
    // "fee" alone is too ambiguous - could be application fee, pet fee, etc.
    if (section.id === 'security-deposit' && keywordLower === 'fee' && 
        !leaseLower.includes('deposit') && !leaseLower.includes('security')) {
      continue; // Skip standalone "fee" unless deposit context exists
    }
    
    if (leaseLower.includes(keywordLower)) {
      // Multi-word keywords get higher weight
      const keywordWords = keywordLower.split(/\s+/);
      if (keywordWords.length > 1) {
        score += 4; // Phrase match (reduced from 5)
      } else {
        score += 2; // Single word match (reduced from 3)
      }
      
      if (!matchedKeywords.includes(keyword)) {
        matchedKeywords.push(keyword);
      }
    }
  }

  // Strategy 3: Semantic matching - check for related concepts
  // For security deposits, look for actual violation patterns (not just "non-refundable")
  if (section.id === 'security-deposit') {
    // Look for discretion/withholding language (actual violations)
    const discretionIndicators = ['at discretion', 'landlord may withhold', 'withheld at', 
                                  'administrative costs', 'other expenses', 'unilateral',
                                  'without itemization', 'no itemized'];
    for (const indicator of discretionIndicators) {
      if (leaseLower.includes(indicator)) {
        score += 10; // Higher weight for actual violation language
      }
    }
    
    // Look for amount issues
    const amountIndicators = ['exceeds one month', 'exceeds rent', 'more than one month'];
    for (const indicator of amountIndicators) {
      if (leaseLower.includes(indicator)) {
        score += 8;
      }
    }
    
    // Only flag "non-refundable" if it's actually in the text
    if (leaseLower.includes('non-refundable') || leaseLower.includes('not refundable')) {
      score += 12; // High weight if actually non-refundable
    }
  }

  // Strategy 4: Text overlap with important legal terms (lower weight)
  // Exclude "notice" from general overlap - too ambiguous without context
  const importantTerms = ['required', 'must', 'shall', 'prohibited', 'illegal', 
                          'violation', 'refund', 'deposit', 'entry', 'renewal'];
  // Only include "notice" if we're looking at entry-notice AND entry context exists
  if (section.id === 'entry-notice' && (leaseLower.includes('enter') || leaseLower.includes('entry') || leaseLower.includes('access'))) {
    importantTerms.push('notice');
  }
  const sectionWords = section.text.toLowerCase().split(/\s+/);
  const leaseWords = leaseLower.split(/\s+/);
  const commonImportantTerms = importantTerms.filter((term) =>
    sectionWords.includes(term) && leaseWords.includes(term)
  );
  score += commonImportantTerms.length * 1;

  // Strategy 5: Context window matching - check if keywords appear near each other
  // More conservative: require more keywords for bonus
  const keywordsInText = section.keywords.filter(k => leaseLower.includes(k.toLowerCase()));
  if (keywordsInText.length >= 3) {
    // Multiple keywords found = stronger match (but require 3+ now)
    score += (keywordsInText.length - 2) * 1; // Reduced bonus
  }

  return score;
}

/**
 * Check if excerpt is actually relevant to the violation type
 * Prevents false positives (e.g., entry clause flagged as habitability issue)
 */
function isExcerptRelevant(leaseChunk: string, section: LegalSection): boolean {
  const chunkLower = leaseChunk.toLowerCase();
  
  // For habitability, require actual habitability-related terms in the excerpt
  if (section.id === 'habitability') {
    const requiredTerms = ['repair', 'maintenance', 'habitability', 'heat', 'plumbing', 
                          'electricity', 'code', 'condition', 'tenant responsible', 
                          'landlord disclaims', 'waive', 'essential'];
    const hasRelevantTerm = requiredTerms.some(term => chunkLower.includes(term));
    
    // Also check if it mentions shifting responsibility
    const responsibilityShift = chunkLower.includes('tenant responsible') || 
                                chunkLower.includes('tenant shall') ||
                                chunkLower.includes('tenant pays');
    
    return hasRelevantTerm || responsibilityShift;
  }
  
  // For entry notice, require entry-related terms AND exclude false positives
  if (section.id === 'entry-notice') {
    // Must have entry/access related terms
    const requiredTerms = ['enter', 'entry', 'access', 'premises', 'unit', 'inspection', 'repair', 'showing'];
    const hasEntryTerm = requiredTerms.some(term => chunkLower.includes(term));
    
    // Exclude false positives - if it mentions termination, renewal, or other unrelated topics
    const exclusionTerms = ['termination', 'renewal', 'early termination', 'lease termination', 
                           'default', 'fee', 'payment', 'rent', 'deposit'];
    const hasExclusionTerm = exclusionTerms.some(term => chunkLower.includes(term));
    
    // Only relevant if it has entry terms AND doesn't have exclusion terms
    // Exception: if it clearly mentions "entry" or "enter" even with other terms
    if (chunkLower.includes('enter') || chunkLower.includes('entry')) {
      return true; // "enter" or "entry" is definitive
    }
    
    return hasEntryTerm && !hasExclusionTerm;
  }
  
  // For security deposit, require deposit-related terms AND exclude false positives
  if (section.id === 'security-deposit') {
    // Must have actual deposit-related terms
    const requiredTerms = ['security deposit', 'deposit', 'withhold', 'discretion', 'administrative', 
                          'itemized', 'deduction', 'escrow', 'exceeds', 'one month', 'refund'];
    const hasDepositTerm = requiredTerms.some(term => chunkLower.includes(term));
    
    // Exclude false positives - application fees, pet fees, etc. are NOT security deposits
    const exclusionTerms = ['application fee', 'pet fee', 'pet policy', 'application', 'pet', 
                           'breed restriction', 'weight restriction', 'number of pets'];
    const hasExclusionTerm = exclusionTerms.some(term => chunkLower.includes(term));
    
    // "fee" alone is too ambiguous - could be application fee, pet fee, etc.
    // Only count if it's clearly about deposits
    if (chunkLower.includes('fee') && !chunkLower.includes('deposit') && !chunkLower.includes('security')) {
      return false; // "fee" without "deposit" context is not relevant
    }
    
    // Only relevant if it has deposit terms AND doesn't have exclusion terms
    return hasDepositTerm && !hasExclusionTerm;
  }
  
  // For automatic renewal, require renewal-related terms AND exclude legal requirement descriptions
  if (section.id === 'automatic-renewal') {
    // Must have renewal-related terms
    const requiredTerms = ['renewal', 'renew', 'automatic', 'extend', 'extension'];
    const hasRenewalTerm = requiredTerms.some(term => chunkLower.includes(term));
    
    if (!hasRenewalTerm) {
      return false;
    }
    
    // Exclude if it's just describing/mentioning automatic renewal requirements, not implementing it
    // Phrases that indicate it's describing the law, not a lease clause:
    const exclusionPhrases = [
      'must be separate', 'must be signed', 'must be acknowledged', 
      'prohibited by law', 'required by law', 'maryland code', 
      'dc code', 'tenant bill of rights', 'legal requirement',
      'an automatic renewal term', 'automatic renewal term in a lease must',
      'must:', 'must be', 'required to', 'shall be', 'prohibited',
      'ending tenancy', 'for the landlord to end'
    ];
    const hasExclusionPhrase = exclusionPhrases.some(phrase => chunkLower.includes(phrase));
    
    // If it's describing requirements or just mentioning automatic renewal, exclude it
    if (hasExclusionPhrase) {
      return false;
    }
    
    // Must have actual implementation language - the lease is actually doing automatic renewal
    // Not just describing what automatic renewal "must" be
    const implementationIndicators = [
      'shall automatically renew', 'will automatically renew', 'automatically renews',
      'lease will renew', 'agreement will renew', 'renews automatically',
      'automatic renewal of this lease', 'this lease shall renew',
      'tenant agrees to automatic renewal', 'landlord may renew'
    ];
    const hasImplementationLanguage = implementationIndicators.some(ind => chunkLower.includes(ind));
    
    // If it mentions "automatic renewal" but is just describing requirements, exclude
    // Only flag if it's actually implementing automatic renewal
    if (!hasImplementationLanguage && chunkLower.includes('automatic renewal')) {
      // Check if it's in the context of describing requirements
      if (chunkLower.includes('must') || chunkLower.includes('required') || 
          chunkLower.includes('prohibited') || chunkLower.includes('code')) {
        return false; // Just describing the law, not implementing it
      }
    }
    
    // Only relevant if it's actually implementing automatic renewal, not just mentioning it
    return hasImplementationLanguage || (hasRenewalTerm && !hasExclusionPhrase);
  }
  
  // Default: require at least one violation example or keyword match
  const hasViolationExample = section.violation_examples.some(example =>
    chunkLower.includes(example.toLowerCase())
  );
  const hasKeyword = section.keywords.some(keyword =>
    chunkLower.includes(keyword.toLowerCase())
  );
  
  return hasViolationExample || hasKeyword;
}

/**
 * Determine confidence level based on score and relevance
 * More conservative thresholds to reduce false positives
 */
function calculateConfidence(score: number, excerptRelevant: boolean): 'high' | 'medium' | 'low' {
  // Must have relevant excerpt to have any confidence
  if (!excerptRelevant) {
    return 'low';
  }
  
  // Higher thresholds for confidence levels
  if (score >= 18) {
    return 'high'; // Only very strong matches
  } else if (score >= 12) {
    return 'medium'; // Good matches
  } else {
    return 'low'; // Weak matches - will be filtered out
  }
}

/**
 * Find relevant legal sections for a given lease text chunk
 * Now with confidence scoring and relevance checking
 */
export function findRelevantLegalSections(
  leaseChunk: string,
  legalSections: LegalSection[],
  threshold: number = 5
): MatchResult[] {
  const results: MatchResult[] = [];

  for (const section of legalSections) {
    const score = calculateSimilarity(leaseChunk, section);
    if (score >= threshold) {
      const excerptRelevant = isExcerptRelevant(leaseChunk, section);
      const confidence = calculateConfidence(score, excerptRelevant);
      
      // More conservative: only include if excerpt is relevant AND confidence is medium or high
      // This prevents false positives - no more "high confidence but irrelevant excerpt"
      if (excerptRelevant && (confidence === 'high' || confidence === 'medium')) {
        const matchedKeywords = section.keywords.filter((keyword) =>
          leaseChunk.toLowerCase().includes(keyword.toLowerCase())
        );
        const matchedExamples = section.violation_examples.filter((example) =>
          leaseChunk.toLowerCase().includes(example.toLowerCase())
        );

        // Get the actual jurisdiction for this legal section
        const sectionJurisdiction = getJurisdictionForSection(section.id) || 'Unknown';
        
        results.push({
          section,
          sectionJurisdiction,
          score,
          confidence,
          matchedKeywords: [...matchedKeywords, ...matchedExamples],
          matchedText: leaseChunk,
          excerptRelevant,
        });
      }
    }
  }

  // Sort by score descending, then by confidence
  return results.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    const confidenceOrder = { high: 3, medium: 2, low: 1 };
    return confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
  });
}

/**
 * Chunk lease text into sentences/paragraphs for analysis
 * Uses overlapping windows to capture context better
 */
export function chunkLeaseText(text: string, maxChunkSize: number = 500, overlap: number = 100): string[] {
  // Split by paragraphs first
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

  const chunks: string[] = [];

  for (const paragraph of paragraphs) {
    if (paragraph.length <= maxChunkSize) {
      chunks.push(paragraph.trim());
    } else {
      // Split long paragraphs by sentences with overlap
      const sentences = paragraph.split(/[.!?]+\s+/).filter((s) => s.trim().length > 0);
      let currentChunk = '';
      let lastChunkEnd = '';

      for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i].trim();
        
        if ((currentChunk + sentence).length <= maxChunkSize) {
          currentChunk += (currentChunk ? ' ' : '') + sentence;
        } else {
          if (currentChunk) {
            chunks.push(currentChunk);
            // Keep last part for overlap
            const words = currentChunk.split(/\s+/);
            lastChunkEnd = words.slice(-Math.floor(overlap / 10)).join(' ');
          }
          // Start new chunk with overlap from previous
          currentChunk = (lastChunkEnd ? lastChunkEnd + ' ' : '') + sentence;
          lastChunkEnd = '';
        }
      }

      if (currentChunk) {
        chunks.push(currentChunk);
      }
    }
  }

  // Also create sliding windows for better coverage
  // This helps catch violations that span paragraph boundaries
  const slidingWindows: string[] = [];
  for (let i = 0; i < chunks.length - 1; i++) {
    const combined = chunks[i] + ' ' + chunks[i + 1];
    if (combined.length <= maxChunkSize * 1.5) {
      slidingWindows.push(combined.substring(0, maxChunkSize));
    }
  }

  // Combine original chunks with sliding windows, removing duplicates
  const allChunks = [...chunks, ...slidingWindows];
  const uniqueChunks = Array.from(new Set(allChunks.map(c => c.trim().toLowerCase())))
    .map(lower => allChunks.find(c => c.trim().toLowerCase() === lower)!);

  return uniqueChunks.filter(c => c && c.length > 20); // Filter out very short chunks
}

