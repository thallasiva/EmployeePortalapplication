import React, { lazy, useContext, useEffect, useRef, useState } from "react";
const LazyInsightsPanel = lazy(() => import(".././LazyInsightsPanel"));
const ThemeContext = React.createContext(null);
function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}
function useThrottle(value, delay) {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastRun = useRef(0);
  useEffect(() => {
    const now = Date.now();
    if (now - lastRun.current >= delay) {
      lastRun.current = now;
      setThrottledValue(value);
    }
  }, [value, delay]);
  return throttledValue;
}
function calculatePrimes(limit) {
  const primes = [];
  for (let number = 2; number <= limit; number += 1) {
    let isPrime = true;
    for (let factor = 2; factor * factor <= number; factor += 1) {
      if (number % factor === 0) {
        isPrime = false;
        break;
      }
    }
    if (isPrime) {
      primes.push(number);
    }
  }
  return primes;
}
export { LazyInsightsPanel, ThemeContext, useTheme, useDebounce, useThrottle, calculatePrimes };
