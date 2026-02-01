import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from "recharts";
import { TrendingUp, AlertTriangle, Target, Zap, Shield } from "lucide-react";
import type { AggregatedResults } from "@/lib/monte-carlo";

interface MonteCarloResultsProps {
  results: AggregatedResults;
}

const LINE_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
  '#14b8a6', '#a855f7', '#22c55e', '#eab308', '#e11d48',
  '#0ea5e9', '#d946ef', '#65a30d', '#fb923c', '#4f46e5',
];

const formatCurrency = (value: number) => {
  if (Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
};

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (idx - lower);
}

function PercentileLegend() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 mt-3 text-xs">
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-green-500" />
        <span className="text-muted-foreground">95th (Lucky)</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-blue-500" />
        <span className="text-muted-foreground">75th</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-white border border-border" />
        <span className="text-muted-foreground">Median</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-amber-500" />
        <span className="text-muted-foreground">25th</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-red-500" />
        <span className="text-muted-foreground">5th (Unlucky)</span>
      </div>
    </div>
  );
}

export function MonteCarloResults({ results }: MonteCarloResultsProps) {
  const {
    p10Months,
    p50Months,
    p90Months,
    probabilityDepletedBy12Mo,
    probabilityDepletedBy24Mo,
    valueAtRisk95,
    distributionData,
    samplePaths,
    scenarios,
  } = results;

  // Compute confidence band data from allResults
  const confidenceBandData = useMemo(() => {
    const allResults = results.allResults;
    if (!allResults || allResults.length === 0) return [];

    const timeHorizon = allResults[0]?.monthlyNetWorth?.length || 0;
    if (timeHorizon === 0) return [];

    // Downsample: every 3rd month for performance
    const step = Math.max(1, Math.floor(timeHorizon / 40));
    const data: Array<{
      month: number;
      year: number;
      p5: number;
      p25: number;
      median: number;
      p75: number;
      p95: number;
      // For band rendering: store differences
      band_outer_upper: number;
      band_outer_lower: number;
      band_inner_upper: number;
      band_inner_lower: number;
    }> = [];

    for (let month = 0; month < timeHorizon; month += step) {
      const values = allResults
        .map(r => r.monthlyNetWorth?.[month])
        .filter((v): v is number => v !== undefined)
        .sort((a, b) => a - b);

      if (values.length === 0) continue;

      const p5 = percentile(values, 5);
      const p25 = percentile(values, 25);
      const med = percentile(values, 50);
      const p75 = percentile(values, 75);
      const p95 = percentile(values, 95);

      data.push({
        month,
        year: +(month / 12).toFixed(1),
        p5,
        p25,
        median: med,
        p75,
        p95,
        band_outer_upper: p95,
        band_outer_lower: p5,
        band_inner_upper: p75,
        band_inner_lower: p25,
      });
    }

    // Ensure last month is included
    const lastMonth = timeHorizon - 1;
    if (data.length > 0 && data[data.length - 1].month !== lastMonth) {
      const values = allResults
        .map(r => r.monthlyNetWorth?.[lastMonth])
        .filter((v): v is number => v !== undefined)
        .sort((a, b) => a - b);

      if (values.length > 0) {
        const p5 = percentile(values, 5);
        const p25 = percentile(values, 25);
        const med = percentile(values, 50);
        const p75Val = percentile(values, 75);
        const p95 = percentile(values, 95);

        data.push({
          month: lastMonth,
          year: +(lastMonth / 12).toFixed(1),
          p5,
          p25,
          median: med,
          p75: p75Val,
          p95,
          band_outer_upper: p95,
          band_outer_lower: p5,
          band_inner_upper: p75Val,
          band_inner_lower: p25,
        });
      }
    }

    return data;
  }, [results.allResults]);

  // Compute colorized path data for the individual simulation chart
  const colorizedPathData = useMemo(() => {
    const samples = samplePaths.samples.slice(0, 20);
    if (samples.length === 0) return [];

    const maxLen = Math.max(
      ...samples.map(s => s.length),
      samplePaths.median.length,
      samplePaths.worst.length,
      samplePaths.best.length,
    );

    // Downsample for performance
    const step = Math.max(1, Math.floor(maxLen / 60));
    const data: Array<Record<string, number>> = [];

    for (let i = 0; i < maxLen; i += step) {
      const point: Record<string, number> = { month: i };

      samples.forEach((path, idx) => {
        if (i < path.length) {
          point[`sim${idx}`] = path[i];
        }
      });

      if (i < samplePaths.worst.length) point.worst = samplePaths.worst[i];
      if (i < samplePaths.median.length) point.median = samplePaths.median[i];
      if (i < samplePaths.best.length) point.best = samplePaths.best[i];

      data.push(point);
    }

    // Ensure last point is included
    const lastIdx = maxLen - 1;
    if (data.length > 0 && data[data.length - 1].month !== lastIdx) {
      const point: Record<string, number> = { month: lastIdx };
      samples.forEach((path, idx) => {
        if (lastIdx < path.length) point[`sim${idx}`] = path[lastIdx];
      });
      if (lastIdx < samplePaths.worst.length) point.worst = samplePaths.worst[lastIdx];
      if (lastIdx < samplePaths.median.length) point.median = samplePaths.median[lastIdx];
      if (lastIdx < samplePaths.best.length) point.best = samplePaths.best[lastIdx];
      data.push(point);
    }

    return data;
  }, [samplePaths]);

  const numSamplePaths = Math.min(20, samplePaths.samples.length);

  // Determine success rate for 4th hero card
  const successCount = results.allResults?.filter(r => r.trajectoryType === 'success').length || 0;
  const totalCount = results.allResults?.length || 1;
  const successRate = (successCount / totalCount) * 100;

  return (
    <div className="space-y-6">
      {/* Hero Stats - 4 cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-red-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">5th Percentile</p>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
            <p className="text-2xl font-bold text-red-500">
              {p10Months >= 120 ? '10+' : (p10Months / 12).toFixed(1)} years
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Unlucky scenario (worst 10%)
            </p>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Median Outcome</p>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-emerald-500">
              {p50Months >= 120 ? '10+' : (p50Months / 12).toFixed(1)} years
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Most likely: {p50Months.toFixed(0)} months
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">95th Percentile</p>
              <Zap className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-amber-500">
              {p90Months >= 120 ? '10+' : (p90Months / 12).toFixed(1)} years
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Lucky scenario (best 10%)
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Success Rate</p>
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <p className={`text-2xl font-bold ${successRate >= 80 ? 'text-emerald-500' : successRate >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
              {successRate.toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Survive full time horizon
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Confidence Bands Fan Chart — Primary Visualization */}
      {confidenceBandData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Confidence Bands</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={confidenceBandData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="outerBand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="innerBand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.15} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="year"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  label={{ value: 'Years', position: 'insideBottom', offset: -5, fontSize: 12 }}
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
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number, name: string) => {
                    const labels: Record<string, string> = {
                      p95: '95th Percentile (Lucky)',
                      p75: '75th Percentile',
                      median: 'Median (50th)',
                      p25: '25th Percentile',
                      p5: '5th Percentile (Unlucky)',
                    };
                    return [formatCurrency(value), labels[name] || name];
                  }}
                  labelFormatter={(year) => `Year ${year}`}
                />

                {/* Outer band: 5-95 percentile */}
                <Area
                  type="monotone"
                  dataKey="p95"
                  stroke="none"
                  fill="url(#outerBand)"
                  fillOpacity={1}
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="p5"
                  stroke="none"
                  fill="hsl(var(--card))"
                  fillOpacity={1}
                  isAnimationActive={false}
                />

                {/* Inner band: 25-75 percentile */}
                <Area
                  type="monotone"
                  dataKey="p75"
                  stroke="none"
                  fill="url(#innerBand)"
                  fillOpacity={1}
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="p25"
                  stroke="none"
                  fill="hsl(var(--card))"
                  fillOpacity={1}
                  isAnimationActive={false}
                />

                {/* Percentile lines */}
                <Line type="monotone" dataKey="p95" stroke="#22c55e" strokeWidth={1} dot={false} strokeDasharray="4 3" isAnimationActive={false} />
                <Line type="monotone" dataKey="p75" stroke="#3b82f6" strokeWidth={1} dot={false} strokeDasharray="4 3" isAnimationActive={false} />
                <Line type="monotone" dataKey="median" stroke="#ffffff" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="p25" stroke="#f59e0b" strokeWidth={1} dot={false} strokeDasharray="4 3" isAnimationActive={false} />
                <Line type="monotone" dataKey="p5" stroke="#ef4444" strokeWidth={1} dot={false} strokeDasharray="4 3" isAnimationActive={false} />

                <ReferenceLine y={0} stroke="#ef4444" strokeWidth={1.5} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
            <PercentileLegend />
          </CardContent>
        </Card>
      )}

      {/* Individual Simulation Paths — Colorized */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Sample Wealth Trajectories
            <span className="text-sm font-normal text-muted-foreground">
              ({numSamplePaths} paths shown)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={colorizedPathData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="month"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(v) => `${(v / 12).toFixed(0)}y`}
                label={{ value: 'Years', position: 'insideBottom', offset: -5, fontSize: 12 }}
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
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number) => [formatCurrency(value), '']}
                labelFormatter={(month: number) => `Month ${month} (Year ${(month / 12).toFixed(1)})`}
              />

              {/* Individual colored simulation paths */}
              {samplePaths.samples.slice(0, 20).map((_, idx) => (
                <Line
                  key={`sim${idx}`}
                  type="monotone"
                  dataKey={`sim${idx}`}
                  stroke={LINE_COLORS[idx % LINE_COLORS.length]}
                  strokeWidth={1}
                  strokeOpacity={0.5}
                  dot={false}
                  isAnimationActive={false}
                />
              ))}

              {/* Worst case (P10) */}
              <Line
                type="monotone"
                dataKey="worst"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
                name="P10 (Worst 10%)"
                isAnimationActive={false}
              />

              {/* Median (P50) — white, thick */}
              <Line
                type="monotone"
                dataKey="median"
                stroke="#ffffff"
                strokeWidth={3}
                dot={false}
                name="Median"
                isAnimationActive={false}
              />

              {/* Best case (P90) */}
              <Line
                type="monotone"
                dataKey="best"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
                name="P90 (Best 10%)"
                isAnimationActive={false}
              />

              <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="3 3" />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-0.5 bg-white rounded" />
              <span className="text-muted-foreground">Median</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-0.5 bg-red-500 rounded" />
              <span className="text-muted-foreground">P10 (Worst 10%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-0.5 bg-amber-500 rounded" />
              <span className="text-muted-foreground">P90 (Best 10%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-0.5 bg-blue-400 rounded opacity-50" />
              <span className="text-muted-foreground">Individual simulations</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={probabilityDepletedBy12Mo > 0.5 ? 'border-red-500' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Risk: 12 Months</p>
              <AlertTriangle className={`h-4 w-4 ${probabilityDepletedBy12Mo > 0.3 ? 'text-red-500' : 'text-muted-foreground'}`} />
            </div>
            <p className="text-2xl font-bold">{(probabilityDepletedBy12Mo * 100).toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              Probability of funds depleting within 1 year
            </p>
          </CardContent>
        </Card>

        <Card className={probabilityDepletedBy24Mo > 0.3 ? 'border-yellow-500' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Risk: 24 Months</p>
              <AlertTriangle className={`h-4 w-4 ${probabilityDepletedBy24Mo > 0.3 ? 'text-yellow-500' : 'text-muted-foreground'}`} />
            </div>
            <p className="text-2xl font-bold">{(probabilityDepletedBy24Mo * 100).toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              Probability of funds depleting within 2 years
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Value at Risk (95%)</p>
              <Target className="h-4 w-4 text-primary" />
            </div>
            <p className="text-2xl font-bold">{(valueAtRisk95 / 12).toFixed(1)} years</p>
            <p className="text-xs text-muted-foreground mt-1">
              95% chance of at least {valueAtRisk95.toFixed(0)} months
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Scenario Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Scenario Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border border-red-500/20 bg-red-500/5">
              <Badge variant="outline" className="mb-3 bg-red-500/10 text-red-600">Worst 10%</Badge>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Avg Duration</p>
                  <p className="font-semibold">{(scenarios.worst.avgMonths / 12).toFixed(1)} years</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Final Net Worth</p>
                  <p className="font-semibold">{formatCurrency(scenarios.worst.avgFinalNW)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Avg Emergencies</p>
                  <p className="font-semibold">{scenarios.worst.emergencies.toFixed(1)}</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
              <Badge variant="outline" className="mb-3 bg-emerald-500/10 text-emerald-600">Median Case</Badge>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Avg Duration</p>
                  <p className="font-semibold">{(scenarios.median.avgMonths / 12).toFixed(1)} years</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Final Net Worth</p>
                  <p className="font-semibold">{formatCurrency(scenarios.median.avgFinalNW)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Avg Emergencies</p>
                  <p className="font-semibold">{scenarios.median.emergencies.toFixed(1)}</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-yellow-500/20 bg-yellow-500/5">
              <Badge variant="outline" className="mb-3 bg-yellow-500/10 text-yellow-600">Best 10%</Badge>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Avg Duration</p>
                  <p className="font-semibold">{(scenarios.best.avgMonths / 12).toFixed(1)} years</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Final Net Worth</p>
                  <p className="font-semibold">{formatCurrency(scenarios.best.avgFinalNW)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Avg Emergencies</p>
                  <p className="font-semibold">{scenarios.best.emergencies.toFixed(1)}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Probability Distribution — moved to bottom */}
      <Card>
        <CardHeader>
          <CardTitle>Probability Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={distributionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="months"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(v) => `${Math.round(v / 12)}y`}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                label={{ value: 'Frequency', angle: -90, position: 'insideLeft', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
                formatter={(value: number, name: string) => {
                  if (name === 'count') return [`${value} simulations`, 'Frequency'];
                  return [value, name];
                }}
                labelFormatter={(months: number) => `${months} months (${(months / 12).toFixed(1)} years)`}
              />
              <Bar dataKey="count" fill="hsl(var(--primary))" />
              <ReferenceLine x={p10Months} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'P10', fill: '#ef4444', fontSize: 10 }} />
              <ReferenceLine x={p50Months} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'P50', fill: '#10b981', fontSize: 10 }} />
              <ReferenceLine x={p90Months} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'P90', fill: '#f59e0b', fontSize: 10 }} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-red-500" />
              <span>P10 (Worst 10%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-emerald-500" />
              <span>P50 (Median)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-yellow-500" />
              <span>P90 (Best 10%)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
