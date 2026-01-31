import { describe, it, expect } from 'vitest';
import { modelExpectedWealth } from './wealth-model';

describe('Tax Drag - Backward Compatibility', () => {
  it('should work for legacy profiles without tax treatment', () => {
    const result = modelExpectedWealth({
      currentAge: 30,
      occupation: 'software_engineer',
      metro: 'san_francisco',
      savingsRate: 0.25,
      taxDrag: 0.15,
    });
    expect(result.expectedNetWorth).toBeGreaterThan(0);
    expect(result.yearByYear.length).toBeGreaterThan(0);
  });

  it('should apply default tax treatment when not specified', () => {
    const result = modelExpectedWealth({
      currentAge: 30,
      occupation: 'software_engineer',
      metro: 'san_francisco',
      savingsRate: 0.25,
      taxDrag: 0.15,
      targetAllocation: {
        cashPercent: 0.10,
        investmentPercent: 0.90,
        otherPercent: 0,
        // No taxTreatment specified - should use flat tax drag
      },
    });
    expect(result.expectedNetWorth).toBeGreaterThan(0);
  });
});

describe('Tax Drag - Tax Treatment Logic', () => {
  it('should apply tax drag only to taxable portion', () => {
    // Use longer time horizon (age 50) to see compounding effect of tax drag
    const allTaxAdvantaged = modelExpectedWealth({
      currentAge: 50,
      startAge: 22,
      occupation: 'software_engineer',
      metro: 'san_francisco',
      savingsRate: 0.25,
      taxDrag: 0.15,
      targetAllocation: {
        cashPercent: 0.10,
        investmentPercent: 0.90,
        otherPercent: 0,
        taxTreatment: {
          taxablePercent: 0,
          taxAdvantagePercent: 1,
        },
      },
    });

    const allTaxable = modelExpectedWealth({
      currentAge: 50,
      startAge: 22,
      occupation: 'software_engineer',
      metro: 'san_francisco',
      savingsRate: 0.25,
      taxDrag: 0.15,
      targetAllocation: {
        cashPercent: 0.10,
        investmentPercent: 0.90,
        otherPercent: 0,
        taxTreatment: {
          taxablePercent: 1,
          taxAdvantagePercent: 0,
        },
      },
    });

    // Tax-advantaged should grow more than taxable
    expect(allTaxAdvantaged.expectedNetWorth).toBeGreaterThan(allTaxable.expectedNetWorth);

    // Calculate the difference - should be significant over time
    const difference = allTaxAdvantaged.expectedNetWorth - allTaxable.expectedNetWorth;
    const percentDifference = difference / allTaxable.expectedNetWorth;

    // With 28 years of compounding and 90% in investments, expect at least 10% difference
    expect(percentDifference).toBeGreaterThan(0.10);
  });

  it('should show mixed allocation between all-taxable and all-tax-advantaged', () => {
    const mixed = modelExpectedWealth({
      currentAge: 30,
      occupation: 'software_engineer',
      metro: 'san_francisco',
      savingsRate: 0.25,
      taxDrag: 0.15,
      targetAllocation: {
        cashPercent: 0.10,
        investmentPercent: 0.90,
        otherPercent: 0,
        taxTreatment: {
          taxablePercent: 0.30,
          taxAdvantagePercent: 0.70,
        },
      },
    });

    const allTaxAdvantaged = modelExpectedWealth({
      currentAge: 30,
      occupation: 'software_engineer',
      metro: 'san_francisco',
      savingsRate: 0.25,
      taxDrag: 0.15,
      targetAllocation: {
        cashPercent: 0.10,
        investmentPercent: 0.90,
        otherPercent: 0,
        taxTreatment: {
          taxablePercent: 0,
          taxAdvantagePercent: 1,
        },
      },
    });

    const allTaxable = modelExpectedWealth({
      currentAge: 30,
      occupation: 'software_engineer',
      metro: 'san_francisco',
      savingsRate: 0.25,
      taxDrag: 0.15,
      targetAllocation: {
        cashPercent: 0.10,
        investmentPercent: 0.90,
        otherPercent: 0,
        taxTreatment: {
          taxablePercent: 1,
          taxAdvantagePercent: 0,
        },
      },
    });

    // Mixed should be between the two extremes
    expect(mixed.expectedNetWorth).toBeGreaterThan(allTaxable.expectedNetWorth);
    expect(mixed.expectedNetWorth).toBeLessThan(allTaxAdvantaged.expectedNetWorth);
  });

  it('should correctly calculate effective return in assumptions', () => {
    const result = modelExpectedWealth({
      currentAge: 30,
      occupation: 'software_engineer',
      metro: 'san_francisco',
      savingsRate: 0.25,
      taxDrag: 0.15,
      targetAllocation: {
        cashPercent: 0.10,
        investmentPercent: 0.90,
        otherPercent: 0,
        taxTreatment: {
          taxablePercent: 0.30,
          taxAdvantagePercent: 0.70,
        },
      },
    });

    // Verify that assumptions include the correct fields
    expect(result.assumptions.portfolioReturn).toBeDefined();
    expect(result.assumptions.effectiveReturn).toBeDefined();
    expect(result.assumptions.taxDrag).toBe(0.15);

    // Effective return should be less than portfolio return due to tax drag
    expect(result.assumptions.effectiveReturn).toBeLessThan(result.assumptions.portfolioReturn);
  });
});

describe('Tax Drag - Edge Cases', () => {
  it('should handle 0% investment allocation', () => {
    const result = modelExpectedWealth({
      currentAge: 30,
      occupation: 'software_engineer',
      metro: 'san_francisco',
      savingsRate: 0.25,
      taxDrag: 0.15,
      targetAllocation: {
        cashPercent: 1.0,
        investmentPercent: 0,
        otherPercent: 0,
        taxTreatment: {
          taxablePercent: 0.30,
          taxAdvantagePercent: 0.70,
        },
      },
    });

    expect(result.expectedNetWorth).toBeGreaterThan(0);
    // With no investments, tax treatment shouldn't matter
  });

  it('P1-1: 100% cash allocation should grow at 2% real return', () => {
    const allCash = modelExpectedWealth({
      currentAge: 50,
      startAge: 22,
      occupation: 'software_engineer',
      metro: 'san_francisco',
      savingsRate: 0.25,
      taxDrag: 0.15,
      targetAllocation: {
        cashPercent: 1.0,
        investmentPercent: 0,
        otherPercent: 0,
        taxTreatment: {
          taxablePercent: 0.30,
          taxAdvantagePercent: 0.70,
        },
      },
    });

    // With 100% cash, effective return should be 2% (REAL_RETURN_CASH)
    // Not the investment return of 7%
    expect(allCash.assumptions.effectiveReturn).toBeCloseTo(0.02, 3);

    // Verify cash return is significantly lower than investment return
    const allInvestments = modelExpectedWealth({
      currentAge: 50,
      startAge: 22,
      occupation: 'software_engineer',
      metro: 'san_francisco',
      savingsRate: 0.25,
      taxDrag: 0.15,
      targetAllocation: {
        cashPercent: 0,
        investmentPercent: 1.0,
        otherPercent: 0,
        taxTreatment: {
          taxablePercent: 0.30,
          taxAdvantagePercent: 0.70,
        },
      },
    });

    // All-cash should grow significantly slower than all-investments
    expect(allCash.expectedNetWorth).toBeLessThan(allInvestments.expectedNetWorth);

    // Verify effective returns are correct
    expect(allInvestments.assumptions.effectiveReturn).toBeGreaterThan(0.05); // After-tax investment return
  });

  it('should handle 100% investment allocation', () => {
    const result = modelExpectedWealth({
      currentAge: 30,
      occupation: 'software_engineer',
      metro: 'san_francisco',
      savingsRate: 0.25,
      taxDrag: 0.15,
      targetAllocation: {
        cashPercent: 0,
        investmentPercent: 1.0,
        otherPercent: 0,
        taxTreatment: {
          taxablePercent: 0.30,
          taxAdvantagePercent: 0.70,
        },
      },
    });

    expect(result.expectedNetWorth).toBeGreaterThan(0);
  });
});
