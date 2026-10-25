import type { Registration } from '../types';

export type EventRosterEntry = Pick<
  Registration,
  'id' | 'event_id' | 'attendee_name' | 'attendee_email' | 'ticket_type' |
  'qr_pass_code' | 'registered_at' | 'status'
> & { attendance_recorded: boolean };

export interface EventRosterSummary {
  registered: number;
  checked_in: number;
  integrity_issues: number;
}

export interface EventRosterPage {
  event_id: string;
  registrations: EventRosterEntry[];
  summary: EventRosterSummary;
  total: number;
  page: number;
  limit: number;
  has_next: boolean;
}

// Demo records never masquerade as backend data. They are computed only while
// the presentation's local demo workspace is explicitly active.
export function localEventRoster(eventId: string, registrations: Registration[], page: number, limit = 50): EventRosterPage {
  const rows = registrations.filter(row => row.event_id === eventId);
  return {
    event_id: eventId,
    registrations: rows.slice((page - 1) * limit, page * limit)
      .map(row => ({ ...row, attendance_recorded: row.status === 'checked_in' })),
    total: rows.length,
    page,
    limit,
    has_next: page * limit < rows.length,
    summary: {
      registered: rows.filter(row => row.status !== 'cancelled').length,
      checked_in: rows.filter(row => row.status === 'checked_in').length,
      integrity_issues: 0,
    },
  };
}
