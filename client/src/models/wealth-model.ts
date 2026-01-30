// Wealth Accumulation Projection Model
// Combines BLS wage data with SCF benchmarks for career-aware projections

// Asset Class Return Assumptions (Real, after inflation)
const CASH_RETURN = 0.02;       // High Yield Savings Account
const INVESTMENT_RETURN = 0.07;  // Equity/Stock market historical average
const OTHER_RETURN = 0.00;       // Other assets (vehicles, etc.) - depreciating/flat

import {
  type Occupation,
  type CareerLevel,
  type Metro,
  getLevelForYears,
  getWageEstimate,
  getWageWithProgression,
  getYearsRangeForLevel,
  calculateAnnualSavings,
  type WageEstimate,
} from '../data/bls-wage-data';

import {
  getBracketForAge,
  getPercentileForAge,
  getMedianForAge,
  getPercentileLabel,
} from '../data/scf-data';

export interface WealthModelInput {
  currentAge: number;
  startAge?: number; // Default 22 (college grad)
  occupation: Occupation;
  level?: CareerLevel; // If not provided, derived from years working
  metro: Metro;
  savingsRate?: number; // 0-1, e.g., 0.25 for 25% (optional - will be inferred if not provided)
  annualReturn?: number; // Default 0.07 (7% real return for equities)
  taxDrag?: number; // Default 0.15 (15% for long-term capital gains) - reduces effective return
  currentNetWorth?: number; // Optional: for comparison
  targetAllocation?: {
    cashPercent: number;
    investmentPercent: number;
    otherPercent: number;
  }; // Optional: for weighted return calculation
}

/**
 * Infer savings rate from historical wealth data
 *
 * Formula: savingsRate = (actualGrowth - investmentGrowth) / totalIncome
 *
 * This estimates the percentage of income that was saved by looking at
 * how much wealth grew beyond what investment returns would explain.
 */
export function inferSavingsRate(
  entries: Array<{ date: string; totalNetWorth: number }>,
  estimatedAnnualIncome: number,
  annualReturn: number = 0.07
): number {
  if (entries.length < 2 || estimatedAnnualIncome === 0) {
    return 0.25; // Default conservative estimate: 25%
  }

  // Calculate total time period in years
  const firstDate = new Date(entries[0].date);
  const lastDate = new Date(entries[entries.length - 1].date);
  const yearsElapsed = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

  if (yearsElapsed === 0) return 0.25;

  // Calculate actual wealth growth
  const startingWealth = entries[0].totalNetWorth;
  const endingWealth = entries[entries.length - 1].totalNetWorth;
  const actualGrowth = endingWealth - startingWealth;

  // Estimate investment growth using compound interest
  // Investment growth = Starting wealth * (1 + r)^t - Starting wealth
  const estimatedInvestmentGrowth = startingWealth * (Math.pow(1 + annualReturn, yearsElapsed) - 1);

  // Growth from savings = Total growth - Investment growth
  const growthFromSavings = actualGrowth - estimatedInvestmentGrowth;

  // Total income over period
  const totalIncome = estimatedAnnualIncome * yearsElapsed;

  // Inferred savings rate
  const inferredRate = growthFromSavings / totalIncome;

  // Clamp to reasonable bounds (0% to 90%)
  // If rate is negative or > 90%, return default
  if (inferredRate < 0 || inferredRate > 0.9 || isNaN(inferredRate)) {
    return 0.25; // Return conservative default
  }

  return inferredRate;
}

export interface YearByYearData {
  age: number;
  expectedNW: number;
  income: number;
  savings: number;
  investmentGrowth: number;
  level: CareerLevel;
}

export interface WealthModelOutput {
  expectedNetWorth: number;
  yearByYear: YearByYearData[];
  scfPercentile: number;
  assumptions: {
    avgSavingsRate: number;
    avgReturn: number; // Equity return assumption
    portfolioReturn: number; // Weighted average across all asset classes
    effectiveReturn: number; // After-tax weighted return
    taxDrag: number;
    avgIncomeGrowth: number;
    totalIncome: number;
    totalSavings: number;
    totalInvestmentGrowth: number;
  };
  comparison?: {
    actualNetWorth: number;
    delta: number;
    deltaPercent: number;
    isAhead: boolean;
  };
}

export interface WealthComparison {
  actualNetWorth: number;
  expectedNetWorth: number;
  delta: number;
  deltaPercent: number;
  isAhead: boolean;
  percentile: number;
  percentileLabel: string;
  medianForAge: number;
  vsMedian: number;
}

export interface Milestone {
  milestone: number;
  label: string;
  years: number | null;
  age: number | null;
}

export interface ProjectionScenario {
  name: string;
  description: string;
  annualReturn: number;
  savingsRateModifier?: number;
  levelProgressionBoost?: number;
}

export const projectionScenarios: Record<string, ProjectionScenario> = {
  current: {
    name: 'Current Path',
    description: 'Based on your historical growth rate',
    annualReturn: 0.07,
  },
  conservative: {
    name: 'Conservative',
    description: '5% real return, standard progression',
    annualReturn: 0.05,
  },
  optimistic: {
    name: 'Optimistic',
    description: '9% real return, faster progression',
    annualReturn: 0.09,
    levelProgressionBoost: 1,
  },
  fastTrack: {
    name: 'Fast Track',
    description: 'Promoted 2 years early at each level',
    annualReturn: 0.07,
    levelProgressionBoost: 2,
  },
  frugal: {
    name: 'High Savings',
    description: '40% savings rate',
    annualReturn: 0.07,
    savingsRateModifier: 1.6,
  },
};

/**
 * Models expected wealth accumulation based on career profile
 */
export function modelExpectedWealth(input: WealthModelInput): WealthModelOutput {
  const {
    currentAge,
    startAge = 22,
    occupation,
    metro,
    savingsRate = 0.25,
    annualReturn = 0.07, // Used for investment portion only
    taxDrag = 0.15, // Default 15% (long-term capital gains)
    currentNetWorth,
    targetAllocation = { cashPercent: 0.20, investmentPercent: 0.70, otherPercent: 0.10 },
  } = input;

  // Calculate weighted portfolio return based on asset allocation
  // Each asset class has different expected returns
  const portfolioReturn =
    (targetAllocation.cashPercent * CASH_RETURN) +
    (targetAllocation.investmentPercent * annualReturn) +
    (targetAllocation.otherPercent * OTHER_RETURN);

  const yearsWorking = Math.max(0, currentAge - startAge);
  const level = input.level ?? getLevelForYears(yearsWorking);

  const yearByYear: YearByYearData[] = [];
  let accumulatedWealth = 0;
  let totalIncome = 0;
  let totalSavings = 0;
  let totalInvestmentGrowth = 0;

  for (let age = startAge; age <= currentAge; age++) {
    const yearsInWorkforce = age - startAge;
    const currentLevel = getLevelForYears(yearsInWorkforce);
    const levelRange = getYearsRangeForLevel(currentLevel);
    const yearsInLevel = yearsInWorkforce - levelRange.min;

    const wageEstimate = getWageWithProgression(occupation, currentLevel, metro, yearsInLevel);
    const income = wageEstimate.afterTaxComp;
    const annualSavings = Math.round(income * savingsRate);

    // Apply tax drag to portfolio returns (capital gains, dividends, rebalancing)
    // Use weighted portfolio return (cash @2%, investments @7%, other @0%)
    const effectiveReturn = portfolioReturn * (1 - taxDrag);
    const investmentGrowth = Math.round(accumulatedWealth * effectiveReturn);
    accumulatedWealth += annualSavings + investmentGrowth;

    totalIncome += income;
    totalSavings += annualSavings;
    totalInvestmentGrowth += investmentGrowth;

    yearByYear.push({
      age,
      expectedNW: Math.round(accumulatedWealth),
      income: wageEstimate.totalComp,
      savings: annualSavings,
      investmentGrowth,
      level: currentLevel,
    });
  }

  const scfPercentile = getPercentileForAge(accumulatedWealth, currentAge);

  const firstYearIncome = yearByYear[0]?.income ?? 0;
  const lastYearIncome = yearByYear[yearByYear.length - 1]?.income ?? firstYearIncome;
  const years = yearByYear.length;
  const avgIncomeGrowth = years > 1
    ? Math.pow(lastYearIncome / firstYearIncome, 1 / (years - 1)) - 1
    : 0;

  const output: WealthModelOutput = {
    expectedNetWorth: Math.round(accumulatedWealth),
    yearByYear,
    scfPercentile,
    assumptions: {
      avgSavingsRate: savingsRate,
      avgReturn: annualReturn, // Equity return assumption
      portfolioReturn: portfolioReturn, // Weighted average across all asset classes
      effectiveReturn: portfolioReturn * (1 - taxDrag), // After-tax weighted return
      taxDrag: taxDrag,
      avgIncomeGrowth,
      totalIncome: Math.round(totalIncome),
      totalSavings: Math.round(totalSavings),
      totalInvestmentGrowth: Math.round(totalInvestmentGrowth),
    },
  };

  if (currentNetWorth !== undefined) {
    const delta = currentNetWorth - accumulatedWealth;
    output.comparison = {
      actualNetWorth: currentNetWorth,
      delta: Math.round(delta),
      deltaPercent: accumulatedWealth > 0 ? delta / accumulatedWealth : 0,
      isAhead: delta >= 0,
    };
  }

  return output;
}

/**
 * Projects future wealth from current age to target age
 */
export function projectFutureWealth(
  input: WealthModelInput,
  targetAge: number,
  scenario?: ProjectionScenario
): WealthModelOutput {
  const {
    currentAge,
    startAge = 22,
    occupation,
    metro,
    savingsRate = 0.25,
    annualReturn = 0.07,
    currentNetWorth,
  } = input;

  const effectiveReturn = scenario?.annualReturn ?? annualReturn;
  const effectiveSavingsRate = savingsRate * (scenario?.savingsRateModifier ?? 1);
  const levelBoost = scenario?.levelProgressionBoost ?? 0;

  let accumulatedWealth = currentNetWorth ?? modelExpectedWealth(input).expectedNetWorth;

  const yearByYear: YearByYearData[] = [];
  let totalIncome = 0;
  let totalSavings = 0;
  let totalInvestmentGrowth = 0;

  for (let age = currentAge; age <= targetAge; age++) {
    const yearsInWorkforce = age - startAge + levelBoost;
    const currentLevel = getLevelForYears(yearsInWorkforce);
    const levelRange = getYearsRangeForLevel(currentLevel);
    const yearsInLevel = Math.max(0, yearsInWorkforce - levelRange.min);

    const wageEstimate = getWageWithProgression(occupation, currentLevel, metro, yearsInLevel);
    const income = wageEstimate.afterTaxComp;
    const annualSavings = Math.round(income * effectiveSavingsRate);

    const investmentGrowth = Math.round(accumulatedWealth * effectiveReturn);

    if (age > currentAge) {
      accumulatedWealth += annualSavings + investmentGrowth;
      totalIncome += income;
      totalSavings += annualSavings;
      totalInvestmentGrowth += investmentGrowth;
    }

    yearByYear.push({
      age,
      expectedNW: Math.round(accumulatedWealth),
      income: wageEstimate.totalComp,
      savings: annualSavings,
      investmentGrowth: age > currentAge ? investmentGrowth : 0,
      level: currentLevel,
    });
  }

  const scfPercentile = getPercentileForAge(accumulatedWealth, targetAge);

  const firstYearIncome = yearByYear[0]?.income ?? 0;
  const lastYearIncome = yearByYear[yearByYear.length - 1]?.income ?? firstYearIncome;
  const years = yearByYear.length;
  const avgIncomeGrowth = years > 1
    ? Math.pow(lastYearIncome / firstYearIncome, 1 / (years - 1)) - 1
    : 0;

  return {
    expectedNetWorth: Math.round(accumulatedWealth),
    yearByYear,
    scfPercentile,
    assumptions: {
      avgSavingsRate: effectiveSavingsRate,
      avgReturn: effectiveReturn,
      avgIncomeGrowth,
      totalIncome: Math.round(totalIncome),
      totalSavings: Math.round(totalSavings),
      totalInvestmentGrowth: Math.round(totalInvestmentGrowth),
    },
  };
}

/**
 * Compare actual net worth to expected for profile
 */
export function compareToExpected(
  actualNetWorth: number,
  input: Omit<WealthModelInput, 'currentNetWorth'>
): WealthComparison {
  const model = modelExpectedWealth({ ...input, currentNetWorth: actualNetWorth });
  const percentile = getPercentileForAge(actualNetWorth, input.currentAge);
  const median = getMedianForAge(input.currentAge);

  return {
    actualNetWorth,
    expectedNetWorth: model.expectedNetWorth,
    delta: model.comparison?.delta ?? 0,
    deltaPercent: model.comparison?.deltaPercent ?? 0,
    isAhead: model.comparison?.isAhead ?? false,
    percentile,
    percentileLabel: getPercentileLabel(percentile),
    medianForAge: median,
    vsMedian: actualNetWorth - median,
  };
}

/**
 * Calculate milestones and time to reach them
 */
export function getMilestones(
  currentNetWorth: number,
  annualSavings: number,
  annualReturn: number = 0.07
): Milestone[] {
  const milestones = [
    { amount: 100000, label: '$100K' },
    { amount: 250000, label: '$250K' },
    { amount: 500000, label: '$500K' },
    { amount: 750000, label: '$750K' },
    { amount: 1000000, label: '$1M' },
    { amount: 2000000, label: '$2M' },
    { amount: 3000000, label: '$3M' },
    { amount: 5000000, label: '$5M' },
  ];

  return milestones.map(({ amount, label }) => {
    if (currentNetWorth >= amount) {
      return { milestone: amount, label, years: 0, age: null };
    }

    if (annualSavings <= 0) {
      return { milestone: amount, label, years: null, age: null };
    }

    // Calculate years to milestone using compound growth formula
    let wealth = currentNetWorth;
    let years = 0;
    const maxYears = 100;

    while (wealth < amount && years < maxYears) {
      wealth = wealth * (1 + annualReturn) + annualSavings;
      years++;
    }

    if (years >= maxYears) {
      return { milestone: amount, label, years: null, age: null };
    }

    return { milestone: amount, label, years, age: null };
  });
}

/**
 * Generate multiple scenario projections
 */
export function generateScenarios(
  input: WealthModelInput,
  currentNetWorth: number,
  targetAge: number = 65
): Array<{ scenario: string; output: WealthModelOutput }> {
  return Object.entries(projectionScenarios).map(([key, scenario]) => ({
    scenario: scenario.name,
    output: projectFutureWealth(
      { ...input, currentNetWorth },
      targetAge,
      scenario
    ),
  }));
}

/**
 * Calculate age at which target net worth would be reached
 */
export function calculateAgeToTarget(
  input: WealthModelInput,
  targetNetWorth: number,
  maxAge: number = 80
): { age: number; years: number } | null {
  const { currentAge, currentNetWorth } = input;

  if ((currentNetWorth ?? 0) >= targetNetWorth) {
    return { age: currentAge, years: 0 };
  }

  const projection = projectFutureWealth(input, maxAge);

  if (projection.expectedNetWorth < targetNetWorth) {
    return null;
  }

  for (const year of projection.yearByYear) {
    if (year.expectedNW >= targetNetWorth) {
      return {
        age: year.age,
        years: year.age - currentAge,
      };
    }
  }

  return null;
}

/**
 * Calculate required savings rate to reach target by age
 */
export function calculateRequiredSavingsRate(
  input: Omit<WealthModelInput, 'savingsRate'>,
  targetNetWorth: number,
  targetAge: number
): number | null {
  const { currentAge, currentNetWorth = 0 } = input;

  if (currentNetWorth >= targetNetWorth) {
    return 0;
  }

  let low = 0.01;
  let high = 0.80;
  let iterations = 0;
  const maxIterations = 50;

  while (high - low > 0.001 && iterations < maxIterations) {
    const mid = (low + high) / 2;
    const projection = projectFutureWealth(
      { ...input, savingsRate: mid, currentNetWorth },
      targetAge
    );

    if (projection.expectedNetWorth >= targetNetWorth) {
      high = mid;
    } else {
      low = mid;
    }
    iterations++;
  }

  const requiredRate = (low + high) / 2;

  const verification = projectFutureWealth(
    { ...input, savingsRate: requiredRate, currentNetWorth },
    targetAge
  );

  if (verification.expectedNetWorth < targetNetWorth * 0.95) {
    return null;
  }

  return Math.min(requiredRate, 0.80);
}

/**
 * Get a text description of comparison status
 */
export function getComparisonDescription(
  comparison: WealthModelOutput['comparison'] | WealthComparison | undefined
): string {
  if (!comparison) return '';

  const { delta, deltaPercent, isAhead } = comparison;
  const absDelta = Math.abs(delta);
  const absPercent = Math.abs(deltaPercent);

  if (absPercent < 0.05) {
    return 'right on track with expected wealth for your profile';
  }

  const magnitude = absPercent < 0.25 ? 'slightly' : absPercent < 0.5 ? 'moderately' : 'significantly';
  const direction = isAhead ? 'ahead of' : 'behind';

  return `${magnitude} ${direction} expected wealth for your profile`;
}

/**
 * Calculate FIRE (Financial Independence) numbers
 */
export function calculateFIRENumbers(
  currentNetWorth: number,
  annualExpenses: number,
  input: WealthModelInput
): {
  leanFIRE: { amount: number; yearsAway: number | null };
  regularFIRE: { amount: number; yearsAway: number | null };
  fatFIRE: { amount: number; yearsAway: number | null };
  coastFIRE: { amount: number; targetAge: number; achieved: boolean };
} {
  const leanFIREAmount = annualExpenses * 25; // 4% SWR
  const regularFIREAmount = annualExpenses * 28.5; // 3.5% SWR
  const fatFIREAmount = annualExpenses * 40; // 2.5% SWR

  // Coast FIRE: amount needed now to reach regular FIRE by 65 with no more savings
  const targetAge = 65;
  const yearsToTarget = targetAge - input.currentAge;
  const coastFIREAmount = regularFIREAmount / Math.pow(1.07, yearsToTarget);

  const wageEstimate = getWageEstimate(input.occupation, input.level ?? getLevelForYears(input.currentAge - (input.startAge ?? 22)), input.metro);
  const annualSavings = Math.round(wageEstimate.afterTaxComp * (input.savingsRate || 0.25));

  const getYearsToTarget = (target: number): number | null => {
    if (currentNetWorth >= target) return 0;
    if (annualSavings <= 0) return null;

    let wealth = currentNetWorth;
    let years = 0;
    while (wealth < target && years < 100) {
      wealth = wealth * 1.07 + annualSavings;
      years++;
    }
    return years < 100 ? years : null;
  };

  return {
    leanFIRE: { amount: leanFIREAmount, yearsAway: getYearsToTarget(leanFIREAmount) },
    regularFIRE: { amount: regularFIREAmount, yearsAway: getYearsToTarget(regularFIREAmount) },
    fatFIRE: { amount: fatFIREAmount, yearsAway: getYearsToTarget(fatFIREAmount) },
    coastFIRE: {
      amount: coastFIREAmount,
      targetAge,
      achieved: currentNetWorth >= coastFIREAmount,
    },
  };
}
