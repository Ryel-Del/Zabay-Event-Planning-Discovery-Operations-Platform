import React, { useState } from 'react';
import {
  CalendarDays,
  ShieldCheck,
  Building2,
  Ticket,
  History,
  RotateCcw,
  QrCode,
  Layers,
  Users,
  Sun,
  Moon,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { UserRole } from '../../types';

interface NavbarProps {
  onOpenAudit: () => void;
  onOpenScanner: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAudit, onOpenScanner }) => {
  const { currentRole, setCurrentRole, currentUser, auditLogs, resetTasksToDefault, theme, toggleTheme } = useApp();
  const [resetConfirm, setResetConfirm] = useState(false);
  const isDark = theme === 'dark';

  const roleTabs: { role: UserRole; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      role: 'organizer',
      label: 'Organizer / Ops',
      icon: <Layers className="w-3.5 h-3.5" />,
      desc: 'Readiness, Change-Impact & Analytics',
    },
    {
      role: 'venue_manager',
      label: 'Venue Manager',
      icon: <Building2 className="w-3.5 h-3.5" />,
      desc: 'Facilities, Slots & EXCLUDE Safety',
    },
    {
      role: 'staff',
      label: 'Staff Portal',
      icon: <Users className="w-3.5 h-3.5" />,
      desc: 'View-Only Shifts, Tasks & Run-of-Show',
    },
    {
      role: 'attendee',
      label: 'Attendee Discovery',
      icon: <Ticket className="w-3.5 h-3.5" />,
      desc: 'Explore Events, Map & QR Pass',
    },
  ];

  const handleReset = () => {
    resetTasksToDefault();
    setResetConfirm(true);
    setTimeout(() => setResetConfirm(false), 2000);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF9F5]/90 dark:bg-[#171513]/90 backdrop-blur-md border-b border-stone-200/70 dark:border-stone-800/80 transition-colors duration-200 w-full">
      <div className="w-full px-4 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo - Luma / Editorial Style */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-stone-900 dark:bg-stone-100 flex items-center justify-center shadow-sm">
              <CalendarDays className="w-4 h-4 text-stone-100 dark:text-stone-900" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-stone-900 dark:text-stone-100 font-sans">
                  ZABAY
                </span>
                <span className="px-2 py-0.5 text-[10px] font-medium tracking-wide bg-stone-200/60 dark:bg-stone-800/60 text-stone-700 dark:text-stone-300 rounded-md border border-stone-300/60 dark:border-stone-700/60 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-[#B68366] dark:text-[#D4A58C]" />
                  RDBMS Enforced
                </span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 hidden sm:block">
                Event Operations & Discovery
              </p>
            </div>
          </div>

          {/* Segmented Role Navigation */}
          <nav className="flex items-center bg-[#EBE7DF] dark:bg-[#1F1C19] p-1 rounded-xl border border-stone-200/80 dark:border-stone-800/80 shadow-inner">
            {roleTabs.map((tab) => {
              const isActive = currentRole === tab.role;
              return (
                <button
                  key={tab.role}
                  onClick={() => setCurrentRole(tab.role)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-white dark:bg-[#2B2723] text-stone-900 dark:text-stone-100 shadow-sm border border-stone-200/60 dark:border-stone-700/60 font-semibold'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                  title={tab.desc}
                >
                  {tab.icon}
                  <span className="hidden md:inline">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle (Light / Dark) */}
            <button
              onClick={toggleTheme}
              className="p-2 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 bg-stone-200/50 dark:bg-stone-800/60 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-lg transition-colors border border-stone-300/40 dark:border-stone-700/40 cursor-pointer"
              title={isDark ? "Switch to Light Mode: 'Inviting Pastel & Organics'" : "Switch to Dark Mode: 'Premium Slate & Subdued Pastel'"}
            >
              {isDark ? <Sun className="w-4 h-4 text-[#D4A58C]" /> : <Moon className="w-4 h-4 text-stone-600" />}
            </button>

            {/* QR Scanner Trigger */}
            <button
              onClick={onOpenScanner}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-800 dark:text-stone-200 bg-stone-200/70 dark:bg-stone-800/80 border border-stone-300/80 dark:border-stone-700/80 rounded-lg hover:bg-stone-300/50 dark:hover:bg-stone-700 transition-colors shadow-sm cursor-pointer"
              title="Open QR Pass Verification Scanner"
            >
              <QrCode className="w-3.5 h-3.5 text-[#5F7D5B] dark:text-[#97B394]" />
              <span className="hidden lg:inline">QR Check-in</span>
            </button>

            {/* Audit Log Trigger */}
            <button
              onClick={onOpenAudit}
              className="relative p-2 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 bg-stone-200/50 dark:bg-stone-800/60 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-lg transition-colors border border-stone-300/40 dark:border-stone-700/40 cursor-pointer"
              title="View Relational Audit Logs"
            >
              <History className="w-4 h-4" />
              {auditLogs.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#B68366] dark:bg-[#D4A58C] text-white dark:text-stone-950 text-[9px] font-bold rounded-full flex items-center justify-center">
                  {auditLogs.length}
                </span>
              )}
            </button>

            {/* Reset Scenario Baseline */}
            <button
              onClick={handleReset}
              className="p-2 text-stone-600 dark:text-stone-400 hover:text-[#B68366] dark:hover:text-[#D4A58C] bg-stone-200/50 dark:bg-stone-800/60 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-lg transition-colors border border-stone-300/40 dark:border-stone-700/40 cursor-pointer"
              title="Reset Tasks & Scenario to Baseline"
            >
              <RotateCcw className={`w-4 h-4 ${resetConfirm ? 'text-[#B68366] animate-spin' : ''}`} />
            </button>

            {/* User Avatar */}
            <div className="flex items-center gap-2 pl-2 border-l border-stone-300/60 dark:border-stone-800">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover ring-1 ring-stone-300 dark:ring-stone-700"
              />
              <div className="hidden xl:block text-left">
                <p className="text-xs font-semibold text-stone-900 dark:text-stone-200 leading-none">{currentUser.name}</p>
                <p className="text-[10px] text-stone-500 dark:text-stone-400 capitalize">{currentRole.replace('_', ' ')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
