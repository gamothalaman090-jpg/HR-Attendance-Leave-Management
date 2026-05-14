import { useForm } from 'react-hook-form';
import { Mail, Phone, MapPin, Send, MessageSquare } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useGsap';
import { useState } from 'react';

const CONTACT_INFO = [
  { icon: Mail, label: 'Email', value: 'support@nini-hr.com', href: 'mailto:support@nini-hr.com' },
  { icon: Phone, label: 'Phone', value: '+1 (555) 123-4567', href: 'tel:+15551234567' },
  { icon: MapPin, label: 'Office', value: 'San Francisco, CA', href: '#' },
  { icon: MessageSquare, label: 'Live Chat', value: 'Available 9am–6pm PT', href: '#' },
];

export default function ContactPage() {
  const headerRef = useScrollReveal({ target: '[data-reveal]' });
  const formRef = useScrollReveal({ target: '[data-form]' });
  const [submitted, setSubmitted] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    await new Promise((r) => setTimeout(r, 800));
    setSubmitted(true);
  };

  return (
    <div>
      {/* Hero */}
      <section ref={headerRef} className="py-20 sm:py-28 bg-surface-alt/30">
        <div className="section-container text-center">
          <span data-reveal className="text-caption font-semibold text-primary uppercase tracking-widest mb-3 block">Contact</span>
          <h1 data-reveal className="font-heading text-h1 sm:text-display font-extrabold mb-6 text-balance">
            Get in <span className="gradient-text">touch</span>
          </h1>
          <p data-reveal className="text-body-lg text-text-muted max-w-2xl mx-auto text-balance">
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>
      </section>

      {/* Contact Grid */}
      <section ref={formRef} className="py-section">
        <div className="section-container">
          <div className="grid lg:grid-cols-5 gap-12 max-w-5xl mx-auto">
            {/* Info Cards */}
            <div className="lg:col-span-2 space-y-4" data-form>
              {CONTACT_INFO.map(({ icon: Icon, label, value, href }) => (
                <a
                  key={label}
                  href={href}
                  className="flex items-start gap-4 p-4 rounded-[12px] bg-surface border border-border hover:border-primary/30 hover:shadow-card-hover transition-all duration-base group"
                >
                  <div className="w-10 h-10 rounded-[10px] bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shrink-0">
                    <Icon size={20} />
                  </div>
                  <div>
                    <div className="text-body-sm font-semibold text-text">{label}</div>
                    <div className="text-body-sm text-text-muted">{value}</div>
                  </div>
                </a>
              ))}
            </div>

            {/* Form */}
            <div className="lg:col-span-3" data-form>
              {submitted ? (
                <div className="p-12 rounded-[16px] bg-surface border border-border text-center">
                  <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
                    <Send size={28} className="text-success" />
                  </div>
                  <h2 className="font-heading text-h3 font-bold mb-2">Message sent!</h2>
                  <p className="text-body text-text-muted">
                    Thanks for reaching out. We'll get back to you within 24 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="p-8 rounded-[16px] bg-surface border border-border space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="contact-name" className="block text-body-sm font-medium text-text mb-1.5">Name</label>
                      <input
                        id="contact-name"
                        {...register('name', { required: 'Name is required' })}
                        placeholder="Your name"
                        className="w-full px-4 py-3 bg-bg border border-border rounded-[8px] text-body text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      />
                      {errors.name && <p className="mt-1 text-caption text-danger">{errors.name.message}</p>}
                    </div>
                    <div>
                      <label htmlFor="contact-email" className="block text-body-sm font-medium text-text mb-1.5">Email</label>
                      <input
                        id="contact-email"
                        type="email"
                        {...register('email', { required: 'Email is required', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' } })}
                        placeholder="you@company.com"
                        className="w-full px-4 py-3 bg-bg border border-border rounded-[8px] text-body text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      />
                      {errors.email && <p className="mt-1 text-caption text-danger">{errors.email.message}</p>}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="contact-subject" className="block text-body-sm font-medium text-text mb-1.5">Subject</label>
                    <input
                      id="contact-subject"
                      {...register('subject', { required: 'Subject is required' })}
                      placeholder="How can we help?"
                      className="w-full px-4 py-3 bg-bg border border-border rounded-[8px] text-body text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                    {errors.subject && <p className="mt-1 text-caption text-danger">{errors.subject.message}</p>}
                  </div>

                  <div>
                    <label htmlFor="contact-message" className="block text-body-sm font-medium text-text mb-1.5">Message</label>
                    <textarea
                      id="contact-message"
                      rows={5}
                      {...register('message', { required: 'Message is required', minLength: { value: 10, message: 'Please provide more detail' } })}
                      placeholder="Tell us more about your needs..."
                      className="w-full px-4 py-3 bg-bg border border-border rounded-[8px] text-body text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
                    />
                    {errors.message && <p className="mt-1 text-caption text-danger">{errors.message.message}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3.5 rounded-[10px] font-semibold hover:bg-primary-light hover:shadow-glow-primary transition-all duration-base disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send size={16} />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
