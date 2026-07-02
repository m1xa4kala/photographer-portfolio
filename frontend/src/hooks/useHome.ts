import { useFetch } from './useFetch';
import { type BestPhoto } from '../types';

interface UseHomeReturn {
  photos: BestPhoto[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useHome = (): UseHomeReturn => {
  const { data, loading, error, refetch } = useFetch<BestPhoto[]>('/content/best-photos');

  return {
    photos: data ?? [],
    loading,
    error,
    refetch,
  };
};