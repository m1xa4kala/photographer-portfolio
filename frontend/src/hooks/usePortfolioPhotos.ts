import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import { type PortfolioPhoto } from '../types';

interface UsePortfolioPhotosReturn {
  photos: PortfolioPhoto[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const usePortfolioPhotos = (sessionId: number | null): UsePortfolioPhotosReturn => {
  const [photos, setPhotos] = useState<PortfolioPhoto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    return () => { cancelledRef.current = true; };
  }, []);

  const fetchData = useCallback(async () => {
    cancelledRef.current = false;
    setLoading(true);
    setError(null);
    try {
      const url = sessionId !== null
        ? `/content/portfolio-photos?sessionId=${sessionId}`
        : '/content/portfolio-photos';
      const res = await api.get<PortfolioPhoto[]>(url);
      if (!cancelledRef.current) {
        setPhotos(res.data);
      }
    } catch (err) {
      if (!cancelledRef.current) {
        setError('Не удалось загрузить фотографии');
        console.error(err);
      }
    } finally {
      if (!cancelledRef.current) setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  return { photos, loading, error, refetch: fetchData };
};