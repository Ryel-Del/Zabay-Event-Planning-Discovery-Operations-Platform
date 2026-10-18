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
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'high':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'medium':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'in_progress':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 animate-pulse';
      case 'blocked':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
            <ListTodo className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Operational Task Schedule & Dependencies
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/80 font-mono">
                Finish-to-Start DAG
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Database-enforced task dependencies, personnel assignments, and resource allocations.
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
          <span className="font-semibold text-slate-200">{tasks.length} Total Tasks</span>
          <span>•</span>
          <span className="text-emerald-400">
            {tasks.filter((t) => t.status === 'completed').length} Completed
          </span>
          <span>•</span>
          <span className="text-rose-400">
            {tasks.filter((t) => t.has_conflict).length} Conflicts
          </span>
        </div>
      </div>

      {/* Task List Table / Cards */}
      <div className="space-y-3">
        {tasks.map((task) => {
          const predecessorTasks = tasks.filter((t) => task.dependencies.includes(t.id));

          return (
            <div
              key={task.id}
              className={`p-4 rounded-xl border transition-all ${
                task.has_conflict
                  ? 'bg-rose-950/20 border-rose-500/60 ring-1 ring-rose-500/20'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-sm font-bold text-white">{task.title}</h3>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getPriorityBadge(task.priority)}`}>
                    {task.priority}
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getStatusBadge(task.status)}`}>
                    {task.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-slate-300 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {task.start_time} - {task.end_time}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-400 mb-3">{task.description}</p>

              {/* Conflict Alert Banner if schedule conflict detected */}
              {task.has_conflict && (
                <div className="mb-3 p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>
                    <strong>Schedule Conflict:</strong> {task.conflict_reason || 'Predecessor task delayed past this task start time.'}
                  </span>
                </div>
              )}

              {/* Subtype Assignment Badges & Predecessor Dependencies */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
                {/* Predecessors */}
                <div className="flex items-center gap-1.5 text-slate-400 truncate">
                  <ArrowRight className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="font-semibold text-slate-300">Depends on:</span>
                  <span className="text-slate-400 truncate">
                    {predecessorTasks.length > 0
                      ? predecessorTasks.map((p) => p.title.split('.')[1] || p.title).join(', ')
                      : 'None (Initial Step)'}
                  </span>
                </div>

                {/* Personnel Supertype/Subtype Assignment */}
                <div className="flex items-center gap-1.5 text-slate-400 truncate">
                  <UserCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="font-semibold text-slate-300">Personnel:</span>
                  <span className="text-cyan-300 truncate">
                    {task.personnel_assignments.map((p) => `${p.personnel_name} (${p.role})`).join(', ') || 'None'}
                  </span>
                </div>

                {/* Resource Assignment */}
                <div className="flex items-center gap-1.5 text-slate-400 truncate">
                  <Package className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="font-semibold text-slate-300">Equipment:</span>
                  <span className="text-amber-300 truncate">
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
