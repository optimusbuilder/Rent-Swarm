import { estimateUtilities } from './utility-estimator';
import type { RentalListing, REMCData, REMCResult, CommuteCost, HiddenFees } from '../types/rental';

/**
 * Initialize REMC data with default estimates for a rental listing
 */
export function initializeREMCData(listing: RentalListing): REMCData {
  return {
    listing,
    utilities: estimateUtilities({
      sqft: listing.sqft,
      bedrooms: listing.beds,
      city: listing.city,
    }),
    commute: {
      dailyCost: 0,
      monthlyCost: 0,
      distance: 0,
      duration: 0,
      method: 'driving',
    },
    fees: {
      total: 50, // Default estimate
      items: [
        { name: 'Trash Valet', amount: 25, category: 'service' },
        { name: 'Package Locker', amount: 10, category: 'service' },
        { name: 'Admin Fee', amount: 15, category: 'administrative' },
      ],
    },
    insurance: 20, // Default renters insurance estimate
    parking: 0,
  };
}

/**
 * Calculate the Real Effective Monthly Cost (REMC) from REMC data
 */
export function calculateREMC(data: REMCData): REMCResult {
  const baseRent = data.listing.price;
  const utilities = data.utilities.estimated;
  const commute = data.commute.monthlyCost;
  const fees = data.fees.total;
  const insurance = data.insurance || 0;
  const parking = data.parking || 0;

  const total = baseRent + utilities + commute + fees + insurance + parking;
  const hiddenCostTotal = total - baseRent;

  return {
    baseRent,
    utilities,
    commute,
    fees,
    insurance,
    parking,
    total,
    hiddenCostTotal,
  };
}

/**
 * Calculate commute cost based on distance
 * @param distanceMiles One-way distance in miles
 * @param daysPerMonth Number of commute days per month (default: 20)
 * @param irsRate IRS mileage rate (default: $0.70 for 2025)
 */
export function calculateCommuteCost(
  distanceMiles: number,
  daysPerMonth: number = 20,
  irsRate: number = 0.70
): number {
  const roundTripMiles = distanceMiles * 2;
  const dailyCost = roundTripMiles * irsRate;
  const monthlyCost = dailyCost * daysPerMonth;
  return monthlyCost;
}

/**
 * Create a CommuteCost object from distance and duration
 */
export function createCommuteCost(
  distanceMiles: number,
  durationMinutes: number,
  origin: string,
  destination: string,
  method: 'driving' | 'transit' | 'bike' | 'walk' = 'driving'
): CommuteCost {
  const dailyCost = method === 'driving' ? (distanceMiles * 2 * 0.70) : 0;
  const monthlyCost = dailyCost * 20;

  return {
    dailyCost,
    monthlyCost,
    distance: distanceMiles,
    duration: durationMinutes,
    method,
    route: {
      origin,
      destination,
    },
  };
}

/**
 * Update hidden fees total based on items
 */
export function calculateHiddenFeesTotal(items: HiddenFees['items']): number {
  return items.reduce((total, item) => total + item.amount, 0);
}

/**
 * Get default hidden fees
 */
export function getDefaultHiddenFees(): HiddenFees {
  return {
    total: 50,
    items: [
      { name: 'Trash Valet', amount: 25, category: 'service' },
      { name: 'Package Locker', amount: 10, category: 'service' },
      { name: 'Admin Fee', amount: 15, category: 'administrative' },
    ],
  };
}
