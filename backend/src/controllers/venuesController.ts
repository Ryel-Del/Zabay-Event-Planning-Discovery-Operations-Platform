import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';
import { query } from '../config/db';

export async function getVenues(_req: Request, res: Response, next: NextFunction) {
  try {
    const venuesResult = await query('SELECT * FROM venues ORDER BY capacity DESC');
    const hallsResult = await query('SELECT * FROM venue_halls ORDER BY capacity DESC');

    const venues = venuesResult.rows.map((venue: any) => ({
      ...venue,
      halls: hallsResult.rows.filter((h: any) => h.venue_id === venue.id),
    }));

    res.json({ success: true, count: venues.length, data: venues });
  } catch (err) {
    next(err);
  }
}

export async function getVenueById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const venueResult = await query('SELECT * FROM venues WHERE id = $1', [id]);

    if (venueResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Venue not found' });
    }

    const hallsResult = await query('SELECT * FROM venue_halls WHERE venue_id = $1', [id]);
    const bookingsResult = await query(
      'SELECT * FROM venue_bookings WHERE venue_id = $1 AND status = $2 ORDER BY start_time ASC',
      [id, 'confirmed']
    );

    const venue = {
      ...venueResult.rows[0],
      halls: hallsResult.rows,
      bookings: bookingsResult.rows,
    };

    res.json({ success: true, data: venue });
  } catch (err) {
    next(err);
  }
}

export async function bookVenue(req: Request, res: Response, next: NextFunction) {
  try {
    const { id: venue_id } = req.params;
    const { event_id, event_title, start_time, end_time, hall_id, hall_name } = req.body || {};

    if (typeof event_id !== 'string' || event_id.length === 0 ||
        typeof event_title !== 'string' || event_title.trim().length === 0 ||
        start_time === undefined || end_time === undefined) {
      return res.status(400).json({
        success: false,
        error: 'event_id, event_title, start_time, and end_time are required',
      });
    }

    const startDate = new Date(start_time);
    const endDate = new Date(end_time);
    if (typeof start_time !== 'string' || typeof end_time !== 'string' ||
        !Number.isFinite(startDate.getTime()) || !Number.isFinite(endDate.getTime()) ||
        endDate.getTime() <= startDate.getTime()) {
      return res.status(400).json({
        success: false,
        error: 'start_time and end_time must be valid timestamps and end_time must be later',
      });
    }

    const venueResult = await query('SELECT id FROM venues WHERE id = $1', [venue_id]);
    if (venueResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Venue not found' });
    }

    const eventResult = await query('SELECT id FROM events WHERE id = $1', [event_id]);
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }

    if (hall_id !== undefined && hall_id !== null) {
      if (typeof hall_id !== 'string' || hall_id.length === 0) {
        return res.status(400).json({ success: false, error: 'hall_id must be a non-empty hall identifier' });
      }
      const hallResult = await query('SELECT venue_id FROM venue_halls WHERE id = $1', [hall_id]);
      if (hallResult.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Hall not found' });
      }
      if (hallResult.rows[0].venue_id !== venue_id) {
        return res.status(400).json({ success: false, error: 'Hall does not belong to the specified venue' });
      }
    }

    const id = `vb-${randomUUID()}`;
    const sql = `
      INSERT INTO venue_bookings (
        id, venue_id, hall_id, hall_name, event_id, event_title,
        booking_window, start_time, end_time, status, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        tstzrange($7::timestamptz, $8::timestamptz, '[)'),
        $7, $8, 'confirmed', NOW()
      ) RETURNING *
    `;

    const result = await query(sql, [
      id,
      venue_id,
      hall_id || null,
      hall_name || null,
      event_id,
      event_title,
      start_time,
      end_time,
    ]);

    res.status(201).json({
      success: true,
      message: 'Venue booking confirmed with database EXCLUDE non-overlap guarantee.',
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
}
