import { useMemo, useState } from 'react';
import { format, addDays, addYears } from 'date-fns';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Target, Info } from 'lucide-react';
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { UserProfile } from '@/hooks/use-user-profile';
import {
  projectFutureWealth,
  projectionScenarios,
  type ProjectionScenario,
} from '@/models/wealth-model';

interface MonteCarloResult {
  percentile5: number[];
  percentile25: number[];
  percentile50: number[];
  percentile75: number[];
  percentile95: number[];
  dates: string[];
}

interface EnhancedProjectionProps {
  currentNetWorth: number | null;
  profile: UserProfile | null;
  monteCarloData: MonteCarloResult | null;
  historicalGrowthRate: number;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const formatCompact = (value: number) => {
  if (Math.abs(value) >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(0)}k`;
  }
  return formatCurrency(value);
};

export function EnhancedProjection({
  currentNetWorth,
  profile,
  monteCarloData,
  historicalGrowthRate,
}: EnhancedProjectionProps) {
  const [showProfileLine, setShowProfileLine] = useState(true);
  const [selectedScenario, setSelectedScenario] = useState<string>('current');
  const [projectionYears, setProjectionYears] = useState(10);

  // Generate profile-based projection
  const profileProjection = useMemo(() => {
    if (!profile || currentNetWorth === null) return null;

    const scenario = projectionScenarios[selectedScenario];
    const targetAge = profile.age + projectionYears;

    return projectFutureWealth(
      {
        currentAge: profile.age,
        startAge: profile.age - profile.yearsInWorkforce,
        occupation: profile.occupation,
        level: profile.level,
        metro: profile.metro,
        savingsRate: profile.savingsRate,
        currentNetWorth,
      },
      targetAge,
      scenario
    );
  }, [profile, currentNetWorth, selectedScenario, projectionYears]);

  // Combine Monte Carlo and profile projection into chart data
  const chartData = useMemo(() => {
    const data: Array<{
      label: string;
      age?: number;
      mc5?: number;
      mc25?: number;
      mc50?: number;
      mc75?: number;
      mc95?: number;
      profile?: number;
      income?: number;
    }> = [];

    const currentAge = profile?.age ?? 30;

    // Use profile projection timeline if available
    if (profileProjection && showProfileLine) {
      profileProjection.yearByYear.forEach((year, index) => {
        const mcIndex = monteCarloData
          ? Math.min(Math.floor((index / projectionYears) * (monteCarloData.dates.length - 1)), monteCarloData.dates.length - 1)
          : -1;

        data.push({
          label: `Age ${year.age}`,
          age: year.age,
          profile: year.expectedNW,
          income: year.income,
          mc5: mcIndex >= 0 ? monteCarloData?.percentile5[mcIndex] : undefined,
          mc25: mcIndex >= 0 ? monteCarloData?.percentile25[mcIndex] : undefined,
          mc50: mcIndex >= 0 ? monteCarloData?.percentile50[mcIndex] : undefined,
          mc75: mcIndex >= 0 ? monteCarloData?.percentile75[mcIndex] : undefined,
          mc95: mcIndex >= 0 ? monteCarloData?.percentile95[mcIndex] : undefined,
        });
      });
    } else if (monteCarloData) {
      // Fallback to Monte Carlo only
      monteCarloData.dates.forEach((date, index) => {
        const yearsFromNow = (index / (monteCarloData.dates.length - 1)) * 3;
        data.push({
          label: date,
          age: Math.round(currentAge + yearsFromNow),
          mc5: monteCarloData.percentile5[index],
          mc25: monteCarloData.percentile25[index],
          mc50: monteCarloData.percentile50[index],
          mc75: monteCarloData.percentile75[index],
          mc95: monteCarloData.percentile95[index],
        });
      });
    }

    return data;
  }, [profileProjection, monteCarloData, showProfileLine, profile?.age, projectionYears]);

  // Final projected values
  const finalValues = useMemo(() => {
    const lastMC = monteCarloData ? {
      p50: monteCarloData.percentile50[monteCarloData.percentile50.length - 1],
      p25: monteCarloData.percentile25[monteCarloData.percentile25.length - 1],
      p75: monteCarloData.percentile75[monteCarloData.percentile75.length - 1],
    } : null;

    const profileFinal = profileProjection?.expectedNetWorth ?? null;

    return { lastMC, profileFinal };
  }, [monteCarloData, profileProjection]);

  if (currentNetWorth === null) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5" />
            Wealth Projection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Add entries to see projections
          </div>
        </CardContent>
      </Card>
    );
  }

  const scenario = projectionScenarios[selectedScenario];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Target className="h-5 w-5" />
          Wealth Projection ({projectionYears} Years)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controls */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Label htmlFor="years" className="text-sm whitespace-nowrap">Projection:</Label>
            <Select
              value={projectionYears.toString()}
              onValueChange={(v) => setProjectionYears(parseInt(v))}
            >
              <SelectTrigger className="w-[100px]" id="years">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 years</SelectItem>
                <SelectItem value="10">10 years</SelectItem>
                <SelectItem value="15">15 years</SelectItem>
                <SelectItem value="20">20 years</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {profile && (
            <>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="showProfile"
                  checked={showProfileLine}
                  onCheckedChange={(checked) => setShowProfileLine(checked === true)}
                />
                <Label htmlFor="showProfile" className="text-sm cursor-pointer">
                  Show career projection
                </Label>
              </div>

              {showProfileLine && (
                <div className="flex items-center gap-2">
                  <Label htmlFor="scenario" className="text-sm whitespace-nowrap">Scenario:</Label>
                  <Select value={selectedScenario} onValueChange={setSelectedScenario}>
                    <SelectTrigger className="w-[140px]" id="scenario">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(projectionScenarios).map(([key, s]) => (
                        <SelectItem key={key} value={key}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <UITooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{scenario.description}</p>
                    </TooltipContent>
                  </UITooltip>
                </div>
              )}
            </>
          )}
        </div>

        {/* Chart */}
        {chartData.length > 0 ? (
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="mcGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="profileGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickFormatter={(v) => formatCompact(v)}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  width={60}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number, name: string) => {
                    const labels: Record<string, string> = {
                      mc95: '95th %ile (historical)',
                      mc75: '75th %ile',
                      mc50: 'Median (historical)',
                      mc25: '25th %ile',
                      mc5: '5th %ile',
                      profile: 'Career projection',
                    };
                    return [formatCurrency(value), labels[name] || name];
                  }}
                  labelFormatter={(label, payload) => {
                    const item = payload?.[0]?.payload;
                    if (item?.income) {
                      return `${label} (Income: ${formatCurrency(item.income)}/yr)`;
                    }
                    return label;
                  }}
                />

                {/* Monte Carlo bands */}
                {monteCarloData && (
                  <>
                    <Area
                      type="monotone"
                      dataKey="mc95"
                      stroke="#6366f1"
                      fill="none"
                      strokeWidth={1}
                      strokeDasharray="3 3"
                      strokeOpacity={0.5}
                    />
                    <Area
                      type="monotone"
                      dataKey="mc75"
                      stroke="#6366f1"
                      fill="url(#mcGradient)"
                      strokeWidth={1}
                      strokeOpacity={0.7}
                    />
                    <Area
                      type="monotone"
                      dataKey="mc50"
                      stroke="#6366f1"
                      fill="none"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="mc25"
                      stroke="#6366f1"
                      fill="none"
                      strokeWidth={1}
                      strokeOpacity={0.7}
                    />
                    <Area
                      type="monotone"
                      dataKey="mc5"
                      stroke="#6366f1"
                      fill="none"
                      strokeWidth={1}
                      strokeDasharray="3 3"
                      strokeOpacity={0.5}
                    />
                  </>
                )}

                {/* Profile projection line */}
                {showProfileLine && profileProjection && (
                  <Area
                    type="monotone"
                    dataKey="profile"
                    stroke="#10b981"
                    fill="url(#profileGradient)"
                    strokeWidth={2.5}
                  />
                )}

                {/* Current net worth reference */}
                <ReferenceLine
                  y={currentNetWorth}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="5 5"
                  strokeOpacity={0.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[350px] flex items-center justify-center text-muted-foreground text-sm">
            {!profile ? 'Complete your profile to see career-based projections' : 'Insufficient data for projection'}
          </div>
        )}

        {/* Legend and summary */}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground justify-center pt-2 border-t">
          {monteCarloData && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-indigo-500" />
              <span>Historical pace (Monte Carlo)</span>
            </div>
          )}
          {showProfileLine && profileProjection && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-emerald-500" />
              <span>Career projection ({scenario.name})</span>
            </div>
          )}
        </div>

        {/* Final values summary */}
        {(finalValues.lastMC || finalValues.profileFinal) && (
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            {finalValues.lastMC && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Historical pace (median)</p>
                <p className="text-lg font-semibold">{formatCompact(finalValues.lastMC.p50)}</p>
                <p className="text-xs text-muted-foreground">
                  Range: {formatCompact(finalValues.lastMC.p25)} - {formatCompact(finalValues.lastMC.p75)}
                </p>
              </div>
            )}
            {finalValues.profileFinal && showProfileLine && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Career projection</p>
                <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatCompact(finalValues.profileFinal)}
                </p>
                <p className="text-xs text-muted-foreground">
                  at age {profile!.age + projectionYears}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
