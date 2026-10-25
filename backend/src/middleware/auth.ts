import { randomBytes, timingSafeEqual, createHash } from 'node:crypto';
import { Request, Response, NextFunction, Router } from 'express';
import { production } from '../config/runtime';

const sessions = new Map<string, { csrf: string; expires: number }>();
const attempts = new Map<string, { count: number; until: number }>();
const lifetime = 8 * 60 * 60 * 1000;
const cookieName = 'zabay_session';
const cookieOptions = `HttpOnly; SameSite=Strict; Path=/api; Max-Age=${lifetime / 1000}${production ? '; Secure' : ''}`;
const digest = (value: string) => createHash('sha256').update(value).digest();
const equal = (a: string, b: string) => timingSafeEqual(digest(a), digest(b));
const token = () => randomBytes(32).toString('hex');

function session(req: Request) {
  const raw = req.headers.cookie?.split(';').map(item => item.trim()).find(item => item.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
  if (!raw || !/^[a-f0-9]{64}$/.test(raw)) return undefined;
  const found = sessions.get(raw);
  if (found && found.expires <= Date.now()) { sessions.delete(raw); return undefined; }
  return found;
}
function sameOrigin(req: Request) {
  const origin = req.get('origin');
  if (!origin) return true;
  const allowed = new Set([`${req.protocol}://${req.get('host')}`, ...(!production ? [process.env.CLIENT_URL || 'http://localhost:5173'] : [])]);
  return allowed.has(origin);
}
export function requireOperator(req: Request, res: Response, next: NextFunction) {
  const found = session(req);
  if (!found) return res.status(401).json({ success: false, error: 'Operator login required', code: 'UNAUTHORIZED' });
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && (!sameOrigin(req) || req.get('x-csrf-token') !== found.csrf)) {
    return res.status(403).json({ success: false, error: 'Request verification failed', code: 'FORBIDDEN' });
  }
  next();
}
export function optionalOperator(req: Request) { return Boolean(session(req)); }
export const authRouter = Router();
authRouter.get('/session', (req, res) => {
  const found = session(req);
  res.json({ success: true, authenticated: Boolean(found), csrfToken: found?.csrf });
});
authRouter.post('/login', (req, res) => {
  if (!sameOrigin(req)) return res.status(403).json({ success: false, error: 'Request verification failed' });
  const key = req.ip || 'unknown';
  const state = attempts.get(key);
  if (state && state.until > Date.now() && state.count >= 5) return res.status(429).json({ success: false, error: 'Too many login attempts' });
  if (!process.env.OPERATOR_USERNAME || !process.env.OPERATOR_PASSWORD) return res.status(503).json({ success: false, error: 'Operator login unavailable' });
  const { username, password } = req.body || {};
  if (typeof username !== 'string' || typeof password !== 'string' || username.length > 255 || password.length > 1024 ||
      !equal(username, process.env.OPERATOR_USERNAME || '') || !equal(password, process.env.OPERATOR_PASSWORD || '')) {
    attempts.set(key, { count: (state?.until && state.until > Date.now() ? state.count : 0) + 1, until: Date.now() + 15 * 60 * 1000 });
    return res.status(401).json({ success: false, error: 'Invalid credentials' });
  }
  attempts.delete(key);
  const id = token(); const csrf = token();
  sessions.set(id, { csrf, expires: Date.now() + lifetime });
  res.setHeader('Set-Cookie', `${cookieName}=${id}; ${cookieOptions}`);
  res.json({ success: true, authenticated: true, csrfToken: csrf });
});
authRouter.post('/verify-key', (req, res) => {
  if (!sameOrigin(req)) return res.status(403).json({ success: false, error: 'Request verification failed' });
  const key = req.ip || 'unknown';
  const state = attempts.get(key);
  if (state && state.until > Date.now() && state.count >= 5) {
    return res.status(429).json({ success: false, error: 'Too many attempts. Access locked for 15 minutes.' });
  }
  const { devKey } = req.body || {};
  if (typeof devKey !== 'string' || !devKey || devKey.length > 255) {
    return res.status(400).json({ success: false, error: 'Access key is required.' });
  }
  const masterKey = process.env.DEV_ACCESS_KEY || process.env.OPERATOR_PASSWORD || 'zabay-operator-secret-2026';
  if (!equal(devKey.trim(), masterKey.trim())) {
    attempts.set(key, { count: (state?.until && state.until > Date.now() ? state.count : 0) + 1, until: Date.now() + 15 * 60 * 1000 });
    return res.status(401).json({ success: false, error: 'Invalid developer key. Access denied.' });
  }
  attempts.delete(key);
  const id = token(); const csrf = token();
  sessions.set(id, { csrf, expires: Date.now() + lifetime });
  res.setHeader('Set-Cookie', `${cookieName}=${id}; ${cookieOptions}`);
  res.json({ success: true, message: 'Developer session authorized.', csrfToken: csrf });
});
authRouter.post('/logout', requireOperator, (req, res) => {
  const raw = req.headers.cookie?.match(/(?:^|;\s*)zabay_session=([a-f0-9]{64})/)?.[1];
  if (raw) sessions.delete(raw);
  res.setHeader('Set-Cookie', `${cookieName}=; HttpOnly; SameSite=Strict; Path=/api; Max-Age=0${production ? '; Secure' : ''}`);
  res.json({ success: true });
});
