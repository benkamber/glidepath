import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import {
  calculateVelocity,
  formatVelocity,
  getVelocityDescription,
  getVelocityRecommendations,
  VelocitySegment,
} from "@/lib/velocity-analysis";
import { AlertCircle, TrendingUp, TrendingDown } from "lucide-react";

interface VelocityChartProps {
  entries: Array<{ date: string; totalNetWorth: number }>;
}

export function VelocityChart({ entries }: VelocityChartProps) {
  const dataPoints = entries.map((e) => ({
    date: e.date,
    netWorth: e.totalNetWorth,
  }));

  const analysis = calculateVelocity(dataPoints);

  if (!analysis.hasMinimumData) {
    return (
      <Card className="terminal-card">
        <CardHeader>
          <CardTitle className="text-primary">Growth Velocity Analysis</CardTitle>
          <CardDescription>Track how fast your wealth is growing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 bg-warning/10 border border-warning/30 rounded-lg">
            <AlertCircle className="h-5 w-5 text-warning flex-shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-foreground mb-1">Insufficient Data</p>
              <p className="text-muted-foreground">{analysis.recommendation}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data
  const chartData = analysis.segments.map((segment, index) => ({
    name: format(segment.endDate, "MMM d, yyyy"),
    velocity: segment.velocity,
    annualizedRate: segment.annualizedRate,
    type: segment.type,
    color: segment.color,
    segment: segment,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const segment: VelocitySegment = data.segment;

      return (
        <div className="bg-card border border-border p-3 rounded-lg shadow-lg">
          <p className="text-sm font-semibold text-foreground mb-2">
            {format(segment.startDate, "MMM d")} → {format(segment.endDate, "MMM d, yyyy")}
          </p>
          <div className="space-y-1 text-xs">
            <p className="text-muted-foreground">
              <span className="text-foreground">Velocity:</span> {formatVelocity(segment.velocity)}
            </p>
            <p className="text-muted-foreground">
              <span className="text-foreground">Annual Rate:</span>{" "}
              {segment.annualizedRate.toFixed(1)}%
            </p>
            <p className="text-muted-foreground">
              <span className="text-foreground">Duration:</span> {segment.durationDays} days
            </p>
            <p
              className="text-foreground font-semibold mt-2"
              style={{ color: segment.color }}
            >
              {segment.type.charAt(0).toUpperCase() + segment.type.slice(1)}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const recommendations = getVelocityRecommendations(analysis);

  return (
    <Card className="terminal-card">
      <CardHeader>
        <CardTitle className="text-primary">Growth Velocity Analysis</CardTitle>
        <CardDescription>
          Tracking wealth accumulation rate across {analysis.dataPointCount} data points
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-secondary/30 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Overall Velocity</p>
            <p className="text-xl font-mono font-semibold text-foreground">
              {formatVelocity(analysis.overallVelocity)}
            </p>
          </div>
          <div className="p-4 bg-secondary/30 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Avg Annual Rate</p>
            <p className="text-xl font-mono font-semibold text-foreground">
              {analysis.averageAnnualizedRate.toFixed(1)}%
            </p>
          </div>
          <div className="p-4 bg-secondary/30 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Recent Trend</p>
            <div className="flex items-center gap-2">
              {analysis.segments[analysis.segments.length - 1]?.type === "declining" ? (
                <TrendingDown className="h-5 w-5 text-destructive" />
              ) : (
                <TrendingUp className="h-5 w-5 text-success" />
              )}
              <p
                className="text-sm font-semibold capitalize"
                style={{
                  color: analysis.segments[analysis.segments.length - 1]?.color || "#10b981",
                }}
              >
                {analysis.segments[analysis.segments.length - 1]?.type || "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="velocityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return format(date, "MMM yy");
                }}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  if (Math.abs(value) >= 1000) {
                    return `$${(value / 1000).toFixed(1)}k`;
                  }
                  return `$${value}`;
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="velocity"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#velocityGradient)"
                fillOpacity={1}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Color Legend */}
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#10b981]"></div>
            <span className="text-muted-foreground">High Growth</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#fbbf24]"></div>
            <span className="text-muted-foreground">Moderate</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#f97316]"></div>
            <span className="text-muted-foreground">Stagnant</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ef4444]"></div>
            <span className="text-muted-foreground">Declining</span>
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-sm font-semibold text-foreground mb-2">Insights</p>
            <ul className="space-y-1.5">
              {recommendations.map((rec, index) => (
                <li key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Data Quality Notice */}
        {analysis.dataPointCount < 10 && (
          <div className="text-xs text-muted-foreground text-center p-3 bg-secondary/20 rounded">
            {analysis.recommendation}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
