import React, { useEffect, useState, useRef } from 'react';
import styles from './ImageLightbox.module.css';

interface ImageLightboxProps {
  images: string[];
  initialIndex: number;
  alt: string;
  onClose: () => void;
}

const ImageLightbox: React.FC<ImageLightboxProps> = ({ images, initialIndex, alt, onClose }) => {
  const [index, setIndex] = useState(initialIndex);
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const prevBtnRef = useRef<HTMLButtonElement>(null);
  const nextBtnRef = useRef<HTMLButtonElement>(null);

  const hasPrev = index > 0;
  const hasNext = index < images.length - 1;

  const goPrev = () => {
    if (hasPrev) setIndex(i => i - 1);
  };

  const goNext = () => {
    if (hasNext) setIndex(i => i + 1);
  };

  // Focus trap: focus the close button on mount, keep focus within the lightbox
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    // Focus the close button on mount
    closeBtnRef.current?.focus();

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
        case 'Tab': {
          // Focus trap: keep Tab within close, prev, next buttons
          const focusable: (HTMLElement | null)[] = [
            closeBtnRef.current,
            prevBtnRef.current,
            nextBtnRef.current,
          ].filter(Boolean);

          if (focusable.length === 0) {
            e.preventDefault();
            return;
          }

          const first = focusable[0]!;
          const last = focusable[focusable.length - 1]!;

          if (e.shiftKey) {
            if (document.activeElement === first) {
              e.preventDefault();
              last.focus();
            }
          } else {
            if (document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
          break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      // Restore focus to the previously focused element
      previouslyFocused?.focus();
    };
  }, [onClose, hasPrev, hasNext]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className={styles.overlay}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label="Просмотр изображения"
      ref={overlayRef}
    >
      <button
        ref={closeBtnRef}
        className={styles.closeBtn}
        onClick={onClose}
        aria-label="Закрыть"
      >
        ✕
      </button>

      {hasPrev && (
        <button
          ref={prevBtnRef}
          className={`${styles.navBtn} ${styles.navPrev}`}
          onClick={goPrev}
          aria-label="Назад"
        >
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
        <button
          ref={nextBtnRef}
          className={`${styles.navBtn} ${styles.navNext}`}
          onClick={goNext}
          aria-label="Вперёд"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default ImageLightbox;