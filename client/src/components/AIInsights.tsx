import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  generateInsights,
  getInsightTypeColor,
  getInsightTypeIcon,
  type Insight,
  type InsightType,
} from "@/lib/insight-engine";
import {
  TrendingUp,
  TrendingDown,
  BarChart,
  DollarSign,
  CheckCircle,
  Briefcase,
  Sparkles,
} from "lucide-react";

interface AIInsightsProps {
  currentNetWorth: number;
  cash: number;
  age: number;
  annualIncome: number;
  savingsRate: number;
  entries: Array<{ date: string; totalNetWorth: number; cash: number }>;
  averageAnnualGrowth: number;
  recentVelocity?: number;
  overallVelocity?: number;
}

const ICON_MAP: Record<string, any> = {
  TrendingUp,
  TrendingDown,
  BarChart,
  DollarSign,
  CheckCircle,
  Briefcase,
};

function formatCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  } else if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}k`;
  }
  return `$${value.toFixed(0)}`;
}

export function AIInsights({
  currentNetWorth,
  cash,
  age,
  annualIncome,
  savingsRate,
  entries,
  averageAnnualGrowth,
  recentVelocity,
  overallVelocity,
}: AIInsightsProps) {
  const insights = useMemo(() => {
    return generateInsights({
      currentNetWorth,
      cash,
      age,
      annualIncome,
      savingsRate,
      entries,
      averageAnnualGrowth,
      recentVelocity,
      overallVelocity,
    });
  }, [currentNetWorth, cash, age, annualIncome, savingsRate, entries, averageAnnualGrowth, recentVelocity, overallVelocity]);

  // Group insights by type
  const insightsByType = useMemo(() => {
    const groups: Record<InsightType, Insight[]> = {
      pattern: [],
      trend: [],
      anomaly: [],
      milestone: [],
    };

    insights.forEach((insight) => {
      groups[insight.type].push(insight);
    });

    return groups;
  }, [insights]);

  // Count insights by significance
  const counts = useMemo(() => {
    return {
      high: insights.filter((s) => s.significance === "high").length,
      medium: insights.filter((s) => s.significance === "medium").length,
      low: insights.filter((s) => s.significance === "low").length,
    };
  }, [insights]);

  if (insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Insights
          </CardTitle>
          <CardDescription>
            Observational analysis of your wealth trajectory
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Add more data entries to unlock pattern recognition and trend analysis.
            We need at least 4 data points to generate meaningful insights.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          AI Insights
        </CardTitle>
        <CardDescription>
          Observational analysis • Pattern recognition • Trend detection
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="text-muted-foreground">
            {insights.length} insight{insights.length !== 1 ? 's' : ''} detected:
          </span>
          {counts.high > 0 && (
            <span className="text-primary">
              {counts.high} High Significance
            </span>
          )}
          {counts.medium > 0 && (
            <span className="text-yellow-500">
              {counts.medium} Medium
            </span>
          )}
          {counts.low > 0 && (
            <span className="text-muted-foreground">
              {counts.low} Low
            </span>
          )}
        </div>

        {/* Insights grouped by type */}
        <Accordion type="multiple" className="w-full" defaultValue={["pattern", "milestone"]}>
          {/* Patterns */}
          {insightsByType.pattern.length > 0 && (
            <AccordionItem value="pattern">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🧠</span>
                  <span className="font-semibold">
                    Patterns ({insightsByType.pattern.length})
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2">
                {insightsByType.pattern.map((insight) => (
                  <InsightCard key={insight.id} insight={insight} />
                ))}
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Trends */}
          {insightsByType.trend.length > 0 && (
            <AccordionItem value="trend">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📈</span>
                  <span className="font-semibold">
                    Trends ({insightsByType.trend.length})
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2">
                {insightsByType.trend.map((insight) => (
                  <InsightCard key={insight.id} insight={insight} />
                ))}
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Anomalies */}
          {insightsByType.anomaly.length > 0 && (
            <AccordionItem value="anomaly">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <span className="text-lg">⚠️</span>
                  <span className="font-semibold">
                    Anomalies ({insightsByType.anomaly.length})
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2">
                {insightsByType.anomaly.map((insight) => (
                  <InsightCard key={insight.id} insight={insight} />
                ))}
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Milestones */}
          {insightsByType.milestone.length > 0 && (
            <AccordionItem value="milestone">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🎯</span>
                  <span className="font-semibold">
                    Milestones ({insightsByType.milestone.length})
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2">
                {insightsByType.milestone.map((insight) => (
                  <InsightCard key={insight.id} insight={insight} />
                ))}
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>

        {/* Methodology note */}
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground text-center">
            Insights are generated using pattern recognition, statistical analysis, and second-order derivatives.
            These are observations, not recommendations.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Individual insight card component
 */
function InsightCard({ insight }: { insight: Insight }) {
  const Icon = ICON_MAP[insight.icon] || BarChart;

  const significanceColors = {
    high: "border-primary bg-primary/5",
    medium: "border-yellow-500/30 bg-yellow-500/5",
    low: "border-muted bg-muted/30",
  };

  const significanceBadgeColors = {
    high: "bg-primary/20 text-primary",
    medium: "bg-yellow-500/20 text-yellow-500",
    low: "bg-muted text-muted-foreground",
  };

  return (
    <div
      className={`p-4 rounded-lg border ${significanceColors[insight.significance]}`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-1">
          <Icon className={`h-5 w-5 ${getInsightTypeColor(insight.type)}`} />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold text-sm">{insight.title}</h4>
            <Badge
              variant="secondary"
              className={`text-xs shrink-0 ${significanceBadgeColors[insight.significance]}`}
            >
              {insight.significance}
            </Badge>
          </div>

          <p className="text-sm text-foreground/90 leading-relaxed">
            {insight.observation}
          </p>

          {insight.dataPoints.length > 0 && (
            <div className="space-y-1 pl-3 border-l-2 border-primary/30">
              {insight.dataPoints.map((point, i) => (
                <p key={i} className="text-xs text-muted-foreground font-mono">
                  {point}
                </p>
              ))}
            </div>
          )}

          {insight.trend && (
            <div className="flex items-center gap-2 text-xs">
              <Badge variant="outline" className="text-xs">
                {insight.trend === "accelerating" && "📈 Accelerating"}
                {insight.trend === "decelerating" && "📉 Decelerating"}
                {insight.trend === "stable" && "➡️ Stable"}
                {insight.trend === "volatile" && "📊 Volatile"}
              </Badge>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
