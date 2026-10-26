import React, { useEffect, useMemo, useState } from 'react';
import { Search, CheckCircle2, Clock, Users, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { admitLivePass } from '../../services/eventRosterApi';
import { useEventRoster } from '../../hooks/useEventRoster';

interface AttendeeDirectoryDatagridProps {
  onScanPassModal: (code: string) => void;
}

export const AttendeeDirectoryDatagrid: React.FC<AttendeeDirectoryDatagridProps> = ({ onScanPassModal }) => {
  const { registrations, checkInAttendee, selectedEvent, isDemoMode, isLiveBackend } = useApp();
  const live = !isDemoMode && isLiveBackend;
  const roster = useEventRoster(selectedEvent?.id, live);
  const [search, setSearch] = useState('');
  const [filterTier, setFilterTier] = useState('all');
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [busyCode, setBusyCode] = useState<string | null>(null);

  useEffect(() => { setFeedback(null); setSearch(''); }, [selectedEvent?.id]);

  const eventRegistrations = useMemo(() => {
    if (!selectedEvent) return [];
    if (live) return roster.page?.data || [];
    return isDemoMode ? registrations.filter(reg => reg.event_id === selectedEvent.id) : [];
  }, [selectedEvent, live, roster.page, registrations, isDemoMode]);

  const filtered = eventRegistrations.filter(reg => {
    const term = search.trim().toLowerCase();
    const searchable = [reg.attendee_name, reg.attendee_email, reg.qr_pass_code].join(' ').toLowerCase();
    return searchable.includes(term) && (filterTier === 'all' || reg.ticket_type === filterTier);
  });

  const handleQuickAdmit = async (code: string) => {
    if (!selectedEvent || busyCode) return;
    const eventId = selectedEvent.id;
    setBusyCode(code);
    setFeedback(null);
    try {
      const reply = live
        ? await admitLivePass(code, eventId)
        : isDemoMode
          ? await checkInAttendee(code, eventId)
          : { success: false, message: 'Live backend unavailable. No admission was recorded.' };
      setFeedback({ success: reply.success, message: reply.message });
    } catch {
      setFeedback({ success: false, message: 'Admission could not be verified. Please retry.' });
    } finally {
      setBusyCode(null);
    }
  };

  const total = live ? (roster.page?.pagination.total ?? 0) : eventRegistrations.length;
  const canPageBack = live && roster.offset > 0;
  const canPageForward = live && roster.offset + 50 < total;

  return (
    <div data-cy="organizer-roster" className="bg-white dark:bg-[#1E1C19] border border-stone-200/80 dark:border-stone-800/80 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 dark:border-stone-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Users className="w-4 h-4" /> Event Attendee Directory
          </h2>
          <p className="text-xs text-stone-500">
            {isDemoMode ? 'Browser-local demonstration records (not PostgreSQL).' : 'Authorized event registrations from PostgreSQL; no payment collection.'}
          </p>
        </div>
        <span className="text-xs text-stone-500">Showing {filtered.length} of {total} registrations</span>
      </div>

      {feedback && <div role="status" className={feedback.success ? 'text-sm text-green-700' : 'text-sm text-red-700'}>{feedback.message}</div>}
      {selectedEvent && live && roster.loading && <p role="status" className="text-sm text-stone-500">Loading this event's registrations...</p>}
      {selectedEvent && live && roster.error && (
        <div role="alert" data-cy="roster-error" className="text-sm text-rose-700">
          {roster.error} <button type="button" className="underline" onClick={roster.retry}>Retry roster</button>
        </div>
      )}
      {selectedEvent && !live && !isDemoMode && (
        <p role="alert" className="text-sm text-amber-700">The live registration directory is unavailable. No attendee roster is confirmed.</p>
      )}
      {live && roster.page?.summary.integrity_warning_count ? (
        <div role="alert" className="text-xs text-amber-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {roster.page.summary.integrity_warning_count} historical admission record(s) need investigation. No records were automatically changed.
        </div>
      ) : null}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="search" aria-label="Filter loaded registrations" placeholder="Filter loaded page by name, email, or pass..."
            value={search} onChange={event => setSearch(event.target.value)}
            className="w-full bg-stone-50 dark:bg-[#171513] border border-stone-300 dark:border-stone-700 rounded-lg pl-9 pr-3 py-2 text-xs" />
        </div>
        <select aria-label="Ticket tier" value={filterTier} onChange={event => setFilterTier(event.target.value)}
          className="bg-stone-50 dark:bg-[#171513] border border-stone-300 dark:border-stone-700 rounded-lg px-3 py-2 text-xs">
          <option value="all">All Ticket Tiers</option>
          <option value="General Admission">General Admission</option>
          <option value="VIP Access">VIP Access</option>
        </select>
      </div>
      {live && <p className="text-xs text-stone-500">Filters apply to the current 50-record page only.</p>}

      <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-stone-50 dark:bg-[#171513] uppercase text-stone-500 text-[10px]">
            <tr>
              <th className="p-3">Attendee</th><th className="p-3">Ticket Tier</th>
              <th className="p-3">Pass Code</th><th className="p-3">Registered</th>
              <th className="p-3">Admission</th><th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
            {filtered.map(reg => (
              <tr data-cy="roster-row" key={reg.id}>
                <td className="p-3"><div className="font-semibold">{reg.attendee_name}</div><div className="text-stone-500">{reg.attendee_email}</div></td>
                <td className="p-3">{reg.ticket_type}</td>
                <td className="p-3 font-mono break-all">{reg.qr_pass_code}</td>
                <td className="p-3">{new Date(reg.registered_at).toLocaleDateString()}</td>
                <td className="p-3">
                  <span className="flex items-center gap-1">
                    {reg.status === 'checked_in' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    {reg.status === 'checked_in' ? 'Checked in' : reg.status === 'cancelled' ? 'Cancelled' : 'Confirmed'}
                  </span>
                  {'integrity_warning' in reg && reg.integrity_warning && (
                    <span className="text-amber-700 block">Admission record mismatch</span>
                  )}
                </td>
                <td className="p-3 text-right whitespace-nowrap">
                  <button className="underline mr-3" onClick={() => onScanPassModal(reg.qr_pass_code)}>Inspect</button>
                  {reg.status === 'confirmed' && (
                    <button data-cy="roster-admit" disabled={Boolean(busyCode)} onClick={() => void handleQuickAdmit(reg.qr_pass_code)}
                      className="bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded px-3 py-1 disabled:opacity-50">
                      {busyCode === reg.qr_pass_code ? 'Verifying...' : 'Admit'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!filtered.length && !roster.loading && !roster.error && (live ? Boolean(roster.page) : isDemoMode) && (
              <tr data-cy="roster-empty"><td colSpan={6} className="p-10 text-center text-stone-500">
                {total === 0 ? 'No registrations for this event.' : 'No registrations on this page match the filters.'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
      {live && roster.page && (
        <div className="flex justify-end items-center gap-3 text-xs">
          <span>{total === 0 ? '0' : roster.offset + 1}–{Math.min(roster.offset + 50, total)} of {total}</span>
          <button type="button" disabled={!canPageBack || roster.loading} onClick={() => roster.setOffset(Math.max(0, roster.offset - 50))} className="underline disabled:opacity-40">Previous</button>
          <button type="button" disabled={!canPageForward || roster.loading} onClick={() => roster.setOffset(roster.offset + 50)} className="underline disabled:opacity-40">Next</button>
          <button type="button" onClick={roster.retry} className="underline">Refresh</button>
        </div>
      )}
    </div>
  );
};
