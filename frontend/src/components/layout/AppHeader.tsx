import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar,
  Layers,
  Building2,
  Ticket,
  Sun,
  Moon,
  QrCode,
  History,
  ArrowLeft,
  ChevronDown,
  Check,
  AlertTriangle,
  CheckCircle2,
  Compass,
  MapPin,
  Users,
  Sparkles,
  Plus,
  Trash2,
  Globe,
  Lock,
  User,
  ChevronRight,
  Bell,
  Database,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { mockUsers } from '../../mock/mockData';
import type { UserRole } from '../../types';
import zabayWordmark from '../../assets/zabay-wordmark.png';
import zabayWordmarkWhite from '../../assets/zabay-wordmark-white.png';
import { CreateEventModal } from '../organizer/CreateEventModal';

interface AppHeaderProps {
  onOpenAudit: () => void;
  onOpenScanner: () => void;
  onOpenProfile?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onOpenAudit, onOpenScanner, onOpenProfile }) => {
  const {
    currentRole,
    setCurrentRole,
    currentUser,
    selectedEvent,
    setSelectedEvent,
    events,
    tasks,
    venues,
    auditLogs,
    theme,
    toggleTheme,
    isDemoMode,
    loadDemoData,
    clearToCleanSlate,
    isLiveBackend,
    backendHealth,
    refreshBackendStatus,
    notifications,
    unreadNotificationCount,
    dismissNotification,
    exitStaffPreview,
  } = useApp();

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isEventPickerOpen, setIsEventPickerOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const eventPickerRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const isDark = theme === 'dark';

  const hasConflicts = tasks.some((t) => t.has_conflict);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
      if (eventPickerRef.current && !eventPickerRef.current.contains(e.target as Node)) {
        setIsEventPickerOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRoleSelect = (role: UserRole) => {
    setCurrentRole(role);
    setIsProfileMenuOpen(false);
  };

  return (
    <header className="h-16 bg-white dark:bg-[#171E2B] border-b border-slate-200/80 dark:border-slate-800 px-6 flex items-center justify-between z-30 shrink-0 select-none transition-colors">
      {/* Left: Brand Identity & Context Navigation */}
      <div className="flex items-center gap-4">
        {/* Brand Logo & Site Name */}
        <div
          onClick={() => setCurrentRole('attendee')}
          className="flex items-center gap-2.5 cursor-pointer group"
          title="Zabay - Go to Public Explore Feed"
        >
          <img
            src={zabayWordmark}
            alt="Zabay"
            className="h-8 sm:h-9 w-auto object-contain group-hover:scale-105 transition-transform dark:hidden"
          />
          <img
            src={zabayWordmarkWhite}
            alt="Zabay"
            className="h-8 sm:h-9 w-auto object-contain group-hover:scale-105 transition-transform hidden dark:block"
          />
          {currentRole === 'organizer' && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EBF3FC] text-[#244A85] dark:bg-[#1E293B] dark:text-[#8BB0E8] border border-[#C8DCF7] dark:border-[#2D4160]">
              Studio
            </span>
          )}
          {currentRole === 'venue_manager' && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EDF7F2] text-[#2B6149] dark:bg-[#17271F] dark:text-[#81B89B] border border-[#BDE3CF] dark:border-[#234232]">
              Venue Hub
            </span>
          )}
          {currentRole === 'staff' && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FAF7EE] text-[#8C6212] dark:bg-[#252219] dark:text-[#E8BD68] border border-[#ECD9A8] dark:border-[#5A4B27]">
              Staff View
            </span>
          )}
        </div>

        {/* Studio / Venue Hub Exit Action (Return to Public Community Feed) */}
        {currentRole !== 'attendee' ? (
          <button
            onClick={() => setCurrentRole('attendee')}
            data-cy="attendee-mode"
            className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#3E6CB5] dark:text-[#7EA6E0]" />
            <span>Exit to Public Feed</span>
          </button>
        ) : (
          <div className="hidden md:flex items-center gap-1.5 pl-3 border-l border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Compass className="w-3.5 h-3.5 text-[#3E6CB5] dark:text-[#7EA6E0]" />
            <span>Event Operations & Community Hub</span>
          </div>
        )}
      </div>

      {/* Center: Contextual Tools (Custom Popover Event Selector - NO NATIVE SELECT!) */}
      <div className="flex items-center gap-3">
        {currentRole === 'organizer' && (
          <div className="relative" ref={eventPickerRef}>
            <button
              onClick={() => setIsEventPickerOpen(!isEventPickerOpen)}
              data-cy="event-picker"
              className="flex items-center gap-2.5 bg-[#F8FAFD] dark:bg-[#111722] hover:bg-[#EBF3FC] dark:hover:bg-[#1A2536] px-3.5 py-1.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs transition-all cursor-pointer text-left"
            >
              <Calendar className="w-3.5 h-3.5 text-[#3E6CB5] dark:text-[#7EA6E0] shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-semibold leading-tight hidden lg:block">
                  Active Workspace
                </span>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-[210px] sm:max-w-[280px]">
                  {selectedEvent ? selectedEvent.title : 'No Event Selected'}
                </span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isEventPickerOpen ? 'rotate-180' : ''}`} />

              {/* Visibility & Micro Live Feasibility Pill */}
              {selectedEvent && (
                <div className="hidden sm:flex items-center gap-1.5">
                  {selectedEvent.is_private || selectedEvent.event_type === 'private' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FEF8F2] text-[#8C521E] dark:bg-[#281D14] dark:text-[#E8A568] border border-[#F4DCBE] dark:border-[#523A25]">
                      <Lock className="w-2.5 h-2.5" /> Private
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#EBF3FC] text-[#244A85] dark:bg-[#152338] dark:text-[#8BB0E8] border border-[#C8DCF7] dark:border-[#2D4160]">
                      <Globe className="w-2.5 h-2.5" /> Public
                    </span>
                  )}
                  {hasConflicts ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FDF1EF] text-[#C45547] dark:bg-[#2E1A17] dark:text-[#E07D70] border border-[#F5C2BC] dark:border-[#52251F]">
                      <AlertTriangle className="w-3 h-3" /> Conflict
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#EDF7F2] text-[#2B6149] dark:bg-[#17271F] dark:text-[#81B89B] border border-[#BDE3CF] dark:border-[#234232]">
                      <CheckCircle2 className="w-3 h-3" /> Feasible
                    </span>
                  )}
                </div>
              )}
            </button>

            {/* Custom Modern Floating Dropdown Card */}
            {isEventPickerOpen && (
              <div className="absolute left-0 sm:left-1/2 sm:-translate-x-1/2 top-12 mt-1 w-84 sm:w-96 bg-white dark:bg-[#171E2B] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <span>Switch Managed Event</span>
                  <span className="text-[10px] font-mono text-[#3E6CB5] dark:text-[#7EA6E0] font-normal">
                    {events.length} Active Records
                  </span>
                </div>

                <div className="p-1.5 space-y-1 max-h-72 overflow-y-auto">
                  {events.length === 0 ? (
                    <div className="p-5 text-center space-y-1.5">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Clean Workspace</p>
                      <p className="text-[11px] text-slate-400">No events created yet. Start fresh or load sample data.</p>
                    </div>
                  ) : (
                    events.map((evt) => {
                      const isSelected = selectedEvent ? evt.id === selectedEvent.id : false;
                      const venue = venues.find((v) => v.id === evt.venue_id);
                      const isEvtPrivate = evt.is_private || evt.event_type === 'private';

                      return (
                        <button
                          key={evt.id}
                          onClick={() => {
                            setSelectedEvent(evt);
                            setIsEventPickerOpen(false);
                          }}
                          className={`w-full text-left p-3 rounded-xl transition-all flex items-start justify-between gap-3 cursor-pointer ${
                            isSelected
                              ? 'bg-[#EBF3FC] dark:bg-[#1E293B] border border-[#C8DCF7] dark:border-[#2D4160]'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent'
                          }`}
                        >
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                                {evt.title}
                              </span>
                              {isEvtPrivate ? (
                                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-0.5 shrink-0">
                                  <Lock className="w-2.5 h-2.5" /> Private
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-0.5 shrink-0">
                                  <Globe className="w-2.5 h-2.5" /> Public
                                </span>
                              )}
                              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                                {evt.category}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                {new Date(evt.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </span>
                              {venue && (
                                <span className="flex items-center gap-1 truncate">
                                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                  {venue.city}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3 text-slate-400" />
                                {evt.tickets_sold}/{evt.max_capacity}
                              </span>
                            </div>
                          </div>

                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-[#3E6CB5] text-white flex items-center justify-center shrink-0 mt-0.5">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Footer Controls: Create Event & Demo Toggle */}
                <div className="p-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 bg-slate-50/50 dark:bg-slate-900/30">
                  <button
                    onClick={() => {
                      setIsEventPickerOpen(false);
                      setIsCreateModalOpen(true);
                    }}
                    data-cy="header-create-event"
                    className="w-full py-2 px-3 bg-[#3E6CB5] hover:bg-[#325896] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create New Event</span>
                  </button>

                  {isDemoMode ? (
                    <button
                      onClick={() => {
                        clearToCleanSlate();
                        setIsEventPickerOpen(false);
                      }}
                      className="w-full py-1.5 px-3 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Exit Sample Mode</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        loadDemoData();
                        setIsEventPickerOpen(false);
                      }}
                      className="w-full py-1.5 px-3 bg-[#EBF3FC] hover:bg-[#D4E4F7] dark:bg-[#1E293B] dark:hover:bg-[#283852] text-[#244A85] dark:text-[#8BB0E8] rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-[#3E6CB5] dark:text-[#7EA6E0]" />
                      <span>Load Bohol Sample Data</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {currentRole === 'venue_manager' && (
          <div className="hidden sm:flex items-center gap-2 bg-[#F8FAFD] dark:bg-[#111722] px-3.5 py-1.5 rounded-xl border border-slate-200/90 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Building2 className="w-3.5 h-3.5 text-[#4E8268] dark:text-[#81B89B]" />
            <span>Bohol Cultural Center Management</span>
          </div>
        )}
      </div>

      {/* Right: Actions, Studio CTA & Account Menu */}
      <div className="flex items-center gap-2.5">
        {/* Workspace Mode Indicator / Quick Toggle */}
        <div className="hidden lg:flex items-center">
          {isDemoMode ? (
            <button
              onClick={clearToCleanSlate}
              className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-[#244A85] dark:text-[#8BB0E8] bg-[#EBF3FC] dark:bg-[#1E293B] border border-[#C8DCF7] dark:border-[#2D4160] rounded-xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 transition-all cursor-pointer group"
              title="Click to reset to clean initial workspace"
            >
              <Sparkles className="w-3 h-3 text-[#3E6CB5] dark:text-[#7EA6E0] group-hover:hidden" />
              <Trash2 className="w-3 h-3 text-rose-600 hidden group-hover:inline" />
              <span className="group-hover:hidden">Sample Bohol Data</span>
              <span className="hidden group-hover:inline">Exit Sample Mode</span>
            </button>
          ) : (
            <button
              onClick={loadDemoData}
              className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-[#F8FAFD] dark:bg-[#111722] hover:bg-[#EBF3FC] dark:hover:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-xl transition-all cursor-pointer"
              title="1-Click load Bohol venues, tasks, and registrations for quick testing"
            >
              <Sparkles className="w-3 h-3 text-[#3E6CB5] dark:text-[#7EA6E0]" />
              <span>Load Sample Data</span>
            </button>
          )}
        </div>

        {/* Creator / Host Studio CTA (When viewing the Public Feed) */}
        {currentRole === 'attendee' && (
          <button
            onClick={() => setCurrentRole('organizer')}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#3E6CB5] hover:bg-[#325896] dark:bg-[#4E80CD] dark:hover:bg-[#3E6CB5] text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-[#D4E4F7]" />
            <span>Organizer Studio</span>
          </button>
        )}

        {/* Exit Staff Preview CTA (When viewing Staff Shift Portal) */}
        {currentRole === 'staff' && (
          <button
            onClick={exitStaffPreview}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#3E6CB5] hover:bg-[#325896] dark:bg-[#4E80CD] dark:hover:bg-[#3E6CB5] text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#D4E4F7]" />
            <span>Back to Studio</span>
          </button>
        )}

        {/* Operational Fast Tools (Active inside Studio) */}
        {currentRole === 'organizer' && (
          <>
            <button
              onClick={onOpenScanner}
              data-cy="gate-scanner-open"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
              title="Open Webcam QR Gate Scanner"
            >
              <QrCode className="w-3.5 h-3.5 text-[#3E6CB5] dark:text-[#7EA6E0]" />
              <span className="hidden md:inline">Camera Scanner</span>
            </button>

            <button
              onClick={onOpenAudit}
              className="relative p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 bg-[#F8FAFD] dark:bg-[#111722] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-slate-200 dark:border-slate-800 cursor-pointer"
              title="View Live DB Audit Logs"
            >
              <History className="w-4 h-4" />
              {auditLogs.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#3E6CB5] dark:bg-[#7EA6E0] text-white dark:text-slate-950 text-[9px] font-bold rounded-full flex items-center justify-center">
                  {auditLogs.length}
                </span>
              )}
            </button>
          </>
        )}

        {/* Database Live Connection Status Badge (Member 3 Connector) */}
        <div
          onClick={refreshBackendStatus}
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer select-none ${
            isLiveBackend
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
              : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/80 hover:bg-amber-100 dark:hover:bg-amber-900/40'
          }`}
          title={
            isLiveBackend
              ? 'PostgreSQL queries for venues and events succeeded. Click to recheck.'
              : backendHealth ? 'Backend is online, but PostgreSQL data is unavailable. Click to recheck.' : 'Backend unavailable. Click to recheck.'
          }
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isLiveBackend ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
            }`}
          />
          <Database className="w-3 h-3 opacity-70" />
          <span data-cy="backend-status">{isDemoMode ? 'Sample Mode' : isLiveBackend ? 'Postgres Live' : backendHealth ? 'API Only' : 'Offline'}</span>
        </div>

        {/* Live Notification Center */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 bg-[#F8FAFD] dark:bg-[#111722] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-slate-200 dark:border-slate-800 cursor-pointer"
            title="Event Schedule & Broadcast Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadNotificationCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 top-12 mt-1 w-80 bg-white dark:bg-[#171E2B] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-3.5 h-3.5 text-[#3E6CB5] dark:text-[#7EA6E0]" />
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Live Notifications</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {notifications.length} total
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No active notifications
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="p-3 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors space-y-1 relative group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`text-xs font-bold leading-tight ${
                            notif.type === 'warning'
                              ? 'text-amber-600 dark:text-amber-400'
                              : notif.type === 'success'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          {notif.title}
                        </span>
                        <button
                          onClick={() => dismissNotification(notif.id)}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                          title="Dismiss notification"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-normal">
                        {notif.message}
                      </p>
                      <span className="text-[9px] text-slate-400 font-mono block">
                        {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle (Sun / Moon) */}
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 bg-[#F8FAFD] dark:bg-[#111722] hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors border border-slate-200 dark:border-slate-800 cursor-pointer"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun className="w-4 h-4 text-[#7EA6E0]" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* User Account & Workspace Dropdown Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center gap-2 p-1 pl-2 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-xl transition-all cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-300 dark:ring-slate-700"
            />
            <div className="hidden lg:block text-left pr-1">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-200 leading-none">
                {currentUser.name}
              </p>
              <p className="text-[10px] text-slate-500 capitalize mt-0.5">
                {currentRole === 'organizer'
                  ? 'Organizer'
                  : currentRole === 'venue_manager'
                  ? 'Venue Manager'
                  : currentRole === 'staff'
                  ? 'Staff & Field Crew'
                  : 'Public Attendee'}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Profile Dropdown */}
          {isProfileMenuOpen && (
            <div className="absolute right-0 top-12 mt-1 w-72 bg-white dark:bg-[#171E2B] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              {/* Account Header */}
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-3">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-300 dark:ring-slate-700"
                  />
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {currentUser.name}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {currentUser.email}
                    </p>
                    <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#EBF3FC] text-[#244A85] dark:bg-[#1E293B] dark:text-[#8BB0E8] border border-[#C8DCF7] dark:border-[#2D4160]">
                      {currentRole.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Profile Page Action */}
              <div className="p-2 border-b border-slate-100 dark:border-slate-800/80">
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    if (onOpenProfile) onOpenProfile();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-[#EBF3FC] dark:hover:bg-[#1E293B] hover:text-[#244A85] dark:hover:text-[#8BB0E8] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <User className="w-4 h-4 text-[#3E6CB5] dark:text-[#7EA6E0]" />
                    <span>My Profile & Events</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>

              {/* Workspace Switcher */}
              <div className="p-2 space-y-1">
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Switch Workspace
                </div>

                <button
                  onClick={() => handleRoleSelect('organizer')}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs transition-colors cursor-pointer ${
                    currentRole === 'organizer'
                      ? 'bg-[#EBF3FC] dark:bg-[#1E293B] text-[#244A85] dark:text-[#8BB0E8] font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Layers className="w-4 h-4 text-[#3E6CB5] dark:text-[#7EA6E0]" />
                    <div className="text-left">
                      <p className="font-semibold">Organizer Studio</p>
                      <p className="text-[10px] text-slate-500">Event operations, DAG & Gantt</p>
                    </div>
                  </div>
                  {currentRole === 'organizer' && <Check className="w-4 h-4 text-[#3E6CB5] dark:text-[#7EA6E0]" />}
                </button>

                <button
                  onClick={() => handleRoleSelect('venue_manager')}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs transition-colors cursor-pointer ${
                    currentRole === 'venue_manager'
                      ? 'bg-[#EDF7F2] dark:bg-[#17271F] text-[#2B6149] dark:text-[#81B89B] font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4 text-[#4E8268] dark:text-[#81B89B]" />
                    <div className="text-left">
                      <p className="font-semibold">Venue Partner Hub</p>
                      <p className="text-[10px] text-slate-500">Facility availability & collision-safe bookings</p>
                    </div>
                  </div>
                  {currentRole === 'venue_manager' && <Check className="w-4 h-4 text-[#4E8268] dark:text-[#81B89B]" />}
                </button>

                <button
                  onClick={() => handleRoleSelect('staff')}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs transition-colors cursor-pointer ${
                    currentRole === 'staff'
                      ? 'bg-[#FAF7EE] dark:bg-[#252219] text-[#8C6212] dark:text-[#E8BD68] font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-[#8C6212] dark:text-[#E8BD68]" />
                    <div className="text-left">
                      <p className="font-semibold">Event Staff Portal</p>
                      <p className="text-[10px] text-slate-500">Shift pass, duties checklist & gate scanner</p>
                    </div>
                  </div>
                  {currentRole === 'staff' && <Check className="w-4 h-4 text-[#8C6212] dark:text-[#E8BD68]" />}
                </button>

                <button
                  onClick={() => handleRoleSelect('attendee')}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs transition-colors cursor-pointer ${
                    currentRole === 'attendee'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Ticket className="w-4 h-4 text-[#3E6CB5] dark:text-[#7EA6E0]" />
                    <div className="text-left">
                      <p className="font-semibold">Public Event Feed</p>
                      <p className="text-[10px] text-slate-500">Discover events & QR passes</p>
                    </div>
                  </div>
                  {currentRole === 'attendee' && <Check className="w-4 h-4 text-slate-900 dark:text-slate-100" />}
                </button>
              </div>

              {/* Demo Persona Switcher */}
              <div className="p-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1">
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Demo Personas (Evaluation)
                </div>

                <div className="space-y-0.5">
                  {mockUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleRoleSelect(user.role)}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                        currentUser.id === user.id
                          ? 'bg-slate-100 dark:bg-slate-800 font-semibold text-slate-900 dark:text-slate-100'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <img src={user.avatar} alt={user.name} className="w-5 h-5 rounded-full object-cover" />
                      <span className="flex-1 truncate">{user.name}</span>
                      <span className="text-[9px] text-slate-400 capitalize">{user.role.replace('_', ' ')}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </header>
  );
};
