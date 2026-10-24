# Render + Neon deployment preparation

This is a **proposed** single-service deployment. No Render or Neon service has been provisioned or tested.

## Create and initialize PostgreSQL

Create a PostgreSQL 16 database in Neon and copy its connection string. Use a dedicated role with permission to create objects and the `btree_gist` extension. On a **new empty database** run:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/schema.sql
```

Verify `SELECT extname FROM pg_extension WHERE extname = 'btree_gist';` and inspect the exclusion constraint and booking trigger. `schema.sql` creates the required tables and integrity rules; it is never run at app startup. Apply schema changes intentionally after a backup. PostgreSQL 16 was tested in a disposable local container. Neon extension permissions and TLS have not been tested against a real account.

`db/seeds/bohol_venues_seed.sql` is **synthetic demonstration data**, including users, venues, halls, and tasks. Do not load it into a production database containing actual operations. If a public demo requires it, load it once into an isolated demonstration database and clearly label all records as samples. Real operator identity is configured through environment variables and is unrelated to the seed `users` table.

## Render web service

Connect this repository after the integration branch is merged. Use Node.js 22 or newer, root directory at repository root, build command `npm run build`, start command `npm start`, and health path `/api/health`. Set:

| Variable | Purpose |
| --- | --- |
| `NODE_ENV=production` | Enables secure cookies, TLS, static frontend, and production validation. |
| `DATABASE_URL` | Neon PostgreSQL connection string. Store as a secret. |
| `OPERATOR_USERNAME` | Single operator login name. Store as a secret. |
| `OPERATOR_PASSWORD` | Long random operator password, at least 16 characters. Store as a secret. |
| `PORT` | Render assigns this automatically. Do not hardcode it. |
| `PGSSLROOTCERT` | Optional CA certificate path for custom PostgreSQL providers; required for non-Neon production hosts. |

Use Render's secret environment settings. Do not commit credentials or place them in `VITE_` variables. The service uses secure HTTP-only, SameSite=Strict cookies and an eight-hour server-side session. A restart ends all sessions. Only one service instance should run because sessions and rate limits are process-local. Configure a single instance and use `/api/ready` to verify database access during release checks. `/api/health` confirms the process responds even if the database is unavailable.

Build output is `frontend/dist` and `backend/dist`. Express serves React and `/api` from one origin, with a frontend route fallback. Missing frontend assets produce 503. Development still uses Vite on port 5173 and Express on port 5000.

## Local production check

Use a disposable PostgreSQL 16 database with a name containing `test`, initialize the schema, and run:

```bash
npm run build
NODE_ENV=production DATABASE_URL="$DATABASE_URL" OPERATOR_USERNAME=operator OPERATOR_PASSWORD='replace-with-a-long-random-secret' PORT=5000 npm start
curl -f http://127.0.0.1:5000/api/health
curl -f http://127.0.0.1:5000/api/ready
curl -f http://127.0.0.1:5000/
```

A local PostgreSQL server without TLS is unsuitable for `NODE_ENV=production`; use a test server with a trusted TLS certificate and set `PGSSLROOTCERT` as needed. The disposable local integration and Cypress tests run in development mode against PostgreSQL 16.

## Operations and limits

Free tiers can sleep, cold-start slowly, and have small compute and connection allowances; verify current Render and Neon plans before provisioning. The connection pool is capped at five. Back up before schema changes and periodically export data using `pg_dump`; restore to a fresh database with `pg_restore`, validate counts and booking constraints, then switch `DATABASE_URL`. Confirm the provider's own retention and restore features. Roll back by redeploying the last known good commit and restoring a database backup if a schema change is incompatible. Avoid running an older application against a changed schema without a compatibility check.

This MVP has one shared operator identity, process-local sessions and rate limits, no password recovery or audit-grade identity attribution, and no production data migration. The role switcher, personnel editor, workflow templates, scheduling impact simulator, and demo mode are frontend simulations. Browser-selected roles do not authorize API calls. Attendee registration is public and issues a pass without payment. Actual hosting, managed PostgreSQL TLS, DNS, backups, scale behavior, and public abuse controls require verification before deployment.

## Dependency audit at this milestone

`npm audit` reports three high-severity nodes in one development-only chain: direct `ts-node-dev` → transitive `chokidar` → transitive `braces` (GHSA-vfj7-8cjw-p6xm, stack exhaustion from deeply nested patterns). The affected glob parsing is exercised by the development file watcher; it is not in the running production service. npm reports no compatible automatic fix for this chain. `npm audit --omit=dev` reports zero vulnerabilities. Revisit the dev runner when a compatible maintained replacement is chosen; do not use `npm audit fix --force` solely to silence this finding.
