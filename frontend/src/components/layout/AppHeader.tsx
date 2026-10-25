import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  Plus,
  Globe,
  Lock,
  User,
  ChevronRight,
  Bell,
  X,
  Terminal,
  Menu,
  LogOut,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { UserRole } from '../../types';
import zabayWordmark from '../../assets/zabay-wordmark.png';
import zabayWordmarkWhite from '../../assets/zabay-wordmark-white.png';
import { CreateEventModal } from '../organizer/CreateEventModal';
import { AuthModal } from '../auth/AuthModal';

interface AppHeaderProps {
  onOpenAudit: () => void;
  onOpenScanner: () => void;
  onOpenProfile?: () => void;
  onOpenDevConsole?: () => void;
  onOpenAuth?: () => void;
  onToggleMobileMenu?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onOpenAudit,
  onOpenScanner,
  onOpenProfile,
  onOpenDevConsole,
  onOpenAuth,
  onToggleMobileMenu,
}) => {
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
    isDevModeUnlocked,
    unlockedDevCode,
    lockDevMode,
    signOut,
    notifications,
    unreadNotificationCount,
    dismissNotification,
    exitStaffPreview,
  } = useApp();

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isEventPickerOpen, setIsEventPickerOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const eventPickerRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const isDark = theme === 'dark';

  const hasConflicts = tasks.some((t) => t.has_conflict);

  const managedEvents = useMemo(() => {
    if (isDevModeUnlocked && currentUser.id === 'usr-org-1') {
      return events;
    }
    if (currentUser.id === 'usr-guest') {
      return [];
    }
    return events.filter((e) => e.organizer_id === currentUser.id);
  }, [events, currentUser.id, isDevModeUnlocked]);

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
    <header className="h-16 bg-white dark:bg-[#171E2B] border-b border-slate-200/80 dark:border-slate-800 px-3 sm:px-6 flex items-center justify-between z-30 shrink-0 select-none transition-colors">
      {/* Left: Brand Identity & Context Navigation */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Mobile Hamburger Drawer Trigger (For Organizer & Venue Manager on < md) */}
        {onToggleMobileMenu && (currentRole === 'organizer' || currentRole === 'venue_manager') && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-1.5 -ml-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Open Navigation Menu"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Brand Logo & Site Name */}
        <div
          onClick={() => setCurrentRole('attendee')}
          className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group shrink-0"
          title="Zabay - Go to Public Explore Feed"
        >
          <img
            src={zabayWordmark}
            alt="Zabay"
            className="h-6 sm:h-9 w-auto object-contain group-hover:scale-105 transition-transform dark:hidden shrink-0"
          />
          <img
            src={zabayWordmarkWhite}
            alt="Zabay"
            className="h-6 sm:h-9 w-auto object-contain group-hover:scale-105 transition-transform hidden dark:block shrink-0"
          />
          {currentRole === 'organizer' && (
            <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EBF3FC] text-[#244A85] dark:bg-[#1E293B] dark:text-[#8BB0E8] border border-[#C8DCF7] dark:border-[#2D4160]">
              Studio
            </span>
          )}
          {currentRole === 'venue_manager' && (
            <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EDF7F2] text-[#2B6149] dark:bg-[#17271F] dark:text-[#81B89B] border border-[#BDE3CF] dark:border-[#234232]">
              Venue Hub
            </span>
          )}
          {currentRole === 'staff' && (
            <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FAF7EE] text-[#8C6212] dark:bg-[#252219] dark:text-[#E8BD68] border border-[#ECD9A8] dark:border-[#5A4B27]">
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
      <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
        {currentRole === 'organizer' && (
          <div className="relative min-w-0" ref={eventPickerRef}>
            <button
              onClick={() => setIsEventPickerOpen(!isEventPickerOpen)}
              data-cy="event-picker"
              className="flex items-center gap-1.5 sm:gap-2.5 bg-[#F8FAFD] dark:bg-[#111722] hover:bg-[#EBF3FC] dark:hover:bg-[#1A2536] px-2 py-1 xs:px-2.5 xs:py-1.5 sm:px-3.5 sm:py-1.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs transition-all cursor-pointer text-left max-w-full"
            >
              <Calendar className="w-3.5 h-3.5 text-[#3E6CB5] dark:text-[#7EA6E0] shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-slate-400 font-semibold leading-tight hidden lg:block">
                  Active Workspace
                </span>
                <span className="text-[11px] xs:text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-[85px] xs:max-w-[125px] sm:max-w-[200px] md:max-w-[260px]">
                  {selectedEvent ? selectedEvent.title : 'No Event Selected'}
                </span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${isEventPickerOpen ? 'rotate-180' : ''}`} />

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
              <div className="absolute left-0 sm:left-1/2 sm:-translate-x-1/2 top-12 mt-1 w-[calc(100vw-2rem)] max-w-sm sm:w-96 bg-white dark:bg-[#171E2B] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <span>Switch Managed Event</span>
                  <span className="text-[10px] font-mono text-[#3E6CB5] dark:text-[#7EA6E0] font-normal">
                    {managedEvents.length} {managedEvents.length === 1 ? 'Event' : 'Events'}
                  </span>
                </div>

                <div className="p-1.5 space-y-1 max-h-72 overflow-y-auto">
                  {managedEvents.length === 0 ? (
                    <div className="p-5 text-center space-y-1.5">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Clean Workspace</p>
                      <p className="text-[11px] text-slate-400">
                        You have not created any events yet. Create your first Bohol event to activate this workspace.
                      </p>
                    </div>
                  ) : (
                    managedEvents.map((evt) => {
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

                {/* Footer Controls: Create Event & Dev-only Demo Toggle */}
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
      <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2.5 shrink-0">
        {/* Creator / Host Studio CTA (When viewing the Public Feed - shown on desktop md+; mobile has bottom nav) */}
        {currentRole === 'attendee' && (
          <button
            onClick={() => setCurrentRole('organizer')}
            className="hidden md:flex items-center gap-2 px-3.5 py-1.5 bg-[#3E6CB5] hover:bg-[#325896] dark:bg-[#4E80CD] dark:hover:bg-[#3E6CB5] text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer shrink-0 whitespace-nowrap"
          >
            <Layers className="w-3.5 h-3.5 text-[#D4E4F7]" />
            <span>Organizer Studio</span>
          </button>
        )}

        {/* Exit Staff Preview CTA (When viewing Staff Shift Portal) */}
        {currentRole === 'staff' && (
          <button
            onClick={exitStaffPreview}
            className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-[#3E6CB5] hover:bg-[#325896] dark:bg-[#4E80CD] dark:hover:bg-[#3E6CB5] text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#D4E4F7]" />
            <span className="hidden xs:inline">Back to Studio</span>
          </button>
        )}

        {/* Operational Fast Tools (Active inside Studio - desktop & tablet; mobile has bottom nav) */}
        {currentRole === 'organizer' && (
          <>
            <button
              onClick={onOpenScanner}
              data-cy="gate-scanner-open"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
              title="Open Webcam QR Gate Scanner"
            >
              <QrCode className="w-3.5 h-3.5 text-[#3E6CB5] dark:text-[#7EA6E0]" />
              <span className="hidden md:inline">Camera Scanner</span>
            </button>

            <button
              onClick={onOpenAudit}
              className="hidden sm:flex relative p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 bg-[#F8FAFD] dark:bg-[#111722] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-slate-200 dark:border-slate-800 cursor-pointer"
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

        {/* Live Notification Center */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-1.5 sm:p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 bg-[#F8FAFD] dark:bg-[#111722] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-slate-200 dark:border-slate-800 cursor-pointer shrink-0"
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
            <div className="absolute right-0 top-12 mt-1 w-[calc(100vw-2rem)] max-w-xs sm:w-80 bg-white dark:bg-[#171E2B] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
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

        {/* Theme Toggle (Sun / Moon) - Displayed on sm+ to keep mobile header clean; accessible in avatar dropdown */}
        <button
          onClick={toggleTheme}
          className="hidden sm:flex p-1.5 sm:p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 bg-[#F8FAFD] dark:bg-[#111722] hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors border border-slate-200 dark:border-slate-800 cursor-pointer shrink-0"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun className="w-4 h-4 text-[#7EA6E0]" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Sign In CTA (Shown on desktop md+; on mobile, Sign In is already in the bottom nav bar) */}
        {currentUser.id === 'usr-guest' && (
          <button
            onClick={() => (onOpenAuth ? onOpenAuth() : setIsAuthModalOpen(true))}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#3E6CB5] hover:bg-[#325896] dark:bg-[#4E80CD] dark:hover:bg-[#3E6CB5] rounded-xl transition-all shadow-xs cursor-pointer shrink-0 whitespace-nowrap"
            title="Sign In with Google or Email"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        )}

        {/* User Account & Workspace Dropdown Menu */}
        <div className="relative shrink-0" ref={menuRef}>
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center gap-1.5 sm:gap-2 p-1 pl-1.5 sm:pl-2 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-xl transition-all cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
          >
            {currentUser.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-300 dark:ring-slate-700"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400">
                <User className="w-4 h-4" />
              </div>
            )}
            <div className="hidden lg:block text-left pr-1">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-200 leading-none">
                {currentUser.name}
              </p>
              <p className="text-[10px] text-slate-500 capitalize mt-0.5">
                {currentUser.id === 'usr-guest'
                  ? 'Visitor'
                  : currentRole === 'organizer'
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
            <div className="absolute right-0 top-12 mt-1 w-[calc(100vw-2rem)] max-w-xs sm:w-72 bg-white dark:bg-[#171E2B] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              {/* Account Header */}
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-3">
                  {currentUser.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-300 dark:ring-slate-700"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {currentUser.name}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {currentUser.email || 'Browsing as Guest'}
                    </p>
                    <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#EBF3FC] text-[#244A85] dark:bg-[#1E293B] dark:text-[#8BB0E8] border border-[#C8DCF7] dark:border-[#2D4160]">
                      {currentUser.id === 'usr-guest' ? 'Public Visitor' : currentRole.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Guest Quick Sign-in Action */}
              {currentUser.id === 'usr-guest' && (
                <div className="p-2 border-b border-slate-100 dark:border-slate-800/80">
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      if (onOpenAuth) onOpenAuth();
                      else setIsAuthModalOpen(true);
                    }}
                    className="w-full py-2.5 px-3 bg-[#3E6CB5] hover:bg-[#325896] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Please Sign In / Register</span>
                  </button>
                </div>
              )}

              {/* Profile Page & Theme Toggle Actions */}
              <div className="p-2 border-b border-slate-100 dark:border-slate-800/80 space-y-1">
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

                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    {isDark ? <Sun className="w-4 h-4 text-[#7EA6E0]" /> : <Moon className="w-4 h-4 text-slate-600" />}
                    <span>Theme: {isDark ? 'Dark Mode' : 'Light Mode'}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Toggle</span>
                </button>
              </div>

              {/* Workspace Switcher (Accessible when signed in or when dev mode unlocked) */}
              {(isDevModeUnlocked || currentUser.id !== 'usr-guest') ? (
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
                        <p className="text-[10px] text-slate-500">Event operations, schedule & planning</p>
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
              ) : (
                <div className="p-2 space-y-1">
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      if (onOpenAuth) onOpenAuth();
                      else setIsAuthModalOpen(true);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs hover:bg-[#EBF3FC] dark:hover:bg-[#1E293B] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Building2 className="w-4 h-4 text-[#3E6CB5] dark:text-[#7EA6E0]" />
                      <div className="text-left">
                        <p className="font-semibold">Host an Event</p>
                        <p className="text-[10px] text-slate-500">Sign in to organize and manage operations</p>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              )}

              <div className="p-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                {currentUser.id !== 'usr-guest' ? (
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      signOut();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      if (onOpenAuth) onOpenAuth();
                      else setIsAuthModalOpen(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-[#EBF3FC] text-[#244A85] dark:bg-[#1E293B] dark:text-[#8BB0E8] border border-[#C8DCF7] dark:border-[#2D4160] rounded-xl text-xs font-bold hover:bg-[#3E6CB5] hover:text-white transition-all cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Sign In / Create Account</span>
                  </button>
                )}

                {/* Developer Access / Evaluation Tools in dedicated separate menu */}
                {isDevModeUnlocked ? (
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider px-1">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Dev Console ({unlockedDevCode || 'Active'})
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          if (onOpenDevConsole) onOpenDevConsole();
                        }}
                        className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 transition-colors cursor-pointer"
                      >
                        <Terminal className="w-3 h-3" />
                        <span>Console</span>
                      </button>
                      <button
                        onClick={() => {
                          lockDevMode();
                          setIsProfileMenuOpen(false);
                        }}
                        className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                      >
                        <Lock className="w-3 h-3" />
                        <span>Lock</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      if (onOpenDevConsole) onOpenDevConsole();
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-1 text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                  >
                    <Terminal className="w-3 h-3" />
                    <span>Developer / Evaluation Access</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {!onOpenAuth && (
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />
      )}
    </header>
  );
};
