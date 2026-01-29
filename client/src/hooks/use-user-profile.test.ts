import { describe, it, expect } from 'vitest';
import { validateAllocation, type TargetAllocation } from './use-user-profile';

describe('validateAllocation', () => {
  it('should accept valid allocation summing to 100%', () => {
    const allocation: TargetAllocation = {
      cashPercent: 0.20,
      investmentPercent: 0.70,
      otherPercent: 0.10,
    };
    const result = validateAllocation(allocation);
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should accept allocation with minor rounding (0.9995)', () => {
    const allocation: TargetAllocation = {
      cashPercent: 0.20,
      investmentPercent: 0.6995,
      otherPercent: 0.10,
    };
    const result = validateAllocation(allocation);
    expect(result.isValid).toBe(true);
  });

  it('should reject allocation summing to less than 100%', () => {
    const allocation: TargetAllocation = {
      cashPercent: 0.20,
      investmentPercent: 0.60,
      otherPercent: 0.10,
    };
    const result = validateAllocation(allocation);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('must sum to 100%');
    expect(result.error).toContain('90.0%');
  });

  it('should reject allocation summing to more than 100%', () => {
    const allocation: TargetAllocation = {
      cashPercent: 0.30,
      investmentPercent: 0.70,
      otherPercent: 0.10,
    };
    const result = validateAllocation(allocation);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('must sum to 100%');
    expect(result.error).toContain('110.0%');
  });

  it('should reject negative percentages', () => {
    const allocation: TargetAllocation = {
      cashPercent: -0.10,
      investmentPercent: 0.80,
      otherPercent: 0.30,
    };
    const result = validateAllocation(allocation);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('cannot be negative');
  });

  it('should accept all cash (0% invested)', () => {
    const allocation: TargetAllocation = {
      cashPercent: 1.0,
      investmentPercent: 0.0,
      otherPercent: 0.0,
    };
    const result = validateAllocation(allocation);
    expect(result.isValid).toBe(true);
  });

  it('should accept all invested (0% cash)', () => {
    const allocation: TargetAllocation = {
      cashPercent: 0.0,
      investmentPercent: 1.0,
      otherPercent: 0.0,
    };
    const result = validateAllocation(allocation);
    expect(result.isValid).toBe(true);
  });

  it('should handle floating point precision', () => {
    const allocation: TargetAllocation = {
      cashPercent: 0.333333,
      investmentPercent: 0.333333,
      otherPercent: 0.333334,
    };
    const result = validateAllocation(allocation);
    expect(result.isValid).toBe(true);
  });
});
