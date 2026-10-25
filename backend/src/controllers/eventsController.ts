import { Request, Response, NextFunction } from 'express';
import { query } from '../config/db';
import { optionalOperator, trustedEventOwner, trustedUserId } from '../middleware/auth';

export async function getEvents(req: Request, res: Response, next: NextFunction) {
  try {
    const { category, is_private } = req.query;
    const ownerId = trustedUserId(req);
    const registrationCount = "(SELECT COUNT(*)::int FROM registrations r WHERE r.event_id = events.id AND r.status <> 'cancelled') AS registration_count";
    let sql = optionalOperator(req) ? `SELECT events.*, ${registrationCount} FROM events WHERE status != $1` : `SELECT id, title, description, category, event_type, is_private, status, start_date, end_date, organizer_id, venue_id, hall_id, hall_name, expected_attendance, max_capacity, ticket_price, banner_url, created_at, ${registrationCount}${ownerId ? ', CASE WHEN organizer_id = $2 THEN budget ELSE NULL END AS budget' : ''} FROM events WHERE status != $1`;
    const params: any[] = ['cancelled'];
    if (ownerId && !optionalOperator(req)) params.push(ownerId);

    if (!optionalOperator(req) || is_private === 'false') {
      sql += ownerId && is_private !== 'false' ? " AND ((is_private = false AND event_type = 'public') OR organizer_id = $2)" : " AND is_private = false AND event_type = 'public'";
    }

    if (category && category !== 'All') {
      params.push(category);
      sql += ` AND category = $${params.length}`;
    }

    sql += ' ORDER BY start_date ASC';
    const result = await query(sql, params);

    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (err) {
    next(err);
  }
}

export async function getEventById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const ownerId = trustedUserId(req);
    const publicColumns = 'id, title, description, category, event_type, is_private, status, start_date, end_date, organizer_id, venue_id, hall_id, hall_name, expected_attendance, max_capacity, ticket_price, banner_url, created_at';
    const registrationCount = "(SELECT COUNT(*)::int FROM registrations r WHERE r.event_id = events.id AND r.status <> 'cancelled') AS registration_count";
    const result = await query(optionalOperator(req) ? `SELECT events.*, ${registrationCount} FROM events WHERE id = $1` :
      `SELECT ${publicColumns}, ${registrationCount}${ownerId ? ', CASE WHEN organizer_id = $2 THEN budget ELSE NULL END AS budget' : ''} FROM events WHERE id = $1 AND ${ownerId ? "((is_private = false AND event_type = 'public') OR organizer_id = $2)" : "is_private = false AND event_type = 'public'"}`,
      ownerId ? [id, ownerId] : [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function createEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      title,
      description,
      category,
      event_type,
      is_private,
      start_date,
      end_date,
      venue_id,
      hall_id,
      hall_name,
      expected_attendance,
      max_capacity,
      ticket_price,
      budget,
      banner_url,
    } = req.body || {};

    if (typeof title !== 'string' || !title.trim() || title.length > 255 || typeof category !== 'string' || !category.trim() || category.length > 64 ||
        typeof start_date !== 'string' || typeof end_date !== 'string' ||
        !Number.isFinite(Date.parse(start_date)) || !Number.isFinite(Date.parse(end_date)) || Date.parse(end_date) <= Date.parse(start_date) ||
        (description !== undefined && (typeof description !== 'string' || description.length > 10000)) ||
        (is_private !== undefined && typeof is_private !== 'boolean') ||
        (event_type !== undefined && !['public', 'private', 'invite_only'].includes(event_type)) ||
        (event_type === 'public' && is_private === true) ||
        (event_type && event_type !== 'public' && is_private === false) ||
        (venue_id !== undefined && venue_id !== null && (typeof venue_id !== 'string' || venue_id.length > 64)) ||
        (hall_id !== undefined && hall_id !== null && (typeof hall_id !== 'string' || hall_id.length > 64)) ||
        (hall_name !== undefined && hall_name !== null && (typeof hall_name !== 'string' || hall_name.length > 255)) ||
        (banner_url !== undefined && (typeof banner_url !== 'string' || banner_url.length > 500)) ||
        (expected_attendance !== undefined && (!Number.isInteger(expected_attendance) || expected_attendance < 1 || expected_attendance > 1000000)) ||
        (max_capacity !== undefined && (!Number.isInteger(max_capacity) || max_capacity < 1 || max_capacity > 1000000)) ||
        (ticket_price !== undefined && (typeof ticket_price !== 'number' || ticket_price < 0 || ticket_price > 99999999)) ||
        (budget !== undefined && (typeof budget !== 'number' || budget < 0 || budget > 9999999999))) {
      return res.status(400).json({ success: false, error: 'Invalid event details' });
    }

    // Disallow organizing events in the past (allowing 24-hour buffer for timezones)
    if (Date.parse(start_date) < Date.now() - 86400000) {
      return res.status(400).json({ success: false, error: 'Events cannot be scheduled in the past. Please select today or a future date.' });
    }
    const sql = `
      INSERT INTO events (
        title, description, category, event_type, is_private,
        status, start_date, end_date, organizer_id, venue_id,
        hall_id, hall_name, expected_attendance, max_capacity,
        ticket_price, budget, banner_url, created_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        'planning', $6, $7, $8, $9,
        $10, $11, $12, $13,
        $14, $15, $16, NOW()
      ) RETURNING *
    `;

    const result = await query(sql, [
      title,
      description,
      category,
      event_type || (is_private ? 'private' : 'public'),
      Boolean(is_private),
      start_date,
      end_date,
      trustedEventOwner(req),
      venue_id,
      hall_id || null,
      hall_name || null,
      expected_attendance || 100,
      max_capacity || 200,
      ticket_price || 0,
      budget || 0,
      banner_url || '',
    ]);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function updateEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const ownerId = trustedEventOwner(req);
    const isOperator = optionalOperator(req);

    const existing = await query('SELECT organizer_id, status FROM events WHERE id = $1', [id]);
    if (!existing.rows.length) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }
    if (!isOperator && existing.rows[0].organizer_id !== ownerId) {
      return res.status(403).json({ success: false, error: 'You are not authorized to update this event.' });
    }

    const {
      title,
      description,
      category,
      event_type,
      is_private,
      status,
      start_date,
      end_date,
      expected_attendance,
      max_capacity,
      ticket_price,
      budget,
      banner_url,
    } = req.body || {};

    const updateFields: string[] = [];
    const params: any[] = [id];

    if (typeof title === 'string' && title.trim()) {
      params.push(title.trim().slice(0, 255));
      updateFields.push(`title = $${params.length}`);
    }
    if (typeof description === 'string') {
      params.push(description.slice(0, 10000));
      updateFields.push(`description = $${params.length}`);
    }
    if (typeof category === 'string' && category.trim()) {
      params.push(category.trim().slice(0, 64));
      updateFields.push(`category = $${params.length}`);
    }
    if (typeof event_type === 'string' && ['public', 'private', 'invite_only'].includes(event_type)) {
      params.push(event_type);
      updateFields.push(`event_type = $${params.length}`);
    }
    if (typeof is_private === 'boolean') {
      params.push(is_private);
      updateFields.push(`is_private = $${params.length}`);
    }
    if (typeof status === 'string' && ['planning', 'active', 'completed', 'cancelled'].includes(status)) {
      params.push(status);
      updateFields.push(`status = $${params.length}`);
    }
    if (typeof start_date === 'string' && Number.isFinite(Date.parse(start_date))) {
      params.push(start_date);
      updateFields.push(`start_date = $${params.length}`);
    }
    if (typeof end_date === 'string' && Number.isFinite(Date.parse(end_date))) {
      params.push(end_date);
      updateFields.push(`end_date = $${params.length}`);
    }
    if (typeof expected_attendance === 'number') {
      params.push(expected_attendance);
      updateFields.push(`expected_attendance = $${params.length}`);
    }
    if (typeof max_capacity === 'number') {
      params.push(max_capacity);
      updateFields.push(`max_capacity = $${params.length}`);
    }
    if (typeof ticket_price === 'number') {
      params.push(ticket_price);
      updateFields.push(`ticket_price = $${params.length}`);
    }
    if (typeof budget === 'number') {
      params.push(budget);
      updateFields.push(`budget = $${params.length}`);
    }
    if (typeof banner_url === 'string') {
      params.push(banner_url.slice(0, 500));
      updateFields.push(`banner_url = $${params.length}`);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid fields provided for update.' });
    }

    const sql = `UPDATE events SET ${updateFields.join(', ')} WHERE id = $1 RETURNING *`;
    const result = await query(sql, params);

    res.json({ success: true, data: result.rows[0], message: 'Event updated successfully.' });
  } catch (err) {
    next(err);
  }
}

export async function deleteEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const ownerId = trustedEventOwner(req);
    const isOperator = optionalOperator(req);

    const existing = await query('SELECT organizer_id FROM events WHERE id = $1', [id]);
    if (!existing.rows.length) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }
    if (!isOperator && existing.rows[0].organizer_id !== ownerId) {
      return res.status(403).json({ success: false, error: 'You are not authorized to delete this event.' });
    }

    await query('DELETE FROM events WHERE id = $1', [id]);
    res.json({ success: true, message: 'Event deleted successfully.' });
  } catch (err) {
    next(err);
  }
}
