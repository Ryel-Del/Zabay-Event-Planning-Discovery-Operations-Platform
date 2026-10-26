import React, { useState } from 'react';
import {
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  GitBranch,
  Sparkles,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  Share2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { OrganizerView } from '../layout/AppSidebar';
import { CreateEventModal } from './CreateEventModal';
import { getCurrencySymbol, formatTicketPrice } from '../../utils/currency';
import { useEventRegistrationSummary } from '../../hooks/useEventRegistrationSummary';

interface OperationsOverviewProps {
  onNavigate: (view: OrganizerView) => void;
}

export const OperationsOverview: React.FC<OperationsOverviewProps> = ({ onNavigate }) => {
  const { selectedEvent, venues, tasks, registrations, auditLogs, loadDemoData, currentUser, isDevModeUnlocked, deleteEvent, setCurrentRole, isLiveBackend, isDemoMode } = useApp();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const live = isLiveBackend && !isDemoMode;
  const admission = useEventRegistrationSummary(selectedEvent?.id, live);

  const canManageSelectedEvent = Boolean(
    selectedEvent && (
      selectedEvent.organizer_id === currentUser.id ||
      currentUser.id === 'usr-org-1' ||
      isDevModeUnlocked
    )
  );

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    const confirmed = window.confirm(
      `Are you sure you want to delete "${selectedEvent.title}"?\n\nThis will permanently remove the event, its venue bookings, and planning tasks from your workspace.`
    );
    if (!confirmed) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteEvent(selectedEvent.id);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Could not delete event.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleShareEvent = () => {
    if (!selectedEvent) return;
    const url = `${window.location.origin}/?event=${selectedEvent.id}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        setShareToast(true);
        setTimeout(() => setShareToast(false), 3000);
      }).catch(() => {});
    }
  };

  const handleViewPublicPage = () => {
    if (!selectedEvent) return;
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('event', selectedEvent.id);
      window.history.pushState({}, '', url.toString());
    } catch {
      // ignore
    }
    setCurrentRole('attendee');
  };

  if (!selectedEvent) {
    const isNamedUser = currentUser.name && currentUser.id !== 'usr-guest';
    return (
      <div className="bg-white dark:bg-[#171E2B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 sm:p-12 text-center space-y-4 shadow-xs">
        <div className="w-16 h-16 bg-[#EBF3FC] dark:bg-[#1E293B] text-[#3E6CB5] dark:text-[#7EA6E0] rounded-2xl flex items-center justify-center mx-auto">
          <Calendar className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {isNamedUser ? `Welcome, ${currentUser.name}!` : 'Clean Operations Workspace'}
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {isNamedUser
              ? "You don't have an active event workspace selected. Create your first Bohol event workspace to manage venues, ticketing, and operations."
              : 'No active event is selected. Create your first Bohol event to track capacity, schedule feasibility, and run-of-show operations.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            data-cy="open-event-wizard"
            className="px-4 py-2.5 bg-[#3E6CB5] hover:bg-[#325896] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Event Workspace</span>
          </button>

          {isDevModeUnlocked && (
            <button
              onClick={loadDemoData}
              className="px-4 py-2.5 bg-[#F8FAFD] dark:bg-[#111722] hover:bg-[#EBF3FC] dark:hover:bg-[#1E293B] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#3E6CB5] dark:text-[#7EA6E0]" />
              <span>Load Bohol Sample Data</span>
            </button>
          )}
        </div>

        <CreateEventModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      </div>
    );
  }

  const venue = venues.find((v) => v.id === selectedEvent.venue_id);
  const eventTasks = tasks.filter((t) => t.event_id === selectedEvent.id);
  const completedTasks = eventTasks.filter((t) => t.status === 'completed').length;
  const conflictTasks = eventTasks.filter((t) => t.has_conflict);
  const readinessPercent = eventTasks.length > 0 ? Math.round((completedTasks / eventTasks.length) * 100) : 0;
  const eventRegistrations = registrations.filter(reg => reg.event_id === selectedEvent.id);
  const localActive = eventRegistrations.filter(reg => reg.status !== 'cancelled');
  const registeredCount = live ? admission.data?.registered_count ?? null : isDemoMode ? localActive.length : null;
  const checkedInCount = live ? admission.data?.checked_in_count ?? null : isDemoMode ? localActive.filter(reg => reg.status === 'checked_in').length : null;
  const maxCapacity = Number(selectedEvent.max_capacity);
  const capacityPercent = registeredCount !== null && Number.isFinite(maxCapacity) && maxCapacity > 0
    ? Math.min(100, Math.max(0, Math.round(registeredCount / maxCapacity * 100))) : null;
  const estimatedTicketValue = registeredCount === null ? null : Math.max(0, Number(selectedEvent.ticket_price) || 0) * registeredCount;

  return (
    <div className="space-y-6">
      {/* Event Identity Hero Banner */}
      <div className="bg-white dark:bg-[#171E2B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xs">
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

            <button
              onClick={handleViewPublicPage}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="View public event page and register passes"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              Public View & Tickets
            </button>
            <button
              onClick={handleShareEvent}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Copy deep-link to share this event"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              {shareToast ? 'Link Copied!' : 'Share Event'}
            </button>

            {canManageSelectedEvent && (
              <>
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Edit event details, schedule, or capacity"
                >
                  <Pencil className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  Edit Event
                </button>
                <button
                  onClick={handleDeleteEvent}
                  disabled={isDeleting}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  title="Delete this event and associated data"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  {isDeleting ? 'Deleting...' : 'Delete Event'}
                </button>
              </>
            )}
          </div>
          {deleteError && (
            <div className="w-full mt-2 p-2 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{deleteError}</span>
            </div>
          )}
        </div>

        {/* Operational Pulse Metrics Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-200/80 dark:border-slate-800 text-xs">
          <div>
            <span className="text-slate-500 block mb-1">Operational Readiness</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-slate-900 dark:text-slate-100">{readinessPercent}%</span>
              <span className="text-slate-500">({completedTasks}/{eventTasks.length} tasks ready)</span>
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
              <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {selectedEvent.ticket_price <= 0
                  ? 'Free'
                  : `${getCurrencySymbol(selectedEvent.currency)}${totalRevenue.toLocaleString()}`}
              </span>
              <span className="text-[#2B6149] dark:text-[#81B89B] font-semibold">Estimate only</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {selectedEvent.ticket_price <= 0
                ? 'Free Admission (No fee)'
                : `Avg ${formatTicketPrice(selectedEvent.ticket_price, selectedEvent.currency, true)} / ticket`}
            </p>
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
                <span>Schedule & Planning Feasible</span>
              </div>
            )}
            <p className="text-[11px] text-slate-400 mt-1">Task dependencies and timing in sync</p>
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
              Ready-to-use checklist templates for sports, banquets, cultural shows & seminars.
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
              Event details, ticket tiers, QR registration, and gate check-in.
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
            {eventTasks.map((task) => (
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
              <span className="text-[10px] text-stone-400">Live Activity Stream</span>
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

      <CreateEventModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        eventToEdit={selectedEvent}
      />
    </div>
  );
};
