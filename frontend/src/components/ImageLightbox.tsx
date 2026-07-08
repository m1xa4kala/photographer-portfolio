import React, { useEffect, useState } from 'react';
import styles from './ImageLightbox.module.css';

interface ImageLightboxProps {
  images: string[];
  initialIndex: number;
  alt: string;
  onClose: () => void;
}

const ImageLightbox: React.FC<ImageLightboxProps> = ({ images, initialIndex, alt, onClose }) => {
  const [index, setIndex] = useState(initialIndex);

  const hasPrev = index > 0;
  const hasNext = index < images.length - 1;

  const goPrev = () => {
    if (hasPrev) setIndex(i => i - 1);
  };

  const goNext = () => {
    if (hasNext) setIndex(i => i + 1);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          goPrev();
          break;
        case 'ArrowRight':
          goNext();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose, hasPrev, hasNext]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <button
        className={styles.closeBtn}
        onClick={onClose}
        aria-label="Закрыть"
      >
        ✕
      </button>

      {hasPrev && (
        <button className={`${styles.navBtn} ${styles.navPrev}`} onClick={goPrev} aria-label="Назад">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      )}

      <img
        className={styles.image}
        src={images[index]}
        alt={alt}
        onClick={e => e.stopPropagation()}
      />

      {hasNext && (
        <button className={`${styles.navBtn} ${styles.navNext}`} onClick={goNext} aria-label="Вперёд">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default ImageLightbox;