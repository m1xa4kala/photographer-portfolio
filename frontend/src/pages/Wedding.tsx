// frontend/src/pages/Wedding.tsx
import React, { useState, useCallback } from 'react';
import { useWeddingPackages, useWeddingFaqItems } from '../hooks';
import AnimatedSection from '../components/AnimatedSection';
import ErrorState from '../components/ErrorState/ErrorState';
import Skeleton from '../components/Skeleton';
import WeddingCard from '../components/WeddingCard/WeddingCard';
import styles from './Wedding.module.css';

const WeddingSkeleton: React.FC = () => (
  <AnimatedSection>
    <section className={styles.wedding}>
      <Skeleton variant="text" width="250px" height="2.5rem" style={{ margin: '0 auto 2rem' }} />
      <div className={styles.grid}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={styles.skeletonCard}>
            <Skeleton variant="rect" width="100%" height="320px" style={{ borderRadius: '1rem 1rem 0 0' }} />
            <div className={styles.skeletonBody}>
              <Skeleton variant="text" width="60%" height="1.5rem" style={{ marginBottom: '0.5rem' }} />
              <Skeleton variant="text" width="100%" height="0.85rem" />
              <Skeleton variant="text" width="80%" height="0.85rem" />
              <Skeleton variant="text" width="100px" height="1.5rem" style={{ marginTop: '1rem' }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  </AnimatedSection>
);

const Wedding: React.FC = () => {
  const { items: packages, loading: packagesLoading, error: packagesError, refetch: refetchPackages } = useWeddingPackages();
  const { items: faqItems, loading: faqLoading } = useWeddingFaqItems();
  const [openFaqId, setOpenFaqId] = useState<number | null>(null);

  const toggleFaq = useCallback((id: number) => {
    setOpenFaqId(prev => prev === id ? null : id);
  }, []);

  if (packagesLoading || faqLoading) {
    return <WeddingSkeleton />;
  }

  if (packagesError) {
    return <ErrorState message={packagesError} onRetry={refetchPackages} />;
  }

  return (
    <AnimatedSection>
      <section className={styles.wedding}>
        <h1>Свадебные пакеты</h1>

        {packages.length === 0 ? (
          <p className={styles.emptyState}>Ещё нет свадебных пакетов</p>
        ) : (
          <div className={styles.grid}>
            {packages.map((pkg) => (
              <WeddingCard key={pkg.id} item={pkg} />
            ))}
          </div>
        )}

        {faqItems.length > 0 && (
          <div className={styles.faqSection}>
            <h2 className={styles.faqTitle}>Часто задаваемые вопросы</h2>
            <div className={styles.faqList}>
              {faqItems.map((faq) => {
                const isOpen = openFaqId === faq.id;
                return (
                  <div key={faq.id} className={styles.faqItem} onClick={() => toggleFaq(faq.id)}>
                    <div className={styles.faqQuestion}>
                      <span>{faq.question}</span>
                      <span className={styles.faqArrow}>{isOpen ? '▲' : '▼'}</span>
                    </div>
                    {isOpen && (
                      <div className={styles.faqAnswer}>
                        <p>{faq.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </AnimatedSection>
  );
};

export default Wedding;