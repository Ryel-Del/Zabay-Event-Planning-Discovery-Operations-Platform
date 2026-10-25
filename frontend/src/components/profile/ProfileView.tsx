import React, { useState } from 'react';
import {
  X,
  Mail,
  Phone,
  MapPin,
  Building,
  Calendar,
  Ticket,
  Briefcase,
  QrCode,
  DollarSign,
  Lock,
  Globe,
  Edit2,
  Check,
  ExternalLink,
  ChevronRight,
  User,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { ZabayEvent } from '../../types';

interface ProfileViewProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEvent?: (event: ZabayEvent) => void;
  onViewPass?: (passCode: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  isOpen,
  onClose,
  onSelectEvent,
  onViewPass,
}) => {
  const {
    currentUser,
    setCurrentUser,
    currentRole,
    setCurrentRole,
    events,
    setSelectedEvent,
    registrations,
    tasks,
    venues,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'attended' | 'organized' | 'shifts'>('attended');
  const [isEditing, setIsEditing] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState(currentUser.name);
  const [editPhone, setEditPhone] = useState(currentUser.phone || '+63 (917) 000-0000');
  const [editOrg, setEditOrg] = useState(currentUser.organization || 'Tagbilaran Community');
  const [editBio, setEditBio] = useState(
    currentUser.bio || 'Event participant and community member on Zabay.'
  );

  if (!isOpen) return null;

  // 1. Events Attended: registrations for current user
  const attendedRegistrations = currentUser.id === 'usr-guest' ? [] : registrations.filter(
    (r) =>
      r.attendee_id === currentUser.id ||
      (currentUser.email && r.attendee_email.toLowerCase() === currentUser.email.toLowerCase()) ||
      (currentUser.name && r.attendee_name.toLowerCase() === currentUser.name.toLowerCase())
  );

  // 2. Events Organized: events created or led by user
  const organizedEvents = currentUser.id === 'usr-guest' ? [] : events.filter(
    (e) => e.organizer_id === currentUser.id
  );

  // 3. Operational Shifts / Tasks Assigned to this user
  const userTasks = currentUser.id === 'usr-guest' ? [] : tasks.filter((t) =>
    t.personnel_assignments?.some(
      (pa) =>
        pa.personnel_id === currentUser.id ||
        (currentUser.name && pa.personnel_name.toLowerCase() === currentUser.name.toLowerCase())
    )
  );

  // Statistics
  const totalAttendedCount = attendedRegistrations.length;
  const totalOrganizedCount = organizedEvents.length;
  const totalShiftsCount = userTasks.length;
  const totalTicketSpend = attendedRegistrations.reduce((acc, r) => acc + (r.amount_paid || 0), 0);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentUser({
      ...currentUser,
      name: editName.trim(),
      phone: editPhone.trim(),
      organization: editOrg.trim(),
      bio: editBio.trim(),
    });
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-[#171E2B] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Modal Navigation Bar */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#3E6CB5] dark:text-[#7EA6E0]">
              Zabay User Profile
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-xs text-slate-500 capitalize">{currentRole.replace('_', ' ')} Workspace</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1">
          {/* Hero Profile Banner Card */}
          <div className="bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative z-10">
              <div className="flex items-start sm:items-center gap-4">
                <div className="relative">
                  {currentUser.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-2 ring-white dark:ring-slate-700 shadow-md"
                    />
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 ring-2 ring-white dark:ring-slate-700 shadow-md">
                      <User className="w-8 h-8" />
                    </div>
                  )}
                  {currentUser.id !== 'usr-guest' && (
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white dark:border-[#111722] flex items-center justify-center text-[10px] text-white">
                      ✓
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {currentUser.name}
                    </h2>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#EBF3FC] text-[#244A85] dark:bg-[#1E293B] dark:text-[#8BB0E8] border border-[#C8DCF7] dark:border-[#2D4160]">
                      {currentUser.id === 'usr-guest' ? 'Public Visitor' : `Active: ${currentRole.replace('_', ' ')}`}
                    </span>
                    {currentUser.id !== 'usr-guest' && currentUser.roles && currentUser.roles.length > 1 && (
                      <div className="flex items-center gap-1">
                        {currentUser.roles.map((r) => (
                          <span
                            key={r}
                            className={`text-[9px] font-semibold px-2 py-0.5 rounded-md ${
                              r === currentRole
                                ? 'bg-[#3E6CB5] text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {r.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    {currentUser.organization && (
                      <>
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{currentUser.organization}</span>
                        <span>•</span>
                      </>
                    )}
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{currentUser.location || 'Bohol, Philippines'}</span>
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400 pt-0.5">
                    {currentUser.email ? (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" />
                        {currentUser.email}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">
                        Browsing as Guest • Sign in to save registrations & access pass wallet
                      </span>
                    )}
                    {currentUser.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {currentUser.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {currentUser.id !== 'usr-guest' && (
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171E2B] hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Edit2 className="w-3.5 h-3.5 text-[#3E6CB5] dark:text-[#7EA6E0]" />
                  <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
                </button>
              )}
            </div>

            {/* Profile Bio */}
            {!isEditing ? (
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-4 pt-4 border-t border-slate-200/60 dark:border-slate-800 leading-relaxed">
                {currentUser.bio || 'Active participant and event coordinator across Bohol events.'}
              </p>
            ) : (
              <form onSubmit={handleSaveProfile} className="mt-4 pt-4 border-t border-slate-200/60 dark:border-slate-800 space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171E2B] text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Organization / School
                    </label>
                    <input
                      type="text"
                      value={editOrg}
                      onChange={(e) => setEditOrg(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171E2B] text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Contact Phone
                    </label>
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171E2B] text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Bio / Summary
                  </label>
                  <textarea
                    rows={2}
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171E2B] text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-[#3E6CB5] hover:bg-[#325896] text-white font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Basic Statistics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-[#171E2B] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Events Attended</span>
                <Ticket className="w-4 h-4 text-[#3E6CB5]" />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                {totalAttendedCount}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Verified passes claimed</p>
            </div>

            <div className="bg-white dark:bg-[#171E2B] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Events Organized</span>
                <Calendar className="w-4 h-4 text-[#4E8268]" />
              </div>
              <p className="text-2xl font-bold text-[#4E8268] dark:text-[#81B89B] mt-2">
                {totalOrganizedCount}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Bohol event workspaces</p>
            </div>

            <div className="bg-white dark:bg-[#171E2B] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Assigned Shifts</span>
                <Briefcase className="w-4 h-4 text-[#B87A44]" />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                {totalShiftsCount}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Run-of-show duties</p>
            </div>

            <div className="bg-white dark:bg-[#171E2B] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Recorded Payments</span>
                <DollarSign className="w-4 h-4 text-[#3E6CB5]" />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                ₱{totalTicketSpend.toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">No payment is collected by this prototype</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <button
              onClick={() => setActiveTab('attended')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'attended'
                  ? 'bg-[#3E6CB5] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>Events Attended ({attendedRegistrations.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('organized')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'organized'
                  ? 'bg-[#3E6CB5] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Events Organized ({organizedEvents.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('shifts')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'shifts'
                  ? 'bg-[#3E6CB5] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Crew Shifts ({userTasks.length})</span>
            </button>
          </div>

          {/* TAB 1: Events Attended */}
          {activeTab === 'attended' && (
            <div className="space-y-3">
              {attendedRegistrations.length > 0 ? (
                attendedRegistrations.map((reg) => {
                  const event = events.find((e) => e.id === reg.event_id);
                  const venue = event ? venues.find((v) => v.id === event.venue_id) : null;

                  return (
                    <div
                      key={reg.id}
                      className="bg-white dark:bg-[#171E2B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                    >
                      <div className="flex items-start gap-3.5 flex-1 min-w-0">
                        {event?.banner_url ? (
                          <img
                            src={event.banner_url}
                            alt={reg.event_title}
                            className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-800"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-[#EBF3FC] dark:bg-[#1E293B] flex items-center justify-center shrink-0 text-[#3E6CB5]">
                            <Ticket className="w-6 h-6" />
                          </div>
                        )}

                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                              {reg.event_title}
                            </h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              {reg.status === 'confirmed' ? '✓ Registered' : reg.status}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                            {event?.start_date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                {new Date(event.start_date).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </span>
                            )}
                            {venue && (
                              <span className="flex items-center gap-1 truncate">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                {venue.name}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-0.5">
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              {reg.ticket_type}
                            </span>
                            <span>•</span>
                            <span className="font-mono text-[#3E6CB5] font-bold">
                              Pass #{reg.qr_pass_code}
                            </span>
                            <span>•</span>
                            <span>₱{reg.amount_paid.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {onViewPass && (
                          <button
                            onClick={() => {
                              onViewPass(reg.qr_pass_code);
                              onClose();
                            }}
                            className="px-3 py-1.5 rounded-xl bg-[#3E6CB5] hover:bg-[#325896] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>Digital Pass</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 bg-white dark:bg-[#171E2B] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-2">
                  <Ticket className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    No Attended Events Yet
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    You haven't claimed passes to any Bohol events yet. Explore the public feed to discover basketball championships and cultural showcases.
                  </p>
                  <button
                    onClick={() => {
                      setCurrentRole('attendee');
                      onClose();
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#3E6CB5] hover:bg-[#325896] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer mt-2"
                  >
                    <span>Browse Public Feed</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Events Organized */}
          {activeTab === 'organized' && (
            <div className="space-y-3">
              {organizedEvents.length > 0 ? (
                organizedEvents.map((evt) => {
                  const venue = venues.find((v) => v.id === evt.venue_id);
                  const isPrivate = evt.is_private || evt.event_type === 'private';
                  const fillPercent = evt.max_capacity > 0 ? Math.round((evt.tickets_sold / evt.max_capacity) * 100) : 0;

                  return (
                    <div
                      key={evt.id}
                      className="bg-white dark:bg-[#171E2B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                    >
                      <div className="flex items-start gap-3.5 flex-1 min-w-0">
                        {evt.banner_url ? (
                          <img
                            src={evt.banner_url}
                            alt={evt.title}
                            className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-800"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-[#EBF3FC] dark:bg-[#1E293B] flex items-center justify-center shrink-0 text-[#3E6CB5]">
                            <Calendar className="w-6 h-6" />
                          </div>
                        )}

                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                              {evt.title}
                            </h4>
                            {isPrivate ? (
                              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-0.5">
                                <Lock className="w-2.5 h-2.5" /> Private
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-0.5">
                                <Globe className="w-2.5 h-2.5" /> Public
                              </span>
                            )}
                            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {evt.category}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {new Date(evt.start_date).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                            {venue && (
                              <span className="flex items-center gap-1 truncate">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                {venue.name}
                              </span>
                            )}
                          </div>

                          {/* Capacity Bar */}
                          <div className="pt-1 max-w-xs">
                            <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                              <span>Registration Fill</span>
                              <span className="font-bold text-slate-700 dark:text-slate-300">
                                {evt.tickets_sold} / {evt.max_capacity} ({fillPercent}%)
                              </span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                              <div
                                className="h-full bg-[#3E6CB5] rounded-full"
                                style={{ width: `${Math.min(fillPercent, 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          onClick={() => {
                            setSelectedEvent(evt);
                            setCurrentRole('organizer');
                            if (onSelectEvent) onSelectEvent(evt);
                            onClose();
                          }}
                          className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        >
                          <span>Manage Workspace</span>
                          <ExternalLink className="w-3.5 h-3.5 text-[#3E6CB5]" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 bg-white dark:bg-[#171E2B] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-2">
                  <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    No Events Organized Yet
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    You haven't organized an event yet. Switch to Organizer Studio to create and plan your first Bohol event.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Crew Shifts & Tasks */}
          {activeTab === 'shifts' && (
            <div className="space-y-3">
              {userTasks.length > 0 ? (
                userTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-white dark:bg-[#171E2B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                          {task.start_time} - {task.end_time}
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <h4 className="font-bold text-slate-900 dark:text-slate-100">
                          {task.title}
                        </h4>
                        <span
                          className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                            task.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : task.status === 'in_progress'
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">{task.description}</p>
                    </div>

                    <div className="shrink-0 self-end sm:self-center">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                        {(task.track || 'operations').replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-white dark:bg-[#171E2B] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-2">
                  <Briefcase className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    No Operational Shifts Assigned
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    You currently have no tasks assigned in active event run-of-shows. Check the Staff Portal or contact the lead organizer.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
