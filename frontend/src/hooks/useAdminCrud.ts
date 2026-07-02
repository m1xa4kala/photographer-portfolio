import { useState, useEffect } from 'react';
import api from '../services/api';

export interface ReorderItem {
  id: number;
  orderIndex: number;
}

interface UseAdminCrudResult<T extends { id: number }> {
  items: T[];
  loading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  createItem: (data: Omit<T, 'id'>) => Promise<void>;
  updateItem: (id: number, data: Partial<Omit<T, 'id'>>) => Promise<void>;
  deleteItem: (id: number) => Promise<void>;
  reorderItems: (items: ReorderItem[]) => Promise<void>;
}

/**
 * Generic CRUD hook for admin endpoints.
 * Expects RESTful routes: {baseUrl}, {baseUrl}/:id, {baseUrl}/reorder
 */
export const useAdminCrud = <T extends { id: number }>(
  baseUrl: string,
): UseAdminCrudResult<T> => {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await api.get<T[]>(baseUrl);
      setItems(res.data);
      setError(null);
    } catch {
      setError('Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      setLoading(true);
      try {
        const res = await api.get<T[]>(baseUrl);
        if (!cancelled) {
          setItems(res.data);
          setError(null);
        }
      } catch {
        if (!cancelled) setError('Не удалось загрузить данные');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    init();

    return () => { cancelled = true; };
  }, [baseUrl]);

  const createItem = async (data: Omit<T, 'id'>) => {
    await api.post(baseUrl, data);
    await fetchItems();
  };

  const updateItem = async (id: number, data: Partial<Omit<T, 'id'>>) => {
    await api.patch(`${baseUrl}/${id}`, data);
    await fetchItems();
  };

  const deleteItem = async (id: number) => {
    await api.delete(`${baseUrl}/${id}`);
    await fetchItems();
  };

  const reorderItems = async (reorderList: ReorderItem[]) => {
    await api.patch(`${baseUrl}/reorder`, { items: reorderList });
    await fetchItems();
  };

  return { items, loading, error, fetchItems, createItem, updateItem, deleteItem, reorderItems };
};