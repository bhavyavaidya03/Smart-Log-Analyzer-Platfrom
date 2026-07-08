import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Sun, Moon, Menu, ChevronDown, LogOut, Settings, User,
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { toast } from 'react-hot-toast';
import clsx from 'clsx';

interface NavbarProps {
  title?: string;
  breadcrumbs?: { label: string; path?: string }[];
}

export function Navbar({ title, breadcrumbs }: NavbarProps) {
  const { user, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar, theme, setTheme } = useUIStore();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <header
      className="navbar"
      style={{ left: sidebarOpen ? 'var(--sidebar-width)' : '0', right: 0 }}
    >
      {/* Left: Menu + Breadcrumb */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-xl hover:bg-bg-elevated text-text-muted hover:text-text-primary transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="breadcrumb hidden sm:flex">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-2">
                {i > 0 && <span className="breadcrumb-sep">/</span>}
                {crumb.path ? (
                  <Link to={crumb.path} className="breadcrumb-item">{crumb.label}</Link>
                ) : (
                  <span className={clsx('breadcrumb-item', !crumb.path && 'active')}>{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        {title && !breadcrumbs && (
          <h1 className="text-base font-semibold text-text-primary">{title}</h1>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl hover:bg-bg-elevated text-text-muted hover:text-text-primary transition-colors"
          title="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <button className="p-2 rounded-xl hover:bg-bg-elevated text-text-muted hover:text-text-primary transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary-500 rounded-full" />
        </button>

        {/* Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-bg-elevated transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={user.full_name} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <span className="text-white text-xs font-bold">
                  {user?.full_name?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-medium text-text-primary leading-tight">{user?.full_name}</p>
              <p className="text-2xs text-text-muted leading-tight capitalize">{user?.role}</p>
            </div>
            <ChevronDown className={clsx('w-3 h-3 text-text-muted transition-transform', dropdownOpen && 'rotate-180')} />
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-52 glass-card shadow-card-hover z-50 overflow-hidden"
                >
                  <div className="p-3 border-b border-bg-border">
                    <p className="text-sm font-medium text-text-primary">{user?.full_name}</p>
                    <p className="text-xs text-text-muted">{user?.email}</p>
                  </div>
                  <div className="p-1">
                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
                    >
                      <User className="w-4 h-4" /> Profile
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
                    >
                      <Settings className="w-4 h-4" /> Settings
                    </Link>
                    <div className="my-1 border-t border-bg-border" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-danger hover:bg-danger/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
