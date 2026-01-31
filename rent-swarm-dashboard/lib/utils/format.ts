/**
 * Format a number as currency (USD)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a number as currency with cents
 */
export function formatCurrencyWithCents(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a number as a percentage
 */
export function formatPercentage(value: number, decimals: number = 0): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format a number with commas
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

/**
 * Get color class based on affordability percentage
 */
export function getAffordabilityColor(percentage: number): {
  text: string;
  bg: string;
  border: string;
} {
  if (percentage <= 30) {
    return {
      text: 'text-status-success',
      bg: 'bg-status-success/10',
      border: 'border-status-success',
    };
  }
  if (percentage <= 40) {
    return {
      text: 'text-status-warning',
      bg: 'bg-status-warning/10',
      border: 'border-status-warning',
    };
  }
  return {
    text: 'text-status-danger',
    bg: 'bg-status-danger/10',
    border: 'border-status-danger',
  };
}

/**
 * Get label for affordability status
 */
export function getAffordabilityLabel(percentage: number): string {
  if (percentage <= 30) return 'AFFORDABLE';
  if (percentage <= 40) return 'BORDERLINE';
  return 'OVER BUDGET';
}
