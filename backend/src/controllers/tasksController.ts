import { Request, Response, NextFunction } from 'express';
import { query } from '../config/db';
import { trustedUserId } from '../middleware/auth';

export async function getTasks(req: Request, res: Response, next: NextFunction) {
  try {
    const { event_id } = req.query;
    const ownerId = trustedUserId(req);
    let sql = ownerId ? 'SELECT t.* FROM tasks t JOIN events e ON e.id = t.event_id WHERE e.organizer_id = $1' : 'SELECT * FROM tasks';
    const params: any[] = [];
    if (ownerId) params.push(ownerId);

    if (event_id) {
      params.push(event_id);
      sql += `${ownerId ? ' AND' : ' WHERE'} ${ownerId ? 't.' : ''}event_id = $${params.length}`;
    }

    sql += ` ORDER BY ${ownerId ? 't.' : ''}start_time ASC`;
    const result = await query(sql, params);

    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (err) {
    next(err);
  }
}

export async function updateTaskStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    if (!['backlog', 'todo', 'in_progress', 'completed', 'blocked'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid task status' });
    }

    const ownerId = trustedUserId(req);
    const result = await query(ownerId
      ? 'UPDATE tasks SET status = $1, updated_at = NOW() WHERE id = $2 AND event_id IN (SELECT id FROM events WHERE organizer_id = $3) RETURNING *'
      : 'UPDATE tasks SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      ownerId ? [status, id, ownerId] : [status, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}
