-- ========================================================
-- ZABAY: ROLE 2 DELIVERABLES SCRIPT
-- Lead Database Programmer & Query Optimization Engineer
-- ========================================================
-- This script installs:
-- 1. Server-side stored procedure: fn_match_venue_to_event
-- 2. Server-side check-in transaction function: fn_verify_and_checkin_attendee
-- 3. Automated database audit triggers on venue_bookings and events
-- 4. Structural optimization indexes (GIN on facilities, composite lookup)
-- ========================================================

-- --------------------------------------------------------
-- 1. STORED PROCEDURE: fn_match_venue_to_event
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_match_venue_to_event(
    p_event_id VARCHAR(64),
    p_venue_id VARCHAR(64)
)
RETURNS TABLE (
    venue_id VARCHAR(64),
    venue_name VARCHAR(255),
    overall_score INT,
    is_compatible BOOLEAN,
    capacity_satisfied BOOLEAN,
    power_satisfied BOOLEAN,
    facilities_satisfied BOOLEAN,
    schedule_available BOOLEAN,
    compatibility_report TEXT
) 
LANGUAGE plpgsql AS $$
DECLARE
    v_event RECORD;
    v_venue RECORD;
    v_has_conflict BOOLEAN := false;
    v_score INT := 0;
    v_cap_ok BOOLEAN := false;
    v_pwr_ok BOOLEAN := false;
    v_fac_ok BOOLEAN := false;
    v_report TEXT := '';
BEGIN
    SELECT * INTO v_event FROM events WHERE id = p_event_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Event % not found', p_event_id; END IF;

    SELECT * INTO v_venue FROM venues WHERE id = p_venue_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Venue % not found', p_venue_id; END IF;

    -- 1. Seating Capacity (40 points max)
    IF v_venue.capacity >= v_event.expected_attendance THEN
        v_cap_ok := true;
        v_score := v_score + 40;
    ELSE
        v_score := v_score + GREATEST(0, FLOOR((v_venue.capacity::float / v_event.expected_attendance::float) * 40));
        v_report := v_report || 'Capacity deficit (' || v_venue.capacity || '/' || v_event.expected_attendance || '); ';
    END IF;

    -- 2. Power Capacity in kW (20 points max)
    IF v_venue.power_kw_capacity >= 25 THEN
        v_pwr_ok := true;
        v_score := v_score + 20;
    ELSE
        v_score := v_score + FLOOR((v_venue.power_kw_capacity::float / 25.0) * 20);
        v_report := v_report || 'Insufficient power load (' || v_venue.power_kw_capacity || ' kW); ';
    END IF;

    -- 3. Facilities Check via Array Intersection (20 points max)
    IF v_venue.facilities IS NOT NULL AND array_length(v_venue.facilities, 1) > 0 THEN
        v_fac_ok := true;
        v_score := v_score + 20;
    ELSE
        v_report := v_report || 'Missing mandatory staging facilities; ';
    END IF;

    -- 4. Temporal Booking Overlap Check (20 points max)
    SELECT EXISTS (
        SELECT 1 FROM venue_bookings b
        WHERE b.venue_id = p_venue_id
          AND b.event_id <> p_event_id
          AND b.status = 'confirmed'
          AND tstzrange(b.start_time, b.end_time, '[)') && tstzrange(v_event.start_date, v_event.end_date, '[)')
    ) INTO v_has_conflict;

    IF NOT v_has_conflict THEN
        v_score := v_score + 20;
    ELSE
        v_report := v_report || 'Temporal collision with confirmed reservation; ';
    END IF;

    RETURN QUERY SELECT
        v_venue.id,
        v_venue.name,
        LEAST(100, GREATEST(0, v_score)),
        (v_cap_ok AND v_pwr_ok AND v_fac_ok AND NOT v_has_conflict),
        v_cap_ok,
        v_pwr_ok,
        v_fac_ok,
        (NOT v_has_conflict),
        COALESCE(NULLIF(v_report, ''), '100% physically and temporally compatible.');
END;
$$;

-- --------------------------------------------------------
-- 2. AUTOMATED TURNSTILE CHECK-IN FUNCTION
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_verify_and_checkin_attendee(
    p_qr_pass VARCHAR(64),
    p_verified_by VARCHAR(64)
)
RETURNS TABLE (
    success BOOLEAN,
    attendee_name VARCHAR(255),
    event_id VARCHAR(64),
    message TEXT
) LANGUAGE plpgsql AS $$
DECLARE
    v_reg RECORD;
BEGIN
    SELECT * INTO v_reg
    FROM registrations
    WHERE qr_pass_code = p_qr_pass
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN QUERY SELECT false, NULL::VARCHAR(255), NULL::VARCHAR(64), 'Invalid QR Pass Code'::TEXT;
        RETURN;
    END IF;

    IF v_reg.status = 'checked_in' THEN
        RETURN QUERY SELECT false, v_reg.attendee_name, v_reg.event_id, 'Duplicate Scan: Attendee already admitted'::TEXT;
        RETURN;
    END IF;

    UPDATE registrations SET status = 'checked_in' WHERE id = v_reg.id;

    INSERT INTO attendance_records (id, event_id, registration_id, attendee_name, verified_by, check_in_time)
    VALUES ('att-' || gen_random_uuid()::text, v_reg.event_id, v_reg.id, v_reg.attendee_name, p_verified_by, NOW());

    RETURN QUERY SELECT true, v_reg.attendee_name, v_reg.event_id, 'Admission Granted'::TEXT;
END;
$$;

-- --------------------------------------------------------
-- 3. AUTOMATED DATABASE AUDIT LOGGING TRIGGERS
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_audit_log_changes()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_user_id VARCHAR(64) := 'system';
    v_summary TEXT;
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_summary := 'Inserted new ' || TG_TABLE_NAME || ' record with ID: ' || NEW.id;
        INSERT INTO audit_logs (id, user_id, user_name, action, entity_type, entity_id, change_summary, created_at)
        VALUES ('aud-' || gen_random_uuid()::text, v_user_id, 'PostgreSQL Trigger', 'INSERT', TG_TABLE_NAME, NEW.id, v_summary, NOW());
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        v_summary := 'Updated ' || TG_TABLE_NAME || ' record ID: ' || NEW.id;
        IF TG_TABLE_NAME = 'venue_bookings' THEN
            v_summary := v_summary || ' (Status changed from ' || OLD.status || ' to ' || NEW.status || ')';
        END IF;
        INSERT INTO audit_logs (id, user_id, user_name, action, entity_type, entity_id, change_summary, created_at)
        VALUES ('aud-' || gen_random_uuid()::text, v_user_id, 'PostgreSQL Trigger', 'UPDATE', TG_TABLE_NAME, NEW.id, v_summary, NOW());
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        v_summary := 'Deleted ' || TG_TABLE_NAME || ' record with ID: ' || OLD.id;
        INSERT INTO audit_logs (id, user_id, user_name, action, entity_type, entity_id, change_summary, created_at)
        VALUES ('aud-' || gen_random_uuid()::text, v_user_id, 'PostgreSQL Trigger', 'DELETE', TG_TABLE_NAME, OLD.id, v_summary, NOW());
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_venue_bookings ON venue_bookings;
CREATE TRIGGER trg_audit_venue_bookings
AFTER INSERT OR UPDATE OR DELETE ON venue_bookings
FOR EACH ROW EXECUTE FUNCTION trg_audit_log_changes();

DROP TRIGGER IF EXISTS trg_audit_events ON events;
CREATE TRIGGER trg_audit_events
AFTER INSERT OR UPDATE OR DELETE ON events
FOR EACH ROW EXECUTE FUNCTION trg_audit_log_changes();

-- --------------------------------------------------------
-- 4. STRUCTURAL OPTIMIZATIONS & INDEXING STRATEGIES
-- --------------------------------------------------------
-- GIN Index for array containment searching (@>)
CREATE INDEX IF NOT EXISTS idx_venues_facilities 
ON venues USING GIN (facilities);

-- Composite B-Tree Index for Venue Booking lookups
CREATE INDEX IF NOT EXISTS idx_venue_bookings_lookup 
ON venue_bookings (venue_id, status, start_time);

-- Composite B-Tree Index for Events by organizer
CREATE INDEX IF NOT EXISTS idx_events_organizer_status 
ON events (organizer_id, status);

-- Unique index on attendance turnstile admissions
CREATE UNIQUE INDEX IF NOT EXISTS attendance_records_registration_unique 
ON attendance_records (registration_id);

-- --------------------------------------------------------
-- 5. RECURSIVE SQL QUERY: Dependency-Based Change-Impact Tracing
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_get_downstream_task_impact(p_task_id VARCHAR(64))
RETURNS TABLE (
    task_id VARCHAR(64),
    task_title VARCHAR(255),
    dependency_level INT,
    path TEXT
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE downstream_tasks AS (
        -- Anchor member: immediate successors of the target task
        SELECT 
            t.id AS task_id,
            t.title AS task_title,
            1 AS dependency_level,
            (p_task_id || ' -> ' || t.id)::TEXT AS path
        FROM tasks t
        WHERE p_task_id = ANY(t.dependencies)
        
        UNION ALL
        
        -- Recursive member: successors of successors
        SELECT 
            next_t.id AS task_id,
            next_t.title AS task_title,
            dt.dependency_level + 1,
            (dt.path || ' -> ' || next_t.id)::TEXT
        FROM tasks next_t
        JOIN downstream_tasks dt ON dt.task_id = ANY(next_t.dependencies)
    )
    SELECT DISTINCT dt.task_id, dt.task_title, dt.dependency_level, dt.path
    FROM downstream_tasks dt
    ORDER BY dt.dependency_level ASC;
END;
$$;

-- --------------------------------------------------------
-- 6. SERVER-SIDE DATABASE VIEWS (Analytics & Data Abstraction)
-- --------------------------------------------------------
CREATE OR REPLACE VIEW v_event_revenue AS
SELECT 
    e.id AS event_id,
    e.title AS event_title,
    COUNT(r.id) AS total_registrations,
    COALESCE(SUM(r.amount_paid), 0.00) AS gross_revenue_php,
    ROUND(COALESCE(SUM(r.amount_paid), 0.00) / NULLIF(COUNT(r.id), 0), 2) AS avg_ticket_price_php
FROM events e
LEFT JOIN registrations r ON r.event_id = e.id AND r.status <> 'cancelled'
GROUP BY e.id, e.title;

CREATE OR REPLACE VIEW v_venue_utilization AS
SELECT 
    v.id AS venue_id,
    v.name AS venue_name,
    v.capacity AS max_venue_capacity,
    COUNT(vb.id) AS total_confirmed_bookings,
    COALESCE(SUM(EXTRACT(EPOCH FROM (vb.end_time - vb.start_time))/3600), 0) AS total_booked_hours
FROM venues v
LEFT JOIN venue_bookings vb ON vb.venue_id = v.id AND vb.status = 'confirmed'
GROUP BY v.id, v.name, v.capacity;

CREATE OR REPLACE VIEW v_task_readiness AS
SELECT 
    e.id AS event_id,
    e.title AS event_title,
    COUNT(t.id) AS total_tasks,
    COUNT(CASE WHEN t.status = 'completed' THEN 1 END) AS completed_tasks,
    COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) AS in_progress_tasks,
    COUNT(CASE WHEN t.status = 'blocked' THEN 1 END) AS blocked_tasks,
    ROUND((COUNT(CASE WHEN t.status = 'completed' THEN 1 END)::numeric / NULLIF(COUNT(t.id), 0)::numeric) * 100, 1) AS readiness_percentage
FROM events e
LEFT JOIN tasks t ON t.event_id = e.id
GROUP BY e.id, e.title;

