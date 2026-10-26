import React from 'react';
import {
  LayoutDashboard,
  GitBranch,
  Building2,
  CalendarRange,
  Users,
  UserCheck,
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  CheckSquare,
  Calendar,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useEventRegistrationSummary } from '../../hooks/useEventRegistrationSummary';

export type OrganizerView = 'overview' | 'kanban' | 'top_calendar' | 'venues' | 'personnel' | 'impact' | 'schedule' | 'attendees' | 'analytics';
export type VenueView = 'overview' | 'calendar' | 'inventory';

interface AppSidebarProps {
  currentView: string;
  onSelectView: (view: any) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileDrawer?: boolean;
  onCloseMobile?: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  currentView,
  onSelectView,
  isCollapsed,
  onToggleCollapse,
  isMobileDrawer,
  onCloseMobile,
}) => {
  const { currentRole, setCurrentRole, tasks, registrations, personnel, selectedEvent, isLiveBackend, isDemoMode } = useApp();
  const liveRoster = !isDemoMode && isLiveBackend && currentRole === 'organizer';
  const admission = useEventRegistrationSummary(selectedEvent?.id, liveRoster);

  // Scope counts strictly to the active selected event:
  const activeEventTasks = selectedEvent
    ? tasks.filter((t) => t.event_id === selectedEvent.id)
    : [];

  const activeEventRegistrations = selectedEvent
    ? registrations.filter((r) => r.event_id === selectedEvent.id)
    : [];

  const conflictCount = activeEventTasks.filter((t) => t.has_conflict).length;
  const pendingCheckIn = liveRoster ? admission.data?.pending_count ?? null
    : isDemoMode ? activeEventRegistrations.filter(r => r.status === 'confirmed').length : null;

  // Active crew members assigned to tasks in this event or registered for this event
  const activeCrewCount = selectedEvent
    ? personnel.filter((p) => {
        if (p.event_id === selectedEvent.id) return true;
        return activeEventTasks.some((t) =>
          t.personnel_assignments?.some(
            (a) =>
              a.personnel_id === p.id ||
              a.personnel_name.toLowerCase() === p.name.toLowerCase()
          )
        );
      }).length
    : 0;

  const organizerNav = [
    {
      id: 'overview',
      label: 'Event Overview',
      icon: <LayoutDashboard className="w-4 h-4" />,
      badge: null,
    },
    {
      id: 'kanban',
      label: 'Tasks & Milestones',
      icon: <CheckSquare className="w-4 h-4" />,
      badge: activeEventTasks.length > 0 ? `${activeEventTasks.length}` : null,
      badgeColor: 'bg-[#EBF3FC] text-[#244A85] dark:bg-[#1E293B] dark:text-[#8BB0E8]',
    },
    {
      id: 'top_calendar',
      label: 'Master Schedule',
      icon: <Calendar className="w-4 h-4" />,
      badge: null,
    },
    {
      id: 'venues',
      label: 'Venues & Halls',
      icon: <Building2 className="w-4 h-4" />,
      badge: selectedEvent?.venue_id ? 'Booked' : 'Match',
    },
    {
      id: 'personnel',
      label: 'Staff & Team Roster',
      icon: <Users className="w-4 h-4" />,
      badge: activeCrewCount > 0 ? `${activeCrewCount} crew` : null,
      badgeColor: 'bg-[#EBF3FC] text-[#244A85] dark:bg-[#1E293B] dark:text-[#8BB0E8]',
    },
    {
      id: 'impact',
      label: 'Schedule Delay Checker',
      icon: <GitBranch className="w-4 h-4" />,
      badge: conflictCount > 0 ? `${conflictCount} conflict` : null,
      badgeColor: 'bg-[#F9ECE9] text-[#BA4E3E] dark:bg-[#341D1A] dark:text-[#E48D80]',
    },
    {
      id: 'schedule',
      label: 'Run-of-Show Timeline',
      icon: <CalendarRange className="w-4 h-4" />,
      badge: null,
    },
    {
      id: 'attendees',
      label: 'Guest List & Check-In',
      icon: <UserCheck className="w-4 h-4" />,
      badge: pendingCheckIn !== null && pendingCheckIn > 0 ? `${pendingCheckIn} pending` : null,
      badgeColor: 'bg-[#EDF7F2] text-[#2B6149] dark:bg-[#17271F] dark:text-[#81B89B]',
    },
    {
      id: 'analytics',
      label: 'Budget & Analytics',
      icon: <BarChart3 className="w-4 h-4" />,
      badge: null,
    },
  ];

  const venueNav = [
    {
      id: 'overview',
      label: 'Facility Overview',
      icon: <Building2 className="w-4 h-4" />,
      badge: null,
    },
    {
      id: 'calendar',
      label: 'Bookings & Collision Prevention',
      icon: <CalendarDays className="w-4 h-4" />,
      badge: 'Protected',
      badgeColor: 'bg-[#EEF3ED] text-[#455C42] dark:bg-[#222D21] dark:text-[#A7C2A4]',
    },
    {
      id: 'inventory',
      label: 'Halls & Equipment Inventory',
      icon: <CalendarRange className="w-4 h-4" />,
      badge: null,
    },
  ];

  const activeNav = currentRole === 'venue_manager' ? venueNav : organizerNav;

  return (
    <aside
      className={`bg-white dark:bg-[#1E1C19] border-r border-stone-200/80 dark:border-stone-800/80 flex flex-col justify-between shrink-0 transition-all duration-200 z-20 ${
        isMobileDrawer ? 'w-full h-full border-r-0' : isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Top Header in Sidebar */}
      <div>
        <div className="h-16 px-4 flex items-center justify-between border-b border-stone-200/80 dark:border-stone-800/80">
          {(!isCollapsed || isMobileDrawer) && (
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-stone-900 dark:bg-stone-100 flex items-center justify-center shadow-sm">
                <CalendarDays className="w-4 h-4 text-stone-100 dark:text-stone-900" />
              </div>
              <div>
                <span className="text-sm font-bold tracking-tight text-stone-900 dark:text-stone-100 font-sans">
                  ZABAY
                </span>
                <span className="block text-[10px] text-stone-500 font-mono uppercase tracking-wider">
                  Event Platform
                </span>
              </div>
            </div>
          )}

          {isMobileDrawer ? (
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              title="Close Menu"
            >
              <X className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={onToggleCollapse}
              className={`p-1.5 rounded-lg text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors ${
                isCollapsed ? 'mx-auto' : ''
              }`}
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Section Label */}
        {(!isCollapsed || isMobileDrawer) && (
          <div className="px-4 pt-5 pb-2 text-[10px] font-bold uppercase tracking-wider text-stone-400">
            {currentRole === 'venue_manager' ? 'Venue Operations' : 'Planning & Operations'}
          </div>
        )}

        {/* Nav Items */}
        <nav className="px-2 space-y-1">
          {activeNav.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectView(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#EBF3FC] dark:bg-[#1E293B] text-[#244A85] dark:text-[#8BB0E8] font-bold border border-[#C8DCF7] dark:border-[#2D4160] shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                } ${isCollapsed && !isMobileDrawer ? 'justify-center px-2' : ''}`}
                title={item.label}
              >
                <span className={isActive ? 'text-[#3E6CB5] dark:text-[#7EA6E0]' : 'text-slate-400'}>
                  {item.icon}
                </span>

                {(!isCollapsed || isMobileDrawer) && (
                  <div className="flex-1 flex items-center justify-between text-left truncate">
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                          isActive
                            ? 'bg-[#3E6CB5]/15 text-[#244A85] dark:bg-[#7EA6E0]/20 dark:text-[#8BB0E8]'
                            : item.badgeColor || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Sidebar Info & DB Status */}
      <div className="p-3 border-t border-stone-200/80 dark:border-stone-800/80 space-y-2">
        <button
          onClick={() => setCurrentRole('attendee')}
          className="w-full flex items-center gap-2 p-2 rounded-xl text-xs text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-colors cursor-pointer"
          title="Switch to Public Attendee View"
        >
          <ExternalLink className="w-3.5 h-3.5 text-[#B68366] dark:text-[#D4A58C] shrink-0" />
          {!isCollapsed && <span className="font-semibold truncate">View Public Feed ↗</span>}
        </button>

        {!isCollapsed ? (
          <div className="bg-[#FAF9F5] dark:bg-[#171513] p-2.5 rounded-xl border border-stone-200/80 dark:border-stone-800/80 text-[11px] space-y-1">
            <div className="flex items-center justify-between font-medium">
              <span className="text-stone-500">System Status</span>
              <span className="text-[#5F7D5B] dark:text-[#97B394] font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5F7D5B] dark:bg-[#97B394] animate-pulse" />
                Live Sync
              </span>
            </div>
            <p className="text-[10px] text-stone-400">All services operational</p>
          </div>
        ) : (
          <div className="flex justify-center" title="System Online & Synchronized">
            <span className="w-2.5 h-2.5 rounded-full bg-[#5F7D5B] dark:bg-[#97B394]" />
          </div>
        )}
      </div>
    </aside>
  );
};
