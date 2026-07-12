import React from 'react';
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
import Dashboard from './pages/admin/Dashboard';
import BestPhotosAdmin from './pages/admin/BestPhotosAdmin';
import PortfolioCategoriesAdmin from './pages/admin/PortfolioCategoriesAdmin';
import PortfolioSessionsAdmin from './pages/admin/PortfolioSessionsAdmin';
import PortfolioPhotosAdmin from './pages/admin/PortfolioPhotosAdmin';
import FullSessionsAdmin from './pages/admin/FullSessionsAdmin';
import SessionDownload from './pages/SessionDownload';
import PriceItemsAdmin from './pages/admin/PriceItemsAdmin';
import ReviewsAdmin from './pages/admin/ReviewsAdmin';
import AboutAdmin from './pages/admin/AboutAdmin';

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
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="best-photos" element={<BestPhotosAdmin />} />
            <Route path="portfolio-categories" element={<PortfolioCategoriesAdmin />} />
            <Route path="portfolio-sessions" element={<PortfolioSessionsAdmin />} />
            <Route path="portfolio-photos" element={<PortfolioPhotosAdmin />} />
            <Route path="full-sessions" element={<FullSessionsAdmin />} />
            <Route path="price-items" element={<PriceItemsAdmin />} />
            <Route path="reviews" element={<ReviewsAdmin />} />
            <Route path="about" element={<AboutAdmin />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;