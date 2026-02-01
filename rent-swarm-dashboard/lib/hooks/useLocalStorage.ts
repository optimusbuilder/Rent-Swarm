import { useState, useEffect, useCallback } from 'react';
import { localStorage } from '@/lib/utils/local-storage';

/**
 * React hook for persistent state using localStorage
 * Works exactly like useState, but persists across page refreshes and tab closes
 *
 * @param key - Unique key for this stored value
 * @param initialValue - Default value if nothing is stored
 * @returns [storedValue, setValue, clearValue] - Tuple like useState plus clear function
 *
 * @example
 * const [messages, setMessages, clearMessages] = useLocalStorage('chat-messages', []);
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void, () => void] {
  // Initialize state from localStorage or use initialValue
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue; // SSR safety
    }

    try {
      return localStorage.get<T>(key, initialValue);
    } catch (error) {
      console.error(`Error loading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Update localStorage whenever state changes
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        // Allow value to be a function (like useState)
        const valueToStore = value instanceof Function ? value(storedValue) : value;

        // Update React state
        setStoredValue(valueToStore);

        // Update localStorage (with error handling)
        if (typeof window !== 'undefined') {
          const success = localStorage.set(key, valueToStore);

          if (!success) {
            console.error(`Failed to save to localStorage: ${key}`);
            // State is updated but not persisted - app continues to work
          }
        }
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
        // Don't throw - gracefully degrade to non-persistent state
      }
    },
    [key, storedValue]
  );

  // Clear function - removes from both state and localStorage
  const clearValue = useCallback(() => {
    try {
      setStoredValue(initialValue);

      if (typeof window !== 'undefined') {
        localStorage.remove(key);
      }
    } catch (error) {
      console.error(`Error clearing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  // Listen for storage events (changes from other tabs)
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleStorageChange = (e: StorageEvent) => {
      // Only respond to changes to our key
      if (e.key === `rent-swarm:${key}`) {
        try {
          const newValue = e.newValue ? JSON.parse(e.newValue) : initialValue;
          setStoredValue(newValue);
        } catch (error) {
          console.error('Error parsing storage event:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, initialValue]);

  return [storedValue, setValue, clearValue];
}

/**
 * Hook to check if localStorage is available
 * Useful for showing UI warnings if storage is disabled
 */
export function useLocalStorageAvailable(): boolean {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    setAvailable(localStorage.isAvailable());
  }, []);

  return available;
}
