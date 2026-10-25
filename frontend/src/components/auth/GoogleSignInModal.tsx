import React, { useState } from 'react';
import { X, UserPlus, ArrowRight, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { User, UserRole } from '../../types';

interface GoogleSignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export const GoogleSignInModal: React.FC<GoogleSignInModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { setCurrentUser, setCurrentRole, loadDemoData } = useApp();
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [customRole, setCustomRole] = useState<UserRole>('attendee');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  if (!isOpen) return null;

  const quickGoogleAccounts = [
    {
      name: 'Sofia Ramos',
      email: 'sofia.ramos@bisu.edu.ph',
      title: 'Student Attendee • BISU',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      role: 'attendee' as UserRole,
      org: 'Bohol Island State University',
    },
    {
      name: 'Mark Bautista',
      email: 'mark.bautista@zabay.ph',
      title: 'Event Operations Lead',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      role: 'organizer' as UserRole,
      org: 'Tagbilaran Youth & Sports Council',
    },
  ];

  const handleSelectAccount = (account: {
    name: string;
    email: string;
    avatar: string;
    role: UserRole;
    org: string;
  }) => {
    setIsAuthenticating(true);

    setTimeout(() => {
      const googleUser: User = {
        id: `usr-g-${Date.now().toString(36)}`,
        name: account.name,
        email: account.email,
        role: account.role,
        roles: account.role === 'organizer' ? ['organizer', 'attendee'] : ['attendee'],
        avatar: account.avatar,
        organization: account.org,
        location: 'Tagbilaran City, Bohol',
        bio: `Authenticated via Google SSO (${account.email})`,
      };

      if (account.role === 'organizer') {
        loadDemoData();
      }

      setCurrentUser(googleUser);
      setCurrentRole(account.role);

      if (typeof window !== 'undefined') {
        localStorage.setItem('zabay-user', JSON.stringify(googleUser));
        localStorage.setItem('zabay-role', account.role);
      }

      setIsAuthenticating(false);
      onSuccess(googleUser);
      onClose();
    }, 700);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || !customEmail.trim()) return;

    setIsAuthenticating(true);

    setTimeout(() => {
      const googleUser: User = {
        id: `usr-g-${Date.now().toString(36)}`,
        name: customName.trim(),
        email: customEmail.trim(),
        role: customRole,
        roles: customRole === 'organizer' ? ['organizer', 'attendee'] : ['attendee'],
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(customName.trim())}&background=3E6CB5&color=fff&bold=true`,
        organization: 'Google Account',
        location: 'Bohol, Philippines',
        bio: `Signed in with Google Account (${customEmail.trim()})`,
      };

      if (customRole === 'organizer') {
        loadDemoData();
      }

      setCurrentUser(googleUser);
      setCurrentRole(customRole);

      if (typeof window !== 'undefined') {
        localStorage.setItem('zabay-user', JSON.stringify(googleUser));
        localStorage.setItem('zabay-role', customRole);
      }

      setIsAuthenticating(false);
      onSuccess(googleUser);
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#1C1F26] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-150">
        {/* Google Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800/80 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {/* Google 4-Color SVG Icon */}
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 font-sans">
                Sign in with Google
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Choose an account to continue to <span className="font-semibold text-slate-700 dark:text-slate-300">Zabay</span> (<code className="text-[11px] font-mono">zabay.ph</code>)
            </p>
          </div>

          <button
            onClick={onClose}
            disabled={isAuthenticating}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Loading Spinner Screen */}
        {isAuthenticating && (
          <div className="p-8 text-center space-y-4">
            <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Signing you into Zabay...
              </p>
              <p className="text-[11px] text-slate-400">
                Verifying Google identity and syncing session
              </p>
            </div>
          </div>
        )}

        {/* Account Selector Body */}
        {!isAuthenticating && !isCustomMode && (
          <div className="p-4 space-y-2">
            <div className="space-y-1.5">
              {quickGoogleAccounts.map((account) => (
                <button
                  key={account.email}
                  onClick={() => handleSelectAccount(account)}
                  className="w-full flex items-center justify-between p-3 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-all text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={account.avatar}
                      alt={account.name}
                      className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                        {account.name}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {account.email}
                      </p>
                      <span className="text-[10px] text-slate-400 truncate block">
                        {account.title}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 shrink-0 transition-transform group-hover:translate-x-0.5" />
                </button>
              ))}
            </div>

            {/* Custom Account Option */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsCustomMode(true)}
                className="w-full flex items-center gap-3 p-3 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all text-left cursor-pointer text-slate-700 dark:text-slate-300"
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Use another Google account
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Enter your real name and email address
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Custom Google Account Input Form */}
        {!isAuthenticating && isCustomMode && (
          <form onSubmit={handleCustomSubmit} className="p-5 space-y-3.5">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Enter your Google Account
              </span>
              <button
                type="button"
                onClick={() => setIsCustomMode(false)}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Back to accounts
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Full Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Radel Santos"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full bg-[#F8FAFD] dark:bg-[#111722] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Google Email Address
              </label>
              <input
                type="email"
                required
                placeholder="e.g. yourname@gmail.com"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                className="w-full bg-[#F8FAFD] dark:bg-[#111722] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Select Platform Role
              </label>
              <select
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value as UserRole)}
                className="w-full bg-[#F8FAFD] dark:bg-[#111722] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="attendee">Attendee (Discover events, map & QR passes)</option>
                <option value="organizer">Event Organizer (Manage schedule & operations)</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-2.5 px-4 bg-[#1A73E8] hover:bg-[#1557B0] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Continue with this account</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        {/* Google Privacy Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Secure OAuth 2.0 verification</span>
          </div>
          <span>English (United States)</span>
        </div>
      </div>
    </div>
  );
};
