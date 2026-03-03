import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T, onError?: (error: Error) => void) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      if (onError && error instanceof Error) onError(error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
          console.error('LocalStorage quota exceeded! Data might not be saved.');
        } else {
          console.error('Error writing to localStorage:', error);
        }
        if (onError) onError(error);
      }
    }
  }, [key, storedValue, onError]);

  return [storedValue, setStoredValue] as const;
}
