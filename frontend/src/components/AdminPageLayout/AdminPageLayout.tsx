import React from 'react';
import ErrorState from '../ErrorState/ErrorState';
import styles from './AdminPageLayout.module.css';

interface AdminPageLayoutProps {
  title: string;
  error?: string | null;
  children: React.ReactNode;
}

const AdminPageLayout: React.FC<AdminPageLayoutProps> = ({ title, error, children }) => {
  return (
    <div className={styles.layout}>
      <h2>{title}</h2>
      {error && <ErrorState message={error} />}
      {children}
    </div>
  );
};

export default AdminPageLayout;