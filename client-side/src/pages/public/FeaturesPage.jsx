import { Link } from 'react-router-dom';
import {
  CalendarCheck, Clock, Users, BarChart3, Shield, Smartphone,
  Bell, Globe, FileText, Workflow, Lock, Palette,
  ArrowRight, CheckCircle,
} from 'lucide-react';
import { useScrollReveal } from '@/hooks/useGsap';

const FEATURES = [
  {
    category: 'Leave Management',
    icon: CalendarCheck,
    color: 'primary',
    title: 'Streamlined leave workflows',
    desc: 'From request to approval in a few clicks. Custom leave types, accrual policies, and automated balance tracking.',
    details: [
      'Custom leave types (annual, sick, personal, parental)',
      'Multi-level approval workflows',
      'Automatic leave balance calculation',
      'Carry-over and pro-rating policies',
      'Leave calendar with team visibility',
      'Bulk approve/reject for managers',
    ],
  },
  {
    category: 'Attendance Tracking',
    icon: Clock,
    color: 'success',
    title: 'Real-time presence monitoring',
    desc: 'Know who is in, who is late, and who is working remotely — all from one dashboard.',
    details: [
      'One-tap clock in/out',
      'Geo-fenced attendance zones',
      'Overtime calculation & alerts',
      'Shift scheduling support',
      'Break time tracking',
      'Timesheet export (CSV/PDF)',
    ],
  },
  {
    category: 'Team Calendar',
    icon: Globe,
    color: 'accent',
    title: 'Plan ahead with confidence',
    desc: 'A shared calendar view that shows team availability, holidays, and scheduled leaves at a glance.',
    details: [
      'Color-coded by leave type',
      'Department and team filters',
      'Public holiday integration',
      'Month, week, and day views',
      'Conflict detection alerts',
      'Exportable to Google/Outlook',
    ],
  },
  {
    category: 'Analytics & Reports',
    icon: BarChart3,
    color: 'secondary',
    title: 'Data-driven HR decisions',
    desc: 'Understand trends, spot issues early, and make better workforce decisions with actionable insights.',
    details: [
      'Attendance trend analysis',
      'Leave utilization reports',
      'Department comparison views',
      'Absenteeism pattern detection',
      'Custom date range filters',
      'One-click CSV/PDF export',
    ],
  },
  {
    category: 'Employee Directory',
    icon: Users,
    color: 'info',
    title: 'Your team at your fingertips',
    desc: 'Searchable, filterable profiles with department views and quick access to key employee information.',
    details: [
      'Profile cards with key details',
      'Department and role filters',
      'Quick search by name or email',
      'Grid and list view toggle',
      'Employee self-service portal',
      'Bulk import via CSV',
    ],
  },
  {
    category: 'Security & Compliance',
    icon: Shield,
    color: 'danger',
    title: 'Enterprise-grade protection',
    desc: 'Your data is safe with us. SOC 2 compliant, encrypted, and backed up daily.',
    details: [
      'AES-256 encryption at rest',
      'TLS 1.3 in transit',
      'Role-based access control',
      'Audit trail logging',
      'GDPR compliance tools',
      'SSO integration (Enterprise)',
    ],
  },
];

export default function FeaturesPage() {
  const headerRef = useScrollReveal({ target: '[data-reveal]' });

  return (
    <div>
      {/* Hero */}
      <section ref={headerRef} className="py-20 sm:py-28 bg-surface-alt/30">
        <div className="section-container text-center">
          <span data-reveal className="text-caption font-semibold text-primary uppercase tracking-widest mb-3 block">Features</span>
          <h1 data-reveal className="font-heading text-h1 sm:text-display font-extrabold mb-6 text-balance">
            Powerful features for{' '}
            <span className="gradient-text">modern teams</span>
          </h1>
          <p data-reveal className="text-body-lg text-text-muted max-w-2xl mx-auto mb-10 text-balance">
            Everything you need to manage your workforce efficiently, all in one beautiful platform.
          </p>
          <div data-reveal className="flex items-center justify-center gap-4">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3.5 rounded-[12px] text-body font-semibold hover:bg-primary-light hover:shadow-glow-primary transition-all group"
            >
              Start Free Trial
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Sections */}
      {FEATURES.map((feature, i) => (
        <FeatureRow key={feature.category} feature={feature} reversed={i % 2 !== 0} />
      ))}

      {/* Bottom CTA */}
      <section className="py-section">
        <div className="section-container text-center">
          <h2 className="font-heading text-h2 font-bold mb-4">
            Ready to get started?
          </h2>
          <p className="text-body-lg text-text-muted max-w-xl mx-auto mb-8">
            Join 2,500+ teams using Nini. Free to start, no credit card required.
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-[12px] text-body font-semibold hover:bg-primary-light hover:shadow-glow-primary transition-all group"
          >
            Get Started Free
            <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function FeatureRow({ feature, reversed }) {
  const ref = useScrollReveal({ target: '[data-reveal]', stagger: 0.1 });
  const { category, icon: Icon, color, title, desc, details } = feature;

  return (
    <section ref={ref} className="py-section border-b border-border last:border-0">
      <div className={`section-container grid lg:grid-cols-2 gap-12 lg:gap-16 items-center ${reversed ? 'lg:direction-rtl' : ''}`}>
        {/* Text side */}
        <div className={reversed ? 'lg:direction-ltr' : ''}>
          <span data-reveal className={`inline-flex items-center gap-2 text-caption font-semibold text-${color} uppercase tracking-widest mb-3`}>
            <Icon size={16} />
            {category}
          </span>
          <h2 data-reveal className="font-heading text-h2 font-bold mb-4">{title}</h2>
          <p data-reveal className="text-body-lg text-text-muted mb-8 leading-relaxed">{desc}</p>
          <ul className="space-y-3">
            {details.map((item) => (
              <li key={item} data-reveal className="flex items-start gap-2.5 text-body-sm text-text">
                <CheckCircle size={18} className="text-success shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Visual side */}
        <div data-reveal className={reversed ? 'lg:direction-ltr' : ''}>
          <div className={`p-8 rounded-[20px] bg-${color}/5 dark:bg-${color}/10 border border-${color}/10 flex items-center justify-center min-h-[280px]`}>
            <Icon size={80} className={`text-${color}/30`} />
          </div>
        </div>
      </div>
    </section>
  );
}
