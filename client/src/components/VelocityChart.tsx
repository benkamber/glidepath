import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot,
} from "recharts";
import { format } from "date-fns";
import {
  calculateVelocity,
  formatVelocity,
  getVelocityDescription,
  getVelocityRecommendations,
  VelocitySegment,
} from "@/lib/velocity-analysis";
import {
  calculateFirstDerivative,
  calculateSecondDerivative,
  detectInflectionPoints,
  fitDifferentialModel,
  formatAcceleration,
  interpretAcceleration,
} from "@/lib/wealth-calculus";
import { AlertCircle, TrendingUp, TrendingDown, Zap, Target } from "lucide-react";

interface VelocityChartProps {
  entries: Array<{ date: string; totalNetWorth: number }>;
}

export function VelocityChart({ entries }: VelocityChartProps) {
  const [showAcceleration, setShowAcceleration] = useState(false);
  const [showInflectionPoints, setShowInflectionPoints] = useState(true);

  const dataPoints = entries.map((e) => ({
    date: e.date,
    value: e.totalNetWorth,
  }));

  const analysis = calculateVelocity(entries.map((e) => ({ date: e.date, netWorth: e.totalNetWorth })));

  // Calculate derivatives using wealth-calculus
  const velocityData = calculateFirstDerivative(dataPoints);
  const accelerationData = calculateSecondDerivative(velocityData);
  const model = fitDifferentialModel(dataPoints);
  const inflectionPoints = detectInflectionPoints(accelerationData, 5);

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

  // Prepare enhanced chart data with acceleration
  const chartData = accelerationData.map((accelPoint, index) => {
    const date = new Date(accelPoint.date);
    return {
      name: format(date, "MMM d, yyyy"),
      date: accelPoint.date,
      velocity: accelPoint.velocity * 365, // Convert to annual
      acceleration: accelPoint.acceleration * 365 * 365, // Convert to annual²
      value: accelPoint.value,
    };
  });

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-secondary/30 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Overall Velocity</p>
            <p className="text-xl font-mono font-semibold text-foreground">
              {formatVelocity(analysis.overallVelocity)}
            </p>
          </div>
          <div className="p-4 bg-secondary/30 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Avg Acceleration</p>
            <p className="text-xl font-mono font-semibold text-foreground">
              {formatAcceleration(model.averageAcceleration)}
            </p>
          </div>
          <div className="p-4 bg-secondary/30 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Trend</p>
            <div className="flex items-center gap-2">
              {model.trend === 'accelerating' ? (
                <Zap className="h-5 w-5 text-emerald-500" />
              ) : model.trend === 'decelerating' ? (
                <TrendingDown className="h-5 w-5 text-amber-500" />
              ) : (
                <TrendingUp className="h-5 w-5 text-blue-500" />
              )}
              <p className="text-sm font-semibold capitalize text-foreground">
                {model.trend}
              </p>
            </div>
          </div>
          <div className="p-4 bg-secondary/30 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Inflection Points</p>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <p className="text-xl font-mono font-semibold text-foreground">
                {inflectionPoints.length}
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-4 items-center border-t border-b py-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id="show-acceleration"
              checked={showAcceleration}
              onCheckedChange={(checked) => setShowAcceleration(checked === true)}
            />
            <Label htmlFor="show-acceleration" className="text-sm cursor-pointer">
              Show Acceleration (2nd Derivative)
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="show-inflection"
              checked={showInflectionPoints}
              onCheckedChange={(checked) => setShowInflectionPoints(checked === true)}
            />
            <Label htmlFor="show-inflection" className="text-sm cursor-pointer">
              Mark Inflection Points
            </Label>
          </div>
        </div>

        {/* Chart */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <defs>
                <linearGradient id="velocityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="accelGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
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
                yAxisId="velocity"
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  if (Math.abs(value) >= 1_000_000) {
                    return `$${(value / 1_000_000).toFixed(1)}M`;
                  }
                  if (Math.abs(value) >= 1000) {
                    return `$${(value / 1000).toFixed(0)}k`;
                  }
                  return `$${value.toFixed(0)}`;
                }}
                label={{ value: 'Velocity ($/yr)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
              />
              {showAcceleration && (
                <YAxis
                  yAxisId="acceleration"
                  orientation="right"
                  stroke="hsl(var(--primary))"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    if (Math.abs(value) >= 1_000_000) {
                      return `$${(value / 1_000_000).toFixed(1)}M`;
                    }
                    if (Math.abs(value) >= 1000) {
                      return `$${(value / 1000).toFixed(0)}k`;
                    }
                    return `$${value.toFixed(0)}`;
                  }}
                  label={{ value: 'Acceleration ($/yr²)', angle: 90, position: 'insideRight', style: { fontSize: 12 } }}
                />
              )}
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
                formatter={(value: number, name: string) => {
                  if (name === 'velocity') {
                    if (Math.abs(value) >= 1_000_000) {
                      return [`$${(value / 1_000_000).toFixed(2)}M/yr`, 'Velocity'];
                    }
                    if (Math.abs(value) >= 1000) {
                      return [`$${(value / 1000).toFixed(0)}K/yr`, 'Velocity'];
                    }
                    return [`$${value.toFixed(0)}/yr`, 'Velocity'];
                  }
                  if (name === 'acceleration') {
                    if (Math.abs(value) >= 1_000_000) {
                      return [`$${(value / 1_000_000).toFixed(2)}M/yr²`, 'Acceleration'];
                    }
                    if (Math.abs(value) >= 1000) {
                      return [`$${(value / 1000).toFixed(0)}K/yr²`, 'Acceleration'];
                    }
                    return [`$${value.toFixed(0)}/yr²`, 'Acceleration'];
                  }
                  return [value, name];
                }}
              />
              <Line
                yAxisId="velocity"
                type="monotone"
                dataKey="velocity"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                name="Velocity"
              />
              {showAcceleration && (
                <Line
                  yAxisId="acceleration"
                  type="monotone"
                  dataKey="acceleration"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Acceleration"
                />
              )}
              {/* Inflection Points */}
              {showInflectionPoints && inflectionPoints.map((point, i) => (
                <ReferenceDot
                  key={i}
                  yAxisId="velocity"
                  x={format(new Date(point.date), "MMM d, yyyy")}
                  y={point.velocity * 365}
                  r={6}
                  fill={point.type === 'peak' ? '#fbbf24' : '#6366f1'}
                  stroke="#fff"
                  strokeWidth={2}
                />
              ))}
              {/* Zero line for acceleration */}
              {showAcceleration && (
                <ReferenceLine
                  yAxisId="acceleration"
                  y={0}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="3 3"
                  label={{ value: 'Zero Acceleration', fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="space-y-3">
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#10b981]"></div>
              <span className="text-muted-foreground">Velocity (1st derivative)</span>
            </div>
            {showAcceleration && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-primary"></div>
                <span className="text-muted-foreground">Acceleration (2nd derivative)</span>
              </div>
            )}
            {showInflectionPoints && inflectionPoints.length > 0 && (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#fbbf24] border-2 border-white"></div>
                  <span className="text-muted-foreground">Peak (growth rate maximum)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#6366f1] border-2 border-white"></div>
                  <span className="text-muted-foreground">Trough (growth rate minimum)</span>
                </div>
              </>
            )}
          </div>

          {/* Calculus Insights */}
          {accelerationData.length > 0 && (
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Second-Order Analysis
              </h4>
              <p className="text-sm text-muted-foreground">
                {interpretAcceleration(model.averageAcceleration)}
              </p>
              {inflectionPoints.length > 0 && (
                <div className="pt-2 border-t border-primary/20">
                  <p className="text-xs font-semibold text-foreground mb-2">
                    Detected Inflection Points:
                  </p>
                  {inflectionPoints.slice(0, 3).map((point, i) => (
                    <div key={i} className="text-xs text-muted-foreground mb-1">
                      <Badge variant="outline" className="mr-2">
                        {format(new Date(point.date), "MMM d, yyyy")}
                      </Badge>
                      {point.type === 'peak' ? '📈' : '📉'} {point.description}
                    </div>
                  ))}
                  {inflectionPoints.length > 3 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      + {inflectionPoints.length - 3} more inflection point{inflectionPoints.length - 3 > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Old Legend (keeping for compatibility) */}
        <div className="hidden flex-wrap gap-3 text-xs">
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
