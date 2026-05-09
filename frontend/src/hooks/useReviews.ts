import { useState, useEffect } from 'react';
import api from '../services/api';
import { type Review } from '../types';

interface UseReviewsReturn {
  reviews: Review[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useReviews = (): UseReviewsReturn => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      // получаем только активные отзывы
      const res = await api.get<Review[]>('/content/reviews');
      setReviews(res.data);
    } catch (err) {
      setError('Не удалось загрузить отзывы');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchReviews();
  }, []);

  return { reviews, loading, error, refetch: fetchReviews };
};