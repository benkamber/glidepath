import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  LineChart,
  Line,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format } from "date-fns";
import {
  runMultiScenarioAnalysis,
  formatCurrency,
  calculateTargetProbability,
  type MultiScenarioResult,
  type ScenarioResult,
} from "@/lib/monte-carlo-scenarios";
import { TrendingUp, TrendingDown, Info, Target } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

interface MultiScenarioAnalysisProps {
  currentNetWorth: number;
  annualSavings: number;
  years?: number;
  historicalData?: Array<{ date: string; totalNetWorth: number }>;
  fireTarget?: number;
}

export function MultiScenarioAnalysis({
  currentNetWorth,
  annualSavings,
  years = 10,
  historicalData,
  fireTarget,
}: MultiScenarioAnalysisProps) {
  // Run multi-scenario analysis
  const analysis = useMemo<MultiScenarioResult>(() => {
    const historicalFormatted = historicalData?.map((e) => ({
      date: e.date,
      netWorth: e.totalNetWorth,
    }));

    return runMultiScenarioAnalysis(
      currentNetWorth,
      annualSavings,
      years,
      historicalFormatted
    );
  }, [currentNetWorth, annualSavings, years, historicalData]);

  // Prepare chart data
  const chartData = useMemo(() => {
    return analysis.dates.map((date, i) => {
      const dataPoint: any = {
        date: format(date, "MMM yyyy"),
        fullDate: date,
      };

      // Add each scenario's median line
      analysis.scenarios.forEach((scenario) => {
        dataPoint[`${scenario.name}_median`] = scenario.percentile50[i];
        dataPoint[`${scenario.name}_p5`] = scenario.percentile5[i];
        dataPoint[`${scenario.name}_p95`] = scenario.percentile95[i];
      });

      // Add historical if available
      if (analysis.historicalTrajectory && i < analysis.historicalTrajectory.percentile50.length) {
        dataPoint.historical = analysis.historicalTrajectory.percentile50[i];
      }

      return dataPoint;
    });
  }, [analysis]);

  // Calculate target probabilities
  const targetProbabilities = useMemo(() => {
    if (!fireTarget) return null;

    return analysis.scenarios.map((scenario) => ({
      scenario: scenario.name,
      probability: calculateTargetProbability(scenario, fireTarget),
      color: scenario.color,
    }));
  }, [analysis.scenarios, fireTarget]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border p-3 rounded-lg shadow-lg">
          <p className="text-xs font-semibold text-foreground mb-2">
            {format(payload[0].payload.fullDate, "MMMM yyyy")}
          </p>
          <div className="space-y-1 text-xs">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-4">
                <span style={{ color: entry.color }}>{entry.name}:</span>
                <span className="font-mono font-semibold text-foreground">
                  {formatCurrency(entry.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="terminal-card">
      <CardHeader>
        <CardTitle className="text-primary flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Multi-Scenario Monte Carlo Analysis
        </CardTitle>
        <CardDescription>
          Wealth projections across different market return assumptions ({years}-year outlook)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Comparison Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-success/10 border border-success/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-success" />
              <p className="text-xs text-muted-foreground">Best Case</p>
            </div>
            <p className="text-xl font-mono font-bold text-success">
              {formatCurrency(analysis.comparisonMetrics.bestCase.value)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {analysis.comparisonMetrics.bestCase.scenario}
            </p>
          </div>

          <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground">Spread</p>
            </div>
            <p className="text-xl font-mono font-bold text-primary">
              {formatCurrency(analysis.comparisonMetrics.spread)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Best vs. Worst Case
            </p>
          </div>

          <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-destructive" />
              <p className="text-xs text-muted-foreground">Worst Case</p>
            </div>
            <p className="text-xl font-mono font-bold text-destructive">
              {formatCurrency(analysis.comparisonMetrics.worstCase.value)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {analysis.comparisonMetrics.worstCase.scenario}
            </p>
          </div>
        </div>

        {/* Historical Performance Badge */}
        {analysis.comparisonMetrics.historicalPerformance && (
          <Alert className="bg-primary/5 border-primary/20">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Your Historical Performance:</strong>{" "}
              {analysis.comparisonMetrics.historicalPerformance} scenario
            </AlertDescription>
          </Alert>
        )}

        {/* Main Chart */}
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 11 }}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 11 }}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: "11px" }}
                iconType="line"
              />

              {/* Historical trajectory */}
              {analysis.historicalTrajectory && (
                <Line
                  type="monotone"
                  dataKey="historical"
                  stroke="#ff8c00"
                  strokeWidth={3}
                  dot={false}
                  name="Your History"
                />
              )}

              {/* Scenario lines */}
              {analysis.scenarios.map((scenario) => (
                <Line
                  key={scenario.name}
                  type="monotone"
                  dataKey={`${scenario.name}_median`}
                  stroke={scenario.color}
                  strokeWidth={2}
                  dot={false}
                  name={scenario.name}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Scenario Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {analysis.scenarios.map((scenario) => (
            <div
              key={scenario.name}
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: `${scenario.color}10`,
                borderColor: `${scenario.color}40`,
              }}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4
                    className="text-sm font-semibold"
                    style={{ color: scenario.color }}
                  >
                    {scenario.name}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {scenario.description}
                  </p>
                </div>
                <div className="text-xs font-mono font-semibold text-foreground">
                  {(scenario.annualReturnRate * 100).toFixed(0)}%
                </div>
              </div>

              <div className="space-y-2 mt-3">
                <div>
                  <p className="text-xs text-muted-foreground">Final Median</p>
                  <p className="text-lg font-mono font-bold text-foreground">
                    {formatCurrency(scenario.finalMedian)}
                  </p>
                </div>

                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">95th %ile:</span>
                    <span className="font-mono text-foreground">
                      {formatCurrency(scenario.percentile95[scenario.percentile95.length - 1])}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">5th %ile:</span>
                    <span className="font-mono text-foreground">
                      {formatCurrency(scenario.percentile5[scenario.percentile5.length - 1])}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Target Probability Analysis */}
        {fireTarget && targetProbabilities && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Target className="h-4 w-4" />
                Probability of Reaching {formatCurrency(fireTarget)}
              </h4>
            </div>

            <div className="space-y-3">
              {targetProbabilities.map((item) => (
                <div key={item.scenario} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span
                      className="font-semibold"
                      style={{ color: item.color }}
                    >
                      {item.scenario}
                    </span>
                    <span className="font-mono font-semibold text-foreground">
                      {(item.probability * 100).toFixed(0)}% likely
                    </span>
                  </div>
                  <Progress
                    value={item.probability * 100}
                    className="h-2"
                    style={{
                      backgroundColor: `${item.color}20`,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Key Insights */}
        <Alert className="bg-secondary/30 border-border">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs space-y-2">
            <p>
              <strong>Understanding the Scenarios:</strong> Each scenario runs 1,000 simulations
              with different random market returns. The lines show median outcomes, while the
              shaded areas represent confidence intervals.
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>
                <strong>Conservative (3%):</strong> Worst-case planning, heavy bonds or recession
              </li>
              <li>
                <strong>Historical Average (7%):</strong> Based on S&P 500 real returns 1926-2024
              </li>
              <li>
                <strong>Spread:</strong> Shows impact of market uncertainty on your goals
              </li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
