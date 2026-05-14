/**
 * Application Constants
 * 
 * Centralized configuration values for the Nini HR platform.
 */

/* ── Brand ── */
export const BRAND = {
  name: 'Nini',
  tagline: 'Smart HR, Happy Teams',
  description: 'Simplify leave requests, attendance tracking, and team management for modern businesses.',
  url: 'https://nini-hr.com',
  supportEmail: 'support@nini-hr.com',
};

/* ── Navigation Links ── */
export const NAV_LINKS = [
  { label: 'Features', href: '/features' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Contact', href: '/contact' },
];

export const DASHBOARD_NAV = [
  { label: 'Dashboard', href: '/app', icon: 'LayoutDashboard' },
  { label: 'Leave', href: '/app/leave', icon: 'CalendarOff' },
  { label: 'Attendance', href: '/app/attendance', icon: 'Clock' },
  { label: 'Employees', href: '/app/employees', icon: 'Users' },
  { label: 'Calendar', href: '/app/calendar', icon: 'Calendar' },
  { label: 'Settings', href: '/app/settings', icon: 'Settings' },
];

/* ── Leave Types ── */
export const LEAVE_TYPES = [
  { value: 'annual', label: 'Annual Leave', color: 'primary' },
  { value: 'sick', label: 'Sick Leave', color: 'danger' },
  { value: 'personal', label: 'Personal Leave', color: 'secondary' },
  { value: 'maternity', label: 'Maternity Leave', color: 'accent' },
  { value: 'paternity', label: 'Paternity Leave', color: 'accent' },
  { value: 'unpaid', label: 'Unpaid Leave', color: 'warning' },
];

/* ── Leave Status ── */
export const LEAVE_STATUS = {
  pending: { label: 'Pending', color: 'warning' },
  approved: { label: 'Approved', color: 'success' },
  rejected: { label: 'Rejected', color: 'danger' },
  cancelled: { label: 'Cancelled', color: 'muted' },
};

/* ── Attendance Status ── */
export const ATTENDANCE_STATUS = {
  present: { label: 'Present', color: 'success' },
  absent: { label: 'Absent', color: 'danger' },
  late: { label: 'Late', color: 'warning' },
  halfDay: { label: 'Half Day', color: 'accent' },
  leave: { label: 'On Leave', color: 'primary' },
  holiday: { label: 'Holiday', color: 'secondary' },
};

/* ── Departments ── */
export const DEPARTMENTS = [
  'Engineering',
  'Design',
  'Marketing',
  'Sales',
  'Human Resources',
  'Finance',
  'Operations',
  'Customer Success',
];

/* ── Pricing Tiers ── */
export const PRICING_TIERS = [
  {
    name: 'Starter',
    price: 0,
    period: 'forever',
    description: 'Perfect for small teams getting started',
    features: [
      'Up to 10 employees',
      'Basic leave management',
      'Attendance tracking',
      'Email support',
      'Mobile responsive',
    ],
    cta: 'Get Started Free',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: 4.99,
    period: 'per employee/month',
    description: 'For growing teams that need more power',
    features: [
      'Up to 100 employees',
      'Advanced leave policies',
      'Geo-fenced attendance',
      'Team calendar',
      'Custom reports & analytics',
      'Priority support',
      'API access',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: null,
    period: 'custom',
    description: 'For large organizations with complex needs',
    features: [
      'Unlimited employees',
      'Custom workflows',
      'SSO & advanced security',
      'Dedicated account manager',
      'SLA guarantee',
      'On-premise deployment option',
      'Custom integrations',
      'Training & onboarding',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

/* ── Breakpoints (match Tailwind defaults) ── */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

/* ── Animation Durations (GSAP) ── */
export const ANIMATION = {
  fast: 0.3,
  base: 0.6,
  slow: 0.9,
  stagger: 0.15,
  scrollStart: 'top 85%',
};
