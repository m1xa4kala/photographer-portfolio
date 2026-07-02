import { type PortfolioCategory } from '../../types';
import { useAdminCrud } from '../useAdminCrud';
import type { ReorderItem } from '../useAdminCrud';

interface UseAdminPortfolioCategoriesReturn {
  items: PortfolioCategory[];
  loading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  createItem: (data: Omit<PortfolioCategory, 'id'>) => Promise<void>;
  updateItem: (id: number, data: Partial<Omit<PortfolioCategory, 'id'>>) => Promise<void>;
  deleteItem: (id: number) => Promise<void>;
  reorderItems: (items: ReorderItem[]) => Promise<void>;
}

export const useAdminPortfolioCategories = (): UseAdminPortfolioCategoriesReturn => {
  return useAdminCrud<PortfolioCategory>('/admin/portfolio-categories');
};