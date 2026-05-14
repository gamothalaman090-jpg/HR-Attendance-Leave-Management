import { Link } from 'react-router-dom';
import { PRICING_TIERS } from '@/utils/constants';
import { cn } from '@/utils/helpers';
import { CheckCircle, ArrowRight, HelpCircle } from 'lucide-react';
import { useGsap, useScrollReveal } from '@/hooks/useGsap';

export default function PricingPage() {
  const headerRef = useScrollReveal({ target: '[data-reveal]' });
  const cardsRef = useGsap((gsap, el) => {
    const cards = el.querySelectorAll('[data-card]');
    if (cards.length) {
      gsap.fromTo(cards, 
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.15, ease: 'power3.out', delay: 0.2, clearProps: 'all' }
      );
    }
  });
  const faqRef = useScrollReveal({ target: '[data-faq]', stagger: 0.1 });

  return (
    <div>
      {/* Hero */}
      <section ref={headerRef} className="py-20 sm:py-28 bg-surface-alt/30">
        <div className="section-container text-center">
          <span data-reveal className="text-caption font-semibold text-primary uppercase tracking-widest mb-3 block">Pricing</span>
          <h1 data-reveal className="font-heading text-h1 sm:text-display font-extrabold mb-6 text-balance">
            Simple, transparent{' '}
            <span className="gradient-text">pricing</span>
          </h1>
          <p data-reveal className="text-body-lg text-text-muted max-w-2xl mx-auto text-balance">
            Start free. Scale as you grow. No hidden fees, no surprises.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section ref={cardsRef} className="py-section -mt-10">
        <div className="section-container">
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
            {PRICING_TIERS.map((tier) => (
              <div
                key={tier.name}
                data-card
                className={cn(
                  'relative flex flex-col p-8 rounded-[20px] border transition-[border-color,box-shadow,transform,scale] duration-base',
                  tier.highlighted
                    ? 'border-primary bg-surface shadow-glow-primary scale-[1.02] lg:scale-105'
                    : 'border-border bg-surface hover:border-primary/30 hover:shadow-card-hover'
                )}
              >
                {tier.highlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary text-white text-caption font-bold px-4 py-1 rounded-pill">
                    Most Popular
                  </div>
                )}

                <h3 className="font-heading text-h3 font-bold mb-1">{tier.name}</h3>
                <p className="text-body-sm text-text-muted mb-6">{tier.description}</p>

                <div className="mb-8">
                  {tier.price === null ? (
                    <div className="text-h1 font-heading font-extrabold">Custom</div>
                  ) : tier.price === 0 ? (
                    <div className="text-h1 font-heading font-extrabold">Free</div>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-h1 font-heading font-extrabold">${tier.price}</span>
                      <span className="text-body-sm text-text-muted">/{tier.period}</span>
                    </div>
                  )}
                </div>

                <ul className="flex-1 space-y-3 mb-8">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-body-sm">
                      <CheckCircle size={18} className="text-success shrink-0 mt-0.5" />
                      <span className="text-text">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to={tier.price === null ? '/contact' : '/signup'}
                  className={cn(
                    'text-center py-3.5 rounded-[10px] font-semibold text-body-sm transition-all duration-base block',
                    tier.highlighted
                      ? 'bg-primary text-white hover:bg-primary-light hover:shadow-glow-primary'
                      : 'border border-border text-text hover:bg-surface-alt'
                  )}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section ref={faqRef} className="py-section bg-surface-alt/30">
        <div className="section-container max-w-3xl">
          <div className="text-center mb-12" data-faq>
            <h2 className="font-heading text-h2 font-bold mb-4">Pricing FAQ</h2>
          </div>
          <div className="space-y-4">
            {[
              { q: 'Can I switch plans later?', a: 'Yes! You can upgrade or downgrade at any time. Changes take effect at the start of your next billing cycle.' },
              { q: 'Is there a long-term contract?', a: 'No contracts. All plans are month-to-month, and you can cancel anytime with no penalties.' },
              { q: 'What payment methods do you accept?', a: 'We accept all major credit cards (Visa, Mastercard, Amex) and can set up invoicing for Enterprise customers.' },
              { q: 'Do you offer discounts for nonprofits?', a: 'Yes! We offer 50% off for verified nonprofits and educational institutions. Contact us for details.' },
            ].map(({ q, a }) => (
              <details key={q} data-faq className="group p-5 rounded-[12px] bg-surface border border-border cursor-pointer">
                <summary className="flex items-center justify-between text-body font-semibold text-text cursor-pointer list-none">
                  {q}
                  <HelpCircle size={18} className="text-text-muted shrink-0 ml-4 group-open:text-primary transition-colors" />
                </summary>
                <p className="mt-3 text-body-sm text-text-muted leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-section">
        <div className="section-container text-center">
          <h2 className="font-heading text-h2 font-bold mb-4">Still have questions?</h2>
          <p className="text-body-lg text-text-muted mb-8">
            Our team is happy to help you find the right plan.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-[12px] text-body font-semibold hover:bg-primary-light hover:shadow-glow-primary transition-all group"
          >
            Contact Sales
            <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </section>
    </div>
  );
}
