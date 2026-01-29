// Enhanced localStorage utility with error handling

export class StorageError extends Error {
  constructor(
    message: string,
    public code: 'QUOTA_EXCEEDED' | 'SECURITY_ERROR' | 'PARSE_ERROR' | 'UNKNOWN'
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

/**
 * Safely get item from localStorage
 */
export function getItem<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(key);
    if (item === null) return null;

    return JSON.parse(item) as T;
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error(`Failed to parse localStorage item "${key}":`, error);
      // Data is corrupt, remove it
      try {
        localStorage.removeItem(key);
      } catch {
        // Ignore
      }
      throw new StorageError(`Failed to parse stored data for "${key}"`, 'PARSE_ERROR');
    }

    console.error(`Failed to read localStorage item "${key}":`, error);
    throw new StorageError(`Failed to read stored data for "${key}"`, 'UNKNOWN');
  }
}

/**
 * Safely set item in localStorage
 */
export function setItem<T>(key: string, value: T): { success: boolean; error?: StorageError } {
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return { success: true };
  } catch (error: any) {
    let storageError: StorageError;

    if (error.name === 'QuotaExceededError' || error.code === 22) {
      // Quota exceeded
      storageError = new StorageError(
        'Storage limit reached. Please export your data and clear some entries.',
        'QUOTA_EXCEEDED'
      );
    } else if (error.name === 'SecurityError') {
      // Private browsing or localStorage disabled
      storageError = new StorageError(
        'Storage is unavailable. Data will not persist between sessions.',
        'SECURITY_ERROR'
      );
    } else {
      storageError = new StorageError(
        'Failed to save data to local storage.',
        'UNKNOWN'
      );
    }

    console.error(`Failed to save localStorage item "${key}":`, error);
    return { success: false, error: storageError };
  }
}

/**
 * Safely remove item from localStorage
 */
export function removeItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to remove localStorage item "${key}":`, error);
  }
}

/**
 * Check if localStorage is available
 */
export function isStorageAvailable(): boolean {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get storage usage information
 */
export function getStorageInfo(): {
  isAvailable: boolean;
  estimatedUsage?: number;
  estimatedQuota?: number;
  percentUsed?: number;
} {
  const isAvailable = isStorageAvailable();

  if (!isAvailable) {
    return { isAvailable: false };
  }

  try {
    // Estimate usage by checking sizes of all items
    let totalSize = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          // Rough estimate: key + value length in bytes (UTF-16)
          totalSize += (key.length + value.length) * 2;
        }
      }
    }

    // Typical localStorage quota is 5-10MB
    const estimatedQuota = 5 * 1024 * 1024; // 5MB
    const percentUsed = (totalSize / estimatedQuota) * 100;

    return {
      isAvailable: true,
      estimatedUsage: totalSize,
      estimatedQuota,
      percentUsed: Math.round(percentUsed),
    };
  } catch (error) {
    console.error('Failed to calculate storage info:', error);
    return { isAvailable: true };
  }
}

/**
 * Clear all app data from localStorage
 */
export function clearAllAppData(): void {
  const keysToRemove = [
    'net-worth-tracker-data',
    'nw_tracker_profile',
    'nw_tracker_onboarded',
    'last_backup_reminder',
  ];

  keysToRemove.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove ${key}:`, error);
    }
  });

  // Remove any deviation dismissal keys
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith('deviation_dismissed_')) {
        localStorage.removeItem(key);
      }
    }
  } catch (error) {
    console.error('Failed to clear deviation dismissals:', error);
  }
}

/**
 * Safe wrapper for localStorage operations with automatic error handling
 */
export class SafeStorage<T> {
  constructor(private key: string, private defaultValue: T) {}

  get(): T {
    try {
      const value = getItem<T>(this.key);
      return value ?? this.defaultValue;
    } catch {
      return this.defaultValue;
    }
  }

  set(value: T, onError?: (error: StorageError) => void): boolean {
    const result = setItem(this.key, value);
    if (!result.success && result.error && onError) {
      onError(result.error);
    }
    return result.success;
  }

  remove(): void {
    removeItem(this.key);
  }
}
