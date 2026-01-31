/**
 * Application-wide constants for financial modeling
 */

// Asset Class Return Assumptions (Real, after inflation)
export const REAL_RETURN_CASH = 0.02;       // 2% Real (HYSA - Inflation)
export const REAL_RETURN_INVESTMENT = 0.07;  // 7% Real (Equity/Stock market historical average)
export const REAL_RETURN_OTHER = 0.00;       // 0% Real (Depreciating assets like vehicles)

// Income Growth
export const DEFAULT_INCOME_GROWTH = 0.015;  // 1.5% Real (Merit increase above inflation)

// Tax Rates
export const DEFAULT_TAX_RATE_LTCG = 0.15;   // 15% Long-term capital gains

// Default Allocations
export const DEFAULT_ALLOCATION = {
  cashPercent: 0.20,       // 20% cash reserve
  investmentPercent: 0.70, // 70% market investments
  otherPercent: 0.10,      // 10% other assets (real estate, vehicles, etc.)
};

// Default Tax Treatment (for new profiles)
export const DEFAULT_TAX_TREATMENT = {
  taxablePercent: 0.30,      // 30% in taxable brokerage
  taxAdvantagePercent: 0.70, // 70% in 401k/IRA (tax-advantaged)
};
