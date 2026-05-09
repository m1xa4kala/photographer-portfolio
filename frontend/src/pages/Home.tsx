import React from 'react';
import { useHome } from '../hooks';
import styles from './Home.module.css';

const Home: React.FC = () => {
  const { photos, loading, error, refetch } = useHome();

  if (loading) {
    return <div className={styles.loader}>Загрузка лучших работ...</div>;
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>{error}</p>
        <button onClick={refetch}>Повторить</button>
      </div>
    );
  }

  return (
    <div className={styles.home}>
      <section className={styles.hero}>
        <h1>Anna Photo</h1>
        <p>Запечатлеваю эмоции и моменты, которые останутся с вами навсегда</p>
        <button className={styles.cta}>Связаться</button>
      </section>

      <section className={styles.bestSection}>
        <h2>Лучшие работы</h2>
        <div className={styles.grid}>
          {photos.map(photo => (
            <div key={photo.id} className={styles.photoCard}>
              <img src={photo.imageUrl} alt={photo.title} loading="lazy" />
              <div className={styles.overlay}>{photo.title}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;