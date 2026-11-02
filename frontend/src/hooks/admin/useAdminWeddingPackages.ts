// frontend/src/hooks/admin/useAdminWeddingPackages.ts
import { type WeddingPackage } from '../../types';
import { useAdminCrud } from '../useAdminCrud';
import type { ReorderItem } from '../useAdminCrud';

interface UseAdminWeddingPackagesReturn {
  items: WeddingPackage[];
  loading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  createItem: (data: Omit<WeddingPackage, 'id'>) => Promise<void>;
  updateItem: (id: number, data: Partial<Omit<WeddingPackage, 'id'>>) => Promise<void>;
  deleteItem: (id: number) => Promise<void>;
  reorderItems: (items: ReorderItem[]) => Promise<void>;
}

export const useAdminWeddingPackages = (): UseAdminWeddingPackagesReturn => {
  return useAdminCrud<WeddingPackage>('/admin/wedding-packages');
};