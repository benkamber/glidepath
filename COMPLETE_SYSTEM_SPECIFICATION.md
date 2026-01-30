# Glidepath: Complete System Specification for Expert Validation
## Comprehensive Technical Deep-Dive & Validation Request

**Version:** 2.0 (Post P0+P1 Fixes)
**Date:** January 30, 2026
**Purpose:** Complete system audit and validation
**Audience:** Expert reviewer (Financial Engineer + Software Architect + Legal Analyst)

---

## Mission Statement

You are tasked with **exhaustive validation** of the Glidepath wealth trajectory analysis tool. Your goal is to verify **every formula, every data flow, every UX decision, every legal assumption** with the scrutiny of:
- A PhD Financial Engineer (mathematical rigor)
- A Senior Software Architect (code quality, data flow)
- A Legal Analyst (data licensing, liability)
- A UX Expert (usability, cognitive load)

**Critical**: Flag ANYTHING you're not 100% confident about. No assumptions. No "probably fine."

---

## Table of Contents

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Complete Formula Reference](#2-complete-formula-reference)
3. [Data Flow Documentation](#3-data-flow-documentation)
4. [UX Component Breakdown](#4-ux-component-breakdown)
5. [Data Sourcing Legal Analysis](#5-data-sourcing-legal-analysis)
6. [Code File Map](#6-code-file-map)
7. [Areas of Uncertainty](#7-areas-of-uncertainty)
8. [Validation Checklist](#8-validation-checklist)

---

## 1. System Architecture Overview

### 1.1 Technology Stack

```
Frontend:
  - React 18.3+ (TypeScript)
  - Vite (build tool)
  - Wouter (routing)
  - TanStack Query (data fetching)
  - Recharts (visualization)
  - Tailwind CSS + shadcn/ui (styling)

Backend:
  - NONE (100% client-side)

Storage:
  - localStorage (Web Storage API)
  - No database, no server persistence

Deployment:
  - Static site (can deploy to Vercel/Netlify/Cloudflare Pages)
```

**Question for Validator**: Is 100% localStorage safe? What happens if:
- User has storage quotas (Safari private mode)?
- User clears cookies/cache?
- User has 10+ years of data (50MB+ JSON)?

---

### 1.2 High-Level Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ USER INPUT LAYER                                            │
├─────────────────────────────────────────────────────────────┤
│ 1. Profile Configuration                                    │
│    - Age, Occupation, Career Level, Metro Area              │
│    - Target Allocation: { cash: 0.20, investment: 0.70 }    │
│    - Monthly Expenses, Retirement Age/Spending              │
│                                                             │
│ 2. Net Worth Data Entry                                     │
│    - Manual: Date + Total Net Worth                         │
│    - CSV Import: Batch upload historical entries            │
│    - Demo Mode: Pre-filled sample data                      │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ STATE MANAGEMENT (React useState/useMemo)                   │
├─────────────────────────────────────────────────────────────┤
│ - profile: UserProfile                                      │
│ - entries: Entry[] (historical net worth snapshots)         │
│ - monteCarloResults: AggregatedResults | null               │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ COMPUTATION LAYER (Pure Functions)                          │
├─────────────────────────────────────────────────────────────┤
│ A. Asset Allocation (CRITICAL - Fixed in P0)                │
│    calculateAssetSplit(netWorth, allocation)                │
│    → { cashAssets, investmentAssets, otherAssets }          │
│                                                             │
│ B. Wealth Projection (Fixed in P0+P1)                       │
│    modelExpectedWealth(profile, entries, horizon)           │
│    → { yearByYear, expectedNW, assumptions }                │
│    USES:                                                    │
│      - Weighted returns (cash 2%, stocks 7%, other 0%)      │
│      - Tax drag (15% default on all gains)                  │
│      - Income growth (1.5% real merit-based)                │
│                                                             │
│ C. Monte Carlo Simulation                                   │
│    runMonteCarloSimulation(config)                          │
│    → { percentile5...95, samplePaths, scenarios }           │
│    transformForChart(results, startDate)                    │
│    → { dates[], percentile5[], ..., percentile95[] }        │
│                                                             │
│ D. FIRE Calculations (Fixed in P0)                          │
│    calculateFIRE(netWorth, age, income, expenses)           │
│    → { fireNumber, yearsToFIRE, level, ... }                │
│    USES: 3.5% SWR (Lean/Regular/Chubby), 2.5% (Fat)         │
│                                                             │
│ E. Runway Analysis                                          │
│    simulateRunway(cash, investments, monthlyBurn)           │
│    → { runwayMonths, monthlyBalances }                      │
│                                                             │
│ F. Geographic Arbitrage                                     │
│    calculateRetrospective/ProspectiveImpact(...)            │
│    → { adjustedNetWorth, delta, breakdown }                 │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ VISUALIZATION LAYER (React Components)                      │
├─────────────────────────────────────────────────────────────┤
│ - UnifiedChartSystem (primary chart with 6 lenses)          │
│ - FIRECalculator (FIRE milestones & scenarios)              │
│ - RunwayAnalysis (depletion glidepath)                      │
│ - MonteCarloRunner + MonteCarloResults                      │
│ - COLComparisonSimplified (geo arbitrage)                   │
│ - RoastMode (model vs actual comparison)                    │
└─────────────────────────────────────────────────────────────┘
```

**Question for Validator**: Is this architecture sound? Are there performance bottlenecks?

---

## 2. Complete Formula Reference

### 2.1 Asset Allocation (SINGLE SOURCE OF TRUTH)

**File**: `/client/src/lib/asset-allocation.ts`

**Formula**:
```typescript
cashAssets = totalNetWorth × allocation.cashPercent
investmentAssets = totalNetWorth × allocation.investmentPercent
otherAssets = totalNetWorth × allocation.otherPercent

WHERE:
  allocation.cashPercent + allocation.investmentPercent + allocation.otherPercent = 1.0
  (validated with ±1% tolerance)
```

**Example**:
```
Input:
  totalNetWorth = $4,500,000
  allocation = { cashPercent: 0.05, investmentPercent: 0.95, otherPercent: 0 }

Output:
  cashAssets = $225,000 (5%)
  investmentAssets = $4,275,000 (95%)
  otherAssets = $0
  total = $4,500,000
```

**Critical Fix (P0)**: Previously used manual entry `latestEntry.cash` which could be:
- Stale (not updated when net worth changed)
- Incorrect (only checking/savings, not total cash allocation)
- Inconsistent with allocation sliders

**Questions for Validator**:
1. Should rounding be Math.round() or Math.floor() or preserve decimals?
2. What if user enters negative net worth (debt > assets)?
3. Should we validate that allocation percentages are non-negative?

---

### 2.2 Weighted Portfolio Returns (P1-1 FIX)

**File**: `/client/src/models/wealth-model.ts`

**Asset Class Return Constants**:
```typescript
CASH_RETURN = 0.02       // 2% real (high-yield savings)
INVESTMENT_RETURN = 0.07  // 7% real (equity historical average)
OTHER_RETURN = 0.00       // 0% (depreciating assets: cars, etc.)
```

**Formula**:
```
portfolioReturn = (w_cash × r_cash) + (w_invest × r_invest) + (w_other × r_other)

WHERE:
  w_cash = allocation.cashPercent
  w_invest = allocation.investmentPercent
  w_other = allocation.otherPercent
  r_cash = 0.02
  r_invest = 0.07 (user-customizable, default 7%)
  r_other = 0.00
```

**Example**:
```
Allocation: 20% cash, 70% investment, 10% other
portfolioReturn = (0.20 × 0.02) + (0.70 × 0.07) + (0.10 × 0.00)
                = 0.004 + 0.049 + 0.000
                = 0.053 = 5.3% weighted return
```

**Questions for Validator**:
1. Is 2% reasonable for cash in 2026 (inflation ~3%, high-yield ~4.5%)?
2. Is 7% real equity return still valid (post-2020s bull run)?
3. Should "other" assets have negative return (depreciation)?
4. Should we track rebalancing (drift from target allocation)?

---

### 2.3 Tax Drag Application (P0-2b FIX)

**File**: `/client/src/models/wealth-model.ts`

**Formula**:
```
effectiveReturn = portfolioReturn × (1 - taxDrag)

WHERE:
  taxDrag = 0.15 (default: 15% long-term capital gains rate)
```

**Example**:
```
portfolioReturn = 5.3% (from above)
taxDrag = 0.15
effectiveReturn = 0.053 × (1 - 0.15)
                = 0.053 × 0.85
                = 0.04505 = 4.505%
```

**Annual Growth Calculation**:
```
For each year t:
  investmentGrowth = accumulatedWealth × effectiveReturn
  accumulatedWealth = accumulatedWealth + annualSavings + investmentGrowth
```

**Questions for Validator**:
1. Should tax drag be 15% flat or vary by income bracket?
2. Does this double-count taxes (income is after-tax, gains are also taxed)?
3. Should we separate qualified dividends (15%) from rebalancing (variable)?
4. What about tax-advantaged accounts (401k, Roth IRA)?
5. International users: UK (20%), Canada (50% inclusion)?

---

### 2.4 Career Income Projection

**File**: `/client/src/data/bls-wage-data.ts`

**Level Multipliers**:
```typescript
Entry (0-2 years):     0.7x base
Mid (3-5 years):       1.0x base
Senior (6-10 years):   1.3x base
Staff (11-15 years):   1.6x base
Principal (16-20 years): 2.0x base
Executive (20+ years):  2.0x base + annual growth
```

**Formula for Year t**:
```
Income(t) = BLS_Base_Wage[occupation][metro] × LevelMultiplier[t] × (1 + g)^t

WHERE:
  g = 0.015 (1.5% real annual merit growth) [P1-2 FIX: was 3%]
  LevelMultiplier = determined by years of experience
```

**Example** (Software Engineer, SF Bay Area):
```
BLS Base (Senior): $150K
Metro Multiplier (SF): 1.4x
Adjusted Base: $150K × 1.4 = $210K

Year 0 (30yo, 8 years exp = Senior): $210K × 1.3 = $273K
Year 5 (35yo, 13 years exp = Staff):
  - Base for Staff: $210K × 1.6 = $336K
  - With 5 years growth: $336K × (1.015)^5 = $361K
Year 10 (40yo, 18 years exp = Principal):
  - Base for Principal: $210K × 2.0 = $420K
  - With 10 years growth: $420K × (1.015)^10 = $487K
```

**Within-Level Progression** (before promotion):
```
For year y within current level:
  levelDuration = max_years - min_years + 1
  progress = min(y / levelDuration, 1)
  interpolationFactor = progress × 0.5  // Go 50% toward next level

  currentComp = baseLevelComp + (nextLevelComp - baseLevelComp) × interpolationFactor
```

**Questions for Validator**:
1. Is 1.5% real growth realistic (vs historical 2-3%)?
2. Should metro multipliers compound with level multipliers or add?
3. Are level boundaries correct (Senior at 6-10 years)?
4. Does this account for equity compensation (RSUs)?
5. What about career changes, layoffs, sabbaticals?

---

### 2.5 Wealth Accumulation Model

**File**: `/client/src/models/wealth-model.ts`

**Full Iterative Simulation**:
```
Initialize:
  accumulatedWealth = 0
  age = startAge (default 22)

For each year from startAge to currentAge:
  1. Determine Career Level
     yearsInWorkforce = age - startAge
     currentLevel = getLevelForYears(yearsInWorkforce)
     yearsInLevel = yearsInWorkforce - levelRangeMin

  2. Calculate Income
     income = getWageWithProgression(occupation, currentLevel, metro, yearsInLevel)
     afterTaxIncome = income.afterTaxComp  // Already post-tax

  3. Calculate Savings
     annualSavings = afterTaxIncome × savingsRate

  4. Calculate Investment Growth (with weighted return + tax drag)
     portfolioReturn = (w_cash × 0.02) + (w_invest × 0.07) + (w_other × 0.00)
     effectiveReturn = portfolioReturn × (1 - taxDrag)
     investmentGrowth = accumulatedWealth × effectiveReturn

  5. Update Accumulated Wealth
     accumulatedWealth += annualSavings + investmentGrowth

  6. Record Year Data
     yearByYear.push({
       age,
       expectedNW: accumulatedWealth,
       income: totalComp,
       savings: annualSavings,
       investmentGrowth,
       level: currentLevel
     })

Return:
  expectedNetWorth = accumulatedWealth
  yearByYear = array of annual snapshots
  assumptions = { savingsRate, portfolioReturn, effectiveReturn, taxDrag, ... }
```

**Questions for Validator**:
1. Should compounding be annual or monthly?
2. Does this correctly handle mid-year entries (e.g., data from June)?
3. Should we model spending (expenses) separately from savings rate?
4. What about one-time events (house purchase, inheritance)?

---

### 2.6 FIRE Calculations (P0-2a FIX)

**File**: `/client/src/lib/fire-calculations.ts`

**Safe Withdrawal Rate (SWR) by Level**:
```typescript
Lean FIRE (<$40K/yr):     3.5% SWR → Target = Annual Expenses / 0.035
Regular FIRE ($40-60K):   3.5% SWR → Target = Annual Expenses / 0.035
Chubby FIRE ($60-100K):   3.5% SWR → Target = Annual Expenses / 0.035
Fat FIRE (>$100K):        2.5% SWR → Target = Annual Expenses / 0.025
```

**Why 3.5%?**
- Trinity Study (1998): 4% safe for 30 years (90% success)
- Morningstar 2025: 3.9% safe for 2026 start (90% success, 30 years)
- **Glidepath uses 3.5%** = extra 0.4% margin for:
  - Early retirement (50+ year horizons)
  - Sequence-of-returns risk
  - Lower future returns (post-2010s bull run)

**Formula**:
```
fireNumber = annualExpenses / withdrawalRate

Example:
  Monthly Spend: $4,000
  Annual Expenses: $48,000
  Lean FIRE: $48,000 / 0.035 = $1,371,429
  Fat FIRE:  $48,000 / 0.025 = $1,920,000
```

**Years to FIRE** (compound interest with contributions):
```
Solve for n:
  Target = Current × (1 + r)^n + AnnualSavings × [((1 + r)^n - 1) / r]

WHERE:
  r = effectiveReturn (after tax drag)

Using logarithmic approximation (if savings small):
  n ≈ ln(Target / Current) / ln(1 + r)

Or numerical iteration for exact solution.
```

**Questions for Validator**:
1. Should we use 3.5% for all levels or keep 2.5% for Fat FIRE?
2. Is Morningstar 2025 (3.9%) the most recent research?
3. Should we account for Social Security (reduce needed FIRE number)?
4. What about healthcare costs before Medicare (age 65)?
5. Should time-to-FIRE account for tax drag or use gross returns?

---

### 2.7 Monte Carlo Simulation

**File**: `/client/src/lib/monte-carlo.ts`

**Geometric Brownian Motion** (Investment Returns):
```
For each month m in simulation:
  R(m) = μ_monthly + σ_monthly × Z

WHERE:
  μ_monthly = annualReturn / 12
  σ_monthly = annualVolatility / √12
  Z ~ N(0,1) = Standard normal random variable (Box-Muller transform)
```

**Box-Muller Transform**:
```javascript
function randomNormal(mean, stdDev) {
  const u1 = Math.random();  // Uniform [0,1]
  const u2 = Math.random();  // Uniform [0,1]
  const z = Math.sqrt(-2 × ln(u1)) × cos(2π × u2);
  return mean + z × stdDev;
}
```

**Risk Profiles**:
```typescript
Conservative: μ = 5%, σ = 10%
Moderate:     μ = 7%, σ = 15%
Aggressive:   μ = 9%, σ = 20%
```

**Single Path Simulation**:
```
Initialize:
  balance = currentNetWorth
  month = 0

For each month until timeHorizon:
  1. Calculate Income (with volatility)
     income = monthlyIncome × (1 + ε_income)
     WHERE ε_income ~ N(0, 0.15)  // 15% income volatility

  2. Calculate Expenses (with volatility)
     expenses = monthlyExpenses × (1 + ε_expenses)
     WHERE ε_expenses ~ N(0, 0.15)  // 15% expense volatility

  3. Calculate Savings
     savings = max(0, income - expenses)

  4. Investment Growth (Geometric Brownian Motion)
     monthlyReturn = randomNormal(μ_monthly, σ_monthly)
     investmentGrowth = investedBalance × monthlyReturn

  5. Emergency Events (Poisson process)
     if random() < emergencyProb:  // e.g., 5% per month
       emergencyCost ~ N(emergencyMean, emergencyStdDev)
       savings -= emergencyCost

  6. Update Balance
     balance = balance + savings + investmentGrowth
     monthlyNetWorth[month] = balance

  7. Check Runway
     if balance <= 0:
       monthsOfRunway = month
       break

Return: { monthsOfRunway, finalBalance, monthlyNetWorth, emergencyCount }
```

**Aggregation** (across N=10,000 simulations):
```
For each time point t (e.g., month 0, 1, 2, ...):
  1. Extract values across all simulations: [Path₁(t), Path₂(t), ..., Pathₙ(t)]
  2. Sort values ascending
  3. Calculate percentiles:
     P5(t)  = value at index floor(N × 0.05)
     P25(t) = value at index floor(N × 0.25)
     P50(t) = value at index floor(N × 0.50)  // Median
     P75(t) = value at index floor(N × 0.75)
     P95(t) = value at index floor(N × 0.95)
```

**Questions for Validator**:
1. Is JavaScript Math.random() sufficient or should we use crypto.getRandomValues()?
2. Is 10,000 simulations enough for convergence (central limit theorem)?
3. Should volatility be time-varying (GARCH model)?
4. Are income/expense volatilities (15%) realistic?
5. Is 5% monthly emergency probability too high?
6. Should we model correlation between income loss and market crashes?

---

### 2.8 Runway Analysis

**File**: `/client/src/lib/runway-simulator.ts`

**Month-by-Month Depletion Simulation**:
```
Initialize:
  cash = currentCashBalance
  investments = currentInvestmentBalance
  month = 0

For each month until maxMonths (e.g., 120 = 10 years):
  1. Check Cash First (priority depletion)
     if cash >= monthlyBurn:
       cash -= monthlyBurn
       // Investments continue growing
       investments *= (1 + monthlyReturn)

  2. Tap Investments if Needed
     else:
       remainingNeed = monthlyBurn - cash
       cash = 0

       // Withdraw from investments (with growth)
       investments *= (1 + monthlyReturn)
       withdrawAmount = min(remainingNeed, investments × withdrawalRate)
       investments -= withdrawAmount

  3. Check Depletion
     if (cash + investments) <= 0:
       runwayMonths = month
       break

  4. Record Balance
     monthlyBalances[month] = cash + investments

Return: { runwayMonths, monthlyBalances }
```

**Safe Withdrawal Rate (SWR) for Runway**:
```
withdrawalRate = SWR / 12 = 0.035 / 12 ≈ 0.00292 (0.292% per month)
```

**Questions for Validator**:
1. Is "cash first, then investments" optimal tax-wise?
2. Should we model capital gains tax on withdrawals?
3. Is SWR/12 the right monthly rate (vs (1+SWR)^(1/12) - 1)?
4. Should investments grow during drawdown phase?
5. What about required minimum distributions (RMDs) at age 73?

---

### 2.9 Geographic Arbitrage

**File**: `/client/src/lib/geographic-calculations.ts`

**Cost of Living (COL) Adjustment**:
```
adjustedExpenses = baseExpenses × (COL_target / COL_current)

Example:
  Current: San Francisco (COL = 2.1)
  Target: Austin (COL = 1.1)
  Base Expenses: $5,000/month

  Adjusted: $5,000 × (1.1 / 2.1) = $2,619/month
  Savings: $5,000 - $2,619 = $2,381/month = $28,572/year
```

**Retrospective Analysis** ("What if I lived there last N years?"):
```
For each year y from (currentYear - N) to currentYear:
  1. Calculate Income Delta
     incomeCurrent = BLS_Wage[occupation][currentMetro][level(y)]
     incomeTarget = BLS_Wage[occupation][targetMetro][level(y)]
     incomeDelta(y) = incomeTarget - incomeCurrent

  2. Calculate Expense Delta
     expensesCurrent = actualExpenses(y) × COL_current
     expensesTarget = actualExpenses(y) × COL_target
     expensesDelta(y) = expensesTarget - expensesCurrent

  3. Calculate Net Savings Delta
     netDelta(y) = incomeDelta(y) - expensesDelta(y)

  4. Compound Forward to Present
     futureValue(y) = netDelta(y) × (1 + r)^(currentYear - y)

  5. Sum All Compounded Deltas
     totalDelta = Σ futureValue(y)

Adjusted Net Worth = Current NW + totalDelta
```

**Prospective Analysis** ("What if I move there for next N years?"):
```
Project both scenarios forward N years:
  1. Current Path: projectWealth(currentMetro, currentIncome, currentExpenses, N)
  2. Target Path:  projectWealth(targetMetro, targetIncome, targetExpenses, N)

  Delta = TargetPath[N] - CurrentPath[N]

  FIRE Impact:
    YearsToFIRE_current = calculateYearsToFIRE(currentPath)
    YearsToFIRE_target = calculateYearsToFIRE(targetPath)
    TimeSavings = YearsToFIRE_current - YearsToFIRE_target
```

**Questions for Validator**:
1. Are we double-counting (income is after-tax, COL affects pre-tax spending)?
2. Should we model visa restrictions (H1B can't move freely)?
3. Are PPP indices accurate for individual lifestyle (vs aggregate)?
4. What about one-time relocation costs (moving, housing deposit)?
5. Should we adjust for quality of life (not just financial)?

---

### 2.10 Savings Rate Inference

**File**: `/client/src/models/wealth-model.ts`

**Formula** (backward-solving from historical data):
```
Given historical entries: [E₀, E₁, ..., Eₙ]

1. Calculate Time Period
   Δt_years = (dateₙ - date₀) / 365.25 days

2. Calculate Actual Wealth Growth
   actualGrowth = Eₙ.netWorth - E₀.netWorth

3. Estimate Investment Growth (without contributions)
   estimatedInvestmentGrowth = E₀.netWorth × ((1 + r)^Δt - 1)
   WHERE r = annualReturn (default 7%)

4. Calculate Growth from Savings
   growthFromSavings = actualGrowth - estimatedInvestmentGrowth

5. Calculate Total Income
   totalIncome = estimatedAnnualIncome × Δt_years

6. Infer Savings Rate
   savingsRate = growthFromSavings / totalIncome

7. Validate and Clamp
   if savingsRate < 0 or savingsRate > 0.9 or isNaN:
     return 0.25  // Conservative default
   else:
     return savingsRate
```

**Example**:
```
Data:
  2020: $100K net worth
  2025: $400K net worth
  Estimated Income: $150K/year
  Time: 5 years

Calculations:
  actualGrowth = $400K - $100K = $300K
  investmentGrowth = $100K × ((1.07)^5 - 1) = $100K × 0.4026 = $40.26K
  growthFromSavings = $300K - $40.26K = $259.74K
  totalIncome = $150K × 5 = $750K
  savingsRate = $259.74K / $750K = 34.6%
```

**Questions for Validator**:
1. Does this correctly separate contributions from growth?
2. Should we use compound or simple interest for estimatedInvestmentGrowth?
3. What if income changes dramatically (promotion, job loss)?
4. Should we use effectiveReturn (after tax) or gross return?
5. Is 90% max savings rate reasonable (some people live on <10%)?

---

## 3. Data Flow Documentation

### 3.1 Critical Path: Asset Allocation

**THE MOST IMPORTANT FIX (P0-1)**

**BEFORE (BROKEN)**:
```
User Input:
  └─> Total Net Worth: $4.5M
  └─> Manual "Cash" field: $1M (user's checking + savings only)
  └─> Allocation Sliders: 5% cash, 95% investment

RunwayAnalysis receives:
  └─> cashBalance = latestEntry.cash = $1M ❌ WRONG

Expected:
  └─> cashBalance = $4.5M × 0.05 = $225K
```

**AFTER (FIXED)**:
```
User Input:
  └─> Total Net Worth: $4.5M
  └─> Allocation Sliders: 5% cash, 95% investment

Calculate Asset Split:
  └─> assetSplit = calculateAssetSplit(4500000, { cash: 0.05, inv: 0.95, other: 0 })
  └─> Result: { cashAssets: 225000, investmentAssets: 4275000, otherAssets: 0 }

RunwayAnalysis receives:
  └─> cashBalance = assetSplit.cashAssets = $225K ✅ CORRECT
  └─> investmentBalance = assetSplit.investmentAssets = $4.275M ✅ CORRECT
```

**All Components Using Asset Allocation** (must use calculateAssetSplit):
1. ✅ RunwayAnalysis (lines 1184-1206 in NetWorthCalculator.tsx)
2. ✅ MonteCarloRunner (lines 1363-1389)
3. ✅ RoastMode (lines 848-862)

**Question for Validator**: Are there any other components that should use allocation but don't?

---

### 3.2 Complete Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│ APP INITIALIZATION                                               │
├──────────────────────────────────────────────────────────────────┤
│ 1. Load from localStorage:                                       │
│    - user-profile → UserProfile                                  │
│    - net-worth-entries → Entry[]                                 │
│                                                                  │
│ 2. Check disclaimer:                                             │
│    - hasAcceptedDisclaimer = localStorage.getItem(...)           │
│    - If false: Show DisclaimerModal (blocks UI) [P1-3]           │
│                                                                  │
│ 3. Check onboarding:                                             │
│    - nw_tracker_onboarded = localStorage.getItem(...)            │
│    - If false: Show LandingPage with Demo Mode [P1-4]            │
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│ USER INTERACTION: Profile Configuration                          │
├──────────────────────────────────────────────────────────────────┤
│ ProfileSection.tsx:                                              │
│   - Age: number                                                  │
│   - Occupation: "software_engineer" | "product_manager" | ...    │
│   - Level: "entry" | "mid" | "senior" | "staff" | "principal"   │
│   - Metro: "san_francisco" | "new_york" | ...                    │
│   - Target Allocation: { cash: 0.20, investment: 0.70, other: 0.10 } │
│   - Monthly Expenses: number                                     │
│   - Target Retirement Age: number                                │
│   - Target Retirement Spending: number                           │
│                                                                  │
│ On Change:                                                       │
│   → useState setters update local state                          │
│   → Debounced save to localStorage                               │
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│ USER INTERACTION: Net Worth Entry                                │
├──────────────────────────────────────────────────────────────────┤
│ ManualEntryForm:                                                 │
│   - Date: ISO string                                             │
│   - Total Net Worth: number                                      │
│   - (Cash/Investment auto-calculated from allocation)            │
│                                                                  │
│ SimpleDataImport:                                                │
│   - CSV Upload: Date, Total Net Worth                            │
│   - Parse & Preview                                              │
│   - Validate dates                                               │
│   - Bulk insert                                                  │
│                                                                  │
│ On Submit:                                                       │
│   → Push to entries array                                        │
│   → Sort by date ascending                                       │
│   → Save to localStorage                                         │
│   → Trigger re-computation (useMemo dependencies)                │
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│ COMPUTATION LAYER (Reactive - useMemo)                           │
├──────────────────────────────────────────────────────────────────┤
│ 1. Sort Entries:                                                 │
│    sortedEntries = [...entries].sort((a,b) => date(a) - date(b)) │
│                                                                  │
│ 2. Get Latest Entry:                                             │
│    latestEntry = sortedEntries[sortedEntries.length - 1]         │
│                                                                  │
│ 3. Calculate Asset Split: [P0-1 FIX]                             │
│    assetSplit = calculateAssetSplit(                             │
│      latestEntry.totalNetWorth,                                  │
│      profile.targetAllocation                                    │
│    )                                                             │
│    → { cashAssets, investmentAssets, otherAssets }               │
│                                                                  │
│ 4. Infer Savings Rate:                                           │
│    inferredSavingsRate = inferSavingsRate(                       │
│      sortedEntries,                                              │
│      estimatedIncome,                                            │
│      annualReturn                                                │
│    )                                                             │
│                                                                  │
│ 5. Wealth Projection: [P0+P1 FIX]                                │
│    wealthProjection = modelExpectedWealth({                      │
│      currentAge: profile.age,                                    │
│      occupation: profile.occupation,                             │
│      level: profile.level,                                       │
│      metro: profile.metro,                                       │
│      savingsRate: inferredSavingsRate,                           │
│      annualReturn: 0.07,                                         │
│      taxDrag: 0.15,         // [P0-2b]                           │
│      targetAllocation: profile.targetAllocation  // [P1-1]       │
│    })                                                            │
│    → { expectedNetWorth, yearByYear[], assumptions }             │
│                                                                  │
│ 6. Velocity Analysis:                                            │
│    velocityData = sortedEntries.map((entry, i) => {              │
│      if (i === 0) return { velocity: 0 }                         │
│      velocity = (entry.NW - prev.NW) / daysDiff                  │
│      return { date, velocity }                                   │
│    })                                                            │
│                                                                  │
│ 7. SCF Percentiles:                                              │
│    percentileData = Array.from({ length: 80 }, (_, i) => {       │
│      age = 18 + i                                                │
│      bracket = getBracketForAge(age)                             │
│      return wealthByAge[bracket]  // { p10, p25, p50, p75, p90, p95 } │
│    })                                                            │
│                                                                  │
│ 8. Monte Carlo Transform: [P0 FIX]                               │
│    IF monteCarloResults exists:                                  │
│      monteCarloChartData = transformForChart(                    │
│        monteCarloResults,                                        │
│        new Date(latestEntry.date)                                │
│      )                                                           │
│      → { dates[], percentile5[], ..., percentile95[] }           │
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│ VISUALIZATION LAYER (React Components)                           │
├──────────────────────────────────────────────────────────────────┤
│ UnifiedChartSystem:                                              │
│   Props:                                                         │
│     - entries (historical data)                                  │
│     - monteCarloData (transformed chart data)                    │
│     - profileProjection (career-aware forecast)                  │
│     - velocityData (growth rates)                                │
│     - percentileData (SCF comparison)                            │
│     - fireThresholds (FIRE milestones)                           │
│   State:                                                         │
│     - activeLens: 'raw' | 'velocity' | 'peer' | 'projection' | 'fire' │
│     - activeLayers: ['netWorth', 'cash', 'investment']           │
│     - timeRange: '1Y' | '5Y' | '10Y' | 'All'                     │
│   Render:                                                        │
│     → Enrich data based on active lens                           │
│     → Filter by time range                                       │
│     → Render ComposedChart with Area/Line components             │
│                                                                  │
│ FIRECalculator: [P0-2a FIX]                                      │
│   → calculateFIRE(netWorth, age, income, expenses)               │
│   → Uses 3.5% SWR (Lean/Regular/Chubby), 2.5% (Fat)             │
│   → Display milestones, progress bars, years to FIRE            │
│                                                                  │
│ RunwayAnalysis: [P0-1 FIX]                                       │
│   Props:                                                         │
│     - cashBalance = assetSplit.cashAssets ✅                     │
│     - investmentBalance = assetSplit.investmentAssets ✅         │
│   → simulateRunway(cash, investments, monthlyBurn)               │
│   → Display glidepath chart, runway months                       │
│                                                                  │
│ MonteCarloRunner: [P0-1 FIX]                                     │
│   Props:                                                         │
│     - currentCash = assetSplit.cashAssets ✅                     │
│   User Input:                                                    │
│     - Risk profile: Conservative/Moderate/Aggressive             │
│     - Number of simulations: 1K-50K                              │
│     - Time horizon: 1-60 years                                   │
│   On Run:                                                        │
│     → runMonteCarloSimulation(config)                            │
│     → onResults(aggregatedResults)                               │
│     → Transform and pass to UnifiedChartSystem                   │
│                                                                  │
│ RoastMode: [P0-1 FIX]                                            │
│   Props:                                                         │
│     - cash = assetSplit.cashAssets ✅                            │
│     - investment = assetSplit.investmentAssets ✅                │
│   → Compare actual vs modelExpectedWealth()                      │
│   → Display delta, percentage ahead/behind                       │
│   → Show "assumptions used" breakdown                            │
└──────────────────────────────────────────────────────────────────┘
```

**Question for Validator**: Is this data flow sound? Are there circular dependencies?

---

## 4. UX Component Breakdown

### 4.1 Disclaimer Modal (P1-3)

**File**: `/client/src/components/DisclaimerModal.tsx`

**Behavior**:
1. On app load, check `localStorage.getItem("hasAcceptedDisclaimer")`
2. If `null` or `false`: Display modal (blocks all UI with `onPointerDownOutside` disabled)
3. Modal contents:
   - ⚠️ Icon + "Important: Educational Use Only" header
   - Bullet points:
     - "NOT financial advice"
     - "Future returns unpredictable"
     - "Cannot account for unique circumstances"
     - "May contain errors"
   - Checkbox: "I understand... I am responsible for my own decisions"
   - Button: "I Understand - Continue" (disabled until checkbox checked)
4. On accept: Set `localStorage.setItem("hasAcceptedDisclaimer", "true")` → Close modal
5. Modal cannot be dismissed by clicking outside or pressing Escape

**Questions for Validator**:
1. Is this sufficient legal protection?
2. Should we require scrolling to bottom before enabling button?
3. Should we log acceptance timestamp (privacy concern)?
4. What if user clears localStorage (sees modal again - is that good or annoying)?

---

### 4.2 Landing Page with Demo Mode (P1-4)

**File**: `/client/src/components/LandingPage.tsx`

**Layout**:
```
┌────────────────────────────────────────────────────┐
│ Glidepath                                          │
│                                                    │
│ Stop asking Blind.                                 │
│ See where you actually rank.                       │
│                                                    │
│ [Check Your Numbers]  [👀 View Demo Profile]      │
│                                                    │
│ No signup. No tracking. 100% browser-local.       │
└────────────────────────────────────────────────────┘
```

**Demo Mode Behavior**:
1. User clicks "👀 View Demo Profile"
2. Pre-populate localStorage with realistic data:
   ```javascript
   profile = {
     age: 32,
     occupation: "software_engineer",
     level: "senior",
     metro: "san_francisco",
     totalCompensation: 220000,
     targetAllocation: { cash: 0.10, investment: 0.85, other: 0.05 },
     monthlyExpenses: 5500,
     targetRetirementAge: 55,
     targetRetirementSpending: 6000
   }

   entries = [
     { date: "2020-01-01", totalNetWorth: 80000, ... },
     { date: "2021-01-01", totalNetWorth: 150000, ... },
     { date: "2022-01-01", totalNetWorth: 250000, ... },
     { date: "2023-01-01", totalNetWorth: 380000, ... },
     { date: "2024-01-01", totalNetWorth: 550000, ... },
     { date: "2025-01-01", totalNetWorth: 750000, ... }
   ]
   ```
3. Set `localStorage.setItem("nw_tracker_demo_mode", "true")` (flag for analytics)
4. Call `onGetStarted()` to hide landing page and show main app
5. User can now explore all features without manual data entry

**Questions for Validator**:
1. Is the demo data realistic (26% growth rate, 35% savings rate)?
2. Should we show a banner "You're viewing demo data" in the app?
3. How to handle user wanting to switch from demo to real data?
4. Should demo data be more diverse (lower NW, different occupation)?

---

### 4.3 Unified Chart System

**File**: `/client/src/components/UnifiedChartSystem.tsx`

**Concept**: Single chart with interchangeable "lenses" (analysis overlays)

**Controls**:
```
┌──────────────────────────────────────────────────────────┐
│ Filters: [1Y] [5Y] [10Y] [All]  Layers: ☑NW ☑Cash ☐Inv  │
│ Lens: [Projection ▼]  Horizon: [10 ─────◉──── 60 years] │
│ [Export Chart]                                           │
├──────────────────────────────────────────────────────────┤
│                                                          │
│           [CHART RENDERS HERE]                           │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**6 Lenses**:
1. **Raw Data**: Just historical net worth line
2. **Velocity**: Shows dW/dt (growth rate) over time
3. **Peer Comparison**: SCF percentile bands (P10, P25, P50, P75, P90, P95)
4. **Projection**: Monte Carlo probability bands + career forecast
5. **FIRE**: Milestone markers (Lean/Regular/Chubby/Fat FIRE lines)
6. **Deviation**: Statistical anomaly detection

**Data Enrichment Pipeline**:
```typescript
enrichedData = useMemo(() => {
  let data = [...chartData];  // Start with historical

  // Apply time filter
  if (timeRange !== 'All') {
    const cutoffDate = subYears(new Date(), timeRange);
    data = data.filter(d => new Date(d.date) >= cutoffDate);
  }

  // Apply active lens
  if (activeLens === 'velocity') {
    data = data.map((point, i) => ({
      ...point,
      velocity: i === 0 ? 0 : velocityData[i].velocity
    }));
  }

  if (activeLens === 'peer') {
    data.forEach(point => {
      const age = currentAge - (latestDate - point.date) / 365;
      const bracket = getBracketForAge(age);
      point.p10 = percentileData[bracket].p10;
      point.p25 = percentileData[bracket].p25;
      // ... p50, p75, p90, p95
    });
  }

  if (activeLens === 'projection') {
    // Add future data points
    const lastEntry = data[data.length - 1];
    const lastDate = new Date(lastEntry.date);

    // Add career projection
    profileProjection.yearByYear.forEach((proj, i) => {
      const futureDate = addYears(lastDate, i + 1);
      data.push({
        date: format(futureDate, 'yyyy'),
        fullDate: futureDate.toISOString(),
        projection: proj.expectedNW,
        // Add Monte Carlo percentiles if available
        mc5: monteCarloData?.percentile5[i],
        mc25: monteCarloData?.percentile25[i],
        mc50: monteCarloData?.percentile50[i],
        mc75: monteCarloData?.percentile75[i],
        mc95: monteCarloData?.percentile95[i]
      });
    });
  }

  return data;
}, [chartData, activeLens, timeRange, velocityData, percentileData, monteCarloData]);
```

**Rendering**:
```tsx
<ComposedChart data={enrichedData} width={800} height={400}>
  <XAxis dataKey="date" />
  <YAxis />
  <Tooltip />
  <Legend />

  {/* Historical Data */}
  {activeLayers.includes('netWorth') && (
    <Line dataKey="totalNetWorth" stroke="#10b981" strokeWidth={2} />
  )}

  {activeLayers.includes('cash') && (
    <Line dataKey="cash" stroke="#3b82f6" strokeWidth={1} />
  )}

  {/* Projection Lens: Monte Carlo Bands */}
  {activeLens === 'projection' && (
    <>
      <Area dataKey="mc95" fill="hsl(var(--primary))" fillOpacity={0.1} />
      <Area dataKey="mc5" fill="hsl(var(--background))" fillOpacity={1} />
      <Area dataKey="mc75" fill="hsl(var(--primary))" fillOpacity={0.2} />
      <Area dataKey="mc25" fill="hsl(var(--background))" fillOpacity={1} />
      <Line dataKey="mc50" stroke="hsl(var(--primary))" strokeWidth={3} />
      <Line dataKey="projection" stroke="#10b981" strokeDasharray="5 5" strokeWidth={2} />
    </>
  )}

  {/* Peer Lens: Percentile Bands */}
  {activeLens === 'peer' && (
    <>
      <Area dataKey="p90" fill="#fbbf24" fillOpacity={0.2} />
      <Area dataKey="p10" fill="hsl(var(--background))" fillOpacity={1} />
      <Line dataKey="p50" stroke="#6b7280" strokeWidth={1} />
    </>
  )}
</ComposedChart>
```

**Questions for Validator**:
1. Is the lens concept intuitive or confusing?
2. Should we limit to 2-3 lenses instead of 6?
3. Is data enrichment pipeline performant (runs on every state change)?
4. Should we memoize enriched data more aggressively?
5. Are Recharts Area components the right choice for probability bands?

---

### 4.4 FIRE Calculator Interface

**File**: `/client/src/components/fire/FIRECalculator.tsx`

**Layout**:
```
┌────────────────────────────────────────────────────────┐
│ 🔥 FIRE Calculator                                     │
├────────────────────────────────────────────────────────┤
│ Current Monthly Spending: [$5,000]                     │
│ Retirement Monthly Spending: [$6,000]                  │
│                                                        │
│ FIRE Milestones                                        │
│ ┌──────────────────────────────────────────────────┐   │
│ │ Lean FIRE    $1.37M  [████████░░] 55%            │   │
│ │              ↳ 6.2 years at current pace         │   │
│ │                                                  │   │
│ │ Regular FIRE $2.06M  [█████░░░░░] 37%            │   │
│ │              ↳ 10.8 years                        │   │
│ │                                                  │   │
│ │ Chubby FIRE  $2.74M  [███░░░░░░░] 27%            │   │
│ │              ↳ 14.2 years                        │   │
│ │                                                  │   │
│ │ Fat FIRE     $4.80M  [██░░░░░░░░] 16%            │   │
│ │              ↳ 22.5 years                        │   │
│ └──────────────────────────────────────────────────┘   │
│                                                        │
│ Scenario Comparison                                    │
│ ┌──────────────┬──────────┬─────────────────┐          │
│ │ Scenario     │ Income   │ Years to FIRE   │          │
│ ├──────────────┼──────────┼─────────────────┤          │
│ │ Current      │ $220K    │ 10.8 years      │          │
│ │ +10% raise   │ $242K    │ 9.1 years (-2y) │          │
│ │ -20% spend   │ $220K    │ 7.8 years (-3y) │          │
│ │ Both         │ $242K    │ 6.5 years (-4y) │          │
│ └──────────────┴──────────┴─────────────────┘          │
└────────────────────────────────────────────────────────┘
```

**Calculations** (using 3.5% SWR):
```
Current Net Worth: $750K
Monthly Spend: $5,000
Annual Expenses: $60,000

Lean FIRE:  $60K / 0.035 = $1,714,286
Progress: $750K / $1,714K = 43.7%
Years to FIRE: Solve for n in wealth accumulation equation
```

**Questions for Validator**:
1. Should we show retirement spending separately (different from current)?
2. Is scenario comparison useful or clutter?
3. Should we add Coast FIRE and Barista FIRE variants?
4. Are FIRE level boundaries reasonable ($40K, $60K, $100K)?

---

## 5. Data Sourcing Legal Analysis

### 5.1 Bureau of Labor Statistics (BLS) - Occupational Employment Statistics

**Source**: https://www.bls.gov/oes/
**API**: https://www.bls.gov/developers/
**Data Used**: Median wages by occupation (SOC codes) and metropolitan area
**Update Frequency**: Annual (May release)

**Legal Status**: ✅ **PUBLIC DOMAIN**

**Statutory Basis**:
- 17 U.S.C. § 105: "Copyright protection under this title is not available for any work of the United States Government"
- BLS is part of Department of Labor (federal agency)
- No restrictions on use, reproduction, or redistribution

**Terms of Use**: https://www.bls.gov/bls/linksite.htm
> "As a Federal government website, BLS.gov is not copyrighted. Visitors may link to any page on the site and may copy information from the site."

**Attribution**: Not required by law, but best practice
- We cite: "Bureau of Labor Statistics, U.S. Department of Labor"

**Questions for Validator**:
1. Do we need to update data annually or is 2024/2025 data sufficient?
2. Should we include BLS disclaimer in UI or docs?
3. Are we correctly mapping SOC codes to our occupation types?

---

### 5.2 Federal Reserve - Survey of Consumer Finances (SCF)

**Source**: https://www.federalreserve.gov/econres/scfindex.htm
**Microdata**: https://www.federalreserve.gov/econres/files/scfp2022s.zip
**Data Used**: Net worth percentiles (P10, P25, P50, P75, P90, P95) by age bracket
**Update Frequency**: Triennial (every 3 years; latest: 2022)

**Legal Status**: ✅ **PUBLIC DOMAIN**

**Federal Reserve Policy**:
- Public data release, no copyright claimed
- Data is fully anonymized (no PII)
- Free to use for any purpose

**Terms**: https://www.federalreserve.gov/regs/default.htm
> "Information on the Federal Reserve Board's website is in the public domain and may be used without permission."

**Attribution**: Recommended
- We cite: "Survey of Consumer Finances, Board of Governors of the Federal Reserve System"

**Questions for Validator**:
1. Should we interpolate between age brackets or use step functions?
2. Are 2022 numbers still relevant in 2026 (post-pandemic wealth surge)?
3. Should we adjust for inflation from 2022 to 2026?

---

### 5.3 OECD Purchasing Power Parity (PPP)

**Source**: https://data.oecd.org/conversion/purchasing-power-parities-ppp.htm
**API**: https://data.oecd.org/api/
**Data Used**: PPP conversion rates (relative to USD = 1.0)
**Update Frequency**: Annual

**Legal Status**: ✅ **FREE WITH ATTRIBUTION**

**OECD Terms of Use**: https://www.oecd.org/termsandconditions/
> "You may extract, download, reproduce, and use OECD Content for non-commercial or commercial purposes, subject to the following conditions:
> - Attribution: You must cite OECD as the source"

**License**: Open data, requires citation

**Attribution Used**:
- File header: "OECD Purchasing Power Parity (PPP) data"
- UI (if displayed): "Data source: OECD"

**Questions for Validator**:
1. Is our attribution sufficient or should it be more prominent?
2. Do we need to include OECD logo (probably not)?
3. Should we document exact API endpoints used?

---

### 5.4 World Bank - International Comparison Program (ICP)

**Source**: https://www.worldbank.org/en/programs/icp
**Data Portal**: https://data.worldbank.org/
**Data Used**: Price level indices, PPP conversion factors
**Update Frequency**: Periodic (every 3-6 years)

**Legal Status**: ✅ **CC BY 4.0 (REQUIRES ATTRIBUTION)**

**License**: Creative Commons Attribution 4.0 International
- https://creativecommons.org/licenses/by/4.0/

**Terms**: https://www.worldbank.org/en/about/legal/terms-of-use-for-datasets
> "You are free to copy, distribute, transmit, and adapt the data, provided you attribute the work as follows:
> World Bank. [Year]. [Dataset Name]. [URL]"

**Attribution Used**:
- File header: "World Bank International Comparison Program (ICP)"
- UI footer: "Cost of living data: World Bank (CC BY 4.0)"

**Questions for Validator**:
1. Is our attribution compliant with CC BY 4.0?
2. Should we link to specific dataset URL?
3. Do we need to include license text in distributed code?

---

### 5.5 Morningstar Research - Safe Withdrawal Rates

**Source**: Morningstar Research (2025)
**Title**: "The State of Retirement Income: Safe Withdrawal Rates"
**Data Used**: 3.9% SWR recommendation for 2026 retirements

**Legal Status**: ✅ **PUBLISHED RESEARCH (FAIR USE)**

**Fair Use Doctrine**: 17 U.S.C. § 107
- Purpose: Educational, non-commercial
- Nature: Published research (factual data)
- Amount: Single data point (3.9% rate)
- Effect: Does not harm market for original work

**Citation Used**:
- "per Morningstar 2025 research"
- Full citation in documentation

**Note**: We use 3.5% (more conservative than Morningstar's 3.9%)

**Questions for Validator**:
1. Do we need formal permission to cite research findings?
2. Should we link to Morningstar report (if publicly available)?
3. Is "fair use" defense strong enough for SWR data point?

---

### 5.6 Trinity Study - 4% Rule

**Source**: "Retirement Savings: Choosing a Withdrawal Rate That Is Sustainable"
**Authors**: Philip L. Cooley, Carl M. Hubbard, Daniel T. Walz (1998)
**Journal**: AAII Journal
**Data Used**: 4% safe withdrawal rate concept

**Legal Status**: ✅ **PUBLISHED ACADEMIC RESEARCH (FAIR USE)**

**Fair Use Doctrine**:
- Mathematical formula (not copyrightable)
- Widely cited industry standard
- Factual data, not creative work

**Citation Used**:
- "Trinity Study (1998)"
- Full citation in methodology docs

**Note**: We do NOT use 4% directly; we use 3.5% (more conservative)

**Questions for Validator**:
1. Is citing the "4% rule" safe (it's become generic term)?
2. Do we need permission from AAII Journal?
3. Should we cite updated Trinity Study (2011 revision)?

---

### 5.7 Summary Table: Data Source Legal Compliance

| Source | License | Attribution Required? | Commercial Use? | Status |
|--------|---------|----------------------|-----------------|--------|
| BLS Wage Data | Public Domain (17 U.S.C. § 105) | No (but best practice) | ✅ Yes | ✅ Compliant |
| Federal Reserve SCF | Public Domain | No (but best practice) | ✅ Yes | ✅ Compliant |
| OECD PPP | Open Data | ✅ Yes | ✅ Yes | ✅ Compliant |
| World Bank ICP | CC BY 4.0 | ✅ Yes | ✅ Yes | ✅ Compliant |
| Morningstar SWR | Fair Use | Citation | ✅ Yes (educational) | ✅ Compliant |
| Trinity Study | Fair Use | Citation | ✅ Yes (educational) | ✅ Compliant |

**Overall Assessment**: ✅ **100% LEGALLY COMPLIANT**

---

## 6. Code File Map

### 6.1 Core Calculation Libraries

| File | Lines | Purpose | Key Functions | Dependencies |
|------|-------|---------|---------------|--------------|
| `/client/src/lib/asset-allocation.ts` | 76 | SINGLE SOURCE OF TRUTH for asset splits | `calculateAssetSplit()`, `validateAllocation()` | None (pure) |
| `/client/src/models/wealth-model.ts` | ~300 | Career-aware wealth projection | `modelExpectedWealth()`, `inferSavingsRate()` | bls-wage-data, scf-data |
| `/client/src/lib/monte-carlo.ts` | ~500 | Monte Carlo simulation engine | `runMonteCarloSimulation()`, `transformForChart()` | None (pure) |
| `/client/src/lib/fire-calculations.ts` | ~250 | FIRE number & years-to-FIRE | `calculateFIRE()`, `calculateFIRENumber()` | None (pure) |
| `/client/src/lib/runway-simulator.ts` | ~200 | Month-by-month depletion | `simulateRunway()` | None (pure) |
| `/client/src/lib/geographic-calculations.ts` | ~150 | Geographic arbitrage | `calculateRetrospectiveImpact()` | None (pure) |

**Questions for Validator**:
1. Are these pure functions (no side effects)?
2. Should we add unit tests for each?
3. Are there performance bottlenecks (heavy loops)?

---

### 6.2 Data Source Files

| File | Lines | Purpose | Data Source | Update Frequency |
|------|-------|---------|-------------|------------------|
| `/client/src/data/bls-wage-data.ts` | ~800 | BLS occupation wages | BLS OES | Annual |
| `/client/src/data/scf-data.ts` | ~200 | Federal Reserve percentiles | SCF | Triennial |
| `/client/src/data/international-cities.ts` | ~300 | Cost of living indices | OECD/World Bank | Annual |

**Questions for Validator**:
1. Should these be JSON files instead of TS (smaller bundle)?
2. How to handle data staleness (2024 data in 2027)?
3. Should we fetch latest data from APIs at runtime?

---

### 6.3 UI Components

| File | Lines | Purpose | Key Props | State |
|------|-------|---------|-----------|-------|
| `/client/src/App.tsx` | ~60 | Root component, disclaimer, demo | None | showLanding |
| `/client/src/pages/NetWorthCalculator.tsx` | ~1500 | Main orchestrator | None | profile, entries, monteCarloResults |
| `/client/src/components/DisclaimerModal.tsx` | ~100 | Legal shield | None | isOpen, hasReadDisclaimer |
| `/client/src/components/LandingPage.tsx` | ~150 | Onboarding + demo | onGetStarted, onLoadDemo | None |
| `/client/src/components/UnifiedChartSystem.tsx` | ~700 | Primary visualization | entries, monteCarloData, projections | activeLens, activeLayers, timeRange |
| `/client/src/components/fire/FIRECalculator.tsx` | ~400 | FIRE planning | netWorth, age, income, expenses | monthlySpend, isCouple |
| `/client/src/components/RunwayAnalysis.tsx` | ~300 | Depletion analysis | cashBalance, investmentBalance | monthlyBurn, sliders |
| `/client/src/components/COLComparisonSimplified.tsx` | ~500 | Geographic arbitrage | currentMetro, netWorth | expandedCity, timeSliders |

**Questions for Validator**:
1. Is NetWorthCalculator too large (1500 lines)?
2. Should we split into smaller components?
3. Are prop drilling issues (passing props 3+ levels)?

---

## 7. Areas of Uncertainty

**FLAG FOR VALIDATOR: I am NOT 100% confident about these decisions:**

### 7.1 Mathematical Assumptions

1. **Tax Drag = 15% Flat**
   - ❓ Should vary by income bracket (0%, 15%, 20%)?
   - ❓ Does this double-count (income already post-tax)?
   - ❓ What about tax-advantaged accounts (401k, IRA)?

2. **Cash Return = 2% Real**
   - ❓ Is this accurate in 2026 (high-yield ~4.5%, inflation ~3%)?
   - ❓ Should we use T-Bill rates instead?

3. **Income Growth = 1.5% Real**
   - ❓ Is this too low (historical ~2-3%)?
   - ❓ Should vary by occupation (tech vs teacher)?

4. **Monte Carlo: 10,000 Simulations**
   - ❓ Is this enough for convergence?
   - ❓ Should we use quasi-random (Sobol sequences)?

5. **Emergency Events: 5% Monthly**
   - ❓ Is this probability realistic?
   - ❓ What constitutes "emergency" (medical, job loss)?

---

### 7.2 Data Sourcing

1. **OECD PPP vs Numbeo**
   - ✅ OECD is legal (removed Numbeo)
   - ❓ Are PPP indices accurate for individuals (vs aggregate)?
   - ❓ Should we use multiple sources and average?

2. **BLS Wage Data Staleness**
   - ❓ 2024 data in 2026 - is 2-year lag acceptable?
   - ❓ Should we apply inflation adjustment?

3. **SCF Percentiles from 2022**
   - ❓ Post-pandemic wealth surge - are 2022 numbers still valid?
   - ❓ Should we adjust for 2022-2026 market gains (~40%)?

---

### 7.3 UX Decisions

1. **6 Chart Lenses**
   - ❓ Is this too many (overwhelming)?
   - ❓ Should we hide advanced lenses behind "Advanced" toggle?

2. **Disclaimer Modal**
   - ❓ Is checkbox + accept sufficient legal protection?
   - ❓ Should we require scrolling to bottom?
   - ❓ What if user uses incognito (sees modal every time)?

3. **Demo Mode Data**
   - ❓ Is $750K net worth at age 32 representative?
   - ❓ Should we offer multiple demo profiles (lower/higher NW)?

4. **localStorage Only**
   - ❓ What about power users with 10+ years data (50MB JSON)?
   - ❓ Should we add export to Google Drive / Dropbox?

---

### 7.4 Technical Decisions

1. **JavaScript Math.random()**
   - ❓ Is this sufficient for Monte Carlo or should we use crypto.getRandomValues()?
   - ❓ Does it matter (simulations vs cryptography)?

2. **Annual Compounding**
   - ❓ Should we use monthly compounding for accuracy?
   - ❓ Does daily compounding matter (vs annual)?

3. **React useMemo Performance**
   - ❓ Are we over-memoizing (premature optimization)?
   - ❓ Should we profile with Chrome DevTools?

4. **Recharts Library**
   - ❓ Is this the best charting library (vs D3, Chart.js)?
   - ❓ Are Area components correct for probability bands?

---

### 7.5 Legal/Compliance

1. **"Not Financial Advice" Disclaimer**
   - ❓ Is this sufficient to avoid SEC/FINRA issues?
   - ❓ Should we consult actual lawyer?

2. **GDPR Compliance**
   - ❓ Does 100% client-side exempt us from GDPR?
   - ❓ What about cookies (do we use any)?

3. **Accessibility (ADA)**
   - ❓ Is the app screen-reader friendly?
   - ❓ Should we audit with WAVE or axe DevTools?

4. **Open Source License (MIT)**
   - ❓ Does MIT provide enough liability protection?
   - ❓ Should we use Apache 2.0 (explicit patent grant)?

---

## 8. Validation Checklist

**Your Task**: Validate each of the following with ✅ (verified) or ❌ (incorrect) or ❓ (uncertain)

### 8.1 Mathematical Correctness

- [ ] Asset allocation formula is correct
- [ ] Weighted return calculation is correct
- [ ] Tax drag application is correct and doesn't double-count
- [ ] Compound interest formula is correct (annual vs monthly)
- [ ] FIRE calculations use appropriate SWR (3.5% vs 3.9% vs 4%)
- [ ] Monte Carlo uses proper Geometric Brownian Motion
- [ ] Box-Muller transform is correctly implemented
- [ ] Percentile calculations are correct
- [ ] Savings rate inference logic is sound
- [ ] Geographic arbitrage math is correct

### 8.2 Data Sourcing Legality

- [ ] BLS data usage is legal (public domain verified)
- [ ] SCF data usage is legal (public domain verified)
- [ ] OECD PPP usage is legal (attribution present)
- [ ] World Bank ICP usage is legal (CC BY 4.0 compliant)
- [ ] Morningstar citation is fair use
- [ ] Trinity Study citation is fair use
- [ ] No Numbeo or proprietary data present

### 8.3 Code Quality

- [ ] Data flow is sound (no circular dependencies)
- [ ] Components are properly decomposed (not too large)
- [ ] Pure functions have no side effects
- [ ] Performance is acceptable (no obvious bottlenecks)
- [ ] Error handling is present
- [ ] TypeScript types are correct

### 8.4 UX/Accessibility

- [ ] Disclaimer modal is clear and enforceable
- [ ] Demo mode provides realistic data
- [ ] Chart lenses are intuitive
- [ ] Navigation is logical
- [ ] Mobile responsive
- [ ] Screen reader compatible
- [ ] Color contrast meets WCAG 2.1 AA

### 8.5 Security/Privacy

- [ ] No data sent to server (verified)
- [ ] localStorage is only persistence
- [ ] No third-party trackers
- [ ] No cookies used (except essential)
- [ ] Export/import is secure (no XSS vectors)
- [ ] Input validation present

---

## 9. Output Format

Please provide your validation in the following format:

```markdown
# Glidepath: Expert Validation Report

## Section 1: Mathematical Verification
[For each formula, provide ✅ verified / ❌ incorrect / ❓ uncertain]

### Formula 1.1: Asset Allocation
**Status**: [✅/❌/❓]
**Analysis**: [Detailed explanation]
**Issues**: [List any problems]
**Recommendations**: [Suggestions for fixes]

[Continue for all formulas...]

## Section 2: Data Sourcing Legal Review
[For each data source, verify legal compliance]

## Section 3: Code Architecture Review
[Assess data flow, component structure, performance]

## Section 4: UX/Accessibility Review
[Evaluate usability, cognitive load, accessibility]

## Section 5: Areas of Uncertainty - Expert Answers
[For each uncertainty I flagged, provide your expert opinion]

## Section 6: Critical Issues Found
[List P0/P1/P2 issues discovered]

## Section 7: Final Recommendation
**Launch Readiness**: [Ready / Not Ready / Conditional]
**Overall Score**: [X/100]
**Summary**: [2-3 paragraphs]
```

---

## 10. Conclusion

**This is your mission**: Validate EVERY aspect of this system with the scrutiny of a PhD-level expert. Flag ANYTHING you're uncertain about. Do not assume anything is correct.

**Success Criteria**:
1. Every formula verified mathematically
2. Every data source confirmed legal
3. Every UX decision evaluated
4. Every uncertainty addressed
5. Clear launch recommendation

**Thank you for your thorough review.** 🚀
