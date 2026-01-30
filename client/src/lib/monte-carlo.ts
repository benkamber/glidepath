/**
 * Monte Carlo Financial Simulation Engine
 * Implements probabilistic wealth trajectory forecasting with:
 * - Investment return modeling (Geometric Brownian Motion)
 * - Income and expense volatility
 * - Emergency event simulation (Poisson process)
 * - Risk metrics (VaR, CVaR)
 * - Statistical analysis (percentiles, confidence intervals)
 */

export interface SimulationConfig {
  // Current state
  currentNetWorth: number;
  currentCash: number;
  currentInvestments: number;

  // Income and expenses
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number; // 0-1

  // Investment parameters
  investmentReturnAnnual: number; // Expected annual return (e.g., 0.07 for 7%)
  investmentVolatilityAnnual: number; // Annual volatility (e.g., 0.15 for 15%)

  // Uncertainty parameters
  expenseVolatility: number; // Standard deviation as % of expenses (e.g., 0.15 for 15%)
  incomeVolatility: number; // Standard deviation as % of income

  // Emergency events
  emergencyProbabilityMonthly: number; // Probability per month (e.g., 0.05 for 5%)
  emergencyMeanCost: number; // Mean cost of emergency
  emergencyStdDev: number; // Standard deviation of emergency cost

  // Simulation settings
  numSimulations: number; // Number of Monte Carlo runs (e.g., 10000)
  timeHorizonMonths: number; // How many months to project

  // Optional
  inflationRate?: number; // Annual inflation rate
}

export interface SimulationResult {
  runId: number;
  monthsOfRunway: number; // When balance hits zero (or timeHorizon if never)
  finalBalance: number;
  monthlyBalances: number[];
  monthlyNetWorth: number[];
  emergencyCount: number;
  trajectoryType: 'success' | 'depleted' | 'growing';
}

export interface AggregatedResults {
  // Percentiles
  p10Months: number; // 10th percentile (pessimistic)
  p25Months: number;
  p50Months: number; // Median
  p75Months: number;
  p90Months: number; // 90th percentile (optimistic)

  // Summary statistics
  meanMonths: number;
  medianMonths: number;
  stdDevMonths: number;

  // Probabilities
  probabilityDepletedBy12Mo: number;
  probabilityDepletedBy24Mo: number;
  probabilityDepletedBy36Mo: number;

  // Risk metrics
  valueAtRisk95: number; // 95% VaR - 95% chance of at least this many months
  conditionalVaR95: number; // Expected value in worst 5% of cases

  // Distribution data for charting
  distributionData: { months: number; count: number; percentage: number }[];

  // Sample paths for visualization
  samplePaths: {
    best: number[]; // 90th percentile path
    median: number[]; // 50th percentile path
    worst: number[]; // 10th percentile path
    samples: number[][]; // 20 random sample paths
  };

  // Scenario analysis
  scenarios: {
    best: { avgMonths: number; avgFinalNW: number; emergencies: number };
    median: { avgMonths: number; avgFinalNW: number; emergencies: number };
    worst: { avgMonths: number; avgFinalNW: number; emergencies: number };
  };

  // All simulation results for advanced analysis
  allResults: SimulationResult[];
}

/**
 * Box-Muller transform for generating normally distributed random numbers
 */
function boxMuller(mean: number = 0, stdDev: number = 1): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z0 * stdDev;
}

/**
 * Generate correlated random variables (for expense categories that move together)
 */
function generateCorrelatedRandoms(rho: number): [number, number] {
  const z1 = boxMuller(0, 1);
  const z2 = boxMuller(0, 1);
  const x1 = z1;
  const x2 = rho * z1 + Math.sqrt(1 - rho * rho) * z2;
  return [x1, x2];
}

/**
 * Simulate investment returns using Geometric Brownian Motion
 * Returns monthly multiplier (e.g., 1.007 for 0.7% monthly return)
 */
function simulateInvestmentReturn(
  annualReturn: number,
  annualVolatility: number
): number {
  // Convert annual to monthly
  const dt = 1 / 12;
  const monthlyDrift = annualReturn * dt;
  const monthlyVol = annualVolatility * Math.sqrt(dt);

  // Geometric Brownian Motion
  const shock = boxMuller(0, monthlyVol);
  const returnMultiplier = Math.exp(monthlyDrift - 0.5 * monthlyVol * monthlyVol + shock);

  return returnMultiplier;
}

/**
 * Simulate a single financial trajectory path
 */
function simulateSinglePath(config: SimulationConfig, seed: number): SimulationResult {
  const {
    currentNetWorth,
    currentCash,
    currentInvestments,
    monthlyIncome,
    monthlyExpenses,
    savingsRate,
    investmentReturnAnnual,
    investmentVolatilityAnnual,
    expenseVolatility,
    incomeVolatility,
    emergencyProbabilityMonthly,
    emergencyMeanCost,
    emergencyStdDev,
    timeHorizonMonths,
    inflationRate = 0,
  } = config;

  let cash = currentCash;
  let investments = currentInvestments;
  let netWorth = currentNetWorth;

  const monthlyBalances: number[] = [cash];
  const monthlyNetWorth: number[] = [netWorth];
  let emergencyCount = 0;
  let monthsOfRunway = timeHorizonMonths;

  for (let month = 1; month <= timeHorizonMonths; month++) {
    // 1. Income (with volatility)
    const incomeShock = boxMuller(0, incomeVolatility);
    const actualIncome = monthlyIncome * (1 + incomeShock);

    // 2. Expenses (with volatility)
    const expenseShock = boxMuller(0, expenseVolatility);
    const actualExpenses = monthlyExpenses * (1 + expenseShock);

    // 3. Emergency events (Poisson process)
    let emergencyCost = 0;
    if (Math.random() < emergencyProbabilityMonthly) {
      emergencyCost = Math.max(0, boxMuller(emergencyMeanCost, emergencyStdDev));
      emergencyCount++;
    }

    // 4. Investment returns (Geometric Brownian Motion)
    const investmentMultiplier = simulateInvestmentReturn(
      investmentReturnAnnual,
      investmentVolatilityAnnual
    );
    investments = investments * investmentMultiplier;

    // 5. Cash flow
    const savings = actualIncome * savingsRate;
    const totalExpenses = actualExpenses + emergencyCost;
    const netCashFlow = actualIncome - totalExpenses;

    cash += netCashFlow;

    // 6. Rebalancing: if cash is low, sell investments; if cash is high, invest
    const targetCashBuffer = monthlyExpenses * 3; // Keep 3 months buffer

    if (cash < 0) {
      // Need to sell investments to cover expenses
      const deficit = Math.abs(cash);
      if (investments >= deficit) {
        investments -= deficit;
        cash = 0;
      } else {
        // Ran out of money
        cash = 0;
        investments = 0;
        monthsOfRunway = month;
        break;
      }
    } else if (cash > targetCashBuffer && savings > 0) {
      // Invest excess cash
      const excess = cash - targetCashBuffer;
      const amountToInvest = Math.min(excess, savings);
      cash -= amountToInvest;
      investments += amountToInvest;
    }

    netWorth = cash + investments;
    monthlyBalances.push(cash);
    monthlyNetWorth.push(netWorth);

    // Check if depleted
    if (netWorth <= 0) {
      monthsOfRunway = month;
      break;
    }
  }

  // Determine trajectory type
  let trajectoryType: 'success' | 'depleted' | 'growing';
  if (monthsOfRunway < timeHorizonMonths) {
    trajectoryType = 'depleted';
  } else if (netWorth > currentNetWorth * 1.5) {
    trajectoryType = 'growing';
  } else {
    trajectoryType = 'success';
  }

  return {
    runId: seed,
    monthsOfRunway,
    finalBalance: cash,
    monthlyBalances,
    monthlyNetWorth,
    emergencyCount,
    trajectoryType,
  };
}

/**
 * Calculate percentile from sorted array
 */
function calculatePercentile(sortedArray: number[], percentile: number): number {
  const index = (percentile / 100) * (sortedArray.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  if (upper >= sortedArray.length) {
    return sortedArray[sortedArray.length - 1];
  }

  return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
}

/**
 * Main Monte Carlo simulation runner
 */
export function runMonteCarloSimulation(config: SimulationConfig): AggregatedResults {
  const results: SimulationResult[] = [];

  // Run all simulations
  for (let i = 0; i < config.numSimulations; i++) {
    const result = simulateSinglePath(config, i);
    results.push(result);
  }

  // Extract months of runway for statistical analysis
  const monthsArray = results.map(r => r.monthsOfRunway);
  const sortedMonths = [...monthsArray].sort((a, b) => a - b);

  // Calculate percentiles
  const p10 = calculatePercentile(sortedMonths, 10);
  const p25 = calculatePercentile(sortedMonths, 25);
  const p50 = calculatePercentile(sortedMonths, 50);
  const p75 = calculatePercentile(sortedMonths, 75);
  const p90 = calculatePercentile(sortedMonths, 90);

  // Calculate mean
  const mean = monthsArray.reduce((sum, val) => sum + val, 0) / monthsArray.length;

  // Calculate standard deviation
  const variance = monthsArray.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / monthsArray.length;
  const stdDev = Math.sqrt(variance);

  // Calculate probabilities of depletion
  const depletedBy12 = results.filter(r => r.monthsOfRunway <= 12).length / results.length;
  const depletedBy24 = results.filter(r => r.monthsOfRunway <= 24).length / results.length;
  const depletedBy36 = results.filter(r => r.monthsOfRunway <= 36).length / results.length;

  // Value at Risk (95% confidence - 5th percentile)
  const var95 = calculatePercentile(sortedMonths, 5);

  // Conditional VaR (expected value in worst 5%)
  const worst5Percent = sortedMonths.slice(0, Math.floor(sortedMonths.length * 0.05));
  const cvar95 = worst5Percent.reduce((sum, val) => sum + val, 0) / worst5Percent.length;

  // Create distribution histogram
  const bucketSize = Math.max(1, Math.ceil(config.timeHorizonMonths / 50));
  const buckets = new Map<number, number>();

  monthsArray.forEach(months => {
    const bucket = Math.floor(months / bucketSize) * bucketSize;
    buckets.set(bucket, (buckets.get(bucket) || 0) + 1);
  });

  const distributionData = Array.from(buckets.entries())
    .map(([months, count]) => ({
      months,
      count,
      percentage: (count / results.length) * 100,
    }))
    .sort((a, b) => a.months - b.months);

  // Select sample paths for visualization
  const p90Index = Math.floor(results.length * 0.9);
  const p50Index = Math.floor(results.length * 0.5);
  const p10Index = Math.floor(results.length * 0.1);

  const sortedResults = [...results].sort((a, b) => b.monthsOfRunway - a.monthsOfRunway);

  const bestPath = sortedResults[p90Index].monthlyNetWorth;
  const medianPath = sortedResults[p50Index].monthlyNetWorth;
  const worstPath = sortedResults[p10Index].monthlyNetWorth;

  // Select 20 random samples for visualization
  const sampleIndices = Array.from({ length: 20 }, () => Math.floor(Math.random() * results.length));
  const samples = sampleIndices.map(i => results[i].monthlyNetWorth);

  // Scenario analysis
  const top10Percent = results
    .sort((a, b) => b.monthsOfRunway - a.monthsOfRunway)
    .slice(0, Math.floor(results.length * 0.1));

  const bottom10Percent = results
    .sort((a, b) => a.monthsOfRunway - b.monthsOfRunway)
    .slice(0, Math.floor(results.length * 0.1));

  const medianResults = results
    .sort((a, b) => Math.abs(a.monthsOfRunway - p50) - Math.abs(b.monthsOfRunway - p50))
    .slice(0, Math.floor(results.length * 0.1));

  const scenarios = {
    best: {
      avgMonths: top10Percent.reduce((sum, r) => sum + r.monthsOfRunway, 0) / top10Percent.length,
      avgFinalNW: top10Percent.reduce((sum, r) => sum + (r.monthlyNetWorth[r.monthlyNetWorth.length - 1] || 0), 0) / top10Percent.length,
      emergencies: top10Percent.reduce((sum, r) => sum + r.emergencyCount, 0) / top10Percent.length,
    },
    median: {
      avgMonths: medianResults.reduce((sum, r) => sum + r.monthsOfRunway, 0) / medianResults.length,
      avgFinalNW: medianResults.reduce((sum, r) => sum + (r.monthlyNetWorth[r.monthlyNetWorth.length - 1] || 0), 0) / medianResults.length,
      emergencies: medianResults.reduce((sum, r) => sum + r.emergencyCount, 0) / medianResults.length,
    },
    worst: {
      avgMonths: bottom10Percent.reduce((sum, r) => sum + r.monthsOfRunway, 0) / bottom10Percent.length,
      avgFinalNW: bottom10Percent.reduce((sum, r) => sum + (r.monthlyNetWorth[r.monthlyNetWorth.length - 1] || 0), 0) / bottom10Percent.length,
      emergencies: bottom10Percent.reduce((sum, r) => sum + r.emergencyCount, 0) / bottom10Percent.length,
    },
  };

  return {
    p10Months: p10,
    p25Months: p25,
    p50Months: p50,
    p75Months: p75,
    p90Months: p90,
    meanMonths: mean,
    medianMonths: p50,
    stdDevMonths: stdDev,
    probabilityDepletedBy12Mo: depletedBy12,
    probabilityDepletedBy24Mo: depletedBy24,
    probabilityDepletedBy36Mo: depletedBy36,
    valueAtRisk95: var95,
    conditionalVaR95: cvar95,
    distributionData,
    samplePaths: {
      best: bestPath,
      median: medianPath,
      worst: worstPath,
      samples,
    },
    scenarios,
    allResults: results,
  };
}

/**
 * Transform AggregatedResults into format suitable for time-series charting
 * Extracts percentile values at each time point for visualization
 */
export interface MonteCarloChartData {
  dates: string[];
  percentile5: number[];
  percentile25: number[];
  percentile50: number[];
  percentile75: number[];
  percentile95: number[];
}

export function transformForChart(
  results: AggregatedResults,
  startDate: Date
): MonteCarloChartData {
  const allResults = results.allResults;

  // Determine time horizon from first result
  const timeHorizon = allResults[0]?.monthlyNetWorth.length || 0;

  // Generate dates array
  const dates: string[] = [];
  const percentile5: number[] = [];
  const percentile25: number[] = [];
  const percentile50: number[] = [];
  const percentile75: number[] = [];
  const percentile95: number[] = [];

  // For each month, calculate percentiles across all simulations
  for (let month = 0; month < timeHorizon; month++) {
    // Generate date
    const futureDate = new Date(startDate);
    futureDate.setMonth(futureDate.getMonth() + month);
    dates.push(futureDate.toISOString());

    // Extract values at this month from all simulations
    const valuesAtMonth = allResults
      .map(r => r.monthlyNetWorth[month])
      .filter(v => v !== undefined)
      .sort((a, b) => a - b);

    // Calculate percentiles
    if (valuesAtMonth.length > 0) {
      percentile5.push(calculatePercentile(valuesAtMonth, 5));
      percentile25.push(calculatePercentile(valuesAtMonth, 25));
      percentile50.push(calculatePercentile(valuesAtMonth, 50));
      percentile75.push(calculatePercentile(valuesAtMonth, 75));
      percentile95.push(calculatePercentile(valuesAtMonth, 95));
    } else {
      // Fallback to 0 if no data
      percentile5.push(0);
      percentile25.push(0);
      percentile50.push(0);
      percentile75.push(0);
      percentile95.push(0);
    }
  }

  return {
    dates,
    percentile5,
    percentile25,
    percentile50,
    percentile75,
    percentile95,
  };
}

/**
 * Helper function to create a default simulation config from user profile
 */
export function createSimulationConfig(params: {
  currentNetWorth: number;
  currentCash: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  riskProfile?: 'conservative' | 'moderate' | 'aggressive';
}): SimulationConfig {
  const { currentNetWorth, currentCash, monthlyIncome, monthlyExpenses, savingsRate, riskProfile = 'moderate' } = params;

  const currentInvestments = currentNetWorth - currentCash;

  // Risk profiles determine volatility assumptions
  const profiles = {
    conservative: {
      investmentReturn: 0.05, // 5% annual
      investmentVolatility: 0.10, // 10% volatility
      expenseVolatility: 0.10,
      incomeVolatility: 0.05,
      emergencyProb: 0.03,
    },
    moderate: {
      investmentReturn: 0.07, // 7% annual
      investmentVolatility: 0.15, // 15% volatility
      expenseVolatility: 0.15,
      incomeVolatility: 0.10,
      emergencyProb: 0.05,
    },
    aggressive: {
      investmentReturn: 0.09, // 9% annual
      investmentVolatility: 0.20, // 20% volatility
      expenseVolatility: 0.20,
      incomeVolatility: 0.15,
      emergencyProb: 0.07,
    },
  };

  const profile = profiles[riskProfile];

  return {
    currentNetWorth,
    currentCash,
    currentInvestments,
    monthlyIncome,
    monthlyExpenses,
    savingsRate,
    investmentReturnAnnual: profile.investmentReturn,
    investmentVolatilityAnnual: profile.investmentVolatility,
    expenseVolatility: profile.expenseVolatility,
    incomeVolatility: profile.incomeVolatility,
    emergencyProbabilityMonthly: profile.emergencyProb,
    emergencyMeanCost: monthlyExpenses * 0.5, // Emergency costs ~50% of monthly expenses
    emergencyStdDev: monthlyExpenses * 0.25,
    numSimulations: 10000,
    timeHorizonMonths: 120, // 10 years
    inflationRate: 0.03,
  };
}
