import React from 'react';
import type { WeddingPackage } from '../../types';
import styles from './WeddingCard.module.css';

interface WeddingCardProps {
  item: WeddingPackage;
}

const WeddingCard: React.FC<WeddingCardProps> = ({ item }) => (
  <article className={styles.card}>
    <div className={styles.photoWrapper}>
      {item.imageUrl ? (
        <img src={item.imageUrl} alt={item.name} className={styles.photo} loading="lazy" />
      ) : (
        <div className={styles.photoPlaceholder} />
      )}
      <div className={styles.overlay}>
        <h3 className={styles.overlayTitle}>{item.name}</h3>
      </div>
    </div>

    <div className={styles.body}>
      <div className={styles.duration}>
        <span className={styles.durationIcon}>⏱</span>
        <span>{item.duration}</span>
      </div>

      {item.includes && (
        <ul className={styles.includesList}>
          {item.includes.split('\n').filter(Boolean).map((line, i) => (
            <li key={i} className={styles.includesItem}>{line}</li>
          ))}
        </ul>
      )}

      <div className={styles.pricesSection}>
        {item.prices.map((opt, i) => (
          <div key={i} className={styles.priceOption}>
            <span className={styles.priceLabel}>{opt.label}</span>
            <span className={styles.priceAmount}>{opt.amount} ₽</span>
          </div>
        ))}
      </div>
    </div>
  </article>
);

export default WeddingCard;