// Core Listing Data (matches Scout structure)
export interface RentalListing {
  id: string | number;
  price: number; // Base monthly rent
  address: string;
  city: string;
  beds: number;
  baths: number;
  sqft: number;
  image?: string;
  scamScore?: number;
  verified?: boolean;
}

// Utility cost breakdown with estimation details
export interface UtilityCost {
  estimated: number;
  breakdown: {
    electric: number;
    gas: number;
    water: number;
    internet: number;
  };
  estimationMethod: 'sqft-based' | 'manual' | 'historical';
}

// Commute cost details
export interface CommuteCost {
  dailyCost: number;
  monthlyCost: number; // dailyCost × 20 workdays
  distance: number; // miles
  duration: number; // minutes
  method: 'driving' | 'transit' | 'bike' | 'walk';
  route?: {
    origin: string;
    destination: string;
  };
}

// Individual fee item
export interface FeeItem {
  name: string;
  amount: number;
  icon?: string; // lucide-react icon name
  category: 'utility' | 'service' | 'administrative' | 'amenity';
}

// Hidden fees collection
export interface HiddenFees {
  total: number;
  items: FeeItem[];
}

// Extended data for REMC calculations
export interface REMCData {
  listing: RentalListing;
  utilities: UtilityCost;
  commute: CommuteCost;
  fees: HiddenFees;
  insurance?: number; // Renters insurance
  parking?: number;
}

// Final REMC calculation result
export interface REMCResult {
  baseRent: number;
  utilities: number;
  commute: number;
  fees: number;
  insurance: number;
  parking: number;
  total: number;
  hiddenCostTotal: number; // Everything except base rent
}

// Affordability analysis result
export interface AffordabilityAnalysis {
  monthlyIncome: number;
  remc: number;
  percentage: number; // What % of income REMC represents
  isAffordable: boolean; // <= 30%
  recommendedMaxRent: number; // Max REMC at 30% threshold
  surplus: number; // positive = affordable, negative = over budget
}

// For multi-property comparison
export interface PropertyComparison {
  properties: REMCData[];
  userIncome?: number;
  commuteDestination?: string;
}
