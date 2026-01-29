// Input validation utilities

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate net worth entry
 */
export function validateNetWorthEntry(
  netWorth: number,
  cash: number,
  existingEntries: Array<{ totalNetWorth: number; cash: number }>
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for NaN
  if (isNaN(netWorth)) {
    errors.push('Net worth must be a valid number');
  }
  if (isNaN(cash)) {
    errors.push('Cash must be a valid number');
  }

  // If errors, return early
  if (errors.length > 0) {
    return { isValid: false, errors, warnings };
  }

  // Validate net worth range
  const MAX_NET_WORTH = 1e12; // $1 trillion
  const MIN_NET_WORTH = -1e9; // -$1 billion

  if (netWorth > MAX_NET_WORTH) {
    errors.push(`Net worth exceeds maximum value ($${(MAX_NET_WORTH / 1e12).toFixed(0)} trillion)`);
  }
  if (netWorth < MIN_NET_WORTH) {
    errors.push(`Net worth below minimum value (-$${Math.abs(MIN_NET_WORTH / 1e9).toFixed(0)} billion)`);
  }

  // Validate cash range
  if (cash > MAX_NET_WORTH) {
    errors.push(`Cash exceeds maximum value ($${(MAX_NET_WORTH / 1e12).toFixed(0)} trillion)`);
  }
  if (cash < 0) {
    errors.push('Cash cannot be negative');
  }

  // Logical validation: cash should not exceed net worth (for positive net worth)
  if (netWorth > 0 && cash > netWorth) {
    warnings.push('Cash exceeds total net worth. This is unusual - please verify your numbers.');
  }

  // Outlier detection
  if (existingEntries.length >= 3) {
    const avgNetWorth =
      existingEntries.reduce((sum, e) => sum + e.totalNetWorth, 0) / existingEntries.length;
    const stdDev = Math.sqrt(
      existingEntries.reduce((sum, e) => sum + Math.pow(e.totalNetWorth - avgNetWorth, 2), 0) /
        existingEntries.length
    );

    // Check if new value is > 2 standard deviations away
    if (Math.abs(netWorth - avgNetWorth) > 2 * stdDev) {
      warnings.push(
        'This value differs significantly from your historical average. Double-check for typos.'
      );
    }
  }

  // Large jump detection
  if (existingEntries.length > 0) {
    const latestEntry = existingEntries[existingEntries.length - 1];
    const percentChange = Math.abs((netWorth - latestEntry.totalNetWorth) / latestEntry.totalNetWorth);

    if (percentChange > 0.5 && Math.abs(netWorth - latestEntry.totalNetWorth) > 10000) {
      // 50% change and > $10k
      warnings.push(
        `Net worth changed by ${(percentChange * 100).toFixed(0)}% from last entry. Please verify.`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate profile data
 */
export function validateProfile(profile: {
  age?: number;
  savingsRate?: number;
  occupation?: string;
  level?: string;
  metro?: string;
}): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Age validation
  if (profile.age !== undefined) {
    if (isNaN(profile.age)) {
      errors.push('Age must be a valid number');
    } else if (profile.age < 18) {
      errors.push('Age must be at least 18');
    } else if (profile.age > 100) {
      errors.push('Age must be less than 100');
    } else if (profile.age < 22) {
      warnings.push('Age below 22 may have limited career data available');
    }
  }

  // Savings rate validation
  if (profile.savingsRate !== undefined) {
    if (isNaN(profile.savingsRate)) {
      errors.push('Savings rate must be a valid number');
    } else if (profile.savingsRate < 0) {
      errors.push('Savings rate cannot be negative');
    } else if (profile.savingsRate > 100) {
      errors.push('Savings rate cannot exceed 100%');
    } else if (profile.savingsRate > 80) {
      warnings.push('Savings rate above 80% is extremely high. Please verify.');
    } else if (profile.savingsRate < 5) {
      warnings.push('Savings rate below 5% may make wealth building difficult');
    }
  }

  // Required field validation
  if (!profile.occupation) {
    errors.push('Occupation is required');
  }
  if (!profile.level) {
    errors.push('Career level is required');
  }
  if (!profile.metro) {
    errors.push('Metro area is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate date entry
 */
export function validateDateEntry(
  date: Date | null,
  existingDates: string[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!date) {
    errors.push('Date is required');
    return { isValid: false, errors, warnings };
  }

  // Check if date is too far in the future
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

  if (date > oneYearFromNow) {
    warnings.push('Date is more than 1 year in the future. Please verify.');
  }

  // Check if date is too far in the past
  const hundredYearsAgo = new Date();
  hundredYearsAgo.setFullYear(hundredYearsAgo.getFullYear() - 100);

  if (date < hundredYearsAgo) {
    errors.push('Date cannot be more than 100 years in the past');
  }

  // Check for duplicate dates
  const dateString = date.toISOString().split('T')[0];
  if (existingDates.includes(dateString)) {
    warnings.push('An entry already exists for this date. It will be overwritten.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Sanitize number input
 */
export function sanitizeNumberInput(value: string): number {
  // Remove commas, spaces, and other non-numeric characters except . and -
  const cleaned = value.replace(/[^0-9.-]/g, '');
  return parseFloat(cleaned);
}

/**
 * Format validation errors for display
 */
export function formatValidationMessages(result: ValidationResult): {
  errorMessage: string | null;
  warningMessage: string | null;
} {
  return {
    errorMessage: result.errors.length > 0 ? result.errors.join('\n') : null,
    warningMessage: result.warnings.length > 0 ? result.warnings.join('\n') : null,
  };
}
