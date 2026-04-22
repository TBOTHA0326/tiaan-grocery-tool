import { useEffect, useState } from 'react';

type StorageHook<T> = [T, (value: T) => void];

export function useLocalStorage<T>(key: string, initialValue: T): StorageHook<T> {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  useEffect(() => {
    const raw = window.localStorage.getItem(key);
    if (raw) {
      try {
        setStoredValue(JSON.parse(raw) as T);
      } catch {
        setStoredValue(initialValue);
      }
    }
  }, [initialValue, key]);

  const setValue = (value: T) => {
    setStoredValue(value);
    window.localStorage.setItem(key, JSON.stringify(value));
  };

  return [storedValue, setValue];
}
