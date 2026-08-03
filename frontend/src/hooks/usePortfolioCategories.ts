import { useParameterizedFetch } from './useParameterizedFetch';
import { type PortfolioCategory } from '../types';

export const usePortfolioCategories = () => {
  const { data, loading, error, refetch } = useParameterizedFetch<PortfolioCategory>(
    () => '/content/portfolio-categories',
    [],
  );

  return { categories: data, loading, error, refetch };
};