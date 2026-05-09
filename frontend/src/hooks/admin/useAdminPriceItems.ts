import { useState, useEffect } from 'react';
import api from '../../services/api';
import { type PriceItem } from '../../types';

interface UseAdminPriceItemsReturn {
  items: PriceItem[];
  loading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  createItem: (data: Omit<PriceItem, 'id'>) => Promise<void>;
  updateItem: (id: number, data: Partial<Omit<PriceItem, 'id'>>) => Promise<void>;
  deleteItem: (id: number) => Promise<void>;
}

export const useAdminPriceItems = (): UseAdminPriceItemsReturn => {
  const [items, setItems] = useState<PriceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await api.get<PriceItem[]>('/admin/price-items');
      setItems(res.data);
    } catch {
      setError('Не удалось загрузить прайс-лист');
    } finally {
      setLoading(false);
    }
  };

  const createItem = async (data: Omit<PriceItem, 'id'>) => {
    await api.post('/admin/price-items', data);
    await fetchItems();
  };

  const updateItem = async (id: number, data: Partial<Omit<PriceItem, 'id'>>) => {
    await api.patch(`/admin/price-items/${id}`, data);
    await fetchItems();
  };

  const deleteItem = async (id: number) => {
    await api.delete(`/admin/price-items/${id}`);
    await fetchItems();
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchItems();
  }, []);

  return { items, loading, error, fetchItems, createItem, updateItem, deleteItem };
};