# Unified Screen with Lenses - Implementation Plan

## 🎯 Goal
Transform separate sections (Data Entry, Wealth Trajectory, Wealth Projection) into ONE unified screen with lens-based filtering.

---

## 📐 Current Architecture (BEFORE)

```
NetWorthCalculator Page
├── ProfileSection (collapsible)
├── Data Entry Form (left column)
├── Wealth Trajectory Chart (right column, tabs)
│   ├── Combined view
│   ├── Net Worth only
│   └── Cash only
├── Enhanced Projection (separate section)
│   ├── Scenario selector
│   └── Future projection chart
├── Velocity Chart (separate)
├── Peer Comparison (separate)
└── FIRE Calculator (separate)
```

**Problems:**
- Information scattered across page
- Hard to compare views
- Redundant chart rendering
- Confusing navigation

---

## 🎨 Proposed Architecture (AFTER)

```
NetWorthCalculator Page
├── ProfileSection (collapsible, at top)
├── Data Entry Sidebar (collapsible, left 25%)
│   ├── Manual entry form
│   └── Bulk import (collapsible)
├── Unified Visualization (right 75%)
│   ├── Lens Selector (dropdown/tabs)
│   │   ├── 📊 Raw Data
│   │   ├── 📈 Trajectory (with trendlines)
│   │   ├── 🔮 Projection (future forecast)
│   │   ├── ⚡ Velocity (growth rate)
│   │   ├── 👥 Peer Comparison (percentiles)
│   │   ├── 🎯 FIRE Milestones
│   │   └── 🎲 Monte Carlo (probabilistic)
│   ├── Time Range Filter (1Y, 5Y, 10Y, All)
│   ├── Chart Area (unified)
│   └── Insights Panel (below chart)
```

---

## 🔧 Implementation Strategy

### **Phase 1: Core Infrastructure (3 hours)**

1. **Create UnifiedVisualization component**
   ```typescript
   interface UnifiedVisualizationProps {
     entries: Entry[];
     profile: UserProfile | null;
     activeLens: LensType;
     timeRange: '1Y' | '5Y' | '10Y' | 'All';
     onLensChange: (lens: LensType) => void;
   }

   type LensType =
     | 'raw'           // Raw historical data
     | 'trajectory'    // With trendlines
     | 'projection'    // Future forecast
     | 'velocity'      // Growth rate analysis
     | 'peer'          // Peer comparison
     | 'fire'          // FIRE milestones
     | 'montecarlo';   // Probabilistic
   ```

2. **Create lens registry**
   ```typescript
   const lenses = {
     raw: {
       icon: '📊',
       label: 'Raw Data',
       description: 'Historical net worth points',
       component: RawDataLens,
     },
     trajectory: {
       icon: '📈',
       label: 'Trajectory',
       description: 'Trendlines + regression',
       component: TrajectoryLens,
     },
     // ... etc
   };
   ```

3. **Refactor data flow**
   - All chart data calculated in parent
   - Passed down to active lens
   - Lenses are pure presentation components

---

### **Phase 2: Individual Lenses (6 hours)**

#### **Lens 1: Raw Data 📊**
- Just plot historical points
- No overlays, no predictions
- Simple line chart
- Tooltip shows: Date, Net Worth, Cash

#### **Lens 2: Trajectory 📈**
- Historical points
- Linear regression trendline
- R² value displayed
- Growth angle annotation
- "On pace for $X by [date]" annotation

#### **Lens 3: Projection 🔮**
- Historical points (last 3 months)
- Career-based projection (from profile)
- Monte Carlo bands (P10-P90)
- Scenario selector (Conservative, Current, Optimistic)
- Shows expected trajectory

#### **Lens 4: Velocity ⚡**
- Dual-axis chart
- Top: Net worth (line)
- Bottom: Growth rate (bar chart)
- Color-coded: green = accelerating, red = decelerating
- Shows inflection points

#### **Lens 5: Peer Comparison 👥**
- Historical points
- SCF percentile bands (P10, P25, P50, P75, P90, P95)
- Color gradient for bands
- User's line overlaid on top
- "You're at Xth percentile" annotation

#### **Lens 6: FIRE Milestones 🎯**
- Historical trajectory
- Horizontal lines for FIRE levels
  - Lean FIRE (25x expenses)
  - Regular FIRE (28.5x expenses)
  - Fat FIRE (40x expenses)
- Projected intersection points
- "X years to Regular FIRE" annotation

#### **Lens 7: Monte Carlo 🎲**
- Current net worth
- 15 random trajectories (faint lines)
- P10, P50, P90 bands (colored areas)
- Shows probabilistic outcomes
- VaR/CVaR annotations

---

### **Phase 3: UI/UX (2 hours)**

1. **Lens Selector**
   ```
   ┌─────────────────────────────────────────────┐
   │ [📊 Raw Data ▼]  [1Y 5Y 10Y All]  [Export] │
   ├─────────────────────────────────────────────┤
   │                                             │
   │             CHART AREA                      │
   │                                             │
   └─────────────────────────────────────────────┘
   ```

2. **Collapsible Data Entry Sidebar**
   - Default: Collapsed to icon bar (left edge)
   - Click to expand: Slides out 25% width
   - Contains: Manual entry + Bulk import
   - Keyboard shortcut: `E` to toggle

3. **Responsive Mobile**
   - Stack vertically on mobile
   - Data entry at bottom (expandable sheet)
   - Lens selector as horizontal scrollable tabs
   - Chart full width

---

### **Phase 4: Data Layer Integration (2 hours)**

1. **Unified data preparation**
   ```typescript
   const chartDataContext = {
     historical: sortedEntries,
     trendline: linearRegression(entries),
     projection: projectFutureWealth(...),
     monteCarlo: runMonteCarloSimulation(...),
     percentiles: calculatePercentiles(...),
     velocity: calculateVelocity(...),
     fire: calculateFIRENumbers(...),
   };
   ```

2. **Memoization strategy**
   - Compute all data once in parent
   - Memoize expensive calculations
   - Pass only needed data to active lens
   - Avoid re-calculating on lens switch

---

### **Phase 5: Migration (2 hours)**

1. **Remove old components**
   - Delete separate chart tabs
   - Remove EnhancedProjection (integrate as lens)
   - Remove VelocityChart (integrate as lens)
   - Keep logic, migrate UI to lens system

2. **Update state management**
   - Add `activeLens` state
   - Add `timeRange` state
   - Remove tab state
   - Update URL params for deep linking

3. **Preserve features**
   - All existing functionality maintained
   - Just reorganized under lens system
   - Better UX, same features

---

## 📊 Data Flow Diagram

```
NetWorthCalculator (Parent)
    │
    ├─> Calculate all data
    │   ├─> Historical entries
    │   ├─> Regression trendline
    │   ├─> Projections
    │   ├─> Monte Carlo
    │   ├─> Percentiles
    │   └─> Velocity
    │
    ├─> Pass to UnifiedVisualization
    │       │
    │       ├─> Lens Selector
    │       │   ├─> activeLens state
    │       │   └─> onChange handler
    │       │
    │       └─> Active Lens Component
    │           ├─> Receives only needed data
    │           └─> Renders chart
    │
    └─> Data Entry Sidebar
        ├─> Manual form
        └─> Bulk import
```

---

## 🎯 User Flows

### **Flow 1: First-time user**
1. Lands on page → Sees empty state
2. Profile section expanded (incomplete alert)
3. Completes profile + allocation
4. Data entry sidebar expanded (prompt)
5. Adds first entry
6. Chart shows in Raw Data lens
7. Tooltip suggests: "Try Trajectory lens to see trendline"

### **Flow 2: Returning user adding data**
1. Lands on page → Chart visible with data
2. Data entry sidebar collapsed (icon bar)
3. Clicks data entry icon → Sidebar expands
4. Adds entry → Sidebar auto-collapses
5. Chart updates in current lens

### **Flow 3: Exploring different views**
1. User on Trajectory lens
2. Clicks lens selector → Dropdown shows all lenses
3. Selects "🔮 Projection"
4. Chart smoothly transitions to projection view
5. Context-aware insights update below

---

## 🚀 Benefits

**For Users:**
- ✅ All data in one place
- ✅ Easy to compare different views
- ✅ Less scrolling/navigation
- ✅ Cleaner, more focused UI
- ✅ Faster to understand data

**For Development:**
- ✅ Unified data calculation (DRY)
- ✅ Easier to add new lenses
- ✅ Better memoization (performance)
- ✅ Consistent chart styling
- ✅ Simpler state management

---

## ⚠️ Risks & Mitigation

**Risk 1: Breaking existing features**
- Mitigation: Preserve all logic, only change UI
- Test each lens against old components

**Risk 2: Performance (re-rendering)**
- Mitigation: Aggressive memoization
- Virtualize historical data if needed

**Risk 3: Mobile UX too cramped**
- Mitigation: Design mobile-first
- Use bottom sheet for data entry

**Risk 4: User confusion (new paradigm)**
- Mitigation: Add onboarding tooltips
- Preserve familiar views (trajectory = old default)

---

## 📅 Timeline

| Phase | Task | Duration | Cumulative |
|-------|------|----------|------------|
| 1 | Core infrastructure | 3 hours | 3 hours |
| 2 | Individual lenses | 6 hours | 9 hours |
| 3 | UI/UX | 2 hours | 11 hours |
| 4 | Data integration | 2 hours | 13 hours |
| 5 | Migration | 2 hours | 15 hours |

**Total: ~15 hours**

---

## ✅ Success Criteria

- [ ] All 7 lenses working correctly
- [ ] Data entry sidebar collapsible
- [ ] No features lost from old UI
- [ ] Performance: Chart switches < 100ms
- [ ] Mobile responsive
- [ ] Keyboard shortcuts work
- [ ] URL deep linking to lenses
- [ ] All existing tests pass

---

## 🔄 Rollback Plan

If issues arise:
1. Feature flag: `ENABLE_UNIFIED_SCREEN`
2. Keep old components in codebase
3. Switch between old/new with flag
4. Gives time to fix issues
5. Remove old code after 2 weeks stable

---

## 💡 Future Enhancements (Post-MVP)

- [ ] Custom lens builder (user-defined views)
- [ ] Lens presets (save favorite configurations)
- [ ] Compare mode (two lenses side-by-side)
- [ ] Export lens-specific charts
- [ ] Lens-specific keyboard shortcuts
- [ ] Animation between lens transitions
- [ ] "Smart lens" (AI suggests best lens for data)

---

## 🤔 Open Questions for Review

1. **Default lens:** Should it be Raw Data or Trajectory?
2. **Lens order:** Prioritize which lenses in dropdown?
3. **Data entry placement:** Left sidebar vs bottom sheet vs modal?
4. **Time range:** Should each lens remember its own time range?
5. **Mobile:** Stack lenses as tabs or keep dropdown?

---

**Ready to proceed?** Review this plan and let me know:
- Any changes to the approach?
- Which default lens?
- Priority order for lenses?

Then I'll start implementation while you review! 🚀
