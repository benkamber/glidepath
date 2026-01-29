// Data Backup and Restore Utility
import { format } from 'date-fns';

export interface BackupData {
  version: string;
  exportDate: string;
  entries: Array<{
    id: string;
    date: string;
    totalNetWorth: number;
    cash: number;
  }>;
  profile: {
    age: number;
    occupation: string;
    level: string;
    metro: string;
    savingsRate: number;
  } | null;
}

const CURRENT_VERSION = '1.0.0';

/**
 * Export all user data to JSON file
 */
export function exportData(entries: any[], profile: any | null): void {
  const data: BackupData = {
    version: CURRENT_VERSION,
    exportDate: new Date().toISOString(),
    entries: entries,
    profile: profile,
  };

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `net-worth-backup-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Validate backup data structure
 */
export function validateBackupData(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data) {
    errors.push('No data provided');
    return { valid: false, errors };
  }

  if (typeof data !== 'object') {
    errors.push('Data must be an object');
    return { valid: false, errors };
  }

  // Check version
  if (!data.version) {
    errors.push('Missing version field');
  }

  // Check entries
  if (!Array.isArray(data.entries)) {
    errors.push('Entries must be an array');
  } else {
    // Validate each entry
    data.entries.forEach((entry: any, index: number) => {
      if (!entry.id) errors.push(`Entry ${index}: missing id`);
      if (!entry.date) errors.push(`Entry ${index}: missing date`);
      if (typeof entry.totalNetWorth !== 'number') {
        errors.push(`Entry ${index}: totalNetWorth must be a number`);
      }
      if (typeof entry.cash !== 'number') {
        errors.push(`Entry ${index}: cash must be a number`);
      }
    });
  }

  // Check profile (optional, but if present must be valid)
  if (data.profile !== null && data.profile !== undefined) {
    if (typeof data.profile !== 'object') {
      errors.push('Profile must be an object or null');
    } else {
      if (typeof data.profile.age !== 'number') {
        errors.push('Profile: age must be a number');
      }
      if (!data.profile.occupation) {
        errors.push('Profile: missing occupation');
      }
      if (!data.profile.level) {
        errors.push('Profile: missing level');
      }
      if (!data.profile.metro) {
        errors.push('Profile: missing metro');
      }
      if (typeof data.profile.savingsRate !== 'number') {
        errors.push('Profile: savingsRate must be a number');
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Migrate data from older versions
 */
export function migrateBackupData(data: any): BackupData {
  // If no version, assume legacy format (just entries array)
  if (!data.version) {
    if (Array.isArray(data)) {
      return {
        version: CURRENT_VERSION,
        exportDate: new Date().toISOString(),
        entries: data,
        profile: null,
      };
    }
  }

  // Version 1.0.0 format is current
  return data as BackupData;
}

/**
 * Import data from JSON file
 */
export function importDataFromFile(file: File): Promise<BackupData> {
  return new Promise((resolve, reject) => {
    if (!file.name.endsWith('.json')) {
      reject(new Error('File must be a JSON file'));
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text);

        // Validate
        const validation = validateBackupData(data);
        if (!validation.valid) {
          reject(new Error(`Invalid backup file:\n${validation.errors.join('\n')}`));
          return;
        }

        // Migrate if needed
        const migratedData = migrateBackupData(data);

        resolve(migratedData);
      } catch (error) {
        if (error instanceof SyntaxError) {
          reject(new Error('Invalid JSON file'));
        } else {
          reject(error);
        }
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}

/**
 * Check if backup is recommended (data hasn't been backed up recently)
 */
export function shouldShowBackupReminder(): boolean {
  try {
    const lastBackup = localStorage.getItem('last_backup_reminder');
    if (!lastBackup) return true;

    const lastDate = new Date(lastBackup);
    const daysSinceBackup = Math.floor(
      (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Show reminder every 30 days
    return daysSinceBackup >= 30;
  } catch {
    return true;
  }
}

/**
 * Mark backup reminder as shown
 */
export function markBackupReminderShown(): void {
  try {
    localStorage.setItem('last_backup_reminder', new Date().toISOString());
  } catch {
    // Ignore errors
  }
}

/**
 * Get backup statistics
 */
export function getBackupStats(entries: any[]): {
  totalEntries: number;
  oldestEntry: string | null;
  newestEntry: string | null;
  dataPoints: number;
} {
  if (entries.length === 0) {
    return {
      totalEntries: 0,
      oldestEntry: null,
      newestEntry: null,
      dataPoints: 0,
    };
  }

  const sorted = [...entries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return {
    totalEntries: entries.length,
    oldestEntry: sorted[0].date,
    newestEntry: sorted[sorted.length - 1].date,
    dataPoints: entries.length,
  };
}
