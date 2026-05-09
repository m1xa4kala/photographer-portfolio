import { useState, useEffect } from 'react';
import api from '../../services/api';
import { type Review } from '../../types';

interface UseAdminReviewsReturn {
  items: Review[];
  loading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  createItem: (data: Omit<Review, 'id' | 'date'>) => Promise<void>;
  updateItem: (id: number, data: Partial<Omit<Review, 'id' | 'date'>>) => Promise<void>;
  deleteItem: (id: number) => Promise<void>;
}

export const useAdminReviews = (): UseAdminReviewsReturn => {
  const [items, setItems] = useState<Review[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await api.get<Review[]>('/admin/reviews');
      setItems(res.data);
    } catch {
      setError('Не удалось загрузить отзывы');
    } finally {
      setLoading(false);
    }
  };

  const createItem = async (data: Omit<Review, 'id' | 'date'>) => {
    await api.post('/admin/reviews', data);
    await fetchItems();
  };

  const updateItem = async (id: number, data: Partial<Omit<Review, 'id' | 'date'>>) => {
    await api.patch(`/admin/reviews/${id}`, data);
    await fetchItems();
  };

  const deleteItem = async (id: number) => {
    await api.delete(`/admin/reviews/${id}`);
    await fetchItems();
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchItems();
  }, []);

  return { items, loading, error, fetchItems, createItem, updateItem, deleteItem };
};