import { useEffect, useRef } from 'react';

/**
 * Hook for debounced updates to enable real-time collaboration
 * Calls the update function after a delay when value changes
 */
export const useDebouncedUpdate = (value, onUpdate, element, delay = 800) => {
  const timeoutRef = useRef(null);
  const previousValueRef = useRef(value);

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Don't update if value hasn't changed
    if (value === previousValueRef.current) {
      return;
    }

    // Don't update if value is same as element's current value
    if (value === element?.content?.value) {
      previousValueRef.current = value;
      return;
    }

    // Set new timeout for debounced update
    timeoutRef.current = setTimeout(() => {
      // Update the element with new value
      if (onUpdate && element) {
        onUpdate({
          ...element,
          content: {
            ...element.content,
            value
          }
        });
      }
      previousValueRef.current = value;
    }, delay);

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, onUpdate, element, delay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
};
