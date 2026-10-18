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
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { mockUsers } from '../../mock/mockData';
import type { UserRole } from '../../types';

interface AppHeaderProps {
  onOpenAudit: () => void;
  onOpenScanner: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onOpenAudit, onOpenScanner }) => {
  const {
    currentRole,
    setCurrentRole,
    currentUser,
    selectedEvent,
    setSelectedEvent,
    events,
    tasks,
    auditLogs,
    theme,
    toggleTheme,
  } = useApp();

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isDark = theme === 'dark';

  const hasConflicts = tasks.some((t) => t.has_conflict);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
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
    <header className="h-16 bg-white dark:bg-[#1E1C19] border-b border-stone-200/80 dark:border-stone-800/80 px-6 flex items-center justify-between z-30 shrink-0 select-none">
      {/* Left: Brand Identity & Context Navigation */}
      <div className="flex items-center gap-4">
        {/* Brand Logo */}
        <div
          onClick={() => setCurrentRole('attendee')}
          className="flex items-center gap-2.5 cursor-pointer group"
          title="Go to Public Explore Feed"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#946247] to-[#B68366] text-white flex items-center justify-center font-bold font-serif text-base shadow-sm group-hover:scale-105 transition-transform">
            Z
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-bold tracking-tight text-stone-900 dark:text-stone-100 font-serif">
              ZABAY
            </span>
            {currentRole === 'organizer' && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#F6EFE9] text-[#885B43] dark:bg-[#2B231D] dark:text-[#DEC0B0] border border-[#EBDFD5] dark:border-[#3E322A]">
                Studio
              </span>
            )}
            {currentRole === 'venue_manager' && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EEF3ED] text-[#455C42] dark:bg-[#222D21] dark:text-[#A7C2A4] border border-[#5F7D5B]/30">
                Venue Hub
              </span>
            )}
          </div>
        </div>

        {/* Studio / Venue Hub Exit Action (Return to Public Community Feed) */}
        {currentRole !== 'attendee' ? (
          <button
            onClick={() => setCurrentRole('attendee')}
            className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 px-3 py-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-colors cursor-pointer border border-transparent hover:border-stone-200 dark:hover:border-stone-700"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Exit to Public Feed</span>
          </button>
        ) : (
          <div className="hidden md:flex items-center gap-1 pl-2 border-l border-stone-200 dark:border-stone-800 text-xs font-semibold text-stone-500">
            <Compass className="w-3.5 h-3.5 text-[#B68366] dark:text-[#D4A58C]" />
            <span>Discover Events & Communities</span>
          </div>
        )}
      </div>

      {/* Center: Contextual Tools (Active Event in Studio mode) */}
      <div className="flex items-center gap-3">
        {currentRole === 'organizer' && (
          <div className="flex items-center gap-2.5 bg-[#FAF9F5] dark:bg-[#171513] px-3.5 py-1.5 rounded-xl border border-stone-200/80 dark:border-stone-800/80 shadow-xs">
            <Calendar className="w-3.5 h-3.5 text-[#B68366] dark:text-[#D4A58C] shrink-0" />
            <span className="text-xs text-stone-400 hidden lg:inline">Managing:</span>
            <select
              value={selectedEvent.id}
              onChange={(e) => {
                const found = events.find((x) => x.id === e.target.value);
                if (found) setSelectedEvent(found);
              }}
              className="bg-transparent text-xs font-bold text-stone-900 dark:text-stone-100 focus:outline-none cursor-pointer pr-1"
            >
              {events.map((evt) => (
                <option key={evt.id} value={evt.id} className="bg-white dark:bg-[#1E1C19]">
                  {evt.title}
                </option>
              ))}
            </select>

            {/* Micro Live Feasibility Pill */}
            {hasConflicts ? (
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#F9ECE9] text-[#BA4E3E] dark:bg-[#341D1A] dark:text-[#E48D80]">
                <AlertTriangle className="w-3 h-3" /> Conflict
              </span>
            ) : (
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#EEF3ED] text-[#455C42] dark:bg-[#222D21] dark:text-[#A7C2A4]">
                <CheckCircle2 className="w-3 h-3" /> Feasible
              </span>
            )}
          </div>
        )}

        {currentRole === 'venue_manager' && (
          <div className="hidden sm:flex items-center gap-2 bg-[#FAF9F5] dark:bg-[#171513] px-3.5 py-1.5 rounded-xl border border-stone-200/80 dark:border-stone-800/80 text-xs font-semibold text-stone-700 dark:text-stone-300">
            <Building2 className="w-3.5 h-3.5 text-[#5F7D5B] dark:text-[#97B394]" />
            <span>Metropolis Convention Center Management</span>
          </div>
        )}
      </div>

      {/* Right: Actions, Studio CTA & Account Menu */}
      <div className="flex items-center gap-2.5">
        {/* Creator / Host Studio CTA (When viewing the Public Feed, like YouTube Studio or Airbnb Host) */}
        {currentRole === 'attendee' && (
          <button
            onClick={() => setCurrentRole('organizer')}
            className="flex items-center gap-2 px-3.5 py-2 bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-[#D4A58C] dark:text-[#885B43]" />
            <span>Organizer Studio</span>
          </button>
        )}

        {/* Operational Fast Tools (Active when inside Studio) */}
        {currentRole === 'organizer' && (
          <>
            <button
              onClick={onOpenScanner}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-800 dark:text-stone-200 bg-[#FAF9F5] dark:bg-[#171513] border border-stone-200 dark:border-stone-800 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors shadow-xs cursor-pointer"
              title="Open Gate Check-in Scanner"
            >
              <QrCode className="w-3.5 h-3.5 text-[#5F7D5B] dark:text-[#97B394]" />
              <span className="hidden md:inline">Gate Scanner</span>
            </button>

            <button
              onClick={onOpenAudit}
              className="relative p-2 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 bg-[#FAF9F5] dark:bg-[#171513] hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors border border-stone-200 dark:border-stone-800 cursor-pointer"
              title="View Live DB Audit Logs"
            >
              <History className="w-4 h-4" />
              {auditLogs.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#B68366] dark:bg-[#D4A58C] text-white dark:text-stone-950 text-[9px] font-bold rounded-full flex items-center justify-center">
                  {auditLogs.length}
                </span>
              )}
            </button>
          </>
        )}

        {/* Theme Toggle (Sun / Moon) */}
        <button
          onClick={toggleTheme}
          className="p-2 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 bg-[#FAF9F5] dark:bg-[#171513] hover:bg-stone-200 dark:hover:bg-stone-800 rounded-xl transition-colors border border-stone-200 dark:border-stone-800 cursor-pointer"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun className="w-4 h-4 text-[#D4A58C]" /> : <Moon className="w-4 h-4 text-stone-600" />}
        </button>

        {/* User Account & Workspace Dropdown Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center gap-2 p-1 pl-2 hover:bg-stone-100 dark:hover:bg-stone-800/60 rounded-xl transition-all cursor-pointer border border-transparent hover:border-stone-200 dark:hover:border-stone-700"
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full object-cover ring-1 ring-stone-300 dark:ring-stone-700"
            />
            <div className="hidden lg:block text-left pr-1">
              <p className="text-xs font-semibold text-stone-900 dark:text-stone-200 leading-none">
                {currentUser.name}
              </p>
              <p className="text-[10px] text-stone-500 capitalize mt-0.5">
                {currentRole === 'organizer'
                  ? 'Organizer'
                  : currentRole === 'venue_manager'
                  ? 'Venue Manager'
                  : 'Public Attendee'}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
          </button>

          {/* Real-World Dropdown (Like YouTube Studio / Airbnb Host Switcher) */}
          {isProfileMenuOpen && (
            <div className="absolute right-0 top-12 mt-1 w-72 bg-white dark:bg-[#1E1C19] border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              {/* Account Header */}
              <div className="px-4 py-3 border-b border-stone-100 dark:border-stone-800/80">
                <div className="flex items-center gap-3">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-10 h-10 rounded-full object-cover ring-1 ring-stone-300 dark:ring-stone-700"
                  />
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                      {currentUser.name}
                    </p>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                      {currentUser.email}
                    </p>
                    <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#FAF9F5] dark:bg-[#171513] text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-800">
                      {currentRole.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Workspace Switcher (The Core YouTube Studio / Feed Paradigm) */}
              <div className="p-2 space-y-1">
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Switch Workspace
                </div>

                <button
                  onClick={() => handleRoleSelect('organizer')}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs transition-colors cursor-pointer ${
                    currentRole === 'organizer'
                      ? 'bg-[#F6EFE9] dark:bg-[#2B231D] text-[#885B43] dark:text-[#DEC0B0] font-semibold'
                      : 'text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Layers className="w-4 h-4 text-[#B68366] dark:text-[#D4A58C]" />
                    <div className="text-left">
                      <p className="font-semibold">Organizer Studio</p>
                      <p className="text-[10px] text-stone-500">Cvent operations, DAG & Gantt</p>
                    </div>
                  </div>
                  {currentRole === 'organizer' && <Check className="w-4 h-4 text-[#885B43] dark:text-[#DEC0B0]" />}
                </button>

                <button
                  onClick={() => handleRoleSelect('venue_manager')}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs transition-colors cursor-pointer ${
                    currentRole === 'venue_manager'
                      ? 'bg-[#EEF3ED] dark:bg-[#222D21] text-[#455C42] dark:text-[#A7C2A4] font-semibold'
                      : 'text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4 text-[#5F7D5B] dark:text-[#97B394]" />
                    <div className="text-left">
                      <p className="font-semibold">Venue Partner Hub</p>
                      <p className="text-[10px] text-stone-500">Capacity & EXCLUDE bookings</p>
                    </div>
                  </div>
                  {currentRole === 'venue_manager' && <Check className="w-4 h-4 text-[#455C42] dark:text-[#A7C2A4]" />}
                </button>

                <button
                  onClick={() => handleRoleSelect('attendee')}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs transition-colors cursor-pointer ${
                    currentRole === 'attendee'
                      ? 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-semibold'
                      : 'text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Ticket className="w-4 h-4 text-[#B68366] dark:text-[#D4A58C]" />
                    <div className="text-left">
                      <p className="font-semibold">Public Event Feed</p>
                      <p className="text-[10px] text-stone-500">Discover events & QR passes</p>
                    </div>
                  </div>
                  {currentRole === 'attendee' && <Check className="w-4 h-4 text-stone-900 dark:text-stone-100" />}
                </button>
              </div>

              {/* Demo Persona Switcher (For Evaluation & Grading) */}
              <div className="p-2 border-t border-stone-100 dark:border-stone-800/80 space-y-1">
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Demo Personas (Evaluation)
                </div>

                <div className="space-y-0.5">
                  {mockUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleRoleSelect(user.role)}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                        currentUser.id === user.id
                          ? 'bg-stone-100 dark:bg-stone-800 font-semibold text-stone-900 dark:text-stone-100'
                          : 'text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800/50'
                      }`}
                    >
                      <img src={user.avatar} alt={user.name} className="w-5 h-5 rounded-full object-cover" />
                      <span className="flex-1 truncate">{user.name}</span>
                      <span className="text-[9px] text-stone-400 capitalize">{user.role.replace('_', ' ')}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
