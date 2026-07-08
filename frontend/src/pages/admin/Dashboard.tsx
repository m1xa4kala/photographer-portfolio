import React from 'react';
import { Link } from 'react-router-dom';
import { useDashboardStats, useAuth } from '../../hooks';
import styles from './Dashboard.module.css';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { stats, loading, error } = useDashboardStats();

  return (
    <div className={styles.dashboard}>
      <h1>Добро пожаловать, {user?.email}!</h1>
      <p className={styles.subtitle}>Здесь вы можете управлять контентом сайта.</p>

      {loading && <div className={styles.loader}>Загрузка статистики...</div>}
      {error && <div className={styles.error}>{error}</div>}
      {stats && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <h3>Лучшие фото</h3>
            <p className={styles.statNumber}>{stats.bestPhotosCount}</p>
          </div>
          <div className={styles.statCard}>
            <h3>Категории портфолио</h3>
            <p className={styles.statNumber}>{stats.portfolioCategoriesCount}</p>
          </div>
          <div className={styles.statCard}>
            <h3>Фото портфолио</h3>
            <p className={styles.statNumber}>{stats.portfolioPhotosCount}</p>
          </div>
          <div className={styles.statCard}>
            <h3>Позиции прайс-листа</h3>
            <p className={styles.statNumber}>{stats.priceItemsCount}</p>
          </div>
          <div className={styles.statCard}>
            <h3>Отзывы</h3>
            <p className={styles.statNumber}>{stats.reviewsCount}</p>
          </div>
        </div>
      )}
      <div className={styles.infoBox}>
        <h3>Быстрые действия</h3>
        <div className={styles.actions}>
          <Link to="/admin/best-photos" className={styles.actionLink}>+ Добавить лучшее фото</Link>
          <Link to="/admin/portfolio-categories" className={styles.actionLink}>+ Создать категорию</Link>
          <Link to="/admin/portfolio-photos" className={styles.actionLink}>+ Добавить фото портфолио</Link>
          <Link to="/admin/price-items" className={styles.actionLink}>+ Добавить услугу</Link>
          <Link to="/admin/reviews" className={styles.actionLink}>+ Добавить отзыв</Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;