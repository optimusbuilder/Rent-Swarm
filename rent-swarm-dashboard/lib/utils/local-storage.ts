/**
 * Type-safe localStorage wrapper with namespacing
 * Prevents collisions with other apps and provides error handling
 */

const NAMESPACE = 'rent-swarm';

export const localStorage = {
  /**
   * Get item from localStorage with type safety
   */
  get<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') {
      return defaultValue; // SSR safety
    }

    try {
      const item = window.localStorage.getItem(`${NAMESPACE}:${key}`);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`LocalStorage get error for key ${key}:`, error);
      return defaultValue;
    }
  },

  /**
   * Set item in localStorage with quota handling
   */
  set<T>(key: string, value: T): boolean {
    if (typeof window === 'undefined') {
      return false; // SSR safety
    }

    try {
      const serialized = JSON.stringify(value);

      // Check approximate size (1 char ≈ 2 bytes in UTF-16)
      const sizeInBytes = new Blob([serialized]).size;
      const sizeInMB = sizeInBytes / (1024 * 1024);

      // Warn if approaching quota (most browsers allow ~5-10MB)
      if (sizeInMB > 4) {
        console.warn(
          `LocalStorage: Large data being stored (${sizeInMB.toFixed(2)}MB). ` +
          `Consider reducing data size to avoid quota errors.`
        );
      }

      window.localStorage.setItem(`${NAMESPACE}:${key}`, serialized);
      return true;
    } catch (error) {
      console.error(`LocalStorage set error for key ${key}:`, error);

      // Handle quota exceeded
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.error(
          'LocalStorage quota exceeded. Data was not saved. ' +
          'Try clearing old sessions or reducing data size.'
        );

        // Alert user about quota issue
        if (typeof window !== 'undefined') {
          alert(
            'Storage quota exceeded. Your session data is too large to save. ' +
            'Please clear old sessions using the "Clear Session" button.'
          );
        }
      }

      return false;
    }
  },

  /**
   * Remove item from localStorage
   */
  remove(key: string): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.removeItem(`${NAMESPACE}:${key}`);
    } catch (error) {
      console.error(`LocalStorage remove error for key ${key}:`, error);
    }
  },

  /**
   * Clear all namespaced items
   */
  clear(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      // Only clear our namespaced keys
      Object.keys(window.localStorage).forEach(key => {
        if (key.startsWith(NAMESPACE)) {
          window.localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('LocalStorage clear error:', error);
    }
  },

  /**
   * Get all namespaced keys
   */
  keys(): string[] {
    if (typeof window === 'undefined') {
      return [];
    }

    try {
      return Object.keys(window.localStorage)
        .filter(key => key.startsWith(NAMESPACE))
        .map(key => key.replace(`${NAMESPACE}:`, ''));
    } catch (error) {
      console.error('LocalStorage keys error:', error);
      return [];
    }
  },

  /**
   * Check if storage is available
   */
  isAvailable(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    try {
      const testKey = `${NAMESPACE}:test`;
      window.localStorage.setItem(testKey, 'test');
      window.localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }
};
