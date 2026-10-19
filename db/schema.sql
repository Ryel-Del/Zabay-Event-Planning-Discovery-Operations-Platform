-- ========================================================
-- ZABAY EVENT OPERATIONS PLATFORM - POSTGRESQL SCHEMA
-- Models the 20-Table Relational Schema with GiST EXCLUDE
-- ========================================================

-- Enable required PostgreSQL extension for temporal EXCLUDE constraints
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(32) NOT NULL CHECK (role IN ('organizer', 'venue_manager', 'staff', 'attendee', 'admin')),
    phone VARCHAR(64),
    avatar VARCHAR(500),
    organization VARCHAR(255),
    location VARCHAR(255),
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. VENUES TABLE
CREATE TABLE IF NOT EXISTS venues (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    lat NUMERIC(9, 6) NOT NULL,
    lng NUMERIC(9, 6) NOT NULL,
    capacity INT NOT NULL CHECK (capacity > 0),
    hourly_rate NUMERIC(10, 2) NOT NULL CHECK (hourly_rate >= 0),
    facilities TEXT[] DEFAULT '{}',
    power_kw_capacity INT NOT NULL CHECK (power_kw_capacity > 0),
    is_indoor BOOLEAN NOT NULL DEFAULT true,
    operating_hours_open VARCHAR(8) NOT NULL DEFAULT '06:00',
    operating_hours_close VARCHAR(8) NOT NULL DEFAULT '23:59',
    manager_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    image_url VARCHAR(500),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. VENUE HALLS / SUB-VENUES TABLE
CREATE TABLE IF NOT EXISTS venue_halls (
    id VARCHAR(64) PRIMARY KEY,
    venue_id VARCHAR(64) NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    capacity INT NOT NULL CHECK (capacity > 0),
    hourly_rate NUMERIC(10, 2) NOT NULL CHECK (hourly_rate >= 0),
    is_indoor BOOLEAN NOT NULL DEFAULT true,
    dimensions VARCHAR(120),
    facilities TEXT[] DEFAULT '{}',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT venue_halls_id_venue_unique UNIQUE (id, venue_id)
);

-- 4. EVENTS TABLE
CREATE TABLE IF NOT EXISTS events (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(64) NOT NULL,
    event_type VARCHAR(32) NOT NULL DEFAULT 'public' CHECK (event_type IN ('public', 'private', 'invite_only')),
    is_private BOOLEAN NOT NULL DEFAULT false,
    status VARCHAR(32) NOT NULL DEFAULT 'planning' CHECK (status IN ('draft', 'planning', 'ready', 'in_progress', 'completed', 'cancelled')),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    organizer_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    venue_id VARCHAR(64) REFERENCES venues(id) ON DELETE SET NULL,
    hall_id VARCHAR(64) REFERENCES venue_halls(id) ON DELETE SET NULL,
    hall_name VARCHAR(255),
    expected_attendance INT NOT NULL DEFAULT 100,
    max_capacity INT NOT NULL DEFAULT 200,
    ticket_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    budget NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    banner_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT chk_event_dates CHECK (end_date > start_date)
);

-- 5. VENUE BOOKINGS TABLE (With Database-Level Non-Overlap Enforcement)
CREATE TABLE IF NOT EXISTS venue_bookings (
    id VARCHAR(64) PRIMARY KEY,
    venue_id VARCHAR(64) NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    hall_id VARCHAR(64) REFERENCES venue_halls(id) ON DELETE SET NULL,
    hall_name VARCHAR(255),
    event_id VARCHAR(64) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    event_title VARCHAR(255) NOT NULL,
    booking_window TSTZRANGE NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'pending', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT venue_bookings_time_order CHECK (end_time > start_time),
    CONSTRAINT venue_bookings_window_matches_times CHECK (
        booking_window = tstzrange(start_time, end_time, '[)')
    ),
    -- This handles same-hall conflicts. A trigger below also covers whole-venue bookings.
    EXCLUDE USING gist (
        venue_id WITH =,
        COALESCE(hall_id, 'ALL') WITH =,
        booking_window WITH &&
    ) WHERE (status = 'confirmed')
);

-- Refuse to install enforcement over legacy records that violate the new rules.
DO $$
DECLARE
    conflict_ids TEXT;
BEGIN
    SELECT string_agg(id, ', ' ORDER BY id) INTO conflict_ids
    FROM venue_bookings WHERE end_time <= start_time;
    IF conflict_ids IS NOT NULL THEN
        RAISE EXCEPTION 'Cannot enforce venue booking integrity; invalid time ranges for booking ids: %', conflict_ids;
    END IF;

    SELECT string_agg(a.id || '/' || b.id, ', ' ORDER BY a.id, b.id)
      INTO conflict_ids
    FROM venue_bookings a
    JOIN venue_bookings b ON a.id < b.id
      AND a.venue_id = b.venue_id
      AND a.status = 'confirmed' AND b.status = 'confirmed'
      AND tstzrange(a.start_time, a.end_time, '[)') && tstzrange(b.start_time, b.end_time, '[)')
      AND (a.hall_id IS NULL OR b.hall_id IS NULL OR a.hall_id = b.hall_id);
    IF conflict_ids IS NOT NULL THEN
        RAISE EXCEPTION 'Cannot enforce venue booking integrity; conflicting booking ids: %', conflict_ids;
    END IF;

    SELECT string_agg(b.id, ', ' ORDER BY b.id) INTO conflict_ids
    FROM venue_bookings b
    LEFT JOIN venue_halls h ON h.id = b.hall_id AND h.venue_id = b.venue_id
    WHERE b.hall_id IS NOT NULL AND h.id IS NULL;
    IF conflict_ids IS NOT NULL THEN
        RAISE EXCEPTION 'Cannot enforce venue booking integrity; hall/venue mismatches for booking ids: %', conflict_ids;
    END IF;
END $$;

-- Upgrade the original tsrange column in place. Legacy API values represented
-- UTC wall-clock timestamps; refuse inconsistent rows instead of rewriting them.
DO $$
DECLARE
    constraint_row RECORD;
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = current_schema() AND table_name = 'venue_bookings'
          AND column_name = 'booking_window' AND udt_name = 'tsrange'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM venue_bookings
            WHERE end_time <= start_time
               OR lower(booking_window) IS DISTINCT FROM (start_time AT TIME ZONE 'UTC')
               OR upper(booking_window) IS DISTINCT FROM (end_time AT TIME ZONE 'UTC')
        ) THEN
            RAISE EXCEPTION 'Cannot migrate venue_bookings: invalid or inconsistent booking times exist';
        END IF;

        FOR constraint_row IN
            SELECT conname FROM pg_constraint
            WHERE conrelid = 'venue_bookings'::regclass AND contype = 'x'
        LOOP
            EXECUTE format('ALTER TABLE venue_bookings DROP CONSTRAINT %I', constraint_row.conname);
        END LOOP;

        ALTER TABLE venue_bookings ALTER COLUMN booking_window TYPE TSTZRANGE
            USING tstzrange(lower(booking_window) AT TIME ZONE 'UTC',
                            upper(booking_window) AT TIME ZONE 'UTC', '[)');
        ALTER TABLE venue_bookings
            ADD CONSTRAINT venue_bookings_venue_hall_window_excl
            EXCLUDE USING gist (
                venue_id WITH =,
                COALESCE(hall_id, 'ALL') WITH =,
                booking_window WITH &&
            ) WHERE (status = 'confirmed');
    END IF;
END $$;

-- A composite FK makes hall ownership invariant under direct SQL updates too.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'venue_halls'::regclass AND conname = 'venue_halls_id_venue_unique') THEN
        ALTER TABLE venue_halls ADD CONSTRAINT venue_halls_id_venue_unique UNIQUE (id, venue_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'venue_bookings'::regclass AND conname = 'venue_bookings_hall_venue_fk') THEN
        ALTER TABLE venue_bookings
            ADD CONSTRAINT venue_bookings_hall_venue_fk
            FOREIGN KEY (hall_id, venue_id) REFERENCES venue_halls (id, venue_id)
            ON UPDATE RESTRICT;
    END IF;
END $$;

-- Add named checks for databases created by earlier versions.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'venue_bookings'::regclass AND conname = 'venue_bookings_time_order') THEN
        ALTER TABLE venue_bookings ADD CONSTRAINT venue_bookings_time_order CHECK (end_time > start_time);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'venue_bookings'::regclass AND conname = 'venue_bookings_window_matches_times') THEN
        ALTER TABLE venue_bookings ADD CONSTRAINT venue_bookings_window_matches_times
            CHECK (booking_window = tstzrange(start_time, end_time, '[)'));
    END IF;
END $$;

CREATE OR REPLACE FUNCTION enforce_venue_booking_integrity()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    lock_key BIGINT;
    old_venue_id VARCHAR(64);
BEGIN
    IF NEW.end_time <= NEW.start_time THEN
        RAISE EXCEPTION 'Booking end_time must be later than start_time'
            USING ERRCODE = '23514', CONSTRAINT = 'venue_bookings_time_order';
    END IF;
    NEW.booking_window := tstzrange(NEW.start_time, NEW.end_time, '[)');

    IF NEW.hall_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM venue_halls h WHERE h.id = NEW.hall_id AND h.venue_id = NEW.venue_id
    ) THEN
        RAISE EXCEPTION 'Booking hall_id must belong to venue_id'
            USING ERRCODE = '23514', CONSTRAINT = 'venue_bookings_hall_venue_match';
    END IF;

    old_venue_id := NEW.venue_id;
    IF TG_OP = 'UPDATE' THEN old_venue_id := OLD.venue_id; END IF;
    IF NEW.status = 'confirmed' THEN
        IF current_setting('transaction_isolation') <> 'read committed' THEN
            RAISE EXCEPTION 'Confirmed venue booking writes require READ COMMITTED transaction isolation'
                USING ERRCODE = '0A000', CONSTRAINT = 'venue_bookings_isolation_level';
        END IF;

        -- Serialize all confirmed changes per venue. Database-direct writes
        -- take the same transaction scoped advisory lock as API requests.
        FOR lock_key IN
            SELECT DISTINCT hashtextextended('venue-booking:' || v, 0)
            FROM unnest(ARRAY[NEW.venue_id, old_venue_id]) AS v
            ORDER BY 1
        LOOP
            PERFORM pg_advisory_xact_lock(lock_key);
        END LOOP;

        IF EXISTS (
            SELECT 1 FROM venue_bookings b
            WHERE b.id IS DISTINCT FROM NEW.id
              AND b.venue_id = NEW.venue_id AND b.status = 'confirmed'
              AND tstzrange(b.start_time, b.end_time, '[)') && tstzrange(NEW.start_time, NEW.end_time, '[)')
              AND (NEW.hall_id IS NULL OR b.hall_id IS NULL OR b.hall_id = NEW.hall_id)
        ) THEN
            RAISE EXCEPTION 'Confirmed booking overlaps an existing booking at this venue'
                USING ERRCODE = '23P01', CONSTRAINT = 'venue_bookings_venue_overlap';
        END IF;
    END IF;
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS venue_bookings_integrity_trigger ON venue_bookings;
CREATE TRIGGER venue_bookings_integrity_trigger
BEFORE INSERT OR UPDATE ON venue_bookings
FOR EACH ROW EXECUTE FUNCTION enforce_venue_booking_integrity();

-- 6. TASKS TABLE (Run-of-show & operations)
CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(64) PRIMARY KEY,
    event_id VARCHAR(64) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    track VARCHAR(64) NOT NULL CHECK (track IN ('venue_logistics', 'technical_av', 'marketing_tickets', 'day_of_ops')),
    status VARCHAR(32) NOT NULL DEFAULT 'todo' CHECK (status IN ('backlog', 'todo', 'in_progress', 'completed', 'blocked')),
    priority VARCHAR(16) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    start_time VARCHAR(8) NOT NULL,
    end_time VARCHAR(8) NOT NULL,
    dependencies TEXT[] DEFAULT '{}',
    is_critical_path BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Compatibility for task status updates on databases created before this field existed.
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;

-- 7. PERSONNEL DIRECTORY TABLE
CREATE TABLE IF NOT EXISTS personnel (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL,
    skills TEXT[] DEFAULT '{}',
    phone VARCHAR(64) NOT NULL,
    email VARCHAR(255) NOT NULL,
    hourly_rate NUMERIC(10, 2) NOT NULL,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. REGISTRATIONS & TICKETS TABLE
CREATE TABLE IF NOT EXISTS registrations (
    id VARCHAR(64) PRIMARY KEY,
    event_id VARCHAR(64) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    attendee_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    attendee_name VARCHAR(255) NOT NULL,
    attendee_email VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'checked_in', 'cancelled')),
    ticket_type VARCHAR(64) NOT NULL DEFAULT 'General Admission',
    qr_pass_code VARCHAR(64) UNIQUE NOT NULL,
    amount_paid NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. ATTENDANCE VERIFICATION RECORDS TABLE
CREATE TABLE IF NOT EXISTS attendance_records (
    id VARCHAR(64) PRIMARY KEY,
    event_id VARCHAR(64) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    registration_id VARCHAR(64) NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
    attendee_name VARCHAR(255) NOT NULL,
    check_in_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_by VARCHAR(64) NOT NULL,
    is_duplicate BOOLEAN DEFAULT false
);

-- 10. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    action VARCHAR(64) NOT NULL,
    entity_type VARCHAR(64) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    change_summary TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
