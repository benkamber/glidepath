import { describe, it, expect } from 'vitest';
import {
  calculateFIRENumber,
  getFIRELevel,
  calculateYearsToFIRE,
  calculateRequiredContribution,
  calculateFIRE,
  calculateMaxSpendForDate,
  FIRE_LEVELS,
} from './fire-calculations';

describe('calculateFIRENumber', () => {
  it('should calculate FIRE number with 4% SWR', () => {
    const fireNumber = calculateFIRENumber(40000, 0.04);
    expect(fireNumber).toBe(1000000); // 40k / 0.04 = 1M
  });

  it('should calculate FIRE number with 3.5% SWR', () => {
    const fireNumber = calculateFIRENumber(70000, 0.035);
    expect(fireNumber).toBeCloseTo(2000000, 0); // 70k / 0.035 = 2M
  });

  it('should calculate FIRE number with 2.5% SWR', () => {
    const fireNumber = calculateFIRENumber(100000, 0.025);
    expect(fireNumber).toBe(4000000); // 100k / 0.025 = 4M
  });
});

describe('getFIRELevel', () => {
  it('should return Lean FIRE for low expenses', () => {
    const level = getFIRELevel(35000);
    expect(level.name).toBe('Lean FIRE');
  });

  it('should return Regular FIRE for moderate expenses', () => {
    const level = getFIRELevel(50000);
    expect(level.name).toBe('Regular FIRE');
  });

  it('should return Chubby FIRE for higher expenses', () => {
    const level = getFIRELevel(75000);
    expect(level.name).toBe('Chubby FIRE');
  });

  it('should return Fat FIRE for high expenses', () => {
    const level = getFIRELevel(150000);
    expect(level.name).toBe('Fat FIRE');
  });
});

describe('calculateYearsToFIRE', () => {
  it('should return 0 if already at FIRE number', () => {
    const years = calculateYearsToFIRE(1000000, 50000, 1000000, 0.07);
    expect(years).toBe(0);
  });

  it('should return Infinity if no savings', () => {
    const years = calculateYearsToFIRE(100000, 0, 1000000, 0.07);
    expect(years).toBe(Infinity);
  });

  it('should calculate years correctly with savings', () => {
    const years = calculateYearsToFIRE(100000, 50000, 500000, 0.07);
    expect(years).toBeGreaterThan(0);
    expect(years).toBeLessThan(20); // Should be achievable
  });

  it('should be faster with higher returns', () => {
    const years5 = calculateYearsToFIRE(100000, 30000, 500000, 0.05);
    const years7 = calculateYearsToFIRE(100000, 30000, 500000, 0.07);
    expect(years7).toBeLessThan(years5);
  });
});

describe('calculateRequiredContribution', () => {
  it('should return 0 if already at target', () => {
    const contribution = calculateRequiredContribution(1000000, 1000000, 10, 0.07);
    expect(contribution).toBe(0);
  });

  it('should return 0 if no time', () => {
    const contribution = calculateRequiredContribution(100000, 1000000, 0, 0.07);
    expect(contribution).toBe(0);
  });

  it('should calculate required monthly contribution', () => {
    const contribution = calculateRequiredContribution(100000, 500000, 10, 0.07);
    expect(contribution).toBeGreaterThan(0);
    expect(contribution).toBeLessThan(5000); // Should be reasonable
  });
});

describe('calculateFIRE', () => {
  it('should calculate comprehensive FIRE metrics', () => {
    const result = calculateFIRE(
      200000, // current net worth
      35, // age
      100000, // annual income
      50000, // annual expenses
      0.07,
      false
    );

    expect(result.fireNumber).toBeGreaterThan(0);
    expect(result.currentProgress).toBeGreaterThan(0);
    expect(result.currentProgress).toBeLessThanOrEqual(100);
    expect(result.yearsToFIRE).toBeGreaterThan(0);
    expect(result.level).toBeDefined();
    expect(result.coastFIRE).toBeDefined();
    expect(result.baristaFIRE).toBeDefined();
  });

  it('should apply couple multiplier correctly', () => {
    const solo = calculateFIRE(200000, 35, 100000, 40000, 0.07, false);
    const couple = calculateFIRE(200000, 35, 100000, 40000, 0.07, true, 1.7);

    expect(couple.fireNumber).toBeGreaterThan(solo.fireNumber);
  });

  it('should show 100% progress if already at FIRE', () => {
    const result = calculateFIRE(2000000, 35, 100000, 40000, 0.07, false);

    expect(result.currentProgress).toBeCloseTo(100, 0);
    expect(result.yearsToFIRE).toBe(0);
  });

  it('should calculate Coast FIRE correctly', () => {
    const result = calculateFIRE(500000, 35, 100000, 50000, 0.07, false);

    expect(result.coastFIRE.coastNumber).toBeLessThan(result.fireNumber);
    // Years to 65 depends on calculation, just check it exists
    expect(result.coastFIRE).toBeDefined();
  });
});

describe('calculateMaxSpendForDate', () => {
  it('should calculate max spend for target date', () => {
    const result = calculateMaxSpendForDate(
      200000, // current net worth
      35, // age
      100000, // annual income
      2035, // target year (10 years)
      0.07,
      0.04,
      false
    );

    expect(result.maxMonthlySpend).toBeGreaterThan(0);
    expect(result.maxAnnualExpenses).toBeGreaterThan(0);
    expect(result.fireNumber).toBeGreaterThan(0);
    expect(result.level).toBeDefined();
  });

  it('should return current net worth for immediate FIRE', () => {
    const currentYear = new Date().getFullYear();
    const result = calculateMaxSpendForDate(
      1000000,
      65,
      0,
      currentYear,
      0.07,
      0.04,
      false
    );

    expect(result.maxAnnualExpenses).toBeCloseTo(40000, -2); // 1M * 4%
  });

  it('should account for couple multiplier', () => {
    const solo = calculateMaxSpendForDate(500000, 35, 100000, 2035, 0.07, 0.04, false);
    const couple = calculateMaxSpendForDate(500000, 35, 100000, 2035, 0.07, 0.04, true, 1.7);

    expect(couple.maxMonthlySpend).toBeLessThan(solo.maxMonthlySpend);
  });
});

describe('FIRE_LEVELS', () => {
  it('should have all expected levels', () => {
    expect(FIRE_LEVELS).toHaveLength(4);
    expect(FIRE_LEVELS.map(l => l.name)).toContain('Lean FIRE');
    expect(FIRE_LEVELS.map(l => l.name)).toContain('Regular FIRE');
    expect(FIRE_LEVELS.map(l => l.name)).toContain('Chubby FIRE');
    expect(FIRE_LEVELS.map(l => l.name)).toContain('Fat FIRE');
  });

  it('should have correct withdrawal rates', () => {
    const lean = FIRE_LEVELS.find(l => l.name === 'Lean FIRE');
    const fat = FIRE_LEVELS.find(l => l.name === 'Fat FIRE');

    expect(lean?.withdrawalRate).toBe(0.04);
    expect(fat?.withdrawalRate).toBe(0.025);
  });
});
