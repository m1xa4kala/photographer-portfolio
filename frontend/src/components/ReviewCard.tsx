import React from 'react';
import { type Review } from '../types';
import styles from './ReviewCard.module.css';

interface ReviewCardProps {
  review: Review;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  const { clientName, text, rating } = review;

  const renderStars = () => {
    const fullStars = '★'.repeat(rating);
    const emptyStars = '☆'.repeat(5 - rating);
    return `${fullStars}${emptyStars}`;
  };

  return (
    <div className={styles.card}>
      <div className={styles.stars}>{renderStars()}</div>
      <p>«{text}»</p>
      <h4>— {clientName}</h4>
    </div>
  );
};

export default ReviewCard;