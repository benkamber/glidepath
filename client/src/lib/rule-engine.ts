/**
 * Rule-based recommendation engine
 * Analyzes user data and provides actionable financial suggestions
 */

export type SuggestionPriority = "critical" | "high" | "medium" | "low";

export interface Suggestion {
  id: string;
  priority: SuggestionPriority;
  title: string;
  description: string;
  category: "savings" | "investing" | "growth" | "risk" | "career" | "expenses";
  impact: {
    metric: string;
    before: number;
    after: number;
    improvement: number;
    unit: string;
  };
  actionSteps: string[];
  confidence: number; // 0-100
  reasoning: string;
  icon: string; // lucide-react icon name
}

interface UserData {
  currentNetWorth: number;
  cash: number;
  age: number;
  annualIncome: number;
  savingsRate: number; // percentage
  entries: Array<{ date: string; totalNetWorth: number; cash: number }>;
  averageAnnualGrowth: number; // percentage
  recentVelocity?: number; // $ per day
  overallVelocity?: number; // $ per day
}

/**
 * Rule 1: Savings Rate Optimization
 */
function evaluateSavingsRate(data: UserData): Suggestion | null {
  const { savingsRate, annualIncome, age } = data;

  // Target savings rates by age
  const targetRate = age < 30 ? 25 : age < 40 ? 30 : age < 50 ? 35 : 40;

  if (savingsRate < targetRate) {
    const recommendedIncrease = Math.min(5, targetRate - savingsRate);
    const newRate = savingsRate + recommendedIncrease;
    const annualIncrease = annualIncome * (recommendedIncrease / 100);

    // Calculate 10-year impact
    const currentPath = calculateFutureValue(
      data.currentNetWorth,
      annualIncome * (savingsRate / 100),
      10,
      0.07
    );
    const improvedPath = calculateFutureValue(
      data.currentNetWorth,
      annualIncome * (newRate / 100),
      10,
      0.07
    );
    const improvement = improvedPath - currentPath;

    return {
      id: "savings-rate-low",
      priority: savingsRate < 20 ? "critical" : savingsRate < 25 ? "high" : "medium",
      title: "Increase Your Savings Rate",
      description: `Your savings rate of ${savingsRate.toFixed(0)}% is below the recommended ${targetRate}% for your age. A small increase can have a massive compounding effect.`,
      category: "savings",
      impact: {
        metric: "10-Year Net Worth",
        before: currentPath,
        after: improvedPath,
        improvement,
        unit: "$",
      },
      actionSteps: [
        `Increase savings rate from ${savingsRate.toFixed(0)}% to ${newRate.toFixed(0)}% (${formatCurrency(annualIncrease)}/year)`,
        "Set up automatic transfers on payday to savings/investment accounts",
        "Review discretionary spending for opportunities to cut",
        "Track expenses for 1 month to identify savings opportunities",
      ],
      confidence: 95,
      reasoning: `Industry standard for age ${age} is ${targetRate}%. Even a ${recommendedIncrease}% increase can add ${formatCurrency(improvement)} over 10 years through compound growth.`,
      icon: "PiggyBank",
    };
  }

  return null;
}

/**
 * Rule 2: High Cash Allocation Warning
 */
function evaluateHighCashAllocation(data: UserData): Suggestion | null {
  const { cash, currentNetWorth, annualIncome } = data;
  const cashPercentage = (cash / currentNetWorth) * 100;

  // Emergency fund: 6 months expenses (assume 50% of income)
  const emergencyFund = (annualIncome * 0.5) / 2;
  const excessCash = Math.max(0, cash - emergencyFund);

  if (cashPercentage > 30 && excessCash > 10000) {
    // Calculate opportunity cost of holding cash vs investing at 7%
    const cashReturn = cash * 0.02; // 2% HYSA
    const investmentReturn = cash * 0.07; // 7% market
    const opportunityCost = investmentReturn - cashReturn;

    // 10-year opportunity cost
    const cashGrowth = calculateFutureValue(cash, 0, 10, 0.02);
    const investmentGrowth = calculateFutureValue(cash, 0, 10, 0.07);
    const tenYearCost = investmentGrowth - cashGrowth;

    return {
      id: "high-cash-allocation",
      priority: cashPercentage > 50 ? "high" : "medium",
      title: "Too Much Cash on the Sidelines",
      description: `${cashPercentage.toFixed(0)}% of your net worth is in cash. While emergency funds are important, excess cash loses value to inflation and misses market returns.`,
      category: "investing",
      impact: {
        metric: "Annual Opportunity Cost",
        before: cashReturn,
        after: investmentReturn,
        improvement: opportunityCost,
        unit: "$/year",
      },
      actionSteps: [
        `Keep ${formatCurrency(emergencyFund)} as emergency fund (6 months expenses)`,
        `Consider investing ${formatCurrency(excessCash)} excess cash`,
        "Dollar-cost average over 3-6 months to reduce timing risk",
        "Use tax-advantaged accounts first (401k, IRA, HSA)",
        "Consider index funds for diversified, low-cost investing",
      ],
      confidence: 90,
      reasoning: `Historical data shows cash loses ~3% per year to inflation. Over 10 years, keeping ${formatCurrency(cash)} in cash vs. investing costs you ${formatCurrency(tenYearCost)} in growth.`,
      icon: "TrendingDown",
    };
  }

  return null;
}

/**
 * Rule 3: Declining Velocity Alert
 */
function evaluateDecliningVelocity(data: UserData): Suggestion | null {
  const { recentVelocity, overallVelocity, entries, annualIncome } = data;

  if (!recentVelocity || !overallVelocity || entries.length < 5) {
    return null; // Need sufficient data
  }

  const velocityChange = ((recentVelocity - overallVelocity) / overallVelocity) * 100;

  if (velocityChange < -20) {
    // Velocity has declined by more than 20%
    const dailyDifference = overallVelocity - recentVelocity;
    const annualDifference = dailyDifference * 365;

    return {
      id: "declining-velocity",
      priority: velocityChange < -40 ? "critical" : "high",
      title: "Wealth Growth Has Slowed Significantly",
      description: `Your recent wealth accumulation rate is ${Math.abs(velocityChange).toFixed(0)}% slower than your historical average. This trend needs attention.`,
      category: "growth",
      impact: {
        metric: "Annual Growth Rate",
        before: overallVelocity * 365,
        after: recentVelocity * 365,
        improvement: -annualDifference,
        unit: "$/year",
      },
      actionSteps: [
        "Review recent spending - have expenses increased?",
        "Check investment performance - are you in cash during a bull market?",
        "Verify income is still on track - any changes in compensation?",
        "Review savings rate - has it decreased recently?",
        "Consider if major purchases or life events temporarily impacted growth",
      ],
      confidence: 85,
      reasoning: `You're currently accumulating ${formatCurrency(recentVelocity * 365)}/year vs. historical ${formatCurrency(overallVelocity * 365)}/year. If this continues, you'll fall ${formatCurrency(annualDifference)} behind annually.`,
      icon: "TrendingDown",
    };
  } else if (velocityChange > 50) {
    // Velocity has increased significantly - positive reinforcement
    const dailyDifference = recentVelocity - overallVelocity;
    const annualDifference = dailyDifference * 365;

    return {
      id: "accelerating-velocity",
      priority: "low",
      title: "Excellent Progress - You're Accelerating!",
      description: `Your recent wealth accumulation is ${velocityChange.toFixed(0)}% faster than your historical average. Whatever you're doing, keep it up!`,
      category: "growth",
      impact: {
        metric: "Annual Growth Rate",
        before: overallVelocity * 365,
        after: recentVelocity * 365,
        improvement: annualDifference,
        unit: "$/year",
      },
      actionSteps: [
        "Document what's working (increased income, better savings, market gains)",
        "Maintain current strategy - consistency is key",
        "Consider if this pace is sustainable long-term",
        "Review if you can afford to increase FIRE target or retire earlier",
      ],
      confidence: 90,
      reasoning: `You're outpacing your average by ${formatCurrency(annualDifference)}/year. This acceleration can significantly move up your FIRE date.`,
      icon: "TrendingUp",
    };
  }

  return null;
}

/**
 * Rule 4: Emergency Fund Check
 */
function evaluateEmergencyFund(data: UserData): Suggestion | null {
  const { cash, annualIncome } = data;
  const monthlyExpenses = (annualIncome * (1 - data.savingsRate / 100)) / 12;
  const emergencyFundNeeded = monthlyExpenses * 6;

  if (cash < emergencyFundNeeded) {
    const deficit = emergencyFundNeeded - cash;

    return {
      id: "emergency-fund-insufficient",
      priority: cash < monthlyExpenses * 3 ? "critical" : "high",
      title: "Emergency Fund Below Recommended Level",
      description: `You have ${formatCurrency(cash)} in cash, but should have 6 months of expenses (${formatCurrency(emergencyFundNeeded)}) for financial security.`,
      category: "risk",
      impact: {
        metric: "Emergency Fund Coverage",
        before: cash / monthlyExpenses,
        after: 6,
        improvement: (emergencyFundNeeded - cash) / monthlyExpenses,
        unit: "months",
      },
      actionSteps: [
        `Build emergency fund to ${formatCurrency(emergencyFundNeeded)} (6 months expenses)`,
        `Currently short by ${formatCurrency(deficit)}`,
        "Temporarily prioritize cash savings over investing",
        "Set up automatic transfers to high-yield savings account",
        "Once emergency fund is complete, redirect savings to investments",
      ],
      confidence: 100,
      reasoning: "Emergency fund protects against job loss, medical expenses, or unexpected costs without derailing long-term investments. This is foundational financial security.",
      icon: "Shield",
    };
  }

  return null;
}

/**
 * Rule 5: Investment Diversification
 */
function evaluateInvestmentDiversification(data: UserData): Suggestion | null {
  const { cash, currentNetWorth } = data;
  const investedAmount = currentNetWorth - cash;
  const investedPercentage = (investedAmount / currentNetWorth) * 100;

  // If less than 50% invested (after accounting for emergency fund)
  const monthlyExpenses = (data.annualIncome * (1 - data.savingsRate / 100)) / 12;
  const emergencyFund = monthlyExpenses * 6;
  const excessCash = Math.max(0, cash - emergencyFund);
  const shouldBeInvested = currentNetWorth - emergencyFund;
  const actuallyInvested = investedAmount;

  if (actuallyInvested < shouldBeInvested * 0.7 && excessCash > 5000) {
    return {
      id: "under-invested",
      priority: "medium",
      title: "Consider Increasing Investment Allocation",
      description: `Only ${investedPercentage.toFixed(0)}% of your net worth is invested. For long-term wealth building, a higher allocation to growth assets is typically beneficial.`,
      category: "investing",
      impact: {
        metric: "Invested Amount",
        before: investedAmount,
        after: shouldBeInvested,
        improvement: shouldBeInvested - investedAmount,
        unit: "$",
      },
      actionSteps: [
        `Consider investing ${formatCurrency(excessCash)} excess cash`,
        "Start with low-cost index funds (VTI, VTSAX, or similar)",
        "Use dollar-cost averaging to reduce timing risk",
        "Ensure you're maxing out tax-advantaged accounts first",
        "Maintain 6-month emergency fund before increasing investments",
      ],
      confidence: 85,
      reasoning: `Historical data shows diversified stock portfolios average 10% nominal returns. At ${data.age} years old, you have time to benefit from growth.`,
      icon: "LineChart",
    };
  }

  return null;
}

/**
 * Helper: Calculate future value with contributions
 */
function calculateFutureValue(
  present: number,
  annualContribution: number,
  years: number,
  rate: number
): number {
  let value = present;
  for (let i = 0; i < years; i++) {
    value = value * (1 + rate) + annualContribution;
  }
  return value;
}

/**
 * Helper: Format currency
 */
function formatCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  } else if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}k`;
  } else {
    return `$${Math.round(value).toLocaleString()}`;
  }
}

/**
 * Main function: Generate all suggestions
 */
export function generateSuggestions(data: UserData): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // Run all rules
  const rules = [
    evaluateSavingsRate,
    evaluateHighCashAllocation,
    evaluateDecliningVelocity,
    evaluateEmergencyFund,
    evaluateInvestmentDiversification,
  ];

  for (const rule of rules) {
    const suggestion = rule(data);
    if (suggestion) {
      suggestions.push(suggestion);
    }
  }

  // Sort by priority
  const priorityOrder: Record<SuggestionPriority, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  return suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

/**
 * Get priority badge color
 */
export function getPriorityColor(priority: SuggestionPriority): string {
  switch (priority) {
    case "critical":
      return "#ef4444"; // red
    case "high":
      return "#f97316"; // orange
    case "medium":
      return "#fbbf24"; // yellow
    case "low":
      return "#10b981"; // green
  }
}

/**
 * Get category icon
 */
export function getCategoryIcon(category: Suggestion["category"]): string {
  switch (category) {
    case "savings":
      return "PiggyBank";
    case "investing":
      return "TrendingUp";
    case "growth":
      return "BarChart";
    case "risk":
      return "Shield";
    case "career":
      return "Briefcase";
    case "expenses":
      return "DollarSign";
  }
}
