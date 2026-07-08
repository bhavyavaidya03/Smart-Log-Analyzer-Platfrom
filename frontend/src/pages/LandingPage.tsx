import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  Zap, Shield, BarChart3, Search, FileText, Upload,
  ChevronRight, ArrowRight, Menu, X,
  Terminal,
} from 'lucide-react';

// Github icon was removed from lucide-react ≥1.0. Using an inline SVG replacement.
function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.341-3.369-1.341-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.741 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
    </svg>
  );
}
import { useAuthStore } from '@/store/authStore';

const features = [
  { icon: Upload, title: 'Smart Upload', desc: 'Drag & drop .log, .txt, .csv, .json files up to 50MB. Instant parsing in seconds.', color: 'text-primary-400' },
  { icon: BarChart3, title: 'Rich Analytics', desc: 'Interactive charts showing error trends, level distributions, and activity over time.', color: 'text-accent' },
  { icon: Search, title: 'Instant Search', desc: 'Full-text search across millions of log entries with advanced filtering by level, IP, source.', color: 'text-success' },
  { icon: Shield, title: 'Secure & Private', desc: 'JWT authentication, bcrypt passwords, role-based access, and encrypted data storage.', color: 'text-warning' },
  { icon: FileText, title: 'Export Reports', desc: 'Download analysis reports as PDF or CSV with one click. Share insights with your team.', color: 'text-danger' },
  { icon: Terminal, title: 'Multi-Format Parser', desc: 'Automatically detects Apache, Nginx, JSON, Python, Syslog, and custom log formats.', color: 'text-primary-300' },
];

const stats = [
  { label: 'Log Formats Supported', value: '8+' },
  { label: 'Parse Speed', value: '10k/s' },
  { label: 'Export Formats', value: '2' },
  { label: 'API Endpoints', value: '25+' },
];

const logExamples = [
  { text: '2024-01-15 10:30:45 - api - ERROR - Database timeout after 30s', level: 'error' },
  { text: '192.168.1.1 - - [15/Jan/2024:10:30:46 -0700] "GET /health HTTP/1.1" 200 42', level: 'info' },
  { text: '{"timestamp":"2024-01-15T10:30:47Z","level":"WARNING","msg":"High memory"}', level: 'warning' },
  { text: 'Jan 15 10:30:48 server nginx[1234]: Critical: upstream timed out', level: 'critical' },
];

// AnimatedCounter kept for potential future use but not rendered currently
// (removed from JSX to clean up unused-variable warnings)

export default function LandingPage() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -50]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen bg-bg-base overflow-x-hidden">
      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-bg-border/50 bg-bg-base/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-text-primary">SmartLog<span className="text-gradient">Analyzer</span></span>
            </div>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm text-text-secondary hover:text-text-primary transition-colors animated-underline">Features</a>
              <a href="#stats" className="text-sm text-text-secondary hover:text-text-primary transition-colors animated-underline">Stats</a>
              <a href="https://github.com" target="_blank" className="text-sm text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1.5">
                <GithubIcon className="w-4 h-4" /> GitHub
              </a>
              <Link to="/login" className="text-sm text-text-secondary hover:text-text-primary transition-colors">Login</Link>
              <Link to="/register" className="btn-primary btn text-sm px-4 py-2">
                Get Started <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Mobile menu button */}
            <button className="md:hidden p-2 rounded-lg hover:bg-bg-elevated text-text-muted" onClick={() => setMobileMenuOpen(v => !v)}>
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-bg-border bg-bg-surface px-4 py-4 flex flex-col gap-3"
            >
              <a href="#features" className="text-sm text-text-secondary py-2">Features</a>
              <Link to="/login" className="text-sm text-text-secondary py-2">Login</Link>
              <Link to="/register" className="btn-primary btn text-sm justify-center">Get Started</Link>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 hero-bg bg-grid">
        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl animate-pulse-subtle" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl animate-pulse-subtle" style={{ animationDelay: '1s' }} />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 max-w-5xl mx-auto px-4 text-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-300 text-sm font-medium mb-8"
          >
            <Zap className="w-3.5 h-3.5" />
            Enterprise Log Analysis Platform
            <ChevronRight className="w-3.5 h-3.5" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-text-primary leading-tight mb-6"
          >
            Analyze Logs at{' '}
            <span className="gradient-text">Lightning Speed</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-text-secondary max-w-3xl mx-auto mb-10 leading-relaxed"
          >
            Upload, parse, search, and visualize your log files instantly. Built for developers and DevOps teams who need clarity in their systems.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Link to="/register" className="btn-primary btn btn-lg group">
              Start Analyzing Free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/login" className="btn-secondary btn btn-lg">
              Sign In
            </Link>
          </motion.div>

          {/* Live terminal preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="glass-card max-w-3xl mx-auto overflow-hidden shadow-card-hover"
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-bg-border bg-bg-surface">
              <div className="w-3 h-3 rounded-full bg-danger/70" />
              <div className="w-3 h-3 rounded-full bg-warning/70" />
              <div className="w-3 h-3 rounded-full bg-success/70" />
              <span className="ml-2 text-xs text-text-muted font-mono">smartlog-analyzer — parsed logs</span>
            </div>
            <div className="p-4 font-mono text-xs space-y-2 text-left">
              {logExamples.map((ex, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.15 }}
                  className="flex items-start gap-3"
                >
                  <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-2xs font-bold uppercase ${ex.level === 'error' ? 'bg-danger/20 text-danger-light' :
                      ex.level === 'warning' ? 'bg-warning/20 text-warning-light' :
                        ex.level === 'critical' ? 'bg-critical/20 text-critical-light' :
                          'bg-primary-500/20 text-primary-300'
                    }`}>
                    {ex.level.toUpperCase()}
                  </span>
                  <span className="text-text-secondary break-all">{ex.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Stats ────────────────────────────────────────────────────────── */}
      <section id="stats" className="py-20 border-y border-bg-border bg-bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl font-extrabold gradient-text mb-2">{stat.value}</div>
                <div className="text-sm text-text-secondary">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-text-primary mb-4">
              Everything you need to{' '}
              <span className="gradient-text">understand your logs</span>
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              From upload to insight in seconds. No configuration needed.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc, color }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="glass-card-hover p-6 group"
              >
                <div className={`w-11 h-11 rounded-xl bg-current/10 flex items-center justify-center mb-4 ${color} group-hover:scale-110 transition-transform`}
                  style={{ background: 'rgba(99,102,241,0.1)' }}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <h3 className="text-base font-semibold text-text-primary mb-2">{title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-card p-12 gradient-border"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-6 shadow-glow-lg animate-float">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-text-primary mb-4">
              Ready to analyze your logs?
            </h2>
            <p className="text-text-secondary mb-8">
              Get started for free. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/register" className="btn-primary btn btn-lg">
                Create Free Account <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="https://github.com" target="_blank" className="btn-secondary btn btn-lg">
                <GithubIcon className="w-4 h-4" /> View on GitHub
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-bg-border py-12 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-primary flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-semibold text-text-secondary">Smart Log Analyzer</span>
          </div>
          <p className="text-sm text-text-muted">
            © 2024 Smart Log Analyzer. Built with FastAPI & React.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/about" className="text-sm text-text-muted hover:text-text-secondary transition-colors">About</Link>
            <Link to="/contact" className="text-sm text-text-muted hover:text-text-secondary transition-colors">Contact</Link>
            <a href="https://github.com" className="text-sm text-text-muted hover:text-text-secondary transition-colors"><GithubIcon className="w-4 h-4" /></a>
          </div>
        </div>
      </footer>
    </div>
  );
}
