# Zabay Database (PostgreSQL)

Relational database schema, constraint definitions, and seed data for the **ZABAY** Event Operations Platform.

---

## Architecture Overview

```
db/
├── schema.sql                     # Full relational schema with GiST EXCLUDE constraints
├── seeds/
│   └── bohol_venues_seed.sql      # Verified Tagbilaran & Bohol venues, halls, and users
└── README.md
```

---

## Core Schema Highlights

### 1. Temporal `EXCLUDE` Constraint (Double-Booking Prevention)
Zabay enforces conflict-free venue and hall scheduling directly at the PostgreSQL database engine level using the `btree_gist` extension:

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

EXCLUDE USING gist (
    venue_id WITH =,
    COALESCE(hall_id, 'ALL') WITH =,
    booking_window WITH &&
) WHERE (status = 'confirmed');
```

- **Venue-Level Reservation:** If a booking does not specify a `hall_id` (`COALESCE(hall_id, 'ALL')`), it reserves the entire venue.
- **Hall-Level Partitioning:** If a booking reserves a specific hall (e.g. `Dagohoy Grand Hall` at Bohol Tropics), another concurrent booking can safely reserve `Sandugo Grand Ballroom` or `Harbor View Function Hall` without triggering a collision.

### 2. Multi-Hall Relational Structure
```
venues (1) ───< venue_halls (N)
   │                  │
   └──────────┬───────┘
              │
      venue_bookings (with EXCLUDE on tsrange)
```

---

## Running Database Setup

### 1. Create Database in PostgreSQL
```bash
createdb -U postgres zabay_db
```

### 2. Apply Schema
```bash
psql -U postgres -d zabay_db -f schema.sql
```

### 3. Load Verified Bohol Venues Seed Data
```bash
psql -U postgres -d zabay_db -f seeds/bohol_venues_seed.sql
```

`schema.sql` is repeatable for existing databases and adds the `tasks.updated_at`
column with `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, which is required by the task
status API. This repository currently implements the schema in this file only; the
previously proposed 20-table model and advanced functions are not implemented.
