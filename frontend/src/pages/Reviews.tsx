import React from 'react';
import { useReviews } from '../hooks';
import ReviewCard from '../components/ReviewCard';
import AnimatedSection from '../components/AnimatedSection';
import styles from './Reviews.module.css';

const Reviews: React.FC = () => {
  const { reviews, loading, error } = useReviews();

  if (loading) return <div className={styles.loader}>Загрузка отзывов...</div>;
  if (error) return <div className={styles.error}>Ошибка: {error}</div>;

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