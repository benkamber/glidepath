// Barrel export for net worth tracker modules
// Re-exports all data, model, and component APIs for convenient imports

// Data modules
export {
  type AgeBracket,
  type EducationLevel,
  type PercentileData,
  getBracketForAge,
  getMedianForAge,
  getMedianForAgeAndEducation,
  getPercentileForAge,
  getPercentilesForAge,
  getNetWorthAtPercentile,
  compareToAgeGroup,
  getPercentileLabel,
} from '../data/scf-data';

export {
  type Occupation,
  type CareerLevel,
  type Metro,
  type WageEstimate,
  type MetroData,
  occupationLabels,
  levelLabels,
  metroLabels,
  metroData,
  getLevelForYears,
  getYearsRangeForLevel,
  getCOLMultiplier,
  getMetroData,
  getWageEstimate,
  getWageWithProgression,
  getIncomeTrajectory,
  calculateAnnualSavings,
  compareMetros,
  getOccupationOptions,
  getLevelOptions,
  getMetroOptions,
} from '../data/bls-wage-data';

// Models
export {
  type WealthModelInput,
  type WealthModelOutput,
  type WealthComparison,
  type Milestone,
  type ProjectionScenario,
  type YearByYearData,
  projectionScenarios,
  modelExpectedWealth,
  projectFutureWealth,
  compareToExpected,
  getMilestones,
  generateScenarios,
  calculateAgeToTarget,
  calculateRequiredSavingsRate,
  getComparisonDescription,
  calculateFIRENumbers,
} from '../models/wealth-model';
