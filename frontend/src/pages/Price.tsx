import styles from './Price.module.css';
import priceList from '../data/priceList';

export default function Price() {
  return (
    <div className={styles.price}>
      <h1>Прайс-лист</h1>
      <div className={styles.cards}>
        {priceList.map(service => (
          <div key={service.id} className={styles.card}>
            <h3>{service.name}</h3>
            <p>{service.description}</p>
            <span className={styles.price}>{service.price} ₽</span>
          </div>
        ))}
      </div>
      <p className={styles.note}>* Точная стоимость обсуждается индивидуально в зависимости от вашего пожелания</p>
    </div>
  );
}