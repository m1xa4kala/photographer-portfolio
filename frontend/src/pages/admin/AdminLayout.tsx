import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks';
import styles from './AdminLayout.module.css';

const AdminLayout: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className={styles.adminLayout}>
      <aside className={styles.sidebar}>
        <h3>Управление</h3>
        <nav>
          <ul>
            <li><NavLink to="/admin/dashboard" className={({ isActive }) => isActive ? styles.active : ''}>Дашборд</NavLink></li>
            <li><NavLink to="/admin/best-photos" className={({ isActive }) => isActive ? styles.active : ''}>Лучшие фото</NavLink></li>
            <li><NavLink to="/admin/portfolio-categories" className={({ isActive }) => isActive ? styles.active : ''}>Категории портфолио</NavLink></li>
            <li><NavLink to="/admin/portfolio-sessions" className={({ isActive }) => isActive ? styles.active : ''}>Фотосессии</NavLink></li>
            <li><NavLink to="/admin/portfolio-photos" className={({ isActive }) => isActive ? styles.active : ''}>Фото портфолио</NavLink></li>
            <li><NavLink to="/admin/full-sessions" className={({ isActive }) => isActive ? styles.active : ''}>📦 Полные сессии</NavLink></li>
            <li><NavLink to="/admin/price-items" className={({ isActive }) => isActive ? styles.active : ''}>Прайс-лист</NavLink></li>
            <li><NavLink to="/admin/reviews" className={({ isActive }) => isActive ? styles.active : ''}>Отзывы</NavLink></li>
            <li><NavLink to="/admin/about" className={({ isActive }) => isActive ? styles.active : ''}>Обо мне</NavLink></li>
            <li><NavLink to="/admin/social-links" className={({ isActive }) => isActive ? styles.active : ''}>Социальные сети</NavLink></li>
          </ul>
        </nav>
        <div className={styles.bottomLinks}>
          <NavLink to="/" className={styles.homeLink}>← На сайт</NavLink>
          <button onClick={handleLogout} className={styles.logoutBtn}>Выйти</button>
        </div>
      </aside>
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;