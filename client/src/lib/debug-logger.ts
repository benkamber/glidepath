/**
 * Debug logging system for troubleshooting data issues
 * Enable by setting localStorage.setItem('debug', 'true')
 */

export const DEBUG_ENABLED = typeof window !== 'undefined' &&
  (window.localStorage.getItem('debug') === 'true' ||
   window.location.search.includes('debug=true'));

// Show instructions on how to enable debug mode
if (typeof window !== 'undefined' && !DEBUG_ENABLED) {
  console.log(
    '%c💡 Debug Mode Available',
    'color: #10b981; font-weight: bold; font-size: 14px;',
  );
  console.log(
    '%cEnable detailed logging by running: localStorage.setItem(\'debug\', \'true\') and refreshing',
    'color: #6b7280; font-size: 12px;'
  );
  console.log(
    '%cOr add ?debug=true to the URL',
    'color: #6b7280; font-size: 12px;'
  );
}

if (DEBUG_ENABLED) {
  console.log(
    '%c🐛 DEBUG MODE ENABLED',
    'color: #ef4444; font-weight: bold; font-size: 16px; padding: 4px 8px; background: #fef2f2; border: 2px solid #ef4444;'
  );
  console.log(
    '%cAll data parsing, calculations, and chart rendering will be logged below.',
    'color: #ef4444; font-size: 12px;'
  );
  console.log(
    '%cDisable with: localStorage.setItem(\'debug\', \'false\') and refresh',
    'color: #6b7280; font-size: 12px;'
  );
}

export function debugLog(category: string, message: string, data?: any) {
  if (!DEBUG_ENABLED) return;

  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${category}]`;

  if (data !== undefined) {
    console.log(`${prefix} ${message}`, data);
  } else {
    console.log(`${prefix} ${message}`);
  }
}

export function debugTable(category: string, message: string, data: any[]) {
  if (!DEBUG_ENABLED) return;

  console.log(`[${category}] ${message}`);
  console.table(data);
}

export function debugGroup(category: string, title: string, fn: () => void) {
  if (!DEBUG_ENABLED) {
    fn();
    return;
  }

  console.group(`[${category}] ${title}`);
  fn();
  console.groupEnd();
}

export function debugError(category: string, message: string, error: any) {
  if (!DEBUG_ENABLED) return;

  console.error(`[${category}] ERROR: ${message}`, error);
}

/**
 * Log calculation steps for wealth projections
 */
export function debugCalculation(step: string, inputs: any, output: any) {
  if (!DEBUG_ENABLED) return;

  console.group(`[CALC] ${step}`);
  console.log('Inputs:', inputs);
  console.log('Output:', output);
  console.groupEnd();
}

/**
 * Format currency for debug output
 */
export function debugCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

/**
 * Generate a quick integrity checksum for entry arrays
 * Format: "count|lastDate|lastNetWorth"
 *
 * If this changes between stages unexpectedly, you found the bug!
 */
export function dataHash(entries: Array<{ date: string; totalNetWorth?: number; netWorth?: number }>): string {
  if (entries.length === 0) return '0|none|$0';

  const last = entries[entries.length - 1];
  const netWorth = last.totalNetWorth ?? last.netWorth ?? 0;

  return `${entries.length}|${last.date}|${debugCurrency(netWorth)}`;
}

/**
 * Log data integrity checkpoint
 * Shows count, last date, and last net worth at each stage
 */
export function debugCheckpoint(stage: string, entries: Array<{ date: string; totalNetWorth?: number; netWorth?: number }>) {
  if (!DEBUG_ENABLED) return;

  const hash = dataHash(entries);
  const first = entries.length > 0 ? entries[0] : null;
  const last = entries.length > 0 ? entries[entries.length - 1] : null;

  console.log(
    `%c[CHECKPOINT] ${stage}`,
    'background: #3b82f6; color: white; font-weight: bold; padding: 2px 6px; border-radius: 3px;',
    hash
  );

  if (first && last) {
    console.log(
      `  📊 Count: ${entries.length} | Range: ${first.date} → ${last.date}`
    );
  }
}
