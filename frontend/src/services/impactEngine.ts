import type { Task } from '../types';

export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function minutesToTime(totalMins: number): string {
  const norm = Math.max(0, totalMins % (24 * 60));
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export interface DownstreamImpactResult {
  affectedTaskIds: string[];
  totalAffected: number;
}

export interface ScheduleImpactTask {
  id: string;
  title: string;
  newStart: string;
  newEnd: string;
  conflict: boolean;
}

export interface ScheduleImpactResult {
  affectedTasks: ScheduleImpactTask[];
  hasConflicts: boolean;
}

/**
 * Recursive Downstream Impact Tracing: mimics PostgreSQL CTE `fn_downstream_impact(task_id)`
 */
export function calculateDownstreamImpact(taskId: string, tasks: Task[]): DownstreamImpactResult {
  const visited = new Set<string>();

  const traverse = (currentId: string) => {
    const directDependents = tasks.filter((t) => t.dependencies.includes(currentId));
    for (const dep of directDependents) {
      if (!visited.has(dep.id)) {
        visited.add(dep.id);
        traverse(dep.id);
      }
    }
  };

  traverse(taskId);
  return {
    affectedTaskIds: Array.from(visited),
    totalAffected: visited.size,
  };
}

/**
 * Schedule Impact Propagation: mimics PostgreSQL `fn_schedule_impact(task_id, delay_minutes)`
 */
export function calculateScheduleImpact(
  taskId: string,
  delayMinutes: number,
  tasks: Task[]
): ScheduleImpactResult {
  const targetTask = tasks.find((t) => t.id === taskId);
  if (!targetTask) return { affectedTasks: [], hasConflicts: false };

  const { affectedTaskIds } = calculateDownstreamImpact(taskId, tasks);
  const affectedTasks: ScheduleImpactTask[] = [];
  let hasConflicts = false;

  const targetCurrentEndMins = timeToMinutes(targetTask.end_time);
  const targetNewEndMins = targetCurrentEndMins + delayMinutes;

  affectedTasks.push({
    id: targetTask.id,
    title: targetTask.title,
    newStart: targetTask.start_time,
    newEnd: minutesToTime(targetNewEndMins),
    conflict: delayMinutes > 60,
  });

  for (const id of affectedTaskIds) {
    const task = tasks.find((t) => t.id === id);
    if (!task) continue;

    const currentStartMins = timeToMinutes(task.start_time);
    const currentEndMins = timeToMinutes(task.end_time);
    const durationMins = currentEndMins - currentStartMins;

    const willConflict = currentStartMins < targetNewEndMins;
    if (willConflict) {
      hasConflicts = true;
    }

    const projectedStartMins = Math.max(currentStartMins, targetNewEndMins);
    const projectedEndMins = projectedStartMins + durationMins;

    affectedTasks.push({
      id: task.id,
      title: task.title,
      newStart: minutesToTime(projectedStartMins),
      newEnd: minutesToTime(projectedEndMins),
      conflict: willConflict,
    });
  }

  return { affectedTasks, hasConflicts };
}
