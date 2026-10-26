import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  const { checkInAttendee, events, selectedEvent, registrations } = useApp();

  // Scope available events to all active events in the workspace so gate staff can admit any event
  const availableEvents = useMemo(() => {
    if (events.length > 0) return events;
    if (selectedEvent) return [selectedEvent];
    return [];
  }, [events, selectedEvent]);

  const [activeEventId, setActiveEventId] = useState<string>(
    eventId || selectedEvent?.id || availableEvents[0]?.id || ''
  );

  useEffect(() => {
    if (eventId) {
      setActiveEventId(eventId);
    } else if (selectedEvent?.id && availableEvents.some((e) => e.id === selectedEvent.id)) {
      setActiveEventId(selectedEvent.id);
    } else if (availableEvents.length > 0 && !availableEvents.some((e) => e.id === activeEventId)) {
      setActiveEventId(availableEvents[0].id);
    }
  }, [eventId, selectedEvent?.id, availableEvents]);

  const currentGateEvent = availableEvents.find((e) => e.id === activeEventId) || selectedEvent || availableEvents[0] || events[0];

  const [passCodeInput, setPassCodeInput] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [showTestPresets, setShowTestPresets] = useState(false);
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
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [result]);

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

    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera access is not supported in this browser or requires HTTPS/localhost.');
      cameraStartingRef.current = false;
      return;
    }

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 640 }, height: { ideal: 480 } },
        });
      } catch {
        // Fallback for laptop webcams without 'environment' back-camera
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      if (!isOpenRef.current || requestId !== cameraRequestRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('muted', 'true');
        videoRef.current.setAttribute('autoplay', 'true');

        setCameraActive(true);

        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Video play deferred or blocked:', playErr);
        }

        if (!isOpenRef.current || requestId !== cameraRequestRef.current) {
          stopCamera();
          return;
        }
      } else {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    } catch (err: any) {
      console.warn('Camera access issue:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access in your browser settings.'
          : 'Could not access camera device. You can enter a pass code manually or use test presets below.'
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

      if (video && canvas && video.videoWidth > 0 && video.videoHeight > 0 && video.readyState >= 2) {
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
            const raw = qr.data.trim();
            let parsed = raw;
            try {
              const obj = JSON.parse(raw);
              if (obj.qr_pass_code || obj.code || obj.passCode) {
                parsed = obj.qr_pass_code || obj.code || obj.passCode;
              }
            } catch {
              if (raw.includes('/')) {
                const parts = raw.split('/');
                const last = parts[parts.length - 1];
                if (last && last.length > 4) parsed = last;
              }
            }
            isScanning = false;
            setPassCodeInput(parsed);
            stopCamera();
            void handleManualVerify(parsed);
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

  const sampleCodes = useMemo(() => {
    // 1. Get confirmed passes matching the currently selected gate event
    const eventPasses = registrations.filter((r) => r.event_id === currentGateEvent?.id);
    const confirmedForEvent = eventPasses.filter((r) => r.status === 'confirmed');
    const checkedInForEvent = eventPasses.filter((r) => r.status === 'checked_in');

    const otherEventPass = registrations.find((r) => r.event_id !== currentGateEvent?.id);

    const items: { label: string; code: string; isWrong?: boolean; isDuplicate?: boolean }[] = [];

    // Confirmed pass for this event (valid admission test)
    if (confirmedForEvent.length > 0) {
      confirmedForEvent.slice(0, 2).forEach((reg) => {
        items.push({
          label: `${reg.attendee_name} (Valid Pass • ${reg.ticket_type})`,
          code: reg.qr_pass_code,
        });
      });
    } else if (eventPasses.length > 0) {
      items.push({
        label: `${eventPasses[0].attendee_name} (${eventPasses[0].ticket_type})`,
        code: eventPasses[0].qr_pass_code,
      });
    } else {
      // If active event has no registrations, provide the global demo pass
      const demoPass = registrations.find((r) => r.status === 'confirmed');
      if (demoPass) {
        items.push({
          label: `${demoPass.attendee_name} (Demo Pass • ${demoPass.event_title || 'Demo'})`,
          code: demoPass.qr_pass_code,
        });
      }
    }

    // Duplicate pass test (already checked in)
    const duplicateTarget = checkedInForEvent[0] || registrations.find((r) => r.status === 'checked_in');
    if (duplicateTarget) {
      items.push({
        label: `${duplicateTarget.attendee_name} (Duplicate Pass • Already Admitted)`,
        code: duplicateTarget.qr_pass_code,
        isDuplicate: true,
      });
    }

    // Wrong event pass test
    if (otherEventPass) {
      items.push({
        label: `${otherEventPass.attendee_name} (${otherEventPass.event_title || 'Other Event'} • Wrong Event Test)`,
        code: otherEventPass.qr_pass_code,
        isWrong: true,
      });
    }

    // Counterfeit pass test
    items.push({
      label: 'Counterfeit Pass (Forged Nonce • Security Test)',
      code: 'ZABAY-FORGED-TAMPERED-PASS-999',
    });

    return items;
  }, [registrations, currentGateEvent?.id]);

  return (
    <div data-cy="qr-scanner" className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#F8FAFD] dark:bg-[#171E2B] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl relative transition-colors max-h-[94vh] sm:max-h-[88vh] flex flex-col overflow-hidden">
        {/* Header Section (Fixed at top of modal) */}
        <div className="p-3.5 sm:p-5 pb-3 border-b border-slate-200/80 dark:border-slate-800 shrink-0 space-y-2.5 sm:space-y-3 relative">
          {/* Close Button */}
          <button
            onClick={() => {
              isOpenRef.current = false;
              stopCamera();
              onClose();
            }}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Title */}
          <div className="flex items-center gap-2.5 sm:gap-3 pr-8 sm:pr-10">
            <div className="p-2 bg-[#EBF3FC] dark:bg-[#1E293B] border border-[#C8DCF7] dark:border-[#2D4160] rounded-xl shrink-0">
              <QrCode className="w-4 h-4 sm:w-5 sm:h-5 text-[#3E6CB5] dark:text-[#7EA6E0]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span>Gate Admittance Scanner</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#EDF7F2] text-[#2B6149] dark:bg-[#17271F] dark:text-[#81B89B] border border-[#BDE3CF] dark:border-[#234232] font-mono">
                  Verified Gate
                </span>
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                Hold a QR pass to camera or enter pass serial code.
              </p>
            </div>
          </div>

          {/* Active Gate Event Station & Event Selector */}
          <div className="p-2 sm:p-2.5 bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 shadow-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <div className="min-w-0">
                <div className="text-[9px] uppercase font-bold tracking-wider text-slate-400">
                  Gate Station Configured For:
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-[200px] sm:max-w-xs">
                  {currentGateEvent?.title || 'Active Event Gate'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto">
              <span className="text-[10px] text-slate-500 whitespace-nowrap">Gate:</span>
              {availableEvents.length > 1 ? (
                <select
                  value={activeEventId}
                  onChange={(e) => {
                    setActiveEventId(e.target.value);
                    setResult(null);
                  }}
                  className="text-xs font-medium bg-slate-50 dark:bg-[#1A2232] border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#3E6CB5] w-full sm:w-auto sm:max-w-[180px] truncate cursor-pointer"
                >
                  {availableEvents.map((evt) => (
                    <option key={evt.id} value={evt.id}>
                      {evt.title}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#1A2232] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 truncate max-w-[180px]">
                  {currentGateEvent?.title || 'Active Event'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Modal Body (Never clips, scrolls smoothly) */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-3">
          {/* Live Webcam Video Viewfinder */}
          <div className={`relative rounded-xl overflow-hidden bg-slate-900 border border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center shadow-inner transition-all ${
            cameraActive ? 'aspect-video max-h-56' : 'h-24 sm:h-28'
          }`}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transition-opacity duration-150 ${
                cameraActive ? 'opacity-100 block' : 'opacity-0 hidden'
              }`}
            />
            <canvas ref={canvasRef} className="hidden" />

            {!cameraActive && (
              <div className="text-center p-3 space-y-2 z-10">
                <p className="text-xs font-semibold text-slate-200">
                  Camera Optical Scanner
                </p>
                <button
                  onClick={startCamera}
                  disabled={verifying}
                  className="px-3.5 py-1.5 bg-[#3E6CB5] hover:bg-[#325896] text-white rounded-xl text-xs font-semibold shadow-md transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{result ? 'Scan Next Pass' : 'Start Camera Scanner'}</span>
                </button>
              </div>
            )}

            {cameraActive && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-3 z-10">
                <div className="w-full flex justify-between items-center text-[10px] text-white font-mono bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded-lg">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    SENSOR ON
                  </span>
                  <span>Align QR inside frame</span>
                </div>
                <div className="w-36 h-36 border-2 border-dashed border-[#86ABDF] rounded-xl flex items-center justify-center relative bg-white/5 shadow-2xl" />
                <button
                  onClick={stopCamera}
                  className="pointer-events-auto px-2.5 py-1 bg-black/70 hover:bg-black/90 text-white rounded-lg text-[10px] font-semibold transition-colors flex items-center gap-1 cursor-pointer backdrop-blur-xs"
                >
                  <CameraOff className="w-3 h-3" />
                  <span>Stop Camera</span>
                </button>
              </div>
            )}
          </div>

          {cameraError && (
            <div className="p-2.5 bg-[#FDF1EF] dark:bg-[#2E1A17] border border-[#F5C2BC] dark:border-[#52251F] rounded-xl text-xs text-[#C45547] dark:text-[#E07D70] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{cameraError}</span>
            </div>
          )}

          {/* Input Bar for Manual Entry or Barcode Scanner */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              Pass Serial or Barcode Scan:
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                data-cy="manual-pass-code"
                type="text"
                value={passCodeInput}
                onChange={(e) => setPassCodeInput(e.target.value)}
                placeholder="e.g. ZABAY-PASS-9042-SOFIA"
                className="flex-1 bg-white dark:bg-[#111722] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#3E6CB5] min-w-0"
              />
              <button
                onClick={() => handleManualVerify(passCodeInput)}
                data-cy="verify-pass"
                disabled={verifying}
                className="px-4 py-2 bg-[#3E6CB5] hover:bg-[#325896] text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs shrink-0 flex items-center justify-center gap-1.5"
              >
                {verifying ? 'Checking...' : 'Verify Pass'}
              </button>
            </div>
          </div>

          {/* Quick Test Presets (Collapsible to preserve vertical space on mobile) */}
          <div className="pt-1 border-t border-slate-200/60 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowTestPresets(!showTestPresets)}
              className="w-full flex items-center justify-between py-1.5 px-2.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/50 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors text-[11px] font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#3E6CB5] dark:text-[#7EA6E0]" />
                <span>Test & Demo Pass Codes ({sampleCodes.length})</span>
              </span>
              <span className="text-[10px] text-[#3E6CB5] dark:text-[#7EA6E0] font-bold">
                {showTestPresets ? 'Hide ▲' : 'Show Options ▼'}
              </span>
            </button>

            {showTestPresets && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2 animate-in fade-in duration-150">
                {sampleCodes.map((item, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setPassCodeInput(item.code);
                      handleManualVerify(item.code);
                    }}
                    className={`text-left px-2.5 py-1.5 rounded-xl border transition-all truncate cursor-pointer shadow-xs ${
                      item.code.includes('LIAM')
                        ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 hover:border-amber-400'
                        : item.code.includes('SANDUGO') || item.code.includes('DEVCON')
                        ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800 hover:border-rose-400'
                        : item.code.includes('FORGED')
                        ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800 hover:border-rose-400'
                        : 'bg-white dark:bg-[#111722] border-slate-200 dark:border-slate-800 hover:border-[#3E6CB5] dark:hover:border-[#7EA6E0]'
                    }`}
                  >
                    <div className="font-semibold text-[11px] truncate flex items-center gap-1 text-slate-800 dark:text-slate-200">
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
                    <div className="text-[9px] font-mono text-slate-500 dark:text-slate-400 truncate mt-0.5">{item.code}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Result Verification Feedback */}
          {result && (
            <div
              ref={resultRef}
              data-cy="checkin-result"
              className={`p-3.5 rounded-xl border text-xs space-y-2 transition-all animate-in fade-in duration-150 ${
                result.success
                  ? 'bg-[#EDF7F2] dark:bg-[#17271F] border-[#BDE3CF] dark:border-[#234232] text-[#2B6149] dark:text-[#81B89B]'
                  : result.isWrongEvent
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-900/60 text-rose-800 dark:text-rose-200'
                  : result.isDuplicate
                  ? 'bg-[#FEF8EC] dark:bg-[#2B2314] border-[#F6DEAC] dark:border-[#4D3D1F] text-[#8C6212] dark:text-[#E8BD68]'
                  : 'bg-[#FDF1EF] dark:bg-[#2E1A17] border-[#F5C2BC] dark:border-[#52251F] text-[#C45547] dark:text-[#E07D70]'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
                {result.success ? (
                  <ShieldCheck className="w-5 h-5 text-[#4E8268] dark:text-[#81B89B] shrink-0" />
                ) : result.isWrongEvent ? (
                  <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                ) : result.isDuplicate ? (
                  <AlertTriangle className="w-5 h-5 text-[#B37E1C] dark:text-[#E8BD68] shrink-0" />
                ) : (
                  <ShieldAlert className="w-5 h-5 text-[#C45547] dark:text-[#E07D70] shrink-0" />
                )}
                <span className="break-words">{result.message}</span>
              </div>

              {/* Wrong Event: Simple and direct statement, no full details display */}
              {result.isWrongEvent && (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-2.5 space-y-1 text-[11px] text-rose-900 dark:text-rose-200">
                  <div className="font-bold flex items-center gap-1.5">
                    <span>⛔ WRONG EVENT ADMITTANCE REFUSED</span>
                  </div>
                  <p className="text-[11px] font-sans opacity-95 leading-relaxed break-words">
                    This ticket was issued for <strong className="underline font-semibold">{result.registration?.event_title || 'a different event'}</strong>. Not valid for admission at this gate station.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1 font-mono">
                    <span className="bg-rose-200/80 dark:bg-rose-900/60 text-rose-900 dark:text-rose-100 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">
                      Turnstile Locked
                    </span>
                    {result.registration?.event_id && (
                      <button
                        type="button"
                        onClick={() => {
                          const targetId = result.registration.event_id;
                          setActiveEventId(targetId);
                          void handleManualVerify(passCodeInput || result.registration.qr_pass_code);
                        }}
                        className="px-2.5 py-1 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-[10px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1 shadow-xs font-sans"
                      >
                        <span>🔄 Switch Gate & Verify</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Admission Policy / Duplicate Pass Warning */}
              {result.isDuplicate && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2.5 space-y-1 text-[11px] text-amber-900 dark:text-amber-200">
                  <div className="font-bold flex items-center gap-1.5">
                    <span>🔒 ADMISSION POLICY ENFORCED</span>
                  </div>
                  <p className="text-[10px] opacity-90 break-words">
                    Security verification: Each ticket allows exactly one admission. This pass has already been used for gate entry.
                  </p>
                  <div className="flex flex-wrap gap-2 text-[9px] font-bold uppercase tracking-wider pt-0.5">
                    <span className="bg-amber-200/60 dark:bg-amber-900/40 px-1.5 py-0.5 rounded">Pass Already Admitted</span>
                    <span className="bg-amber-200/60 dark:bg-amber-900/40 px-1.5 py-0.5 rounded">Re-entry Denied</span>
                  </div>
                </div>
              )}

              {/* ONLY render ticket details for valid check-in or duplicate, NEVER for wrong event */}
              {result.registration && !result.isWrongEvent && (
                <div className="bg-white dark:bg-[#171E2B] p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] space-y-1.5 shadow-xs overflow-hidden">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-slate-500 shrink-0">Attendee:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 truncate text-right">{result.registration.attendee_name}</span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-slate-500 shrink-0">Ticket Tier:</span>
                    <span className="text-[#3E6CB5] dark:text-[#7EA6E0] font-semibold truncate text-right">{result.registration.ticket_type}</span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-slate-500 shrink-0">Pass Serial:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300 font-bold text-[10px] break-all text-right">{result.registration.qr_pass_code}</span>
                  </div>
                  {result.registration.event_title && (
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-slate-500 shrink-0">Event:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate text-right">{result.registration.event_title}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
