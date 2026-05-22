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
const OnboardingPage = lazy(() => import('@/pages/auth/OnboardingPage'));

/* ── App Pages (lazy loaded — behind auth) ── */
const DashboardPage = lazy(() => import('@/pages/app/DashboardPage'));
const AnnouncementsPage = lazy(() => import('@/pages/app/AnnouncementsPage'));
const LeavePage = lazy(() => import('@/pages/app/LeavePage'));
const AttendancePage = lazy(() => import('@/pages/app/AttendancePage'));
const EmployeesPage = lazy(() => import('@/pages/app/EmployeesPage'));
const CalendarPage = lazy(() => import('@/pages/app/CalendarPage'));
const SettingsPage = lazy(() => import('@/pages/app/SettingsPage'));
const ProfilePage = lazy(() => import('@/pages/app/ProfilePage'));
const ReportsPage = lazy(() => import('@/pages/app/ReportsPage'));

/* ── Custom Lazy Loaded HR Modules ── */
const DepartmentsPage = lazy(() => import('@/pages/app/DepartmentsPage'));
const PayrollPage = lazy(() => import('@/pages/app/PayrollPage'));
const PayslipsPage = lazy(() => import('@/pages/app/PayslipsPage'));


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

  /* ── Standalone Setup Route ── */
  {
    path: '/onboarding',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <OnboardingPage />
        </Suspense>
      </ProtectedRoute>
    ),
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
    element: <DashboardLayout />,
    children: [
      /* ── Common Routes (All roles) ── */
      {
        path: '/app',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <DashboardPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '/app/announcements',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <AnnouncementsPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '/app/leave',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <LeavePage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '/app/attendance',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <AttendancePage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '/app/calendar',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <CalendarPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '/app/settings',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <SettingsPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '/app/profile',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <ProfilePage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '/app/payslips',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <PayslipsPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },

      /* ── HR & Admin Only Routes ── */
      {
        path: '/app/employees',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'manager', 'hr']}>
            <Suspense fallback={<PageLoader />}>
              <EmployeesPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '/app/departments',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'manager', 'hr']}>
            <Suspense fallback={<PageLoader />}>
              <DepartmentsPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '/app/payroll',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'manager', 'hr']}>
            <Suspense fallback={<PageLoader />}>
              <PayrollPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '/app/reports',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'manager', 'hr']}>
            <Suspense fallback={<PageLoader />}>
              <ReportsPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },


    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
