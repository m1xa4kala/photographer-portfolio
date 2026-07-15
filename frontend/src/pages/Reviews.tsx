import React from 'react';
import { useReviews } from '../hooks';
import ReviewCard from '../components/ReviewCard';
import AnimatedSection from '../components/AnimatedSection';
import Skeleton from '../components/Skeleton';
import styles from './Reviews.module.css';

const ReviewsSkeleton: React.FC = () => (
  <AnimatedSection>
    <div className={styles.reviews}>
      <Skeleton variant="text" width="250px" height="2.5rem" style={{ margin: '0 auto 2rem' }} />
      <div className={styles.list}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={styles.skeletonCard}>
            <Skeleton variant="text" width="120px" height="1.5rem" />
            <Skeleton variant="text" width="100%" height="1rem" />
            <Skeleton variant="text" width="100%" height="1rem" />
            <Skeleton variant="text" width="40%" height="1rem" />
          </div>
        ))}
      </div>
    </div>
  </AnimatedSection>
);

const Reviews: React.FC = () => {
  const { reviews, loading, error, refetch } = useReviews();

  if (loading) return <ReviewsSkeleton />;
  if (error) return (
    <div className={styles.error}>
      <p>Ошибка: {error}</p>
      <button onClick={refetch} className={styles.retryButton}>Повторить</button>
    </div>
  );

  return (
    <AnimatedSection>
      <div className={styles.reviews}>
        <h1>Отзывы клиентов</h1>
        <div className={styles.list}>
          {reviews.map(review => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
};

export default Reviews;