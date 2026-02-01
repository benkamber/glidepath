import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import { SP500_ANNUAL_TOTAL_RETURNS, SP500_SUMMARY } from '@/data/sp500-historical-returns';
import { History } from 'lucide-react';

interface HistoricalBacktestProps {
  currentNetWorth: number;
  annualExpenses: number;
  inflationRate?: number; // default 3%
}

interface BacktestResult {
  startYear: number;
  endingValue: number;
  survived: boolean;
  depletionYear: number | null;
  minValue: number;
  minYear: number;
}

const formatCurrency = (value: number) => {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}k`;
  return `$${value.toFixed(0)}`;
};

function runBacktest(
  startYear: number,
  portfolioValue: number,
  annualWithdrawal: number,
  durationYears: number,
  inflationRate: number,
): BacktestResult {
  const returns = SP500_ANNUAL_TOTAL_RETURNS;
  let balance = portfolioValue;
  let withdrawal = annualWithdrawal;
  let minValue = portfolioValue;
  let minYear = startYear;
  let depletionYear: number | null = null;

  for (let y = 0; y < durationYears; y++) {
    const yearIndex = returns.findIndex(r => r.year === startYear + y);
    if (yearIndex < 0) break; // ran out of data

    // Apply market return
    const annualReturn = returns[yearIndex].return;
    balance = balance * (1 + annualReturn);

    // Withdraw (inflation-adjusted)
    balance -= withdrawal;
    withdrawal *= (1 + inflationRate);

    if (balance < minValue && balance > 0) {
      minValue = balance;
      minYear = startYear + y + 1;
    }

    if (balance <= 0) {
      depletionYear = startYear + y + 1;
      balance = 0;
      break;
    }
  }

  return {
    startYear,
    endingValue: Math.max(0, balance),
    survived: balance > 0,
    depletionYear,
    minValue: Math.max(0, minValue),
    minYear,
  };
}

export function HistoricalBacktest({
  currentNetWorth,
  annualExpenses,
  inflationRate = 0.03,
}: HistoricalBacktestProps) {
  const [durationYears, setDurationYears] = useState(30);

  const results = useMemo(() => {
    const lastDataYear = SP500_SUMMARY.endYear;
    const firstStartYear = SP500_SUMMARY.startYear;
    // Can only test years where we have enough data for the full duration
    const lastStartYear = lastDataYear - durationYears + 1;

    const backtests: BacktestResult[] = [];
    for (let y = firstStartYear; y <= lastStartYear; y++) {
      backtests.push(
        runBacktest(y, currentNetWorth, annualExpenses, durationYears, inflationRate),
      );
    }
    return backtests;
  }, [currentNetWorth, annualExpenses, durationYears, inflationRate]);

  const stats = useMemo(() => {
    const total = results.length;
    const survived = results.filter(r => r.survived).length;
    const survivalRate = total > 0 ? (survived / total) * 100 : 0;

    const sorted = [...results].sort((a, b) => a.endingValue - b.endingValue);
    const worst = sorted[0];
    const best = sorted[sorted.length - 1];
    const median = sorted[Math.floor(sorted.length / 2)];

    // Find the worst starting year cluster (the famous 1966 problem)
    const failed = results.filter(r => !r.survived);
    const worstCluster = failed.length > 0
      ? `${failed[0].startYear}-${failed[failed.length - 1].startYear}`
      : null;

    return { total, survived, survivalRate, worst, best, median, worstCluster, failed };
  }, [results]);

  const chartData = useMemo(() => {
    return results.map(r => ({
      startYear: r.startYear,
      endingValue: r.endingValue,
      survived: r.survived,
    }));
  }, [results]);

  const swrImplied = currentNetWorth > 0 ? (annualExpenses / currentNetWorth) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="h-5 w-5" />
          Historical Backtesting
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Tests your portfolio against every historical {durationYears}-year period since {SP500_SUMMARY.startYear}.
          Uses actual S&P 500 returns with inflation-adjusted withdrawals.
        </p>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Retirement duration</Label>
            <span className="text-sm font-mono font-semibold">{durationYears} years</span>
          </div>
          <Slider
            value={[durationYears]}
            onValueChange={(v) => setDurationYears(v[0])}
            min={10}
            max={50}
            step={5}
          />
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className={`p-3 rounded-lg text-center ${
            stats.survivalRate >= 95 ? 'bg-emerald-500/10 border border-emerald-500/30' :
            stats.survivalRate >= 80 ? 'bg-amber-500/10 border border-amber-500/30' :
            'bg-red-500/10 border border-red-500/30'
          }`}>
            <p className="text-xs text-muted-foreground">Survival Rate</p>
            <p className="text-xl font-bold">{stats.survivalRate.toFixed(0)}%</p>
            <p className="text-[10px] text-muted-foreground">
              {stats.survived}/{stats.total} periods
            </p>
          </div>
          <div className="p-3 rounded-lg text-center bg-muted/50">
            <p className="text-xs text-muted-foreground">Implied SWR</p>
            <p className="text-xl font-bold">{swrImplied.toFixed(1)}%</p>
            <p className="text-[10px] text-muted-foreground">
              {formatCurrency(annualExpenses)}/yr
            </p>
          </div>
          <div className="p-3 rounded-lg text-center bg-muted/50">
            <p className="text-xs text-muted-foreground">Worst Start</p>
            <p className="text-xl font-bold">{stats.worst?.startYear || '-'}</p>
            <p className="text-[10px] text-muted-foreground">
              {stats.worst ? (stats.worst.survived ? formatCurrency(stats.worst.endingValue) : 'Depleted') : '-'}
            </p>
          </div>
          <div className="p-3 rounded-lg text-center bg-muted/50">
            <p className="text-xs text-muted-foreground">Best Start</p>
            <p className="text-xl font-bold">{stats.best?.startYear || '-'}</p>
            <p className="text-[10px] text-muted-foreground">
              {stats.best ? formatCurrency(stats.best.endingValue) : '-'}
            </p>
          </div>
        </div>

        {stats.failed.length > 0 && (
          <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
            <p className="text-sm">
              <strong>Failed periods:</strong> Starting in{' '}
              {stats.failed.length <= 5
                ? stats.failed.map(f => f.startYear).join(', ')
                : `${stats.worstCluster} (${stats.failed.length} periods)`
              }.
              {stats.failed[0]?.depletionYear && (
                <> Earliest depletion: year {stats.failed[0].depletionYear} ({stats.failed[0].depletionYear - stats.failed[0].startYear} years in).</>
              )}
            </p>
          </div>
        )}

        {/* Chart: ending value by start year */}
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="startYear"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={formatCurrency}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
                formatter={(value: number) => [formatCurrency(value), 'Ending value']}
                labelFormatter={(v) => `Retired in ${v}`}
              />
              <ReferenceLine
                y={currentNetWorth}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="3 3"
                label={{
                  value: 'Starting value',
                  position: 'right',
                  fontSize: 10,
                  fill: 'hsl(var(--muted-foreground))',
                }}
              />
              <Bar dataKey="endingValue" name="Ending portfolio">
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.survived ? '#10b981' : '#ef4444'}
                    fillOpacity={0.7}
                  />
                ))}
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Median outcome */}
        {stats.median && (
          <p className="text-sm text-muted-foreground">
            <strong>Median outcome:</strong> Starting in {stats.median.startYear},{' '}
            portfolio ended at {formatCurrency(stats.median.endingValue)} after {durationYears} years.
          </p>
        )}

        <p className="text-xs text-muted-foreground">
          Data: S&P 500 total returns {SP500_SUMMARY.startYear}-{SP500_SUMMARY.endYear} (Ibbotson/Morningstar SBBI).
          Nominal returns with {(inflationRate * 100).toFixed(0)}% annual inflation applied to withdrawals.
          Does not account for taxes, fees, or portfolio rebalancing.
        </p>
      </CardContent>
    </Card>
  );
}
