import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { LogarithmicSliderInput } from '@/components/ui/logarithmic-slider-input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Plane, TrendingDown, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import {
  simulateRunway,
  inferMonthlyBurn,
  calculateBreakEvenIncome,
  type RunwayParams,
  type RunwayResult,
} from '@/lib/runway-simulator';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
} from 'recharts';

interface RunwayAnalysisProps {
  currentNetWorth: number;
  cashBalance: number;
  investmentBalance: number;
  historicalEntries?: Array<{ date: string; totalNetWorth: number; cash: number }>;
}

export function RunwayAnalysis({
  currentNetWorth,
  cashBalance,
  investmentBalance,
  historicalEntries = [],
}: RunwayAnalysisProps) {
  // Infer monthly burn from historical data if available
  const inferredBurn = useMemo(() => {
    if (historicalEntries.length >= 2) {
      return inferMonthlyBurn(historicalEntries, 0.07);
    }
    return 0;
  }, [historicalEntries]);

  // User inputs
  const [monthlyBurn, setMonthlyBurn] = useState(inferredBurn > 0 ? Math.round(inferredBurn) : 5000);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [annualReturnRate, setAnnualReturnRate] = useState(7);
  const [taxRate, setTaxRate] = useState(20);
  const [inflationRate, setInflationRate] = useState(3);
  const [timeHorizon, setTimeHorizon] = useState(25); // years

  // Run simulation
  const runwayResult: RunwayResult = useMemo(() => {
    const params: RunwayParams = {
      liquidAssets: cashBalance,
      investedAssets: investmentBalance,
      monthlyIncome,
      monthlyBurn,
      annualReturnRate: annualReturnRate / 100,
      maxMonths: timeHorizon * 12,
      taxRate: taxRate / 100,
      annualInflationRate: inflationRate / 100,
    };

    return simulateRunway(params);
  }, [cashBalance, investmentBalance, monthlyIncome, monthlyBurn, annualReturnRate, taxRate, inflationRate, timeHorizon]);

  const breakEvenIncome = calculateBreakEvenIncome(monthlyBurn, currentNetWorth, 0.04);

  // Format chart data
  const chartData = useMemo(() => {
    // Sample every N months for performance (show ~200 points max)
    const sampleRate = Math.max(1, Math.floor(runwayResult.monthlySnapshots.length / 200));

    return runwayResult.monthlySnapshots
      .filter((_, idx) => idx % sampleRate === 0 || idx === runwayResult.monthlySnapshots.length - 1)
      .map((snapshot) => ({
        year: (snapshot.month / 12).toFixed(1),
        liquid: Math.round(snapshot.liquidBalance),
        invested: Math.round(snapshot.investedBalance),
        total: Math.round(snapshot.totalBalance),
        swr: (snapshot.effectiveSWR * 100).toFixed(2),
      }));
  }, [runwayResult]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sustainable': return 'text-green-600 dark:text-green-400';
      case 'depleting': return 'text-yellow-600 dark:text-yellow-400';
      case 'unaffordable': return 'text-red-600 dark:text-red-400';
      default: return '';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sustainable': return <CheckCircle className="h-5 w-5" />;
      case 'depleting': return <AlertTriangle className="h-5 w-5" />;
      case 'unaffordable': return <TrendingDown className="h-5 w-5" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Plane className="h-6 w-6" />
            💸 Financial Runway Analysis
          </CardTitle>
          <CardDescription className="text-base">
            How long can you sustain your lifestyle on current savings? Perfect for sabbaticals, career breaks, or extended travel.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Current Status Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Liquid Assets</p>
              <p className="text-2xl font-bold">{formatCurrency(cashBalance)}</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Invested Assets</p>
              <p className="text-2xl font-bold">{formatCurrency(investmentBalance)}</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Net Worth</p>
              <p className="text-2xl font-bold">{formatCurrency(currentNetWorth)}</p>
            </div>
          </div>

          {/* Inputs */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold text-lg">Your Scenario</h3>

            {/* Monthly Burn */}
            <div className="space-y-2">
              {inferredBurn > 0 && (
                <Badge variant="secondary" className="text-xs mb-2">
                  Inferred from history: {formatCurrency(inferredBurn)}
                </Badge>
              )}
              <LogarithmicSliderInput
                id="monthlyBurn"
                label="Monthly Spending"
                icon="💳"
                value={monthlyBurn}
                onChange={(value) => setMonthlyBurn(value || 0)}
                min={500}
                max={100000}
                placeholder="e.g., 5,000"
                description="All monthly expenses: rent, food, travel, entertainment, etc."
              />
            </div>

            {/* Monthly Income */}
            <LogarithmicSliderInput
              id="monthlyIncome"
              label="Ongoing Monthly Income (Optional)"
              icon="💰"
              value={monthlyIncome || undefined}
              onChange={(value) => setMonthlyIncome(value || 0)}
              min={100}
              max={500000}
              placeholder="e.g., 2,000"
              description="Passive income, part-time work, freelancing, dividends, etc. Leave 0 if taking a complete break."
            />

            {/* Annual Return Rate */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>📈 Expected Annual Return</Label>
                <span className="text-sm font-medium">{annualReturnRate}%</span>
              </div>
              <Slider
                min={0}
                max={15}
                step={0.5}
                value={[annualReturnRate]}
                onValueChange={([value]) => setAnnualReturnRate(value)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Conservative: 5-6% | Moderate: 7-8% | Aggressive: 9-10% (S&P 500 historical: ~10%)
              </p>
            </div>

            {/* Tax Rate */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>🧾 Capital Gains Tax Rate</Label>
                <span className="text-sm font-medium">{taxRate}%</span>
              </div>
              <Slider
                min={0}
                max={40}
                step={1}
                value={[taxRate]}
                onValueChange={([value]) => setTaxRate(value)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                US Long-term: 0-20% | Short-term: income tax rate
              </p>
            </div>

            {/* Inflation Rate */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>📊 Annual Inflation Rate</Label>
                <span className="text-sm font-medium">{inflationRate}%</span>
              </div>
              <Slider
                min={0}
                max={10}
                step={0.5}
                value={[inflationRate]}
                onValueChange={([value]) => setInflationRate(value)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                US Historical: ~3% | High inflation: 5-8%
              </p>
            </div>

            {/* Time Horizon */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>⏰ Simulation Time Horizon</Label>
                <span className="text-sm font-medium">{timeHorizon} years</span>
              </div>
              <Slider
                min={1}
                max={50}
                step={1}
                value={[timeHorizon]}
                onValueChange={([value]) => setTimeHorizon(value)}
                className="w-full"
              />
            </div>
          </div>

          {/* Results */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold text-lg">Runway Results</h3>

            {/* Status Badge */}
            <div className={`flex items-center gap-3 p-4 rounded-lg border-2 ${
              runwayResult.sustainabilityStatus === 'sustainable' ? 'border-green-500/50 bg-green-500/5' :
              runwayResult.sustainabilityStatus === 'depleting' ? 'border-yellow-500/50 bg-yellow-500/5' :
              'border-red-500/50 bg-red-500/5'
            }`}>
              {getStatusIcon(runwayResult.sustainabilityStatus)}
              <div className="flex-1">
                <p className={`font-semibold text-lg ${getStatusColor(runwayResult.sustainabilityStatus)}`}>
                  {runwayResult.sustainabilityStatus === 'sustainable' && 'Sustainable Indefinitely'}
                  {runwayResult.sustainabilityStatus === 'depleting' && `Runway: ${(runwayResult.totalMonths / 12).toFixed(1)} Years`}
                  {runwayResult.sustainabilityStatus === 'unaffordable' && `Depletion in ${(runwayResult.totalMonths / 12).toFixed(1)} Years`}
                </p>
                <p className="text-sm text-muted-foreground">
                  Safe Withdrawal Rate: {(runwayResult.effectiveSWR * 100).toFixed(2)}%
                  {runwayResult.effectiveSWR <= 0.04 ? ' (Safe - 4% rule)' :
                   runwayResult.effectiveSWR <= 0.06 ? ' (Moderate risk)' :
                   ' (High risk)'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{runwayResult.totalMonths} months</p>
                <p className="text-sm text-muted-foreground">
                  Final: {formatCurrency(runwayResult.finalBalance)}
                </p>
              </div>
            </div>

            {/* Guardrails */}
            {(runwayResult.guardrails.liquidityWarning ||
              runwayResult.guardrails.swrWarning ||
              runwayResult.guardrails.depletionRisk) && (
              <div className="space-y-2">
                {runwayResult.guardrails.liquidityWarning && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Low Liquidity:</strong> Current liquid assets are below 6 months of spending.
                      Consider keeping more in cash for emergencies.
                    </AlertDescription>
                  </Alert>
                )}

                {runwayResult.guardrails.swrWarning && (
                  <Alert className="border-yellow-500/50 bg-yellow-500/5">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <AlertDescription>
                      <strong>High Withdrawal Rate:</strong> Your effective SWR exceeds 4%.
                      The "4% rule" suggests this may not be sustainable long-term.
                    </AlertDescription>
                  </Alert>
                )}

                {runwayResult.guardrails.depletionRisk && runwayResult.guardrails.yearsUntilDepletion && (
                  <Alert variant="destructive">
                    <TrendingDown className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Depletion Risk:</strong> Assets will be exhausted in {runwayResult.guardrails.yearsUntilDepletion.toFixed(1)} years.
                      {breakEvenIncome > 0 && (
                        <> You need {formatCurrency(breakEvenIncome)}/month in income to sustain indefinitely.</>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Break-even Analysis */}
            {breakEvenIncome > 0 && (
              <div className="p-4 bg-blue-500/5 border border-blue-500/50 rounded-lg">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="font-semibold">Break-Even Income</p>
                    <p className="text-sm text-muted-foreground">
                      To sustain your {formatCurrency(monthlyBurn)}/month lifestyle indefinitely (4% SWR),
                      you need <strong>{formatCurrency(breakEvenIncome)}/month</strong> in ongoing income.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Glidepath Visualization */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold text-lg">💎 Wealth Glidepath</h3>

            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="year"
                  label={{ value: 'Years from Now', position: 'insideBottom', offset: -5 }}
                  className="text-xs"
                />
                <YAxis
                  label={{ value: 'Assets ($)', angle: -90, position: 'insideLeft' }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                  className="text-xs"
                />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === 'swr') return `${value}%`;
                    return formatCurrency(value);
                  }}
                  labelFormatter={(label) => `Year ${label}`}
                />
                <Legend />

                <Area
                  type="monotone"
                  dataKey="invested"
                  stackId="1"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.6}
                  name="Invested Assets"
                />
                <Area
                  type="monotone"
                  dataKey="liquid"
                  stackId="1"
                  stroke="hsl(142 76% 36%)"
                  fill="hsl(142 76% 36%)"
                  fillOpacity={0.6}
                  name="Liquid Assets"
                />

                {/* Zero line */}
                <ReferenceLine y={0} stroke="hsl(var(--destructive))" strokeDasharray="3 3" />
              </ComposedChart>
            </ResponsiveContainer>

            <p className="text-xs text-muted-foreground text-center">
              Chart shows your assets declining over time as you spend.
              Invested assets (blue) generate returns while liquid assets (green) are drawn first.
            </p>
          </div>

          {/* Detailed Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Avg Monthly Burn</p>
              <p className="text-lg font-semibold">{formatCurrency(runwayResult.averageMonthlyBurn)}</p>
              <p className="text-xs text-muted-foreground mt-1">Inflation-adjusted</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Total Investment Gains</p>
              <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                +{formatCurrency(runwayResult.totalInvestmentGains)}
              </p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Total Taxes Paid</p>
              <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                -{formatCurrency(runwayResult.totalTaxesPaid)}
              </p>
            </div>
          </div>

          {/* Methodology */}
          <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
            <p><strong>How This Works:</strong></p>
            <ul className="ml-4 space-y-1">
              <li>• Month-by-month simulation with geometric compounding</li>
              <li>• Investment returns calculated before withdrawals each month</li>
              <li>• Deficits drawn from liquid assets first, then investments (realizing capital gains)</li>
              <li>• Surplus reinvested after maintaining 12-month emergency fund</li>
              <li>• Inflation applied to monthly burn rate over time</li>
              <li>• Safe Withdrawal Rate (SWR) based on Trinity Study principles</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
