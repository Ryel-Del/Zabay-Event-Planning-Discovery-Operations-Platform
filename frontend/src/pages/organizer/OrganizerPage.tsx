import React from 'react';
import type { OrganizerView } from '../../components/layout/AppSidebar';
import { OperationsOverview } from '../../components/organizer/OperationsOverview';
import { TaskKanbanBoard } from '../../components/organizer/TaskKanbanBoard';
import { TopDownCalendarView } from '../../components/organizer/TopDownCalendarView';
import { VenueMasterDetail } from '../../components/organizer/VenueMasterDetail';
import { EventPeopleAssignments } from '../../components/organizer/EventPeopleAssignments';
import { ChangeImpactSimulator } from '../../components/organizer/ChangeImpactSimulator';
import { TaskGanttView } from '../../components/organizer/TaskGanttView';
import { AttendeeDirectoryDatagrid } from '../../components/organizer/AttendeeDirectoryDatagrid';
import { AnalyticsDashboard } from '../../components/organizer/AnalyticsDashboard';

interface OrganizerPageProps {
  currentView: OrganizerView;
  onSelectView: (view: OrganizerView) => void;
  onSwitchToStaff: () => void;
  onScanPass: (code: string) => void;
}

/**
 * Organizer Page: Central operations cockpit for event organizers in Bohol.
 * Coordinates 9 modular subsystems: Overview, Kanban, Calendar, Venues, Personnel, Impact, Gantt, Attendees, Analytics.
 */
export const OrganizerPage: React.FC<OrganizerPageProps> = ({
  currentView,
  onSelectView,
  onSwitchToStaff,
  onScanPass,
}) => {
  return (
    <div className="space-y-6">
      {currentView === 'overview' && <OperationsOverview onNavigate={onSelectView} />}
      {currentView === 'kanban' && <TaskKanbanBoard onNavigateToPeople={() => onSelectView('personnel')} />}
      {currentView === 'top_calendar' && <TopDownCalendarView />}
      {currentView === 'venues' && <VenueMasterDetail />}
      {currentView === 'personnel' && (
        <EventPeopleAssignments
          onSwitchToStaffView={onSwitchToStaff}
          onNavigateToKanban={() => onSelectView('kanban')}
        />
      )}
      {currentView === 'impact' && <ChangeImpactSimulator />}
      {currentView === 'schedule' && <TaskGanttView />}
      {currentView === 'attendees' && <AttendeeDirectoryDatagrid onScanPassModal={onScanPass} />}
      {currentView === 'analytics' && <AnalyticsDashboard />}
    </div>
  );
};

export default OrganizerPage;
