import React from 'react';
import { usePrice } from '../hooks';
import AnimatedSection from '../components/AnimatedSection';
import Skeleton from '../components/Skeleton';
import styles from './Price.module.css';

const IMAGE_BASE = import.meta.env.PROD ? '' : 'http://localhost:3000';

const PriceSkeleton: React.FC = () => (
  <AnimatedSection>
    <section className={styles.price}>
      <Skeleton variant="text" width="250px" height="2.5rem" style={{ margin: '0 auto 2rem' }} />
      <div className={styles.grid}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={styles.card}>
            <Skeleton variant="rect" width="100%" height="220px" style={{ borderRadius: '1rem 1rem 0 0' }} />
            <div className={styles.cardBody}>
              <Skeleton variant="text" width="60%" height="1.5rem" style={{ marginBottom: '0.5rem' }} />
              <Skeleton variant="text" width="100%" height="0.85rem" />
              <Skeleton variant="text" width="80%" height="0.85rem" />
              <Skeleton variant="text" width="100px" height="1.5rem" style={{ marginTop: '1rem' }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  </AnimatedSection>
);

const Price: React.FC = () => {
  const { items, loading, error, refetch } = usePrice();

  if (loading) {
    return <PriceSkeleton />;
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
    <AnimatedSection>
      <section className={styles.price}>
        <h1>Прайс-лист</h1>
        <div className={styles.grid}>
          {items.map((item) => (
            <article key={item.id} className={styles.card}>
              <div className={styles.photoWrapper}>
                {item.imageUrl ? (
                  <img
                    src={`${IMAGE_BASE}${item.imageUrl}`}
                    alt={item.name}
                    className={styles.photo}
                    loading="lazy"
                  />
                ) : (
                  <div className={styles.photoPlaceholder} />
                )}
                <div className={styles.overlay}>
                  <h3 className={styles.overlayTitle}>{item.name}</h3>
                  <span className={styles.overlayPrice}>{item.price} ₽</span>
                </div>
              </div>

              {item.description && (
                <ul className={styles.descriptionList}>
                  {item.description.split('\n').filter(Boolean).map((line, i) => (
                    <li key={i} className={styles.descriptionItem}>
                      {line}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
        <p className={styles.note}>* Точная стоимость обсуждается индивидуально в зависимости от ваших пожеланий</p>
      </section>
    </AnimatedSection>
  );
};

export default Price;