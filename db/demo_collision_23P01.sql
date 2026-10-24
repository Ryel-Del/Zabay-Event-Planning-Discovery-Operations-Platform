-- ============================================================================
-- ZABAY EVENT OPERATIONS PLATFORM - ORAL DEFENSE DEMONSTRATION
-- Demo Script: Storage-Level Exclusion Constraint Violation (SQLSTATE 23P01)
-- ============================================================================
-- Purpose:
--   Live demonstration for the evaluation panel proving that temporal booking
--   conflicts are physically prevented by PostgreSQL's storage engine
--   (GiST index + TSTZRANGE exclusion constraint) rather than just frontend
--   validation or fragile application-level checks.
--
-- Instructions:
--   1. Open a psql terminal or database query tool connected to Zabay.
--   2. Execute Step 1: Insert initial confirmed booking. (Succeeds)
--   3. Execute Step 2: Attempt overlapping booking. (Throws SQLSTATE 23P01)
--   4. Execute Step 3: Cleanup synthetic demo records.
-- ============================================================================

\echo '======================================================================'
\echo 'STAGE 1: Inserting Baseline Confirmed Booking (Sandugo Opening Ceremony)'
\echo 'Venue: Bohol Cultural Center (ven-1)'
\echo 'Window: 2026-11-20 08:00:00+08 to 2026-11-20 14:00:00+08'
\echo '======================================================================'

-- Ensure target dummy event exists or use a temporary transaction
BEGIN;

INSERT INTO events (id, title, category, event_type, status, start_date, end_date, organizer_id, expected_attendance)
VALUES
  ('demo-evt-001', 'Sandugo Tech Opening', 'Conference', 'public', 'planning', '2026-11-20 08:00:00+08', '2026-11-20 14:00:00+08', 'zabay-operator', 500)
ON CONFLICT (id) DO NOTHING;

INSERT INTO events (id, title, category, event_type, status, start_date, end_date, organizer_id, expected_attendance)
VALUES
  ('demo-evt-002', 'Bohol Esports Championship', 'Esports', 'public', 'planning', '2026-11-20 12:00:00+08', '2026-11-20 18:00:00+08', 'zabay-operator', 400)
ON CONFLICT (id) DO NOTHING;

-- 1. Insert first booking: 08:00 - 14:00 (Should succeed)
INSERT INTO venue_bookings (
    id, venue_id, event_id, event_title, start_time, end_time, booking_window, status
) VALUES (
    'demo-bk-001',
    'ven-1',
    'demo-evt-001',
    'Sandugo Tech Opening',
    '2026-11-20 08:00:00+08',
    '2026-11-20 14:00:00+08',
    tstzrange('2026-11-20 08:00:00+08', '2026-11-20 14:00:00+08', '[)'),
    'confirmed'
);

\echo '>> First booking successfully committed!'
COMMIT;

-- Verify Audit Log was automatically populated by trg_audit_log_changes()
SELECT id, action, entity_type, change_summary, created_at
FROM audit_logs
WHERE entity_id = 'demo-bk-001';


\echo '======================================================================'
\echo 'STAGE 2: Attempting Conflicting Overlapping Booking (12:00 to 18:00)'
\echo 'Expected Result: PostgreSQL engine aborts with SQLSTATE 23P01'
\echo '======================================================================'

-- 2. Attempt second booking with overlapping 2-hour collision window (12:00 - 14:00 overlap)
-- This MUST fail with exclusion constraint or trigger integrity error:
INSERT INTO venue_bookings (
    id, venue_id, event_id, event_title, start_time, end_time, booking_window, status
) VALUES (
    'demo-bk-002',
    'ven-1',
    'demo-evt-002',
    'Bohol Esports Championship',
    '2026-11-20 12:00:00+08',
    '2026-11-20 18:00:00+08',
    tstzrange('2026-11-20 12:00:00+08', '2026-11-20 18:00:00+08', '[)'),
    'confirmed'
);


-- ============================================================================
-- STAGE 3: CLEANUP SCRIPT (Run after live demonstration)
-- ============================================================================
\echo '======================================================================'
\echo 'STAGE 3: Clean up synthetic test records'
\echo '======================================================================'

DELETE FROM venue_bookings WHERE id IN ('demo-bk-001', 'demo-bk-002');
DELETE FROM events WHERE id IN ('demo-evt-001', 'demo-evt-002');
DELETE FROM audit_logs WHERE entity_id IN ('demo-bk-001', 'demo-bk-002', 'demo-evt-001', 'demo-evt-002');

\echo '>> Demo cleanup complete. Database restored to pristine state.'
