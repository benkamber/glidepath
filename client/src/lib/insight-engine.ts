/**
 * Insight Engine - Observational Analysis
 * Analyzes user data and provides factual observations and patterns
 * (Not prescriptive advice)
 */

export type InsightType = "pattern" | "trend" | "anomaly" | "milestone";
export type InsightSignificance = "high" | "medium" | "low";

export interface Insight {
  id: string;
  type: InsightType;
  significance: InsightSignificance;
  title: string;
  observation: string;
  dataPoints: string[];
  detectedAt: string;
  icon: string;
  trend?: "accelerating" | "decelerating" | "stable" | "volatile";
}

interface UserData {
  currentNetWorth: number;
  cash: number;
  age: number;
  annualIncome: number;
  savingsRate: number;
  entries: Array<{ date: string; totalNetWorth: number; cash: number }>;
  averageAnnualGrowth: number;
  recentVelocity?: number;
  overallVelocity?: number;
}

/**
 * Pattern Recognition: Identify recurring behaviors
 */
function detectAccumulationPatterns(data: UserData): Insight[] {
  const insights: Insight[] = [];
  const { entries, currentNetWorth, averageAnnualGrowth } = data;

  if (entries.length < 4) return insights;

  // Calculate growth rates between entries
  const growthRates = [];
  for (let i = 1; i < entries.length; i++) {
    const growth = entries[i].totalNetWorth - entries[i - 1].totalNetWorth;
    const rate = entries[i - 1].totalNetWorth > 0
      ? (growth / entries[i - 1].totalNetWorth) * 100
      : 0;
    growthRates.push(rate);
  }

  // Check for acceleration
  if (growthRates.length >= 3) {
    const recentGrowth = growthRates.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const olderGrowth = growthRates.slice(0, -3).reduce((a, b) => a + b, 0) / Math.max(1, growthRates.length - 3);

    if (recentGrowth > olderGrowth * 1.3) {
      insights.push({
        id: "pattern-acceleration",
        type: "pattern",
        significance: "high",
        title: "Accumulation Accelerating",
        observation: `Your wealth accumulation rate has increased ${((recentGrowth / olderGrowth - 1) * 100).toFixed(0)}% compared to your historical average. Recent growth rate: ${recentGrowth.toFixed(1)}% vs historical ${olderGrowth.toFixed(1)}%.`,
        dataPoints: [
          `Current growth rate: ${recentGrowth.toFixed(1)}%`,
          `Historical average: ${olderGrowth.toFixed(1)}%`,
          `Acceleration: +${((recentGrowth / olderGrowth - 1) * 100).toFixed(0)}%`,
        ],
        detectedAt: new Date().toISOString(),
        icon: "TrendingUp",
        trend: "accelerating",
      });
    } else if (recentGrowth < olderGrowth * 0.7) {
      insights.push({
        id: "pattern-deceleration",
        type: "pattern",
        significance: "medium",
        title: "Growth Rate Declining",
        observation: `Your recent wealth accumulation has slowed by ${((1 - recentGrowth / olderGrowth) * 100).toFixed(0)}% compared to your historical pace.`,
        dataPoints: [
          `Current growth rate: ${recentGrowth.toFixed(1)}%`,
          `Historical average: ${olderGrowth.toFixed(1)}%`,
          `Deceleration: -${((1 - recentGrowth / olderGrowth) * 100).toFixed(0)}%`,
        ],
        detectedAt: new Date().toISOString(),
        icon: "TrendingDown",
        trend: "decelerating",
      });
    }
  }

  return insights;
}

/**
 * Trend Analysis: Directional changes over time
 */
function analyzeTrends(data: UserData): Insight[] {
  const insights: Insight[] = [];
  const { entries, currentNetWorth, recentVelocity, overallVelocity } = data;

  // Velocity comparison
  if (recentVelocity !== undefined && overallVelocity !== undefined) {
    const velocityChange = ((recentVelocity / overallVelocity - 1) * 100);

    if (Math.abs(velocityChange) > 20) {
      const dailyRate = recentVelocity;
      const annualProjection = dailyRate * 365;

      insights.push({
        id: "trend-velocity-shift",
        type: "trend",
        significance: Math.abs(velocityChange) > 50 ? "high" : "medium",
        title: `Wealth Velocity ${velocityChange > 0 ? "Increasing" : "Decreasing"}`,
        observation: `Your current wealth accumulation rate is $${Math.abs(dailyRate).toFixed(0)}/day, ${Math.abs(velocityChange).toFixed(0)}% ${velocityChange > 0 ? "faster" : "slower"} than your long-term average. At this pace: $${(annualProjection / 1000).toFixed(0)}K/year.`,
        dataPoints: [
          `Current velocity: $${dailyRate.toFixed(0)}/day`,
          `Long-term average: $${overallVelocity.toFixed(0)}/day`,
          `Annualized rate: $${(annualProjection / 1000).toFixed(0)}K/year`,
        ],
        detectedAt: new Date().toISOString(),
        icon: "BarChart",
        trend: velocityChange > 0 ? "accelerating" : "decelerating",
      });
    }
  }

  // Cash allocation pattern
  if (entries.length >= 3) {
    const cashRatios = entries.slice(-3).map(e =>
      e.totalNetWorth > 0 ? (e.cash / e.totalNetWorth) * 100 : 0
    );
    const avgCashRatio = cashRatios.reduce((a, b) => a + b, 0) / cashRatios.length;

    if (avgCashRatio > 30) {
      insights.push({
        id: "trend-high-cash",
        type: "trend",
        significance: "medium",
        title: "High Cash Concentration",
        observation: `Your portfolio averages ${avgCashRatio.toFixed(0)}% cash over recent periods. Cash currently: $${(data.cash / 1000).toFixed(0)}K (${((data.cash / data.currentNetWorth) * 100).toFixed(0)}% of net worth).`,
        dataPoints: [
          `Current cash: $${(data.cash / 1000).toFixed(0)}K`,
          `Cash ratio: ${((data.cash / data.currentNetWorth) * 100).toFixed(0)}%`,
          `Average over last 3 periods: ${avgCashRatio.toFixed(0)}%`,
        ],
        detectedAt: new Date().toISOString(),
        icon: "DollarSign",
        trend: "stable",
      });
    }
  }

  return insights;
}

/**
 * Anomaly Detection: Unusual events or outliers
 */
function detectAnomalies(data: UserData): Insight[] {
  const insights: Insight[] = [];
  const { entries } = data;

  if (entries.length < 4) return insights;

  // Look for sudden jumps or drops
  for (let i = 1; i < entries.length; i++) {
    const change = entries[i].totalNetWorth - entries[i - 1].totalNetWorth;
    const percentChange = entries[i - 1].totalNetWorth > 0
      ? (change / entries[i - 1].totalNetWorth) * 100
      : 0;

    // Significant jump (>30%)
    if (percentChange > 30) {
      insights.push({
        id: `anomaly-jump-${i}`,
        type: "anomaly",
        significance: "high",
        title: "Significant Wealth Jump Detected",
        observation: `Net worth increased by ${percentChange.toFixed(0)}% between ${entries[i - 1].date} and ${entries[i].date}. Change: $${(change / 1000).toFixed(0)}K. Potential causes: bonus/equity vesting, inheritance, asset sale, or investment gains.`,
        dataPoints: [
          `Before: $${(entries[i - 1].totalNetWorth / 1000).toFixed(0)}K`,
          `After: $${(entries[i].totalNetWorth / 1000).toFixed(0)}K`,
          `Change: +$${(change / 1000).toFixed(0)}K (+${percentChange.toFixed(0)}%)`,
        ],
        detectedAt: new Date().toISOString(),
        icon: "TrendingUp",
        trend: "volatile",
      });
      break; // Only report most recent anomaly
    }

    // Significant drop (>20%)
    if (percentChange < -20) {
      insights.push({
        id: `anomaly-drop-${i}`,
        type: "anomaly",
        significance: "high",
        title: "Significant Wealth Decrease Detected",
        observation: `Net worth decreased by ${Math.abs(percentChange).toFixed(0)}% between ${entries[i - 1].date} and ${entries[i].date}. Change: -$${(Math.abs(change) / 1000).toFixed(0)}K. Potential causes: major purchase, market correction, or debt payoff.`,
        dataPoints: [
          `Before: $${(entries[i - 1].totalNetWorth / 1000).toFixed(0)}K`,
          `After: $${(entries[i].totalNetWorth / 1000).toFixed(0)}K`,
          `Change: -$${(Math.abs(change) / 1000).toFixed(0)}K (${percentChange.toFixed(0)}%)`,
        ],
        detectedAt: new Date().toISOString(),
        icon: "TrendingDown",
        trend: "volatile",
      });
      break;
    }
  }

  return insights;
}

/**
 * Milestone Recognition: Achievement detection
 */
function detectMilestones(data: UserData): Insight[] {
  const insights: Insight[] = [];
  const { currentNetWorth, age, entries } = data;

  // Net worth milestones
  const milestones = [100000, 250000, 500000, 750000, 1000000, 2000000, 5000000];

  if (entries.length >= 2) {
    const previousNW = entries[entries.length - 2]?.totalNetWorth || 0;
    const latestNW = entries[entries.length - 1]?.totalNetWorth || currentNetWorth;

    for (const milestone of milestones) {
      if (previousNW < milestone && latestNW >= milestone) {
        insights.push({
          id: `milestone-nw-${milestone}`,
          type: "milestone",
          significance: "high",
          title: `${milestone >= 1000000 ? '$' + (milestone / 1000000) + 'M' : '$' + (milestone / 1000) + 'K'} Net Worth Milestone`,
          observation: `You've reached $${(milestone / 1000).toFixed(0)}K in net worth at age ${age}. ${
            milestone === 1000000 ? "Congratulations on reaching millionaire status!" :
            milestone === 100000 ? "Your first $100K is the hardest - compound growth accelerates from here." :
            `This puts you in an increasingly selective wealth bracket.`
          }`,
          dataPoints: [
            `Current net worth: $${(latestNW / 1000).toFixed(0)}K`,
            `Milestone achieved at age: ${age}`,
            `Time to next milestone: Tracking`,
          ],
          detectedAt: new Date().toISOString(),
          icon: "CheckCircle",
        });
        break; // Only celebrate the most recent milestone
      }
    }
  }

  // Age-based comparative milestones
  if (age === 30 || age === 40 || age === 50) {
    const netWorthMultiples = currentNetWorth / (data.annualIncome || 1);
    insights.push({
      id: `milestone-age-${age}`,
      type: "milestone",
      significance: "medium",
      title: `Age ${age} Financial Snapshot`,
      observation: `At age ${age}, your net worth is ${netWorthMultiples.toFixed(1)}x your annual income. Net worth: $${(currentNetWorth / 1000).toFixed(0)}K. Many financial advisors use 1x by 30, 3x by 40, 6x by 50 as rough benchmarks.`,
      dataPoints: [
        `Age: ${age}`,
        `Net worth: $${(currentNetWorth / 1000).toFixed(0)}K`,
        `Income multiple: ${netWorthMultiples.toFixed(1)}x`,
      ],
      detectedAt: new Date().toISOString(),
      icon: "Briefcase",
    });
  }

  return insights;
}

/**
 * Second-Order Analysis: Rate of change of growth rate
 */
function analyzeAcceleration(data: UserData): Insight[] {
  const insights: Insight[] = [];
  const { entries } = data;

  if (entries.length < 6) return insights;

  // Calculate first derivative (velocity)
  const velocities = [];
  for (let i = 1; i < entries.length; i++) {
    const dt = new Date(entries[i].date).getTime() - new Date(entries[i - 1].date).getTime();
    const dtDays = dt / (1000 * 60 * 60 * 24);
    const dw = entries[i].totalNetWorth - entries[i - 1].totalNetWorth;
    velocities.push(dw / dtDays); // $ per day
  }

  // Calculate second derivative (acceleration)
  const accelerations = [];
  for (let i = 1; i < velocities.length; i++) {
    accelerations.push(velocities[i] - velocities[i - 1]);
  }

  const recentAccel = accelerations.slice(-3).reduce((a, b) => a + b, 0) / 3;

  if (recentAccel > 5) {
    insights.push({
      id: "accel-positive",
      type: "pattern",
      significance: "high",
      title: "Positive Second Derivative Detected",
      observation: `Your wealth accumulation is not just growing—it's accelerating. The rate at which you're accumulating wealth is increasing over time (positive second-order derivative). This suggests compound effects are kicking in.`,
      dataPoints: [
        `Recent acceleration: +$${recentAccel.toFixed(0)}/day²`,
        `Trend: Exponential growth pattern`,
        `Implication: Each period builds faster than the last`,
      ],
      detectedAt: new Date().toISOString(),
      icon: "TrendingUp",
      trend: "accelerating",
    });
  } else if (recentAccel < -5) {
    insights.push({
      id: "accel-negative",
      type: "trend",
      significance: "medium",
      title: "Negative Second Derivative Detected",
      observation: `Your wealth accumulation is decelerating. While still growing, the rate of accumulation is slowing over time (negative second-order derivative). This could indicate increasing expenses or decreasing income growth.`,
      dataPoints: [
        `Recent acceleration: $${recentAccel.toFixed(0)}/day²`,
        `Trend: Slowing growth rate`,
        `Observation: Growth continues but at decreasing pace`,
      ],
      detectedAt: new Date().toISOString(),
      icon: "TrendingDown",
      trend: "decelerating",
    });
  }

  return insights;
}

/**
 * Main entry point: Generate all insights
 */
export function generateInsights(data: UserData): Insight[] {
  // CRITICAL: Sort entries by date chronologically before any analysis
  // This prevents date order bugs like "2026-01-28 to 2023-05-16"
  const sortedData = {
    ...data,
    entries: [...data.entries].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    ),
  };

  const allInsights: Insight[] = [
    ...detectAccumulationPatterns(sortedData),
    ...analyzeTrends(sortedData),
    ...detectAnomalies(sortedData),
    ...detectMilestones(sortedData),
    ...analyzeAcceleration(sortedData),
  ];

  // Sort by significance
  const significanceOrder = { high: 0, medium: 1, low: 2 };
  allInsights.sort((a, b) => significanceOrder[a.significance] - significanceOrder[b.significance]);

  return allInsights;
}

/**
 * Get color for insight type
 */
export function getInsightTypeColor(type: InsightType): string {
  switch (type) {
    case "pattern":
      return "text-blue-500";
    case "trend":
      return "text-purple-500";
    case "anomaly":
      return "text-amber-500";
    case "milestone":
      return "text-emerald-500";
  }
}

/**
 * Get icon for insight type
 */
export function getInsightTypeIcon(type: InsightType): string {
  switch (type) {
    case "pattern":
      return "🧠";
    case "trend":
      return "📈";
    case "anomaly":
      return "⚠️";
    case "milestone":
      return "🎯";
  }
}
