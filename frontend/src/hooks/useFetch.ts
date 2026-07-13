import { useState, useEffect, useRef } from 'react';
import api from '../services/api';

interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Generic hook for fetching data from a single GET endpoint.
 * Handles loading/error state and cleanup on unmount.
 */
export const useFetch = <T>(url: string): UseFetchResult<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get<T>(url);
        if (!cancelled) setData(res.data);
      } catch (err) {
        if (!cancelled) {
          setError('Не удалось загрузить данные');
          console.error(err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetch();

    return () => {
      cancelled = true;
      cancelledRef.current = true;
    };
  }, [url]);

  const refetch = async () => {
    cancelledRef.current = false;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<T>(url);
      if (!cancelledRef.current) setData(res.data);
    } catch (err) {
      if (!cancelledRef.current) {
        setError('Не удалось загрузить данные');
        console.error(err);
      }
    } finally {
      if (!cancelledRef.current) setLoading(false);
    }
  };

  return { data, loading, error, refetch };
};