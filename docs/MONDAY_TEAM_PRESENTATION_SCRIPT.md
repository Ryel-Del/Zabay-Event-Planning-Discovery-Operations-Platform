# ZABAY EVENT OPERATIONS PLATFORM
## Monday Final Project Presentation & Live Demonstration Script
### 5-Minute Coordinated Walkthrough for All 3 Team Members

---

### Team Roster & Speaking Order

1. **Member 1 (Lead DBA & Cloud Infrastructure Engineer)**: Introduction, Production Cloud Architecture (Neon/Render), Database Security Policies, & Remote Backups.
2. **Member 2 (Lead Database Programmer & Query Optimization Engineer)**: Relational Schema, Stored Procedures (`fn_match_venue_to_event`), GiST/Advisory Locking (`23P01`), and `EXPLAIN ANALYZE` Benchmarks.
3. **Member 3 (YOU - Frontend/UI Connector & Git Workflow Administrator)**: Live End-to-End User Journey, Forms triggering Relational SQL, Multi-Perspective Hubs, Live Gate Scanner, and Git Administration.

---

### Phase 1: Member 1 — Infrastructure & Production Security (1 Minute)

#### Speaking Script:
> *"Good morning, professors and panel. Our platform is **Zabay**, an event planning, discovery, and operations platform specifically tailored for Bohol and Tagbilaran City.*
> 
> *As the **Lead Database Administrator and Cloud Infrastructure Engineer**, I architected our production hosting pipeline. Our backend is deployed as a Docker containerized service on Render, paired with a serverless PostgreSQL database on Neon.*
> 
> *To enforce database-level security policies, we implemented strict TLS encryption with CA certificate validation, session-based authentication with CSRF token rotation, and restricted database permissions. For disaster recovery and regulatory compliance, we created automated remote backup and restoration tooling via custom `pg_dump` and `pg_restore` scripts. Now, our Database Programmer will discuss our server-side logic."*

#### Screen to Show:
- Browser showing Render dashboard or `DEPLOYMENT.md` architecture diagram.
- Terminal showing `scripts/remote-backup-restore.sh` backup utility.

---

### Phase 2: Member 2 — Stored Procedures, GiST Locks & Benchmarking (1.5 Minutes)

#### Speaking Script:
> *"As the **Lead Database Programmer and Query Optimization Engineer**, my focus was eliminating race conditions and offloading operational logic to PostgreSQL.*
> 
> *First, we solved the classic venue collision problem. When an event books an entire venue, it must block all sub-halls, but different halls can be used concurrently. We engineered a dual-layer defense: a PostgreSQL GiST exclusion constraint on half-open `TSTZRANGE` intervals, combined with a `BEFORE INSERT` trigger that takes a per-venue transaction-scoped advisory lock. When a collision occurs, PostgreSQL halts the transaction and raises error code `23P01`.*
> 
> *Second, we authored `fn_match_venue_to_event`, a PL/pgSQL stored procedure that evaluates venue suitability across seating capacity, electrical power requirements, facility array containment, and schedule non-overlap, returning a 0-to-100 compatibility score.*
> 
> *Third, for query optimization, we implemented GIN indexing on the venue facilities array and benchmarked execution plans with `EXPLAIN (ANALYZE, BUFFERS)`, cutting query response times to sub-millisecond speeds. Now, our Frontend Connector and Git Administrator will demonstrate the live system."*

#### Screen to Show:
- Terminal in `psql`:
  ```sql
  -- Run the stored procedure live:
  SELECT * FROM fn_match_venue_to_event('evt-demo', 'ven-1');
  ```
- Triggering collision error `23P01` live in `psql`.

---

### Phase 3: Member 3 (YOU) — Live End-to-End Application Workflow (2.5 Minutes)

#### Speaking Script:
> *"As the **Frontend/UI Connector and Git Workflow Administrator**, I constructed the database communication layer in `api.ts`, built all interactive forms triggering relational operations, and instituted our Git branch protection policies.*
> 
> *Let me demonstrate the complete live operational lifecycle on screen:*

#### Live Demonstration Steps on Screen:

1. **Step 1: Organizer Studio & Event Creation**
   - *"We start in the **Organizer Studio**. When we open the Event Creation modal, this form validates physical constraints and triggers a relational `INSERT INTO events`."*
   - Show the 4-step wizard with attendance, budget in Philippine Pesos (₱), and date intervals.

2. **Step 2: Requirement-Based Venue Matching & Collision Prevention**
   - *"In our **Venue Matcher**, our system calls Member 2's feasibility logic. Notice that Bohol Wisdom Gym matches 100% of our power and hardwood court requirements."*
   - Click **Book Venue**.
   - *"If we attempt to book the venue during an overlapping confirmed slot, the backend catches PostgreSQL's `23P01` exclusion violation, and the UI immediately renders an amber conflict warning."*

3. **Step 3: Starter Kits & Expandable Task Kanban**
   - *"Next, we go to our **Operations Kanban Board**. Organizers can load 1-click Bohol Starter Kits like the Inter-School Sports Tournament Kit, which automatically schedules Mayor's Special Event Permits, BFP safety clearances, and referee rosters.*
   - Click on any task card:
   - *"Each card is fully expandable, allowing organizers to inspect dependencies, adjust time slots, or edit task details on the fly with live updates."*

4. **Step 4: Venue Partner Hub (3 Synchronized Perspectives)**
   - Switch perspective to **Venue Partner Hub**:
   - *"For venue managers (such as at Bohol Cultural Center or MetroCentre), we provide 3 dedicated views: **Facility Overview**, **Bookings & Collision Prevention**, and **Halls & Equipment Inventory** to monitor electrical loads and rental revenue."*

5. **Step 5: Staff Shift Portal & Live Camera QR Turnstile**
   - Switch to **Staff View**:
   - *"Field crew have their own dedicated mobile-responsive Shift Portal with duty checklists and an on-duty supervisor switcher."*
   - Click **Open Gate Ticket Scanner**:
   - *"When attendees arrive at the gate, staff scan their digital passes using a webcam. The first scan grants admission backed by our transaction lock. If someone tries to re-enter with the same pass, our database unique constraint immediately trips, and the scanner flashes a red **Duplicate Ticket Detected** warning."*

6. **Step 6: Git Administration & Branch Protection**
   - Open terminal or GitHub repository:
   - *"Finally, as Git Administrator, I enforced a protected branch strategy on `main`, requiring passing automated CI checks and peer reviews. I successfully managed and merged PR #4 for cloud deployment and PR #5 for staging readiness with zero merge debt."*
   - *"That concludes our presentation of Zabay. We are now ready for your questions!"*

---

## 4. Universal Defense FAQ (Questions the Professor Might Ask Any of You)

### Q1: "What makes your database design different from a typical CRUD app?"
- **Answer (Member 2 & 3)**: *"Most student CRUD apps do naive validation in frontend JavaScript or backend Express code, which fails under concurrent requests. Zabay enforces physical and temporal invariants directly at the database storage level using PostgreSQL `EXCLUDE USING gist`, transaction-scoped advisory locks, and unique indexes."*

### Q2: "Why do you have electrical power kW capacity in your venue model?"
- **Answer (Member 1 & 3)**: *"Bohol events, particularly major summits and esports tournaments in Tagbilaran, frequently suffer power tripping if sound rigs and LED walls exceed a venue's transformer capacity. Modeling `power_kw_capacity` in PostgreSQL allows our feasibility matcher to verify substation safety before a contract is signed."*

### Q3: "How does the frontend handle backend failures?"
- **Answer (Member 3)**: *"Our `api.ts` adapter features resilient fallback boundaries. When the cloud backend is connected, it syncs live PostgreSQL data. If offline during local staging, it falls back gracefully to synthetic demo fixtures without crashing the user interface."*
