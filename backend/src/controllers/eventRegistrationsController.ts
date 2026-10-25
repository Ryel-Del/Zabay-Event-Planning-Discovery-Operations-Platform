import { Request, Response, NextFunction } from 'express';
import { query } from '../config/db';
import { optionalOperator, trustedUserId } from '../middleware/auth';

// The account wallet and this operational roster deliberately have different scopes.
// Only an operator or the event's owner may read guest names and QR pass secrets.
export async function getEventRegistrations(req: Request, res: Response, next: NextFunction) {
  try {
    const eventId = req.params.id;
    if (typeof eventId !== 'string' || !eventId || eventId.length > 64) {
      return res.status(400).json({ success: false, error: 'Invalid event ID' });
    }

    const event = await query('SELECT organizer_id FROM events WHERE id = $1', [eventId]);
    if (!event.rows.length) return res.status(404).json({ success: false, error: 'Event not found' });
    if (!optionalOperator(req) && event.rows[0].organizer_id !== trustedUserId(req)) {
      return res.status(403).json({ success: false, code: 'FORBIDDEN', error: 'Event owner access required' });
    }

    const rawPage = req.query.page ?? '1';
    const rawLimit = req.query.limit ?? '50';
    if (typeof rawPage !== 'string' || !/^[1-9]\d*$/.test(rawPage) ||
        typeof rawLimit !== 'string' || !/^[1-9]\d*$/.test(rawLimit)) {
      return res.status(400).json({ success: false, error: 'Invalid pagination parameters' });
    }
    const page = Number(rawPage);
    const limit = Number(rawLimit);
    if (!Number.isSafeInteger(page) || !Number.isSafeInteger(limit) || limit > 100 ||
        (page - 1) * limit > 1000000) {
      return res.status(400).json({ success: false, error: 'Pagination limits exceeded' });
    }

    const summary = await query(
      `SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE status <> 'cancelled')::int AS registered,
          COUNT(*) FILTER (WHERE status = 'checked_in' AND admitted)::int AS checked_in,
          COUNT(*) FILTER (WHERE (status = 'checked_in') <> admitted)::int AS integrity_issues
        FROM (
          SELECT r.status, EXISTS (
            SELECT 1 FROM attendance_records a WHERE a.registration_id = r.id
          ) AS admitted
          FROM registrations r WHERE r.event_id = $1
        ) roster`,
      [eventId]
    );

    const roster = await query(
      `SELECT r.id, r.event_id, r.attendee_name, r.attendee_email, r.ticket_type,
              r.qr_pass_code, r.registered_at, r.status,
              EXISTS (SELECT 1 FROM attendance_records a WHERE a.registration_id = r.id)
                AS attendance_recorded
         FROM registrations r
         WHERE r.event_id = $1
         ORDER BY r.registered_at DESC, r.id DESC
         LIMIT $2 OFFSET $3`,
      [eventId, limit, (page - 1) * limit]
    );
    const stats = summary.rows[0];
    return res.json({
      success: true,
      data: {
        event_id: eventId,
        registrations: roster.rows,
        summary: {
          registered: stats.registered,
          checked_in: stats.checked_in,
          integrity_issues: stats.integrity_issues,
        },
        total: stats.total,
        page,
        limit,
        has_next: page * limit < stats.total,
      },
    });
  } catch (err) {
    next(err);
  }
}
