import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  Building,
  CheckCircle2,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  KeyRound,
  Terminal,
  Database,
} from 'lucide-react';
import api from '../../services/api';
import { useApp } from '../../context/AppContext';
import type { User, UserRole } from '../../types';
import { isFirebaseConfigured, signInWithGooglePopup } from '../../services/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  intent?: string;
  initialMode?: 'signin' | 'register' | 'operator';
  onOpenDevConsole?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  intent,
  initialMode = 'signin',
  onOpenDevConsole,
}) => {
  const { setCurrentUser, setCurrentRole, isLiveBackend, operatorAuthenticated } = useApp();

  const [mode, setMode] = useState<'signin' | 'register' | 'operator'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [operatorUsername, setOperatorUsername] = useState('');
  const [operatorPassword, setOperatorPassword] = useState('');
  const [operatorError, setOperatorError] = useState<string | null>(null);
  const [isOperatorSubmitting, setIsOperatorSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode || 'signin');
      setErrorMessage(null);
      setSuccessMessage(null);
      setOperatorError(null);
    }
  }, [isOpen, initialMode]);

  const handleOperatorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOperatorError(null);
    setIsOperatorSubmitting(true);
    try {
      const result = await api.auth.login(operatorUsername, operatorPassword);
      if (result.success) {
        setSuccessMessage('Operator session authenticated. Reloading session...');
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        setOperatorError(result.error || 'Operator login failed.');
      }
    } catch {
      setOperatorError('Operator login request failed.');
    } finally {
      setIsOperatorSubmitting(false);
    }
  };

  const handleOperatorLogout = async () => {
    setOperatorError(null);
    try {
      const result = await api.auth.logout();
      if (result.success) {
        window.location.reload();
      } else {
        setOperatorError(result.error || 'Operator logout failed.');
      }
    } catch {
      setOperatorError('Operator logout failed.');
    }
  };

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    if (!isFirebaseConfigured) {
      setErrorMessage('Google sign-in is not configured.');
      return;
    }

    try {
      setIsSubmitting(true);
      const credential = await signInWithGooglePopup();
      const idToken = await credential.user.getIdToken();
      const response = await api.auth.firebaseLogin(idToken);
      if (!response.success || !response.data?.user) {
        setErrorMessage(response.error || 'Google sign-in succeeded, but Zabay could not establish a session. Please retry.');
        return;
      }

      const gUser = response.data.user;
      const userObj: User = {
        id: gUser.id,
        name: gUser.name || credential.user.displayName || 'Google User',
        email: gUser.email || credential.user.email || '',
        role: (gUser.role as UserRole) || 'attendee',
        roles: [(gUser.role as UserRole) || 'attendee'],
        avatar: gUser.avatar || credential.user.photoURL || '',
        organization: gUser.organization || 'Zabay Platform User',
        location: '',
        bio: '',
      };
      setCurrentUser(userObj);
      setCurrentRole(userObj.role);
      localStorage.setItem('zabay-user', JSON.stringify(userObj));
      localStorage.setItem('zabay-role', userObj.role);
      setSuccessMessage(`Welcome back, ${userObj.name}! Signed in via Google.`);
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 700);
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setErrorMessage('Google sign-in popup was closed before completing.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setErrorMessage('Firebase domain unauthorized. Add this domain to the Firebase authorized domains.');
      } else if (err.code === 'auth/popup-blocked') {
        setErrorMessage('Popup blocked by browser. Please allow popups for this site.');
      } else {
        setErrorMessage('Could not finish Google sign-in with Zabay. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPass = password.trim();

    if (!trimmedEmail) {
      setErrorMessage('Please enter an email address.');
      return;
    }
    if (!trimmedPass || trimmedPass.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (mode === 'register') {
      if (!name.trim()) {
        setErrorMessage('Please enter your full name.');
        return;
      }
      if (trimmedPass !== confirmPassword.trim()) {
        setErrorMessage('Passwords do not match. Please verify your confirm password.');
        return;
      }

      setIsSubmitting(true);
      setErrorMessage(null);

      try {
        const res = await api.auth.register({
          name: name.trim(),
          email: trimmedEmail,
          password: trimmedPass,
          organization: organization.trim(),
        });

        if (res.success && res.data?.user) {
          const u = res.data.user;
          const userObj: User = {
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role as UserRole,
            roles: [u.role as UserRole],
            avatar: u.avatar,
            organization: u.organization || 'Zabay Platform User',
            location: u.location || 'Tagbilaran City, Bohol',
            bio: u.bio || 'Registered participant on Zabay Event Platform.',
          };

          setCurrentUser(userObj);
          setCurrentRole(userObj.role);
          if (typeof window !== 'undefined') {
            localStorage.setItem('zabay-user', JSON.stringify(userObj));
            localStorage.setItem('zabay-role', userObj.role);
          }
          setSuccessMessage(`Account created! Welcome to Zabay, ${userObj.name}.`);
          setTimeout(() => {
            setSuccessMessage(null);
            onClose();
          }, 700);
        } else {
          setErrorMessage(res.error || 'Registration failed.');
        }
      } catch (err: any) {
        setErrorMessage(err?.message || 'Registration failed. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // SIGN IN MODE: Real verification with PostgreSQL
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await api.auth.userLogin({ email: trimmedEmail, password: trimmedPass });
      if (res.success && res.data?.user) {
        const u = res.data.user;
        const userObj: User = {
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role as UserRole,
          roles: [u.role as UserRole],
          avatar: u.avatar,
          organization: u.organization || 'Zabay Platform User',
          location: u.location || 'Tagbilaran City, Bohol',
          bio: u.bio || 'Verified participant on Zabay.',
        };

        setCurrentUser(userObj);
        setCurrentRole(userObj.role);
        if (typeof window !== 'undefined') {
          localStorage.setItem('zabay-user', JSON.stringify(userObj));
          localStorage.setItem('zabay-role', userObj.role);
        }
        setSuccessMessage(`Welcome back, ${userObj.name}! Signed in successfully.`);
        setTimeout(() => {
          setSuccessMessage(null);
          onClose();
        }, 700);
      } else {
        setErrorMessage(res.error || 'Invalid email or password.');
      }
    } catch {
      setErrorMessage('Authentication request failed. Please check your network or try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg max-h-[94vh] sm:max-h-[90vh] flex flex-col bg-white dark:bg-[#171E2B] border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100 transition-colors">
        {/* Top Header */}
        <div className="p-4 sm:p-6 pb-4 shrink-0 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#EBF3FC] text-[#244A85] dark:bg-[#1E293B] dark:text-[#8BB0E8] border border-[#C8DCF7] dark:border-[#2D4160] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-[#3E6CB5] dark:text-[#7EA6E0]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {mode === 'signin' ? 'Sign In to Zabay' : mode === 'register' ? 'Create New Account' : 'Operator Access'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {mode === 'operator' ? 'Administrative Operations & PostgreSQL Access' : 'Event Planning, Discovery & Operations Platform'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex shrink-0 border-b border-slate-200/80 dark:border-slate-800">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMessage(null);
            }}
            className={`flex-1 py-3 text-xs font-bold transition-colors border-b-2 ${
              mode === 'signin'
                ? 'border-[#3E6CB5] text-[#3E6CB5] dark:text-[#7EA6E0]'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Sign In with Email
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMessage(null);
            }}
            className={`flex-1 py-3 text-xs font-bold transition-colors border-b-2 ${
              mode === 'register'
                ? 'border-[#3E6CB5] text-[#3E6CB5] dark:text-[#7EA6E0]'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Register New Account
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('operator');
              setErrorMessage(null);
              setOperatorError(null);
            }}
            className={`py-3 px-3.5 text-xs font-bold transition-colors border-b-2 flex items-center justify-center gap-1.5 ${
              mode === 'operator'
                ? 'border-[#3E6CB5] text-[#3E6CB5] dark:text-[#7EA6E0]'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Operator</span>
          </button>
        </div>

        {mode === 'operator' ? (
          <form onSubmit={handleOperatorSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-[#3E6CB5] dark:text-[#7EA6E0]" />
                  <span>PostgreSQL Database Engine</span>
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  <span className={`w-2 h-2 rounded-full ${isLiveBackend ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  <span>{isLiveBackend ? 'Postgres Live' : 'Offline'}</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Operator credentials authorize privileged database mutations (event creation, venue reservations, and roster management) when local development requires authenticated session cookies.
              </p>
            </div>

            {operatorAuthenticated ? (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Operator Session Active</span>
                </div>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                  Your browser currently holds a valid operator session cookie. Protected API mutations are permitted.
                </p>
                <div className="pt-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOperatorLogout}
                    className="py-2 px-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-all cursor-pointer shadow-xs"
                  >
                    Operator logout
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('signin')}
                    className="py-2 px-3 text-slate-600 dark:text-slate-400 hover:underline cursor-pointer font-medium"
                  >
                    Return to User Login
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-[#3E6CB5] dark:text-[#7EA6E0]" />
                  <span>Operator login</span>
                </h2>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Operator Username</label>
                  <input
                    aria-label="Operator username"
                    autoComplete="username"
                    required
                    value={operatorUsername}
                    onChange={(e) => setOperatorUsername(e.target.value)}
                    placeholder="e.g. operator"
                    className="w-full bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#3E6CB5]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Operator Password</label>
                  <input
                    aria-label="Operator password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={operatorPassword}
                    onChange={(e) => setOperatorPassword(e.target.value)}
                    placeholder="••••••••••••••••"
                    className="w-full bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#3E6CB5]"
                  />
                </div>

                {operatorError && (
                  <div role="alert" className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                    <X className="w-4 h-4 shrink-0" />
                    <span>{operatorError}</span>
                  </div>
                )}

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                  <div className="font-semibold text-slate-700 dark:text-slate-300">Local developer credentials:</div>
                  <div className="font-mono text-[10px]">User: <strong className="text-slate-800 dark:text-slate-200">operator</strong></div>
                  <div className="font-mono text-[10px]">Pass: <strong className="text-slate-800 dark:text-slate-200">zabay-operator-secret-2026</strong></div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 text-sm">
                  <button
                    type="button"
                    onClick={() => setMode('signin')}
                    className="py-2 px-3 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isOperatorSubmitting}
                    className="rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isOperatorSubmitting ? 'Authenticating...' : 'Sign in'}
                  </button>
                </div>
              </div>
            )}
          </form>
        ) : (
          /* Form Body */
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
          {intent && <p role="status" data-cy="registration-signin-prompt" className="rounded-xl bg-blue-50 p-3 text-blue-900 dark:bg-blue-950/30 dark:text-blue-200">{intent}</p>}
          {/* Google SSO Login Action */}
          <div className="space-y-3 pb-1">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-white dark:bg-[#111722] border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 flex items-center justify-center gap-3 shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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

            <div className="flex items-center gap-2">
              <div className="flex-1 border-t border-slate-200 dark:border-slate-800" />
              <span className="text-[10px] uppercase font-bold text-slate-400">or sign in with email</span>
              <div className="flex-1 border-t border-slate-200 dark:border-slate-800" />
            </div>
          </div>
          {mode === 'register' && (
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                Full Name
              </label>
              <input
                type="text"
                placeholder="e.g. Elena Vance"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={mode === 'register'}
                className="w-full bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#3E6CB5]"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              Email Address
            </label>
            <input
              type="email"
              placeholder="name@organization.ph"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#3E6CB5]"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                Password
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Min 8 characters</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter secure password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 pr-10 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#3E6CB5]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  Confirm Password
                </span>
                {confirmPassword && (
                  <span
                    className={`text-[10px] font-bold ${
                      password === confirmPassword ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
                    }`}
                  >
                    {password === confirmPassword ? '✓ Passwords match' : '✕ Passwords do not match'}
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter password to confirm..."
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required={mode === 'register'}
                  className={`w-full bg-[#F8FAFD] dark:bg-[#111722] border rounded-xl px-3.5 py-2.5 pr-10 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 ${
                    confirmPassword && password !== confirmPassword
                      ? 'border-red-400 focus:ring-red-400'
                      : 'border-slate-200 dark:border-slate-800 focus:ring-[#3E6CB5]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  Organization / School
                </label>
                <input
                  type="text"
                  placeholder="e.g. BISU / HNU / LGU"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  className="w-full bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#3E6CB5]"
                />
              </div>
            </div>
          )}

          {/* Feedback messages */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 font-medium">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-[#3E6CB5] hover:bg-[#325896] text-white rounded-xl font-bold shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Authenticating...' : mode === 'signin' ? 'Sign In to Workspace' : 'Create & Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="pt-1 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
            <Lock className="w-3 h-3 text-slate-400" />
            <span>Protected by industry-standard encrypted authentication</span>
          </div>

          {/* System & Operator Administrative Access Footer */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isLiveBackend ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                Database: {isLiveBackend ? 'Postgres Live' : 'Offline'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {operatorAuthenticated ? (
                <button
                  type="button"
                  onClick={handleOperatorLogout}
                  className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 transition-colors cursor-pointer"
                >
                  Operator logout
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setOperatorError(null);
                    setMode('operator');
                  }}
                  className="text-[11px] font-semibold text-[#3E6CB5] hover:underline dark:text-[#7EA6E0] transition-colors cursor-pointer"
                >
                  Operator login
                </button>
              )}
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenDevConsole) onOpenDevConsole();
                }}
                className="text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer flex items-center gap-1"
              >
                <Terminal className="w-3 h-3" />
                <span>Dev Console</span>
              </button>
            </div>
          </div>
        </form>
      )}
      </div>


    </div>
  );
};
