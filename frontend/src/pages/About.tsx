import React from 'react';
import { useAbout } from '../hooks';
import styles from './About.module.css';

const About: React.FC = () => {
  const { about, loading, error, refetch } = useAbout();

  if (loading) return <div>Загрузка информации...</div>;
  if (error) return <div>Ошибка: {error} <button onClick={refetch}>Повторить</button></div>;
  if (!about) return null;

  return (
    <div className={styles.about}>
      <div className={styles.photo}>
        <img src={about.photoUrl || '/images/default-avatar.jpg'} alt={about.fullName} />
      </div>
      <div className={styles.bio}>
        <h1>{about.fullName}</h1>
        <p>{about.bioText}</p>
        {about.equipmentText && <p><strong>Оборудование:</strong> {about.equipmentText}</p>}
        {about.experience && <p><strong>Опыт:</strong> {about.experience}</p>}
        {(about.email || about.phone) && (
          <div className={styles.contacts}>
            {about.email && <p>Email: {about.email}</p>}
            {about.phone && <p>Телефон: {about.phone}</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default About;