import { useCallback, useEffect, useState } from 'react';
import { fetchEventRoster, type RosterPage } from '../services/eventRosterApi';

type RosterState = {
  eventId: string | null;
  loading: boolean;
  error: string | null;
  page: RosterPage | null;
};

export function useEventRoster(eventId: string | undefined, live: boolean) {
  const [offset, setOffset] = useState(0);
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<RosterState>({ eventId: null, loading: false, error: null, page: null });

  useEffect(() => { setOffset(0); }, [eventId]);
  const retry = useCallback(() => setRevision(value => value + 1), []);

  useEffect(() => {
    if (!eventId || !live) {
      setState({ eventId: eventId || null, loading: false, error: null, page: null });
      return;
    }
    let active = true;
    setState({ eventId, loading: true, error: null, page: null });
    fetchEventRoster(eventId, 50, offset)
      .then(page => { if (active) setState({ eventId, loading: false, error: null, page }); })
      .catch(error => { if (active) setState({ eventId, loading: false, error: error instanceof Error ? error.message : 'Roster unavailable.', page: null }); });
    return () => { active = false; };
  }, [eventId, live, offset, revision]);

  useEffect(() => {
    const onAdmission = (event: Event) => {
      if ((event as CustomEvent<{ eventId: string }>).detail?.eventId === eventId) retry();
    };
    window.addEventListener('zabay:admission-updated', onAdmission);
    return () => window.removeEventListener('zabay:admission-updated', onAdmission);
  }, [eventId, retry]);

  const current = state.eventId === eventId ? state : { eventId, loading: true, error: null, page: null };
  return { ...current, offset, setOffset, retry };
}
