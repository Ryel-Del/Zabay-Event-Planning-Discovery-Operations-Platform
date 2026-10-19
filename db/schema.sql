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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

-- 5. VENUE BOOKINGS TABLE (With Database-Level Non-Overlap EXCLUDE Constraint)
CREATE TABLE IF NOT EXISTS venue_bookings (
    id VARCHAR(64) PRIMARY KEY,
    venue_id VARCHAR(64) NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    hall_id VARCHAR(64) REFERENCES venue_halls(id) ON DELETE SET NULL,
    hall_name VARCHAR(255),
    event_id VARCHAR(64) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    event_title VARCHAR(255) NOT NULL,
    booking_window TSRANGE NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'pending', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- PostgreSQL GiST EXCLUDE constraint prevents overlapping time intervals for the same venue/hall!
    EXCLUDE USING gist (
        venue_id WITH =,
        COALESCE(hall_id, 'ALL') WITH =,
        booking_window WITH &&
    ) WHERE (status = 'confirmed')
);

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
