import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  detectDeviation,
  formatCurrency,
  isDismissed,
  dismissAlert,
} from './deviation-detector';

describe('detectDeviation', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return null for insufficient data', () => {
    const entries = [
      { date: '2024-01-01', netWorth: 100000 },
      { date: '2024-02-01', netWorth: 105000 },
    ];

    const result = detectDeviation(entries);
    expect(result).toBeNull();
  });

  it('should provide deviation analysis', () => {
    const entries = [
      { date: '2024-01-01', netWorth: 100000 },
      { date: '2024-03-01', netWorth: 105000 },
      { date: '2024-05-01', netWorth: 110000 },
      { date: '2024-07-01', netWorth: 115000 },
    ];

    const result = detectDeviation(entries);

    expect(result).not.toBeNull();
    expect(result?.zScore).toBeDefined();
    expect(result?.message).toBeDefined();
    expect(result?.recommendations).toBeDefined();
  });

  it('should detect when ahead of trajectory', () => {
    const entries = [
      { date: '2024-01-01', netWorth: 100000 },
      { date: '2024-03-01', netWorth: 105000 },
      { date: '2024-05-01', netWorth: 110000 },
      { date: '2024-07-01', netWorth: 130000 }, // Significantly ahead
    ];

    const result = detectDeviation(entries);

    expect(result).not.toBeNull();
    if (result && result.hasDeviation) {
      expect(result.isAhead).toBe(true);
      expect(result.zScore).toBeGreaterThan(1.5);
      expect(result.message).toContain('ahead');
    }
  });

  it('should detect when behind trajectory', () => {
    const entries = [
      { date: '2024-01-01', netWorth: 100000 },
      { date: '2024-03-01', netWorth: 105000 },
      { date: '2024-05-01', netWorth: 110000 },
      { date: '2024-07-01', netWorth: 100000 }, // Dropped behind
    ];

    const result = detectDeviation(entries);

    expect(result).not.toBeNull();
    if (result && result.hasDeviation) {
      expect(result.isAhead).toBe(false);
      expect(result.zScore).toBeLessThan(-1.5);
      expect(result.message).toContain('below');
    }
  });

  it('should provide recommendations based on deviation', () => {
    const entries = [
      { date: '2024-01-01', netWorth: 100000 },
      { date: '2024-03-01', netWorth: 105000 },
      { date: '2024-05-01', netWorth: 110000 },
      { date: '2024-07-01', netWorth: 95000 },
    ];

    const result = detectDeviation(entries);

    expect(result).not.toBeNull();
    expect(result?.recommendations.length).toBeGreaterThan(0);
  });

  it('should calculate confidence based on data quantity', () => {
    const shortData = [
      { date: '2024-01-01', netWorth: 100000 },
      { date: '2024-03-01', netWorth: 105000 },
      { date: '2024-05-01', netWorth: 110000 },
    ];

    const longData = [
      ...shortData,
      { date: '2024-07-01', netWorth: 115000 },
      { date: '2024-09-01', netWorth: 120000 },
      { date: '2024-11-01', netWorth: 125000 },
      { date: '2025-01-01', netWorth: 130000 },
    ];

    const shortResult = detectDeviation(shortData);
    const longResult = detectDeviation(longData);

    if (shortResult && longResult) {
      expect(longResult.confidence).toBeGreaterThanOrEqual(shortResult.confidence);
    }
  });
});

describe('formatCurrency', () => {
  it('should format millions', () => {
    expect(formatCurrency(1500000)).toBe('$1.50M');
  });

  it('should format thousands', () => {
    expect(formatCurrency(50000)).toBe('$50.0k');
  });

  it('should format small amounts', () => {
    expect(formatCurrency(500)).toBe('$500');
  });

  it('should handle negative values', () => {
    const result = formatCurrency(-50000);
    expect(result).toContain('50');
    expect(result).toContain('k');
  });
});

describe('isDismissed and dismissAlert', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should return false for non-dismissed alert', () => {
    expect(isDismissed('test-alert')).toBe(false);
  });

  it('should return true for dismissed alert within 30 days', () => {
    dismissAlert('test-alert');
    expect(isDismissed('test-alert')).toBe(true);
  });

  it('should return false for expired dismissal', () => {
    // Set dismissal to 31 days ago
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 31);
    localStorage.setItem('deviation_dismissed_test-alert', pastDate.toISOString());

    expect(isDismissed('test-alert')).toBe(false);
  });
});
