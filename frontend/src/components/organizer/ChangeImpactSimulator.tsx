import React, { useState, useMemo } from 'react';
import {
  GitBranch,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Sparkles,
  Info,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ChangeImpactSimulator: React.FC = () => {
  const { tasks, fnDownstreamImpact, fnScheduleImpact, applyTaskDelay, resetTasksToDefault } = useApp();

  const [selectedTaskId, setSelectedTaskId] = useState<string>(tasks[2]?.id || tasks[0]?.id);
  const [delayMinutes, setDelayMinutes] = useState<number>(45);
  const [delayReason, setDelayReason] = useState<string>('Equipment delivery delayed in traffic');
  const [appliedFeedback, setAppliedFeedback] = useState<string | null>(null);

  // Student Organization & Event Presets
  const quickScenarios = [
    {
      label: '🍕 Food / Catering Delivery Late',
      minutes: 30,
      reason: 'Pizza delivery van delayed in highway traffic',
      taskId: tasks[4]?.id || tasks[0]?.id,
    },
    {
      label: '🎤 Speaker / VIP Guest Delayed',
      minutes: 45,
      reason: 'Keynote speaker flight arrival delay',
      taskId: tasks[2]?.id || tasks[0]?.id,
    },
    {
      label: '🔊 AV / Stage & Sound Check Glitch',
      minutes: 60,
      reason: 'Audio mixer board HDMI handshaking error',
      taskId: tasks[1]?.id || tasks[0]?.id,
    },
    {
      label: '⏱️ Student Project Demo Overrun',
      minutes: 25,
      reason: 'Student pitch presentations ran past allotted Q&A slot',
      taskId: tasks[3]?.id || tasks[0]?.id,
    },
  ];

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
    setAppliedFeedback(
      `Slippage of +${delayMinutes}m committed to database. ${scheduleImpactResult.affectedTasks.length} downstream dependencies synchronized.`
    );
    setTimeout(() => setAppliedFeedback(null), 4500);
  };

  const handleApplyScenario = (scenario: typeof quickScenarios[0]) => {
    setSelectedTaskId(scenario.taskId);
    setDelayMinutes(scenario.minutes);
    setDelayReason(scenario.reason);
  };

  return (
    <div className="bg-white dark:bg-[#171E2B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6 transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-[#3E6CB5] dark:text-[#7EA6E0]" />
            Change-Impact & Schedule Slippage Simulator
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#EBF3FC] text-[#244A85] dark:bg-[#1E293B] dark:text-[#8BB0E8] border border-[#C8DCF7] dark:border-[#2D4160] font-mono">
              Recursive CTE
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Intuitive ripple simulation for student clubs & event teams to test delays before committing changes.
          </p>
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-2">
          {scheduleImpactResult.hasConflicts ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FDF1EF] dark:bg-[#2E1A17] text-[#C45547] dark:text-[#E07D70] border border-[#F5C2BC] dark:border-[#52251F]">
              <AlertTriangle className="w-3.5 h-3.5" /> Infeasible (Curfew Collision)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EDF7F2] dark:bg-[#17271F] text-[#2B6149] dark:text-[#81B89B] border border-[#BDE3CF] dark:border-[#234232]">
              <CheckCircle2 className="w-3.5 h-3.5" /> Schedule Feasible
            </span>
          )}

          <button
            onClick={resetTasksToDefault}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Reset to Baseline Schedule"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {appliedFeedback && (
        <div className="p-3 bg-[#EDF7F2] dark:bg-[#17271F] border border-[#BDE3CF] dark:border-[#234232] rounded-xl text-xs font-semibold text-[#2B6149] dark:text-[#81B89B] flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{appliedFeedback}</span>
        </div>
      )}

      {/* Student Org Friendly Quick Scenarios */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#3E6CB5] dark:text-[#7EA6E0]" />
          Quick Test Scenarios (Student Groups & Common Hiccups)
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {quickScenarios.map((scenario, i) => (
            <button
              key={i}
              onClick={() => handleApplyScenario(scenario)}
              className="p-3 text-left rounded-xl bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200/90 dark:border-slate-800 hover:border-[#3E6CB5] dark:hover:border-[#7EA6E0] hover:bg-[#EBF3FC]/40 dark:hover:bg-[#1E293B]/40 transition-all cursor-pointer shadow-xs space-y-1"
            >
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{scenario.label}</p>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Delay: +{scenario.minutes}m</span>
                <span className="text-[#3E6CB5] dark:text-[#7EA6E0] font-semibold">Test Scenario →</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Visual Configuration Stepper (Clean pill selector instead of raw native select) */}
      <div className="bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 space-y-5">
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            1. Select Origin Task to Adjust (Click to Select)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {tasks.slice(0, 6).map((task) => {
              const isSelected = task.id === selectedTaskId;
              return (
                <button
                  key={task.id}
                  onClick={() => setSelectedTaskId(task.id)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#EBF3FC] dark:bg-[#1E293B] border-[#3E6CB5] dark:border-[#7EA6E0] shadow-xs'
                      : 'bg-white dark:bg-[#171E2B] border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {task.title}
                    </span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-[#3E6CB5] dark:bg-[#7EA6E0] shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>{task.start_time} - {task.end_time}</span>
                    <span className="text-[10px] uppercase font-sans text-slate-500 font-semibold">{task.status}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-end pt-2 border-t border-slate-200/80 dark:border-slate-800">
          {/* Step 2: Delay Configuration (7 cols) */}
          <div className="lg:col-span-7 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="font-bold uppercase tracking-wider text-slate-500 text-[11px]">
                2. Operational Slippage Duration:
              </label>
              <span className="font-mono font-bold text-base text-[#3E6CB5] dark:text-[#7EA6E0]">
                +{delayMinutes} minutes
              </span>
            </div>

            <input
              type="range"
              min={10}
              max={150}
              step={5}
              value={delayMinutes}
              onChange={(e) => setDelayMinutes(Number(e.target.value))}
              className="w-full accent-[#3E6CB5] cursor-pointer"
            />

            <div className="flex gap-1.5 pt-1">
              {[15, 30, 45, 60, 90, 120].map((mins) => (
                <button
                  key={mins}
                  onClick={() => setDelayMinutes(mins)}
                  className={`flex-1 py-1.5 text-[10px] font-semibold rounded-lg transition-colors cursor-pointer ${
                    delayMinutes === mins
                      ? 'bg-[#3E6CB5] text-white shadow-xs'
                      : 'bg-white dark:bg-[#171E2B] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  +{mins}m
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Operational Commit Action (5 cols) */}
          <div className="lg:col-span-5 space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              3. Database Action
            </label>
            <button
              onClick={handleApply}
              className="w-full py-3 bg-[#3E6CB5] hover:bg-[#325896] dark:bg-[#4E80CD] dark:hover:bg-[#3E6CB5] text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4 text-[#D4E4F7]" />
              <span>Propagate Slippage to Database</span>
            </button>
          </div>
        </div>
      </div>

      {/* Plain-English Cause & Effect Story Narrative (Friendly for Student Orgs) */}
      <div className="bg-[#EBF3FC]/60 dark:bg-[#1E293B]/50 border border-[#C8DCF7] dark:border-[#2D4160] rounded-2xl p-4.5 space-y-2.5">
        <div className="flex items-center gap-2 text-xs font-bold text-[#244A85] dark:text-[#8BB0E8]">
          <Info className="w-4 h-4 shrink-0" />
          <span>Operational Impact Explanation (Plain English)</span>
        </div>

        <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-1.5">
          <p>
            If <strong>{selectedTask?.title}</strong> slips by <strong>+{delayMinutes} minutes</strong> ({delayReason}), it triggers a cascade across <strong>{downstreamResult.totalAffected} downstream dependent task(s)</strong>:
          </p>
          <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 dark:text-slate-400 pl-1">
            {scheduleImpactResult.affectedTasks.slice(0, 3).map((at, idx) => (
              <li key={idx}>
                <strong>{at.title}</strong> must be postponed from its original start to{' '}
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{at.newStart}</span> (finishing at {at.newEnd}).
              </li>
            ))}
          </ul>

          {scheduleImpactResult.hasConflicts ? (
            <p className="text-[#C45547] dark:text-[#E07D70] font-bold text-[11px] pt-1">
              💥 <strong>Critical Violation:</strong> The cumulative delay pushes closing tasks beyond the scheduled venue window (17:00)! You must compress buffer times between sessions or secure venue overtime.
            </p>
          ) : (
            <p className="text-[#2B6149] dark:text-[#81B89B] font-bold text-[11px] pt-1">
              ✓ <strong>Schedule Safe:</strong> The DAG finish-to-start predecessor constraints absorb this delay without violating the venue's operating curfew.
            </p>
          )}
        </div>
      </div>

      {/* Visual Downstream Impact Cascade Waterfall */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Cascade Waterfall Propagation ({scheduleImpactResult.affectedTasks.length} affected downstream stages)
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">
            fn_schedule_impact(task_id, new_end)
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFD] dark:bg-[#111722] text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200/80 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Stage</th>
                <th className="py-3 px-4">Task Name</th>
                <th className="py-3 px-4">Original Window</th>
                <th className="py-3 px-4">Shifted Timing</th>
                <th className="py-3 px-4">Feasibility</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {scheduleImpactResult.affectedTasks.map((t, idx) => {
                const originalTask = tasks.find((tk) => tk.id === t.id);
                return (
                  <tr key={t.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">#{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">{t.title}</td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                      {originalTask ? `${originalTask.start_time} - ${originalTask.end_time}` : '—'}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-[#3E6CB5] dark:text-[#7EA6E0] text-[11px]">
                      {t.newStart} → {t.newEnd}
                    </td>
                    <td className="py-3 px-4">
                      {t.conflict ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FDF1EF] text-[#C45547] dark:bg-[#2E1A17] dark:text-[#E07D70]">
                          <AlertTriangle className="w-3 h-3" /> Clashing
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#EDF7F2] text-[#2B6149] dark:bg-[#17271F] dark:text-[#81B89B]">
                          <CheckCircle2 className="w-3 h-3" /> Compatible
                        </span>
                      )}
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
