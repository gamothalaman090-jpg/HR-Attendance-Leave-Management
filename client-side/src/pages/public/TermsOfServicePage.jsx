import Meta from '@/components/common/Meta';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, ShieldAlert, Scale, HelpCircle } from 'lucide-react';
import { useGsap } from '@/hooks/useGsap';

export default function TermsOfServicePage() {
  const containerRef = useGsap((gsap, el) => {
    gsap.fromTo(el.querySelectorAll('[data-anim]'),
      { y: 15, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: 'power3.out', clearProps: 'all' }
    );
  });

  return (
    <div ref={containerRef} className="min-h-screen bg-bg pt-24 pb-16">
      <Meta 
        title="Terms of Service" 
        description="Read the terms and conditions for using Nini HR Management platform."
      />

      <div className="section-container max-w-4xl mx-auto px-4">
        {/* Back Link */}
        <div data-anim className="mb-6">
          <Link 
            to="/signup" 
            className="inline-flex items-center gap-2 text-body-sm font-medium text-primary hover:text-primary-light transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Sign Up
          </Link>
        </div>

        {/* Header */}
        <div data-anim className="border-b border-border pb-8 mb-8">
          <div className="flex items-center gap-3 text-primary mb-3">
            <Scale size={28} />
            <span className="text-caption font-bold uppercase tracking-widest">Legal</span>
          </div>
          <h1 className="font-heading text-h1 font-extrabold text-text mb-3">Terms of Service</h1>
          <p className="text-body text-text-muted">Last Updated: June 3, 2026</p>
        </div>

        {/* Content Grid/List */}
        <div className="space-y-8 text-text leading-relaxed">
          
          <section data-anim className="space-y-3">
            <h2 className="font-heading text-h3 font-bold text-text flex items-center gap-2">
              <span className="text-primary">1.</span> Acceptance of Terms
            </h2>
            <p className="text-body text-text-muted">
              By accessing, registering for, or using the Nini HR Attendance and Leave Management application (&quot;Service&quot;), 
              you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you are entering into these Terms on behalf of a company 
              or other legal entity, you represent that you have the authority to bind such entity. If you do not agree, do not use the Service.
            </p>
          </section>

          <section data-anim className="space-y-3">
            <h2 className="font-heading text-h3 font-bold text-text flex items-center gap-2">
              <span className="text-primary">2.</span> Account Registration &amp; Google Auth
            </h2>
            <p className="text-body text-text-muted">
              To use the Service, you must authenticate using a verified Google account. You agree to provide accurate and complete 
              information during the onboarding process and to update such information. You are solely responsible for maintaining 
              the confidentiality of your Google account credentials and for all activities that occur under your Nini account.
            </p>
          </section>

          <section data-anim className="space-y-3">
            <h2 className="font-heading text-h3 font-bold text-text flex items-center gap-2">
              <span className="text-primary">3.</span> Use of the Service &amp; Restrictions
            </h2>
            <p className="text-body text-text-muted">
              You agree to use the Service in compliance with all applicable local, state, national, and international laws. 
              You shall not:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-body text-text-muted">
              <li>Resell, duplicate, or exploit any portion of the Service without express written permission.</li>
              <li>Use the Service to transmit any worms, viruses, or any code of a destructive nature.</li>
              <li>Exceed your tier limits (e.g. attempting to add more than 10 employees on the free Starter plan).</li>
              <li>Bypass or attempt to bypass security measures or access levels.</li>
            </ul>
          </section>

          <section data-anim className="space-y-3">
            <h2 className="font-heading text-h3 font-bold text-text flex items-center gap-2">
              <span className="text-primary">4.</span> Termination of Service
            </h2>
            <p className="text-body text-text-muted">
              We reserve the right to suspend or terminate your account and refuse any current or future use of the Service for 
              reasons including, but not limited to, breach of these Terms, non-payment, or inactivity. Upon termination, 
              your right to use the Service immediately ceases, and we may delete your historical attendance, leave, and announcement data.
            </p>
          </section>

          <section data-anim className="space-y-3">
            <h2 className="font-heading text-h3 font-bold text-text flex items-center gap-2">
              <span className="text-primary">5.</span> Disclaimer of Warranties
            </h2>
            <p className="text-body text-text-muted">
              The Service is provided on an &quot;as is&quot; and &quot;as available&quot; basis. Nini makes no warranty that the Service will 
              meet your requirements, be uninterrupted, timely, secure, or error-free. Any reliance you place on the attendance sheets, 
              leave calculations, and payroll-ready data is at your own risk.
            </p>
          </section>

          <section data-anim className="space-y-3">
            <h2 className="font-heading text-h3 font-bold text-text flex items-center gap-2">
              <span className="text-primary">6.</span> Modifications to Service and Prices
            </h2>
            <p className="text-body text-text-muted">
              Nini reserves the right at any time to modify or discontinue, temporarily or permanently, the Service (or any part thereof) 
              with or or without notice. Prices of all Services, including but not limited to monthly subscription plan fees, 
              are subject to change upon 30 days notice from us.
            </p>
          </section>

          <section data-anim className="mt-12 p-5 rounded-[12px] bg-surface-alt border border-border flex items-start gap-4">
            <HelpCircle className="text-primary shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="text-body font-bold text-text mb-1">Questions about our Terms?</h3>
              <p className="text-body-sm text-text-muted">
                Please contact our legal team at <a href="mailto:legal@nini-hr.com" className="text-primary hover:underline">legal@nini-hr.com</a> for clarifications.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
