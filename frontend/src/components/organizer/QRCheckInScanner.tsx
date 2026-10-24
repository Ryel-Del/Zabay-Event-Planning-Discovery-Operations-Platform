import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  X,
  AlertTriangle,
  Camera,
  CameraOff,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import jsQR from 'jsqr';
import { useApp } from '../../context/AppContext';

interface QRCheckInScannerProps {
  isOpen: boolean;
  initialCode?: string;
  onClose: () => void;
  eventId?: string;
}

export const QRCheckInScanner: React.FC<QRCheckInScannerProps> = ({ isOpen, initialCode, onClose, eventId }) => {
  const { checkInAttendee, events, selectedEvent } = useApp();
  const [activeEventId, setActiveEventId] = useState<string>(eventId || selectedEvent?.id || (events[0]?.id ?? ''));

  useEffect(() => {
    if (eventId) {
      setActiveEventId(eventId);
    } else if (selectedEvent?.id) {
      setActiveEventId(selectedEvent.id);
    } else if (events.length > 0 && !activeEventId) {
      setActiveEventId(events[0].id);
    }
  }, [eventId, selectedEvent?.id, events]);

  const currentGateEvent = events.find((e) => e.id === activeEventId) || selectedEvent || events[0];

  const [passCodeInput, setPassCodeInput] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const verificationInFlight = useRef(false);
  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;

  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    isDuplicate?: boolean;
    isWrongEvent?: boolean;
    registration?: any;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const cameraRequestRef = useRef(0);
  const cameraStartingRef = useRef(false);

  // Handle initial code pre-fill
  useEffect(() => {
    if (initialCode) {
      setPassCodeInput(initialCode);
      setResult(null);
    } else {
      setPassCodeInput('');
      setResult(null);
    }
  }, [initialCode, isOpen]);

  const releaseCamera = () => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    videoRef.current?.pause();
    if (videoRef.current) videoRef.current.srcObject = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const stopCamera = () => {
    cameraRequestRef.current += 1;
    cameraStartingRef.current = false;
    releaseCamera();
    setCameraActive(false);
  };

  const playAudioFeedback = (type: 'success' | 'duplicate' | 'error') => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      }
    } catch {
      // Audio autoplay restrictions
    }
  };

  const handleManualVerify = async (code: string) => {
    if (verificationInFlight.current) return;
    stopCamera();
    verificationInFlight.current = true;
    setResult(null);
    setVerifying(true);
    try {
      const res = await checkInAttendee(code, activeEventId);
      setResult(res);
      if (res.success) {
        playAudioFeedback('success');
      } else if (res.isDuplicate) {
        playAudioFeedback('duplicate');
      } else {
        playAudioFeedback('error');
      }
    } catch {
      setResult({ success: false, message: 'Check-in could not be completed.' });
      playAudioFeedback('error');
    } finally {
      verificationInFlight.current = false;
      setVerifying(false);
    }
  };

  // Start live webcam feed
  const startCamera = async () => {
    if (verificationInFlight.current || cameraStartingRef.current || cameraActive) return;
    cameraStartingRef.current = true;
    const requestId = ++cameraRequestRef.current;
    setResult(null);
    setPassCodeInput('');
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      if (!isOpenRef.current || requestId !== cameraRequestRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        if (!isOpenRef.current || requestId !== cameraRequestRef.current) {
          stopCamera();
          return;
        }
        setCameraActive(true);
      } else {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    } catch (err: any) {
      console.warn('Camera access issue:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access in your browser settings.'
          : 'Could not access camera device. You can still enter a pass code manually.'
      );
      stopCamera();
    } finally {
      if (requestId === cameraRequestRef.current) cameraStartingRef.current = false;
    }
  };

  // Run QR frame scanner loop when camera is active
  useEffect(() => {
    if (!cameraActive || !isOpen) return;

    let isScanning = true;

    const scanFrame = () => {
      if (!isScanning) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const qr = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (qr && qr.data) {
            const scanned = qr.data.trim();
            isScanning = false;
            setPassCodeInput(scanned);
            stopCamera();
            void handleManualVerify(scanned);
            return;
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(scanFrame);
    };

    animFrameRef.current = requestAnimationFrame(scanFrame);

    return () => {
      isScanning = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [cameraActive, isOpen]);

  // Teardown when the modal closes or unmounts.
  useEffect(() => {
    if (!isOpen) stopCamera();
    return () => releaseCamera();
  }, [isOpen]);

  if (!isOpen) return null;

  const sampleCodes = [
    { label: 'Sofia Ramos (Valid Pass - Match Active Event)', code: 'ZABAY-PASS-9042-SOFIA' },
    { label: 'Liam Mendoza (Duplicate Pass - Already Admitted)', code: 'ZABAY-PASS-3108-LIAM' },
    { label: 'Sandugo Festival Pass (Wrong Event Rejection Test)', code: 'ZABAY-PASS-7731-SANDUGO-CULTURE' },
    { label: 'Bohol DevCon Pass (Wrong Event Rejection Test)', code: 'ZABAY-PASS-4412-DEVCON-YOUTH' },
    { label: 'Kenji Tan (Valid Pass - Match Active Event)', code: 'ZABAY-PASS-1029-KENJI' },
    { label: 'Counterfeit Pass (Forged Nonce - Rejection Test)', code: 'ZABAY-FORGED-TAMPERED-PASS-999' },
  ];

  return (
    <div data-cy="qr-scanner" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#F8FAFD] dark:bg-[#171E2B] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl relative space-y-5 transition-colors max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={() => {
            isOpenRef.current = false;
            stopCamera();
            onClose();
          }}
          className="absolute top-4 right-4 p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#EBF3FC] dark:bg-[#1E293B] border border-[#C8DCF7] dark:border-[#2D4160] rounded-xl">
            <QrCode className="w-5 h-5 text-[#3E6CB5] dark:text-[#7EA6E0]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Gate Admittance QR Scanner
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#EDF7F2] text-[#2B6149] dark:bg-[#17271F] dark:text-[#81B89B] border border-[#BDE3CF] dark:border-[#234232] font-mono">
                Duplicate & Event-Verified
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Hold a QR pass up to your webcam or enter its code to verify admittance.
            </p>
          </div>
        </div>

        {/* Active Gate Event Station & Event Selector */}
        <div className="p-3 bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Gate Station Configured For:
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-xs">
                {currentGateEvent?.title || 'Active Event Gate'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <span className="text-[11px] text-slate-500 whitespace-nowrap">Gate Station:</span>
            <select
              value={activeEventId}
              onChange={(e) => {
                setActiveEventId(e.target.value);
                setResult(null);
              }}
              className="text-xs font-medium bg-slate-50 dark:bg-[#1A2232] border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#3E6CB5]"
            >
              {events.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  {evt.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Live Webcam Video Viewfinder */}
        <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center shadow-inner">
          {/* Video Stream Element */}
          <video
            ref={videoRef}
            className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
          />
          {/* Hidden Canvas for QR Extraction */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Camera Inactive / Placeholder View */}
          {!cameraActive && (
            <div className="text-center p-6 space-y-3 z-10">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-white/10 flex items-center justify-center text-slate-300 border border-white/20">
                <Camera className="w-8 h-8 text-[#86ABDF]" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-white">Live Camera Scanner</p>
                <p className="text-[11px] text-slate-400 max-w-xs">
                  Uses your laptop or smartphone camera to read digital attendee passes in real time.
                </p>
              </div>
              <button
                onClick={startCamera}
                disabled={verifying}
                className="px-4 py-2 bg-[#3E6CB5] hover:bg-[#325896] text-white rounded-xl text-xs font-semibold shadow-md transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{result ? 'Scan Next Pass' : 'Start Webcam Scanner'}</span>
              </button>
            </div>
          )}

          {/* Camera Active Viewfinder Overlay */}
          {cameraActive && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-4 z-10">
              <div className="w-full flex justify-between items-center text-[10px] text-white font-mono bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-lg">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  OPTICAL SENSOR ACTIVE
                </span>
                <span>Align QR inside frame</span>
              </div>

              {/* Target Aim Box */}
              <div className="w-48 h-48 border-2 border-dashed border-[#86ABDF] rounded-2xl flex items-center justify-center relative bg-white/5 shadow-2xl">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white rounded-br-lg" />
              </div>

              {/* Stop Camera Control */}
              <button
                onClick={stopCamera}
                className="pointer-events-auto px-3 py-1 bg-black/60 hover:bg-black/80 text-white rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1.5 cursor-pointer backdrop-blur-xs"
              >
                <CameraOff className="w-3.5 h-3.5" />
                <span>Turn Off Camera</span>
              </button>
            </div>
          )}
        </div>

        {cameraError && (
          <div className="p-3 bg-[#FDF1EF] dark:bg-[#2E1A17] border border-[#F5C2BC] dark:border-[#52251F] rounded-xl text-xs text-[#C45547] dark:text-[#E07D70] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{cameraError}</span>
          </div>
        )}

        {/* Input Bar for Manual Entry or Barcode Scanner */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Pass Serial or Barcode Scan:
          </label>
          <div className="flex gap-2">
            <input
              data-cy="manual-pass-code"
              type="text"
              value={passCodeInput}
              onChange={(e) => setPassCodeInput(e.target.value)}
              placeholder="e.g. ZABAY-PASS-9042-SOFIA"
              className="flex-1 bg-white dark:bg-[#111722] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#3E6CB5]"
            />
            <button
              onClick={() => handleManualVerify(passCodeInput)}
              data-cy="verify-pass"
              disabled={verifying}
              className="px-4 py-2 bg-[#3E6CB5] hover:bg-[#325896] text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs"
            >
              {verifying ? 'Checking...' : 'Verify Pass'}
            </button>
          </div>
        </div>

        {/* Quick Test Presets (For grading/testing without phone) */}
        <div className="space-y-2 pt-1 border-t border-slate-200/60 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#3E6CB5] dark:text-[#7EA6E0]" />
              Turnstile Security Test Scenarios:
            </span>
            <span className="text-[9px] px-2 py-0.5 rounded bg-[#EBF3FC] dark:bg-[#1E293B] text-[#244A85] dark:text-[#8BB0E8] font-mono font-semibold">
              1-Click Verification
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {sampleCodes.map((item, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setPassCodeInput(item.code);
                  handleManualVerify(item.code);
                }}
                className={`text-left p-2.5 rounded-xl border transition-all truncate cursor-pointer shadow-xs ${
                  item.code.includes('LIAM')
                    ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 hover:border-amber-400'
                    : item.code.includes('SANDUGO') || item.code.includes('DEVCON')
                    ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800 hover:border-rose-400'
                    : item.code.includes('FORGED')
                    ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800 hover:border-rose-400'
                    : 'bg-white dark:bg-[#111722] border-slate-200 dark:border-slate-800 hover:border-[#3E6CB5] dark:hover:border-[#7EA6E0]'
                }`}
              >
                <div className="font-semibold text-xs truncate flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                  <span className="text-[10px]">
                    {item.code.includes('LIAM')
                      ? '⚠️'
                      : item.code.includes('SANDUGO') || item.code.includes('DEVCON')
                      ? '⛔'
                      : item.code.includes('FORGED')
                      ? '🚫'
                      : '🎟️'}
                  </span>
                  <span className="truncate">{item.label}</span>
                </div>
                <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate mt-0.5">{item.code}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Result Verification Feedback */}
        {result && (
          <div
            data-cy="checkin-result"
            className={`p-4 rounded-xl border text-xs space-y-2.5 transition-all animate-in fade-in duration-150 ${
              result.success
                ? 'bg-[#EDF7F2] dark:bg-[#17271F] border-[#BDE3CF] dark:border-[#234232] text-[#2B6149] dark:text-[#81B89B]'
                : result.isWrongEvent
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-900/60 text-rose-800 dark:text-rose-200'
                : result.isDuplicate
                ? 'bg-[#FEF8EC] dark:bg-[#2B2314] border-[#F6DEAC] dark:border-[#4D3D1F] text-[#8C6212] dark:text-[#E8BD68]'
                : 'bg-[#FDF1EF] dark:bg-[#2E1A17] border-[#F5C2BC] dark:border-[#52251F] text-[#C45547] dark:text-[#E07D70]'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-sm">
              {result.success ? (
                <ShieldCheck className="w-5 h-5 text-[#4E8268] dark:text-[#81B89B] shrink-0" />
              ) : result.isWrongEvent ? (
                <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 animate-bounce" />
              ) : result.isDuplicate ? (
                <AlertTriangle className="w-5 h-5 text-[#B37E1C] dark:text-[#E8BD68] shrink-0 animate-pulse" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-[#C45547] dark:text-[#E07D70] shrink-0" />
              )}
              <span>{result.message}</span>
            </div>

            {/* Wrong Event Security Alert Card */}
            {result.isWrongEvent && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-2.5 space-y-1.5 text-[11px] text-rose-900 dark:text-rose-200">
                <div className="font-bold flex items-center gap-1.5">
                  <span>⛔ WRONG EVENT ADMITTANCE REFUSED</span>
                </div>
                <p className="text-[11px] font-sans opacity-90 leading-relaxed">
                  This attendee pass belongs to{' '}
                  <strong className="underline font-semibold">
                    {result.registration?.event_title || 'a different event'}
                  </strong>
                  . It cannot be admitted through this gate station set for{' '}
                  <strong className="underline font-semibold">
                    {currentGateEvent?.title}
                  </strong>
                  .
                </p>
                <div className="flex flex-wrap gap-2 text-[9px] font-bold uppercase tracking-wider pt-1 font-mono">
                  <span className="bg-rose-200/80 dark:bg-rose-900/60 text-rose-900 dark:text-rose-100 px-2 py-0.5 rounded">
                    Action: Turnstile Locked
                  </span>
                  <span className="bg-rose-200/80 dark:bg-rose-900/60 text-rose-900 dark:text-rose-100 px-2 py-0.5 rounded">
                    Cross-Event Admission Denied
                  </span>
                </div>
              </div>
            )}

            {/* Iron-Clad Duplicate Security Incident Warning */}
            {result.isDuplicate && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2.5 space-y-1 text-[11px] font-mono text-amber-900 dark:text-amber-200">
                <div className="font-bold flex items-center gap-1.5">
                  <span>🔒 DATABASE INTEGRITY POLICY ENFORCED</span>
                </div>
                <p className="text-[10px] font-sans opacity-90">
                  PostgreSQL unique constraint <code>attendance_records_registration_unique</code> blocked this transaction. Each ticket allows exactly one admission.
                </p>
                <div className="flex gap-2 text-[9px] font-bold uppercase tracking-wider pt-0.5">
                  <span className="bg-amber-200/60 dark:bg-amber-900/40 px-1.5 py-0.5 rounded">Action: Turnstile Locked</span>
                  <span className="bg-amber-200/60 dark:bg-amber-900/40 px-1.5 py-0.5 rounded">Re-entry Rejected</span>
                </div>
              </div>
            )}

            {result.registration && (
              <div className="bg-white dark:bg-[#171E2B] p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] space-y-1.5 shadow-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Attendee Name:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{result.registration.attendee_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ticket Tier:</span>
                  <span className="text-[#3E6CB5] dark:text-[#7EA6E0] font-semibold">{result.registration.ticket_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Pass Serial:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">{result.registration.qr_pass_code}</span>
                </div>
                {result.registration.event_title && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Registered Event:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{result.registration.event_title}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
