import { useState, useEffect } from 'react';
import api from '../services/api';
import { type BestPhoto } from '../types';

interface UseHomeReturn {
  photos: BestPhoto[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useHome = (): UseHomeReturn => {
  const [photos, setPhotos] = useState<BestPhoto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPhotos = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<BestPhoto[]>('/content/best-photos');
      setPhotos(res.data);
    } catch (err) {
      setError('Не удалось загрузить фотографии');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPhotos();
  }, []);

  return { photos, loading, error, refetch: fetchPhotos };
};