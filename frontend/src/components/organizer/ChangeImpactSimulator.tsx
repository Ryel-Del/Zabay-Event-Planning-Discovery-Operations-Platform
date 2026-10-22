import React, { useState, useMemo } from 'react';
import {
  GitBranch,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Info,
  RotateCcw,
  Clock,
  ArrowRight,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ChangeImpactSimulator: React.FC = () => {
  const {
    tasks,
    selectedEvent,
    fnDownstreamImpact,
    fnScheduleImpact,
    applyTaskDelay,
    resetTasksToDefault,
    broadcastEventChange,
  } = useApp();

  const [selectedTaskId, setSelectedTaskId] = useState<string>(tasks[2]?.id || tasks[0]?.id);
  const [delayMinutes, setDelayMinutes] = useState<number>(30);
  const [delayReason, setDelayReason] = useState<string>('Equipment delivery delayed in highway traffic');
  const [appliedFeedback, setAppliedFeedback] = useState<string | null>(null);

  // Real-world operational delay scenarios
  const quickScenarios = [
    {
      label: '🍕 Catering & Concessions Late',
      minutes: 30,
      reason: 'Catering delivery van delayed in highway traffic',
      taskId: tasks[4]?.id || tasks[0]?.id,
    },
    {
      label: '🎤 Keynote Speaker Flight Delay',
      minutes: 45,
      reason: 'VIP guest arrival delayed at airport',
      taskId: tasks[2]?.id || tasks[0]?.id,
    },
    {
      label: '🔊 Stage Audio & Sound Check Glitch',
      minutes: 40,
      reason: 'Sound board HDMI interface handshaking issue',
      taskId: tasks[1]?.id || tasks[0]?.id,
    },
    {
      label: '⏱️ Project Presentations Overrun',
      minutes: 25,
      reason: 'Morning session Q&A ran past allotted timeslot',
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

  // Separate downstream tasks from completely independent tasks
  const affectedDependentTasks = useMemo(() => {
    return scheduleImpactResult.affectedTasks.filter((at) => at.id !== selectedTask?.id);
  }, [scheduleImpactResult, selectedTask]);

  const unaffectedTasks = useMemo(() => {
    if (!selectedTask) return [];
    return tasks.filter(
      (t) => t.id !== selectedTask.id && !downstreamResult.affectedTaskIds.includes(t.id)
    );
  }, [tasks, selectedTask, downstreamResult]);

  const handleApply = () => {
    if (!selectedTask) return;
    
    // 1. Update task timings in state & audit log
    applyTaskDelay(selectedTask.id, delayMinutes, delayReason);
    
    // 2. Broadcast priority notification to crew & attendees
    const targetAffected = scheduleImpactResult.affectedTasks[0];
    const newTiming = targetAffected ? `${targetAffected.newStart} - ${targetAffected.newEnd}` : `+${delayMinutes}m`;
    broadcastEventChange({
      eventId: selectedEvent?.id || 'evt-1',
      eventTitle: selectedEvent?.title || 'Event Schedule Update',
      oldTime: `${selectedTask.start_time} - ${selectedTask.end_time}`,
      newTime: newTiming,
      summary: `Schedule Shift: "${selectedTask.title}" delayed by +${delayMinutes}m (${delayReason}). ${affectedDependentTasks.length} dependent tasks adjusted. Independent operations continue on schedule.`,
    });

    setAppliedFeedback(
      `✓ Schedule updated! ${selectedTask.title} shifted +${delayMinutes}m. ${affectedDependentTasks.length} dependent tasks synchronized, ${unaffectedTasks.length} independent tasks untouched. Live alert dispatched to field crew.`
    );
    setTimeout(() => setAppliedFeedback(null), 6000);
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
            Schedule Delay & Conflict Manager
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#EBF3FC] text-[#244A85] dark:bg-[#1E293B] dark:text-[#8BB0E8] border border-[#C8DCF7] dark:border-[#2D4160] font-medium">
              Dependency Cascade
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Test how a delay in one task affects only its dependent downstream tasks, while leaving independent tracks on schedule.
          </p>
        </div>

        {/* Status Pill & Baseline Reset */}
        <div className="flex items-center gap-2">
          {scheduleImpactResult.hasConflicts ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FDF1EF] dark:bg-[#2E1A17] text-[#C45547] dark:text-[#E07D70] border border-[#F5C2BC] dark:border-[#52251F]">
              <AlertTriangle className="w-3.5 h-3.5" /> Curfew Warning
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EDF7F2] dark:bg-[#17271F] text-[#2B6149] dark:text-[#81B89B] border border-[#BDE3CF] dark:border-[#234232]">
              <CheckCircle2 className="w-3.5 h-3.5" /> Schedule Feasible
            </span>
          )}

          <button
            onClick={resetTasksToDefault}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Reset to Original Baseline Schedule"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {appliedFeedback && (
        <div className="p-3.5 bg-[#EDF7F2] dark:bg-[#17271F] border border-[#BDE3CF] dark:border-[#234232] rounded-xl text-xs font-semibold text-[#2B6149] dark:text-[#81B89B] flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="leading-snug">{appliedFeedback}</span>
        </div>
      )}

      {/* Quick Common Scenarios */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#3E6CB5] dark:text-[#7EA6E0]" />
          Common Delay Scenarios (Click to Test)
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
                <span className="text-[#3E6CB5] dark:text-[#7EA6E0] font-semibold">Simulate →</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Configuration Controls */}
      <div className="bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 space-y-5">
        {/* Step 1: Select Origin Task */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            1. Select Task to Delay
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {tasks.slice(0, 6).map((task) => {
              const isSelected = task.id === selectedTaskId;
              const hasDependents = tasks.some((t) => t.dependencies?.includes(task.id));
              return (
                <button
                  key={task.id}
                  onClick={() => setSelectedTaskId(task.id)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#EBF3FC] dark:bg-[#1E293B] border-[#3E6CB5] dark:border-[#7EA6E0] shadow-xs ring-1 ring-[#3E6CB5]'
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
                    <span className="text-[10px] uppercase font-sans text-slate-500 font-semibold">
                      {hasDependents ? 'Has Dependents' : 'Independent'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Delay Configuration & Reason */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-end pt-2 border-t border-slate-200/80 dark:border-slate-800">
          <div className="lg:col-span-7 space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <label className="font-bold uppercase tracking-wider text-slate-500 text-[11px]">
                2. Delay Duration:
              </label>
              <span className="font-mono font-bold text-base text-[#3E6CB5] dark:text-[#7EA6E0]">
                +{delayMinutes} minutes
              </span>
            </div>

            <input
              type="range"
              min={10}
              max={120}
              step={5}
              value={delayMinutes}
              onChange={(e) => setDelayMinutes(Number(e.target.value))}
              className="w-full accent-[#3E6CB5] cursor-pointer"
            />

            <div className="flex gap-1.5 pt-0.5">
              {[15, 30, 45, 60, 90].map((mins) => (
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

            <div className="pt-1">
              <input
                type="text"
                placeholder="Reason for delay (e.g., Heavy traffic, AV soundboard issue)..."
                value={delayReason}
                onChange={(e) => setDelayReason(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171E2B] text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#3E6CB5]"
              />
            </div>
          </div>

          {/* Step 3: Apply & Notify Action Button */}
          <div className="lg:col-span-5 space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              3. Confirm & Dispatch
            </label>
            <button
              onClick={handleApply}
              className="w-full py-3 bg-[#3E6CB5] hover:bg-[#325896] dark:bg-[#4E80CD] dark:hover:bg-[#3E6CB5] text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4 text-[#D4E4F7]" />
              <span>Apply Schedule Shift & Notify Crew</span>
            </button>
            <p className="text-[10px] text-slate-400 text-center">
              Updates master timetable and pushes priority alerts to staff on duty.
            </p>
          </div>
        </div>
      </div>

      {/* Visual Before vs After Summary */}
      <div className="bg-[#EBF3FC]/60 dark:bg-[#1E293B]/50 border border-[#C8DCF7] dark:border-[#2D4160] rounded-2xl p-4.5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-[#244A85] dark:text-[#8BB0E8]">
            <Info className="w-4 h-4 shrink-0" />
            <span>Impact Summary & Reality Check</span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            {affectedDependentTasks.length} dependent task(s) affected • {unaffectedTasks.length} task(s) on schedule
          </span>
        </div>

        <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-2">
          <p>
            If <strong>{selectedTask?.title}</strong> is delayed by <strong>+{delayMinutes} minutes</strong> ({delayReason}):
          </p>
          
          <div className="p-3 bg-white dark:bg-[#171E2B] rounded-xl border border-[#C8DCF7]/70 dark:border-[#2D4160] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {selectedTask?.title}
            </span>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="line-through text-slate-400">{selectedTask?.start_time} - {selectedTask?.end_time}</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#3E6CB5]" />
              <span className="font-bold text-[#3E6CB5] dark:text-[#7EA6E0]">
                {selectedTask?.start_time} - {scheduleImpactResult.affectedTasks[0]?.newEnd || selectedTask?.end_time}
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-sans font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                +{delayMinutes}m
              </span>
            </div>
          </div>

          {scheduleImpactResult.hasConflicts ? (
            <p className="text-[#C45547] dark:text-[#E07D70] font-bold text-[11px] pt-1">
              ⚠️ <strong>Curfew Warning:</strong> Pushing this task delays downstream sessions past the 17:00 venue closing window. Consider shortening buffer breaks or requesting a venue overtime extension.
            </p>
          ) : (
            <p className="text-[#2B6149] dark:text-[#81B89B] font-bold text-[11px] pt-1">
              ✓ <strong>Schedule Feasible:</strong> All dependent shifts remain safely within the venue booking hours.
            </p>
          )}
        </div>
      </div>

      {/* SECTION 1: Affected Dependent Tasks */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            Affected Dependent Tasks ({affectedDependentTasks.length})
          </h3>
          <span className="text-[11px] text-slate-400">
            These tasks directly or indirectly wait for {selectedTask?.title}
          </span>
        </div>

        {affectedDependentTasks.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFD] dark:bg-[#111722] text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Dependent Task</th>
                  <th className="py-3 px-4">Original Time</th>
                  <th className="py-3 px-4">Shifted Time</th>
                  <th className="py-3 px-4">Delay Impact</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {affectedDependentTasks.map((t) => {
                  const originalTask = tasks.find((tk) => tk.id === t.id);
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">{t.title}</td>
                      <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                        {originalTask ? `${originalTask.start_time} - ${originalTask.end_time}` : '—'}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-[#3E6CB5] dark:text-[#7EA6E0] text-[11px]">
                        {t.newStart} → {t.newEnd}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          <Clock className="w-3 h-3" /> Pushed Back
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {t.conflict ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FDF1EF] text-[#C45547] dark:bg-[#2E1A17] dark:text-[#E07D70]">
                            <AlertTriangle className="w-3 h-3" /> Past Curfew
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
        ) : (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 text-center">
            Zero downstream dependencies! Delaying <strong>{selectedTask?.title}</strong> will not disrupt any other task.
          </div>
        )}
      </div>

      {/* SECTION 2: Unaffected Independent Tasks */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Unaffected Independent Tasks ({unaffectedTasks.length})
          </h3>
          <span className="text-[11px] text-slate-400">
            Running on original schedule without interruption
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {unaffectedTasks.slice(0, 6).map((task) => (
            <div
              key={task.id}
              className="p-3 rounded-xl bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-2"
            >
              <div className="truncate">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {task.title}
                </p>
                <p className="text-[11px] font-mono text-slate-400">
                  {task.start_time} - {task.end_time}
                </p>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full shrink-0">
                On Schedule
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
