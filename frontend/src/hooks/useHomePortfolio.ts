import { useParameterizedFetch } from './useParameterizedFetch';
import { type HomeSession } from '../types';

export const useHomePortfolio = (limit: number = 6) => {
  const { data, loading, error, refetch } = useParameterizedFetch<HomeSession>(
    () => `/content/portfolio-home?limit=${limit}`,
    [limit],
  );

  return { sessions: data, loading, error, refetch };
};