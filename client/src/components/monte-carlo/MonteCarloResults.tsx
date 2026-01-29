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
  Legend,
} from "recharts";
import { TrendingUp, AlertTriangle, Target, Zap } from "lucide-react";
import type { AggregatedResults } from "@/lib/monte-carlo";

interface MonteCarloResultsProps {
  results: AggregatedResults;
}

const formatCurrency = (value: number) => {
  if (Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
};

export function MonteCarloResults({ results }: MonteCarloResultsProps) {
  const {
    p10Months,
    p50Months,
    p90Months,
    meanMonths,
    probabilityDepletedBy12Mo,
    probabilityDepletedBy24Mo,
    probabilityDepletedBy36Mo,
    valueAtRisk95,
    distributionData,
    samplePaths,
    scenarios,
  } = results;

  return (
    <div className="space-y-6">
      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">90% Confidence</p>
              <Target className="h-4 w-4 text-primary" />
            </div>
            <p className="text-3xl font-bold text-primary">
              {p10Months >= 120 ? '10+' : p10Months.toFixed(0)} years
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              In 90% of scenarios, you can sustain at least {p10Months.toFixed(0)} months ({(p10Months / 12).toFixed(1)} years)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Median Outcome</p>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {p50Months >= 120 ? '10+' : (p50Months / 12).toFixed(1)} years
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Most likely scenario: {p50Months.toFixed(0)} months
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Best Case (90%ile)</p>
              <Zap className="h-4 w-4 text-yellow-500" />
            </div>
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
              {p90Months >= 120 ? '10+' : (p90Months / 12).toFixed(1)} years
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              In best 10% of cases: {p90Months.toFixed(0)}+ months
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Probability Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
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
                formatter={(value: any, name: string) => {
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

      {/* Trajectory Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Sample Wealth Trajectories</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                type="number"
                domain={[0, 120]}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                label={{ value: 'Months', position: 'insideBottom', offset: -5, fontSize: 12 }}
                tickFormatter={(v) => `${Math.round(v / 12)}y`}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={formatCurrency}
                label={{ value: 'Net Worth', angle: -90, position: 'insideLeft', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
                formatter={(value: any) => formatCurrency(Number(value))}
                labelFormatter={(month: number) => `Month ${month} (${(month / 12).toFixed(1)} years)`}
              />
              <Legend />

              {/* Sample paths (light gray) */}
              {samplePaths.samples.slice(0, 15).map((path, idx) => (
                <Line
                  key={idx}
                  data={path.map((nw, i) => ({ month: i, netWorth: nw }))}
                  dataKey="netWorth"
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth={1}
                  strokeOpacity={0.15}
                  dot={false}
                  type="monotone"
                  isAnimationActive={false}
                />
              ))}

              {/* Worst case (P10) */}
              <Line
                data={samplePaths.worst.map((nw, i) => ({ month: i, netWorth: nw }))}
                dataKey="netWorth"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
                type="monotone"
                name="P10 (Worst 10%)"
              />

              {/* Median (P50) */}
              <Line
                data={samplePaths.median.map((nw, i) => ({ month: i, netWorth: nw }))}
                dataKey="netWorth"
                stroke="#10b981"
                strokeWidth={3}
                dot={false}
                type="monotone"
                name="P50 (Median)"
              />

              {/* Best case (P90) */}
              <Line
                data={samplePaths.best.map((nw, i) => ({ month: i, netWorth: nw }))}
                dataKey="netWorth"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
                type="monotone"
                name="P90 (Best 10%)"
              />

              <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="3 3" />
            </LineChart>
          </ResponsiveContainer>
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
    </div>
  );
}
