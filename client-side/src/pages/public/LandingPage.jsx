import { useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarCheck,
  Clock,
  Users,
  BarChart3,
  Shield,
  Smartphone,
  ChevronRight,
  Star,
  CheckCircle,
  Zap,
  Globe,
} from 'lucide-react';
import { useGsap, useScrollReveal, useCountUp } from '@/hooks/useGsap';

/* ═══════════════════════════════════════════════════════
   HERO SECTION
   ═══════════════════════════════════════════════════════ */
function HeroSection() {
  const containerRef = useGsap((gsap, el) => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.fromTo(el.querySelector('[data-hero-badge]'), { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, clearProps: 'all' })
      .fromTo(el.querySelector('[data-hero-title]'), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, clearProps: 'all' }, '-=0.3')
      .fromTo(el.querySelector('[data-hero-subtitle]'), { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, clearProps: 'all' }, '-=0.4')
      .fromTo(el.querySelector('[data-hero-cta]'), { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, clearProps: 'all' }, '-=0.3')
      .fromTo(el.querySelector('[data-hero-visual]'), { y: 40, opacity: 0, scale: 0.97 }, { y: 0, opacity: 1, scale: 1, duration: 0.8, clearProps: 'all' }, '-=0.3');
  });

  return (
    <section ref={containerRef} className="relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-primary/5 dark:bg-primary/10 blur-3xl" />
        <div className="absolute top-40 right-0 w-[400px] h-[400px] rounded-full bg-accent/5 dark:bg-accent/10 blur-3xl" />
      </div>

      <div className="section-container pt-16 sm:pt-24 pb-20 sm:pb-32">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div data-hero-badge className="inline-flex items-center gap-2 px-4 py-1.5 rounded-pill bg-primary/5 dark:bg-primary/10 text-primary text-body-sm font-medium mb-6 border border-primary/10">
            <Zap size={14} className="fill-primary" />
            Now in Beta — Free for early teams
          </div>

          {/* Title */}
          <h1 data-hero-title className="font-heading text-h1 sm:text-display font-extrabold mb-6 text-balance leading-[1.1] tracking-tight">
            HR management{' '}
            <br className="hidden sm:block" />
            that <span className="gradient-text">actually works</span>
          </h1>

          {/* Subtitle */}
          <p data-hero-subtitle className="text-body-lg sm:text-[1.25rem] text-text-muted max-w-2xl mx-auto mb-10 text-balance leading-relaxed">
            Nini simplifies leave requests, attendance tracking, and team management.
            Beautiful, fast, and intuitive — so you can focus on your people, not paperwork.
          </p>

          {/* CTAs */}
          <div data-hero-cta className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary text-white px-8 py-4 rounded-[12px] text-body font-semibold hover:bg-primary-light hover:shadow-glow-primary transition-all duration-base group"
            >
              Get Started Free
              <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              to="/features"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-border text-text px-8 py-4 rounded-[12px] text-body font-semibold hover:bg-surface-alt transition-all duration-base"
            >
              See How It Works
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-body-sm text-text-muted">
            <span className="flex items-center gap-1.5">
              <CheckCircle size={16} className="text-success" />
              No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle size={16} className="text-success" />
              14-day free trial
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle size={16} className="text-success" />
              Cancel anytime
            </span>
          </div>
        </div>

        {/* Dashboard Preview */}
        <div data-hero-visual className="mt-16 sm:mt-20 max-w-5xl mx-auto">
          <div className="relative rounded-[20px] border border-border bg-surface shadow-elevated overflow-hidden">
            {/* Fake browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-surface-alt">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-danger/60" />
                <div className="w-3 h-3 rounded-full bg-warning/60" />
                <div className="w-3 h-3 rounded-full bg-success/60" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-4 py-1 rounded-[6px] bg-surface text-caption text-text-muted border border-border">
                  app.nini-hr.com/dashboard
                </div>
              </div>
            </div>
            {/* Dashboard content mockup */}
            <div className="p-6 sm:p-8 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Employees', val: '156', color: 'primary' },
                  { label: 'Present', val: '142', color: 'success' },
                  { label: 'On Leave', val: '8', color: 'accent' },
                  { label: 'Late', val: '6', color: 'warning' },
                ].map((s) => (
                  <div key={s.label} className="p-4 rounded-[12px] bg-surface-alt border border-border">
                    <div className={`text-h3 font-heading font-bold text-${s.color}`}>{s.val}</div>
                    <div className="text-caption text-text-muted">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 h-32 rounded-[12px] bg-surface-alt border border-border flex items-center justify-center text-text-muted text-body-sm">
                  📊 Attendance Overview Chart
                </div>
                <div className="h-32 rounded-[12px] bg-surface-alt border border-border flex items-center justify-center text-text-muted text-body-sm">
                  📋 Recent Requests
                </div>
              </div>
            </div>
          </div>

          {/* Glow behind preview */}
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[80%] h-40 bg-primary/10 dark:bg-primary/20 blur-3xl rounded-full -z-10" />
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   TRUST BAR
   ═══════════════════════════════════════════════════════ */
function TrustBar() {
  const ref = useScrollReveal({ target: '[data-trust]', stagger: 0.1 });

  return (
    <section ref={ref} className="py-12 border-y border-border bg-surface-alt/50">
      <div className="section-container">
        <p className="text-center text-caption font-medium text-text-muted uppercase tracking-widest mb-8" data-trust>
          Trusted by teams at
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 opacity-40">
          {['Acme Corp', 'Globex Inc', 'Initech', 'Umbrella Co', 'Stark Industries', 'Wayne Ent'].map((name) => (
            <span key={name} data-trust className="font-heading text-h4 font-bold text-text whitespace-nowrap">
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   FEATURES SECTION
   ═══════════════════════════════════════════════════════ */
const FEATURES = [
  {
    title: 'Leave Management',
    desc: 'Request, approve, and track leaves with automated workflows and smart notifications. Custom leave policies per team.',
    icon: CalendarCheck,
    color: 'primary',
  },
  {
    title: 'Attendance Tracking',
    desc: 'Clock in/out with geo-fencing, biometrics, or simple tap. Real-time dashboards and overtime calculation.',
    icon: Clock,
    color: 'success',
  },
  {
    title: 'Team Calendar',
    desc: "See who's in, who's out, and plan ahead with a shared, color-coded team calendar view.",
    icon: Globe,
    color: 'accent',
  },
  {
    title: 'Smart Reports',
    desc: 'Actionable analytics on attendance patterns, leave trends, and team health with exportable CSV data.',
    icon: BarChart3,
    color: 'secondary',
  },
  {
    title: 'Employee Directory',
    desc: 'Searchable, filterable employee profiles with department views and organizational hierarchy.',
    icon: Users,
    color: 'info',
  },
  {
    title: 'Mobile Ready',
    desc: 'Full functionality on any device. Apply for leave or clock in from your phone with our responsive interface.',
    icon: Smartphone,
    color: 'danger',
  },
];

function FeaturesSection() {
  const ref = useScrollReveal({ target: '[data-feature]', stagger: 0.12 });

  return (
    <section ref={ref} className="py-section sm:py-section-lg">
      <div className="section-container">
        <div className="text-center mb-16" data-feature>
          <span className="text-caption font-semibold text-primary uppercase tracking-widest mb-3 block">Features</span>
          <h2 className="font-heading text-h2 sm:text-h1 font-bold mb-4 text-balance">
            Everything your HR team needs
          </h2>
          <p className="text-body-lg text-text-muted max-w-2xl mx-auto text-balance">
            From leave management to attendance tracking, Nini handles it all in one beautiful platform.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ title, desc, icon: Icon, color }) => (
            <div
              key={title}
              data-feature
              className="group p-6 rounded-[16px] bg-surface border border-border hover:border-primary/30 hover:shadow-card-hover transition-[border-color,box-shadow,transform] duration-base"
            >
              <div className={`w-12 h-12 rounded-[12px] bg-${color}/10 flex items-center justify-center text-${color} mb-4 group-hover:scale-110 transition-transform duration-base`}>
                <Icon size={24} />
              </div>
              <h3 className="font-heading text-h4 font-bold mb-2">{title}</h3>
              <p className="text-body-sm text-text-muted leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   HOW IT WORKS
   ═══════════════════════════════════════════════════════ */
const STEPS = [
  { step: '01', title: 'Create your workspace', desc: 'Sign up in seconds and invite your team. No credit card needed.', icon: Zap },
  { step: '02', title: 'Configure policies', desc: 'Set up leave types, approval flows, and attendance rules that match your company.', icon: Shield },
  { step: '03', title: 'Go live', desc: 'Your team can start requesting leave and clocking in immediately. It just works.', icon: CheckCircle },
];

function HowItWorksSection() {
  const ref = useScrollReveal({ target: '[data-step]', stagger: 0.2 });

  return (
    <section ref={ref} className="py-section sm:py-section-lg bg-surface-alt/30">
      <div className="section-container">
        <div className="text-center mb-16" data-step>
          <span className="text-caption font-semibold text-primary uppercase tracking-widest mb-3 block">How it works</span>
          <h2 className="font-heading text-h2 sm:text-h1 font-bold mb-4">
            Up and running in minutes
          </h2>
          <p className="text-body-lg text-text-muted max-w-xl mx-auto">
            Three simple steps to transform how your team manages HR.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {STEPS.map(({ step, title, desc, icon: Icon }) => (
            <div key={step} data-step className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
                <Icon size={28} className="text-primary" />
              </div>
              <div className="text-caption font-bold text-primary mb-2">{step}</div>
              <h3 className="font-heading text-h4 font-bold mb-2">{title}</h3>
              <p className="text-body-sm text-text-muted leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   STATS SECTION
   ═══════════════════════════════════════════════════════ */
function StatsSection() {
  const teamsRef = useCountUp(2500, 2);
  const employeesRef = useCountUp(150000, 2.5);
  const uptimeRef = useCountUp(99.9, 1.5);

  const containerRef = useScrollReveal({ target: '[data-stat]', stagger: 0.15 });

  return (
    <section ref={containerRef} className="py-section">
      <div className="section-container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div data-stat>
            <div className="text-h2 sm:text-h1 font-heading font-extrabold gradient-text">
              <span ref={teamsRef}>0</span>+
            </div>
            <div className="text-body-sm text-text-muted mt-1">Active Teams</div>
          </div>
          <div data-stat>
            <div className="text-h2 sm:text-h1 font-heading font-extrabold gradient-text">
              <span ref={employeesRef}>0</span>+
            </div>
            <div className="text-body-sm text-text-muted mt-1">Employees Managed</div>
          </div>
          <div data-stat>
            <div className="text-h2 sm:text-h1 font-heading font-extrabold gradient-text">
              <span ref={uptimeRef}>0</span>%
            </div>
            <div className="text-body-sm text-text-muted mt-1">Uptime SLA</div>
          </div>
          <div data-stat>
            <div className="text-h2 sm:text-h1 font-heading font-extrabold gradient-text flex items-center justify-center gap-1">
              4.9
              <Star size={24} className="text-accent fill-accent" />
            </div>
            <div className="text-body-sm text-text-muted mt-1">User Rating</div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   TESTIMONIALS
   ═══════════════════════════════════════════════════════ */
const TESTIMONIALS = [
  {
    quote: "Nini transformed how we handle leave requests. What used to take days now takes minutes. Our team loves the clean interface.",
    name: 'Sarah Chen',
    role: 'HR Director',
    company: 'TechFlow Inc',
  },
  {
    quote: "The attendance tracking is brilliant. Geo-fencing for our field teams and the real-time dashboard gives me complete visibility.",
    name: 'Marcus Williams',
    role: 'Operations Manager',
    company: 'BuildRight Co',
  },
  {
    quote: "We evaluated 5 HR tools. Nini won because of its beautiful design and how quickly our team adopted it. Zero training needed.",
    name: 'Priya Sharma',
    role: 'CEO',
    company: 'NovaStar Labs',
  },
];

function TestimonialsSection() {
  const ref = useScrollReveal({ target: '[data-testimonial]', stagger: 0.15 });

  return (
    <section ref={ref} className="py-section sm:py-section-lg bg-surface-alt/30">
      <div className="section-container">
        <div className="text-center mb-16" data-testimonial>
          <span className="text-caption font-semibold text-primary uppercase tracking-widest mb-3 block">Testimonials</span>
          <h2 className="font-heading text-h2 sm:text-h1 font-bold mb-4">
            Loved by teams worldwide
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {TESTIMONIALS.map(({ quote, name, role, company }) => (
            <div
              key={name}
              data-testimonial
              className="p-6 rounded-[16px] bg-surface border border-border hover:shadow-card-hover transition-[box-shadow,transform] duration-base"
            >
              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={16} className="text-accent fill-accent" />
                ))}
              </div>
              <blockquote className="text-body-sm text-text leading-relaxed mb-6">
                "{quote}"
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-body-sm">
                  {name.charAt(0)}
                </div>
                <div>
                  <div className="text-body-sm font-semibold text-text">{name}</div>
                  <div className="text-caption text-text-muted">{role}, {company}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   FAQ SECTION
   ═══════════════════════════════════════════════════════ */
const FAQS = [
  { q: 'Is there a free plan?', a: 'Yes! Our Starter plan is free forever for teams up to 10 employees. No credit card required.' },
  { q: 'How long does setup take?', a: 'Most teams are up and running within 5 minutes. Just sign up, invite your team, and configure your leave policies.' },
  { q: 'Can I import existing employee data?', a: 'Absolutely. We support CSV import and have integrations with major HRIS platforms for seamless data migration.' },
  { q: 'Is my data secure?', a: 'Yes. We use AES-256 encryption at rest, TLS 1.3 in transit, and are SOC 2 Type II compliant. Your data is hosted on AWS with daily backups.' },
  { q: 'Do you offer custom enterprise plans?', a: 'Yes. Contact our sales team for custom pricing, SLA guarantees, SSO, and dedicated support for organizations with 100+ employees.' },
];

function FAQSection() {
  const ref = useScrollReveal({ target: '[data-faq]', stagger: 0.1 });

  return (
    <section ref={ref} className="py-section">
      <div className="section-container max-w-3xl">
        <div className="text-center mb-16" data-faq>
          <span className="text-caption font-semibold text-primary uppercase tracking-widest mb-3 block">FAQ</span>
          <h2 className="font-heading text-h2 font-bold mb-4">
            Frequently asked questions
          </h2>
        </div>

        <div className="space-y-4">
          {FAQS.map(({ q, a }) => (
            <details
              key={q}
              data-faq
              className="group p-5 rounded-[12px] bg-surface border border-border hover:border-primary/20 transition-colors cursor-pointer"
            >
              <summary className="flex items-center justify-between text-body font-semibold text-text cursor-pointer list-none">
                {q}
                <ChevronRight size={18} className="text-text-muted group-open:rotate-90 transition-transform duration-base shrink-0 ml-4" />
              </summary>
              <p className="mt-3 text-body-sm text-text-muted leading-relaxed">
                {a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   CTA SECTION
   ═══════════════════════════════════════════════════════ */
function CTASection() {
  const ref = useScrollReveal({ target: '[data-cta-el]' });

  return (
    <section ref={ref} className="py-section">
      <div className="section-container">
        <div data-cta-el className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-primary via-primary-dark to-secondary p-12 sm:p-16 lg:p-20 text-center text-white">
          {/* Decorative blurs */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-accent/20 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
          </div>

          <div className="relative z-10">
            <h2 className="font-heading text-h2 sm:text-h1 font-extrabold mb-4 text-balance">
              Ready to simplify your HR?
            </h2>
            <p className="text-body-lg text-white/80 max-w-xl mx-auto mb-8 text-balance">
              Join 2,500+ teams already using Nini. Start free, no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-primary px-8 py-4 rounded-[12px] text-body font-bold hover:bg-white/90 transition-colors group"
              >
                Get Started Free
                <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                to="/contact"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-white/30 text-white px-8 py-4 rounded-[12px] text-body font-semibold hover:bg-white/10 transition-colors"
              >
                Talk to Sales
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════════════════════ */
export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <TrustBar />
      <FeaturesSection />
      <HowItWorksSection />
      <StatsSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
    </>
  );
}
