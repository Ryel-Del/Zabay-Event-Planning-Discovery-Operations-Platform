import { Request, Response, NextFunction } from 'express';
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
    const { event_id, event_title, start_time, end_time, hall_id, hall_name } = req.body;

    const id = `vb-${Date.now()}`;
    const sql = `
      INSERT INTO venue_bookings (
        id, venue_id, hall_id, hall_name, event_id, event_title,
        booking_window, start_time, end_time, status, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        tsrange($7::timestamp, $8::timestamp, '[)'),
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
