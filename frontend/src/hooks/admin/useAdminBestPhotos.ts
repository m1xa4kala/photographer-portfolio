import { type BestPhoto } from '../../types';
import { useAdminCrud } from '../useAdminCrud';
import type { ReorderItem } from '../useAdminCrud';

interface UseAdminBestPhotosReturn {
  items: BestPhoto[];
  loading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  createItem: (data: Omit<BestPhoto, 'id'>) => Promise<void>;
  updateItem: (id: number, data: Partial<Omit<BestPhoto, 'id'>>) => Promise<void>;
  deleteItem: (id: number) => Promise<void>;
  reorderItems: (items: ReorderItem[]) => Promise<void>;
}

export const useAdminBestPhotos = (): UseAdminBestPhotosReturn => {
  return useAdminCrud<BestPhoto>('/admin/best-photos');
};