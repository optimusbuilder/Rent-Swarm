import { NextRequest, NextResponse } from 'next/server';
import { PDFParse } from 'pdf-parse';

// Set max duration for this route (handles large PDFs)
export const maxDuration = 60;
// Use Node.js runtime (not edge) for PDF parsing
export const runtime = 'nodejs';

// Simple rule-based risk detection
interface RiskFlag {
  type: string;
  excerpt: string;
  explanation: string;
}

interface AnalysisResponse {
  summary: string;
  flags: RiskFlag[];
  disclaimer: string;
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

function detectRisks(text: string): RiskFlag[] {
  const flags: RiskFlag[] = [];
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
      const pdfParser = new PDFParse({ data: buffer });
      const textResult = await pdfParser.getText();
      pdfText = textResult.text;
      await pdfParser.destroy();
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

    // Detect risks using simple rules
    const flags = detectRisks(pdfText);

    // Build response
    const response: AnalysisResponse = {
      summary: flags.length > 0
        ? 'This lease contains clauses that may be risky for tenants.'
        : 'No obvious risky clauses detected using basic pattern matching.',
      flags,
      disclaimer: 'This analysis is for informational purposes only and does not constitute legal advice. Consult with a qualified attorney for legal guidance.',
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

