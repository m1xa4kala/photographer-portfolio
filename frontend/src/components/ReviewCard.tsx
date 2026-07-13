import React from 'react';
import { type Review } from '../types';
import ImageWithSkeleton from './ImageWithSkeleton';
import styles from './ReviewCard.module.css';

interface ReviewCardProps {
  review: Review;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  const { clientName, text, clientPhotoUrl } = review;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.avatar}>
          {clientPhotoUrl ? (
            <ImageWithSkeleton src={clientPhotoUrl} alt={clientName} />
          ) : (
            <span className={styles.avatarFallback}>
              {clientName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <h4 className={styles.clientName}>{clientName}</h4>
      </div>
      <p>«{text}»</p>
    </div>
  );
};

export default ReviewCard;