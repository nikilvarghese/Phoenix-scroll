import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';
import { Lock, Mail, ArrowRight, AlertCircle, BookOpen, Eye, EyeOff, KeyRound, CheckCircle2, RefreshCw } from 'lucide-react';
import { PasswordRequirementsChecklist } from '../components/common/PasswordRequirementsChecklist';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isUnregisteredEmail, setIsUnregisteredEmail] = useState(false);
  const [isGoogleAccountError, setIsGoogleAccountError] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // OTP Cooldown Timer (120s / 2 minutes)
  const [otpSent, setOtpSent] = useState(false);
  const [cooldownSec, setCooldownSec] = useState(0);
  const [sendingOtp, setSendingOtp] = useState(false);

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (cooldownSec > 0) {
      interval = setInterval(() => {
        setCooldownSec((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [cooldownSec]);

  const handleSendOtp = async () => {
    setError('');
    setInfoMessage('');
    setIsUnregisteredEmail(false);
    setIsGoogleAccountError(false);

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address first.');
      return;
    }

    try {
      setSendingOtp(true);
      const res = await authService.sendOtp(email, 'forgot_password');
      setOtpSent(true);
      setCooldownSec(120);
      setInfoMessage(res.message || 'OTP sent successfully to your email!');
    } catch (err: any) {
      if (err.response?.status === 404 || err.response?.data?.notRegistered) {
        setIsUnregisteredEmail(true);
        setError(err.response?.data?.message || 'Mail is not registered with Phoenix-Scroll.');
      } else if (err.response?.data?.isGoogleAccount) {
        setIsGoogleAccountError(true);
        setError(err.response?.data?.message || 'This account uses Google Sign-In. Password reset is not applicable.');
      } else {
        setError(err.response?.data?.message || 'Failed to send OTP.');
      }
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setIsUnregisteredEmail(false);
    setIsGoogleAccountError(false);

    if (!email || !otp || !newPassword) {
      setError('Email, OTP, and new password are required.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await authService.forgotPassword(email, otp, newPassword);
      setInfoMessage(res.message || 'Password reset successful! Redirecting to Sign In...');
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);
    } catch (err: any) {
      if (err.response?.data?.isGoogleAccount) {
        setIsGoogleAccountError(true);
        setError(err.response?.data?.message || 'This account uses Google Sign-In.');
      } else {
        setError(err.response?.data?.message || 'Password reset failed. Please check your OTP code.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper-bg flex items-center justify-center p-4 py-8 sm:py-12">
      <div className="max-w-md w-full space-y-6 bg-paper-card p-5 sm:p-8 md:p-10 rounded-3xl border border-paper-border/80 shadow-2xl">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-900/10 text-amber-900 flex items-center justify-center mx-auto shadow-xs">
            <BookOpen className="w-7 h-7" />
          </div>
          <h2 className="font-playfair text-3xl font-bold text-stone-900">
            Reset Password
          </h2>
          <p className="text-xs text-stone-500 font-sans max-w-xs mx-auto">
            Enter your registered email to receive an OTP code to reset your password.
          </p>
        </div>

        {infoMessage && (
          <div className="flex items-center space-x-2 text-emerald-800 bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{infoMessage}</span>
          </div>
        )}

        {error && (
          <div className="flex flex-col space-y-2 text-red-700 bg-red-50 border border-red-200 p-3 rounded-xl text-xs font-medium">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
            {isUnregisteredEmail && (
              <div className="pt-1">
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-xs transition inline-flex items-center space-x-1"
                >
                  <span>Click here to Register</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
            {isGoogleAccountError && (
              <div className="pt-1">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 bg-amber-900 hover:bg-amber-950 text-white rounded-lg text-xs font-bold shadow-xs transition inline-flex items-center space-x-1"
                >
                  <span>Click here to Sign In with Google</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Email with inline Send OTP */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
              Email Address *
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full pl-9 pr-4 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-800/30 focus:border-amber-800"
                />
              </div>

              <button
                type="button"
                onClick={handleSendOtp}
                disabled={sendingOtp || cooldownSec > 0}
                className="px-3.5 py-2.5 bg-amber-900 hover:bg-amber-950 text-white font-semibold text-xs rounded-lg transition disabled:opacity-50 flex items-center space-x-1 flex-shrink-0"
              >
                {sendingOtp ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : cooldownSec > 0 ? (
                  <span>{cooldownSec}s</span>
                ) : (
                  <span>{otpSent ? 'Resend OTP' : 'Send OTP'}</span>
                )}
              </button>
            </div>
            <span className="text-[11px] text-stone-500 mt-1 block">
              {cooldownSec > 0
                ? `OTP valid for 2 minutes (${cooldownSec}s remaining before resend).`
                : 'Click "Send OTP" to receive a 6-digit code in your email inbox.'}
            </span>
          </div>

          {/* OTP Code */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
              6-Digit Email OTP *
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-amber-800 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                maxLength={6}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="e.g. 123456"
                className="w-full pl-9 pr-4 py-2.5 bg-amber-50/60 border border-amber-300 rounded-lg text-base font-mono font-bold tracking-widest text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-800/30 focus:border-amber-800"
              />
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
              New Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full pl-9 pr-10 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-800/30 focus:border-amber-800"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 focus:outline-none transition p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {/* Real-time Password Requirements Checklist */}
            <div className="pt-2">
              <PasswordRequirementsChecklist password={newPassword} />
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
              Confirm New Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full pl-9 pr-10 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-800/30 focus:border-amber-800"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-amber-900 hover:bg-amber-950 text-white rounded-xl text-sm font-semibold flex items-center justify-center space-x-2 shadow-md transition disabled:opacity-50"
          >
            <span>{submitting ? 'Resetting Password...' : 'Reset Password'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-3 border-t border-stone-200/60">
          <Link
            to="/login"
            className="text-xs font-bold text-stone-600 hover:text-amber-900 transition"
          >
            Back to <span className="text-amber-900 underline">Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
