import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth, useSocialLinks } from '../hooks';
import SocialLinks from './SocialLinks';
import styles from './Layout.module.css';

const Layout: React.FC = () => {
  const { user } = useAuth();
  const { socialLinks } = useSocialLinks();
  const location = useLocation();
  const isHome = location.pathname === '/';
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!isHome) {
      setScrolled(true);
      return;
    }

    const handleScroll = () => {
      setScrolled(window.scrollY > window.innerHeight - 80);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHome]);

  return (
    <div className={styles.container}>
      <a href="#main-content" className={styles.skipLink}>
        Перейти к содержимому
      </a>
      <header className={`${styles.header} ${scrolled || !isHome ? styles.scrolled : ''}`}>
        <div className={styles.logo}>
          <span className={styles.logoName}>Vlada Khaybullina</span>
          <span className={styles.logoSub}>Photographer</span>
        </div>
        <nav className={styles.nav} aria-label="Главное меню">
          <NavLink to="/" className={({ isActive }) => (isActive ? styles.active : '')}>
            Главная
          </NavLink>
          <NavLink to="/portfolio" className={({ isActive }) => (isActive ? styles.active : '')}>
            Портфолио
          </NavLink>
          <NavLink to="/price" className={({ isActive }) => (isActive ? styles.active : '')}>
            Прайс
          </NavLink>
          <NavLink to="/reviews" className={({ isActive }) => (isActive ? styles.active : '')}>
            Отзывы
          </NavLink>
          <NavLink to="/about" className={({ isActive }) => (isActive ? styles.active : '')}>
            Обо мне
          </NavLink>
          {user && (
            <NavLink to="/admin/dashboard" className={({ isActive }) => (isActive ? styles.active : '')}>
              Админка
            </NavLink>
          )}
        </nav>
      </header>
      <main id="main-content" className={styles.main}>
        <Outlet />
      </main>
      <footer className={styles.footer}>
        <p>© {new Date().getFullYear()} Vlada Khaybullina. Все права защищены.</p>
        <div className={styles.socials}>
          <SocialLinks links={socialLinks} />
        </div>
      </footer>
    </div>
  );
};

export default Layout;