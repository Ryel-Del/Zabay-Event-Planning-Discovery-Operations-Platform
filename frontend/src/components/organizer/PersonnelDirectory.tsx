import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Phone,
  Mail,
  DollarSign,
  Briefcase,
  CheckCircle2,
  Eye,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

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
  const { personnel, tasks, selectedEvent, addPersonnel, updatePersonnel, removePersonnel, previewStaffPortal } = useApp();

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
  const [formError, setFormError] = useState('');

  // Filter personnel
  const filteredPersonnel = personnel.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = selectedRoleFilter === 'All' || p.role === selectedRoleFilter;
    return matchesSearch && matchesRole;
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

  // Handle adding personnel
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

    addPersonnel({
      name: name.trim(),
      role: assignedRole as any,
      hourly_rate: Number(hourlyRate),
      phone: phone.trim(),
      email: email.trim(),
      skills: skillsList.length > 0 ? skillsList : ['General Crew Support'],
      is_available: true,
    });

    // Reset Form
    setName('');
    setRole('Stage Manager');
    setCustomRole('');
    setHourlyRate(500);
    setPhone('+63 (917) ');
    setEmail('');
    setSkillsInput('Event Staging, Floor Coordination');
    setFormError('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
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

      {/* Metrics Row */}
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
            <DollarSign className="w-4 h-4 text-[#3E6CB5]" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
            ₱{avgHourlyRate.toLocaleString()}
            <span className="text-xs text-slate-400 font-normal">/hr</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Bohol professional benchmark</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white dark:bg-[#171E2B] p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
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

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
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
                      <span className="inline-block text-[11px] font-semibold text-[#3E6CB5] dark:text-[#7EA6E0]">
                        {person.role}
                      </span>
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
                <div className="flex items-center gap-1.5">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#171E2B] rounded-2xl max-w-lg w-full border border-slate-200/80 dark:border-slate-800 shadow-xl p-6 space-y-4">
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

              {/* Role Selection */}
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
                  className="px-4 py-2 rounded-xl bg-[#3E6CB5] hover:bg-[#325896] text-white font-semibold transition-all cursor-pointer shadow-xs"
                >
                  Register Personnel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
