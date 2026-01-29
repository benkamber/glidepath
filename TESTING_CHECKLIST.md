# Glidepath Testing Checklist

## Phase 1: Colors & Branding ✅
- [ ] All UI elements show blue theme (not orange)
- [ ] App title shows "GLIDEPATH"
- [ ] Meta tags updated (check page title in browser tab)
- [ ] Terminal glow effects are blue

## Phase 2: Savings Rate Removal ⚠️ **HIGH PRIORITY**
- [ ] Profile section does NOT show savings rate slider
- [ ] New profile creation works without savings rate
- [ ] Old profiles with savingsRate load correctly
- [ ] COLComparison shows reasonable savings estimates
- [ ] Roast Mode calculates without errors
- [ ] EnhancedProjection works with inferred rate
- [ ] With 0 entries: defaults to 25%
- [ ] With 1 entry: defaults to 25%
- [ ] With 2+ entries: calculates from data
- [ ] Negative growth: falls back to 25%
- [ ] Extreme values: clamped to 0-90%

## Phase 3: Unified Chart System ✅
- [ ] Chart appears on main page
- [ ] Time range filters work (1Y, 5Y, 10Y, All)
- [ ] Data layer toggles work (Net Worth, Cash, Investment)
- [ ] Lens selector has 6 options
- [ ] Each lens displays correctly:
  - [ ] Raw Data (baseline)
  - [ ] Velocity Analysis
  - [ ] Peer Comparison (percentile bands)
  - [ ] Future Projection
  - [ ] FIRE Analysis (milestone lines)
  - [ ] Deviation Alerts
- [ ] Export button present
- [ ] Chart responsive on mobile

## Phase 4: 3D Removal ✅
- [ ] No 3D tab in Advanced Analysis Tools
- [ ] Page loads faster
- [ ] No three.js errors in console
- [ ] Bundle size reduced (check Network tab)

## Phase 5: Projection Debugging ✅
- [ ] "Show expected trajectory" checkbox works
- [ ] Info tooltip appears on hover
- [ ] Empty state shows: "No projection data available"
- [ ] Chart renders with profile data

## Phase 6: AI Insights ✅
- [ ] "AI Insights" card appears (not "Smart Suggestions")
- [ ] Insights grouped by type (Patterns, Trends, Anomalies, Milestones)
- [ ] No action buttons (observational only)
- [ ] Expandable sections work
- [ ] With <4 entries: shows "add more data" message

## Phase 7: Differential Equations ✅
- [ ] VelocityChart has acceleration toggle
- [ ] "Show Acceleration" checkbox works
- [ ] Acceleration line appears (dashed blue)
- [ ] Dual Y-axes visible
- [ ] Inflection points marked (yellow/blue dots)
- [ ] "Second-Order Analysis" panel shows
- [ ] Summary stats show 4 metrics
- [ ] Trend shows: accelerating/decelerating/stable

## Phase 8: Geographic Arbitrage ✅
- [ ] Metro cards are expandable
- [ ] Historical "what-if" slider works (1-10 years)
- [ ] Shows adjusted net worth calculation
- [ ] Future projection slider works (5-20 years)
- [ ] Shows FIRE date difference
- [ ] "Show Math" expands with formulas
- [ ] All calculations display correctly

## Phase 9: Roast Mode Transparency ✅
- [ ] "How We Predicted $X" section expands
- [ ] Year-by-year calculation shown
- [ ] Assumptions section displays
- [ ] Limitations section displays
- [ ] All BLS data sources listed

## Phase 10: Dropdown Fix ✅
- [ ] Disabled dropdowns visible (not transparent)
- [ ] Career level dropdown with auto-detect works

---

## Edge Cases to Test

### Data States:
- [ ] No entries (empty state)
- [ ] 1 entry (minimal data)
- [ ] 2-3 entries (early inference)
- [ ] 10+ entries (full analysis)
- [ ] Entries with gaps in dates
- [ ] Negative net worth
- [ ] Zero net worth
- [ ] Very large values ($10M+)

### Profile States:
- [ ] No profile (prompts creation)
- [ ] Incomplete profile
- [ ] Profile with old savingsRate field
- [ ] Profile migration from old version

### Browser/Device:
- [ ] Desktop Chrome
- [ ] Desktop Firefox
- [ ] Desktop Safari
- [ ] Mobile Chrome
- [ ] Mobile Safari
- [ ] Tablet view

---

## Known Limitations

1. **Savings Rate Inference:**
   - Requires 2+ entries for calculation
   - Assumes 7% investment returns
   - Cannot account for one-time events (inheritance, windfall)
   - May be inaccurate with volatile markets

2. **Unified Chart:**
   - Peer comparison lens needs actual SCF data integration
   - Projection lens simplified (not full Monte Carlo)

3. **Performance:**
   - Bundle still >500KB (acceptable but could be optimized further)
   - No code splitting yet

---

## Post-Launch Monitoring

After deployment, monitor for:
- [ ] Console errors
- [ ] User complaints about missing savings rate
- [ ] Incorrect savings rate inference
- [ ] Chart rendering issues
- [ ] Mobile layout problems
