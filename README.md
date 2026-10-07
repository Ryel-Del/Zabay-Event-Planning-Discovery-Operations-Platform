# ZABAY — Event Planning, Discovery & Operations Platform

ZABAY is a relational-database-driven platform for planning, running, and analyzing events. It models venues, tasks, personnel, and resources as interconnected entities so that organizers can see how a single change — a delayed setup, a cancelled venue slot, an unavailable technician — ripples across every dependent part of an event, instead of discovering the conflict on the day itself.

Beyond basic CRUD, ZABAY derives and evaluates information from these relationships: recursive dependency tracing, schedule-conflict detection, requirement-based venue matching, and constraint-checked resource/personnel assignment are all enforced at the database level, not just in application code.

## 📐 Schema Design

The schema consists of 20 tables covering users, events, venues, tasks, resources, personnel, registrations, payments, attendance, and audit logs.

## Problem Statement

Event planning involves coordinating interconnected requirements — venue availability, task schedules, personnel assignments, and equipment resources — to keep event operations running smoothly. Organizers can usually resolve individual issues as they arise, but a single change before or during an event can affect multiple dependent tasks, resources, personnel, and schedules at once. As the number of interconnected elements grows, tracing these downstream effects by hand becomes impractical.

ZABAY addresses this by modeling these relationships in a centralized relational database, letting organizers validate plans, catch conflicts before they happen, and trace exactly how a change propagates through dependent tasks, personnel, resources, and venue constraints.

## Who Uses It

| Role | What they do |
|---|---|
| **Event Organizer / Administrator** | Creates events, defines requirements (attendance, schedule, venue needs, resources), selects compatible venues, assigns personnel/resources/tasks, defines task dependencies, monitors event readiness, and reviews performance via analytics. |
| **Venue Manager** | Manages venue profiles, capacity, facilities, resources, availability, and booking schedules; reviews bookings and scheduling conflicts. |
| **Attendee** | Discovers public events (search/filter by category, date, location), views event and venue info, registers, pays online when required, and checks in via a QR event pass. |

## Core Functionality

- **Dependency-based change-impact analysis** — recursively traces downstream tasks affected by a schedule, venue, or resource change
- **Schedule impact calculation** — propagates finish-to-start dependencies to flag infeasible schedules
- **Requirement-based venue matching** — compares event requirements (capacity, facilities, resources) against venue capabilities
- **Resource & personnel constraint checking** — prevents over-allocated resources and overlapping personnel assignments, enforced via database triggers
- **Venue booking** with database-level (`EXCLUDE` constraint) prevention of overlapping bookings
- **Public event discovery** — search/filter by category, date, location, with a map view
- **Registration & payment** — Stripe Checkout + webhook-based payment confirmation
- **QR event pass** generation with database-validated, duplicate-proof check-in
- **Business & operational analytics** — registration, attendance rate, venue/resource utilization, task completion, personnel workload, and revenue reporting
- **Audit logging** of significant planning changes and the records they affected

## Tech Stack

| Layer | Choice | Purpose |
|---|---|---|
| Cloud database | PostgreSQL on Neon (or Supabase) | Relational constraints, PL/pgSQL, triggers, stored procedures/functions, recursive queries, transactions, views, indexes, DB roles |
| Backend | Express.js + Prisma | API/application layer, with raw SQL for advanced database logic |
| Raw SQL layer | `.sql` migration files | Version-controlled schema, triggers, procedures, functions, views, indexes |
| Frontend | React + Vite + TailwindCSS | Organizer, venue manager, and attendee interfaces |
| Maps | OpenStreetMap + mapping library | Event/venue location display |
| Payments | Stripe Checkout + Webhooks | Paid registration and payment-status confirmation |
| Analytics | Recharts | Business/operational reporting dashboards |
| Auth & security | JWT + bcrypt, parameterized queries, `.env` secrets, limited-privilege DB role | Authentication, password security, controlled DB access |
| Database tools | DBeaver / pgAdmin / dbdiagram.io | DB management, testing, ERD design |
| Query analysis | `EXPLAIN ANALYZE` | Benchmarking critical queries |

## Database Design Highlights

- **20 tables**: core entities (`users`, `events`, `venues`, `tasks`, `resources`, `personnel`, `registrations`, `payments`, `attendance`, `audit_logs`, etc.) plus junctions (`event_resource_requirements`, `personnel_assignments`, `resource_assignments`)
- **Supertype/subtype pattern**: `task_assignments` holds shared scheduling fields; `personnel_assignments` and `resource_assignments` extend it with type-specific columns
- **`EXCLUDE` constraints** (via `btree_gist`) prevent overlapping venue bookings at the database level — not just in application logic
- **Trigger-enforced constraints** block double-booked personnel and over-allocated resources on overlapping assignment windows
- **Recursive CTEs / PL/pgSQL functions**:
  - `fn_downstream_impact(task_id)` — traces every task downstream of a change
  - `fn_schedule_impact(task_id, new_end)` — propagates a schedule change and flags conflicts
  - `fn_match_venue_to_event(event_id, venue_id)` — checks requirement satisfaction
- **Analytics views** back reporting: `v_event_registration_summary`, `v_venue_utilization`, `v_resource_utilization`, `v_personnel_workload`, `v_task_completion_performance`, `v_event_revenue`, `v_task_readiness`

## Getting Started

### Prerequisites
- Node.js 18+
- A PostgreSQL 14+ database (e.g. a free [Neon](https://neon.tech) or [Supabase](https://supabase.com) project)

### 1. Clone the repo
```bash
git clone https://github.com/<your-username>/zabay.git
cd zabay
```

### 2. Set up the database
```bash
psql "$DATABASE_URL" -f db/zabay_schema.sql
```

### 3. Configure environment variables
Create a `.env` file in the backend directory:
```env
DATABASE_URL=postgresql://user:password@host:5432/zabay
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 4. Install dependencies and run
```bash
# backend
cd backend && npm install && npm run dev

# frontend
cd frontend && npm install && npm run dev
```

## Project Structure
```
zabay/
├── db/
│   └── zabay_schema.sql       # Full schema: tables, constraints, triggers, functions, views
├── backend/                   # Express.js + Prisma API
├── frontend/                  # React + Vite + Tailwind client
└── README.md
```

## Roadmap
- [ ] Organizer dashboard (event readiness, dependency-impact viewer)
- [ ] Venue manager booking calendar
- [ ] Attendee discovery + map view
- [ ] Stripe Checkout integration
- [ ] QR check-in scanner
- [ ] Analytics dashboard (Recharts)

## License
[MIT](./LICENSE)
