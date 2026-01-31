/**
 * P1-4: Demo Mode - Zero Friction Onboarding
 * Pre-populated realistic data for instant demo experience
 */

export interface DemoProfile {
  age: number;
  yearsInWorkforce: number;
  occupation: string;
  level: string;
  autoDetectLevel: boolean;
  metro: string;
  education: string;
  totalCompensation: number;
  targetAllocation: {
    cashPercent: number;
    investmentPercent: number;
    otherPercent: number;
    taxTreatment: {
      taxablePercent: number;
      taxAdvantagePercent: number;
    };
  };
  monthlyExpenses: number;
  targetRetirementAge: number;
  targetRetirementSpending: number;
}

export interface DemoEntry {
  date: string;
  totalNetWorth: number;
  cash: number;
  investment: number;
}

/**
 * Demo profile: 32-year-old Senior Software Engineer in San Francisco
 * Shows realistic HENRY trajectory with strong savings rate
 */
export const DEMO_PROFILE: DemoProfile = {
  age: 32,
  yearsInWorkforce: 10,
  occupation: "software_engineer",
  level: "senior",
  autoDetectLevel: true,
  metro: "san_francisco",
  education: "bachelors",
  totalCompensation: 220000, // Base + Bonus + RSU
  targetAllocation: {
    cashPercent: 0.10,        // 10% cash (emergency fund)
    investmentPercent: 0.85,  // 85% investments (aggressive accumulation)
    otherPercent: 0.05,       // 5% other (car, etc.)
    taxTreatment: {
      taxablePercent: 0.20,      // 20% taxable brokerage
      taxAdvantagePercent: 0.80, // 80% in 401k/IRA (maxing out)
    },
  },
  monthlyExpenses: 5500, // $66k/year (~30% of gross)
  targetRetirementAge: 55, // FIRE goal
  targetRetirementSpending: 6000, // $72k/year in retirement
};

/**
 * Demo net worth history: 6 years of compounding growth
 * Shows realistic trajectory with salary increases, investment returns, and consistent savings
 */
export const DEMO_ENTRIES: DemoEntry[] = [
  { date: "2020-01-01", totalNetWorth: 80000, cash: 15000, investment: 65000 },   // Starting point
  { date: "2021-01-01", totalNetWorth: 150000, cash: 20000, investment: 130000 }, // +$70k (+88%)
  { date: "2022-01-01", totalNetWorth: 250000, cash: 25000, investment: 225000 }, // +$100k (+67%)
  { date: "2023-01-01", totalNetWorth: 380000, cash: 30000, investment: 350000 }, // +$130k (+52%)
  { date: "2024-01-01", totalNetWorth: 550000, cash: 40000, investment: 510000 }, // +$170k (+45%)
  { date: "2025-01-01", totalNetWorth: 750000, cash: 50000, investment: 700000 }, // +$200k (+36%)
];

/**
 * Load demo data into localStorage and mark as demo mode
 */
export function loadDemoData(): void {
  localStorage.setItem("user-profile", JSON.stringify(DEMO_PROFILE));
  localStorage.setItem("net-worth-entries", JSON.stringify(DEMO_ENTRIES));
  localStorage.setItem("nw_tracker_demo_mode", "true");
  localStorage.setItem("nw_tracker_onboarded", "true");
}

/**
 * Check if the current session is in demo mode
 */
export function isDemoMode(): boolean {
  return localStorage.getItem("nw_tracker_demo_mode") === "true";
}

/**
 * Clear demo mode flag
 */
export function exitDemoMode(): void {
  localStorage.removeItem("nw_tracker_demo_mode");
}
