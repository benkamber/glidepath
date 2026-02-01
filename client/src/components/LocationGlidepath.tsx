import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { projectAllTiers, getMetroTier, type TierProjection } from '@/lib/location-glidepath';
import { LOCATION_TIERS } from '@/lib/location-tiers';
import { MapPin } from 'lucide-react';

interface LocationGlidepathProps {
  currentNetWorth: number;
  currentAge: number;
  annualIncome: number;
  currentMetro: string;
  currentSavingsRate: number; // 0-1
}

const formatCurrency = (value: number) => {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}k`;
  return `$${value.toFixed(0)}`;
};

export function LocationGlidepath({
  currentNetWorth,
  currentAge,
  annualIncome,
  currentMetro,
  currentSavingsRate,
}: LocationGlidepathProps) {
  const [savingsRate, setSavingsRate] = useState(Math.round(currentSavingsRate * 100));
  const [expectedReturn, setExpectedReturn] = useState(7);
  const [withdrawalRate, setWithdrawalRate] = useState(4);
  const [isRemote, setIsRemote] = useState(true);

  const currentTier = getMetroTier(currentMetro);

  const projections = useMemo(() => {
    return projectAllTiers({
      currentNetWorth,
      currentAge,
      annualIncome,
      currentMetro,
      savingsRatePercent: savingsRate,
      expectedReturn: expectedReturn / 100,
      withdrawalRate: withdrawalRate / 100,
      incomeAdjustByLocation: !isRemote,
    });
  }, [currentNetWorth, currentAge, annualIncome, currentMetro, savingsRate, expectedReturn, withdrawalRate, isRemote]);

  // Build chart data: one row per year, with a net worth column per tier
  const chartData = useMemo(() => {
    const maxYear = 50;
    const rows: any[] = [];
    for (let y = 0; y <= maxYear; y++) {
      const row: any = { year: y, age: currentAge + y };
      for (const proj of projections) {
        const pt = proj.yearByYear[y];
        if (pt) row[`tier${proj.tier.tier}`] = pt.netWorth;
      }
      rows.push(row);
    }
    return rows;
  }, [projections, currentAge]);

  // Best delta (fastest improvement over current)
  const bestDelta = projections.reduce((best, p) =>
    p.deltaFromCurrent > best.deltaFromCurrent ? p : best,
    projections[0],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin className="h-5 w-5" />
          Location FIRE Glidepath
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          How does city cost-of-living affect your path to financial independence?
          Each line shows your wealth trajectory if you lived at that cost tier.
        </p>

        {/* Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-muted/30 rounded-lg border border-primary/20">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Savings Rate</Label>
              <span className="text-sm font-mono">{savingsRate}%</span>
            </div>
            <Slider
              value={[savingsRate]}
              onValueChange={(v) => setSavingsRate(v[0])}
              min={5}
              max={70}
              step={1}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Expected Return</Label>
              <span className="text-sm font-mono">{expectedReturn}%</span>
            </div>
            <Slider
              value={[expectedReturn]}
              onValueChange={(v) => setExpectedReturn(v[0])}
              min={3}
              max={10}
              step={1}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Withdrawal Rate</Label>
              <span className="text-sm font-mono">{withdrawalRate}%</span>
            </div>
            <Slider
              value={[withdrawalRate]}
              onValueChange={(v) => setWithdrawalRate(v[0])}
              min={2}
              max={5}
              step={0.5}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="remote-toggle" className="text-sm cursor-pointer">
              Remote work (keep full income)
            </Label>
            <Switch
              id="remote-toggle"
              checked={isRemote}
              onCheckedChange={setIsRemote}
            />
          </div>
        </div>

        {/* Current location badge */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            Your location: <span style={{ color: currentTier.color }} className="font-semibold">{currentTier.label}</span>
          </Badge>
          {!isRemote && (
            <Badge variant="secondary" className="text-xs">
              Income adjusts by location
            </Badge>
          )}
        </div>

        {/* Chart */}
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="age"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(v) => `${v}`}
                label={{ value: 'Age', position: 'insideBottom', offset: -5, fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
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
                formatter={(value: number, name: string) => {
                  const tierNum = parseInt(name.replace('tier', ''));
                  const tier = LOCATION_TIERS.find(t => t.tier === tierNum);
                  return [formatCurrency(value), tier?.label || name];
                }}
                labelFormatter={(age) => `Age ${age}`}
              />

              {/* FIRE threshold reference lines per tier */}
              {projections.map(p => (
                <ReferenceLine
                  key={`fire-${p.tier.tier}`}
                  y={p.fireNumber}
                  stroke={p.tier.color}
                  strokeDasharray="4 4"
                  strokeOpacity={0.4}
                />
              ))}

              {/* Tier lines */}
              {LOCATION_TIERS.map(tier => (
                <Line
                  key={tier.tier}
                  type="monotone"
                  dataKey={`tier${tier.tier}`}
                  stroke={tier.color}
                  strokeWidth={tier.tier === currentTier.tier ? 3 : 1.5}
                  strokeDasharray={tier.tier === currentTier.tier ? undefined : '6 3'}
                  dot={false}
                  name={`tier${tier.tier}`}
                  connectNulls={false}
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Summary table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-2 font-medium">Tier</th>
                <th className="text-right py-2 px-2 font-medium">Monthly</th>
                <th className="text-right py-2 px-2 font-medium">FIRE #</th>
                <th className="text-right py-2 px-2 font-medium">Years</th>
                <th className="text-right py-2 px-2 font-medium">vs You</th>
                <th className="text-left py-2 px-2 font-medium">Example Cities</th>
              </tr>
            </thead>
            <tbody>
              {projections.map(p => {
                const isCurrent = p.tier.tier === currentTier.tier;
                return (
                  <tr
                    key={p.tier.tier}
                    className={`border-b border-border/50 ${isCurrent ? 'bg-primary/5' : ''}`}
                  >
                    <td className="py-2 px-2">
                      <span className="flex items-center gap-2">
                        <span
                          className="inline-block w-3 h-3 rounded-full"
                          style={{ backgroundColor: p.tier.color }}
                        />
                        <span className={isCurrent ? 'font-semibold' : ''}>
                          {p.tier.name.charAt(0).toUpperCase() + p.tier.name.slice(1)}
                        </span>
                        {isCurrent && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0">YOU</Badge>
                        )}
                      </span>
                    </td>
                    <td className="text-right py-2 px-2 font-mono">
                      ${p.tier.monthlyExpenses.toLocaleString()}
                    </td>
                    <td className="text-right py-2 px-2 font-mono">
                      {formatCurrency(p.fireNumber)}
                    </td>
                    <td className="text-right py-2 px-2 font-mono">
                      {p.yearsToFIRE >= 99 ? '99+' : p.yearsToFIRE}
                    </td>
                    <td className={`text-right py-2 px-2 font-mono ${
                      p.deltaFromCurrent > 0 ? 'text-emerald-600 dark:text-emerald-400' :
                      p.deltaFromCurrent < 0 ? 'text-red-600 dark:text-red-400' :
                      'text-muted-foreground'
                    }`}>
                      {isCurrent ? (
                        <span className="text-muted-foreground">--</span>
                      ) : p.deltaFromCurrent > 0 ? (
                        `${p.deltaFromCurrent}yr faster`
                      ) : p.deltaFromCurrent < 0 ? (
                        `${Math.abs(p.deltaFromCurrent)}yr slower`
                      ) : (
                        'same'
                      )}
                    </td>
                    <td className="py-2 px-2 text-muted-foreground text-xs">
                      {p.tier.exampleCities.join(', ')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Insight callout */}
        {bestDelta.deltaFromCurrent > 0 && bestDelta.tier.tier !== currentTier.tier && (
          <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
            <p className="text-sm">
              Moving from <strong>{currentTier.name}</strong> to{' '}
              <strong style={{ color: bestDelta.tier.color }}>{bestDelta.tier.name}</strong>{' '}
              cost-of-living = FIRE{' '}
              <strong className="text-emerald-600 dark:text-emerald-400">
                {bestDelta.deltaFromCurrent} years faster
              </strong>{' '}
              (age {bestDelta.fireAge} vs {projections.find(p => p.tier.tier === currentTier.tier)?.fireAge || '?'}).
            </p>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          {isRemote
            ? 'Assumes remote work: full income regardless of location.'
            : 'Income adjusts by location tier (budget=40%, affordable=60%, moderate=80%, expensive=100%, premium=115% of current income).'}
          {' '}FIRE number = annual expenses / {withdrawalRate}% SWR. Dashed lines = FIRE threshold per tier.
          Solid line = your current tier. Projections stop accumulating savings after reaching FI.
        </p>
      </CardContent>
    </Card>
  );
}
