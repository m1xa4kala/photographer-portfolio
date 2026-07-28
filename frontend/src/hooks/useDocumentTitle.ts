import { useEffect } from 'react';

/**
 * Sets document.title to the given string.
 * Call with no title to keep the current value.
 */
export function useDocumentTitle(title?: string) {
  useEffect(() => {
    if (title) {
      document.title = title;
    }
  }, [title]);
}