import React, { useState } from 'react';
import {
  QrCode,
  X,
  AlertTriangle,
  Scan,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface QRCheckInScannerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QRCheckInScanner: React.FC<QRCheckInScannerProps> = ({ isOpen, onClose }) => {
  const { checkInAttendee } = useApp();
  const [passCodeInput, setPassCodeInput] = useState('');
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    isDuplicate?: boolean;
    registration?: any;
  } | null>(null);

  if (!isOpen) return null;

  const handleVerify = (code: string) => {
    const res = checkInAttendee(code);
    setResult(res);
  };

  const sampleCodes = [
    { label: "Sofia Chen (VIP - Valid)", code: 'ZABAY-PASS-9042-SOFIA' },
    { label: "Liam Henderson (Already In - Duplicate Test)", code: 'ZABAY-PASS-3108-LIAM' },
    { label: "Amara Okafor (General - Valid)", code: 'ZABAY-PASS-5821-AMARA' },
    { label: "Fake Pass (Invalid Test)", code: 'ZABAY-PASS-9999-FAKE' },
  ];

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

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
            <QrCode className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              QR Event Pass Gate Scanner
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">
                Duplicate-Proof
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Validates digital QR passes with database-enforced non-duplicate check-in constraints.
            </p>
          </div>
        </div>

        {/* Simulated Camera Viewfinder */}
        <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex flex-col items-center justify-center p-4">
          <div className="w-44 h-44 border-2 border-dashed border-cyan-400/80 rounded-2xl flex flex-col items-center justify-center relative">
            <Scan className="w-12 h-12 text-cyan-400 animate-pulse" />
            <span className="text-[10px] text-cyan-300 font-mono mt-2 uppercase tracking-widest">
              Live Optical Laser
            </span>
            {/* Animated Laser Line */}
            <div className="absolute inset-x-2 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-bounce" />
          </div>
        </div>

        {/* Input Bar */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300">
            Manual Pass Code Entry or Simulated Camera Scan:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={passCodeInput}
              onChange={(e) => setPassCodeInput(e.target.value)}
              placeholder="e.g. ZABAY-PASS-9042-SOFIA"
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
            <button
              onClick={() => handleVerify(passCodeInput)}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-md shadow-cyan-600/30"
            >
              Verify Pass
            </button>
          </div>
        </div>

        {/* Quick Test Preset Buttons */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-400">
            Simulate Quick Test QR Scans:
          </span>
          <div className="grid grid-cols-2 gap-2">
            {sampleCodes.map((item, i) => (
              <button
                key={i}
                onClick={() => {
                  setPassCodeInput(item.code);
                  handleVerify(item.code);
                }}
                className="text-left p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-[11px] text-slate-300 hover:text-white transition-all truncate"
              >
                <div className="font-semibold truncate">{item.label}</div>
                <div className="text-[9px] font-mono text-slate-500 truncate">{item.code}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Result Feedback Banner */}
        {result && (
          <div
            className={`p-4 rounded-xl border text-xs space-y-2 ${
              result.success
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                : result.isDuplicate
                ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-sm">
              {result.success ? (
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : result.isDuplicate ? (
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
              )}
              <span>{result.message}</span>
            </div>

            {result.registration && (
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Attendee:</span>
                  <span className="font-semibold text-white">{result.registration.attendee_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Ticket Tier:</span>
                  <span className="text-indigo-400 font-semibold">{result.registration.ticket_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Pass Serial:</span>
                  <span className="font-mono text-slate-300">{result.registration.qr_pass_code}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
