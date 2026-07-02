import { type PriceItem } from '../../types';
import { useAdminCrud } from '../useAdminCrud';
import type { ReorderItem } from '../useAdminCrud';

interface UseAdminPriceItemsReturn {
  items: PriceItem[];
  loading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  createItem: (data: Omit<PriceItem, 'id'>) => Promise<void>;
  updateItem: (id: number, data: Partial<Omit<PriceItem, 'id'>>) => Promise<void>;
  deleteItem: (id: number) => Promise<void>;
  reorderItems: (items: ReorderItem[]) => Promise<void>;
}

export const useAdminPriceItems = (): UseAdminPriceItemsReturn => {
  return useAdminCrud<PriceItem>('/admin/price-items');
};