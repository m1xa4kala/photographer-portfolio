import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { type PortfolioCategory, type PortfolioPhoto } from '../types';

interface UsePortfolioReturn {
  categories: PortfolioCategory[];
  photos: PortfolioPhoto[];
  activeCategoryId: number | null;
  setActiveCategoryId: (id: number | null) => void;
  filteredPhotos: PortfolioPhoto[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const usePortfolio = (): UsePortfolioReturn => {
  const [categories, setCategories] = useState<PortfolioCategory[]>([]);
  const [photos, setPhotos] = useState<PortfolioPhoto[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [catRes, photosRes] = await Promise.all([
        api.get<PortfolioCategory[]>('/content/portfolio-categories'),
        api.get<PortfolioPhoto[]>('/content/portfolio-photos'),
      ]);
      setCategories(catRes.data);
      setPhotos(photosRes.data);
    } catch (err) {
      setError('Не удалось загрузить портфолио');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  const filteredPhotos = activeCategoryId
    ? photos.filter(photo => photo.categoryId === activeCategoryId)
    : photos;

  return {
    categories,
    photos,
    activeCategoryId,
    setActiveCategoryId,
    filteredPhotos,
    loading,
    error,
    refetch: fetchData,
  };
};