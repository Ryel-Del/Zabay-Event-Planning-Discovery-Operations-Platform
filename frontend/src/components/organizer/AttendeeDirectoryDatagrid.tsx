import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock, Search, Users, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useEventRoster } from '../../services/useEventRoster';

interface Props { onScanPassModal: (code: string) => void }

export const AttendeeDirectoryDatagrid: React.FC<Props> = ({ onScanPassModal }) => {
  const { registrations, checkInAttendee, selectedEvent, isDemoMode, isLiveBackend } = useApp();
  const eventId = selectedEvent?.id;
  const roster = useEventRoster(eventId, isDemoMode, isLiveBackend, registrations);
  const [search, setSearch] = useState('');
  const [tier, setTier] = useState('all');
  const [pending, setPending] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => { setSearch(''); setTier('all'); setFeedback(null); }, [eventId]);
  const rows = roster.data?.registrations || [];
  const filtered = rows.filter(row =>
    (tier === 'all' || row.ticket_type === tier) &&
    [row.attendee_name, row.attendee_email, row.qr_pass_code]
      .some(value => value.toLowerCase().includes(search.trim().toLowerCase()))
  );

  const admit = async (code: string) => {
    if (!eventId || pending) return;
    setPending(code);
    setFeedback(null);
    try {
      const result = await checkInAttendee(code, eventId);
      const confirmed = result.success && result.registration?.status === 'checked_in' &&
        result.registration.event_id === eventId;
      if (confirmed) {
        roster.refresh();
        window.dispatchEvent(new CustomEvent('zabay:admission-confirmed', { detail: { eventId } }));
      }
      setFeedback({
        success: Boolean(confirmed),
        message: confirmed ? result.message : result.success ? 'Admission was not confirmed. Please retry.' : result.message,
      });
    } catch {
      setFeedback({ success: false, message: 'Network error. Admission was not confirmed.' });
    } finally {
      setPending(null);
    }
  };

  return (
    <section className="bg-white dark:bg-[#1E1C19] border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 dark:border-stone-800 pb-4">
        <div>
          <h2 className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Users className="w-4 h-4" /> Event Attendee & Gate Directory
          </h2>
          <p className="text-xs text-stone-500">
            {roster.isDemo ? 'Browser-local demonstration roster' : 'Authorized PostgreSQL event roster'}
          </p>
        </div>
        <span className="text-xs text-stone-500" aria-live="polite">
          {roster.data ? `Page ${roster.page} · ${roster.data.total} total registrations` : 'Not loaded'}
        </span>
      </div>

      {feedback && <p role="status" className={`text-sm rounded-lg p-3 ${feedback.success ? 'bg-emerald-50 text-emerald-900' : 'bg-rose-50 text-rose-900'}`}>
        {feedback.message}
      </p>}
      {roster.loading && <p role="status" className="text-sm text-stone-500">Loading event roster…</p>}
      {roster.error && <div role="alert" className="rounded-lg p-3 bg-rose-50 text-rose-900 text-sm">
        {roster.error} <button className="underline font-semibold" onClick={roster.refresh}>Retry</button>
      </div>}
      {roster.data && roster.data.summary.integrity_issues > 0 &&
        <p role="alert" className="text-amber-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {roster.data.summary.integrity_issues} admission status/attendance record inconsistency detected. Review manually; no records were changed.
        </p>}
      {roster.data && <>
        <div className="flex flex-wrap gap-3">
          <label className="relative flex-1 min-w-48">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-500" />
            <input aria-label="Search registrations on current page" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search current page" className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 dark:border-stone-700 rounded-xl bg-transparent" />
          </label>
          <select aria-label="Filter ticket tier" value={tier} onChange={e => setTier(e.target.value)}
            className="rounded-xl border border-stone-300 dark:border-stone-700 bg-transparent text-xs px-3">
            <option value="all">All ticket tiers</option>
            <option value="General Admission">General Admission</option>
            <option value="VIP Access">VIP Access</option>
          </select>
          <button onClick={roster.refresh} className="border rounded-xl px-3 py-2 text-xs">Refresh roster</button>
        </div>
        <div className="overflow-x-auto border border-stone-200 dark:border-stone-800 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 dark:bg-stone-900 text-stone-500">
              <tr><th className="p-3">Attendee</th><th className="p-3">Tier</th><th className="p-3">Pass code</th>
                <th className="p-3">Registered</th><th className="p-3">Admission</th><th className="p-3">Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map(row => {
                const inconsistency = (row.status === 'checked_in') !== row.attendance_recorded;
                return <tr key={row.id} className="border-t border-stone-100 dark:border-stone-800">
                  <td className="p-3"><strong>{row.attendee_name}</strong><div className="text-stone-500">{row.attendee_email}</div></td>
                  <td className="p-3">{row.ticket_type}</td>
                  <td className="p-3 font-mono break-all">{row.qr_pass_code}</td>
                  <td className="p-3">{new Date(row.registered_at).toLocaleDateString()}</td>
                  <td className="p-3">
                    {inconsistency ? <span className="text-amber-700">Review mismatch</span> :
                      row.status === 'checked_in' ? <span className="text-green-700 inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Checked in</span> :
                      <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {row.status}</span>}
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <button onClick={() => onScanPassModal(row.qr_pass_code)} className="underline mr-3">Inspect</button>
                    {row.status === 'confirmed' && !inconsistency &&
                      <button disabled={Boolean(pending)} onClick={() => admit(row.qr_pass_code)}
                        className="rounded-lg bg-stone-900 text-white px-3 py-1 disabled:opacity-50">
                        {pending === row.qr_pass_code ? 'Checking…' : 'Admit'}
                      </button>}
                  </td>
                </tr>;
              })}
              {filtered.length === 0 &&
                <tr><td colSpan={6} className="p-8 text-center text-stone-500">
                  {roster.data.total === 0 ? 'No registrations for this event yet.' : 'No registrations match these filters on this page.'}
                </td></tr>}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between items-center text-xs text-stone-500">
          <span>Showing {filtered.length} on this page · {roster.data.summary.registered} active registrations</span>
          <div className="flex gap-2">
            <button disabled={roster.page <= 1} onClick={() => roster.setPage(n => Math.max(1, n - 1))}
              className="border px-3 py-1 rounded disabled:opacity-40">Previous</button>
            <button disabled={!roster.data.has_next} onClick={() => roster.setPage(n => n + 1)}
              className="border px-3 py-1 rounded disabled:opacity-40">Next</button>
          </div>
        </div>
      </>}
    </section>
  );
};
