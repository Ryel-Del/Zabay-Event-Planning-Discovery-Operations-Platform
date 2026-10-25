import React, { useState } from 'react';
import {
  CalendarRange,
  UserCheck,
  Package,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const TaskGanttView: React.FC = () => {
  const { tasks, loadDemoData } = useApp();
  const [selectedTaskId, setSelectedTaskId] = useState<string>(tasks[0]?.id || '');

  if (tasks.length === 0) {
    return (
      <div className="bg-white dark:bg-[#1E1C19] border border-stone-200/80 dark:border-stone-800/80 rounded-2xl p-12 text-center space-y-4 shadow-sm">
        <div className="w-16 h-16 bg-[#EBF3FC] dark:bg-[#1E293B] text-[#3E6CB5] dark:text-[#7EA6E0] rounded-2xl flex items-center justify-center mx-auto">
          <CalendarRange className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">No Scheduled Tasks in Workspace</h2>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            The schedule timeline visualizes task durations, setup windows, and activity sequences. Add tasks in the Kanban board or load the Bohol sample plan.
          </p>
        </div>
        <button
          onClick={loadDemoData}
          className="px-4 py-2.5 bg-[#3E6CB5] hover:bg-[#325896] text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>Load Bohol Sample Data</span>
        </button>
      </div>
    );
  }

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) || tasks[0];

  // Convert "HH:mm" to minutes from 06:00 (base = 360)
  const timeToPercent = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    const mins = h * 60 + m;
    const startWindow = 6 * 60; // 06:00
    const endWindow = 17 * 60; // 17:00 (11 hours total)
    const pct = ((mins - startWindow) / (endWindow - startWindow)) * 100;
    return Math.max(0, Math.min(100, pct));
  };

  const timeMarkers = ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00'];

  return (
    <div className="bg-white dark:bg-[#1E1C19] border border-stone-200/80 dark:border-stone-800/80 rounded-2xl p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200/80 dark:border-stone-800/80">
        <div>
          <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <CalendarRange className="w-4 h-4 text-[#B68366] dark:text-[#D4A58C]" />
            Operational Schedule Timeline & Activity Flow
          </h2>
          <p className="text-xs text-stone-500">
            Interactive schedule showing task durations, sequencing, and overlap feasibility.
          </p>
        </div>

        <div className="text-xs text-stone-500 font-mono">
          Operational Window: 06:00 → 17:00
        </div>
      </div>

      {/* Split View: Gantt Tracks (70%) + Task Inspector (30%) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gantt Chart Area */}
        <div className="lg:col-span-2 space-y-4">
          {/* Time Marker Header Axis */}
          <div className="relative h-6 border-b border-stone-200 dark:border-stone-800 text-[11px] font-mono text-stone-400">
            {timeMarkers.map((time, idx) => {
              const leftPct = timeToPercent(time);
              return (
                <div
                  key={idx}
                  className="absolute -translate-x-1/2 flex flex-col items-center"
                  style={{ left: `${leftPct}%` }}
                >
                  <span>{time}</span>
                  <div className="w-px h-1.5 bg-stone-300 dark:bg-stone-700 mt-0.5" />
                </div>
              );
            })}
          </div>

          {/* Visual Track Rows */}
          <div className="space-y-3 pt-2">
            {tasks.map((task) => {
              const left = timeToPercent(task.start_time);
              const right = timeToPercent(task.end_time);
              const width = Math.max(8, right - left);
              const isSelected = selectedTask.id === task.id;

              return (
                <div
                  key={task.id}
                  onClick={() => setSelectedTaskId(task.id)}
                  className={`group p-2 rounded-xl transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-stone-100/80 dark:bg-stone-800/60 ring-1 ring-[#B68366]/40'
                      : 'hover:bg-stone-50 dark:hover:bg-stone-800/30'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5 px-1">
                    <span className="font-bold text-stone-900 dark:text-stone-100 truncate max-w-xs">
                      {task.title}
                    </span>
                    <span className="text-[11px] font-mono text-stone-400">
                      {task.start_time} - {task.end_time}
                    </span>
                  </div>

                  {/* Horizontal Timeline Bar */}
                  <div className="relative h-7 w-full bg-[#F8FAFD] dark:bg-[#111722] rounded-lg border border-slate-200/80 dark:border-slate-800 overflow-hidden">
                    <div
                      className={`absolute top-1 bottom-1 rounded-md px-2 flex items-center justify-between text-[10px] font-bold transition-all shadow-xs ${
                        task.has_conflict
                          ? 'bg-[#C45547] text-white'
                          : task.status === 'completed'
                          ? 'bg-[#4E8268] text-white'
                          : 'bg-[#3E6CB5] text-white'
                      }`}
                      style={{ left: `${left}%`, width: `${width}%` }}
                    >
                      <span className="truncate">{task.status}</span>
                      {task.has_conflict && <AlertTriangle className="w-3 h-3 shrink-0" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Task Inspector Panel (Right Drawer) */}
        <div className="bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-start justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Task Inspector
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {selectedTask.title}
              </h3>
            </div>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                selectedTask.status === 'completed'
                  ? 'bg-[#EDF7F2] text-[#2B6149] dark:bg-[#17271F] dark:text-[#81B89B]'
                  : 'bg-[#EBF3FC] text-[#244A85] dark:bg-[#1E293B] dark:text-[#8BB0E8]'
              }`}
            >
              {selectedTask.status}
            </span>
          </div>

          <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
            {selectedTask.description}
          </p>

          {selectedTask.has_conflict && (
            <div className="p-3 bg-[#F9ECE9] dark:bg-[#341D1A] border border-[#BA4E3E]/30 rounded-xl text-xs text-[#822E22] dark:text-[#E48D80] flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-[#BA4E3E] shrink-0 mt-0.5" />
              <span>
                <strong>Schedule Infeasible:</strong> {selectedTask.conflict_reason || 'Delayed predecessor violates finish-to-start timing.'}
              </span>
            </div>
          )}

          {/* Assigned Staff (Supertype/Subtype) */}
          <div className="space-y-1.5 pt-2 border-t border-stone-200/80 dark:border-stone-800/80 text-xs">
            <span className="text-stone-500 font-semibold flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-[#5F7D5B] dark:text-[#97B394]" /> Assigned Personnel
            </span>
            {selectedTask.personnel_assignments.map((p, i) => (
              <div key={i} className="flex justify-between items-center text-[11px] bg-white dark:bg-[#1E1C19] p-2 rounded-lg border border-stone-200/80 dark:border-stone-800">
                <span className="font-bold text-stone-900 dark:text-stone-100">{p.personnel_name}</span>
                <span className="text-stone-500">{p.role}</span>
              </div>
            ))}
          </div>

          {/* Assigned Equipment */}
          <div className="space-y-1.5 text-xs">
            <span className="text-stone-500 font-semibold flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-[#B68366] dark:text-[#D4A58C]" /> Required Equipment
            </span>
            {selectedTask.resource_assignments.map((r, i) => (
              <div key={i} className="flex justify-between items-center text-[11px] bg-white dark:bg-[#1E1C19] p-2 rounded-lg border border-stone-200/80 dark:border-stone-800">
                <span className="text-stone-800 dark:text-stone-200 truncate max-w-[140px]">{r.resource_name}</span>
                <span className="font-mono text-stone-500">Qty: {r.quantity}</span>
              </div>
            ))}
          </div>

          {/* Predecessors */}
          <div className="space-y-1 text-xs pt-2 border-t border-stone-200/80 dark:border-stone-800/80">
            <span className="text-stone-500 font-semibold">Prerequisite Tasks:</span>
            <p className="text-[11px] text-stone-600 dark:text-stone-400 font-mono">
              {selectedTask.dependencies.length > 0 ? selectedTask.dependencies.join(', ') : 'None (Independent)'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
