import { useMemo } from 'react';
import { X, Flame, TrendingUp, TrendingDown, AlertTriangle, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { UserProfile } from '@/hooks/use-user-profile';
import { getPercentileForAge } from '@/data/scf-data';
import { modelExpectedWealth } from '@/models/wealth-model';
import { getWageEstimate, occupationLabels, metroLabels, getCOLMultiplier } from '@/data/bls-wage-data';

interface RoastModeProps {
  currentNetWorth: number;
  cash: number;
  profile: UserProfile;
  onClose: () => void;
}

type Grade = 'S' | 'A' | 'B' | 'C' | 'D' | 'F';

interface Roast {
  type: 'roast' | 'praise' | 'observation';
  message: string;
}

interface RealTalk {
  icon: 'warning' | 'info' | 'success';
  title: string;
  detail: string;
}

interface ActionItem {
  priority: 'high' | 'medium' | 'low';
  action: string;
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

function getGrade(percentile: number, deltaPercent: number): Grade {
  // Grade based on combination of percentile and vs-expected
  if (percentile >= 95 && deltaPercent >= 0.25) return 'S';
  if (percentile >= 80 || (percentile >= 70 && deltaPercent >= 0.15)) return 'A';
  if (percentile >= 60 || (percentile >= 50 && deltaPercent >= 0)) return 'B';
  if (percentile >= 40 || deltaPercent >= -0.15) return 'C';
  if (percentile >= 20 || deltaPercent >= -0.30) return 'D';
  return 'F';
}

function getGradeColor(grade: Grade): string {
  switch (grade) {
    case 'S': return 'text-purple-500';
    case 'A': return 'text-emerald-500';
    case 'B': return 'text-blue-500';
    case 'C': return 'text-yellow-500';
    case 'D': return 'text-orange-500';
    case 'F': return 'text-red-500';
  }
}

function getGradeBg(grade: Grade): string {
  switch (grade) {
    case 'S': return 'bg-purple-500/10 border-purple-500/30';
    case 'A': return 'bg-emerald-500/10 border-emerald-500/30';
    case 'B': return 'bg-blue-500/10 border-blue-500/30';
    case 'C': return 'bg-yellow-500/10 border-yellow-500/30';
    case 'D': return 'bg-orange-500/10 border-orange-500/30';
    case 'F': return 'bg-red-500/10 border-red-500/30';
  }
}

function getHeadline(grade: Grade, percentile: number, occupation: string): string {
  const industry = occupationLabels[occupation as keyof typeof occupationLabels] ?? occupation;

  switch (grade) {
    case 'S':
      return `Absolutely crushing it. Top ${100 - percentile}% territory.`;
    case 'A':
      return `Solid performance. You're outpacing most of your peers.`;
    case 'B':
      return `Above average. Decent, but there's room to optimize.`;
    case 'C':
      return `Middle of the pack. Not bad, not great either.`;
    case 'D':
      return `Below expectations. Time for a reality check.`;
    case 'F':
      return `Wake up call. Significant course correction needed.`;
  }
}

export function RoastMode({
  currentNetWorth,
  cash,
  profile,
  onClose,
}: RoastModeProps) {
  const analysis = useMemo(() => {
    const percentile = getPercentileForAge(currentNetWorth, profile.age);

    const wealthModel = modelExpectedWealth({
      currentAge: profile.age,
      startAge: profile.age - profile.yearsInWorkforce,
      occupation: profile.occupation,
      level: profile.level,
      metro: profile.metro,
      savingsRate: profile.savingsRate,
      currentNetWorth,
    });

    const wageEstimate = getWageEstimate(profile.occupation, profile.level, profile.metro);
    const colMultiplier = getCOLMultiplier(profile.metro);

    const expectedNW = wealthModel.expectedNetWorth;
    const delta = currentNetWorth - expectedNW;
    const deltaPercent = expectedNW > 0 ? delta / expectedNW : 0;
    const isAhead = delta >= 0;

    const grade = getGrade(percentile, deltaPercent);
    const headline = getHeadline(grade, percentile, profile.occupation);

    // Calculate some key metrics
    const cashPercent = currentNetWorth > 0 ? cash / currentNetWorth : 0;
    const annualSavings = wageEstimate.afterTaxComp * profile.savingsRate;
    const yearsToDouble = annualSavings > 0 ?
      Math.log(2) / Math.log(1 + 0.07 + (annualSavings / Math.max(currentNetWorth, 1))) :
      Infinity;

    // Generate roasts
    const roasts: Roast[] = [];

    // Cash allocation roasts
    if (cashPercent > 0.5 && currentNetWorth > 50000) {
      roasts.push({
        type: 'roast',
        message: `${Math.round(cashPercent * 100)}% of your net worth is sitting in cash. That's not a rainy day fund, that's a flood.`,
      });
    } else if (cashPercent > 0.3 && currentNetWorth > 100000) {
      roasts.push({
        type: 'roast',
        message: `${Math.round(cashPercent * 100)}% in cash at your level? Inflation is literally eating your money for breakfast.`,
      });
    } else if (cashPercent < 0.05 && currentNetWorth > 50000) {
      roasts.push({
        type: 'observation',
        message: `Only ${Math.round(cashPercent * 100)}% in cash. Hope you don't have any emergencies planned.`,
      });
    }

    // Performance roasts
    if (deltaPercent < -0.3) {
      roasts.push({
        type: 'roast',
        message: `You're ${Math.round(Math.abs(deltaPercent) * 100)}% behind expected for your profile. What happened? Extended sabbatical? Avocado toast addiction?`,
      });
    } else if (deltaPercent < -0.15) {
      roasts.push({
        type: 'roast',
        message: `${Math.round(Math.abs(deltaPercent) * 100)}% behind where you should be. Not terrible, but your LinkedIn connections are outpacing you.`,
      });
    } else if (deltaPercent > 0.5) {
      roasts.push({
        type: 'praise',
        message: `${Math.round(deltaPercent * 100)}% ahead of expected. Either you're great with money, or you got lucky with a liquidity event.`,
      });
    } else if (deltaPercent > 0.25) {
      roasts.push({
        type: 'praise',
        message: `Solid ${Math.round(deltaPercent * 100)}% buffer above expected. You're doing something right.`,
      });
    }

    // Savings rate roasts
    if (profile.savingsRate < 0.15 && ['software_engineer', 'product_manager', 'data_scientist', 'finance', 'consulting'].includes(profile.occupation)) {
      roasts.push({
        type: 'roast',
        message: `${Math.round(profile.savingsRate * 100)}% savings rate in ${occupationLabels[profile.occupation as keyof typeof occupationLabels]}? You should be able to do better than that.`,
      });
    } else if (profile.savingsRate >= 0.40) {
      roasts.push({
        type: 'praise',
        message: `${Math.round(profile.savingsRate * 100)}% savings rate is aggressive. FIRE community would approve.`,
      });
    }

    // Location roasts
    if (colMultiplier > 1.3) {
      roasts.push({
        type: 'observation',
        message: `Living in ${metroLabels[profile.metro as keyof typeof metroLabels]} with its ${Math.round(colMultiplier * 100)}% COL index. Hope that TC is worth it.`,
      });
    }

    // Age-specific roasts
    if (profile.age < 30 && percentile >= 80) {
      roasts.push({
        type: 'praise',
        message: `Top ${100 - percentile}% in your 20s. Either trust fund or actually competent.`,
      });
    }

    // Generate real talk
    const realTalk: RealTalk[] = [];

    if (isAhead) {
      realTalk.push({
        icon: 'success',
        title: 'Ahead of expectations',
        detail: `You're ${formatCompact(Math.abs(delta))} above what the model predicts for your profile.`,
      });
    } else {
      realTalk.push({
        icon: 'warning',
        title: 'Below expectations',
        detail: `You're ${formatCompact(Math.abs(delta))} behind what the model predicts. This could be lifestyle creep, late start, or just bad luck.`,
      });
    }

    realTalk.push({
      icon: 'info',
      title: 'National comparison',
      detail: `Your net worth puts you at the ${percentile}th percentile for Americans age ${profile.age}.`,
    });

    if (cashPercent > 0.2 && currentNetWorth > 50000) {
      realTalk.push({
        icon: 'warning',
        title: 'Cash drag',
        detail: `Assuming 7% market returns, your excess cash may be costing you ~${formatCompact(Math.max(0, (cash - 50000) * 0.05))}/year in opportunity cost.`,
      });
    }

    // Generate action items
    const actions: ActionItem[] = [];

    if (cashPercent > 0.3 && currentNetWorth > 50000) {
      actions.push({
        priority: 'high',
        action: `Invest ${formatCompact(Math.max(0, cash - 30000))} of excess cash into index funds`,
      });
    }

    if (profile.savingsRate < 0.20) {
      actions.push({
        priority: 'medium',
        action: `Increase savings rate by 5% - would add ${formatCompact(wageEstimate.afterTaxComp * 0.05)}/year`,
      });
    }

    if (deltaPercent < -0.2) {
      actions.push({
        priority: 'medium',
        action: 'Review budget and cut discretionary spending by 10-15%',
      });
    }

    if (colMultiplier > 1.25 && deltaPercent < 0) {
      actions.push({
        priority: 'low',
        action: 'Consider geographic arbitrage - same income, lower COL',
      });
    }

    return {
      grade,
      headline,
      percentile,
      delta,
      deltaPercent,
      isAhead,
      roasts,
      realTalk,
      actions,
      wageEstimate,
    };
  }, [currentNetWorth, cash, profile]);

  return (
    <Card className="border-2 border-orange-500/30 bg-gradient-to-br from-background to-orange-500/5">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Flame className="h-5 w-5 text-orange-500" />
          Roast Mode
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Grade Display */}
        <div className={`p-6 rounded-lg border ${getGradeBg(analysis.grade)} text-center`}>
          <p className="text-sm text-muted-foreground mb-2">Your Grade</p>
          <p className={`text-6xl font-bold ${getGradeColor(analysis.grade)}`}>
            {analysis.grade}
          </p>
          <p className="text-base mt-3 font-medium">
            {analysis.headline}
          </p>
        </div>

        {/* Roasts */}
        {analysis.roasts.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              The Roast
            </h3>
            <div className="space-y-2">
              {analysis.roasts.map((roast, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-md text-sm ${
                    roast.type === 'praise'
                      ? 'bg-emerald-500/10 border border-emerald-500/20'
                      : roast.type === 'roast'
                      ? 'bg-orange-500/10 border border-orange-500/20'
                      : 'bg-muted/50 border border-border'
                  }`}
                >
                  {roast.type === 'praise' && <TrendingUp className="h-4 w-4 text-emerald-500 inline mr-2" />}
                  {roast.type === 'roast' && <TrendingDown className="h-4 w-4 text-orange-500 inline mr-2" />}
                  {roast.message}
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Real Talk */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Real Talk
          </h3>
          <div className="space-y-2">
            {analysis.realTalk.map((item, i) => (
              <div key={i} className="flex gap-3 p-3 bg-muted/30 rounded-md">
                <div className={`mt-0.5 ${
                  item.icon === 'success' ? 'text-emerald-500' :
                  item.icon === 'warning' ? 'text-amber-500' :
                  'text-blue-500'
                }`}>
                  {item.icon === 'success' && <TrendingUp className="h-4 w-4" />}
                  {item.icon === 'warning' && <AlertTriangle className="h-4 w-4" />}
                  {item.icon === 'info' && <Lightbulb className="h-4 w-4" />}
                </div>
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Items */}
        {analysis.actions.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-blue-500" />
                Action Items
              </h3>
              <div className="space-y-2">
                {analysis.actions.map((action, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-md text-sm border-l-4 ${
                      action.priority === 'high'
                        ? 'border-l-red-500 bg-red-500/5'
                        : action.priority === 'medium'
                        ? 'border-l-amber-500 bg-amber-500/5'
                        : 'border-l-blue-500 bg-blue-500/5'
                    }`}
                  >
                    <span className={`text-xs font-medium uppercase ${
                      action.priority === 'high' ? 'text-red-500' :
                      action.priority === 'medium' ? 'text-amber-500' :
                      'text-blue-500'
                    }`}>
                      {action.priority}
                    </span>
                    <p className="mt-1">{action.action}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center pt-2 border-t">
          This is entertainment, not financial advice. Models use simplified assumptions.
        </p>
      </CardContent>
    </Card>
  );
}
