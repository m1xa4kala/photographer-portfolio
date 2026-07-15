import { type SocialLink } from '../types';
import { useFetch } from './useFetch';

interface UseSocialLinksResult {
  socialLinks: SocialLink[];
  loading: boolean;
  error: string | null;
}

export const useSocialLinks = (): UseSocialLinksResult => {
  const { data, loading, error } = useFetch<SocialLink[]>('/content/social-links');
  return { socialLinks: data ?? [], loading, error };
};