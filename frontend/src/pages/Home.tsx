import styles from './Home.module.css';
import bestPhotos from '../data/bestPhotos';

export default function Home() {
  return (
    <div className={styles.home}>
      <section className={styles.hero}>
        <h1>Vlada Photo</h1>
        <p>Запечатлеваю эмоции и моменты, которые останутся с вами навсегда</p>
        <button className={styles.cta}>Связаться</button>
      </section>
      
      <section className={styles.bestSection}>
        <h2>Лучшие работы</h2>
        <div className={styles.grid}>
          {bestPhotos.map(photo => (
            <div key={photo.id} className={styles.photoCard}>
              <img src={photo.src} alt={photo.title} loading="lazy" />
              <div className={styles.overlay}>{photo.title}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}