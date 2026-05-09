import { useState, useEffect } from 'react';
import api from '../../services/api';
import { type BestPhoto } from '../../types';

interface UseAdminBestPhotosReturn {
  items: BestPhoto[];
  loading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  createItem: (data: Omit<BestPhoto, 'id'>) => Promise<void>;
  updateItem: (id: number, data: Partial<Omit<BestPhoto, 'id'>>) => Promise<void>;
  deleteItem: (id: number) => Promise<void>;
}

export const useAdminBestPhotos = (): UseAdminBestPhotosReturn => {
  const [items, setItems] = useState<BestPhoto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = async (): Promise<void> => {
    setLoading(true);
    try {
      const res = await api.get<BestPhoto[]>('/admin/best-photos');
      setItems(res.data);
      setError(null);
    } catch (err) {
      setError('Не удалось загрузить лучшие фото');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createItem = async (data: Omit<BestPhoto, 'id'>): Promise<void> => {
    try {
      await api.post('/admin/best-photos', data);
      await fetchItems();
    } catch (err) {
      setError('Ошибка при создании');
      throw err;
    }
  };

  const updateItem = async (id: number, data: Partial<Omit<BestPhoto, 'id'>>): Promise<void> => {
    try {
      await api.patch(`/admin/best-photos/${id}`, data);
      await fetchItems();
    } catch (err) {
      setError('Ошибка при обновлении');
      throw err;
    }
  };

  const deleteItem = async (id: number): Promise<void> => {
    try {
      await api.delete(`/admin/best-photos/${id}`);
      await fetchItems();
    } catch (err) {
      setError('Ошибка при удалении');
      throw err;
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchItems();
  }, []);

  return { items, loading, error, fetchItems, createItem, updateItem, deleteItem };
};