import React, { useState } from 'react';
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
  const { currentRole, setCurrentRole } = useApp();
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
          {currentRole === 'venue_manager' && <VenuePage />}

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
