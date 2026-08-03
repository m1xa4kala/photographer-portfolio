import React, { useCallback } from 'react';
import type { HomeSession } from '../../types';
import ImageWithSkeleton from '../ImageWithSkeleton';
import styles from './SessionCard.module.css';

interface SessionCardProps {
  session: HomeSession;
  onClick?: () => void;
}

const SessionCard: React.FC<SessionCardProps> = ({ session, onClick }) => {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick?.();
      }
    },
    [onClick],
  );

  return (
    <div
      className={styles.sessionCard}
      onClick={onClick}
      role="link"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className={styles.sessionImage}>
        {session.coverImageUrl ? (
          <ImageWithSkeleton src={session.coverImageUrl} alt={session.name} loading="lazy" />
        ) : (
          <div className={styles.sessionPlaceholder}>
            <span>{session.name.charAt(0)}</span>
          </div>
        )}
      </div>
      <div className={styles.sessionInfo}>
        <h3>{session.name}</h3>
      </div>
    </div>
  );
};

export default SessionCard;