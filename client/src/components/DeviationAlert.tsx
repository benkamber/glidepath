import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, TrendingUp, TrendingDown, Info } from "lucide-react";
import {
  detectDeviation,
  formatCurrency,
  dismissAlert,
  isDismissed,
} from "@/lib/deviation-detector";

interface DeviationAlertProps {
  entries: Array<{ date: string; totalNetWorth: number }>;
}

export function DeviationAlert({ entries }: DeviationAlertProps) {
  const dataPoints = entries.map((e) => ({
    date: e.date,
    netWorth: e.totalNetWorth,
  }));

  const deviation = detectDeviation(dataPoints);

  // Generate alert ID based on current data
  const alertId = `${entries.length}_${entries[entries.length - 1]?.date || ""}`;

  const [isDismissedState, setIsDismissedState] = useState(() => isDismissed(alertId));

  if (!deviation || !deviation.hasDeviation || isDismissedState) {
    return null;
  }

  const handleDismiss = () => {
    dismissAlert(alertId);
    setIsDismissedState(true);
  };

  const bgColor = deviation.isAhead ? "bg-success/10" : "bg-warning/10";
  const borderColor = deviation.isAhead ? "border-success/30" : "border-warning/30";
  const iconColor = deviation.isAhead ? "text-success" : "text-warning";
  const Icon = deviation.isAhead ? TrendingUp : TrendingDown;

  return (
    <Card className={`${bgColor} border ${borderColor} relative`}>
      <CardContent className="p-4">
        {/* Dismiss Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="flex items-start gap-3 pr-8">
          <Icon className={`h-6 w-6 ${iconColor} flex-shrink-0 mt-0.5`} />

          <div className="flex-1 space-y-3">
            {/* Message */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-1">
                Trajectory Analysis
              </h3>
              <p className="text-sm text-foreground">{deviation.message}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2 bg-secondary/30 rounded">
                <p className="text-muted-foreground mb-0.5">Expected</p>
                <p className="font-mono font-semibold text-foreground">
                  {formatCurrency(deviation.expectedValue)}
                </p>
              </div>
              <div className="p-2 bg-secondary/30 rounded">
                <p className="text-muted-foreground mb-0.5">Actual</p>
                <p className="font-mono font-semibold text-foreground">
                  {formatCurrency(deviation.actualValue)}
                </p>
              </div>
              <div className="p-2 bg-secondary/30 rounded">
                <p className="text-muted-foreground mb-0.5">Difference</p>
                <p
                  className={`font-mono font-semibold ${
                    deviation.isAhead ? "text-success" : "text-warning"
                  }`}
                >
                  {deviation.isAhead ? "+" : ""}
                  {formatCurrency(deviation.deviationAmount)}
                </p>
              </div>
              <div className="p-2 bg-secondary/30 rounded">
                <p className="text-muted-foreground mb-0.5">Deviation</p>
                <p
                  className={`font-mono font-semibold ${
                    deviation.isAhead ? "text-success" : "text-warning"
                  }`}
                >
                  {deviation.isAhead ? "+" : ""}
                  {deviation.deviationPercent.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Recommendations */}
            {deviation.recommendations.length > 0 && (
              <div className="pt-2">
                <p className="text-xs font-semibold text-foreground mb-1.5">
                  {deviation.isAhead ? "Keep It Up:" : "Recommendations:"}
                </p>
                <ul className="space-y-1">
                  {deviation.recommendations.map((rec, index) => (
                    <li
                      key={index}
                      className="text-xs text-muted-foreground flex items-start gap-2"
                    >
                      <span className={iconColor}>•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Confidence Badge */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border/50">
              <Info className="h-3 w-3" />
              <span>
                Analysis confidence: {deviation.confidence}% | Based on {entries.length}{" "}
                data points
              </span>
            </div>
          </div>
        </div>

        {/* Dismiss Notice */}
        <p className="text-xs text-muted-foreground mt-3 text-center">
          Dismissing this alert will hide it for 30 days
        </p>
      </CardContent>
    </Card>
  );
}
