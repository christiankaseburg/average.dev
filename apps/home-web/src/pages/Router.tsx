import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/Auth/ProtectedRoute';
import { MainLayout } from '../components/Layouts/MainLayout';
import { EmptyLayout } from '../components/Layouts/EmptyLayout';

import LoginPage from './login';
import HomePage from './home';

export const router = createBrowserRouter([
  // Authenticated Routes (Main Layout)
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '',
        element: <Navigate to="/home" replace />,
      },
      {
        path: 'home',
        element: <HomePage />,
      },
    ],
  },

  // Public Routes (Empty Layout)
  {
    path: '/auth',
    element: <EmptyLayout />,
    children: [
      {
        path: 'login',
        element: <LoginPage />,
      },
    ],
  },

  // Fallback
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
