import React, { useState } from 'react';
import { usePortfolio } from '../hooks';
import AnimatedSection from '../components/AnimatedSection';
import ImageLightbox from '../components/ImageLightbox';
import Skeleton from '../components/Skeleton';
import styles from './Portfolio.module.css';

const PortfolioSkeleton: React.FC = () => (
  <AnimatedSection>
    <div className={styles.portfolio}>
      <Skeleton variant="text" width="250px" height="2.5rem" style={{ margin: '0 auto 2rem' }} />
      <div className={styles.filters}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} variant="text" width="80px" height="36px" borderRadius="2rem" />
        ))}
      </div>
      <div className={styles.sessionGrid}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={styles.sessionCard}>
            <Skeleton variant="rect" width="100%" height="220px" />
            <div style={{ padding: '1rem' }}>
              <Skeleton variant="text" width="60%" height="1.2rem" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </AnimatedSection>
);

const Portfolio: React.FC = () => {
  const {
    categories,
    activeCategoryId,
    setActiveCategoryId,
    activeSessionId,
    setActiveSessionId,
    filteredSessions,
    filteredPhotos,
    photos,
    loading,
    error,
    refetch,
  } = usePortfolio();

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const lightboxImages = activeSessionId ? filteredPhotos.map(p => p.imageUrl) : [];

  if (loading) return <PortfolioSkeleton />;
  if (error) return <div className={styles.error}>Ошибка: {error} <button onClick={refetch}>Повторить</button></div>;

  const selectedCategory = categories.find(c => c.id === activeCategoryId);
  const selectedSession = filteredSessions.find(s => s.id === activeSessionId);

  // Берём первое по порядку фото как обложку для сессии
  const getSessionCover = (sessionId: number) => {
    const firstPhoto = photos
      .filter(p => p.sessionId === sessionId)
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))[0];
    return firstPhoto?.imageUrl || null;
  };

  return (
    <>
    <AnimatedSection>
      <div className={styles.portfolio}>
        <h1>Портфолио</h1>

        {/* Шаг 1: Категории */}
        <div className={styles.filters}>
          <button onClick={() => setActiveCategoryId(null)} className={!activeCategoryId ? styles.activeFilter : ''}>
            Все
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategoryId(cat.id)}
              className={activeCategoryId === cat.id ? styles.activeFilter : ''}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Шаг 2: Сетка сессий (если не выбрана конкретная сессия) */}
        {!activeSessionId && (
          <div className={styles.sessionGrid}>
            {filteredSessions.map(session => {
              const coverUrl = getSessionCover(session.id);
              return (
                <div
                  key={session.id}
                  className={styles.sessionCard}
                  onClick={() => setActiveSessionId(session.id)}
                >
                  <div className={styles.sessionImage}>
                    {coverUrl ? (
                      <img src={coverUrl} alt={session.name} loading="lazy" />
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
            })}
            {filteredSessions.length === 0 && (
              <p className={styles.empty}>В этой категории пока нет фотосессий</p>
            )}
          </div>
        )}

        {/* Шаг 3: Галерея фото (когда выбрана сессия) */}
        {activeSessionId && (
          <>
            <div className={styles.backRow}>
              <button className={styles.backBtn} onClick={() => setActiveSessionId(null)}>
                ← Назад к {selectedCategory ? selectedCategory.name : 'всем сессиям'}
              </button>
              {selectedSession && <h3 className={styles.sessionTitle}>{selectedSession.name}</h3>}
            </div>
            <div className={styles.gallery}>
              {filteredPhotos.map(photo => (
                <div key={photo.id} className={styles.photoItem}>
                  <img
                    src={photo.imageUrl}
                    alt={selectedSession?.name || 'Фото'}
                    loading="lazy"
                    onClick={() => setLightboxIndex(filteredPhotos.indexOf(photo))}
                  />
                </div>
              ))}
              {filteredPhotos.length === 0 && (
                <p className={styles.empty}>В этой фотосессии пока нет фотографий</p>
              )}
            </div>
          </>
        )}
      </div>
    </AnimatedSection>
    {lightboxIndex !== null && (
      <ImageLightbox
        images={lightboxImages}
        initialIndex={lightboxIndex}
        alt={selectedSession?.name || 'Фото'}
        onClose={() => setLightboxIndex(null)}
      />
    )}
    </>
  );
};

export default Portfolio;