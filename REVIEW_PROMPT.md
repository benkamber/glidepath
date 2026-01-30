# Comprehensive System Review Prompt
## For Independent LLM Validation

---

## Your Mission

You are a senior technical reviewer tasked with conducting a comprehensive audit of **Glidepath**, a wealth trajectory analysis tool. Your goal is to evaluate:

1. **Mathematical Correctness**: Verify all formulas are accurate and properly implemented
2. **Competitive Positioning**: Assess whether this product is truly better than industry leaders (Wealthfront PATH, Personal Capital)
3. **Legal Compliance**: Ensure all data sourcing is 100% legal and ethically sound
4. **UX/Usability**: Identify design issues, confusing flows, or missing features
5. **Risk Assessment**: Flag any potential issues, edge cases, or vulnerabilities

---

## Context: What is Glidepath?

**Glidepath** is an open-source, privacy-first wealth trajectory analysis tool that provides:

- **Net worth tracking** with manual data entry (no account linking required)
- **Asset allocation management** with user-configured percentages (cash/investment/other)
- **Career-aware projections** using Bureau of Labor Statistics (BLS) wage data
- **Monte Carlo simulations** with 10,000+ runs for probabilistic forecasting
- **FIRE planning** (Financial Independence Retire Early) with multiple scenarios
- **Geographic arbitrage analysis** showing retrospective and prospective relocation impacts
- **Velocity analysis** with first and second derivatives (acceleration)
- **Peer comparison** using Federal Reserve Survey of Consumer Finances (SCF) data

**Key Differentiators vs Wealthfront PATH**:
- ✅ 100% client-side (no account linking, no data tracking)
- ✅ User-configured asset allocation (not inferred from accounts)
- ✅ 10-60 year projections (vs 30 years)
- ✅ Career progression modeling with occupation/level/metro
- ✅ Open source and transparent

---

## Documents to Review

### Primary Document

**`TECHNICAL_SPECIFICATION.md`** (1,850 lines)

This document contains:
- Section 1: Executive Summary
- Section 2: Mathematical Formulas (8 core models)
- Section 3: Data Sources & Legal Compliance
- Section 4: Engineering Architecture
- Section 5: UX Design & User Flow
- Section 6: Comparison to Wealthfront PATH
- Section 7: Testing & Validation

### Supporting Files to Inspect

If you have access to the codebase, review:

```
Core Mathematical Libraries:
  /client/src/lib/asset-allocation.ts        [Asset split calculation]
  /client/src/lib/monte-carlo.ts             [Monte Carlo simulation engine]
  /client/src/lib/wealth-projections.ts      [Career-aware projections]
  /client/src/lib/runway-simulator.ts        [Runway analysis]

Data Sources:
  /client/src/data/bls-wage-data.ts          [BLS occupation wages]
  /client/src/data/scf-data.ts               [Federal Reserve percentiles]
  /client/src/lib/metro-data.ts              [Cost of living indices]

Main Application:
  /client/src/pages/NetWorthCalculator.tsx   [Orchestrator component]
  /client/src/components/UnifiedChartSystem.tsx [Primary visualization]
  /client/src/components/fire/FIRECalculator.tsx [FIRE planning]
  /client/src/components/COLComparisonSimplified.tsx [Geo arbitrage]
```

---

## Your Review Tasks

### Task 1: Mathematical Verification

**Review Section 2 of TECHNICAL_SPECIFICATION.md**

For each of the 8 mathematical models, verify:

#### 1.1 Asset Allocation Calculation

**Formula**:
```
cashAssets = totalNetWorth × cashPercent
investmentAssets = totalNetWorth × investmentPercent
otherAssets = totalNetWorth × otherPercent
```

**Questions**:
- ✓ Is this mathematically correct?
- ✓ Does it handle edge cases (negative net worth, percentages not summing to 1.0)?
- ✓ Is rounding handled appropriately?
- ✓ Should there be any additional validation?

#### 1.2 Career-Aware Income Projection

**Formula**:
```
Income(year) = BLS_Wage[occupation][metro] × LevelMultiplier[experience_years] × (1.03)^year

Level Multipliers:
  Junior (0-2 years):    0.7x
  Midlevel (3-5 years):  1.0x
  Senior (6-10 years):   1.3x
  Staff (11-15 years):   1.6x
  Principal (16+ years): 2.0x
```

**Questions**:
- ✓ Are the level multipliers realistic for career progression?
- ✓ Is 3% annual wage growth reasonable (vs inflation, productivity growth)?
- ✓ Should metro adjustments compound with level multipliers or be additive?
- ✓ Are there missing factors (equity compensation, bonuses)?

#### 1.3 Wealth Projection Model

**Formula**:
```
NetWorth(year) = NetWorth(year-1) × (1 + r) + Savings(year)
where:
  r = Investment return rate (default 7% real)
  Savings(year) = Income(year) × SavingsRate
```

**Questions**:
- ✓ Is 7% real return historically accurate and appropriate for default?
- ✓ Should there be differentiation between asset classes (cash vs stocks)?
- ✓ Is compounding frequency correct (annual vs monthly)?
- ✓ Are fees, taxes, or inflation adequately considered?

#### 1.4 Monte Carlo Simulation

**Formula (Geometric Brownian Motion)**:
```
Returns: R(month) = μ_monthly + σ_monthly × Z
where:
  μ_monthly = annualReturn / 12
  σ_monthly = annualVolatility / √12
  Z ~ N(0,1) via Box-Muller transform
```

**Questions**:
- ✓ Is Geometric Brownian Motion appropriate for wealth modeling?
- ✓ Is the Box-Muller implementation correct?
- ✓ Should volatility be time-varying (GARCH model)?
- ✓ Are the default risk profiles (Conservative 5%/10vol, Moderate 7%/15vol, Aggressive 9%/20vol) appropriate?
- ✓ Is 10,000 simulations sufficient for convergence?
- ✓ Are percentile calculations correct (5th, 25th, 50th, 75th, 95th)?

#### 1.5 FIRE Calculations

**Formula (Trinity Study 4% Rule)**:
```
FIRE_Number = Annual_Expenses / 0.04
Years_to_FIRE = Solve: Target = Current(1+r)^n + Savings × [((1+r)^n - 1) / r]
```

**Questions**:
- ✓ Is the 4% Safe Withdrawal Rate still valid (vs modern research suggesting 3-3.5%)?
- ✓ Should there be adjustments for early retirement (pre-60) vs traditional retirement?
- ✓ Is the time-to-FIRE calculation numerically stable?
- ✓ Are sequence-of-returns risks adequately communicated?

#### 1.6 Runway Analysis

**Formula (Month-by-Month Simulation)**:
```
For each month:
  if Cash(m-1) >= MonthlyBurn:
    Cash(m) = Cash(m-1) - MonthlyBurn
    Investments(m) = Investments(m-1) × (1 + r_monthly)
  else:
    withdrawAmount = min(remainingNeed, Investments × WithdrawalRate)
    Cash(m) = 0
    Investments(m) = Investments(m-1) × (1 + r_monthly) - withdrawAmount
```

**Questions**:
- ✓ Is the cash-first, investments-second depletion strategy optimal?
- ✓ Should there be capital gains tax on investment withdrawals?
- ✓ Is geometric compounding correct during drawdown phase?
- ✓ Should there be emergency reserve buffers?

#### 1.7 Geographic Arbitrage

**Formulas**:
```
Adjusted_Expenses = Base_Expenses × (COL_Target / COL_Current)
Adjusted_Income = BLS_Wage[occupation][targetMetro]

Retroactive:
  For past years: AdjustedNW = Σ[IncomeDelta - ExpenseDelta + InvestmentGrowth]

Prospective:
  Future projection with adjusted parameters
```

**Questions**:
- ✓ Are COL indices accurate and up-to-date?
- ✓ Should purchasing power parity be considered for international moves?
- ✓ Are visa restrictions, tax differences, or healthcare costs included?
- ✓ Is the retroactive calculation methodology sound?

#### 1.8 Velocity & Acceleration

**Formulas**:
```
Velocity:      V(t) = (W(t) - W(t-1)) / Δt
Acceleration:  A(t) = (V(t) - V(t-1)) / Δt
Inflection:    A(t*) = 0 and changes sign
```

**Questions**:
- ✓ Is discrete differentiation appropriate (vs smoothed splines)?
- ✓ Should there be noise filtering (moving average, Kalman filter)?
- ✓ Are the interpretations correct (acceleration = growth rate change)?
- ✓ Is this useful for users or academic overkill?

---

### Task 2: Competitive Positioning Analysis

**Review Section 6 of TECHNICAL_SPECIFICATION.md**

Compare Glidepath vs Wealthfront PATH across these dimensions:

#### 2.1 Feature Completeness

**Evaluate**:
- Does Glidepath truly have superior time horizons (10-60 years)?
- Is career progression modeling a meaningful advantage?
- Are Monte Carlo simulations comparable in sophistication?
- Is geographic arbitrage analysis valuable or niche?
- Does velocity/acceleration analysis provide actionable insights?

**Questions**:
- ✓ What features does Wealthfront have that Glidepath lacks?
- ✓ What features does Glidepath have that are genuinely better?
- ✓ Are there table stakes features missing (tax optimization, rebalancing)?
- ✓ Is the privacy-first positioning a real differentiator or a liability?

#### 2.2 User Experience

**Evaluate**:
- Is manual data entry acceptable vs automatic sync?
- Is the unified chart system intuitive (lens concept)?
- Are there too many features (feature bloat)?
- Is the learning curve reasonable for average users?

**Questions**:
- ✓ Would a typical user understand asset allocation sliders?
- ✓ Is the Monte Carlo simulation interface too technical?
- ✓ Are error messages and guidance sufficient?
- ✓ Does the UI prioritize the most important information?

#### 2.3 Market Positioning

**Question**: Who is this product for?

```
Potential Segments:
  A. Privacy-conscious power users (tech workers, finance professionals)
  B. FIRE community members (seeking detailed planning)
  C. Users without linked accounts (international, multiple institutions)
  D. Open-source advocates (transparency seekers)
  E. DIY financial planners (hobbyists)
```

**Questions**:
- ✓ Is the target market large enough to be viable?
- ✓ Does Glidepath serve these segments better than alternatives?
- ✓ What is the monetization strategy (if any)?
- ✓ How does Glidepath compete with free tools (spreadsheets, Mint, YNAB)?

#### 2.4 Competitive Gaps

**Identify Missing Features**:
- Tax modeling (capital gains, income tax brackets, Roth conversions)
- Asset class diversification (beyond cash/investment split)
- Debt management (mortgages, student loans)
- Social Security projections
- Healthcare costs in retirement
- Inheritance or windfall modeling
- Real estate investment analysis
- Side income or business ventures

**Questions**:
- ✓ Which missing features are critical for competitive parity?
- ✓ Which missing features are nice-to-have but not essential?
- ✓ Are there intentional simplifications that improve usability?

---

### Task 3: Legal & Ethical Compliance

**Review Section 3 of TECHNICAL_SPECIFICATION.md**

Verify that all data sources are legally compliant and ethically sourced.

#### 3.1 BLS Wage Data

**Claimed Status**: PUBLIC DOMAIN (17 U.S.C. § 105 - U.S. Government work)

**Verify**:
- ✓ Confirm BLS data is indeed public domain (check: https://www.bls.gov/bls/linksite.htm)
- ✓ Are there any restrictions on commercial use?
- ✓ Is attribution required by law or best practice?
- ✓ Is the data current (check last update date)?
- ✓ Are SOC (Standard Occupational Classification) codes used correctly?

**Questions**:
- ✓ Could BLS change their terms of use?
- ✓ Is there liability if wage estimates are inaccurate?
- ✓ Should there be a disclaimer about data staleness?

#### 3.2 Survey of Consumer Finances (SCF)

**Claimed Status**: PUBLIC DOMAIN (Federal Reserve data release)

**Verify**:
- ✓ Confirm SCF data is freely available (check: https://www.federalreserve.gov/econres/scfindex.htm)
- ✓ Are there any usage restrictions?
- ✓ Is the data anonymized and aggregated?
- ✓ Is citation required?

**Questions**:
- ✓ How often is SCF data updated (triennial)?
- ✓ Is there a lag that makes data stale?
- ✓ Should users be warned that percentiles change over time?

#### 3.3 Cost of Living Indices

**Claimed Status**: AGGREGATED FROM PUBLIC SOURCES (Numbeo, C2ER, BLS CPI)

**Verify**:
- ✓ Are COL indices factual data (not copyrightable)?
- ✓ Is Numbeo data freely usable (check: https://www.numbeo.com/common/api.jsp)?
- ✓ Are there any API rate limits or terms of service violations?
- ✓ Is static snapshot approach legal (vs real-time scraping)?

**Questions**:
- ✓ Should COL sources be cited in the UI?
- ✓ Are international COL indices accurate and unbiased?
- ✓ Is there liability for incorrect COL data affecting user decisions?

#### 3.4 Investment Return Assumptions

**Claimed Status**: PUBLICLY AVAILABLE FINANCIAL DATA (S&P 500 historical, academic research)

**Verify**:
- ✓ Are historical return statistics factual (not copyrightable)?
- ✓ Is academic research (Fama-French) freely citable?
- ✓ Are default assumptions (7% real return, 15% volatility) defensible?

**Questions**:
- ✓ Should there be a disclaimer that past performance doesn't guarantee future results?
- ✓ Are the default assumptions too optimistic (survivorship bias)?
- ✓ Should there be multiple default scenarios (bull/bear markets)?

#### 3.5 FIRE Methodology (Trinity Study)

**Claimed Status**: PUBLISHED ACADEMIC RESEARCH (fair use)

**Verify**:
- ✓ Is the Trinity Study (1998) correctly cited?
- ✓ Is the 4% rule implementation accurate?
- ✓ Are limitations of the study communicated to users?

**Questions**:
- ✓ Has the Trinity Study been updated or refuted by newer research?
- ✓ Should alternative SWR research be referenced (Guyton-Klinger, etc.)?
- ✓ Is there liability for users who run out of money following 4% rule?

#### 3.6 Privacy & Data Handling

**Claimed Status**: 100% client-side, no data collection, no tracking

**Verify**:
- ✓ Is localStorage the only data storage mechanism?
- ✓ Are there any third-party scripts (analytics, ads)?
- ✓ Is there any network traffic besides initial page load?
- ✓ Is the export/import feature truly user-controlled?

**Questions**:
- ✓ Are there GDPR implications even with client-side storage?
- ✓ Should there be a privacy policy or terms of service?
- ✓ What happens if localStorage is cleared (data loss)?
- ✓ Is there a backup/restore mechanism?

#### 3.7 Financial Advice Disclaimer

**Current Disclaimer** (from TECHNICAL_SPECIFICATION.md):
```
⚠️ NOT FINANCIAL ADVICE
This tool is for informational and educational purposes only.
ALL PROJECTIONS ARE ESTIMATES based on historical averages...
```

**Questions**:
- ✓ Is the disclaimer prominent enough in the UI?
- ✓ Should there be additional warnings (liability waiver)?
- ✓ Does the tool cross the line into providing financial advice?
- ✓ Should users be encouraged to consult a CFP (Certified Financial Planner)?

---

### Task 4: UX/Usability Review

**Review Section 5 of TECHNICAL_SPECIFICATION.md**

Evaluate the user experience design and identify issues.

#### 4.1 Onboarding Flow

**Current Flow**: Profile Setup → Asset Allocation → Initial Data Entry

**Questions**:
- ✓ Is the onboarding too complex (3 steps)?
- ✓ Do users understand what "asset allocation" means?
- ✓ Should there be tutorials or tooltips?
- ✓ Is it clear why profile information (age, occupation) is needed?
- ✓ Can users skip optional fields and still get value?

#### 4.2 Main Dashboard Layout

**Current Design**: Unified Chart + Quick Actions + Current Stats + Analysis Tools tabs

**Questions**:
- ✓ Is the information hierarchy clear (what's most important)?
- ✓ Is the unified chart the right primary element (vs summary stats)?
- ✓ Are the "lens" and "layer" concepts intuitive?
- ✓ Is there too much information on one screen (cognitive overload)?
- ✓ Are the tabs well-organized (FIRE, Runway, Tools)?

#### 4.3 Unified Chart Lens System

**Concept**: Single chart with 6 interchangeable lenses (Raw, Velocity, Peer, Projection, FIRE, Deviation)

**Questions**:
- ✓ Is the lens metaphor understandable to average users?
- ✓ Are there too many lenses (should some be combined)?
- ✓ Do users know which lens to use for their goals?
- ✓ Should there be recommended lenses based on context?
- ✓ Is the chart legend clear when multiple layers are active?

#### 4.4 Monte Carlo Simulation Interface

**Current Design**: Risk profile selector + Simulations slider + Time horizon slider + Run button

**Questions**:
- ✓ Do users understand what "10,000 simulations" means?
- ✓ Are the risk profiles (Conservative/Moderate/Aggressive) self-explanatory?
- ✓ Is the wait time (100ms) acceptable or should there be a loading indicator?
- ✓ Are the results (probability bands) explained adequately?
- ✓ Should there be presets (e.g., "Quick 1000 runs" vs "Thorough 50K runs")?

#### 4.5 FIRE Calculator

**Current Design**: Monthly spending inputs + Milestone progress bars + Scenario comparison table

**Questions**:
- ✓ Is the difference between "current spending" and "retirement spending" clear?
- ✓ Are the FIRE levels (Lean/Regular/Fat) well-defined for users?
- ✓ Is the scenario comparison useful or confusing?
- ✓ Should there be more guidance on what's realistic?

#### 4.6 Geographic Arbitrage

**Current Design**: City comparison cards + Retroactive slider + Prospective slider

**Questions**:
- ✓ Is "geographic arbitrage" a term average users understand?
- ✓ Are the retroactive "what if" calculations intuitive?
- ✓ Is the prospective projection differentiated from the main projection?
- ✓ Are international cities appropriately represented?
- ✓ Should there be warnings about oversimplification (visa, taxes, healthcare)?

#### 4.7 Data Entry & Management

**Current Options**: Manual form entry + CSV import

**Questions**:
- ✓ Is manual entry too tedious for long histories?
- ✓ Is CSV import discoverable enough?
- ✓ Are import errors handled gracefully?
- ✓ Should there be a data validation step?
- ✓ Is export/backup prominent enough to prevent data loss?

#### 4.8 Error Handling & Edge Cases

**Scenarios to Consider**:
- User enters negative net worth
- User allocates 200% to cash (invalid percentages)
- User has only 1 data point (insufficient for projections)
- User's age is 90 (retirement already reached)
- User's occupation not found in BLS data
- localStorage quota exceeded

**Questions**:
- ✓ Are error messages clear and actionable?
- ✓ Does the app degrade gracefully (show partial results)?
- ✓ Are validation rules too strict or too lenient?
- ✓ Is there inline validation vs. form submission errors?

---

### Task 5: Risk Assessment

Identify potential issues, vulnerabilities, or areas of concern.

#### 5.1 Mathematical Risks

**Potential Issues**:
- Overflow/underflow in compound growth calculations (very long horizons)
- Division by zero in growth rate calculations (zero net worth)
- Numerical instability in time-to-target solver
- Random number generator quality (JavaScript Math.random() is not cryptographic)
- Monte Carlo convergence (are 10K sims truly sufficient?)

**Questions**:
- ✓ Are there input validation ranges (e.g., max 200% allocation)?
- ✓ Are extreme values handled (e.g., $1T net worth, 150-year horizon)?
- ✓ Should there be sanity checks on outputs (e.g., $1Q projection is obviously wrong)?

#### 5.2 Data Accuracy Risks

**Potential Issues**:
- BLS wage data is outdated (2025 data in 2026)
- SCF percentiles are from 2022 survey (pre-pandemic)
- COL indices are crowd-sourced and may be biased
- Investment return assumptions don't account for changing market regimes
- Career progression multipliers are arbitrary (not research-backed)

**Questions**:
- ✓ How often should data be updated?
- ✓ Should there be data staleness warnings?
- ✓ Are users made aware of data limitations?
- ✓ Should there be multiple data sources for validation?

#### 5.3 User Behavior Risks

**Potential Issues**:
- Users may over-rely on projections and make bad decisions
- Users may not understand probability bands (think median is guaranteed)
- Users may not update data regularly (stale net worth)
- Users may misinterpret "not financial advice" disclaimer
- Users may not diversify (YOLO into single stock, crypto)

**Questions**:
- ✓ Should there be more prominent warnings about limitations?
- ✓ Should users be forced to acknowledge disclaimers?
- ✓ Should the tool refuse to show results for obviously bad inputs?
- ✓ Is there a "sanity check" feature to flag unrealistic projections?

#### 5.4 Technical Risks

**Potential Issues**:
- localStorage can be cleared (data loss)
- Browser compatibility issues (older browsers)
- Performance issues with large datasets (1000+ entries)
- Memory leaks in React components
- Chart rendering bugs with extreme data

**Questions**:
- ✓ Is there automatic backup to cloud (vs manual export)?
- ✓ Are there performance tests for large datasets?
- ✓ Is the app tested on Safari, Firefox, Edge (not just Chrome)?
- ✓ Are there accessibility issues (screen readers, keyboard navigation)?

#### 5.5 Legal/Liability Risks

**Potential Issues**:
- User loses money following tool's projections
- User sues claiming tool provided financial advice
- BLS or Federal Reserve changes data licensing
- EU GDPR enforcement (even with client-side storage)
- Accessibility lawsuits (ADA compliance)

**Questions**:
- ✓ Should there be a terms of service agreement?
- ✓ Should users be required to accept disclaimers before use?
- ✓ Is the MIT open-source license sufficient liability protection?
- ✓ Should there be professional liability insurance?

---

### Task 6: Improvement Recommendations

Based on your review, provide actionable recommendations in these categories:

#### 6.1 Critical Issues (Must Fix Before Launch)

List any mathematical errors, legal violations, or severe UX problems that would prevent launch.

Format:
```
CRITICAL: [Issue Name]
  Problem: [Detailed description]
  Impact: [Why this is critical]
  Solution: [Recommended fix]
  Priority: P0 (blocking)
```

#### 6.2 High-Priority Improvements (Should Fix Soon)

List significant issues that don't block launch but should be addressed quickly.

Format:
```
HIGH: [Issue Name]
  Problem: [Detailed description]
  Impact: [User impact or risk]
  Solution: [Recommended approach]
  Priority: P1 (weeks)
```

#### 6.3 Medium-Priority Enhancements (Nice to Have)

List features or improvements that would enhance competitiveness or usability.

Format:
```
MEDIUM: [Enhancement Name]
  Opportunity: [What could be better]
  Benefit: [User value or competitive advantage]
  Approach: [Implementation suggestion]
  Priority: P2 (months)
```

#### 6.4 Low-Priority Ideas (Future Consideration)

List ideas that are interesting but not essential.

Format:
```
LOW: [Idea Name]
  Description: [What it is]
  Value: [Potential benefit]
  Complexity: [Implementation difficulty]
  Priority: P3 (backlog)
```

---

## Output Format

Please provide your review in the following structure:

```markdown
# Glidepath Comprehensive Review
## Executive Summary

[3-5 paragraph overview of your findings]

Key Findings:
- Mathematical Correctness: [PASS/FAIL with score]
- Competitive Position: [Assessment vs Wealthfront]
- Legal Compliance: [PASS/FAIL with concerns]
- UX/Usability: [Rating and summary]
- Overall Recommendation: [Launch/Don't Launch/Conditional]

---

## Section 1: Mathematical Verification

### 1.1 Asset Allocation Calculation
**Status**: [✅ Verified / ⚠️ Concerns / ❌ Incorrect]
**Findings**: [Detailed analysis]
**Recommendations**: [If any]

### 1.2 Career-Aware Income Projection
[Continue for all 8 models...]

### Summary of Mathematical Issues
- Critical: [Count] issues
- High: [Count] issues
- Medium: [Count] issues

---

## Section 2: Competitive Positioning Analysis

### 2.1 Feature Completeness
**Assessment**: [Better/On Par/Worse than Wealthfront]
**Rationale**: [Detailed explanation]

### 2.2 User Experience
**Assessment**: [Rating 1-10]
**Strengths**: [List]
**Weaknesses**: [List]

### 2.3 Market Positioning
**Target Market**: [Description]
**Market Size**: [Estimate]
**Viability**: [Assessment]

### 2.4 Competitive Gaps
**Missing Features**: [List with criticality]

---

## Section 3: Legal & Ethical Compliance

### 3.1 BLS Wage Data
**Status**: [✅ Compliant / ⚠️ Concerns / ❌ Non-compliant]
**Analysis**: [Verification results]

[Continue for all data sources...]

### Summary of Legal Issues
- Blocking: [Count] issues
- Warning: [Count] issues
- Best Practice: [Count] suggestions

---

## Section 4: UX/Usability Review

### 4.1 Onboarding Flow
**Score**: [1-10]
**Issues**: [List]
**Recommendations**: [Improvements]

[Continue for all UX sections...]

---

## Section 5: Risk Assessment

### 5.1 Mathematical Risks
[List risks with severity: Critical/High/Medium/Low]

### 5.2 Data Accuracy Risks
[List risks...]

### 5.3 User Behavior Risks
[List risks...]

### 5.4 Technical Risks
[List risks...]

### 5.5 Legal/Liability Risks
[List risks...]

---

## Section 6: Improvement Recommendations

### 6.1 Critical Issues (Must Fix)
[List with format specified above]

### 6.2 High-Priority Improvements
[List...]

### 6.3 Medium-Priority Enhancements
[List...]

### 6.4 Low-Priority Ideas
[List...]

---

## Final Recommendation

**Launch Readiness**: [Ready / Not Ready / Conditional]

**Conditions for Launch** (if applicable):
1. [Must fix X]
2. [Must add Y]
3. [Must revise Z]

**Competitive Assessment**:
"Glidepath is [better/worse/comparable] to Wealthfront PATH because..."

**Legal Assessment**:
"The product is [legally compliant/has concerns/requires legal review] because..."

**Overall Score**: [X/100]

**Bottom Line**:
[1-2 paragraph final assessment and recommendation]
```

---

## Additional Instructions

1. **Be Critical**: Don't just validate what's there—actively look for issues, edge cases, and improvements.

2. **Be Specific**: Instead of "the math looks good," explain which formulas you verified and how.

3. **Cite Sources**: If you reference standards, research papers, or regulations, provide citations.

4. **Consider Context**: This is for a tech-savvy, privacy-conscious user base (not mass market retail).

5. **Compare Fairly**: When comparing to Wealthfront, acknowledge their strengths too.

6. **Flag Unknowns**: If you can't verify something (e.g., BLS terms of use), say so explicitly.

7. **Prioritize**: Focus on issues that matter most for launch readiness and legal compliance.

8. **Be Constructive**: Provide solutions, not just criticisms.

---

## Your Expertise

Assume the role of:
- Financial Engineer (PhD-level mathematical modeling)
- Product Manager (competitive analysis, UX evaluation)
- Legal Analyst (data licensing, regulatory compliance)
- Software Architect (code quality, technical risks)

You have deep knowledge of:
- Personal finance planning tools (Wealthfront, Personal Capital, Mint, YNAB)
- Financial mathematics (Monte Carlo, stochastic calculus, optimization)
- U.S. financial regulations (SEC, FINRA, investment advisor rules)
- Data licensing (public domain, fair use, API terms)
- React/TypeScript best practices
- UX design principles

---

## Success Criteria

Your review is successful if it:
1. ✅ Identifies any mathematical errors or questionable assumptions
2. ✅ Provides clear assessment of competitive positioning
3. ✅ Verifies legal compliance or flags concerns
4. ✅ Identifies critical UX issues that would hurt adoption
5. ✅ Provides actionable, prioritized recommendations
6. ✅ Gives clear "launch / don't launch" guidance with rationale

---

## Begin Your Review

Please read **TECHNICAL_SPECIFICATION.md** thoroughly and provide your comprehensive review following the output format above.

If you need clarification on any aspect of the system, include your questions in a "Clarifications Needed" section before your final recommendation.

Good luck! 🚀
