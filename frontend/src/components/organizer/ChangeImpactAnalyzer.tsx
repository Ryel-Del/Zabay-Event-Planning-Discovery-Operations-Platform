import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  GitBranch,
  CheckCircle2,
  Zap,
  Activity,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ChangeImpactAnalyzer: React.FC = () => {
  const { tasks, fnDownstreamImpact, fnScheduleImpact, applyTaskDelay, selectedEvent } = useApp();

  const [selectedTaskId, setSelectedTaskId] = useState<string>(tasks[2]?.id || tasks[0]?.id);
  const [delayMinutes, setDelayMinutes] = useState<number>(45);
  const [delayReason, setDelayReason] = useState<string>('Supplier equipment delivery delayed in transit');
  const [appliedFeedback, setAppliedFeedback] = useState<string | null>(null);

  const selectedTask = useMemo(
    () => tasks.find((t) => t.id === selectedTaskId) || tasks[0],
    [tasks, selectedTaskId]
  );

  // Run recursive downstream analysis: simulates PostgreSQL fn_downstream_impact(task_id)
  const downstreamResult = useMemo(
    () => (selectedTask ? fnDownstreamImpact(selectedTask.id) : { affectedTaskIds: [], totalAffected: 0 }),
    [selectedTask, fnDownstreamImpact]
  );

  // Run schedule propagation: simulates PostgreSQL fn_schedule_impact(task_id, delay)
  const scheduleImpactResult = useMemo(
    () => (selectedTask ? fnScheduleImpact(selectedTask.id, delayMinutes) : { affectedTasks: [], hasConflicts: false }),
    [selectedTask, delayMinutes, fnScheduleImpact]
  );

  const handleApplyChange = () => {
    if (!selectedTask) return;
    applyTaskDelay(selectedTask.id, delayMinutes, delayReason);
    setAppliedFeedback(`Successfully applied +${delayMinutes}m shift to ${selectedTask.title}. Downstream ripple propagated to database.`);
    setTimeout(() => setAppliedFeedback(null), 4000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header with Relational Function Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
              <GitBranch className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Dependency-Based Change-Impact Analyzer
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/80 font-mono">
                  fn_downstream_impact()
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Recursively traces downstream ripples and flags finish-to-start schedule conflicts across {selectedEvent.title}.
              </p>
            </div>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          {scheduleImpactResult.hasConflicts ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold animate-pulse">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              Schedule Infeasible (Conflict Detected)
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Schedule Feasible (Auto-absorbing)
            </div>
          )}
        </div>
      </div>

      {/* Simulator Inputs & Presets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Step 1: Select Origin Task */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-3">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">1</span>
            Select Trigger Task
          </label>
          <select
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          >
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.title} ({task.start_time} - {task.end_time})
              </option>
            ))}
          </select>
          {selectedTask && (
            <div className="text-[11px] text-slate-400 space-y-1 bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
              <p><span className="text-slate-300 font-medium">Dependencies:</span> {selectedTask.dependencies.length ? selectedTask.dependencies.join(', ') : 'None (Root Node)'}</p>
              <p><span className="text-slate-300 font-medium">Direct Downstream Tasks:</span> {downstreamResult.totalAffected} dependent task(s)</p>
            </div>
          )}
        </div>

        {/* Step 2: Configure Delay / Slippage */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">2</span>
              Hypothetical Delay
            </label>
            <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800">
              +{delayMinutes} minutes
            </span>
          </div>

          <input
            type="range"
            min={10}
            max={180}
            step={5}
            value={delayMinutes}
            onChange={(e) => setDelayMinutes(Number(e.target.value))}
            className="w-full accent-indigo-500 cursor-pointer"
          />

          {/* Quick Preset Buttons */}
          <div className="flex gap-1.5 pt-1">
            {[15, 30, 45, 60, 90, 120].map((mins) => (
              <button
                key={mins}
                onClick={() => setDelayMinutes(mins)}
                className={`flex-1 py-1 text-[11px] font-semibold rounded ${
                  delayMinutes === mins
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                +{mins}m
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Operational Rationale & Commit */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-3 flex flex-col justify-between">
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">3</span>
              Operational Rationale
            </label>
            <input
              type="text"
              value={delayReason}
              onChange={(e) => setDelayReason(e.target.value)}
              placeholder="e.g. Technician delayed, supplier shipment stuck"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <button
            onClick={handleApplyChange}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            Propagate Change to DB & Audit Log
          </button>
        </div>
      </div>

      {appliedFeedback && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          {appliedFeedback}
        </div>
      )}

      {/* Recursive Impact Ripple Visualizer */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            Downstream Impact Propagation Chain ({scheduleImpactResult.affectedTasks.length} nodes affected)
          </h3>
          <span className="text-[11px] text-slate-500 font-mono">
            Evaluating Finish-to-Start DAG Constraints
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {scheduleImpactResult.affectedTasks.map((item, idx) => {
            const isOrigin = item.id === selectedTaskId;
            const originalTask = tasks.find((t) => t.id === item.id);

            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl border transition-all ${
                  isOrigin
                    ? 'bg-indigo-950/40 border-indigo-500/50 ring-1 ring-indigo-500/30'
                    : item.conflict
                    ? 'bg-rose-950/30 border-rose-500/60 ring-1 ring-rose-500/20'
                    : 'bg-slate-950/70 border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isOrigin
                          ? 'bg-indigo-500 text-white'
                          : item.conflict
                          ? 'bg-rose-500 text-white'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <h4 className="text-xs font-bold text-slate-100 truncate max-w-[180px]">
                      {item.title}
                    </h4>
                  </div>
                  {isOrigin && (
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      Origin Trigger
                    </span>
                  )}
                  {item.conflict && !isOrigin && (
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      Conflict
                    </span>
                  )}
                </div>

                {/* Timing Comparison */}
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80 space-y-1.5 text-xs font-mono">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Original:</span>
                    <span className="line-through text-slate-500">
                      {originalTask?.start_time} → {originalTask?.end_time}
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-bold">
                    <span className={item.conflict ? 'text-rose-400' : 'text-cyan-400'}>
                      Projected:
                    </span>
                    <span className={item.conflict ? 'text-rose-400' : 'text-emerald-400'}>
                      {item.newStart} → {item.newEnd}
                    </span>
                  </div>
                </div>

                {/* Constraint Details */}
                <div className="mt-2.5 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Assigned Personnel:</span>
                  <span className="text-slate-200 font-medium">
                    {originalTask?.personnel_assignments[0]?.personnel_name || 'Unassigned'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
