import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AppHeader } from './components/layout/AppHeader';
import { AppSidebar } from './components/layout/AppSidebar';
import type { OrganizerView } from './components/layout/AppSidebar';
import { OperationsOverview } from './components/organizer/OperationsOverview';
import { ChangeImpactSimulator } from './components/organizer/ChangeImpactSimulator';
import { VenueMasterDetail } from './components/organizer/VenueMasterDetail';
import { TaskGanttView } from './components/organizer/TaskGanttView';
import { TaskKanbanBoard } from './components/organizer/TaskKanbanBoard';
import { TopDownCalendarView } from './components/organizer/TopDownCalendarView';
import { AttendeeDirectoryDatagrid } from './components/organizer/AttendeeDirectoryDatagrid';
import { AnalyticsDashboard } from './components/organizer/AnalyticsDashboard';
import { PersonnelDirectory } from './components/organizer/PersonnelDirectory';
import { PersonnelPortal } from './components/staff/PersonnelPortal';
import { QRCheckInScanner } from './components/organizer/QRCheckInScanner';
import { VenueManagerPortal } from './components/venue/VenueManagerPortal';
import { EventDiscovery } from './components/attendee/EventDiscovery';
import { AuditLogViewer } from './components/audit/AuditLogViewer';

const MainContent: React.FC = () => {
  const { currentRole, setCurrentRole } = useApp();
  const [organizerView, setOrganizerView] = useState<OrganizerView>('overview');
  const [venueView, setVenueView] = useState<'overview' | 'calendar' | 'inventory'>('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
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

        {/* Dynamic Center Work Area */}
        <main className="flex-1 overflow-y-auto px-6 lg:px-10 py-6 space-y-6">
          {/* 1. Organizer Mode Views */}
          {currentRole === 'organizer' && (
            <>
              {organizerView === 'overview' && (
                <OperationsOverview onNavigate={(view) => setOrganizerView(view)} />
              )}
              {organizerView === 'kanban' && <TaskKanbanBoard />}
              {organizerView === 'top_calendar' && <TopDownCalendarView />}
              {organizerView === 'venues' && <VenueMasterDetail />}
              {organizerView === 'personnel' && (
                <PersonnelDirectory onSwitchToStaffView={() => setCurrentRole('staff')} />
              )}
              {organizerView === 'impact' && <ChangeImpactSimulator />}
              {organizerView === 'schedule' && <TaskGanttView />}
              {organizerView === 'attendees' && (
                <AttendeeDirectoryDatagrid
                  onScanPassModal={(code) => handleOpenScannerWithCode(code)}
                />
              )}
              {organizerView === 'analytics' && <AnalyticsDashboard />}
            </>
          )}

          {/* 2. Venue Manager Mode */}
          {currentRole === 'venue_manager' && <VenueManagerPortal />}

          {/* 3. Event Staff Mode (View-Only Personnel Portal) */}
          {currentRole === 'staff' && <PersonnelPortal />}

          {/* 4. Attendee Mode (Public Event Discovery & QR Passes) */}
          {currentRole === 'attendee' && (
            <EventDiscovery
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
