import React from 'react';
import { usePortfolio } from '../hooks';
import styles from './Portfolio.module.css';

const Portfolio: React.FC = () => {
  const { categories, activeCategoryId, setActiveCategoryId, filteredPhotos, loading, error, refetch } = usePortfolio();

  if (loading) return <div>Загрузка портфолио...</div>;
  if (error) return <div>Ошибка: {error} <button onClick={refetch}>Повторить</button></div>;

  return (
    <div className={styles.portfolio}>
      <h1>Портфолио</h1>
      <div className={styles.filters}>
        <button onClick={() => setActiveCategoryId(null)} className={!activeCategoryId ? styles.activeFilter : ''}>
          Все
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategoryId(cat.id)}
            className={activeCategoryId === cat.id ? styles.activeFilter : ''}
          >
            {cat.name}
          </button>
        ))}
      </div>
      <div className={styles.gallery}>
        {filteredPhotos.map(photo => (
          <div key={photo.id} className={styles.photoItem}>
            <img src={photo.imageUrl} alt={photo.title} />
            <div className={styles.caption}>{photo.title}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Portfolio;