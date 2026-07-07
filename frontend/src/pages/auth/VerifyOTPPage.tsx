import { useRef, useState, KeyboardEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Mail, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { authApi } from '@/api';
import Button from '@/components/ui/Button';

export default function VerifyOTPPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const email = params.get('email') || '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    if (newOtp.every(d => d !== '')) {
      // Auto submit
      submitOtp(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) {
      const digits = text.split('');
      setOtp(digits);
      inputRefs.current[5]?.focus();
      submitOtp(text);
    }
  };

  const submitOtp = async (code: string) => {
    if (!email) { toast.error('Email not found. Please register again.'); return; }
    setLoading(true);
    try {
      await authApi.verifyEmail({ email, otp_code: code });
      toast.success('Email verified successfully! Please log in.');
      navigate('/login');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Invalid OTP. Please try again.';
      toast.error(msg);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    try {
      await authApi.resendOtp(email);
      toast.success('New OTP sent to your email!');
    } catch {
      toast.error('Failed to resend OTP. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center hero-bg bg-grid px-4">
      <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-primary-500/5 rounded-full blur-3xl" />

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
          <div className="w-16 h-16 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-primary-400" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Verify your email</h1>
          <p className="text-text-secondary text-sm mt-2">
            We sent a 6-digit code to{' '}
            <span className="text-primary-400 font-medium">{email || 'your email'}</span>
          </p>
        </div>

        <div className="glass-card p-8">
          <div className="flex justify-center gap-3 mb-8" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={el => inputRefs.current[i] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className="otp-input"
                autoFocus={i === 0}
                id={`otp-${i}`}
              />
            ))}
          </div>

          <Button
            onClick={() => submitOtp(otp.join(''))}
            disabled={otp.some(d => !d)}
            loading={loading}
            variant="primary"
            className="w-full justify-center mb-4"
          >
            Verify Email
          </Button>

          <div className="text-center">
            <p className="text-sm text-text-muted mb-2">Didn't receive the code?</p>
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-sm text-primary-400 hover:text-primary-300 font-medium flex items-center gap-1.5 mx-auto transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
              {resending ? 'Sending...' : 'Resend OTP'}
            </button>
          </div>
        </div>

        <p className="text-center mt-4 text-sm text-text-muted">
          <Link to="/login" className="text-primary-400 hover:text-primary-300 transition-colors">
            ← Back to login
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
