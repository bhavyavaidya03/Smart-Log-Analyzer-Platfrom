import { useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Lock, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { authApi } from '@/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface ResetForm {
  otp_code: string;
  new_password: string;
  confirm_password: string;
}

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const email = params.get('email') || '';
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<ResetForm>();
  const newPassword = watch('new_password');

  const onSubmit = async (data: ResetForm) => {
    setLoading(true);
    try {
      await authApi.resetPassword({ email, ...data });
      toast.success('Password reset successfully! Please log in.');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center hero-bg bg-grid px-4">
      <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-primary-500/5 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <Zap className="w-5 h-5 text-white" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-text-primary">Reset your password</h1>
          <p className="text-text-secondary text-sm mt-1">
            Enter the OTP sent to <span className="text-primary-400">{email}</span>
          </p>
        </div>

        <div className="glass-card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="6-Digit OTP"
              type="text"
              id="reset-otp"
              placeholder="123456"
              maxLength={6}
              error={errors.otp_code?.message}
              {...register('otp_code', {
                required: 'OTP is required',
                pattern: { value: /^\d{6}$/, message: 'Enter the 6-digit OTP' },
              })}
            />

            <Input
              label="New Password"
              type={showPwd ? 'text' : 'password'}
              id="reset-password"
              placeholder="Min. 8 characters"
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button type="button" onClick={() => setShowPwd(v => !v)}>
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              error={errors.new_password?.message}
              {...register('new_password', {
                required: 'New password is required',
                minLength: { value: 8, message: 'At least 8 characters' },
                pattern: { value: /(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/, message: 'Include uppercase, lowercase, and a number' },
              })}
            />

            <Input
              label="Confirm Password"
              type="password"
              id="reset-confirm"
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              error={errors.confirm_password?.message}
              {...register('confirm_password', {
                required: 'Please confirm your password',
                validate: v => v === newPassword || 'Passwords do not match',
              })}
            />

            <Button type="submit" variant="primary" loading={loading} className="w-full justify-center">
              Reset Password
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-primary-400 hover:text-primary-300 transition-colors">
              ← Back to login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
