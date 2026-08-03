import React from 'react';
import { useAbout, useContacts } from '../hooks';
import AnimatedSection from '../components/AnimatedSection';
import Contacts from '../components/Contacts';
import ErrorState from '../components/ErrorState/ErrorState';
import Skeleton from '../components/Skeleton';
import ImageWithSkeleton from '../components/ImageWithSkeleton';
import styles from './About.module.css';

const AboutSkeleton: React.FC = () => (
  <AnimatedSection>
    <div className={styles.about}>
      <div className={styles.photo}>
        <Skeleton variant="circle" width="100%" height="auto" style={{ aspectRatio: '1' }} />
      </div>
      <div className={styles.bio}>
        <Skeleton variant="text" width="60%" height="2rem" />
        <Skeleton variant="text" width="100%" height="1rem" />
        <Skeleton variant="text" width="100%" height="1rem" />
        <Skeleton variant="text" width="100%" height="1rem" />
        <Skeleton variant="text" width="80%" height="1rem" />
        <Skeleton variant="text" width="50%" height="1rem" />
      </div>
    </div>
  </AnimatedSection>
);

const About: React.FC = () => {
  const { about, loading, error, refetch } = useAbout();
  const { contacts } = useContacts();

  if (loading) return <AboutSkeleton />;
  if (error) return <ErrorState message={`Ошибка: ${error}`} onRetry={refetch} />;
  if (!about) return null;

  return (
    <AnimatedSection>
      <div className={styles.about}>
        <div className={styles.photo}>
          <ImageWithSkeleton
            src={about.photoUrl || '/images/default-avatar.svg'}
            alt={about.fullName}
            loading="eager"
          />
        </div>
        <div className={styles.bio}>
          <h1>{about.fullName}</h1>
          <p>{about.bioText}</p>
          <Contacts contacts={contacts} />
        </div>
      </div>
    </AnimatedSection>
  );
};

export default About;