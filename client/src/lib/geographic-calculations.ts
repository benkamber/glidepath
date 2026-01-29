/**
 * Geographic Arbitrage Calculations
 * Retrospective and Prospective Net Worth Impact
 */

export interface GeographicCalculationInput {
  currentSalary: number;
  currentNetWorth: number;
  savingsRate: number; // 0.25 = 25%
  investmentReturn: number; // 0.07 = 7%
  currentCOL: number; // Cost of living multiplier for current city
  targetSalaryMultiplier: number; // Target city salary relative to current
  targetCOL: number; // Target city cost of living multiplier
}

export interface CalculationResult {
  adjustedNetWorth: number;
  delta: number;
  breakdown: {
    incomeDelta: number;
    expensesDelta: number;
    netSavingsDelta: number;
  };
}

/**
 * Calculate what net worth would be if user had lived in target city for last N years
 */
export function calculateRetrospectiveImpact(
  input: GeographicCalculationInput,
  yearsBack: number,
  historicalGrowth: number // Actual annualized growth rate from historical data
): CalculationResult {
  const {
    currentSalary,
    currentNetWorth,
    savingsRate,
    investmentReturn,
    currentCOL,
    targetSalaryMultiplier,
    targetCOL,
  } = input;

  // Calculate income difference
  const targetSalary = currentSalary * targetSalaryMultiplier;
  const annualIncomeDelta = targetSalary - currentSalary;

  // Calculate expense difference
  const currentExpenses = currentSalary * (1 - savingsRate) * currentCOL;
  const targetExpenses = targetSalary * (1 - savingsRate) * targetCOL;
  const annualExpensesDelta = targetExpenses - currentExpenses;

  // Net savings impact per year
  const annualNetSavingsDelta = annualIncomeDelta - annualExpensesDelta;

  // Calculate cumulative impact with compounding
  let adjustedNetWorth = currentNetWorth;
  for (let year = 0; year < yearsBack; year++) {
    // Add the difference in savings, compounded forward to present
    const yearsToCompound = yearsBack - year;
    const compoundedDelta = annualNetSavingsDelta * Math.pow(1 + investmentReturn, yearsToCompound);
    adjustedNetWorth += compoundedDelta / Math.pow(1 + investmentReturn, yearsToCompound);
  }

  // Simple approximation: just add cumulative compounded delta
  const totalDelta = annualNetSavingsDelta * yearsBack * (1 + investmentReturn * yearsBack / 2);
  adjustedNetWorth = currentNetWorth + totalDelta;

  return {
    adjustedNetWorth,
    delta: adjustedNetWorth - currentNetWorth,
    breakdown: {
      incomeDelta: annualIncomeDelta,
      expensesDelta: annualExpensesDelta,
      netSavingsDelta: annualNetSavingsDelta,
    },
  };
}

/**
 * Calculate what net worth would be if user moves to target city for next Y years
 */
export function calculateProspectiveImpact(
  input: GeographicCalculationInput,
  yearsForward: number,
  careerGrowthRate: number = 0.03 // 3% annual salary growth
): CalculationResult {
  const {
    currentSalary,
    currentNetWorth,
    savingsRate,
    investmentReturn,
    currentCOL,
    targetSalaryMultiplier,
    targetCOL,
  } = input;

  // Project net worth if staying in current city
  let stayingNetWorth = currentNetWorth;
  let stayingSalary = currentSalary;

  for (let year = 0; year < yearsForward; year++) {
    const annualSavings = stayingSalary * savingsRate;
    stayingNetWorth = stayingNetWorth * (1 + investmentReturn) + annualSavings;
    stayingSalary *= (1 + careerGrowthRate);
  }

  // Project net worth if moving to target city
  let movingNetWorth = currentNetWorth;
  let movingSalary = currentSalary * targetSalaryMultiplier;

  for (let year = 0; year < yearsForward; year++) {
    // Adjust expenses for COL difference
    const expenses = movingSalary * (1 - savingsRate) * (targetCOL / currentCOL);
    const annualSavings = movingSalary - expenses;

    movingNetWorth = movingNetWorth * (1 + investmentReturn) + annualSavings;
    movingSalary *= (1 + careerGrowthRate);
  }

  const targetSalary = currentSalary * targetSalaryMultiplier;
  const annualIncomeDelta = targetSalary - currentSalary;
  const currentExpenses = currentSalary * (1 - savingsRate);
  const targetExpenses = targetSalary * (1 - savingsRate) * (targetCOL / currentCOL);
  const annualExpensesDelta = targetExpenses - currentExpenses;
  const annualNetSavingsDelta = annualIncomeDelta - annualExpensesDelta;

  return {
    adjustedNetWorth: movingNetWorth,
    delta: movingNetWorth - stayingNetWorth,
    breakdown: {
      incomeDelta: annualIncomeDelta,
      expensesDelta: annualExpensesDelta,
      netSavingsDelta: annualNetSavingsDelta,
    },
  };
}

/**
 * Simplified version for quick estimates
 */
export function quickEstimate(
  currentNetWorth: number,
  annualSalary: number,
  savingsRate: number,
  salaryMultiplier: number,
  colMultiplier: number,
  currentCOL: number,
  years: number,
  isRetrospective: boolean
): { adjustedNetWorth: number; delta: number } {
  const input: GeographicCalculationInput = {
    currentSalary: annualSalary,
    currentNetWorth,
    savingsRate,
    investmentReturn: 0.07,
    currentCOL,
    targetSalaryMultiplier: salaryMultiplier,
    targetCOL: colMultiplier,
  };

  if (isRetrospective) {
    const result = calculateRetrospectiveImpact(input, years, 0.07);
    return {
      adjustedNetWorth: result.adjustedNetWorth,
      delta: result.delta,
    };
  } else {
    const result = calculateProspectiveImpact(input, years);
    return {
      adjustedNetWorth: result.adjustedNetWorth,
      delta: result.delta,
    };
  }
}
