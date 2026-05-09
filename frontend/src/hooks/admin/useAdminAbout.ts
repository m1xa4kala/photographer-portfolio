import { useState, useEffect } from 'react';
import api from '../../services/api';
import { type About } from '../../types';

interface UseAdminAboutReturn {
  about: About | null;
  loading: boolean;
  error: string | null;
  fetchAbout: () => Promise<void>;
  updateAbout: (data: Partial<About>) => Promise<void>;
}

export const useAdminAbout = (): UseAdminAboutReturn => {
  const [about, setAbout] = useState<About | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAbout = async () => {
    setLoading(true);
    try {
      const res = await api.get<About>('/admin/about'); // сделайте эндпоинт GET /admin/about
      setAbout(res.data);
    } catch {
      setError('Не удалось загрузить информацию');
    } finally {
      setLoading(false);
    }
  };

  const updateAbout = async (data: Partial<About>) => {
    try {
      await api.put('/admin/about', data);
      await fetchAbout();
    } catch {
      setError('Ошибка при обновлении');
      throw new Error('Update failed');
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAbout();
  }, []);

  return { about, loading, error, fetchAbout, updateAbout };
};