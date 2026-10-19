import React, { useState } from 'react';
import {
  Users,
  Clock,
  MapPin,
  ShieldAlert,
  Lock,
  Phone,
  Mail,
  CheckCircle2,
  Briefcase,
  GitBranch,
  Wrench,
  Search,
  Layers,
  Radio,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const PersonnelPortal: React.FC = () => {
  const { personnel, tasks, selectedEvent, venues } = useApp();

  // Selected personnel member viewing the portal (defaults to Carlos Ruiz or first personnel)
  const defaultPersonnel = personnel.find((p) => p.name.includes('Carlos')) || personnel[0];
  const [selectedPersonnelId, setSelectedPersonnelId] = useState<string>(
    defaultPersonnel ? defaultPersonnel.id : 'all'
  );
  const [activeTab, setActiveTab] = useState<'my_tasks' | 'run_of_show' | 'venue_contacts'>('my_tasks');
  const [searchRunOfShow, setSearchRunOfShow] = useState('');

  const currentPerson = personnel.find((p) => p.id === selectedPersonnelId);

  // Active venue details
  const activeVenue = venues.find(
    (v) =>
      v.id === selectedEvent?.venue_id ||
      v.name.toLowerCase().includes('wisdom') ||
      v.id === 'ven-3'
  ) || venues[0];

  // Tasks assigned to this specific personnel member
  const myTasks = tasks.filter((t) =>
    selectedPersonnelId === 'all'
      ? true
      : t.personnel_assignments?.some((pa) => pa.personnel_id === selectedPersonnelId)
  );

  // Calculate shift statistics
  const totalMyTasks = myTasks.length;
  const completedMyTasks = myTasks.filter((t) => t.status === 'completed').length;
  const inProgressMyTasks = myTasks.filter((t) => t.status === 'in_progress').length;

  // Approximate shift hours based on earliest task start and latest task end
  const shiftTimes = myTasks
    .filter((t) => t.start_time && t.end_time)
    .map((t) => ({ start: t.start_time, end: t.end_time }));

  const earliestStart = shiftTimes.length > 0 ? shiftTimes[0].start : '08:00';
  const latestEnd = shiftTimes.length > 0 ? shiftTimes[shiftTimes.length - 1].end : '17:00';

  // Filter full run-of-show
  const filteredAllTasks = tasks.filter(
    (t) =>
      t.title.toLowerCase().includes(searchRunOfShow.toLowerCase()) ||
      (t.track ? t.track.toLowerCase().includes(searchRunOfShow.toLowerCase()) : false) ||
      t.description.toLowerCase().includes(searchRunOfShow.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* 1. Explicit View-Only Banner Guard */}
      <div className="bg-[#FAF7EE] dark:bg-[#252219] border border-[#ECD9A8] dark:border-[#5A4B27] p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#E8BA48]/20 text-[#8C6212] dark:text-[#E8BD68] flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8C6212] dark:text-[#E8BD68]">
                Read-Only Event Staff View
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white dark:bg-[#1A1813] text-[#8C6212] dark:text-[#E8BD68] font-mono border border-[#ECD9A8] dark:border-[#5A4B27]">
                View Only • Edits Locked
              </span>
            </div>
            <p className="text-xs text-stone-700 dark:text-stone-300 mt-0.5">
              You are viewing the event run-of-show and assigned duties. Task adjustments and ripple modifications are managed by Event Organizers.
            </p>
          </div>
        </div>

        {/* Staff Persona Selector */}
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <span className="text-xs font-medium text-stone-600 dark:text-stone-400">Viewing as:</span>
          <select
            value={selectedPersonnelId}
            onChange={(e) => setSelectedPersonnelId(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#171E2B] text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#3E6CB5] cursor-pointer shadow-xs"
          >
            <option value="all">👥 All Event Crew (Master View)</option>
            {personnel.map((p) => (
              <option key={p.id} value={p.id}>
                👤 {p.name} ({p.role})
              </option>
            ))}
          </select>
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
                  Compensation Rate
                </span>
                <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  ₱{currentPerson.hourly_rate.toLocaleString()}/hr
                </p>
              </div>
              <div className="w-px h-7 bg-slate-200 dark:bg-slate-700" />
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                  Duty Status
                </span>
                <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  {currentPerson.is_available ? 'Active on Shift' : 'On Standby'}
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
              <p className="text-[10px] text-slate-400 mt-0.5">Today's Operating Call Time</p>
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
                <MapPin className="w-3 h-3 text-[#3E6CB5]" /> Venue Post
              </span>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 truncate">
                {activeVenue.name}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5 truncate">{activeVenue.city}, Bohol</p>
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
          <span>My Assigned Tasks ({myTasks.length})</span>
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

      {/* TAB 1: My Assigned Tasks */}
      {activeTab === 'my_tasks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Chronological Duties & Action Items</span>
              <span className="text-[10px] text-slate-400 font-normal">
                (Finish-to-Start Dependencies Enforced)
              </span>
            </h3>
            <span className="text-xs text-slate-400">
              {myTasks.length} {myTasks.length === 1 ? 'task' : 'tasks'} allocated
            </span>
          </div>

          <div className="space-y-3">
            {myTasks.map((task, idx) => {
              // Find upstream dependency tasks to show what must complete first
              const upstreamDependencies = tasks.filter((t) => task.dependencies?.includes(t.id));

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
                        <p className="text-[10px] text-slate-400">Scheduled Time</p>
                      </div>

                      <div className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-500 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        <span>Read-Only</span>
                      </div>
                    </div>
                  </div>

                  {/* Upstream Dependencies (What must finish before this task starts) */}
                  {upstreamDependencies.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200/60 dark:border-slate-800 text-xs flex items-center gap-2">
                      <GitBranch className="w-3.5 h-3.5 text-[#B87A44] shrink-0" />
                      <span className="text-slate-500 font-semibold text-[11px]">
                        Prerequisite Task:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {upstreamDependencies.map((dep) => (
                          <span
                            key={dep.id}
                            className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white dark:bg-[#171E2B] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                          >
                            {dep.title} ({dep.status.replace('_', ' ')})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Allocated Resources */}
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
              <div className="text-center py-12 bg-white dark:bg-[#171E2B] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  No Active Shift Tasks Assigned
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  This crew member currently has zero tasks assigned for this event. Check with the lead organizer or select another staff member above.
                </p>
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
                Full chronological visibility of all departments (AV, Staging, Operations, Registration)
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

      {/* TAB 3: Venue & Emergency Dispatch */}
      {activeTab === 'venue_contacts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Venue Info */}
          <div className="bg-white dark:bg-[#171E2B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <MapPin className="w-4 h-4 text-[#3E6CB5]" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Venue Location & Access Details
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
                    Bohol Emergency Hotline
                  </p>
                  <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-0.5">
                    Dial <strong>911</strong> or Bohol PDRRMO: <strong>+63 (38) 411-2000</strong>
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200/60 dark:border-slate-800">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100">Lead Event Organizer</p>
                    <p className="text-[10px] text-slate-400">Marcus Vance • Zabay Operations</p>
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
                    <p className="text-[10px] text-slate-400">Aisha Robinson • First Aid Post</p>
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
                    <p className="text-[10px] text-slate-400">Darius Thorne • Audio Console Desk</p>
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
    </div>
  );
};
