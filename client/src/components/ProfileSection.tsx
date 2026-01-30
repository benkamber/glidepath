import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, User, Briefcase, MapPin, Percent, PieChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
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
}

export function ProfileSection({
  profile,
  onProfileChange,
  onInitialize,
  isComplete,
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
                {profile?.age}yo, {profile?.yearsInWorkforce}yrs in {profile?.occupation?.replace('_', ' ')}
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
                value={profile?.age ?? ''}
                onChange={(e) => onProfileChange({ age: parseInt(e.target.value) || 0 })}
                placeholder="30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="years" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Years Working
              </Label>
              <Input
                id="years"
                type="number"
                min={0}
                max={50}
                value={profile?.yearsInWorkforce ?? ''}
                onChange={(e) => onProfileChange({ yearsInWorkforce: parseInt(e.target.value) || 0 })}
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
          <div className="space-y-2">
            <Label htmlFor="totalComp" className="flex items-center gap-2">
              💰 Annual Total Compensation (Optional - Leave Blank if Unemployed/Laid Off)
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="totalComp"
                type="number"
                step="1000"
                placeholder={`Default: ${profile?.occupation && profile?.level && profile?.metro
                  ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
                      getWageEstimate(profile.occupation, profile.level, profile.metro).totalComp
                    )
                  : 'Based on BLS data'}`}
                value={profile?.totalCompensation ?? ''}
                onChange={(e) => onProfileChange({ totalCompensation: e.target.value ? parseFloat(e.target.value) : undefined })}
                className="pl-7"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              <strong>Only needed if currently employed.</strong> Include ALL comp: base + bonus + equity + benefits. Used for geographic arbitrage & future projections. Leave blank if laid off/between jobs - we'll infer savings from your historical net worth growth instead.
            </p>
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
                <Label htmlFor="cash-percent" className="text-sm">
                  💵 Cash & Equivalents
                </Label>
                <span className="text-sm font-medium">
                  {Math.round((profile?.targetAllocation?.cashPercent ?? 0.20) * 100)}%
                </span>
              </div>
              <Slider
                id="cash-percent"
                min={0}
                max={100}
                step={5}
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
                <Label htmlFor="investment-percent" className="text-sm">
                  📈 Market Investments
                </Label>
                <span className="text-sm font-medium">
                  {Math.round((profile?.targetAllocation?.investmentPercent ?? 0.70) * 100)}%
                </span>
              </div>
              <Slider
                id="investment-percent"
                min={0}
                max={100}
                step={5}
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
                <Label htmlFor="other-percent" className="text-sm">
                  🏠 Other Assets
                </Label>
                <span className="text-sm font-medium">
                  {Math.round((profile?.targetAllocation?.otherPercent ?? 0.10) * 100)}%
                </span>
              </div>
              <Slider
                id="other-percent"
                min={0}
                max={100}
                step={5}
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
            <div className="p-3 bg-muted/50 rounded-lg space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Total Allocation:</span>
                <span className={
                  Math.abs(
                    (profile?.targetAllocation?.cashPercent ?? 0.20) +
                    (profile?.targetAllocation?.investmentPercent ?? 0.70) +
                    (profile?.targetAllocation?.otherPercent ?? 0.10) - 1.0
                  ) < 0.01
                    ? "font-semibold text-green-600 dark:text-green-400"
                    : "font-semibold text-destructive"
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
