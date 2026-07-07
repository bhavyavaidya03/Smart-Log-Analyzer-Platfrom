import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Zap, User, AtSign, ArrowRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { authApi } from '@/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface RegisterForm {
  email: string;
  username: string;
  full_name: string;
  password: string;
  confirm_password: string;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>();
  const password = watch('password');

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      await authApi.register(data);
      toast.success('Account created! Check your email for the verification OTP.');
      navigate(`/verify-otp?email=${encodeURIComponent(data.email)}`);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Registration failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    const labels = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
    const colors = ['', 'bg-danger', 'bg-warning', 'bg-yellow-400', 'bg-success', 'bg-success'];
    return { score, label: labels[score], color: colors[score] };
  };

  const strength = getPasswordStrength(password);

  return (
    <div className="min-h-screen flex items-center justify-center hero-bg bg-grid px-4 py-12">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <Zap className="w-5 h-5 text-white" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-text-primary">Create your account</h1>
          <p className="text-text-secondary text-sm mt-1">Start analyzing logs for free</p>
        </div>

        <div className="glass-card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              id="reg-fullname"
              placeholder="John Doe"
              leftIcon={<User className="w-4 h-4" />}
              error={errors.full_name?.message}
              {...register('full_name', {
                required: 'Full name is required',
                minLength: { value: 2, message: 'Name must be at least 2 characters' },
              })}
            />

            <Input
              label="Username"
              type="text"
              id="reg-username"
              placeholder="johndoe"
              leftIcon={<AtSign className="w-4 h-4" />}
              error={errors.username?.message}
              hint="3–30 characters, letters, numbers, underscores only"
              {...register('username', {
                required: 'Username is required',
                minLength: { value: 3, message: 'Must be at least 3 characters' },
                maxLength: { value: 30, message: 'Must be at most 30 characters' },
                pattern: { value: /^[a-zA-Z0-9_]+$/, message: 'Letters, numbers, and underscores only' },
              })}
            />

            <Input
              label="Email Address"
              type="email"
              id="reg-email"
              placeholder="you@example.com"
              leftIcon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
              })}
            />

            <div>
              <Input
                label="Password"
                type={showPwd ? 'text' : 'password'}
                id="reg-password"
                placeholder="Min. 8 characters"
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button type="button" onClick={() => setShowPwd(v => !v)}>
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                error={errors.password?.message}
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 8, message: 'At least 8 characters' },
                  pattern: { value: /(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/, message: 'Must include uppercase, lowercase, and a number' },
                })}
              />
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          i <= strength.score ? strength.color : 'bg-bg-border'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs ${strength.score >= 4 ? 'text-success' : strength.score >= 3 ? 'text-warning' : 'text-danger'}`}>
                    {strength.label}
                  </p>
                </div>
              )}
            </div>

            <Input
              label="Confirm Password"
              type="password"
              id="reg-confirm-password"
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              error={errors.confirm_password?.message}
              {...register('confirm_password', {
                required: 'Please confirm your password',
                validate: (v) => v === password || 'Passwords do not match',
              })}
            />

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full justify-center mt-2"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Create Account
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-text-muted">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
