import { describe, it, expect, beforeEach } from "vitest";
import { parseFlexibleDate, getDateInputExamples, getDateInputHint } from "./date-parser";
import { format, subDays, subWeeks, subMonths, subYears, addDays, startOfQuarter, startOfYear, endOfYear } from "date-fns";

describe("parseFlexibleDate", () => {
  let today: Date;

  beforeEach(() => {
    today = new Date();
  });

  describe("relative keywords", () => {
    it('should parse "today"', () => {
      const result = parseFlexibleDate("today");
      expect(result).toBeTruthy();
      expect(format(result!, "yyyy-MM-dd")).toBe(format(today, "yyyy-MM-dd"));
    });

    it('should parse "yesterday"', () => {
      const result = parseFlexibleDate("yesterday");
      expect(result).toBeTruthy();
      expect(format(result!, "yyyy-MM-dd")).toBe(format(subDays(today, 1), "yyyy-MM-dd"));
    });

    it('should parse "tomorrow"', () => {
      const result = parseFlexibleDate("tomorrow");
      expect(result).toBeTruthy();
      expect(format(result!, "yyyy-MM-dd")).toBe(format(addDays(today, 1), "yyyy-MM-dd"));
    });
  });

  describe("X ago patterns", () => {
    it('should parse "2 days ago"', () => {
      const result = parseFlexibleDate("2 days ago");
      expect(result).toBeTruthy();
      expect(format(result!, "yyyy-MM-dd")).toBe(format(subDays(today, 2), "yyyy-MM-dd"));
    });

    it('should parse "1 day ago"', () => {
      const result = parseFlexibleDate("1 day ago");
      expect(result).toBeTruthy();
      expect(format(result!, "yyyy-MM-dd")).toBe(format(subDays(today, 1), "yyyy-MM-dd"));
    });

    it('should parse "3 weeks ago"', () => {
      const result = parseFlexibleDate("3 weeks ago");
      expect(result).toBeTruthy();
      expect(format(result!, "yyyy-MM-dd")).toBe(format(subWeeks(today, 3), "yyyy-MM-dd"));
    });

    it('should parse "2 months ago"', () => {
      const result = parseFlexibleDate("2 months ago");
      expect(result).toBeTruthy();
      const expected = subMonths(today, 2);
      expect(format(result!, "yyyy-MM-dd")).toBe(format(expected, "yyyy-MM-dd"));
    });

    it('should parse "1 year ago"', () => {
      const result = parseFlexibleDate("1 year ago");
      expect(result).toBeTruthy();
      const expected = subYears(today, 1);
      expect(format(result!, "yyyy-MM-dd")).toBe(format(expected, "yyyy-MM-dd"));
    });
  });

  describe("quarter formats", () => {
    it('should parse "Q1 2024"', () => {
      const result = parseFlexibleDate("Q1 2024");
      expect(result).toBeTruthy();
      expect(format(result!, "yyyy-MM-dd")).toBe("2024-01-01");
    });

    it('should parse "Q2 2023"', () => {
      const result = parseFlexibleDate("Q2 2023");
      expect(result).toBeTruthy();
      expect(format(result!, "yyyy-MM-dd")).toBe("2023-04-01");
    });

    it('should parse "Q3 2024"', () => {
      const result = parseFlexibleDate("Q3 2024");
      expect(result).toBeTruthy();
      expect(format(result!, "yyyy-MM-dd")).toBe("2024-07-01");
    });

    it('should parse "Q4 2024"', () => {
      const result = parseFlexibleDate("Q4 2024");
      expect(result).toBeTruthy();
      expect(format(result!, "yyyy-MM-dd")).toBe("2024-10-01");
    });

    it('should parse "q1 2024" (lowercase)', () => {
      const result = parseFlexibleDate("q1 2024");
      expect(result).toBeTruthy();
      expect(format(result!, "yyyy-MM-dd")).toBe("2024-01-01");
    });
  });

  describe("year boundary patterns", () => {
    it('should parse "beginning of 2024"', () => {
      const result = parseFlexibleDate("beginning of 2024");
      expect(result).toBeTruthy();
      expect(format(result!, "yyyy-MM-dd")).toBe("2024-01-01");
    });

    it('should parse "start of 2023"', () => {
      const result = parseFlexibleDate("start of 2023");
      expect(result).toBeTruthy();
      expect(format(result!, "yyyy-MM-dd")).toBe("2023-01-01");
    });

    it('should parse "end of 2024"', () => {
      const result = parseFlexibleDate("end of 2024");
      expect(result).toBeTruthy();
      expect(format(result!, "yyyy-MM-dd")).toBe("2024-12-31");
    });

    it('should parse "beginning of last year"', () => {
      const result = parseFlexibleDate("beginning of last year");
      expect(result).toBeTruthy();
      const currentYear = today.getFullYear();
      expect(format(result!, "yyyy-MM-dd")).toBe(`${currentYear - 1}-01-01`);
    });

    it('should parse "end of last year"', () => {
      const result = parseFlexibleDate("end of last year");
      expect(result).toBeTruthy();
      const currentYear = today.getFullYear();
      expect(format(result!, "yyyy-MM-dd")).toBe(`${currentYear - 1}-12-31`);
    });

    it('should parse "beginning of this year"', () => {
      const result = parseFlexibleDate("beginning of this year");
      expect(result).toBeTruthy();
      const currentYear = today.getFullYear();
      expect(format(result!, "yyyy-MM-dd")).toBe(`${currentYear}-01-01`);
    });

    it('should parse "end of this year"', () => {
      const result = parseFlexibleDate("end of this year");
      expect(result).toBeTruthy();
      const currentYear = today.getFullYear();
      expect(format(result!, "yyyy-MM-dd")).toBe(`${currentYear}-12-31`);
    });
  });

  describe("day of week patterns", () => {
    it('should parse "last Monday"', () => {
      const result = parseFlexibleDate("last Monday");
      expect(result).toBeTruthy();
      // Should be a Monday
      expect(result!.getDay()).toBe(1);
    });

    it('should parse "this Friday"', () => {
      const result = parseFlexibleDate("this Friday");
      expect(result).toBeTruthy();
      // Should be a Friday
      expect(result!.getDay()).toBe(5);
    });

    it('should parse "next Tuesday"', () => {
      const result = parseFlexibleDate("next Tuesday");
      expect(result).toBeTruthy();
      // Should be a Tuesday
      expect(result!.getDay()).toBe(2);
    });
  });

  describe("standard date formats", () => {
    it('should parse "01/15/2024"', () => {
      const result = parseFlexibleDate("01/15/2024");
      expect(result).toBeTruthy();
      expect(format(result!, "yyyy-MM-dd")).toBe("2024-01-15");
    });

    it('should parse "1/15/2024"', () => {
      const result = parseFlexibleDate("1/15/2024");
      expect(result).toBeTruthy();
      expect(format(result!, "yyyy-MM-dd")).toBe("2024-01-15");
    });

    it('should parse "01-15-2024"', () => {
      const result = parseFlexibleDate("01-15-2024");
      expect(result).toBeTruthy();
      expect(format(result!, "yyyy-MM-dd")).toBe("2024-01-15");
    });

    it('should parse "Jan 15, 2024"', () => {
      const result = parseFlexibleDate("Jan 15, 2024");
      expect(result).toBeTruthy();
      expect(format(result!, "yyyy-MM-dd")).toBe("2024-01-15");
    });

    it('should parse "January 15, 2024"', () => {
      const result = parseFlexibleDate("January 15, 2024");
      expect(result).toBeTruthy();
      expect(format(result!, "yyyy-MM-dd")).toBe("2024-01-15");
    });

    it('should parse "2024-01-15" (ISO format)', () => {
      const result = parseFlexibleDate("2024-01-15");
      expect(result).toBeTruthy();
      expect(format(result!, "yyyy-MM-dd")).toBe("2024-01-15");
    });

    it('should parse "01/15" (assume current year)', () => {
      const result = parseFlexibleDate("01/15");
      expect(result).toBeTruthy();
      const currentYear = today.getFullYear();
      expect(format(result!, "yyyy-MM-dd")).toBe(`${currentYear}-01-15`);
    });
  });

  describe("edge cases", () => {
    it("should return null for empty string", () => {
      expect(parseFlexibleDate("")).toBeNull();
    });

    it("should return null for whitespace only", () => {
      expect(parseFlexibleDate("   ")).toBeNull();
    });

    it("should return null for invalid input", () => {
      expect(parseFlexibleDate("not a date")).toBeNull();
    });

    it("should return null for invalid quarter", () => {
      expect(parseFlexibleDate("Q5 2024")).toBeNull();
    });

    it("should handle case insensitivity", () => {
      expect(parseFlexibleDate("TODAY")).toBeTruthy();
      expect(parseFlexibleDate("Yesterday")).toBeTruthy();
      expect(parseFlexibleDate("TOMORROW")).toBeTruthy();
    });

    it("should trim whitespace", () => {
      const result = parseFlexibleDate("  today  ");
      expect(result).toBeTruthy();
      expect(format(result!, "yyyy-MM-dd")).toBe(format(today, "yyyy-MM-dd"));
    });
  });
});

describe("getDateInputExamples", () => {
  it("should return an array of example inputs", () => {
    const examples = getDateInputExamples();
    expect(Array.isArray(examples)).toBe(true);
    expect(examples.length).toBeGreaterThan(0);
  });
});

describe("getDateInputHint", () => {
  it("should return a helpful hint string", () => {
    const hint = getDateInputHint();
    expect(typeof hint).toBe("string");
    expect(hint.length).toBeGreaterThan(0);
  });
});
