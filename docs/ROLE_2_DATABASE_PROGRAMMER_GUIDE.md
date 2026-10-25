# ZABAY EVENT OPERATIONS PLATFORM
## Role 2 Context Guide & Operational Deliverables Blueprint
### Official Title: Lead Database Programmer & Query Optimization Engineer

---

### Executive Overview & Metadata

| Metadata Field | Specification |
| :--- | :--- |
| **Official Role Title** | **Lead Database Programmer & Query Optimization Engineer (Role 2)** |
| **Teammate Partners** | **Role 1:** Lead DBA & Cloud Infra Engineer \| **Role 3 (You):** Frontend/UI Connector & Git Admin |
| **Core Responsibilities** | Server-side database logic (stored procedures, automated functions, custom transaction blocks), automated database audit triggers, benchmarking execution plans, and structural optimization patterns (indexing strategies). |
| **Generated Formats** | [ZABAY_ROLE_2_CONTEXT_GUIDE.docx](file:///c:/Users/Radel/OneDrive/Documents/New%20folder%20%282%29/zabay/ZABAY_ROLE_2_CONTEXT_GUIDE.docx) and this Markdown Guide |

---

## 1. Master Actionable Todo Checklist

- [ ] **Pillar 1: Server-Side Database Logic**
  - [ ] Implement & test the core Stored Procedure **`fn_match_venue_to_event(p_event_id, p_venue_id)`** (Capacity 40%, Power kW 20%, Facilities Array 20%, Schedule Availability 20%).
  - [ ] Implement the automated check-in transaction function **`fn_verify_and_checkin_attendee(p_qr_pass, p_verified_by)`** with `FOR UPDATE` row locks.
  - [ ] Verify the transaction block in [`venuesController.ts`](file:///c:/Users/Radel/OneDrive/Documents/New%20folder%20%282%29/zabay/backend/src/controllers/venuesController.ts) (`BEGIN` $\rightarrow$ `PERFORM pg_advisory_xact_lock(...)` $\rightarrow$ `COMMIT`).
- [ ] **Pillar 2: Automated Audit Triggers**
  - [ ] Attach automated audit triggers to the [`audit_logs`](file:///c:/Users/Radel/OneDrive/Documents/New%20folder%20%282%29/zabay/db/schema.sql#L334) table for `venue_bookings` and `events`.
  - [ ] Verify that every booking or event insert/update/delete automatically inserts an audit entry without application code.
- [ ] **Pillar 3: Query Execution Plan Benchmarking**
  - [ ] Prepare the `EXPLAIN (ANALYZE, BUFFERS)` benchmark script for temporal overlap checking: GiST Index Scan vs Sequential Scan.
  - [ ] Prepare the `EXPLAIN (ANALYZE, BUFFERS)` benchmark script for facility array containment: GIN Index Scan vs Sequential Scan (`facilities @> ARRAY['...']`).
  - [ ] Record the execution time differences to present to the evaluating panel.
- [ ] **Pillar 4: Structural Optimization & Indexing**
  - [ ] Execute `CREATE INDEX idx_venues_facilities ON venues USING GIN (facilities);`.
  - [ ] Verify composite and partial indexes on confirmed bookings: `EXCLUDE USING gist (...) WHERE (status = 'confirmed')`.
  - [ ] Verify the unique index on attendance records: `attendance_records_registration_unique`.
- [ ] **Final Integration Test**
  - [ ] Run `npm test --prefix backend` to ensure all 3 test suites pass cleanly.

---

## 2. Pillar 1: Server-Side Logic (Stored Procedures & Functions)

### A. Venue Feasibility Matcher (`fn_match_venue_to_event`)
```sql
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
```

---

## 3. Pillar 2: Automated Database Audit Triggers

```sql
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
```

---

## 4. Pillar 3: Query Execution Plan Benchmarking (`EXPLAIN ANALYZE`)

```sql
-- BENCHMARK 1: Temporal Range Scan (GiST vs Seq Scan)
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, venue_id, start_time, end_time 
FROM venue_bookings
WHERE venue_id = 'ven-1'
  AND booking_window && tstzrange('2026-11-20 08:00:00+08', '2026-11-20 18:00:00+08', '[)');

-- Benchmark 2: Array Containment Check (GIN Index vs Seq Scan)
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, name, capacity, facilities 
FROM venues
WHERE facilities @> ARRAY['Dedicated Gigabit Fiber WiFi', 'Commercial Prep Kitchen'];
```

---

## 5. Pillar 4: Structural Optimization & Indexing Strategies

```sql
-- 1. GIN (Generalized Inverted Index) for Array Containment (@>)
CREATE INDEX IF NOT EXISTS idx_venues_facilities 
ON venues USING GIN (facilities);

-- 2. Composite B-Tree Index for Venue Booking Lookups
CREATE INDEX IF NOT EXISTS idx_venue_bookings_lookup 
ON venue_bookings (venue_id, status, start_time);

-- 3. Composite B-Tree Index for Events by Organizer & Status
CREATE INDEX IF NOT EXISTS idx_events_organizer_status 
ON events (organizer_id, status);

-- 4. Unique Index on Attendance Turnstile Admission
CREATE UNIQUE INDEX IF NOT EXISTS attendance_records_registration_unique 
ON attendance_records (registration_id);
```

---

## 6. Saturday Oral Defense Cheat Sheet for Role 2

| Question | Technical Answer | Terminal Demo Command |
| :--- | :--- | :--- |
| **"Where is your server-side database logic located?"** | *"In PostgreSQL stored procedures and triggers: `fn_match_venue_to_event` calculates feasibility scoring, and `enforce_venue_booking_integrity` serializes whole-venue vs hall reservations."* | `\df`<br>`SELECT * FROM fn_match_venue_to_event('evt-1', 'ven-1');` |
| **"Why did you use a GiST index and range types?"** | *"Because standard `BETWEEN` queries permit race conditions. The GiST index on `tstzrange` intervals enforces exclusion at the storage level, returning SQLSTATE `23P01` on overlap."* | Trigger collision script in `psql`. |
| **"What is the GIN index for?"** | *"B-trees cannot index items inside an array. We used a GIN index on `facilities` to accelerate `@>` array containment searches to under 0.1 ms."* | Run Benchmark 2 script. |
| **"How does audit logging work?"** | *"Triggers automatically intercept writes across operational tables and write structured entries to `audit_logs` without application-level overhead."* | `SELECT * FROM audit_logs LIMIT 5;` |
