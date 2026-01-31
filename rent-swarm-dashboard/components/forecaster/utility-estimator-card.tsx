"use client";

import { useState } from "react";
import { Zap, Flame, Droplets, Wifi, Edit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils/format";
import { createManualUtility } from "@/lib/utils/utility-estimator";
import type { UtilityCost } from "@/lib/types/rental";

interface UtilityEstimatorCardProps {
  utilities: UtilityCost;
  propertyInfo: {
    sqft: number;
    beds: number;
    city: string;
  };
  onUpdate?: (utilities: UtilityCost) => void;
}

export function UtilityEstimatorCard({ utilities, propertyInfo, onUpdate }: UtilityEstimatorCardProps) {
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualValues, setManualValues] = useState({
    electric: utilities.breakdown.electric,
    gas: utilities.breakdown.gas,
    water: utilities.breakdown.water,
    internet: utilities.breakdown.internet,
  });

  const handleManualUpdate = () => {
    const manualUtility = createManualUtility(
      manualValues.electric,
      manualValues.gas,
      manualValues.water,
      manualValues.internet
    );
    onUpdate?.(manualUtility);
  };

  const handleToggleMode = () => {
    if (isManualMode) {
      // Reset to auto values when switching back
      setManualValues({
        electric: utilities.breakdown.electric,
        gas: utilities.breakdown.gas,
        water: utilities.breakdown.water,
        internet: utilities.breakdown.internet,
      });
    }
    setIsManualMode(!isManualMode);
  };

  const maxUtility = Math.max(
    utilities.breakdown.electric,
    utilities.breakdown.gas,
    utilities.breakdown.water,
    utilities.breakdown.internet
  );

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 font-mono text-sm">
            <Zap className="h-4 w-4 text-primary" />
            UTILITY COST ESTIMATOR
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleMode}
            className="h-7 font-mono text-[10px]"
          >
            <Edit className="mr-1 h-3 w-3" />
            {isManualMode ? 'AUTO' : 'MANUAL'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Estimation Method Badge */}
        <div className="mb-4 rounded-lg border border-border bg-secondary/50 p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-xs text-muted-foreground">
                Estimation Method
              </p>
              <Badge className="mt-1 bg-primary/10 text-primary font-mono text-[10px] border-0">
                {isManualMode ? 'MANUAL OVERRIDE' : 'AUTO (SQFT-BASED)'}
              </Badge>
            </div>
            <div className="text-right">
              <p className="font-mono text-xs text-muted-foreground">Based on</p>
              <p className="font-mono text-xs font-medium text-foreground">
                {propertyInfo.sqft.toLocaleString()} sqft • {propertyInfo.beds} BR
              </p>
            </div>
          </div>
        </div>

        {/* Utility Breakdown */}
        <div className="space-y-3 mb-4">
          {/* Electric */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-chart-2" />
                <span className="font-mono text-xs text-muted-foreground">Electric</span>
              </div>
              {isManualMode ? (
                <Input
                  type="number"
                  value={manualValues.electric}
                  onChange={(e) => setManualValues({ ...manualValues, electric: Number(e.target.value) })}
                  className="h-7 w-24 font-mono text-xs text-right"
                />
              ) : (
                <span className="font-mono text-sm font-medium text-foreground">
                  {formatCurrency(utilities.breakdown.electric)}/mo
                </span>
              )}
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-chart-2 transition-all"
                style={{ width: `${(utilities.breakdown.electric / maxUtility) * 100}%` }}
              />
            </div>
          </div>

          {/* Gas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-500" />
                <span className="font-mono text-xs text-muted-foreground">Gas</span>
              </div>
              {isManualMode ? (
                <Input
                  type="number"
                  value={manualValues.gas}
                  onChange={(e) => setManualValues({ ...manualValues, gas: Number(e.target.value) })}
                  className="h-7 w-24 font-mono text-xs text-right"
                />
              ) : (
                <span className="font-mono text-sm font-medium text-foreground">
                  {formatCurrency(utilities.breakdown.gas)}/mo
                </span>
              )}
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-orange-500 transition-all"
                style={{ width: `${(utilities.breakdown.gas / maxUtility) * 100}%` }}
              />
            </div>
          </div>

          {/* Water */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-blue-500" />
                <span className="font-mono text-xs text-muted-foreground">Water</span>
              </div>
              {isManualMode ? (
                <Input
                  type="number"
                  value={manualValues.water}
                  onChange={(e) => setManualValues({ ...manualValues, water: Number(e.target.value) })}
                  className="h-7 w-24 font-mono text-xs text-right"
                />
              ) : (
                <span className="font-mono text-sm font-medium text-foreground">
                  {formatCurrency(utilities.breakdown.water)}/mo
                </span>
              )}
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${(utilities.breakdown.water / maxUtility) * 100}%` }}
              />
            </div>
          </div>

          {/* Internet */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4 text-purple-500" />
                <span className="font-mono text-xs text-muted-foreground">Internet</span>
              </div>
              {isManualMode ? (
                <Input
                  type="number"
                  value={manualValues.internet}
                  onChange={(e) => setManualValues({ ...manualValues, internet: Number(e.target.value) })}
                  className="h-7 w-24 font-mono text-xs text-right"
                />
              ) : (
                <span className="font-mono text-sm font-medium text-foreground">
                  {formatCurrency(utilities.breakdown.internet)}/mo
                </span>
              )}
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-purple-500 transition-all"
                style={{ width: `${(utilities.breakdown.internet / maxUtility) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Apply Button (only in manual mode) */}
        {isManualMode && (
          <Button
            onClick={handleManualUpdate}
            className="w-full font-mono text-sm mb-4"
            variant="secondary"
          >
            APPLY MANUAL VALUES
          </Button>
        )}

        {/* Total */}
        <div className="flex items-center justify-between rounded-lg bg-primary/10 p-4 border border-primary/20">
          <span className="font-mono text-sm font-medium text-foreground">
            Total Utilities
          </span>
          <span className="font-mono text-2xl font-bold text-primary">
            {formatCurrency(utilities.estimated)}/mo
          </span>
        </div>

        {/* Info Note */}
        <div className="mt-4 rounded-lg border border-border bg-secondary/50 p-3">
          <p className="font-mono text-xs text-muted-foreground">
            <span className="text-primary">Note:</span> Estimates based on property size, bedroom count, and local climate factors. Actual costs may vary by season and usage.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
