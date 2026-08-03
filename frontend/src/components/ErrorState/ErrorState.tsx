import React from 'react';
import styles from './ErrorState.module.css';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry }) => {
  return (
    <div className={styles.container}>
      <p>{message}</p>
      {onRetry && (
        <button className={styles.retryButton} onClick={onRetry}>
          Повторить
        </button>
      )}
    </div>
  );
};

export default ErrorState;