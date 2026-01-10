import { useEffect } from 'react';

/**
 * Custom hook for detecting clicks outside a referenced element
 * @param {React.RefObject} ref - Reference to the element
 * @param {Function} handler - Callback function when clicking outside
 * @param {Array} additionalRefs - Additional refs to consider as "inside" (optional)
 */
export const useOnClickOutside = (ref, handler, additionalRefs = []) => {
  useEffect(() => {
    const listener = (event) => {
      const refs = [ref, ...additionalRefs];

      const isClickInside = refs.some((r) => {
        if (!r.current) return false;
        return r.current.contains(event.target);
      });

      if (!isClickInside) {
        handler(event);
      }
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler, additionalRefs]);
};
