import { useParameterizedFetch } from './useParameterizedFetch';
import { type PortfolioPhoto } from '../types';

export const usePortfolioPhotos = (sessionId: number | null) => {
  const { data, loading, error, refetch } = useParameterizedFetch<PortfolioPhoto>(
    () => {
      const base = '/content/portfolio-photos';
      return sessionId !== null ? `${base}?sessionId=${sessionId}` : base;
    },
    [sessionId],
  );

  return { photos: data, loading, error, refetch };
};