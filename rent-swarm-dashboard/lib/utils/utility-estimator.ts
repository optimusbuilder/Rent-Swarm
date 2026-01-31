import type { UtilityCost } from '../types/rental';

interface UtilityEstimateParams {
  sqft: number;
  bedrooms: number;
  city: string;
  state?: string;
}

/**
 * Get climate factor based on city
 */
function getClimateFactor(city: string): number {
  const cityLower = city.toLowerCase();

  // Hot cities (higher AC usage)
  const hotCities = ['phoenix', 'las vegas', 'miami', 'houston', 'dallas', 'austin', 'orlando', 'tampa'];
  if (hotCities.some(c => cityLower.includes(c))) {
    return 1.3;
  }

  // Cold cities (higher heating usage)
  const coldCities = ['minneapolis', 'boston', 'chicago', 'detroit', 'milwaukee', 'buffalo', 'cleveland'];
  if (coldCities.some(c => cityLower.includes(c))) {
    return 1.4;
  }

  // Moderate climate
  return 1.0;
}

/**
 * Estimate monthly utility costs based on property characteristics
 */
export function estimateUtilities(params: UtilityEstimateParams): UtilityCost {
  const { sqft, bedrooms, city } = params;

  // Base cost by bedroom count
  const baseElectric = bedrooms === 0 || bedrooms === 1 ? 70 :
                       bedrooms === 2 ? 90 :
                       bedrooms === 3 ? 120 : 150;

  const baseGas = bedrooms <= 2 ? 40 : 60;
  const baseWater = 30 + (bedrooms * 10);
  const baseInternet = 60; // Standard high-speed

  // Size adjustment (per sqft over 500)
  const sizeMultiplier = sqft > 500 ? 1 + ((sqft - 500) / 1000) * 0.15 : 1;

  // Climate factor
  const climateFactor = getClimateFactor(city);

  // Calculate individual utility costs
  const electric = Math.round(baseElectric * sizeMultiplier * climateFactor);
  const gas = Math.round(baseGas * sizeMultiplier * climateFactor);
  const water = Math.round(baseWater * sizeMultiplier);
  const internet = baseInternet;

  const estimated = electric + gas + water + internet;

  return {
    estimated,
    breakdown: {
      electric,
      gas,
      water,
      internet,
    },
    estimationMethod: 'sqft-based',
  };
}

/**
 * Create manual utility cost object
 */
export function createManualUtility(
  electric: number,
  gas: number,
  water: number,
  internet: number
): UtilityCost {
  return {
    estimated: electric + gas + water + internet,
    breakdown: {
      electric,
      gas,
      water,
      internet,
    },
    estimationMethod: 'manual',
  };
}
