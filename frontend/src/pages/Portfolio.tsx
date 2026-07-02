import React from 'react';
import { usePortfolio } from '../hooks';
import AnimatedSection from '../components/AnimatedSection';
import styles from './Portfolio.module.css';

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

  if (loading) return <div className={styles.loader}>Загрузка портфолио...</div>;
  if (error) return <div className={styles.error}>Ошибка: {error} <button onClick={refetch}>Повторить</button></div>;

  const selectedCategory = categories.find(c => c.id === activeCategoryId);
  const selectedSession = filteredSessions.find(s => s.id === activeSessionId);

  // Берём первое по порядку фото как обложку для сессии
  const getSessionCover = (sessionId: number) => {
    const firstPhoto = photos
      .filter(p => p.sessionId === sessionId)
      .sort((a, b) => a.orderIndex - b.orderIndex)[0];
    return firstPhoto?.imageUrl || null;
  };

  return (
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
                      <img src={coverUrl} alt={session.name} />
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
              {selectedSession && <span className={styles.sessionTitle}>{selectedSession.name}</span>}
            </div>
            <div className={styles.gallery}>
              {filteredPhotos.map(photo => (
                <div key={photo.id} className={styles.photoItem}>
                  <img src={photo.imageUrl} alt={photo.title} />
                  {photo.title && <div className={styles.caption}>{photo.title}</div>}
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
  );
};

export default Portfolio;