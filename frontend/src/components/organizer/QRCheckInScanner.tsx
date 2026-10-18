import React, { useState, useEffect } from 'react';
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
  initialCode?: string;
  onClose: () => void;
}

export const QRCheckInScanner: React.FC<QRCheckInScannerProps> = ({ isOpen, initialCode, onClose }) => {
  const { checkInAttendee } = useApp();
  const [passCodeInput, setPassCodeInput] = useState('');
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    isDuplicate?: boolean;
    registration?: any;
  } | null>(null);

  useEffect(() => {
    if (initialCode) {
      setPassCodeInput(initialCode);
      const res = checkInAttendee(initialCode);
      setResult(res);
    } else {
      setPassCodeInput('');
      setResult(null);
    }
  }, [initialCode, isOpen]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#FAF9F5] dark:bg-[#1E1C19] border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-lg p-6 shadow-xl relative space-y-5 transition-colors">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-stone-500 hover:text-stone-900 dark:hover:text-white rounded-lg hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-stone-200/60 dark:bg-stone-800/80 border border-stone-300/60 dark:border-stone-700/60 rounded-xl">
            <QrCode className="w-5 h-5 text-[#5F7D5B] dark:text-[#97B394]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              QR Event Pass Gate Scanner
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-stone-200/80 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-300 dark:border-stone-700 font-mono">
                Duplicate-Proof
              </span>
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Validates digital QR passes with database-enforced non-duplicate check-in constraints.
            </p>
          </div>
        </div>

        {/* Simulated Camera Viewfinder */}
        <div className="relative aspect-video rounded-xl overflow-hidden bg-stone-100 dark:bg-[#141311] border border-stone-200 dark:border-stone-800 flex flex-col items-center justify-center p-4">
          <div className="w-40 h-40 border border-dashed border-[#B68366] dark:border-[#D4A58C] rounded-2xl flex flex-col items-center justify-center relative bg-white/40 dark:bg-black/20">
            <Scan className="w-10 h-10 text-[#B68366] dark:text-[#D4A58C]" />
            <span className="text-[10px] text-stone-600 dark:text-stone-400 font-mono mt-2 uppercase tracking-wider">
              Optical Lens Active
            </span>
          </div>
        </div>

        {/* Input Bar */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
            Pass Serial or Barcode Scan:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={passCodeInput}
              onChange={(e) => setPassCodeInput(e.target.value)}
              placeholder="e.g. ZABAY-PASS-9042-SOFIA"
              className="flex-1 bg-white dark:bg-[#171513] border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-mono text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-[#B68366]"
            />
            <button
              onClick={() => handleVerify(passCodeInput)}
              className="px-4 py-2 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm"
            >
              Verify Pass
            </button>
          </div>
        </div>

        {/* Quick Test Preset Buttons */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">
            Simulate Quick Test Scans:
          </span>
          <div className="grid grid-cols-2 gap-2">
            {sampleCodes.map((item, i) => (
              <button
                key={i}
                onClick={() => {
                  setPassCodeInput(item.code);
                  handleVerify(item.code);
                }}
                className="text-left p-2 rounded-xl bg-white dark:bg-[#171513] border border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 text-[11px] text-stone-700 dark:text-stone-300 transition-all truncate"
              >
                <div className="font-semibold truncate">{item.label}</div>
                <div className="text-[9px] font-mono text-stone-400 dark:text-stone-500 truncate">{item.code}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Result Feedback Banner */}
        {result && (
          <div
            className={`p-4 rounded-xl border text-xs space-y-2 ${
              result.success
                ? 'bg-[#EEF3ED] dark:bg-[#222D21] border-[#5F7D5B]/30 text-[#455C42] dark:text-[#A7C2A4]'
                : result.isDuplicate
                ? 'bg-[#FBF4E8] dark:bg-[#332615] border-[#C28E3A]/30 text-[#7C5517] dark:text-[#E5BE7E]'
                : 'bg-[#F9ECE9] dark:bg-[#341D1A] border-[#BA4E3E]/30 text-[#822E22] dark:text-[#E48D80]'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-sm">
              {result.success ? (
                <ShieldCheck className="w-5 h-5 text-[#5F7D5B] dark:text-[#A7C2A4] shrink-0" />
              ) : result.isDuplicate ? (
                <AlertTriangle className="w-5 h-5 text-[#C28E3A] dark:text-[#E5BE7E] shrink-0" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-[#BA4E3E] dark:text-[#E48D80] shrink-0" />
              )}
              <span>{result.message}</span>
            </div>

            {result.registration && (
              <div className="bg-white dark:bg-[#1E1C19] p-2.5 rounded-lg border border-stone-200 dark:border-stone-800 text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-stone-500">Attendee:</span>
                  <span className="font-semibold text-stone-900 dark:text-stone-100">{result.registration.attendee_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Ticket Tier:</span>
                  <span className="text-[#B68366] dark:text-[#D4A58C] font-semibold">{result.registration.ticket_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Pass Serial:</span>
                  <span className="font-mono text-stone-700 dark:text-stone-300">{result.registration.qr_pass_code}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
