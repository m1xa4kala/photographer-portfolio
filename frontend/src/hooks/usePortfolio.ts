import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  coverImageMap: Record<number, PortfolioPhoto | undefined>;
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
  const cancelledRef = useRef(false);

  useEffect(() => {
    return () => { cancelledRef.current = true; };
  }, []);

  const fetchData = useCallback(async () => {
    cancelledRef.current = false;
    setLoading(true);
    setError(null);
    try {
      const [catRes, sessionsRes, photosRes] = await Promise.all([
        api.get<PortfolioCategory[]>('/content/portfolio-categories'),
        api.get<PortfolioSession[]>('/content/portfolio-sessions'),
        api.get<PortfolioPhoto[]>('/content/portfolio-photos'),
      ]);
      if (!cancelledRef.current) {
        setCategories(catRes.data);
        setSessions(sessionsRes.data);
        setPhotos(photosRes.data);
      }
    } catch (err) {
      if (!cancelledRef.current) {
        setError('Не удалось загрузить портфолио');
        console.error(err);
      }
    } finally {
      if (!cancelledRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  const filteredSessions = useMemo(
    () =>
      activeCategoryId
        ? sessions.filter(session => session.categoryId === activeCategoryId)
        : sessions,
    [activeCategoryId, sessions],
  );

  const filteredPhotos = useMemo(() => {
    if (activeSessionId) {
      return photos.filter(photo => photo.sessionId === activeSessionId);
    }
    if (activeCategoryId) {
      const sessionIds = sessions
        .filter(s => s.categoryId === activeCategoryId)
        .map(s => s.id);
      return photos.filter(photo => sessionIds.includes(photo.sessionId));
    }
    return photos;
  }, [activeSessionId, activeCategoryId, sessions, photos]);

  const coverImageMap = useMemo(() => {
    const map: Record<number, PortfolioPhoto | undefined> = {};
    for (const session of sessions) {
      map[session.id] = photos.find(photo => photo.sessionId === session.id);
    }
    return map;
  }, [sessions, photos]);

  return {
    categories,
    sessions,
    photos,
    activeCategoryId,
    setActiveCategoryId,
    activeSessionId,
    setActiveSessionId,
    filteredSessions,
    filteredPhotos,
    coverImageMap,
    loading,
    error,
    refetch: fetchData,
  };
};