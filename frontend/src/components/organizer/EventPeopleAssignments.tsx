import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  FileText,
  DollarSign,
  Truck,
  Camera,
  Megaphone,
  CalendarCheck,
  Check,
  AlertCircle,
  Sparkles,
  Mail,
  Phone,
  ArrowRight,
  UserCheck,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { EventCommitteeRoleMap } from '../../types';

interface EventPeopleAssignmentsProps {
  onSwitchToStaffView?: () => void;
  onNavigateToKanban?: () => void;
}

interface CommitteeDefinition {
  key: keyof EventCommitteeRoleMap;
  title: string;
  shortLabel: string;
  icon: React.ReactNode;
  iconBg: string;
  badgeColor: string;
  description: string;
  exampleDuties: string;
  committeeTag: string;
}

const COMMITTEES: CommitteeDefinition[] = [
  {
    key: 'event_head',
    title: 'Event Head / Director',
    shortLabel: 'Event Head',
    icon: <ShieldCheck className="w-5 h-5 text-[#244A85] dark:text-[#8BB0E8]" />,
    iconBg: 'bg-[#EBF3FC] dark:bg-[#1E293B]',
    badgeColor: 'bg-[#EBF3FC] text-[#244A85] dark:bg-[#1E293B] dark:text-[#8BB0E8] border-[#C8DCF7] dark:border-[#2D4160]',
    description: 'Executive project lead responsible for overall timeline, stakeholder alignment, and final milestone sign-offs.',
    exampleDuties: 'Dean/Principal briefings, LGU clearances, emergency crisis management, and event kickoff.',
    committeeTag: 'general',
  },
  {
    key: 'letters_head',
    title: 'Letters Committee Head',
    shortLabel: 'Letters & Permits',
    icon: <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    description: 'Drafts, files, and tracks statutory permits, endorsement letters, speaker invitations, and parent waivers.',
    exampleDuties: "Mayor's SEP, BFP FSIC clearance, OSA Form A-1, DepEd/Dean endorsements, speaker honoraria requests.",
    committeeTag: 'letters',
  },
  {
    key: 'finance_head',
    title: 'Finance & Budget Head',
    shortLabel: 'Finance & Budget',
    icon: <DollarSign className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
    iconBg: 'bg-amber-50 dark:bg-amber-950/40',
    badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    description: 'Oversees ticket revenue, cash disbursements, supplier invoices, petty cash boxes, and liquidation filings.',
    exampleDuties: 'Catering vouchers, prize pool disbursement, referee honoraria, official receipt issuance, liquidation.',
    committeeTag: 'finance',
  },
  {
    key: 'logistics_head',
    title: 'Logistics & Venue Head',
    shortLabel: 'Logistics & Venue',
    icon: <Truck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
    iconBg: 'bg-indigo-50 dark:bg-indigo-950/40',
    badgeColor: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    description: 'Coordinates physical facility ingress, hardwood court/hall inspection, stage rigging, seating layouts, and AV audio rigs.',
    exampleDuties: 'Venue floorplans, 400 chairs layout, line-array acoustics, scoreboard tests, equipment hauling.',
    committeeTag: 'logistics',
  },
  {
    key: 'documentation_head',
    title: 'Documentation & Media Head',
    shortLabel: 'Documentation',
    icon: <Camera className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
    iconBg: 'bg-rose-50 dark:bg-rose-950/40',
    badgeColor: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    description: 'Records photo/video coverage, manages live stream broadcasting, writes session minutes, and compiles narrative reports.',
    exampleDuties: 'Plenary photography, livestream audio, highlight video reel, proceedings archive, press release packet.',
    committeeTag: 'documentation',
  },
  {
    key: 'publicity_head',
    title: 'Publicity & Marketing Head',
    shortLabel: 'Publicity & Promo',
    icon: <Megaphone className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
    iconBg: 'bg-purple-50 dark:bg-purple-950/40',
    badgeColor: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    description: 'Executes social media teasers, poster distribution, digital banner advertising, and attendee engagement campaigns.',
    exampleDuties: 'Facebook countdowns, campus bulletin postings, event merchandise teasers, ticket tier promotions.',
    committeeTag: 'publicity',
  },
  {
    key: 'program_head',
    title: 'Program & Stage Flow Head',
    shortLabel: 'Program & Flow',
    icon: <CalendarCheck className="w-5 h-5 text-sky-600 dark:text-sky-400" />,
    iconBg: 'bg-sky-50 dark:bg-sky-950/40',
    badgeColor: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-800',
    description: 'Coordinates run-of-show cues, emcee scripts, keynote introductions, game schedules, and awarding ceremonies.',
    exampleDuties: 'Order of march, stage timekeeping, moderator bell, athlete team brackets, speaker walk-up music.',
    committeeTag: 'program',
  },
  {
    key: 'secretary',
    title: 'Secretary / Registration Head',
    shortLabel: 'Secretary & Registration',
    icon: <UserCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" />,
    iconBg: 'bg-teal-50 dark:bg-teal-950/40',
    badgeColor: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200 dark:border-teal-800',
    description: 'Manages gate check-in, attendance manifests, QR pass validation, participant badges, and completion certificates.',
    exampleDuties: 'Student ID scans, wristband handout, data privacy consent forms, certificate generation, quorum checks.',
    committeeTag: 'secretary',
  },
];

export const EventPeopleAssignments: React.FC<EventPeopleAssignmentsProps> = ({
  onSwitchToStaffView,
  onNavigateToKanban,
}) => {
  const {
    currentUser,
    tasks,
    personnel,
    committeeRoles,
    propagateCommitteeRoles,
    addPersonnel,
    previewStaffPortal,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'matrix' | 'roster'>('matrix');
  const [localRoles, setLocalRoles] = useState<EventCommitteeRoleMap>(() => ({
    event_head: committeeRoles.event_head || currentUser.name,
    secretary: committeeRoles.secretary || '',
    letters_head: committeeRoles.letters_head || '',
    finance_head: committeeRoles.finance_head || '',
    logistics_head: committeeRoles.logistics_head || '',
    documentation_head: committeeRoles.documentation_head || '',
    publicity_head: committeeRoles.publicity_head || '',
    program_head: committeeRoles.program_head || '',
  }));
  const [preserveOverrides, setPreserveOverrides] = useState<boolean>(true);
  const [propagationNotice, setPropagationNotice] = useState<string | null>(null);

  // New member modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('Event Coordinator');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('+63 (917) ');

  // Compute task statistics by committee
  const getCommitteeTasks = (commTag: string) => {
    return tasks.filter((t) => {
      const c = t.committee ? String(t.committee).toLowerCase() : '';
      return c === commTag;
    });
  };

  const unassignedTasksCount = tasks.filter(
    (t) => !t.personnel_assignments || t.personnel_assignments.length === 0
  ).length;

  const handleRoleChange = (key: keyof EventCommitteeRoleMap, value: string) => {
    setLocalRoles((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handlePropagate = () => {
    const { updatedCount } = propagateCommitteeRoles(localRoles, preserveOverrides);
    setPropagationNotice(
      `Assignments propagated successfully! Updated ${updatedCount} task(s) on your Kanban board.`
    );
    setTimeout(() => setPropagationNotice(null), 4000);
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    addPersonnel({
      name: newMemberName.trim(),
      role: newMemberRole as any,
      skills: [newMemberRole, 'Event Committee Staff'],
      phone: newMemberPhone.trim(),
      email: newMemberEmail.trim() || `${newMemberName.toLowerCase().replace(/\s+/g, '.')}@zabay.ph`,
      hourly_rate: 0,
      is_available: true,
      can_scan_tickets: ['Event Coordinator', 'Security Lead', 'Registration Staff'].includes(newMemberRole),
    });

    setNewMemberName('');
    setNewMemberEmail('');
    setIsAddModalOpen(false);
  };

  // Build unique roster names combining currentUser and registered personnel
  const rosterNames = Array.from(
    new Set([currentUser.name, ...personnel.map((p) => p.name)])
  );

  return (
    <div className="space-y-6">
      {/* Top Banner / Guidance */}
      <div className="bg-white dark:bg-[#171E2B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#EBF3FC] dark:bg-[#1E293B] text-[#3E6CB5] dark:text-[#7EA6E0]">
                <Users className="w-5 h-5" />
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Event People & Committee Assignments
              </h2>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-[#EDF7F2] text-[#2B6149] dark:bg-[#17271F] dark:text-[#81B89B]">
                Organized & Traceable
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Assign committee heads to your event. ZABAY propagates tasks to the responsible person while keeping individual task overrides safe.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3E6CB5] hover:bg-[#325896] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Member</span>
            </button>

            {onSwitchToStaffView && (
              <button
                onClick={() => {
                  previewStaffPortal();
                  onSwitchToStaffView();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                title="Preview what event staff see on their mobile phones"
              >
                <span>Staff View</span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
              </button>
            )}
          </div>
        </div>

        {/* Unassigned Tasks Alert Pill */}
        {unassignedTasksCount > 0 ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 text-amber-800 dark:text-amber-200 text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                <strong>{unassignedTasksCount} task(s) currently unassigned.</strong> Select committee heads below and click "Propagate to Tasks" to resolve.
              </span>
            </div>
            {onNavigateToKanban && (
              <button
                onClick={onNavigateToKanban}
                className="font-bold underline hover:text-amber-900 dark:hover:text-amber-100 flex items-center gap-1 shrink-0 cursor-pointer"
              >
                View in Kanban <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-200 text-xs">
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              <strong>All tasks assigned!</strong> Every operational requirement has an assigned owner.
            </span>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'matrix'
                ? 'bg-[#EBF3FC] text-[#244A85] dark:bg-[#1E293B] dark:text-[#8BB0E8] border border-[#C8DCF7] dark:border-[#2D4160]'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Committee Role Matrix
          </button>
          <button
            onClick={() => setActiveTab('roster')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'roster'
                ? 'bg-[#EBF3FC] text-[#244A85] dark:bg-[#1E293B] dark:text-[#8BB0E8] border border-[#C8DCF7] dark:border-[#2D4160]'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Team Members Roster ({personnel.length + 1})
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {propagationNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{propagationNotice}</span>
          </div>
          <button
            onClick={() => setPropagationNotice(null)}
            className="p-1 text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* TAB 1: COMMITTEE ROLE MATRIX */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          {/* Action Bar */}
          <div className="bg-[#FAF9F5] dark:bg-[#12161F] p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 select-none cursor-pointer">
              <input
                type="checkbox"
                checked={preserveOverrides}
                onChange={(e) => setPreserveOverrides(e.target.checked)}
                className="w-4 h-4 rounded text-[#3E6CB5] focus:ring-[#3E6CB5] border-slate-300 dark:border-slate-700"
              />
              <span>
                <strong>Preserve manually assigned tasks</strong> (Only assign unassigned items)
              </span>
            </label>

            <button
              onClick={handlePropagate}
              className="w-full sm:w-auto px-5 py-2.5 bg-[#3E6CB5] hover:bg-[#325896] text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Apply & Propagate to Tasks</span>
            </button>
          </div>

          {/* Committee Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {COMMITTEES.map((comm) => {
              const assignedName = localRoles[comm.key] || '';
              const commTasks = getCommitteeTasks(comm.committeeTag);
              const unassignedCount = commTasks.filter(
                (t) => !t.personnel_assignments || t.personnel_assignments.length === 0
              ).length;

              return (
                <div
                  key={comm.key}
                  className="bg-white dark:bg-[#171E2B] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${comm.iconBg}`}>
                        {comm.icon}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {comm.title}
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {comm.shortLabel}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                        assignedName
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                      }`}
                    >
                      {assignedName ? 'Assigned' : 'Unassigned'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {comm.description}
                  </p>

                  <div className="bg-[#FAF9F5] dark:bg-[#111722] p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Scope & Duties:
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                      {comm.exampleDuties}
                    </p>
                  </div>

                  {/* Assignee Selection Row */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-semibold text-slate-700 dark:text-slate-300">
                        Designated Head / Lead:
                      </label>
                      <span className="text-[11px] font-mono text-slate-400">
                        {commTasks.length} task(s) in category
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={assignedName}
                        onChange={(e) => handleRoleChange(comm.key, e.target.value)}
                        className="flex-1 bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3E6CB5]/30 cursor-pointer"
                      >
                        <option value="">— Unassigned (Needs Head) —</option>
                        {rosterNames.map((name) => (
                          <option key={name} value={name}>
                            {name} {name === currentUser.name ? '(Current Organizer)' : ''}
                          </option>
                        ))}
                      </select>

                      {assignedName && (
                        <button
                          onClick={() => handleRoleChange(comm.key, '')}
                          className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                          title="Clear assignment"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {unassignedCount > 0 && assignedName && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 pt-0.5">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{unassignedCount} task(s) waiting for this head to be propagated.</span>
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: TEAM MEMBERS ROSTER */}
      {activeTab === 'roster' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Current Organizer Card */}
            <div className="bg-white dark:bg-[#171E2B] border-2 border-[#3E6CB5]/30 rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center gap-3">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-11 h-11 rounded-full object-cover ring-2 ring-[#3E6CB5]/40"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                      {currentUser.name}
                    </h3>
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shrink-0">
                      You
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    Lead Event Organizer
                  </p>
                </div>
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{currentUser.email}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{currentUser.phone || '+63 (917) 389-1029'}</span>
                </div>
              </div>

              <div className="p-2 rounded-xl bg-[#FAF9F5] dark:bg-[#111722] text-[11px] text-slate-500 flex items-center justify-between">
                <span>Assigned Role:</span>
                <span className="font-bold text-[#244A85] dark:text-[#8BB0E8]">
                  {localRoles.event_head || 'Event Head'}
                </span>
              </div>
            </div>

            {/* Personnel Crew Members */}
            {personnel.map((person) => {
              const assignedTasks = tasks.filter((t) =>
                t.personnel_assignments?.some(
                  (a) => a.personnel_name.toLowerCase() === person.name.toLowerCase()
                )
              );

              return (
                <div
                  key={person.id}
                  className="bg-white dark:bg-[#171E2B] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 text-sm ring-1 ring-slate-200 dark:ring-slate-700">
                      {person.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                        {person.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {person.role}
                      </p>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{person.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{person.phone}</span>
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-[#FAF9F5] dark:bg-[#111722] text-[11px] text-slate-500 flex items-center justify-between">
                    <span>Active Tasks:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {assignedTasks.length} task(s)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4">
          <div className="bg-white dark:bg-[#171E2B] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full max-h-[92vh] overflow-y-auto shadow-2xl p-4 sm:p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#3E6CB5]" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Add Event Team Member
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maria Bea Lim"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="w-full bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3E6CB5]/30"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Primary Role
                </label>
                <select
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value)}
                  className="w-full bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3E6CB5]/30 cursor-pointer"
                >
                  <option value="Event Coordinator">Event Coordinator</option>
                  <option value="Registration Staff">Registration Staff</option>
                  <option value="Stage Manager">Stage Manager</option>
                  <option value="Security Lead">Security Lead</option>
                  <option value="Sound Engineer">Sound Engineer</option>
                  <option value="Lighting Tech">Lighting Tech</option>
                  <option value="Tournament Referee">Tournament Referee</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="name@zabay.ph"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  className="w-full bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3E6CB5]/30"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Mobile Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+63 (917) ..."
                  value={newMemberPhone}
                  onChange={(e) => setNewMemberPhone(e.target.value)}
                  className="w-full bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3E6CB5]/30"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#3E6CB5] hover:bg-[#325896] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Save Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
