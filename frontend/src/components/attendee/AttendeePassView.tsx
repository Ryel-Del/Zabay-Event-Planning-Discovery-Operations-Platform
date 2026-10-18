import React from 'react';
import {
  QrCode,
  Ticket,
  MapPin,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface AttendeePassViewProps {
  onScanPass?: (code: string) => void;
}

export const AttendeePassView: React.FC<AttendeePassViewProps> = ({ onScanPass }) => {
  const { registrations, events, venues } = useApp();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Ticket className="w-5 h-5 text-indigo-400" />
            My Digital QR Event Passes ({registrations.length})
          </h2>
          <p className="text-xs text-slate-400">
            Database-backed biometric / QR passes for rapid contactless gate admission.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {registrations.map((reg) => {
          const event = events.find((e) => e.id === reg.event_id);
          const venue = venues.find((v) => v.id === event?.venue_id);
          const isCheckedIn = reg.status === 'checked_in';

          return (
            <div
              key={reg.id}
              className={`rounded-2xl border overflow-hidden shadow-2xl relative transition-all ${
                isCheckedIn
                  ? 'bg-slate-900/90 border-slate-700/80'
                  : 'bg-gradient-to-b from-slate-900 to-slate-950 border-indigo-500/40 ring-1 ring-indigo-500/20'
              }`}
            >
              {/* Pass Header Banner */}
              <div className="bg-gradient-to-r from-indigo-900/60 via-violet-900/60 to-slate-900 p-4 border-b border-slate-800 flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">
                    Official Event Pass
                  </span>
                  <h3 className="text-sm font-bold text-white leading-tight mt-0.5">
                    {reg.event_title}
                  </h3>
                </div>
                <div
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    isCheckedIn
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : 'bg-cyan-950 text-cyan-300 border-cyan-800'
                  }`}
                >
                  {isCheckedIn ? 'Admitted (Checked In)' : 'Active / Valid'}
                </div>
              </div>

              {/* Pass Body */}
              <div className="p-5 space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Attendee Info */}
                  <div className="space-y-2 text-xs w-full">
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-bold">Attendee</span>
                      <p className="font-bold text-white text-sm">{reg.attendee_name}</p>
                      <p className="text-[11px] text-slate-400">{reg.attendee_email}</p>
                    </div>

                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-bold">Ticket Tier</span>
                      <p className="font-semibold text-indigo-400">{reg.ticket_type}</p>
                    </div>

                    {venue && (
                      <div className="flex items-center gap-1.5 text-slate-400 text-[11px] pt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">{venue.name}</span>
                      </div>
                    )}
                  </div>

                  {/* QR Box */}
                  <div className="bg-white p-3 rounded-xl shadow-lg flex flex-col items-center justify-center shrink-0">
                    {/* Visual QR representation */}
                    <div className="w-24 h-24 bg-slate-950 p-1.5 rounded-lg flex items-center justify-center relative">
                      <QrCode className="w-20 h-20 text-white" />
                    </div>
                    <span className="text-[9px] font-mono font-bold text-slate-800 mt-1">
                      {reg.qr_pass_code}
                    </span>
                  </div>
                </div>

                {/* Perforation Divider */}
                <div className="relative py-2">
                  <div className="border-t-2 border-dashed border-slate-800" />
                  <div className="absolute -left-7 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-950 border border-slate-800" />
                  <div className="absolute -right-7 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-950 border border-slate-800" />
                </div>

                {/* Gate Instructions & Quick Test Scanner trigger */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-500 font-mono">
                    ID: {reg.id} • Registered: {new Date(reg.registered_at).toLocaleDateString()}
                  </span>

                  {onScanPass && (
                    <button
                      onClick={() => onScanPass(reg.qr_pass_code)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-xs font-medium transition-colors"
                    >
                      Test Scan Pass
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
