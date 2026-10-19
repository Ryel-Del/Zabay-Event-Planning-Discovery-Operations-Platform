import React from 'react';
import {
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  GitBranch,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { OrganizerView } from '../layout/AppSidebar';

interface OperationsOverviewProps {
  onNavigate: (view: OrganizerView) => void;
}

export const OperationsOverview: React.FC<OperationsOverviewProps> = ({ onNavigate }) => {
  const { selectedEvent, venues, tasks, registrations, auditLogs } = useApp();

  const venue = venues.find((v) => v.id === selectedEvent.venue_id);
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const conflictTasks = tasks.filter((t) => t.has_conflict);
  const readinessPercent = Math.round((completedTasks / tasks.length) * 100);
  const totalRevenue = selectedEvent.tickets_sold * selectedEvent.ticket_price;

  return (
    <div className="space-y-6">
      {/* Cvent-Style Event Identity Hero Banner */}
      <div className="bg-white dark:bg-[#171E2B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#EBF3FC] dark:bg-[#1E293B] text-[#244A85] dark:text-[#8BB0E8] border border-[#C8DCF7] dark:border-[#2D4160] rounded-md">
                {selectedEvent.category}
              </span>
              <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#EDF7F2] dark:bg-[#17271F] text-[#2B6149] dark:text-[#81B89B] border border-[#BDE3CF] dark:border-[#234232] rounded-md">
                Status: {selectedEvent.status}
              </span>
            </div>

            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {selectedEvent.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {new Date(selectedEvent.start_date).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>

              {venue && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {venue.name} ({venue.city})
                </span>
              )}

              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                Expected: {selectedEvent.expected_attendance.toLocaleString()} attendees
              </span>
            </div>
          </div>

          {/* Quick Operations Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigate('impact')}
              className="px-3.5 py-2 bg-[#3E6CB5] hover:bg-[#325896] dark:bg-[#4E80CD] dark:hover:bg-[#3E6CB5] text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <GitBranch className="w-3.5 h-3.5 text-[#D4E4F7]" />
              Run Impact Simulator
            </button>
            <button
              onClick={() => onNavigate('venues')}
              className="px-3.5 py-2 bg-[#F8FAFD] dark:bg-[#111722] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              Verify Venue Match
            </button>
          </div>
        </div>

        {/* Operational Pulse Metrics Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-200/80 dark:border-slate-800 text-xs">
          <div>
            <span className="text-slate-500 block mb-1">Operational Readiness</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-slate-900 dark:text-slate-100">{readinessPercent}%</span>
              <span className="text-slate-500">({completedTasks}/{tasks.length} tasks ready)</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div className="bg-[#4E8268] dark:bg-[#81B89B] h-full rounded-full" style={{ width: `${readinessPercent}%` }} />
            </div>
          </div>

          <div>
            <span className="text-slate-500 block mb-1">Capacity Registered</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {Math.round((selectedEvent.tickets_sold / selectedEvent.max_capacity) * 100)}%
              </span>
              <span className="text-slate-500">{selectedEvent.tickets_sold} / {selectedEvent.max_capacity}</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div className="bg-[#3E6CB5] dark:bg-[#7EA6E0] h-full rounded-full" style={{ width: `${(selectedEvent.tickets_sold / selectedEvent.max_capacity) * 100}%` }} />
            </div>
          </div>

          <div>
            <span className="text-slate-500 block mb-1">Gross Ticket Revenue</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-slate-900 dark:text-slate-100">₱{totalRevenue.toLocaleString()}</span>
              <span className="text-[#2B6149] dark:text-[#81B89B] font-semibold">Stripe confirmed</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Avg ₱{selectedEvent.ticket_price} / ticket</p>
          </div>

          <div>
            <span className="text-slate-500 block mb-1">Schedule Feasibility</span>
            {conflictTasks.length > 0 ? (
              <div className="flex items-center gap-1.5 text-[#C45547] dark:text-[#E07D70] font-bold text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{conflictTasks.length} Conflict Requires Attention</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[#2B6149] dark:text-[#81B89B] font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>DAG Timeline Feasible</span>
              </div>
            )}
            <p className="text-[11px] text-slate-400 mt-1">Finish-to-start constraints satisfied</p>
          </div>
        </div>
      </div>

      {/* 4-Stage Organizer Lifecycle Flow for Small & Medium Groups */}
      <div className="bg-white dark:bg-[#171E2B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Guided Event Architecture
            </h3>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
              The 4-Stage Operational Flow for Small & Medium Groups
            </p>
          </div>
          <span className="text-[11px] text-slate-500">
            Click any stage to enter its dedicated workspace
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {/* Stage 1: Organize */}
          <div
            onClick={() => onNavigate('venues')}
            className="p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-[#F8FAFD] dark:bg-[#111722] hover:border-[#86ABDF] dark:hover:border-[#3E6CB5] transition-all cursor-pointer space-y-1.5 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#EDF7F2] text-[#2B6149] dark:bg-[#17271F] dark:text-[#81B89B]">
                1. Organize
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
              Tagbilaran Venues & Matcher
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Compare Bohol Cultural Center, Wisdom Gym, HNU, MetroCentre & Tropics.
            </p>
          </div>

          {/* Stage 2: Prepare */}
          <div
            onClick={() => onNavigate('kanban')}
            className="p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-[#F8FAFD] dark:bg-[#111722] hover:border-[#86ABDF] dark:hover:border-[#3E6CB5] transition-all cursor-pointer space-y-1.5 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#EBF3FC] text-[#244A85] dark:bg-[#1E293B] dark:text-[#8BB0E8]">
                2. Prepare
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
              Kanban & 1-Click Kits
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Zero-hassle pre-built workflows for student orgs, hackathons & sports.
            </p>
          </div>

          {/* Stage 3: Market */}
          <div
            onClick={() => onNavigate('attendees')}
            className="p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-[#F8FAFD] dark:bg-[#111722] hover:border-[#86ABDF] dark:hover:border-[#3E6CB5] transition-all cursor-pointer space-y-1.5 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#F5F0FA] text-[#5C3B87] dark:bg-[#231A2E] dark:text-[#B393DB]">
                3. Market
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
              Passes & Attendee Feed
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Luma-style invite links, ticket tiers, and Stripe checkout verification.
            </p>
          </div>

          {/* Stage 4: Execute */}
          <div
            onClick={() => onNavigate('top_calendar')}
            className="p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-[#F8FAFD] dark:bg-[#111722] hover:border-[#86ABDF] dark:hover:border-[#3E6CB5] transition-all cursor-pointer space-y-1.5 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#FFF9EB] text-[#7A5B14] dark:bg-[#2A2312] dark:text-[#E2C37A]">
                4. Execute
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
              Top-Down Calendar & QR Gate
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Live day-of run sheet, webcam QR check-in, and non-duplicate attendance.
            </p>
          </div>
        </div>
      </div>

      {/* Main Split Layout: Left Data Stream (70%) vs Right Activity Panel (30%) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Scheduled Task Pipeline */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1E1C19] border border-stone-200/80 dark:border-stone-800/80 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200/80 dark:border-stone-800/80">
            <div>
              <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                Operational Task Schedule
              </h2>
              <p className="text-xs text-stone-500">Defined finish-to-start predecessor sequence</p>
            </div>
            <button
              onClick={() => onNavigate('schedule')}
              className="text-xs font-semibold text-[#885B43] dark:text-[#D5A78E] hover:underline flex items-center gap-1"
            >
              Open Gantt View <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Clean Dense Task Row List (NOT bulky cards!) */}
          <div className="divide-y divide-stone-100 dark:divide-stone-800/80">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/60 dark:hover:bg-stone-800/40 px-2 rounded-xl transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-stone-900 dark:text-stone-100">{task.title}</span>
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        task.status === 'completed'
                          ? 'bg-[#EEF3ED] text-[#455C42] dark:bg-[#222D21] dark:text-[#A7C2A4]'
                          : task.status === 'in_progress'
                          ? 'bg-[#F6EFE9] text-[#885B43] dark:bg-[#2B231D] dark:text-[#DEC0B0]'
                          : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                      }`}
                    >
                      {task.status}
                    </span>
                    {task.has_conflict && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#F9ECE9] text-[#BA4E3E] dark:bg-[#341D1A] dark:text-[#E48D80]">
                        Conflict
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-500 line-clamp-1">{task.description}</p>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono text-stone-500 shrink-0">
                  <span>{task.start_time} - {task.end_time}</span>
                  <span className="text-stone-400 font-sans">{task.personnel_assignments[0]?.personnel_name || 'Staff'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Database Activity & Quick Check-in Summary */}
        <div className="space-y-6">
          {/* Quick Check-in Stats */}
          <div className="bg-white dark:bg-[#1E1C19] border border-stone-200/80 dark:border-stone-800/80 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                Gate Check-In Status
              </h3>
              <button
                onClick={() => onNavigate('attendees')}
                className="text-xs font-semibold text-[#885B43] dark:text-[#D5A78E] hover:underline"
              >
                Directory
              </button>
            </div>

            <div className="bg-[#FAF9F5] dark:bg-[#171513] p-3 rounded-xl border border-stone-200/80 dark:border-stone-800/80 flex justify-between items-center text-xs">
              <div>
                <span className="text-stone-500 text-[11px]">Admitted Through Gate</span>
                <p className="text-lg font-bold text-stone-900 dark:text-stone-100">
                  {registrations.filter((r) => r.status === 'checked_in').length} / {registrations.length} Checked In
                </p>
              </div>
              <span className="text-[10px] px-2 py-1 bg-[#EEF3ED] dark:bg-[#222D21] text-[#455C42] dark:text-[#A7C2A4] rounded-lg font-bold">
                Zero Duplicates
              </span>
            </div>
          </div>

          {/* Recent Audit Ledger History */}
          <div className="bg-white dark:bg-[#1E1C19] border border-stone-200/80 dark:border-stone-800/80 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                Recent Audit Trail
              </h3>
              <span className="text-[10px] text-stone-400 font-mono">Live DB Stream</span>
            </div>

            <div className="space-y-2.5">
              {auditLogs.slice(0, 3).map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-xl bg-[#FAF9F5] dark:bg-[#171513] border border-stone-200/80 dark:border-stone-800/80 text-xs space-y-1"
                >
                  <div className="flex justify-between text-[11px] text-stone-400">
                    <span className="font-semibold text-stone-700 dark:text-stone-300">{log.action}</span>
                    <span>{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-stone-600 dark:text-stone-400 line-clamp-2">{log.change_summary}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
