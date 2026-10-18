import React from 'react';
import {
  History,
  X,
  GitBranch,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface AuditLogViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({ isOpen, onClose }) => {
  const { auditLogs } = useApp();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] p-6 shadow-2xl relative flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800 shrink-0">
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
            <History className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Relational Audit Logs & Ripple Ledger
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-800 font-mono">
                {auditLogs.length} Records
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Captures database-level events, recursive schedule shifts, and gate check-ins.
            </p>
          </div>
        </div>

        {/* Scrollable Log Stream */}
        <div className="overflow-y-auto py-4 space-y-3 flex-1 pr-1">
          {auditLogs.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">No audit entries recorded yet.</p>
          ) : (
            auditLogs.map((log) => {
              const isTaskDelay = log.action === 'TASK_DELAY';
              const isCheckIn = log.action === 'CHECK_IN';

              return (
                <div
                  key={log.id}
                  className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between text-slate-400">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                          isTaskDelay
                            ? 'bg-rose-950/60 text-rose-300 border-rose-800/80'
                            : isCheckIn
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80'
                            : 'bg-indigo-950/60 text-indigo-300 border-indigo-800/80'
                        }`}
                      >
                        {log.action}
                      </span>
                      <span className="font-semibold text-slate-200">{log.user_name}</span>
                    </div>

                    <span className="text-[11px] font-mono text-slate-500">
                      {new Date(log.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </div>

                  <p className="text-slate-300 font-medium">{log.change_summary}</p>

                  {/* Downstream Ripple Trail */}
                  {log.downstream_ripples && log.downstream_ripples.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-800/60 bg-slate-900/40 p-2.5 rounded-lg space-y-1">
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                        <GitBranch className="w-3 h-3 text-amber-400" />
                        Traced Downstream Cascades ({log.downstream_ripples.length}):
                      </span>
                      <div className="space-y-1">
                        {log.downstream_ripples.map((ripple, idx) => (
                          <div
                            key={idx}
                            className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5"
                          >
                            <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
                            <span>{ripple}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Close Ledger
          </button>
        </div>
      </div>
    </div>
  );
};
