import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { User, Mail, AtSign, Camera, Lock, Eye, EyeOff, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { usersApi, authApi } from '@/api';
import { AppLayout } from '@/components/layout/AppLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useAuthStore } from '@/store/authStore';
import { format } from 'date-fns';

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [showPwd, setShowPwd] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm({
    defaultValues: {
      full_name: user?.full_name || '',
      username: user?.username || '',
      bio: user?.bio || '',
    },
  });

  const { register: regPwd, handleSubmit: handlePwdSubmit, reset: resetPwd, watch, formState: { errors: pwdErrors } } = useForm<{
    current_password: string; new_password: string; confirm_password: string;
  }>();
  const newPwd = watch('new_password');

  const updateMutation = useMutation({
    mutationFn: (data: any) => usersApi.updateProfile(data),
    onSuccess: (res) => {
      updateUser(res.data.data);
      toast.success('Profile updated successfully');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Update failed'),
  });

  const passwordMutation = useMutation({
    mutationFn: (data: any) => authApi.changePassword(data),
    onSuccess: () => {
      toast.success('Password changed successfully');
      resetPwd();
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to change password'),
  });

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await usersApi.uploadAvatar(formData);
      updateUser(res.data.data);
      toast.success('Avatar updated!');
    } catch {
      toast.error('Failed to upload avatar');
    } finally {
      setAvatarLoading(false);
    }
  };

  return (
    <AppLayout breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Profile' }]}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary">Profile</h1>
          <p className="text-text-secondary text-sm mt-0.5">Manage your personal information</p>
        </div>

        {/* Avatar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card mb-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-primary flex items-center justify-center overflow-hidden">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-white">
                    {user?.full_name?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <label
                htmlFor="avatar-input"
                className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-primary-500 flex items-center justify-center cursor-pointer hover:bg-primary-400 transition-colors shadow-glow ${avatarLoading ? 'opacity-50 cursor-wait' : ''}`}
              >
                <Camera className="w-3.5 h-3.5 text-white" />
              </label>
              <input
                id="avatar-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
                disabled={avatarLoading}
              />
            </div>
            <div>
              <p className="text-lg font-semibold text-text-primary">{user?.full_name}</p>
              <p className="text-text-muted text-sm">@{user?.username}</p>
              <p className="text-text-muted text-xs mt-0.5 capitalize">
                {user?.role} · Member since {user ? format(new Date(user.created_at), 'MMM yyyy') : ''}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Profile form */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card mb-6">
          <h2 className="text-base font-semibold text-text-primary mb-4">Personal Information</h2>
          <form onSubmit={handleSubmit(d => updateMutation.mutate(d))} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              id="profile-fullname"
              leftIcon={<User className="w-4 h-4" />}
              error={errors.full_name?.message}
              {...register('full_name', { required: 'Full name is required' })}
            />
            <Input
              label="Username"
              type="text"
              id="profile-username"
              leftIcon={<AtSign className="w-4 h-4" />}
              error={errors.username?.message}
              {...register('username', { required: 'Username is required' })}
            />
            <div>
              <label className="label">Email Address</label>
              <div className="input flex items-center gap-2 opacity-60 cursor-not-allowed">
                <Mail className="w-4 h-4 text-text-muted" />
                <span className="text-sm text-text-muted">{user?.email}</span>
              </div>
              <p className="text-xs text-text-muted mt-1">Email cannot be changed</p>
            </div>
            <div>
              <label className="label">Bio</label>
              <textarea
                className="input resize-none"
                rows={3}
                placeholder="Tell us about yourself..."
                id="profile-bio"
                {...register('bio')}
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              loading={updateMutation.isPending}
              disabled={!isDirty}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Changes
            </Button>
          </form>
        </motion.div>

        {/* Change password */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card">
          <h2 className="text-base font-semibold text-text-primary mb-4">Change Password</h2>
          <form onSubmit={handlePwdSubmit(d => passwordMutation.mutate(d))} className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              id="current-pwd"
              leftIcon={<Lock className="w-4 h-4" />}
              error={pwdErrors.current_password?.message}
              {...regPwd('current_password', { required: 'Current password required' })}
            />
            <Input
              label="New Password"
              type={showPwd ? 'text' : 'password'}
              id="new-pwd"
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button type="button" onClick={() => setShowPwd(v => !v)}>
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              error={pwdErrors.new_password?.message}
              {...regPwd('new_password', {
                required: 'New password required',
                minLength: { value: 8, message: 'At least 8 characters' },
                pattern: { value: /(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/, message: 'Include uppercase, lowercase, and number' },
              })}
            />
            <Input
              label="Confirm New Password"
              type="password"
              id="confirm-pwd"
              leftIcon={<Lock className="w-4 h-4" />}
              error={pwdErrors.confirm_password?.message}
              {...regPwd('confirm_password', {
                required: 'Please confirm',
                validate: v => v === newPwd || 'Passwords do not match',
              })}
            />
            <Button type="submit" variant="secondary" loading={passwordMutation.isPending} leftIcon={<Lock className="w-4 h-4" />}>
              Change Password
            </Button>
          </form>
        </motion.div>
      </div>
    </AppLayout>
  );
}
