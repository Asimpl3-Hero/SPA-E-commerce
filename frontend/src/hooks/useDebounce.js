import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for debouncing a value
 * @param {*} value - The value to debounce
 * @param {number} delay - Delay in milliseconds (default: 500)
 * @returns {*} Debounced value
 */
export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Custom hook for debouncing a callback function
 * @param {Function} callback - The callback function to debounce
 * @param {number} delay - Delay in milliseconds (default: 500)
 * @param {Array} dependencies - Dependencies array for the callback
 * @returns {Function} Debounced callback function
 */
export const useDebouncedCallback = (callback, delay = 500, dependencies = []) => {
  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const debouncedCallback = (...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  };

  return debouncedCallback;
};
