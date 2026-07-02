import { useFetch } from './useFetch';
import { type Review } from '../types';

interface UseReviewsReturn {
  reviews: Review[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useReviews = (): UseReviewsReturn => {
  const { data, loading, error, refetch } = useFetch<Review[]>('/content/reviews');

  return {
    reviews: data ?? [],
    loading,
    error,
    refetch,
  };
};