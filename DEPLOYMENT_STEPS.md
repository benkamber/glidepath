# Glidepath Deployment Steps

## Pre-Deployment

### 1. Git Commit ✅ **DO THIS NOW**
```bash
git add -A
git commit -m "Major refactoring: Glidepath transformation

- Transform orange to blue theme (calming aesthetic)
- Remove 3D visualization (45% bundle reduction)
- Remove savings rate assumption (infer from data)
- Add unified chart system with 6 lenses
- Add differential equation analysis (2nd derivatives)
- Enhance geographic arbitrage (time sliders)
- Transform to AI Insights (observational)
- Add transparency throughout (Roast Mode, calculations)

BREAKING CHANGES:
- savingsRate now optional in UserProfile (inferred from data)
- 3D visualization removed
- SmartSuggestions renamed to AIInsights

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

git push
```

### 2. Create Backup Branch (Optional Safety)
```bash
git branch pre-glidepath-backup
git push -u origin pre-glidepath-backup
```

### 3. Run Full Test Suite
```bash
npm test
npm run build
```

### 4. Start Dev Server & Manual Test
```bash
npm run dev
# Then test checklist items in browser
```

---

## Deployment

### Option A: Immediate Deploy
```bash
npm run build
# Deploy dist/ to hosting
```

### Option B: Staged Rollout
1. Deploy to staging environment
2. Test all critical paths
3. Monitor for 24 hours
4. Deploy to production

---

## Post-Deployment Monitoring

### Week 1: Watch for:
- Console errors (check browser devtools)
- User feedback about missing savings rate
- Incorrect inferred savings rates
- Chart rendering issues
- Mobile responsiveness problems

### Quick Fixes Ready:
- If inference fails badly: Add manual override
- If users complain: Add info tooltip explaining inference
- If performance issues: Enable code splitting

---

## Rollback Plan

If major issues found:
```bash
git revert HEAD
npm run build
# Redeploy
```

Or:
```bash
git checkout pre-glidepath-backup
npm run build
# Redeploy
```
