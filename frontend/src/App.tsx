import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContextProvider';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Portfolio from './pages/Portfolio';
import Price from './pages/Price';
import Reviews from './pages/Reviews';
import About from './pages/About';
import AdminLayout from './pages/admin/AdminLayout';
import Login from './pages/admin/Login';
import SessionDownload from './pages/SessionDownload';
import NotFound from './pages/NotFound';

// Lazy-loaded admin pages (code splitting — only loaded when user visits admin routes)
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const BestPhotosAdmin = lazy(() => import('./pages/admin/BestPhotosAdmin'));
const PortfolioCategoriesAdmin = lazy(() => import('./pages/admin/PortfolioCategoriesAdmin'));
const PortfolioSessionsAdmin = lazy(() => import('./pages/admin/PortfolioSessionsAdmin'));
const PortfolioPhotosAdmin = lazy(() => import('./pages/admin/PortfolioPhotosAdmin'));
const FullSessionsAdmin = lazy(() => import('./pages/admin/FullSessionsAdmin'));
const SocialLinksAdmin = lazy(() => import('./pages/admin/SocialLinksAdmin'));
const PriceItemsAdmin = lazy(() => import('./pages/admin/PriceItemsAdmin'));
const ReviewsAdmin = lazy(() => import('./pages/admin/ReviewsAdmin'));
const AboutAdmin = lazy(() => import('./pages/admin/AboutAdmin'));

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Публичные маршруты */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="portfolio" element={<Portfolio />} />
            <Route path="price" element={<Price />} />
            <Route path="reviews" element={<Reviews />} />
            <Route path="about" element={<About />} />
          </Route>
          {/* Скачивание */}
          <Route path="/download/:token" element={<SessionDownload />} />
          {/* Админка */}
          <Route path="/admin/login" element={<Login />} />
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route path="dashboard" element={
              <Suspense fallback={<div>Loading...</div>}>
                <Dashboard />
              </Suspense>
            } />
            <Route path="best-photos" element={
              <Suspense fallback={<div>Loading...</div>}>
                <BestPhotosAdmin />
              </Suspense>
            } />
            <Route path="portfolio-categories" element={
              <Suspense fallback={<div>Loading...</div>}>
                <PortfolioCategoriesAdmin />
              </Suspense>
            } />
            <Route path="portfolio-sessions" element={
              <Suspense fallback={<div>Loading...</div>}>
                <PortfolioSessionsAdmin />
              </Suspense>
            } />
            <Route path="portfolio-photos" element={
              <Suspense fallback={<div>Loading...</div>}>
                <PortfolioPhotosAdmin />
              </Suspense>
            } />
            <Route path="full-sessions" element={
              <Suspense fallback={<div>Loading...</div>}>
                <FullSessionsAdmin />
              </Suspense>
            } />
            <Route path="price-items" element={
              <Suspense fallback={<div>Loading...</div>}>
                <PriceItemsAdmin />
              </Suspense>
            } />
            <Route path="reviews" element={
              <Suspense fallback={<div>Loading...</div>}>
                <ReviewsAdmin />
              </Suspense>
            } />
            <Route path="about" element={
              <Suspense fallback={<div>Loading...</div>}>
                <AboutAdmin />
              </Suspense>
            } />
            <Route path="social-links" element={
              <Suspense fallback={<div>Loading...</div>}>
                <SocialLinksAdmin />
              </Suspense>
            } />
          </Route>
          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;