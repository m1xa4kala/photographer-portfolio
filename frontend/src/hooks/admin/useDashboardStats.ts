import { useState, useEffect } from 'react';
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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [bestPhotos, categories, photos, priceItems, reviews] = await Promise.all([
          api.get('/admin/best-photos'),
          api.get('/admin/portfolio-categories'),
          api.get('/admin/portfolio-photos'),
          api.get('/admin/price-items'),
          api.get('/admin/reviews'),
        ]);
        setStats({
          bestPhotosCount: bestPhotos.data.length,
          portfolioCategoriesCount: categories.data.length,
          portfolioPhotosCount: photos.data.length,
          priceItemsCount: priceItems.data.length,
          reviewsCount: reviews.data.length,
        });
      } catch (err) {
        setError('Не удалось загрузить статистику');
				throw err;
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return { stats, loading, error };
};