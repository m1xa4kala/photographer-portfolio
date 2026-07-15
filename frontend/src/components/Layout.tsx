import React, { useEffect, useState, useCallback } from 'react';
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
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = useCallback(() => {
    setMenuOpen(prev => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
  }, []);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  // Close menu on route change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isHome) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
      <header
        className={`${styles.header} ${scrolled || !isHome ? styles.scrolled : ''} ${menuOpen ? styles.headerMenuOpen : ''}`}
      >
        <div className={styles.logo}>
          <span className={styles.logoName}>Vlada Khaybullina</span>
          <span className={styles.logoSub}>Photographer</span>
        </div>
        <button
          className={styles.hamburger}
          onClick={toggleMenu}
          aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
          aria-expanded={menuOpen}
          aria-controls="main-nav"
        >
          {menuOpen ? (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
        {menuOpen && (
          <div className={styles.overlay} onClick={closeMenu} aria-hidden="true" />
        )}
        <nav
          id="main-nav"
          className={`${styles.nav} ${menuOpen ? styles.navOpen : ''}`}
          aria-label="Главное меню"
        >
          <NavLink to="/" onClick={closeMenu} className={({ isActive }) => (isActive ? styles.active : '')}>
            Главная
          </NavLink>
          <NavLink to="/portfolio" onClick={closeMenu} className={({ isActive }) => (isActive ? styles.active : '')}>
            Портфолио
          </NavLink>
          <NavLink to="/price" onClick={closeMenu} className={({ isActive }) => (isActive ? styles.active : '')}>
            Прайс
          </NavLink>
          <NavLink to="/reviews" onClick={closeMenu} className={({ isActive }) => (isActive ? styles.active : '')}>
            Отзывы
          </NavLink>
          <NavLink to="/about" onClick={closeMenu} className={({ isActive }) => (isActive ? styles.active : '')}>
            Обо мне
          </NavLink>
          {user && (
            <NavLink to="/admin/dashboard" onClick={closeMenu} className={({ isActive }) => (isActive ? styles.active : '')}>
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