import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';

interface DashboardStats {
  bestPhotosCount: number;
  portfolioCategoriesCount: number;
  portfolioPhotosCount: number;
  priceItemsCount: number;
  reviewsCount: number;
}

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const fetchStats = async () => {
      cancelledRef.current = false;
      try {
        const results = await Promise.allSettled([
          api.get('/admin/best-photos'),
          api.get('/admin/portfolio-categories'),
          api.get('/admin/portfolio-photos'),
          api.get('/admin/price-items'),
          api.get('/admin/reviews'),
        ]);

        if (cancelled) return;

        const counts = results.map(r => (r.status === 'fulfilled' ? r.value.data.length : 0));
        const hasError = results.some(r => r.status === 'rejected');

        setStats({
          bestPhotosCount: counts[0],
          portfolioCategoriesCount: counts[1],
          portfolioPhotosCount: counts[2],
          priceItemsCount: counts[3],
          reviewsCount: counts[4],
        });
        if (hasError) {
          setError('Некоторые данные не удалось загрузить');
        }
      } catch (err) {
        if (!cancelled) {
          setError('Не удалось загрузить статистику');
        }
        console.error('Dashboard stats error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchStats();

    return () => {
      cancelled = true;
      cancelledRef.current = true;
    };
  }, []);

  return { stats, loading, error };
};