import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  // PostgreSQL exclusion violations (same hall or whole venue / hall).
  if (err.code === '23P01') {
    return res.status(409).json({
      success: false,
      error: 'The venue space is already booked during this time interval.',
      code: 'EXCLUDE_CONSTRAINT_VIOLATION',
    });
  }

  // PostgreSQL Unique constraint violation code 23505
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      error: 'Conflict: A record with this unique identifier already exists.',
      code: 'UNIQUE_VIOLATION',
    });
  }

  // A hall can disappear between validation and INSERT, or a direct database
  // constraint can reject a hall/venue pairing.
  if (err.code === '23503' && String(err.constraint || '').includes('hall')) {
    return res.status(400).json({ success: false, error: 'Hall does not belong to the specified venue' });
  }
  if (err.code === '23503' && String(err.constraint || '').includes('event')) {
    return res.status(404).json({ success: false, error: 'Event not found' });
  }
  if (err.code === '23503' && String(err.constraint || '').includes('venue')) {
    return res.status(404).json({ success: false, error: 'Venue not found' });
  }
  if (err.code === '23514') {
    return res.status(400).json({ success: false, error: 'Booking details violate a database constraint' });
  }
  if (err.code === '22007' || err.code === '22008' || err.code === '22P02') {
    return res.status(400).json({ success: false, error: 'Invalid booking date or identifier' });
  }

  const statusCode = err.statusCode || 500;
  const message = statusCode >= 500 ? 'Internal server error' : (err.message || 'Request failed');
  if (statusCode >= 500) console.error('[Zabay Server Error]:', err);

  res.status(statusCode).json({
    success: false,
    error: message,
  });
}
