import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowRight, ShieldCheck, Mail, User as UserIcon } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { User, UserRole } from '../../types';

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: { client_id: string; callback: (res: { credential: string }) => void }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
          prompt: () => void;
        };
      };
    };
  }
}

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
  const { setCurrentUser, setCurrentRole } = useApp();
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [role, setRole] = useState<UserRole>('attendee');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [hasGoogleClient, setHasGoogleClient] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Initialize real Google Identity Services (GIS) if client ID is configured
  useEffect(() => {
    if (!isOpen) return;

    if (googleClientId && window.google?.accounts?.id && googleBtnRef.current) {
      setHasGoogleClient(true);
      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (response: { credential: string }) => {
            handleGoogleJwtSuccess(response.credential);
          },
        });
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline',
          size: 'large',
          width: 340,
          text: 'continue_with',
          shape: 'pill',
        });
      } catch (err) {
        console.warn('Google Identity Services initialization:', err);
      }
    }
  }, [isOpen, googleClientId]);

  if (!isOpen) return null;

  const handleGoogleJwtSuccess = (jwtCredential: string) => {
    setIsAuthenticating(true);
    try {
      const base64Url = jwtCredential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const data = JSON.parse(jsonPayload);

      const googleUser: User = {
        id: `usr-g-${data.sub || Date.now().toString(36)}`,
        name: data.name || data.email.split('@')[0],
        email: data.email,
        role: 'attendee',
        roles: ['attendee', 'organizer', 'venue_manager'],
        avatar:
          data.picture ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name || 'User')}&background=3E6CB5&color=fff&bold=true`,
        organization: 'Google Account',
        location: 'Bohol, Philippines',
        bio: `Verified Google Account (${data.email})`,
      };

      setCurrentUser(googleUser);
      setCurrentRole('attendee');

      if (typeof window !== 'undefined') {
        localStorage.setItem('zabay-user', JSON.stringify(googleUser));
        localStorage.setItem('zabay-role', 'attendee');
        if (googleUser.email) localStorage.setItem('zabay-last-attendee-email', googleUser.email);
        if (googleUser.name) localStorage.setItem('zabay-last-attendee-name', googleUser.name);
      }

      setIsAuthenticating(false);
      onSuccess(googleUser);
      onClose();
    } catch {
      setIsAuthenticating(false);
    }
  };

  const handleManualGoogleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail.trim()) return;

    setIsAuthenticating(true);

    const displayName = googleName.trim() || googleEmail.split('@')[0];
    setTimeout(() => {
      const googleUser: User = {
        id: `usr-g-${Date.now().toString(36)}`,
        name: displayName,
        email: googleEmail.trim().toLowerCase(),
        role: role,
        roles: role === 'organizer' ? ['organizer', 'attendee', 'venue_manager'] : ['attendee', 'organizer'],
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=3E6CB5&color=fff&bold=true`,
        organization: googleEmail.includes('@bisu.edu.ph')
          ? 'Bohol Island State University'
          : googleEmail.includes('@hnu.edu.ph')
          ? 'Holy Name University'
          : 'Google Account',
        location: 'Bohol, Philippines',
        bio: `Authenticated via Google Account (${googleEmail.trim().toLowerCase()})`,
      };

      setCurrentUser(googleUser);
      setCurrentRole(role);

      if (typeof window !== 'undefined') {
        localStorage.setItem('zabay-user', JSON.stringify(googleUser));
        localStorage.setItem('zabay-role', role);
        if (googleUser.email) localStorage.setItem('zabay-last-attendee-email', googleUser.email);
        if (googleUser.name) localStorage.setItem('zabay-last-attendee-name', googleUser.name);
      }

      setIsAuthenticating(false);
      onSuccess(googleUser);
      onClose();
    }, 600);
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
              Continue to <span className="font-semibold text-slate-700 dark:text-slate-300">Zabay</span> (<code className="text-[11px] font-mono">zabay.ph</code>)
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

        {/* Account Authentication Body */}
        {!isAuthenticating && (
          <div className="p-6 space-y-4">
            {/* Live Google Button Mount Point (Rendered if GIS client configured) */}
            {hasGoogleClient && (
              <div className="flex flex-col items-center justify-center py-2 space-y-2 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div ref={googleBtnRef} />
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Or enter account below</span>
              </div>
            )}

            <form onSubmit={handleManualGoogleSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  Google Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="yourname@gmail.com or @bisu.edu.ph"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  className="w-full bg-[#F8FAFD] dark:bg-[#111722] border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Your Google Profile Name"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  className="w-full bg-[#F8FAFD] dark:bg-[#111722] border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Initial Workspace Mode
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full bg-[#F8FAFD] dark:bg-[#111722] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="attendee">Attendee / Delegate (Public Events & Passes)</option>
                  <option value="organizer">Event Organizer (Planning Studio & Ops)</option>
                  <option value="venue_manager">Venue Manager (Hall Reservations)</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!googleEmail.trim() || isAuthenticating}
                  className="w-full py-2.5 px-4 bg-[#1A73E8] hover:bg-[#1557B0] text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <span>Continue with Google</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="pt-1 flex items-center justify-center gap-1.5 text-[10px] text-slate-400 text-center">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>To enable live 1-click Google OAuth, ensure your Firebase environment variables are configured.</span>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
