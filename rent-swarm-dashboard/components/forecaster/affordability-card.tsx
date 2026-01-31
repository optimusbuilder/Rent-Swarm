"use client";

import { useState, useEffect } from "react";
import { DollarSign, TrendingDown, TrendingUp, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { calculateAffordability, getRequiredIncome } from "@/lib/utils/affordability";
import { formatCurrency, formatPercentage, getAffordabilityColor, getAffordabilityLabel } from "@/lib/utils/format";
import type { AffordabilityAnalysis } from "@/lib/types/rental";

interface AffordabilityCardProps {
  remc: number;
}

export function AffordabilityCard({ remc }: AffordabilityCardProps) {
  const [monthlyIncome, setMonthlyIncome] = useState<string>("");
  const [analysis, setAnalysis] = useState<AffordabilityAnalysis | null>(null);

  useEffect(() => {
    const income = parseFloat(monthlyIncome);
    if (income && income > 0) {
      setAnalysis(calculateAffordability(remc, income));
    } else {
      setAnalysis(null);
    }
  }, [monthlyIncome, remc]);

  const requiredIncome = getRequiredIncome(remc);
  const colors = analysis ? getAffordabilityColor(analysis.percentage) : null;
  const label = analysis ? getAffordabilityLabel(analysis.percentage) : null;

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 font-mono text-sm">
          <DollarSign className="h-4 w-4 text-primary" />
          AFFORDABILITY ANALYSIS
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Income Input */}
        <div className="mb-4">
          <label className="mb-2 block font-mono text-xs text-muted-foreground">
            Monthly Gross Income
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="number"
              placeholder="Enter your monthly income..."
              value={monthlyIncome}
              onChange={(e) => setMonthlyIncome(e.target.value)}
              className="pl-10 font-mono text-sm bg-secondary border-border"
            />
          </div>
        </div>

        {analysis ? (
          <>
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between font-mono text-xs">
                <span className="text-muted-foreground">REMC vs Income</span>
                <span className={colors?.text}>
                  {formatPercentage(analysis.percentage, 1)} of income
                </span>
              </div>
              <div className="relative h-6 overflow-hidden rounded-lg border border-border bg-secondary">
                <div
                  className={`h-full transition-all duration-500 ${analysis.isAffordable ? 'bg-status-success' : analysis.percentage <= 40 ? 'bg-status-warning' : 'bg-status-danger'}`}
                  style={{ width: `${Math.min(analysis.percentage, 100)}%` }}
                />
                {/* 30% threshold marker */}
                <div className="absolute left-[30%] top-0 h-full w-0.5 bg-background">
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 font-mono text-[10px] text-muted-foreground">
                    30%
                  </div>
                </div>
              </div>
              <div className="mt-1 font-mono text-[10px] text-muted-foreground text-center">
                Safe Zone: ≤30% of income
              </div>
            </div>

            {/* Status Badge */}
            <div className={`mb-4 flex items-center gap-3 rounded-lg border p-4 ${colors?.border} ${colors?.bg}`}>
              {analysis.isAffordable ? (
                <TrendingDown className={`h-5 w-5 ${colors?.text}`} />
              ) : (
                <TrendingUp className={`h-5 w-5 ${colors?.text}`} />
              )}
              <div className="flex-1">
                <Badge className={`font-mono text-xs ${colors?.bg} ${colors?.text} border-0`}>
                  {label}
                </Badge>
                <p className="mt-1 font-mono text-sm font-medium text-foreground">
                  {analysis.isAffordable ? (
                    <>
                      {formatCurrency(Math.abs(analysis.surplus))} under 30% threshold
                    </>
                  ) : (
                    <>
                      {formatCurrency(Math.abs(analysis.surplus))} over 30% threshold
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Breakdown */}
            <div className="space-y-3 rounded-lg bg-secondary/50 p-4">
              <div className="flex items-center justify-between font-mono text-sm">
                <span className="text-muted-foreground">Required Income (30%):</span>
                <span className="font-bold text-foreground">
                  {formatCurrency(analysis.recommendedMaxRent)}/mo
                </span>
              </div>
              <div className="flex items-center justify-between font-mono text-sm">
                <span className="text-muted-foreground">Your Income:</span>
                <span className="font-bold text-foreground">
                  {formatCurrency(analysis.monthlyIncome)}/mo
                </span>
              </div>
              <div className="flex items-center justify-between font-mono text-sm">
                <span className="text-muted-foreground">REMC:</span>
                <span className="font-bold text-foreground">
                  {formatCurrency(analysis.remc)}/mo
                </span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex items-center justify-between font-mono text-sm">
                <span className={`font-medium ${colors?.text}`}>
                  Monthly {analysis.surplus >= 0 ? 'Surplus' : 'Deficit'}:
                </span>
                <span className={`font-bold ${colors?.text}`}>
                  {analysis.surplus >= 0 ? '+' : ''}{formatCurrency(analysis.surplus)}
                </span>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* No Income Entered State */}
            <div className="mb-4 flex flex-col items-center justify-center rounded-lg bg-secondary/50 p-8 text-center">
              <AlertCircle className="h-8 w-8 text-muted-foreground/40 mb-3" />
              <p className="font-mono text-xs text-muted-foreground">
                Enter your monthly income above to see affordability analysis
              </p>
            </div>

            {/* Required Income Display */}
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="mb-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Required Monthly Income
              </p>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-3xl font-bold text-foreground">
                  {formatCurrency(requiredIncome)}
                </span>
                <span className="font-mono text-sm text-muted-foreground">/month</span>
              </div>
              <p className="mt-2 font-mono text-xs text-muted-foreground">
                To afford this property at 30% of income
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
