import { type Contact } from '../types';
import { useFetch } from './useFetch';

interface UseContactsResult {
  contacts: Contact[];
  loading: boolean;
  error: string | null;
}

export const useContacts = (): UseContactsResult => {
  const { data, loading, error } = useFetch<Contact[]>('/content/contacts');
  return { contacts: data ?? [], loading, error };
};