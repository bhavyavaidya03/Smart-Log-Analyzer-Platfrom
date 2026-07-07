import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Search, Zap } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center hero-bg bg-grid px-4">
      <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-primary-500/5 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 text-center max-w-lg"
      >
        <div className="w-20 h-20 rounded-3xl bg-gradient-primary flex items-center justify-center mx-auto mb-8 shadow-glow-lg animate-float">
          <Zap className="w-10 h-10 text-white" />
        </div>

        <h1 className="text-8xl font-extrabold gradient-text mb-4">404</h1>
        <h2 className="text-2xl font-bold text-text-primary mb-3">Page not found</h2>
        <p className="text-text-secondary mb-8">
          The page you're looking for doesn't exist or has been moved.
          Let's get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="btn-primary btn btn-lg">
            <Home className="w-4 h-4" /> Go Home
          </Link>
          <Link to="/dashboard" className="btn-secondary btn btn-lg">
            <Search className="w-4 h-4" /> Dashboard
          </Link>
        </div>

        <div className="mt-12 glass-card p-4 inline-flex items-center gap-3 text-sm text-text-muted">
          <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
          All systems operational — the error is on our end, not yours.
        </div>
      </motion.div>
    </div>
  );
}
