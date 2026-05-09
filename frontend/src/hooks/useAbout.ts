import { useState, useEffect } from 'react';
import api from '../services/api';
import { type About } from '../types';

interface UseAboutReturn {
  about: About | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useAbout = (): UseAboutReturn => {
  const [about, setAbout] = useState<About | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAbout = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<About>('/content/about');
      setAbout(res.data);
    } catch (err) {
      setError('Не удалось загрузить информацию');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAbout();
  }, []);

  return { about, loading, error, refetch: fetchAbout };
};