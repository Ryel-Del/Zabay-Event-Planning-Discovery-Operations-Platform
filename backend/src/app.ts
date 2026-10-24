import express from 'express';
import cors from 'cors';
import { existsSync } from 'node:fs';
import path from 'node:path';
import apiRouter from './routes';
import { errorHandler } from './middleware/errorHandler';
import { pool } from './config/db';
import { production } from './config/runtime';
const registrationAttempts = new Map<string, { count: number; until: number }>();

export const app = express();
if (production) app.set('trust proxy', 1);
if (!production) app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '64kb' }));
app.use(express.urlencoded({ extended: false, limit: '64kb' }));
app.get('/api/health', (_req, res) => res.json({ status: 'online', service: 'Zabay Backend API' }));
app.get('/api/ready', async (_req, res) => {
  try { await pool.query('SELECT 1'); res.json({ status: 'ready' }); }
  catch { res.status(503).json({ status: 'unavailable' }); }
});
app.post('/api/attendees/register', (req, res, next) => {
  const key = req.ip || 'unknown';
  const previous = registrationAttempts.get(key);
  const now = Date.now();
  const count = previous && previous.until > now ? previous.count : 0;
  if (count >= 30) return res.status(429).json({ success: false, error: 'Too many registration attempts' });
  registrationAttempts.set(key, { count: count + 1, until: now + 15 * 60 * 1000 });
  next();
});
app.use('/api', apiRouter);
app.use('/api', (_req, res) => res.status(404).json({ success: false, error: 'API route not found' }));
if (production) {
  const assets = path.resolve(__dirname, '../../frontend/dist');
  if (existsSync(path.join(assets, 'index.html'))) {
    app.use(express.static(assets, { index: false }));
    app.get('/assets/*', (_req, res) => res.status(404).send('Asset not found'));
    app.get('*', (_req, res) => res.sendFile(path.join(assets, 'index.html')));
  } else {
    app.get('*', (_req, res) => res.status(503).send('Frontend build is unavailable'));
  }
}
app.use(errorHandler);
export default app;
