import { api } from './api';

export interface EventRosterRow {
  id: string;
  event_id: string;
  event_title: string;
  attendee_id: string | null;
  attendee_name: string;
  attendee_email: string;
  ticket_type: string;
  qr_pass_code: string;
  status: 'confirmed' | 'checked_in' | 'cancelled';
  registered_at: string;
  check_in_time: string | null;
  integrity_warning: string | null;
}

export interface EventRosterSummary {
  total_count: number;
  registered_count: number;
  cancelled_count: number;
  checked_in_count: number;
  integrity_warning_count: number;
}

export interface RosterPage {
  data: EventRosterRow[];
  summary: EventRosterSummary;
  pagination: { limit: number; offset: number; total: number };
}

export class RosterRequestError extends Error {
  readonly status?: number;
  constructor(message: string, status?: number) { super(message); this.status = status; }
}

async function read<T>(url: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { credentials: 'same-origin' });
  } catch {
    throw new RosterRequestError('Cannot reach the registration API. Retry when connected.');
  }
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.success !== true) {
    throw new RosterRequestError(
      response.status === 401 ? 'Please sign in to view this event roster.' :
      response.status === 403 ? 'Your account is not authorized to view this event roster.' :
      payload?.error || 'The event roster could not be loaded.',
      response.status
    );
  }
  return payload as T;
}

export async function fetchEventRoster(eventId: string, limit = 50, offset = 0): Promise<RosterPage> {
  const payload = await read<RosterPage & { success: true }>(
    '/api/events/' + encodeURIComponent(eventId) + '/registrations?limit=' + limit + '&offset=' + offset
  );
  if (!Array.isArray(payload.data) || !payload.summary || !payload.pagination) {
    throw new RosterRequestError('The roster API returned an incomplete response.');
  }
  return payload;
}

export async function fetchEventRegistrationSummary(eventId: string): Promise<EventRosterSummary> {
  const payload = await read<{ success: true; data: EventRosterSummary }>(
    '/api/events/' + encodeURIComponent(eventId) + '/registration-summary'
  );
  if (!payload.data || typeof payload.data.registered_count !== 'number') {
    throw new RosterRequestError('The registration summary is incomplete.');
  }
  return payload.data;
}

export function announceAdmission(eventId: string): void {
  window.dispatchEvent(new CustomEvent('zabay:admission-updated', { detail: { eventId } }));
}

// In live mode never use the shared context's local fallback: a lost HTTP response
// is not proof of admission. The database is authoritative.
export async function admitLivePass(code: string, eventId: string): Promise<{ success: boolean; message: string; isDuplicate?: boolean; isWrongEvent?: boolean }> {
  const reply = await api.attendees.checkIn(code, eventId);
  if (reply.success && reply.data?.status === 'checked_in' && reply.data.event_id === eventId) {
    announceAdmission(eventId);
    return { success: true, message: 'Admission confirmed in PostgreSQL.' };
  }
  return { success: false, message: reply.error || 'Admission was not confirmed by the database.', isDuplicate: reply.code === 'DUPLICATE_CHECK_IN', isWrongEvent: reply.code === 'WRONG_EVENT' };
}
