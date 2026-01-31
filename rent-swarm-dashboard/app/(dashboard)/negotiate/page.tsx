"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  BadgeDollarSign,
  TrendingDown,
  Mail,
  Copy,
  Send,
  CheckCircle,
  DollarSign,
  Home,
  Calendar,
  Edit3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

// Mock selected apartment data
const selectedApartment = {
  address: "1847 Market St, Apt 4B",
  city: "San Francisco, CA",
  price: 2450,
  beds: 2,
  baths: 1,
  sqft: 850,
  landlord: "Pacific Properties LLC",
  listingAge: 45,
  similarUnitsAvg: 2280,
  vacancyRate: 8.2,
};

// Mock AI drafted email
const mockDraftedEmail = `Subject: Rental Application & Rent Negotiation - 1847 Market St, Apt 4B

Dear Pacific Properties LLC,

I hope this message finds you well. I am writing to express my strong interest in the 2-bedroom apartment at 1847 Market Street, Apartment 4B, and to formally submit my rental application.

After conducting thorough market research, I've observed that comparable units in the immediate area are currently averaging $2,280/month. Given the current market conditions and the unit's listing duration of 45 days, I would like to respectfully propose a monthly rent of $2,200.

Here's what I bring as a tenant:
• Excellent credit score (780+)
• Stable employment with verified income 3x the rent
• Strong rental history with references available
• Willingness to sign a 14-month lease for added stability
• Immediate move-in availability

I am prepared to provide:
• First month's rent and security deposit upfront
• All required documentation within 24 hours
• References from previous landlords

I believe this proposal represents a fair arrangement that reflects current market conditions while offering you a reliable, long-term tenant.

I would welcome the opportunity to discuss this further at your earliest convenience.

Best regards,
[Your Name]
[Your Phone]
[Your Email]`;

// Mock negotiation metrics
const metrics = {
  projectedSavings: 250,
  annualSavings: 3000,
  successProbability: 72,
  marketDelta: -170,
};

export default function NegotiatePage() {
  const searchParams = useSearchParams();

  // State for data
  const [listing, setListing] = useState<any>(selectedApartment);
  const [emailContent, setEmailContent] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");

  // UI State
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Initialize from URL params
  useEffect(() => {
    const listingId = searchParams.get('listingId');
    if (listingId) {
      const paramListing = {
        address: searchParams.get('address') || '',
        city: searchParams.get('city') || '',
        price: Number(searchParams.get('price')) || 0,
        beds: Number(searchParams.get('beds')) || 1,
        baths: Number(searchParams.get('baths')) || 1,
        sqft: Number(searchParams.get('sqft')) || 0,
        landlord: "Property Manager", // Default since we don't have this in params yet
        listingAge: 14, // Default
        similarUnitsAvg: Number(searchParams.get('price')) ? Number(searchParams.get('price'))! - 200 : 0, // Mock logic for demo
        vacancyRate: 5.5,
      };
      setListing(paramListing);
      generateDraft(paramListing);
    } else {
      // If no params, use mock and generate for it
      setEmailContent(mockDraftedEmail);
      // Optional: could auto-generate for mock too, but static is faster for demo
    }
  }, [searchParams]);

  const generateDraft = async (currentListing: any) => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/negotiate/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing: currentListing }),
      });

      if (response.ok) {
        const data = await response.json();
        setEmailSubject(data.subject);
        setEmailContent(data.body);
      } else {
        const err = await response.json();
        throw new Error(err.error || "Failed to generate");
      }
    } catch (error) {
      console.error("Failed to generate draft", error);
      setEmailContent("Error: Failed to generate negotiation draft. Please try again later.\n\n(Note: Ensure your API keys are configured correctly)");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendEmail = async () => {
    if (!recipientEmail) {
      alert("Please enter a recipient email."); // Simple alert for now
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch('/api/negotiate/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipientEmail,
          subject: emailSubject || "Regarding Rental Application",
          body: emailContent,
          from: "user@example.com" // Backend handles auth user context usually
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.warning) {
          alert(`Success (Simulated): ${result.warning}`);
        } else {
          alert("Email sent successfully!");
        }
      }
    } catch (error) {
      alert("Failed to send email.");
    } finally {
      setIsSending(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(emailContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-background px-6 py-4">
        <div className="flex items-center gap-2">
          <BadgeDollarSign className="h-5 w-5 text-primary" />
          <h1 className="font-mono text-lg font-bold">THE HAGGLER</h1>
        </div>
        <p className="mt-1 font-mono text-sm text-muted-foreground">
          AI-Powered Rent Negotiation & Savings Optimization
        </p>
      </header>

      <div className="p-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column: Apartment Summary + Metrics */}
          <div className="space-y-6">
            {/* Apartment Summary Card */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 font-mono text-sm">
                  <Home className="h-4 w-4 text-primary" />
                  SELECTED PROPERTY
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-medium text-foreground">
                    {listing.address}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {listing.city}
                  </p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="font-mono text-2xl font-bold text-foreground">
                    ${listing.price.toLocaleString()}
                  </span>
                  <span className="font-mono text-sm text-muted-foreground">
                    /mo
                  </span>
                </div>

                <div className="flex items-center gap-4 font-mono text-xs text-muted-foreground">
                  <span>{listing.beds} bed</span>
                  <span className="h-1 w-1 rounded-full bg-border" />
                  <span>{listing.baths} bath</span>
                  <span className="h-1 w-1 rounded-full bg-border" />
                  <span>{listing.sqft.toLocaleString()} sqft</span>
                </div>
              </CardContent>
            </Card>

            {/* Metrics Dashboard (Static for now, could be dynamic) */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 font-mono text-sm">
                  <TrendingDown className="h-4 w-4 text-status-success" />
                  NEGOTIATION LEVERAGE
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-secondary p-4">
                  <p className="font-mono text-xs text-muted-foreground mb-2">TARGET RENT</p>
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-2xl font-bold text-status-success">
                      ${(listing.price ? Math.floor(listing.price * 0.93 / 50) * 50 : 0).toLocaleString()}
                    </span>
                    <span className="text-xs text-status-success">
                      (-7%)
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Email Editor */}
          <div className="lg:col-span-2">
            <Card className="h-full border-border bg-card flex flex-col">
              <CardHeader className="border-b border-border pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 font-mono text-sm">
                    <Mail className="h-4 w-4 text-primary" />
                    AI DRAFTED EMAIL
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {isGenerating && (
                      <span className="font-mono text-xs animate-pulse text-muted-foreground">
                        Drafting Strategy...
                      </span>
                    )}
                    <Badge
                      variant="secondary"
                      className="font-mono text-xs text-primary"
                    >
                      <Edit3 className="mr-1 h-3 w-3" />
                      EDITABLE
                    </Badge>
                  </div>
                </div>

                {/* Recipient Input */}
                <div className="mt-4 flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      placeholder="Landlord's Email (e.g. landlord@property.com)"
                      className="font-mono text-sm bg-secondary border-border"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0 flex-1">
                <Textarea
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                  className="h-full min-h-[400px] resize-none rounded-none border-0 bg-transparent p-6 font-mono text-sm leading-relaxed text-foreground focus-visible:ring-0"
                  placeholder={isGenerating ? "Analyzing market logic..." : "No draft generated."}
                />
              </CardContent>

              <div className="flex items-center justify-between border-t border-border p-4">
                <p className="font-mono text-xs text-muted-foreground">
                  <span className="text-primary">TIP:</span> Review carefully before sending.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    className="font-mono text-xs"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4 text-status-success" />
                        COPIED!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        COPY
                      </>
                    )}
                  </Button>
                  <Button
                    className="font-mono text-xs"
                    onClick={handleSendEmail}
                    disabled={isSending || isGenerating}
                  >
                    {isSending ? (
                      <>
                        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                        SENDING...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        SEND EMAIL
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
