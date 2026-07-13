import { useState, useEffect, useCallback, useRef, useMemo, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { BestPhoto } from '../types';
import ImageWithSkeleton from './ImageWithSkeleton';
import styles from './HeroCarousel.module.css';

const VISIBLE_COUNT = 3;
const SLIDE_WIDTH = 100 / VISIBLE_COUNT;
const TRANSITION_DURATION = 600;
const SAFETY_FALLOUT = TRANSITION_DURATION + 100;

interface HeroCarouselProps {
  photos: BestPhoto[];
  autoPlayInterval?: number;
}

const HeroCarousel: React.FC<HeroCarouselProps> = ({
  photos,
  autoPlayInterval = 6000,
}) => {
  const total = photos.length;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isAnimating = useRef(false);
  const snapPending = useRef(false);

  // Расширенный список для бесконечного цикла:
  // [последние 3, все фото, первые 3]
  // Стартуем с индекса VISIBLE_COUNT — первого реального фото
  const extended = useMemo(() => {
    if (total === 0) return [];
    if (total <= VISIBLE_COUNT) return photos;
    return [
      ...photos.slice(-VISIBLE_COUNT),
      ...photos,
      ...photos.slice(0, VISIBLE_COUNT),
    ];
  }, [photos, total]);

  const [current, setCurrent] = useState(0);
  const currentRef = useRef(current);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  // Корректируем current после асинхронной загрузки фото:
  // если total вырос с 0 до > VISIBLE_COUNT, переключаемся на VISIBLE_COUNT.
  // НЕ включаем current в зависимости — иначе при навигации (current проходит
  // через временное значение < VISIBLE_COUNT перед снэпом) эффект сбросит
  // current обратно на VISIBLE_COUNT, и листание влево с первого элемента
  // не сработает.
  useEffect(() => {
    if (total > VISIBLE_COUNT) {
      // Отключаем transition, чтобы начальный скачок был невидимым
      snapPending.current = true;
      setTransitionEnabled(false);
      setCurrent(VISIBLE_COUNT);
    }
  }, [total]);

  // Keep ref in sync with state
  useEffect(() => {
    currentRef.current = current;
  }, [current]);

  // Снэп — отключаем transition, меняем позицию
  const snapTo = useCallback((target: number) => {
    snapPending.current = true;
    isAnimating.current = false;
    setTransitionEnabled(false);
    setCurrent(target);
  }, []);

  // После того как DOM обновился с transition: none — форсируем reflow
  // и включаем transition обратно, чтобы браузер не успел увидеть прыжок
  useLayoutEffect(() => {
    if (!transitionEnabled && snapPending.current) {
      // Форсируем reflow — браузер применяет transition: None и новую позицию
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      document.body.offsetHeight;
      snapPending.current = false;
      setTransitionEnabled(true);
    }
  }, [transitionEnabled]);

  // После завершения CSS-анимации — снэп к реальному фото
  const handleTransitionEnd = useCallback((e: React.TransitionEvent) => {
    // Игнорируем события не от transform (например, от других CSS-свойств)
    if (e.propertyName !== 'transform') return;
    // Игнорируем, если уже внутри снэпа
    if (snapPending.current) return;

    if (total <= VISIBLE_COUNT) {
      isAnimating.current = false;
      return;
    }

    const cur = currentRef.current;
    if (cur >= VISIBLE_COUNT + total) {
      snapTo(cur - total);
    } else if (cur < VISIBLE_COUNT) {
      snapTo(cur + total);
    } else {
      // Нормальный переход — просто снимаем блокировку
      isAnimating.current = false;
    }
  }, [total, snapTo]);

  const navigate = useCallback((direction: 1 | -1) => {
    if (isAnimating.current || total === 0) return;
    isAnimating.current = true;

    if (total <= VISIBLE_COUNT) {
      setCurrent(prev => (prev + direction + total) % total);
      isAnimating.current = false;
      return;
    }

    setCurrent(prev => prev + direction);

    // Safety fallback: если handleTransitionEnd не сработает
    // (неактивная вкладка, прерванный транзишн),
    // разблокируем навигацию через таймаут
    setTimeout(() => {
      isAnimating.current = false;
    }, SAFETY_FALLOUT);
  }, [total]);

  const next = useCallback(() => navigate(1), [navigate]);
  const prev = useCallback(() => navigate(-1), [navigate]);

  /* Auto-play */
  useEffect(() => {
    if (total <= 1 || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(next, autoPlayInterval);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [total, isPaused, next, autoPlayInterval]);

  /* Keyboard */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [prev, next]);

  const routerNavigate = useNavigate();

  const scrollToNext = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth',
    });
  };

  const goToPrice = () => {
    routerNavigate('/price');
  };

  if (total === 0) {
    return (
      <div className={styles.carousel}>
        <div className={styles.empty}>Фотографии пока не добавлены</div>
      </div>
    );
  }

  const displayPhotos = total <= VISIBLE_COUNT ? photos : extended;

  return (
    <div
      className={styles.carousel}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        className={styles.track}
        onTransitionEnd={handleTransitionEnd}
        style={{
          transform: `translateX(-${current * SLIDE_WIDTH}%)`,
          transition: transitionEnabled
            ? `transform ${TRANSITION_DURATION}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`
            : 'none',
        }}
      >
        {displayPhotos.map((photo, i) => (
          <div
            key={i}
            className={styles.slide}
            style={{ minWidth: `${SLIDE_WIDTH}%` }}
          >
            <ImageWithSkeleton src={photo.imageUrl} alt={photo.title} loading="eager" />
          </div>
        ))}
      </div>

      <button className={`${styles.arrow} ${styles.arrowLeft}`} onClick={prev} aria-label="Предыдущее">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <button className={`${styles.arrow} ${styles.arrowRight}`} onClick={next} aria-label="Следующее">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      <button className={styles.goToPrice} onClick={goToPrice} aria-label="Перейти к прайсу">
        <span>Прайс</span>
      </button>

      <button className={styles.scrollDown} onClick={scrollToNext} aria-label="Прокрутить ниже">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
    </div>
  );
};

export default HeroCarousel;