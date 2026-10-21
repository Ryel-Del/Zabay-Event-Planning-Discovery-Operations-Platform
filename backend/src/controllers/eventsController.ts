import { Request, Response, NextFunction } from 'express';
import { query } from '../config/db';

export async function getEvents(req: Request, res: Response, next: NextFunction) {
  try {
    const { category, is_private } = req.query;
    let sql = 'SELECT * FROM events WHERE status != $1';
    const params: any[] = ['cancelled'];

    if (is_private === 'false') {
      sql += ' AND is_private = false';
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
    const result = await query('SELECT * FROM events WHERE id = $1', [id]);

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
      organizer_id,
      venue_id,
      hall_id,
      hall_name,
      expected_attendance,
      max_capacity,
      ticket_price,
      budget,
      banner_url,
    } = req.body;

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
      organizer_id,
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
