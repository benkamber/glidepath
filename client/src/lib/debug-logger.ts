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
