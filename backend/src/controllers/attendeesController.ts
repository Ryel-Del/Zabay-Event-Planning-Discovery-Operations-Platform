import { Request, Response, NextFunction } from 'express';
import { query } from '../config/db';

export async function checkInAttendee(req: Request, res: Response, next: NextFunction) {
  try {
    const { qr_pass_code, verified_by_id } = req.body;

    if (!qr_pass_code) {
      return res.status(400).json({ success: false, error: 'qr_pass_code is required' });
    }

    const regResult = await query(
      'SELECT * FROM registrations WHERE UPPER(qr_pass_code) = UPPER($1) OR UPPER(id) = UPPER($1)',
      [qr_pass_code.trim()]
    );

    if (regResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Invalid QR pass code. No registration found in database.',
      });
    }

    const registration = regResult.rows[0];

    if (registration.status === 'checked_in') {
      return res.status(409).json({
        success: false,
        isDuplicate: true,
        registration,
        error: `DUPLICATE CHECK-IN PREVENTED: ${registration.attendee_name} was already verified and admitted.`,
      });
    }

    // Update status to checked_in
    const updateResult = await query(
      'UPDATE registrations SET status = $1 WHERE id = $2 RETURNING *',
      ['checked_in', registration.id]
    );

    // Record attendance log
    const attendanceId = `att-log-${Date.now()}`;
    await query(
      `INSERT INTO attendance_records (id, event_id, registration_id, attendee_name, check_in_time, verified_by)
       VALUES ($1, $2, $3, $4, NOW(), $5)`,
      [attendanceId, registration.event_id, registration.id, registration.attendee_name, verified_by_id || 'gate-scanner-01']
    );

    res.json({
      success: true,
      data: updateResult.rows[0],
      message: `Verified! Welcome ${registration.attendee_name} (${registration.ticket_type}).`,
    });
  } catch (err) {
    next(err);
  }
}

export async function registerForEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const { event_id, attendee_name, attendee_email, ticket_type, amount_paid } = req.body;

    const id = `reg-${Date.now()}`;
    const qr_pass_code = `PASS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const sql = `
      INSERT INTO registrations (
        id, event_id, attendee_name, attendee_email,
        status, ticket_type, qr_pass_code, amount_paid, registered_at
      ) VALUES ($1, $2, $3, $4, 'confirmed', $5, $6, $7, NOW())
      RETURNING *
    `;

    const result = await query(sql, [
      id,
      event_id,
      attendee_name,
      attendee_email,
      ticket_type || 'General Admission',
      qr_pass_code,
      amount_paid || 0,
    ]);

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Registration successful! Digital QR Pass generated.',
    });
  } catch (err) {
    next(err);
  }
}
