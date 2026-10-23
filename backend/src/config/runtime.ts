import dotenv from 'dotenv';
dotenv.config();

export const production = process.env.NODE_ENV === 'production';
export function validateConfig() {
  if (!production) return;
  for (const name of ['DATABASE_URL', 'OPERATOR_USERNAME', 'OPERATOR_PASSWORD']) {
    if (!process.env[name]) throw new Error(`Missing required production environment variable: ${name}`);
  }
  if (process.env.OPERATOR_PASSWORD!.length < 16) throw new Error('OPERATOR_PASSWORD must contain at least 16 characters in production');
  const url = new URL(process.env.DATABASE_URL!);
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error('DATABASE_URL must be PostgreSQL');
  if (!url.hostname.endsWith('.neon.tech') && process.env.PGSSLROOTCERT === undefined) {
    throw new Error('PGSSLROOTCERT is required for non-Neon production PostgreSQL');
  }
}
