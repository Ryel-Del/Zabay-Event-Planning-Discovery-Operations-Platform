import { randomBytes, randomUUID } from 'node:crypto';
import { Request, Response, NextFunction } from 'express';
import { PoolClient } from 'pg';
import { pool, query } from '../config/db';
import { authenticatedUserId, trustedUserId } from '../middleware/auth';

export async function registerForEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const { event_id, attendee_name, attendee_email, ticket_type } = req.body || {};
    if (typeof event_id !== 'string' || !event_id.trim() ||
        typeof attendee_name !== 'string' || !attendee_name.trim() || attendee_name.trim().length > 255 ||
        typeof attendee_email !== 'string' || attendee_email.trim().length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(attendee_email.trim()) ||
        typeof ticket_type !== 'string' || !['General Admission', 'VIP Access'].includes(ticket_type.trim())) {
      return res.status(400).json({
        success: false,
        error: 'event_id, attendee_name, valid attendee_email, and ticket_type are required',
      });
    }

    const event = await query("SELECT id FROM events WHERE id = $1 AND is_private = false AND event_type = 'public' AND status != $2", [event_id.trim(), 'cancelled']);
    if (event.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }

    const result = await query(
      `INSERT INTO registrations
       (id, event_id, attendee_id, attendee_name, attendee_email, status, ticket_type, qr_pass_code, amount_paid)
       VALUES ($1, $2, $3, $4, $5, 'confirmed', $6, $7, 0)
       RETURNING *`,
      [
        `reg-${randomUUID()}`,
        event_id.trim(),
        req.body?.registration_mode === 'guest' ? null : authenticatedUserId(req),
        attendee_name.trim(),
        attendee_email.trim().toLowerCase(),
        ticket_type.trim(),
        `ZABAY-${randomBytes(18).toString('hex').toUpperCase()}`,
      ]
    );
    return res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Registration saved. Digital QR pass generated. No payment was collected.',
    });
  } catch (err) {
    next(err);
  }
}

export async function getMyRegistrations(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await query(
      `SELECT r.*, e.title AS event_title
       FROM registrations r JOIN events e ON e.id = r.event_id
       WHERE r.attendee_id = $1 ORDER BY r.registered_at DESC, r.id DESC`,
      [authenticatedUserId(req)]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
}

export async function checkInAttendee(req: Request, res: Response, next: NextFunction) {
  const { qr_pass_code, event_id } = req.body || {};
  if (typeof qr_pass_code !== 'string' || !qr_pass_code.trim() || qr_pass_code.trim().length > 64) {
    return res.status(400).json({ success: false, error: 'qr_pass_code is required' });
  }
  if (event_id !== undefined && (typeof event_id !== 'string' || !event_id.trim())) {
    return res.status(400).json({ success: false, error: 'event_id must be a non-empty string' });
  }

  let client: PoolClient | undefined;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    const regResult = await client.query(
      'SELECT * FROM registrations WHERE UPPER(qr_pass_code) = UPPER($1) FOR UPDATE',
      [qr_pass_code.trim()]
    );
    if (regResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Invalid QR pass code.' });
    }

    const registration = regResult.rows[0];
    const actorId = trustedUserId(req);
    if (actorId) {
      const ownership = await client.query('SELECT organizer_id FROM events WHERE id = $1', [registration.event_id]);
      if (ownership.rows[0]?.organizer_id !== actorId) {
        await client.query('ROLLBACK');
        return res.status(403).json({ success: false, error: 'Event owner access required' });
      }
    }

    // Enforce Event Match: Reject ticket if scanned for the wrong event
    if (event_id && registration.event_id !== event_id.trim()) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        code: 'WRONG_EVENT',
        isWrongEvent: true,
        error: `WRONG EVENT PASS: Ticket is registered for event '${registration.event_id}', not '${event_id.trim()}'. Admission denied.`,
      });
    }

    if (registration.status === 'cancelled') {
      await client.query('ROLLBACK');
      return res.status(409).json({ success: false, code: 'CANCELLED_REGISTRATION', error: 'This registration was cancelled.' });
    }
    const previousAttendance = await client.query(
      'SELECT id FROM attendance_records WHERE registration_id = $1', [registration.id]
    );
    if (registration.status === 'checked_in' || previousAttendance.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ success: false, code: 'DUPLICATE_CHECK_IN', isDuplicate: true, error: 'This pass has already been checked in.' });
    }

    const updateResult = await client.query(
      "UPDATE registrations SET status = 'checked_in' WHERE id = $1 RETURNING *",
      [registration.id]
    );
    await client.query(
      `INSERT INTO attendance_records
       (id, event_id, registration_id, attendee_name, check_in_time, verified_by)
       VALUES ($1, $2, $3, $4, NOW(), $5)`,
      [`att-log-${randomUUID()}`, registration.event_id, registration.id,
        registration.attendee_name, actorId || 'zabay-operator']
    );
    await client.query('COMMIT');
    return res.json({
      success: true,
      data: updateResult.rows[0],
      message: `Checked in ${registration.attendee_name}.`,
    });
  } catch (err: any) {
    if (client) {
      try { await client.query('ROLLBACK'); } catch { /* connection already failed */ }
    }
    if (err.code === '23505' && String(err.constraint || '').includes('attendance_records_registration')) {
      return res.status(409).json({ success: false, code: 'DUPLICATE_CHECK_IN', isDuplicate: true, error: 'This pass has already been checked in.' });
    }
    next(err);
  } finally {
    client?.release();
  }
}
