import { useState, useEffect, useMemo, useCallback } from "react";
import { format, differenceInDays, addDays } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Plus,
  Trash2,
  Calculator,
  PiggyBank,
  Wallet,
  Building2,
  ChevronDown,
  ChevronUp,
  Flame,
  Globe,
} from "lucide-react";

// New components for peer contextualization
import { ProfileSection } from "@/components/ProfileSection";
import { PercentileContext } from "@/components/PercentileContext";
import { EnhancedProjection } from "@/components/EnhancedProjection";
import { ShareableCard } from "@/components/ShareableCard";
import { RoastMode } from "@/components/RoastMode";
import { COLComparison } from "@/components/COLComparison";
import { useUserProfile } from "@/hooks/use-user-profile";
import { getWageEstimate } from "@/data/bls-wage-data";

// Types
interface Entry {
  id: string;
  date: string;
  totalNetWorth: number;
  cash: number;
  retirementAccounts: RetirementAccount[];
}

interface RetirementAccount {
  id: string;
  name: string;
  balance: number;
  type: "401k" | "ira" | "roth_ira" | "403b" | "other";
}

interface MonteCarloResult {
  percentile5: number[];
  percentile25: number[];
  percentile50: number[];
  percentile75: number[];
  percentile95: number[];
  dates: string[];
}

// Constants
const STORAGE_KEY = "net-worth-tracker-data";
const IRS_EARLY_WITHDRAWAL_PENALTY = 0.1;
const ESTIMATED_TAX_RATE = 0.22;

// Helper functions
const generateId = () => Math.random().toString(36).substr(2, 9);

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const formatPercent = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

// Calculate linear regression
const linearRegression = (data: { x: number; y: number }[]) => {
  const n = data.length;
  if (n < 2) return { slope: 0, intercept: 0, r2: 0 };

  const sumX = data.reduce((acc, d) => acc + d.x, 0);
  const sumY = data.reduce((acc, d) => acc + d.y, 0);
  const sumXY = data.reduce((acc, d) => acc + d.x * d.y, 0);
  const sumX2 = data.reduce((acc, d) => acc + d.x * d.x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  const meanY = sumY / n;
  const ssTotal = data.reduce((acc, d) => acc + Math.pow(d.y - meanY, 2), 0);
  const ssResidual = data.reduce(
    (acc, d) => acc + Math.pow(d.y - (slope * d.x + intercept), 2),
    0
  );
  const r2 = ssTotal === 0 ? 1 : 1 - ssResidual / ssTotal;

  return { slope, intercept, r2 };
};

// Calculate daily growth rate
const calculateDailyGrowthRate = (entries: Entry[], field: "totalNetWorth" | "cash") => {
  if (entries.length < 2) return 0;

  const sorted = [...entries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const days = differenceInDays(new Date(last.date), new Date(first.date));

  if (days === 0 || first[field] <= 0) return 0;

  const totalGrowth = last[field] / first[field];
  const dailyRate = Math.pow(totalGrowth, 1 / days) - 1;

  return dailyRate;
};

// Monte Carlo simulation
const runMonteCarloSimulation = (
  entries: Entry[],
  field: "totalNetWorth" | "cash",
  projectionDays: number,
  simulations: number = 1000
): MonteCarloResult | null => {
  if (entries.length < 3) return null;

  const sorted = [...entries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const returns: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1][field];
    const curr = sorted[i][field];
    if (prev > 0) {
      returns.push((curr - prev) / prev);
    }
  }

  if (returns.length < 2) return null;

  const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance =
    returns.reduce((acc, r) => acc + Math.pow(r - meanReturn, 2), 0) /
    (returns.length - 1);
  const stdDev = Math.sqrt(variance);

  const lastValue = sorted[sorted.length - 1][field];
  const lastDate = new Date(sorted[sorted.length - 1].date);
  const allPaths: number[][] = [];

  for (let sim = 0; sim < simulations; sim++) {
    const path: number[] = [lastValue];
    let currentValue = lastValue;

    for (let day = 1; day <= projectionDays; day++) {
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      const dailyReturn = meanReturn + stdDev * z;
      currentValue = currentValue * (1 + dailyReturn);
      path.push(Math.max(0, currentValue));
    }

    allPaths.push(path);
  }

  const percentiles = (dayIndex: number) => {
    const values = allPaths.map((path) => path[dayIndex]).sort((a, b) => a - b);
    return {
      p5: values[Math.floor(simulations * 0.05)],
      p25: values[Math.floor(simulations * 0.25)],
      p50: values[Math.floor(simulations * 0.5)],
      p75: values[Math.floor(simulations * 0.75)],
      p95: values[Math.floor(simulations * 0.95)],
    };
  };

  const dates: string[] = [];
  const percentile5: number[] = [];
  const percentile25: number[] = [];
  const percentile50: number[] = [];
  const percentile75: number[] = [];
  const percentile95: number[] = [];

  const step = Math.max(1, Math.floor(projectionDays / 52));
  for (let day = 0; day <= projectionDays; day += step) {
    const p = percentiles(day);
    dates.push(format(addDays(lastDate, day), "MMM yyyy"));
    percentile5.push(p.p5);
    percentile25.push(p.p25);
    percentile50.push(p.p50);
    percentile75.push(p.p75);
    percentile95.push(p.p95);
  }

  return { percentile5, percentile25, percentile50, percentile75, percentile95, dates };
};

// Calculate time to reach target
const calculateTimeToTarget = (
  currentValue: number,
  dailyGrowthRate: number,
  targetValue: number
): number | null => {
  if (dailyGrowthRate <= 0 || currentValue >= targetValue || currentValue <= 0) {
    return null;
  }

  const days = Math.log(targetValue / currentValue) / Math.log(1 + dailyGrowthRate);
  return Math.ceil(days);
};

export default function NetWorthCalculator() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // User profile hook
  const {
    profile,
    updateProfile,
    initializeProfile,
    clearProfile,
    isComplete: isProfileComplete,
    isLoaded: isProfileLoaded,
  } = useUserProfile();

  // Form state
  const [formDate, setFormDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [formNetWorth, setFormNetWorth] = useState("");
  const [formCash, setFormCash] = useState("");
  const [formRetirementAccounts, setFormRetirementAccounts] = useState<RetirementAccount[]>([]);

  // Target calculator state
  const [targetAmount, setTargetAmount] = useState("");
  const [targetField, setTargetField] = useState<"totalNetWorth" | "cash">("totalNetWorth");

  // SWR settings
  const [swrUseCashOnly, setSwrUseCashOnly] = useState(false);

  // Feature toggles
  const [showRoast, setShowRoast] = useState(false);
  const [showCOL, setShowCOL] = useState(false);

  // Expanded sections
  const [showRetirementSection, setShowRetirementSection] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setEntries(parsed);
      } catch (e) {
        console.error("Failed to parse stored data:", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    }
  }, [entries, isLoaded]);

  // Sorted entries
  const sortedEntries = useMemo(
    () =>
      [...entries].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      ),
    [entries]
  );

  // Latest entry
  const latestEntry = useMemo(
    () => (sortedEntries.length > 0 ? sortedEntries[sortedEntries.length - 1] : null),
    [sortedEntries]
  );

  // Growth calculations
  const netWorthGrowthRate = useMemo(
    () => calculateDailyGrowthRate(sortedEntries, "totalNetWorth"),
    [sortedEntries]
  );

  const cashGrowthRate = useMemo(
    () => calculateDailyGrowthRate(sortedEntries, "cash"),
    [sortedEntries]
  );

  // Annualized growth
  const annualizedNetWorthGrowth = Math.pow(1 + netWorthGrowthRate, 365) - 1;
  const annualizedCashGrowth = Math.pow(1 + cashGrowthRate, 365) - 1;

  // Growth angle (in degrees)
  const netWorthAngle = useMemo(() => {
    if (sortedEntries.length < 2) return 0;
    const data = sortedEntries.map((e, i) => ({ x: i, y: e.totalNetWorth }));
    const { slope } = linearRegression(data);
    const normalizedSlope = slope / (latestEntry?.totalNetWorth || 1) * 100;
    return Math.atan(normalizedSlope) * (180 / Math.PI);
  }, [sortedEntries, latestEntry]);

  const cashAngle = useMemo(() => {
    if (sortedEntries.length < 2) return 0;
    const data = sortedEntries.map((e, i) => ({ x: i, y: e.cash }));
    const { slope } = linearRegression(data);
    const normalizedSlope = slope / (latestEntry?.cash || 1) * 100;
    return Math.atan(normalizedSlope) * (180 / Math.PI);
  }, [sortedEntries, latestEntry]);

  // Monte Carlo projections
  const monteCarloNetWorth = useMemo(
    () => runMonteCarloSimulation(sortedEntries, "totalNetWorth", 365 * 3),
    [sortedEntries]
  );

  // Time to target calculation
  const timeToTarget = useMemo(() => {
    const target = parseFloat(targetAmount);
    if (isNaN(target) || target <= 0 || !latestEntry) return null;

    const currentValue = targetField === "totalNetWorth" ? latestEntry.totalNetWorth : latestEntry.cash;
    const growthRate = targetField === "totalNetWorth" ? netWorthGrowthRate : cashGrowthRate;

    return calculateTimeToTarget(currentValue, growthRate, target);
  }, [targetAmount, targetField, latestEntry, netWorthGrowthRate, cashGrowthRate]);

  // SWR calculations
  const swrCalculations = useMemo(() => {
    if (!latestEntry) return null;

    const baseValue = swrUseCashOnly ? latestEntry.cash : latestEntry.totalNetWorth;

    return {
      swr25: baseValue * 0.025,
      swr35: baseValue * 0.035,
      swr4: baseValue * 0.04,
    };
  }, [latestEntry, swrUseCashOnly]);

  // Retirement account liquidation value
  const retirementLiquidationValue = useMemo(() => {
    if (!latestEntry) return null;

    const totalRetirement = latestEntry.retirementAccounts.reduce(
      (sum, acc) => sum + acc.balance,
      0
    );

    const rothAccounts = latestEntry.retirementAccounts.filter(
      (acc) => acc.type === "roth_ira"
    );
    const nonRothAccounts = latestEntry.retirementAccounts.filter(
      (acc) => acc.type !== "roth_ira"
    );

    const rothTotal = rothAccounts.reduce((sum, acc) => sum + acc.balance, 0);
    const nonRothTotal = nonRothAccounts.reduce((sum, acc) => sum + acc.balance, 0);

    const nonRothAfterPenalty = nonRothTotal * (1 - IRS_EARLY_WITHDRAWAL_PENALTY);
    const nonRothAfterTax = nonRothAfterPenalty * (1 - ESTIMATED_TAX_RATE);
    const rothAfterTax = rothTotal;

    return {
      totalRetirement,
      liquidationValue: nonRothAfterTax + rothAfterTax,
      penaltyAmount: nonRothTotal * IRS_EARLY_WITHDRAWAL_PENALTY,
      taxAmount: nonRothAfterPenalty * ESTIMATED_TAX_RATE,
      breakdown: latestEntry.retirementAccounts.map((acc) => ({
        ...acc,
        liquidationValue:
          acc.type === "roth_ira"
            ? acc.balance
            : acc.balance * (1 - IRS_EARLY_WITHDRAWAL_PENALTY) * (1 - ESTIMATED_TAX_RATE),
      })),
    };
  }, [latestEntry]);

  // Chart data
  const chartData = useMemo(
    () =>
      sortedEntries.map((e) => ({
        date: format(new Date(e.date), "MMM d"),
        fullDate: e.date,
        netWorth: e.totalNetWorth,
        cash: e.cash,
      })),
    [sortedEntries]
  );

  // Trendline data
  const trendlineData = useMemo(() => {
    if (sortedEntries.length < 2) return [];

    const netWorthData = sortedEntries.map((e, i) => ({ x: i, y: e.totalNetWorth }));
    const cashData = sortedEntries.map((e, i) => ({ x: i, y: e.cash }));

    const netWorthReg = linearRegression(netWorthData);
    const cashReg = linearRegression(cashData);

    return sortedEntries.map((e, i) => ({
      date: format(new Date(e.date), "MMM d"),
      netWorthTrend: netWorthReg.slope * i + netWorthReg.intercept,
      cashTrend: cashReg.slope * i + cashReg.intercept,
    }));
  }, [sortedEntries]);

  // Handlers
  const addRetirementAccountField = () => {
    setFormRetirementAccounts([
      ...formRetirementAccounts,
      { id: generateId(), name: "", balance: 0, type: "401k" },
    ]);
  };

  const removeRetirementAccountField = (id: string) => {
    setFormRetirementAccounts(formRetirementAccounts.filter((acc) => acc.id !== id));
  };

  const updateRetirementAccountField = (
    id: string,
    field: keyof RetirementAccount,
    value: string | number
  ) => {
    setFormRetirementAccounts(
      formRetirementAccounts.map((acc) =>
        acc.id === id ? { ...acc, [field]: value } : acc
      )
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const netWorth = parseFloat(formNetWorth);
    const cash = parseFloat(formCash);

    if (isNaN(netWorth) || isNaN(cash)) return;

    const existingIndex = entries.findIndex((entry) => entry.date === formDate);

    const newEntry: Entry = {
      id: existingIndex >= 0 ? entries[existingIndex].id : generateId(),
      date: formDate,
      totalNetWorth: netWorth,
      cash: cash,
      retirementAccounts: formRetirementAccounts.filter(
        (acc) => acc.name && acc.balance > 0
      ),
    };

    if (existingIndex >= 0) {
      const updated = [...entries];
      updated[existingIndex] = newEntry;
      setEntries(updated);
    } else {
      setEntries([...entries, newEntry]);
    }

    setFormNetWorth("");
    setFormCash("");
    setFormRetirementAccounts([]);
  };

  const deleteEntry = (id: string) => {
    setEntries(entries.filter((e) => e.id !== id));
  };

  const handleReset = () => {
    setEntries([]);
    clearProfile();
    localStorage.removeItem(STORAGE_KEY);
  };

  const loadEntryToForm = useCallback((entry: Entry) => {
    setFormDate(entry.date);
    setFormNetWorth(entry.totalNetWorth.toString());
    setFormCash(entry.cash.toString());
    setFormRetirementAccounts(entry.retirementAccounts);
    setShowRetirementSection(entry.retirementAccounts.length > 0);
  }, []);

  if (!isLoaded || !isProfileLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Net Worth Tracker</h1>
            <p className="text-muted-foreground mt-1">
              Track your wealth journey with precision
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ShareableCard
              currentNetWorth={latestEntry?.totalNetWorth ?? null}
              profile={profile}
            />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset all data?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all your entries and profile. This action cannot be
                    undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReset} className="bg-destructive">
                    Reset
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Profile Section */}
        <ProfileSection
          profile={profile}
          onProfileChange={updateProfile}
          onInitialize={initializeProfile}
          isComplete={isProfileComplete}
        />

        {/* Percentile Context - prominent "am I on track?" feedback */}
        <PercentileContext
          currentNetWorth={latestEntry?.totalNetWorth ?? null}
          profile={profile}
        />

        {/* Roast Mode + COL Comparison toggles */}
        {latestEntry && isProfileComplete && profile && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant={showRoast ? "default" : "outline"}
              size="sm"
              onClick={() => { setShowRoast(!showRoast); setShowCOL(false); }}
              className="gap-2"
            >
              <Flame className="h-4 w-4" />
              Roast My Numbers
            </Button>
            <Button
              variant={showCOL ? "default" : "outline"}
              size="sm"
              onClick={() => { setShowCOL(!showCOL); setShowRoast(false); }}
              className="gap-2"
            >
              <Globe className="h-4 w-4" />
              What If I Moved?
            </Button>
          </div>
        )}

        {/* Roast Mode */}
        {showRoast && latestEntry && profile && (
          <RoastMode
            currentNetWorth={latestEntry.totalNetWorth}
            cash={latestEntry.cash}
            profile={profile}
            retirementAccounts={latestEntry.retirementAccounts.reduce(
              (sum, acc) => sum + acc.balance,
              0
            )}
            onClose={() => setShowRoast(false)}
          />
        )}

        {/* COL Comparison */}
        {showCOL && latestEntry && profile && (
          <COLComparison
            currentMetro={profile.metro}
            currentSalary={getWageEstimate(profile.occupation, profile.level, profile.metro).totalComp}
            currentNetWorth={latestEntry.totalNetWorth}
            age={profile.age}
            occupation={profile.occupation}
            level={profile.level}
            savingsRate={profile.savingsRate}
          />
        )}

        {/* Summary Cards */}
        {latestEntry && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Net Worth</p>
                    <p className="text-2xl font-semibold mt-1">
                      {formatCurrency(latestEntry.totalNetWorth)}
                    </p>
                  </div>
                  <div
                    className={`flex items-center gap-1 text-sm ${
                      annualizedNetWorthGrowth >= 0 ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {annualizedNetWorthGrowth >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    {formatPercent(annualizedNetWorthGrowth)}/yr
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Growth angle: {netWorthAngle.toFixed(1)}°
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Cash</p>
                    <p className="text-2xl font-semibold mt-1">
                      {formatCurrency(latestEntry.cash)}
                    </p>
                  </div>
                  <div
                    className={`flex items-center gap-1 text-sm ${
                      annualizedCashGrowth >= 0 ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {annualizedCashGrowth >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    {formatPercent(annualizedCashGrowth)}/yr
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Growth angle: {cashAngle.toFixed(1)}°
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Retirement Accounts</p>
                    <p className="text-2xl font-semibold mt-1">
                      {formatCurrency(
                        latestEntry.retirementAccounts.reduce(
                          (sum, acc) => sum + acc.balance,
                          0
                        )
                      )}
                    </p>
                  </div>
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                </div>
                {retirementLiquidationValue && (
                  <p className="text-xs text-muted-foreground mt-2">
                    After penalty: {formatCurrency(retirementLiquidationValue.liquidationValue)}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Entries</p>
                    <p className="text-2xl font-semibold mt-1">{entries.length}</p>
                  </div>
                  <Calculator className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {sortedEntries.length >= 2
                    ? `${differenceInDays(
                        new Date(sortedEntries[sortedEntries.length - 1].date),
                        new Date(sortedEntries[0].date)
                      )} days tracked`
                    : "Start tracking today"}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Entry Form */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Plus className="h-5 w-5" />
                Add Entry
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="netWorth">Total Net Worth</Label>
                  <Input
                    id="netWorth"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formNetWorth}
                    onChange={(e) => setFormNetWorth(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cash">Cash (Liquid)</Label>
                  <Input
                    id="cash"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formCash}
                    onChange={(e) => setFormCash(e.target.value)}
                    required
                  />
                </div>

                {/* Retirement Accounts Section */}
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setShowRetirementSection(!showRetirementSection)}
                    className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showRetirementSection ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                    Retirement Accounts
                  </button>

                  {showRetirementSection && (
                    <div className="space-y-3 pl-2 border-l-2 border-border">
                      {formRetirementAccounts.map((acc) => (
                        <div key={acc.id} className="space-y-2 p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Input
                              placeholder="Account name"
                              value={acc.name}
                              onChange={(e) =>
                                updateRetirementAccountField(acc.id, "name", e.target.value)
                              }
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeRetirementAccountField(acc.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                          <div className="flex gap-2">
                            <select
                              value={acc.type}
                              onChange={(e) =>
                                updateRetirementAccountField(
                                  acc.id,
                                  "type",
                                  e.target.value as RetirementAccount["type"]
                                )
                              }
                              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                              <option value="401k">401(k)</option>
                              <option value="ira">Traditional IRA</option>
                              <option value="roth_ira">Roth IRA</option>
                              <option value="403b">403(b)</option>
                              <option value="other">Other</option>
                            </select>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Balance"
                              value={acc.balance || ""}
                              onChange={(e) =>
                                updateRetirementAccountField(
                                  acc.id,
                                  "balance",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="flex-1"
                            />
                          </div>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addRetirementAccountField}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Account
                      </Button>
                    </div>
                  )}
                </div>

                <Button type="submit" className="w-full">
                  Save Entry
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Charts */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Growth Trends</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length >= 2 ? (
                <Tabs defaultValue="combined" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="combined">Combined</TabsTrigger>
                    <TabsTrigger value="networth">Net Worth</TabsTrigger>
                    <TabsTrigger value="cash">Cash</TabsTrigger>
                  </TabsList>

                  <TabsContent value="combined" className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                          dataKey="date"
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                        />
                        <YAxis
                          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number) => [formatCurrency(value), ""]}
                        />
                        <Line
                          type="monotone"
                          dataKey="netWorth"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          dot={false}
                          name="Net Worth"
                        />
                        <Line
                          type="monotone"
                          dataKey="cash"
                          stroke="#10b981"
                          strokeWidth={2}
                          dot={false}
                          name="Cash"
                        />
                        {trendlineData.length > 0 && (
                          <>
                            <Line
                              type="monotone"
                              data={trendlineData}
                              dataKey="netWorthTrend"
                              stroke="hsl(var(--primary))"
                              strokeWidth={1}
                              strokeDasharray="5 5"
                              dot={false}
                              name="Net Worth Trend"
                            />
                            <Line
                              type="monotone"
                              data={trendlineData}
                              dataKey="cashTrend"
                              stroke="#10b981"
                              strokeWidth={1}
                              strokeDasharray="5 5"
                              dot={false}
                              name="Cash Trend"
                            />
                          </>
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </TabsContent>

                  <TabsContent value="networth" className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop
                              offset="5%"
                              stopColor="hsl(var(--primary))"
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor="hsl(var(--primary))"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                          dataKey="date"
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                        />
                        <YAxis
                          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number) => [formatCurrency(value), "Net Worth"]}
                        />
                        <Area
                          type="monotone"
                          dataKey="netWorth"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          fill="url(#netWorthGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </TabsContent>

                  <TabsContent value="cash" className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="cashGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                          dataKey="date"
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                        />
                        <YAxis
                          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number) => [formatCurrency(value), "Cash"]}
                        />
                        <Area
                          type="monotone"
                          dataKey="cash"
                          stroke="#10b981"
                          strokeWidth={2}
                          fill="url(#cashGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Add at least 2 entries to see trends
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Projection with Career Context */}
        <EnhancedProjection
          currentNetWorth={latestEntry?.totalNetWorth ?? null}
          profile={profile}
          monteCarloData={monteCarloNetWorth}
          historicalGrowthRate={annualizedNetWorthGrowth}
        />

        {/* Analysis Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Time to Target */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calculator className="h-5 w-5" />
                Time to Target
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button
                  variant={targetField === "totalNetWorth" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTargetField("totalNetWorth")}
                >
                  Net Worth
                </Button>
                <Button
                  variant={targetField === "cash" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTargetField("cash")}
                >
                  Cash
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="target">Target Amount</Label>
                <Input
                  id="target"
                  type="number"
                  step="1000"
                  placeholder="1000000"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                />
              </div>

              {timeToTarget !== null ? (
                <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                  <p className="text-sm text-muted-foreground">
                    At current growth rate ({formatPercent(
                      targetField === "totalNetWorth"
                        ? annualizedNetWorthGrowth
                        : annualizedCashGrowth
                    )}/yr):
                  </p>
                  <p className="text-2xl font-semibold">
                    {Math.floor(timeToTarget / 365)} years, {timeToTarget % 365} days
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Target date: {format(addDays(new Date(), timeToTarget), "MMMM d, yyyy")}
                  </p>
                </div>
              ) : targetAmount && latestEntry ? (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    {parseFloat(targetAmount) <= (targetField === "totalNetWorth" ? latestEntry.totalNetWorth : latestEntry.cash)
                      ? "You've already reached this target!"
                      : "Growth rate is zero or negative. Cannot project."}
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Coast FIRE / SWR */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <PiggyBank className="h-5 w-5" />
                Safe Withdrawal Rate (Annual)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="cashOnly"
                  checked={swrUseCashOnly}
                  onCheckedChange={(checked) => setSwrUseCashOnly(checked === true)}
                />
                <Label htmlFor="cashOnly" className="text-sm cursor-pointer">
                  Calculate using cash only (instead of total net worth)
                </Label>
              </div>

              {swrCalculations ? (
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground mb-1">2.5% SWR</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(swrCalculations.swr25)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatCurrency(swrCalculations.swr25 / 12)}/mo
                    </p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground mb-1">3.5% SWR</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(swrCalculations.swr35)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatCurrency(swrCalculations.swr35 / 12)}/mo
                    </p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground mb-1">4% SWR</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(swrCalculations.swr4)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatCurrency(swrCalculations.swr4 / 12)}/mo
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  Add an entry to see SWR calculations
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Based on {swrUseCashOnly ? "cash" : "total net worth"} of{" "}
                {latestEntry
                  ? formatCurrency(swrUseCashOnly ? latestEntry.cash : latestEntry.totalNetWorth)
                  : "$0"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Retirement Account Liquidation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wallet className="h-5 w-5" />
              Retirement Liquidation Value
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {retirementLiquidationValue && retirementLiquidationValue.totalRetirement > 0 ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Total Balance</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(retirementLiquidationValue.totalRetirement)}
                    </p>
                  </div>
                  <div className="p-4 bg-emerald-500/10 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">After Penalty & Tax</p>
                    <p className="text-lg font-semibold text-emerald-600">
                      {formatCurrency(retirementLiquidationValue.liquidationValue)}
                    </p>
                  </div>
                  <div className="p-4 bg-red-500/10 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">10% Penalty</p>
                    <p className="text-lg font-semibold text-red-600">
                      -{formatCurrency(retirementLiquidationValue.penaltyAmount)}
                    </p>
                  </div>
                  <div className="p-4 bg-red-500/10 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Est. Tax (22%)</p>
                    <p className="text-lg font-semibold text-red-600">
                      -{formatCurrency(retirementLiquidationValue.taxAmount)}
                    </p>
                  </div>
                </div>

                {retirementLiquidationValue.breakdown.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Account Breakdown</p>
                      {retirementLiquidationValue.breakdown.map((acc) => (
                        <div
                          key={acc.id}
                          className="flex justify-between items-center text-sm py-1"
                        >
                          <div>
                            <span>{acc.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              ({acc.type.replace("_", " ").toUpperCase()})
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-muted-foreground">
                              {formatCurrency(acc.balance)}
                            </span>
                            <span className="mx-2">→</span>
                            <span className="text-emerald-600">
                              {formatCurrency(acc.liquidationValue)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Add retirement accounts to see liquidation values
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Note: Roth IRA contributions can be withdrawn penalty-free. This is a simplified
              estimate assuming all Roth funds are contributions.
            </p>
          </CardContent>
        </Card>

        {/* Entry History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Entry History</CardTitle>
          </CardHeader>
          <CardContent>
            {sortedEntries.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-medium">Date</th>
                      <th className="text-right py-3 px-2 font-medium">Net Worth</th>
                      <th className="text-right py-3 px-2 font-medium">Cash</th>
                      <th className="text-right py-3 px-2 font-medium">Retirement</th>
                      <th className="text-right py-3 px-2 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...sortedEntries].reverse().map((entry) => (
                      <tr key={entry.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-3 px-2">
                          {format(new Date(entry.date), "MMM d, yyyy")}
                        </td>
                        <td className="text-right py-3 px-2">
                          {formatCurrency(entry.totalNetWorth)}
                        </td>
                        <td className="text-right py-3 px-2">{formatCurrency(entry.cash)}</td>
                        <td className="text-right py-3 px-2">
                          {formatCurrency(
                            entry.retirementAccounts.reduce((sum, acc) => sum + acc.balance, 0)
                          )}
                        </td>
                        <td className="text-right py-3 px-2">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => loadEntryToForm(entry)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteEntry(entry.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No entries yet. Add your first entry above.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pt-4 border-t space-y-1">
          <p>All data stored locally in your browser. No data leaves your device.</p>
          <p>
            Benchmark data: Federal Reserve SCF 2022 + BLS OES 2023
          </p>
          <button
            onClick={() => {
              localStorage.removeItem('nw_tracker_onboarded');
              window.location.reload();
            }}
            className="text-primary hover:underline"
          >
            About this tool
          </button>
        </div>
      </div>
    </div>
  );
}
