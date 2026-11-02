// frontend/src/hooks/useWeddingPackages.ts
import { useFetch } from './useFetch';
import { type WeddingPackage } from '../types';

interface UseWeddingPackagesReturn {
  items: WeddingPackage[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useWeddingPackages = (): UseWeddingPackagesReturn => {
  const { data, loading, error, refetch } = useFetch<WeddingPackage[]>('/content/wedding-packages');
  return {
    items: data ?? [],
    loading,
    error,
    refetch,
  };
};