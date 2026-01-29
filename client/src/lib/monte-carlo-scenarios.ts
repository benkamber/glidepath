/**
 * Multi-scenario Monte Carlo simulation
 * Runs simulations across different annual return rate assumptions
 * to show how market conditions affect wealth trajectory
 */

export interface ScenarioResult {
  name: string;
  description: string;
  annualReturnRate: number;
  percentile5: number[];
  percentile25: number[];
  percentile50: number[];
  percentile75: number[];
  percentile95: number[];
  mean: number[];
  dates: Date[];
  finalMedian: number;
  finalMean: number;
  color: string;
}

export interface MultiScenarioResult {
  scenarios: ScenarioResult[];
  historicalTrajectory?: ScenarioResult;
  dates: Date[];
  comparisonMetrics: {
    bestCase: { scenario: string; value: number };
    worstCase: { scenario: string; value: number };
    spread: number;
    historicalPerformance?: string;
  };
}

/**
 * Run Monte Carlo simulation for a single scenario
 */
function runMonteCarloSimulation(
  initialValue: number,
  annualContribution: number,
  annualReturnRate: number,
  volatility: number,
  years: number,
  simulations: number = 1000
): {
  percentile5: number[];
  percentile25: number[];
  percentile50: number[];
  percentile75: number[];
  percentile95: number[];
  mean: number[];
} {
  const months = years * 12;
  const monthlyRate = annualReturnRate / 12;
  const monthlyVolatility = volatility / Math.sqrt(12);
  const monthlyContribution = annualContribution / 12;

  // Run simulations
  const results: number[][] = [];
  for (let sim = 0; sim < simulations; sim++) {
    const path: number[] = [initialValue];
    let balance = initialValue;

    for (let month = 1; month <= months; month++) {
      // Random return from normal distribution
      const randomReturn = randomNormal(monthlyRate, monthlyVolatility);
      balance = balance * (1 + randomReturn) + monthlyContribution;
      path.push(balance);
    }

    results.push(path);
  }

  // Calculate percentiles at each time step
  const percentile5: number[] = [];
  const percentile25: number[] = [];
  const percentile50: number[] = [];
  const percentile75: number[] = [];
  const percentile95: number[] = [];
  const mean: number[] = [];

  for (let month = 0; month <= months; month++) {
    const values = results.map((path) => path[month]).sort((a, b) => a - b);

    percentile5.push(values[Math.floor(simulations * 0.05)]);
    percentile25.push(values[Math.floor(simulations * 0.25)]);
    percentile50.push(values[Math.floor(simulations * 0.50)]);
    percentile75.push(values[Math.floor(simulations * 0.75)]);
    percentile95.push(values[Math.floor(simulations * 0.95)]);

    const avg = values.reduce((sum, val) => sum + val, 0) / simulations;
    mean.push(avg);
  }

  return {
    percentile5,
    percentile25,
    percentile50,
    percentile75,
    percentile95,
    mean,
  };
}

/**
 * Generate random number from normal distribution (Box-Muller transform)
 */
function randomNormal(mean: number, stdDev: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return z0 * stdDev + mean;
}

/**
 * Calculate historical trajectory from actual data
 */
function calculateHistoricalTrajectory(
  entries: Array<{ date: string; netWorth: number }>
): ScenarioResult | undefined {
  if (entries.length < 2) return undefined;

  const sorted = [...entries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Calculate actual annual return rate
  const firstValue = sorted[0].netWorth;
  const lastValue = sorted[sorted.length - 1].netWorth;
  const years =
    (new Date(sorted[sorted.length - 1].date).getTime() - new Date(sorted[0].date).getTime()) /
    (365.25 * 24 * 60 * 60 * 1000);

  const annualReturnRate = years > 0 ? Math.pow(lastValue / firstValue, 1 / years) - 1 : 0;

  // Create trajectory from actual data
  const values = sorted.map((e) => e.netWorth);
  const dates = sorted.map((e) => new Date(e.date));

  return {
    name: "Your Historical Performance",
    description: `Based on your actual data (${annualReturnRate >= 0 ? "+" : ""}${(annualReturnRate * 100).toFixed(1)}% annual return)`,
    annualReturnRate,
    percentile5: values,
    percentile25: values,
    percentile50: values,
    percentile75: values,
    percentile95: values,
    mean: values,
    dates,
    finalMedian: lastValue,
    finalMean: lastValue,
    color: "#ff8c00", // Orange
  };
}

/**
 * Run multi-scenario Monte Carlo analysis
 */
export function runMultiScenarioAnalysis(
  currentNetWorth: number,
  annualSavings: number,
  years: number = 10,
  historicalData?: Array<{ date: string; netWorth: number }>
): MultiScenarioResult {
  // Define scenarios
  const scenarios = [
    {
      name: "Conservative",
      description: "3% annual return (recession or bonds)",
      rate: 0.03,
      volatility: 0.08,
      color: "#ef4444", // Red
    },
    {
      name: "Below Average",
      description: "4% annual return (mixed bonds/stocks)",
      rate: 0.04,
      volatility: 0.10,
      color: "#f97316", // Orange
    },
    {
      name: "Moderate",
      description: "5% annual return (conservative stocks)",
      rate: 0.05,
      volatility: 0.12,
      color: "#fbbf24", // Yellow
    },
    {
      name: "Above Average",
      description: "6% annual return (balanced portfolio)",
      rate: 0.06,
      volatility: 0.14,
      color: "#10b981", // Green
    },
    {
      name: "Historical Average",
      description: "7% annual return (S&P 500 real return)",
      rate: 0.07,
      volatility: 0.15,
      color: "#6366f1", // Indigo
    },
  ];

  // Generate dates
  const startDate = new Date();
  const dates: Date[] = [];
  for (let month = 0; month <= years * 12; month++) {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + month);
    dates.push(date);
  }

  // Run simulations for each scenario
  const scenarioResults: ScenarioResult[] = scenarios.map((scenario) => {
    const result = runMonteCarloSimulation(
      currentNetWorth,
      annualSavings,
      scenario.rate,
      scenario.volatility,
      years
    );

    return {
      name: scenario.name,
      description: scenario.description,
      annualReturnRate: scenario.rate,
      ...result,
      dates,
      finalMedian: result.percentile50[result.percentile50.length - 1],
      finalMean: result.mean[result.mean.length - 1],
      color: scenario.color,
    };
  });

  // Calculate historical trajectory if data provided
  const historicalTrajectory = historicalData
    ? calculateHistoricalTrajectory(historicalData)
    : undefined;

  // Calculate comparison metrics
  const finalValues = scenarioResults.map((s) => s.finalMedian);
  const bestCase = {
    scenario: scenarioResults[finalValues.indexOf(Math.max(...finalValues))].name,
    value: Math.max(...finalValues),
  };
  const worstCase = {
    scenario: scenarioResults[finalValues.indexOf(Math.min(...finalValues))].name,
    value: Math.min(...finalValues),
  };
  const spread = bestCase.value - worstCase.value;

  // Determine which scenario historical performance is closest to
  let historicalPerformance: string | undefined;
  if (historicalTrajectory) {
    const historicalRate = historicalTrajectory.annualReturnRate;
    const closest = scenarioResults.reduce((prev, curr) =>
      Math.abs(curr.annualReturnRate - historicalRate) <
      Math.abs(prev.annualReturnRate - historicalRate)
        ? curr
        : prev
    );
    historicalPerformance = `Closest to ${closest.name}`;
  }

  return {
    scenarios: scenarioResults,
    historicalTrajectory,
    dates,
    comparisonMetrics: {
      bestCase,
      worstCase,
      spread,
      historicalPerformance,
    },
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

/**
 * Calculate probability of reaching target
 */
export function calculateTargetProbability(
  scenario: ScenarioResult,
  targetAmount: number
): number {
  const finalValue = scenario.finalMedian;

  // Estimate probability based on percentiles
  if (targetAmount <= scenario.percentile5[scenario.percentile5.length - 1]) {
    return 0.95; // Very likely
  } else if (targetAmount <= scenario.percentile25[scenario.percentile25.length - 1]) {
    return 0.75;
  } else if (targetAmount <= scenario.percentile50[scenario.percentile50.length - 1]) {
    return 0.50;
  } else if (targetAmount <= scenario.percentile75[scenario.percentile75.length - 1]) {
    return 0.25;
  } else if (targetAmount <= scenario.percentile95[scenario.percentile95.length - 1]) {
    return 0.05;
  } else {
    return 0.01; // Very unlikely
  }
}
