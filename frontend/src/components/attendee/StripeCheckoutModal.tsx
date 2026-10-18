import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  CreditCard,
  Lock,
  X,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import type { ZabayEvent, Registration } from '../../types';
import { useApp } from '../../context/AppContext';

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
  const { registerForEvent, currentUser } = useApp();

  const [ticketTier, setTicketTier] = useState<'General Admission' | 'VIP Access'>('General Admission');
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [expiry, setExpiry] = useState('12/28');
  const [cvc, setCvc] = useState('921');
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedReg, setCompletedReg] = useState<Registration | null>(null);

  if (!isOpen) return null;

  const price = ticketTier === 'VIP Access' ? Math.round(event.ticket_price * 1.4) : event.ticket_price;

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulate Stripe payment intent & webhook round-trip
    setTimeout(() => {
      setIsProcessing(false);
      const res = registerForEvent(event.id, ticketTier, name, email);
      setCompletedReg(res.registration);

      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      onSuccess(res.registration);
    }, 1400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!completedReg ? (
          <form onSubmit={handlePay} className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                <CreditCard className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Stripe Checkout
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-800 font-mono">
                    256-Bit SSL
                  </span>
                </h3>
                <p className="text-xs text-slate-400 truncate max-w-sm">
                  Registration for {event.title}
                </p>
              </div>
            </div>

            {/* Ticket Tier Selection */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTicketTier('General Admission')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  ticketTier === 'General Admission'
                    ? 'bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/20 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="text-xs font-bold">General Admission</div>
                <div className="text-sm font-black text-indigo-400 mt-1">${event.ticket_price}</div>
                <p className="text-[10px] text-slate-500 mt-0.5">Keynotes & Expo Floor</p>
              </button>

              <button
                type="button"
                onClick={() => setTicketTier('VIP Access')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  ticketTier === 'VIP Access'
                    ? 'bg-violet-950/60 border-violet-500 ring-2 ring-violet-500/20 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="text-xs font-bold flex items-center justify-between">
                  <span>VIP Access</span>
                  <Sparkles className="w-3 h-3 text-amber-400" />
                </div>
                <div className="text-sm font-black text-violet-400 mt-1">
                  ${Math.round(event.ticket_price * 1.4)}
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">VIP Lounge + Afterparty</p>
              </button>
            </div>

            {/* Contact Details */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Full Attendee Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Ticket Confirmation Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Payment Fields */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1 font-semibold text-slate-300">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" /> Encrypted Card Payment
                </span>
                <span className="text-[11px] font-mono text-slate-500">Stripe Webhook Verified</span>
              </div>

              <div>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none"
                  placeholder="Card number"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none"
                  placeholder="MM/YY"
                />
                <input
                  type="text"
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none"
                  placeholder="CVC"
                />
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {isProcessing ? (
                <span>Confirming via Stripe Webhook...</span>
              ) : (
                <>
                  <span>Pay ${price} & Generate QR Pass</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* Confirmation & Pass Screen */
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">Payment & Registration Succeeded!</h3>
              <p className="text-xs text-slate-400 mt-1">
                Stripe webhook recorded transaction <code className="text-indigo-400">{completedReg.payment_id}</code>
              </p>
            </div>

            {/* Digital Pass Preview Box */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-left">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Attendee:</span>
                <span className="font-bold text-white">{completedReg.attendee_name}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Ticket Tier:</span>
                <span className="text-indigo-400 font-bold">{completedReg.ticket_type}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">QR Pass Code:</span>
                <span className="font-mono text-cyan-300 font-bold">{completedReg.qr_pass_code}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              Close & View My Passes
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
