import React from 'react';
import {
  Ticket,
  MapPin,
  AlertTriangle,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useApp } from '../../context/AppContext';

interface AttendeePassViewProps {
  onScanPass?: (code: string) => void;
}

export const AttendeePassView: React.FC<AttendeePassViewProps> = ({ onScanPass }) => {
  const { registrations, events, venues, notifications } = useApp();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200/80 dark:border-stone-800/80">
        <div>
          <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Ticket className="w-5 h-5 text-[#B68366] dark:text-[#D4A58C]" />
            My Digital QR Event Passes ({registrations.length})
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Database-backed digital admission passes for rapid contactless gate verification.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {registrations.map((reg) => {
          const event = events.find((e) => e.id === reg.event_id);
          const venue = venues.find((v) => v.id === event?.venue_id);
          const isCheckedIn = reg.status === 'checked_in';
          const eventNotification = notifications.find(
            (n) => n.eventId === reg.event_id || n.message.toLowerCase().includes(reg.event_title.toLowerCase())
          );

          return (
            <div
              key={reg.id}
              className={`rounded-2xl border overflow-hidden shadow-sm transition-all ${
                isCheckedIn
                  ? 'bg-stone-100 dark:bg-[#1A1815] border-stone-300/80 dark:border-stone-800'
                  : 'bg-white dark:bg-[#1E1C19] border-stone-200/90 dark:border-stone-800'
              }`}
            >
              {/* Real-Time Event Change Banner */}
              {eventNotification && (
                <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between gap-2 text-xs font-semibold animate-in slide-in-from-top-1">
                  <div className="flex items-center gap-2 truncate">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 animate-bounce" />
                    <span className="truncate">Notice: {eventNotification.message}</span>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-black/20 shrink-0">Updated</span>
                </div>
              )}

              {/* Pass Header Banner */}
              <div className="bg-[#FAF9F5] dark:bg-[#171513] p-4 border-b border-stone-200/80 dark:border-stone-800/80 flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                    Official Event Pass
                  </span>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 leading-tight mt-0.5">
                    {reg.event_title}
                  </h3>
                </div>
                <div
                  className={`px-2.5 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border ${
                    isCheckedIn
                      ? 'bg-[#EEF3ED] dark:bg-[#222D21] text-[#455C42] dark:text-[#A7C2A4] border-[#5F7D5B]/30'
                      : 'bg-[#F6EFE9] dark:bg-[#2B231D] text-[#885B43] dark:text-[#DEC0B0] border-[#B88568]/30'
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
                      <span className="text-stone-400 text-[10px] uppercase font-bold">Attendee</span>
                      <p className="font-bold text-stone-900 dark:text-stone-100 text-sm">{reg.attendee_name}</p>
                      <p className="text-[11px] text-stone-500">{reg.attendee_email}</p>
                    </div>

                    <div>
                      <span className="text-stone-400 text-[10px] uppercase font-bold">Ticket Tier</span>
                      <p className="font-semibold text-[#885B43] dark:text-[#D5A78E]">{reg.ticket_type}</p>
                    </div>

                    {venue && (
                      <div className="flex items-center gap-1.5 text-stone-500 text-[11px] pt-1">
                        <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span className="truncate">{venue.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Real Scannable QR Code */}
                  <div className="bg-white p-2.5 rounded-xl shadow-xs border border-slate-200 flex flex-col items-center justify-center shrink-0">
                    <div className="bg-white p-1 rounded-lg">
                      <QRCodeSVG
                        value={reg.qr_pass_code}
                        size={88}
                        level="M"
                        includeMargin={false}
                      />
                    </div>
                    <span className="text-[9px] font-mono font-bold text-slate-800 mt-1">
                      {reg.qr_pass_code}
                    </span>
                  </div>
                </div>

                {/* Perforation Divider */}
                <div className="relative py-2">
                  <div className="border-t border-dashed border-slate-300 dark:border-slate-800" />
                  <div className="absolute -left-7 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#F8FAFD] dark:bg-[#0E131C] border border-slate-200 dark:border-slate-800" />
                  <div className="absolute -right-7 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#F8FAFD] dark:bg-[#0E131C] border border-slate-200 dark:border-slate-800" />
                </div>

                {/* Gate Instructions & Quick Test Scanner trigger */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-stone-400 font-mono">
                    Pass Serial: {reg.id} • Registered: {new Date(reg.registered_at).toLocaleDateString()}
                  </span>

                  {onScanPass && (
                    <button
                      onClick={() => onScanPass(reg.qr_pass_code)}
                      className="px-2.5 py-1 bg-stone-200/70 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-lg text-xs font-medium transition-colors"
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
