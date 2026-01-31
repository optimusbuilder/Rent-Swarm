import type { AffordabilityAnalysis } from '../types/rental';

/**
 * Calculate affordability analysis based on REMC and monthly income
 * Uses the 30% rule: Housing costs should not exceed 30% of gross monthly income
 */
export function calculateAffordability(
  remc: number,
  monthlyIncome: number
): AffordabilityAnalysis {
  const percentage = (remc / monthlyIncome) * 100;
  const recommendedMaxRent = monthlyIncome * 0.30;
  const surplus = recommendedMaxRent - remc;

  return {
    monthlyIncome,
    remc,
    percentage,
    isAffordable: percentage <= 30,
    recommendedMaxRent,
    surplus,
  };
}

/**
 * Calculate the minimum required income to afford a given REMC
 * Based on 30% rule
 */
export function getRequiredIncome(remc: number): number {
  return remc / 0.30;
}

/**
 * Calculate annual income requirement
 */
export function getRequiredAnnualIncome(remc: number): number {
  return getRequiredIncome(remc) * 12;
}
