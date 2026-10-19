import React, { useState } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  Users,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface AttendeeDirectoryDatagridProps {
  onScanPassModal: (code: string) => void;
}

export const AttendeeDirectoryDatagrid: React.FC<AttendeeDirectoryDatagridProps> = ({
  onScanPassModal,
}) => {
  const { registrations, checkInAttendee, loadDemoData } = useApp();
  const [search, setSearch] = useState('');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [feedback, setFeedback] = useState<string | null>(null);

  const filtered = registrations.filter((reg) => {
    const matchesSearch =
      reg.attendee_name.toLowerCase().includes(search.toLowerCase()) ||
      reg.attendee_email.toLowerCase().includes(search.toLowerCase()) ||
      reg.qr_pass_code.toLowerCase().includes(search.toLowerCase());
    const matchesTier = filterTier === 'all' || reg.ticket_type === filterTier;
    return matchesSearch && matchesTier;
  });

  const handleQuickAdmit = (code: string) => {
    const res = checkInAttendee(code);
    setFeedback(res.message);
    setTimeout(() => setFeedback(null), 3500);
  };

  return (
    <div className="bg-white dark:bg-[#1E1C19] border border-stone-200/80 dark:border-stone-800/80 rounded-2xl p-6 shadow-sm space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200/80 dark:border-stone-800/80">
        <div>
          <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#B68366] dark:text-[#D4A58C]" />
            Attendee Registration & Gate Admittance Directory
          </h2>
          <p className="text-xs text-stone-500">
            Database records from `registrations` & `attendance` tables with duplicate-entry prevention.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-stone-500">
            Showing <strong>{filtered.length}</strong> of {registrations.length} registrations
          </span>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-[#EEF3ED] dark:bg-[#222D21] border border-[#5F7D5B]/30 rounded-xl text-xs font-semibold text-[#455C42] dark:text-[#A7C2A4] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#5F7D5B] dark:text-[#A7C2A4] shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter by name, email, or pass serial..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#FAF9F5] dark:bg-[#171513] border border-stone-300 dark:border-stone-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-[#B68366]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <select
            value={filterTier}
            onChange={(e) => setFilterTier(e.target.value)}
            className="bg-[#FAF9F5] dark:bg-[#171513] border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-1.5 text-xs text-stone-700 dark:text-stone-300 focus:outline-none"
          >
            <option value="all">All Ticket Tiers</option>
            <option value="General Admission">General Admission</option>
            <option value="VIP Access">VIP Access</option>
          </select>
        </div>
      </div>

      {/* Cvent-Style Clean High-Density Datagrid */}
      <div className="overflow-x-auto rounded-xl border border-stone-200/80 dark:border-stone-800/80">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#FAF9F5] dark:bg-[#171513] text-stone-500 uppercase font-semibold text-[10px] tracking-wider border-b border-stone-200/80 dark:border-stone-800/80">
            <tr>
              <th className="py-3 px-4">Attendee</th>
              <th className="py-3 px-4">Ticket Tier</th>
              <th className="py-3 px-4">Pass Serial</th>
              <th className="py-3 px-4">Registered Date</th>
              <th className="py-3 px-4">Paid</th>
              <th className="py-3 px-4">Admission Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-stone-800/80 bg-white dark:bg-[#1E1C19]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-stone-500">
                  <Users className="w-8 h-8 text-stone-300 dark:text-stone-600 mx-auto mb-2" />
                  <p className="font-semibold text-xs text-stone-800 dark:text-stone-200">No Registrations in Active Workspace</p>
                  <p className="text-[11px] text-stone-400 mt-1 max-w-sm mx-auto">
                    When attendees purchase or claim passes, their digital QR tickets will populate this ledger for camera check-in.
                  </p>
                  <button
                    onClick={loadDemoData}
                    className="mt-3 px-3 py-1.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-lg text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Load Sample Attendee Records</span>
                  </button>
                </td>
              </tr>
            ) : (
              filtered.map((reg) => {
              const isCheckedIn = reg.status === 'checked_in';

              return (
                <tr
                  key={reg.id}
                  className="hover:bg-stone-50/70 dark:hover:bg-stone-800/40 transition-colors"
                >
                  <td className="py-3 px-4">
                    <p className="font-bold text-stone-900 dark:text-stone-100">{reg.attendee_name}</p>
                    <p className="text-[11px] text-stone-400">{reg.attendee_email}</p>
                  </td>

                  <td className="py-3 px-4 font-semibold text-stone-700 dark:text-stone-300">
                    {reg.ticket_type}
                  </td>

                  <td className="py-3 px-4 font-mono text-[11px] text-stone-600 dark:text-stone-400">
                    {reg.qr_pass_code}
                  </td>

                  <td className="py-3 px-4 text-stone-500">
                    {new Date(reg.registered_at).toLocaleDateString()}
                  </td>

                  <td className="py-3 px-4 font-bold text-stone-900 dark:text-stone-100">
                    ₱{reg.amount_paid}
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isCheckedIn
                          ? 'bg-[#EEF3ED] text-[#455C42] dark:bg-[#222D21] dark:text-[#A7C2A4]'
                          : 'bg-[#FBF4E8] text-[#7C5517] dark:bg-[#332615] dark:text-[#E5BE7E]'
                      }`}
                    >
                      {isCheckedIn ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" /> Checked In
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3" /> Confirmed / Pending
                        </>
                      )}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onScanPassModal(reg.qr_pass_code)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white bg-[#FAF9F5] dark:bg-[#171513] hover:bg-stone-200 dark:hover:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-800 transition-colors"
                      >
                        Inspect
                      </button>

                      {!isCheckedIn && (
                        <button
                          onClick={() => handleQuickAdmit(reg.qr_pass_code)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-white dark:text-stone-900 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white rounded-lg transition-colors cursor-pointer"
                        >
                          Admit
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            }))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
