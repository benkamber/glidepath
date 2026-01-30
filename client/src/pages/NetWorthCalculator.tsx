import { useState, useEffect, useMemo, useCallback } from "react";
import { format, differenceInDays, addDays } from "date-fns";
import { parseFlexibleDate, getDateInputHint } from "@/lib/date-parser";
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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  Flame,
  Globe,
} from "lucide-react";

// New components for peer contextualization
import { ProfileSection } from "@/components/ProfileSection";
import { PercentileContext } from "@/components/PercentileContext";
import { EnhancedProjection } from "@/components/EnhancedProjection";
import { ShareableCard } from "@/components/ShareableCard";
import { RoastMode } from "@/components/RoastMode";
import { COLComparisonSimplified } from "@/components/COLComparisonSimplified";
import { useUserProfile } from "@/hooks/use-user-profile";
import { getWageEstimate } from "@/data/bls-wage-data";
import { inferSavingsRate, projectFutureWealth, projectionScenarios } from "@/models/wealth-model";
import { wealthByAge, getBracketForAge } from "@/data/scf-data";

// New analysis components
import { VelocityChart } from "@/components/VelocityChart";
import { DeviationAlert } from "@/components/DeviationAlert";
import { FIRECalculator } from "@/components/fire/FIRECalculator";
import { MultiScenarioAnalysis } from "@/components/MultiScenarioAnalysis";
import { RunwayAnalysis } from "@/components/RunwayAnalysis";
// import { AIInsights } from "@/components/AIInsights"; // Removed - provides bad recommendations
import { UnifiedChartSystem } from "@/components/UnifiedChartSystem";
import { DataSources } from "@/components/DataSources";
// import { DataImport } from "@/components/DataImport"; // Disabled - AI costs
import { SimpleDataImport } from "@/components/SimpleDataImport";
import { MonteCarloRunner } from "@/components/monte-carlo/MonteCarloRunner";
import { MonteCarloResults } from "@/components/monte-carlo/MonteCarloResults";
import type { AggregatedResults } from "@/lib/monte-carlo";

// New utilities
import { setItem, getItem, removeItem, isStorageAvailable, StorageError } from "@/lib/storage";
import { exportData, importDataFromFile, shouldShowBackupReminder, markBackupReminderShown } from "@/lib/data-backup";
import { validateNetWorthEntry, validateDateEntry } from "@/lib/validation";
import { useToast } from "@/hooks/use-toast";
import { Download, Upload, AlertTriangle } from "lucide-react";

// Types
interface Entry {
  id: string;
  date: string;
  totalNetWorth: number;
  cash: number;
  investment?: number; // Investment amount (if not specified, calculated as totalNetWorth - cash)
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

// Date parsing is now handled by @/lib/date-parser

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
  const [formDateInput, setFormDateInput] = useState(format(new Date(), "MM/dd/yyyy"));
  const [formNetWorth, setFormNetWorth] = useState("");
  const [formCash, setFormCash] = useState("");

  // Target calculator state
  const [targetAmount, setTargetAmount] = useState("");
  const [targetField, setTargetField] = useState<"totalNetWorth" | "cash">("totalNetWorth");

  // Projection horizon: use retirement age if set, otherwise manual selection
  const projectionHorizonYears = useMemo(() => {
    if (profile?.targetRetirementAge && profile.age < profile.targetRetirementAge) {
      return profile.targetRetirementAge - profile.age;
    }
    return manualProjectionYears;
  }, [profile?.targetRetirementAge, profile?.age, manualProjectionYears]);

  const [manualProjectionYears, setManualProjectionYears] = useState(10);

  // SWR settings
  const [swrUseCashOnly, setSwrUseCashOnly] = useState(false);

  // Monte Carlo results
  const [monteCarloResults, setMonteCarloResults] = useState<AggregatedResults | null>(null);

  // Feature toggles
  const [showRoast, setShowRoast] = useState(false);
  const [showCOL, setShowCOL] = useState(false);

  // Toast notifications
  const { toast } = useToast();

  // Load from localStorage with error handling
  useEffect(() => {
    if (!isStorageAvailable()) {
      toast({
        variant: "destructive",
        title: "Storage Unavailable",
        description: "localStorage is disabled. Your data will not persist between sessions.",
      });
      setIsLoaded(true);
      return;
    }

    try {
      const stored = getItem<Entry[]>(STORAGE_KEY);
      if (stored) {
        setEntries(stored);
      }
    } catch (error) {
      console.error("Failed to load stored data:", error);
      toast({
        variant: "destructive",
        title: "Failed to Load Data",
        description: "Could not load your saved data. Starting fresh.",
      });
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage with error handling
  useEffect(() => {
    if (isLoaded && entries.length > 0) {
      const result = setItem(STORAGE_KEY, entries);
      if (!result.success && result.error) {
        toast({
          variant: "destructive",
          title: result.error.code === 'QUOTA_EXCEEDED' ? "Storage Full" : "Save Failed",
          description: result.error.message,
        });
      }
    }
  }, [entries, isLoaded, toast]);

  // Show backup reminder
  useEffect(() => {
    if (isLoaded && entries.length > 5 && shouldShowBackupReminder()) {
      setTimeout(() => {
        toast({
          title: "Backup Recommended",
          description: "It's been a while since you backed up your data. Export your data to stay safe!",
          action: (
            <Button
              size="sm"
              onClick={() => {
                handleExportData();
                markBackupReminderShown();
              }}
            >
              Export Now
            </Button>
          ),
        });
      }, 3000); // Show after 3 seconds
    }
  }, [isLoaded, entries.length]);

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

  // Infer savings rate from historical data (replaces manual input)
  const inferredSavingsRate = useMemo(() => {
    if (!profile || entries.length < 2) {
      return profile?.savingsRate || 0.25; // Use old value if exists, or default 25%
    }

    const estimatedIncome = getWageEstimate(profile.occupation, profile.level, profile.metro).totalComp;
    const inferred = inferSavingsRate(
      entries.map(e => ({ date: e.date, totalNetWorth: e.totalNetWorth })),
      estimatedIncome,
      0.07 // 7% annual return assumption
    );

    return inferred;
  }, [profile, entries]);

  // Generate proper wealth projection using career model (replaces simple compound growth)
  const wealthProjection = useMemo(() => {
    if (!profile || !latestEntry) return undefined;

    const targetAge = profile.age + projectionHorizonYears;

    try {
      const projection = projectFutureWealth(
        {
          currentAge: profile.age,
          startAge: profile.age - profile.yearsInWorkforce,
          occupation: profile.occupation,
          level: profile.level,
          metro: profile.metro,
          savingsRate: inferredSavingsRate,
          annualReturn: 0.07, // 7% real return
          currentNetWorth: latestEntry.totalNetWorth,
        },
        targetAge,
        projectionScenarios['current'] // Use "current path" scenario
      );

      return {
        yearByYear: projection.yearByYear,
        assumptions: projection.assumptions,
      };
    } catch (error) {
      console.error('Error generating wealth projection:', error);
      return undefined;
    }
  }, [profile, latestEntry, inferredSavingsRate, projectionHorizonYears]);

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
  // NOTE: This angle metric is mathematically valid but not particularly meaningful
  // for interpretation. The normalization (slope / currentNW * 100) creates an
  // arbitrary scaling that makes the angle hard to interpret.
  // Velocity and acceleration analysis (first/second derivatives) provide
  // more rigorous and interpretable insights. Consider deprecating this metric.
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
  const handleDateInputChange = (input: string) => {
    setFormDateInput(input);
    const parsed = parseFlexibleDate(input);
    if (parsed) {
      setFormDate(format(parsed, "yyyy-MM-dd"));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const netWorth = parseFloat(formNetWorth);
    const cash = parseFloat(formCash);

    // Calculate investment amount from profile allocation
    const investmentPercent = profile?.targetAllocation?.investmentPercent ?? 0.70;
    const investment = netWorth * investmentPercent;

    // Validate numbers
    const entryValidation = validateNetWorthEntry(netWorth, cash, sortedEntries);
    if (!entryValidation.isValid) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: entryValidation.errors.join(". "),
      });
      return;
    }

    // Show warnings if any
    if (entryValidation.warnings.length > 0) {
      toast({
        title: "Please Verify",
        description: entryValidation.warnings.join(". "),
      });
    }

    // Validate date
    const parsedDate = parseFlexibleDate(formDateInput);
    const dateValidation = validateDateEntry(
      parsedDate,
      entries.map((e) => e.date)
    );

    if (!dateValidation.isValid) {
      toast({
        variant: "destructive",
        title: "Invalid Date",
        description: dateValidation.errors.join(". "),
      });
      return;
    }

    // Show date warnings if any
    if (dateValidation.warnings.length > 0) {
      toast({
        title: "Date Warning",
        description: dateValidation.warnings.join(". "),
      });
    }

    const existingIndex = entries.findIndex((entry) => entry.date === formDate);

    const newEntry: Entry = {
      id: existingIndex >= 0 ? entries[existingIndex].id : generateId(),
      date: formDate,
      totalNetWorth: netWorth,
      cash: cash,
      investment: investment,
    };

    if (existingIndex >= 0) {
      const updated = [...entries];
      updated[existingIndex] = newEntry;
      setEntries(updated);
      toast({
        variant: "success",
        title: "Entry Updated",
        description: `Updated entry for ${format(new Date(formDate), "MMM d, yyyy")}`,
      });
    } else {
      setEntries([...entries, newEntry]);
      toast({
        variant: "success",
        title: "Entry Saved",
        description: `Added entry for ${format(new Date(formDate), "MMM d, yyyy")}`,
      });
    }

    setFormNetWorth("");
    setFormCash("");
    setFormDateInput(format(new Date(), "MM/dd/yyyy"));
  };

  const deleteEntry = (id: string) => {
    const entry = entries.find((e) => e.id === id);
    setEntries(entries.filter((e) => e.id !== id));

    if (entry) {
      toast({
        title: "Entry Deleted",
        description: `Deleted entry from ${format(new Date(entry.date), "MMM d, yyyy")}`,
      });
    }
  };

  const handleReset = () => {
    setEntries([]);
    clearProfile();
    removeItem(STORAGE_KEY);
    toast({
      variant: "destructive",
      title: "All Data Cleared",
      description: "All entries and profile data have been removed.",
    });
  };

  // Export data handler (useCallback to allow early reference)
  const handleExportData = useCallback(() => {
    try {
      exportData(entries, profile);
      toast({
        variant: "success",
        title: "Data Exported",
        description: "Your data has been downloaded as a JSON file.",
      });
      markBackupReminderShown();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
      });
    }
  }, [entries, profile, toast]);

  // Import data handler (useCallback to allow early reference)
  const handleImportData = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const importedData = await importDataFromFile(file);

      // Show confirmation toast instead of window.confirm
      toast({
        title: "Import Data?",
        description: `Import ${importedData.entries.length} entries? Current data will be replaced.`,
        action: (
          <Button
            size="sm"
            variant="default"
            onClick={() => {
              setEntries(importedData.entries);
              if (importedData.profile) {
                updateProfile(importedData.profile as any);
              }
              toast({
                variant: "success",
                title: "Data Imported",
                description: `Successfully imported ${importedData.entries.length} entries.`,
              });
            }}
          >
            Import
          </Button>
        ),
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Import Failed",
        description: error.message || "Failed to import data. Please check the file format.",
      });
    }

    // Reset file input
    event.target.value = "";
  }, [toast, updateProfile]);

  const loadEntryToForm = useCallback((entry: Entry) => {
    setFormDate(entry.date);
    setFormDateInput(format(new Date(entry.date), "MM/dd/yyyy"));
    setFormNetWorth(entry.totalNetWorth.toString());
    setFormCash(entry.cash.toString());
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
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-terminal-border pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-wider text-primary">GLIDEPATH</h1>
            <p className="text-muted-foreground mt-1 text-xs font-mono uppercase tracking-wide">
              Wealth trajectory analysis system
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ShareableCard
              currentNetWorth={latestEntry?.totalNetWorth ?? null}
              profile={profile}
            />
            {/* Export Data Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportData}
              disabled={entries.length === 0}
              title="Export your data as JSON backup"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>

            {/* Import Data Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('import-file')?.click()}
              title="Import data from JSON backup"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <input
              id="import-file"
              type="file"
              accept=".json"
              onChange={handleImportData}
              className="hidden"
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
            investment={latestEntry.investment}
            profile={profile}
            onClose={() => setShowRoast(false)}
          />
        )}

        {/* COL Comparison - Simplified with International Cities */}
        {showCOL && latestEntry && profile && (
          <COLComparisonSimplified
            currentMetro={profile.metro}
            currentSalary={profile.totalCompensation || getWageEstimate(profile.occupation, profile.level, profile.metro).totalComp}
            currentNetWorth={latestEntry.totalNetWorth}
            age={profile.age}
            occupation={profile.occupation}
            level={profile.level}
            savingsRate={inferredSavingsRate}
            yearsOfHistoricalData={
              sortedEntries.length >= 2
                ? Math.floor(
                    differenceInDays(
                      new Date(sortedEntries[sortedEntries.length - 1].date),
                      new Date(sortedEntries[0].date)
                    ) / 365
                  )
                : 0
            }
          />
        )}

        {/* Summary Cards */}
        {latestEntry && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card className="terminal-card terminal-border">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-mono">Total Net Worth</p>
                    <p className="text-2xl font-mono font-bold mt-2 text-primary">
                      {formatCurrency(latestEntry.totalNetWorth)}
                    </p>
                  </div>
                  <div
                    className={`flex items-center gap-1 text-xs font-mono ${
                      annualizedNetWorthGrowth >= 0 ? "text-primary" : "text-destructive"
                    }`}
                  >
                    {annualizedNetWorthGrowth >= 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    <span>{formatPercent(annualizedNetWorthGrowth)}</span>
                  </div>
                </div>
                {/* Angle metric - Consider removing in favor of velocity/acceleration analysis */}
                <p className="text-xs text-muted-foreground mt-2 font-mono" title="Trajectory angle - less meaningful than velocity/acceleration metrics">
                  ANGLE: {netWorthAngle.toFixed(1)}° (see velocity chart for better insights)
                </p>
              </CardContent>
            </Card>

            <Card className="terminal-card terminal-border">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-mono">Cash Liquid</p>
                    <p className="text-2xl font-mono font-bold mt-2 text-primary">
                      {formatCurrency(latestEntry.cash)}
                    </p>
                  </div>
                  <div
                    className={`flex items-center gap-1 text-xs font-mono ${
                      annualizedCashGrowth >= 0 ? "text-primary" : "text-destructive"
                    }`}
                  >
                    {annualizedCashGrowth >= 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    <span>{formatPercent(annualizedCashGrowth)}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2 font-mono">
                  ANGLE: {cashAngle.toFixed(1)}°
                </p>
              </CardContent>
            </Card>

            <Card className="terminal-card terminal-border">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-mono">Data Points</p>
                    <p className="text-2xl font-mono font-bold mt-2 text-primary">{entries.length}</p>
                  </div>
                  <Calculator className="h-4 w-4 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground mt-2 font-mono">
                  {sortedEntries.length >= 2
                    ? `${differenceInDays(
                        new Date(sortedEntries[sortedEntries.length - 1].date),
                        new Date(sortedEntries[0].date)
                      )} DAYS`
                    : "INIT SESSION"}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Entry Form */}
          <Card className="lg:col-span-1 terminal-card terminal-border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-mono uppercase tracking-wider text-primary">
                <Plus className="h-4 w-4" />
                Data Entry
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Require allocation setup before data entry */}
              {!profile?.targetAllocation && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Setup Required:</strong> Please complete your asset allocation in your profile first.
                    This is needed for accurate Monte Carlo projections and wealth trajectory calculations.
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="text"
                    placeholder="1/15/2024 or Jan 15, 2024"
                    value={formDateInput}
                    onChange={(e) => handleDateInputChange(e.target.value)}
                    required
                  />
                  {formDateInput && parseFlexibleDate(formDateInput) && (
                    <p className="text-xs text-muted-foreground">
                      Parsed as: {format(parseFlexibleDate(formDateInput)!, "MMMM d, yyyy")}
                    </p>
                  )}
                  {formDateInput && !parseFlexibleDate(formDateInput) && (
                    <p className="text-xs text-destructive">
                      Invalid date format. {getDateInputHint()}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="netWorth">Total Net Worth</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="netWorth"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formNetWorth}
                      onChange={(e) => setFormNetWorth(e.target.value)}
                      className="pl-7"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cash">Cash & Liquid Assets</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="cash"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formCash}
                      onChange={(e) => setFormCash(e.target.value)}
                      className="pl-7"
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ALL liquid assets: checking, savings, money market, CDs, etc.
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={!profile?.targetAllocation}
                >
                  {!profile?.targetAllocation ? "Complete Profile Allocation First" : "Save Entry"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Old manual charts REMOVED - replaced by UnifiedChartSystem below */}
        </div>

        {/* Unified Chart System - New Advanced Visualization */}
        {entries.length >= 2 && profile && latestEntry && (() => {
          // Generate percentile bands for peer comparison
          const percentileData = Array.from({ length: 80 }, (_, i) => {
            const age = 18 + i; // Ages 18-97
            const bracket = getBracketForAge(age);
            const data = wealthByAge[bracket];
            return {
              age,
              p10: data?.p10 || 0,
              p25: data?.p25 || 0,
              p50: data?.p50 || 0,
              p75: data?.p75 || 0,
              p90: data?.p90 || 0,
              p95: data?.p95 || 0,
            };
          });

          return (
          <UnifiedChartSystem
            entries={entries.map(e => ({
              date: e.date,
              totalNetWorth: e.totalNetWorth,
              cash: e.cash,
              investment: e.investment || (e.totalNetWorth - e.cash),
            }))}
            monteCarloData={monteCarloNetWorth || undefined}
            profileProjection={wealthProjection}
            fireThresholds={[
              { name: "Lean FIRE", amount: 1000000, color: "#fbbf24" },
              { name: "Regular FIRE", amount: 1500000, color: "#10b981" },
              { name: "Chubby FIRE", amount: 2500000, color: "#6366f1" },
              { name: "Fat FIRE", amount: 4000000, color: "#f59e0b" },
            ]}
            percentileData={percentileData}
            currentAge={profile?.age}
            projectionHorizonYears={projectionHorizonYears}
            onProjectionHorizonChange={setManualProjectionYears}
            targetRetirementAge={profile?.targetRetirementAge}
          />
          );
        })()}

        {/* Enhanced Projection - CONSOLIDATED into UnifiedChartSystem projection lens */}
        {/* <EnhancedProjection
          currentNetWorth={latestEntry?.totalNetWorth ?? null}
          profile={profile}
          monteCarloData={monteCarloNetWorth}
          historicalGrowthRate={annualizedNetWorthGrowth}
        /> */}

        {/* Deviation Alert - Shows if significantly ahead or behind trajectory */}
        {entries.length >= 3 && (
          <DeviationAlert entries={entries} />
        )}

        {/* AI Insights - REMOVED: Provides bad recommendations about cash allocation */}
        {/* {entries.length >= 2 && profile && latestEntry && (
          <AIInsights
            currentNetWorth={latestEntry.totalNetWorth}
            cash={latestEntry.cash}
            age={profile.age}
            annualIncome={getWageEstimate(profile.occupation, profile.level, profile.metro).totalComp}
            savingsRate={inferredSavingsRate}
            entries={entries}
            averageAnnualGrowth={annualizedNetWorthGrowth}
            recentVelocity={
              entries.length >= 3
                ? (() => {
                    const recent = sortedEntries.slice(-3);
                    if (recent.length < 2) return undefined;
                    const days = differenceInDays(
                      new Date(recent[recent.length - 1].date),
                      new Date(recent[0].date)
                    );
                    return days > 0
                      ? (recent[recent.length - 1].totalNetWorth - recent[0].totalNetWorth) / days
                      : undefined;
                  })()
                : undefined
            }
            overallVelocity={
              sortedEntries.length >= 2
                ? (() => {
                    const days = differenceInDays(
                      new Date(sortedEntries[sortedEntries.length - 1].date),
                      new Date(sortedEntries[0].date)
                    );
                    return days > 0
                      ? (sortedEntries[sortedEntries.length - 1].totalNetWorth -
                          sortedEntries[0].totalNetWorth) /
                          days
                      : undefined;
                  })()
                : undefined
            }
          />
        )} */}

        {/* Analysis Tools - Non-Chart Tools Only (Charts are in UnifiedChartSystem lenses) */}
        {entries.length >= 2 && profile && latestEntry && (
          <Tabs defaultValue="fire" className="w-full">
            <TabsList className="grid w-full grid-cols-3 gap-1">
              <TabsTrigger value="fire" className="gap-2 text-xs lg:text-sm">
                <Flame className="h-4 w-4" />
                <span className="hidden sm:inline">FIRE Calculator</span>
              </TabsTrigger>
              <TabsTrigger value="runway" className="gap-2 text-xs lg:text-sm">
                <PiggyBank className="h-4 w-4" />
                <span className="hidden sm:inline">Runway</span>
              </TabsTrigger>
              <TabsTrigger value="tools" className="gap-2 text-xs lg:text-sm">
                <Calculator className="h-4 w-4" />
                <span className="hidden sm:inline">Tools</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="fire" className="space-y-4 mt-4">
              <FIRECalculator
                currentNetWorth={latestEntry.totalNetWorth}
                currentAge={profile.age}
                annualIncome={getWageEstimate(profile.occupation, profile.level, profile.metro).totalComp}
                monthlyExpenses={profile.monthlyExpenses}
              />
            </TabsContent>

            <TabsContent value="runway" className="space-y-4 mt-4">
              <RunwayAnalysis
                currentNetWorth={latestEntry.totalNetWorth}
                cashBalance={latestEntry.cash}
                investmentBalance={latestEntry.totalNetWorth - latestEntry.cash}
                historicalEntries={entries}
              />
            </TabsContent>

            {/* REMOVED: Scenarios tab - use UnifiedChartSystem "Projection" lens instead */}
            {/* REMOVED: Velocity tab - use UnifiedChartSystem "Velocity" lens instead */}

            <TabsContent value="tools" className="space-y-4 mt-4">
              {/* Legacy Analysis Section */}
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
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="target"
                    type="number"
                    step="1000"
                    placeholder="1000000"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="pl-7"
                  />
                </div>
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
            </TabsContent>
          </Tabs>
        )}

        {/* Data Import - Local Parser (No AI Costs) */}
        <SimpleDataImport
          onImport={(importedEntries) => {
            // Convert imported entries to Entry format and add them
            const newEntries = importedEntries.map(ie => ({
              id: Date.now().toString() + Math.random(),
              date: ie.date,
              totalNetWorth: ie.totalNetWorth,
              cash: ie.cash,
              investment: ie.investment,
            }));
            setEntries([...entries, ...newEntries]);
          }}
        />

        {/* Monte Carlo Simulation */}
        {entries.length >= 2 && profile && latestEntry && (
          <div className="space-y-6">
            <MonteCarloRunner
              currentNetWorth={latestEntry.totalNetWorth}
              currentCash={latestEntry.cash}
              monthlyIncome={getWageEstimate(profile.occupation, profile.level, profile.metro).afterTaxComp}
              monthlyExpenses={getWageEstimate(profile.occupation, profile.level, profile.metro).afterTaxComp * (1 - inferredSavingsRate)}
              savingsRate={inferredSavingsRate}
              onResults={(results) => setMonteCarloResults(results)}
            />

            {monteCarloResults && (
              <MonteCarloResults results={monteCarloResults} />
            )}
          </div>
        )}

        {/* Data Sources & Methodology */}
        <DataSources />

        {/* Entry History - Collapsible Ledger */}
        <Card>
          <CardContent className="pt-6">
            <Accordion type="single" collapsible defaultValue="history">
              <AccordionItem value="history">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold">Entry History</span>
                    <Badge variant="secondary" className="ml-2">
                      {sortedEntries.length} {sortedEntries.length === 1 ? 'entry' : 'entries'}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {sortedEntries.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-2 font-medium">Date</th>
                            <th className="text-right py-3 px-2 font-medium">Net Worth</th>
                            <th className="text-right py-3 px-2 font-medium">Cash</th>
                            <th className="text-right py-3 px-2 font-medium">Investment</th>
                            <th className="text-right py-3 px-2 font-medium">Change</th>
                            <th className="text-right py-3 px-2 font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...sortedEntries].reverse().map((entry, idx, arr) => {
                            const prevEntry = arr[idx + 1];
                            const change = prevEntry ? entry.totalNetWorth - prevEntry.totalNetWorth : 0;
                            const changePercent = prevEntry && prevEntry.totalNetWorth !== 0
                              ? (change / prevEntry.totalNetWorth) * 100
                              : 0;

                            return (
                              <tr key={entry.id} className="border-b border-border/50 hover:bg-muted/30">
                                <td className="py-3 px-2">
                                  {format(new Date(entry.date), "MMM d, yyyy")}
                                </td>
                                <td className="text-right py-3 px-2 font-medium">
                                  {formatCurrency(entry.totalNetWorth)}
                                </td>
                                <td className="text-right py-3 px-2">{formatCurrency(entry.cash)}</td>
                                <td className="text-right py-3 px-2">
                                  {formatCurrency(entry.investment || (entry.totalNetWorth - entry.cash))}
                                </td>
                                <td className={`text-right py-3 px-2 ${
                                  change > 0 ? 'text-emerald-600 dark:text-emerald-400' :
                                  change < 0 ? 'text-red-600 dark:text-red-400' :
                                  'text-muted-foreground'
                                }`}>
                                  {prevEntry ? (
                                    <>
                                      {change > 0 ? '+' : ''}{formatCurrency(change)}
                                      <span className="text-xs ml-1">
                                        ({changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%)
                                      </span>
                                    </>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
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
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      No entries yet. Add your first entry above.
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pt-4 border-t space-y-1">
          <p>All data stored locally in your browser. No data leaves your device.</p>
          <p>
            Benchmark data: Federal Reserve SCF 2022 + BLS OES 2023 |
            <a href="/methodology" className="text-primary hover:underline ml-1">
              View Methodology
            </a>
          </p>
          <button
            onClick={() => {
              removeItem('nw_tracker_onboarded');
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
