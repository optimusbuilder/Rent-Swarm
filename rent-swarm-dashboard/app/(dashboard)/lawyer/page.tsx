"use client";

import { useState } from "react";
import { Scale, Upload, FileText, AlertTriangle, AlertCircle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Mock lease text
const mockLeaseText = `RESIDENTIAL LEASE AGREEMENT

This Lease Agreement ("Lease") is entered into as of January 15, 2026, by and between the Landlord and Tenant identified below.

SECTION 1. PARTIES
Landlord: Pacific Properties LLC
Tenant: [Tenant Name]

SECTION 2. PREMISES
The Landlord leases to the Tenant the property located at:
1847 Market Street, Apartment 4B
San Francisco, CA 94102

SECTION 3. TERM
The lease term shall commence on February 1, 2026 and end on January 31, 2027.

SECTION 4. RENT
Monthly rent: $2,450.00
Due on the 1st of each month
Late fee: $150.00 after 5 days

SECTION 5. SECURITY DEPOSIT
Security deposit amount: $4,900.00 (Two months rent)

SECTION 6. UTILITIES
Tenant is responsible for: Electricity, Gas, Internet
Landlord is responsible for: Water, Garbage

SECTION 7. ENTRY BY LANDLORD
Landlord may enter the premises at any time without notice for inspections, repairs, or showings to prospective tenants.

SECTION 8. MAINTENANCE
Tenant shall be responsible for all repairs up to $500.00 per incident.

SECTION 9. ALTERATIONS
No alterations, additions, or improvements shall be made without prior written consent.

SECTION 10. PETS
No pets of any kind are permitted without additional deposit of $1,000.00.

SECTION 11. TERMINATION
Landlord may terminate this lease with 30 days notice for any reason.

SECTION 12. ATTORNEY FEES
In any legal action, the prevailing party shall be entitled to attorney's fees.`;

// Mock risk alerts
const mockAlerts = [
  {
    id: 1,
    severity: "high",
    title: "Illegal Entry Clause",
    section: "Section 7",
    description:
      "California law requires landlords to provide 24-hour notice before entering, except in emergencies. This clause allowing entry 'at any time without notice' is unenforceable and illegal.",
    recommendation: "Request amendment to include 24-hour notice requirement.",
  },
  {
    id: 2,
    severity: "high",
    title: "Excessive Security Deposit",
    section: "Section 5",
    description:
      "California limits security deposits to 2 months rent for unfurnished units. However, combined with last month's rent requirements, this may exceed legal limits.",
    recommendation: "Verify total move-in costs comply with CA Civil Code 1950.5.",
  },
  {
    id: 3,
    severity: "warning",
    title: "Unrestricted Termination",
    section: "Section 11",
    description:
      "The termination clause allows landlord to end lease with only 30 days notice 'for any reason'. In rent-controlled areas, this may violate just cause eviction requirements.",
    recommendation: "Verify if property is subject to SF rent control ordinance.",
  },
  {
    id: 4,
    severity: "warning",
    title: "Tenant Repair Responsibility",
    section: "Section 8",
    description:
      "Requiring tenant to pay for repairs up to $500 per incident may be excessive and could include items that are typically landlord responsibility.",
    recommendation: "Negotiate lower threshold or specify excluded items.",
  },
  {
    id: 5,
    severity: "safe",
    title: "Standard Late Fee",
    section: "Section 4",
    description:
      "Late fee of $150 after 5-day grace period is within reasonable limits under California law.",
    recommendation: "No action needed.",
  },
];

function getSeverityStyles(severity: string) {
  switch (severity) {
    case "high":
      return {
        bg: "bg-status-danger/10 border-status-danger/30",
        icon: AlertTriangle,
        iconColor: "text-status-danger",
        badge: "bg-status-danger text-foreground",
        label: "HIGH RISK",
      };
    case "warning":
      return {
        bg: "bg-status-warning/10 border-status-warning/30",
        icon: AlertCircle,
        iconColor: "text-status-warning",
        badge: "bg-status-warning text-background",
        label: "WARNING",
      };
    default:
      return {
        bg: "bg-status-success/10 border-status-success/30",
        icon: CheckCircle,
        iconColor: "text-status-success",
        badge: "bg-status-success text-background",
        label: "SAFE",
      };
  }
}

export default function LawyerPage() {
  const [hasLease, setHasLease] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-background px-6 py-4">
        <div className="flex items-center gap-2">
          <Scale className="h-5 w-5 text-primary" />
          <h1 className="font-mono text-lg font-bold">THE LAWYER</h1>
        </div>
        <p className="mt-1 font-mono text-sm text-muted-foreground">
          AI-Powered Lease Analysis & Risk Detection
        </p>
      </header>

      {hasLease ? (
        /* Split View */
        <div className="flex h-[calc(100vh-89px)]">
          {/* Left: PDF Text */}
          <div className="flex-1 overflow-auto border-r border-border p-6">
            <div className="mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono text-sm text-muted-foreground">
                lease_agreement_2026.pdf
              </span>
            </div>
            <Card className="border-border bg-card">
              <CardContent className="p-6">
                <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-foreground/90">
                  {mockLeaseText}
                </pre>
              </CardContent>
            </Card>
          </div>

          {/* Right: Risk Alerts */}
          <div className="w-[480px] overflow-auto bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-mono text-sm font-bold text-foreground">
                  RISK ANALYSIS
                </h2>
                <p className="font-mono text-xs text-muted-foreground">
                  {mockAlerts.length} issues detected
                </p>
              </div>
              <div className="flex gap-2">
                <Badge className="bg-status-danger font-mono text-xs text-foreground">
                  {mockAlerts.filter((a) => a.severity === "high").length} HIGH
                </Badge>
                <Badge className="bg-status-warning font-mono text-xs text-background">
                  {mockAlerts.filter((a) => a.severity === "warning").length} WARN
                </Badge>
              </div>
            </div>

            <div className="space-y-4">
              {mockAlerts.map((alert) => {
                const styles = getSeverityStyles(alert.severity);
                const Icon = styles.icon;
                return (
                  <Card
                    key={alert.id}
                    className={cn("border transition-all hover:shadow-md", styles.bg)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className={cn("h-5 w-5", styles.iconColor)} />
                          <CardTitle className="font-mono text-sm text-foreground">
                            {alert.title}
                          </CardTitle>
                        </div>
                        <Badge className={cn("font-mono text-[10px]", styles.badge)}>
                          {styles.label}
                        </Badge>
                      </div>
                      <span className="font-mono text-xs text-muted-foreground">
                        {alert.section}
                      </span>
                    </CardHeader>
                    <CardContent className="space-y-3 pb-4">
                      <p className="text-sm text-foreground/80">
                        {alert.description}
                      </p>
                      <div className="rounded-md bg-background/50 p-3">
                        <p className="font-mono text-xs text-primary">
                          RECOMMENDATION: {alert.recommendation}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Upload Zone */
        <div className="flex items-center justify-center p-12">
          <div
            onDragEnter={() => setIsDragging(true)}
            onDragLeave={() => setIsDragging(false)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              setHasLease(true);
            }}
            className={cn(
              "flex h-80 w-full max-w-2xl cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all duration-300",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border bg-card hover:border-primary/50 hover:bg-card/80"
            )}
            onClick={() => setHasLease(true)}
          >
            <div
              className={cn(
                "mb-4 flex h-16 w-16 items-center justify-center rounded-full transition-colors",
                isDragging ? "bg-primary/20" : "bg-secondary"
              )}
            >
              <Upload
                className={cn(
                  "h-8 w-8 transition-colors",
                  isDragging ? "text-primary" : "text-muted-foreground"
                )}
              />
            </div>
            <h3 className="font-mono text-lg font-bold text-foreground">
              DROP LEASE PDF HERE
            </h3>
            <p className="mt-2 font-mono text-sm text-muted-foreground">
              or click to browse files
            </p>
            <p className="mt-4 font-mono text-xs text-muted-foreground/60">
              Supported: PDF, DOC, DOCX (Max 10MB)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
