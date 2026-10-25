# Zabay Backend API

Node.js, Express, and PostgreSQL REST API for the **ZABAY** Event Operations Platform in Bohol.

---

## Architecture Overview

```
backend/
├── src/
│   ├── config/              # PostgreSQL Pool configuration (pg)
│   ├── controllers/         # Request handling & SQL transactions
│   ├── middleware/          # Error boundaries & constraint code handling
│   ├── routes/              # Express domain route definitions
│   └── server.ts            # Entry point & CORS configuration
├── .env.example             # Template environment variables
├── package.json
└── tsconfig.json
```

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy the example environment file:
```bash
cp .env.example .env
```
Ensure your PostgreSQL database credentials (`DATABASE_URL` or `PGUSER`, `PGPASSWORD`, `PGDATABASE`) match your local or cloud PostgreSQL instance.

### 3. Run Development Server
```bash
npm run dev
```

The API will be available at:
`http://localhost:5000/api`

### Database initialization

From the repository root, run `psql -U postgres -d zabay_db -f db/schema.sql`. Load `db/seeds/bohol_venues_seed.sql` only for an isolated synthetic demo database. The backend uses
`DATABASE_URL` when present, otherwise the `PG*` variables shown in `.env.example`.

### Tests and build

Run `npm run build` to compile TypeScript and `npm test` to run the API suite. The
health test is always run. Database-mutating tests run only when `TEST_DATABASE_URL`
is explicitly set and its database name contains `test`; the test process then uses
that URL as `DATABASE_URL`. CI provisions PostgreSQL, applies the schema and seed, and
runs the API checks. Operator authentication is implemented; payments and the proposed expanded schema are not.

---

## API Endpoints

### Health
- `GET /api/health` — Process liveness probe

- `GET /api/ready` — PostgreSQL readiness probe
- `POST /api/auth/login` / `POST /api/auth/logout` / `GET /api/auth/session` — operator session

### Events
- `GET /api/events` — Retrieve public & organizer events
- `GET /api/events/:id` — Event details
- `POST /api/events` — Create new event (operator)

### Venues & Multi-Hall Booking
- `GET /api/venues` — Retrieve venue and hall records
- `GET /api/venues/:id` — Venue details, halls, and bookings
- `POST /api/venues/:id/book` — Operator or owning organizer: reserve a venue or specific hall

### Operations & Tasks
- `GET /api/tasks` — Operator tasks or an organizer's own event tasks
- `PATCH /api/tasks/:id/status` — Operator or owning organizer: move task across Kanban states

### Attendees & Check-In
- `POST /api/attendees/register` — Generate digital pass & registration
- `POST /api/attendees/checkin` — Operator or owning organizer: validate QR pass & prevent duplicate entries

See [deployment setup](../DEPLOYMENT.md) for production variables, TLS, and initialization.

### Authentication setup (security boundary)

Set `FIREBASE_PROJECT_ID` on the Express backend to the Firebase project used by the
frontend's `VITE_FIREBASE_PROJECT_ID`. The Firebase Admin SDK verifies ID tokens
against this project; Google sign-in is unavailable when the backend variable is
absent. Keep Firebase Admin credentials, if required by the hosting environment,
server-side only. Do not put service account JSON or private keys in frontend
variables or the repository. The browser supplies only a Firebase ID token to
`POST /api/auth/firebase-login`; the backend creates or resumes an attendee session
bound to `users.firebase_uid`. An existing email account is never linked by email
alone. Account linking and password activation for legacy passwordless accounts
require an administrator-controlled, independently verified process. No public
endpoint sets a legacy password or elevates a role.

`OPERATOR_USERNAME` and `OPERATOR_PASSWORD` retain the existing deployment operator
login. `DEV_ACCESS_KEY` is optional and works only outside production; it authorizes
local demo UI state and does not create an operator session. If the frontend and
backend use distinct origins, set `CLIENT_URL` on the backend to the exact frontend
origin for origin checks. Public registration always creates an attendee account.
Organizers and venue managers must be assigned through a trusted administrative
process before their server privileges are available. Browser staff invitations
remain local workflow data and do not alter database roles.
Staff sessions cannot perform server check-in or task mutations until an event
assignment is represented in trusted backend records. Public auth endpoints use
per-IP, per-route 15-minute attempt limits (10 password or registration attempts,
20 Firebase token exchanges). Deployments with multiple backend processes need a
shared limiter before relying on these process-local limits for fleet-wide abuse
control.
