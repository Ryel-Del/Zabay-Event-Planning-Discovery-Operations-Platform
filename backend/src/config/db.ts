import { Pool } from 'pg';
import { readFileSync } from 'node:fs';
import { production } from './runtime';

const url = process.env.DATABASE_URL;
// Explicit TLS options must take precedence over URL query parameters.
const connectionString = url && production ? (() => { const parsed = new URL(url); parsed.searchParams.delete('sslmode'); parsed.searchParams.delete('sslrootcert'); parsed.searchParams.delete('sslcert'); parsed.searchParams.delete('sslkey'); return parsed.toString(); })() : url;
const ssl = production ? { rejectUnauthorized: true, ...(process.env.PGSSLROOTCERT ? { ca: readFileSync(process.env.PGSSLROOTCERT, 'utf8') } : {}) } : undefined;
export const pool = new Pool({
  ...(connectionString ? { connectionString } : {
    host: process.env.PGHOST || 'localhost',
    port: Number(process.env.PGPORT || 5432),
    database: process.env.PGDATABASE || 'zabay_db',
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'postgres',
  }),
  ssl, max: 5, idleTimeoutMillis: 30000, connectionTimeoutMillis: 5000,
});
pool.on('error', () => console.error('Idle PostgreSQL connection failed'));
export const query = (text: string, params?: unknown[]) => pool.query(text, params);
