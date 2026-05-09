import { useState } from 'react';
import styles from './Portfolio.module.css';
import portfolioPhotos from '../data/portfolioPhotos';

// получить список уникальных категорий
const allCategories = ['Все', ...new Set(portfolioPhotos.map(p => p.category))];

export default function Portfolio() {
  const [activeCat, setActiveCat] = useState('Все');
  const filtered = activeCat === 'Все' 
    ? portfolioPhotos 
    : portfolioPhotos.filter(p => p.category === activeCat);

  return (
    <div className={styles.portfolio}>
      <h1>Портфолио</h1>
      <div className={styles.filters}>
        {allCategories.map(cat => (
          <button 
            key={cat}
            className={activeCat === cat ? styles.activeFilter : ''}
            onClick={() => setActiveCat(cat)}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className={styles.gallery}>
        {filtered.map(photo => (
          <div key={photo.id} className={styles.photoItem}>
            <img src={photo.src} alt={photo.title} />
            <div className={styles.caption}>{photo.title}</div>
          </div>
        ))}
      </div>
    </div>
  );
}