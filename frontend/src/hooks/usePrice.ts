import { useState, useEffect } from 'react';
import api from '../services/api';
import { type PriceItem } from '../types';

interface UsePriceReturn {
  items: PriceItem[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const usePrice = (): UsePriceReturn => {
  const [items, setItems] = useState<PriceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<PriceItem[]>('/content/price-items');
      setItems(res.data);
    } catch (err) {
      setError('Не удалось загрузить прайс-лист');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchItems();
  }, []);

  return { items, loading, error, refetch: fetchItems };
};