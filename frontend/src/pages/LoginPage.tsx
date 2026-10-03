import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ArrowRight, AlertCircle, BookOpen, Eye, EyeOff, CheckSquare, Square } from 'lucide-react';
import axios from 'axios';

export const LoginPage: React.FC = () => {
  const { login, googleLogin, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isGoogleAccountError, setIsGoogleAccountError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      const targetPath = (location.state as any)?.from || (user.role === 'owner' ? '/dashboard' : '/');
      navigate(targetPath, { replace: true });
    }
  }, [user, navigate, location]);

  // Google Sign-In Handler
  const handleGoogleSignIn = async () => {
    setError('');
    setIsGoogleAccountError(false);

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    // Trigger Google's official OAuth account chooser popup
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsGoogleAccountError(false);

    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }

    try {
      setSubmitting(true);
      await login(email, password, rememberMe);
      const updatedUser = JSON.parse(localStorage.getItem('phoenixscroll_user') || '{}');
      const targetPath = (location.state as any)?.from || (updatedUser?.role === 'owner' ? '/dashboard' : '/');
      navigate(targetPath, { replace: true });
    } catch (err: any) {
      if (err.response?.data?.isGoogleAccount) {
        setIsGoogleAccountError(true);
        setError(err.response?.data?.message || 'This account was created using Google Sign-In. Please click Continue with Google.');
      } else {
        setError(err.response?.data?.message || 'Invalid email or password.');
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
            Sign In to Phoenix-Scroll
          </h2>
          <p className="text-xs text-stone-500 font-sans max-w-xs mx-auto">
            Enter your credentials to access your published library account.
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
              or continue with email
            </div>
          </div>
        </div>

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
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
              Email Address *
            </label>
            <div className="relative">
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
          </div>

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
          </div>

          {/* Remember Me Checkbox & Forgot Password Link */}
          <div className="flex items-center justify-between pt-1">
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

            <Link
              to="/forgot-password"
              className="text-xs text-amber-900 hover:underline font-semibold"
            >
              Forgot Password?
            </Link>
          </div>
          <span className="text-[11px] text-stone-400 block -mt-1">
            {rememberMe
              ? 'Stay logged in even after closing the browser.'
              : 'Automatically log out when closing the browser tab.'}
          </span>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-amber-900 hover:bg-amber-950 text-white rounded-xl text-sm font-semibold flex items-center justify-center space-x-2 shadow-md transition disabled:opacity-50"
          >
            <span>{submitting ? 'Signing In...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-3 border-t border-stone-200/60 space-y-2">
          <span className="text-xs text-stone-600 font-medium">Don't have a reader account? </span>
          <Link
            to="/register"
            className="text-xs font-bold text-amber-900 hover:underline transition"
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
};
