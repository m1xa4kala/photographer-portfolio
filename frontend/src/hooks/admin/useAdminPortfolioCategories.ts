import { useState, useEffect } from 'react';
import api from '../../services/api';
import { type PortfolioCategory } from '../../types';

interface UseAdminPortfolioCategoriesReturn {
  items: PortfolioCategory[];
  loading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  createItem: (data: Omit<PortfolioCategory, 'id'>) => Promise<void>;
  updateItem: (id: number, data: Partial<Omit<PortfolioCategory, 'id'>>) => Promise<void>;
  deleteItem: (id: number) => Promise<void>;
}

export const useAdminPortfolioCategories = (): UseAdminPortfolioCategoriesReturn => {
  const [items, setItems] = useState<PortfolioCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await api.get<PortfolioCategory[]>('/admin/portfolio-categories');
      setItems(res.data);
    } catch {
      setError('Не удалось загрузить категории');
    } finally {
      setLoading(false);
    }
  };

  const createItem = async (data: Omit<PortfolioCategory, 'id'>) => {
    await api.post('/admin/portfolio-categories', data);
    await fetchItems();
  };

  const updateItem = async (id: number, data: Partial<Omit<PortfolioCategory, 'id'>>) => {
    await api.patch(`/admin/portfolio-categories/${id}`, data);
    await fetchItems();
  };

  const deleteItem = async (id: number) => {
    await api.delete(`/admin/portfolio-categories/${id}`);
    await fetchItems();
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchItems();
  }, []);

  return { items, loading, error, fetchItems, createItem, updateItem, deleteItem };
};