import React, { useState, useCallback } from 'react';
import Skeleton from './Skeleton';
import styles from './ImageWithSkeleton.module.css';

interface ImageWithSkeletonProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'onLoad' | 'onError'> {
  /** CSS-класс для контейнера (wrapper), а не для самого img */
  wrapperClassName?: string;
  /** CSS-класс для самого img (если нужен) */
  imgClassName?: string;
  /** Стиль для контейнера */
  wrapperStyle?: React.CSSProperties;
  /** Что показать вместо скелетона при ошибке загрузки */
  fallback?: React.ReactNode;
  /** Показывать скелетон, даже если изображение уже загружено (например, для тестов) */
  alwaysShowSkeleton?: boolean;
}

const ImageWithSkeleton: React.FC<ImageWithSkeletonProps> = ({
  wrapperClassName = '',
  imgClassName = '',
  wrapperStyle,
  fallback,
  alt = '',
  src,
  alwaysShowSkeleton = false,
  ...imgProps
}) => {
  const [state, setState] = useState<'loading' | 'loaded' | 'error'>('loading');

  const handleLoad = useCallback(() => {
    setState('loaded');
  }, []);

  const handleError = useCallback(() => {
    setState('error');
  }, []);

  const showSkeleton = state === 'loading' || alwaysShowSkeleton;

  return (
    <div className={`${styles.wrapper} ${wrapperClassName}`} style={wrapperStyle}>
      {/* Скелетон виден, пока изображение не загрузилось */}
      {showSkeleton && (
        <Skeleton
          variant="rect"
          width="100%"
          height="100%"
          className={styles.skeleton}
          style={{ position: 'absolute', inset: 0 }}
        />
      )}

      {/* Изображение — скрыто, пока не загрузится */}
      <img
        src={src}
        alt={alt}
        className={`${imgClassName} ${styles.img} ${state === 'loaded' ? styles.visible : ''}`}
        onLoad={handleLoad}
        onError={handleError}
        {...imgProps}
      />

      {/* Fallback при ошибке */}
      {state === 'error' && fallback && (
        <div className={styles.fallback}>{fallback}</div>
      )}
    </div>
  );
};

export default ImageWithSkeleton;