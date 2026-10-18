# ZABAY — Frontend Client Application

> **Relational-Database-Driven Event Planning, Discovery & Operations Platform**  
> Built with **React 19 + TypeScript + Vite + Tailwind CSS v4 + Recharts + Leaflet (OpenStreetMap)**

---

## 🚀 Overview for the Team

This is the frontend client for the **ZABAY** platform. It implements all 3 core user personas, relational operational logic simulators, and discovery features defined in the project specification.

Even before the Express API and PostgreSQL database are fully connected, this client comes with a **fully interactive, database-emulating mock engine** that models the 20-table relational schema and stored procedures. When your group mates finish the backend and database, the API client calls can be seamlessly wired to the Express endpoints.

---

## 👥 Supported Roles & Features

### 1. 🎪 Event Organizer & Operations (`organizer`)
- **Dependency-Based Change-Impact Analyzer (`fn_downstream_impact`, `fn_schedule_impact`)**:
  - Pick any scheduled task (e.g. Stage Audio Rigging) and simulate a delay (+15m, +30m, +45m, +60m, +90m, +120m).
  - Recursively traces all downstream tasks through finish-to-start dependencies.
  - Automatically flags infeasible schedules and collision conflicts.
  - Commits changes to the live state and records a relational audit log.
- **Requirement-Based Venue Matcher (`fn_match_venue_to_event`)**:
  - Compares event requirements (capacity, 10Gbps WiFi, 4K projection, sound arrays, power in kW) against venue profiles.
  - Generates itemized match breakdowns (matched vs missing facilities).
  - Validates booking availability with PostgreSQL `EXCLUDE` constraint simulation.
- **Operational Task Board & Finish-to-Start DAG**:
  - Displays tasks with priorities, status badges, assigned personnel (supertype/subtype pattern), and equipment allocations.
  - Visual collision alerts when a predecessor delays past a successor's start time.
- **Business & Operational Analytics (Recharts)**:
  - Capacity fill rate gauge
  - Real-time gross ticket revenue
  - Hourly arrival flow curve (`v_attendance_hourly`)
  - Equipment resource allocation (`v_resource_utilization`)
  - Personnel shift hours (`v_personnel_workload`)
  - Revenue distribution across ticket tiers (`v_event_revenue`)
- **QR Gate Check-In Scanner**:
  - Viewfinder with live scan simulation.
  - Duplicate-proof check-in verification against database registrations.

### 2. 🏢 Venue Manager (`venue_manager`)
- Profile and capacity management (indoor/outdoor, power grid capacity, operating hours).
- Certified facilities and equipment inventory inspection.
- Scheduled booking calendar.
- Interactive double-booking prevention demonstrator (testing PostgreSQL `EXCLUDE USING gist(tsrange)`).

### 3. 🎟️ Public Attendee Discovery (`attendee`)
- Public event discovery with search, category filtering, and price indicators.
- **Interactive OpenStreetMap Map View** powered by Leaflet, displaying venue pins and popups.
- **Simulated Stripe Checkout Modal**:
  - Select between General Admission and VIP Access.
  - Encrypted card payment flow.
  - Stripe webhook simulation (`payment_intent.succeeded`).
  - Confetti celebration and ticket receipt.
- **Digital QR Event Passes Wallet**:
  - Displays generated QR codes, ticket serials, and real-time admission verification status.

### 4. 📜 Relational Audit Log & Ripple Ledger
- Accessible from the header at any time.
- Time-stamped history of changes, the user who initiated them, and the ripple effects triggered.

---

## 🛠️ Quickstart

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Start the Development Server
```bash
npm run dev
```

### 3. Build for Production
```bash
npm run build
```

---

## 🔌 Connecting to Express.js Backend (When Ready)

All mock logic is centralized in [`src/context/AppContext.tsx`](./src/context/AppContext.tsx). Once your teammate completes the Express backend:
1. Replace local state mutations in `AppContext.tsx` with standard `fetch()` or `axios` calls to `http://localhost:5000/api/...`.
2. The TypeScript models in [`src/types/index.ts`](./src/types/index.ts) map 1:1 with Prisma schemas and PostgreSQL tables.
