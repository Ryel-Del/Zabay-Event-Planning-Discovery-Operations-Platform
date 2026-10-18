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
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { UserRole } from '../../types';

interface NavbarProps {
  onOpenAudit: () => void;
  onOpenScanner: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAudit, onOpenScanner }) => {
  const { currentRole, setCurrentRole, currentUser, auditLogs, resetTasksToDefault } = useApp();
  const [resetConfirm, setResetConfirm] = useState(false);

  const roleTabs: { role: UserRole; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      role: 'organizer',
      label: 'Organizer / Ops',
      icon: <Layers className="w-4 h-4" />,
      desc: 'Readiness, Change-Impact & Analytics',
    },
    {
      role: 'venue_manager',
      label: 'Venue Manager',
      icon: <Building2 className="w-4 h-4" />,
      desc: 'Facilities, Slots & EXCLUDE Safety',
    },
    {
      role: 'attendee',
      label: 'Attendee Discovery',
      icon: <Ticket className="w-4 h-4" />,
      desc: 'Explore Events, Map & QR Pass',
    },
  ];

  const handleReset = () => {
    resetTasksToDefault();
    setResetConfirm(true);
    setTimeout(() => setResetConfirm(false), 2500);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Relational DB Badge */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
              <CalendarDays className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-white font-sans">
                  ZABAY
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-indigo-400" />
                  RDBMS Powered
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Event Planning, Discovery & Operations
              </p>
            </div>
          </div>

          {/* User Role Switcher Tabs (Matches 3 User Personas from Writeup) */}
          <nav className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 shadow-inner">
            {roleTabs.map((tab) => {
              const isActive = currentRole === tab.role;
              return (
                <button
                  key={tab.role}
                  onClick={() => setCurrentRole(tab.role)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                  title={tab.desc}
                >
                  {tab.icon}
                  <span className="hidden md:inline">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Toolbar */}
          <div className="flex items-center gap-2">
            {/* Quick QR Pass Scanner */}
            <button
              onClick={onOpenScanner}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-cyan-300 bg-cyan-950/60 border border-cyan-800/80 rounded-lg hover:bg-cyan-900/40 transition-colors shadow-sm"
              title="Open QR Pass Verification Scanner"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">QR Gate Check-in</span>
            </button>

            {/* Audit Log Trigger with count badge */}
            <button
              onClick={onOpenAudit}
              className="relative p-2 text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-lg transition-colors"
              title="View Relational Audit Logs & Propagation History"
            >
              <History className="w-4 h-4" />
              {auditLogs.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {auditLogs.length}
                </span>
              )}
            </button>

            {/* Reset Scenario Baseline */}
            <button
              onClick={handleReset}
              className="p-2 text-slate-400 hover:text-amber-300 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-lg transition-colors"
              title="Reset Tasks & Scenario to Baseline"
            >
              <RotateCcw className={`w-4 h-4 ${resetConfirm ? 'text-amber-400 animate-spin' : ''}`} />
            </button>

            {/* User Avatar & Info */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-700"
              />
              <div className="hidden xl:block text-left">
                <p className="text-xs font-medium text-slate-200 leading-none">{currentUser.name}</p>
                <p className="text-[10px] text-slate-500 capitalize">{currentRole.replace('_', ' ')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
