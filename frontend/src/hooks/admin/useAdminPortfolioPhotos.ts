import { type PortfolioPhoto } from '../../types';
import { useAdminCrud } from '../useAdminCrud';
import type { ReorderItem } from '../useAdminCrud';

interface UseAdminPortfolioPhotosReturn {
  items: PortfolioPhoto[];
  loading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  createItem: (data: Omit<PortfolioPhoto, 'id'>) => Promise<void>;
  updateItem: (id: number, data: Partial<Omit<PortfolioPhoto, 'id'>>) => Promise<void>;
  deleteItem: (id: number) => Promise<void>;
  reorderItems: (items: ReorderItem[]) => Promise<void>;
}

export const useAdminPortfolioPhotos = (sessionId?: number): UseAdminPortfolioPhotosReturn => {
  const queryParams = sessionId ? { sessionId: String(sessionId) } : undefined;
  return useAdminCrud<PortfolioPhoto>('/admin/portfolio-photos', queryParams);
};