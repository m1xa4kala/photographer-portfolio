import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
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
            <li><Link to="/admin/dashboard">Дашборд</Link></li>
            <li><Link to="/admin/best-photos">Лучшие фото</Link></li>
            <li><Link to="/admin/portfolio-categories">Категории портфолио</Link></li>
            <li><Link to="/admin/portfolio-sessions">Фотосессии</Link></li>
            <li><Link to="/admin/portfolio-photos">Фото портфолио</Link></li>
            <li><Link to="/admin/price-items">Прайс-лист</Link></li>
            <li><Link to="/admin/reviews">Отзывы</Link></li>
            <li><Link to="/admin/about">Обо мне</Link></li>
          </ul>
        </nav>
        <div className={styles.bottomLinks}>
          <Link to="/" className={styles.homeLink}>← На сайт</Link>
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