-- ============================================================================
-- ZABAY EVENT OPERATIONS PLATFORM - BENCHMARK EXECUTION SUITE
-- Role 2: Query Optimization & Execution Plan Benchmarking
-- ============================================================================
-- Purpose:
--   Empirically demonstrates the performance gains of GiST, GIN, and Composite
--   B-Tree indexes compared against baseline Sequential Scans.
--
-- How to Run:
--   psql -d zabay -f db/benchmarks.sql
--   or execute each block inside pgAdmin / DBeaver / psql interactive console.
-- ============================================================================

\timing on

-- ============================================================================
-- BENCHMARK 1: Temporal Range Overlap Evaluation
-- Evaluates overlap checking between booking windows using the '&&' operator.
-- ============================================================================

\echo '----------------------------------------------------------------------'
\echo 'BENCHMARK 1A: Temporal Overlap Query USING GiST Range Index'
\echo '----------------------------------------------------------------------'
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT id, venue_id, start_time, end_time, status
FROM venue_bookings
WHERE venue_id = 'ven-1'
  AND booking_window && tstzrange('2026-11-20 08:00:00+08', '2026-11-20 18:00:00+08', '[)');

\echo '----------------------------------------------------------------------'
\echo 'BENCHMARK 1B: Temporal Overlap Query FORCING Sequential Scan'
\echo '----------------------------------------------------------------------'
SET enable_indexscan = OFF;
SET enable_bitmapscan = OFF;

EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT id, venue_id, start_time, end_time, status
FROM venue_bookings
WHERE venue_id = 'ven-1'
  AND booking_window && tstzrange('2026-11-20 08:00:00+08', '2026-11-20 18:00:00+08', '[)');

RESET enable_indexscan;
RESET enable_bitmapscan;


-- ============================================================================
-- BENCHMARK 2: Array Containment (@>) Search for Venue Facilities
-- Evaluates looking up venues that contain all required staging facilities.
-- ============================================================================

\echo '----------------------------------------------------------------------'
\echo 'BENCHMARK 2A: Array Containment USING GIN (Generalized Inverted) Index'
\echo '----------------------------------------------------------------------'
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT id, name, capacity, power_kw_capacity, facilities
FROM venues
WHERE facilities @> ARRAY['Dedicated Gigabit Fiber WiFi', 'Commercial Catering Kitchen'];

\echo '----------------------------------------------------------------------'
\echo 'BENCHMARK 2B: Array Containment FORCING Sequential Scan'
\echo '----------------------------------------------------------------------'
SET enable_indexscan = OFF;
SET enable_bitmapscan = OFF;

EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT id, name, capacity, power_kw_capacity, facilities
FROM venues
WHERE facilities @> ARRAY['Dedicated Gigabit Fiber WiFi', 'Commercial Catering Kitchen'];

RESET enable_indexscan;
RESET enable_bitmapscan;


-- ============================================================================
-- BENCHMARK 3: Composite Index Lookup on (venue_id, status, start_time)
-- Evaluates compound filters commonly queried during calendar generation.
-- ============================================================================

\echo '----------------------------------------------------------------------'
\echo 'BENCHMARK 3A: Composite B-Tree Lookup (idx_venue_bookings_lookup)'
\echo '----------------------------------------------------------------------'
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT id, venue_id, status, start_time, end_time
FROM venue_bookings
WHERE venue_id = 'ven-1'
  AND status = 'confirmed'
  AND start_time >= '2026-11-01 00:00:00+08'
ORDER BY start_time ASC;

\echo '----------------------------------------------------------------------'
\echo 'BENCHMARK 3B: Composite Lookup FORCING Sequential Scan'
\echo '----------------------------------------------------------------------'
SET enable_indexscan = OFF;
SET enable_bitmapscan = OFF;

EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT id, venue_id, status, start_time, end_time
FROM venue_bookings
WHERE venue_id = 'ven-1'
  AND status = 'confirmed'
  AND start_time >= '2026-11-01 00:00:00+08'
ORDER BY start_time ASC;

RESET enable_indexscan;
RESET enable_bitmapscan;

-- ============================================================================
-- BENCHMARK 4: Stored Procedure Execution Cost
-- Measures end-to-end execution latency for fn_match_venue_to_event
-- ============================================================================

\echo '----------------------------------------------------------------------'
\echo 'BENCHMARK 4: Stored Procedure (fn_match_venue_to_event) Latency'
\echo '----------------------------------------------------------------------'
DO $$
DECLARE
    v_start TIMESTAMPTZ := clock_timestamp();
    v_end TIMESTAMPTZ;
    v_sample_evt VARCHAR(64);
    v_sample_ven VARCHAR(64);
BEGIN
    SELECT id INTO v_sample_evt FROM events LIMIT 1;
    SELECT id INTO v_sample_ven FROM venues LIMIT 1;
    
    IF v_sample_evt IS NOT NULL AND v_sample_ven IS NOT NULL THEN
        PERFORM * FROM fn_match_venue_to_event(v_sample_evt, v_sample_ven);
        v_end := clock_timestamp();
        RAISE NOTICE 'Stored procedure executed in % ms', 1000 * EXTRACT(EPOCH FROM (v_end - v_start));
    ELSE
        RAISE NOTICE 'Sample events or venues table empty. Run seeds first to execute Benchmark 4.';
    END IF;
END $$;
