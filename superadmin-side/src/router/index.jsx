import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import AdminLayout from '@/components/layout/AdminLayout';
import AuthLayout from '@/components/layout/AuthLayout';
import ErrorPage from '@/pages/ErrorPage';

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-text-muted text-body-sm font-body">Loading...</p>
      </div>
    </div>
  );
}

const LoginPage = lazy(() => import('@/pages/LoginPage'));
const ConsolePage = lazy(() => import('@/pages/ConsolePage'));
const UsersPage = lazy(() => import('@/pages/UsersPage'));
const LogsPage = lazy(() => import('@/pages/LogsPage'));

const router = createBrowserRouter([
  /* ── Root redirect ── */
  { path: '/', element: <Navigate to="/console" replace /> },

  /* ── Auth Routes ── */
  {
    path: '/login',
    errorElement: <ErrorPage />,
    element: (
      <AuthLayout>
        <Suspense fallback={<PageLoader />}>
          <LoginPage />
        </Suspense>
      </AuthLayout>
    ),
  },

  /* ── Protected Console Routes ── */
  {
    errorElement: <ErrorPage />,
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '/console',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ConsolePage />
          </Suspense>
        ),
      },
      {
        path: '/console/users',
        element: (
          <Suspense fallback={<PageLoader />}>
            <UsersPage />
          </Suspense>
        ),
      },
      {
        path: '/console/logs',
        element: (
          <Suspense fallback={<PageLoader />}>
            <LogsPage />
          </Suspense>
        ),
      },
    ],
  },

  /* ── Fallback 404 Route ── */
  {
    path: '*',
    element: <ErrorPage type="404" />,
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
