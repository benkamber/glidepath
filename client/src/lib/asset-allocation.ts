/**
 * Asset Allocation Calculator
 * SINGLE SOURCE OF TRUTH for calculating asset splits from net worth
 *
 * Critical: Do NOT use entry.cash (manual data entry) for calculations.
 * Always use allocation percentages × total net worth.
 */

import type { TargetAllocation } from '@/hooks/use-user-profile';

export interface AssetSplit {
  cashAssets: number;
  investmentAssets: number;
  otherAssets: number;
  total: number;
}

/**
 * Calculate actual asset splits based on allocation percentages
 *
 * Example:
 *   totalNetWorth: $4.5M
 *   allocation: { cashPercent: 0.05, investmentPercent: 0.95, otherPercent: 0 }
 *
 *   Result:
 *   - cashAssets: $225K (5%)
 *   - investmentAssets: $4.275M (95%)
 *   - otherAssets: $0 (0%)
 */
export function calculateAssetSplit(
  totalNetWorth: number,
  allocation?: TargetAllocation
): AssetSplit {
  // Default allocation if not provided: 20% cash, 70% investment, 10% other
  const defaultAllocation: TargetAllocation = {
    cashPercent: 0.20,
    investmentPercent: 0.70,
    otherPercent: 0.10,
  };

  const alloc = allocation || defaultAllocation;

  return {
    cashAssets: Math.round(totalNetWorth * alloc.cashPercent),
    investmentAssets: Math.round(totalNetWorth * alloc.investmentPercent),
    otherAssets: Math.round(totalNetWorth * alloc.otherPercent),
    total: totalNetWorth,
  };
}

/**
 * Validate that allocation percentages sum to 1.0 (100%)
 */
export function validateAllocation(allocation: TargetAllocation): boolean {
  const sum = allocation.cashPercent + allocation.investmentPercent + allocation.otherPercent;
  const tolerance = 0.01; // 1% tolerance for rounding
  return Math.abs(sum - 1.0) <= tolerance;
}

/**
 * Get asset allocation from profile with validation
 * Falls back to defaults if invalid
 */
export function getValidatedAllocation(allocation?: TargetAllocation): TargetAllocation {
  const defaultAllocation: TargetAllocation = {
    cashPercent: 0.20,
    investmentPercent: 0.70,
    otherPercent: 0.10,
  };

  if (!allocation) return defaultAllocation;
  if (!validateAllocation(allocation)) return defaultAllocation;

  return allocation;
}
