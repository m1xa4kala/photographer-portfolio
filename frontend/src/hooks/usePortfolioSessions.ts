import { useParameterizedFetch } from './useParameterizedFetch';
import { type HomeSession } from '../types';

export const usePortfolioSessions = (categoryId: number | null) => {
  const { data, loading, error, refetch } = useParameterizedFetch<HomeSession>(
    () => {
      const base = '/content/portfolio-sessions-with-covers';
      return categoryId !== null ? `${base}?categoryId=${categoryId}` : base;
    },
    [categoryId],
  );

  return { sessions: data, loading, error, refetch };
};