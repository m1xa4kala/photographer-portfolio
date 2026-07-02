import React from 'react';
import { useHome } from '../hooks';
import HeroCarousel from '../components/HeroCarousel';
import AnimatedSection from '../components/AnimatedSection';
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
    <>
      <HeroCarousel photos={photos} />

      <div className={styles.home}>
        <AnimatedSection delay={0.2}>
          <section className={styles.bestSection}>
            <h2>Лучшие работы</h2>
            <div className={styles.grid}>
              {photos.map(photo => (
                <div key={photo.id} className={styles.photoCard}>
                  <img src={photo.imageUrl} alt={photo.title} loading="lazy" />
                </div>
              ))}
            </div>
          </section>
        </AnimatedSection>
      </div>
    </>
  );
};

export default Home;