import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal,
  KeyRound,
  Sparkles,
  Database,
  QrCode,
  Users,
  Copy,
  Check,
  Lock,
  Unlock,
  AlertTriangle,
  RotateCcw,
  X,
  Building2,
  Calendar,
  Layers,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface DevCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenScannerWithCode?: (code: string) => void;
}

const DEMO_PERSONAS = [
  {
    id: 'usr-org-1',
    name: 'Mark Bautista',
    email: 'mark.bautista@zabay.ph',
    role: 'organizer' as const,
    roles: ['organizer', 'venue_manager', 'staff', 'attendee'],
    title: 'Event Organizer',
    org: 'Tagbilaran Youth & Sports Council',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    desc: 'Planner studio, schedule, conflict detection',
  },
  {
    id: 'usr-vm-1',
    name: 'Maria Elena Santos',
    email: 'elena.santos@boholculturalcenter.ph',
    role: 'venue_manager' as const,
    roles: ['venue_manager', 'attendee'],
    title: 'Venue Manager',
    org: 'Bohol Cultural Center Facilities',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    desc: 'Facility & multi-hall calendar, reservations',
  },
  {
    id: 'usr-att-1',
    name: 'Sofia Ramos',
    email: 'sofia.ramos@bisu.edu.ph',
    role: 'attendee' as const,
    roles: ['attendee'],
    title: 'Student Attendee',
    org: 'Bohol Island State University',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    desc: 'Public feed, pass wallet, QR check-in ticket',
  },
  {
    id: 'per-4',
    name: 'Rico Tan',
    email: 'rico.tan@securesentry.ph',
    role: 'staff' as const,
    roles: ['staff', 'attendee'],
    title: 'Security Lead (Turnstile)',
    org: 'SecureSentry Bohol Operations',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    desc: 'Gate camera scanner, rapid verification',
  },
];

export const DevCodeModal: React.FC<DevCodeModalProps> = ({
  isOpen,
  onClose,
  onOpenScannerWithCode,
}) => {
  const {
    isDevModeUnlocked,
    unlockedDevCode,
    unlockDevMode,
    lockDevMode,
    isDemoMode,
    isLiveBackend,
    currentRole,
    setCurrentRole,
    setCurrentUser,
    loadDemoData,
    events,
    venues,
    tasks,
    auditLogs,
  } = useApp();

  const [inputCode, setInputCode] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFeedback(null);
      setInputCode('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Audio tone feedback for unlocking
  const playDevChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, audioCtx.currentTime + 0.15); // E5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch {
      // Audio not permitted or unsupported
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (codeToSubmit?: string) => {
    const code = codeToSubmit || inputCode;
    if (!code.trim()) {
      setFeedback({ type: 'error', message: 'Please enter a developer passcode.' });
      return;
    }

    const result = unlockDevMode(code);
    if (result.success) {
      playDevChime();
      setFeedback({ type: 'success', message: result.message });
      setInputCode('');
    } else {
      setFeedback({ type: 'error', message: result.message });
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleTestInScanner = (code: string) => {
    onClose();
    if (onOpenScannerWithCode) {
      onOpenScannerWithCode(code);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-white dark:bg-[#151D2A] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="devcode-modal-title"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="devcode-modal-title" className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Developer & Evaluation Console
                </h2>
                {isDevModeUnlocked && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    ACTIVE: {unlockedDevCode}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Administrative shortcuts, test data harnesses, and gate testbeds
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Feedback alert banner */}
          {feedback && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                  : feedback.type === 'error'
                  ? 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                  : 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
              }`}
            >
              {feedback.type === 'success' ? (
                <Check className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Passcode Input Section */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              {isDevModeUnlocked ? 'Switch / Re-authenticate DevCode' : 'Enter Developer Passcode'}
            </label>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  placeholder="e.g. ZABAY2026 or ROLE2-SEED"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-[#101622] border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold tracking-wider uppercase text-slate-900 dark:text-slate-100 placeholder:normal-case placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#3E6CB5] dark:focus:ring-[#5C8BD6]"
                />
              </div>
              <button
                onClick={() => handleSubmit()}
                className="px-4 py-2 bg-[#3E6CB5] hover:bg-[#325896] dark:bg-[#4E80CD] dark:hover:bg-[#3E6CB5] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-xs"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Verify Code</span>
              </button>
            </div>

            {/* Quick-fill DevCode Presets */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                1-Click Preset DevCodes for Evaluators & Team:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSubmit('ZABAY2026')}
                  className="text-left p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-indigo-700 dark:text-indigo-400">
                      ZABAY2026
                    </span>
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500 opacity-60 group-hover:opacity-100" />
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Master Evaluation: Full Bohol events, venues, crew, & passes
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleSubmit('ROLE2-SEED')}
                  className="text-left p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      ROLE2-SEED
                    </span>
                    <Database className="w-3.5 h-3.5 text-emerald-500 opacity-60 group-hover:opacity-100" />
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Testbed: Prepares duplicate QR check-in & booking collisions
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleSubmit('DEV-BOHOL')}
                  className="text-left p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-400">
                      DEV-BOHOL
                    </span>
                    <Building2 className="w-3.5 h-3.5 text-blue-500 opacity-60 group-hover:opacity-100" />
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Bohol Community Operations: Tagbilaran & Panglao fixtures
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleSubmit('CLEAN-SLATE')}
                  className="text-left p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-700 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-rose-700 dark:text-rose-400">
                      CLEAN-SLATE
                    </span>
                    <RotateCcw className="w-3.5 h-3.5 text-rose-500 opacity-60 group-hover:opacity-100" />
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Wipe Workspace: Reset to 0 records & reconnect to backend
                  </p>
                </button>
              </div>
            </div>
          </div>

          {/* Unlocked Developer Tools & Diagnostic Panel */}
          {isDevModeUnlocked && (
            <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              {/* Evaluation Personas (Safely isolated in Dev Console) */}
              <div className="p-3.5 bg-slate-50 dark:bg-[#111722] rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Evaluation Demo Personas</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">1-Click Role Switch</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {DEMO_PERSONAS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        const userToSet = {
                          id: p.id,
                          name: p.name,
                          email: p.email,
                          role: p.role,
                          roles: p.roles as any,
                          avatar: p.avatar,
                          organization: p.org,
                          location: 'Tagbilaran City, Bohol',
                          bio: `${p.title} at ${p.org}`,
                        };
                        loadDemoData();
                        setCurrentUser(userToSet);
                        setCurrentRole(p.role);
                        if (typeof window !== 'undefined') {
                          localStorage.setItem('zabay-user', JSON.stringify(userToSet));
                          localStorage.setItem('zabay-role', p.role);
                        }
                        setFeedback({ type: 'success', message: `Switched session to ${p.name} (${p.title})` });
                      }}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#171E2B] hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-xs transition-all text-left flex items-center gap-2.5 cursor-pointer group"
                    >
                      <img src={p.avatar} alt={p.name} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          {p.name}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {p.title}
                        </div>
                        <div className="text-[9px] text-slate-400 truncate">
                          {p.desc}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* QR Scanner Test Codes Harness */}
              <div className="p-3.5 bg-slate-50 dark:bg-[#111722] rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-[#3E6CB5] dark:text-[#7EA6E0]" />
                    <span>Turnstile Gate Scanner Test Harness</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Click to test instant gate verification</span>
                </div>

                <div className="space-y-1.5">
                  {/* Sofia Ramos - Valid First Scan */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-[#171E2B] border border-slate-200 dark:border-slate-800 text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          ZABAY-PASS-9042-SOFIA
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          First Scan (Valid)
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400">Sofia Ramos • Courtside Reserved</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopyCode('ZABAY-PASS-9042-SOFIA')}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded"
                        title="Copy pass code"
                      >
                        {copiedCode === 'ZABAY-PASS-9042-SOFIA' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleTestInScanner('ZABAY-PASS-9042-SOFIA')}
                        className="px-2 py-1 text-[11px] font-semibold rounded bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 transition-colors"
                      >
                        Test Scan
                      </button>
                    </div>
                  </div>

                  {/* Liam Mendoza - Duplicate Scan (Demonstrates 23505) */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-[#171E2B] border border-slate-200 dark:border-slate-800 text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          ZABAY-PASS-3108-LIAM
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                          Already Checked-In (Duplicate Entry)
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400">Liam Mendoza • Bleachers • Tests Single-Admission Enforcement</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopyCode('ZABAY-PASS-3108-LIAM')}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded"
                        title="Copy pass code"
                      >
                        {copiedCode === 'ZABAY-PASS-3108-LIAM' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleTestInScanner('ZABAY-PASS-3108-LIAM')}
                        className="px-2 py-1 text-[11px] font-semibold rounded bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-300 transition-colors"
                      >
                        Test Duplicate
                      </button>
                    </div>
                  </div>

                  {/* Counterfeit Code */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-[#171E2B] border border-slate-200 dark:border-slate-800 text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          FAKE-COUNTERFEIT-QR-999
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                          Counterfeit / Invalid
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400">Tests 220Hz warning buzzer & audit anomaly</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopyCode('FAKE-COUNTERFEIT-QR-999')}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded"
                        title="Copy pass code"
                      >
                        {copiedCode === 'FAKE-COUNTERFEIT-QR-999' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleTestInScanner('FAKE-COUNTERFEIT-QR-999')}
                        className="px-2 py-1 text-[11px] font-semibold rounded bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 transition-colors"
                      >
                        Test Fake
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fast Role Switcher */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Instant Role Fast-Jump:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => {
                      setCurrentRole('attendee');
                      setFeedback({ type: 'info', message: 'Switched to Public Attendee feed' });
                    }}
                    className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      currentRole === 'attendee'
                        ? 'bg-[#3E6CB5] text-white border-[#3E6CB5]'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Attendee</span>
                  </button>

                  <button
                    onClick={() => {
                      setCurrentRole('organizer');
                      setFeedback({ type: 'info', message: 'Switched to Organizer Studio' });
                    }}
                    className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      currentRole === 'organizer'
                        ? 'bg-[#3E6CB5] text-white border-[#3E6CB5]'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Organizer</span>
                  </button>

                  <button
                    onClick={() => {
                      setCurrentRole('venue_manager');
                      setFeedback({ type: 'info', message: 'Switched to Venue Manager Hub' });
                    }}
                    className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      currentRole === 'venue_manager'
                        ? 'bg-[#3E6CB5] text-white border-[#3E6CB5]'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Venue Mgr</span>
                  </button>

                  <button
                    onClick={() => {
                      setCurrentRole('staff');
                      setFeedback({ type: 'info', message: 'Switched to Staff Run-of-Show Portal' });
                    }}
                    className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      currentRole === 'staff'
                        ? 'bg-[#3E6CB5] text-white border-[#3E6CB5]'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Staff Shift</span>
                  </button>
                </div>
              </div>

              {/* System State Snapshot */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] text-slate-400">Sync Status</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                    {isDemoMode ? 'Local Workspace' : isLiveBackend ? 'Live Sync Active' : 'Offline Mode'}
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] text-slate-400">Venues & Events</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {venues.length} venues • {events.length} evts
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] text-slate-400">Tasks & Roster</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {tasks.length} tasks
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] text-slate-400">Audit Trail</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {auditLogs.length} logs
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span>Shortcut:</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-mono text-slate-700 dark:text-slate-300">
              Ctrl+Shift+D
            </kbd>
          </div>

          <div className="flex items-center gap-2">
            {isDevModeUnlocked && (
              <button
                onClick={() => {
                  lockDevMode();
                  setFeedback({ type: 'info', message: 'Developer session locked.' });
                }}
                className="px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Lock Dev Mode</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
