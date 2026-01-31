"use client";

import { useState, useRef } from "react";
import { Scale, Upload, FileText, AlertTriangle, AlertCircle, CheckCircle, Loader2, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface LegalReference {
  title: string;
  text: string;
  jurisdiction: string;
}

interface RiskFlag {
  type: string;
  excerpt: string;
  explanation: string;
  legalReference?: LegalReference;
  severity?: 'high' | 'warning' | 'info';
}

interface AnalysisResult {
  summary: string;
  flags: RiskFlag[];
  disclaimer: string;
  jurisdiction?: string;
  extractedText?: string;
}

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

const JURISDICTIONS = [
  { value: 'auto', label: 'Auto-detect from lease' },
  { value: 'Washington, DC', label: 'Washington, DC' },
  { value: 'San Francisco, California', label: 'San Francisco, California' },
  { value: 'Los Angeles, California', label: 'Los Angeles, California' },
  { value: 'New York City, New York', label: 'New York City, New York' },
  { value: 'Austin, Texas', label: 'Austin, Texas' },
  { value: 'Chicago, Illinois', label: 'Chicago, Illinois' },
  { value: 'Seattle, Washington', label: 'Seattle, Washington' },
  { value: 'Boston, Massachusetts', label: 'Boston, Massachusetts' },
];

export default function LawyerPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string>('auto');
  const [fileName, setFileName] = useState<string | null>(null);
  const [leaseText, setLeaseText] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      return;
    }

    setIsUploading(true);
    setError(null);
    setFileName(file.name);
    setLeaseText(null);
    setAnalysis(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      
      // Add jurisdiction if manually selected (skip if 'auto')
      if (selectedJurisdiction && selectedJurisdiction !== 'auto') {
        formData.append("jurisdiction", selectedJurisdiction);
      }

      const response = await fetch("/api/lease/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze lease");
      }

      const result: AnalysisResult = await response.json();
      setAnalysis(result);
      
      // Display the extracted PDF text
      setLeaseText(result.extractedText || "PDF content extracted and analyzed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setFileName(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleReset = () => {
    setFileName(null);
    setLeaseText(null);
    setAnalysis(null);
    setError(null);
    setSelectedJurisdiction('auto');
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-background px-4 md:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              <h1 className="font-mono text-lg font-bold">THE LAWYER</h1>
            </div>
            <p className="mt-1 font-mono text-sm text-muted-foreground">
              AI-Powered Lease Analysis & Risk Detection
            </p>
          </div>
          {!fileName && (
            <div className="flex items-center gap-2">
              <label className="font-mono text-xs text-muted-foreground">Jurisdiction:</label>
              <Select value={selectedJurisdiction} onValueChange={setSelectedJurisdiction}>
                <SelectTrigger className="w-[200px] font-mono text-xs">
                  <SelectValue placeholder="Auto-detect" />
                </SelectTrigger>
                <SelectContent>
                  {JURISDICTIONS.map((jur) => (
                    <SelectItem key={jur.value} value={jur.value}>
                      {jur.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </header>

      {fileName && analysis ? (
        /* Split View */
        <div className="flex flex-col lg:flex-row h-[calc(100vh-89px)]">
          {/* Left: PDF Text */}
          <div className="flex-1 overflow-auto border-r border-border p-6 animate-in slide-in-from-left duration-500">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-sm text-muted-foreground">
                  {fileName}
                </span>
              </div>
              <button
                onClick={handleReset}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-secondary"
              >
                <X className="h-3 w-3" />
                Upload New
              </button>
            </div>
            <Card className="border-border bg-card">
              <CardContent className="p-6">
                <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-foreground/90">
                  {leaseText || "PDF content extracted and analyzed."}
                </pre>
              </CardContent>
            </Card>
          </div>

          {/* Right: Risk Alerts */}
          <div className="w-full lg:w-[480px] overflow-auto bg-card p-6 border-t lg:border-t-0 border-border animate-in slide-in-from-right duration-500">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="font-mono text-sm font-bold text-foreground">
                    RISK ANALYSIS
                  </h2>
                  <p className="font-mono text-xs text-muted-foreground">
                    {analysis.flags.length} {analysis.flags.length === 1 ? "issue" : "issues"} detected
                  </p>
                </div>
              </div>
            </div>

            {analysis.flags.length > 0 ? (
              <div className="space-y-4">
                {analysis.flags.map((flag, index) => {
                  const severity = flag.severity || (flag.type === "illegal_entry" || flag.type === "deposit_risk" ? "high" : "warning");
                  const styles = getSeverityStyles(severity);
                  const Icon = styles.icon;
                  return (
                    <Card
                      key={index}
                      className={cn("border transition-all hover:shadow-lg hover:-translate-y-1 duration-200", styles.bg)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className={cn("h-5 w-5", styles.iconColor)} />
                            <CardTitle className="font-mono text-sm text-foreground capitalize">
                              {flag.legalReference?.title || flag.type.replace(/_/g, " ")}
                            </CardTitle>
                          </div>
                          <Badge className={cn("font-mono text-[10px]", styles.badge)}>
                            {styles.label}
                          </Badge>
                        </div>
                        {flag.legalReference && (
                          <p className="font-mono text-xs text-muted-foreground mt-1">
                            {flag.legalReference.jurisdiction}
                          </p>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-3 pb-4">
                        <div className="rounded-md bg-background/50 p-3">
                          <p className="font-mono text-xs text-muted-foreground mb-2">LEASE EXCERPT:</p>
                          <p className="text-sm text-foreground/80 italic">
                            "{flag.excerpt}"
                          </p>
                        </div>
                        <p className="text-sm text-foreground/80">
                          {flag.explanation}
                        </p>
                        {flag.legalReference && (
                          <div className="rounded-md bg-primary/5 border border-primary/20 p-3 mt-3">
                            <p className="font-mono text-xs text-primary mb-2 font-bold">
                              LEGAL REFERENCE:
                            </p>
                            <p className="text-xs text-foreground/90">
                              {flag.legalReference.text}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="border border-status-success/30 bg-status-success/10">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-status-success" />
                    <p className="font-mono text-sm text-foreground">
                      No obvious risky clauses detected
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {analysis.disclaimer && (
              <div className="mt-6 rounded-md bg-muted/50 p-4">
                <p className="font-mono text-xs text-muted-foreground">
                  {analysis.disclaimer}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Upload Zone */
        <div className="flex items-center justify-center p-12">
          <div
            onDragEnter={() => setIsDragging(true)}
            onDragLeave={() => setIsDragging(false)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className={cn(
              "flex h-80 w-full max-w-2xl cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all duration-300",
              isDragging
                ? "border-primary bg-primary/5 scale-105 shadow-lg shadow-primary/20"
                : "border-border bg-card hover:border-primary/50 hover:bg-card/80 hover:scale-[1.02]",
              isUploading && "pointer-events-none opacity-50"
            )}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div
              className={cn(
                "mb-4 flex h-16 w-16 items-center justify-center rounded-full transition-all duration-300",
                isDragging ? "bg-primary/20 scale-110 rotate-12" : "bg-secondary hover:scale-110"
              )}
            >
              {isUploading ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              ) : (
                <Upload
                  className={cn(
                    "h-8 w-8 transition-colors",
                    isDragging ? "text-primary" : "text-muted-foreground"
                  )}
                />
              )}
            </div>
            <h3 className="font-mono text-lg font-bold text-foreground">
              {isUploading ? "ANALYZING LEASE..." : "DROP LEASE PDF HERE"}
            </h3>
            <p className="mt-2 font-mono text-sm text-muted-foreground">
              {isUploading ? "Please wait..." : "or click to browse files"}
            </p>
            <p className="mt-4 font-mono text-xs text-muted-foreground/60">
              Supported: PDF (Max 10MB)
            </p>
            {error && (
              <div className="mt-4 rounded-md bg-status-danger/10 border border-status-danger/30 px-4 py-2">
                <p className="font-mono text-xs text-status-danger">{error}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
