# ZABAY EVENT OPERATIONS PLATFORM
## Monday Final Project Presentation & Live Architectural Defense Script
### 15-Minute Coordinated Master Walkthrough for All 3 Team Members
**Course:** Advanced Database Systems (3rd Year IT Finals Block)  
**Evaluation Focus:** 100% Backend Database Engineering & System Architecture  

---

## Master Timeline & Speaking Roster (15 Minutes Total)

| Time Slot | Duration | Speaker & Operational Role | Primary Focus & Deliverables |
| :--- | :---: | :--- | :--- |
| **00:00 – 04:00** | 4.0 Min | **Member 1 (Lead DBA & Cloud Infra Engineer)** | Cloud Architecture (Neon/Render), 20-Table 3NF Schema, DB Security, & Remote Backups |
| **04:00 – 09:00** | 5.0 Min | **Member 2 (Database Programmer & Optimization)** | Stored Procedures, GiST Locks (`23P01`), Audit Triggers, Recursive CTE, & `EXPLAIN ANALYZE` |
| **09:00 – 13:30** | 4.5 Min | **Member 3 (YOU - UI Connector & Git Admin)** | Live End-to-End User Journey, UI Error Mapping, 4-Tier Hubs, Optical Scanner, & Git Trace |
| **13:30 – 15:00** | 1.5 Min | **All Team Members** | Panel Q&A, "What-If" Architectural Stress Tests, & Closing |

---

## PHASE 1: Member 1 — Cloud Infrastructure, Schema & Security (4 Minutes)
**Speaker:** Lead Database Administrator (DBA) & Cloud Infrastructure Engineer  
**Screens to Display:** Neon Cloud Console / `DEPLOYMENT.md` Architecture Diagram / Terminal

### Speaking Script:
> *"Good morning, esteemed professors and panel. Our capstone-level database system is **ZABAY**, an enterprise event planning, discovery, and operations platform localized for Bohol and Tagbilaran City.*
> 
> *As the **Lead Database Administrator and Cloud Infrastructure Engineer**, my responsibility was physical schema implementation, cloud database provisioning, security policy enforcement, and disaster recovery.*
> 
> *Per the strict course mandate of **Zero Localhost Submissions**, we deployed our relational database live on **Neon serverless PostgreSQL 16**, paired with our containerized backend API.*
> 
> *Let me walk you through our physical schema architecture:*
> 1. *Our database strictly satisfies **Third Normal Form (3NF)** and exceeds the 8-to-10 table threshold with **20 fully normalized tables**.*
> 2. *We resolved complex cardinalities through **3 dedicated junction tables with intersection attributes**: `personnel_assignments` (tracking assigned role and progress), `resource_assignments` (tracking allocated quantity and hourly rental cost), and `task_dependencies` (tracking finish-to-start lag minutes).*
> 3. *To guarantee referential integrity without risk of orphan records, foreign keys implement explicit cascade policies: dependent sub-halls and bookings use `ON DELETE CASCADE`, while event venue links use `ON DELETE SET NULL` to preserve historical event records even if a venue delists.*
> 4. *For security and risk mitigation, our application communicates strictly through **parameterized prepared statements** to neutralize SQL injection, and enforces a connection pool capped at 5 instances with TLS encryption (`sslmode=require`).*
> 
> *Finally, for disaster recovery and automated maintenance, I engineered our automated backup utility in `scripts/remote-backup-restore.sh`.*
> *(Action: Run `./scripts/remote-backup-restore.sh backup "$DATABASE_URL"` in terminal)*
> *Notice that this executes a native `pg_dump` with custom compression, producing a timestamped `.dump` archive ready for instant restoration.*
> 
> *Now, I turn the floor over to our Lead Database Programmer to demonstrate our server-side database automation."*

---

## PHASE 2: Member 2 — Stored Procedures, Locks & Query Optimization (5 Minutes)
**Speaker:** Lead Database Programmer & Query Optimization Engineer  
**Screens to Display:** `psql` Terminal / Neon SQL Editor / pgAdmin / DBeaver

### Speaking Script:
> *"As the **Lead Database Programmer and Query Optimization Engineer**, my objective was moving core business logic and transaction integrity directly into the PostgreSQL storage engine rather than relying on brittle application-level code.*
> 
> *I want to highlight 5 major database-level engineering implementations:*
> 
> #### 1. Venue Feasibility Matching Procedure (`fn_match_venue_to_event`)
> *Instead of pulling thousands of venue records into Node.js memory, we authored `fn_match_venue_to_event`. Let me execute it live in `psql`:*
> ```sql
> SELECT * FROM fn_match_venue_to_event('evt-demo', 'ven-1');
> ```
> *This PL/pgSQL function evaluates seating capacity (40%), transformer electrical power in kW (20%), facility array intersection using PostgreSQL array operators (20%), and calendar availability (20%), returning an overall 0-to-100 compatibility score directly from disk.*
> 
> #### 2. Temporal Concurrency & Advisory Locking (`23P01`)
> *To solve the classic double-booking problem across venues and sub-halls, we engineered a dual-layer defense:*
> *First, a PostgreSQL GiST exclusion constraint on half-open `TSTZRANGE` intervals.*
> *Second, a `BEFORE INSERT OR UPDATE` trigger on `venue_bookings` that acquires a transaction-scoped advisory lock via `pg_advisory_xact_lock`.*
> *Let me demonstrate this by attempting to insert an overlapping confirmed booking:*
> ```sql
> INSERT INTO venue_bookings (id, venue_id, event_id, event_title, booking_window, start_time, end_time, status)
> VALUES ('vb-collide', 'ven-1', 'evt-2', 'Colliding Event', tstzrange('2026-11-14 08:00:00+08', '2026-11-14 12:00:00+08', '[)'), '2026-11-14 08:00:00+08', '2026-11-14 12:00:00+08', 'confirmed');
> ```
> *(Action: Show the terminal output)*  
> *Notice that PostgreSQL immediately aborts the transaction and raises standard SQL error code **`23P01` (Exclusion Violation)** with the message: 'Confirmed booking overlaps an existing booking at this venue'.*
> 
> #### 3. Atomic Turnstile Check-In Transaction (`fn_verify_and_checkin_attendee`)
> *For gate check-ins, our stored procedure takes a row-level lock using `SELECT ... FOR UPDATE` on the registration record. If the attendee was already admitted, it immediately halts and rejects the admission, preventing concurrent gate bypasses.*
> 
> #### 4. Automated Database Audit Triggers
> *To satisfy the mandate that audit logs must execute at the engine level without application code, we attached `trg_audit_venue_bookings` and `trg_audit_events` on `AFTER INSERT OR UPDATE OR DELETE`. Every mutation automatically writes an immutable log to `audit_logs`.*
> 
> #### 5. Recursive Dependency Tracing & Query Benchmarking
> *We implemented `fn_get_downstream_task_impact` using **`WITH RECURSIVE`** to trace multi-level task ripple effects when schedules change.*
> *Furthermore, we optimized search performance by attaching a **GIN Index** on the `venues.facilities` array (`idx_venues_facilities`). Benchmarking with `EXPLAIN (ANALYZE, BUFFERS)` reveals that array containment queries drop from high-cost sequential scans to sub-millisecond bitmap index scans.*
> 
> *Now, our Frontend/UI Connector will demonstrate the live application executing these database operations."*

---

## PHASE 3: Member 3 (YOU) — Live End-to-End User Journey & Git Admin (4.5 Minutes)
**Speaker:** Frontend/UI Connector & Git Workflow Administrator (YOU)  
**Screens to Display:** Live Web Application (Vercel / Local Host) & GitHub Repository

### Speaking Script:
> *"As the **Frontend/UI Connector and Git Workflow Administrator**, I built the database communication layer in `api.ts`, mapped all interactive forms to relational SQL transactions, and enforced branch protection across our Git pipeline.*
> 
> *Let me demonstrate the complete live operational workflow across all 4 user tiers:*
> 
> #### Step 1: Public Discovery & Cryptographic QR Ticketing (Attendee Tier)
> *(Action: Navigate to Public Feed)*
> - *"We begin in the **Public Attendee Feed**. Attendees can browse Bohol events across Tagbilaran, Panglao, and Tubigon on an interactive map.*
> - *Let's register for the 'Bohol Inter-School Esports Championship'. Clicking **Get Passes** opens our checkout modal. When an attendee selects General Admission and completes registration, the application commits to the `registrations` and `payments` tables.*
> - *Notice our instant cryptographic QR pass rendering: attendees can download a high-resolution PNG or print a physical ticket slip for gate entry."*
> 
> #### Step 2: Organizer Studio & Physical Constraint Validation (Organizer Tier)
> *(Action: Switch role to Organizer Studio)*
> - *"Next, we transition to the **Organizer Studio**. When we create an event using the 4-step wizard, the form validates temporal order (`end_date > start_date`) and physical constraints including electrical power requirements in kW.*
> - *Under our **Venue Matcher**, notice that our system executes Member 2's `fn_match_venue_to_event`. Bohol Wisdom Gym displays a 100% compatibility score based on seating and hardwood sports facilities.*
> - *If an organizer attempts to reserve a conflicting time window, our `api.ts` translator catches PostgreSQL's `23P01` exclusion code and surfaces an immediate amber collision alert."*
> 
> #### Step 3: Bohol Starter Kits & Committee Role Propagation
> *(Action: Open Operations Kanban & People Assignments)*
> - *"To eliminate the burden of planning from scratch, organizers can load **Bohol Workflow Kits** such as School Symposiums, Tech Hackathons, or Community Outreach.*
> - *All generated tasks initialize strictly in the **To Do** state with zero completed placeholders.*
> - *In our **People & Committee Matrix**, the organizer assigns designated heads: Letters & Permits Head, Finance Head, Logistics Head, and Documentation Head.*
> - *Clicking **Apply & Propagate** automatically updates the `personnel_assignments` junction table, routing permit tasks to the Letters Committee and venue preparation to Logistics."*
> 
> #### Step 4: Venue Partner Hub (Venue Manager Tier)
> *(Action: Switch role to Venue Partner Hub)*
> - *"For venue managers at venues like the Bohol Cultural Center, we provide 3 dedicated views: **Facility Overview**, **Bookings & Collision Prevention**, and **Sub-Halls & Inventory** to manage electrical power loads and eliminate double-booking."*
> 
> #### Step 5: Mobile Shift Portal & Live Optical Gate Scanner (Staff Tier)
> *(Action: Switch role to Staff View & Open Scanner)*
> - *"On event day, field crew access a mobile-optimized **Staff Shift Portal** with duty checklists and turnstile clearances.*
> - *Let's open the **Gate Ticket Scanner**. When an attendee presents their digital pass, staff can scan it directly via their webcam or mobile camera.*
> - *The first scan executes Member 2's `fn_verify_and_checkin_attendee`, granting admission with a green verification banner.*
> - *If someone attempts to re-enter using a duplicate or replayed ticket pass, our database unique constraint immediately trips, displaying an instant red **Duplicate Ticket Detected** warning."*
> 
> #### Step 6: Git Administration & Branch Protection
> *(Action: Switch to GitHub Repository tab)*
> - *"Finally, as Git Administrator, I enforced repository branch protection on `main` to maintain a tamper-proof audit trail of individual contributions.*
> - *Direct pushes to `main` were locked. All features were developed on isolated structural branches (`feature/frontend-db-connector`, `feature/stored-procedures-audit`) and merged strictly through peer-reviewed Pull Requests with conventional commit prefixes (`feat:`, `fix:`, `refactor:`).*
> 
> *Thank you. Our team is now ready to receive your questions!"*

---

## PHASE 4: Universal Defense Q&A & "What-If" Stress Tests (1.5 Minutes)
**Speakers:** All 3 Members  

### Question 1: "I am opening your database client right now and deleting a parent row. Show me how your framework handles it."
* **Responder:** Member 1 or Member 3  
* **Answer:** *"Our schema explicitly implements referential integrity constraints. In `db/schema.sql`, events reference venues with `ON DELETE SET NULL`, meaning past event records remain intact even if a venue delists. However, `venue_halls` and `venue_bookings` reference venues with `ON DELETE CASCADE`, automatically purging orphan sub-halls and reservations. In our backend, `errorHandler.ts` catches foreign key violations (`23503`) and returns a clean 409 JSON payload instead of an unhandled server crash."*

### Question 2: "Show me your database connection string and how permissions are restricted."
* **Responder:** Member 1  
* **Answer:** *"Our database connection string is stored securely in environment variables as `DATABASE_URL` with SSL mode enforced (`sslmode=require`). We restrict connections through a dedicated application role with privileges limited strictly to `SELECT`, `INSERT`, `UPDATE`, `DELETE`, and `EXECUTE` on the `zabay_db` schema, prohibiting `DROP DATABASE` or root administrative mutations."*

### Question 3: "Why did you model electrical power capacity (kW) in your database schema?"
* **Responder:** Member 2 or Member 3  
* **Answer:** *"Bohol events, particularly esports summits, concerts, and tech exhibitions in Tagbilaran City, frequently suffer transformer trips if sound systems and LED walls exceed a gym's electrical limit. Modeling `power_kw_capacity` in PostgreSQL allows our `fn_match_venue_to_event` stored procedure to verify substation safety before venue contracts are confirmed."*

### Question 4: "How does your frontend handle backend or database offline scenarios?"
* **Responder:** Member 3 (YOU)  
* **Answer:** *"Our `api.ts` connector is built with resilient fallback boundaries. When the cloud PostgreSQL backend is online, it synchronizes live relational records and translates error codes like `23P01` and `23505`. When running offline or in edge-hosted demonstration mode, it falls back seamlessly to client-side storage so the user interface never crashes during live operations."*

---

## Checklist for Presentation Morning
- [ ] Member 1: Neon database active with `db/schema.sql` and `db/role2_procedures_triggers.sql` executed.
- [ ] Member 1: Terminal open with `./scripts/remote-backup-restore.sh` ready to run.
- [ ] Member 2: Terminal open with `psql` connected to Neon, ready to run `SELECT * FROM fn_match_venue_to_event(...);`.
- [ ] Member 3: Browser open with Zabay at `http://localhost:5173/` (or live Vercel URL) and GitHub repo tab open.
