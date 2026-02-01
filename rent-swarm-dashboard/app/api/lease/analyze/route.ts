import { NextRequest, NextResponse } from 'next/server';
import { getAllLegalSections } from '@/lib/rag/legal-references';
import { findRelevantLegalSections, chunkLeaseText } from '@/lib/rag/similarity';

// Set max duration for this route (handles large PDFs)
// Note: Vercel Pro plan allows up to 300s, Hobby plan is 10s
export const maxDuration = 60;
// Use Node.js runtime (not edge) for PDF parsing
export const runtime = 'nodejs';
// Allow larger request body for PDF uploads
export const dynamic = 'force-dynamic';

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

// Simple pattern matching removed - now using RAG exclusively with bad lease examples

/**
 * Detect risks using RAG - compares lease text against legal references
 */
function detectRisksWithRAG(text: string, jurisdiction?: string): RiskFlag[] {
  const flags: RiskFlag[] = [];
  const legalSections = getAllLegalSections(jurisdiction);
  
  // Chunk the lease text for analysis
  const chunks = chunkLeaseText(text, 500);
  const processedSections = new Set<string>(); // Avoid duplicate flags for same legal section

  // Analyze each chunk against legal references (now with bad lease examples)
  for (const chunk of chunks) {
    // Higher threshold to reduce false positives - only flag clear violations
    const matches = findRelevantLegalSections(chunk, legalSections, 10, jurisdiction); // Threshold of 10 (was 6)

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
      // If we have a matching bad lease example, use its explanation as a starting point
      let explanation = '';
      
      if (match.badLeaseExample) {
        // Use the bad lease example explanation, but enhance it with legal reference
        explanation = `${match.badLeaseExample.explanation} ${match.section.text}`;
      } else if (match.section.id === 'security-deposit') {
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

  return flags;
}

export async function POST(request: NextRequest) {
  try {
    console.log('📥 PDF Upload Request Received');
    
    // Parse multipart/form-data
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (formError) {
      console.error('❌ FormData parse error:', formError);
      return NextResponse.json(
        { error: 'Failed to parse form data. Please ensure the file is properly uploaded.' },
        { status: 400 }
      );
    }
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided. Please upload a PDF file.' },
        { status: 400 }
      );
    }

    // Check file size (limit to 10MB for production compatibility)
    const maxFileSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxFileSize) {
      return NextResponse.json(
        { error: `File size exceeds the maximum limit of 10MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.` },
        { status: 400 }
      );
    }

    // Log file info for debugging (helpful for production issues)
    console.log('📄 PDF Upload:', {
      fileName: file.name,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      fileType: file.type,
    });

    // Check if file is a PDF
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a PDF file.' },
        { status: 400 }
      );
    }

    // Convert File to Buffer for pdf-parse
    let buffer: Buffer;
    try {
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      console.log('✅ File converted to buffer, size:', buffer.length, 'bytes');
    } catch (bufferError) {
      console.error('❌ Buffer conversion error:', bufferError);
      return NextResponse.json(
        { error: 'Failed to process file. Please try again.' },
        { status: 500 }
      );
    }

    // Extract text from PDF
    let pdfText: string;
    try {
      // Dynamic import for pdf-parse to handle ESM/CJS compatibility in production
      const pdfParseModule = await import('pdf-parse');
      const pdfParse = (pdfParseModule as any).default || pdfParseModule;
      const pdfData = await pdfParse(buffer);
      pdfText = pdfData.text;
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
    let jurisdiction: string | undefined = undefined;
    
    // If jurisdiction is explicitly provided and not 'auto', use it
    if (jurisdictionParam && jurisdictionParam !== 'auto' && jurisdictionParam.trim() !== '') {
      jurisdiction = String(jurisdictionParam);
    }
    
    // Try to auto-detect jurisdiction from lease text if not provided or 'auto' was selected
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
    
    // Debug: log the jurisdiction being used
    console.log('🔍 Detected jurisdiction:', jurisdiction);
    console.log('🔍 Jurisdiction type:', typeof jurisdiction);
    
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
    
    // Provide more detailed error messages for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isTimeout = errorMessage.includes('timeout') || errorMessage.includes('duration');
    const isSizeLimit = errorMessage.includes('size') || errorMessage.includes('too large');
    
    if (isTimeout) {
      return NextResponse.json(
        { error: 'The PDF processing took too long. Please try with a smaller file or contact support if the issue persists.' },
        { status: 504 }
      );
    }
    
    if (isSizeLimit) {
      return NextResponse.json(
        { error: 'File size is too large. Please upload a PDF file smaller than 10MB.' },
        { status: 413 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred while analyzing the lease.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

