import React from 'react';
import { usePrice } from '../hooks';
import styles from './Price.module.css';

const Price: React.FC = () => {
  const { items, loading, error, refetch } = usePrice();

  if (loading) {
    return <div className={styles.loader}>Загрузка прайс-листа...</div>;
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
  );
};

export default Price;