import React, { useState } from 'react';
import {
  Ticket,
  MapPin,
  AlertTriangle,
  Printer,
  Download,
  QrCode,
  Check,
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { useApp } from '../../context/AppContext';
import { downloadPassAsImage, printPassSlip } from '../../services/passExportService';

interface AttendeePassViewProps {
  onScanPass?: (code: string) => void;
}

export const AttendeePassView: React.FC<AttendeePassViewProps> = ({ onScanPass }) => {
  const { registrations, events, venues, notifications, isDemoMode, currentUser } = useApp();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Filter confirmed passes strictly belonging to the currently active user or remembered browser session
  const userPasses = registrations.filter((reg) => {
    if (!reg) return false;
    if (reg.attendee_id && currentUser.id && reg.attendee_id === currentUser.id && currentUser.id !== 'usr-guest') return true;
    if (reg.attendee_email && currentUser.email && reg.attendee_email.toLowerCase() === currentUser.email.toLowerCase()) return true;
    if (reg.attendee_name && currentUser.name && currentUser.name !== 'Guest' && reg.attendee_name.toLowerCase() === currentUser.name.toLowerCase()) return true;
    const rememberedEmail = typeof window !== 'undefined' ? localStorage.getItem('zabay-last-attendee-email') : null;
    if (rememberedEmail && reg.attendee_email && reg.attendee_email.toLowerCase() === rememberedEmail.toLowerCase()) return true;
    return false;
  });

  const handleDownloadImage = async (reg: any, event: any, venue: any) => {
    setDownloadingId(reg.id);
    try {
      await downloadPassAsImage({ registration: reg, event, venue });
    } finally {
      setTimeout(() => setDownloadingId(null), 1000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200/80 dark:border-stone-800/80">
        <div>
          <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Ticket className="w-5 h-5 text-[#B68366] dark:text-[#D4A58C]" />
            My Digital QR Event Passes ({userPasses.length})
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            {currentUser.id === 'usr-guest'
              ? 'Present your digital QR pass at gate check-in or download for offline access.'
              : `Confirmed passes for ${currentUser.name} (${currentUser.email}). Present your QR pass at gate check-in or download for offline access.`}
          </p>
        </div>

        {userPasses.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const first = userPasses[0];
                const ev = events.find((e) => e.id === first.event_id);
                const vn = venues.find((v) => v.id === ev?.venue_id);
                printPassSlip({ registration: first, event: ev, venue: vn });
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1A1815] hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Print active ticket slip"
            >
              <Printer className="w-3.5 h-3.5 text-[#3E6CB5]" />
              <span>Print Ticket Slip</span>
            </button>
          </div>
        )}
      </div>

      {userPasses.length === 0 ? (
        <div className="bg-white dark:bg-[#1E1C19] border border-stone-200/90 dark:border-stone-800 rounded-2xl p-10 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto">
            <Ticket className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
              {currentUser.id === 'usr-guest' ? 'No Registered Passes Yet' : `No Registered Passes for ${currentUser.name}`}
            </h3>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              {currentUser.id === 'usr-guest'
                ? 'You are currently browsing as a Guest. Register for any upcoming Bohol event on the Discovery feed to receive an instant scannable digital QR pass.'
                : `You are currently viewing as ${currentUser.name} (${currentUser.email}). You can register for any upcoming Bohol event on the Discovery page to receive an instant scannable digital QR pass.`}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {userPasses.map((reg) => {
          const event = events.find((e) => e.id === reg.event_id);
          const venue = venues.find((v) => v.id === event?.venue_id);
          const isCheckedIn = reg.status === 'checked_in';
          const eventNotification = notifications.find(
            (n) => n.eventId === reg.event_id || n.message.toLowerCase().includes(reg.event_title.toLowerCase())
          );

          return (
            <div
              key={reg.id}
              data-cy="digital-pass"
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
                    {isDemoMode ? 'Sample Event Pass' : 'Event Pass'}
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
                  {isCheckedIn ? 'Admitted (Checked In)' : reg.status === 'cancelled' ? 'Cancelled' : 'Active / Valid'}
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
                      <QRCodeCanvas
                        data-qr={reg.qr_pass_code}
                        value={reg.qr_pass_code}
                        size={88}
                        level="M"
                        includeMargin={false}
                      />
                    </div>
                    <span data-cy="digital-pass-code" className="text-[9px] font-mono font-bold text-slate-800 mt-1">
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

                {/* Pass Actions: Print, Save Image, Open Scanner */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
                  <div className="text-[10px] text-stone-400 font-mono">
                    Pass Serial: <span className="font-bold text-stone-600 dark:text-stone-300">{reg.id}</span> • Registered: {new Date(reg.registered_at).toLocaleDateString()}
                  </div>

                  <div className="flex items-center gap-1.5 w-full sm:w-auto">
                    {/* Save as PNG Button */}
                    <button
                      type="button"
                      disabled={downloadingId === reg.id}
                      onClick={() => handleDownloadImage(reg, event, venue)}
                      className="flex-1 sm:flex-initial px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1A1815] hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      title="Download Pass Card as PNG Image"
                    >
                      {downloadingId === reg.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                          <span>Saved!</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5 text-[#3E6CB5]" />
                          <span>Save PNG</span>
                        </>
                      )}
                    </button>

                    {/* Print Pass Button */}
                    <button
                      type="button"
                      onClick={() => printPassSlip({ registration: reg, event, venue })}
                      className="flex-1 sm:flex-initial px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1A1815] hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      title="Print Official Ticket Slip"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-500" />
                      <span>Print</span>
                    </button>

                    {/* Open Scanner Shortcut */}
                    {onScanPass && (
                      <button
                        type="button"
                        onClick={() => onScanPass(reg.qr_pass_code)}
                        data-cy="open-pass-scanner"
                        className="px-2.5 py-1.5 bg-[#3E6CB5] hover:bg-[#325896] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-xs"
                        title="Simulate scanning this pass at turnstile"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Scan</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
};
