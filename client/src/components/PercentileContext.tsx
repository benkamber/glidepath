import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { UserProfile } from '@/hooks/use-user-profile';
import { getPercentileForAge } from '@/data/scf-data';
import { modelExpectedWealth, getComparisonDescription } from '@/models/wealth-model';

interface PercentileContextProps {
  currentNetWorth: number | null;
  profile: UserProfile | null;
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

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function PercentileContext({ currentNetWorth, profile }: PercentileContextProps) {
  // Calculate SCF percentile based on age only
  const scfPercentile = useMemo(() => {
    if (currentNetWorth === null || !profile?.age) return null;
    return getPercentileForAge(currentNetWorth, profile.age);
  }, [currentNetWorth, profile?.age]);

  // Calculate expected wealth based on full profile
  const wealthModel = useMemo(() => {
    if (!profile || !profile.age || !profile.occupation || !profile.metro) return null;

    return modelExpectedWealth({
      currentAge: profile.age,
      startAge: profile.age - profile.yearsInWorkforce,
      occupation: profile.occupation,
      level: profile.level,
      metro: profile.metro,
      savingsRate: profile.savingsRate,
      currentNetWorth: currentNetWorth ?? undefined,
    });
  }, [profile, currentNetWorth]);

  // No net worth data
  if (currentNetWorth === null) {
    return (
      <Card className="bg-muted/30">
        <CardContent className="py-6">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">Add your first entry to see how you compare</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Only age is known
  if (!profile || !profile.occupation || !profile.metro) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="space-y-4">
            {scfPercentile !== null && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">National percentile for your age</p>
                <p className="text-4xl font-bold tracking-tight">
                  {getOrdinalSuffix(scfPercentile)}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Based on Federal Reserve SCF 2022
                </p>
              </div>
            )}
            <p className="text-sm text-center text-amber-600 dark:text-amber-400">
              Complete your profile for personalized insights
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full profile available
  const comparison = wealthModel?.comparison;
  const isAhead = comparison?.isAhead ?? false;
  const delta = comparison?.delta ?? 0;
  const deltaPercent = comparison?.deltaPercent ?? 0;

  return (
    <Card>
      <CardContent className="py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* National Percentile */}
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-1">
              <p className="text-sm text-muted-foreground">National percentile</p>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Your net worth compared to all Americans in your age group</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-4xl font-bold tracking-tight">
              {getOrdinalSuffix(scfPercentile ?? 50)}
            </p>
            <p className="text-xs text-muted-foreground">
              for age {profile.age}
            </p>
          </div>

          {/* Expected for Profile */}
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-1">
              <p className="text-sm text-muted-foreground">Expected for profile</p>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    Expected net worth for a {profile.level} {profile.occupation.replace('_', ' ')} in {profile.metro.replace('_', ' ')} saving {Math.round(profile.savingsRate * 100)}% since age {profile.age - profile.yearsInWorkforce}
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-3xl font-semibold tracking-tight">
              {formatCompact(wealthModel?.expectedNetWorth ?? 0)}
            </p>
            <p className="text-xs text-muted-foreground">
              at {Math.round(profile.savingsRate * 100)}% savings rate
            </p>
          </div>

          {/* Delta */}
          <div className="text-center space-y-1">
            <p className="text-sm text-muted-foreground">vs. expected</p>
            <div className="flex items-center justify-center gap-2">
              {Math.abs(deltaPercent) < 0.05 ? (
                <Minus className="h-6 w-6 text-muted-foreground" />
              ) : isAhead ? (
                <TrendingUp className="h-6 w-6 text-emerald-500" />
              ) : (
                <TrendingDown className="h-6 w-6 text-amber-500" />
              )}
              <p
                className={`text-3xl font-semibold tracking-tight ${
                  Math.abs(deltaPercent) < 0.05
                    ? 'text-muted-foreground'
                    : isAhead
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {delta >= 0 ? '+' : ''}{formatCompact(delta)}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              {getComparisonDescription(comparison)}
            </p>
          </div>
        </div>

        {/* Footnote */}
        <p className="text-xs text-muted-foreground text-center mt-4 pt-4 border-t">
          Based on Federal Reserve SCF 2022 + BLS OES 2023 wage data
        </p>
      </CardContent>
    </Card>
  );
}
