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

### 1. Database-enforced booking integrity
Zabay uses PostgreSQL constraints and a trigger, so direct SQL writes receive the same protection as API requests. `booking_window` is a `TSTZRANGE` using half-open `[)` intervals: adjacent reservations are allowed, while a shared instant inside both intervals is not.

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

EXCLUDE USING gist (
    venue_id WITH =,
    COALESCE(hall_id, 'ALL') WITH =,
    booking_window WITH &&
) WHERE (status = 'confirmed');
```

- The GiST exclusion constraint blocks overlapping confirmed bookings for the same hall.
- A `BEFORE INSERT OR UPDATE` trigger takes a transaction-scoped advisory lock for the venue, then rejects overlaps between a whole-venue booking and any hall booking. Different halls can be booked at the same time.
- A composite foreign key guarantees that a hall belongs to the booking's venue, including for direct database writes. A check constraint requires `end_time > start_time`, and the trigger derives `booking_window` from those timestamp columns.
- Cancelled and pending bookings do not block availability.

The per-venue advisory lock is needed because a simple exclusion constraint over `(venue_id, hall_id, range)` cannot express the asymmetric rule that a whole-venue reservation conflicts with all hall IDs, while two different hall IDs may overlap. The trigger serializes these checks in PostgreSQL without an external lock service.

Confirmed booking inserts and updates must run at PostgreSQL's default
`READ COMMITTED` isolation. Under `REPEATABLE READ` or `SERIALIZABLE`, a
transaction can retain a snapshot taken before it waits for the advisory lock;
the trigger therefore rejects confirmed writes at those isolation levels with
SQLSTATE `0A000` and explains the requirement. Pending and cancelled writes are
not restricted. The Express API uses the connection's normal `READ COMMITTED`
default.

### 2. Multi-Hall Relational Structure
```
venues (1) ───< venue_halls (N)
   │                  │
   └──────────┬───────┘
              │
      venue_bookings (with EXCLUDE and trigger enforcement on tstzrange)
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

`schema.sql` is repeatable for existing databases. Apply it to upgrade a database
created with the earlier schema; it converts `venue_bookings.booking_window` from
`tsrange` to `tstzrange` in place and installs the new checks, foreign key, exclusion
constraint, and trigger. Existing timestamps are interpreted as UTC during the
conversion. The migration first checks that stored ranges agree with `start_time`
and `end_time`, and that confirmed bookings and hall ownership satisfy the new
rules. If it finds incompatible rows, it raises an error containing the affected
booking IDs before altering the booking records. Review and resolve those records
explicitly, then rerun the schema. It does not recreate tables or delete booking
data.

`schema.sql` also adds the `tasks.updated_at` column required by the task status
API. The previously proposed 20-table model and advanced functions are not
implemented.
