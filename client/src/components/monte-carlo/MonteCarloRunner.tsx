import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Play, BarChart3 } from "lucide-react";
import { runMonteCarloSimulation, createSimulationConfig, type AggregatedResults } from "@/lib/monte-carlo";
import { useMonteCarloWorker } from "@/hooks/use-monte-carlo-worker";

interface MonteCarloRunnerProps {
  currentNetWorth: number;
  currentCash: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  onResults: (results: AggregatedResults) => void;
}

export function MonteCarloRunner({
  currentNetWorth,
  currentCash,
  monthlyIncome,
  monthlyExpenses,
  savingsRate,
  onResults,
}: MonteCarloRunnerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [riskProfile, setRiskProfile] = useState<'conservative' | 'moderate' | 'aggressive'>('moderate');
  const [numSimulations, setNumSimulations] = useState(10000);
  const [timeHorizon, setTimeHorizon] = useState(120); // 10 years in months

  const { runSimulation: runWorkerSimulation, isWorkerSupported } = useMonteCarloWorker();

  const runSimulation = async () => {
    setIsRunning(true);
    setProgress(0);

    try {
      const config = createSimulationConfig({
        currentNetWorth,
        currentCash,
        monthlyIncome,
        monthlyExpenses,
        savingsRate,
        riskProfile,
      });

      // Override with user selections
      config.numSimulations = numSimulations;
      config.timeHorizonMonths = timeHorizon;

      let results: AggregatedResults;

      if (isWorkerSupported) {
        // Use Web Worker (non-blocking)
        results = await runWorkerSimulation(config, setProgress);
      } else {
        // Fallback to synchronous (blocking)
        console.warn('Web Workers not supported, running on main thread');
        results = runMonteCarloSimulation(config);
      }

      onResults(results);
    } catch (error) {
      console.error("Simulation error:", error);
    } finally {
      setIsRunning(false);
      setProgress(0);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Monte Carlo Simulation
        </CardTitle>
        <CardDescription>
          Run probabilistic wealth projections with investment returns and uncertainty modeling
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Risk Profile Selection */}
        <div className="space-y-3">
          <Label>Risk Profile</Label>
          <Select value={riskProfile} onValueChange={(v: any) => setRiskProfile(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="conservative">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-500/10 text-green-600">Low Risk</Badge>
                  <span>Conservative (5% return, 10% volatility)</span>
                </div>
              </SelectItem>
              <SelectItem value="moderate">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600">Medium Risk</Badge>
                  <span>Moderate (7% return, 15% volatility)</span>
                </div>
              </SelectItem>
              <SelectItem value="aggressive">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-red-500/10 text-red-600">High Risk</Badge>
                  <span>Aggressive (9% return, 20% volatility)</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Risk profile determines investment return expectations, volatility, and expense uncertainty
          </p>
        </div>

        {/* Number of Simulations */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Number of Simulations</Label>
            <span className="text-sm font-mono">{numSimulations.toLocaleString()}</span>
          </div>
          <Slider
            value={[numSimulations]}
            onValueChange={(v) => setNumSimulations(v[0])}
            min={1000}
            max={20000}
            step={1000}
          />
          <p className="text-xs text-muted-foreground">
            More simulations = more accurate results but slower
          </p>
        </div>

        {/* Time Horizon */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Time Horizon</Label>
            <span className="text-sm font-mono">{timeHorizon} months ({Math.round(timeHorizon / 12)} years)</span>
          </div>
          <Slider
            value={[timeHorizon]}
            onValueChange={(v) => setTimeHorizon(v[0])}
            min={12}
            max={600}
            step={12}
          />
        </div>

        {/* Progress indicator */}
        {isRunning && progress > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progress</span>
              <span className="font-mono">{Math.round(progress * 100)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Current State Summary */}
        <div className="grid grid-cols-2 gap-3 p-4 bg-muted/30 rounded-lg">
          <div>
            <p className="text-xs text-muted-foreground">Net Worth</p>
            <p className="text-sm font-semibold">${(currentNetWorth / 1000).toFixed(0)}K</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Cash</p>
            <p className="text-sm font-semibold">${(currentCash / 1000).toFixed(0)}K</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Monthly Savings</p>
            <p className="text-sm font-semibold">${(monthlyIncome * savingsRate).toFixed(0)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Savings Rate</p>
            <p className="text-sm font-semibold">{(savingsRate * 100).toFixed(0)}%</p>
          </div>
        </div>

        {/* Run Button */}
        <Button
          onClick={runSimulation}
          disabled={isRunning}
          size="lg"
          className="w-full"
        >
          {isRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running {numSimulations.toLocaleString()} simulations...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Run Monte Carlo Analysis
            </>
          )}
        </Button>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground text-center">
            Simulation includes: investment returns with volatility, expense variations, income fluctuations, and emergency events
          </p>
          {!isWorkerSupported && (
            <p className="text-xs text-amber-600 text-center">
              Note: Web Workers not supported. UI may freeze briefly during simulation.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
