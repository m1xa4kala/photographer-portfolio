import React from 'react';
import { usePrice } from '../hooks';
import AnimatedSection from '../components/AnimatedSection';
import PriceCard from '../components/PriceCard/PriceCard';
import ErrorState from '../components/ErrorState/ErrorState';
import Skeleton from '../components/Skeleton';
import styles from './Price.module.css';

const PriceSkeleton: React.FC = () => (
  <AnimatedSection>
    <section className={styles.price}>
      <Skeleton variant="text" width="250px" height="2.5rem" style={{ margin: '0 auto 2rem' }} />
      <div className={styles.grid}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={styles.skeletonCard}>
            <Skeleton variant="rect" width="100%" height="320px" style={{ borderRadius: '1rem 1rem 0 0' }} />
            <div className={styles.skeletonBody}>
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
    return <ErrorState message={error} onRetry={refetch} />;
  }

  return (
    <AnimatedSection>
      <section className={styles.price}>
        <h1>Прайс-лист</h1>
        <div className={styles.grid}>
          {items.map((item) => (
            <PriceCard key={item.id} item={item} />
          ))}
        </div>
        <p className={styles.note}>* Точная стоимость обсуждается индивидуально в зависимости от ваших пожеланий</p>
      </section>
    </AnimatedSection>
  );
};

export default Price;