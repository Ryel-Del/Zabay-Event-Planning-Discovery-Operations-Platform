import { Request, Response, NextFunction } from 'express';
import { query } from '../config/db';
import { optionalOperator, trustedUserId } from './auth';

// Existing role middleware verifies session and CSRF. This second guard ties
// admission authority to the *actual pass's event*, not a browser-selected ID.
export async function requireEventGateOwnership(req: Request, res: Response, next: NextFunction) {
  if (optionalOperator(req)) return next();
  const actor = trustedUserId(req);
  if (!actor) return res.status(401).json({ success: false, error: 'Login required', code: 'UNAUTHORIZED' });
  const code = req.body?.qr_pass_code;
  if (typeof code !== 'string' || !code.trim() || code.length > 64) return next();
  try {
    const result = await query(
      'SELECT e.organizer_id FROM registrations r JOIN events e ON e.id = r.event_id WHERE UPPER(r.qr_pass_code) = UPPER($1)',
      [code.trim()]
    );
    if (!result.rows[0]) return next(); // Controller returns its normal unknown-pass 404.
    if (result.rows[0].organizer_id !== actor) {
      return res.status(403).json({ success: false, error: 'Not authorized to admit attendees for this event', code: 'FORBIDDEN' });
    }
    next();
  } catch (error) {
    next(error);
  }
}
