
import { useCallback, useState } from "react";

export function useLocalStorage(key, initialValue) {
  const [stored, setStored] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item !== null ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      const toStore = value instanceof Function ? value(stored) : value;
      setStored(toStore);
      window.localStorage.setItem(key, JSON.stringify(toStore));
    } catch (err) {
      console.warn("[useLocalStorage] write failed:", key, err);
    }
  }, [key, stored]);

  const remove = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStored(initialValue);
    } catch {}
  }, [key, initialValue]);

  return [stored, setValue, remove];
}
