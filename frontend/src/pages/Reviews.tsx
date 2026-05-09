import styles from './Reviews.module.css';
import reviews from '../data/reviews';
import ReviewCard from '../components/ReviewCard';

export default function Reviews() {
  return (
    <div className={styles.reviews}>
      <h1>Отзывы клиентов</h1>
      <div className={styles.list}>
        {reviews.map(review => (
          <ReviewCard key={review.id} name={review.name} text={review.text} rating={review.rating} />
        ))}
      </div>
    </div>
  );
}