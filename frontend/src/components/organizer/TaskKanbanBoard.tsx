import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Clock,
  AlertTriangle,
  GitBranch,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  GraduationCap,
  Trophy,
  Briefcase,
  Check,
  Filter,
  Heart,
  FileText,
  ChevronDown,
  ChevronUp,
  Edit3,
  Trash2,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Task, TaskStatus, TaskPriority, TaskTrack } from '../../types';

export const TaskKanbanBoard: React.FC = () => {
  const {
    tasks,
    workflowKits,
    updateTaskStatus,
    updateTask,
    deleteTask,
    addTask,
    loadTaskTemplate,
    resetTasksToDefault,
    personnel,
  } = useApp();

  const [activeTrackFilter, setActiveTrackFilter] = useState<string>('all');
  const [activeTemplateFeedback, setActiveTemplateFeedback] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Expandable card and edit modal state
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Edit task form state
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState<TaskPriority>('medium');
  const [editTrack, setEditTrack] = useState<TaskTrack>('venue_logistics');
  const [editStatus, setEditStatus] = useState<TaskStatus>('todo');
  const [editStartTime, setEditStartTime] = useState('09:00');
  const [editEndTime, setEditEndTime] = useState('11:00');
  const [editDueDate, setEditDueDate] = useState('2026-11-12');
  const [editAssigneeId, setEditAssigneeId] = useState('');

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium');
  const [newTrack, setNewTrack] = useState<TaskTrack>('venue_logistics');
  const [newStartTime, setNewStartTime] = useState('09:00');
  const [newEndTime, setNewEndTime] = useState('11:00');
  const [newDueDate, setNewDueDate] = useState('2026-11-12');
  const [newAssigneeId, setNewAssigneeId] = useState(personnel[0]?.id || '');

  const columns: { id: TaskStatus; title: string; color: string; dotColor: string }[] = [
    { id: 'todo', title: 'To Do', color: 'border-slate-200 dark:border-slate-800', dotColor: 'bg-slate-400' },
    { id: 'in_progress', title: 'In Progress', color: 'border-[#C8DCF7] dark:border-[#2D4160]', dotColor: 'bg-[#3E6CB5]' },
    { id: 'blocked', title: 'Blocked / In Review', color: 'border-[#F7D8D3] dark:border-[#52251F]', dotColor: 'bg-[#C45547]' },
    { id: 'completed', title: 'Completed', color: 'border-[#C1E6D3] dark:border-[#234232]', dotColor: 'bg-[#2B6149]' },
  ];

  const filteredTasks = tasks.filter((t) => {
    if (activeTrackFilter === 'all') return true;
    return t.track === activeTrackFilter;
  });

  const handleApplyKit = (kitId: string, kitName: string) => {
    loadTaskTemplate(kitId);
    setActiveTemplateFeedback(`Loaded "${kitName}"! Tasks, dependencies, and schedules have been configured.`);
    setTimeout(() => setActiveTemplateFeedback(null), 4500);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const assignedPerson = personnel.find((p) => p.id === newAssigneeId);

    addTask({
      event_id: 'evt-1',
      title: newTitle.trim(),
      description: newDescription.trim() || 'Custom operational task.',
      status: 'todo',
      priority: newPriority,
      track: newTrack,
      start_time: newStartTime,
      end_time: newEndTime,
      due_date: newDueDate,
      dependencies: [],
      personnel_assignments: assignedPerson
        ? [{ personnel_id: assignedPerson.id, personnel_name: assignedPerson.name, role: assignedPerson.role }]
        : [],
      resource_assignments: [],
      downstream_impact_count: 0,
    });

    setNewTitle('');
    setNewDescription('');
    setIsAddModalOpen(false);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description);
    setEditPriority(task.priority);
    setEditTrack(task.track || 'venue_logistics');
    setEditStatus(task.status);
    setEditStartTime(task.start_time);
    setEditEndTime(task.end_time);
    setEditDueDate(task.due_date || '2026-11-12');
    setEditAssigneeId(task.personnel_assignments[0]?.personnel_id || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !editTitle.trim()) return;

    const assignedPerson = personnel.find((p) => p.id === editAssigneeId);

    updateTask(editingTask.id, {
      title: editTitle.trim(),
      description: editDescription.trim(),
      priority: editPriority,
      track: editTrack,
      status: editStatus,
      start_time: editStartTime,
      end_time: editEndTime,
      due_date: editDueDate,
      personnel_assignments: assignedPerson
        ? [{ personnel_id: assignedPerson.id, personnel_name: assignedPerson.name, role: assignedPerson.role }]
        : [],
    });

    setEditingTask(null);
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTask(taskId);
    if (expandedTaskId === taskId) setExpandedTaskId(null);
    if (editingTask?.id === taskId) setEditingTask(null);
  };

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'critical':
        return 'bg-[#FDF1EF] text-[#C45547] dark:bg-[#2E1A17] dark:text-[#E07D70] border border-[#F5C2BC] dark:border-[#52251F]';
      case 'high':
        return 'bg-[#FFF7ED] text-[#C2611D] dark:bg-[#2B1B10] dark:text-[#E89255] border border-[#FED7AA] dark:border-[#54301A]';
      case 'medium':
        return 'bg-[#EBF3FC] text-[#244A85] dark:bg-[#1E293B] dark:text-[#8BB0E8] border border-[#C8DCF7] dark:border-[#2D4160]';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700';
    }
  };

  const getTrackBadge = (track?: TaskTrack) => {
    switch (track) {
      case 'venue_logistics':
        return { label: 'Venue & Facilities', bg: 'bg-[#EDF7F2] text-[#2B6149] dark:bg-[#17271F] dark:text-[#81B89B]' };
      case 'technical_av':
        return { label: 'Lights, Sound & Stage', bg: 'bg-[#EBF3FC] text-[#244A85] dark:bg-[#1E293B] dark:text-[#8BB0E8]' };
      case 'marketing_tickets':
        return { label: 'Registration & Promotion', bg: 'bg-[#F5F0FA] text-[#5C3B87] dark:bg-[#231A2E] dark:text-[#B393DB]' };
      case 'day_of_ops':
        return { label: 'Day-of Coordination', bg: 'bg-[#FFF9EB] text-[#7A5B14] dark:bg-[#2A2312] dark:text-[#E2C37A]' };
      default:
        return { label: 'General', bg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' };
    }
  };

  const moveTask = (taskId: string, currentStatus: TaskStatus, direction: 'prev' | 'next') => {
    const order: TaskStatus[] = ['todo', 'in_progress', 'blocked', 'completed'];
    const currentIndex = order.indexOf(currentStatus);
    const targetIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (targetIndex >= 0 && targetIndex < order.length) {
      updateTaskStatus(taskId, order[targetIndex]);
    }
  };

  const getKitIcon = (iconName: string) => {
    switch (iconName) {
      case 'GraduationCap':
        return <GraduationCap className="w-4 h-4 text-[#3E6CB5] dark:text-[#7EA6E0]" />;
      case 'Trophy':
        return <Trophy className="w-4 h-4 text-[#C2611D] dark:text-[#E89255]" />;
      case 'Briefcase':
        return <Briefcase className="w-4 h-4 text-[#2B6149] dark:text-[#81B89B]" />;
      case 'Heart':
        return <Heart className="w-4 h-4 text-rose-500 dark:text-rose-400" />;
      case 'FileText':
        return <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-[#3E6CB5] dark:text-[#7EA6E0]" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1-Click Workflow Kits Banner */}
      <div className="bg-white dark:bg-[#171E2B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#EBF3FC] dark:bg-[#1E293B] text-[#3E6CB5] dark:text-[#7EA6E0]">
                <Sparkles className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                1-Click Event Workflow Kits
              </h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-[#EDF7F2] text-[#2B6149] dark:bg-[#17271F] dark:text-[#81B89B]">
                Zero-Hassle Setup
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Organizing doesn't have to be tedious. Pick a pre-engineered workflow kit tailored for Tagbilaran student orgs, sports, or corporate summits:
            </p>
          </div>

          <button
            onClick={resetTasksToDefault}
            className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors self-start sm:self-auto cursor-pointer"
          >
            Reset to Baseline
          </button>
        </div>

        {/* Workflow Kit Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {workflowKits.map((kit) => (
            <div
              key={kit.id}
              className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-[#F8FAFD] dark:bg-[#111722] hover:border-[#86ABDF] dark:hover:border-[#3E6CB5] transition-all flex flex-col justify-between space-y-3 group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getKitIcon(kit.icon)}
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {kit.name}
                    </span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-[#171E2B] border border-slate-200 dark:border-slate-800 text-slate-500 font-mono">
                    {kit.task_count} tasks
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2">
                  {kit.tagline}
                </p>
              </div>

              <button
                onClick={() => handleApplyKit(kit.id, kit.name)}
                className="w-full text-xs font-semibold py-1.5 px-3 rounded-lg bg-white dark:bg-[#171E2B] group-hover:bg-[#3E6CB5] group-hover:text-white dark:group-hover:bg-[#4E80CD] dark:group-hover:text-white border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                Apply Workflow Kit
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          ))}
        </div>

        {activeTemplateFeedback && (
          <div className="p-3 rounded-xl text-xs bg-[#EDF7F2] dark:bg-[#17271F] border border-[#BDE3CF] dark:border-[#234232] text-[#2B6149] dark:text-[#81B89B] flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 shrink-0" />
            <span>{activeTemplateFeedback}</span>
          </div>
        )}
      </div>

      {/* Kanban Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mr-1">
            <Filter className="w-3.5 h-3.5" />
            Track:
          </span>
          {[
            { id: 'all', label: 'All Tasks' },
            { id: 'venue_logistics', label: 'Venue & Facilities' },
            { id: 'technical_av', label: 'Lights, Sound & Stage' },
            { id: 'marketing_tickets', label: 'Registration & Promotion' },
            { id: 'day_of_ops', label: 'Day-of Coordination' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTrackFilter(tab.id)}
              className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeTrackFilter === tab.id
                  ? 'bg-[#3E6CB5] text-white shadow-xs'
                  : 'bg-white dark:bg-[#171E2B] border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 bg-[#3E6CB5] hover:bg-[#325896] dark:bg-[#4E80CD] dark:hover:bg-[#3E6CB5] text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add To-Do / Task
        </button>
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.id);

          return (
            <div
              key={col.id}
              className={`bg-white dark:bg-[#171E2B] border rounded-2xl p-4 shadow-xs flex flex-col min-h-[540px] transition-colors ${col.color}`}
            >
              {/* Column Title */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {col.title}
                  </h4>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                  {colTasks.length}
                </span>
              </div>

              {/* Task Cards */}
              <div className="space-y-3 flex-1 overflow-y-auto pr-0.5">
                {colTasks.length === 0 ? (
                  <div className="h-32 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-xs text-slate-400">
                    No tasks in this lane
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const trackBadge = getTrackBadge(task.track);
                    const isExpanded = expandedTaskId === task.id;

                    return (
                      <div
                        key={task.id}
                        onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                        className={`p-3.5 rounded-xl border bg-[#F8FAFD] dark:bg-[#111722] transition-all space-y-2.5 shadow-xs cursor-pointer ${
                          isExpanded
                            ? 'ring-2 ring-[#3E6CB5]/60 border-[#3E6CB5] bg-white dark:bg-[#141B27]'
                            : task.has_conflict
                            ? 'border-[#F5C2BC] dark:border-[#52251F] hover:border-[#86ABDF] dark:hover:border-[#3E6CB5]'
                            : 'border-slate-200/90 dark:border-slate-800 hover:border-[#86ABDF] dark:hover:border-[#3E6CB5]'
                        }`}
                      >
                        {/* Top Badges & Quick Checkbox */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateTaskStatus(
                                  task.id,
                                  task.status === 'completed' ? 'todo' : 'completed'
                                );
                              }}
                              className={`w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                                task.status === 'completed'
                                  ? 'bg-[#2B6149] border-[#2B6149] text-white'
                                  : 'border-slate-300 dark:border-slate-600 hover:border-[#3E6CB5]'
                              }`}
                              title="Toggle completion"
                            >
                              {task.status === 'completed' && <Check className="w-3 h-3 stroke-[3]" />}
                            </button>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${getPriorityBadge(
                                task.priority
                              )}`}
                            >
                              {task.priority.toUpperCase()}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${trackBadge.bg}`}>
                              {trackBadge.label}
                            </span>
                            <span className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </span>
                          </div>
                        </div>

                        {/* Title & Description */}
                        <div>
                          <h5
                            className={`text-xs font-bold leading-snug ${
                              task.status === 'completed'
                                ? 'line-through text-slate-400 dark:text-slate-500'
                                : 'text-slate-900 dark:text-slate-100'
                            }`}
                          >
                            {task.title}
                          </h5>
                          <p
                            className={`text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed ${
                              isExpanded ? '' : 'line-clamp-2'
                            }`}
                          >
                            {task.description}
                          </p>
                        </div>

                        {/* Conflict Alert */}
                        {task.has_conflict && (
                          <div className="p-2 rounded-lg bg-[#FDF1EF] dark:bg-[#2E1A17] border border-[#F5C2BC] dark:border-[#52251F] text-[10px] text-[#C45547] dark:text-[#E07D70] flex items-center gap-1.5 font-semibold">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>{task.conflict_reason || 'Schedule dependency conflict!'}</span>
                          </div>
                        )}

                        {/* Expanded Full Details Section */}
                        {isExpanded && (
                          <div className="pt-2.5 border-t border-slate-200/80 dark:border-slate-800 space-y-2 text-xs animate-in fade-in duration-150">
                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                              <div className="p-2 rounded-lg bg-slate-100/70 dark:bg-slate-800/60 space-y-0.5">
                                <span className="text-[10px] text-slate-400 font-semibold block uppercase">Due Date</span>
                                <span className="font-mono text-slate-800 dark:text-slate-200">
                                  {task.due_date || '2026-11-12'}
                                </span>
                              </div>
                              <div className="p-2 rounded-lg bg-slate-100/70 dark:bg-slate-800/60 space-y-0.5">
                                <span className="text-[10px] text-slate-400 font-semibold block uppercase">Time Slot</span>
                                <span className="font-mono text-slate-800 dark:text-slate-200">
                                  {task.start_time} - {task.end_time}
                                </span>
                              </div>
                            </div>

                            {task.personnel_assignments && task.personnel_assignments.length > 0 && (
                              <div className="p-2 rounded-lg bg-slate-100/70 dark:bg-slate-800/60 space-y-1">
                                <span className="text-[10px] text-slate-400 font-semibold block uppercase">Assigned Staff</span>
                                {task.personnel_assignments.map((pa, idx) => (
                                  <div key={idx} className="flex items-center justify-between text-[11px]">
                                    <span className="font-semibold text-slate-800 dark:text-slate-200">{pa.personnel_name}</span>
                                    <span className="text-slate-500 font-mono text-[10px]">{pa.role}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {task.resource_assignments && task.resource_assignments.length > 0 && (
                              <div className="p-2 rounded-lg bg-slate-100/70 dark:bg-slate-800/60 space-y-1">
                                <span className="text-[10px] text-slate-400 font-semibold block uppercase">Allocated Resources</span>
                                {task.resource_assignments.map((ra, idx) => (
                                  <div key={idx} className="flex items-center justify-between text-[11px]">
                                    <span className="text-slate-700 dark:text-slate-300">{ra.resource_name}</span>
                                    <span className="text-slate-500 font-mono text-[10px]">Qty: {ra.quantity}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Action Buttons Toolbar */}
                            <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-200/60 dark:border-slate-800">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTask(task.id);
                                }}
                                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                                title="Delete task"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete</span>
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditModal(task);
                                }}
                                className="flex items-center gap-1 px-3 py-1 text-[11px] font-bold text-white bg-[#3E6CB5] hover:bg-[#325896] rounded-lg shadow-xs transition-colors cursor-pointer"
                                title="Edit full task details"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Edit Details</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Collapsed Schedule & Quick Controls Footer */}
                        {!isExpanded && (
                          <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>
                                {task.start_time} - {task.end_time}
                              </span>
                            </div>

                            {task.personnel_assignments && task.personnel_assignments.length > 0 && (
                              <span className="font-medium text-slate-700 dark:text-slate-300">
                                {task.personnel_assignments[0].personnel_name.split(' ')[0]}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Bottom Lane Move Controls */}
                        <div className="flex items-center justify-between pt-1">
                          {task.downstream_impact_count && task.downstream_impact_count > 0 ? (
                            <span className="text-[10px] font-mono text-[#3E6CB5] dark:text-[#8BB0E8] flex items-center gap-1">
                              <GitBranch className="w-3 h-3" />
                              Blocks {task.downstream_impact_count}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">
                              {isExpanded ? 'Full details expanded' : 'Click to expand'}
                            </span>
                          )}

                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                moveTask(task.id, task.status, 'prev');
                              }}
                              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors cursor-pointer"
                              title="Move to previous lane"
                            >
                              <ArrowLeft className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                moveTask(task.id, task.status, 'next');
                              }}
                              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors cursor-pointer"
                              title="Move to next lane"
                            >
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Task Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#171E2B] border border-slate-200/80 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-[#3E6CB5] dark:text-[#7EA6E0]" />
                Add New Event To-Do / Task
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Bohol Wisdom Gym Sound Rehearsal & Mics"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFD] dark:bg-[#111722] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3E6CB5]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Operational Details
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief breakdown of responsibilities and delivery items..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFD] dark:bg-[#111722] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3E6CB5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFD] dark:bg-[#111722] text-slate-900 dark:text-slate-100"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Operational Track
                  </label>
                  <select
                    value={newTrack}
                    onChange={(e) => setNewTrack(e.target.value as TaskTrack)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFD] dark:bg-[#111722] text-slate-900 dark:text-slate-100"
                  >
                    <option value="venue_logistics">Venue & Facilities</option>
                    <option value="technical_av">Lights, Sound & Stage</option>
                    <option value="marketing_tickets">Registration & Promotion</option>
                    <option value="day_of_ops">Day-of Coordination</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFD] dark:bg-[#111722] text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFD] dark:bg-[#111722] text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFD] dark:bg-[#111722] text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Assign Lead Personnel / Volunteer
                </label>
                <select
                  value={newAssigneeId}
                  onChange={(e) => setNewAssigneeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFD] dark:bg-[#111722] text-slate-900 dark:text-slate-100"
                >
                  {personnel.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.role}) - ₱{p.hourly_rate}/hr
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200/80 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#3E6CB5] hover:bg-[#325896] text-white font-semibold transition-all cursor-pointer shadow-xs"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#171E2B] border border-slate-200/80 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#EBF3FC] dark:bg-[#1E293B] text-[#244A85] dark:text-[#8BB0E8] rounded-xl">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Edit Task Details
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono">
                    ID: {editingTask.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingTask(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFD] dark:bg-[#111722] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3E6CB5]"
                  placeholder="e.g. Venue Ingress & Power Check"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Description & Procedures
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFD] dark:bg-[#111722] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3E6CB5]"
                  placeholder="Operational instructions for event team..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Lane Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as TaskStatus)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFD] dark:bg-[#111722] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3E6CB5]"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="blocked">Blocked / In Review</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFD] dark:bg-[#111722] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3E6CB5]"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Track
                  </label>
                  <select
                    value={editTrack}
                    onChange={(e) => setEditTrack(e.target.value as TaskTrack)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFD] dark:bg-[#111722] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3E6CB5]"
                  >
                    <option value="venue_logistics">Venue & Facilities</option>
                    <option value="technical_av">Lights, Sound & Stage</option>
                    <option value="marketing_tickets">Registration & Promotion</option>
                    <option value="day_of_ops">Day-of Coordination</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFD] dark:bg-[#111722] text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={editEndTime}
                    onChange={(e) => setEditEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFD] dark:bg-[#111722] text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFD] dark:bg-[#111722] text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Assign Lead Personnel / Volunteer
                </label>
                <select
                  value={editAssigneeId}
                  onChange={(e) => setEditAssigneeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFD] dark:bg-[#111722] text-slate-900 dark:text-slate-100"
                >
                  <option value="">Unassigned</option>
                  {personnel.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.role}) - ₱{p.hourly_rate}/hr
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-slate-200/80 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => handleDeleteTask(editingTask.id)}
                  className="px-3.5 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Task</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingTask(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#3E6CB5] hover:bg-[#325896] text-white font-semibold transition-all cursor-pointer shadow-xs"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
