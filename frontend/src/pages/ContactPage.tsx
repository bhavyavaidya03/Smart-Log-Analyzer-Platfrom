import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Mail, MessageSquare, Code2, Globe, Send, CheckCircle,
  ExternalLink, Book, Bug, Lightbulb,
  Zap,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { AppLayout } from '@/components/layout/AppLayout';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  category: string;
}

const categories = [
  { value: 'general', label: 'General Question', icon: MessageSquare },
  { value: 'bug', label: 'Bug Report', icon: Bug },
  { value: 'feature', label: 'Feature Request', icon: Lightbulb },
  { value: 'docs', label: 'Documentation', icon: Book },
];

const quickLinks = [
  {
    icon: Code2,
    title: 'GitHub Repository',
    desc: 'Browse source code, open issues, and contribute',
    href: 'https://github.com',
    color: 'text-text-primary',
    bg: 'bg-bg-elevated',
  },
  {
    icon: Book,
    title: 'Documentation',
    desc: 'Guides, API reference, and tutorials',
    href: '#',
    color: 'text-primary-400',
    bg: 'bg-primary-500/10',
  },
  {
    icon: Globe,
    title: 'Website',
    desc: 'Visit the project homepage',
    href: '#',
    color: 'text-accent',
    bg: 'bg-accent/10',
  },
];

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('general');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    defaultValues: { category: 'general' },
  });

  const onSubmit = async (_data: ContactFormData) => {
    // Simulate form submission (no backend endpoint for contact in this app)
    await new Promise(r => setTimeout(r, 1000));
    setSubmitted(true);
    toast.success('Message sent! We\'ll get back to you shortly.');
  };

  const handleReset = () => {
    setSubmitted(false);
    reset();
    setSelectedCategory('general');
  };

  return (
    <AppLayout
      breadcrumbs={[
        { label: 'Home', path: '/' },
        { label: 'Contact' },
      ]}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center mb-4 shadow-glow">
            <Mail className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Contact & Support</h1>
          <p className="text-text-secondary text-sm max-w-lg">
            Have a question, found a bug, or want to suggest a feature? We'd love to hear from you.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* ── Contact Form ──────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 }}
            className="lg:col-span-3 card"
          >
            {submitted ? (
              <div className="text-center py-12">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="w-16 h-16 rounded-2xl bg-success/10 border border-success/20 flex items-center justify-center mx-auto mb-5"
                >
                  <CheckCircle className="w-8 h-8 text-success" />
                </motion.div>
                <h2 className="text-lg font-semibold text-text-primary mb-2">Message Sent!</h2>
                <p className="text-text-muted text-sm mb-6">
                  Thanks for reaching out. We typically respond within 24–48 hours.
                </p>
                <Button variant="secondary" onClick={handleReset}>
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" id="contact-form">
                <div>
                  <h2 className="text-base font-semibold text-text-primary mb-4">Send us a message</h2>

                  {/* Category pills */}
                  <div className="mb-5">
                    <label className="label">Category</label>
                    <div className="flex flex-wrap gap-2">
                      {categories.map(({ value, label, icon: Icon }) => (
                        <button
                          key={value}
                          type="button"
                          id={`category-${value}`}
                          onClick={() => setSelectedCategory(value)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${selectedCategory === value
                            ? 'bg-primary-500 text-white shadow-glow'
                            : 'bg-bg-elevated border border-bg-border text-text-secondary hover:border-primary-500/30 hover:text-text-primary'
                            }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 mb-4">
                    <Input
                      label="Your Name"
                      id="contact-name"
                      placeholder="John Doe"
                      error={errors.name?.message}
                      {...register('name', { required: 'Name is required' })}
                    />
                    <Input
                      label="Email Address"
                      id="contact-email"
                      type="email"
                      placeholder="john@example.com"
                      error={errors.email?.message}
                      {...register('email', {
                        required: 'Email is required',
                        pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
                      })}
                    />
                  </div>

                  <div className="mb-4">
                    <Input
                      label="Subject"
                      id="contact-subject"
                      placeholder="Brief description of your inquiry"
                      error={errors.subject?.message}
                      {...register('subject', { required: 'Subject is required', minLength: { value: 5, message: 'At least 5 characters' } })}
                    />
                  </div>

                  <div>
                    <label className="label" htmlFor="contact-message">Message</label>
                    <textarea
                      id="contact-message"
                      className={`input resize-none ${errors.message ? 'input-error' : ''}`}
                      rows={5}
                      placeholder="Tell us more about your question or issue..."
                      {...register('message', {
                        required: 'Message is required',
                        minLength: { value: 20, message: 'At least 20 characters' },
                      })}
                    />
                    {errors.message && (
                      <p className="mt-1.5 text-xs text-danger-light flex items-center gap-1">
                        <span>⚠</span> {errors.message.message}
                      </p>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full justify-center"
                  loading={isSubmitting}
                  leftIcon={<Send className="w-4 h-4" />}
                >
                  Send Message
                </Button>
              </form>
            )}
          </motion.div>

          {/* ── Sidebar Info ──────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-4"
          >
            {/* Quick links */}
            <div className="card">
              <h3 className="text-sm font-semibold text-text-primary mb-3">Quick Links</h3>
              <div className="space-y-2">
                {quickLinks.map(({ icon: Icon, title, desc, href, color, bg }) => (
                  <a
                    key={title}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-bg-elevated transition-colors group"
                  >
                    <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-text-primary group-hover:text-primary-300 transition-colors">
                        {title}
                      </p>
                      <p className="text-2xs text-text-muted mt-0.5 leading-snug">{desc}</p>
                    </div>
                    <ExternalLink className="w-3 h-3 text-text-disabled flex-shrink-0" />
                  </a>
                ))}
              </div>
            </div>

            {/* Contact info */}
            <div className="card">
              <h3 className="text-sm font-semibold text-text-primary mb-3">Response Times</h3>
              <div className="space-y-2.5">
                {[
                  { label: 'General Questions', time: '24–48 hours', dot: 'bg-success' },
                  { label: 'Bug Reports', time: '12–24 hours', dot: 'bg-warning' },
                  { label: 'Critical Issues', time: '< 4 hours', dot: 'bg-danger' },
                ].map(({ label, time, dot }) => (
                  <div key={label} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${dot}`} />
                      <span className="text-text-secondary">{label}</span>
                    </div>
                    <span className="text-text-primary font-medium">{time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Built with */}
            <div className="glass-card p-4 border-primary-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-primary-400" />
                <span className="text-xs font-semibold text-primary-300">Open Source</span>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                Smart Log Analyzer is open source. You can self-host it, contribute features, or report issues directly on GitHub.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
}
