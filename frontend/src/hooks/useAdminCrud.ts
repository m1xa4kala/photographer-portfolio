import { useState, useEffect, useRef } from 'react';
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
 *
 * @param baseUrl - The base API path (e.g. '/admin/portfolio-sessions')
 * @param queryParams - Optional query params used ONLY for GET (fetch/initial load).
 *                      Mutations (create, update, delete, reorder) use the clean baseUrl.
 */
export const useAdminCrud = <T extends { id: number }>(
  baseUrl: string,
  queryParams?: Record<string, string>,
): UseAdminCrudResult<T> => {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  const buildUrl = () => {
    if (!queryParams || Object.keys(queryParams).length === 0) return baseUrl;
    const qs = new URLSearchParams(queryParams).toString();
    return `${baseUrl}?${qs}`;
  };

  const queryKey = queryParams ? JSON.stringify(queryParams) : '';

  const fetchItems = async () => {
    cancelledRef.current = false;
    setLoading(true);
    try {
      const res = await api.get<T[]>(buildUrl());
      if (!cancelledRef.current) {
        setItems(res.data);
        setError(null);
      }
    } catch {
      if (!cancelledRef.current) setError('Не удалось загрузить данные');
    } finally {
      if (!cancelledRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      setLoading(true);
      try {
        const res = await api.get<T[]>(buildUrl());
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

    return () => {
      cancelled = true;
      cancelledRef.current = true;
    };
  }, [baseUrl, queryKey]);

  // Mutations use baseUrl (without query params) for POST/PATCH/DELETE
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