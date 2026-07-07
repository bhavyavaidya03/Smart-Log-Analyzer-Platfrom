import { motion } from 'framer-motion';
import { Zap, Github, Shield, Code2, BarChart3, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';

const features = [
  { icon: Shield, title: 'Security First', desc: 'JWT auth, bcrypt passwords, OTP verification, and role-based access control.' },
  { icon: BarChart3, title: 'Rich Analytics', desc: 'Interactive charts and dashboards built with Recharts for deep log insights.' },
  { icon: Code2, title: 'Clean Architecture', desc: 'FastAPI backend with clean separation of API, service, and repository layers.' },
  { icon: Globe, title: 'Multi-Format', desc: 'Automatic detection of 8+ log formats including Apache, JSON, Syslog, and Python.' },
];

export default function AboutPage() {
  return (
    <AppLayout breadcrumbs={[{ label: 'Home', path: '/' }, { label: 'About' }]}>
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-12">
            <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-4 shadow-glow animate-float">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-text-primary mb-3">About Smart Log Analyzer</h1>
            <p className="text-text-secondary text-lg leading-relaxed">
              An enterprise-grade log analysis platform built for developers and DevOps teams who need powerful insights from their application logs — without the complexity.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-12">
            {features.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="glass-card p-5"
              >
                <div className="w-9 h-9 rounded-xl bg-primary-500/10 flex items-center justify-center mb-3">
                  <Icon className="w-4 h-4 text-primary-400" />
                </div>
                <h3 className="text-sm font-semibold text-text-primary mb-1">{title}</h3>
                <p className="text-xs text-text-secondary leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-text-primary mb-3">Tech Stack</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Backend', 'Python 3.13 · FastAPI · SQLAlchemy · PostgreSQL · Alembic'],
                ['Frontend', 'React 18 · TypeScript · Vite · Tailwind CSS · Framer Motion'],
                ['Auth', 'JWT · bcrypt · OTP verification · RBAC'],
                ['Analytics', 'Recharts · React Query · Pandas'],
                ['Infrastructure', 'Docker · Docker Compose · Nginx'],
                ['Testing', 'Pytest · HTTPx · React Testing Library'],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-text-muted text-xs mb-0.5">{label}</p>
                  <p className="text-text-primary">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mt-8">
            <a
              href="https://github.com"
              target="_blank"
              className="btn-secondary btn btn-lg inline-flex"
            >
              <Github className="w-4 h-4" /> View Source on GitHub
            </a>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
