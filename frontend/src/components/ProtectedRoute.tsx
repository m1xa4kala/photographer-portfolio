import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks';

interface ProtectedRouteProps {
  children: React.ReactElement;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div aria-live="polite">Загрузка...</div>;
  if (!user) return <Navigate to="/admin/login?redirect=admin" replace />;
  return children;
};

export default ProtectedRoute;