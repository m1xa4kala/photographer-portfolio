import React from 'react';
import type { PriceItem } from '../../types';
import styles from './PriceCard.module.css';

interface PriceCardProps {
  item: PriceItem;
}

const PriceCard: React.FC<PriceCardProps> = ({ item }) => (
  <article className={styles.card}>
    <div className={styles.photoWrapper}>
      {item.imageUrl ? (
        <img
          src={item.imageUrl}
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
);

export default PriceCard;