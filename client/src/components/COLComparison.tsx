import { useMemo, useState } from 'react';
import { ArrowRight, TrendingUp, Home, DollarSign, MapPin } from 'lucide-react';
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
import {
  getWageEstimate,
  metroLabels,
  metroData,
  type Occupation,
  type CareerLevel,
  type Metro,
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
          {displayResults.map((metro) => {
            const savingsImprovement = metro.savingsDelta;
            const isPositive = savingsImprovement > 0;

            return (
              <div
                key={metro.metro}
                className="p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{metro.label}</span>
                    <span className="text-xs text-muted-foreground">
                      COL: {metro.colIndex}
                    </span>
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
                    <span className="text-muted-foreground">TC: </span>
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
                {analysis.currentData && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>10yr NW:</span>
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          metro.projectedNW10yr >= (analysis.currentData.projectedNW10yr * 0.95)
                            ? 'bg-emerald-500'
                            : 'bg-amber-500'
                        }`}
                        style={{
                          width: `${Math.min(100, (metro.projectedNW10yr / Math.max(analysis.currentData.projectedNW10yr, 1)) * 100)}%`
                        }}
                      />
                    </div>
                    <span className="font-medium">{formatCompact(metro.projectedNW10yr)}</span>
                  </div>
                )}
              </div>
            );
          })}
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
