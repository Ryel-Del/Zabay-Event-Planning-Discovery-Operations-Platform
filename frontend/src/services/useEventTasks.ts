import { useCallback, useEffect, useState } from 'react';
import type { Task } from '../types';
import { api } from './api';

// Live operational tasks must be read from the selected event's protected
// PostgreSQL endpoint. Browser-local tasks are only used in explicit Demo Mode.
export function useEventTasks(eventId: string | undefined, isDemo: boolean, isLive: boolean, local: Task[]) {
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{ eventId: string; tasks: Task[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(() => setRevision(value => value + 1), []);

  useEffect(() => {
    setResult(null);
    setError(null);
    if (!eventId || isDemo) { setLoading(false); return; }
    if (!isLive) {
      setLoading(false);
      setError('The task service is unavailable. No persistent task count was verified.');
      return;
    }
    let active = true;
    setLoading(true);
    api.tasks.getAll(eventId).then(response => {
      if (!active) return;
      if (!response.success || !response.data) {
        setError(response.error || 'Could not load event tasks.');
        return;
      }
      setResult({ eventId, tasks: response.data.filter(task => task.event_id === eventId) });
    }).catch(() => {
      if (active) setError('Could not connect to the task service.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [eventId, isDemo, isLive, revision]);

  const data = isDemo
    ? local.filter(task => task.event_id === eventId)
    : result !== null && result.eventId === eventId ? result.tasks : null;
  return { data, loading, error, refresh };
}
