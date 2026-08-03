import { type Contact } from '../../types';
import { useAdminCrud } from '../useAdminCrud';
import type { ReorderItem } from '../useAdminCrud';

interface UseAdminContactsReturn {
  items: Contact[];
  loading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  createItem: (data: Omit<Contact, 'id'>) => Promise<void>;
  updateItem: (id: number, data: Partial<Omit<Contact, 'id'>>) => Promise<void>;
  deleteItem: (id: number) => Promise<void>;
  reorderItems: (items: ReorderItem[]) => Promise<void>;
}

export const useAdminContacts = (): UseAdminContactsReturn => {
  return useAdminCrud<Contact>('/admin/contacts');
};