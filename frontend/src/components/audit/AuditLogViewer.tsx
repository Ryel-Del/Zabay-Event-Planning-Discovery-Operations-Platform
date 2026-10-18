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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#FAF9F5] dark:bg-[#1E1C19] border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-2xl max-h-[85vh] p-6 shadow-2xl relative flex flex-col transition-colors">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-stone-500 hover:text-stone-900 dark:hover:text-white rounded-lg hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-stone-200/80 dark:border-stone-800/80 shrink-0">
          <div className="p-2.5 bg-stone-200/60 dark:bg-stone-800/80 border border-stone-300/60 dark:border-stone-700/60 rounded-xl">
            <History className="w-5 h-5 text-[#B68366] dark:text-[#D4A58C]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              Relational Audit Logs & Ripple Ledger
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-stone-200/80 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-300 dark:border-stone-700 font-mono">
                {auditLogs.length} Records
              </span>
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Captures database-level events, recursive schedule shifts, and gate check-ins.
            </p>
          </div>
        </div>

        {/* Scrollable Log Stream */}
        <div className="overflow-y-auto py-4 space-y-3 flex-1 pr-1">
          {auditLogs.length === 0 ? (
            <p className="text-xs text-stone-400 text-center py-8">No audit entries recorded yet.</p>
          ) : (
            auditLogs.map((log) => {
              const isTaskDelay = log.action === 'TASK_DELAY';
              const isCheckIn = log.action === 'CHECK_IN';

              return (
                <div
                  key={log.id}
                  className="p-4 rounded-xl bg-white dark:bg-[#171513] border border-stone-200/80 dark:border-stone-800 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border ${
                          isTaskDelay
                            ? 'bg-[#F9ECE9] dark:bg-[#341D1A] text-[#822E22] dark:text-[#E48D80] border-[#BA4E3E]/20'
                            : isCheckIn
                            ? 'bg-[#EEF3ED] dark:bg-[#222D21] text-[#455C42] dark:text-[#A7C2A4] border-[#5F7D5B]/20'
                            : 'bg-[#F6EFE9] dark:bg-[#2B231D] text-[#885B43] dark:text-[#DEC0B0] border-[#B88568]/20'
                        }`}
                      >
                        {log.action}
                      </span>
                      <span className="font-semibold text-stone-900 dark:text-stone-200">{log.user_name}</span>
                    </div>

                    <span className="text-[11px] font-mono text-stone-400">
                      {new Date(log.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </div>

                  <p className="text-stone-700 dark:text-stone-300 font-medium">{log.change_summary}</p>

                  {/* Downstream Ripple Trail */}
                  {log.downstream_ripples && log.downstream_ripples.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-stone-200/60 dark:border-stone-800/60 bg-[#FAF9F5] dark:bg-[#1C1A17] p-2.5 rounded-lg space-y-1">
                      <span className="text-[10px] font-semibold text-[#885B43] dark:text-[#D5A78E] uppercase tracking-wider flex items-center gap-1">
                        <GitBranch className="w-3 h-3 text-[#B68366] dark:text-[#D4A58C]" />
                        Traced Downstream Cascades ({log.downstream_ripples.length}):
                      </span>
                      <div className="space-y-1">
                        {log.downstream_ripples.map((ripple, idx) => (
                          <div
                            key={idx}
                            className="text-[11px] font-mono text-stone-600 dark:text-stone-400 flex items-center gap-1.5"
                          >
                            <ArrowRight className="w-3 h-3 text-stone-400 shrink-0" />
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
        <div className="pt-3 border-t border-stone-200/80 dark:border-stone-800/80 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 rounded-xl text-xs font-semibold transition-colors shadow-sm"
          >
            Close Ledger
          </button>
        </div>
      </div>
    </div>
  );
};
