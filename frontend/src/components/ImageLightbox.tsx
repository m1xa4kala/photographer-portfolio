import React, { useEffect, useState, useRef, useCallback } from 'react';
import styles from './ImageLightbox.module.css';

interface ImageLightboxProps {
  images: string[];
  initialIndex: number;
  alt: string;
  onClose: () => void;
}

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const ZOOM_STEP = 0.25;
const DOUBLE_TAP_DELAY = 300;

type Origin = { x: number; y: number };

const ImageLightbox: React.FC<ImageLightboxProps> = ({ images, initialIndex, alt, onClose }) => {
  const [index, setIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [origin, setOrigin] = useState<Origin>({ x: 50, y: 50 });
  const overlayRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const prevBtnRef = useRef<HTMLButtonElement>(null);
  const nextBtnRef = useRef<HTMLButtonElement>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const lastTouchX = useRef(0);
  const isSwiping = useRef(false);

  // Zoom dragging state
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const dragPos = useRef({ x: 0, y: 0 });
  const dragDist = useRef(0);
  /** Minimum px of mouse movement to classify as drag vs click */
  const DRAG_THRESHOLD = 8;

  // Pinch state
  const lastPinchDist = useRef(0);
  const isPinching = useRef(false);

  // Double-tap state
  const lastTapTime = useRef(0);

  const hasPrev = index > 0;
  const hasNext = index < images.length - 1;

  const isZoomed = scale > 1;

  const goPrev = () => {
    if (!hasPrev) return;
    resetZoomState();
    setIndex(i => i - 1);
  };

  const goNext = () => {
    if (!hasNext) return;
    resetZoomState();
    setIndex(i => i + 1);
  };

  const resetZoomState = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setOrigin({ x: 50, y: 50 });
  };

  /**
   * Given a cursor/touch point in viewport coordinates, compute the
   * transform-origin as a percentage of the image dimensions so that
   * scaling naturally keeps that point fixed.
   */
  const computeOrigin = useCallback((clientX: number, clientY: number): Origin => {
    const img = imageRef.current;
    if (!img) return { x: 50, y: 50 };
    const rect = img.getBoundingClientRect();
    // rect.width/height already include the current scale, but
    // we want the origin relative to the element's own (pre-transform) box.
    // Since the element's CSS width/height don't change, we can use the
    // rendered rect ratio as our origin percentage.
    const ox = ((clientX - rect.left) / rect.width) * 100;
    const oy = ((clientY - rect.top) / rect.height) * 100;
    return {
      x: Math.min(100, Math.max(0, ox)),
      y: Math.min(100, Math.max(0, oy)),
    };
  }, []);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();

    const delta = -e.deltaY;
    const factor = delta > 0 ? ZOOM_STEP : -ZOOM_STEP;
    const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale + factor));

    if (newScale === MIN_SCALE) {
      resetZoomState();
      return;
    }

    // Keep position stable: scale happens from transform-origin.
    // Translate needs to be scaled to maintain the same visual offset.
    const scaleRatio = newScale / scale;
    setPosition(prev => ({
      x: prev.x * scaleRatio,
      y: prev.y * scaleRatio,
    }));
    setScale(newScale);

    // Set the origin to the cursor point so scale pivots there
    const newOrigin = computeOrigin(e.clientX, e.clientY);
    setOrigin(newOrigin);
  }, [scale, computeOrigin]);

  // Focus trap, keyboard, and wheel handling
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
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
        case '+':
        case '=':
          e.preventDefault();
          setScale(s => Math.min(MAX_SCALE, s + ZOOM_STEP));
          break;
        case '-':
          e.preventDefault();
          setScale(s => {
            const next = Math.max(MIN_SCALE, s - ZOOM_STEP);
            if (next === MIN_SCALE) resetZoomState();
            return next;
          });
          break;
        case '0':
          e.preventDefault();
          resetZoomState();
          break;
        case 'Tab': {
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
    document.addEventListener('wheel', handleWheel, { passive: false });
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('wheel', handleWheel);
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      previouslyFocused?.focus();
    };
  }, [onClose, handleWheel]);

  // --- Mouse drag for panning when zoomed ---

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isZoomed) return;
    e.preventDefault();
    isDragging.current = true;
    dragDist.current = 0;
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    dragPos.current = { ...position };
  }, [isZoomed, position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - (dragStart.current.x + position.x);
    const dy = e.clientY - (dragStart.current.y + position.y);
    dragDist.current += Math.sqrt(dx * dx + dy * dy);
    const newPos = {
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    };
    setPosition(newPos);
  }, [position]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // --- Click / double-click on image ---

  const lastClickTime = useRef(0);

  const handleImageClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    // Was a real drag (panning) — treat as a pan-end, not a click
    if (dragDist.current > DRAG_THRESHOLD) {
      dragDist.current = 0;
      return;
    }

    const now = Date.now();
    if (now - lastClickTime.current < DOUBLE_TAP_DELAY) {
      // Double-click — toggle zoom
      if (isZoomed) {
        resetZoomState();
      } else {
        const newOrigin = computeOrigin(e.clientX, e.clientY);
        setOrigin(newOrigin);
        setScale(2.5);
        setPosition({ x: 0, y: 0 });
      }
      lastClickTime.current = 0;
    } else {
      lastClickTime.current = now;
      // Single click while zoomed → zoom out
      if (isZoomed) {
        resetZoomState();
      }
    }
  }, [isZoomed, computeOrigin]);

  // --- Touch handling (swipe + pinch + double-tap) ---

  const getTouchDist = (touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      isPinching.current = true;
      isSwiping.current = false;
      lastPinchDist.current = getTouchDist(e.touches);
      // Disable CSS transition during pinch for smooth response
      if (imageRef.current) {
        imageRef.current.style.transition = 'none';
      }
      return;
    }

    if (e.touches.length === 1) {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      lastTouchX.current = e.touches[0].clientX;
      isSwiping.current = false;
      dragPos.current = { ...position };
    }
  }, [position]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && isPinching.current) {
      e.preventDefault();
      const dist = getTouchDist(e.touches);
      const ratio = dist / lastPinchDist.current;
      lastPinchDist.current = dist;

      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

      setScale(prev => {
        const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev * ratio));
        if (next === MIN_SCALE) {
          resetZoomState();
        }
        return next;
      });
      setOrigin(computeOrigin(midX, midY));
      return;
    }

    if (e.touches.length !== 1) return;

    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = e.touches[0].clientY - touchStartY.current;

    if (isZoomed) {
      // Pan with one finger when zoomed
      e.preventDefault();
      setPosition({
        x: e.touches[0].clientX - touchStartX.current + dragPos.current.x,
        y: e.touches[0].clientY - touchStartY.current + dragPos.current.y,
      });
      isSwiping.current = false;
      return;
    }

    // Vertical movement dominates — don't interfere with close-swipe
    if (Math.abs(deltaY) > Math.abs(deltaX) * 2) return;

    isSwiping.current = true;
    lastTouchX.current = e.touches[0].clientX;
    e.preventDefault();
  }, [isZoomed, computeOrigin]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (isPinching.current) {
      // Restore CSS transition after pinch
      if (imageRef.current) {
        imageRef.current.style.transition = '';
      }
      isPinching.current = false;
      return;
    }

    // Get end position for tap/distance detection
    let endX = touchStartX.current;
    let endY = touchStartY.current;
    if (e.changedTouches.length > 0) {
      endX = e.changedTouches[0].clientX;
      endY = e.changedTouches[0].clientY;
    }

    const deltaX = endX - touchStartX.current;
    const deltaY = endY - touchStartY.current;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const isShortTap = distance < DRAG_THRESHOLD;

    if (isZoomed) {
      if (isShortTap) {
        // Tap while zoomed → reset zoom
        resetZoomState();
        return;
      }
      // Swipe down while zoomed → close
      if (deltaY > 80) {
        onClose();
        return;
      }
      // Pan while zoomed
      dragPos.current = { ...position };
      return;
    }

    if (!isShortTap) {
      // Swipe to navigate
      if (deltaX < -50 && hasNext) {
        goNext();
      } else if (deltaX > 50 && hasPrev) {
        goPrev();
      }
      return;
    }

    // Double-tap detection
    const now = Date.now();
    if (now - lastTapTime.current < DOUBLE_TAP_DELAY) {
      toggleZoomAtPoint(endX, endY);
      lastTapTime.current = 0;
      return;
    }
    lastTapTime.current = now;
  }, [isZoomed, computeOrigin, position, hasNext, hasPrev, onClose]);

  const toggleZoomAtPoint = (clientX: number, clientY: number) => {
    if (isZoomed) {
      resetZoomState();
    } else {
      const newOrigin = computeOrigin(clientX, clientY);
      setOrigin(newOrigin);
      setScale(2.5);
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const zoomIndicator = isZoomed ? `×${scale.toFixed(1)}` : null;

  return (
    <div
      className={styles.overlay}
      onClick={handleOverlayClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
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

      <div
        className={`${styles.imageWrapper} ${isZoomed ? styles.zoomed : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          ref={imageRef}
          className={styles.image}
          src={images[index]}
          alt={alt}
          onClick={handleImageClick}
          draggable={false}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: `${origin.x}% ${origin.y}%`,
            cursor: isZoomed ? 'grab' : 'zoom-in',
          }}
        />
      </div>

      {zoomIndicator && (
        <span className={styles.zoomIndicator} aria-live="polite">
          {zoomIndicator}
        </span>
      )}

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