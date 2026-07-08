import React from 'react';
import { usePrice } from '../hooks';
import AnimatedSection from '../components/AnimatedSection';
import Skeleton from '../components/Skeleton';
import styles from './Price.module.css';

const PriceSkeleton: React.FC = () => (
  <AnimatedSection>
    <div className={styles.price}>
      <Skeleton variant="text" width="250px" height="2.5rem" style={{ margin: '0 auto 2rem' }} />
      <div className={styles.cards}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={styles.card}>
            <Skeleton variant="text" width="60%" height="1.5rem" style={{ margin: '0 auto 0.5rem' }} />
            <Skeleton variant="text" width="100%" height="1rem" />
            <Skeleton variant="text" width="80%" height="1rem" style={{ margin: '0 auto 1rem' }} />
            <Skeleton variant="text" width="100px" height="1.8rem" style={{ margin: '0 auto' }} />
          </div>
        ))}
      </div>
    </div>
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
      <div className={styles.price}>
        <h1>Прайс-лист</h1>
        <div className={styles.cards}>
          {items.map((item) => (
            <div key={item.id} className={styles.card}>
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              <span className={styles.price}>{item.price} ₽</span>
            </div>
          ))}
        </div>
        <p className={styles.note}>* Точная стоимость обсуждается индивидуально в зависимости от ваших пожеланий</p>
      </div>
    </AnimatedSection>
  );
};

export default Price;