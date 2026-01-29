import { useState, useEffect, useCallback } from 'react';
import type { Occupation, CareerLevel, Metro } from '../data/bls-wage-data';
import type { EducationLevel } from '../data/scf-data';

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
}

const PROFILE_STORAGE_KEY = 'user-profile';

const defaultProfile: UserProfile = {
  age: 30,
  yearsInWorkforce: 8,
  occupation: 'software_engineer',
  level: 'senior',
  autoDetectLevel: true,
  metro: 'san_francisco',
  education: 'bachelors',
  // savingsRate removed - will be inferred from data
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
