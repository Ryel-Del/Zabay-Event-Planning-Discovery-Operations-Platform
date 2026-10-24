import { Request, Response, NextFunction } from 'express';
import { query } from '../config/db';

export async function getTasks(req: Request, res: Response, next: NextFunction) {
  try {
    const { event_id } = req.query;
    let sql = 'SELECT * FROM tasks';
    const params: any[] = [];

    if (event_id) {
      sql += ' WHERE event_id = $1';
      params.push(event_id);
    }

    sql += ' ORDER BY start_time ASC';
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

    const result = await query(
      'UPDATE tasks SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}
