// frontend/src/hooks/admin/useAdminWeddingFaqItems.ts
import { type WeddingFaqItem } from '../../types';
import { useAdminCrud } from '../useAdminCrud';
import type { ReorderItem } from '../useAdminCrud';

interface UseAdminWeddingFaqItemsReturn {
  items: WeddingFaqItem[];
  loading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  createItem: (data: Omit<WeddingFaqItem, 'id'>) => Promise<void>;
  updateItem: (id: number, data: Partial<Omit<WeddingFaqItem, 'id'>>) => Promise<void>;
  deleteItem: (id: number) => Promise<void>;
  reorderItems: (items: ReorderItem[]) => Promise<void>;
}

export const useAdminWeddingFaqItems = (): UseAdminWeddingFaqItemsReturn => {
  return useAdminCrud<WeddingFaqItem>('/admin/wedding-faq');
};