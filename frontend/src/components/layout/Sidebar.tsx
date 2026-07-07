import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Upload, FileText, BarChart3, FileBarChart,
  Settings, User, Info, Mail, ChevronLeft, ChevronRight,
  Zap, FolderOpen, LogOut, Shield,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { toast } from 'react-hot-toast';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Upload Logs', icon: Upload, path: '/upload' },
  { label: 'Log History', icon: FileText, path: '/logs' },
  { label: 'Analytics', icon: BarChart3, path: '/analytics' },
  { label: 'Reports', icon: FileBarChart, path: '/reports' },
  { label: 'Projects', icon: FolderOpen, path: '/projects' },
];

const bottomNavItems = [
  { label: 'Profile', icon: User, path: '/profile' },
  { label: 'Settings', icon: Settings, path: '/settings' },
  { label: 'About', icon: Info, path: '/about' },
  { label: 'Contact', icon: Mail, path: '/contact' },
];

export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={toggleSidebar}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: sidebarOpen ? 0 : -260 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="sidebar"
        style={{ width: 'var(--sidebar-width)' }}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-5 py-5 border-b border-bg-border">
            <NavLink to="/dashboard" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="text-sm font-bold text-text-primary">SmartLog</span>
                <span className="block text-2xs text-text-muted leading-none">Analyzer</span>
              </div>
            </NavLink>
            <button
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg hover:bg-bg-elevated text-text-muted hover:text-text-primary transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-4 overflow-y-auto no-scrollbar">
            <div className="mb-1 px-4">
              <p className="text-2xs font-semibold text-text-disabled uppercase tracking-widest mb-2">Main</p>
            </div>
            {navItems.map(({ label, icon: Icon, path }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  clsx('sidebar-item', isActive && 'active')
                }
              >
                <Icon className="w-4 h-4 sidebar-icon flex-shrink-0" />
                <span>{label}</span>
              </NavLink>
            ))}

            {user?.role === 'admin' && (
              <>
                <div className="my-3 mx-4 border-t border-bg-border" />
                <div className="mb-1 px-4">
                  <p className="text-2xs font-semibold text-text-disabled uppercase tracking-widest mb-2">Admin</p>
                </div>
                <NavLink to="/admin/users" className={({ isActive }) => clsx('sidebar-item', isActive && 'active')}>
                  <Shield className="w-4 h-4 sidebar-icon flex-shrink-0" />
                  <span>Manage Users</span>
                </NavLink>
              </>
            )}

            <div className="my-3 mx-4 border-t border-bg-border" />
            <div className="mb-1 px-4">
              <p className="text-2xs font-semibold text-text-disabled uppercase tracking-widest mb-2">Account</p>
            </div>
            {bottomNavItems.map(({ label, icon: Icon, path }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) => clsx('sidebar-item', isActive && 'active')}
              >
                <Icon className="w-4 h-4 sidebar-icon flex-shrink-0" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          {/* User profile */}
          <div className="p-4 border-t border-bg-border">
            <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-bg-elevated transition-colors">
              <div className="w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt={user.full_name} className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <span className="text-white text-sm font-semibold">
                    {user?.full_name?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{user?.full_name}</p>
                <p className="text-xs text-text-muted truncate">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg hover:bg-danger/10 text-text-muted hover:text-danger transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Collapsed toggle button */}
      <AnimatePresence>
        {!sidebarOpen && (
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            onClick={toggleSidebar}
            className="fixed left-4 top-[76px] z-40 p-2 rounded-xl bg-bg-elevated border border-bg-border text-text-secondary hover:text-text-primary hover:border-primary-500/50 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}

export default Sidebar;
