# ZABAY EVENT OPERATIONS PLATFORM
## Role 3 Operational Blueprint: Frontend/UI Connector & Git Workflow Administrator

---

### Executive Overview & Role Identification

| Metadata Field | Specification |
| :--- | :--- |
| **Official Syllabus Role** | **3. Frontend/UI Connector & Git Workflow Administrator** |
| **Student Domain** | Constructing database communication layers, building forms triggering relational operations, UI binding, Git repository administration, branch protection rules, and handling team code merges. |
| **Team Partners** | **Role 1:** Lead DBA & Cloud Infrastructure Engineer \| **Role 2:** Lead Database Programmer & Query Optimization Engineer |
| **Target Milestones** | UI-to-Database binding, form validation, branch protection documentation, and Monday presentation lead. |

---

## 1. Role 3 Core Deliverables Matrix (Mapped to Syllabus)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        ROLE 3: CORE PILLARS & DELIVERABLES                             │
│                                                                                        │
│  1. DB Communication Layer    Type-safe REST adapter (api.ts) with CSRF extraction,    │
│                               entity adaptation, and error boundary handling.          │
│                                                                                        │
│  2. Relational Action Forms   5 relational forms triggering INSERT, UPDATE, & SELECT   │
│                               queries across PostgreSQL tables.                        │
│                                                                                        │
│  3. UI Binding Architecture   React 19 state synchronization, 4 perspective pages,      │
│                               expandable Kanban tasks, and dual-theme visual tokens.   │
│                                                                                        │
│  4. Git Repository & Merges   Branch strategy, conflict resolution logs (PR #4 & #5),   │
│                               and linear rebase workflows.                             │
│                                                                                        │
│  5. Branch Protection Rules   GitHub branch policies: required reviews, passing CI,    │
│                               signed commits, and protected main branch rules.         │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Pillar 1: Database Communication Layer (`frontend/src/services/api.ts`)

Role 3 constructed a centralized, type-safe API communication layer that interfaces the frontend client with the Express REST API and PostgreSQL database:

### Key Technical Implementations:
1. **CSRF Extraction & Token Injection**:
   ```typescript
   // Automatically captures CSRF token from /api/auth/session or /api/auth/login
   // and attaches it to every mutating HTTP request (POST, PATCH, DELETE)
   headers['X-CSRF-Token'] = csrfToken;
   ```
2. **Relational Entity Adapters**:
   - `adaptEvent(row)`: Converts database ISO timestamps into human-readable Bohol schedule dates and derives financial metrics.
   - `adaptVenue(row)`: Unpacks multi-hall relations and formats power capacities (`power_kw_capacity`).
   - `adaptRegistration(row, eventTitle)`: Binds database attendance rows to digital pass tickets.
3. **PostgreSQL Error Boundary Mapping**:
   - Intercepts error code `EXCLUDE_CONSTRAINT_VIOLATION` (`23P01`) and displays immediate collision warnings to the organizer.
   - Intercepts `UNIQUE_VIOLATION` (`23505`) and triggers the duplicate QR scanner warning.

---

## 3. Pillar 2: Forms Triggering Relational Operations

Role 3 authored the interactive forms that trigger database transactions:

| Form Component | Relational Table Affected | Database Operation | SQL Action Triggered |
| :--- | :--- | :--- | :--- |
| **`CreateEventModal.tsx`** | `events`, `users` | `POST /api/events` | `INSERT INTO events (...) RETURNING *` |
| **`VenueMasterDetail.tsx`** | `venue_bookings`, `events` | `POST /api/venues/:id/book` | `INSERT INTO venue_bookings` (triggers GiST & advisory lock) |
| **`TaskKanbanBoard.tsx`** | `tasks` | `PATCH /api/tasks/:id/status` | `UPDATE tasks SET status = $1, updated_at = NOW()` |
| **`CheckoutModal.tsx`** | `registrations` | `POST /api/attendees/register` | `INSERT INTO registrations (..., qr_pass_code)` |
| **`QRCheckInScanner.tsx`** | `attendance_records` | `POST /api/attendees/checkin` | `INSERT INTO attendance_records` (unique check) |
| **`PersonnelDirectory.tsx`** | `personnel` | Local & Session sync | Updates personnel availability & shift assignments |

---

## 4. Pillar 3: UI Binding & Multi-Perspective Architecture

Role 3 bound the application state to four distinct user operational perspectives:

1. **Organizer Operations Studio (`OrganizerPage.tsx`)**:
   - 9 coordinated subsystems: Executive Overview, Expandable Kanban Board, Top-Down Calendar, Venue Feasibility Matcher, Change-Impact Simulator, Task Gantt, Personnel Directory, Attendee Datagrid, Analytics Dashboard.
2. **Venue Partner Hub (`VenuePage.tsx`)**:
   - Synchronized 3-view navigation: **Facility Overview**, **Bookings & Collision Prevention**, and **Halls & Equipment Inventory**.
3. **Staff Shift Portal (`StaffPage.tsx`)**:
   - On-duty crew checklist, persona preview switcher, and live gate camera scanner.
4. **Public Event Discovery (`AttendeePage.tsx`)**:
   - Luma-style event discovery, interactive OpenStreetMap venue pins, and pass wallet.

---

## 5. Pillar 4 & 5: Git Repository Administration & Branch Protection Rules

As the **Git Workflow Administrator**, Role 3 instituted enterprise-grade source control policies for the 3-person team:

### A. Formal Branching Strategy
```
main (Production: Protected, Render CD auto-deploy)
 │
 ├── staging (Integration: Neon PostgreSQL staging environment)
 │    │
 │    ├── feature/deployment-mvp        (Member 1: Render Docker & Cypress)
 │    ├── feature/database-procedures   (Member 2: Schema & GiST triggers)
 │    └── feature/frontend-db-connector (Member 3: React 19 UI & API binding)
```

### B. Formal Branch Protection Rules (Documented for Grading)
To prevent accidental regressions and enforce team review, Role 3 configured the following rules on `main` and `staging`:

1. **Require Pull Request Reviews Before Merging**:
   - At least 1 peer approval required from another team member.
   - Dismiss stale pull request approvals when new commits are pushed.
2. **Require Status Checks to Pass Before Merging**:
   - `backend-tests`: Supertest API suite (`npm test --prefix backend`) must pass with code 0.
   - `frontend-build`: TypeScript compile (`npm run build --prefix frontend`) must succeed with 0 lint errors.
   - `cypress-e2e`: Cypress headless integration tests must pass.
3. **Require Linear History & No Direct Pushes**:
   - Force-push (`git push --force`) is strictly forbidden on `main` and `staging`.
   - Direct commits to `main` are blocked; all contributions must pass through reviewed PRs.
4. **Merge Protocol**:
   - PR #4 (`feature/deployment-mvp`) merged into `main` (commit `919b5be`).
   - PR #5 (`feature/staging-readiness`) merged into `main` (commit `5048f06`).
   - Merged cleanly into `feature/frontend-db-connector` with zero merge conflicts.

---

## 6. Monday Presentation Oral Defense Cheat Sheet for Role 3

| Anticipated Panel Question | Bulletproof Technical Answer | Live Screen Demo |
| :--- | :--- | :--- |
| **"What was your role in database integration?"** | *"I built the database communication layer (`api.ts`), ensuring all frontend forms (events, bookings, tasks, and registrations) execute strict relational operations while gracefully mapping PostgreSQL errors (like `23P01` collision codes) into responsive UI warnings."* | Demonstrate booking a venue and triggering the collision warning banner. |
| **"How do you ensure data integrity in the frontend forms?"** | *"Forms enforce strict validation before dispatch (ISO timestamps, attendance limits, and non-empty titles) and parse the server's CSRF token into every mutating request to satisfy database security policies."* | Open the Event Creation modal and show validation states. |
| **"How did you manage team code merges as Git Administrator?"** | *"I enforced a protected-branch strategy on `main` requiring linear history and passing CI checks. I handled integration merges for PR #4 and PR #5 from our DBA and Backend lead without merge debt."* | Show `git log --graph --oneline` in terminal. |
| **"Show us the gate check-in turnstile."** | *"Here is the live camera QR scanner. Scanning a valid pass grants entry, while re-scanning the same pass immediately displays a red duplicate admission alert backed by our database's unique index."* | Open the Gate Scanner modal and demonstrate single vs duplicate scan. |
