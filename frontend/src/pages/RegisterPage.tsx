import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import { Lock, Mail, ArrowRight, AlertCircle, BookOpen, Eye, EyeOff, KeyRound, CheckCircle2, RefreshCw, CheckSquare, Square, X } from 'lucide-react';
import axios from 'axios';
import { PasswordRequirementsChecklist } from '../components/common/PasswordRequirementsChecklist';

export const RegisterPage: React.FC = () => {
  const { register, googleLogin, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isGoogleAccountError, setIsGoogleAccountError] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // OTP Cooldown Timer (120s / 2 minutes)
  const [otpSent, setOtpSent] = useState(false);
  const [cooldownSec, setCooldownSec] = useState(0);
  const [sendingOtp, setSendingOtp] = useState(false);

  const [showTermsModal, setShowTermsModal] = useState<'terms' | 'privacy' | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      const targetPath = (location.state as any)?.from || (user.role === 'owner' ? '/dashboard' : '/');
      navigate(targetPath, { replace: true });
    }
  }, [user, navigate, location]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (cooldownSec > 0) {
      interval = setInterval(() => {
        setCooldownSec((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [cooldownSec]);

  // Google Sign-In Handler for Registration
  const handleGoogleSignIn = async () => {
    setError('');
    setIsGoogleAccountError(false);

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if ((window as any).google?.accounts?.oauth2 && clientId) {
      try {
        const client = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'email profile',
          callback: async (tokenResponse: any) => {
            if (tokenResponse?.access_token) {
              try {
                setSubmitting(true);
                const userInfoRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                await googleLogin(
                  {
                    accessToken: tokenResponse.access_token,
                    email: userInfoRes.data.email,
                    name: userInfoRes.data.name,
                    avatarUrl: userInfoRes.data.picture,
                  },
                  rememberMe
                );
                const updatedUser = JSON.parse(localStorage.getItem('phoenixscroll_user') || '{}');
                const targetPath = (location.state as any)?.from || (updatedUser?.role === 'owner' ? '/dashboard' : '/');
                navigate(targetPath, { replace: true });
              } catch (err: any) {
                setError(err.response?.data?.message || 'Google Sign-In failed.');
              } finally {
                setSubmitting(false);
              }
            }
          },
        });
        client.requestAccessToken();
        return;
      } catch (err) {
        console.warn('OAuth token client trigger warning:', err);
      }
    }

    if ((window as any).google?.accounts?.id && clientId) {
      (window as any).google.accounts.id.prompt();
    }
  };

  const handleSendOtp = async () => {
    setError('');
    setInfoMessage('');
    setIsGoogleAccountError(false);

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address first.');
      return;
    }

    try {
      setSendingOtp(true);
      const res = await authService.sendOtp(email, 'registration');
      setOtpSent(true);
      setCooldownSec(120);
      setInfoMessage(res.message || 'OTP sent successfully to your email!');
    } catch (err: any) {
      if (err.response?.data?.isGoogleAccount) {
        setIsGoogleAccountError(true);
        setError(err.response?.data?.message || 'This email is registered using Google Sign-In.');
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
    setIsGoogleAccountError(false);

    if (!name || !email || !password || !otp) {
      setError('Please fill in all required fields including the 6-digit OTP code.');
      return;
    }
    if (!acceptedTerms) {
      setError('You must read and check the box to accept the Terms & Conditions and Privacy Policy.');
      return;
    }

    try {
      setSubmitting(true);
      await register(name, email, password, otp, 'reader', rememberMe, acceptedTerms);
      navigate('/', { replace: true });
    } catch (err: any) {
      if (err.response?.data?.isGoogleAccount) {
        setIsGoogleAccountError(true);
        setError(err.response?.data?.message || 'This email is registered using Google Sign-In.');
      } else {
        setError(err.response?.data?.message || 'Registration failed. Please check your details and OTP.');
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
            Create Reader Account
          </h2>
          <p className="text-xs text-stone-500 font-sans max-w-xs mx-auto">
            Enter your email to receive a 2-minute OTP code for email verification.
          </p>
        </div>

        {/* Google OAuth Button */}
        <div className="pt-1">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={submitting}
            className="w-full py-2.5 px-4 bg-white hover:bg-stone-50 text-stone-700 border border-stone-300 rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center space-x-2.5"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest text-stone-400 bg-paper-card px-2">
              or register with email
            </div>
          </div>
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
            {isGoogleAccountError && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="px-3.5 py-1.5 bg-amber-900 hover:bg-amber-950 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center space-x-1"
                >
                  <span>Click here to Continue with Google</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Email input with inline Send OTP button */}
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

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-800/30 focus:border-amber-800"
            />
          </div>

          {/* OTP Input */}
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

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
              Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-800/30 focus:border-amber-800"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 focus:outline-none transition p-1"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {/* Real-time Password Requirements Checklist */}
            <div className="pt-2">
              <PasswordRequirementsChecklist password={password} />
            </div>
          </div>

          {/* Terms & Conditions Checkbox */}
          <div className="pt-2 border-t border-stone-200/60 space-y-1">
            <div className="flex items-start space-x-2">
              <button
                type="button"
                onClick={() => setAcceptedTerms(!acceptedTerms)}
                className="mt-0.5 text-stone-700 hover:text-stone-900 cursor-pointer select-none flex-shrink-0"
              >
                {acceptedTerms ? (
                  <CheckSquare className="w-4 h-4 text-amber-900" />
                ) : (
                  <Square className="w-4 h-4 text-stone-400" />
                )}
              </button>
              <p className="text-xs text-stone-600 leading-tight">
                I have read and agree to the{' '}
                <button
                  type="button"
                  onClick={() => setShowTermsModal('terms')}
                  className="font-bold text-amber-900 hover:underline"
                >
                  Terms & Conditions
                </button>{' '}
                and{' '}
                <button
                  type="button"
                  onClick={() => setShowTermsModal('privacy')}
                  className="font-bold text-amber-900 hover:underline"
                >
                  Privacy Policy
                </button>
                . <span className="text-red-600 font-bold">*</span>
              </p>
            </div>
            <span className="text-[10px] text-stone-400 block pl-6">
              By creating an account, your consent date and security credentials are safely stored.
            </span>
          </div>

          {/* Remember Me */}
          <div className="flex items-center space-x-2 pt-1">
            <button
              type="button"
              onClick={() => setRememberMe(!rememberMe)}
              className="flex items-center space-x-2 text-xs font-semibold text-stone-700 hover:text-stone-900 cursor-pointer select-none"
            >
              {rememberMe ? (
                <CheckSquare className="w-4 h-4 text-amber-900" />
              ) : (
                <Square className="w-4 h-4 text-stone-400" />
              )}
              <span>Remember Me</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-amber-900 hover:bg-amber-950 text-white rounded-xl text-sm font-semibold flex items-center justify-center space-x-2 shadow-md transition disabled:opacity-50"
          >
            <span>{submitting ? 'Verifying OTP & Creating Account...' : 'Verify OTP & Create Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-3 border-t border-stone-200/60 space-y-2">
          <span className="text-xs text-stone-600 font-medium">Already have an account? </span>
          <Link
            to="/login"
            className="text-xs font-bold text-amber-900 hover:underline transition"
          >
            Sign In
          </Link>
        </div>
      </div>

      {/* Terms & Conditions / Privacy Policy Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-4 border border-stone-200 overflow-hidden relative max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="font-playfair text-xl font-bold text-stone-900">
                {showTermsModal === 'terms' ? 'Terms & Conditions' : 'Privacy Policy'}
              </h3>
              <button
                onClick={() => setShowTermsModal(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 text-xs text-stone-700 space-y-3 pr-2 leading-relaxed">
              {showTermsModal === 'terms' ? (
                <>
                  <p className="font-bold text-stone-900">Welcome to Phoenix-Scroll Reading Platform.</p>
                  <p>
                    By registering an account on Phoenix-Scroll, you agree to comply with and be bound by the following reader terms of service:
                  </p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Access to published stories, novels, and audio content is granted for personal, non-commercial reading.</li>
                    <li>Account credentials and 6-digit verification codes must be kept secure and confidential.</li>
                    <li>You agree not to copy, scrape, redistribute, or reproduce story content without author authorization.</li>
                    <li>We record your timestamped acceptance to verify compliance with platform safety policies.</li>
                  </ul>
                </>
              ) : (
                <>
                  <p className="font-bold text-stone-900">Phoenix-Scroll Privacy Policy & Data Protection.</p>
                  <p>
                    We respect your privacy and are committed to protecting your personal information:
                  </p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Email addresses are used strictly for secure OTP authentication and account access.</li>
                    <li>Your personal reading library and chapter progress are synchronized securely across your devices.</li>
                    <li>We never sell, rent, or trade your personal data or reading activity with third parties.</li>
                    <li>You can request permanent account deletion and data removal at any time via Account Settings.</li>
                  </ul>
                </>
              )}
            </div>

            <div className="pt-3 border-t border-stone-200 flex justify-end">
              <button
                onClick={() => {
                  setAcceptedTerms(true);
                  setShowTermsModal(null);
                }}
                className="px-5 py-2 bg-amber-900 hover:bg-amber-950 text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                I Agree & Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
