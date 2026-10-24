import React, { useEffect, useState } from 'react';
import { ShieldCheck, Lock, KeyRound, AlertCircle } from 'lucide-react';
import api from './services/api';
import { AppProvider, useApp } from './context/AppContext';
import { AppHeader } from './components/layout/AppHeader';
import { AppSidebar } from './components/layout/AppSidebar';
import type { OrganizerView } from './components/layout/AppSidebar';
import { OrganizerPage } from './pages/organizer/OrganizerPage';
import { VenuePage } from './pages/venue/VenuePage';
import { StaffPage } from './pages/staff/StaffPage';
import { AttendeePage } from './pages/attendee/AttendeePage';
import { AuditLogViewer, QRCheckInScanner, ProfileView } from './components/modals';

const MainContent: React.FC = () => {
  const { currentRole, setCurrentRole, refreshBackendStatus } = useApp();
  const [authenticated, setAuthenticated] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  useEffect(() => {
    api.auth.session()
      .then(data => setAuthenticated(data.authenticated))
      .catch(() => {
        // Silently default to unauthenticated when backend is offline or in demo mode
        setAuthenticated(false);
      });
    const sessionEnded = () => setAuthenticated(false);
    window.addEventListener('zabay:operator-session-ended', sessionEnded);
    return () => window.removeEventListener('zabay:operator-session-ended', sessionEnded);
  }, []);
  const [organizerView, setOrganizerView] = useState<OrganizerView>('overview');
  const [venueView, setVenueView] = useState<'overview' | 'calendar' | 'inventory'>('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeScanCode, setActiveScanCode] = useState<string | undefined>();

  const handleOpenScannerWithCode = (code?: string) => {
    setActiveScanCode(code);
    setIsScannerOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFD] dark:bg-[#0E131C] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Operator Session Badge & Auth Trigger */}
      <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2">
        {authenticated ? (
          <div className="flex items-center gap-2 p-1.5 pl-3 pr-2 rounded-xl bg-white dark:bg-[#171E2B] border border-emerald-300 dark:border-emerald-800/80 shadow-lg text-xs">
            <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Operator Session Active</span>
            </span>
            <button
              onClick={async () => {
                const result = await api.auth.logout();
                if (result.success) {
                  setAuthenticated(false);
                  setLoginError('');
                  void refreshBackendStatus();
                } else {
                  setLoginError(result.error || 'Logout failed');
                }
              }}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              Operator logout
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setLoginOpen(true);
                setLoginError('');
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-[#171E2B] border border-slate-200 dark:border-slate-800 shadow-md text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer group"
              title="Authenticate as privileged system operator to persist database mutations"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#3E6CB5] transition-colors" />
              <span>Operator login</span>
            </button>
            {!loginOpen && loginError && (
              <span role="alert" className="text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/60 px-2 py-1 rounded border border-rose-200 dark:border-rose-900">
                {loginError}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Operator Login Modal Dialog */}
      {loginOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <form
            className="w-full max-w-sm bg-white dark:bg-[#171E2B] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-150"
            onSubmit={async (event) => {
              event.preventDefault();
              const result = await api.auth.login(username, password);
              if (result.success) {
                setAuthenticated(true);
                setLoginOpen(false);
                setPassword('');
                setLoginError('');
                void refreshBackendStatus();
              } else {
                setLoginError(result.error || 'Login failed');
              }
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#EBF3FC] dark:bg-[#1E293B] text-[#244A85] dark:text-[#8BB0E8] flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Operator Authentication</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Authenticate privileged database mutations</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Username
                </label>
                <input
                  aria-label="Operator username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  autoComplete="username"
                  placeholder="e.g. operator"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3E6CB5] transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Password
                </label>
                <input
                  aria-label="Operator password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  placeholder="••••••••••••••••"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3E6CB5] transition-all"
                />
              </div>
            </div>

            {loginError && (
              <div role="alert" className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Local dev credentials:</span>
              <p className="font-mono text-[10px] text-slate-500 dark:text-slate-400">User: <strong className="text-slate-800 dark:text-slate-200">operator</strong></p>
              <p className="font-mono text-[10px] text-slate-500 dark:text-slate-400">Pass: <strong className="text-slate-800 dark:text-slate-200">zabay-operator-secret-2026</strong></p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setLoginOpen(false);
                  setLoginError('');
                }}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-[#3E6CB5] hover:bg-[#325793] text-white shadow-sm transition-colors cursor-pointer"
              >
                Sign in
              </button>
            </div>
          </form>
        </div>
      )}
      {/* Universal Top Workspace Header */}
      <AppHeader
        onOpenAudit={() => setIsAuditOpen(true)}
        onOpenScanner={() => handleOpenScannerWithCode()}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      {/* Main Dual-Layout Shell */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar (Active for Organizer & Venue Manager) */}
        {currentRole !== 'attendee' && currentRole !== 'staff' && (
          <AppSidebar
            currentView={currentRole === 'venue_manager' ? venueView : organizerView}
            onSelectView={(v) => {
              if (currentRole === 'venue_manager') setVenueView(v);
              else setOrganizerView(v);
            }}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />
        )}

        {/* Dynamic Center Work Area with Page-Level Architecture */}
        <main className="flex-1 overflow-y-auto px-6 lg:px-10 py-6 space-y-6">
          {/* 1. Organizer Mode: Operations Studio */}
          {currentRole === 'organizer' && (
            <OrganizerPage
              currentView={organizerView}
              onSelectView={(view) => setOrganizerView(view)}
              onSwitchToStaff={() => setCurrentRole('staff')}
              onScanPass={(code) => handleOpenScannerWithCode(code)}
            />
          )}

          {/* 2. Venue Manager Mode: Facility & Multi-Hall Operations Hub */}
          {currentRole === 'venue_manager' && (
            <VenuePage
              currentView={venueView}
              onSelectView={(v) => setVenueView(v)}
            />
          )}

          {/* 3. Event Staff Mode: Crew Run-of-Show & Shift Portal */}
          {currentRole === 'staff' && <StaffPage />}

          {/* 4. Attendee Mode: Public Discovery, Map & Pass Wallet */}
          {currentRole === 'attendee' && (
            <AttendeePage
              onOpenScannerWithPass={(code) => handleOpenScannerWithCode(code)}
            />
          )}
        </main>
      </div>

      {/* Global Modals */}
      <AuditLogViewer isOpen={isAuditOpen} onClose={() => setIsAuditOpen(false)} />
      <QRCheckInScanner
        isOpen={isScannerOpen}
        initialCode={activeScanCode}
        onClose={() => {
          setIsScannerOpen(false);
          setActiveScanCode(undefined);
        }}
      />
      <ProfileView
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onViewPass={(code) => handleOpenScannerWithCode(code)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
