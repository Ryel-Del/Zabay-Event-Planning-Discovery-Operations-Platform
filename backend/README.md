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

From the repository root, run `psql -U postgres -d zabay_db -f db/schema.sql` and then
`psql -U postgres -d zabay_db -f db/seeds/bohol_venues_seed.sql`. The backend uses
`DATABASE_URL` when present, otherwise the `PG*` variables shown in `.env.example`.

### Tests and build

Run `npm run build` to compile TypeScript and `npm test` to run the API suite. The
health test is always run. Database-mutating tests run only when `TEST_DATABASE_URL`
is explicitly set and its database name contains `test`; the test process then uses
that URL as `DATABASE_URL`. CI provisions PostgreSQL, applies the schema and seed, and
runs both checks. Authentication, payments, and the proposed expanded schema are not
yet implemented.

---

## API Endpoints

### Health
- `GET /api/health` — Service status probe

### Events
- `GET /api/events` — Retrieve public & organizer events
- `GET /api/events/:id` — Event details
- `POST /api/events` — Create new event

### Venues & Multi-Hall Booking
- `GET /api/venues` — Retrieve verified Bohol venues and halls
- `GET /api/venues/:id` — Venue details, halls, and bookings
- `POST /api/venues/:id/book` — Reserve a venue or specific hall (enforces PostgreSQL `EXCLUDE` constraint)

### Operations & Tasks
- `GET /api/tasks` — Tasks for run-of-show
- `PATCH /api/tasks/:id/status` — Move task across Kanban states

### Attendees & Check-In
- `POST /api/attendees/register` — Generate digital pass & registration
- `POST /api/attendees/checkin` — Validate QR pass & prevent duplicate turnstile entries
