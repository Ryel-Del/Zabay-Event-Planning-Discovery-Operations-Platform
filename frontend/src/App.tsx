import React, { useEffect, useState } from 'react';
import { Lock, Sparkles } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { AppHeader } from './components/layout/AppHeader';
import { AppSidebar } from './components/layout/AppSidebar';
import type { OrganizerView } from './components/layout/AppSidebar';
import { OrganizerPage } from './pages/organizer/OrganizerPage';
import { VenuePage } from './pages/venue/VenuePage';
import { StaffPage } from './pages/staff/StaffPage';
import { AttendeePage } from './pages/attendee/AttendeePage';
import { AuditLogViewer, QRCheckInScanner, ProfileView, DevCodeModal } from './components/modals';
import { AuthModal } from './components/auth/AuthModal';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import ErrorBoundary from './components/common/ErrorBoundary';
import api from './services/api';

const MainContent: React.FC = () => {
  const {
    currentRole,
    setCurrentRole,
    selectedEvent,
    currentUser,
    isDevModeUnlocked,
    isLiveBackend,
    operatorAuthenticated,
    unlockDevMode,
  } = useApp();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'register' | 'operator'>('signin');
  const [organizerView, setOrganizerView] = useState<OrganizerView>('overview');
  const [venueView, setVenueView] = useState<'overview' | 'calendar' | 'inventory'>('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDevModalOpen, setIsDevModalOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [activeScanCode, setActiveScanCode] = useState<string | undefined>();

  // Global keyboard shortcut to open DevCode modal anywhere (Ctrl+Shift+D or Cmd+Shift+D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        e.preventDefault();
        setIsDevModalOpen((prev) => !prev);
      }
    };
    const handleOpenAuth = () => setIsAuthOpen(true);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('zabay:open-auth', handleOpenAuth);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('zabay:open-auth', handleOpenAuth);
    };
  }, []);

  // When a user opens a shared event deep link (?event=<id>), switch to attendee discovery view so the event story opens
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('event')) {
        setCurrentRole('attendee');
      }
    } catch {
      // ignore
    }
  }, []);

  const handleOpenScannerWithCode = (code?: string) => {
    setActiveScanCode(code);
    setIsScannerOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFD] dark:bg-[#0E131C] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Universal Top Workspace Header */}
      <AppHeader
        onOpenAudit={() => setIsAuditOpen(true)}
        onOpenScanner={() => handleOpenScannerWithCode()}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenDevConsole={() => setIsDevModalOpen(true)}
        onOpenAuth={() => {
          setAuthModalMode('signin');
          setIsAuthOpen(true);
        }}
        onToggleMobileMenu={() => setIsMobileNavOpen((prev) => !prev)}
      />

      {/* Main Dual-Layout Shell */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar (Desktop: md:flex) */}
        {currentRole !== 'attendee' && currentRole !== 'staff' && (isDevModeUnlocked || currentUser.id !== 'usr-guest') && (
          <div className="hidden md:flex shrink-0">
            <AppSidebar
              currentView={currentRole === 'venue_manager' ? venueView : organizerView}
              onSelectView={(v) => {
                if (currentRole === 'venue_manager') setVenueView(v);
                else setOrganizerView(v);
              }}
              isCollapsed={isSidebarCollapsed}
              onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />
          </div>
        )}

        {/* Mobile Slide-Over Navigation Drawer (< md screens) */}
        {isMobileNavOpen && currentRole !== 'attendee' && currentRole !== 'staff' && (isDevModeUnlocked || currentUser.id !== 'usr-guest') && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop Overlay */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
              onClick={() => setIsMobileNavOpen(false)}
            />
            {/* Slide-in Drawer */}
            <div className="relative w-72 max-w-[85vw] h-full bg-white dark:bg-[#1E1C19] shadow-2xl z-10 flex flex-col animate-in slide-in-from-left duration-200">
              <AppSidebar
                currentView={currentRole === 'venue_manager' ? venueView : organizerView}
                onSelectView={(v) => {
                  if (currentRole === 'venue_manager') setVenueView(v);
                  else setOrganizerView(v);
                  setIsMobileNavOpen(false);
                }}
                isCollapsed={false}
                onToggleCollapse={() => {}}
                isMobileDrawer={true}
                onCloseMobile={() => setIsMobileNavOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Dynamic Center Work Area with Page-Level Architecture */}
        <main className="flex-1 overflow-y-auto px-3 sm:px-6 lg:px-10 py-4 sm:py-6 space-y-6 pb-24 md:pb-6">
          {/* Guest Sign-in Guard for Internal Operational Portals */}
          {currentUser.id === 'usr-guest' && !isDevModeUnlocked && currentRole !== 'attendee' ? (
            <div className="max-w-md mx-auto my-12 p-8 bg-white dark:bg-[#171E2B] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm text-center space-y-4 animate-in fade-in">
              <div className="w-14 h-14 bg-[#EBF3FC] dark:bg-[#1E293B] text-[#244A85] dark:text-[#8BB0E8] rounded-2xl flex items-center justify-center mx-auto">
                <Lock className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {currentRole === 'venue_manager'
                    ? 'Venue Manager Access Required'
                    : currentRole === 'staff'
                    ? 'Staff Portal Access Required'
                    : 'Organizer Access Required'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  You are currently browsing as a Guest. Sign in with Google or your account to manage operations, or launch the demo environment to evaluate immediately.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-2">
                <button
                  onClick={() => {
                    setAuthModalMode('signin');
                    setIsAuthOpen(true);
                  }}
                  className="py-2.5 px-4 bg-[#3E6CB5] hover:bg-[#325896] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Sign In with Google / Email
                </button>
                <button
                  onClick={() => {
                    unlockDevMode('DEMO');
                  }}
                  className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Try Bohol Demo</span>
                </button>
                <button
                  onClick={() => setCurrentRole('attendee')}
                  className="py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  Public Feed
                </button>
              </div>
            </div>
          ) : (
            <>
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
              {currentRole === 'attendee' && <AttendeePage />}
            </>
          )}
        </main>
      </div>

      {/* System Status & Evaluation Footer Bar */}
      <footer className="w-full py-2 px-3 sm:px-6 bg-white/90 dark:bg-[#111722]/90 backdrop-blur-xs border-t border-slate-200/80 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-between gap-2.5 shrink-0 z-20">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700 dark:text-slate-300">Zabay OS</span>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <span>Bohol Instance</span>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isLiveBackend ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span data-cy="backend-status" className="font-semibold text-slate-700 dark:text-slate-300">
              {isLiveBackend ? 'Postgres Live' : 'Offline'}
            </span>
          </div>

          <span className="text-slate-300 dark:text-slate-700">•</span>

          {operatorAuthenticated ? (
            <button
              type="button"
              onClick={async () => {
                const res = await api.auth.logout();
                if (res.success) window.location.reload();
              }}
              className="font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 transition-colors cursor-pointer"
            >
              Operator logout
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setAuthModalMode('operator');
                setIsAuthOpen(true);
              }}
              className="font-semibold text-slate-600 hover:text-[#3E6CB5] dark:text-slate-400 dark:hover:text-[#7EA6E0] transition-colors cursor-pointer"
            >
              Operator login
            </button>
          )}

          <span className="text-slate-300 dark:text-slate-700">•</span>

          <button
            type="button"
            onClick={() => setIsDevModalOpen(true)}
            className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            Dev Console
          </button>
        </div>
      </footer>

      {/* Mobile Ergonomic Bottom Navigation Bar (< md screens) */}
      <MobileBottomNav
        currentView={currentRole === 'venue_manager' ? venueView : organizerView}
        onSelectView={(v) => {
          if (currentRole === 'venue_manager') setVenueView(v);
          else setOrganizerView(v);
        }}
        onOpenScanner={() => handleOpenScannerWithCode()}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenAuth={() => {
          setAuthModalMode('signin');
          setIsAuthOpen(true);
        }}
      />

      {/* Global Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode={authModalMode}
        onOpenDevConsole={() => setIsDevModalOpen(true)}
      />
      <AuditLogViewer isOpen={isAuditOpen} onClose={() => setIsAuditOpen(false)} />
      <ErrorBoundary isModal fallbackTitle="Gate Scanner Encountered An Issue" onReset={() => setIsScannerOpen(false)}>
        <QRCheckInScanner
          isOpen={isScannerOpen}
          initialCode={activeScanCode}
          eventId={selectedEvent?.id}
          onClose={() => {
            setIsScannerOpen(false);
            setActiveScanCode(undefined);
          }}
        />
      </ErrorBoundary>
      <ProfileView
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onViewPass={(code) => handleOpenScannerWithCode(code)}
      />
      <DevCodeModal
        isOpen={isDevModalOpen}
        onClose={() => setIsDevModalOpen(false)}
        onOpenScannerWithCode={(code) => handleOpenScannerWithCode(code)}
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
