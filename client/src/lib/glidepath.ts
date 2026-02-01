// Glidepath Analysis — Wealth trajectory scenarios under different life decisions

import {
  REAL_RETURN_CASH,
  REAL_RETURN_INVESTMENT,
  REAL_RETURN_OTHER,
} from '../config/constants';

import type { TargetAllocation } from '../hooks/use-user-profile';

interface YearByYearProjectionPoint {
  age: number;
  expectedNW: number;
  income: number;
}

export interface GlidepathInput {
  currentNetWorth: number;
  currentAge: number;
  annualExpenses: number;
  targetAllocation: TargetAllocation;
  projectionYears: number;
  keepWorkingProjection?: YearByYearProjectionPoint[];
  partTimeAnnualIncome?: number; // default $25,000
}

export interface GlidepathPoint {
  year: number;  // offset from today (0, 1, 2...)
  age: number;
  netWorth: number;
}

export interface CrossoverPoint {
  scenarioId: string;
  year: number;
  age: number;
}

export interface GlidepathScenario {
  id: string;
  label: string;
  color: string;
  strokeDasharray?: string;
  strokeWidth: number;
  yearByYear: GlidepathPoint[];
}

export interface GlidepathResult {
  scenarios: GlidepathScenario[];
  crossoverPoints: CrossoverPoint[];
}

function calculateWeightedReturn(allocation: TargetAllocation): number {
  return (
    (allocation.cashPercent ?? 0.20) * REAL_RETURN_CASH +
    (allocation.investmentPercent ?? 0.70) * REAL_RETURN_INVESTMENT +
    (allocation.otherPercent ?? 0.10) * REAL_RETURN_OTHER
  );
}

function buildSWRScenario(
  id: string,
  label: string,
  color: string,
  strokeDasharray: string,
  swrRate: number,
  currentNetWorth: number,
  currentAge: number,
  weightedReturn: number,
  projectionYears: number,
): { scenario: GlidepathScenario; crossover?: CrossoverPoint } {
  const initialWithdrawal = currentNetWorth * swrRate;
  const points: GlidepathPoint[] = [{ year: 0, age: currentAge, netWorth: currentNetWorth }];
  let crossover: CrossoverPoint | undefined;

  let nw = currentNetWorth;
  for (let y = 1; y <= projectionYears; y++) {
    const growth = nw * weightedReturn;
    nw = nw + growth - initialWithdrawal;
    if (nw <= 0) {
      nw = 0;
      if (!crossover) {
        crossover = { scenarioId: id, year: y, age: currentAge + y };
      }
    }
    points.push({ year: y, age: currentAge + y, netWorth: nw });
  }

  return {
    scenario: { id, label, color, strokeDasharray, strokeWidth: 2, yearByYear: points },
    crossover,
  };
}

export function calculateGlidepathScenarios(input: GlidepathInput): GlidepathResult {
  const {
    currentNetWorth,
    currentAge,
    annualExpenses,
    targetAllocation,
    projectionYears: rawYears,
    keepWorkingProjection,
    partTimeAnnualIncome = 25000,
  } = input;

  const projectionYears = Math.min(rawYears, 50);
  const weightedReturn = calculateWeightedReturn(targetAllocation);
  const crossoverPoints: CrossoverPoint[] = [];
  const scenarios: GlidepathScenario[] = [];

  // 1. Keep Working — reuse existing projection or extend with compound growth
  const keepWorkingPoints: GlidepathPoint[] = [
    { year: 0, age: currentAge, netWorth: currentNetWorth },
  ];
  if (keepWorkingProjection && keepWorkingProjection.length > 0) {
    for (let i = 0; i < Math.min(keepWorkingProjection.length, projectionYears); i++) {
      keepWorkingPoints.push({
        year: i + 1,
        age: keepWorkingProjection[i].age,
        netWorth: keepWorkingProjection[i].expectedNW,
      });
    }
    // Extend if projection is shorter than needed
    if (keepWorkingPoints.length - 1 < projectionYears) {
      const lastPt = keepWorkingPoints[keepWorkingPoints.length - 1];
      let nw = lastPt.netWorth;
      // Estimate annual savings from last projection point's growth
      const prevPt = keepWorkingPoints.length >= 2
        ? keepWorkingPoints[keepWorkingPoints.length - 2]
        : keepWorkingPoints[0];
      const impliedGrowth = nw - prevPt.netWorth;
      const investmentGrowth = prevPt.netWorth * weightedReturn;
      const annualSavings = Math.max(0, impliedGrowth - investmentGrowth);

      for (let y = keepWorkingPoints.length; y <= projectionYears; y++) {
        nw = nw * (1 + weightedReturn) + annualSavings;
        keepWorkingPoints.push({ year: y, age: currentAge + y, netWorth: nw });
      }
    }
  } else {
    // No projection available — simple compound growth with estimated savings
    let nw = currentNetWorth;
    const estimatedSavings = annualExpenses * 0.5; // rough fallback
    for (let y = 1; y <= projectionYears; y++) {
      nw = nw * (1 + weightedReturn) + estimatedSavings;
      keepWorkingPoints.push({ year: y, age: currentAge + y, netWorth: nw });
    }
  }
  scenarios.push({
    id: 'keep_working',
    label: 'Keep Working',
    color: '#10b981',
    strokeWidth: 3,
    yearByYear: keepWorkingPoints,
  });

  // 2. SWR Scenarios
  const swrConfigs = [
    { id: 'swr_4', label: 'Stop @ 4% SWR', color: '#f59e0b', dash: '8 4', rate: 0.04 },
    { id: 'swr_35', label: 'Stop @ 3.5% SWR', color: '#f97316', dash: '6 3', rate: 0.035 },
    { id: 'swr_25', label: 'Stop @ 2.5% SWR', color: '#ef4444', dash: '4 4', rate: 0.025 },
  ] as const;

  for (const cfg of swrConfigs) {
    const { scenario, crossover } = buildSWRScenario(
      cfg.id, cfg.label, cfg.color, cfg.dash, cfg.rate,
      currentNetWorth, currentAge, weightedReturn, projectionYears,
    );
    scenarios.push(scenario);
    if (crossover) crossoverPoints.push(crossover);
  }

  // 5. Coast FIRE — no income, no withdrawal, pure compound growth
  const coastPoints: GlidepathPoint[] = [{ year: 0, age: currentAge, netWorth: currentNetWorth }];
  let coastNW = currentNetWorth;
  for (let y = 1; y <= projectionYears; y++) {
    coastNW = coastNW * (1 + weightedReturn);
    coastPoints.push({ year: y, age: currentAge + y, netWorth: coastNW });
  }
  scenarios.push({
    id: 'coast_fire',
    label: 'Coast FIRE',
    color: '#3b82f6',
    strokeDasharray: '12 4 4 4',
    strokeWidth: 2,
    yearByYear: coastPoints,
  });

  // 6. Barista FIRE — part-time income + withdraw shortfall
  const baristaPoints: GlidepathPoint[] = [{ year: 0, age: currentAge, netWorth: currentNetWorth }];
  const shortfall = Math.max(0, annualExpenses - partTimeAnnualIncome);
  let baristaNW = currentNetWorth;
  let baristaCrossover: CrossoverPoint | undefined;
  for (let y = 1; y <= projectionYears; y++) {
    const growth = baristaNW * weightedReturn;
    baristaNW = baristaNW + growth - shortfall;
    if (baristaNW <= 0) {
      baristaNW = 0;
      if (!baristaCrossover) {
        baristaCrossover = { scenarioId: 'barista_fire', year: y, age: currentAge + y };
      }
    }
    baristaPoints.push({ year: y, age: currentAge + y, netWorth: baristaNW });
  }
  if (baristaCrossover) crossoverPoints.push(baristaCrossover);
  scenarios.push({
    id: 'barista_fire',
    label: 'Barista FIRE',
    color: '#a855f7',
    strokeDasharray: '8 3 2 3',
    strokeWidth: 2,
    yearByYear: baristaPoints,
  });

  // 7. Guyton-Klinger Guardrails — dynamic withdrawal with spending adjustments
  {
    const gkInitialRate = 0.05; // 5% initial withdrawal rate
    const gkInitialWithdrawal = currentNetWorth * gkInitialRate;
    const gkFloor = gkInitialWithdrawal * 0.80;    // never below 80% of initial
    const gkCeiling = gkInitialWithdrawal * 1.20;  // never above 120% of initial
    const gkPoints: GlidepathPoint[] = [{ year: 0, age: currentAge, netWorth: currentNetWorth }];
    let gkNW = currentNetWorth;
    let gkWithdrawal = gkInitialWithdrawal;
    let gkPeakNW = currentNetWorth;
    let gkCrossover: CrossoverPoint | undefined;

    for (let y = 1; y <= projectionYears; y++) {
      const growth = gkNW * weightedReturn;
      gkNW = gkNW + growth;

      // Update peak
      if (gkNW > gkPeakNW) gkPeakNW = gkNW;

      // Guardrail checks
      if (gkNW <= gkPeakNW * 0.80) {
        // Portfolio dropped 20% from peak → cut spending 10%
        gkWithdrawal = Math.max(gkFloor, gkWithdrawal * 0.90);
      } else if (gkNW >= currentNetWorth * 1.20) {
        // Portfolio 20% above initial → increase spending 10%
        gkWithdrawal = Math.min(gkCeiling, gkWithdrawal * 1.10);
      }

      gkNW -= gkWithdrawal;

      if (gkNW <= 0) {
        gkNW = 0;
        if (!gkCrossover) {
          gkCrossover = { scenarioId: 'guardrails', year: y, age: currentAge + y };
        }
      }
      gkPoints.push({ year: y, age: currentAge + y, netWorth: gkNW });
    }
    if (gkCrossover) crossoverPoints.push(gkCrossover);
    scenarios.push({
      id: 'guardrails',
      label: 'Guardrails (G-K)',
      color: '#06b6d4',          // cyan
      strokeDasharray: '10 3 3 3',
      strokeWidth: 2,
      yearByYear: gkPoints,
    });
  }

  // 8. Variable Percentage Withdrawal (VPW) — withdraw portfolio/remaining_years with caps
  {
    const vpwTargetAge = 95;
    const vpwPoints: GlidepathPoint[] = [{ year: 0, age: currentAge, netWorth: currentNetWorth }];
    let vpwNW = currentNetWorth;
    const vpwInitialWithdrawal = annualExpenses; // baseline reference for floor/ceiling
    const vpwFloor = vpwInitialWithdrawal * 0.10;    // minimum 10% of expected expenses
    const vpwCeiling = vpwInitialWithdrawal * 1.50;  // cap at 150% of expected expenses
    let vpwCrossover: CrossoverPoint | undefined;

    for (let y = 1; y <= projectionYears; y++) {
      const growth = vpwNW * weightedReturn;
      vpwNW = vpwNW + growth;

      const currentAgeY = currentAge + y;
      const remainingYears = Math.max(1, vpwTargetAge - currentAgeY);
      let withdrawal = vpwNW / remainingYears;

      // Apply floor and ceiling
      withdrawal = Math.max(vpwFloor, Math.min(vpwCeiling, withdrawal));

      vpwNW -= withdrawal;

      if (vpwNW <= 0) {
        vpwNW = 0;
        if (!vpwCrossover) {
          vpwCrossover = { scenarioId: 'vpw', year: y, age: currentAgeY };
        }
      }
      vpwPoints.push({ year: y, age: currentAgeY, netWorth: vpwNW });
    }
    if (vpwCrossover) crossoverPoints.push(vpwCrossover);
    scenarios.push({
      id: 'vpw',
      label: 'VPW (Variable %)',
      color: '#ec4899',          // pink
      strokeDasharray: '6 2 2 2 2 2',
      strokeWidth: 2,
      yearByYear: vpwPoints,
    });
  }

  return { scenarios, crossoverPoints };
}
