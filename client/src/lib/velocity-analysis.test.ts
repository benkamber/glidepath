import { describe, it, expect } from 'vitest';
import {
  calculateVelocity,
  formatVelocity,
  getVelocityDescription,
  getVelocityRecommendations,
} from './velocity-analysis';

describe('calculateVelocity', () => {
  it('should return empty results for insufficient data', () => {
    const result = calculateVelocity([]);
    expect(result.segments).toHaveLength(0);
    expect(result.hasMinimumData).toBe(false);
    expect(result.dataPointCount).toBe(0);
  });

  it('should calculate velocity between two points', () => {
    const data = [
      { date: '2024-01-01', netWorth: 100000 },
      { date: '2024-01-31', netWorth: 110000 },
    ];

    const result = calculateVelocity(data);

    expect(result.segments).toHaveLength(1);
    expect(result.segments[0].velocity).toBeGreaterThan(0);
    expect(result.segments[0].durationDays).toBe(30);
    expect(result.hasMinimumData).toBe(false); // needs 5+ points
  });

  it('should classify segments correctly', () => {
    const data = [
      { date: '2024-01-01', netWorth: 100000 },
      { date: '2024-02-01', netWorth: 150000 }, // High growth
      { date: '2024-03-01', netWorth: 151000 }, // Stagnant
      { date: '2024-04-01', netWorth: 149000 }, // Declining
      { date: '2024-05-01', netWorth: 160000 }, // Moderate
    ];

    const result = calculateVelocity(data);

    expect(result.segments.length).toBeGreaterThan(0);
    expect(result.hasMinimumData).toBe(true); // 5 points

    // Check that we have different segment types
    const types = result.segments.map(s => s.type);
    expect(types).toContain('high-growth');
  });

  it('should handle same-day entries', () => {
    const data = [
      { date: '2024-01-01', netWorth: 100000 },
      { date: '2024-01-01', netWorth: 105000 },
      { date: '2024-02-01', netWorth: 110000 },
    ];

    const result = calculateVelocity(data);

    // Should skip same-day entry
    expect(result.segments.length).toBeGreaterThanOrEqual(1);
  });

  it('should calculate overall velocity correctly', () => {
    const data = [
      { date: '2024-01-01', netWorth: 100000 },
      { date: '2024-12-31', netWorth: 200000 },
    ];

    const result = calculateVelocity(data);

    // 100k gain over ~365 days = ~274/day
    expect(result.overallVelocity).toBeCloseTo(100000 / 365, 0);
  });
});

describe('formatVelocity', () => {
  it('should format small daily velocities', () => {
    expect(formatVelocity(0.5)).toContain('/year');
  });

  it('should format moderate velocities per day', () => {
    expect(formatVelocity(50)).toContain('/day');
  });

  it('should format large velocities per month', () => {
    expect(formatVelocity(2000)).toContain('/month');
  });
});

describe('getVelocityDescription', () => {
  it('should return descriptions for all segment types', () => {
    expect(getVelocityDescription('high-growth')).toContain('Excellent');
    expect(getVelocityDescription('moderate')).toContain('Steady');
    expect(getVelocityDescription('stagnant')).toContain('Slow');
    expect(getVelocityDescription('declining')).toContain('Declining');
  });
});

describe('getVelocityRecommendations', () => {
  it('should recommend more data for insufficient points', () => {
    const result = {
      segments: [],
      overallVelocity: 0,
      averageAnnualizedRate: 0,
      hasMinimumData: false,
      dataPointCount: 2,
      recommendation: 'Add more data',
    };

    const recs = getVelocityRecommendations(result);
    expect(recs).toHaveLength(1);
    expect(recs[0]).toContain('frequently');
  });

  it('should provide recommendations for declining velocity', () => {
    const result = {
      segments: [
        {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-02-01'),
          startValue: 100000,
          endValue: 95000,
          velocity: -166,
          annualizedRate: -60,
          durationDays: 30,
          type: 'declining' as const,
          color: '#ef4444',
        },
      ],
      overallVelocity: 100,
      averageAnnualizedRate: 10,
      hasMinimumData: true,
      dataPointCount: 5,
      recommendation: 'Good coverage',
    };

    const recs = getVelocityRecommendations(result);
    expect(recs.length).toBeGreaterThan(0);
    expect(recs[0]).toContain('expenses');
  });
});
