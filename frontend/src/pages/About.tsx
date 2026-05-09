import styles from './About.module.css';

export default function About() {
  return (
    <div className={styles.about}>
      <div className={styles.photo}>
        <img src="/images/anna-photo.jpg" alt="Влада, фотограф" />
      </div>
      <div className={styles.bio}>
        <h1>Влада Морозова</h1>
        <p>Я профессиональный фотограф с 7-летним стажем. Моя страсть – запечатлевать искренние эмоции и создавать истории.</p>
        <p>Снимаю в стиле «репортаж с душой». Люблю свет, естественность и минимальную ретушь. Работаю по всей России.</p>
        <p>Образование: Школа визуальных искусств, курсы по композиции и цветокоррекции.</p>
        <p>Оборудование: Sony A7IV, объективы GM, студийный свет Profoto.</p>
      </div>
    </div>
  );
}