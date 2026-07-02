import { useFetch } from './useFetch';
import { type PriceItem } from '../types';

interface UsePriceReturn {
  items: PriceItem[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const usePrice = (): UsePriceReturn => {
  const { data, loading, error, refetch } = useFetch<PriceItem[]>('/content/price-items');

  return {
    items: data ?? [],
    loading,
    error,
    refetch,
  };
};