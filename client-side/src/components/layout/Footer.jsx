import { Link } from 'react-router-dom';
import { BRAND, NAV_LINKS } from '@/utils/constants';
import { Heart, Code2, AtSign, Briefcase, Mail } from 'lucide-react';

/**
 * Footer — 4-column layout with newsletter, social links, and legal.
 */
const FOOTER_LINKS = {
  Product: [
    { label: 'Features', href: '/features' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Integrations', href: '#' },
    { label: 'Changelog', href: '#' },
    { label: 'Roadmap', href: '#' },
  ],
  Company: [
    { label: 'About', href: '#' },
    { label: 'Blog', href: '#' },
    { label: 'Careers', href: '#' },
    { label: 'Contact', href: '/contact' },
    { label: 'Press Kit', href: '#' },
  ],
  Resources: [
    { label: 'Documentation', href: '#' },
    { label: 'Help Center', href: '#' },
    { label: 'API Reference', href: '#' },
    { label: 'Community', href: '#' },
    { label: 'Status', href: '#' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Cookie Policy', href: '#' },
    { label: 'GDPR', href: '#' },
  ],
};

const SOCIALS = [
  { icon: AtSign, href: '#', label: 'Twitter' },
  { icon: Code2, href: '#', label: 'GitHub' },
  { icon: Briefcase, href: '#', label: 'LinkedIn' },
  { icon: Mail, href: `mailto:${BRAND.supportEmail}`, label: 'Email' },
];

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      {/* Newsletter Banner */}
      <div className="section-container py-12 border-b border-border">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-heading text-h3 font-bold text-text mb-1">
              Stay in the loop
            </h3>
            <p className="text-body-sm text-text-muted">
              Get product updates, HR tips, and company news delivered to your inbox.
            </p>
          </div>
          <form
            className="flex w-full md:w-auto gap-2"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 md:w-64 px-4 py-2.5 bg-bg border border-border rounded-[8px] text-body-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-primary text-white rounded-[10px] text-body-sm font-semibold hover:bg-primary-light hover:shadow-glow-primary transition-all duration-base cursor-pointer shrink-0"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>

      {/* Links Grid */}
      <div className="section-container py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="font-heading text-h4 font-extrabold gradient-text">
              {BRAND.name}
            </Link>
            <p className="text-body-sm text-text-muted mt-3 leading-relaxed">
              {BRAND.description}
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-2 mt-5">
              {SOCIALS.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  className="p-2 rounded-[8px] text-text-muted hover:text-text hover:bg-surface-alt transition-colors"
                  aria-label={label}
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-body-sm font-semibold text-text mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      to={href}
                      className="text-body-sm text-text-muted hover:text-text transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="section-container py-6 border-t border-border">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-caption text-text-muted">
          <p>© {new Date().getFullYear()} {BRAND.name}. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Made with <Heart size={12} className="text-danger fill-danger" /> for modern teams
          </p>
        </div>
      </div>
    </footer>
  );
}
