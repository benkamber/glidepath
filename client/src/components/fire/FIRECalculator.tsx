import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  calculateFIRE,
  calculateMaxSpendForDate,
  FIRE_LEVELS,
  formatCurrency,
  FIRECalculationResult,
} from "@/lib/fire-calculations";
import { Calendar, DollarSign, TrendingUp, Users, Briefcase, Settings } from "lucide-react";
import { format } from "date-fns";

interface FIRECalculatorProps {
  currentNetWorth: number;
  currentAge: number;
  annualIncome: number;
  monthlyExpenses?: number; // From user profile
}

export function FIRECalculator({
  currentNetWorth,
  currentAge,
  annualIncome,
  monthlyExpenses,
}: FIRECalculatorProps) {
  // Basic inputs - use profile expenses if available, otherwise default to 4000
  const [monthlySpend, setMonthlySpend] = useState(monthlyExpenses || 4000);
  const [isCouple, setIsCouple] = useState(false);

  // Sync monthlySpend with prop changes (when user updates profile)
  useEffect(() => {
    if (monthlyExpenses !== undefined) {
      setMonthlySpend(monthlyExpenses);
    }
  }, [monthlyExpenses]);

  // Advanced settings
  const [coupleMultiplier, setCoupleMultiplier] = useState(1.7);
  const [customWithdrawalRate, setCustomWithdrawalRate] = useState<number | null>(null);
  const [partTimeIncome, setPartTimeIncome] = useState(0);
  const [annualReturnRate] = useState(0.07);

  // Bidirectional mode
  const [calculationMode, setCalculationMode] = useState<"spend-to-date" | "date-to-spend">(
    "spend-to-date"
  );
  const [targetYear, setTargetYear] = useState(new Date().getFullYear() + 10);

  const annualExpenses = monthlySpend * 12;

  // Calculate FIRE metrics
  const fireResult: FIRECalculationResult = calculateFIRE(
    currentNetWorth,
    currentAge,
    annualIncome,
    annualExpenses,
    annualReturnRate,
    isCouple,
    coupleMultiplier,
    partTimeIncome
  );

  // Bidirectional calculation
  const maxSpendResult =
    calculationMode === "date-to-spend"
      ? calculateMaxSpendForDate(
          currentNetWorth,
          currentAge,
          annualIncome,
          targetYear,
          annualReturnRate,
          customWithdrawalRate || fireResult.level.withdrawalRate,
          isCouple,
          coupleMultiplier
        )
      : null;

  return (
    <Card className="terminal-card">
      <CardHeader>
        <CardTitle className="text-primary">FIRE Calculator</CardTitle>
        <CardDescription>
          Plan your path to Financial Independence, Retire Early
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Calculation Mode Toggle */}
        <Tabs
          value={calculationMode}
          onValueChange={(v) => setCalculationMode(v as typeof calculationMode)}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="spend-to-date" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Spend → Date
            </TabsTrigger>
            <TabsTrigger value="date-to-spend" className="gap-2">
              <Calendar className="h-4 w-4" />
              Date → Spend
            </TabsTrigger>
          </TabsList>

          {/* Spend to Date Mode */}
          <TabsContent value="spend-to-date" className="space-y-6 mt-6">
            {/* Monthly Spend Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Monthly Spend</Label>
                <span className="text-sm font-mono font-semibold text-primary">
                  ${monthlySpend.toLocaleString()}/mo
                </span>
              </div>
              <Slider
                value={[monthlySpend]}
                onValueChange={(v) => setMonthlySpend(v[0])}
                min={2000}
                max={20000}
                step={100}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Annual expenses: ${(monthlySpend * 12).toLocaleString()}
              </p>
            </div>

            {/* Solo vs Couple Toggle */}
            <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label className="text-sm">Couple Mode</Label>
                  <p className="text-xs text-muted-foreground">
                    {coupleMultiplier}x expense multiplier
                  </p>
                </div>
              </div>
              <Switch checked={isCouple} onCheckedChange={setIsCouple} />
            </div>

            {/* FIRE Results */}
            <div className="space-y-4">
              {/* Current Level */}
              <div className="p-4 rounded-lg" style={{ backgroundColor: `${fireResult.level.color}15` }}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold" style={{ color: fireResult.level.color }}>
                    {fireResult.level.name}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {fireResult.level.withdrawalRate * 100}% SWR
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  {fireResult.level.description}
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold text-foreground">
                      {fireResult.currentProgress.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={fireResult.currentProgress} className="h-2" />
                </div>
              </div>

              {/* FIRE Number & Timeline */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-secondary/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">FIRE Number</p>
                  <p className="text-2xl font-mono font-bold text-primary">
                    {formatCurrency(fireResult.fireNumber)}
                  </p>
                </div>
                <div className="p-4 bg-secondary/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Years to FIRE</p>
                  <p className="text-2xl font-mono font-bold text-foreground">
                    {fireResult.yearsToFIRE < 100 ? fireResult.yearsToFIRE : "∞"}
                  </p>
                  {fireResult.yearsToFIRE < 100 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(fireResult.fireDate, "MMM yyyy")}
                    </p>
                  )}
                </div>
              </div>

              {/* All FIRE Level Progress Bars */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground">All FIRE Milestones</h4>
                {FIRE_LEVELS.map((level) => {
                  const levelNumber = calculateFIRE(
                    currentNetWorth,
                    currentAge,
                    annualIncome,
                    level.maxAnnualExpenses === Infinity ? 100000 : level.minAnnualExpenses,
                    annualReturnRate,
                    isCouple,
                    coupleMultiplier
                  ).fireNumber;
                  const levelProgress = Math.min(100, (currentNetWorth / levelNumber) * 100);

                  return (
                    <div key={level.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium" style={{ color: level.color }}>
                          {level.name}
                        </span>
                        <span className="text-muted-foreground">
                          {formatCurrency(levelNumber)}
                        </span>
                      </div>
                      <Progress
                        value={levelProgress}
                        className="h-1.5"
                        style={{ backgroundColor: `${level.color}30` }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Coast FIRE & Barista FIRE */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-indigo-400" />
                    <h4 className="text-xs font-semibold text-foreground">Coast FIRE</h4>
                  </div>
                  {fireResult.coastFIRE.isCoastFIRE ? (
                    <p className="text-xs text-indigo-400">
                      ✓ Achieved! Stop saving, coast to 65
                    </p>
                  ) : (
                    <div className="space-y-1 text-xs">
                      <p className="text-muted-foreground">
                        Need: {formatCurrency(fireResult.coastFIRE.coastNumber)}
                      </p>
                      <p className="text-muted-foreground">
                        {fireResult.coastFIRE.yearsToCoast < 100
                          ? `${fireResult.coastFIRE.yearsToCoast} years away`
                          : "Increase savings"}
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Briefcase className="h-4 w-4 text-purple-400" />
                    <h4 className="text-xs font-semibold text-foreground">Barista FIRE</h4>
                  </div>
                  {fireResult.baristaFIRE.isBaristaFIRE ? (
                    <p className="text-xs text-purple-400">
                      ✓ Achieved! Work part-time
                    </p>
                  ) : (
                    <div className="space-y-1 text-xs">
                      <p className="text-muted-foreground">
                        Need: {formatCurrency(fireResult.baristaFIRE.baristaNumber)}
                      </p>
                      <p className="text-muted-foreground">
                        {fireResult.baristaFIRE.yearsToBaristaFIRE < 100
                          ? `${fireResult.baristaFIRE.yearsToBaristaFIRE} years away`
                          : "Increase savings"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Date to Spend Mode */}
          <TabsContent value="date-to-spend" className="space-y-6 mt-6">
            {/* Target Year Input */}
            <div className="space-y-3">
              <Label>Target FIRE Year</Label>
              <Input
                type="number"
                value={targetYear}
                onChange={(e) => setTargetYear(parseInt(e.target.value) || targetYear)}
                min={new Date().getFullYear()}
                max={new Date().getFullYear() + 50}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                {targetYear - new Date().getFullYear()} years from now
              </p>
            </div>

            {/* Solo vs Couple Toggle */}
            <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label className="text-sm">Couple Mode</Label>
                  <p className="text-xs text-muted-foreground">
                    {coupleMultiplier}x expense multiplier
                  </p>
                </div>
              </div>
              <Switch checked={isCouple} onCheckedChange={setIsCouple} />
            </div>

            {/* Results */}
            {maxSpendResult && (
              <div className="space-y-4">
                <div className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/30 rounded-lg">
                  <h3 className="text-sm font-semibold text-foreground mb-2">
                    Maximum Sustainable Lifestyle
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Monthly Spend</p>
                      <p className="text-3xl font-mono font-bold text-primary">
                        ${Math.round(maxSpendResult.maxMonthlySpend).toLocaleString()}/mo
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-muted-foreground">Annual Expenses</p>
                        <p className="font-semibold text-foreground">
                          {formatCurrency(maxSpendResult.maxAnnualExpenses)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">FIRE Number</p>
                        <p className="font-semibold text-foreground">
                          {formatCurrency(maxSpendResult.fireNumber)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className="p-4 rounded-lg"
                  style={{ backgroundColor: `${maxSpendResult.level.color}15` }}
                >
                  <h3 className="text-sm font-semibold mb-1" style={{ color: maxSpendResult.level.color }}>
                    {maxSpendResult.level.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {maxSpendResult.level.description}
                  </p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Advanced Settings */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="advanced" className="border-border">
            <AccordionTrigger className="text-sm text-muted-foreground hover:text-foreground">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Advanced Settings
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              {/* Couple Multiplier */}
              <div className="space-y-2">
                <Label className="text-xs">
                  Couple Expense Multiplier: {coupleMultiplier.toFixed(1)}x
                </Label>
                <Slider
                  value={[coupleMultiplier]}
                  onValueChange={(v) => setCoupleMultiplier(v[0])}
                  min={1.0}
                  max={2.0}
                  step={0.1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Couples typically spend 1.5-1.7x a single person due to economies of scale
                </p>
              </div>

              {/* Withdrawal Rate Override */}
              <div className="space-y-2">
                <Label className="text-xs">Custom Withdrawal Rate (%)</Label>
                <Input
                  type="number"
                  value={customWithdrawalRate || ""}
                  onChange={(e) =>
                    setCustomWithdrawalRate(
                      e.target.value ? parseFloat(e.target.value) / 100 : null
                    )
                  }
                  placeholder={`Auto (${(fireResult.level.withdrawalRate * 100).toFixed(1)}%)`}
                  step="0.1"
                  min="2.0"
                  max="5.0"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Standard: 2.5% (Fat), 3.5% (Chubby/Regular/Lean) per Morningstar 2024
                </p>
              </div>

              {/* Part-Time Income */}
              <div className="space-y-2">
                <Label className="text-xs">Part-Time Income (for Barista FIRE)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    $
                  </span>
                  <Input
                    type="number"
                    value={partTimeIncome}
                    onChange={(e) => setPartTimeIncome(parseInt(e.target.value) || 0)}
                    placeholder="0"
                    step="1000"
                    min="0"
                    max="50000"
                    className="pl-6 font-mono text-sm"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Annual income from part-time work (typically $15-30k)
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
