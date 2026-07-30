import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import { type PortfolioCategory } from '../types';

interface UsePortfolioCategoriesReturn {
  categories: PortfolioCategory[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const usePortfolioCategories = (): UsePortfolioCategoriesReturn => {
  const [categories, setCategories] = useState<PortfolioCategory[]>([]);
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
      const res = await api.get<PortfolioCategory[]>('/content/portfolio-categories');
      if (!cancelledRef.current) {
        setCategories(res.data);
      }
    } catch (err) {
      if (!cancelledRef.current) {
        setError('Не удалось загрузить категории');
        console.error(err);
      }
    } finally {
      if (!cancelledRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  return { categories, loading, error, refetch: fetchData };
};