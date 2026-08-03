import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePortfolioCategories, usePortfolioSessions, usePortfolioPhotos } from '../hooks';
import AnimatedSection from '../components/AnimatedSection';
import ImageLightbox from '../components/ImageLightbox';
import ErrorState from '../components/ErrorState/ErrorState';
import Skeleton from '../components/Skeleton';
import ImageWithSkeleton from '../components/ImageWithSkeleton';
import SessionCard from '../components/SessionCard/SessionCard';
import styles from './Portfolio.module.css';

const CategoriesSkeleton: React.FC = () => (
  <div className={styles.filters}>
    {Array.from({ length: 4 }).map((_, i) => (
      <Skeleton key={i} variant="text" width="80px" height="36px" borderRadius="2rem" />
    ))}
  </div>
);

const SessionsSkeleton: React.FC = () => (
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
);

const Portfolio: React.FC = () => {
  const { catId, sessionId } = useParams<{ catId?: string; sessionId?: string }>();
  const navigate = useNavigate();

  const { categories, loading: categoriesLoading, error: categoriesError, refetch: refetchCategories } = usePortfolioCategories();

  const categoryId = catId ? Number(catId) : null;
  const activeSessionId = sessionId ? Number(sessionId) : null;

  const validCategoryIds = useMemo(() => categories.map(c => c.id), [categories]);

  // Redirect /portfolio (no params) to first category
  useEffect(() => {
    if (!categoriesLoading && categories.length > 0 && !catId) {
      navigate(`/portfolio/category/${categories[0].id}`, { replace: true });
    }
  }, [categoriesLoading, categories, catId, navigate]);

  // Redirect invalid category ID to first category
  useEffect(() => {
    if (!categoriesLoading && categories.length > 0 && categoryId !== null && !validCategoryIds.includes(categoryId)) {
      navigate(`/portfolio/category/${categories[0].id}`, { replace: true });
    }
  }, [categoriesLoading, categories, categoryId, validCategoryIds, navigate]);

  const { sessions, loading: sessionsLoading, error: sessionsError, refetch: refetchSessions } = usePortfolioSessions(categoryId);

  const validSessionIds = useMemo(() => sessions.map(s => s.id), [sessions]);

  // Redirect invalid session ID to category
  useEffect(() => {
    if (!sessionsLoading && sessions.length > 0 && activeSessionId !== null && !validSessionIds.includes(activeSessionId)) {
      navigate(`/portfolio/category/${categoryId}`, { replace: true });
    }
  }, [sessionsLoading, sessions, activeSessionId, categoryId, validSessionIds, navigate]);

  const { photos, loading: photosLoading, error: photosError, refetch: refetchPhotos } = usePortfolioPhotos(activeSessionId);

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const lightboxImages = photos.map(p => p.imageUrl);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, path: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate(path);
    }
  }, [navigate]);

  // Show full-page skeleton only while categories load
  if (categoriesLoading) {
    return (
      <AnimatedSection>
        <div className={styles.portfolio}>
          <h1>Портфолио</h1>
          <CategoriesSkeleton />
          <SessionsSkeleton />
        </div>
      </AnimatedSection>
    );
  }

  if (categoriesError) {
    return (
      <AnimatedSection>
        <div className={styles.portfolio}>
          <h1>Портфолио</h1>
          <ErrorState message={`Ошибка: ${categoriesError}`} onRetry={refetchCategories} />
        </div>
      </AnimatedSection>
    );
  }

  const selectedCategory = categories.find(c => c.id === categoryId);
  const selectedSession = sessions.find(s => s.id === activeSessionId);

  return (
    <>
    <AnimatedSection>
      <div className={styles.portfolio}>
        <h1>Портфолио</h1>

        {/* Категории */}
        <div className={styles.filters}>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => navigate(`/portfolio/category/${cat.id}`)}
              className={categoryId === cat.id ? styles.activeFilter : ''}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Сетка сессий (если не выбрана конкретная сессия) */}
        {!activeSessionId && (
          <>
            {sessionsLoading ? (
              <SessionsSkeleton />
            ) : sessionsError ? (
              <ErrorState message={`Ошибка: ${sessionsError}`} onRetry={refetchSessions} />
            ) : (
              <div className={styles.sessionGrid}>
                {sessions.map(session => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    onClick={() => navigate(`/portfolio/category/${categoryId}/session/${session.id}`)}
                  />
                ))}
                {sessions.length === 0 && (
                  <p className={styles.empty}>В этой категории пока нет фотосессий</p>
                )}
              </div>
            )}
          </>
        )}

        {/* Галерея фото (когда выбрана сессия) */}
        {activeSessionId && (
          <>
            <div className={styles.backRow}>
              <button className={styles.backBtn} onClick={() => navigate(`/portfolio/category/${categoryId}`)}>
                ← Назад к {selectedCategory ? selectedCategory.name : 'категории'}
              </button>
              {selectedSession && <h3 className={styles.sessionTitle}>{selectedSession.name}</h3>}
            </div>
            {photosLoading ? (
              <div className={styles.gallery}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className={styles.photoItem}>
                    <Skeleton variant="rect" width="100%" height="100%" style={{ aspectRatio: '9/16', maxHeight: 350 }} />
                  </div>
                ))}
              </div>
            ) : photosError ? (
              <ErrorState message={`Ошибка: ${photosError}`} onRetry={refetchPhotos} />
            ) : (
              <div className={styles.gallery}>
                {photos.map(photo => (
                  <div key={photo.id} className={styles.photoItem}>
                    <ImageWithSkeleton
                      src={photo.imageUrl}
                      alt={selectedSession?.name || 'Фото'}
                      loading="lazy"
                      onClick={() => setLightboxIndex(photos.indexOf(photo))}
                    />
                  </div>
                ))}
                {photos.length === 0 && (
                  <p className={styles.empty}>В этой фотосессии пока нет фотографий</p>
                )}
              </div>
            )}
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