"use client";

import { useState } from "react";
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
  const [emailContent, setEmailContent] = useState(mockDraftedEmail);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(emailContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-background px-4 md:px-6 py-4">
        <div className="flex items-center gap-2">
          <BadgeDollarSign className="h-5 w-5 text-primary" />
          <h1 className="font-mono text-lg font-bold">THE HAGGLER</h1>
        </div>
        <p className="mt-1 font-mono text-sm text-muted-foreground">
          AI-Powered Rent Negotiation & Savings Optimization
        </p>
      </header>

      <div className="p-4 md:p-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column: Apartment Summary + Metrics */}
          <div className="space-y-6">
            {/* Apartment Summary Card */}
            <Card className="border-border bg-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 font-mono text-sm">
                  <Home className="h-4 w-4 text-primary" />
                  SELECTED PROPERTY
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-medium text-foreground">
                    {selectedApartment.address}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedApartment.city}
                  </p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="font-mono text-2xl font-bold text-foreground">
                    ${selectedApartment.price.toLocaleString()}
                  </span>
                  <span className="font-mono text-sm text-muted-foreground">
                    /mo
                  </span>
                </div>

                <div className="flex items-center gap-4 font-mono text-xs text-muted-foreground">
                  <span>{selectedApartment.beds} bed</span>
                  <span className="h-1 w-1 rounded-full bg-border" />
                  <span>{selectedApartment.baths} bath</span>
                  <span className="h-1 w-1 rounded-full bg-border" />
                  <span>{selectedApartment.sqft.toLocaleString()} sqft</span>
                </div>

                <div className="space-y-2 border-t border-border pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Landlord</span>
                    <span className="font-medium text-foreground">
                      {selectedApartment.landlord}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Days Listed</span>
                    <Badge
                      variant="secondary"
                      className="font-mono text-xs text-status-success"
                    >
                      <Calendar className="mr-1 h-3 w-3" />
                      {selectedApartment.listingAge} days
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Metrics Dashboard */}
            <Card className="border-border bg-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 font-mono text-sm">
                  <TrendingDown className="h-4 w-4 text-status-success" />
                  NEGOTIATION METRICS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Projected Monthly Savings */}
                <div className="rounded-lg bg-status-success/10 p-4 hover:bg-status-success/15 transition-colors duration-200">
                  <p className="font-mono text-xs text-muted-foreground">
                    PROJECTED MONTHLY SAVINGS
                  </p>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="font-mono text-3xl font-bold text-status-success">
                      ${metrics.projectedSavings}
                    </span>
                    <span className="font-mono text-sm text-muted-foreground">
                      /mo
                    </span>
                  </div>
                  <p className="mt-2 font-mono text-xs text-muted-foreground">
                    <span className="text-status-success font-medium">
                      ${metrics.annualSavings.toLocaleString()}
                    </span>{" "}
                    saved annually
                  </p>
                </div>

                {/* Other Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-secondary p-3">
                    <p className="font-mono text-[10px] text-muted-foreground">
                      SUCCESS RATE
                    </p>
                    <p className="mt-1 font-mono text-xl font-bold text-primary">
                      {metrics.successProbability}%
                    </p>
                  </div>
                  <div className="rounded-lg bg-secondary p-3">
                    <p className="font-mono text-[10px] text-muted-foreground">
                      VS MARKET AVG
                    </p>
                    <p className="mt-1 font-mono text-xl font-bold text-status-success">
                      ${metrics.marketDelta}
                    </p>
                  </div>
                </div>

                {/* Market Context */}
                <div className="space-y-2 border-t border-border pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Area Average</span>
                    <span className="font-mono font-medium text-foreground">
                      ${selectedApartment.similarUnitsAvg.toLocaleString()}/mo
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Vacancy Rate</span>
                    <span className="font-mono font-medium text-status-warning">
                      {selectedApartment.vacancyRate}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Email Editor */}
          <div className="lg:col-span-2">
            <Card className="h-full border-border bg-card hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="border-b border-border pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 font-mono text-sm">
                    <Mail className="h-4 w-4 text-primary" />
                    AI DRAFTED EMAIL
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="font-mono text-xs text-primary"
                    >
                      <Edit3 className="mr-1 h-3 w-3" />
                      EDITABLE
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Textarea
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                  className="min-h-[500px] resize-none rounded-none border-0 bg-transparent p-6 font-mono text-sm leading-relaxed text-foreground focus-visible:ring-0"
                  placeholder="AI is drafting your negotiation email..."
                />
              </CardContent>
              <div className="flex items-center justify-between border-t border-border p-4">
                <p className="font-mono text-xs text-muted-foreground">
                  <span className="text-primary">TIP:</span> Personalize the
                  email before sending for best results
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    className="font-mono text-xs transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
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
                  <Button className="font-mono text-xs transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
                    <Send className="mr-2 h-4 w-4" />
                    SEND EMAIL
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
