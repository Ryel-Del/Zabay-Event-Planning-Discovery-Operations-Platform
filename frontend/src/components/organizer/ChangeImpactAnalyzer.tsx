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
    setAppliedFeedback(`Successfully recorded +${delayMinutes}m shift on ${selectedTask.title}. Cascades propagated to database.`);
    setTimeout(() => setAppliedFeedback(null), 3500);
  };

  return (
    <div className="bg-white dark:bg-[#1E1C19] border border-stone-200/80 dark:border-stone-800/80 rounded-2xl p-6 shadow-sm space-y-6 transition-colors">
      {/* Header with Relational Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-200/80 dark:border-stone-800/80">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-stone-100 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60 rounded-xl">
              <GitBranch className="w-5 h-5 text-[#B68366] dark:text-[#D4A58C]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                Dependency-Based Change-Impact Analyzer
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 font-mono">
                  fn_downstream_impact()
                </span>
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Recursively traces downstream ripple effects and evaluates finish-to-start timing for {selectedEvent.title}.
              </p>
            </div>
          </div>
        </div>

        {/* Status Indicator (Desaturated Tint Badges) */}
        <div className="flex items-center gap-2">
          {scheduleImpactResult.hasConflicts ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F9ECE9] dark:bg-[#301C19] border border-[#BA4E3E]/30 text-[#822C20] dark:text-[#E48D80] text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 text-[#BA4E3E] dark:text-[#E48D80]" />
              Schedule Infeasible (Conflict Detected)
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#EEF3ED] dark:bg-[#222D21] border border-[#5F7D5B]/30 text-[#455C42] dark:text-[#A7C2A4] text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-[#5F7D5B] dark:text-[#A7C2A4]" />
              Schedule Feasible (Auto-absorbing)
            </div>
          )}
        </div>
      </div>

      {/* Simulator Inputs & Presets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Step 1: Select Origin Task */}
        <div className="bg-[#FAF9F5] dark:bg-[#171513] p-4 rounded-xl border border-stone-200/80 dark:border-stone-800/80 space-y-3">
          <label className="text-xs font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 text-[10px] flex items-center justify-center font-bold">1</span>
            Select Trigger Task
          </label>
          <select
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            className="w-full bg-white dark:bg-[#1E1C19] border border-stone-300 dark:border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-[#B68366] font-medium"
          >
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.title} ({task.start_time} - {task.end_time})
              </option>
            ))}
          </select>
          {selectedTask && (
            <div className="text-[11px] text-stone-600 dark:text-stone-400 space-y-1 bg-white dark:bg-[#1E1C19] p-2.5 rounded-lg border border-stone-200 dark:border-stone-800">
              <p><span className="text-stone-900 dark:text-stone-200 font-medium">Dependencies:</span> {selectedTask.dependencies.length ? selectedTask.dependencies.join(', ') : 'None (Root Node)'}</p>
              <p><span className="text-stone-900 dark:text-stone-200 font-medium">Downstream Nodes:</span> {downstreamResult.totalAffected} dependent task(s)</p>
            </div>
          )}
        </div>

        {/* Step 2: Configure Delay / Slippage */}
        <div className="bg-[#FAF9F5] dark:bg-[#171513] p-4 rounded-xl border border-stone-200/80 dark:border-stone-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 text-[10px] flex items-center justify-center font-bold">2</span>
              Hypothetical Delay
            </label>
            <span className="text-xs font-mono font-bold text-[#885B43] dark:text-[#D5A78E] bg-[#F6EFE9] dark:bg-[#2B231D] px-2 py-0.5 rounded border border-[#EBDFD5] dark:border-[#3E322A]">
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
            className="w-full accent-[#B68366] dark:accent-[#D4A58C] cursor-pointer"
          />

          {/* Quick Preset Buttons */}
          <div className="flex gap-1.5 pt-1">
            {[15, 30, 45, 60, 90, 120].map((mins) => (
              <button
                key={mins}
                onClick={() => setDelayMinutes(mins)}
                className={`flex-1 py-1 text-[11px] font-medium rounded transition-colors ${
                  delayMinutes === mins
                    ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-semibold'
                    : 'bg-white dark:bg-[#1E1C19] text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 border border-stone-200 dark:border-stone-800'
                }`}
              >
                +{mins}m
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Operational Rationale & Commit */}
        <div className="bg-[#FAF9F5] dark:bg-[#171513] p-4 rounded-xl border border-stone-200/80 dark:border-stone-800/80 space-y-3 flex flex-col justify-between">
          <div>
            <label className="text-xs font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <span className="w-4 h-4 rounded-full bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 text-[10px] flex items-center justify-center font-bold">3</span>
              Operational Rationale
            </label>
            <input
              type="text"
              value={delayReason}
              onChange={(e) => setDelayReason(e.target.value)}
              placeholder="e.g. Technician delayed, shipment stuck"
              className="w-full bg-white dark:bg-[#1E1C19] border border-stone-300 dark:border-stone-700 rounded-lg px-3 py-1.5 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-[#B68366]"
            />
          </div>

          <button
            onClick={handleApplyChange}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-[#B68366] dark:text-[#885B43]" />
            Propagate Change & Record Audit Log
          </button>
        </div>
      </div>

      {appliedFeedback && (
        <div className="p-3 bg-[#EEF3ED] dark:bg-[#222D21] border border-[#5F7D5B]/30 rounded-xl text-[#455C42] dark:text-[#A7C2A4] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#5F7D5B] dark:text-[#A7C2A4] shrink-0" />
          {appliedFeedback}
        </div>
      )}

      {/* Recursive Impact Ripple Visualizer */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#B68366] dark:text-[#D4A58C]" />
            Downstream Impact Propagation Chain ({scheduleImpactResult.affectedTasks.length} nodes affected)
          </h3>
          <span className="text-[11px] text-stone-500 font-mono">
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
                    ? 'bg-[#F6EFE9] dark:bg-[#2B231D] border-[#EBDFD5] dark:border-[#3E322A] ring-1 ring-[#B68366]/30'
                    : item.conflict
                    ? 'bg-[#F9ECE9] dark:bg-[#301C19] border-[#BA4E3E]/40 ring-1 ring-[#BA4E3E]/20'
                    : 'bg-[#FAF9F5] dark:bg-[#171513] border-stone-200/80 dark:border-stone-800/80'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isOrigin
                          ? 'bg-[#B68366] text-white'
                          : item.conflict
                          ? 'bg-[#BA4E3E] text-white'
                          : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate max-w-[180px]">
                      {item.title}
                    </h4>
                  </div>
                  {isOrigin && (
                    <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#EBDFD5] dark:bg-[#3E322A] text-[#885B43] dark:text-[#DEC0B0]">
                      Origin
                    </span>
                  )}
                  {item.conflict && !isOrigin && (
                    <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#BA4E3E]/15 text-[#BA4E3E] dark:text-[#E48D80]">
                      Conflict
                    </span>
                  )}
                </div>

                {/* Timing Comparison */}
                <div className="bg-white dark:bg-[#1E1C19] p-2.5 rounded-lg border border-stone-200/70 dark:border-stone-800/80 space-y-1.5 text-xs font-mono">
                  <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
                    <span>Baseline:</span>
                    <span className="line-through text-stone-400 dark:text-stone-500">
                      {originalTask?.start_time} → {originalTask?.end_time}
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-bold">
                    <span className={item.conflict ? 'text-[#BA4E3E] dark:text-[#E48D80]' : 'text-stone-700 dark:text-stone-300'}>
                      Projected:
                    </span>
                    <span className={item.conflict ? 'text-[#BA4E3E] dark:text-[#E48D80]' : 'text-[#5F7D5B] dark:text-[#A7C2A4]'}>
                      {item.newStart} → {item.newEnd}
                    </span>
                  </div>
                </div>

                {/* Constraint Details */}
                <div className="mt-2.5 pt-2 border-t border-stone-200/60 dark:border-stone-800/60 text-[11px] text-stone-500 dark:text-stone-400 flex items-center justify-between">
                  <span>Assigned Personnel:</span>
                  <span className="text-stone-800 dark:text-stone-200 font-medium">
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
