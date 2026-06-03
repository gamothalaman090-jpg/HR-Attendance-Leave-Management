import Meta from '@/components/common/Meta';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, Eye, HelpCircle } from 'lucide-react';
import { useGsap } from '@/hooks/useGsap';

export default function PrivacyPolicyPage() {
  const containerRef = useGsap((gsap, el) => {
    gsap.fromTo(el.querySelectorAll('[data-anim]'),
      { y: 15, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: 'power3.out', clearProps: 'all' }
    );
  });

  return (
    <div ref={containerRef} className="min-h-screen bg-bg pt-24 pb-16">
      <Meta 
        title="Privacy Policy" 
        description="Read the privacy practices and information security details of Nini HR platform."
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
            <Shield size={28} />
            <span className="text-caption font-bold uppercase tracking-widest">Privacy</span>
          </div>
          <h1 className="font-heading text-h1 font-extrabold text-text mb-3">Privacy Policy</h1>
          <p className="text-body text-text-muted">Last Updated: June 3, 2026</p>
        </div>

        {/* Content */}
        <div className="space-y-8 text-text leading-relaxed">
          
          <section data-anim className="space-y-3">
            <h2 className="font-heading text-h3 font-bold text-text flex items-center gap-2">
              <span className="text-primary">1.</span> Information We Collect
            </h2>
            <p className="text-body text-text-muted">
              We collect information that you directly provide to us and data from Google authentication when you sign in. This includes:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-body text-text-muted">
              <li>
                <strong>Google Account Information:</strong> Google ID (providerId), full name, email address, and profile picture.
              </li>
              <li>
                <strong>Workspace Information:</strong> Company name, department details, position/title, and employee rosters.
              </li>
              <li>
                <strong>Activity Logs:</strong> Leave requests, check-in/check-out timestamps (attendance), IP addresses, and page interaction audits.
              </li>
            </ul>
          </section>

          <section data-anim className="space-y-3">
            <h2 className="font-heading text-h3 font-bold text-text flex items-center gap-2">
              <span className="text-primary">2.</span> How We Use Your Information
            </h2>
            <p className="text-body text-text-muted">
              We use the collected information to operate, maintain, and improve our Service. Specifically, we use it to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-body text-text-muted">
              <li>Enable secure authentication and user provisioning via Google OAuth.</li>
              <li>Track daily attendance, overtime, and leave schedules for your company.</li>
              <li>Send email alerts regarding leave request approvals and system announcements.</li>
              <li>Maintain audit logs for security, system health checks, and compliance reviews.</li>
            </ul>
          </section>

          <section data-anim className="space-y-3">
            <h2 className="font-heading text-h3 font-bold text-text flex items-center gap-2">
              <span className="text-primary">3.</span> Data Protection &amp; Encryption
            </h2>
            <p className="text-body text-text-muted">
              We prioritize data security and utilize standard security controls to prevent unauthorized access or disclosure:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-body text-text-muted flex flex-col">
              <li className="flex items-start gap-2">
                <Lock size={16} className="text-success shrink-0 mt-1" />
                <span><strong>Encryption:</strong> All data is encrypted in transit using TLS 1.3 and at rest using AES-256 databases.</span>
              </li>
              <li className="flex items-start gap-2">
                <Eye size={16} className="text-success shrink-0 mt-1" />
                <span><strong>No Passwords Stored in Plaintext:</strong> Any custom passwords set during registration are securely hashed before storing.</span>
              </li>
            </ul>
          </section>

          <section data-anim className="space-y-3">
            <h2 className="font-heading text-h3 font-bold text-text flex items-center gap-2">
              <span className="text-primary">4.</span> Sharing of Information
            </h2>
            <p className="text-body text-text-muted">
              We do not sell, rent, or trade your personal data or company roster data to third parties. We may share information 
              with third-party service providers (such as hosting, email delivery, and database backups) who are strictly bound by 
              confidentiality obligations. We may disclose data if required by law or a valid government subpoena.
            </p>
          </section>

          <section data-anim className="space-y-3">
            <h2 className="font-heading text-h3 font-bold text-text flex items-center gap-2">
              <span className="text-primary">5.</span> Your Rights and Data Deletion
            </h2>
            <p className="text-body text-text-muted">
              As an Admin, you can update profile details, delete employee records, or close your company workspace. If you wish to 
              permanently purge all data associated with your company, please submit a formal deletion request. Once processed, 
              this action is irreversible.
            </p>
          </section>

          <section data-anim className="mt-12 p-5 rounded-[12px] bg-surface-alt border border-border flex items-start gap-4">
            <HelpCircle className="text-primary shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="text-body font-bold text-text mb-1">Privacy Concerns?</h3>
              <p className="text-body-sm text-text-muted">
                Contact our privacy compliance team at <a href="mailto:privacy@nini-hr.com" className="text-primary hover:underline">privacy@nini-hr.com</a> if you have any questions.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
