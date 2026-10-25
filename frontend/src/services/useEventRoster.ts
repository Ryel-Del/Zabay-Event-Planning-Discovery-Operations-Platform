import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from './api';
import type { Registration } from '../types';
import { localEventRoster, type EventRosterPage } from './eventRoster';

// The personal wallet in AppContext must never be used as the authoritative
// roster for a live event. Switching events drops previous event data first.
export function useEventRoster(
  eventId: string | undefined,
  isDemoMode: boolean,
  isLiveBackend: boolean,
  wallet: Registration[],
) {
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [remote, setRemote] = useState<{ eventId: string; page: number; data: EventRosterPage } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(() => setRevision(n => n + 1), []);

  useEffect(() => { setPage(1); }, [eventId, isDemoMode]);

  useEffect(() => {
    setRemote(null);
    setError(null);
    if (!eventId || isDemoMode) {
      setLoading(false);
      return;
    }
    if (!isLiveBackend) {
      setLoading(false);
      setError('The server is unavailable. The event roster could not be loaded.');
      return;
    }
    let active = true;
    setLoading(true);
    api.events.registrations(eventId, page).then(result => {
      if (!active) return;
      if (!result.success || !result.data || result.data.event_id !== eventId) {
        setError(result.error || 'Could not retrieve the event roster.');
        return;
      }
      setRemote({ eventId, page, data: result.data });
    }).catch(() => {
      if (active) setError('Network error. No event roster was loaded.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [eventId, isDemoMode, isLiveBackend, page, revision]);

  // Gate scans may happen from the separate scanner modal. Refresh this event
  // only after that scanner has received a confirmed success from the server.
  useEffect(() => {
    const onAdmission = (event: Event) => {
      const id = (event as CustomEvent<{ eventId: string }>).detail?.eventId;
      if (id && id === eventId) refresh();
    };
    window.addEventListener('zabay:admission-confirmed', onAdmission);
    return () => window.removeEventListener('zabay:admission-confirmed', onAdmission);
  }, [eventId, refresh]);

  const demo = useMemo(
    () => isDemoMode && eventId ? localEventRoster(eventId, wallet, page) : null,
    [isDemoMode, eventId, wallet, page],
  );
  const data = demo ?? (remote !== null && remote.eventId === eventId && remote.page === page ? remote.data : null);
  return { data, loading, error, page, setPage, refresh, isDemo: isDemoMode };
}
