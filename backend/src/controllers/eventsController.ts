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

export async function getEventAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const eventResult = await query(
      `SELECT e.*, v.name AS venue_name, v.capacity AS venue_capacity, v.power_kw_capacity
       FROM events e
       LEFT JOIN venues v ON v.id = e.venue_id
       WHERE e.id = $1`,
      [id]
    );

    if (!eventResult.rows.length) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }
    const event = eventResult.rows[0];
    if (!optionalOperator(req) && event.organizer_id !== trustedUserId(req)) {
      return res.status(403).json({ success: false, error: 'Not authorized to view this event analytics', code: 'FORBIDDEN' });
    }

    // Registrations by tier and revenue
    const regResult = await query(
      `SELECT 
         ticket_type,
         COUNT(*)::int AS tier_count,
         COALESCE(SUM(amount_paid), 0)::numeric AS tier_revenue,
         COUNT(*) FILTER (WHERE status = 'checked_in')::int AS tier_checked_in
       FROM registrations
       WHERE event_id = $1 AND status <> 'cancelled'
       GROUP BY ticket_type`,
      [id]
    );

    // Tasks & Readiness
    const tasksResult = await query(
      `SELECT 
         COUNT(*)::int AS total_tasks,
         COUNT(*) FILTER (WHERE status = 'completed')::int AS completed_tasks,
         COUNT(*) FILTER (WHERE status = 'in_progress')::int AS in_progress_tasks,
         COUNT(*) FILTER (WHERE status = 'blocked')::int AS blocked_tasks
       FROM tasks
       WHERE event_id = $1`,
      [id]
    );

    // Hourly check-in flow from attendance_records (if available) or registrations
    let hourlyFlowResult: { rows: any[] } = { rows: [] };
    try {
      hourlyFlowResult = await query(
        `SELECT 
           TO_CHAR(check_in_time, 'HH24:00') AS hour,
           COUNT(*)::int AS arrivals
         FROM attendance_records
         WHERE event_id = $1
         GROUP BY TO_CHAR(check_in_time, 'HH24:00')
         ORDER BY hour`,
        [id]
      );
    } catch {
      hourlyFlowResult = { rows: [] };
    }

    let totalSold = 0;
    let checkedInCount = 0;
    let totalRevenue = 0;
    const tiers: Array<{ name: string; count: number; value: number }> = [];

    regResult.rows.forEach((row: any) => {
      const count = Number(row.tier_count) || 0;
      const revenue = Number(row.tier_revenue) || 0;
      const checkedIn = Number(row.tier_checked_in) || 0;

      totalSold += count;
      totalRevenue += revenue;
      checkedInCount += checkedIn;

      tiers.push({
        name: row.ticket_type || 'General Admission',
        count,
        value: revenue,
      });
    });

    const tasksRow = tasksResult.rows[0] || {};
    const totalTasks = Number(tasksRow.total_tasks) || 0;
    const completedTasks = Number(tasksRow.completed_tasks) || 0;
    const inProgressTasks = Number(tasksRow.in_progress_tasks) || 0;
    const blockedTasks = Number(tasksRow.blocked_tasks) || 0;

    const maxCapacity = Number(event.max_capacity) || 200;
    const capacityPercent = maxCapacity > 0 ? Math.round((totalSold / maxCapacity) * 100) : 0;
    const readinessPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const attendanceRate = totalSold > 0 ? Math.round((checkedInCount / totalSold) * 100) : 0;

    res.json({
      success: true,
      data: {
        event_id: event.id,
        event_title: event.title,
        ticket_price: Number(event.ticket_price) || 0,
        currency: 'PHP',
        max_capacity: maxCapacity,
        expected_attendance: Number(event.expected_attendance) || 100,
        tickets_sold: totalSold,
        capacity_percent: capacityPercent,
        gross_revenue: totalRevenue,
        checked_in_count: checkedInCount,
        attendance_rate: attendanceRate,
        task_metrics: {
          total_tasks: totalTasks,
          completed_tasks: completedTasks,
          in_progress_tasks: inProgressTasks,
          blocked_tasks: blockedTasks,
          readiness_percent: readinessPercent,
        },
        revenue_tiers: tiers,
        hourly_arrivals: hourlyFlowResult.rows,
      },
    });
  } catch (err) {
    next(err);
  }
}
