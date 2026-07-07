import type { LogLevel } from '@/types';
import clsx from 'clsx';

interface BadgeProps {
  level?: LogLevel | string;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default';
  children?: React.ReactNode;
  className?: string;
}

const levelClasses: Record<string, string> = {
  DEBUG: 'badge-debug',
  INFO: 'badge-info',
  WARNING: 'badge-warning',
  ERROR: 'badge-error',
  CRITICAL: 'badge-critical',
  UNKNOWN: 'badge-unknown',
};

const levelDots: Record<string, string> = {
  DEBUG: 'bg-slate-400',
  INFO: 'bg-primary-400',
  WARNING: 'bg-warning',
  ERROR: 'bg-danger',
  CRITICAL: 'bg-critical',
  UNKNOWN: 'bg-slate-500',
};

export function Badge({ level, variant, children, className }: BadgeProps) {
  if (level) {
    const upper = level.toUpperCase();
    return (
      <span className={clsx(levelClasses[upper] || 'badge-unknown', className)}>
        <span className={clsx('w-1.5 h-1.5 rounded-full', levelDots[upper] || 'bg-slate-500')} />
        {upper}
      </span>
    );
  }

  const variantClasses = {
    success: 'badge-success',
    warning: 'badge-warning',
    error: 'badge-error',
    info: 'badge-info',
    default: 'badge-unknown',
  };

  return (
    <span className={clsx('badge', variantClasses[variant || 'default'], className)}>
      {children}
    </span>
  );
}

export default Badge;
