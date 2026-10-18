import React from 'react';
import {
  Clock,
  UserCheck,
  Package,
  AlertTriangle,
  ListTodo,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { TaskPriority, TaskStatus } from '../../types';

export const TaskTimeline: React.FC = () => {
  const { tasks } = useApp();

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'critical':
        return 'bg-[#F9ECE9] dark:bg-[#341D1A] text-[#822E22] dark:text-[#E48D80] border-[#BA4E3E]/20';
      case 'high':
        return 'bg-[#FBF4E8] dark:bg-[#332615] text-[#7C5517] dark:text-[#E5BE7E] border-[#C28E3A]/20';
      case 'medium':
        return 'bg-[#F6EFE9] dark:bg-[#2B231D] text-[#885B43] dark:text-[#DEC0B0] border-[#B88568]/20';
      default:
        return 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700';
    }
  };

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-[#EEF3ED] dark:bg-[#222D21] text-[#455C42] dark:text-[#A7C2A4] border-[#5F7D5B]/20';
      case 'in_progress':
        return 'bg-[#F6EFE9] dark:bg-[#2B231D] text-[#885B43] dark:text-[#DEC0B0] border-[#B88568]/30';
      case 'blocked':
        return 'bg-[#F9ECE9] dark:bg-[#341D1A] text-[#822E22] dark:text-[#E48D80] border-[#BA4E3E]/30';
      default:
        return 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 border-stone-200 dark:border-stone-700';
    }
  };

  return (
    <div className="bg-white dark:bg-[#1E1C19] border border-stone-200/80 dark:border-stone-800/80 rounded-2xl p-6 shadow-sm space-y-6 transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-200/80 dark:border-stone-800/80">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-stone-100 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60 rounded-xl">
            <ListTodo className="w-5 h-5 text-[#B68366] dark:text-[#D4A58C]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              Operational Task Schedule & Dependencies
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 font-mono">
                Finish-to-Start DAG
              </span>
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Database-enforced task dependencies, personnel assignments, and resource allocations.
            </p>
          </div>
        </div>

        <div className="text-xs text-stone-600 dark:text-stone-400 flex items-center gap-2 bg-[#FAF9F5] dark:bg-[#171513] px-3 py-1.5 rounded-xl border border-stone-200/80 dark:border-stone-800/80">
          <span className="font-semibold text-stone-900 dark:text-stone-200">{tasks.length} Total Tasks</span>
          <span>•</span>
          <span className="text-[#455C42] dark:text-[#A7C2A4]">
            {tasks.filter((t) => t.status === 'completed').length} Completed
          </span>
          <span>•</span>
          <span className="text-[#BA4E3E] dark:text-[#E48D80]">
            {tasks.filter((t) => t.has_conflict).length} Conflicts
          </span>
        </div>
      </div>

      {/* Task List Cards */}
      <div className="space-y-3">
        {tasks.map((task) => {
          const predecessorTasks = tasks.filter((t) => task.dependencies.includes(t.id));

          return (
            <div
              key={task.id}
              className={`p-4 rounded-xl border transition-all ${
                task.has_conflict
                  ? 'bg-[#F9ECE9]/60 dark:bg-[#341D1A]/40 border-[#BA4E3E]/40 ring-1 ring-[#BA4E3E]/20'
                  : 'bg-[#FAF9F5] dark:bg-[#171513] border-stone-200/80 dark:border-stone-800/80 hover:border-stone-300 dark:hover:border-stone-700'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">{task.title}</h3>
                  <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getPriorityBadge(task.priority)}`}>
                    {task.priority}
                  </span>
                  <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getStatusBadge(task.status)}`}>
                    {task.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-stone-600 dark:text-stone-400 bg-white dark:bg-[#1E1C19] px-2.5 py-1 rounded-lg border border-stone-200/80 dark:border-stone-800">
                  <Clock className="w-3.5 h-3.5 text-stone-400" />
                  <span>
                    {task.start_time} - {task.end_time}
                  </span>
                </div>
              </div>

              <p className="text-xs text-stone-600 dark:text-stone-400 mb-3">{task.description}</p>

              {/* Conflict Alert Banner if schedule conflict detected */}
              {task.has_conflict && (
                <div className="mb-3 p-2.5 bg-[#F9ECE9] dark:bg-[#301C19] border border-[#BA4E3E]/30 rounded-xl text-[#822C20] dark:text-[#E48D80] text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#BA4E3E] dark:text-[#E48D80] shrink-0" />
                  <span>
                    <strong>Schedule Conflict:</strong> {task.conflict_reason || 'Predecessor task delayed past this task start time.'}
                  </span>
                </div>
              )}

              {/* Subtype Assignment Badges & Predecessor Dependencies */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2 border-t border-stone-200/60 dark:border-stone-800/60 text-[11px]">
                {/* Predecessors */}
                <div className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400 truncate">
                  <ArrowRight className="w-3.5 h-3.5 text-[#B68366] dark:text-[#D4A58C] shrink-0" />
                  <span className="font-semibold text-stone-700 dark:text-stone-300">Depends on:</span>
                  <span className="truncate">
                    {predecessorTasks.length > 0
                      ? predecessorTasks.map((p) => p.title.split('.')[1] || p.title).join(', ')
                      : 'None (Initial Step)'}
                  </span>
                </div>

                {/* Personnel Supertype/Subtype Assignment */}
                <div className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400 truncate">
                  <UserCheck className="w-3.5 h-3.5 text-[#5F7D5B] dark:text-[#97B394] shrink-0" />
                  <span className="font-semibold text-stone-700 dark:text-stone-300">Personnel:</span>
                  <span className="truncate">
                    {task.personnel_assignments.map((p) => `${p.personnel_name} (${p.role})`).join(', ') || 'None'}
                  </span>
                </div>

                {/* Resource Assignment */}
                <div className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400 truncate">
                  <Package className="w-3.5 h-3.5 text-[#C28E3A] dark:text-[#E5BE7E] shrink-0" />
                  <span className="font-semibold text-stone-700 dark:text-stone-300">Equipment:</span>
                  <span className="truncate">
                    {task.resource_assignments.map((r) => `${r.quantity}x ${r.resource_name}`).join(', ') || 'None'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
