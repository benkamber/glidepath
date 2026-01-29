/**
 * International City Data for Geographic Arbitrage
 *
 * Sources:
 * - Numbeo Cost of Living Index
 * - Levels.fyi International Compensation Data
 * - Expatistan Living Costs
 */

export interface InternationalCity {
  id: string;
  name: string;
  country: string;
  flag: string;
  salaryMultiplier: number; // Relative to US baseline (1.0 = same as US)
  colMultiplier: number; // Relative to US national average (1.0 = US avg)
  taxRate?: number; // Effective tax rate (optional, for future enhancement)
  description?: string;
}

export const internationalCities: Record<string, InternationalCity> = {
  // Europe
  london: {
    id: 'london',
    name: 'London',
    country: 'United Kingdom',
    flag: '🇬🇧',
    salaryMultiplier: 0.95, // Slightly lower than US for tech
    colMultiplier: 2.0, // Very expensive
    description: 'Financial hub, high COL, strong tech scene',
  },
  berlin: {
    id: 'berlin',
    name: 'Berlin',
    country: 'Germany',
    flag: '🇩🇪',
    salaryMultiplier: 0.70,
    colMultiplier: 1.4,
    description: 'Growing tech hub, affordable for Europe',
  },
  amsterdam: {
    id: 'amsterdam',
    name: 'Amsterdam',
    country: 'Netherlands',
    flag: '🇳🇱',
    salaryMultiplier: 0.75,
    colMultiplier: 1.6,
    description: 'Tech-friendly, good quality of life',
  },
  zurich: {
    id: 'zurich',
    name: 'Zurich',
    country: 'Switzerland',
    flag: '🇨🇭',
    salaryMultiplier: 1.2, // Higher salaries in Switzerland
    colMultiplier: 2.2, // But very expensive
    description: 'Highest salaries, highest COL in Europe',
  },
  paris: {
    id: 'paris',
    name: 'Paris',
    country: 'France',
    flag: '🇫🇷',
    salaryMultiplier: 0.72,
    colMultiplier: 1.7,
    description: 'Cultural capital, moderate tech scene',
  },
  dublin: {
    id: 'dublin',
    name: 'Dublin',
    country: 'Ireland',
    flag: '🇮🇪',
    salaryMultiplier: 0.85,
    colMultiplier: 1.8,
    description: 'EU tech hub, many US companies',
  },

  // Asia-Pacific
  tokyo: {
    id: 'tokyo',
    name: 'Tokyo',
    country: 'Japan',
    flag: '🇯🇵',
    salaryMultiplier: 0.76,
    colMultiplier: 1.8,
    description: 'Tech powerhouse, high COL, unique culture',
  },
  singapore: {
    id: 'singapore',
    name: 'Singapore',
    country: 'Singapore',
    flag: '🇸🇬',
    salaryMultiplier: 1.1, // Competitive salaries
    colMultiplier: 1.9, // Expensive housing
    description: 'Asian financial hub, low taxes, expensive',
  },
  sydney: {
    id: 'sydney',
    name: 'Sydney',
    country: 'Australia',
    flag: '🇦🇺',
    salaryMultiplier: 0.85,
    colMultiplier: 1.7,
    description: 'Great lifestyle, expensive housing',
  },
  melbourne: {
    id: 'melbourne',
    name: 'Melbourne',
    country: 'Australia',
    flag: '🇦🇺',
    salaryMultiplier: 0.82,
    colMultiplier: 1.6,
    description: 'More affordable than Sydney, vibrant tech',
  },
  hongkong: {
    id: 'hongkong',
    name: 'Hong Kong',
    country: 'Hong Kong',
    flag: '🇭🇰',
    salaryMultiplier: 0.95,
    colMultiplier: 2.1, // Most expensive in Asia
    description: 'Financial hub, tiny apartments, high density',
  },
  seoul: {
    id: 'seoul',
    name: 'Seoul',
    country: 'South Korea',
    flag: '🇰🇷',
    salaryMultiplier: 0.68,
    colMultiplier: 1.5,
    description: 'Tech industry, fast internet, affordable',
  },
  bangalore: {
    id: 'bangalore',
    name: 'Bangalore',
    country: 'India',
    flag: '🇮🇳',
    salaryMultiplier: 0.25,
    colMultiplier: 0.4,
    description: 'Tech outsourcing hub, very low COL',
  },

  // Middle East
  dubai: {
    id: 'dubai',
    name: 'Dubai',
    country: 'UAE',
    flag: '🇦🇪',
    salaryMultiplier: 0.90,
    colMultiplier: 1.3,
    description: 'Tax-free, growing tech scene, hot climate',
  },
  telaviv: {
    id: 'telaviv',
    name: 'Tel Aviv',
    country: 'Israel',
    flag: '🇮🇱',
    salaryMultiplier: 0.88,
    colMultiplier: 1.9,
    description: 'Startup nation, expensive, vibrant culture',
  },

  // Americas (non-US)
  toronto: {
    id: 'toronto',
    name: 'Toronto',
    country: 'Canada',
    flag: '🇨🇦',
    salaryMultiplier: 0.80,
    colMultiplier: 1.5,
    description: 'Diverse, growing tech hub, cold winters',
  },
  vancouver: {
    id: 'vancouver',
    name: 'Vancouver',
    country: 'Canada',
    flag: '🇨🇦',
    salaryMultiplier: 0.78,
    colMultiplier: 1.6,
    description: 'Beautiful nature, expensive housing',
  },
  mexicocity: {
    id: 'mexicocity',
    name: 'Mexico City',
    country: 'Mexico',
    flag: '🇲🇽',
    salaryMultiplier: 0.35,
    colMultiplier: 0.5,
    description: 'Growing tech scene, very affordable',
  },
  buenosaires: {
    id: 'buenosaires',
    name: 'Buenos Aires',
    country: 'Argentina',
    flag: '🇦🇷',
    salaryMultiplier: 0.30,
    colMultiplier: 0.4,
    description: 'European feel, very low COL, economic instability',
  },

  // Africa
  capetown: {
    id: 'capetown',
    name: 'Cape Town',
    country: 'South Africa',
    flag: '🇿🇦',
    salaryMultiplier: 0.40,
    colMultiplier: 0.6,
    description: 'Beautiful, affordable, growing remote work hub',
  },
};

export function getInternationalCity(id: string): InternationalCity | undefined {
  return internationalCities[id];
}

export function getAllInternationalCities(): InternationalCity[] {
  return Object.values(internationalCities);
}

export function getCitiesByRegion(): Record<string, InternationalCity[]> {
  return {
    'Europe': [
      internationalCities.london,
      internationalCities.berlin,
      internationalCities.amsterdam,
      internationalCities.zurich,
      internationalCities.paris,
      internationalCities.dublin,
    ],
    'Asia-Pacific': [
      internationalCities.singapore,
      internationalCities.tokyo,
      internationalCities.sydney,
      internationalCities.melbourne,
      internationalCities.hongkong,
      internationalCities.seoul,
      internationalCities.bangalore,
    ],
    'Middle East': [
      internationalCities.dubai,
      internationalCities.telaviv,
    ],
    'Americas': [
      internationalCities.toronto,
      internationalCities.vancouver,
      internationalCities.mexicocity,
      internationalCities.buenosaires,
    ],
    'Africa': [
      internationalCities.capetown,
    ],
  };
}
