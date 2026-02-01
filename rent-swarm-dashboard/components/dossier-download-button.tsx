
"use client";

import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { jsPDF } from "jspdf";
import { useState } from "react";

interface Listing {
    id: number;
    address: string;
    city: string;
    price: number;
    beds: number;
    baths: number;
    sqft: number;
    scamScore: number;
    verified: boolean;
    link?: string;
    savedAt?: string;
}

export function DossierDownloadButton({ listing }: { listing: Listing }) {
    const [isGenerating, setIsGenerating] = useState(false);

    const generateDossier = async () => {
        setIsGenerating(true);
        await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate processing

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // --- Styles ---
        const primaryColor = "#000000"; // Black text
        const accentColor = "#ff4444"; // Red for confidential

        // --- Header ---
        doc.setFont("courier", "bold");
        doc.setFontSize(22);
        doc.text("RENT-SWARM INTELLIGENCE REPORT", 20, 20);

        doc.setTextColor(accentColor);
        doc.setFontSize(12);
        doc.text("// CONFIDENTIAL // DO NOT DISTRIBUTE", 20, 28);
        doc.setDrawColor(accentColor);
        doc.line(20, 32, pageWidth - 20, 32);

        // --- Target Analysis ---
        doc.setTextColor(primaryColor);
        doc.setFontSize(14);
        doc.text("1. TARGET ANALYSIS", 20, 45);

        doc.setFontSize(10);
        doc.setFont("courier", "normal");
        doc.text(`ADDRESS:    ${listing.address}`, 25, 55);
        doc.text(`CITY:       ${listing.city}`, 25, 60);
        doc.text(`LIST PRICE: $${listing.price.toLocaleString()}/mo`, 25, 65);
        doc.text(`SPECS:      ${listing.beds} Bed / ${listing.baths} Bath / ${listing.sqft} sqft`, 25, 70);
        doc.text(`URL:        ${listing.link || "N/A"}`, 25, 75);

        // --- True Cost Breakdown ---
        doc.setFont("courier", "bold");
        doc.setFontSize(14);
        doc.text("2. TRUE COST BREAKDOWN", 20, 90);

        doc.setFont("courier", "normal");
        doc.setFontSize(10);

        const rent = listing.price;
        const utilities = Math.round(rent * 0.08); // Est 8%
        const parking = 150; // Est
        const insurance = 20; // Est
        const trueTotal = rent + utilities + parking + insurance;

        doc.text(`Base Rent:        $${rent.toLocaleString()}`, 25, 100);
        doc.text(`Est. Utilities:   $${utilities} (8%)`, 25, 105);
        doc.text(`Est. Parking:     $${parking}`, 25, 110);
        doc.text(`Renters Ins.:     $${insurance}`, 25, 115);
        doc.setLineWidth(0.5);
        doc.line(25, 118, 100, 118);
        doc.setFont("courier", "bold");
        doc.text(`MONTHLY TOTAL:    $${trueTotal.toLocaleString()}`, 25, 125);

        // --- Risk Assessment ---
        doc.setFontSize(14);
        doc.text("3. RISK ASSESSMENT", 20, 140);

        doc.setFontSize(10);
        doc.setFont("courier", "normal");
        doc.text(`Scam Probability Score: ${listing.scamScore}/100`, 25, 150);

        // Draw Bar
        doc.rect(25, 155, 100, 10); // Container
        if (listing.scamScore > 50) doc.setFillColor(accentColor);
        else doc.setFillColor("#44cc44"); // Green
        doc.rect(25, 155, listing.scamScore, 10, "F"); // Fill based on score

        // --- Strategic Advice (Red Flags) ---
        doc.setTextColor(primaryColor);
        doc.setFont("courier", "bold");
        doc.setFontSize(14);
        doc.text("4. STRATEGIC ADVICE", 20, 180);

        doc.setFont("courier", "normal");
        doc.setFontSize(10);
        const flags = [
            "- Ensure lease explicitly states 'Wear and Tear' policy.",
            "- Verify 'Early Termination Fee' does not exceed 1.5x rent.",
            "- Request recent utility bills to confirm HVAC efficiency."
        ];
        if (listing.scamScore > 40) {
            flags.push("- CAUTION: Price is significantly below market avg.");
            flags.push("- VERIFY ownership via County Assessor before sending money.");
        }

        let y = 190;
        flags.forEach(flag => {
            doc.text(flag, 25, y);
            y += 6;
        });

        // --- Negotiation Draft ---
        doc.setFont("courier", "bold");
        doc.setFontSize(14);
        doc.text("5. NEGOTIATION DRAFT", 20, 220);

        doc.setFont("courier", "normal");
        doc.setFontSize(9);
        doc.setTextColor("#555555");

        const emailBody = `Subject: Inquiry regarding ${listing.address} - Ready to Lease

Dear Property Manager,

I am writing to express my strong interest in the ${listing.beds} bedroom unit at ${listing.address}.
I have verified my financials and have a credit score of 750+.

I am ready to sign a lease effective immediately. However, based on comparable units
in ${listing.city}, I would like to propose a monthly rate of $${(listing.price * 0.95).toFixed(0)} (5% reduction)
in exchange for an extended 15-month lease term.

Please let me know if you are open to this discussion.

Best regards,
[Your Name]`;

        const splitText = doc.splitTextToSize(emailBody, 160);
        doc.text(splitText, 25, 230);

        // Header/Footer Watermarks
        doc.setTextColor("#e0e0e0");
        doc.setFontSize(40);
        doc.text("CLASSIFIED", 40, 150, { angle: 45 });

        doc.save(`Rent-Swarm-Dossier-${listing.city.replace(/\s/g, "-")}.pdf`);
        setIsGenerating(false);
    };

    return (
        <Button
            onClick={generateDossier}
            disabled={isGenerating}
            variant="default" // Primary style
            size="sm"
            className="w-full font-mono text-xs bg-foreground text-background hover:bg-foreground/90"
        >
            {isGenerating ? (
                <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    COMPILING...
                </>
            ) : (
                <>
                    <FileDown className="mr-2 h-3 w-3" />
                    DOWNLOAD DOSSIER
                </>
            )}
        </Button>
    );
}
