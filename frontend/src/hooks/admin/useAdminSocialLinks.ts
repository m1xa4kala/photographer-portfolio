import { type SocialLink } from '../../types';
import { useAdminCrud } from '../useAdminCrud';
import type { ReorderItem } from '../useAdminCrud';

interface UseAdminSocialLinksReturn {
  items: SocialLink[];
  loading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  createItem: (data: Omit<SocialLink, 'id'>) => Promise<void>;
  updateItem: (id: number, data: Partial<Omit<SocialLink, 'id'>>) => Promise<void>;
  deleteItem: (id: number) => Promise<void>;
  reorderItems: (items: ReorderItem[]) => Promise<void>;
}

export const useAdminSocialLinks = (): UseAdminSocialLinksReturn => {
  return useAdminCrud<SocialLink>('/admin/social-links');
};