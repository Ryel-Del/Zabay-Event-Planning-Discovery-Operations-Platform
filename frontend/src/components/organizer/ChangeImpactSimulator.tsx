import React, { useState, useMemo } from 'react';
import {
  GitBranch,
  AlertTriangle,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ChangeImpactSimulator: React.FC = () => {
  const { tasks, fnDownstreamImpact, fnScheduleImpact, applyTaskDelay } = useApp();

  const [selectedTaskId, setSelectedTaskId] = useState<string>(tasks[2]?.id || tasks[0]?.id);
  const [delayMinutes, setDelayMinutes] = useState<number>(45);
  const delayReason = 'Supplier equipment delivery delayed in transit';
  const [appliedFeedback, setAppliedFeedback] = useState<string | null>(null);

  const selectedTask = useMemo(
    () => tasks.find((t) => t.id === selectedTaskId) || tasks[0],
    [tasks, selectedTaskId]
  );

  const downstreamResult = useMemo(
    () => (selectedTask ? fnDownstreamImpact(selectedTask.id) : { affectedTaskIds: [], totalAffected: 0 }),
    [selectedTask, fnDownstreamImpact]
  );

  const scheduleImpactResult = useMemo(
    () => (selectedTask ? fnScheduleImpact(selectedTask.id, delayMinutes) : { affectedTasks: [], hasConflicts: false }),
    [selectedTask, delayMinutes, fnScheduleImpact]
  );

  const handleApply = () => {
    if (!selectedTask) return;
    applyTaskDelay(selectedTask.id, delayMinutes, delayReason);
    setAppliedFeedback(`Slippage applied to database. ${scheduleImpactResult.affectedTasks.length} downstream tasks updated.`);
    setTimeout(() => setAppliedFeedback(null), 4000);
  };

  return (
    <div className="bg-white dark:bg-[#1E1C19] border border-stone-200/80 dark:border-stone-800/80 rounded-2xl p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200/80 dark:border-stone-800/80">
        <div>
          <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-[#B68366] dark:text-[#D4A58C]" />
            DAG Dependency Change-Impact Simulator
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 font-mono">
              fn_schedule_impact()
            </span>
          </h2>
          <p className="text-xs text-stone-500">
            Simulate operational delays and evaluate recursive downstream conflicts before committing.
          </p>
        </div>

        {/* Status Pill */}
        <div>
          {scheduleImpactResult.hasConflicts ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#F9ECE9] dark:bg-[#341D1A] text-[#BA4E3E] dark:text-[#E48D80] border border-[#BA4E3E]/30">
              <AlertTriangle className="w-3.5 h-3.5" /> Schedule Infeasible (Collision Detected)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EEF3ED] dark:bg-[#222D21] text-[#455C42] dark:text-[#A7C2A4] border border-[#5F7D5B]/30">
              <CheckCircle2 className="w-3.5 h-3.5" /> Schedule Feasible
            </span>
          )}
        </div>
      </div>

      {appliedFeedback && (
        <div className="p-3 bg-[#EEF3ED] dark:bg-[#222D21] border border-[#5F7D5B]/30 rounded-xl text-xs font-semibold text-[#455C42] dark:text-[#A7C2A4] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#5F7D5B] dark:text-[#A7C2A4] shrink-0" />
          <span>{appliedFeedback}</span>
        </div>
      )}

      {/* Stepped Configuration Panel (Unified Surface, NOT 3 separate disjointed cards!) */}
      <div className="bg-[#FAF9F5] dark:bg-[#171513] border border-stone-200/80 dark:border-stone-800/80 rounded-2xl p-5 space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-end">
          {/* Step 1: Select Origin Task (5 cols) */}
          <div className="lg:col-span-5 space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              1. Select Origin Task to Delay
            </label>
            <select
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              className="w-full bg-white dark:bg-[#1E1C19] border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-semibold text-stone-900 dark:text-stone-100 focus:outline-none"
            >
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title} ({task.start_time} - {task.end_time})
                </option>
              ))}
            </select>
            <span className="text-[11px] text-stone-400 block">
              Triggers cascade across {downstreamResult.totalAffected} dependent downstream task(s)
            </span>
          </div>

          {/* Step 2: Delay Configuration (4 cols) */}
          <div className="lg:col-span-4 space-y-1.5">
            <div className="flex justify-between items-center text-[11px]">
              <label className="font-bold uppercase tracking-wider text-stone-500">
                2. Slippage Duration
              </label>
              <span className="font-mono font-bold text-[#885B43] dark:text-[#D5A78E]">
                +{delayMinutes} minutes
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="range"
                min={10}
                max={150}
                step={5}
                value={delayMinutes}
                onChange={(e) => setDelayMinutes(Number(e.target.value))}
                className="flex-1 accent-[#B68366] dark:accent-[#D4A58C] cursor-pointer"
              />
            </div>

            <div className="flex gap-1 pt-1">
              {[15, 30, 45, 60, 90].map((mins) => (
                <button
                  key={mins}
                  onClick={() => setDelayMinutes(mins)}
                  className={`flex-1 py-1 text-[10px] font-semibold rounded-lg transition-colors ${
                    delayMinutes === mins
                      ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                      : 'bg-white dark:bg-[#1E1C19] text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700'
                  }`}
                >
                  +{mins}m
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Commit Button (3 cols) */}
          <div className="lg:col-span-3 space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              3. Operational Action
            </label>
            <button
              onClick={handleApply}
              className="w-full py-2.5 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 rounded-xl text-xs font-semibold shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-[#B68366] dark:text-[#885B43]" />
              Propagate to Database
            </button>
          </div>
        </div>
      </div>

      {/* Downstream Propagation Waterfall Table (NOT disjointed repetitive cards!) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
            Downstream Impact Cascade Waterfall ({scheduleImpactResult.affectedTasks.length} affected stages)
          </h3>
          <span className="text-[11px] text-stone-400 font-mono">
            Evaluating Finish-to-Start DAG Constraints
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-stone-200/80 dark:border-stone-800/80">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF9F5] dark:bg-[#171513] text-stone-500 uppercase font-semibold text-[10px] tracking-wider border-b border-stone-200/80 dark:border-stone-800/80">
              <tr>
                <th className="py-3 px-4">Stage</th>
                <th className="py-3 px-4">Task Name</th>
                <th className="py-3 px-4">Baseline Window</th>
                <th className="py-3 px-4">Projected Shift</th>
                <th className="py-3 px-4">Feasibility</th>
                <th className="py-3 px-4">Assigned Personnel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800/80 bg-white dark:bg-[#1E1C19]">
              {scheduleImpactResult.affectedTasks.map((item, idx) => {
                const isOrigin = item.id === selectedTaskId;
                const originalTask = tasks.find((t) => t.id === item.id);

                return (
                  <tr
                    key={item.id}
                    className={`transition-colors ${
                      isOrigin
                        ? 'bg-[#F6EFE9]/40 dark:bg-[#2B231D]/40'
                        : item.conflict
                        ? 'bg-[#F9ECE9]/50 dark:bg-[#341D1A]/50'
                        : 'hover:bg-stone-50/70 dark:hover:bg-stone-800/30'
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-stone-400">
                      #{idx + 1}
                    </td>

                    <td className="py-3 px-4 font-bold text-stone-900 dark:text-stone-100">
                      <div className="flex items-center gap-2">
                        <span>{item.title}</span>
                        {isOrigin && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#EBDFD5] dark:bg-[#3E322A] text-[#885B43] dark:text-[#DEC0B0]">
                            Origin Trigger
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-stone-400 line-through">
                      {originalTask?.start_time} - {originalTask?.end_time}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-stone-900 dark:text-stone-100">
                      {item.newStart} - {item.newEnd}
                    </td>

                    <td className="py-3 px-4">
                      {item.conflict ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#BA4E3E] dark:text-[#E48D80]">
                          <AlertTriangle className="w-3.5 h-3.5" /> Collision Conflict
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#5F7D5B] dark:text-[#A7C2A4]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Absorbed
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-stone-600 dark:text-stone-400">
                      {originalTask?.personnel_assignments[0]?.personnel_name || 'Staff'} ({originalTask?.personnel_assignments[0]?.role || 'General'})
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
