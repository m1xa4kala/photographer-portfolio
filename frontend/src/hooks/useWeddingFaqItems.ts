// frontend/src/hooks/useWeddingFaqItems.ts
import { useFetch } from './useFetch';
import { type WeddingFaqItem } from '../types';

interface UseWeddingFaqItemsReturn {
  items: WeddingFaqItem[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useWeddingFaqItems = (): UseWeddingFaqItemsReturn => {
  const { data, loading, error, refetch } = useFetch<WeddingFaqItem[]>('/content/wedding-faq');
  return {
    items: data ?? [],
    loading,
    error,
    refetch,
  };
};