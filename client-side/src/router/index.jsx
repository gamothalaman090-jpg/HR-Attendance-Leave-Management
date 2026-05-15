import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

/* ── Layouts (eager load — always needed) ── */
import MarketingLayout from '@/components/layout/MarketingLayout';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AuthLayout from '@/components/layout/AuthLayout';

/* ── Loading fallback ── */
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

/* ── Public Pages (lazy loaded) ── */
const LandingPage = lazy(() => import('@/pages/public/LandingPage'));
const FeaturesPage = lazy(() => import('@/pages/public/FeaturesPage'));
const PricingPage = lazy(() => import('@/pages/public/PricingPage'));
const ContactPage = lazy(() => import('@/pages/public/ContactPage'));

/* ── Auth Pages ── */
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const SignupPage = lazy(() => import('@/pages/auth/SignupPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));

/* ── App Pages (lazy loaded — behind auth) ── */
const DashboardPage = lazy(() => import('@/pages/app/DashboardPage'));
const LeavePage = lazy(() => import('@/pages/app/LeavePage'));
const AttendancePage = lazy(() => import('@/pages/app/AttendancePage'));
const EmployeesPage = lazy(() => import('@/pages/app/EmployeesPage'));
const CalendarPage = lazy(() => import('@/pages/app/CalendarPage'));
const SettingsPage = lazy(() => import('@/pages/app/SettingsPage'));
const ProfilePage = lazy(() => import('@/pages/app/ProfilePage'));
const ReportsPage = lazy(() => import('@/pages/app/ReportsPage'));

/**
 * Application Router
 * 
 * Structure:
 * / ........................ Marketing pages (public)
 * /auth .................... Login / Signup / Forgot Password
 * /app ..................... Dashboard + app pages (protected)
 */
const router = createBrowserRouter([
  /* ── Public Marketing Routes ── */
  {
    element: <MarketingLayout />,
    children: [
      {
        path: '/',
        element: (
          <Suspense fallback={<PageLoader />}>
            <LandingPage />
          </Suspense>
        ),
      },
      {
        path: '/features',
        element: (
          <Suspense fallback={<PageLoader />}>
            <FeaturesPage />
          </Suspense>
        ),
      },
      {
        path: '/pricing',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PricingPage />
          </Suspense>
        ),
      },
      {
        path: '/contact',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ContactPage />
          </Suspense>
        ),
      },
    ],
  },

  /* ── Auth Routes ── */
  {
    element: <AuthLayout />,
    children: [
      {
        path: '/login',
        element: (
          <Suspense fallback={<PageLoader />}>
            <LoginPage />
          </Suspense>
        ),
      },
      {
        path: '/signup',
        element: (
          <Suspense fallback={<PageLoader />}>
            <SignupPage />
          </Suspense>
        ),
      },
      {
        path: '/forgot-password',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ForgotPasswordPage />
          </Suspense>
        ),
      },
    ],
  },

  /* ── Protected App Routes ── */
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          {
            path: '/app',
            element: (
              <Suspense fallback={<PageLoader />}>
                <DashboardPage />
              </Suspense>
            ),
          },
          {
            path: '/app/leave',
            element: (
              <Suspense fallback={<PageLoader />}>
                <LeavePage />
              </Suspense>
            ),
          },
          {
            path: '/app/attendance',
            element: (
              <Suspense fallback={<PageLoader />}>
                <AttendancePage />
              </Suspense>
            ),
          },
          {
            path: '/app/employees',
            element: (
              <Suspense fallback={<PageLoader />}>
                <EmployeesPage />
              </Suspense>
            ),
          },
          {
            path: '/app/calendar',
            element: (
              <Suspense fallback={<PageLoader />}>
                <CalendarPage />
              </Suspense>
            ),
          },
          {
            path: '/app/reports',
            element: (
              <Suspense fallback={<PageLoader />}>
                <ReportsPage />
              </Suspense>
            ),
          },
          {
            path: '/app/settings',
            element: (
              <Suspense fallback={<PageLoader />}>
                <SettingsPage />
              </Suspense>
            ),
          },
          {
            path: '/app/profile',
            element: (
              <Suspense fallback={<PageLoader />}>
                <ProfilePage />
              </Suspense>
            ),
          },
        ],
      },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
