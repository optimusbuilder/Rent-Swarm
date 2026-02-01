import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY!);

export async function POST(req: NextRequest) {
    let listing: any = null;

    try {
        const body = await req.json();
        listing = body.listing;

        if (!listing) {
            return NextResponse.json(
                { error: 'Listing details are required' },
                { status: 400 }
            );
        }

        const { address, city, price, beds } = listing;

        // Use Gemini to draft the email
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        // Leverage strategy: Claim comparables are cheaper
        const comparablePrice = Math.floor(price * 0.90 / 50) * 50; // ~10% less, rounded to nearest 50
        const targetPrice = Math.floor(price * 0.93 / 50) * 50; // ~7% less, slightly more realistic than the full 10% diff

        const prompt = `
      Act as a high-stakes real estate negotiation expert.
      Draft a persuasive, professional email to a landlord ($${price}/mo) to negotiate the rent down to $${targetPrice}/mo.
      
      Listing Details:
      - Address: ${address}, ${city}
      - Current Ask: $${price}
      - Bedrooms: ${beds}
      - Target Rent: $${targetPrice} (Based on comps at ~$${comparablePrice})
      
      Strategy (The "Perfect Tenant" Leverage):
      1. **Open Warmly**: Express genuine interest in the specific property qualities.
      2. **The Anchor**: Polite but firm data-point. "Market research for similar units in [City] shows an average of $${comparablePrice}..."
      3. **The Value Add**: Emphasize why I am the lowest-risk tenant. Mention:
         - Excellent credit score (780+)
         - Stable, verified income (3x rent)
         - No pets / Non-smoker (optional but safe to imply)
         - Ready for immediate move-in and deposit pay.
      4. **The Offer**: "I am prepared to sign a 12-month lease today if we can agree on $${targetPrice}/mo."
      5. **Tone**: Collaborative, not combative. Win-win.
    `;

        const schema = {
            description: "Email draft structure",
            type: SchemaType.OBJECT,
            properties: {
                subject: {
                    type: SchemaType.STRING,
                    description: "The email subject line",
                    nullable: false,
                },
                body: {
                    type: SchemaType.STRING,
                    description: "The full email body text",
                    nullable: false,
                },
            },
            required: ["subject", "body"],
        };

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: schema as any,
            }
        });

        const text = result.response.text();

        let emailDraft;
        try {
            // With responseSchema, the output should be valid JSON
            emailDraft = JSON.parse(text);
        } catch (e) {
            console.error("JSON Parse Error:", e, "Raw text:", text);
            throw new Error("Failed to parse JSON generation");
        }

        if (!emailDraft.subject || !emailDraft.body) {
            throw new Error("Invalid draft structure: Missing subject or body");
        }

        return NextResponse.json(emailDraft);

    } catch (error) {
        console.error('Email draft generation error:', error);

        // Fallback Strategy: If AI fails, return a template
        console.log("Falling back to template draft");
        return NextResponse.json({
            subject: `Application & Offer: ${listing?.address || 'Apartment'} - Excellent Credit & References`,
            body: `Dear Property Manager,\n\nI hope this email finds you well. I recently toured ${listing?.address || 'the apartment'} (or viewed the listing) and I am writing to express my strong intent to rent this unit. It seems like a perfect fit.\n\nHowever, I have been actively researching the ${listing?.city || 'local'} market, and I have found that comparable renovated ${listing?.beds || 1}-bedroom units in the immediate vicinity are leasing for closer to $${(listing?.price || 2000) - 200}/month.\n\nI am very motivated to secure this place and would love to close this quickly. I am prepared to offer **$${(listing?.price || 2000) - 100}/month** for a 12-month lease.\n\n**Why I am an ideal tenant for you:**\n• Excellent credit score (780+)\n• Stable employment with income exceeding 3x rent\n• No pets / Non-smoker\n• Clean rental history with strong references\n• Ready to pay deposit and first month's rent immediately\n\nI believe this rate reflects fair market value while guaranteeing you a low-maintenance, financially secure tenant. If we can agree on this price, I can sign the lease immediately.\n\nThank you for your consideration,\n\n[Your Name]\n[Your Phone Number]`
        });
    }
}
