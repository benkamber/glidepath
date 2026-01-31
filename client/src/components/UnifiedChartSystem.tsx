import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  Area,
  AreaChart,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { debugLog, debugGroup, debugCurrency, debugCheckpoint } from '@/lib/debug-logger';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  BarChart3,
  TrendingUp,
  Users,
  Target,
  Flame,
  AlertTriangle,
  Download,
} from 'lucide-react';

type TimeRange = '1Y' | '5Y' | '10Y' | 'All';
type DataLayer = 'netWorth' | 'cash' | 'investment';
type ChartLens = 'none' | 'velocity' | 'peer' | 'projection' | 'fire' | 'deviation';

interface Entry {
  date: string;
  totalNetWorth: number;
  cash: number;
  investment: number;
}

interface MonteCarloResult {
  dates: string[];
  percentile5: number[];
  percentile25: number[];
  percentile50: number[];
  percentile75: number[];
  percentile95: number[];
}

interface ProjectionPoint {
  age: number;
  expectedNW: number;
  income: number;
}

interface VelocitySegment {
  startDate: string;
  endDate: string;
  velocity: number;
  acceleration?: number;
}

interface PercentileBand {
  age: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  p95: number;
}

interface FIRELevel {
  name: string;
  amount: number;
  color: string;
}

export interface UnifiedChartSystemProps {
  entries: Entry[];
  monteCarloData?: MonteCarloResult;
  profileProjection?: { yearByYear: ProjectionPoint[] };
  velocityData?: VelocitySegment[];
  percentileData?: PercentileBand[];
  fireThresholds?: FIRELevel[];
  currentAge?: number;
  projectionHorizonYears?: number;
  onProjectionHorizonChange?: (years: number) => void;
  targetRetirementAge?: number;
}

const formatCurrency = (value: number) => {
  if (Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}k`;
  }
  return `$${value.toFixed(0)}`;
};

export function UnifiedChartSystem({
  entries,
  monteCarloData,
  profileProjection,
  velocityData,
  percentileData,
  fireThresholds,
  currentAge,
  projectionHorizonYears = 10,
  onProjectionHorizonChange,
  targetRetirementAge,
}: UnifiedChartSystemProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('All');
  const [activeLayers, setActiveLayers] = useState<DataLayer[]>(['netWorth']);
  const [activeLens, setActiveLens] = useState<ChartLens>('none');

  // Filter data by time range
  const filteredEntries = useMemo(() => {
    if (timeRange === 'All') return entries;

    const now = new Date();
    const cutoffDate = new Date();

    switch (timeRange) {
      case '1Y':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      case '5Y':
        cutoffDate.setFullYear(now.getFullYear() - 5);
        break;
      case '10Y':
        cutoffDate.setFullYear(now.getFullYear() - 10);
        break;
    }

    return entries.filter(e => new Date(e.date) >= cutoffDate);
  }, [entries, timeRange]);

  // Prepare chart data
  const chartData = useMemo(() => {
    debugCheckpoint("STAGE_4: Before Chart Render", filteredEntries);

    const data = filteredEntries.map(entry => {
      const entryDate = new Date(entry.date);
      const chartPoint: any = {
        date: `${entryDate.getMonth() + 1}/${entryDate.getFullYear()}`, // Format as MM/YYYY to avoid duplicates
        fullDate: entry.date,
        timestamp: entryDate.getTime(), // For sorting
      };

      if (activeLayers.includes('netWorth')) {
        chartPoint.netWorth = entry.totalNetWorth;
      }
      if (activeLayers.includes('cash')) {
        chartPoint.cash = entry.cash;
      }
      if (activeLayers.includes('investment')) {
        chartPoint.investment = entry.investment || (entry.totalNetWorth - entry.cash);
      }

      return chartPoint;
    });

    debugGroup("CHART_DATA", "Prepared chart data", () => {
      debugLog("CHART_DATA", `Total data points: ${data.length}`);
      if (data.length > 0) {
        debugLog("CHART_DATA", "First point:", {
          date: data[0].date,
          fullDate: data[0].fullDate,
          netWorth: data[0].netWorth ? debugCurrency(data[0].netWorth) : 'N/A',
        });
        debugLog("CHART_DATA", "Last point:", {
          date: data[data.length - 1].date,
          fullDate: data[data.length - 1].fullDate,
          netWorth: data[data.length - 1].netWorth ? debugCurrency(data[data.length - 1].netWorth) : 'N/A',
        });
      }
    });

    return data;
  }, [filteredEntries, activeLayers]);

  // Add lens-specific data overlays
  const enrichedChartData = useMemo(() => {
    const data = [...chartData];

    // Add velocity overlay
    if (activeLens === 'velocity' && velocityData) {
      // Calculate velocity for each point
      for (let i = 1; i < data.length; i++) {
        const current = filteredEntries[i];
        const previous = filteredEntries[i - 1];
        const timeDiff = new Date(current.date).getTime() - new Date(previous.date).getTime();
        const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
        const wealthDiff = current.totalNetWorth - previous.totalNetWorth;
        data[i].velocity = (wealthDiff / daysDiff) * 365; // Annualized
      }
    }

    // Add peer comparison percentiles
    if (activeLens === 'peer' && percentileData && currentAge) {
      data.forEach((point, i) => {
        const entry = filteredEntries[i];
        const entryAge = currentAge - Math.floor(
          (new Date().getTime() - new Date(entry.date).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
        );

        const band = percentileData.find(p => Math.abs(p.age - entryAge) < 1);
        if (band) {
          point.p25 = band.p25;
          point.p50 = band.p50;
          point.p75 = band.p75;
          point.p90 = band.p90;
        }
      });
    }

    // Add projection data with Monte Carlo probability bands
    if (activeLens === 'projection' && (monteCarloData || profileProjection)) {
      // Add future dates for projection
      const lastEntry = filteredEntries[filteredEntries.length - 1];
      const lastDate = new Date(lastEntry.date);

      if (profileProjection) {
        profileProjection.yearByYear.forEach((proj, i) => {
          const futureDate = new Date(lastDate);
          futureDate.setFullYear(futureDate.getFullYear() + i + 1);

          const dataPoint: any = {
            date: `${futureDate.getMonth() + 1}/${futureDate.getFullYear()}`, // Match main data format
            fullDate: futureDate.toISOString(),
            timestamp: futureDate.getTime(),
            projection: proj.expectedNW,
            projectionIncome: proj.income,
            // Set historical data to null so Recharts doesn't drop to zero
            netWorth: null,
            cash: null,
            investment: null,
            other: null,
            liabilities: null,
          };

          // Add Monte Carlo percentiles if available
          if (monteCarloData && i < monteCarloData.dates.length) {
            dataPoint.mc5 = monteCarloData.percentile5[i];
            dataPoint.mc25 = monteCarloData.percentile25[i];
            dataPoint.mc50 = monteCarloData.percentile50[i];
            dataPoint.mc75 = monteCarloData.percentile75[i];
            dataPoint.mc95 = monteCarloData.percentile95[i];
          }

          data.push(dataPoint);
        });
      }
    }

    return data;
  }, [chartData, activeLens, velocityData, percentileData, monteCarloData, profileProjection, filteredEntries, currentAge]);

  // Toggle layer
  const toggleLayer = (layer: DataLayer) => {
    setActiveLayers(prev => {
      if (prev.includes(layer)) {
        return prev.filter(l => l !== layer);
      } else {
        return [...prev, layer];
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Wealth Trajectory
          </CardTitle>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filter Controls */}
        <div className="space-y-3">
          {/* Time Range Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <Label className="text-sm font-medium">Time Range:</Label>
            <div className="flex gap-1">
              {(['1Y', '5Y', '10Y', 'All'] as TimeRange[]).map(range => (
                <Button
                  key={range}
                  variant={timeRange === range ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange(range)}
                  className="h-8 px-3"
                >
                  {range}
                </Button>
              ))}
            </div>
          </div>

          {/* Data Layers */}
          <div className="flex flex-wrap items-center gap-3">
            <Label className="text-sm font-medium">Layers:</Label>
            <div className="flex gap-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="layer-networth"
                  checked={activeLayers.includes('netWorth')}
                  onCheckedChange={() => toggleLayer('netWorth')}
                />
                <Label htmlFor="layer-networth" className="text-sm cursor-pointer">
                  Net Worth
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="layer-cash"
                  checked={activeLayers.includes('cash')}
                  onCheckedChange={() => toggleLayer('cash')}
                />
                <Label htmlFor="layer-cash" className="text-sm cursor-pointer">
                  Cash
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="layer-investment"
                  checked={activeLayers.includes('investment')}
                  onCheckedChange={() => toggleLayer('investment')}
                />
                <Label htmlFor="layer-investment" className="text-sm cursor-pointer">
                  Investment
                </Label>
              </div>
            </div>
          </div>

          {/* Lens Selector */}
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Analysis Lens:</Label>
            <Select value={activeLens} onValueChange={(v) => setActiveLens(v as ChartLens)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <span className="flex items-center gap-2">
                    📊 Raw Data
                  </span>
                </SelectItem>
                <SelectItem value="velocity">
                  <span className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Velocity Analysis
                  </span>
                </SelectItem>
                <SelectItem value="peer">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Peer Comparison
                  </span>
                </SelectItem>
                <SelectItem value="projection">
                  <span className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Future Projection
                  </span>
                </SelectItem>
                <SelectItem value="fire">
                  <span className="flex items-center gap-2">
                    <Flame className="h-4 w-4" />
                    FIRE Analysis
                  </span>
                </SelectItem>
                <SelectItem value="deviation">
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Deviation Alerts
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Projection Horizon Controls (only visible when projection lens active) */}
          {activeLens === 'projection' && onProjectionHorizonChange && (
            <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/30 rounded-lg border border-primary/20">
              <Label className="text-sm font-medium">Projection Horizon:</Label>
              {targetRetirementAge && currentAge && currentAge < targetRetirementAge ? (
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="gap-1">
                    🎯 To Retirement: {projectionHorizonYears}yr (age {targetRetirementAge})
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    (Set in profile. Click buttons below to override.)
                  </span>
                </div>
              ) : null}
              <div className="flex gap-1">
                {[10, 20, 30, 40, 50].map(years => (
                  <Button
                    key={years}
                    variant={projectionHorizonYears === years ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onProjectionHorizonChange(years)}
                    className="h-8 px-3"
                  >
                    {years}yr
                  </Button>
                ))}
              </div>
              {currentAge && !(targetRetirementAge && currentAge < targetRetirementAge) && (
                <span className="text-xs text-muted-foreground ml-2">
                  (projects to age {currentAge + projectionHorizonYears})
                </span>
              )}
            </div>
          )}
        </div>

        {/* Chart */}
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={enrichedChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                interval="preserveStartEnd"
                angle={-45}
                textAnchor="end"
                height={60}
                tickFormatter={(value) => {
                  // Show only year if we have many data points
                  const parts = value.split('/');
                  if (parts.length === 2) {
                    return enrichedChartData.length > 24 ? parts[1] : value;
                  }
                  return value;
                }}
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
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend />

              {/* Base Data Layers */}
              {activeLayers.includes('netWorth') && (
                <Line
                  type="monotone"
                  dataKey="netWorth"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                  name="Net Worth"
                  connectNulls={false}
                />
              )}
              {activeLayers.includes('cash') && (
                <Line
                  type="monotone"
                  dataKey="cash"
                  stroke="hsl(142 76% 36%)"
                  strokeWidth={2}
                  dot={false}
                  name="Cash"
                  connectNulls={false}
                />
              )}
              {activeLayers.includes('investment') && (
                <Line
                  type="monotone"
                  dataKey="investment"
                  stroke="hsl(197 100% 44%)"
                  strokeWidth={2}
                  dot={false}
                  name="Investment"
                  connectNulls={false}
                />
              )}

              {/* Velocity Lens */}
              {activeLens === 'velocity' && (
                <Line
                  type="monotone"
                  dataKey="velocity"
                  stroke="hsl(38 92% 50%)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Velocity ($/yr)"
                />
              )}

              {/* Peer Comparison Lens */}
              {activeLens === 'peer' && (
                <>
                  <Area
                    type="monotone"
                    dataKey="p25"
                    stroke="none"
                    fill="hsl(var(--muted))"
                    fillOpacity={0.3}
                    name="25th %ile"
                  />
                  <Line
                    type="monotone"
                    dataKey="p50"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                    dot={false}
                    name="Median (peers)"
                  />
                  <Area
                    type="monotone"
                    dataKey="p75"
                    stroke="none"
                    fill="hsl(var(--muted))"
                    fillOpacity={0.3}
                    name="75th %ile"
                  />
                </>
              )}

              {/* Projection Lens with Monte Carlo Probability Bands */}
              {activeLens === 'projection' && (
                <>
                  {/* Outer band: 5th-95th percentile (widest uncertainty) */}
                  <Area
                    type="monotone"
                    dataKey="mc95"
                    stroke="hsl(var(--primary))"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.1}
                    name="95th percentile"
                  />
                  <Area
                    type="monotone"
                    dataKey="mc5"
                    stroke="hsl(var(--primary))"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                    fill="hsl(var(--background))"
                    fillOpacity={1}
                    name="5th percentile"
                  />

                  {/* Middle band: 25th-75th percentile (likely range) */}
                  <Area
                    type="monotone"
                    dataKey="mc75"
                    stroke="hsl(var(--primary))"
                    strokeWidth={1}
                    fill="hsl(var(--primary))"
                    fillOpacity={0.2}
                    name="75th percentile"
                  />
                  <Area
                    type="monotone"
                    dataKey="mc25"
                    stroke="hsl(var(--primary))"
                    strokeWidth={1}
                    fill="hsl(var(--background))"
                    fillOpacity={1}
                    name="25th percentile"
                  />

                  {/* Median line: 50th percentile (most likely) */}
                  <Line
                    type="monotone"
                    dataKey="mc50"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={false}
                    name="Median projection (50th %ile)"
                  />

                  {/* Career-based projection (deterministic model) */}
                  <Line
                    type="monotone"
                    dataKey="projection"
                    stroke="hsl(142 76% 36%)"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name="Career model"
                  />
                </>
              )}

              {/* FIRE Thresholds */}
              {activeLens === 'fire' && fireThresholds && fireThresholds.map((threshold) => (
                <ReferenceLine
                  key={threshold.name}
                  y={threshold.amount}
                  stroke={threshold.color}
                  strokeDasharray="3 3"
                  label={{
                    value: threshold.name,
                    position: 'right',
                    fill: threshold.color,
                    fontSize: 12,
                  }}
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Legend for active lens */}
        {activeLens !== 'none' && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
            <Badge variant="outline" className="gap-1">
              {activeLens === 'velocity' && '📈 Velocity: Rate of wealth accumulation'}
              {activeLens === 'peer' && '👥 Peer: SCF percentile bands by age'}
              {activeLens === 'projection' && '🎯 Projection: Shaded bands show probability range (darker = more likely). Thick line = median outcome (50% chance). Career model (dashed green) = deterministic BLS-based trajectory.'}
              {activeLens === 'fire' && '🔥 FIRE: Financial independence milestones'}
              {activeLens === 'deviation' && '⚠️ Deviation: Statistical anomaly detection'}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
