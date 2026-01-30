export interface FIRELevel {
  name: string;
  description: string;
  minAnnualExpenses: number;
  maxAnnualExpenses: number;
  withdrawalRate: number;
  color: string;
}

export const FIRE_LEVELS: FIRELevel[] = [
  {
    name: "Lean FIRE",
    description: "Frugal lifestyle with annual expenses under $40k",
    minAnnualExpenses: 0,
    maxAnnualExpenses: 40000,
    withdrawalRate: 0.035, // 3.5% SWR (Morningstar 2025 research: 3.9% safe, we use 3.5% for extra margin)
    color: "#fbbf24", // yellow
  },
  {
    name: "Regular FIRE",
    description: "Comfortable middle-class lifestyle ($40-60k/year)",
    minAnnualExpenses: 40000,
    maxAnnualExpenses: 60000,
    withdrawalRate: 0.035, // 3.5% SWR (conservative for 50+ year horizons)
    color: "#10b981", // green
  },
  {
    name: "Chubby FIRE",
    description: "Upper-middle-class lifestyle ($60-100k/year)",
    minAnnualExpenses: 60000,
    maxAnnualExpenses: 100000,
    withdrawalRate: 0.035, // 3.5% SWR (more conservative)
    color: "#6366f1", // indigo
  },
  {
    name: "Fat FIRE",
    description: "Affluent lifestyle with $100k+ annual expenses",
    minAnnualExpenses: 100000,
    maxAnnualExpenses: Infinity,
    withdrawalRate: 0.025, // 2.5% SWR (most conservative)
    color: "#f59e0b", // amber
  },
];

export interface CoastFIREResult {
  coastNumber: number;
  yearsToCoast: number;
  isCoastFIRE: boolean;
  monthlyContributionNeeded: number;
}

export interface BaristaFIREResult {
  baristaNumber: number;
  yearsToBaristaFIRE: number;
  isBaristaFIRE: boolean;
  partTimeIncomeNeeded: number;
}

export interface FIRECalculationResult {
  fireNumber: number;
  currentProgress: number; // percentage (0-100)
  yearsToFIRE: number;
  fireDate: Date;
  monthlyContributionNeeded: number;
  level: FIRELevel;
  coastFIRE: CoastFIREResult;
  baristaFIRE: BaristaFIREResult;
}

/**
 * Calculate FIRE number based on annual expenses
 */
export function calculateFIRENumber(
  annualExpenses: number,
  withdrawalRate: number = 0.04
): number {
  return annualExpenses / withdrawalRate;
}

/**
 * Determine FIRE level based on annual expenses
 */
export function getFIRELevel(annualExpenses: number): FIRELevel {
  for (const level of FIRE_LEVELS) {
    if (
      annualExpenses >= level.minAnnualExpenses &&
      annualExpenses < level.maxAnnualExpenses
    ) {
      return level;
    }
  }
  return FIRE_LEVELS[FIRE_LEVELS.length - 1]; // Default to Fat FIRE
}

/**
 * Calculate years to FIRE based on current net worth and savings
 */
export function calculateYearsToFIRE(
  currentNetWorth: number,
  annualSavings: number,
  targetFIRENumber: number,
  annualReturnRate: number = 0.07
): number {
  if (currentNetWorth >= targetFIRENumber) return 0;
  if (annualSavings <= 0) return Infinity;

  // Use compound interest formula with annual contributions
  // FV = PV(1+r)^t + PMT * ((1+r)^t - 1) / r
  // Solve for t when FV = targetFIRENumber

  let years = 0;
  let balance = currentNetWorth;

  while (balance < targetFIRENumber && years < 100) {
    balance = balance * (1 + annualReturnRate) + annualSavings;
    years++;
  }

  return years;
}

/**
 * Calculate required monthly contribution to reach FIRE by target date
 */
export function calculateRequiredContribution(
  currentNetWorth: number,
  targetFIRENumber: number,
  years: number,
  annualReturnRate: number = 0.07
): number {
  if (years <= 0) return 0;
  if (currentNetWorth >= targetFIRENumber) return 0;

  const monthlyRate = annualReturnRate / 12;
  const months = years * 12;

  // Future value of current net worth
  const futureValueCurrent = currentNetWorth * Math.pow(1 + monthlyRate, months);

  // Remaining amount needed
  const remainingNeeded = targetFIRENumber - futureValueCurrent;

  if (remainingNeeded <= 0) return 0;

  // Calculate monthly payment using future value of annuity formula
  // FV = PMT * ((1+r)^n - 1) / r
  // PMT = FV * r / ((1+r)^n - 1)

  const monthlyContribution =
    (remainingNeeded * monthlyRate) /
    (Math.pow(1 + monthlyRate, months) - 1);

  return Math.max(0, monthlyContribution);
}

/**
 * Calculate Coast FIRE number (amount needed to reach FIRE at age 65 with no more contributions)
 */
export function calculateCoastFIRE(
  currentAge: number,
  currentNetWorth: number,
  annualSavings: number,
  targetFIRENumber: number,
  annualReturnRate: number = 0.07
): CoastFIREResult {
  const yearsUntil65 = Math.max(0, 65 - currentAge);

  if (yearsUntil65 === 0) {
    return {
      coastNumber: targetFIRENumber,
      yearsToCoast: 0,
      isCoastFIRE: currentNetWorth >= targetFIRENumber,
      monthlyContributionNeeded: 0,
    };
  }

  // Calculate what you need today to reach FIRE number at 65
  const coastNumber = targetFIRENumber / Math.pow(1 + annualReturnRate, yearsUntil65);

  const isCoastFIRE = currentNetWorth >= coastNumber;

  // If not at coast FIRE, calculate years to reach it
  let yearsToCoast = 0;
  if (!isCoastFIRE && annualSavings > 0) {
    yearsToCoast = calculateYearsToFIRE(
      currentNetWorth,
      annualSavings,
      coastNumber,
      annualReturnRate
    );
  }

  const monthlyContributionNeeded = isCoastFIRE
    ? 0
    : calculateRequiredContribution(currentNetWorth, coastNumber, 1, annualReturnRate);

  return {
    coastNumber,
    yearsToCoast,
    isCoastFIRE,
    monthlyContributionNeeded,
  };
}

/**
 * Calculate Barista FIRE (portfolio covers most expenses, part-time income supplements)
 */
export function calculateBaristaFIRE(
  currentNetWorth: number,
  annualSavings: number,
  annualExpenses: number,
  partTimeIncome: number = 20000,
  annualReturnRate: number = 0.07
): BaristaFIREResult {
  // For Barista FIRE, you need portfolio to cover (expenses - partTimeIncome)
  // Use 3% SWR for safety since you're withdrawing before traditional retirement age
  const withdrawalRate = 0.03;
  const expensesCoveredByPortfolio = Math.max(0, annualExpenses - partTimeIncome);
  const baristaNumber = expensesCoveredByPortfolio / withdrawalRate;

  const isBaristaFIRE = currentNetWorth >= baristaNumber;

  const yearsToBaristaFIRE = isBaristaFIRE
    ? 0
    : calculateYearsToFIRE(currentNetWorth, annualSavings, baristaNumber, annualReturnRate);

  // Calculate part-time income needed if they want to achieve Barista FIRE sooner
  const partTimeIncomeNeeded = Math.max(
    0,
    annualExpenses - currentNetWorth * withdrawalRate
  );

  return {
    baristaNumber,
    yearsToBaristaFIRE,
    isBaristaFIRE,
    partTimeIncomeNeeded,
  };
}

/**
 * Comprehensive FIRE calculation
 */
export function calculateFIRE(
  currentNetWorth: number,
  currentAge: number,
  annualIncome: number,
  annualExpenses: number,
  annualReturnRate: number = 0.07,
  isCouple: boolean = false,
  coupleMultiplier: number = 1.7,
  partTimeIncome: number = 0
): FIRECalculationResult {
  // Adjust expenses for couple
  const adjustedExpenses = isCouple ? annualExpenses * coupleMultiplier : annualExpenses;

  // Determine FIRE level
  const level = getFIRELevel(adjustedExpenses);

  // Calculate FIRE number
  const fireNumber = calculateFIRENumber(adjustedExpenses, level.withdrawalRate);

  // Calculate current progress
  const currentProgress = Math.min(100, (currentNetWorth / fireNumber) * 100);

  // Calculate annual savings
  const annualSavings = Math.max(0, annualIncome - adjustedExpenses);

  // Calculate years to FIRE
  const yearsToFIRE = calculateYearsToFIRE(
    currentNetWorth,
    annualSavings,
    fireNumber,
    annualReturnRate
  );

  // Calculate FIRE date
  const fireDate = new Date();
  fireDate.setFullYear(fireDate.getFullYear() + yearsToFIRE);

  // Calculate monthly contribution needed to reach FIRE in X years
  const monthlyContributionNeeded = calculateRequiredContribution(
    currentNetWorth,
    fireNumber,
    yearsToFIRE,
    annualReturnRate
  );

  // Calculate Coast FIRE
  const coastFIRE = calculateCoastFIRE(
    currentAge,
    currentNetWorth,
    annualSavings,
    fireNumber,
    annualReturnRate
  );

  // Calculate Barista FIRE
  const baristaFIRE = calculateBaristaFIRE(
    currentNetWorth,
    annualSavings,
    adjustedExpenses,
    partTimeIncome,
    annualReturnRate
  );

  return {
    fireNumber,
    currentProgress,
    yearsToFIRE,
    fireDate,
    monthlyContributionNeeded,
    level,
    coastFIRE,
    baristaFIRE,
  };
}

/**
 * Bidirectional FIRE calculator: Calculate max monthly spend for a target FIRE date
 */
export function calculateMaxSpendForDate(
  currentNetWorth: number,
  currentAge: number,
  annualIncome: number,
  targetFireYear: number,
  annualReturnRate: number = 0.07,
  withdrawalRate: number = 0.04,
  isCouple: boolean = false,
  coupleMultiplier: number = 1.7
): {
  maxMonthlySpend: number;
  maxAnnualExpenses: number;
  fireNumber: number;
  level: FIRELevel;
} {
  const currentYear = new Date().getFullYear();
  const yearsToFIRE = Math.max(0, targetFireYear - currentYear);

  if (yearsToFIRE === 0) {
    // If target is today, use current net worth
    const maxAnnualExpenses = currentNetWorth * withdrawalRate;
    const adjustedExpenses = isCouple ? maxAnnualExpenses / coupleMultiplier : maxAnnualExpenses;

    return {
      maxMonthlySpend: adjustedExpenses / 12,
      maxAnnualExpenses: adjustedExpenses,
      fireNumber: currentNetWorth,
      level: getFIRELevel(adjustedExpenses),
    };
  }

  // Binary search to find maximum sustainable annual expenses
  let low = 0;
  let high = annualIncome * 0.95; // Can't spend more than 95% of income
  let maxAnnualExpenses = 0;

  while (high - low > 100) {
    const mid = (low + high) / 2;
    const adjustedExpenses = isCouple ? mid * coupleMultiplier : mid;
    const fireNumber = calculateFIRENumber(adjustedExpenses, withdrawalRate);
    const annualSavings = annualIncome - adjustedExpenses;

    const yearsNeeded = calculateYearsToFIRE(
      currentNetWorth,
      annualSavings,
      fireNumber,
      annualReturnRate
    );

    if (yearsNeeded <= yearsToFIRE) {
      low = mid;
      maxAnnualExpenses = mid;
    } else {
      high = mid;
    }
  }

  const adjustedExpenses = isCouple
    ? maxAnnualExpenses * coupleMultiplier
    : maxAnnualExpenses;
  const fireNumber = calculateFIRENumber(adjustedExpenses, withdrawalRate);

  return {
    maxMonthlySpend: maxAnnualExpenses / 12,
    maxAnnualExpenses,
    fireNumber,
    level: getFIRELevel(adjustedExpenses),
  };
}

/**
 * Format currency
 */
export function formatCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  } else if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}k`;
  } else {
    return `$${Math.round(value).toLocaleString()}`;
  }
}
