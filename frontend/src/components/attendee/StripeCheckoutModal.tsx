import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { QRCodeCanvas } from 'qrcode.react';
import {
  Ticket,
  X,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Printer,
  Download,
  Check,
} from 'lucide-react';
import type { ZabayEvent, Registration } from '../../types';
import { useApp } from '../../context/AppContext';
import { downloadPassAsImage, printPassSlip } from '../../services/passExportService';

interface StripeCheckoutModalProps {
  event: ZabayEvent;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (reg: Registration) => void;
}

export const StripeCheckoutModal: React.FC<StripeCheckoutModalProps> = ({
  event,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { registerForEvent, currentUser, isDemoMode, venues } = useApp();

  const [ticketTier, setTicketTier] = useState<'General Admission' | 'VIP Access'>('General Admission');
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedReg, setCompletedReg] = useState<Registration | null>(null);
  const [submitError, setSubmitError] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen) return null;

  const price = ticketTier === 'VIP Access' ? Math.round(event.ticket_price * 1.4) : event.ticket_price;

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;
    setSubmitError('');
    setIsProcessing(true);
    try {
      const res = await registerForEvent(event.id, ticketTier, name, email);
      if (!res.success || !res.registration) {
        setSubmitError(res.message);
        return;
      }
      setCompletedReg(res.registration);
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#B68366', '#5F7D5B', '#A36B75', '#FAF9F5'],
      });
      onSuccess(res.registration);
    } catch {
      setSubmitError('Registration could not be saved. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#FAF9F5] dark:bg-[#1E1C19] border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative space-y-5 transition-colors">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-stone-500 hover:text-stone-900 dark:hover:text-white rounded-lg hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!completedReg ? (
          <form data-cy="registration-form" onSubmit={handlePay} className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-stone-200/60 dark:bg-stone-800/80 border border-stone-300/60 dark:border-stone-700/60 rounded-xl">
                <Ticket className="w-6 h-6 text-[#B68366] dark:text-[#D4A58C]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  Event Registration
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-stone-200/80 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-300 dark:border-stone-700 font-mono">
                    {isDemoMode ? 'Sample Pass' : 'PostgreSQL Pass'}
                  </span>
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 truncate max-w-sm">
                  Registration for {event.title}
                </p>
              </div>
            </div>

            {/* Ticket Tier Selection */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTicketTier('General Admission')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  ticketTier === 'General Admission'
                    ? 'bg-white dark:bg-[#25221E] border-[#B68366] dark:border-[#D4A58C] ring-2 ring-[#B68366]/20 shadow-sm'
                    : 'bg-white dark:bg-[#1E1C19] border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 hover:border-stone-300'
                }`}
              >
                <div className="text-xs font-semibold text-stone-900 dark:text-stone-100">General Admission</div>
                <div className="text-sm font-black text-stone-900 dark:text-stone-100 mt-1">₱{event.ticket_price}</div>
                <p className="text-[10px] text-stone-500 mt-0.5">Keynotes & Expo Floor</p>
              </button>

              <button
                type="button"
                onClick={() => setTicketTier('VIP Access')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  ticketTier === 'VIP Access'
                    ? 'bg-white dark:bg-[#25221E] border-[#B68366] dark:border-[#D4A58C] ring-2 ring-[#B68366]/20 shadow-sm'
                    : 'bg-white dark:bg-[#1E1C19] border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 hover:border-stone-300'
                }`}
              >
                <div className="text-xs font-semibold text-stone-900 dark:text-stone-100 flex items-center justify-between">
                  <span>VIP Access</span>
                  <Sparkles className="w-3 h-3 text-[#B68366] dark:text-[#D4A58C]" />
                </div>
                <div className="text-sm font-black text-stone-900 dark:text-stone-100 mt-1">
                  ₱{Math.round(event.ticket_price * 1.4)}
                </div>
                <p className="text-[10px] text-stone-500 mt-0.5">VIP Lounge + Afterparty</p>
              </button>
            </div>

            {/* Contact Details */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  Full Attendee Name
                </label>
                <input
                  data-cy="registration-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white dark:bg-[#171513] border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-[#B68366]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  Ticket Confirmation Email
                </label>
                <input
                  data-cy="registration-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white dark:bg-[#171513] border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-[#B68366]"
                />
              </div>
            </div>

            <p className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#171513] p-3 text-xs text-stone-600 dark:text-stone-300">
              Listed ticket price: ₱{price}. This prototype records registration and issues a pass; it does not collect payment.
            </p>

            {submitError && <p data-cy="registration-error" role="alert" className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs text-rose-800 dark:bg-rose-950/30 dark:text-rose-200">{submitError}</p>}

            {/* Submit button - High contrast & trustworthy */}
            <button
              type="submit"
              data-cy="registration-submit"
              disabled={isProcessing}
              className="w-full py-3 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 rounded-xl text-xs font-semibold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {isProcessing ? (
                <span>Saving registration...</span>
              ) : (
                <>
                  <span>Register & Receive Digital Pass</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* Confirmation & Pass Screen */
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 bg-[#EEF3ED] dark:bg-[#222D21] text-[#5F7D5B] dark:text-[#A7C2A4] rounded-full flex items-center justify-center mx-auto border border-[#5F7D5B]/30">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">{isDemoMode ? 'Sample Pass Created' : 'Registration Saved'}</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                No payment was collected. Your QR pass is ready for check-in.
              </p>
            </div>

            {/* Digital Pass Preview Box */}
            <div className="p-4 bg-white dark:bg-[#171513] border border-stone-200 dark:border-stone-800 rounded-xl space-y-2 text-left">
              <div className="flex justify-center rounded-lg bg-white p-2">
                <QRCodeCanvas
                  data-qr={completedReg.qr_pass_code}
                  value={completedReg.qr_pass_code}
                  size={112}
                  level="M"
                />
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-stone-500">Attendee:</span>
                <span className="font-bold text-stone-900 dark:text-stone-100">{completedReg.attendee_name}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-stone-500">Ticket Tier:</span>
                <span className="text-[#B68366] dark:text-[#D4A58C] font-semibold">{completedReg.ticket_type}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-stone-500">QR Pass Code:</span>
                <span data-cy="registered-pass-code" className="font-mono text-stone-900 dark:text-stone-100 font-bold">{completedReg.qr_pass_code}</span>
              </div>
            </div>

            {/* Quick Export Actions */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                disabled={isDownloading}
                onClick={async () => {
                  setIsDownloading(true);
                  try {
                    const vn = venues.find((v) => v.id === event.venue_id);
                    await downloadPassAsImage({ registration: completedReg, event, venue: vn });
                  } finally {
                    setTimeout(() => setIsDownloading(false), 1000);
                  }
                }}
                className="px-3 py-2 bg-white dark:bg-[#171513] hover:bg-stone-50 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                {isDownloading ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5 text-[#3E6CB5]" />
                    <span>Save Image (PNG)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  const vn = venues.find((v) => v.id === event.venue_id);
                  printPassSlip({ registration: completedReg, event, venue: vn });
                }}
                className="px-3 py-2 bg-white dark:bg-[#171513] hover:bg-stone-50 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5 text-stone-500" />
                <span>Print Ticket Slip</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs"
            >
              Done & View My Passes
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
