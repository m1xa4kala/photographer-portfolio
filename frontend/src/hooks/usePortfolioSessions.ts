import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import { type HomeSession } from '../types';

interface UsePortfolioSessionsReturn {
  sessions: HomeSession[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const usePortfolioSessions = (categoryId: number | null): UsePortfolioSessionsReturn => {
  const [sessions, setSessions] = useState<HomeSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    return () => { cancelledRef.current = true; };
  }, []);

  const fetchData = useCallback(async () => {
    cancelledRef.current = false;
    setLoading(true);
    setError(null);
    try {
      const url = categoryId !== null
        ? `/content/portfolio-sessions-with-covers?categoryId=${categoryId}`
        : '/content/portfolio-sessions-with-covers';
      const res = await api.get<HomeSession[]>(url);
      if (!cancelledRef.current) {
        setSessions(res.data);
      }
    } catch (err) {
      if (!cancelledRef.current) {
        setError('Не удалось загрузить фотосессии');
        console.error(err);
      }
    } finally {
      if (!cancelledRef.current) setLoading(false);
    }
  }, [categoryId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  return { sessions, loading, error, refetch: fetchData };
};