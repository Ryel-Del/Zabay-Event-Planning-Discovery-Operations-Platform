import { useCallback, useEffect, useState } from 'react';
import { fetchEventRegistrationSummary, type EventRosterSummary } from '../services/eventRosterApi';

export function useEventRegistrationSummary(eventId: string | undefined, live: boolean) {
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<{
    eventId?: string; data: EventRosterSummary | null; loading: boolean; error: string | null;
  }>({ data: null, loading: false, error: null });
  const retry = useCallback(() => setRevision(value => value + 1), []);

  useEffect(() => {
    if (!eventId || !live) {
      setState({ eventId, data: null, loading: false, error: null });
      return;
    }
    let active = true;
    setState({ eventId, data: null, loading: true, error: null });
    fetchEventRegistrationSummary(eventId)
      .then(data => { if (active) setState({ eventId, data, loading: false, error: null }); })
      .catch(error => { if (active) setState({ eventId, data: null, loading: false, error: error instanceof Error ? error.message : 'Admission summary unavailable.' }); });
    return () => { active = false; };
  }, [eventId, live, revision]);

  useEffect(() => {
    const onAdmission = (event: Event) => {
      if ((event as CustomEvent<{ eventId: string }>).detail?.eventId === eventId) retry();
    };
    window.addEventListener('zabay:admission-updated', onAdmission);
    return () => window.removeEventListener('zabay:admission-updated', onAdmission);
  }, [eventId, retry]);

  return state.eventId === eventId ? { ...state, retry } : { data: null, loading: true, error: null, retry };
}
