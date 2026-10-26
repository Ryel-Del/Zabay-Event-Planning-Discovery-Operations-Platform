import { Request, Response, NextFunction } from 'express';
import { query } from '../config/db';
import { optionalOperator, trustedUserId } from '../middleware/auth';

// The organizer's event roster is deliberately separate from the personal pass wallet.
// All authorization happens before reading registration names, email, or pass codes.
type EventAccess = { id: string; title: string; organizer_id: string };

async function authorizedEvent(req: Request, res: Response): Promise<EventAccess | null> {
  const id = req.params.id;
  if (typeof id !== 'string' || !id || id.length > 64) {
    res.status(400).json({ success: false, error: 'Invalid event ID' });
    return null;
  }
  const event = await query('SELECT id, title, organizer_id FROM events WHERE id = $1', [id]);
  if (!event.rows[0]) {
    res.status(404).json({ success: false, error: 'Event not found' });
    return null;
  }
  if (!optionalOperator(req) && event.rows[0].organizer_id !== trustedUserId(req)) {
    res.status(403).json({ success: false, error: 'You cannot view this event roster', code: 'FORBIDDEN' });
    return null;
  }
  return event.rows[0];
}

const attendanceJoin = ' LEFT JOIN attendance_records a ON a.registration_id = r.id';
const integrityCase =
  "CASE WHEN a.id IS NOT NULL AND a.event_id <> r.event_id THEN 'attendance_event_mismatch' " +
  "WHEN r.status = 'checked_in' AND a.id IS NULL THEN 'missing_attendance' " +
  "WHEN r.status <> 'checked_in' AND a.id IS NOT NULL THEN 'attendance_status_mismatch' " +
  'ELSE NULL END';

async function registrationSummary(eventId: string) {
  const summary = await query(
    'SELECT COUNT(*)::int AS total_count, ' +
    "COUNT(*) FILTER (WHERE r.status <> 'cancelled')::int AS registered_count, " +
    "COUNT(*) FILTER (WHERE r.status = 'cancelled')::int AS cancelled_count, " +
    "COUNT(*) FILTER (WHERE r.status = 'checked_in' AND a.id IS NOT NULL AND a.event_id = r.event_id)::int AS checked_in_count, " +
    'COUNT(*) FILTER (WHERE ' + integrityCase + ' IS NOT NULL)::int AS integrity_warning_count ' +
    'FROM registrations r' + attendanceJoin + ' WHERE r.event_id = $1',
    [eventId]
  );
  return summary.rows[0];
}

function pageNumber(value: unknown, fallback: number, upper: number): number | null {
  if (value === undefined) return fallback;
  if (typeof value !== 'string' || !/^(0|[1-9][0-9]*)$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed <= upper ? parsed : null;
}

export async function getEventRegistrationRoster(req: Request, res: Response, next: NextFunction) {
  try {
    const event = await authorizedEvent(req, res);
    if (!event) return;
    const limit = pageNumber(req.query.limit, 50, 100);
    const offset = pageNumber(req.query.offset, 0, 100000);
    if (limit === null || limit < 1 || offset === null) {
      return res.status(400).json({ success: false, error: 'Invalid roster pagination' });
    }
    const [list, summary] = await Promise.all([
      query(
        'SELECT r.id, r.event_id, r.attendee_id, r.attendee_name, r.attendee_email, ' +
        'r.ticket_type, r.qr_pass_code, r.status, r.registered_at, ' +
        'a.check_in_time, ' + integrityCase + ' AS integrity_warning ' +
        'FROM registrations r' + attendanceJoin + ' WHERE r.event_id = $1 ' +
        'ORDER BY r.registered_at DESC, r.id DESC LIMIT $2 OFFSET $3',
        [event.id, limit, offset]
      ),
      registrationSummary(event.id)
    ]);
    return res.json({
      success: true,
      data: list.rows.map(row => ({ ...row, event_title: event.title })),
      pagination: { limit, offset, total: summary.total_count },
      summary,
    });
  } catch (error) {
    next(error);
  }
}

export async function getEventRegistrationSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const event = await authorizedEvent(req, res);
    if (!event) return;
    return res.json({ success: true, data: await registrationSummary(event.id) });
  } catch (error) {
    next(error);
  }
}
