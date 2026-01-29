import { differenceInDays } from "date-fns";

export interface DeviationResult {
  hasDeviation: boolean;
  isAhead: boolean; // true if ahead of trend, false if behind
  zScore: number;
  expectedValue: number;
  actualValue: number;
  deviationPercent: number;
  deviationAmount: number;
  confidence: number; // 0-100, based on data quality
  message: string;
  recommendations: string[];
}

/**
 * Calculate linear regression on historical data
 */
function linearRegression(data: { x: number; y: number }[]) {
  const n = data.length;
  if (n < 2) return { slope: 0, intercept: 0, r2: 0, variance: 0 };

  const sumX = data.reduce((acc, d) => acc + d.x, 0);
  const sumY = data.reduce((acc, d) => acc + d.y, 0);
  const sumXY = data.reduce((acc, d) => acc + d.x * d.y, 0);
  const sumX2 = data.reduce((acc, d) => acc + d.x * d.x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R² (coefficient of determination)
  const meanY = sumY / n;
  const ssTotal = data.reduce((acc, d) => acc + Math.pow(d.y - meanY, 2), 0);
  const ssResidual = data.reduce(
    (acc, d) => acc + Math.pow(d.y - (slope * d.x + intercept), 2),
    0
  );
  const r2 = ssTotal === 0 ? 1 : 1 - ssResidual / ssTotal;

  // Calculate variance (for z-score calculation)
  const variance = ssResidual / (n - 2);

  return { slope, intercept, r2, variance };
}

/**
 * Detect if current net worth significantly deviates from expected trend
 */
export function detectDeviation(
  entries: Array<{ date: string; netWorth: number }>
): DeviationResult | null {
  // Need at least 3 data points for meaningful regression
  if (entries.length < 3) {
    return null;
  }

  // Sort by date
  const sorted = [...entries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Use all but the last entry for regression (we're predicting the last one)
  const historical = sorted.slice(0, -1);
  const current = sorted[sorted.length - 1];

  // Convert dates to days since first entry (for regression)
  const firstDate = new Date(historical[0].date);

  const dataPoints = historical.map((entry) => ({
    x: differenceInDays(new Date(entry.date), firstDate),
    y: entry.netWorth,
  }));

  // Calculate regression
  const { slope, intercept, r2, variance } = linearRegression(dataPoints);

  // Project expected value for current date
  const currentDaysSinceFirst = differenceInDays(new Date(current.date), firstDate);
  const expectedValue = slope * currentDaysSinceFirst + intercept;

  const actualValue = current.netWorth;
  const deviationAmount = actualValue - expectedValue;
  const deviationPercent = (deviationAmount / expectedValue) * 100;

  // Calculate z-score (standard deviations from expected)
  const standardDeviation = Math.sqrt(variance);
  const zScore = standardDeviation > 0 ? deviationAmount / standardDeviation : 0;

  // Determine if deviation is significant (|z-score| > 1.5)
  const hasDeviation = Math.abs(zScore) > 1.5;
  const isAhead = deviationAmount > 0;

  // Calculate confidence based on R² and data quantity
  const dataQuality = Math.min(entries.length / 10, 1); // More data = higher confidence
  const fitQuality = Math.max(0, r2); // Better fit = higher confidence
  const confidence = Math.round((dataQuality * 0.4 + fitQuality * 0.6) * 100);

  // Generate message
  let message = "";
  if (!hasDeviation) {
    message = "You're tracking right on your expected trajectory.";
  } else if (isAhead) {
    if (zScore > 3) {
      message = "🚀 Exceptional progress! You're way ahead of your trend.";
    } else if (zScore > 2) {
      message = "💪 Excellent! You're significantly ahead of your trend.";
    } else {
      message = "📈 Great work! You're ahead of your expected trajectory.";
    }
  } else {
    if (zScore < -3) {
      message = "⚠️ Significant lag. You're well below your expected trajectory.";
    } else if (zScore < -2) {
      message = "⚠️ You're notably behind your expected trajectory.";
    } else {
      message = "📉 You're slightly behind your expected trajectory.";
    }
  }

  // Generate recommendations
  const recommendations: string[] = [];

  if (isAhead) {
    recommendations.push("Keep up your current savings and investment strategy");
    if (zScore > 2) {
      recommendations.push("Consider if you can sustain this pace long-term");
      recommendations.push("You may be able to retire earlier than projected");
    } else {
      recommendations.push("Review what's working well in your strategy");
      recommendations.push("Consider documenting your approach for consistency");
    }
  } else {
    if (zScore < -2) {
      recommendations.push("Review your budget - identify areas to cut spending");
      recommendations.push("Check if investment allocations need rebalancing");
      recommendations.push("Consider if income growth is on track with expectations");
    } else {
      recommendations.push("Small course corrections can get you back on track");
      recommendations.push("Review if recent expenses were one-time or recurring");
      recommendations.push("Ensure you're maximizing tax-advantaged accounts");
    }
  }

  // Add confidence-based disclaimer
  if (confidence < 50) {
    recommendations.push("Note: Add more data points for more reliable analysis");
  }

  return {
    hasDeviation,
    isAhead,
    zScore,
    expectedValue,
    actualValue,
    deviationPercent,
    deviationAmount,
    confidence,
    message,
    recommendations,
  };
}

/**
 * Format currency value
 */
export function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  } else if (Math.abs(value) >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}k`;
  } else {
    return `$${value.toFixed(0)}`;
  }
}

/**
 * Check if user has dismissed deviation alert
 */
export function isDismissed(alertId: string): boolean {
  const dismissedKey = `deviation_dismissed_${alertId}`;
  const dismissedUntil = localStorage.getItem(dismissedKey);

  if (!dismissedUntil) return false;

  const dismissedDate = new Date(dismissedUntil);
  return dismissedDate > new Date();
}

/**
 * Dismiss deviation alert for 30 days
 */
export function dismissAlert(alertId: string): void {
  const dismissedKey = `deviation_dismissed_${alertId}`;
  const dismissUntil = new Date();
  dismissUntil.setDate(dismissUntil.getDate() + 30);
  localStorage.setItem(dismissedKey, dismissUntil.toISOString());
}
