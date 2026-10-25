import { randomBytes, timingSafeEqual, createHash, scryptSync } from 'node:crypto';
import { Request, Response, NextFunction, Router } from 'express';
import { production } from '../config/runtime';
import { query } from '../config/db';
import { verifyFirebaseIdentity } from '../config/firebase';

type Session = { csrf: string; expires: number; identity: 'operator' | 'user'; userId?: string };
const sessions = new Map<string, Session>();
const attempts = new Map<string, { count: number; until: number }>();
const publicAuthAttempts = new Map<string, { count: number; until: number }>();
const lifetime = 8 * 60 * 60 * 1000;
const cookieName = 'zabay_session';
const cookieOptions = `HttpOnly; SameSite=Strict; Path=/api; Max-Age=${lifetime / 1000}${production ? '; Secure' : ''}`;
const digest = (value: string) => createHash('sha256').update(value).digest();
const equal = (a: string, b: string) => timingSafeEqual(digest(a), digest(b));
const token = () => randomBytes(32).toString('hex');

function limitPublicAuth(route: string, maximum: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${route}:${req.ip || 'unknown'}`;
    const now = Date.now();
    const previous = publicAuthAttempts.get(key);
    const count = previous && previous.until > now ? previous.count : 0;
    if (count >= maximum) return res.status(429).json({ success: false, error: 'Too many authentication attempts. Try again later.' });
    if (publicAuthAttempts.size >= 10000 && !publicAuthAttempts.has(key)) {
      for (const [entry, state] of publicAuthAttempts) if (state.until <= now) publicAuthAttempts.delete(entry);
      if (publicAuthAttempts.size >= 10000) publicAuthAttempts.delete(publicAuthAttempts.keys().next().value!);
    }
    publicAuthAttempts.set(key, { count: count + 1, until: count ? previous!.until : now + 15 * 60 * 1000 });
    next();
  };
}

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
  const allowed = new Set([`${req.protocol}://${req.get('host')}`, process.env.CLIENT_URL || 'http://localhost:5173']);
  return allowed.has(origin);
}
export function requireOperator(req: Request, res: Response, next: NextFunction) {
  const found = session(req);
  if (!found) return res.status(401).json({ success: false, error: 'Operator login required', code: 'UNAUTHORIZED' });
  if (found.identity !== 'operator') return res.status(403).json({ success: false, error: 'Operator access required', code: 'FORBIDDEN' });
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && (!sameOrigin(req) || req.get('x-csrf-token') !== found.csrf)) {
    return res.status(403).json({ success: false, error: 'Request verification failed', code: 'FORBIDDEN' });
  }
  next();
}
export function optionalOperator(req: Request) { return session(req)?.identity === 'operator'; }
export async function requireOrganizerOrOperator(req: Request, res: Response, next: NextFunction) {
  const found = session(req);
  if (!found) return res.status(401).json({ success: false, error: 'Login required', code: 'UNAUTHORIZED' });
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && (!sameOrigin(req) || req.get('x-csrf-token') !== found.csrf)) return res.status(403).json({ success: false, error: 'Request verification failed', code: 'FORBIDDEN' });
  if (found.identity === 'operator') return next();
  try {
    const result = await query('SELECT role FROM users WHERE id = $1', [found.userId]);
    if (result.rows[0]?.role !== 'organizer') return res.status(403).json({ success: false, error: 'Organizer access required', code: 'FORBIDDEN' });
    next();
  } catch (err) { next(err); }
}
export const requireEventCreator = requireOrganizerOrOperator;
export function trustedEventOwner(req: Request) {
  const found = session(req);
  return found?.identity === 'operator' ? 'zabay-operator' : found?.userId;
}
export function trustedUserId(req: Request) {
  const found = session(req);
  return found?.identity === 'user' ? found.userId : null;
}
export async function requireVenueCreator(req: Request, res: Response, next: NextFunction) {
  const found = session(req);
  if (!found) return res.status(401).json({ success: false, error: 'Login required', code: 'UNAUTHORIZED' });
  if (!sameOrigin(req) || req.get('x-csrf-token') !== found.csrf) return res.status(403).json({ success: false, error: 'Request verification failed', code: 'FORBIDDEN' });
  if (found.identity === 'operator') return next();
  try {
    const result = await query('SELECT role FROM users WHERE id = $1', [found.userId]);
    if (result.rows[0]?.role !== 'venue_manager') return res.status(403).json({ success: false, error: 'Venue manager access required', code: 'FORBIDDEN' });
    next();
  } catch (err) { next(err); }
}
export const authRouter = Router();
authRouter.get('/session', (req, res) => {
  const found = session(req);
  res.json({ success: true, authenticated: Boolean(found), operator: found?.identity === 'operator', csrfToken: found?.csrf });
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
  sessions.set(id, { csrf, expires: Date.now() + lifetime, identity: 'operator' });
  res.setHeader('Set-Cookie', `${cookieName}=${id}; ${cookieOptions}`);
  res.json({ success: true, authenticated: true, csrfToken: csrf });
});
authRouter.post('/verify-key', (req, res) => {
  if (production) return res.status(404).json({ success: false, error: 'Developer access unavailable' });
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
  const masterKey = process.env.DEV_ACCESS_KEY;
  if (!masterKey) return res.status(404).json({ success: false, error: 'Developer access unavailable' });
  if (!equal(devKey.trim(), masterKey.trim())) {
    attempts.set(key, { count: (state?.until && state.until > Date.now() ? state.count : 0) + 1, until: Date.now() + 15 * 60 * 1000 });
    return res.status(401).json({ success: false, error: 'Invalid developer key. Access denied.' });
  }
  attempts.delete(key);
  res.json({ success: true, message: 'Local demo access authorized.' });
});

/**
 * 3. User Registration (Real PostgreSQL password hash with salt)
 */
authRouter.post('/register', limitPublicAuth('register', 10), async (req, res) => {
  if (!sameOrigin(req)) return res.status(403).json({ success: false, error: 'Request verification failed' });
  try {
    const { name, email, password, organization, phone } = req.body || {};
    if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 255) {
      return res.status(400).json({ success: false, error: 'Full name is required (minimum 2 characters).' });
    }
    if (!email || typeof email !== 'string' || email.trim().length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ success: false, error: 'A valid email address is required.' });
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters long.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [cleanEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, error: 'An account with this email address already exists.' });
    }

    const assignedRole = 'attendee';
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');
    const userId = `usr-${randomBytes(6).toString('hex')}`;
    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name.trim())}&background=3E6CB5&color=fff&bold=true`;

    const insertResult = await query(
      `INSERT INTO users (id, name, email, role, phone, organization, avatar, password_hash, password_salt)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, name, email, role, phone, organization, avatar, created_at`,
      [userId, name.trim(), cleanEmail, assignedRole, phone || '', organization || '', avatar, hash, salt]
    );

    const newUser = insertResult.rows[0];
    const id = token();
    const csrf = token();
    sessions.set(id, { csrf, expires: Date.now() + lifetime, identity: 'user', userId: newUser.id });
    res.setHeader('Set-Cookie', `${cookieName}=${id}; ${cookieOptions}`);
    res.status(201).json({ success: true, user: newUser, data: { user: newUser }, csrfToken: csrf });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, error: 'Internal server error during registration.' });
  }
});

/**
 * 4. User Login (Authenticates against PostgreSQL with salted timing-safe verification)
 */
authRouter.post('/user-login', limitPublicAuth('user-login', 10), async (req, res) => {
  if (!sameOrigin(req)) return res.status(403).json({ success: false, error: 'Request verification failed' });
  try {
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password || email.length > 255 || password.length > 1024) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const result = await query(
      'SELECT id, name, email, role, phone, organization, avatar, password_hash, password_salt FROM users WHERE LOWER(email) = LOWER($1)',
      [cleanEmail]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const user = result.rows[0];
    let passwordMatches = false;

    if (!user.password_hash || !user.password_salt) {
      return res.status(401).json({ success: false, error: 'Password login is unavailable for this account. Contact an administrator to activate it.' });
    } else {
      const computedHash = scryptSync(password, user.password_salt, 64).toString('hex');
      try {
        passwordMatches = timingSafeEqual(Buffer.from(computedHash, 'hex'), Buffer.from(user.password_hash, 'hex'));
      } catch {
        passwordMatches = false;
      }
    }

    if (!passwordMatches) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const id = token();
    const csrf = token();
    sessions.set(id, { csrf, expires: Date.now() + lifetime, identity: 'user', userId: user.id });
    res.setHeader('Set-Cookie', `${cookieName}=${id}; ${cookieOptions}`);

    const { password_hash, password_salt, ...safeUser } = user;
    res.json({ success: true, user: safeUser, data: { user: safeUser }, csrfToken: csrf });
  } catch (err: any) {
    console.error('User login error:', err);
    res.status(500).json({ success: false, error: 'Internal server error during login.' });
  }
});

authRouter.post('/firebase-login', limitPublicAuth('firebase-login', 20), async (req, res) => {
  if (!sameOrigin(req)) return res.status(403).json({ success: false, error: 'Request verification failed' });
  const idToken = req.body?.idToken;
  if (typeof idToken !== 'string' || !idToken || idToken.length > 8192) return res.status(400).json({ success: false, error: 'Firebase ID token required' });
  try {
    const identity = await verifyFirebaseIdentity(idToken);
    if (identity.email.length > 255) return res.status(401).json({ success: false, error: 'Invalid Firebase identity' });
    let result: any;
    try {
      result = await query('SELECT id, name, email, role, phone, organization, avatar FROM users WHERE firebase_uid = $1', [identity.uid]);
    } catch (queryErr: any) {
      if (queryErr?.message?.includes('firebase_uid')) {
        await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS firebase_uid VARCHAR(128)');
        result = await query('SELECT id, name, email, role, phone, organization, avatar FROM users WHERE firebase_uid = $1', [identity.uid]);
      } else {
        throw queryErr;
      }
    }
    if (!result.rows.length) {
      // Email equality is insufficient to link a Firebase identity to an existing account.
      const existing = await query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [identity.email]);
      if (existing.rows.length) return res.status(409).json({ success: false, error: 'This email belongs to an existing account. Contact an administrator for account linking.' });
      const userId = `usr-${randomBytes(6).toString('hex')}`;
      result = await query(
        `INSERT INTO users (id, name, email, role, avatar, firebase_uid) VALUES ($1, $2, $3, 'attendee', $4, $5)
         RETURNING id, name, email, role, phone, organization, avatar`,
        [userId, identity.name.slice(0, 255), identity.email, identity.picture.slice(0, 500), identity.uid]
      );
    }
    const user = result.rows[0];
    const id = token(); const csrf = token();
    sessions.set(id, { csrf, expires: Date.now() + lifetime, identity: 'user', userId: user.id });
    res.setHeader('Set-Cookie', `${cookieName}=${id}; ${cookieOptions}`);
    res.json({ success: true, user, data: { user }, csrfToken: csrf });
  } catch (err: any) {
    console.error('[Firebase Login Error]:', err);
    if (err?.code === '23505') return res.status(409).json({ success: false, error: 'Account already exists' });
    return res.status(401).json({ success: false, error: 'Invalid Firebase identity', message: err?.message });
  }
});

/**
 * 5. Current Authenticated Session Profile
 */
authRouter.get('/me', async (req, res) => {
  const found = session(req);
  if (!found || !found.userId) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }
  try {
    const result = await query(
      'SELECT id, name, email, role, phone, organization, avatar, created_at FROM users WHERE id = $1',
      [found.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, user: result.rows[0], data: { user: result.rows[0] }, csrfToken: found.csrf });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Error fetching session user' });
  }
});

/**
 * 6. Search Registered Users (For Event Staff Recruitment & Invitations)
 */
authRouter.get('/search-users', async (req, res) => {
  const found = session(req);
  if (!found) return res.status(401).json({ success: false, error: 'Login required' });
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (q.length < 3 || q.length > 100) return res.status(400).json({ success: false, error: 'Search requires at least three characters' });
  try {
    if (found.identity !== 'operator') {
      const actor = await query('SELECT role FROM users WHERE id = $1', [found.userId]);
      if (actor.rows[0]?.role !== 'organizer') return res.status(403).json({ success: false, error: 'Organizer access required' });
    }
    const sql = `SELECT id, name, email, avatar FROM users WHERE LOWER(name) LIKE $1 OR LOWER(email) LIKE $1 ORDER BY name ASC LIMIT 10`;
    const params = [`%${q.toLowerCase()}%`];
    const result = await query(sql, params);
    res.json({ success: true, users: result.rows, data: { users: result.rows } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to search users' });
  }
});

authRouter.post('/logout', (req, res) => {
  const found = session(req);
  if (found && (!sameOrigin(req) || req.get('x-csrf-token') !== found.csrf)) return res.status(403).json({ success: false, error: 'Request verification failed' });
  const raw = req.headers.cookie?.match(/(?:^|;\s*)zabay_session=([a-f0-9]{64})/)?.[1];
  if (raw) sessions.delete(raw);
  res.setHeader('Set-Cookie', `${cookieName}=; HttpOnly; SameSite=Strict; Path=/api; Max-Age=0${production ? '; Secure' : ''}`);
  res.json({ success: true });
});

