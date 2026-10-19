import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('[Zabay Server Error]:', err);

  // PostgreSQL EXCLUDE constraint error code 23P01
  if (err.code === '23P01') {
    return res.status(409).json({
      success: false,
      error: 'Conflict: The venue space is already booked during this time interval (PostgreSQL EXCLUDE constraint violation).',
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

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    error: message,
  });
}
