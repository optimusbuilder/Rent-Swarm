"use client";

import { useState } from "react";
import {
  TrendingUp,
  ArrowRight,
  MapPin,
  Car,
  TriangleAlert,
  DollarSign,
  Zap,
  Trash2,
  Package,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Dummy data
const costBreakdown = {
  rent: 2000,
  utilities: 150,
  commute: 100,
  fees: 50,
};

const hiddenFees = [
  { name: "Trash Valet", amount: 25, icon: Trash2 },
  { name: "Package Locker", amount: 10, icon: Package },
  { name: "Admin Fee", amount: 15, icon: FileText },
];

const totalRemc =
  costBreakdown.rent +
  costBreakdown.utilities +
  costBreakdown.commute +
  costBreakdown.fees;

export default function ForecasterPage() {
  const [destination, setDestination] = useState("");

  // Calculate percentages for the stacked bar
  const rentPercent = (costBreakdown.rent / totalRemc) * 100;
  const utilitiesPercent = (costBreakdown.utilities / totalRemc) * 100;
  const commutePercent = (costBreakdown.commute / totalRemc) * 100;
  const feesPercent = (costBreakdown.fees / totalRemc) * 100;

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <header className="mb-6 flex items-center gap-3">
        <TrendingUp className="h-6 w-6 text-primary" />
        <div>
          <h1 className="font-mono text-xl font-bold tracking-tight">
            THE FORECASTER
          </h1>
          <p className="font-mono text-xs text-muted-foreground">
            Real Effective Monthly Cost Analysis
          </p>
        </div>
      </header>

      {/* Hero Section - The "Truth" Reveal */}
      <Card className="mb-6 overflow-hidden border-border bg-card">
        <CardContent className="p-0">
          <div className="flex items-stretch">
            {/* Advertised Rent */}
            <div className="flex flex-1 flex-col items-center justify-center bg-secondary/50 p-8">
              <p className="mb-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Advertised Rent
              </p>
              <p className="font-mono text-5xl font-bold text-muted-foreground">
                $2,000
              </p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                /month
              </p>
            </div>

            {/* Arrow */}
            <div className="flex items-center justify-center bg-gradient-to-r from-secondary/50 to-status-warning/10 px-6">
              <div className="flex flex-col items-center gap-2">
                <ArrowRight className="h-8 w-8 text-status-warning" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Reality
                </span>
              </div>
            </div>

            {/* Real Monthly Cost */}
            <div className="flex flex-1 flex-col items-center justify-center bg-status-warning/10 p-8">
              <p className="mb-2 font-mono text-xs uppercase tracking-widest text-status-warning">
                Real Monthly Cost
              </p>
              <p className="font-mono text-5xl font-bold text-status-warning">
                ${totalRemc.toLocaleString()}
              </p>
              <p className="mt-1 font-mono text-xs text-status-warning/80">
                /month (REMC)
              </p>
              <Badge className="mt-3 bg-status-danger/20 text-status-danger font-mono text-xs">
                +${(totalRemc - costBreakdown.rent).toLocaleString()} hidden
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Equation */}
      <Card className="mb-6 border-border bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 font-mono text-sm">
            <Zap className="h-4 w-4 text-primary" />
            COST EQUATION
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Formula Display */}
          <div className="mb-6 flex flex-wrap items-center justify-center gap-2 rounded-lg bg-secondary/50 p-4 font-mono text-sm">
            <span className="rounded bg-chart-1/20 px-2 py-1 text-chart-1">
              Base Rent
            </span>
            <span className="text-muted-foreground">+</span>
            <span className="rounded bg-chart-2/20 px-2 py-1 text-chart-2">
              Utilities
            </span>
            <span className="text-muted-foreground">+</span>
            <span className="rounded bg-chart-3/20 px-2 py-1 text-chart-3">
              (Commute × 20)
            </span>
            <span className="text-muted-foreground">+</span>
            <span className="rounded bg-chart-4/20 px-2 py-1 text-chart-4">
              Hidden Fees
            </span>
            <span className="text-muted-foreground">=</span>
            <span className="rounded bg-status-warning/20 px-2 py-1 font-bold text-status-warning">
              REMC
            </span>
          </div>

          {/* Stacked Bar Chart */}
          <div className="mb-4">
            <div className="flex h-12 w-full overflow-hidden rounded-lg">
              <div
                className="flex items-center justify-center bg-chart-1 transition-all"
                style={{ width: `${rentPercent}%` }}
              >
                <span className="font-mono text-xs font-bold text-background">
                  ${costBreakdown.rent}
                </span>
              </div>
              <div
                className="flex items-center justify-center bg-chart-2 transition-all"
                style={{ width: `${utilitiesPercent}%` }}
              >
                <span className="font-mono text-[10px] font-bold text-background">
                  ${costBreakdown.utilities}
                </span>
              </div>
              <div
                className="flex items-center justify-center bg-chart-3 transition-all"
                style={{ width: `${commutePercent}%` }}
              >
                <span className="font-mono text-[10px] font-bold text-background">
                  ${costBreakdown.commute}
                </span>
              </div>
              <div
                className="flex items-center justify-center bg-chart-4 transition-all"
                style={{ width: `${feesPercent}%` }}
              >
                <span className="font-mono text-[10px] font-bold text-background">
                  ${costBreakdown.fees}
                </span>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-chart-1" />
              <span className="text-muted-foreground">
                Rent (${costBreakdown.rent})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-chart-2" />
              <span className="text-muted-foreground">
                Utilities (${costBreakdown.utilities})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-chart-3" />
              <span className="text-muted-foreground">
                Commute (${costBreakdown.commute})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-chart-4" />
              <span className="text-muted-foreground">
                Fees (${costBreakdown.fees})
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Commute Calculator */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 font-mono text-sm">
              <Car className="h-4 w-4 text-primary" />
              COMMUTE CALCULATOR
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Input */}
            <div className="mb-4">
              <label className="mb-2 block font-mono text-xs text-muted-foreground">
                Daily Destination
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Enter workplace or university address..."
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="pl-10 font-mono text-sm bg-secondary border-border"
                />
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="relative mb-4 h-40 overflow-hidden rounded-lg border border-border bg-secondary">
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <MapPin className="h-8 w-8 text-muted-foreground/40" />
                <span className="mt-2 font-mono text-xs text-muted-foreground">
                  [MAP INTEGRATION]
                </span>
                <span className="font-mono text-[10px] text-muted-foreground/60">
                  Google Maps / Mapbox
                </span>
              </div>
              {/* Corner accents */}
              <div className="absolute left-2 top-2 h-4 w-4 border-l border-t border-primary/40" />
              <div className="absolute right-2 top-2 h-4 w-4 border-r border-t border-primary/40" />
              <div className="absolute bottom-2 left-2 h-4 w-4 border-b border-l border-primary/40" />
              <div className="absolute bottom-2 right-2 h-4 w-4 border-b border-r border-primary/40" />
            </div>

            {/* Commute Cost Badge */}
            <div className="flex items-center justify-between rounded-lg bg-chart-3/10 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-3/20">
                  <Car className="h-5 w-5 text-chart-3" />
                </div>
                <div>
                  <p className="font-mono text-xs text-muted-foreground">
                    Estimated Commute Cost
                  </p>
                  <p className="font-mono text-sm font-medium text-foreground">
                    15 min drive • 8.2 miles
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono text-2xl font-bold text-chart-3">
                  $5.00
                </p>
                <p className="font-mono text-xs text-muted-foreground">
                  /day ($100/mo)
                </p>
              </div>
            </div>

            <Button className="mt-4 w-full font-mono text-sm">
              <MapPin className="mr-2 h-4 w-4" />
              CALCULATE ROUTE
            </Button>
          </CardContent>
        </Card>

        {/* Hidden Fee Detector */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 font-mono text-sm">
              <TriangleAlert className="h-4 w-4 text-status-warning" />
              DETECTED SURCHARGES
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {hiddenFees.map((fee) => (
                <div
                  key={fee.name}
                  className="flex items-center justify-between rounded-lg border border-status-warning/20 bg-status-warning/5 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-status-warning/10">
                      <fee.icon className="h-5 w-5 text-status-warning" />
                    </div>
                    <div>
                      <p className="font-mono text-sm font-medium text-foreground">
                        {fee.name}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">
                        Monthly surcharge
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TriangleAlert className="h-4 w-4 text-status-warning" />
                    <span className="font-mono text-lg font-bold text-status-warning">
                      +${fee.amount}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Hidden Fees */}
            <div className="mt-4 flex items-center justify-between rounded-lg bg-status-danger/10 p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-status-danger" />
                <span className="font-mono text-sm font-medium text-foreground">
                  Total Hidden Fees
                </span>
              </div>
              <span className="font-mono text-xl font-bold text-status-danger">
                +${hiddenFees.reduce((sum, fee) => sum + fee.amount, 0)}/mo
              </span>
            </div>

            {/* Warning Note */}
            <div className="mt-4 rounded-lg border border-border bg-secondary/50 p-3">
              <p className="font-mono text-xs text-muted-foreground">
                <span className="text-status-warning">Note:</span> These fees
                are often buried in lease addendums and not disclosed in the
                listing price. The Forecaster automatically detects and surfaces
                them.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
