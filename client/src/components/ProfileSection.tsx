import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, User, Briefcase, MapPin, Percent, PieChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { LogarithmicSliderInput } from '@/components/ui/logarithmic-slider-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getOccupationOptions,
  getLevelOptions,
  getMetroOptions,
  getLevelForYears,
  getWageEstimate,
  type Occupation,
  type CareerLevel,
  type Metro,
} from '@/data/bls-wage-data';
import type { UserProfile, TargetAllocation } from '@/hooks/use-user-profile';
import { validateAllocation } from '@/hooks/use-user-profile';

interface ProfileSectionProps {
  profile: UserProfile | null;
  onProfileChange: (updates: Partial<UserProfile>) => void;
  onInitialize: () => void;
  isComplete: boolean;
  totalNetWorth?: number; // For showing dollar amounts in allocation sliders
}

export function ProfileSection({
  profile,
  onProfileChange,
  onInitialize,
  isComplete,
  totalNetWorth,
}: ProfileSectionProps) {
  // Default to expanded if profile is incomplete, collapsed if complete
  const [isExpanded, setIsExpanded] = useState(!isComplete);

  // Update expansion state when completeness changes
  useEffect(() => {
    if (!isComplete) {
      setIsExpanded(true);
    }
  }, [isComplete]);

  // Initialize profile if clicking to expand with no profile
  const handleToggle = () => {
    if (!profile && !isExpanded) {
      onInitialize();
    }
    setIsExpanded(!isExpanded);
  };

  // Auto-detect level when years change and autoDetect is enabled
  useEffect(() => {
    if (profile?.autoDetectLevel && profile.yearsInWorkforce >= 0) {
      const detectedLevel = getLevelForYears(profile.yearsInWorkforce);
      if (detectedLevel !== profile.level) {
        onProfileChange({ level: detectedLevel });
      }
    }
  }, [profile?.yearsInWorkforce, profile?.autoDetectLevel, profile?.level, onProfileChange]);

  const occupationOptions = getOccupationOptions();
  const levelOptions = getLevelOptions();
  const metroOptions = getMetroOptions();

  return (
    <Card>
      <CardHeader
        className="cursor-pointer select-none"
        onClick={handleToggle}
      >
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Your Profile
            {isComplete && (
              <span className="text-xs font-normal text-muted-foreground ml-2">
                {profile?.age}yo, {profile?.yearsInWorkforce}yrs {profile?.occupation?.replace('_', ' ')}
              </span>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </CardTitle>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Age and Years */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Age
              </Label>
              <Input
                id="age"
                type="number"
                min={18}
                max={80}
                value={profile?.age != null ? String(profile.age) : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    onProfileChange({ age: 0 });
                  } else {
                    onProfileChange({ age: parseInt(val, 10) || 0 });
                  }
                }}
                placeholder="30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="years" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Years Worked
              </Label>
              <Input
                id="years"
                type="number"
                min={0}
                max={50}
                value={profile?.yearsInWorkforce != null ? String(profile.yearsInWorkforce) : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    onProfileChange({ yearsInWorkforce: 0 });
                  } else {
                    onProfileChange({ yearsInWorkforce: parseInt(val, 10) || 0 });
                  }
                }}
                placeholder="8"
              />
            </div>
          </div>

          {/* Industry */}
          <div className="space-y-2">
            <Label>Industry</Label>
            <Select
              value={profile?.occupation ?? ''}
              onValueChange={(value) => onProfileChange({ occupation: value as Occupation })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your industry" />
              </SelectTrigger>
              <SelectContent>
                {occupationOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Career Level */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Career Level</Label>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="autoLevel"
                  checked={profile?.autoDetectLevel ?? true}
                  onCheckedChange={(checked) =>
                    onProfileChange({ autoDetectLevel: checked === true })
                  }
                />
                <Label htmlFor="autoLevel" className="text-sm font-normal cursor-pointer">
                  Auto-detect from years
                </Label>
              </div>
            </div>
            <Select
              value={profile?.level ?? ''}
              onValueChange={(value) => onProfileChange({ level: value as CareerLevel })}
              disabled={profile?.autoDetectLevel}
            >
              <SelectTrigger
                className={profile?.autoDetectLevel ? 'cursor-not-allowed' : ''}
              >
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                {levelOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Metro Area */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Metro Area
            </Label>
            <Select
              value={profile?.metro ?? ''}
              onValueChange={(value) => onProfileChange({ metro: value as Metro })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select metro area" />
              </SelectTrigger>
              <SelectContent>
                {metroOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Total Compensation */}
          <LogarithmicSliderInput
            id="totalComp"
            label="Annual Total Compensation (Optional - Leave Blank if Unemployed/Laid Off)"
            icon="💰"
            value={profile?.totalCompensation}
            onChange={(value) => onProfileChange({ totalCompensation: value })}
            min={10000}
            max={20000000}
            placeholder={profile?.occupation && profile?.level && profile?.metro
              ? new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(
                  getWageEstimate(profile.occupation, profile.level, profile.metro).totalComp
                )
              : 'Based on BLS'}
            description="Only needed if currently employed. Include ALL comp: base + bonus + equity + benefits. Used for geographic arbitrage & future projections. Leave blank if laid off/between jobs - we'll infer savings from your historical net worth growth instead."
          />

          {/* Monthly Expenses for FIRE Planning */}
          <LogarithmicSliderInput
            id="monthlyExpenses"
            label="Monthly Expenses (Optional - for FIRE Planning)"
            icon="💳"
            value={profile?.monthlyExpenses}
            onChange={(value) => onProfileChange({ monthlyExpenses: value })}
            min={500}
            max={100000}
            placeholder="e.g., 5,000"
            description="Used for FIRE calculations & retirement planning. Include all regular expenses: housing, food, transportation, insurance, entertainment. Excludes savings/investments. Helps calculate safe withdrawal rate and years to financial independence."
          />

          {/* Retirement Planning Goals */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="retirementAge" className="flex items-center gap-2">
                🎯 Target Retirement Age (Optional)
              </Label>
              <Input
                id="retirementAge"
                type="number"
                min={profile?.age || 18}
                max={90}
                placeholder="e.g., 65"
                value={profile?.targetRetirementAge ?? ''}
                onChange={(e) => onProfileChange({ targetRetirementAge: e.target.value ? parseInt(e.target.value) : undefined })}
              />
              <p className="text-xs text-muted-foreground">
                When do you plan to retire? Used to auto-calculate projection horizon.
              </p>
            </div>

            <LogarithmicSliderInput
              id="retirementSpending"
              label="Retirement Monthly Spending (Optional)"
              icon="🏖️"
              value={profile?.targetRetirementSpending}
              onChange={(value) => onProfileChange({ targetRetirementSpending: value })}
              min={500}
              max={100000}
              placeholder={profile?.monthlyExpenses ? `Default: ${profile.monthlyExpenses}` : 'e.g., 4,000'}
              description="Expected spending in retirement. Defaults to current expenses if blank."
              tooltip={
                <div className="space-y-2">
                  <p className="font-semibold">How this is used in FIRE calculations:</p>
                  <ul className="text-xs space-y-1">
                    <li>• <strong>4% Rule:</strong> Your FIRE target = Monthly Spending × 12 × 25</li>
                    <li>• <strong>Safe Withdrawal Rate:</strong> You can safely withdraw 4% per year in retirement</li>
                    <li>• <strong>Example:</strong> $5,000/mo spending = $1.5M FIRE target ($60k/year ÷ 4%)</li>
                  </ul>
                  <p className="text-xs pt-2 border-t">
                    This determines when you achieve financial independence and can retire safely.
                  </p>
                </div>
              }
            />
          </div>

          {/* Savings Rate - REMOVED: Now inferred from historical data */}
          {/* This provides more accurate modeling based on actual behavior */}

          {/* ACTUAL Asset Allocation (Required for Monte Carlo) */}
          <div className="space-y-4 pt-4 border-t">
            <Label className="flex items-center gap-2 text-base font-semibold">
              <PieChart className="h-4 w-4" />
              💎 Your Actual Asset Allocation
            </Label>
            <p className="text-sm text-muted-foreground">
              <strong>How your net worth is CURRENTLY split.</strong> This is critical for wealth projections and Monte Carlo simulations to understand your market exposure vs. cash position.
            </p>

            {/* Cash Percentage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="cash-percent" className="text-sm flex items-center gap-2">
                  💵 Cash & Equivalents
                  <span className="font-medium text-base">{((profile?.targetAllocation?.cashPercent ?? 0.20) * 100).toFixed(1)}%</span>
                  {totalNetWorth && (
                    <span className="text-xs text-muted-foreground">
                      ≈ ${((profile?.targetAllocation?.cashPercent ?? 0.20) * totalNetWorth).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </span>
                  )}
                </Label>
              </div>
              <Slider
                id="cash-percent"
                min={0}
                max={100}
                step={1}
                value={[(profile?.targetAllocation?.cashPercent ?? 0.20) * 100]}
                onValueChange={([value]) => {
                  const newAllocation: TargetAllocation = {
                    cashPercent: value / 100,
                    investmentPercent: profile?.targetAllocation?.investmentPercent ?? 0.70,
                    otherPercent: profile?.targetAllocation?.otherPercent ?? 0.10,
                  };
                  onProfileChange({ targetAllocation: newAllocation });
                }}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Savings accounts, checking, money market
              </p>
            </div>

            {/* Investment Percentage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="investment-percent" className="text-sm flex items-center gap-2">
                  📈 Market Investments
                  <span className="font-medium text-base">{((profile?.targetAllocation?.investmentPercent ?? 0.70) * 100).toFixed(1)}%</span>
                  {totalNetWorth && (
                    <span className="text-xs text-muted-foreground">
                      ≈ ${((profile?.targetAllocation?.investmentPercent ?? 0.70) * totalNetWorth).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </span>
                  )}
                </Label>
              </div>
              <Slider
                id="investment-percent"
                min={0}
                max={100}
                step={1}
                value={[(profile?.targetAllocation?.investmentPercent ?? 0.70) * 100]}
                onValueChange={([value]) => {
                  const newAllocation: TargetAllocation = {
                    cashPercent: profile?.targetAllocation?.cashPercent ?? 0.20,
                    investmentPercent: value / 100,
                    otherPercent: profile?.targetAllocation?.otherPercent ?? 0.10,
                  };
                  onProfileChange({ targetAllocation: newAllocation });
                }}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Stocks, bonds, ETFs, mutual funds (brokerage, 401k, IRA)
              </p>
            </div>

            {/* Other Assets Percentage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="other-percent" className="text-sm flex items-center gap-2">
                  🏠 Other Assets
                  <span className="font-medium text-base">{((profile?.targetAllocation?.otherPercent ?? 0.10) * 100).toFixed(1)}%</span>
                  {totalNetWorth && (
                    <span className="text-xs text-muted-foreground">
                      ≈ ${((profile?.targetAllocation?.otherPercent ?? 0.10) * totalNetWorth).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </span>
                  )}
                </Label>
              </div>
              <Slider
                id="other-percent"
                min={0}
                max={100}
                step={1}
                value={[(profile?.targetAllocation?.otherPercent ?? 0.10) * 100]}
                onValueChange={([value]) => {
                  const newAllocation: TargetAllocation = {
                    cashPercent: profile?.targetAllocation?.cashPercent ?? 0.20,
                    investmentPercent: profile?.targetAllocation?.investmentPercent ?? 0.70,
                    otherPercent: value / 100,
                  };
                  onProfileChange({ targetAllocation: newAllocation });
                }}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Real estate equity, vehicles, collectibles, crypto
              </p>
            </div>

            {/* Allocation Summary */}
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Allocation:</span>
                <span className={
                  Math.abs(
                    (profile?.targetAllocation?.cashPercent ?? 0.20) +
                    (profile?.targetAllocation?.investmentPercent ?? 0.70) +
                    (profile?.targetAllocation?.otherPercent ?? 0.10) - 1.0
                  ) < 0.01
                    ? "text-2xl font-bold text-green-600 dark:text-green-400"
                    : "text-2xl font-bold text-destructive"
                }>
                  {Math.round(
                    ((profile?.targetAllocation?.cashPercent ?? 0.20) +
                    (profile?.targetAllocation?.investmentPercent ?? 0.70) +
                    (profile?.targetAllocation?.otherPercent ?? 0.10)) * 100
                  )}%
                </span>
              </div>
              {(() => {
                const allocation = profile?.targetAllocation ?? {
                  cashPercent: 0.20,
                  investmentPercent: 0.70,
                  otherPercent: 0.10,
                };
                const validation = validateAllocation(allocation);
                return !validation.isValid && (
                  <p className="text-xs text-destructive">
                    {validation.error}
                  </p>
                );
              })()}
            </div>
          </div>

          {!isComplete && (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              Complete your profile to see how you compare to peers
            </p>
          )}
        </CardContent>
      )}
    </Card>
  );
}
