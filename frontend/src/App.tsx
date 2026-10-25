import React, { useEffect, useState } from 'react';
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

const MainContent: React.FC = () => {
  const { currentRole, setCurrentRole, selectedEvent } = useApp();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
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
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
        onOpenAuth={() => setIsAuthOpen(true)}
        onToggleMobileMenu={() => setIsMobileNavOpen((prev) => !prev)}
      />

      {/* Main Dual-Layout Shell */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar (Desktop: md:flex) */}
        {currentRole !== 'attendee' && currentRole !== 'staff' && (
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
        {isMobileNavOpen && currentRole !== 'attendee' && currentRole !== 'staff' && (
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
        <main className="flex-1 overflow-y-auto px-3 sm:px-6 lg:px-10 py-4 sm:py-6 space-y-6">
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
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <AuditLogViewer isOpen={isAuditOpen} onClose={() => setIsAuditOpen(false)} />
      <QRCheckInScanner
        isOpen={isScannerOpen}
        initialCode={activeScanCode}
        eventId={selectedEvent?.id}
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
