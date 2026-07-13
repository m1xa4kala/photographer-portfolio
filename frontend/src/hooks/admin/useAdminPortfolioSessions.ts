import { type PortfolioSession } from '../../types';
import { useAdminCrud } from '../useAdminCrud';
import type { ReorderItem } from '../useAdminCrud';

interface UseAdminPortfolioSessionsReturn {
  items: PortfolioSession[];
  loading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  createItem: (data: Omit<PortfolioSession, 'id'>) => Promise<void>;
  updateItem: (id: number, data: Partial<Omit<PortfolioSession, 'id'>>) => Promise<void>;
  deleteItem: (id: number) => Promise<void>;
  reorderItems: (items: ReorderItem[]) => Promise<void>;
}

export const useAdminPortfolioSessions = (categoryId?: number): UseAdminPortfolioSessionsReturn => {
  const url = categoryId
    ? `/admin/portfolio-sessions?categoryId=${categoryId}`
    : '/admin/portfolio-sessions';
  return useAdminCrud<PortfolioSession>(url);
};