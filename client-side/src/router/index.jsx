/**
 * Name: router/index.jsx
 * PHASE 1 FIX: allowedRoles corrected to use backend values only.
 *
 * BEFORE: allowedRoles={['admin', 'manager', 'hr']}
 *   → 'manager' and 'hr' don't exist in the backend enum.
 *   → Admin users were being bounced off their own routes.
 *
 * AFTER: allowedRoles={['admin']}
 *   → Matches backend User.role enum: ['user', 'admin', 'superadmin']
 */

import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

/* ── Layouts (eager — always needed) ── */
import MarketingLayout from '@/components/layout/MarketingLayout';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AuthLayout from '@/components/layout/AuthLayout';
import ErrorPage from '@/pages/public/ErrorPage';

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

/* ── Lazy-loaded pages ── */
const LandingPage        = lazy(() => import('@/pages/public/LandingPage'));
const FeaturesPage       = lazy(() => import('@/pages/public/FeaturesPage'));
const PricingPage        = lazy(() => import('@/pages/public/PricingPage'));
const ContactPage        = lazy(() => import('@/pages/public/ContactPage'));

const LoginPage          = lazy(() => import('@/pages/auth/LoginPage'));
const SignupPage         = lazy(() => import('@/pages/auth/SignupPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const OnboardingPage     = lazy(() => import('@/pages/auth/OnboardingPage'));

const DashboardPage      = lazy(() => import('@/pages/app/DashboardPage'));
const AnnouncementsPage  = lazy(() => import('@/pages/app/AnnouncementsPage'));
const LeavePage          = lazy(() => import('@/pages/app/LeavePage'));
const AttendancePage     = lazy(() => import('@/pages/app/AttendancePage'));
const EmployeesPage      = lazy(() => import('@/pages/app/EmployeesPage'));
const CalendarPage       = lazy(() => import('@/pages/app/CalendarPage'));
const SettingsPage       = lazy(() => import('@/pages/app/SettingsPage'));
const ProfilePage        = lazy(() => import('@/pages/app/ProfilePage'));
const ReportsPage        = lazy(() => import('@/pages/app/ReportsPage'));
const DepartmentsPage    = lazy(() => import('@/pages/app/DepartmentsPage'));
const PayrollPage        = lazy(() => import('@/pages/app/PayrollPage'));
const PayslipsPage       = lazy(() => import('@/pages/app/PayslipsPage'));

const wrap = (Component) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

const router = createBrowserRouter([
  /* ── Public Marketing ── */
  {
    element: <MarketingLayout />,
    errorElement: <ErrorPage />,
    children: [
      { path: '/',          element: wrap(LandingPage) },
      { path: '/features',  element: wrap(FeaturesPage) },
      { path: '/pricing',   element: wrap(PricingPage) },
      { path: '/contact',   element: wrap(ContactPage) },
    ],
  },

  /* ── Onboarding ── */
  {
    path: '/onboarding',
    errorElement: <ErrorPage />,
    element: (
      <ProtectedRoute>
        {wrap(OnboardingPage)}
      </ProtectedRoute>
    ),
  },

  /* ── Auth ── */
  {
    element: <AuthLayout />,
    errorElement: <ErrorPage />,
    children: [
      { path: '/login',           element: wrap(LoginPage) },
      { path: '/signup',          element: wrap(SignupPage) },
      { path: '/forgot-password', element: wrap(ForgotPasswordPage) },
    ],
  },

  /* ── Protected App Routes ── */
  {
    element: <DashboardLayout />,
    errorElement: <ErrorPage />,
    children: [
      /* All authenticated users */
      { path: '/app',               element: <ProtectedRoute>{wrap(DashboardPage)}</ProtectedRoute> },
      { path: '/app/announcements', element: <ProtectedRoute>{wrap(AnnouncementsPage)}</ProtectedRoute> },
      { path: '/app/leave',         element: <ProtectedRoute>{wrap(LeavePage)}</ProtectedRoute> },
      { path: '/app/attendance',    element: <ProtectedRoute>{wrap(AttendancePage)}</ProtectedRoute> },
      { path: '/app/calendar',      element: <ProtectedRoute>{wrap(CalendarPage)}</ProtectedRoute> },
      { path: '/app/settings',      element: <ProtectedRoute>{wrap(SettingsPage)}</ProtectedRoute> },
      { path: '/app/profile',       element: <ProtectedRoute>{wrap(ProfilePage)}</ProtectedRoute> },
      { path: '/app/payslips',      element: <ProtectedRoute>{wrap(PayslipsPage)}</ProtectedRoute> },

      /* ─────────────────────────────────────────────
       * FIX: Admin-only routes
       * BEFORE: allowedRoles={['admin', 'manager', 'hr']}
       *   → 'manager' and 'hr' are NOT in the backend enum. Admin users
       *   → were correctly hitting these routes but 'manager'/'hr' checks
       *   → made the fuzzy-match code hard to reason about.
       * AFTER: allowedRoles={['admin']}
       *   → Clean, matches backend exactly.
       * ───────────────────────────────────────────── */
      { path: '/app/employees',   element: <ProtectedRoute allowedRoles={['admin']}>{wrap(EmployeesPage)}</ProtectedRoute> },
      { path: '/app/departments', element: <ProtectedRoute allowedRoles={['admin']}>{wrap(DepartmentsPage)}</ProtectedRoute> },
      { path: '/app/payroll',     element: <ProtectedRoute allowedRoles={['admin']}>{wrap(PayrollPage)}</ProtectedRoute> },
      { path: '/app/reports',     element: <ProtectedRoute allowedRoles={['admin']}>{wrap(ReportsPage)}</ProtectedRoute> },
    ],
  },

  /* ── Fallcard Wildcard 404 Route ── */
  {
    path: '*',
    element: <ErrorPage type="404" />,
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
