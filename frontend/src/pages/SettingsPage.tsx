import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings, Moon, Sun, Bell, Shield, Trash2,
  Monitor, LogOut, AlertTriangle, Check,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { AppLayout } from '@/components/layout/AppLayout';
import Button from '@/components/ui/Button';
import { useNavigate } from 'react-router-dom';

interface ToggleSwitchProps {
  enabled: boolean;
  onToggle: () => void;
  id: string;
}

function ToggleSwitch({ enabled, onToggle, id }: ToggleSwitchProps) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={enabled}
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-bg-base ${
        enabled ? 'bg-primary-500' : 'bg-bg-border'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

interface SettingRowProps {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
  iconColor?: string;
}

function SettingRow({ icon: Icon, title, description, children, iconColor = 'text-primary-400' }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-bg-elevated flex items-center justify-center flex-shrink-0">
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-text-primary">{title}</p>
          <p className="text-xs text-text-muted mt-0.5">{description}</p>
        </div>
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const { theme, setTheme } = useUIStore();
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  // Local UI-only prefs
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [showParseErrors, setShowParseErrors] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(true);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const isDark = theme === 'dark';

  const handleThemeToggle = () => {
    const next = isDark ? 'light' : 'dark';
    setTheme(next);
    toast.success(`Switched to ${next} mode`);
  };

  const handleLogoutAll = () => {
    logout();
    toast.success('Logged out from all devices');
    navigate('/login');
  };

  const handleDeleteAccount = () => {
    // UI-only: In a real implementation, call the backend
    toast.error('Account deletion requires contacting support. Feature coming soon.', {
      duration: 5000,
    });
    setDeletingAccount(false);
  };

  return (
    <AppLayout
      breadcrumbs={[
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Settings' },
      ]}
    >
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
          <p className="text-text-secondary text-sm mt-0.5">
            Manage your preferences and account settings
          </p>
        </div>

        {/* ── Appearance ────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card mb-5"
        >
          <div className="flex items-center gap-2 mb-1">
            <Monitor className="w-4 h-4 text-primary-400" />
            <h2 className="text-sm font-semibold text-text-primary">Appearance</h2>
          </div>
          <p className="text-xs text-text-muted mb-4">Customize how the interface looks</p>
          <div className="divide-y divide-bg-border">
            <SettingRow
              icon={isDark ? Moon : Sun}
              title="Dark Mode"
              description="Switch between dark and light interface theme"
              iconColor={isDark ? 'text-primary-400' : 'text-warning'}
            >
              <ToggleSwitch
                id="settings-dark-mode"
                enabled={isDark}
                onToggle={handleThemeToggle}
              />
            </SettingRow>
          </div>
        </motion.div>

        {/* ── Notifications ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="card mb-5"
        >
          <div className="flex items-center gap-2 mb-1">
            <Bell className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-semibold text-text-primary">Notifications</h2>
          </div>
          <p className="text-xs text-text-muted mb-4">Choose what alerts you receive</p>
          <div className="divide-y divide-bg-border">
            <SettingRow
              icon={Bell}
              title="Email Notifications"
              description="Receive email alerts for upload completion and errors"
              iconColor="text-accent"
            >
              <ToggleSwitch
                id="settings-email-notif"
                enabled={emailNotifications}
                onToggle={() => {
                  setEmailNotifications(v => !v);
                  toast.success('Preference saved');
                }}
              />
            </SettingRow>
            <SettingRow
              icon={AlertTriangle}
              title="Show Parse Errors"
              description="Display warnings when log lines fail to parse"
              iconColor="text-warning"
            >
              <ToggleSwitch
                id="settings-parse-errors"
                enabled={showParseErrors}
                onToggle={() => {
                  setShowParseErrors(v => !v);
                  toast.success('Preference saved');
                }}
              />
            </SettingRow>
          </div>
        </motion.div>

        {/* ── Dashboard Behaviour ───────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card mb-5"
        >
          <div className="flex items-center gap-2 mb-1">
            <Settings className="w-4 h-4 text-success" />
            <h2 className="text-sm font-semibold text-text-primary">Behaviour</h2>
          </div>
          <p className="text-xs text-text-muted mb-4">Control how the app behaves</p>
          <div className="divide-y divide-bg-border">
            <SettingRow
              icon={Check}
              title="Auto-refresh Dashboard"
              description="Automatically refresh dashboard stats every 30 seconds"
              iconColor="text-success"
            >
              <ToggleSwitch
                id="settings-auto-refresh"
                enabled={autoRefresh}
                onToggle={() => {
                  setAutoRefresh(v => !v);
                  toast.success('Preference saved');
                }}
              />
            </SettingRow>
            <SettingRow
              icon={Shield}
              title="Confirm Before Delete"
              description="Show confirmation dialog before deleting log files or projects"
              iconColor="text-primary-400"
            >
              <ToggleSwitch
                id="settings-confirm-delete"
                enabled={confirmDelete}
                onToggle={() => {
                  setConfirmDelete(v => !v);
                  toast.success('Preference saved');
                }}
              />
            </SettingRow>
          </div>
        </motion.div>

        {/* ── Security ──────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="card mb-5"
        >
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-warning" />
            <h2 className="text-sm font-semibold text-text-primary">Security</h2>
          </div>
          <p className="text-xs text-text-muted mb-4">Manage your active sessions</p>
          <div className="divide-y divide-bg-border">
            <SettingRow
              icon={LogOut}
              title="Sign Out All Devices"
              description="Invalidate all sessions and log out everywhere"
              iconColor="text-warning"
            >
              <Button
                variant="secondary"
                size="sm"
                onClick={handleLogoutAll}
                leftIcon={<LogOut className="w-3.5 h-3.5" />}
              >
                Sign Out All
              </Button>
            </SettingRow>
          </div>
        </motion.div>

        {/* ── Danger Zone ───────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card border-danger/20"
        >
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-danger" />
            <h2 className="text-sm font-semibold text-danger">Danger Zone</h2>
          </div>
          <p className="text-xs text-text-muted mb-4">Irreversible actions — proceed with caution</p>
          <div className="divide-y divide-bg-border">
            <SettingRow
              icon={Trash2}
              title="Delete Account"
              description="Permanently delete your account and all associated data"
              iconColor="text-danger"
            >
              {deletingAccount ? (
                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setDeletingAccount(false)}>
                    Cancel
                  </Button>
                  <Button variant="danger" size="sm" onClick={handleDeleteAccount}>
                    Confirm Delete
                  </Button>
                </div>
              ) : (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setDeletingAccount(true)}
                  leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                >
                  Delete Account
                </Button>
              )}
            </SettingRow>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
