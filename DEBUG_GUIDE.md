# Debug Mode User Guide

## How to Enable

```javascript
// In browser console (F12 or Cmd+Option+I)
localStorage.setItem('debug', 'true')
// Then refresh the page
```

Or add `?debug=true` to URL: `http://localhost:5000?debug=true`

## What You'll See

### 1. Visual Debug Panel (Bottom-Right Corner)

```
┌─────────────────────────────┐
│ 🐛 Debug Panel             │
├─────────────────────────────┤
│ Total Entries: 750          │
│ Date Range: 2007-11-01 to   │
│             2026-01-28      │
│                             │
│ Latest Entry ✓              │
│ Date: 2026-01-28           │
│ Net Worth: $4,622,092      │ ← Should match your data
│ Cash: $3,568,270           │
└─────────────────────────────┘
```

### 2. Console Checkpoints (Key Indicator)

The checkpoints show a **hash** at each stage:
```
Format: "count|lastDate|lastNetWorth"
```

**Example Output:**
```javascript
[CHECKPOINT] STAGE_1: After Parse & Sort
750|2026-01-28|$4,622,092.00
  📊 Count: 750 | Range: 2007-11-01 → 2026-01-28

[CHECKPOINT] STAGE_1B: After Import to State
750|2026-01-28|$4,622,092.00
  📊 Count: 750 | Range: 2007-11-01 → 2026-01-28

[CHECKPOINT] STAGE_2: After Storage Load
750|2026-01-28|$4,622,092.00
  📊 Count: 750 | Range: 2007-11-01 → 2026-01-28

[CHECKPOINT] STAGE_3: After Sort
750|2026-01-28|$4,622,092.00
  📊 Count: 750 | Range: 2007-11-01 → 2026-01-28

[CHECKPOINT] STAGE_4: Before Chart Render
750|2026-01-28|$4,622,092.00
  📊 Count: 750 | Range: 2007-11-01 → 2026-01-28
```

**✅ ALL CHECKSUMS MATCH** = Data is preserved correctly!

---

## 🔴 Spotting Issues

### Issue A: Count Changes
```javascript
[CHECKPOINT] STAGE_1: After Parse & Sort
750|2026-01-28|$4,622,092.00

[CHECKPOINT] STAGE_2: After Storage Load
650|2020-12-31|$650,000.00  ← COUNT DROPPED! 100 entries lost!
```
**Diagnosis:** localStorage size limit or storage corruption

---

### Issue B: Date Changes (Century Bug)
```javascript
[CHECKPOINT] STAGE_1: After Parse & Sort
750|2026-01-28|$4,622,092.00  ← Looks good

[CHECKPOINT] STAGE_3: After Sort
750|2020-12-31|$650,000.00  ← Date changed! Sort reordered!
```
**Diagnosis:** Dates parsed as 1920s, so they sort BEFORE 2020 entries.
**Root Cause:** `new Date("1/28/26")` → 1926 instead of 2026

---

### Issue C: Value Changes (Calculation Bug)
```javascript
[CHECKPOINT] STAGE_1: After Parse & Sort
750|2026-01-28|$4,622,092.00

[CHECKPOINT] STAGE_3: After Sort
750|2026-01-28|$4,622.09  ← VALUE CHANGED! Off by 1000x!
```
**Diagnosis:** Currency parsing removed too many digits

---

### Issue D: Chart Stops at 2020
```javascript
[CHECKPOINT] STAGE_3: After Sort
750|2026-01-28|$4,622,092.00  ← Data includes 2026

[CHECKPOINT] STAGE_4: Before Chart Render
450|2020-12-31|$943,071.00  ← FILTERED OUT 2021-2026!
```
**Diagnosis:** Chart time range filter cutting off recent years

---

## 🎯 Most Likely Culprits

Based on symptoms ($4.6M → $650K, chart stops at 2020):

### 1. Date Century Bug (MOST LIKELY)
```javascript
// BAD: Browser interprets as 1926
new Date("1/28/26") → Sat Jan 28 1926

// Your 2021-2026 entries sort BEFORE 2020:
// 1926, 1925, 1924... < 2020 < 2019 < 2018

// So entries[entries.length-1] = last entry = 2020-12-31
```

**Fix:** Explicitly parse with 4-digit year

### 2. Sort Direction Reversed
```javascript
// If accidentally sorting descending:
.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
//                          ^ b before a = descending!

// Then latest entry is actually FIRST entry (oldest)
```

**Fix:** Ensure ascending sort (a before b)

### 3. Chart Year Filter
```javascript
// Hardcoded filter leftover from testing:
entries.filter(e => new Date(e.date).getFullYear() <= 2020)
```

**Fix:** Remove or update filter

---

## 📋 Interpreting Your Output

1. **Import your 750 rows**
2. **Check debug panel:**
   - Does it show 750 entries?
   - Does it show 2026-01-28 as latest date?
   - Does it show $4,622,092 as latest net worth?

3. **Check console checkpoints:**
   - Do all stages show same hash?
   - Where does the hash first change?

4. **Copy console output and share:**
   - The checkpoint where hash changes = bug location
   - Detailed logs below checkpoint = bug details

---

## 🚨 Quick Diagnosis Tree

```
Is debug panel showing correct values ($4.66M)?
│
├─ YES → Bug is in UI display only
│         Check how latestEntry is formatted
│
└─ NO → Check console checkpoints:
         │
         ├─ All stages show $4.66M → Calculation after data load
         │                            Check wealth model formulas
         │
         ├─ STAGE_3 changes value → Sort bug or date parsing bug
         │                           Check date parse logic
         │
         ├─ STAGE_2 changes value → Storage corruption
         │                           Check localStorage limits
         │
         └─ STAGE_1 wrong → Parse bug
                             Check currency/date parsing
```

---

## Example: Finding the Bug

**Your console output:**
```javascript
[CHECKPOINT] STAGE_1: After Parse & Sort
750|2026-01-28|$4,622,092.00

[CHECKPOINT] STAGE_3: After Sort
750|1926-01-28|$4,622,092.00  ← DATE YEAR CHANGED!
```

**Analysis:**
- Count same (750) ✓
- Value same ($4.6M) ✓
- Date year changed: 2026 → 1926 ❌

**Conclusion:** Date parsing bug treating "26" as 1926

**Solution:** Fix date parser to use 2000+ for 2-digit years

---

## Disable Debug Mode

```javascript
localStorage.setItem('debug', 'false')
// Then refresh
```
