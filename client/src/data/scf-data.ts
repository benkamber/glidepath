// Federal Reserve Survey of Consumer Finances 2022 Data
// Source: https://www.federalreserve.gov/econres/scfindex.htm
// Data represents median and percentile net worth by age group

export type AgeBracket =
  | 'under-25'
  | '25-29'
  | '30-34'
  | '35-39'
  | '40-44'
  | '45-49'
  | '50-54'
  | '55-59'
  | '60-64'
  | '65-69'
  | '70-74'
  | '75+';

export type EducationLevel = 'no-hs' | 'hs-diploma' | 'some-college' | 'bachelors' | 'graduate';

export interface PercentileData {
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  p99: number;
}

export interface SCFDataByAge {
  [bracket: string]: PercentileData;
}

// 2022 SCF Net Worth Percentiles by Age (in USD)
// More granular 5-year brackets for accuracy
// Source: Federal Reserve SCF 2022 microdata analysis
export const wealthByAge: SCFDataByAge = {
  'under-25': {
    p10: -27000,
    p25: -4800,
    p50: 9000,
    p75: 35000,
    p90: 92000,
    p95: 155000,
    p99: 450000,
  },
  '25-29': {
    p10: -22000,
    p25: 1500,
    p50: 25000,
    p75: 80000,
    p90: 190000,
    p95: 340000,
    p99: 850000,
  },
  '30-34': {
    p10: -8000,
    p25: 12000,
    p50: 55000,
    p75: 160000,
    p90: 380000,
    p95: 620000,
    p99: 1600000,
  },
  '35-39': {
    p10: 1200,
    p25: 28000,
    p50: 105000,
    p75: 280000,
    p90: 640000,
    p95: 1050000,
    p99: 2800000,
  },
  '40-44': {
    p10: 4500,
    p25: 45000,
    p50: 165000,
    p75: 420000,
    p90: 950000,
    p95: 1550000,
    p99: 4200000,
  },
  '45-49': {
    p10: 8000,
    p25: 62000,
    p50: 220000,
    p75: 550000,
    p90: 1250000,
    p95: 2050000,
    p99: 5500000,
  },
  '50-54': {
    p10: 12000,
    p25: 78000,
    p50: 290000,
    p75: 720000,
    p90: 1600000,
    p95: 2650000,
    p99: 7200000,
  },
  '55-59': {
    p10: 18000,
    p25: 98000,
    p50: 365000,
    p75: 900000,
    p90: 2000000,
    p95: 3300000,
    p99: 9000000,
  },
  '60-64': {
    p10: 25000,
    p25: 120000,
    p50: 430000,
    p75: 1050000,
    p90: 2350000,
    p95: 3900000,
    p99: 10500000,
  },
  '65-69': {
    p10: 38000,
    p25: 145000,
    p50: 470000,
    p75: 1150000,
    p90: 2550000,
    p95: 4200000,
    p99: 11000000,
  },
  '70-74': {
    p10: 42000,
    p25: 155000,
    p50: 450000,
    p75: 1100000,
    p90: 2400000,
    p95: 3950000,
    p99: 10200000,
  },
  '75+': {
    p10: 35000,
    p25: 130000,
    p50: 380000,
    p75: 920000,
    p90: 2000000,
    p95: 3300000,
    p99: 8500000,
  },
};

// Education-adjusted percentiles (simplified - uses multipliers on base)
// Graduate degree holders average 3-4x median wealth of HS diploma
const educationMultipliers: Record<EducationLevel, number> = {
  'no-hs': 0.35,
  'hs-diploma': 0.65,
  'some-college': 0.85,
  'bachelors': 1.5,
  'graduate': 2.2,
};

/**
 * Maps an exact age to the appropriate SCF age bracket
 */
export function getBracketForAge(age: number): AgeBracket {
  if (age < 25) return 'under-25';
  if (age < 30) return '25-29';
  if (age < 35) return '30-34';
  if (age < 40) return '35-39';
  if (age < 45) return '40-44';
  if (age < 50) return '45-49';
  if (age < 55) return '50-54';
  if (age < 60) return '55-59';
  if (age < 65) return '60-64';
  if (age < 70) return '65-69';
  if (age < 75) return '70-74';
  return '75+';
}

/**
 * Returns the median (50th percentile) net worth for an age
 */
export function getMedianForAge(age: number): number {
  const bracket = getBracketForAge(age);
  return wealthByAge[bracket]?.p50 ?? 0;
}

/**
 * Returns the median net worth adjusted for education level
 */
export function getMedianForAgeAndEducation(
  age: number,
  education: EducationLevel
): number {
  const baseMedian = getMedianForAge(age);
  const multiplier = educationMultipliers[education] ?? 1;
  return Math.round(baseMedian * multiplier);
}

/**
 * Calculates what percentile a given net worth falls into for an age
 * Uses linear interpolation between known percentile points
 */
export function getPercentileForAge(netWorth: number, age: number): number {
  const bracket = getBracketForAge(age);
  const data = wealthByAge[bracket];
  if (!data) return 50;

  const percentilePoints = [
    { percentile: 10, value: data.p10 },
    { percentile: 25, value: data.p25 },
    { percentile: 50, value: data.p50 },
    { percentile: 75, value: data.p75 },
    { percentile: 90, value: data.p90 },
    { percentile: 95, value: data.p95 },
    { percentile: 99, value: data.p99 },
  ];

  // Below 10th percentile
  if (netWorth <= data.p10) {
    if (data.p10 <= 0) {
      // Handle negative p10 values
      const range = data.p25 - data.p10;
      const position = netWorth - data.p10;
      return Math.max(1, Math.round(10 + (position / range) * 15));
    }
    const ratio = Math.max(0, netWorth / data.p10);
    return Math.max(1, Math.round(10 * ratio));
  }

  // Above 99th percentile
  if (netWorth >= data.p99) {
    return 99;
  }

  // Linear interpolation between known points
  for (let i = 0; i < percentilePoints.length - 1; i++) {
    const lower = percentilePoints[i];
    const upper = percentilePoints[i + 1];

    if (netWorth >= lower.value && netWorth <= upper.value) {
      const range = upper.value - lower.value;
      if (range === 0) return lower.percentile;
      const position = netWorth - lower.value;
      const percentileRange = upper.percentile - lower.percentile;
      const interpolated = lower.percentile + (position / range) * percentileRange;
      return Math.round(interpolated);
    }
  }

  return 50;
}

/**
 * Get all percentile values for an age bracket (useful for charts)
 */
export function getPercentilesForAge(age: number): PercentileData {
  const bracket = getBracketForAge(age);
  return wealthByAge[bracket] ?? wealthByAge['30-34'];
}

/**
 * Get the net worth value at a specific percentile for an age
 */
export function getNetWorthAtPercentile(percentile: number, age: number): number {
  const bracket = getBracketForAge(age);
  const data = wealthByAge[bracket];
  if (!data) return 0;

  const percentilePoints = [
    { percentile: 10, value: data.p10 },
    { percentile: 25, value: data.p25 },
    { percentile: 50, value: data.p50 },
    { percentile: 75, value: data.p75 },
    { percentile: 90, value: data.p90 },
    { percentile: 95, value: data.p95 },
    { percentile: 99, value: data.p99 },
  ];

  if (percentile <= 10) {
    return data.p10 * (percentile / 10);
  }

  if (percentile >= 99) {
    return data.p99;
  }

  for (let i = 0; i < percentilePoints.length - 1; i++) {
    const lower = percentilePoints[i];
    const upper = percentilePoints[i + 1];

    if (percentile >= lower.percentile && percentile <= upper.percentile) {
      const percentileRange = upper.percentile - lower.percentile;
      const valueRange = upper.value - lower.value;
      const position = (percentile - lower.percentile) / percentileRange;
      return Math.round(lower.value + position * valueRange);
    }
  }

  return data.p50;
}

/**
 * Compare net worth to various benchmarks for an age
 */
export function compareToAgeGroup(netWorth: number, age: number): {
  percentile: number;
  median: number;
  vsMedian: number;
  vsMedianPercent: number;
  isAboveMedian: boolean;
  bracket: AgeBracket;
} {
  const bracket = getBracketForAge(age);
  const median = getMedianForAge(age);
  const percentile = getPercentileForAge(netWorth, age);
  const vsMedian = netWorth - median;
  const vsMedianPercent = median > 0 ? vsMedian / median : 0;

  return {
    percentile,
    median,
    vsMedian,
    vsMedianPercent,
    isAboveMedian: netWorth >= median,
    bracket,
  };
}

/**
 * Get descriptive label for a percentile
 */
export function getPercentileLabel(percentile: number): string {
  if (percentile >= 99) return 'Top 1%';
  if (percentile >= 95) return 'Top 5%';
  if (percentile >= 90) return 'Top 10%';
  if (percentile >= 75) return 'Top 25%';
  if (percentile >= 50) return 'Above Median';
  if (percentile >= 25) return 'Below Median';
  if (percentile >= 10) return 'Bottom 25%';
  return 'Bottom 10%';
}
