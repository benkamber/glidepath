/**
 * Financial Runway Simulator
 * Adapted from roamad app - calculates how long money lasts on current spending
 *
 * Core concept: Month-by-month simulation with geometric compounding
 * Surplus funds are reinvested, deficits draw from liquid then invested assets
 */

export interface RunwayParams {
  liquidAssets: number;       // Cash & equivalents
  investedAssets: number;     // Market-exposed investments
  monthlyIncome: number;      // Ongoing income (salary, pension, etc.)
  monthlyBurn: number;        // Monthly spending
  annualReturnRate: number;   // Expected investment return (e.g., 0.07 for 7%)
  maxMonths?: number;         // Simulation horizon (default: 600 months = 50 years)
  taxRate?: number;           // Tax on investment gains (default: 0.20)
  annualInflationRate?: number; // Inflation rate (default: 0.03)
}

export interface MonthSnapshot {
  month: number;
  liquidBalance: number;
  investedBalance: number;
  totalBalance: number;
  monthlyIncome: number;
  monthlyBurn: number;
  netCashFlow: number;
  investmentGains: number;
  taxesPaid: number;
  effectiveSWR: number;       // Safe Withdrawal Rate for this month
  status: 'sustainable' | 'depleting' | 'unaffordable';
}

export interface Guardrails {
  liquidityWarning: boolean;   // Liquid assets < 6 months burn
  swrWarning: boolean;         // SWR > 4%
  depletionRisk: boolean;      // Will run out within simulation period
  yearsUntilDepletion?: number;
}

export interface RunwayResult {
  totalMonths: number;         // Months until depletion (or maxMonths if sustainable)
  finalBalance: number;
  monthlySnapshots: MonthSnapshot[];
  sustainabilityStatus: 'sustainable' | 'depleting' | 'unaffordable';
  effectiveSWR: number;        // Average SWR across simulation
  guardrails: Guardrails;
  averageMonthlyBurn: number;
  totalInvestmentGains: number;
  totalTaxesPaid: number;
}

/**
 * Calculate Safe Withdrawal Rate (SWR)
 * Based on Trinity Study principles
 */
function calculateSWR(monthlyBurn: number, totalAssets: number): number {
  if (totalAssets <= 0) return Infinity;
  const annualWithdrawal = monthlyBurn * 12;
  return annualWithdrawal / totalAssets;
}

/**
 * Classify SWR into risk categories
 */
function getSWRStatus(swr: number): 'sustainable' | 'depleting' | 'unaffordable' {
  if (swr <= 0.03) return 'sustainable';      // <3% - very safe
  if (swr <= 0.04) return 'sustainable';      // 3-4% - safe (4% rule)
  if (swr <= 0.06) return 'depleting';        // 4-6% - caution
  return 'unaffordable';                      // >6% - danger
}

/**
 * Main runway simulation
 * Uses geometric compounding: monthlyRate = (1 + annualRate)^(1/12) - 1
 */
export function simulateRunway(params: RunwayParams): RunwayResult {
  const {
    liquidAssets: initialLiquid,
    investedAssets: initialInvested,
    monthlyIncome,
    monthlyBurn,
    annualReturnRate,
    maxMonths = 600,
    taxRate = 0.20,
    annualInflationRate = 0.03,
  } = params;

  // Geometric compounding for accurate monthly returns
  const monthlyReturnRate = Math.pow(1 + annualReturnRate, 1/12) - 1;
  const monthlyInflationRate = Math.pow(1 + annualInflationRate, 1/12) - 1;

  let liquidBalance = initialLiquid;
  let investedBalance = initialInvested;
  const snapshots: MonthSnapshot[] = [];

  let totalInvestmentGains = 0;
  let totalTaxesPaid = 0;
  let adjustedMonthlyBurn = monthlyBurn;

  for (let month = 1; month <= maxMonths; month++) {
    // Apply inflation to burn rate
    if (month > 1) {
      adjustedMonthlyBurn *= (1 + monthlyInflationRate);
    }

    // Calculate investment returns (before any withdrawals)
    const investmentGains = investedBalance * monthlyReturnRate;
    investedBalance += investmentGains;
    totalInvestmentGains += investmentGains;

    // Net cash flow
    const netCashFlow = monthlyIncome - adjustedMonthlyBurn;

    let taxesPaid = 0;
    const totalAssets = liquidBalance + investedBalance;

    if (netCashFlow >= 0) {
      // Surplus - add to liquid
      liquidBalance += netCashFlow;

      // Reinvest excess liquid if > 12 months burn
      const emergencyFund = adjustedMonthlyBurn * 12;
      if (liquidBalance > emergencyFund) {
        const toReinvest = liquidBalance - emergencyFund;
        liquidBalance -= toReinvest;
        investedBalance += toReinvest;
      }
    } else {
      // Deficit - draw from liquid first, then invested
      const deficit = -netCashFlow;

      if (liquidBalance >= deficit) {
        liquidBalance -= deficit;
      } else {
        // Need to sell investments
        const remainingDeficit = deficit - liquidBalance;
        liquidBalance = 0;

        if (investedBalance >= remainingDeficit) {
          // Realize capital gains (taxable event)
          const gainsProportion = investmentGains / (investedBalance > 0 ? investedBalance : 1);
          const realizedGains = remainingDeficit * gainsProportion;
          taxesPaid = realizedGains * taxRate;
          totalTaxesPaid += taxesPaid;

          investedBalance -= (remainingDeficit + taxesPaid);
        } else {
          // Insufficient funds - runout
          investedBalance = 0;
        }
      }
    }

    // Calculate current SWR
    const effectiveSWR = calculateSWR(adjustedMonthlyBurn, totalAssets);
    const status = getSWRStatus(effectiveSWR);

    snapshots.push({
      month,
      liquidBalance: Math.max(0, liquidBalance),
      investedBalance: Math.max(0, investedBalance),
      totalBalance: Math.max(0, liquidBalance + investedBalance),
      monthlyIncome,
      monthlyBurn: adjustedMonthlyBurn,
      netCashFlow,
      investmentGains,
      taxesPaid,
      effectiveSWR,
      status,
    });

    // Check for depletion
    if (liquidBalance <= 0 && investedBalance <= 0) {
      break;
    }
  }

  const lastSnapshot = snapshots[snapshots.length - 1];
  const finalBalance = lastSnapshot.totalBalance;
  const totalMonths = snapshots.length;

  // Calculate average SWR
  const avgSWR = snapshots.reduce((sum, s) => sum + s.effectiveSWR, 0) / snapshots.length;

  // Determine overall sustainability
  let sustainabilityStatus: 'sustainable' | 'depleting' | 'unaffordable';
  if (totalMonths >= maxMonths && finalBalance > 0) {
    sustainabilityStatus = avgSWR <= 0.04 ? 'sustainable' : 'depleting';
  } else {
    sustainabilityStatus = 'unaffordable';
  }

  // Guardrails
  const sixMonthsBurn = monthlyBurn * 6;
  const guardrails: Guardrails = {
    liquidityWarning: liquidBalance < sixMonthsBurn,
    swrWarning: avgSWR > 0.04,
    depletionRisk: totalMonths < maxMonths,
    yearsUntilDepletion: totalMonths < maxMonths ? totalMonths / 12 : undefined,
  };

  return {
    totalMonths,
    finalBalance,
    monthlySnapshots: snapshots,
    sustainabilityStatus,
    effectiveSWR: avgSWR,
    guardrails,
    averageMonthlyBurn: snapshots.reduce((sum, s) => sum + s.monthlyBurn, 0) / snapshots.length,
    totalInvestmentGains,
    totalTaxesPaid,
  };
}

/**
 * Infer monthly burn rate from historical net worth data
 * Uses difference between expected growth (from returns) and actual growth
 */
export function inferMonthlyBurn(
  entries: Array<{ date: string; totalNetWorth: number; cash: number }>,
  annualReturnRate: number = 0.07
): number {
  if (entries.length < 2) return 0;

  // Sort by date
  const sorted = [...entries].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const monthlyReturnRate = Math.pow(1 + annualReturnRate, 1/12) - 1;

  let totalInferredBurn = 0;
  let count = 0;

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];

    const timeDelta = new Date(curr.date).getTime() - new Date(prev.date).getTime();
    const monthsElapsed = timeDelta / (1000 * 60 * 60 * 24 * 30.44);

    if (monthsElapsed <= 0 || monthsElapsed > 12) continue; // Skip irregular intervals

    const investment = prev.totalNetWorth - prev.cash;
    const expectedGrowth = investment * monthlyReturnRate * monthsElapsed;
    const actualGrowth = curr.totalNetWorth - prev.totalNetWorth;

    // Inferred savings = actual growth - expected investment growth
    const inferredSavings = actualGrowth - expectedGrowth;

    // If negative, this represents net spending
    if (inferredSavings < 0) {
      totalInferredBurn += Math.abs(inferredSavings) / monthsElapsed;
      count++;
    }
  }

  return count > 0 ? totalInferredBurn / count : 0;
}

/**
 * Calculate break-even monthly income needed for sustainability
 */
export function calculateBreakEvenIncome(
  monthlyBurn: number,
  totalAssets: number,
  targetSWR: number = 0.04
): number {
  const sustainableAnnualWithdrawal = totalAssets * targetSWR;
  const sustainableMonthlyWithdrawal = sustainableAnnualWithdrawal / 12;

  if (monthlyBurn <= sustainableMonthlyWithdrawal) {
    return 0; // Already sustainable
  }

  return monthlyBurn - sustainableMonthlyWithdrawal;
}
