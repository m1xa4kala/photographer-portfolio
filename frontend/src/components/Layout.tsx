import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth, useContacts, useDocumentTitle } from '../hooks';
import Contacts from './Contacts';
import OverlayButtons from './OverlayButtons';
import Footer from './Footer';
import Logo from './Logo';
import styles from './Layout.module.css';

const TITLE_MAP: Record<string, string> = {
  '/': 'Влада | Фотограф',
  '/portfolio': 'Влада | Портфолио',
  '/price': 'Влада | Прайс',
  '/reviews': 'Влада | Отзывы',
  '/about': 'Влада | Обо мне',
};

const Layout: React.FC = () => {
  const { user } = useAuth();
  const { contacts } = useContacts();
  const location = useLocation();

  // Adaptive document title
  const title = TITLE_MAP[location.pathname] ?? 'Влада | Фотограф';
  useDocumentTitle(title);
  const isHome = location.pathname === '/';
  const [scrolled, setScrolled] = useState(false);
  const [headerHidden, setHeaderHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const lastScrollY = useRef(0);
  const HIDE_THRESHOLD = 5;

  const toggleMenu = useCallback(() => {
    setMenuOpen(prev => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
  }, []);

  // Lock body scroll when menu is open (works on iOS Safari too)
  useEffect(() => {
    const scrollY = window.scrollY;
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollY);
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
    };
  }, [menuOpen]);

  // Close menu on route change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMenuOpen(false);
  }, [location.pathname]);

  // Scroll to top on navigation
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Scrolled state — controls background transparency
      if (isHome) {
        setScrolled(currentScrollY > window.innerHeight - 80);
      } else {
        setScrolled(true);
      }

      // Header visibility — hide on scroll down, show on scroll up
      if (currentScrollY > lastScrollY.current + HIDE_THRESHOLD && currentScrollY > 80) {
        setHeaderHidden(true);
      } else if (currentScrollY < lastScrollY.current || currentScrollY <= 80) {
        setHeaderHidden(false);
      }

      lastScrollY.current = currentScrollY;
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHome]);

  // Show header when menu opens
  useEffect(() => {
    if (menuOpen) {
      setHeaderHidden(false);
    }
  }, [menuOpen]);

  return (
    <div className={styles.container}>
      <a href="#main-content" className={styles.skipLink}>
        Перейти к содержимому
      </a>
      <header
        className={`${styles.header} ${scrolled || !isHome ? styles.scrolled : ''} ${headerHidden ? styles.headerHidden : ''} ${menuOpen ? styles.headerMenuOpen : ''}`}
      >
        <Logo linkTo="/" className={styles.headerLogo} />
        
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
          {/* Contacts in burger menu */}
          <div className={styles.navContacts}>
            <span className={styles.navContactsTitle}>Контакты</span>
            <Contacts contacts={contacts} vertical />
          </div>
        </nav>
      </header>
      <main id="main-content" className={styles.main}>
        <Outlet />
      </main>
      <Footer contacts={contacts} />
      <OverlayButtons contacts={contacts} />
    </div>
  );
};

export default Layout;