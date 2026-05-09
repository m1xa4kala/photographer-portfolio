import { Outlet, NavLink } from 'react-router-dom';
import styles from './Layout.module.css';

export default function Layout() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logo}>Vlada Photo</div>
        <nav className={styles.nav}>
          <NavLink to="/" className={({ isActive }) => isActive ? styles.active : ''}>Главная</NavLink>
          <NavLink to="/portfolio">Портфолио</NavLink>
          <NavLink to="/price">Прайс</NavLink>
          <NavLink to="/reviews">Отзывы</NavLink>
          <NavLink to="/about">Обо мне</NavLink>
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
}