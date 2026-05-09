import { useState, useEffect } from 'react';
import api from '../../services/api';
import { type PortfolioPhoto } from '../../types';

interface UseAdminPortfolioPhotosReturn {
  items: PortfolioPhoto[];
  loading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  createItem: (data: Omit<PortfolioPhoto, 'id'>) => Promise<void>;
  updateItem: (id: number, data: Partial<Omit<PortfolioPhoto, 'id'>>) => Promise<void>;
  deleteItem: (id: number) => Promise<void>;
}

export const useAdminPortfolioPhotos = (): UseAdminPortfolioPhotosReturn => {
  const [items, setItems] = useState<PortfolioPhoto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await api.get<PortfolioPhoto[]>('/admin/portfolio-photos');
      setItems(res.data);
    } catch {
      setError('Не удалось загрузить фото портфолио');
    } finally {
      setLoading(false);
    }
  };

  const createItem = async (data: Omit<PortfolioPhoto, 'id'>) => {
    await api.post('/admin/portfolio-photos', data);
    await fetchItems();
  };

  const updateItem = async (id: number, data: Partial<Omit<PortfolioPhoto, 'id'>>) => {
    await api.patch(`/admin/portfolio-photos/${id}`, data);
    await fetchItems();
  };

  const deleteItem = async (id: number) => {
    await api.delete(`/admin/portfolio-photos/${id}`);
    await fetchItems();
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchItems();
  }, []);

  return { items, loading, error, fetchItems, createItem, updateItem, deleteItem };
};