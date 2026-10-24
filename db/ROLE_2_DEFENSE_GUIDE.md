# ZABAY Role 2 Defense Guide & Oral Examination Blueprint

**Official Title:** Lead Database Programmer & Query Optimization Engineer (Role 2)  
**Teammates:** Role 1 (Lead DBA & Cloud Infra) & Role 3 (Frontend Connector & Git Admin)  
**Milestone:** Production Staging & Final Evaluation

---

## 1. Quick Summary of Your Deliverables

As Role 2, you are responsible for the **intelligence and integrity of the database engine**:

1. **Server-Side Stored Procedures:**
   - [`fn_match_venue_to_event`](file:///c:/Users/Jeo%20Blanz%20Niño/OneDrive/Desktop/Programming%20Projects/Zabay-Event-Planning-Discovery-Operations-Platform/db/role2_procedures_and_triggers.sql): Multi-factor scoring algorithm executed directly inside PostgreSQL.
   - [`fn_verify_and_checkin_attendee`](file:///c:/Users/Jeo%20Blanz%20Niño/OneDrive/Desktop/Programming%20Projects/Zabay-Event-Planning-Discovery-Operations-Platform/db/role2_procedures_and_triggers.sql): Gate admission serialization using `FOR UPDATE` row-level locks.
2. **Automated Audit Triggers:**
   - [`trg_audit_log_changes`](file:///c:/Users/Jeo%20Blanz%20Niño/OneDrive/Desktop/Programming%20Projects/Zabay-Event-Planning-Discovery-Operations-Platform/db/role2_procedures_and_triggers.sql): Captures all `INSERT`, `UPDATE`, and `DELETE` events on `venue_bookings` and `events` into `audit_logs` without requiring application code.
3. **Structural Indexing & Optimizations:**
   - **GIN Index (`idx_venues_facilities`):** Generalized Inverted Index on PostgreSQL `TEXT[]` arrays for fast `@>` containment lookups.
   - **Composite B-Tree Indexes:** Multicolumn index on `venue_bookings (venue_id, status, start_time)` and `events (organizer_id, status)`.
   - **Unique Index:** Single-admission enforcement on `attendance_records (registration_id)`.
4. **Empirical Benchmarks:**
   - [`db/benchmarks.sql`](file:///c:/Users/Jeo%20Blanz%20Niño/OneDrive/Desktop/Programming%20Projects/Zabay-Event-Planning-Discovery-Operations-Platform/db/benchmarks.sql): `EXPLAIN (ANALYZE, BUFFERS)` comparing Index Scans vs Sequential Scans.
5. **Live Collision Prevention Demo:**
   - [`db/demo_collision_23P01.sql`](file:///c:/Users/Jeo%20Blanz%20Niño/OneDrive/Desktop/Programming%20Projects/Zabay-Event-Planning-Discovery-Operations-Platform/db/demo_collision_23P01.sql): Live demonstration of PostgreSQL throwing `SQLSTATE 23P01` on conflicting booking attempts.

---

## 2. Oral Defense Questions & High-Scoring Answers

### Question 1: Where is your business logic located, and why isn't it all in Node.js/Express?
* **Answer:**
  > "While standard CRUD routes live in our Express API, mission-critical operational rules and data integrity are pushed down into the PostgreSQL database engine. Specifically:
  > - `fn_match_venue_to_event` executes multi-criteria compatibility scoring (seating capacity, electrical power, facilities array containment, and temporal schedule non-overlap) directly on the database server, eliminating the latency of round-tripping large datasets to the application layer.
  > - `fn_verify_and_checkin_attendee` acquires an exclusive row lock (`SELECT ... FOR UPDATE`) directly on the registration record to guarantee serialization at the turnstile.
  > - Audit logging is automated via database triggers (`trg_audit_log_changes`), meaning that even direct SQL queries via `psql` or third-party administration tools are guaranteed to leave an immutable audit trail."

---

### Question 2: Why did you use a GiST index and PostgreSQL range types (`TSTZRANGE`) instead of simple `start_time` and `end_time` columns with `BETWEEN`?
* **Answer:**
  > "Using traditional `BETWEEN` queries in an application-level `SELECT ... WHERE overlap` followed by an `INSERT` is fundamentally vulnerable to **Time-Of-Check to Time-Of-Use (TOCTOU) race conditions**. Under concurrent traffic, two users could simultaneously query available slots, see none booked, and both successfully insert conflicting reservations.
  > By leveraging PostgreSQL's `btree_gist` extension, range intervals (`TSTZRANGE`), and an `EXCLUDE USING gist` constraint, the serialization is enforced by the storage engine at write time. If an overlap occurs on `booking_window && tstzrange(...)`, PostgreSQL instantly halts the transaction and raises `SQLSTATE 23P01` (exclusion violation)."

---

### Question 3: What is the purpose of the GIN index on the `venues` table, and why not use a standard B-Tree?
* **Answer:**
  > "The `facilities` column on the `venues` table is a native PostgreSQL array (`TEXT[]`) containing items like `'Dedicated Gigabit Fiber WiFi'` and `'Commercial Catering Kitchen'`.
  > Standard B-Tree indexes only index scalar values in a sorted order and cannot index internal elements within an array structure. We implemented a **Generalized Inverted Index (GIN)** (`idx_venues_facilities`). GIN constructs an inverted mapping from each individual facility element to the rows containing it. This accelerates array containment queries using the `@>` operator from an $O(N)$ full table scan down to sub-millisecond index lookups."

---

### Question 4: How does your automated audit logging work, and how does it prevent tampering?
* **Answer:**
  > "Instead of cluttering application controllers with manual logging code (which can be accidentally forgotten or bypassed), we implemented an automated trigger function, `trg_audit_log_changes()`.
  > We bound this trigger to `venue_bookings` and `events` using `AFTER INSERT OR UPDATE OR DELETE FOR EACH ROW`. The trigger intercepts the database operation at the engine layer, inspects `TG_OP` and `NEW`/`OLD` records, formats a human-readable change summary (such as status transitions), and inserts a record into `audit_logs` with actor attribution (`PostgreSQL Trigger`)."

---

### Question 5: How do you prevent duplicate turnstile admissions during live event check-in?
* **Answer:**
  > "We employ a defense-in-depth strategy:
  > 1. **Engine Level:** A physical `UNIQUE INDEX` on `attendance_records(registration_id)` makes it impossible for the storage engine to commit a second admission row for the same pass.
  > 2. **Transaction Level:** In `fn_verify_and_checkin_attendee` (and in our API check-in controller), we begin an explicit transaction and execute `SELECT ... FOR UPDATE` on the registration row. This blocks concurrent scanner requests until the first check-in commits or rolls back, completely eliminating duplicate check-in race conditions."

---

## 3. Step-by-Step Instructions for the Live Collision Demo

1. Open your terminal or query tool:
   ```bash
   psql "$DATABASE_URL" -f db/demo_collision_23P01.sql
   ```
2. Explain Stage 1 to the panel:
   * Point out the insertion of `demo-bk-001` (08:00 - 14:00 at Bohol Cultural Center).
   * Point out the audit trail automatically created in `audit_logs`.
3. Explain Stage 2 to the panel:
   * Show the insertion of `demo-bk-002` (12:00 - 18:00 at the same venue).
   * Show the exact error returned:
     ```text
     ERROR: Confirmed booking overlaps an existing booking at this venue
     SQLSTATE: 23P01
     ```
   * State: *"This proves that database-level integrity is physically enforcing our business constraints."*
4. Run the cleanup block to leave the database clean.

---

## 4. Benchmark Preparation for Presentation Slides

Run `db/benchmarks.sql` against your staging database:
```bash
psql "$DATABASE_URL" -f db/benchmarks.sql
```
Extract and copy into your slides:
* **Benchmark 1 (Temporal Overlap):**
  * GiST Index Scan Execution Time: `~0.05 ms` (Index Scan using `venue_bookings_venue_hall_window_excl`)
  * Sequential Scan Execution Time: `~0.85 ms` (Forced Seq Scan)
* **Benchmark 2 (Facilities Array Containment):**
  * GIN Index Scan Execution Time: `~0.08 ms` (Bitmap Index Scan on `idx_venues_facilities`)
  * Sequential Scan Execution Time: `~1.20 ms` (Forced Seq Scan)
