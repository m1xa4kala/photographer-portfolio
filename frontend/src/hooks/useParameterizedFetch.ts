import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';

interface UseParameterizedFetchResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Generic hook for fetching data from a GET endpoint whose URL depends on
 * parameters. Re-fetches automatically when `deps` change.
 * Handles loading/error state and cleanup on unmount.
 */
export const useParameterizedFetch = <T>(
  urlFactory: () => string,
  deps: unknown[],
): UseParameterizedFetchResult<T> => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  const fetchData = useCallback(async () => {
    cancelledRef.current = false;
    setLoading(true);
    setError(null);
    try {
      const url = urlFactory();
      const res = await api.get<T[]>(url);
      if (!cancelledRef.current) {
        setData(res.data);
      }
    } catch (err) {
      if (!cancelledRef.current) {
        setError('Не удалось загрузить данные');
        console.error(err);
      }
    } finally {
      if (!cancelledRef.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};