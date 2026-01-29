// Bureau of Labor Statistics Occupational Employment and Wage Statistics 2024
// Source: https://www.bls.gov/oes/current/oes_nat.htm
// Compensation includes base salary + bonus + equity (for tech roles)

export type Occupation =
  | 'software_engineer'
  | 'product_manager'
  | 'data_scientist'
  | 'finance'
  | 'healthcare'
  | 'legal'
  | 'consulting'
  | 'marketing'
  | 'sales'
  | 'operations'
  | 'teacher'
  | 'government'
  | 'other';

export type CareerLevel =
  | 'entry'      // 0-2 years
  | 'mid'        // 3-5 years
  | 'senior'     // 6-10 years
  | 'staff'      // 11-15 years
  | 'principal'  // 16-20 years
  | 'executive'; // 20+ years

export type Metro =
  | 'san_francisco'
  | 'san_jose'
  | 'new_york'
  | 'seattle'
  | 'los_angeles'
  | 'boston'
  | 'washington_dc'
  | 'austin'
  | 'denver'
  | 'chicago'
  | 'san_diego'
  | 'portland'
  | 'atlanta'
  | 'dallas'
  | 'phoenix'
  | 'minneapolis'
  | 'philadelphia'
  | 'miami'
  | 'raleigh'
  | 'charlotte'
  | 'nashville'
  | 'salt_lake_city'
  | 'detroit'
  | 'houston'
  | 'tampa'
  | 'pittsburgh'
  | 'columbus'
  | 'remote'
  | 'other';

export const occupationLabels: Record<Occupation, string> = {
  software_engineer: 'Software Engineering',
  product_manager: 'Product Management',
  data_scientist: 'Data Science / ML',
  finance: 'Finance / Banking',
  healthcare: 'Healthcare',
  legal: 'Legal',
  consulting: 'Consulting',
  marketing: 'Marketing',
  sales: 'Sales',
  operations: 'Operations',
  teacher: 'Education',
  government: 'Government',
  other: 'Other',
};

export const levelLabels: Record<CareerLevel, string> = {
  entry: 'Entry (0-2 yrs)',
  mid: 'Mid (3-5 yrs)',
  senior: 'Senior (6-10 yrs)',
  staff: 'Staff/Lead (11-15 yrs)',
  principal: 'Principal (16-20 yrs)',
  executive: 'Executive (20+ yrs)',
};

export const metroLabels: Record<Metro, string> = {
  san_francisco: 'San Francisco Bay Area',
  san_jose: 'San Jose / Silicon Valley',
  new_york: 'New York City',
  seattle: 'Seattle',
  los_angeles: 'Los Angeles',
  boston: 'Boston',
  washington_dc: 'Washington D.C.',
  austin: 'Austin',
  denver: 'Denver',
  chicago: 'Chicago',
  san_diego: 'San Diego',
  portland: 'Portland',
  atlanta: 'Atlanta',
  dallas: 'Dallas',
  phoenix: 'Phoenix',
  minneapolis: 'Minneapolis',
  philadelphia: 'Philadelphia',
  miami: 'Miami',
  raleigh: 'Raleigh-Durham',
  charlotte: 'Charlotte',
  nashville: 'Nashville',
  salt_lake_city: 'Salt Lake City',
  detroit: 'Detroit',
  houston: 'Houston',
  tampa: 'Tampa',
  pittsburgh: 'Pittsburgh',
  columbus: 'Columbus',
  remote: 'Remote (US)',
  other: 'Other',
};

// Cost of living index and rent data
// Sources: BEA Regional Price Parities, Numbeo, Zillow
export interface MetroData {
  colIndex: number;      // Cost of living index (Austin = 100)
  medianRent: number;    // Monthly 1BR median rent
  medianHome: number;    // Median home price
  taxBurden: number;     // Effective state+local tax rate
  techHub: boolean;      // Premium tech salaries
}

export const metroData: Record<Metro, MetroData> = {
  san_francisco: { colIndex: 145, medianRent: 3200, medianHome: 1350000, taxBurden: 0.13, techHub: true },
  san_jose: { colIndex: 142, medianRent: 2900, medianHome: 1450000, taxBurden: 0.13, techHub: true },
  new_york: { colIndex: 138, medianRent: 3500, medianHome: 750000, taxBurden: 0.12, techHub: true },
  seattle: { colIndex: 122, medianRent: 2200, medianHome: 850000, taxBurden: 0.00, techHub: true },
  los_angeles: { colIndex: 125, medianRent: 2400, medianHome: 950000, taxBurden: 0.13, techHub: true },
  boston: { colIndex: 128, medianRent: 2800, medianHome: 750000, taxBurden: 0.09, techHub: true },
  washington_dc: { colIndex: 120, medianRent: 2200, medianHome: 650000, taxBurden: 0.09, techHub: false },
  austin: { colIndex: 100, medianRent: 1600, medianHome: 550000, taxBurden: 0.00, techHub: true },
  denver: { colIndex: 108, medianRent: 1800, medianHome: 600000, taxBurden: 0.04, techHub: true },
  chicago: { colIndex: 105, medianRent: 1800, medianHome: 350000, taxBurden: 0.10, techHub: false },
  san_diego: { colIndex: 118, medianRent: 2300, medianHome: 900000, taxBurden: 0.13, techHub: false },
  portland: { colIndex: 112, medianRent: 1700, medianHome: 550000, taxBurden: 0.09, techHub: false },
  atlanta: { colIndex: 95, medianRent: 1600, medianHome: 400000, taxBurden: 0.06, techHub: false },
  dallas: { colIndex: 95, medianRent: 1500, medianHome: 400000, taxBurden: 0.00, techHub: false },
  phoenix: { colIndex: 98, medianRent: 1400, medianHome: 450000, taxBurden: 0.04, techHub: false },
  minneapolis: { colIndex: 102, medianRent: 1400, medianHome: 350000, taxBurden: 0.07, techHub: false },
  philadelphia: { colIndex: 108, medianRent: 1600, medianHome: 350000, taxBurden: 0.06, techHub: false },
  miami: { colIndex: 110, medianRent: 2200, medianHome: 550000, taxBurden: 0.00, techHub: false },
  raleigh: { colIndex: 95, medianRent: 1500, medianHome: 450000, taxBurden: 0.05, techHub: true },
  charlotte: { colIndex: 92, medianRent: 1400, medianHome: 400000, taxBurden: 0.05, techHub: false },
  nashville: { colIndex: 95, medianRent: 1600, medianHome: 450000, taxBurden: 0.00, techHub: false },
  salt_lake_city: { colIndex: 98, medianRent: 1400, medianHome: 550000, taxBurden: 0.05, techHub: true },
  detroit: { colIndex: 90, medianRent: 1200, medianHome: 250000, taxBurden: 0.04, techHub: false },
  houston: { colIndex: 92, medianRent: 1300, medianHome: 350000, taxBurden: 0.00, techHub: false },
  tampa: { colIndex: 95, medianRent: 1600, medianHome: 400000, taxBurden: 0.00, techHub: false },
  pittsburgh: { colIndex: 88, medianRent: 1200, medianHome: 230000, taxBurden: 0.06, techHub: false },
  columbus: { colIndex: 90, medianRent: 1200, medianHome: 300000, taxBurden: 0.04, techHub: false },
  remote: { colIndex: 100, medianRent: 1500, medianHome: 400000, taxBurden: 0.05, techHub: false },
  other: { colIndex: 100, medianRent: 1400, medianHome: 350000, taxBurden: 0.05, techHub: false },
};

// Base total compensation by occupation and level (national median)
// Tech roles include equity; values represent total annual comp
const baseCompMatrix: Record<Occupation, Record<CareerLevel, number>> = {
  software_engineer: {
    entry: 110000,
    mid: 160000,
    senior: 220000,
    staff: 320000,
    principal: 420000,
    executive: 600000,
  },
  product_manager: {
    entry: 100000,
    mid: 145000,
    senior: 200000,
    staff: 290000,
    principal: 380000,
    executive: 550000,
  },
  data_scientist: {
    entry: 105000,
    mid: 150000,
    senior: 210000,
    staff: 300000,
    principal: 400000,
    executive: 580000,
  },
  finance: {
    entry: 85000,
    mid: 120000,
    senior: 180000,
    staff: 280000,
    principal: 400000,
    executive: 700000,
  },
  healthcare: {
    entry: 60000,
    mid: 85000,
    senior: 120000,
    staff: 160000,
    principal: 220000,
    executive: 400000,
  },
  legal: {
    entry: 90000,
    mid: 140000,
    senior: 200000,
    staff: 300000,
    principal: 450000,
    executive: 800000,
  },
  consulting: {
    entry: 95000,
    mid: 140000,
    senior: 200000,
    staff: 300000,
    principal: 400000,
    executive: 600000,
  },
  marketing: {
    entry: 60000,
    mid: 85000,
    senior: 120000,
    staff: 170000,
    principal: 230000,
    executive: 380000,
  },
  sales: {
    entry: 70000,
    mid: 110000,
    senior: 160000,
    staff: 220000,
    principal: 300000,
    executive: 500000,
  },
  operations: {
    entry: 55000,
    mid: 75000,
    senior: 100000,
    staff: 140000,
    principal: 190000,
    executive: 300000,
  },
  teacher: {
    entry: 45000,
    mid: 55000,
    senior: 65000,
    staff: 80000,
    principal: 100000,
    executive: 150000,
  },
  government: {
    entry: 55000,
    mid: 70000,
    senior: 90000,
    staff: 115000,
    principal: 145000,
    executive: 200000,
  },
  other: {
    entry: 50000,
    mid: 70000,
    senior: 95000,
    staff: 130000,
    principal: 175000,
    executive: 260000,
  },
};

// Tech hub premium multipliers (on top of base comp)
const techHubPremiums: Partial<Record<Metro, number>> = {
  san_francisco: 1.35,
  san_jose: 1.32,
  new_york: 1.25,
  seattle: 1.22,
  boston: 1.15,
  los_angeles: 1.12,
  denver: 1.08,
  austin: 1.10,
  raleigh: 1.05,
};

export interface WageEstimate {
  baseSalary: number;
  bonus: number;
  equity: number;
  totalComp: number;
  afterTaxComp: number;
  takeHomePay: number; // After COL adjustment
}

/**
 * Maps years of work experience to typical career level
 */
export function getLevelForYears(yearsWorking: number): CareerLevel {
  if (yearsWorking <= 2) return 'entry';
  if (yearsWorking <= 5) return 'mid';
  if (yearsWorking <= 10) return 'senior';
  if (yearsWorking <= 15) return 'staff';
  if (yearsWorking <= 20) return 'principal';
  return 'executive';
}

/**
 * Get years range for a career level
 */
export function getYearsRangeForLevel(level: CareerLevel): { min: number; max: number } {
  switch (level) {
    case 'entry': return { min: 0, max: 2 };
    case 'mid': return { min: 3, max: 5 };
    case 'senior': return { min: 6, max: 10 };
    case 'staff': return { min: 11, max: 15 };
    case 'principal': return { min: 16, max: 20 };
    case 'executive': return { min: 21, max: 40 };
  }
}

/**
 * Returns the cost of living multiplier for a metro area
 */
export function getCOLMultiplier(metro: Metro): number {
  return (metroData[metro]?.colIndex ?? 100) / 100;
}

/**
 * Get full metro data
 */
export function getMetroData(metro: Metro): MetroData {
  return metroData[metro] ?? metroData.other;
}

/**
 * Estimates total compensation for a given occupation, level, and metro
 */
export function getWageEstimate(
  occupation: Occupation,
  level: CareerLevel,
  metro: Metro
): WageEstimate {
  const baseComp = baseCompMatrix[occupation]?.[level] ?? baseCompMatrix.other[level];
  const data = metroData[metro] ?? metroData.other;

  // Apply tech hub premium for tech occupations
  const isTechRole = ['software_engineer', 'product_manager', 'data_scientist'].includes(occupation);
  const premium = (isTechRole && data.techHub) ? (techHubPremiums[metro] ?? 1.0) : 1.0;

  const totalComp = Math.round(baseComp * premium);

  // Break down compensation
  const equityPercent = isTechRole ? 0.25 : 0.05;
  const bonusPercent = occupation === 'sales' ? 0.30 : 0.10;

  const equity = Math.round(totalComp * equityPercent);
  const bonus = Math.round(totalComp * bonusPercent);
  const baseSalary = totalComp - equity - bonus;

  // Calculate after-tax
  const federalTax = 0.24; // Simplified effective rate
  const stateTax = data.taxBurden;
  const totalTax = federalTax + stateTax;
  const afterTaxComp = Math.round(totalComp * (1 - totalTax));

  // COL-adjusted take-home (what it "feels like" in Austin dollars)
  const colMultiplier = data.colIndex / 100;
  const takeHomePay = Math.round(afterTaxComp / colMultiplier);

  return {
    baseSalary,
    bonus,
    equity,
    totalComp,
    afterTaxComp,
    takeHomePay,
  };
}

/**
 * Get wage with gradual progression within a level
 */
export function getWageWithProgression(
  occupation: Occupation,
  level: CareerLevel,
  metro: Metro,
  yearsInLevel: number
): WageEstimate {
  const baseEstimate = getWageEstimate(occupation, level, metro);
  const levels: CareerLevel[] = ['entry', 'mid', 'senior', 'staff', 'principal', 'executive'];
  const levelIndex = levels.indexOf(level);

  // Get next level comp for interpolation
  const nextLevel = levels[levelIndex + 1];
  if (!nextLevel) {
    // At executive level, 3% annual growth
    const multiplier = Math.pow(1.03, yearsInLevel);
    return {
      ...baseEstimate,
      baseSalary: Math.round(baseEstimate.baseSalary * multiplier),
      totalComp: Math.round(baseEstimate.totalComp * multiplier),
      afterTaxComp: Math.round(baseEstimate.afterTaxComp * multiplier),
      takeHomePay: Math.round(baseEstimate.takeHomePay * multiplier),
    };
  }

  const nextEstimate = getWageEstimate(occupation, nextLevel, metro);
  const range = getYearsRangeForLevel(level);
  const levelDuration = range.max - range.min + 1;

  // Linear interpolation: go from base to ~50% of the way to next level
  const progress = Math.min(yearsInLevel / levelDuration, 1);
  const interpolationFactor = progress * 0.5;

  const totalComp = Math.round(
    baseEstimate.totalComp + (nextEstimate.totalComp - baseEstimate.totalComp) * interpolationFactor
  );

  return {
    ...baseEstimate,
    totalComp,
    baseSalary: Math.round(totalComp * (baseEstimate.baseSalary / baseEstimate.totalComp)),
    afterTaxComp: Math.round(totalComp * (baseEstimate.afterTaxComp / baseEstimate.totalComp)),
    takeHomePay: Math.round(totalComp * (baseEstimate.takeHomePay / baseEstimate.totalComp)),
  };
}

/**
 * Get income trajectory from start age to end age
 */
export function getIncomeTrajectory(
  occupation: Occupation,
  metro: Metro,
  startAge: number,
  endAge: number
): Array<{ age: number; income: number; level: CareerLevel }> {
  const trajectory: Array<{ age: number; income: number; level: CareerLevel }> = [];

  for (let age = startAge; age <= endAge; age++) {
    const yearsWorking = age - startAge;
    const level = getLevelForYears(yearsWorking);
    const levelRange = getYearsRangeForLevel(level);
    const yearsInLevel = yearsWorking - levelRange.min;
    const estimate = getWageWithProgression(occupation, level, metro, yearsInLevel);

    trajectory.push({ age, income: estimate.totalComp, level });
  }

  return trajectory;
}

/**
 * Calculate annual savings potential
 */
export function calculateAnnualSavings(
  occupation: Occupation,
  level: CareerLevel,
  metro: Metro,
  savingsRate: number
): number {
  const estimate = getWageEstimate(occupation, level, metro);
  return Math.round(estimate.afterTaxComp * savingsRate);
}

/**
 * Compare compensation across metros
 */
export function compareMetros(
  occupation: Occupation,
  level: CareerLevel,
  metros: Metro[]
): Array<{ metro: Metro; estimate: WageEstimate }> {
  return metros
    .map(metro => ({
      metro,
      estimate: getWageEstimate(occupation, level, metro),
    }))
    .sort((a, b) => b.estimate.takeHomePay - a.estimate.takeHomePay);
}

/**
 * Get all occupations as options for dropdowns
 */
export function getOccupationOptions(): Array<{ value: Occupation; label: string }> {
  return (Object.keys(occupationLabels) as Occupation[]).map(key => ({
    value: key,
    label: occupationLabels[key],
  }));
}

/**
 * Get all career levels as options for dropdowns
 */
export function getLevelOptions(): Array<{ value: CareerLevel; label: string }> {
  return (Object.keys(levelLabels) as CareerLevel[]).map(key => ({
    value: key,
    label: levelLabels[key],
  }));
}

/**
 * Get all metros as options for dropdowns, sorted by label
 */
export function getMetroOptions(): Array<{ value: Metro; label: string }> {
  return (Object.keys(metroLabels) as Metro[])
    .map(key => ({
      value: key,
      label: metroLabels[key],
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Validate if a string is a valid occupation
 */
export function isValidOccupation(value: string): value is Occupation {
  return value in occupationLabels;
}

/**
 * Validate if a string is a valid career level
 */
export function isValidLevel(value: string): value is CareerLevel {
  return value in levelLabels;
}

/**
 * Validate if a string is a valid metro
 */
export function isValidMetro(value: string): value is Metro {
  return value in metroLabels;
}
