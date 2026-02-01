import { useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { UserProfile } from '@/hooks/use-user-profile';
import { getPercentileForAge } from '@/data/scf-data';
import { modelExpectedWealth, getComparisonDescription } from '@/models/wealth-model';
import { getWageEstimate } from '@/data/bls-wage-data';

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
  // All hooks must be called before any early returns (React Rules of Hooks)
  const [showBreakdown, setShowBreakdown] = useState(false);

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
      savingsRate: (profile.savingsRate || 0.25),
      currentNetWorth: currentNetWorth ?? undefined,
    });
  }, [profile, currentNetWorth]);

  // Get wage estimate for breakdown display
  const wageEstimate = useMemo(() => {
    if (!profile?.occupation || !profile?.level || !profile?.metro) return null;
    return getWageEstimate(profile.occupation, profile.level, profile.metro);
  }, [profile?.occupation, profile?.level, profile?.metro]);

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
                    Expected net worth for a {profile.level} {profile.occupation.replace('_', ' ')} in {profile.metro.replace('_', ' ')} saving {Math.round((profile.savingsRate || 0.25) * 100)}% since age {profile.age - profile.yearsInWorkforce}
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-3xl font-semibold tracking-tight">
              {formatCompact(wealthModel?.expectedNetWorth ?? 0)}
            </p>
            <p className="text-xs text-muted-foreground">
              at {Math.round((profile.savingsRate || 0.25) * 100)}% savings rate
            </p>
          </div>

          {/* Delta */}
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-1">
              <p className="text-sm text-muted-foreground">vs. expected</p>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="mb-2 font-semibold">What we're comparing:</p>
                  <ul className="text-xs space-y-1">
                    <li>• <strong>Age:</strong> {profile.age} years old ({profile.yearsInWorkforce} years working)</li>
                    <li>• <strong>Occupation:</strong> {profile.level.replace('_', ' ')} {profile.occupation.replace('_', ' ')}</li>
                    <li>• <strong>Location:</strong> {profile.metro.replace('_', ' ')}</li>
                    <li>• <strong>Savings Rate:</strong> {Math.round((profile.savingsRate || 0.25) * 100)}% of income</li>
                  </ul>
                  <p className="text-xs mt-2 pt-2 border-t">
                    Expected value uses BLS wage data + historical market returns (7% real) to model your wealth trajectory.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
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
            <p className="text-[10px] text-muted-foreground/70 mt-1">
              for {profile.level.replace('_', ' ')} {profile.occupation.replace('_', ' ')} in {profile.metro.replace('_', ' ')}
            </p>
          </div>
        </div>

        {/* Collapsible calculation breakdown */}
        {wealthModel && wageEstimate && (
          <div className="mt-4 pt-4 border-t">
            <button
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showBreakdown ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              How is this calculated?
            </button>
            {showBreakdown && (
              <div className="mt-3 p-3 bg-muted/30 rounded-lg text-xs space-y-2">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <span className="text-muted-foreground">Income estimate:</span>
                  <span>BLS OES 2023 median for {profile!.level.replace('_', ' ')} {profile!.occupation.replace('_', ' ')} in {profile!.metro.replace('_', ' ')} = {formatCurrency(wageEstimate.totalComp)}</span>

                  <span className="text-muted-foreground">Savings rate:</span>
                  <span>{Math.round((profile!.savingsRate || 0.25) * 100)}% (inferred from history / default 25%)</span>

                  <span className="text-muted-foreground">Years working:</span>
                  <span>{profile!.yearsInWorkforce} years (age {profile!.age - profile!.yearsInWorkforce} to {profile!.age})</span>

                  <span className="text-muted-foreground">Return assumption:</span>
                  <span>7% real (S&P historical average)</span>

                  <span className="text-muted-foreground">Expected accumulation:</span>
                  <span className="font-medium">{formatCompact(wealthModel.expectedNetWorth)}</span>

                  <span className="text-muted-foreground">Your actual:</span>
                  <span className="font-medium">{formatCompact(currentNetWorth!)}</span>

                  <span className="text-muted-foreground">Delta:</span>
                  <span className={`font-medium ${isAhead ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {delta >= 0 ? '+' : ''}{formatCompact(delta)} ({deltaPercent >= 0 ? '+' : ''}{(deltaPercent * 100).toFixed(0)}% {isAhead ? 'ahead' : 'behind'})
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground pt-1 border-t">
                  Source: Federal Reserve SCF 2022 + BLS OES 2023
                </p>
              </div>
            )}
          </div>
        )}

        {/* Footnote */}
        <p className="text-xs text-muted-foreground text-center mt-4 pt-4 border-t">
          Based on Federal Reserve SCF 2022 + BLS OES 2023 wage data
        </p>
      </CardContent>
    </Card>
  );
}
