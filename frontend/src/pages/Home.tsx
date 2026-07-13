import React from 'react';
import { Link } from 'react-router-dom';
import { useHome, useAbout, usePortfolio, useReviews, usePrice } from '../hooks';
import HeroCarousel from '../components/HeroCarousel';
import ReviewCard from '../components/ReviewCard';
import AnimatedSection from '../components/AnimatedSection';
import ImageWithSkeleton from '../components/ImageWithSkeleton';
import Skeleton from '../components/Skeleton';
import styles from './Home.module.css';
import aboutStyles from './About.module.css';
import portfolioStyles from './Portfolio.module.css';
import priceStyles from './Price.module.css';
import reviewsStyles from './Reviews.module.css';

const HomeSkeleton: React.FC = () => (
  <div className={styles.home}>
    <section className={styles.section}>
      <Skeleton variant="circle" width="100%" height="auto" style={{ aspectRatio: '1', maxWidth: 300 }} />
      <div>
        <Skeleton variant="text" width="60%" height="2rem" />
        <Skeleton variant="text" width="100%" height="1rem" />
        <Skeleton variant="text" width="100%" height="1rem" />
        <Skeleton variant="text" width="80%" height="1rem" />
      </div>
    </section>
  </div>
);

const Home: React.FC = () => {
  const { photos, loading, error, refetch } = useHome();
  const { about, loading: aboutLoading } = useAbout();
  const {
    filteredSessions: sessions,
    photos: allPhotos,
    loading: portfolioLoading,
  } = usePortfolio();
  const { reviews, loading: reviewsLoading } = useReviews();
  const { items: priceItems, loading: priceLoading } = usePrice();

  const getSessionCover = (sessionId: number) => {
    const firstPhoto = allPhotos
      .filter(p => p.sessionId === sessionId)
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))[0];
    return firstPhoto?.imageUrl || null;
  };

  if (loading && aboutLoading) {
    return <HomeSkeleton />;
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>{error}</p>
        <button onClick={refetch}>Повторить</button>
      </div>
    );
  }

  return (
    <>
      <HeroCarousel photos={photos} />

      <div className={styles.home}>
        {/* ===== Обо мне ===== */}
        <AnimatedSection delay={0.2} className={styles.section}>
          {about && (
            <>
              <h2 className={styles.sectionTitle}>Обо мне</h2>
              <div className={aboutStyles.about}>
                <div className={aboutStyles.photo}>
                  <ImageWithSkeleton
                    src={about.photoUrl || '/images/default-avatar.svg'}
                    alt={about.fullName}
                    loading="lazy"
                  />
                </div>
                <div className={aboutStyles.bio}>
                  <h1>{about.fullName}</h1>
                  <p>{about.bioText}</p>
                </div>
              </div>
            </>
          )}
        </AnimatedSection>

        {/* ===== Портфолио ===== */}
        <AnimatedSection delay={0.3} className={styles.section}>
          <h2 className={styles.sectionTitle}>Портфолио</h2>
          {portfolioLoading ? (
            <div className={portfolioStyles.sessionGrid}>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className={portfolioStyles.sessionCard}>
                  <Skeleton variant="rect" width="100%" height="220px" />
                  <div style={{ padding: '1rem' }}>
                    <Skeleton variant="text" width="60%" height="1.2rem" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={portfolioStyles.sessionGrid}>
              {sessions.slice(0, 6).map(session => {
                const coverUrl = getSessionCover(session.id);
                return (
                  <Link
                    key={session.id}
                    to="/portfolio"
                    className={portfolioStyles.sessionCard}
                  >
                    <div className={portfolioStyles.sessionImage}>
                      {coverUrl ? (
                        <ImageWithSkeleton src={coverUrl} alt={session.name} loading="lazy" />
                      ) : (
                        <div className={portfolioStyles.sessionPlaceholder}>
                          <span>{session.name.charAt(0)}</span>
                        </div>
                      )}
                    </div>
                    <div className={portfolioStyles.sessionInfo}>
                      <h3>{session.name}</h3>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
          <div className={styles.viewAll}>
            <Link to="/portfolio" className={styles.viewAllLink}>Смотреть все фотосессии →</Link>
          </div>
        </AnimatedSection>

        {/* ===== Отзывы ===== */}
        <AnimatedSection delay={0.4} className={styles.section}>
          <h2 className={styles.sectionTitle}>Отзывы клиентов</h2>
          {reviewsLoading ? (
            <div className={reviewsStyles.list}>
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className={reviewsStyles.skeletonCard}>
                  <Skeleton variant="text" width="120px" height="1.5rem" />
                  <Skeleton variant="text" width="100%" height="1rem" />
                  <Skeleton variant="text" width="100%" height="1rem" />
                  <Skeleton variant="text" width="40%" height="1rem" />
                </div>
              ))}
            </div>
          ) : (
            <div className={reviewsStyles.list}>
              {reviews.slice(0, 3).map(review => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          )}
          <div className={styles.viewAll}>
            <Link to="/reviews" className={styles.viewAllLink}>Все отзывы →</Link>
          </div>
        </AnimatedSection>

        {/* ===== Прайс-лист ===== */}
        <AnimatedSection delay={0.5} className={styles.section}>
          <h2 className={styles.sectionTitle}>Прайс-лист</h2>
          {priceLoading ? (
            <div className={priceStyles.cards}>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className={priceStyles.card}>
                  <Skeleton variant="text" width="60%" height="1.5rem" style={{ margin: '0 auto 0.5rem' }} />
                  <Skeleton variant="text" width="100%" height="1rem" />
                  <Skeleton variant="text" width="80%" height="1rem" style={{ margin: '0 auto 1rem' }} />
                  <Skeleton variant="text" width="100px" height="1.8rem" style={{ margin: '0 auto' }} />
                </div>
              ))}
            </div>
          ) : (
            <div className={priceStyles.cards}>
              {priceItems.map(item => (
                <div key={item.id} className={priceStyles.card}>
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                  <span className={priceStyles.priceValue}>{item.price} ₽</span>
                </div>
              ))}
            </div>
          )}
          <div className={styles.viewAll}>
            <Link to="/price" className={styles.viewAllLink}>Полный прайс-лист →</Link>
          </div>
        </AnimatedSection>
      </div>
    </>
  );
};

export default Home;