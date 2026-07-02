import { type Review } from '../../types';
import { useAdminCrud } from '../useAdminCrud';

interface UseAdminReviewsReturn {
  items: Review[];
  loading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  createItem: (data: Omit<Review, 'id'>) => Promise<void>;
  updateItem: (id: number, data: Partial<Omit<Review, 'id'>>) => Promise<void>;
  deleteItem: (id: number) => Promise<void>;
}

export const useAdminReviews = (): UseAdminReviewsReturn => {
  return useAdminCrud<Review>('/admin/reviews');
};