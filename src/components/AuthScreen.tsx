import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User as UserIcon, Sparkles, AlertCircle, Check, HelpCircle } from 'lucide-react';
import { IAuthService } from '../services/interfaces';

interface AuthScreenProps {
  authService: IAuthService;
  onAuthSuccess: (user: any) => void;
}

export function AuthScreen({ authService, onAuthSuccess }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const getFriendlyErrorMessage = (errCode: string, errMessage?: string): string => {
    switch (errCode) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please try again.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/weak-password':
        return 'Password is too weak. Must be at least 6 characters.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection.';
      case 'auth/too-many-requests':
        return 'Too many failed login attempts. Please try again later.';
      case 'auth/popup-and-redirect-failed':
        return 'Google sign-in popup was blocked and redirect failed. Please check your browser popup and redirect settings.';
      case 'auth/unauthorized-domain':
        return 'This domain is not authorized for Google Sign-In in Firebase. Please add this domain to Authorized Domains in Firebase Authentication Settings.';
      default:
        if (errMessage && (errMessage.includes('blocked') || errMessage.includes('redirect'))) {
          return errMessage;
        }
        return 'An unexpected authentication error occurred. Please try again.';
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const user = await authService.signInWithGoogle();
      if (user) {
        onAuthSuccess(user);
      }
    } catch (err: any) {
      console.error(err);
      setError(getFriendlyErrorMessage(err?.code, err?.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (mode !== 'forgot' && !password) {
      setError('Please enter your password.');
      return;
    }
    if (mode === 'signup' && !fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (mode === 'login') {
        const user = await authService.signInWithEmail(email, password);
        onAuthSuccess(user);
      } else if (mode === 'signup') {
        const user = await authService.signUpWithEmail(email, password, fullName);
        onAuthSuccess(user);
      } else if (mode === 'forgot') {
        await authService.sendPasswordReset(email);
        setSuccessMessage('Password reset email sent! Please check your inbox.');
        // Switch back to login after some time
        setTimeout(() => {
          setMode('login');
          setSuccessMessage(null);
        }, 5000);
      }
    } catch (err: any) {
      console.error(err);
      setError(getFriendlyErrorMessage(err?.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#000000] text-white flex flex-col justify-center items-center p-4 selection:bg-[#7C5CFF]/30 select-none">
      {/* Background radial gradient decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(124,92,255,0.06)_0%,transparent_60%)] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-[#0B0B0C] border border-white/[0.04] rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.8)] relative overflow-hidden z-10"
      >
        {/* Glow accent */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#7C5CFF]/60 to-transparent" />

        {/* Brand logo header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-[#7C5CFF]/10 border border-[#7C5CFF]/30 rounded-xl flex items-center justify-center mb-3">
            <Sparkles className="w-6 h-6 text-[#7C5CFF]" />
          </div>
          <h1 className="text-xl font-bold tracking-widest uppercase font-sans">
            To-Do List
          </h1>
          <p className="text-xs text-white/40 mt-1 font-mono tracking-tight text-center">
            {mode === 'login' && 'Sign in to access your priority workspace'}
            {mode === 'signup' && 'Create your account to start prioritizing'}
            {mode === 'forgot' && 'Reset your password to regain access'}
          </p>
        </div>

        {/* Display Alert Messages */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2.5 mb-5 overflow-hidden"
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span className="text-xs text-red-300 leading-snug">{error}</span>
            </motion.div>
          )}

          {successMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-start gap-2.5 mb-5 overflow-hidden"
            >
              <Check className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
              <span className="text-xs text-green-300 leading-snug">{successMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider font-mono mb-1.5 pl-1">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input
                  type="text"
                  required
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-[#121214] border border-white/[0.04] rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/20 focus:border-[#7C5CFF]/50 focus:ring-0 focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider font-mono mb-1.5 pl-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#121214] border border-white/[0.04] rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/20 focus:border-[#7C5CFF]/50 focus:ring-0 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1.5 pl-1">
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider font-mono">
                  Password
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setError(null);
                      setSuccessMessage(null);
                    }}
                    className="text-[10px] font-bold text-[#7C5CFF] uppercase tracking-wider font-mono hover:text-[#9075FF] transition-colors cursor-pointer"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#121214] border border-white/[0.04] rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/20 focus:border-[#7C5CFF]/50 focus:ring-0 focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#7C5CFF] hover:bg-[#6846FF] text-white text-xs font-bold uppercase tracking-wider font-mono py-3 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'
            )}
          </button>
        </form>

        {mode !== 'forgot' && (
          <>
            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="h-[1px] flex-1 bg-white/[0.04]" />
              <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest font-mono">Or</span>
              <div className="h-[1px] flex-1 bg-white/[0.04]" />
            </div>

            {/* Google Login */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-[#121214] hover:bg-[#18181C] border border-white/[0.04] text-xs font-bold uppercase tracking-wider font-mono py-3 rounded-lg flex items-center justify-center gap-2.5 transition-colors text-white/80 cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Continue with Google
            </button>
          </>
        )}

        {/* Toggle link */}
        <div className="mt-8 text-center">
          {mode === 'login' ? (
            <p className="text-xs text-white/40">
              Don't have an account?{' '}
              <button
                onClick={() => {
                  setMode('signup');
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="text-[#7C5CFF] font-semibold hover:underline cursor-pointer"
              >
                Sign Up
              </button>
            </p>
          ) : mode === 'signup' ? (
            <p className="text-xs text-white/40">
              Already have an account?{' '}
              <button
                onClick={() => {
                  setMode('login');
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="text-[#7C5CFF] font-semibold hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </p>
          ) : (
            <p className="text-xs text-white/40">
              Remember your password?{' '}
              <button
                onClick={() => {
                  setMode('login');
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="text-[#7C5CFF] font-semibold hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
