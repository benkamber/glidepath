import { differenceInDays } from "date-fns";

export interface VelocitySegment {
  startDate: Date;
  endDate: Date;
  startValue: number;
  endValue: number;
  velocity: number; // $ per day
  annualizedRate: number; // % per year
  durationDays: number;
  type: "high-growth" | "moderate" | "stagnant" | "declining";
  color: string; // green, yellow, orange, red
}

export interface VelocityAnalysisResult {
  segments: VelocitySegment[];
  overallVelocity: number;
  averageAnnualizedRate: number;
  hasMinimumData: boolean;
  dataPointCount: number;
  recommendation: string;
}

/**
 * Calculate velocity between each pair of data points
 */
export function calculateVelocity(
  dataPoints: Array<{ date: string; netWorth: number }>
): VelocityAnalysisResult {
  const sorted = [...dataPoints].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const hasMinimumData = sorted.length >= 5;
  const dataPointCount = sorted.length;

  if (sorted.length < 2) {
    return {
      segments: [],
      overallVelocity: 0,
      averageAnnualizedRate: 0,
      hasMinimumData: false,
      dataPointCount,
      recommendation: "Add more data points (at least 5) for accurate velocity analysis.",
    };
  }

  // Calculate segments between each pair
  const segments: VelocitySegment[] = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    const start = sorted[i];
    const end = sorted[i + 1];

    const startDate = new Date(start.date);
    const endDate = new Date(end.date);
    const durationDays = differenceInDays(endDate, startDate);

    if (durationDays === 0) continue; // Skip same-day entries

    const deltaNetWorth = end.netWorth - start.netWorth;
    const velocity = deltaNetWorth / durationDays;
    const annualizedRate =
      start.netWorth > 0
        ? ((end.netWorth / start.netWorth) ** (365 / durationDays) - 1) * 100
        : 0;

    const segment: VelocitySegment = {
      startDate,
      endDate,
      startValue: start.netWorth,
      endValue: end.netWorth,
      velocity,
      annualizedRate,
      durationDays,
      type: "moderate",
      color: "#fbbf24", // yellow default
    };

    segments.push(segment);
  }

  // Apply 3-month sliding window smoothing if enough data
  const smoothedSegments = segments.map((segment, index) => {
    if (segments.length < 3) {
      return segment; // Not enough data for smoothing
    }

    // Calculate average velocity within 90-day window
    const windowStart = segment.startDate.getTime() - 45 * 24 * 60 * 60 * 1000;
    const windowEnd = segment.endDate.getTime() + 45 * 24 * 60 * 60 * 1000;

    const windowSegments = segments.filter((s) => {
      const time = s.startDate.getTime();
      return time >= windowStart && time <= windowEnd;
    });

    const avgVelocity =
      windowSegments.reduce((sum, s) => sum + s.velocity, 0) / windowSegments.length;

    return {
      ...segment,
      velocity: avgVelocity,
    };
  });

  // Classify segments by velocity quartiles
  const velocities = smoothedSegments.map((s) => s.velocity);
  const sortedVelocities = [...velocities].sort((a, b) => a - b);

  const q25 = sortedVelocities[Math.floor(sortedVelocities.length * 0.25)];
  const q50 = sortedVelocities[Math.floor(sortedVelocities.length * 0.5)];
  const q75 = sortedVelocities[Math.floor(sortedVelocities.length * 0.75)];

  // Color code segments
  const classifiedSegments = smoothedSegments.map((segment) => {
    let type: VelocitySegment["type"];
    let color: string;

    if (segment.velocity < 0) {
      type = "declining";
      color = "#ef4444"; // red
    } else if (segment.velocity < q25) {
      type = "stagnant";
      color = "#f97316"; // orange
    } else if (segment.velocity < q75) {
      type = "moderate";
      color = "#fbbf24"; // yellow
    } else {
      type = "high-growth";
      color = "#10b981"; // green
    }

    return {
      ...segment,
      type,
      color,
    };
  });

  // Calculate overall metrics
  const totalDays = differenceInDays(
    new Date(sorted[sorted.length - 1].date),
    new Date(sorted[0].date)
  );

  const totalGrowth = sorted[sorted.length - 1].netWorth - sorted[0].netWorth;
  const overallVelocity = totalDays > 0 ? totalGrowth / totalDays : 0;

  const averageAnnualizedRate =
    classifiedSegments.reduce((sum, s) => sum + s.annualizedRate, 0) /
    classifiedSegments.length;

  // Generate recommendation
  let recommendation = "";
  if (dataPointCount < 5) {
    recommendation =
      "Add more data points (target: 5-25) for better velocity analysis accuracy.";
  } else if (dataPointCount > 25) {
    recommendation =
      "You have excellent data coverage! Consider focusing on recent trends (last 12 months).";
  } else {
    recommendation =
      "Good data coverage. Continue tracking regularly for optimal insights.";
  }

  return {
    segments: classifiedSegments,
    overallVelocity,
    averageAnnualizedRate,
    hasMinimumData,
    dataPointCount,
    recommendation,
  };
}

/**
 * Format velocity for display
 */
export function formatVelocity(velocity: number): string {
  const absVelocity = Math.abs(velocity);

  if (absVelocity < 1) {
    return `$${(velocity * 365).toFixed(0)}/year`;
  } else if (absVelocity < 100) {
    return `$${velocity.toFixed(0)}/day`;
  } else if (absVelocity < 1000) {
    return `$${(velocity * 7).toFixed(0)}/week`;
  } else {
    return `$${(velocity * 30).toFixed(0)}/month`;
  }
}

/**
 * Get velocity segment description
 */
export function getVelocityDescription(type: VelocitySegment["type"]): string {
  switch (type) {
    case "high-growth":
      return "Excellent progress! Your wealth is growing rapidly.";
    case "moderate":
      return "Steady growth. You're building wealth consistently.";
    case "stagnant":
      return "Slow growth. Consider increasing savings or investment returns.";
    case "declining":
      return "Declining wealth. Review expenses and investment strategy.";
  }
}

/**
 * Get actionable recommendations based on velocity analysis
 */
export function getVelocityRecommendations(
  result: VelocityAnalysisResult
): string[] {
  const recommendations: string[] = [];

  if (!result.hasMinimumData) {
    recommendations.push("Track your net worth more frequently (monthly is ideal)");
    return recommendations;
  }

  const recentSegments = result.segments.slice(-3);
  const recentVelocity =
    recentSegments.reduce((sum, s) => sum + s.velocity, 0) / recentSegments.length;

  if (recentVelocity < 0) {
    recommendations.push("Review recent expenses - your wealth is declining");
    recommendations.push("Consider reducing discretionary spending");
    recommendations.push("Check if investments need rebalancing");
  } else if (recentVelocity < result.overallVelocity * 0.5) {
    recommendations.push("Recent growth has slowed compared to your average");
    recommendations.push("Review if you've reduced savings rate");
    recommendations.push("Consider increasing investment contributions");
  } else if (recentVelocity > result.overallVelocity * 1.5) {
    recommendations.push("Excellent recent progress! You're accelerating.");
    recommendations.push("Maintain current savings and investment strategy");
    recommendations.push("Consider increasing FIRE target if comfortable");
  }

  return recommendations;
}
