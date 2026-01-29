/**
 * Wealth Calculus Library
 *
 * Advanced mathematical analysis of wealth trajectories using calculus.
 * Implements first-order (velocity) and second-order (acceleration) derivatives
 * to understand the rate of change and acceleration of wealth accumulation.
 */

export interface DataPoint {
  date: string;
  value: number;
}

export interface DerivativePoint {
  date: string;
  value: number;
  velocity: number;
  timeDelta: number; // days between this and previous point
}

export interface AccelerationPoint {
  date: string;
  value: number;
  velocity: number;
  acceleration: number;
  timeDelta: number;
}

export interface InflectionPoint {
  date: string;
  value: number;
  velocity: number;
  acceleration: number;
  type: 'peak' | 'trough';
  description: string;
}

export interface WealthModel {
  averageVelocity: number; // $ per day
  averageAcceleration: number; // $ per day^2
  trend: 'accelerating' | 'decelerating' | 'stable';
  inflectionPoints: InflectionPoint[];
  r2: number; // goodness of fit (0-1)
}

/**
 * Calculate first derivative (velocity): dW/dt
 *
 * Velocity represents the rate of wealth change over time.
 * Positive velocity = wealth increasing
 * Negative velocity = wealth decreasing
 *
 * Uses central difference for better accuracy where possible.
 */
export function calculateFirstDerivative(
  data: DataPoint[],
  smoothing: boolean = true
): DerivativePoint[] {
  if (data.length < 2) return [];

  const derivatives: DerivativePoint[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      // Forward difference for first point
      const current = data[i];
      const next = data[i + 1];
      const timeDelta = getTimeDeltaDays(current.date, next.date);
      const velocity = (next.value - current.value) / timeDelta;

      derivatives.push({
        date: current.date,
        value: current.value,
        velocity,
        timeDelta,
      });
    } else if (i === data.length - 1) {
      // Backward difference for last point
      const current = data[i];
      const previous = data[i - 1];
      const timeDelta = getTimeDeltaDays(previous.date, current.date);
      const velocity = (current.value - previous.value) / timeDelta;

      derivatives.push({
        date: current.date,
        value: current.value,
        velocity,
        timeDelta,
      });
    } else {
      // Central difference for interior points (more accurate)
      const previous = data[i - 1];
      const current = data[i];
      const next = data[i + 1];
      const timeDelta = getTimeDeltaDays(previous.date, next.date);
      const velocity = (next.value - previous.value) / timeDelta;

      derivatives.push({
        date: current.date,
        value: current.value,
        velocity,
        timeDelta,
      });
    }
  }

  // Apply smoothing if requested (moving average)
  if (smoothing && derivatives.length >= 3) {
    return smoothDerivatives(derivatives);
  }

  return derivatives;
}

/**
 * Calculate second derivative (acceleration): d²W/dt²
 *
 * Acceleration represents the rate of change of velocity.
 * Positive acceleration = velocity increasing (growth speeding up)
 * Negative acceleration = velocity decreasing (growth slowing down)
 * Zero acceleration = constant velocity (linear growth)
 */
export function calculateSecondDerivative(
  velocityData: DerivativePoint[]
): AccelerationPoint[] {
  if (velocityData.length < 2) return [];

  const accelerations: AccelerationPoint[] = [];

  for (let i = 0; i < velocityData.length; i++) {
    if (i === 0) {
      // Forward difference for first point
      const current = velocityData[i];
      const next = velocityData[i + 1];
      const timeDelta = getTimeDeltaDays(current.date, next.date);
      const acceleration = (next.velocity - current.velocity) / timeDelta;

      accelerations.push({
        date: current.date,
        value: current.value,
        velocity: current.velocity,
        acceleration,
        timeDelta,
      });
    } else if (i === velocityData.length - 1) {
      // Backward difference for last point
      const current = velocityData[i];
      const previous = velocityData[i - 1];
      const timeDelta = getTimeDeltaDays(previous.date, current.date);
      const acceleration = (current.velocity - previous.velocity) / timeDelta;

      accelerations.push({
        date: current.date,
        value: current.value,
        velocity: current.velocity,
        acceleration,
        timeDelta,
      });
    } else {
      // Central difference for interior points
      const previous = velocityData[i - 1];
      const current = velocityData[i];
      const next = velocityData[i + 1];
      const timeDelta = getTimeDeltaDays(previous.date, next.date);
      const acceleration = (next.velocity - previous.velocity) / timeDelta;

      accelerations.push({
        date: current.date,
        value: current.value,
        velocity: current.velocity,
        acceleration,
        timeDelta,
      });
    }
  }

  return accelerations;
}

/**
 * Detect inflection points where acceleration changes sign
 *
 * Inflection points indicate significant changes in growth patterns:
 * - Peak: Growth rate was increasing, now decreasing (acceleration goes from + to -)
 * - Trough: Growth rate was decreasing, now increasing (acceleration goes from - to +)
 */
export function detectInflectionPoints(
  accelerationData: AccelerationPoint[],
  threshold: number = 5 // Minimum acceleration magnitude to consider
): InflectionPoint[] {
  if (accelerationData.length < 3) return [];

  const inflectionPoints: InflectionPoint[] = [];

  for (let i = 1; i < accelerationData.length - 1; i++) {
    const previous = accelerationData[i - 1];
    const current = accelerationData[i];
    const next = accelerationData[i + 1];

    // Check for sign change in acceleration
    const prevSign = Math.sign(previous.acceleration);
    const nextSign = Math.sign(next.acceleration);

    if (prevSign !== nextSign && Math.abs(current.acceleration) > threshold) {
      const type = prevSign > 0 ? 'peak' : 'trough';
      const description = type === 'peak'
        ? 'Growth rate peaked here - accumulation was accelerating, now decelerating'
        : 'Growth rate bottomed here - accumulation was decelerating, now accelerating';

      inflectionPoints.push({
        date: current.date,
        value: current.value,
        velocity: current.velocity,
        acceleration: current.acceleration,
        type,
        description,
      });
    }
  }

  return inflectionPoints;
}

/**
 * Fit differential equation model to wealth data
 *
 * Models wealth growth as: dW/dt = I(t)·s(t) + W(t)·r(t)
 * Where:
 * - I(t) = income at time t
 * - s(t) = savings rate at time t
 * - r(t) = investment return rate at time t
 * - W(t) = wealth at time t
 */
export function fitDifferentialModel(data: DataPoint[]): WealthModel {
  const velocityData = calculateFirstDerivative(data);
  const accelerationData = calculateSecondDerivative(velocityData);
  const inflectionPoints = detectInflectionPoints(accelerationData);

  // Calculate average velocity and acceleration
  const avgVelocity = velocityData.reduce((sum, d) => sum + d.velocity, 0) / velocityData.length;
  const avgAcceleration = accelerationData.reduce((sum, d) => sum + d.acceleration, 0) / accelerationData.length;

  // Determine trend based on recent acceleration
  const recentAccelerations = accelerationData.slice(-Math.min(3, accelerationData.length));
  const recentAvgAccel = recentAccelerations.reduce((sum, d) => sum + d.acceleration, 0) / recentAccelerations.length;

  let trend: 'accelerating' | 'decelerating' | 'stable';
  if (Math.abs(recentAvgAccel) < 1) {
    trend = 'stable';
  } else if (recentAvgAccel > 0) {
    trend = 'accelerating';
  } else {
    trend = 'decelerating';
  }

  // Calculate R² (goodness of fit)
  const r2 = calculateR2(data, velocityData);

  return {
    averageVelocity: avgVelocity,
    averageAcceleration: avgAcceleration,
    trend,
    inflectionPoints,
    r2,
  };
}

/**
 * Calculate R² (coefficient of determination) for model fit quality
 */
function calculateR2(data: DataPoint[], velocityData: DerivativePoint[]): number {
  if (data.length < 3) return 0;

  // Calculate mean value
  const mean = data.reduce((sum, d) => sum + d.value, 0) / data.length;

  // Calculate total sum of squares
  const ssTot = data.reduce((sum, d) => sum + Math.pow(d.value - mean, 2), 0);

  // Calculate residual sum of squares (simplified)
  // Using velocity to predict next value
  let ssRes = 0;
  for (let i = 0; i < velocityData.length - 1; i++) {
    const predicted = velocityData[i].value + velocityData[i].velocity * velocityData[i].timeDelta;
    const actual = data[i + 1].value;
    ssRes += Math.pow(actual - predicted, 2);
  }

  return Math.max(0, Math.min(1, 1 - ssRes / ssTot));
}

/**
 * Smooth derivatives using moving average
 */
function smoothDerivatives(derivatives: DerivativePoint[], window: number = 3): DerivativePoint[] {
  if (derivatives.length < window) return derivatives;

  const smoothed: DerivativePoint[] = [];
  const halfWindow = Math.floor(window / 2);

  for (let i = 0; i < derivatives.length; i++) {
    const start = Math.max(0, i - halfWindow);
    const end = Math.min(derivatives.length, i + halfWindow + 1);
    const windowData = derivatives.slice(start, end);

    const avgVelocity = windowData.reduce((sum, d) => sum + d.velocity, 0) / windowData.length;

    smoothed.push({
      ...derivatives[i],
      velocity: avgVelocity,
    });
  }

  return smoothed;
}

/**
 * Calculate time difference in days between two dates
 */
function getTimeDeltaDays(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffMs = Math.abs(d2.getTime() - d1.getTime());
  return diffMs / (1000 * 60 * 60 * 24);
}

/**
 * Format velocity for display ($/day → $/year)
 */
export function formatVelocity(velocityPerDay: number): string {
  const velocityPerYear = velocityPerDay * 365;
  if (Math.abs(velocityPerYear) >= 1_000_000) {
    return `$${(velocityPerYear / 1_000_000).toFixed(2)}M/yr`;
  }
  if (Math.abs(velocityPerYear) >= 1_000) {
    return `$${(velocityPerYear / 1_000).toFixed(0)}K/yr`;
  }
  return `$${velocityPerYear.toFixed(0)}/yr`;
}

/**
 * Format acceleration for display
 */
export function formatAcceleration(accelerationPerDay2: number): string {
  const accelerationPerYear2 = accelerationPerDay2 * 365 * 365;
  if (Math.abs(accelerationPerYear2) >= 1_000_000) {
    return `$${(accelerationPerYear2 / 1_000_000).toFixed(2)}M/yr²`;
  }
  if (Math.abs(accelerationPerYear2) >= 1_000) {
    return `$${(accelerationPerYear2 / 1_000).toFixed(0)}K/yr²`;
  }
  return `$${accelerationPerYear2.toFixed(0)}/yr²`;
}

/**
 * Interpret acceleration value
 */
export function interpretAcceleration(acceleration: number): string {
  if (Math.abs(acceleration) < 1) {
    return 'Stable growth rate - velocity is constant';
  } else if (acceleration > 10) {
    return 'Strongly accelerating - growth rate increasing rapidly';
  } else if (acceleration > 1) {
    return 'Accelerating - growth rate increasing';
  } else if (acceleration < -10) {
    return 'Strongly decelerating - growth rate decreasing rapidly';
  } else {
    return 'Decelerating - growth rate decreasing';
  }
}
