import React from 'react';
import {
  Calendar,
  Layers,
  Building2,
  Ticket,
  Sun,
  Moon,
  QrCode,
  History,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
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
    auditLogs,
    theme,
    toggleTheme,
  } = useApp();

  const isDark = theme === 'dark';

  const roleTabs: { role: UserRole; label: string; icon: React.ReactNode }[] = [
    { role: 'organizer', label: 'Organizer', icon: <Layers className="w-3.5 h-3.5" /> },
    { role: 'venue_manager', label: 'Venue Manager', icon: <Building2 className="w-3.5 h-3.5" /> },
    { role: 'attendee', label: 'Public Attendee', icon: <Ticket className="w-3.5 h-3.5" /> },
  ];

  return (
    <header className="h-16 bg-white dark:bg-[#1E1C19] border-b border-stone-200/80 dark:border-stone-800/80 px-6 flex items-center justify-between z-20 shrink-0">
      {/* Active Event Selector */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-[#FAF9F5] dark:bg-[#171513] px-3 py-1.5 rounded-xl border border-stone-200/80 dark:border-stone-800/80">
          <Calendar className="w-4 h-4 text-[#B68366] dark:text-[#D4A58C] shrink-0" />
          <span className="text-xs text-stone-500 hidden sm:inline">Event:</span>
          <select
            value={selectedEvent.id}
            onChange={(e) => {
              const found = events.find((x) => x.id === e.target.value);
              if (found) setSelectedEvent(found);
            }}
            className="bg-transparent text-xs font-bold text-stone-900 dark:text-stone-100 focus:outline-none cursor-pointer pr-2"
          >
            {events.map((evt) => (
              <option key={evt.id} value={evt.id} className="bg-white dark:bg-[#1E1C19]">
                {evt.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Role Switcher (Persona Switcher) */}
      <nav className="flex items-center bg-[#EBE7DF] dark:bg-[#171513] p-1 rounded-xl border border-stone-200/80 dark:border-stone-800/80">
        {roleTabs.map((tab) => {
          const isActive = currentRole === tab.role;
          return (
            <button
              key={tab.role}
              onClick={() => setCurrentRole(tab.role)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-white dark:bg-[#2B2723] text-stone-900 dark:text-stone-100 shadow-sm font-semibold'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Action Tools */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 bg-[#FAF9F5] dark:bg-[#171513] hover:bg-stone-200 dark:hover:bg-stone-800 rounded-lg transition-colors border border-stone-200 dark:border-stone-800 cursor-pointer"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun className="w-4 h-4 text-[#D4A58C]" /> : <Moon className="w-4 h-4 text-stone-600" />}
        </button>

        {/* Quick QR Gate Scanner */}
        <button
          onClick={onOpenScanner}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-800 dark:text-stone-200 bg-[#FAF9F5] dark:bg-[#171513] border border-stone-200 dark:border-stone-800 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors shadow-sm cursor-pointer"
        >
          <QrCode className="w-3.5 h-3.5 text-[#5F7D5B] dark:text-[#97B394]" />
          <span className="hidden md:inline">Gate Scanner</span>
        </button>

        {/* Audit Log Trigger */}
        <button
          onClick={onOpenAudit}
          className="relative p-2 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 bg-[#FAF9F5] dark:bg-[#171513] hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors border border-stone-200 dark:border-stone-800 cursor-pointer"
          title="View Audit Logs"
        >
          <History className="w-4 h-4" />
          {auditLogs.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#B68366] dark:bg-[#D4A58C] text-white dark:text-stone-950 text-[9px] font-bold rounded-full flex items-center justify-center">
              {auditLogs.length}
            </span>
          )}
        </button>

        {/* User Badge */}
        <div className="flex items-center gap-2 pl-3 ml-1 border-l border-stone-200 dark:border-stone-800">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-8 h-8 rounded-full object-cover ring-1 ring-stone-300 dark:ring-stone-700"
          />
          <div className="hidden lg:block text-left">
            <p className="text-xs font-semibold text-stone-900 dark:text-stone-200 leading-none">{currentUser.name}</p>
            <p className="text-[10px] text-stone-500 capitalize">{currentRole.replace('_', ' ')}</p>
          </div>
        </div>
      </div>
    </header>
  );
};
