import { useFetch } from './useFetch';
import { type About } from '../types';

interface UseAboutReturn {
  about: About | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useAbout = (): UseAboutReturn => {
  const { data, loading, error, refetch } = useFetch<About>('/content/about');

  return {
    about: data,
    loading,
    error,
    refetch,
  };
};