import React, { useState, useMemo } from 'react';
import {
  CheckSquare,
  Plus,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Check,
  Edit3,
  Trash2,
  Users,
  Calendar,
  AlertCircle,
  LayoutGrid,
  List,
  UserCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Task, TaskStatus, TaskPriority, TaskTrack, TaskCommittee } from '../../types';
import { WorkflowKitCatalogModal } from './WorkflowKitCatalogModal';

interface TaskKanbanBoardProps {
  onNavigateToPeople?: () => void;
}

type BoardViewMode = 'board' | 'list' | 'my_tasks' | 'unassigned';

export const TaskKanbanBoard: React.FC<TaskKanbanBoardProps> = ({ onNavigateToPeople }) => {
  const {
    tasks,
    workflowKits,
    currentUser,
    updateTaskStatus,
    updateTask,
    deleteTask,
    addTask,
    loadTaskTemplate,
    resetTasksToDefault,
    personnel,
  } = useApp();

  // View mode and filters
  const [viewMode, setViewMode] = useState<BoardViewMode>('board');
  const [committeeFilter, setCommitteeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [milestoneFilter, setMilestoneFilter] = useState<string>('all');
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [activeTemplateFeedback, setActiveTemplateFeedback] = useState<string | null>(null);

  // Expandable card and edit modal state
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Edit task form state
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState<TaskPriority>('medium');
  const [editTrack, setEditTrack] = useState<TaskTrack>('venue_logistics');
  const [editCommittee, setEditCommittee] = useState<TaskCommittee>('general');
  const [editMilestone, setEditMilestone] = useState('');
  const [editStatus, setEditStatus] = useState<TaskStatus>('todo');
  const [editStartTime, setEditStartTime] = useState('09:00');
  const [editEndTime, setEditEndTime] = useState('11:00');
  const [editDueDate, setEditDueDate] = useState('2026-11-12');
  const [editAssigneeName, setEditAssigneeName] = useState('');

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium');
  const [newTrack] = useState<TaskTrack>('venue_logistics');
  const [newCommittee, setNewCommittee] = useState<TaskCommittee>('general');
  const [newMilestone, setNewMilestone] = useState('');
  const [newStartTime, setNewStartTime] = useState('09:00');
  const [newEndTime, setNewEndTime] = useState('11:00');
  const [newDueDate, setNewDueDate] = useState('2026-11-12');
  const [newAssigneeName, setNewAssigneeName] = useState('');

  const columns: { id: TaskStatus; title: string; color: string; dotColor: string }[] = [
    { id: 'todo', title: 'To Do', color: 'border-slate-200 dark:border-slate-800', dotColor: 'bg-slate-400' },
    { id: 'in_progress', title: 'In Progress', color: 'border-[#C8DCF7] dark:border-[#2D4160]', dotColor: 'bg-[#3E6CB5]' },
    { id: 'for_review', title: 'For Review', color: 'border-amber-200 dark:border-amber-800/80', dotColor: 'bg-amber-500' },
    { id: 'completed', title: 'Completed', color: 'border-[#C1E6D3] dark:border-[#234232]', dotColor: 'bg-[#2B6149]' },
    { id: 'blocked', title: 'Blocked', color: 'border-[#F7D8D3] dark:border-[#52251F]', dotColor: 'bg-[#C45547]' },
  ];

  // Distinct milestones from current task set
  const distinctMilestones = useMemo(() => {
    const list = tasks.map((t) => t.milestone).filter(Boolean) as string[];
    return Array.from(new Set(list));
  }, [tasks]);

  // Unique names from personnel & currentUser
  const candidateAssignees = useMemo(() => {
    return Array.from(new Set([currentUser.name, ...personnel.map((p) => p.name)]));
  }, [currentUser, personnel]);

  // Filter tasks based on view mode and filters
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // View Mode constraints
      if (viewMode === 'my_tasks') {
        const hasMe = t.personnel_assignments?.some(
          (a) => a.personnel_name.toLowerCase() === currentUser.name.toLowerCase()
        );
        if (!hasMe) return false;
      }

      if (viewMode === 'unassigned') {
        const isUnassigned = !t.personnel_assignments || t.personnel_assignments.length === 0;
        if (!isUnassigned) return false;
      }

      // Committee filter
      if (committeeFilter !== 'all') {
        const comm = t.committee ? String(t.committee).toLowerCase() : '';
        if (comm !== committeeFilter.toLowerCase()) return false;
      }

      // Priority filter
      if (priorityFilter !== 'all') {
        if (t.priority !== priorityFilter) return false;
      }

      // Milestone filter
      if (milestoneFilter !== 'all') {
        if (t.milestone !== milestoneFilter) return false;
      }

      return true;
    });
  }, [tasks, viewMode, committeeFilter, priorityFilter, milestoneFilter, currentUser]);

  const handleApplyKit = (kitId: string, kitName: string) => {
    loadTaskTemplate(kitId);
    setActiveTemplateFeedback(`Loaded "${kitName}"! All tasks initialized in To Do state.`);
    setTimeout(() => setActiveTemplateFeedback(null), 4500);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    addTask({
      event_id: 'evt-1',
      title: newTitle.trim(),
      description: newDescription.trim() || 'Custom operational task.',
      status: 'todo',
      priority: newPriority,
      track: newTrack,
      committee: newCommittee,
      milestone: newMilestone.trim() || undefined,
      start_time: newStartTime,
      end_time: newEndTime,
      due_date: newDueDate,
      dependencies: [],
      personnel_assignments: newAssigneeName.trim()
        ? [
            {
              personnel_id: `per-${newAssigneeName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
              personnel_name: newAssigneeName.trim(),
              role: 'Assigned Member',
            },
          ]
        : [],
      resource_assignments: [],
      downstream_impact_count: 0,
    });

    setNewTitle('');
    setNewDescription('');
    setNewMilestone('');
    setNewAssigneeName('');
    setIsAddModalOpen(false);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description);
    setEditPriority(task.priority);
    setEditTrack(task.track || 'venue_logistics');
    setEditCommittee((task.committee as TaskCommittee) || 'general');
    setEditMilestone(task.milestone || '');
    setEditStatus(task.status);
    setEditStartTime(task.start_time);
    setEditEndTime(task.end_time);
    setEditDueDate(task.due_date || '2026-11-12');
    setEditAssigneeName(task.personnel_assignments[0]?.personnel_name || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !editTitle.trim()) return;

    updateTask(editingTask.id, {
      title: editTitle.trim(),
      description: editDescription.trim(),
      priority: editPriority,
      track: editTrack,
      committee: editCommittee,
      milestone: editMilestone.trim() || undefined,
      status: editStatus,
      start_time: editStartTime,
      end_time: editEndTime,
      due_date: editDueDate,
      personnel_assignments: editAssigneeName.trim()
        ? [
            {
              personnel_id: `per-${editAssigneeName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
              personnel_name: editAssigneeName.trim(),
              role: 'Assigned Member',
            },
          ]
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

  const getCommitteeBadge = (comm?: string) => {
    switch (comm) {
      case 'letters':
        return { label: 'Letters & Permits', bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' };
      case 'finance':
        return { label: 'Finance', bg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800' };
      case 'logistics':
        return { label: 'Logistics', bg: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' };
      case 'documentation':
        return { label: 'Documentation', bg: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800' };
      case 'publicity':
        return { label: 'Publicity', bg: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800' };
      case 'program':
        return { label: 'Program', bg: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-800' };
      case 'security':
        return { label: 'Security & Safety', bg: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border-red-200 dark:border-red-800' };
      default:
        return { label: 'General', bg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700' };
    }
  };

  const moveTask = (taskId: string, currentStatus: TaskStatus, direction: 'prev' | 'next') => {
    const order: TaskStatus[] = ['todo', 'in_progress', 'for_review', 'completed', 'blocked'];
    const currentIndex = order.indexOf(currentStatus);
    const targetIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (targetIndex >= 0 && targetIndex < order.length) {
      updateTaskStatus(taskId, order[targetIndex]);
    }
  };

  const popularKits = workflowKits.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* 1-Click Workflow Kits Top Bar */}
      <div className="bg-white dark:bg-[#171E2B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#EBF3FC] dark:bg-[#1E293B] text-[#3E6CB5] dark:text-[#7EA6E0]">
                <Sparkles className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Event Workflow Kits & Planning Templates
              </h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-[#EDF7F2] text-[#2B6149] dark:bg-[#17271F] dark:text-[#81B89B]">
                To Do Initialized
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Apply standard event workflows. Tasks always start in <strong>To Do</strong> and propagate automatically to assigned committee heads.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setIsCatalogOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3E6CB5] hover:bg-[#325896] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Browse All {workflowKits.length} Kits</span>
            </button>

            {onNavigateToPeople && (
              <button
                onClick={onNavigateToPeople}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                title="Open Committee & People Assignments"
              >
                <Users className="w-3.5 h-3.5 text-[#3E6CB5]" />
                <span className="hidden md:inline">Assign People</span>
              </button>
            )}

            <button
              onClick={resetTasksToDefault}
              className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Reset tasks to initial state"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Quick Pick Kits Carousel / Badges */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-1">
          <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap">
            Popular Kits:
          </span>
          {popularKits.map((kit) => (
            <button
              key={kit.id}
              onClick={() => handleApplyKit(kit.id, kit.name)}
              className="text-xs px-3 py-1 rounded-xl font-medium bg-[#F8FAFD] dark:bg-[#111722] hover:bg-[#EBF3FC] dark:hover:bg-[#1E293B] text-slate-700 dark:text-slate-300 hover:text-[#244A85] dark:hover:text-[#8BB0E8] border border-slate-200/80 dark:border-slate-800 hover:border-[#C8DCF7] dark:hover:border-[#2D4160] whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>{kit.name.split(' Kit')[0]}</span>
              <ArrowRight className="w-3 h-3 opacity-60" />
            </button>
          ))}
        </div>

        {activeTemplateFeedback && (
          <div className="p-3 rounded-xl text-xs bg-[#EDF7F2] dark:bg-[#17271F] border border-[#BDE3CF] dark:border-[#234232] text-[#2B6149] dark:text-[#81B89B] flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 shrink-0" />
            <span>{activeTemplateFeedback}</span>
          </div>
        )}
      </div>

      {/* Practical Views Toolbar & Filters */}
      <div className="bg-white dark:bg-[#171E2B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 transition-colors">
        {/* Left: View Tabs */}
        <div className="flex items-center gap-1 bg-[#FAF9F5] dark:bg-[#111722] p-1 rounded-xl border border-slate-100 dark:border-slate-800/80">
          <button
            onClick={() => setViewMode('board')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'board'
                ? 'bg-white dark:bg-[#171E2B] text-[#244A85] dark:text-[#8BB0E8] shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Kanban Board</span>
          </button>

          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'list'
                ? 'bg-white dark:bg-[#171E2B] text-[#244A85] dark:text-[#8BB0E8] shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>List View</span>
          </button>

          <button
            onClick={() => setViewMode('my_tasks')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'my_tasks'
                ? 'bg-white dark:bg-[#171E2B] text-[#244A85] dark:text-[#8BB0E8] shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>My Tasks</span>
          </button>

          <button
            onClick={() => setViewMode('unassigned')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'unassigned'
                ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-amber-700'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Unassigned ({tasks.filter((t) => !t.personnel_assignments || t.personnel_assignments.length === 0).length})</span>
          </button>
        </div>

        {/* Right: Practical Dropdown Filters & Add Button */}
        <div className="flex items-center flex-wrap gap-2 w-full lg:w-auto">
          {/* Committee Filter */}
          <select
            value={committeeFilter}
            onChange={(e) => setCommitteeFilter(e.target.value)}
            className="bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="all">All Committees</option>
            <option value="letters">Letters & Permits</option>
            <option value="finance">Finance</option>
            <option value="logistics">Logistics & Venue</option>
            <option value="documentation">Documentation</option>
            <option value="publicity">Publicity</option>
            <option value="program">Program Flow</option>
            <option value="security">Security & Safety</option>
            <option value="general">General</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Milestone Filter */}
          {distinctMilestones.length > 0 && (
            <select
              value={milestoneFilter}
              onChange={(e) => setMilestoneFilter(e.target.value)}
              className="bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer max-w-[160px] truncate"
            >
              <option value="all">All Milestones</option>
              {distinctMilestones.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#3E6CB5] hover:bg-[#325896] text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer ml-auto lg:ml-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: 5-COLUMN KANBAN BOARD */}
      {viewMode === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {columns.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.id);

            return (
              <div
                key={col.id}
                className={`bg-white dark:bg-[#171E2B] border rounded-2xl p-3.5 shadow-xs flex flex-col min-h-[500px] transition-colors ${col.color}`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      {col.title}
                    </h4>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                    {colTasks.length}
                  </span>
                </div>

                {/* Cards List */}
                <div className="space-y-2.5 flex-1 overflow-y-auto pr-0.5">
                  {colTasks.length === 0 ? (
                    <div className="h-28 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-xs text-slate-400 text-center p-3">
                      No tasks in this lane
                    </div>
                  ) : (
                    colTasks.map((task) => {
                      const commBadge = getCommitteeBadge(task.committee);
                      const isExpanded = expandedTaskId === task.id;
                      const hasAssignee =
                        task.personnel_assignments && task.personnel_assignments.length > 0;

                      return (
                        <div
                          key={task.id}
                          onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                          className={`p-3 rounded-xl border bg-[#F8FAFD] dark:bg-[#111722] transition-all space-y-2 shadow-xs cursor-pointer ${
                            isExpanded
                              ? 'ring-2 ring-[#3E6CB5]/60 border-[#3E6CB5] bg-white dark:bg-[#141B27]'
                              : task.has_conflict
                              ? 'border-[#F5C2BC] dark:border-[#52251F]'
                              : 'border-slate-200/90 dark:border-slate-800 hover:border-[#86ABDF] dark:hover:border-[#3E6CB5]'
                          }`}
                        >
                          {/* Badges Row */}
                          <div className="flex items-center justify-between gap-1 flex-wrap">
                            <span
                              className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${getPriorityBadge(
                                task.priority
                              )}`}
                            >
                              {task.priority}
                            </span>

                            <span
                              className={`text-[9px] font-medium px-1.5 py-0.5 rounded border ${commBadge.bg}`}
                            >
                              {commBadge.label}
                            </span>
                          </div>

                          {/* Title */}
                          <h5
                            className={`text-xs font-bold leading-snug ${
                              task.status === 'completed'
                                ? 'line-through text-slate-400 dark:text-slate-500'
                                : 'text-slate-900 dark:text-slate-100'
                            }`}
                          >
                            {task.title}
                          </h5>

                          {/* Milestone Tag */}
                          {task.milestone && (
                            <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                              <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{task.milestone}</span>
                            </div>
                          )}

                          {/* Assignee Indicator */}
                          <div className="pt-1 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                            {hasAssignee ? (
                              <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-semibold truncate">
                                <span className="w-4 h-4 rounded-full bg-[#EBF3FC] text-[#244A85] text-[9px] flex items-center justify-center font-bold shrink-0">
                                  {task.personnel_assignments[0].personnel_name.charAt(0)}
                                </span>
                                <span className="truncate">
                                  {task.personnel_assignments[0].personnel_name}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                Unassigned
                              </span>
                            )}

                            <span className="text-[10px] text-slate-400 font-mono">
                              {task.due_date ? task.due_date.slice(5) : ''}
                            </span>
                          </div>

                          {/* Expanded View */}
                          {isExpanded && (
                            <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 space-y-2 text-xs animate-in fade-in">
                              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                                {task.description}
                              </p>

                              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteTask(task.id);
                                  }}
                                  className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" /> Delete
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditModal(task);
                                  }}
                                  className="text-[11px] text-[#3E6CB5] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <Edit3 className="w-3 h-3" /> Edit Task
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Quick Stage Mover Controls */}
                          <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/60">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                moveTask(task.id, task.status, 'prev');
                              }}
                              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                              title="Move back"
                            >
                              <ArrowLeft className="w-3 h-3" />
                            </button>

                            <select
                              value={task.status}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) =>
                                updateTaskStatus(task.id, e.target.value as TaskStatus)
                              }
                              className="text-[10px] bg-transparent text-slate-500 font-semibold focus:outline-none cursor-pointer"
                            >
                              <option value="todo">To Do</option>
                              <option value="in_progress">In Progress</option>
                              <option value="for_review">For Review</option>
                              <option value="completed">Completed</option>
                              <option value="blocked">Blocked</option>
                            </select>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                moveTask(task.id, task.status, 'next');
                              }}
                              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                              title="Move forward"
                            >
                              <ArrowRight className="w-3 h-3" />
                            </button>
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
      )}

      {/* VIEW 2 / 3 / 4: LINEAR LIST VIEW */}
      {viewMode !== 'board' && (
        <div className="bg-white dark:bg-[#171E2B] border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F5] dark:bg-[#12161F] text-slate-500 border-b border-slate-200/80 dark:border-slate-800 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3.5 pl-4">Status</th>
                  <th className="p-3.5">Task Title & Details</th>
                  <th className="p-3.5">Committee</th>
                  <th className="p-3.5">Milestone</th>
                  <th className="p-3.5">Assigned Person</th>
                  <th className="p-3.5">Priority</th>
                  <th className="p-3.5">Due Date</th>
                  <th className="p-3.5 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-xs text-slate-400">
                      No tasks found matching the selected view and filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task) => {
                    const commBadge = getCommitteeBadge(task.committee);
                    const hasAssignee =
                      task.personnel_assignments && task.personnel_assignments.length > 0;

                    return (
                      <tr
                        key={task.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors"
                      >
                        <td className="p-3.5 pl-4">
                          <select
                            value={task.status}
                            onChange={(e) =>
                              updateTaskStatus(task.id, e.target.value as TaskStatus)
                            }
                            className="bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                          >
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="for_review">For Review</option>
                            <option value="completed">Completed</option>
                            <option value="blocked">Blocked</option>
                          </select>
                        </td>

                        <td className="p-3.5 max-w-xs">
                          <div className="font-bold text-slate-900 dark:text-slate-100 leading-tight">
                            {task.title}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                            {task.description}
                          </div>
                        </td>

                        <td className="p-3.5">
                          <span
                            className={`text-[10px] font-medium px-2 py-0.5 rounded border ${commBadge.bg}`}
                          >
                            {commBadge.label}
                          </span>
                        </td>

                        <td className="p-3.5 text-slate-600 dark:text-slate-300">
                          {task.milestone || '—'}
                        </td>

                        <td className="p-3.5">
                          {hasAssignee ? (
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                              {task.personnel_assignments[0].personnel_name}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              Unassigned
                            </span>
                          )}
                        </td>

                        <td className="p-3.5">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${getPriorityBadge(
                              task.priority
                            )}`}
                          >
                            {task.priority}
                          </span>
                        </td>

                        <td className="p-3.5 font-mono text-slate-500 text-[11px]">
                          {task.due_date || '2026-11-12'}
                        </td>

                        <td className="p-3.5 pr-4 text-right space-x-2">
                          <button
                            onClick={() => openEditModal(task)}
                            className="text-[#3E6CB5] hover:underline font-semibold cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-rose-600 hover:underline font-semibold cursor-pointer"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Workflow Kit Catalog Modal */}
      <WorkflowKitCatalogModal
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        onKitApplied={(name) => {
          setActiveTemplateFeedback(`Loaded "${name}"! All tasks configured in To Do state.`);
          setTimeout(() => setActiveTemplateFeedback(null), 4500);
        }}
      />

      {/* Add Task Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#171E2B] border border-slate-200/80 dark:border-slate-800 rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto p-4 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-[#3E6CB5] dark:text-[#7EA6E0]" />
                Add New Event Task
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Draft Letter of Request to City Mayor"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFD] dark:bg-[#111722] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3E6CB5]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Operational Scope
                </label>
                <textarea
                  rows={2}
                  placeholder="Detailed breakdown of duties..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFD] dark:bg-[#111722] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3E6CB5]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Responsible Committee
                  </label>
                  <select
                    value={newCommittee}
                    onChange={(e) => setNewCommittee(e.target.value as TaskCommittee)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFD] dark:bg-[#111722] text-slate-900 dark:text-slate-100"
                  >
                    <option value="letters">Letters & Permits</option>
                    <option value="finance">Finance</option>
                    <option value="logistics">Logistics & Venue</option>
                    <option value="documentation">Documentation</option>
                    <option value="publicity">Publicity</option>
                    <option value="program">Program Flow</option>
                    <option value="security">Security & Safety</option>
                    <option value="general">General</option>
                  </select>
                </div>

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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Related Milestone (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Venue Confirmed"
                    value={newMilestone}
                    onChange={(e) => setNewMilestone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFD] dark:bg-[#111722] text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Assigned Person (Optional)
                  </label>
                  <select
                    value={newAssigneeName}
                    onChange={(e) => setNewAssigneeName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFD] dark:bg-[#111722] text-slate-900 dark:text-slate-100"
                  >
                    <option value="">— Unassigned —</option>
                    {candidateAssignees.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
              </div>

              <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#3E6CB5] hover:bg-[#325896] text-white rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#171E2B] border border-slate-200/80 dark:border-slate-800 rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto p-4 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#3E6CB5]" />
                Edit Task Details
              </h3>
              <button
                onClick={() => setEditingTask(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFD] dark:bg-[#111722] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3E6CB5]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFD] dark:bg-[#111722] text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as TaskStatus)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFD] dark:bg-[#111722] text-slate-900 dark:text-slate-100"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="for_review">For Review</option>
                    <option value="completed">Completed</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFD] dark:bg-[#111722] text-slate-900 dark:text-slate-100"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Committee
                  </label>
                  <select
                    value={editCommittee}
                    onChange={(e) => setEditCommittee(e.target.value as TaskCommittee)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFD] dark:bg-[#111722] text-slate-900 dark:text-slate-100"
                  >
                    <option value="letters">Letters & Permits</option>
                    <option value="finance">Finance</option>
                    <option value="logistics">Logistics & Venue</option>
                    <option value="documentation">Documentation</option>
                    <option value="publicity">Publicity</option>
                    <option value="program">Program Flow</option>
                    <option value="security">Security & Safety</option>
                    <option value="general">General</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Assigned Person
                  </label>
                  <select
                    value={editAssigneeName}
                    onChange={(e) => setEditAssigneeName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFD] dark:bg-[#111722] text-slate-900 dark:text-slate-100"
                  >
                    <option value="">— Unassigned —</option>
                    {candidateAssignees.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#3E6CB5] hover:bg-[#325896] text-white rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
