/**
 * Shared types between main thread and worker
 */

export interface SimulationConfig {
  // Current state
  currentNetWorth: number;
  currentCash: number;
  currentInvestments: number;
  currentOther?: number; // Other assets (vehicles, etc.) that don't grow

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

  // Tax treatment
  taxTreatment?: {
    taxablePercent: number;      // e.g., 0.30 for 30% in taxable accounts
    taxAdvantagePercent: number; // e.g., 0.70 for 70% in 401k/IRA
  };
  taxRate?: number; // Default 0.15 (15% LTCG)
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

// Worker message types
export interface WorkerRequest {
  type: 'RUN_SIMULATION';
  config: SimulationConfig;
  requestId: string;
}

export interface WorkerResponse {
  type: 'SIMULATION_COMPLETE' | 'SIMULATION_PROGRESS' | 'SIMULATION_ERROR';
  requestId: string;
  results?: AggregatedResults;
  progress?: number; // 0-1
  error?: string;
}
