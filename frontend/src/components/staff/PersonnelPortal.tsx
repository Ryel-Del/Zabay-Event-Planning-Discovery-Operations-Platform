import React, { useState, useEffect } from 'react';
import {
  Users,
  Clock,
  MapPin,
  ShieldAlert,
  Phone,
  Mail,
  CheckCircle2,
  Briefcase,
  GitBranch,
  Wrench,
  Search,
  Layers,
  Radio,
  QrCode,
  ShieldCheck,
  Eye,
  ArrowLeft,
  X,
  Bell,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { QRCheckInScanner } from '../organizer/QRCheckInScanner';
import { canPersonnelScanTickets } from '../../types';

export const PersonnelPortal: React.FC = () => {
  const {
    currentUser,
    personnel,
    tasks,
    selectedEvent,
    venues,
    updateTaskStatus,
    notifications,
    activeStaffId,
    exitStaffPreview,
    isDevModeUnlocked,
    staffInvitations,
    respondToStaffInvitation,
  } = useApp();

  // Filter invitations directed to this user
  const myPendingInvitations = (staffInvitations || []).filter(
    (inv) =>
      (inv.user_id === currentUser.id ||
        inv.user_email?.toLowerCase() === currentUser.email.toLowerCase() ||
        inv.user_name.toLowerCase() === currentUser.name.toLowerCase()) &&
      inv.status === 'pending'
  );

  const [invitationResponseAlert, setInvitationResponseAlert] = useState<string | null>(null);

  // In normal mode, identify the logged-in staff member; in dev mode allow selecting another personnel
  const loggedInStaffPersonnel = personnel.find(
    (p) =>
      p.email === currentUser.email ||
      p.name.toLowerCase() === currentUser.name.toLowerCase()
  ) || {
    id: currentUser.id,
    name: currentUser.name,
    role: 'Event Coordinator',
    phone: currentUser.phone || '+63 (917) 389-1029',
    email: currentUser.email,
    hourly_rate: 0,
    skills: ['Event Operations', 'Gate Access', 'Logistics'],
    is_available: true,
    can_scan_tickets: true,
  };

  const [selectedPersonnelId, setSelectedPersonnelId] = useState<string>(
    activeStaffId || 'current'
  );
  const [activeTab, setActiveTab] = useState<'my_tasks' | 'run_of_show' | 'crew_group' | 'venue_contacts'>('my_tasks');
  const [searchRunOfShow, setSearchRunOfShow] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Sync when activeStaffId changes from external preview click
  useEffect(() => {
    if (activeStaffId) {
      setSelectedPersonnelId(activeStaffId);
    }
  }, [activeStaffId]);

  const isSupervisorMode = isDevModeUnlocked && selectedPersonnelId === 'all';
  const currentPerson = isDevModeUnlocked && selectedPersonnelId !== 'all' && selectedPersonnelId !== 'current'
    ? (personnel.find((p) => p.id === selectedPersonnelId) || loggedInStaffPersonnel)
    : isSupervisorMode
    ? null
    : loggedInStaffPersonnel;

  const hasScannerPermission = isSupervisorMode || canPersonnelScanTickets(currentPerson);

  // Active venue details (with robust fallback for empty workspace or clean slate)
  const activeVenue =
    venues.find(
      (v) =>
        v.id === selectedEvent?.venue_id ||
        v.name.toLowerCase().includes('wisdom') ||
        v.id === 'ven-3'
    ) || venues[0] || {
      id: 'ven-default',
      name: selectedEvent?.hall_name || 'Designated Event Venue',
      address: 'Tagbilaran City, Bohol',
      city: 'Tagbilaran City',
      operating_hours: { open: '08:00', close: '22:00' },
      contact_phone: '+63 (38) 411-2000',
      facilities: ['Main Hall', 'Staff Staging Area', 'First Aid Station'],
    };

  // Tasks assigned to this specific personnel member
  const myTasks = tasks.filter((t) => {
    if (isSupervisorMode) return true;
    if (!currentPerson) return false;
    return t.personnel_assignments?.some(
      (pa) =>
        pa.personnel_id === currentPerson.id ||
        pa.personnel_name.toLowerCase() === currentPerson.name.toLowerCase()
    );
  });

  // Calculate shift statistics
  const totalMyTasks = myTasks.length;
  const completedMyTasks = myTasks.filter((t) => t.status === 'completed').length;
  const inProgressMyTasks = myTasks.filter((t) => t.status === 'in_progress').length;

  // Approximate shift hours based on earliest task start and latest task end
  const shiftTimes = myTasks
    .filter((t) => t.start_time && t.end_time)
    .map((t) => ({ start: t.start_time, end: t.end_time }));

  const earliestStart = shiftTimes.length > 0 ? shiftTimes[0].start : '08:00';
  const latestEnd = shiftTimes.length > 0 ? shiftTimes[shiftTimes.length - 1].end : '18:00';

  // Filter full run-of-show
  const filteredAllTasks = tasks.filter(
    (t) =>
      t.title.toLowerCase().includes(searchRunOfShow.toLowerCase()) ||
      (t.track ? t.track.toLowerCase().includes(searchRunOfShow.toLowerCase()) : false) ||
      t.description.toLowerCase().includes(searchRunOfShow.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Discreet Organizer Studio Return Bar (Only visible when navigated via Studio preview) */}
      {activeStaffId && (
        <div className="bg-[#EBF3FC] dark:bg-[#1E293B] border border-[#C8DCF7] dark:border-[#2D4160] px-4 py-2.5 rounded-2xl flex items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2 text-[#244A85] dark:text-[#8BB0E8]">
            <Eye className="w-4 h-4 shrink-0" />
            <span className="font-semibold">Viewing Staff Portal in Preview Mode</span>
          </div>
          <button
            onClick={exitStaffPreview}
            className="px-3 py-1.5 rounded-xl bg-[#3E6CB5] hover:bg-[#325896] text-white font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Organizer Studio</span>
          </button>
        </div>
      )}

      {/* Developer Mode Crew Switcher (Hidden in normal mode; only accessible when dev mode unlocked) */}
      {isDevModeUnlocked && (
        <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in">
          <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shrink-0" />
            <span className="font-bold">Dev Testbed: Staff Emulator</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              Test staff clearances, task views, and QR turnstile check-in
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Switch Persona:</span>
            <select
              value={selectedPersonnelId}
              onChange={(e) => setSelectedPersonnelId(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-[#111722] text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="current">👤 Current User ({currentUser.name})</option>
              <option value="all">👥 All Crew (Supervisor Run-of-Show)</option>
              {personnel.map((p) => (
                <option key={p.id} value={p.id}>
                  👤 {p.name} ({p.role}) {canPersonnelScanTickets(p) ? '• 🎟️ Scanner' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Real-Time Operational Alerts */}
      {notifications.length > 0 && (
        <div className="bg-amber-500 text-white p-4 rounded-2xl flex items-center justify-between gap-3 shadow-xs animate-in slide-in-from-top-1">
          <div className="flex items-center gap-3">
            <Radio className="w-5 h-5 shrink-0 animate-pulse text-white" />
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider block">Live Operational Dispatch Alert</span>
              <p className="text-xs font-semibold opacity-95">{notifications[0].message}</p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-black/20 shrink-0 font-bold">Priority Update</span>
        </div>
      )}

      {/* Invitation Response Toast */}
      {invitationResponseAlert && (
        <div className="bg-emerald-600 text-white p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs shadow-md animate-in slide-in-from-top-1">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="font-semibold">{invitationResponseAlert}</span>
          </div>
          <button
            onClick={() => setInvitationResponseAlert(null)}
            className="text-white/80 hover:text-white text-xs font-bold px-2 py-1 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Incoming Staff Invitations (Like Facebook Friend/Crew Invites to a Group) */}
      {myPendingInvitations.length > 0 && (
        <div className="bg-gradient-to-r from-[#244A85] via-[#3E6CB5] to-[#4E80CD] text-white rounded-2xl p-5 shadow-lg space-y-4 animate-in slide-in-from-top-2 border border-blue-400/30">
          <div className="flex items-center justify-between gap-3 border-b border-white/20 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-emerald-300" />
                Incoming Event Crew Invitation ({myPendingInvitations.length})
              </span>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-white/20 font-bold uppercase tracking-wider">
              Slot Confirmation Needed
            </span>
          </div>

          <p className="text-xs text-blue-100">
            You've been invited by the Lead Organizer to join the event crew. Review your assigned station and confirm your slot:
          </p>

          <div className="space-y-3">
            {myPendingInvitations.map((inv) => (
              <div
                key={inv.id}
                className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-sm text-white">{inv.event_title}</h4>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/25 font-bold font-mono">
                      Role: {inv.role}
                    </span>
                    {inv.can_scan_tickets && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/90 text-white font-mono flex items-center gap-1 font-semibold">
                        <QrCode className="w-3 h-3" /> Scanner Clearance
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-blue-100 flex items-center gap-3 flex-wrap">
                    <span>⏰ Call Time: <strong className="text-white font-mono">{inv.call_time}</strong></span>
                    {inv.hourly_rate ? (
                      <span>💰 Rate: <strong className="text-white font-mono">₱{inv.hourly_rate.toLocaleString()}/hr</strong></span>
                    ) : null}
                  </div>
                  {inv.notes && (
                    <p className="text-xs text-blue-200 italic mt-0.5 bg-black/15 px-2.5 py-1 rounded-lg">
                      "{inv.notes}"
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto shrink-0 pt-2 md:pt-0">
                  <button
                    onClick={() => {
                      respondToStaffInvitation(inv.id, true);
                      setInvitationResponseAlert(`Slot confirmed! You are now active on shift for "${inv.event_title}".`);
                    }}
                    className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Accept Slot</span>
                  </button>
                  <button
                    onClick={() => {
                      respondToStaffInvitation(inv.id, false);
                      setInvitationResponseAlert(`Invitation to "${inv.event_title}" declined.`);
                    }}
                    className="flex-1 md:flex-none px-3.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                    <span>Decline</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 1. Active Shift Status & Gate Scanner Trigger */}
      <div className="bg-white dark:bg-[#171E2B] border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                Event Staff On Duty
              </span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-semibold">
                {currentPerson ? `${currentPerson.name} • ${currentPerson.role}` : 'All Crew Supervisor Overview'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Active Workspace: <strong className="text-slate-800 dark:text-slate-200">{selectedEvent?.title || 'Active Event'}</strong> at {activeVenue.name}
            </p>
          </div>
        </div>

        {/* Action Controls: 1-Tap Gate Scanner */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          {hasScannerPermission ? (
            <button
              onClick={() => setIsScannerOpen(true)}
              className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-[#3E6CB5] hover:bg-[#325896] dark:bg-[#4E80CD] dark:hover:bg-[#3E6CB5] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              title="Authorized Gate Check-in Operator"
            >
              <QrCode className="w-4 h-4 text-[#D4E4F7]" />
              <span>Launch Gate Ticket Scanner</span>
              <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/20 text-white font-mono font-bold">
                Clearance
              </span>
            </button>
          ) : (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 text-xs select-none"
              title="Ticket scanner access is restricted to Gate Security and Registration personnel"
            >
              <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-300 block text-[11px]">Scanner Restricted</span>
                <span className="text-[10px] block text-slate-400">Run-of-Show Duties Focus</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Staff Profile & Shift Briefing Card */}
      {currentPerson && (
        <div className="bg-white dark:bg-[#171E2B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#EBF3FC] dark:bg-[#1E293B] border border-[#C8DCF7] dark:border-[#2D4160] flex items-center justify-center font-bold text-lg text-[#244A85] dark:text-[#8BB0E8]">
                {currentPerson.name
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {currentPerson.name}
                  </h2>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#EBF3FC] text-[#244A85] dark:bg-[#1E293B] dark:text-[#8BB0E8]">
                    {currentPerson.role}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {currentPerson.phone}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {currentPerson.email}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-[#F8FAFD] dark:bg-[#111722] p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                  Gate Clearance
                </span>
                <p className="font-bold text-[#3E6CB5] dark:text-[#7EA6E0] text-sm flex items-center gap-1">
                  <QrCode className="w-3.5 h-3.5" />
                  {hasScannerPermission ? 'Scanner Active' : 'Run-of-Show'}
                </p>
              </div>
              <div className="w-px h-7 bg-slate-200 dark:bg-slate-700" />
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                  Duty Status
                </span>
                <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  Active on Shift
                </p>
              </div>
            </div>
          </div>

          {/* Shift Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
            <div className="bg-[#F8FAFD] dark:bg-[#111722] p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#3E6CB5]" /> Shift Window
              </span>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 font-mono">
                {earliestStart} – {latestEnd}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Today's Call Time</p>
            </div>

            <div className="bg-[#F8FAFD] dark:bg-[#111722] p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <Briefcase className="w-3 h-3 text-[#3E6CB5]" /> Assigned Duties
              </span>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                {totalMyTasks} {totalMyTasks === 1 ? 'task' : 'tasks'}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {completedMyTasks} completed • {inProgressMyTasks} in progress
              </p>
            </div>

            <div className="bg-[#F8FAFD] dark:bg-[#111722] p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#3E6CB5]" /> Venue Station
              </span>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 truncate">
                {activeVenue.name}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5 truncate">{activeVenue.city}</p>
            </div>

            <div className="bg-[#F8FAFD] dark:bg-[#111722] p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <Radio className="w-3 h-3 text-[#4E8268]" /> Dispatch Channel
              </span>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 font-mono">
                VHF CH 04 (Ops)
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Radio comms for event crew</p>
            </div>
          </div>
        </div>
      )}

      {/* 3. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('my_tasks')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'my_tasks'
              ? 'bg-[#3E6CB5] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>My Shift Duties ({myTasks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('run_of_show')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'run_of_show'
              ? 'bg-[#3E6CB5] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Full Event Run-of-Show ({tasks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('crew_group')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'crew_group'
              ? 'bg-[#3E6CB5] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Event Crew Roster & Comms ({personnel.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('venue_contacts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'venue_contacts'
              ? 'bg-[#3E6CB5] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Venue & Emergency Dispatch</span>
        </button>
      </div>

      {/* TAB 1: My Shift Duties */}
      {activeTab === 'my_tasks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Chronological Duties & Action Items</span>
              <span className="text-[10px] text-slate-400 font-normal">
                (Tap buttons to update status in real time)
              </span>
            </h3>
            <span className="text-xs text-slate-400">
              {myTasks.length} {myTasks.length === 1 ? 'duty' : 'duties'} assigned
            </span>
          </div>

          <div className="space-y-3">
            {myTasks.map((task, idx) => {
              // Upstream dependency check
              const upstreamDependencies = tasks.filter((t) => task.dependencies?.includes(t.id));
              const hasUnfinishedPrereq = upstreamDependencies.some((dep) => dep.status !== 'completed');

              return (
                <div
                  key={task.id}
                  className="bg-white dark:bg-[#171E2B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-3 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#F0F4FA] dark:bg-[#162032] text-[#3E6CB5] dark:text-[#7EA6E0] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 font-mono">
                        #{idx + 1}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                            {task.title}
                          </h4>
                          <span
                            className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                              task.status === 'completed'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : task.status === 'in_progress'
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {task.status.replace('_', ' ')}
                          </span>

                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 capitalize">
                            {(task.track || 'operations').replace('_', ' ')}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                          {task.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                      <div className="text-right">
                        <span className="text-xs font-bold font-mono text-slate-900 dark:text-slate-100">
                          {task.start_time || '08:00'} – {task.end_time || '10:00'}
                        </span>
                        <p className="text-[10px] text-slate-400">Scheduled Window</p>
                      </div>

                      {/* One-Tap Status Toggle for Crew */}
                      {task.status === 'completed' ? (
                        <button
                          onClick={() => updateTaskStatus(task.id, 'in_progress')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-100 cursor-pointer transition-colors"
                          title="Click to revert to In Progress"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Done ✓</span>
                        </button>
                      ) : task.status === 'in_progress' ? (
                        <button
                          onClick={() => updateTaskStatus(task.id, 'completed')}
                          className="px-3 py-1.5 rounded-lg bg-[#3E6CB5] hover:bg-[#325896] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                          title="Click to mark duty complete"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark Done</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => updateTaskStatus(task.id, 'in_progress')}
                          className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 hover:bg-amber-100 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                          title="Click to start this duty"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Start Duty</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Upstream Dependencies */}
                  {upstreamDependencies.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200/60 dark:border-slate-800 text-xs flex flex-wrap items-center gap-2">
                      <GitBranch className="w-3.5 h-3.5 text-[#B87A44] shrink-0" />
                      <span className="text-slate-500 font-semibold text-[11px]">
                        Prerequisite Task:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {upstreamDependencies.map((dep) => (
                          <span
                            key={dep.id}
                            className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${
                              dep.status === 'completed'
                                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                            }`}
                          >
                            {dep.title} ({dep.status.replace('_', ' ')})
                          </span>
                        ))}
                      </div>
                      {hasUnfinishedPrereq && (
                        <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                          (Waiting for prerequisite to finish)
                        </span>
                      )}
                    </div>
                  )}

                  {/* Required Equipment */}
                  {task.resource_assignments && task.resource_assignments.length > 0 && (
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
                      <Wrench className="w-3 h-3 text-[#3E6CB5]" />
                      <span className="font-semibold">Required Equipment:</span>
                      <div className="flex flex-wrap gap-1">
                        {task.resource_assignments.map((res) => (
                          <span
                            key={res.resource_id}
                            className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono"
                          >
                            {res.resource_name} (x{res.quantity})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {myTasks.length === 0 && (
              <div className="space-y-4">
                <div className="bg-[#EBF3FC] dark:bg-[#1E293B] border border-[#C8DCF7] dark:border-[#2D4160] rounded-2xl p-5 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#3E6CB5] dark:text-[#7EA6E0]" />
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        Operational Shift Protocol & Checklist
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-white dark:bg-[#111722] text-[#244A85] dark:text-[#8BB0E8] font-bold border border-[#C8DCF7] dark:border-[#2D4160]">
                      Station: {currentPerson?.role || 'Event Crew'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Your account is on active shift! While individual timeline tasks are being assigned by the stage manager, here is your standard day-of operational protocol for <strong>{currentPerson?.role || 'Event Crew'}</strong>:
                  </p>

                  <div className="space-y-2 pt-1">
                    {[
                      { title: 'Check in with Lead Organizer at Operations Desk & sync schedule', time: '08:00 AM' },
                      { title: 'Test VHF Radio Comms on Dispatch Channel VHF CH 04', time: '08:15 AM' },
                      {
                        title: hasScannerPermission
                          ? 'Operate turnstile ticket scanner & verify general/VIP attendee admissions'
                          : 'Review designated floor station, inspect crowd barricades & clear emergency egress routes',
                        time: '08:30 AM',
                      },
                      { title: 'Monitor venue crowd flow and report incident logs to command center', time: 'Ongoing' },
                      { title: 'Post-event debrief & facility equipment handover', time: 'Shift Close' },
                    ].map((duty, dIdx) => (
                      <label
                        key={dIdx}
                        className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-[#111722] border border-slate-200/60 dark:border-slate-800 text-xs hover:border-[#3E6CB5]/40 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            defaultChecked={dIdx === 0}
                            className="rounded border-slate-300 text-[#3E6CB5] focus:ring-[#3E6CB5]"
                          />
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {duty.title}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 font-semibold shrink-0 ml-2">
                          {duty.time}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Full Event Run-of-Show */}
      {activeTab === 'run_of_show' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-[#171E2B] p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Master Event Run-of-Show
              </h3>
              <p className="text-xs text-slate-400">
                Full chronological overview of all tracks (AV, Staging, Operations, Registration)
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search run-of-show..."
                value={searchRunOfShow}
                onChange={(e) => setSearchRunOfShow(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-[#F8FAFD] dark:bg-[#111722] text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#3E6CB5]"
              />
            </div>
          </div>

          <div className="space-y-2.5">
            {filteredAllTasks.map((t) => (
              <div
                key={t.id}
                className="bg-white dark:bg-[#171E2B] border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {t.start_time} - {t.end_time}
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {t.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">{t.description}</p>
                  {t.personnel_assignments && t.personnel_assignments.length > 0 && (
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pt-0.5">
                      <Users className="w-3 h-3 text-[#3E6CB5]" />
                      <span>
                        Assigned crew: {t.personnel_assignments.map((pa) => pa.personnel_name).join(', ')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                      t.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : t.status === 'in_progress'
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {t.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Event Crew Roster & Comms Directory (Like a Group Chat / Crew Roster) */}
      {activeTab === 'crew_group' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-[#171E2B] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#3E6CB5] dark:text-[#7EA6E0]" />
                Event Crew Roster & Comms Directory
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                All confirmed personnel on shift for <strong>{selectedEvent?.title || 'Active Event'}</strong>. Direct contact and radio frequencies.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {personnel.length} Crew On Shift
              </span>
            </div>
          </div>

          {/* Master Radio Comms Dispatch */}
          <div className="p-4 rounded-2xl bg-[#EBF3FC] dark:bg-[#1E293B] border border-[#C8DCF7] dark:border-[#2D4160] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs">
            <div className="flex items-center gap-3 text-[#244A85] dark:text-[#8BB0E8]">
              <Radio className="w-5 h-5 shrink-0 animate-pulse text-[#3E6CB5]" />
              <div>
                <span className="font-bold block text-sm">Active Crew Radio Channel: VHF CH 04 (Operations & Staging)</span>
                <span className="text-[11px] opacity-80">Security & Gate Staff on CH 02 • Registration on CH 01 • Medical on CH 09</span>
              </div>
            </div>
            <span className="px-3 py-1 rounded-xl bg-white dark:bg-[#111722] text-[#244A85] dark:text-[#8BB0E8] font-mono font-bold text-[11px] border border-[#C8DCF7] dark:border-[#2D4160] shrink-0">
              Station Broadcast Active
            </span>
          </div>

          {/* Crew Members Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {personnel.map((p) => {
              const isSelf =
                p.email.toLowerCase() === currentUser.email.toLowerCase() ||
                p.name.toLowerCase() === currentUser.name.toLowerCase();

              return (
                <div
                  key={p.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isSelf
                      ? 'bg-blue-50/60 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 shadow-xs ring-1 ring-blue-300 dark:ring-blue-700'
                      : 'bg-white dark:bg-[#171E2B] border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#EBF3FC] dark:bg-[#1E293B] border border-[#C8DCF7] dark:border-[#2D4160] flex items-center justify-center font-bold text-sm text-[#244A85] dark:text-[#8BB0E8]">
                        {p.name
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">{p.name}</h4>
                          {isSelf && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#3E6CB5] text-white font-bold">
                              YOU
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#3E6CB5] dark:text-[#7EA6E0] font-semibold">{p.role}</p>
                      </div>
                    </div>
                    <span
                      className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 mt-1"
                      title="Confirmed & Active on Shift"
                    />
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <a href={`tel:${p.phone}`} className="hover:underline font-mono text-slate-800 dark:text-slate-200 font-medium">
                        {p.phone}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{p.email}</span>
                    </div>
                    {p.can_scan_tickets && (
                      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-[10px] pt-1">
                        <QrCode className="w-3 h-3 shrink-0" />
                        <span>Gate Ticket Scanner Operator</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: Venue & Emergency Dispatch */}
      {activeTab === 'venue_contacts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Venue Info */}
          <div className="bg-white dark:bg-[#171E2B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <MapPin className="w-4 h-4 text-[#3E6CB5]" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Venue Location & Station Access
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                  Venue Name
                </span>
                <p className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-0.5">
                  {activeVenue.name}
                </p>
                <p className="text-slate-500 mt-0.5">{activeVenue.address}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                    Operating Window
                  </span>
                  <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5 font-mono">
                    {activeVenue.operating_hours.open} – {activeVenue.operating_hours.close}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                    Venue Manager Desk
                  </span>
                  <a
                    href={`tel:${activeVenue.contact_phone}`}
                    className="font-semibold text-[#3E6CB5] hover:underline block mt-0.5"
                  >
                    {activeVenue.contact_phone}
                  </a>
                </div>
              </div>

              <div className="pt-2">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                  Facilities Available on Site
                </span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {activeVenue.facilities.map((f, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Emergency & Key Contacts */}
          <div className="bg-white dark:bg-[#171E2B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <ShieldAlert className="w-4 h-4 text-[#BA4E3E]" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Emergency & Operations Dispatch
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-rose-800 dark:text-rose-200">
                    Emergency Dispatch Hotline
                  </p>
                  <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-0.5">
                    Dial <strong>911</strong> or Operations Command Center: <strong>+63 (38) 411-2000</strong>
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200/60 dark:border-slate-800">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100">Lead Event Organizer</p>
                    <p className="text-[10px] text-slate-400">Mark Bautista • Zabay Operations</p>
                  </div>
                  <a
                    href="tel:+639173891029"
                    className="px-2.5 py-1 rounded-lg bg-[#3E6CB5] text-white text-[10px] font-bold"
                  >
                    Call Lead
                  </a>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200/60 dark:border-slate-800">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100">Security & Medical Lead</p>
                    <p className="text-[10px] text-slate-400">Aileen Robles • First Aid Post</p>
                  </div>
                  <a
                    href="tel:+639205509921"
                    className="px-2.5 py-1 rounded-lg bg-[#4E8268] text-white text-[10px] font-bold"
                  >
                    Call Security
                  </a>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200/60 dark:border-slate-800">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100">Technical & AV Lead</p>
                    <p className="text-[10px] text-slate-400">Danilo Torralba • Audio Console Desk</p>
                  </div>
                  <a
                    href="tel:+639177721049"
                    className="px-2.5 py-1 rounded-lg bg-slate-800 text-white text-[10px] font-bold"
                  >
                    Call Audio
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Embedded Live QR Scanner Modal */}
      <QRCheckInScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        eventId={selectedEvent?.id}
      />
    </div>
  );
};
