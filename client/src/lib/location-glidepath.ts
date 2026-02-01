// Location-aware FIRE glidepath projections
// Shows how city cost tier affects years-to-FIRE across 5 cost tiers

import { LOCATION_TIERS, type LocationTier, getMetroTier } from './location-tiers';
import { calculateFIRENumber, calculateYearsToFIRE } from './fire-calculations';

export interface LocationGlidepathInputs {
  currentNetWorth: number;
  currentAge: number;
  annualIncome: number;
  currentMetro: string;
  savingsRatePercent: number;      // 0-100
  expectedReturn: number;          // e.g. 0.07
  withdrawalRate: number;          // e.g. 0.04
  incomeAdjustByLocation: boolean; // false = remote work (keep full income)
}

export interface TierProjection {
  tier: LocationTier;
  fireNumber: number;
  yearsToFIRE: number;
  fireAge: number;
  deltaFromCurrent: number; // positive = reaches FI faster than current metro
  yearByYear: { year: number; age: number; netWorth: number; phase: 'accumulating' | 'fi' }[];
}

const INCOME_MULTIPLIERS: Record<number, number> = {
  1: 0.40,
  2: 0.60,
  3: 0.80,
  4: 1.00,
  5: 1.15,
};

function projectTier(inputs: LocationGlidepathInputs, tier: LocationTier): TierProjection {
  const {
    currentNetWorth,
    currentAge,
    annualIncome,
    savingsRatePercent,
    expectedReturn,
    withdrawalRate,
    incomeAdjustByLocation,
  } = inputs;

  const incomeMultiplier = incomeAdjustByLocation ? (INCOME_MULTIPLIERS[tier.tier] ?? 1) : 1.0;
  const adjustedIncome = annualIncome * incomeMultiplier;
  const annualSavings = adjustedIncome * (savingsRatePercent / 100);

  const fireNumber = calculateFIRENumber(tier.annualExpenses, withdrawalRate);
  const yearsRaw = calculateYearsToFIRE(currentNetWorth, annualSavings, fireNumber, expectedReturn);
  const yearsToFIRE = yearsRaw === Infinity ? 99 : Math.round(yearsRaw);

  const yearByYear: TierProjection['yearByYear'] = [];
  let nw = currentNetWorth;
  for (let y = 0; y <= 50; y++) {
    const phase = nw >= fireNumber ? 'fi' as const : 'accumulating' as const;
    yearByYear.push({ year: y, age: currentAge + y, netWorth: Math.round(nw), phase });
    // Only accumulate savings while still working toward FI
    nw = nw * (1 + expectedReturn) + (phase === 'accumulating' ? annualSavings : 0);
  }

  return {
    tier,
    fireNumber,
    yearsToFIRE,
    fireAge: yearsToFIRE >= 99 ? 99 : currentAge + yearsToFIRE,
    deltaFromCurrent: 0,
    yearByYear,
  };
}

export function projectAllTiers(inputs: LocationGlidepathInputs): TierProjection[] {
  const currentTier = getMetroTier(inputs.currentMetro);
  const projections = LOCATION_TIERS.map(tier => projectTier(inputs, tier));

  const currentProjection = projections.find(p => p.tier.tier === currentTier.tier);
  const currentYears = currentProjection?.yearsToFIRE ?? 0;

  return projections.map(p => ({
    ...p,
    deltaFromCurrent: currentYears - p.yearsToFIRE,
  }));
}

export { getMetroTier };
