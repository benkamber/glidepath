import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { InternationalCity } from '@/data/international-cities';

interface SimpleCityCardProps {
  city: InternationalCity | {
    id: string;
    name: string;
    flag: string;
    salaryMultiplier: number;
    colMultiplier: number;
  };
  currentSalary: number;
  currentNetWorth: number;
  yearsOfData: number;
  onCalculate: (cityId: string, type: 'retrospective' | 'prospective', years: number) => {
    adjustedNetWorth: number;
    delta: number;
  };
}

export function SimpleCityCard({
  city,
  currentSalary,
  currentNetWorth,
  yearsOfData,
  onCalculate,
}: SimpleCityCardProps) {
  const [retrospectiveYears, setRetrospectiveYears] = useState(Math.min(5, yearsOfData));
  const [prospectiveYears, setProspectiveYears] = useState(10);
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate salary for this city
  const cityMetrics = useMemo(() => {
    const citySalary = currentSalary * city.salaryMultiplier;
    const salaryDelta = citySalary - currentSalary;
    const salaryDeltaPercent = ((salaryDelta / currentSalary) * 100).toFixed(0);

    return {
      salary: citySalary,
      salaryDelta,
      salaryDeltaPercent: parseInt(salaryDeltaPercent),
      colDescription: city.colMultiplier > 1.8 ? 'Very High' :
                      city.colMultiplier > 1.4 ? 'High' :
                      city.colMultiplier > 1.0 ? 'Moderate' :
                      city.colMultiplier > 0.7 ? 'Low' : 'Very Low',
    };
  }, [city, currentSalary]);

  // Calculate retrospective impact
  const retrospectiveImpact = useMemo(() => {
    if (yearsOfData === 0 || retrospectiveYears === 0) return null;
    return onCalculate(city.id, 'retrospective', retrospectiveYears);
  }, [city.id, retrospectiveYears, yearsOfData, onCalculate]);

  // Calculate prospective impact
  const prospectiveImpact = useMemo(() => {
    if (prospectiveYears === 0) return null;
    return onCalculate(city.id, 'prospective', prospectiveYears);
  }, [city.id, prospectiveYears, onCalculate]);

  const formatCurrency = (value: number) => {
    const absValue = Math.abs(value);
    if (absValue >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (absValue >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardHeader className="pb-3 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{city.flag}</span>
            <span>{city.name}</span>
          </div>
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </CardTitle>
        <div className="flex gap-2 text-xs text-muted-foreground">
          <span>
            Salary: {formatCurrency(cityMetrics.salary)}
            {cityMetrics.salaryDeltaPercent !== 0 && (
              <span className={cityMetrics.salaryDeltaPercent > 0 ? 'text-green-600' : 'text-red-600'}>
                {' '}({cityMetrics.salaryDeltaPercent > 0 ? '+' : ''}{cityMetrics.salaryDeltaPercent}%)
              </span>
            )}
          </span>
          <span>•</span>
          <span>COL: {city.colMultiplier.toFixed(1)}x ({cityMetrics.colDescription})</span>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6 pt-0">
          {/* Retrospective Slider */}
          {yearsOfData > 0 && (
            <div className="space-y-3 pb-4 border-b">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">📍 Last N Years</span>
                <Badge variant="secondary">{retrospectiveYears} years</Badge>
              </div>
              <Slider
                min={1}
                max={Math.min(10, yearsOfData)}
                step={1}
                value={[retrospectiveYears]}
                onValueChange={([value]) => setRetrospectiveYears(value)}
                className="w-full"
              />
              {retrospectiveImpact && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Would have:</span>
                    <span className="font-semibold">{formatCurrency(retrospectiveImpact.adjustedNetWorth)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">vs actual:</span>
                    <span>{formatCurrency(currentNetWorth)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Delta:</span>
                    <span className={`font-semibold ${
                      retrospectiveImpact.delta >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {retrospectiveImpact.delta >= 0 ? '+' : ''}{formatCurrency(retrospectiveImpact.delta)}
                      {retrospectiveImpact.delta >= 0 ? ' ✅' : ' ❌'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Prospective Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">🔮 Next Y Years</span>
              <Badge variant="secondary">{prospectiveYears} years</Badge>
            </div>
            <Slider
              min={1}
              max={20}
              step={1}
              value={[prospectiveYears]}
              onValueChange={([value]) => setProspectiveYears(value)}
              className="w-full"
            />
            {prospectiveImpact && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Will have:</span>
                  <span className="font-semibold">{formatCurrency(prospectiveImpact.adjustedNetWorth)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">vs staying:</span>
                  <span>{formatCurrency(currentNetWorth)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Delta:</span>
                  <span className={`font-semibold ${
                    prospectiveImpact.delta >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {prospectiveImpact.delta >= 0 ? '+' : ''}{formatCurrency(prospectiveImpact.delta)}
                    {prospectiveImpact.delta >= 0 ? ' ✅' : ' ❌'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
