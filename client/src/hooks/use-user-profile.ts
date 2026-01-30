import { useState, useEffect, useCallback } from 'react';
import type { Occupation, CareerLevel, Metro } from '../data/bls-wage-data';
import type { EducationLevel } from '../data/scf-data';

export interface TargetAllocation {
  cashPercent: number;       // e.g., 0.20 for 20%
  investmentPercent: number; // e.g., 0.70 for 70%
  otherPercent: number;      // e.g., 0.10 for 10%
}

export interface UserProfile {
  age: number;
  yearsInWorkforce: number;
  occupation: Occupation;
  level: CareerLevel;
  autoDetectLevel: boolean;
  metro: Metro;
  education?: EducationLevel;
  // savingsRate removed - now inferred from historical data
  // Kept optional for backward compatibility with old profiles
  savingsRate?: number;
  // Target asset allocation for Monte Carlo projections
  targetAllocation?: TargetAllocation;
  // Total annual compensation (optional override, defaults to BLS data)
  totalCompensation?: number;
  // Monthly expenses for FIRE planning and sustainability analysis
  monthlyExpenses?: number;
}

const PROFILE_STORAGE_KEY = 'user-profile';

/**
 * Validate that allocation percentages sum to 1.0 (100%)
 */
export function validateAllocation(allocation: TargetAllocation): { isValid: boolean; error?: string } {
  const sum = allocation.cashPercent + allocation.investmentPercent + allocation.otherPercent;
  const tolerance = 0.001; // Allow for floating point rounding

  if (Math.abs(sum - 1.0) > tolerance) {
    return {
      isValid: false,
      error: `Allocation must sum to 100% (currently ${(sum * 100).toFixed(1)}%)`
    };
  }

  if (allocation.cashPercent < 0 || allocation.investmentPercent < 0 || allocation.otherPercent < 0) {
    return { isValid: false, error: 'Percentages cannot be negative' };
  }

  return { isValid: true };
}

const defaultProfile: UserProfile = {
  age: 30,
  yearsInWorkforce: 8,
  occupation: 'software_engineer',
  level: 'senior',
  autoDetectLevel: true,
  metro: 'san_francisco',
  education: 'bachelors',
  // savingsRate removed - will be inferred from data
  targetAllocation: {
    cashPercent: 0.20,       // 20% cash reserve
    investmentPercent: 0.70, // 70% market investments
    otherPercent: 0.10,      // 10% other assets (real estate, etc.)
  },
};

export function useUserProfile() {
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as UserProfile;
        setProfileState(parsed);
      } catch (e) {
        console.error('Failed to parse stored profile:', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage when profile changes
  useEffect(() => {
    if (isLoaded && profile) {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    }
  }, [profile, isLoaded]);

  const setProfile = useCallback((newProfile: UserProfile | null) => {
    setProfileState(newProfile);
  }, []);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfileState(prev => {
      if (!prev) {
        return { ...defaultProfile, ...updates };
      }
      return { ...prev, ...updates };
    });
  }, []);

  const clearProfile = useCallback(() => {
    setProfileState(null);
    localStorage.removeItem(PROFILE_STORAGE_KEY);
  }, []);

  const initializeProfile = useCallback(() => {
    if (!profile) {
      setProfileState(defaultProfile);
    }
  }, [profile]);

  const isComplete = profile !== null &&
    profile.age > 0 &&
    profile.yearsInWorkforce >= 0 &&
    profile.occupation &&
    profile.metro &&
    (profile.savingsRate || 0.25) > 0;

  return {
    profile,
    setProfile,
    updateProfile,
    clearProfile,
    initializeProfile,
    isLoaded,
    isComplete,
    defaultProfile,
  };
}
