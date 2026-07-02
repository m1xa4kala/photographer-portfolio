import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { type PortfolioCategory, type PortfolioSession, type PortfolioPhoto } from '../types';

interface UsePortfolioReturn {
  categories: PortfolioCategory[];
  sessions: PortfolioSession[];
  photos: PortfolioPhoto[];
  activeCategoryId: number | null;
  setActiveCategoryId: (id: number | null) => void;
  activeSessionId: number | null;
  setActiveSessionId: (id: number | null) => void;
  filteredSessions: PortfolioSession[];
  filteredPhotos: PortfolioPhoto[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const usePortfolio = (): UsePortfolioReturn => {
  const [categories, setCategories] = useState<PortfolioCategory[]>([]);
  const [sessions, setSessions] = useState<PortfolioSession[]>([]);
  const [photos, setPhotos] = useState<PortfolioPhoto[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [catRes, sesRes, photoRes] = await Promise.all([
        api.get<PortfolioCategory[]>('/content/portfolio-categories'),
        api.get<PortfolioSession[]>('/content/portfolio-sessions'),
        api.get<PortfolioPhoto[]>('/content/portfolio-photos'),
      ]);
      setCategories(catRes.data);
      setSessions(sesRes.data);
      setPhotos(photoRes.data);
    } catch (err) {
      setError('Не удалось загрузить портфолио');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const [catRes, sesRes, photoRes] = await Promise.all([
          api.get<PortfolioCategory[]>('/content/portfolio-categories'),
          api.get<PortfolioSession[]>('/content/portfolio-sessions'),
          api.get<PortfolioPhoto[]>('/content/portfolio-photos'),
        ]);
        if (!cancelled) {
          setCategories(catRes.data);
          setSessions(sesRes.data);
          setPhotos(photoRes.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError('Не удалось загрузить портфолио');
        }
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetch();

    return () => {
      cancelled = true;
    };
  }, []);

  // При смене категории сбрасываем выбранную сессию
  const handleSetCategory = useCallback((id: number | null) => {
    setActiveCategoryId(id);
    setActiveSessionId(null);
  }, []);

  const filteredSessions = activeCategoryId
    ? sessions.filter(s => s.categoryId === activeCategoryId)
    : sessions;

  const filteredPhotos = activeSessionId
    ? photos.filter(p => p.sessionId === activeSessionId)
    : [];

  return {
    categories,
    sessions,
    photos,
    activeCategoryId,
    setActiveCategoryId: handleSetCategory,
    activeSessionId,
    setActiveSessionId,
    filteredSessions,
    filteredPhotos,
    loading,
    error,
    refetch,
  };
};