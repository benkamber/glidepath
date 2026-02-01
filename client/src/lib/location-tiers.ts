// Location cost tiers for geographic FIRE analysis

export interface LocationTier {
  tier: 1 | 2 | 3 | 4 | 5;
  name: string;
  label: string;
  monthlyExpenses: number;
  annualExpenses: number;
  exampleCities: string[];
  color: string;
}

export const LOCATION_TIERS: LocationTier[] = [
  {
    tier: 1,
    name: 'budget',
    label: 'Budget ($1,500/mo)',
    monthlyExpenses: 1500,
    annualExpenses: 18000,
    exampleCities: ['Chiang Mai', 'Medellín', 'Da Nang', 'Tbilisi'],
    color: '#22c55e',
  },
  {
    tier: 2,
    name: 'affordable',
    label: 'Affordable ($2,500/mo)',
    monthlyExpenses: 2500,
    annualExpenses: 30000,
    exampleCities: ['Lisbon', 'Mexico City', 'Prague', 'Buenos Aires'],
    color: '#84cc16',
  },
  {
    tier: 3,
    name: 'moderate',
    label: 'Moderate ($3,500/mo)',
    monthlyExpenses: 3500,
    annualExpenses: 42000,
    exampleCities: ['Berlin', 'Austin', 'Denver', 'Barcelona'],
    color: '#eab308',
  },
  {
    tier: 4,
    name: 'expensive',
    label: 'Expensive ($5,000/mo)',
    monthlyExpenses: 5000,
    annualExpenses: 60000,
    exampleCities: ['Seattle', 'Los Angeles', 'London', 'Sydney'],
    color: '#f97316',
  },
  {
    tier: 5,
    name: 'premium',
    label: 'Premium ($7,000/mo)',
    monthlyExpenses: 7000,
    annualExpenses: 84000,
    exampleCities: ['San Francisco', 'New York', 'Zurich', 'Singapore'],
    color: '#ef4444',
  },
];

// Map Glidepath metros (underscore convention, colIndex with Austin=100) to tiers
export function getMetroTier(metro: string): LocationTier {
  const premiumMetros = ['san_francisco', 'san_jose', 'new_york'];
  const expensiveMetros = ['seattle', 'los_angeles', 'boston', 'washington_dc', 'san_diego'];
  const moderateMetros = [
    'austin', 'denver', 'portland', 'chicago', 'miami', 'atlanta',
    'minneapolis', 'philadelphia', 'dallas', 'phoenix', 'raleigh',
    'nashville', 'salt_lake_city', 'remote', 'other',
  ];
  const affordableMetros = ['charlotte', 'detroit', 'houston', 'tampa', 'pittsburgh', 'columbus'];

  if (premiumMetros.includes(metro)) return LOCATION_TIERS[4];
  if (expensiveMetros.includes(metro)) return LOCATION_TIERS[3];
  if (affordableMetros.includes(metro)) return LOCATION_TIERS[1];
  if (moderateMetros.includes(metro)) return LOCATION_TIERS[2];
  return LOCATION_TIERS[2]; // Default moderate
}
