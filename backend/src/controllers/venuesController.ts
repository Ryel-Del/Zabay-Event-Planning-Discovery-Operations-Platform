import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';
import { pool, query } from '../config/db';
import { optionalOperator, trustedUserId } from '../middleware/auth';

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
    const actorId = trustedUserId(req);
    const managerRole = actorId && venueResult.rows[0].manager_id === actorId
      ? (await query('SELECT role FROM users WHERE id = $1', [actorId])).rows[0]?.role
      : undefined;
    const canViewBookings = optionalOperator(req) || managerRole === 'venue_manager';
    const bookingsResult = await query(
      canViewBookings ? 'SELECT * FROM venue_bookings WHERE venue_id = $1 AND status = $2 ORDER BY start_time ASC' :
      "SELECT b.id, b.venue_id, b.hall_id, b.start_time, b.end_time, b.status FROM venue_bookings b JOIN events e ON e.id = b.event_id WHERE b.venue_id = $1 AND b.status = $2 AND e.is_private = false AND e.event_type = 'public' ORDER BY b.start_time ASC",
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

    if (typeof event_id !== 'string' || event_id.length === 0 || event_id.length > 64 ||
        typeof event_title !== 'string' || event_title.trim().length === 0 || event_title.length > 255 ||
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

    if (hall_name !== undefined && hall_name !== null && (typeof hall_name !== 'string' || hall_name.length > 255)) {
      return res.status(400).json({ success: false, error: 'Invalid hall name' });
    }

    const venueResult = await query('SELECT id FROM venues WHERE id = $1', [venue_id]);
    if (venueResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Venue not found' });
    }

    const eventResult = await query('SELECT id, organizer_id FROM events WHERE id = $1', [event_id]);
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }
    const actorId = trustedUserId(req);
    if (actorId && eventResult.rows[0].organizer_id !== actorId) {
      return res.status(403).json({ success: false, error: 'Event owner access required' });
    }

    if (hall_id !== undefined && hall_id !== null) {
      if (typeof hall_id !== 'string' || hall_id.length === 0 || hall_id.length > 64) {
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

    const client = await pool.connect();
    let result;
    try {
      await client.query('BEGIN');
      result = await client.query(sql, [
        id, venue_id, hall_id || null, hall_name || null,
        event_id, event_title, start_time, end_time,
      ]);
      await client.query(
        'UPDATE events SET venue_id = $1, hall_id = $2, hall_name = $3 WHERE id = $4',
        [venue_id, hall_id || null, hall_name || null, event_id]
      );
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    res.status(201).json({
      success: true,
      message: 'Venue booking confirmed with database EXCLUDE non-overlap guarantee.',
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
}

export async function createVenue(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      name,
      city,
      address,
      lat,
      lng,
      capacity,
      hourly_rate,
      facilities,
      power_kw_capacity,
      is_indoor,
      operating_hours,
      image_url,
      contact_email,
      contact_phone,
      halls,
    } = req.body || {};

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Venue name is required' });
    }

    const venueId = `ven-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const parsedCapacity = Number(capacity) || 500;
    const parsedRate = Number(hourly_rate) || 1500;
    const parsedPower = Number(power_kw_capacity) || 100;
    const parsedLat = Number(lat) || 9.6496;
    const parsedLng = Number(lng) || 123.8624;
    const facilitiesArray = Array.isArray(facilities) ? facilities : [];
    const openTime = operating_hours?.open || '06:00';
    const closeTime = operating_hours?.close || '23:59';

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const insertVenueSql = `
        INSERT INTO venues (
          id, name, city, address, lat, lng, capacity, hourly_rate,
          facilities, power_kw_capacity, is_indoor, operating_hours_open, operating_hours_close,
          image_url, contact_email, contact_phone, manager_id, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW()
        ) RETURNING *;
      `;
      const venueResult = await client.query(insertVenueSql, [
        venueId,
        name.trim(),
        city || 'Tagbilaran City',
        address || 'Tagbilaran City, Bohol',
        parsedLat,
        parsedLng,
        parsedCapacity,
        parsedRate,
        facilitiesArray,
        parsedPower,
        is_indoor !== false,
        openTime,
        closeTime,
        image_url || 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop&q=80',
        contact_email || 'venue@zabay.ph',
        contact_phone || '+63 (38) 411-0000',
        trustedUserId(req),
      ]);

      const insertedHalls: any[] = [];
      if (Array.isArray(halls) && halls.length > 0) {
        for (const hall of halls) {
          const hallId = hall.id || `vh-${venueId}-${Date.now().toString(36).slice(2, 6)}`;
          const insertHallSql = `
            INSERT INTO venue_halls (
              id, venue_id, name, capacity, hourly_rate, is_indoor, dimensions, facilities, description, created_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()
            ) RETURNING *;
          `;
          const hallResult = await client.query(insertHallSql, [
            hallId,
            venueId,
            hall.name || `${name} Main Court`,
            Number(hall.capacity) || parsedCapacity,
            Number(hall.hourly_rate) || parsedRate,
            hall.is_indoor !== false,
            hall.dimensions || '28m x 15m (420 sqm)',
            Array.isArray(hall.facilities) ? hall.facilities : [],
            hall.description || '',
          ]);
          insertedHalls.push(hallResult.rows[0]);
        }
      }

      await client.query('COMMIT');

      const createdVenue = {
        ...venueResult.rows[0],
        operating_hours: { open: openTime, close: closeTime },
        halls: insertedHalls,
      };

      res.status(201).json({
        success: true,
        message: 'Venue registered successfully',
        data: createdVenue,
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
}

