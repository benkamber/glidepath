import {
  parse,
  isValid,
  subDays,
  subWeeks,
  subMonths,
  subYears,
  addDays,
  addWeeks,
  addMonths,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  previousMonday,
  previousTuesday,
  previousWednesday,
  previousThursday,
  previousFriday,
  previousSaturday,
  previousSunday,
  nextMonday,
  nextTuesday,
  nextWednesday,
  nextThursday,
  nextFriday,
  nextSaturday,
  nextSunday,
  setQuarter,
  getYear,
} from "date-fns";

/**
 * Enhanced date parser with natural language support
 * Supports patterns like:
 * - "today", "yesterday", "tomorrow"
 * - "2 weeks ago", "3 months ago", "1 year ago"
 * - "Q1 2024", "Q2 2023"
 * - "beginning of 2024", "end of last year", "end of 2023"
 * - "last Monday", "this Friday", "next Tuesday"
 * - Standard date formats (MM/DD/YYYY, etc.)
 */
export const parseFlexibleDate = (input: string): Date | null => {
  if (!input || input.trim() === "") return null;

  const trimmed = input.trim().toLowerCase();
  const today = new Date();
  const currentYear = today.getFullYear();

  // Relative keywords
  if (trimmed === "today") return today;
  if (trimmed === "yesterday") return subDays(today, 1);
  if (trimmed === "tomorrow") return addDays(today, 1);

  // "X days/weeks/months/years ago"
  const agoMatch = trimmed.match(/^(\d+)\s*(day|week|month|year)s?\s+ago$/);
  if (agoMatch) {
    const amount = parseInt(agoMatch[1], 10);
    const unit = agoMatch[2];

    switch (unit) {
      case "day":
        return subDays(today, amount);
      case "week":
        return subWeeks(today, amount);
      case "month":
        return subMonths(today, amount);
      case "year":
        return subYears(today, amount);
    }
  }

  // "in X days/weeks/months"
  const inMatch = trimmed.match(/^in\s+(\d+)\s*(day|week|month|year)s?$/);
  if (inMatch) {
    const amount = parseInt(inMatch[1], 10);
    const unit = inMatch[2];

    switch (unit) {
      case "day":
        return addDays(today, amount);
      case "week":
        return addWeeks(today, amount);
      case "month":
        return addMonths(today, amount);
      case "year":
        return addMonths(today, amount * 12);
    }
  }

  // Quarter formats: "Q1 2024", "q2 2023", etc.
  const quarterMatch = trimmed.match(/^q([1-4])\s+(\d{4})$/);
  if (quarterMatch) {
    const quarter = parseInt(quarterMatch[1], 10);
    const year = parseInt(quarterMatch[2], 10);
    const date = new Date(year, 0, 1);
    return startOfQuarter(setQuarter(date, quarter));
  }

  // "beginning of YYYY" or "start of YYYY"
  const startYearMatch = trimmed.match(/^(?:beginning|start)\s+of\s+(\d{4})$/);
  if (startYearMatch) {
    const year = parseInt(startYearMatch[1], 10);
    return startOfYear(new Date(year, 0, 1));
  }

  // "end of YYYY"
  const endYearMatch = trimmed.match(/^end\s+of\s+(\d{4})$/);
  if (endYearMatch) {
    const year = parseInt(endYearMatch[1], 10);
    return endOfYear(new Date(year, 0, 1));
  }

  // "beginning/start of last year"
  if (trimmed === "beginning of last year" || trimmed === "start of last year") {
    return startOfYear(new Date(currentYear - 1, 0, 1));
  }

  // "end of last year"
  if (trimmed === "end of last year") {
    return endOfYear(new Date(currentYear - 1, 0, 1));
  }

  // "beginning/start of this year"
  if (trimmed === "beginning of this year" || trimmed === "start of this year") {
    return startOfYear(today);
  }

  // "end of this year"
  if (trimmed === "end of this year") {
    return endOfYear(today);
  }

  // Day of week: "last Monday", "this Friday", "next Tuesday"
  const dayOfWeekMatch = trimmed.match(/^(last|this|next)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/);
  if (dayOfWeekMatch) {
    const timeframe = dayOfWeekMatch[1];
    const dayName = dayOfWeekMatch[2];

    const dayFunctions: Record<string, (date: Date) => Date> = {
      monday: timeframe === "next" ? nextMonday : previousMonday,
      tuesday: timeframe === "next" ? nextTuesday : previousTuesday,
      wednesday: timeframe === "next" ? nextWednesday : previousWednesday,
      thursday: timeframe === "next" ? nextThursday : previousThursday,
      friday: timeframe === "next" ? nextFriday : previousFriday,
      saturday: timeframe === "next" ? nextSaturday : previousSaturday,
      sunday: timeframe === "next" ? nextSunday : previousSunday,
    };

    const dayFn = dayFunctions[dayName];
    if (dayFn) {
      return dayFn(today);
    }
  }

  // Standard date format parsing (case-insensitive)
  const originalInput = input.trim();

  // List of date format patterns to try (American formats)
  const formats = [
    "MM/dd/yyyy",     // 01/15/2024
    "M/d/yyyy",       // 1/15/2024
    "MM-dd-yyyy",     // 01-15-2024
    "M-d-yyyy",       // 1-15-2024
    "MM/dd/yy",       // 01/15/24
    "M/d/yy",         // 1/15/24
    "MM-dd-yy",       // 01-15-24
    "M-d-yy",         // 1-15-24
    "MMM d yyyy",     // Jan 15 2024
    "MMM d, yyyy",    // Jan 15, 2024
    "MMMM d yyyy",    // January 15 2024
    "MMMM d, yyyy",   // January 15, 2024
    "yyyy-MM-dd",     // 2024-01-15 (ISO format)
  ];

  // Try each format
  for (const formatStr of formats) {
    try {
      const parsed = parse(originalInput, formatStr, new Date());
      if (isValid(parsed)) {
        // Century windowing for 2-digit year formats
        const year = getYear(parsed);
        if (year < 100) {
          parsed.setFullYear(year < 50 ? year + 2000 : year + 1900);
        }
        return parsed;
      }
    } catch (e) {
      // Continue to next format
    }
  }

  // Try MM/dd or M/d without year (assume current year)
  const shortFormats = ["MM/dd", "M/d", "MM-dd", "M-d"];
  for (const formatStr of shortFormats) {
    try {
      const parsed = parse(originalInput, formatStr, new Date(currentYear, 0, 1));
      if (isValid(parsed)) {
        return parsed;
      }
    } catch (e) {
      // Continue to next format
    }
  }

  return null;
};

/**
 * Get helpful examples for date input
 */
export const getDateInputExamples = (): string[] => {
  return [
    "today",
    "yesterday",
    "2 weeks ago",
    "3 months ago",
    "Q1 2024",
    "beginning of 2024",
    "last Monday",
    "01/15/2024",
    "Jan 15, 2024",
  ];
};

/**
 * Get a user-friendly error message for invalid date input
 */
export const getDateInputHint = (): string => {
  return 'Try: "today", "2 weeks ago", "Q1 2024", "01/15/2024", or "Jan 15, 2024"';
};
