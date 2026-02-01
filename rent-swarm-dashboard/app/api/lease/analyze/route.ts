import { NextRequest, NextResponse } from 'next/server';
// import { PDFParse } from 'pdf-parse';
import { getAllLegalSections } from '@/lib/rag/legal-references';
import { findRelevantLegalSections, chunkLeaseText } from '@/lib/rag/similarity';

// Set max duration for this route (handles large PDFs)
export const maxDuration = 60;
// Use Node.js runtime (not edge) for PDF parsing
export const runtime = 'nodejs';

// Enhanced risk detection with RAG
interface RiskFlag {
  type: string;
  excerpt: string;
  explanation: string;
  legalReference?: {
    title: string;
    text: string;
    jurisdiction: string;
  };
  severity: 'high' | 'warning' | 'info';
}

interface AnalysisResponse {
  summary: string;
  flags: RiskFlag[];
  disclaimer: string;
  jurisdiction?: string;
  extractedText?: string; // The actual extracted PDF text
}

// Risk detection rules
const RISK_PATTERNS = [
  {
    type: 'illegal_entry',
    pattern: /enter at any time/gi,
    explanation: 'Landlords are usually required to give notice before entering a unit.',
  },
  {
    type: 'auto_renewal',
    pattern: /automatic renewal/gi,
    explanation: 'Automatic renewal clauses can lock you into a lease without your explicit consent.',
  },
  {
    type: 'deposit_risk',
    pattern: /non-refundable deposit/gi,
    explanation: 'Non-refundable deposits may not be legally enforceable in many jurisdictions.',
  },
];

/**
 * Detect risks using RAG - compares lease text against legal references
 */
function detectRisksWithRAG(text: string, jurisdiction?: string): RiskFlag[] {
  const flags: RiskFlag[] = [];
  const legalSections = getAllLegalSections(jurisdiction);

  // Chunk the lease text for analysis
  const chunks = chunkLeaseText(text, 500);
  const processedSections = new Set<string>(); // Avoid duplicate flags for same legal section

  // Analyze each chunk against legal references
  for (const chunk of chunks) {
    // Higher threshold to reduce false positives - only flag clear violations
    const matches = findRelevantLegalSections(chunk, legalSections, 10); // Threshold of 10 (was 6)

    for (const match of matches) {
      // Skip if we've already flagged this section
      if (processedSections.has(match.section.id)) {
        continue;
      }

      // Determine severity based on score AND confidence
      // Be more conservative - only flag high-confidence matches
      let severity: 'high' | 'warning' | 'info' = 'warning';

      // Skip low confidence matches entirely - too sensitive otherwise
      if (match.confidence === 'low') {
        continue;
      }

      // Only include medium confidence if excerpt is clearly relevant
      if (match.confidence === 'medium' && !match.excerptRelevant) {
        continue;
      }

      // Set severity based on score for high/medium confidence matches
      if (match.confidence === 'high') {
        severity = match.score >= 18 ? 'high' : 'warning'; // Higher bar for 'high' severity
      } else if (match.confidence === 'medium') {
        severity = 'warning'; // Medium confidence = warning level
      }

      // Extract a good excerpt from the chunk
      const excerpt = match.matchedText.length > 300
        ? match.matchedText.substring(0, 300) + '...'
        : match.matchedText;

      // Build context-aware explanation
      let explanation = '';

      // Special handling for security deposit - be precise about actual violations
      if (match.section.id === 'security-deposit') {
        // Check if the excerpt mentions specific issues
        const excerptLower = excerpt.toLowerCase();
        const mentionsAmount = excerptLower.includes('exceeds') || excerptLower.includes('one month') ||
          excerptLower.includes('more than');
        const mentionsDiscretion = excerptLower.includes('discretion') || excerptLower.includes('withhold') ||
          excerptLower.includes('administrative');
        const mentionsMissingDisclosures = !excerptLower.includes('itemized') && !excerptLower.includes('escrow');

        if (mentionsAmount) {
          explanation = `The lease requires a security deposit that exceeds one month's rent. ${match.section.text} Language allowing withholding at the landlord's discretion for broad categories may conflict with tenant protection rules.`;
        } else if (mentionsDiscretion) {
          explanation = `The lease allows withholding of the security deposit at the landlord's discretion for broad categories such as "administrative costs" or "other expenses." ${match.section.text} This may conflict with requirements for itemized deductions and tenant protection rules.`;
        } else {
          explanation = `${match.section.text} This clause may conflict with security deposit requirements including limits on withholding, mandatory itemized deductions, and required disclosures.`;
        }
      } else if (match.section.id === 'habitability') {
        // Softer, more interpretive language for habitability
        explanation = `While tenants may be responsible for routine maintenance, landlords cannot shift responsibility for essential habitability conditions such as heat, plumbing, and code compliance. ${match.section.text}`;
      } else {
        // Standard explanation format
        explanation = `${match.section.text} This clause may violate: ${match.section.title}.`;
      }

      flags.push({
        type: match.section.id,
        excerpt,
        explanation,
        legalReference: {
          title: match.section.title,
          text: match.section.text,
          // Use the actual jurisdiction from the matched legal section, not the overall detected jurisdiction
          jurisdiction: match.sectionJurisdiction || jurisdiction || 'Unknown',
        },
        severity,
      });

      processedSections.add(match.section.id);
    }
  }

  // Also run simple pattern matching as fallback
  const simpleFlags = detectRisksSimple(text);

  // Merge flags, avoiding duplicates
  for (const simpleFlag of simpleFlags) {
    const alreadyExists = flags.some(f =>
      f.excerpt.toLowerCase().includes(simpleFlag.excerpt.toLowerCase().substring(0, 50))
    );
    if (!alreadyExists) {
      // Determine severity for simple flags
      let severity: 'high' | 'warning' | 'info' = 'warning';
      if (simpleFlag.type === 'illegal_entry' || simpleFlag.type === 'deposit_risk') {
        severity = 'high';
      }

      flags.push({
        ...simpleFlag,
        severity,
      });
    }
  }

  return flags;
}

/**
 * Simple pattern-based risk detection (fallback)
 */
function detectRisksSimple(text: string): Omit<RiskFlag, 'severity' | 'legalReference'>[] {
  const flags: Omit<RiskFlag, 'severity' | 'legalReference'>[] = [];
  const lines = text.split('\n');

  // Check each risk pattern
  for (const rule of RISK_PATTERNS) {
    // Create a fresh regex for each check to avoid state issues
    const pattern = new RegExp(rule.pattern.source, rule.pattern.flags);
    const matches = text.match(pattern);

    if (matches) {
      // Find the line containing the match and extract context
      for (let i = 0; i < lines.length; i++) {
        if (pattern.test(lines[i])) {
          // Extract a short excerpt (current line + next line if available)
          const excerpt = lines[i].trim() + (lines[i + 1] ? ' ' + lines[i + 1].trim() : '');

          flags.push({
            type: rule.type,
            excerpt: excerpt.length > 200 ? excerpt.substring(0, 200) + '...' : excerpt,
            explanation: rule.explanation,
          });

          // Only flag once per pattern
          break;
        }
      }
    }
  }

  return flags;
}

export async function POST(request: NextRequest) {
  try {
    // Parse multipart/form-data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided. Please upload a PDF file.' },
        { status: 400 }
      );
    }

    // Check if file is a PDF
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a PDF file.' },
        { status: 400 }
      );
    }

    // Convert File to Buffer for pdf-parse
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text from PDF
    let pdfText: string;
    try {
      // pdf-parse is a CommonJS module, so we use require or default import
      // @ts-ignore
      const pdf = require('pdf-parse');
      const data = await pdf(buffer);
      pdfText = data.text;
    } catch (parseError) {
      console.error('PDF Parse Error Details:', {
        error: parseError,
        message: parseError instanceof Error ? parseError.message : 'Unknown error',
        stack: parseError instanceof Error ? parseError.stack : undefined,
        fileSize: file.size,
        fileType: file.type,
        fileName: file.name,
      });
      const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown error';
      return NextResponse.json(
        { error: `Failed to parse PDF: ${errorMessage}. Please ensure the file is a valid PDF.` },
        { status: 400 }
      );
    }

    // Check if text was extracted
    if (!pdfText || pdfText.trim().length === 0) {
      return NextResponse.json(
        { error: 'No text could be extracted from the PDF. The file may be image-based or corrupted.' },
        { status: 400 }
      );
    }

    // Detect risks using RAG (Retrieval-Augmented Generation)
    // Get jurisdiction from query params or form data
    const jurisdictionParam = formData.get('jurisdiction') as string | null;
<<<<<<< Updated upstream
    let jurisdiction: string | undefined = undefined;
    
    // If jurisdiction is explicitly provided and not 'auto', use it
    if (jurisdictionParam && jurisdictionParam !== 'auto' && jurisdictionParam.trim() !== '') {
      jurisdiction = String(jurisdictionParam);
    }
    
    // Try to auto-detect jurisdiction from lease text if not provided or 'auto' was selected
=======
    let jurisdiction = jurisdictionParam ? String(jurisdictionParam) : 'Washington, DC';

    // Try to auto-detect jurisdiction from lease text if not provided
>>>>>>> Stashed changes
    // Always return in "City, State" format when possible
    if (!jurisdiction) {
      const textLower = pdfText.toLowerCase();

      // City-specific detection (more specific first) - require actual city mentions
      // Check for city names first, then city+state combinations
      // AUSTIN DETECTION - HIGHEST PRIORITY (check first, before anything else)
      if (textLower.includes('austin')) {
        // If Austin is mentioned, assume it's Austin, Texas (most common case)
        jurisdiction = 'Austin, Texas';
        console.log('✅ AUSTIN DETECTED - Setting jurisdiction to Austin, Texas');
      } else if (textLower.includes('chicago') && (textLower.includes('illinois') || textLower.includes(' il '))) {
        jurisdiction = 'Chicago, Illinois';
      } else if (textLower.includes('chicago')) {
        // If Chicago is mentioned, assume it's Chicago, Illinois
        jurisdiction = 'Chicago, Illinois';
      } else if (textLower.includes('seattle') && (textLower.includes('washington') || textLower.includes(' wa '))) {
        jurisdiction = 'Seattle, Washington';
      } else if (textLower.includes('seattle')) {
        // If Seattle is mentioned, assume it's Seattle, Washington
        jurisdiction = 'Seattle, Washington';
      } else if (textLower.includes('boston') && (textLower.includes('massachusetts') || textLower.includes(' ma '))) {
        jurisdiction = 'Boston, Massachusetts';
      } else if (textLower.includes('boston')) {
        // If Boston is mentioned, assume it's Boston, Massachusetts
        jurisdiction = 'Boston, Massachusetts';
      } else if (textLower.includes('nyc') || textLower.includes('new york city') || textLower.includes('manhattan') || textLower.includes('brooklyn') || textLower.includes('queens') || textLower.includes('bronx')) {
        jurisdiction = 'New York City, New York';
      } else if (textLower.includes('san francisco')) {
        jurisdiction = 'San Francisco, California';
      } else if (textLower.includes('los angeles')) {
        jurisdiction = 'Los Angeles, California';
      } else if (textLower.includes('san diego')) {
        jurisdiction = 'San Diego, California';
      } else if ((textLower.includes('washington') && (textLower.includes(' dc ') || textLower.includes('district of columbia'))) || textLower.includes('district of columbia')) {
        jurisdiction = 'Washington, DC';
      } else if (textLower.includes('new york') && (textLower.includes(' ny ') || textLower.includes('new york state'))) {
        // Only if "New York" appears with state context
        jurisdiction = 'New York City, New York';
      } else if (textLower.includes('california') && (textLower.includes('san francisco') || textLower.includes('los angeles') || textLower.includes('san diego'))) {
        // If California + specific city mentioned
        if (textLower.includes('los angeles')) {
          jurisdiction = 'Los Angeles, California';
        } else if (textLower.includes('san diego')) {
          jurisdiction = 'San Diego, California';
        } else {
          jurisdiction = 'San Francisco, California';
        }
      } else if (textLower.includes('texas') && textLower.includes('austin')) {
        jurisdiction = 'Austin, Texas';
      } else if (textLower.includes('illinois') && textLower.includes('chicago')) {
        jurisdiction = 'Chicago, Illinois';
      } else if (textLower.includes('massachusetts') && textLower.includes('boston')) {
        jurisdiction = 'Boston, Massachusetts';
      } else if (textLower.includes('washington') && textLower.includes('seattle')) {
        jurisdiction = 'Seattle, Washington';
      }
      // If no strong match, leave jurisdiction undefined (will use all legal sections)
    }
<<<<<<< Updated upstream
    
    // Debug: log the jurisdiction being used
    console.log('🔍 Detected jurisdiction:', jurisdiction);
    console.log('🔍 Jurisdiction type:', typeof jurisdiction);
    
=======

>>>>>>> Stashed changes
    const flags = detectRisksWithRAG(pdfText, jurisdiction);

    // Build response
    const highRiskCount = flags.filter(f => f.severity === 'high').length;
    const warningCount = flags.filter(f => f.severity === 'warning').length;

    let summary = 'No obvious risky clauses detected.';
    if (highRiskCount > 0) {
      summary = `This lease contains ${highRiskCount} high-risk clause${highRiskCount > 1 ? 's' : ''} that may violate tenant protection laws.`;
    } else if (warningCount > 0) {
      summary = `This lease contains ${warningCount} clause${warningCount > 1 ? 's' : ''} that may be problematic for tenants.`;
    }

    const response: AnalysisResponse = {
      summary,
      flags,
      disclaimer: 'This analysis is for informational purposes only and does not constitute legal advice. Consult with a qualified attorney for legal guidance.',
      jurisdiction,
      extractedText: pdfText, // Include the extracted text for display
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error analyzing lease:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while analyzing the lease.' },
      { status: 500 }
    );
  }
}

