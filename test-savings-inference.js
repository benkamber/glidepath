// Quick test for savings rate inference
// Run with: node test-savings-inference.js

function inferSavingsRate(entries, estimatedAnnualIncome, annualReturn = 0.07) {
  if (entries.length < 2 || estimatedAnnualIncome === 0) {
    return 0.25; // Default conservative estimate: 25%
  }

  const firstDate = new Date(entries[0].date);
  const lastDate = new Date(entries[entries.length - 1].date);
  const yearsElapsed = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

  if (yearsElapsed === 0) return 0.25;

  const startingWealth = entries[0].totalNetWorth;
  const endingWealth = entries[entries.length - 1].totalNetWorth;
  const actualGrowth = endingWealth - startingWealth;

  const estimatedInvestmentGrowth = startingWealth * (Math.pow(1 + annualReturn, yearsElapsed) - 1);
  const growthFromSavings = actualGrowth - estimatedInvestmentGrowth;
  const totalIncome = estimatedAnnualIncome * yearsElapsed;
  const inferredRate = growthFromSavings / totalIncome;

  if (inferredRate < 0 || inferredRate > 0.9 || isNaN(inferredRate)) {
    return 0.25;
  }

  return inferredRate;
}

// Test cases
console.log('=== Savings Rate Inference Tests ===\n');

// Test 1: Typical case
const test1 = [
  { date: '2020-01-01', totalNetWorth: 100000 },
  { date: '2021-01-01', totalNetWorth: 130000 },
  { date: '2022-01-01', totalNetWorth: 165000 },
  { date: '2023-01-01', totalNetWorth: 205000 },
];
const result1 = inferSavingsRate(test1, 150000);
console.log('Test 1 - Typical growth:');
console.log(`  Income: $150K/yr`);
console.log(`  Growth: $100K → $205K over 3 years`);
console.log(`  Inferred rate: ${(result1 * 100).toFixed(1)}%`);
console.log(`  Expected: ~25-35%\n`);

// Test 2: High saver
const test2 = [
  { date: '2020-01-01', totalNetWorth: 50000 },
  { date: '2023-01-01', totalNetWorth: 200000 },
];
const result2 = inferSavingsRate(test2, 200000);
console.log('Test 2 - High saver:');
console.log(`  Income: $200K/yr`);
console.log(`  Growth: $50K → $200K over 3 years`);
console.log(`  Inferred rate: ${(result2 * 100).toFixed(1)}%`);
console.log(`  Expected: ~22%\n`);

// Test 3: Negative growth (market crash)
const test3 = [
  { date: '2020-01-01', totalNetWorth: 200000 },
  { date: '2021-01-01', totalNetWorth: 180000 },
];
const result3 = inferSavingsRate(test3, 150000);
console.log('Test 3 - Negative growth:');
console.log(`  Income: $150K/yr`);
console.log(`  Growth: $200K → $180K`);
console.log(`  Inferred rate: ${(result3 * 100).toFixed(1)}%`);
console.log(`  Expected: 25% (default fallback)\n`);

// Test 4: Insufficient data
const test4 = [
  { date: '2023-01-01', totalNetWorth: 100000 },
];
const result4 = inferSavingsRate(test4, 150000);
console.log('Test 4 - Insufficient data:');
console.log(`  Only 1 entry`);
console.log(`  Inferred rate: ${(result4 * 100).toFixed(1)}%`);
console.log(`  Expected: 25% (default)\n`);

console.log('=== All Tests Complete ===');
