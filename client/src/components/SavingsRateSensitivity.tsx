import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot,
} from 'recharts';
import { calculateYearsToFIRE, calculateFIRENumber, getFIRELevel } from '@/lib/fire-calculations';
import { TrendingUp } from 'lucide-react';

interface SavingsRateSensitivityProps {
  currentNetWorth: number;
  currentAge: number;
  annualIncome: number;
  annualExpenses: number;
  currentSavingsRate: number; // 0-1
  annualReturnRate?: number;
}

const formatCurrency = (value: number) => {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}k`;
  return `$${value.toFixed(0)}`;
};

export function SavingsRateSensitivity({
  currentNetWorth,
  currentAge,
  annualIncome,
  annualExpenses,
  currentSavingsRate,
  annualReturnRate = 0.07,
}: SavingsRateSensitivityProps) {
  const [highlightRate, setHighlightRate] = useState(
    Math.round(currentSavingsRate * 100)
  );

  const level = getFIRELevel(annualExpenses);
  const fireNumber = calculateFIRENumber(annualExpenses, level.withdrawalRate);

  const chartData = useMemo(() => {
    const points = [];
    for (let pct = 5; pct <= 70; pct += 1) {
      const rate = pct / 100;
      const annualSavings = annualIncome * rate;
      const years = calculateYearsToFIRE(
        currentNetWorth,
        annualSavings,
        fireNumber,
        annualReturnRate,
      );
      points.push({
        savingsRate: pct,
        yearsToFI: Math.min(years, 100),
        label: `${pct}%`,
      });
    }
    return points;
  }, [currentNetWorth, annualIncome, fireNumber, annualReturnRate]);

  const highlightPoint = chartData.find(p => p.savingsRate === highlightRate);
  const currentPoint = chartData.find(
    p => p.savingsRate === Math.round(currentSavingsRate * 100),
  );

  // Key data points for callout
  const callouts = [15, 25, 35, 50].map(pct => {
    const pt = chartData.find(p => p.savingsRate === pct);
    return pt ? { rate: pct, years: pt.yearsToFI } : null;
  }).filter(Boolean) as { rate: number; years: number }[];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5" />
          Savings Rate Impact
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Explore savings rate</Label>
            <span className="text-sm font-mono font-semibold">{highlightRate}%</span>
          </div>
          <Slider
            value={[highlightRate]}
            onValueChange={(v) => setHighlightRate(v[0])}
            min={5}
            max={70}
            step={1}
          />
          {highlightPoint && (
            <p className="text-sm text-muted-foreground">
              At <strong>{highlightRate}%</strong> savings rate:{' '}
              {highlightPoint.yearsToFI >= 100 ? (
                <span className="text-destructive font-medium">
                  FIRE not reachable at current income
                </span>
              ) : (
                <>
                  <strong className="text-primary">
                    {highlightPoint.yearsToFI} years
                  </strong>{' '}
                  to FI (age {currentAge + highlightPoint.yearsToFI})
                </>
              )}
            </p>
          )}
        </div>

        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="savingsRate"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(v) => `${v}%`}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(v) => `${v}yr`}
                domain={[0, (dataMax: number) => Math.min(Math.ceil(dataMax / 5) * 5, 60)]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
                formatter={(value: number) =>
                  value >= 100 ? ['Not reachable', 'Years to FI'] : [`${value} years`, 'Years to FI']
                }
                labelFormatter={(v) => `Savings rate: ${v}%`}
              />
              <Line
                type="monotone"
                dataKey="yearsToFI"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                name="Years to FI"
              />
              {/* Current savings rate marker */}
              {currentPoint && currentPoint.yearsToFI < 100 && (
                <ReferenceDot
                  x={Math.round(currentSavingsRate * 100)}
                  y={currentPoint.yearsToFI}
                  r={6}
                  fill="#10b981"
                  stroke="white"
                  strokeWidth={2}
                />
              )}
              {/* Highlight line */}
              <ReferenceLine
                x={highlightRate}
                stroke="hsl(var(--primary))"
                strokeDasharray="4 4"
                strokeOpacity={0.5}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Key data points */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {callouts.map(({ rate, years }) => (
            <div
              key={rate}
              className={`p-2 rounded-lg text-center ${
                rate === Math.round(currentSavingsRate * 100)
                  ? 'bg-primary/10 border border-primary/30'
                  : 'bg-muted/50'
              }`}
            >
              <p className="text-xs text-muted-foreground">{rate}% savings</p>
              <p className="text-sm font-semibold">
                {years >= 100 ? 'N/A' : `${years} years`}
              </p>
              {rate === Math.round(currentSavingsRate * 100) && (
                <p className="text-[10px] text-primary font-medium">YOUR RATE</p>
              )}
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          FIRE target: {formatCurrency(fireNumber)} ({level.name} at {(level.withdrawalRate * 100).toFixed(1)}% SWR).
          Green dot = your current savings rate ({Math.round(currentSavingsRate * 100)}%).
        </p>
      </CardContent>
    </Card>
  );
}
