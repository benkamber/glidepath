import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  generateSuggestions,
  getPriorityColor,
  type Suggestion,
  type SuggestionPriority,
} from "@/lib/rule-engine";
import {
  PiggyBank,
  TrendingUp,
  TrendingDown,
  Shield,
  Briefcase,
  DollarSign,
  BarChart,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  Info,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SmartSuggestionsProps {
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
  PiggyBank,
  TrendingUp,
  TrendingDown,
  Shield,
  Briefcase,
  DollarSign,
  BarChart,
  LineChart: BarChart,
};

function formatCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  } else if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}k`;
  } else {
    return `$${Math.round(value).toLocaleString()}`;
  }
}

function formatImpact(value: number, unit: string): string {
  if (unit === "$") {
    return formatCurrency(value);
  } else if (unit === "$/year") {
    return `${formatCurrency(value)}/yr`;
  } else if (unit === "months") {
    return `${value.toFixed(1)} months`;
  }
  return `${value.toFixed(1)}${unit}`;
}

function PriorityBadge({ priority }: { priority: SuggestionPriority }) {
  const color = getPriorityColor(priority);
  const label = priority.charAt(0).toUpperCase() + priority.slice(1);

  return (
    <Badge
      variant="outline"
      className="text-xs font-semibold"
      style={{ borderColor: color, color }}
    >
      {label}
    </Badge>
  );
}

function SuggestionCard({ suggestion }: { suggestion: Suggestion }) {
  const [dismissed, setDismissed] = useState(false);
  const Icon = ICON_MAP[suggestion.icon] || Lightbulb;

  if (dismissed) return null;

  return (
    <AccordionItem value={suggestion.id} className="border border-border rounded-lg px-4">
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-start gap-3 w-full text-left">
          <div
            className="p-2 rounded-lg flex-shrink-0"
            style={{ backgroundColor: `${getPriorityColor(suggestion.priority)}20` }}
          >
            <Icon className="h-5 w-5" style={{ color: getPriorityColor(suggestion.priority) }} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-sm font-semibold text-foreground">{suggestion.title}</h4>
              <PriorityBadge priority={suggestion.priority} />
            </div>
            <p className="text-xs text-muted-foreground">{suggestion.description}</p>
          </div>
        </div>
      </AccordionTrigger>

      <AccordionContent className="space-y-4 pt-4">
        {/* Impact Visualization */}
        <div className="p-4 bg-secondary/30 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">Potential Impact</span>
            <span className="text-xs text-muted-foreground">{suggestion.confidence}% confidence</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Current:</span>
              <span className="font-mono font-semibold text-foreground">
                {formatImpact(suggestion.impact.before, suggestion.impact.unit)}
              </span>
            </div>

            <Progress
              value={(suggestion.impact.before / suggestion.impact.after) * 100}
              className="h-2"
            />

            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Potential:</span>
              <span className="font-mono font-semibold text-primary">
                {formatImpact(suggestion.impact.after, suggestion.impact.unit)}
              </span>
            </div>

            <div className="pt-2 border-t border-border">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Improvement:</span>
                <span
                  className="font-mono font-semibold"
                  style={{
                    color:
                      suggestion.impact.improvement >= 0
                        ? "#10b981"
                        : "#ef4444",
                  }}
                >
                  {suggestion.impact.improvement >= 0 ? "+" : ""}
                  {formatImpact(Math.abs(suggestion.impact.improvement), suggestion.impact.unit)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Steps */}
        <div className="space-y-2">
          <h5 className="text-xs font-semibold text-foreground flex items-center gap-2">
            <CheckCircle className="h-3 w-3" />
            Action Steps
          </h5>
          <ul className="space-y-2">
            {suggestion.actionSteps.map((step, index) => (
              <li key={index} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="text-primary mt-0.5">•</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Reasoning */}
        <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-semibold text-foreground mb-1">Why this matters:</p>
              <p className="text-muted-foreground">{suggestion.reasoning}</p>
            </div>
          </div>
        </div>

        {/* Dismiss Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDismissed(true)}
          className="w-full text-xs"
        >
          Dismiss this suggestion
        </Button>
      </AccordionContent>
    </AccordionItem>
  );
}

export function SmartSuggestions(props: SmartSuggestionsProps) {
  const suggestions = useMemo(() => {
    return generateSuggestions({
      currentNetWorth: props.currentNetWorth,
      cash: props.cash,
      age: props.age,
      annualIncome: props.annualIncome,
      savingsRate: props.savingsRate,
      entries: props.entries,
      averageAnnualGrowth: props.averageAnnualGrowth,
      recentVelocity: props.recentVelocity,
      overallVelocity: props.overallVelocity,
    });
  }, [props]);

  // Count by priority
  const counts = {
    critical: suggestions.filter((s) => s.priority === "critical").length,
    high: suggestions.filter((s) => s.priority === "high").length,
    medium: suggestions.filter((s) => s.priority === "medium").length,
    low: suggestions.filter((s) => s.priority === "low").length,
  };

  if (suggestions.length === 0) {
    return (
      <Card className="terminal-card">
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Smart Suggestions
          </CardTitle>
          <CardDescription>AI-powered recommendations based on your data</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="bg-success/10 border-success/30">
            <CheckCircle className="h-4 w-4 text-success" />
            <AlertDescription className="text-sm">
              <strong className="text-success">Excellent work!</strong> You're following best
              practices. No major suggestions at this time. Keep up the great financial habits!
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="terminal-card">
      <CardHeader>
        <CardTitle className="text-primary flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Smart Suggestions
        </CardTitle>
        <CardDescription>
          AI-powered recommendations based on your financial data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Banner */}
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-foreground mb-2">
                Found {suggestions.length} {suggestions.length === 1 ? "Suggestion" : "Suggestions"}
              </h4>
              <div className="flex flex-wrap gap-2 text-xs">
                {counts.critical > 0 && (
                  <span className="text-destructive">
                    {counts.critical} Critical
                  </span>
                )}
                {counts.high > 0 && (
                  <span className="text-orange-500">
                    {counts.high} High Priority
                  </span>
                )}
                {counts.medium > 0 && (
                  <span className="text-yellow-500">
                    {counts.medium} Medium Priority
                  </span>
                )}
                {counts.low > 0 && (
                  <span className="text-success">
                    {counts.low} Low Priority
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Suggestions List */}
        <Accordion type="single" collapsible className="space-y-3">
          {suggestions.map((suggestion) => (
            <SuggestionCard key={suggestion.id} suggestion={suggestion} />
          ))}
        </Accordion>

        {/* Info Footer */}
        <Alert className="bg-secondary/30 border-border">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            These suggestions are based on common financial best practices and your specific data.
            Always consult with a qualified financial advisor before making major financial decisions.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
