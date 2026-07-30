import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import { type HomeSession } from '../types';

interface UseHomePortfolioReturn {
  sessions: HomeSession[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useHomePortfolio = (limit: number = 6): UseHomePortfolioReturn => {
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
      const res = await api.get<HomeSession[]>(`/content/portfolio-home?limit=${limit}`);
      if (!cancelledRef.current) {
        setSessions(res.data);
      }
    } catch (err) {
      if (!cancelledRef.current) {
        setError('Не удалось загрузить портфолио');
        console.error(err);
      }
    } finally {
      if (!cancelledRef.current) setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  return { sessions, loading, error, refetch: fetchData };
};