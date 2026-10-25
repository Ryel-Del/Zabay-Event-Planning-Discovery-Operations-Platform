import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Phone,
  Mail,
  Briefcase,
  CheckCircle2,
  Eye,
  Trash2,
  AlertCircle,
  QrCode,
  Lock,
  Clock,
  Send,
  UserCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { canPersonnelScanTickets } from '../../types';
import { api } from '../../services/api';
import { mockUsers } from '../../mock/mockData';

interface PersonnelDirectoryProps {
  onSwitchToStaffView?: () => void;
}

const ROLE_OPTIONS = [
  'Sound Engineer',
  'Lighting Tech',
  'Stage Manager',
  'Security Lead',
  'Tournament Referee',
  'Event Coordinator',
  'Registration Staff',
  'Medical / First Aid',
  'Catering Supervisor',
  'Emcee / Host',
  'Network Admin',
] as const;

export const PersonnelDirectory: React.FC<PersonnelDirectoryProps> = ({ onSwitchToStaffView }) => {
  const {
    currentUser,
    personnel,
    tasks,
    selectedEvent,
    venues,
    addPersonnel,
    updatePersonnel,
    removePersonnel,
    previewStaffPortal,
    staffInvitations,
    sendStaffInvitation,
  } = useApp();

  const handlePreviewStaff = (staffId: string = 'per-3') => {
    previewStaffPortal(staffId);
    if (onSwitchToStaffView) {
      onSwitchToStaffView();
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State for new personnel
  const [name, setName] = useState('');
  const [role, setRole] = useState<typeof ROLE_OPTIONS[number]>('Stage Manager');
  const [customRole, setCustomRole] = useState('');
  const [hourlyRate, setHourlyRate] = useState<number>(500);
  const [phone, setPhone] = useState('+63 (917) ');
  const [email, setEmail] = useState('');
  const [skillsInput, setSkillsInput] = useState('Event Staging, Floor Coordination');
  const [canScanTickets, setCanScanTickets] = useState(false);
  const [callTime, setCallTime] = useState('08:00 AM');
  const [inviteNotes, setInviteNotes] = useState('');
  const [formError, setFormError] = useState('');

  // User search state for inviting existing registered users
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [matchedUsers, setMatchedUsers] = useState<Array<{ id: string; name: string; email: string; phone?: string; role?: string }>>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [inviteSuccessToast, setInviteSuccessToast] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'pending'>('all');

  // Search registered users (API first with instant local account fallback)
  useEffect(() => {
    const term = userSearchTerm.trim().toLowerCase();
    if (!term) {
      setMatchedUsers([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingUsers(true);
      try {
        const res = await api.auth.searchUsers(term);
        if (res.data?.users && res.data.users.length > 0) {
          setMatchedUsers(res.data.users);
          setIsSearchingUsers(false);
          return;
        }
      } catch (err) {
        // Fall back to local accounts
      }

      // Local account search across mock users and active session
      const allLocalUsers = [...mockUsers];
      if (typeof window !== 'undefined') {
        const storedUser = localStorage.getItem('zabay-user');
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            if (!allLocalUsers.some((u) => u.id === parsed.id || u.email === parsed.email)) {
              allLocalUsers.push(parsed);
            }
          } catch {
            // ignore
          }
        }
      }

      const matches = allLocalUsers
        .filter(
          (u) =>
            u.name.toLowerCase().includes(term) ||
            u.email.toLowerCase().includes(term) ||
            (u.organization && u.organization.toLowerCase().includes(term))
        )
        .map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          role: u.role,
        }));

      setMatchedUsers(matches);
      setIsSearchingUsers(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [userSearchTerm]);

  // Filter personnel
  const filteredPersonnel = personnel.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = selectedRoleFilter === 'All' || p.role === selectedRoleFilter;
    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'pending'
        ? p.invitation_status === 'pending'
        : p.invitation_status !== 'pending';

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Calculate statistics
  const totalCrew = personnel.length;
  const availableCrew = personnel.filter((p) => p.is_available).length;
  const totalAssignedTasks = tasks.reduce(
    (acc, t) => acc + (t.personnel_assignments ? t.personnel_assignments.length : 0),
    0
  );
  const avgHourlyRate =
    totalCrew > 0
      ? Math.round(personnel.reduce((acc, p) => acc + p.hourly_rate, 0) / totalCrew)
      : 0;

  // Handle adding personnel & sending shift invitation
  const handleAddPersonnel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Please provide a full name for the personnel member.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setFormError('Please provide a valid email address.');
      return;
    }
    if (hourlyRate <= 0) {
      setFormError('Hourly rate must be greater than ₱0.');
      return;
    }

    const assignedRole = role === ('Other' as any) && customRole.trim() ? customRole.trim() : role;
    const skillsList = skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    // 1. Dispatch staff shift invitation so user sees it in their Staff Portal
    const matchedVenue = venues.find((v) => v.id === selectedEvent?.venue_id);
    sendStaffInvitation({
      event_id: selectedEvent?.id || 'evt-1',
      event_title: selectedEvent?.title || 'Active Event',
      event_date: selectedEvent?.start_date || 'November 13, 2026',
      venue_name: matchedVenue?.name || 'Designated Event Venue',
      user_id: selectedUserId || `usr-${Date.now()}`,
      user_name: name.trim(),
      user_email: email.trim(),
      role: assignedRole,
      call_time: callTime.trim() || '08:00 AM',
      hourly_rate: Number(hourlyRate),
      can_scan_tickets: canScanTickets,
      notes: inviteNotes.trim() || undefined,
    });

    // 2. Add to event personnel roster
    addPersonnel({
      name: name.trim(),
      role: assignedRole as any,
      hourly_rate: Number(hourlyRate),
      phone: phone.trim(),
      email: email.trim(),
      skills: skillsList.length > 0 ? skillsList : ['General Crew Support'],
      is_available: true,
      can_scan_tickets: canScanTickets,
    });

    setInviteSuccessToast(
      `🎉 Shift invitation sent to ${name.trim()}! They can now accept their slot and view run-of-show duties in their Staff Portal.`
    );
    setTimeout(() => setInviteSuccessToast(null), 6000);

    // Reset Form
    setName('');
    setRole('Stage Manager');
    setCustomRole('');
    setHourlyRate(500);
    setPhone('+63 (917) ');
    setEmail('');
    setSkillsInput('Event Staging, Floor Coordination');
    setCanScanTickets(false);
    setCallTime('08:00 AM');
    setInviteNotes('');
    setUserSearchTerm('');
    setSelectedUserId(null);
    setFormError('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Shift Invitation Sent Alert Toast */}
      {inviteSuccessToast && (
        <div className="bg-emerald-600 text-white p-4 rounded-2xl flex items-center justify-between gap-3 text-xs shadow-md animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="font-semibold">{inviteSuccessToast}</span>
          </div>
          <button
            onClick={() => setInviteSuccessToast(null)}
            className="text-white/80 hover:text-white text-xs font-bold px-2 py-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Banner & Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-[#171E2B] p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#3E6CB5] dark:text-[#7EA6E0] px-2.5 py-0.5 rounded-full bg-[#EBF3FC] dark:bg-[#1E293B]">
              Resource Operations
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">
              {selectedEvent?.title || 'Active Event Workspace'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            Event Personnel & Crew Roster
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage stage managers, sound engineers, referees, and coordinators. Registered personnel can also view their schedules via the Staff Portal.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
          <button
            onClick={() => handlePreviewStaff('per-3')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            title="Open the Staff Shift Portal"
          >
            <Eye className="w-4 h-4 text-[#3E6CB5] dark:text-[#7EA6E0]" />
            <span>Preview as Staff</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#3E6CB5] hover:bg-[#325896] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Personnel</span>
          </button>
        </div>
      </div>

      {/* Real-World Operational Workflow Explainer */}
      <div className="bg-[#EBF3FC]/60 dark:bg-[#1E293B]/40 border border-[#C8DCF7] dark:border-[#2D4160] rounded-2xl p-4 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-[#244A85] dark:text-[#8BB0E8] uppercase tracking-wider">
                💡 Real-World Event Personnel Workflow
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white dark:bg-[#171E2B] text-[#244A85] dark:text-[#8BB0E8] font-mono border border-[#C8DCF7] dark:border-[#2D4160]">
                Roster → Tasks → Shift Portal
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              <strong>1. Directory Roster:</strong> Manage certified crew rates and contact information. 
              <strong> 2. Task Allocation:</strong> Assign crew leads to run-of-show duties on the Kanban board. 
              <strong> 3. Staff Portal Execution:</strong> Crew members switch to Staff View to access mobile duty checklists and gate ticket scanners.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handlePreviewStaff('per-3')}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#171E2B] hover:bg-slate-50 dark:hover:bg-slate-800 border border-[#C8DCF7] dark:border-[#2D4160] text-xs font-semibold text-[#244A85] dark:text-[#8BB0E8] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Simulate Shift Portal</span>
            </button>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-[#171E2B] p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span>Total Crew Members</span>
            <Users className="w-4 h-4 text-[#3E6CB5]" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">{totalCrew}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Assigned across departments</p>
        </div>

        <div className="bg-white dark:bg-[#171E2B] p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span>Active / On Shift</span>
            <CheckCircle2 className="w-4 h-4 text-[#4E8268]" />
          </div>
          <p className="text-2xl font-bold text-[#4E8268] dark:text-[#81B89B] mt-2">
            {availableCrew}
            <span className="text-xs text-slate-400 font-normal ml-1">/ {totalCrew} ready</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Available for day-of dispatch</p>
        </div>

        <div className="bg-white dark:bg-[#171E2B] p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span>Tasks Assigned</span>
            <Briefcase className="w-4 h-4 text-[#B87A44]" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
            {totalAssignedTasks}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Across active schedule run-of-show</p>
        </div>

        <div className="bg-white dark:bg-[#171E2B] p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span>Avg Hourly Rate</span>
            <span className="font-bold text-xs text-[#3E6CB5]">₱</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
            ₱{avgHourlyRate.toLocaleString()}
            <span className="text-xs text-slate-400 font-normal">/hr</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Bohol professional benchmark</p>
        </div>
      </div>

      {/* Search & Filter Toolbar with Status Tabs */}
      <div className="bg-white dark:bg-[#171E2B] p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search personnel by name, role, skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-[#F8FAFD] dark:bg-[#111722] text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#3E6CB5]"
            />
          </div>

          {/* Status Tabs: All, Confirmed Crew, Pending Invites */}
          <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                statusFilter === 'all'
                  ? 'bg-[#3E6CB5] text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              All Crew ({personnel.length})
            </button>
            <button
              onClick={() => setStatusFilter('confirmed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1 ${
                statusFilter === 'confirmed'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Confirmed ({personnel.filter((p) => p.invitation_status !== 'pending').length})</span>
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1 ${
                statusFilter === 'pending'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Pending Invites ({personnel.filter((p) => p.invitation_status === 'pending').length})</span>
            </button>
          </div>
        </div>

        {/* Role Filters */}
        <div className="flex items-center gap-2 overflow-x-auto w-full pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-xs text-slate-400 shrink-0">Role:</span>
          {['All', 'Stage Manager', 'Sound Engineer', 'Lighting Tech', 'Tournament Referee', 'Security Lead'].map(
            (roleFilter) => (
              <button
                key={roleFilter}
                onClick={() => setSelectedRoleFilter(roleFilter)}
                className={`text-xs px-2.5 py-1 rounded-lg shrink-0 font-medium transition-colors cursor-pointer ${
                  selectedRoleFilter === roleFilter
                    ? 'bg-[#3E6CB5] text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {roleFilter}
              </button>
            )
          )}
        </div>
      </div>

      {/* Personnel Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPersonnel.map((person) => {
          // Find tasks assigned to this personnel in the current event
          const assignedTasks = tasks.filter((t) =>
            t.personnel_assignments?.some((pa) => pa.personnel_id === person.id)
          );

          // Check staff invitation status for this person in the active event
          const personInvite = (staffInvitations || []).find(
            (inv) =>
              (inv.user_id === person.id ||
                inv.user_email?.toLowerCase() === person.email.toLowerCase() ||
                inv.user_name.toLowerCase() === person.name.toLowerCase()) &&
              inv.event_id === selectedEvent?.id
          );

          return (
            <div
              key={person.id}
              className="bg-white dark:bg-[#171E2B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              {/* Header Info */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#EBF3FC] dark:bg-[#1E293B] border border-[#C8DCF7] dark:border-[#2D4160] flex items-center justify-center font-bold text-sm text-[#244A85] dark:text-[#8BB0E8]">
                      {person.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {person.name}
                        </h3>
                        <span
                          className={`w-2 h-2 rounded-full ${
                            person.is_available ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                          title={person.is_available ? 'Ready on Shift' : 'Unavailable'}
                        />
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="inline-block text-[11px] font-semibold text-[#3E6CB5] dark:text-[#7EA6E0]">
                          {person.role}
                        </span>
                        {personInvite ? (
                          personInvite.status === 'confirmed' ? (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold flex items-center gap-1 font-mono">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Confirmed
                            </span>
                          ) : personInvite.status === 'declined' ? (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold flex items-center gap-1 font-mono">
                              Declined
                            </span>
                          ) : (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-bold flex items-center gap-1 font-mono">
                              <Clock className="w-2.5 h-2.5 animate-pulse" /> Invite Pending
                            </span>
                          )
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      ₱{person.hourly_rate.toLocaleString()}/hr
                    </span>
                    <p className="text-[10px] text-slate-400">Standard Rate</p>
                  </div>
                </div>

                {/* Contact Links */}
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <a
                    href={`tel:${person.phone}`}
                    className="flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-[#3E6CB5] truncate"
                  >
                    <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{person.phone}</span>
                  </a>
                  <a
                    href={`mailto:${person.email}`}
                    className="flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-[#3E6CB5] truncate"
                  >
                    <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{person.email}</span>
                  </a>
                </div>

                {/* Skills Tags */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {person.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                {/* Assigned Event Tasks */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                    <span className="font-semibold flex items-center gap-1">
                      <Briefcase className="w-3 h-3 text-[#3E6CB5]" /> Assigned Run-of-Show:
                    </span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {assignedTasks.length} {assignedTasks.length === 1 ? 'task' : 'tasks'}
                    </span>
                  </div>

                  {assignedTasks.length > 0 ? (
                    <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                      {assignedTasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between text-[10px] bg-[#F8FAFD] dark:bg-[#111722] px-2 py-1.5 rounded-lg border border-slate-200/60 dark:border-slate-800"
                        >
                          <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[170px]">
                            {task.title}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded font-mono font-bold text-[9px] uppercase ${
                              task.status === 'completed'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                : task.status === 'in_progress'
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {task.status.replace('_', ' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">No tasks currently assigned</p>
                  )}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => updatePersonnel(person.id, { is_available: !person.is_available })}
                    className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer ${
                      person.is_available
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {person.is_available ? '✓ Ready' : '○ Standby'}
                  </button>

                  <button
                    onClick={() =>
                      updatePersonnel(person.id, {
                        can_scan_tickets: !canPersonnelScanTickets(person),
                      })
                    }
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold border transition-colors cursor-pointer ${
                      canPersonnelScanTickets(person)
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                    title={
                      canPersonnelScanTickets(person)
                        ? 'Gate Ticket Scanner Authorized (Click to Revoke)'
                        : 'Duty Operations Only (Click to Grant Scanner Access)'
                    }
                  >
                    {canPersonnelScanTickets(person) ? (
                      <QrCode className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Lock className="w-3 h-3 text-slate-400" />
                    )}
                    <span>{canPersonnelScanTickets(person) ? 'Scanner' : 'No Scanner'}</span>
                  </button>

                  <button
                    onClick={() => handlePreviewStaff(person.id)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#EBF3FC] text-[#244A85] dark:bg-[#1E293B] dark:text-[#8BB0E8] border border-[#C8DCF7] dark:border-[#2D4160] text-[10px] font-semibold hover:bg-[#D4E4F7] transition-colors cursor-pointer"
                    title={`Preview ${person.name}'s Shift Portal`}
                  >
                    <Eye className="w-3 h-3" />
                    <span>View Shift</span>
                  </button>
                </div>

                {deleteConfirmId === person.id ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        removePersonnel(person.id);
                        setDeleteConfirmId(null);
                      }}
                      className="px-2 py-1 rounded bg-rose-600 text-white text-[10px] font-bold cursor-pointer"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      className="px-2 py-1 rounded border border-slate-200 text-slate-500 text-[10px] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirmId(person.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                    title="Remove personnel member"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredPersonnel.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-[#171E2B] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-3">
          <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            No personnel found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? `No personnel matching "${searchQuery}". Try adjusting your search query.`
              : 'Add stage managers, audio engineers, referees, or marshals to build your event roster.'}
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#3E6CB5] hover:bg-[#325896] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add First Personnel Member</span>
          </button>
        </div>
      )}

      {/* Modal: Add New Personnel */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#171E2B] rounded-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto border border-slate-200/80 dark:border-slate-800 shadow-xl p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#EBF3FC] dark:bg-[#1E293B] flex items-center justify-center text-[#3E6CB5] dark:text-[#7EA6E0]">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    Add Event Personnel
                  </h3>
                  <p className="text-[11px] text-slate-400">Register new staff to the event roster</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setFormError('');
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer text-lg leading-none"
              >
                &times;
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddPersonnel} className="space-y-3.5 text-xs">
              {/* Registered Account Lookup (Like Adding Friends on Facebook) */}
              <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#244A85] dark:text-[#8BB0E8] text-xs flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5" /> Search Registered Zabay Users
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Connect staff account</span>
                </div>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by name or email (e.g. Rael, Maria, Juan)..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-[#111722] text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#3E6CB5]"
                  />
                </div>

                {isSearchingUsers && (
                  <p className="text-[11px] text-blue-600 dark:text-blue-400 animate-pulse">Searching accounts in database...</p>
                )}

                {matchedUsers.length > 0 && (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pt-1">
                    {matchedUsers.map((u) => (
                      <div
                        key={u.id}
                        onClick={() => {
                          setName(u.name);
                          setEmail(u.email);
                          if (u.phone) setPhone(u.phone);
                          setSelectedUserId(u.id);
                          setUserSearchTerm('');
                          setMatchedUsers([]);
                        }}
                        className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-[#111722] border border-blue-100 dark:border-blue-900/40 hover:border-blue-400 cursor-pointer transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#EBF3FC] text-[#244A85] flex items-center justify-center font-bold text-[10px]">
                            {u.name.slice(0, 1)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200 block text-[11px]">{u.name}</span>
                            <span className="text-[10px] text-slate-400">{u.email}</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-[#3E6CB5] hover:underline">Select</span>
                      </div>
                    ))}
                  </div>
                )}

                {selectedUserId && (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300">
                    <span className="flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Linked to Registered Account
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedUserId(null)}
                      className="text-rose-600 hover:underline text-[10px] font-bold cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                )}

                {!selectedUserId && !userSearchTerm && (
                  <div className="pt-1.5 border-t border-blue-200/50 dark:border-blue-900/40">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1 font-semibold">
                      Suggested registered staff (click to invite):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        ...mockUsers.slice(1),
                        ...(currentUser.email && !mockUsers.some((u) => u.email === currentUser.email)
                          ? [currentUser]
                          : []),
                      ].map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            setName(u.name);
                            setEmail(u.email);
                            if (u.phone) setPhone(u.phone);
                            setSelectedUserId(u.id);
                          }}
                          className="px-2 py-1 rounded-lg bg-white dark:bg-[#111722] hover:bg-blue-100 dark:hover:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-[10px] font-semibold text-[#244A85] dark:text-[#8BB0E8] flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <span>👤 {u.name}</span>
                          <span className="text-[9px] opacity-70">({u.role})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Full Name */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Juan De La Cruz"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFD] dark:bg-[#111722] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#3E6CB5]"
                />
              </div>

              {/* Role Selection & Hourly Rate */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Role / Position <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFD] dark:bg-[#111722] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#3E6CB5]"
                  >
                    {ROLE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Hourly Rate (₱) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                      ₱
                    </span>
                    <input
                      type="number"
                      min={100}
                      max={15000}
                      step={50}
                      required
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(Number(e.target.value))}
                      className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFD] dark:bg-[#111722] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#3E6CB5]"
                    />
                  </div>
                </div>
              </div>

              {/* Call Time & Shift Briefing Note */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Call Time <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 08:00 AM"
                    value={callTime}
                    onChange={(e) => setCallTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFD] dark:bg-[#111722] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#3E6CB5]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Shift Note / Station Briefing
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Lead turnstile gate operator"
                    value={inviteNotes}
                    onChange={(e) => setInviteNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFD] dark:bg-[#111722] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#3E6CB5]"
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Phone <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+63 (917) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFD] dark:bg-[#111722] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#3E6CB5]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="staff@zabay.ph"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFD] dark:bg-[#111722] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#3E6CB5]"
                  />
                </div>
              </div>

              {/* Skills Tags */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Skills & Qualifications (Comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Acoustic Tuning, GrandMA3, FIBA Certified, First Aid"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFD] dark:bg-[#111722] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#3E6CB5]"
                />
              </div>

              {/* Turnstile Ticket Scanner Clearance Option */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-slate-800">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={canScanTickets}
                    onChange={(e) => setCanScanTickets(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-[#3E6CB5] focus:ring-[#3E6CB5]"
                  />
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                      <QrCode className="w-3.5 h-3.5 text-[#3E6CB5]" />
                      Grant Gate Turnstile Scanner Clearance
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Check this for Security and Registration staff. Technical AV, stage hands, and catering crew should leave this unchecked.
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200/80 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setFormError('');
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#3E6CB5] hover:bg-[#325896] text-white font-semibold transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Shift Invitation & Add</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
