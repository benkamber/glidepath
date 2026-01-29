import { useMemo, useState } from 'react';
import { ArrowRight, TrendingUp, Home, DollarSign, MapPin, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  getWageEstimate,
  metroLabels,
  metroData,
  type Occupation,
  type CareerLevel,
  type Metro,
  getCOLMultiplier,
} from '@/data/bls-wage-data';
import { projectFutureWealth } from '@/models/wealth-model';

interface COLComparisonProps {
  currentMetro: Metro;
  currentSalary: number;
  currentNetWorth: number;
  age: number;
  occupation: Occupation;
  level: CareerLevel;
  savingsRate: number;
}

type SortMode = 'savings' | 'fire' | 'col';

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

interface MetroAnalysis {
  metro: Metro;
  label: string;
  totalComp: number;
  afterTaxComp: number;
  takeHomePay: number;
  annualSavings: number;
  savingsDelta: number;
  colIndex: number;
  medianRent: number;
  medianHome: number;
  taxBurden: number;
  yearsToFIRE: number | null;
  projectedNW10yr: number;
}

export function COLComparison({
  currentMetro,
  currentSalary,
  currentNetWorth,
  age,
  occupation,
  level,
  savingsRate,
}: COLComparisonProps) {
  const [sortBy, setSortBy] = useState<SortMode>('savings');
  const [showAll, setShowAll] = useState(false);
  const [expandedMetro, setExpandedMetro] = useState<Metro | null>(null);

  // Analyze all metros
  const analysis = useMemo(() => {
    const allMetros = Object.keys(metroLabels) as Metro[];
    const currentEstimate = getWageEstimate(occupation, level, currentMetro);
    const currentAnnualSavings = currentEstimate.afterTaxComp * savingsRate;

    const fireTarget = currentEstimate.afterTaxComp * (1 - savingsRate) * 25;

    const results: MetroAnalysis[] = allMetros
      .filter(m => m !== 'other' && m !== 'remote')
      .map(metro => {
        const estimate = getWageEstimate(occupation, level, metro);
        const data = metroData[metro];
        const annualSavings = estimate.afterTaxComp * savingsRate;
        const savingsDelta = annualSavings - currentAnnualSavings;

        // Calculate years to FIRE in this metro
        const annualExpenses = estimate.afterTaxComp * (1 - savingsRate);
        const fireAmount = annualExpenses * 25;
        let yearsToFIRE: number | null = null;

        if (annualSavings > 0) {
          let wealth = currentNetWorth;
          let years = 0;
          while (wealth < fireAmount && years < 100) {
            wealth = wealth * 1.07 + annualSavings;
            years++;
          }
          yearsToFIRE = years < 100 ? years : null;
        }

        // 10-year projection
        const projection = projectFutureWealth(
          {
            currentAge: age,
            startAge: age - 10,
            occupation,
            level,
            metro,
            savingsRate,
            currentNetWorth,
          },
          age + 10
        );

        return {
          metro,
          label: metroLabels[metro],
          totalComp: estimate.totalComp,
          afterTaxComp: estimate.afterTaxComp,
          takeHomePay: estimate.takeHomePay,
          annualSavings,
          savingsDelta,
          colIndex: data.colIndex,
          medianRent: data.medianRent,
          medianHome: data.medianHome,
          taxBurden: data.taxBurden,
          yearsToFIRE,
          projectedNW10yr: projection.expectedNetWorth,
        };
      });

    // Sort
    switch (sortBy) {
      case 'savings':
        results.sort((a, b) => b.annualSavings - a.annualSavings);
        break;
      case 'fire':
        results.sort((a, b) => {
          if (a.yearsToFIRE === null && b.yearsToFIRE === null) return 0;
          if (a.yearsToFIRE === null) return 1;
          if (b.yearsToFIRE === null) return -1;
          return a.yearsToFIRE - b.yearsToFIRE;
        });
        break;
      case 'col':
        results.sort((a, b) => a.colIndex - b.colIndex);
        break;
    }

    const currentData = results.find(r => r.metro === currentMetro);

    return { results, currentData, currentAnnualSavings, fireTarget };
  }, [currentMetro, occupation, level, savingsRate, age, currentNetWorth, sortBy]);

  const displayResults = showAll
    ? analysis.results.filter(r => r.metro !== currentMetro)
    : analysis.results.filter(r => r.metro !== currentMetro).slice(0, 8);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin className="h-5 w-5" />
          Geographic Arbitrage: What If I Moved?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Location Card */}
        {analysis.currentData && (
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-3">
              <Home className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Current: {analysis.currentData.label}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Total Comp</p>
                <p className="font-medium">{formatCompact(analysis.currentData.totalComp)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Annual Savings</p>
                <p className="font-medium">{formatCompact(analysis.currentData.annualSavings)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">COL Index</p>
                <p className="font-medium">{analysis.currentData.colIndex}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Years to FIRE</p>
                <p className="font-medium">
                  {analysis.currentData.yearsToFIRE !== null
                    ? `${analysis.currentData.yearsToFIRE} yrs`
                    : '100+'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Sort Control */}
        <div className="flex items-center gap-2">
          <Label className="text-sm whitespace-nowrap">Sort by:</Label>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortMode)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="savings">Annual Savings</SelectItem>
              <SelectItem value="fire">Years to FIRE</SelectItem>
              <SelectItem value="col">Cost of Living</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Metro Comparisons */}
        <div className="space-y-3">
          {displayResults.map((metro) => (
            <MetroCard
              key={metro.metro}
              metro={metro}
              currentData={analysis.currentData!}
              currentNetWorth={currentNetWorth}
              age={age}
              occupation={occupation}
              level={level}
              savingsRate={savingsRate}
              currentMetro={currentMetro}
              isExpanded={expandedMetro === metro.metro}
              onToggleExpand={() => setExpandedMetro(expandedMetro === metro.metro ? null : metro.metro)}
            />
          ))}
        </div>

        {/* Show more */}
        {!showAll && analysis.results.filter(r => r.metro !== currentMetro).length > 8 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAll(true)}
            className="w-full"
          >
            Show all {analysis.results.filter(r => r.metro !== currentMetro).length} metros
          </Button>
        )}

        {/* Footer */}
        <p className="text-xs text-muted-foreground text-center pt-2 border-t">
          Estimates use BLS wage data with tech hub premiums. Actual compensation varies by company.
          Tax rates are simplified effective rates.
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Expandable Metro Card with Historical/Prospective Analysis
 */
interface MetroCardProps {
  metro: MetroAnalysis;
  currentData: MetroAnalysis;
  currentNetWorth: number;
  age: number;
  occupation: Occupation;
  level: CareerLevel;
  savingsRate: number;
  currentMetro: Metro;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

function MetroCard({
  metro,
  currentData,
  currentNetWorth,
  age,
  occupation,
  level,
  savingsRate,
  currentMetro,
  isExpanded,
  onToggleExpand,
}: MetroCardProps) {
  const [historicalYears, setHistoricalYears] = useState(5);
  const [futureYears, setFutureYears] = useState(10);
  const [showMath, setShowMath] = useState(false);

  const savingsImprovement = metro.savingsDelta;
  const isPositive = savingsImprovement > 0;

  // Calculate historical "what-if"
  const historicalAnalysis = useMemo(() => {
    const currentCOL = getCOLMultiplier(currentMetro);
    const targetCOL = getCOLMultiplier(metro.metro);
    const colRatio = targetCOL / currentCOL;

    const currentWage = getWageEstimate(occupation, level, currentMetro);
    const targetWage = getWageEstimate(occupation, level, metro.metro);
    const wageDelta = targetWage.afterTaxComp - currentWage.afterTaxComp;

    // Simplified: assume expenses scale with COL, income is absolute
    const annualIncomeDelta = wageDelta;
    const currentExpenses = currentWage.afterTaxComp * (1 - savingsRate);
    const targetExpenses = currentExpenses * colRatio;
    const expensesDelta = targetExpenses - currentExpenses;
    const netSavingsDelta = annualIncomeDelta - expensesDelta;

    // Project backwards
    const totalDelta = netSavingsDelta * historicalYears;
    // Assume 7% growth on difference
    const compoundedDelta = netSavingsDelta * (((1 + 0.07) ** historicalYears - 1) / 0.07);

    const adjustedNW = currentNetWorth + compoundedDelta;
    const delta = adjustedNW - currentNetWorth;
    const deltaPercent = currentNetWorth > 0 ? (delta / currentNetWorth) * 100 : 0;

    return {
      adjustedNetWorth: adjustedNW,
      delta,
      deltaPercent,
      breakdown: {
        incomeDelta: annualIncomeDelta,
        expensesDelta,
        netSavingsDelta,
      },
    };
  }, [metro.metro, currentMetro, occupation, level, savingsRate, historicalYears, currentNetWorth]);

  // Calculate prospective future
  const prospectiveAnalysis = useMemo(() => {
    const targetProjection = projectFutureWealth(
      {
        currentAge: age,
        startAge: age - 10, // Assume 10 years in workforce
        occupation,
        level,
        metro: metro.metro,
        savingsRate,
      },
      currentNetWorth,
      futureYears
    );

    const currentProjection = projectFutureWealth(
      {
        currentAge: age,
        startAge: age - 10,
        occupation,
        level,
        metro: currentMetro,
        savingsRate,
      },
      currentNetWorth,
      futureYears
    );

    const targetFinal = targetProjection.yearByYear[targetProjection.yearByYear.length - 1];
    const currentFinal = currentProjection.yearByYear[currentProjection.yearByYear.length - 1];

    const delta = targetFinal.expectedNW - currentFinal.expectedNW;
    const deltaPercent = currentFinal.expectedNW > 0
      ? (delta / currentFinal.expectedNW) * 100
      : 0;

    // Calculate years to FIRE in each location
    const targetExpenses = targetFinal.income * (1 - savingsRate);
    const targetFIRE = targetExpenses * 25;
    const yearsToFIRE = Math.max(0, (targetFIRE - targetFinal.expectedNW) / (targetFinal.income * savingsRate));

    const currentExpenses = currentFinal.income * (1 - savingsRate);
    const currentFIRE = currentExpenses * 25;
    const currentYearsToFIRE = Math.max(0, (currentFIRE - currentFinal.expectedNW) / (currentFinal.income * savingsRate));

    const fireTimeDelta = currentYearsToFIRE - yearsToFIRE;

    return {
      projectedNW: targetFinal.expectedNW,
      currentProjectedNW: currentFinal.expectedNW,
      delta,
      deltaPercent,
      yearsToFIRE: Math.round(yearsToFIRE),
      fireTimeDelta: Math.round(fireTimeDelta),
    };
  }, [metro.metro, currentMetro, occupation, level, savingsRate, age, currentNetWorth, futureYears]);

  return (
    <div className="rounded-lg border bg-card">
      {/* Collapsed View */}
      <div
        className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={onToggleExpand}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{metro.label}</span>
            <span className="text-xs text-muted-foreground">
              COL: {metro.colIndex}x
            </span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <span
            className={`text-sm font-semibold ${
              isPositive
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {isPositive ? '+' : ''}{formatCompact(savingsImprovement)}/yr
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">Salary: </span>
            <span className="font-medium">{formatCompact(metro.totalComp)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Saves: </span>
            <span className="font-medium">{formatCompact(metro.annualSavings)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">FIRE: </span>
            <span className="font-medium">
              {metro.yearsToFIRE !== null ? `${metro.yearsToFIRE} yrs` : 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Rent: </span>
            <span className="font-medium">{formatCurrency(metro.medianRent)}/mo</span>
          </div>
        </div>

        {/* Comparison bar */}
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <span>10yr NW:</span>
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                metro.projectedNW10yr >= (currentData.projectedNW10yr * 0.95)
                  ? 'bg-emerald-500'
                  : 'bg-amber-500'
              }`}
              style={{
                width: `${Math.min(100, (metro.projectedNW10yr / Math.max(currentData.projectedNW10yr, 1)) * 100)}%`
              }}
            />
          </div>
          <span className="font-medium">{formatCompact(metro.projectedNW10yr)}</span>
        </div>
      </div>

      {/* Expanded View */}
      {isExpanded && (
        <div className="border-t bg-muted/10 p-4 space-y-4">
          {/* Historical "What-If" */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              📊 Historical "What-If" (Last {historicalYears} years)
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Label className="text-xs whitespace-nowrap">Years back:</Label>
                <Slider
                  value={[historicalYears]}
                  onValueChange={(v) => setHistoricalYears(v[0])}
                  min={1}
                  max={10}
                  step={1}
                  className="flex-1"
                />
                <span className="text-xs font-mono w-8 text-right">{historicalYears}y</span>
              </div>

              <div className="p-3 rounded-md bg-card border space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Net worth would be:</span>
                  <span className="font-semibold">
                    {formatCompact(historicalAnalysis.adjustedNetWorth)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-semibold">
                  <span>Delta:</span>
                  <span className={historicalAnalysis.delta > 0 ? 'text-emerald-500' : 'text-red-500'}>
                    {historicalAnalysis.delta > 0 ? '+' : ''}
                    {formatCompact(historicalAnalysis.delta)}
                    ({historicalAnalysis.deltaPercent > 0 ? '+' : ''}
                    {historicalAnalysis.deltaPercent.toFixed(1)}%)
                  </span>
                </div>

                <div className="pt-2 border-t space-y-1 text-xs text-muted-foreground">
                  <p>• Higher salary: {historicalAnalysis.breakdown.incomeDelta > 0 ? '+' : ''}
                    {formatCompact(historicalAnalysis.breakdown.incomeDelta)}/yr</p>
                  <p>• COL adjustment: {historicalAnalysis.breakdown.expensesDelta > 0 ? '+' : ''}
                    {formatCompact(historicalAnalysis.breakdown.expensesDelta)}/yr</p>
                  <p>• Net benefit: {historicalAnalysis.breakdown.netSavingsDelta > 0 ? '+' : ''}
                    {formatCompact(historicalAnalysis.breakdown.netSavingsDelta)}/yr</p>
                </div>
              </div>
            </div>
          </div>

          {/* Future Projection */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              🔮 Future Projection (Next {futureYears} years)
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Label className="text-xs whitespace-nowrap">Years forward:</Label>
                <Slider
                  value={[futureYears]}
                  onValueChange={(v) => setFutureYears(v[0])}
                  min={5}
                  max={20}
                  step={1}
                  className="flex-1"
                />
                <span className="text-xs font-mono w-8 text-right">{futureYears}y</span>
              </div>

              <div className="p-3 rounded-md bg-card border space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Projected NW:</span>
                  <span className="font-semibold">{formatCompact(prospectiveAnalysis.projectedNW)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current location:</span>
                  <span className="font-semibold">{formatCompact(prospectiveAnalysis.currentProjectedNW)}</span>
                </div>
                <div className="flex justify-between text-base font-semibold">
                  <span>Delta:</span>
                  <span className={prospectiveAnalysis.delta > 0 ? 'text-emerald-500' : 'text-red-500'}>
                    {prospectiveAnalysis.delta > 0 ? '+' : ''}
                    {formatCompact(prospectiveAnalysis.delta)}
                    ({prospectiveAnalysis.deltaPercent > 0 ? '+' : ''}
                    {prospectiveAnalysis.deltaPercent.toFixed(1)}%)
                  </span>
                </div>

                <div className="pt-2 border-t space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">FIRE date ({metro.label}):</span>
                    <span className="font-medium">
                      {prospectiveAnalysis.yearsToFIRE} years
                      ({age + prospectiveAnalysis.yearsToFIRE})
                    </span>
                  </div>
                  {prospectiveAnalysis.fireTimeDelta !== 0 && (
                    <p className={prospectiveAnalysis.fireTimeDelta > 0 ? 'text-emerald-500' : 'text-amber-500'}>
                      {prospectiveAnalysis.fireTimeDelta > 0 ? '✓' : '•'} FIRE{' '}
                      {Math.abs(prospectiveAnalysis.fireTimeDelta)} years{' '}
                      {prospectiveAnalysis.fireTimeDelta > 0 ? 'faster' : 'slower'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Show Math */}
          <div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMath(!showMath);
              }}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              {showMath ? '▼' : '▶'} Show Math
            </button>

            {showMath && (
              <div className="mt-2 p-3 rounded-md bg-card border space-y-2 text-xs">
                <div className="space-y-1">
                  <p className="font-semibold">Salary Estimates:</p>
                  <p className="text-muted-foreground">
                    Current ({currentData.label}): {formatCurrency(currentData.totalComp)}/yr
                  </p>
                  <p className="text-muted-foreground">
                    {metro.label}: {formatCurrency(metro.totalComp)}/yr
                  </p>
                  <p className="text-muted-foreground">
                    Source: BLS OES data + metro wage multipliers
                  </p>
                </div>

                <div className="space-y-1 pt-2 border-t">
                  <p className="font-semibold">Cost of Living:</p>
                  <p className="text-muted-foreground">
                    Current COL: {currentData.colIndex}x | {metro.label} COL: {metro.colIndex}x
                  </p>
                  <p className="text-muted-foreground">
                    Median rent: {formatCurrency(metro.medianRent)}/mo
                  </p>
                </div>

                <div className="space-y-1 pt-2 border-t">
                  <p className="font-semibold">Assumptions:</p>
                  <p className="text-muted-foreground">✓ 7% real investment returns</p>
                  <p className="text-muted-foreground">✓ Career progression unchanged</p>
                  <p className="text-muted-foreground">✓ Savings rate: {(savingsRate * 100).toFixed(0)}%</p>
                  <p className="text-muted-foreground">✓ Expenses scale with COL</p>
                  <p className="text-muted-foreground">⚠ Taxes simplified</p>
                  <p className="text-muted-foreground">⚠ Real estate not included</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
