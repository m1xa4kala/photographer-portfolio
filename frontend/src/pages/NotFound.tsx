import React from 'react';
import { Link } from 'react-router-dom';
import styles from './NotFound.module.css';

const NotFound: React.FC = () => {
  return (
    <div className={styles.notFound}>
      <div className={styles.code}>404</div>
      <h1 className={styles.title}>Страница не найдена</h1>
      <p className={styles.description}>
        Возможно, страница была удалена или вы перешли по неверной ссылке.
      </p>
      <Link to="/" className={styles.homeLink}>
        ← Вернуться на главную
      </Link>
    </div>
  );
};

export default NotFound;