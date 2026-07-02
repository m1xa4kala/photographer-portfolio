import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks';
import styles from './Layout.module.css';

const Layout: React.FC = () => {
  const { user } = useAuth();
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
      <header className={`${styles.header} ${scrolled || !isHome ? styles.scrolled : ''}`}>
        <div className={styles.logo}>Vlada Photo</div>
        <nav className={styles.nav}>
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
      <main className={styles.main}>
        <Outlet />
      </main>
      <footer className={styles.footer}>
        <p>© {new Date().getFullYear()} Vlada Photo. Все права защищены.</p>
        <div className={styles.socials}>
          <a href="#">Instagram</a> | <a href="#">Telegram</a>
        </div>
      </footer>
    </div>
  );
};

export default Layout;