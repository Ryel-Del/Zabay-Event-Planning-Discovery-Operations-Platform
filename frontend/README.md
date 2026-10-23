# ZABAY — Frontend Client Application

> **Relational-Database-Driven Event Planning, Discovery & Operations Platform**  
> Built with **React 19 + TypeScript + Vite + Tailwind CSS v4 + Recharts + Leaflet (OpenStreetMap)**

---

## 🚀 Overview for the Team

This is the frontend client for the **ZABAY** platform. It implements all 3 core user personas, relational operational logic simulators, and discovery features defined in the project specification.

The client uses the Express API for live event discovery, event creation, venue booking, attendee registration, and check-in. Demo mode and several operations views remain local simulations; they do not persist to PostgreSQL.

---

## 👥 Supported Roles & Features

### 1. 🎪 Event Organizer & Operations (`organizer`)
- **Dependency-Based Change-Impact Analyzer (`fn_downstream_impact`, `fn_schedule_impact`)**:
  - Pick any scheduled task (e.g. Stage Audio Rigging) and simulate a delay (+15m, +30m, +45m, +60m, +90m, +120m).
  - Recursively traces all downstream tasks through finish-to-start dependencies.
  - Automatically flags infeasible schedules and collision conflicts.
  - Updates client state and records a local audit entry.
- **Requirement-Based Venue Matcher (`fn_match_venue_to_event`)**:
  - Compares event requirements (capacity, 10Gbps WiFi, 4K projection, sound arrays, power in kW) against venue profiles.
  - Generates itemized match breakdowns (matched vs missing facilities).
  - Validates booking availability with PostgreSQL `EXCLUDE` constraint simulation.
- **Operational Task Board & Finish-to-Start DAG**:
  - Displays tasks with priorities, status badges, assigned personnel (supertype/subtype pattern), and equipment allocations.
  - Visual collision alerts when a predecessor delays past a successor's start time.
- **Business & Operational Analytics (Recharts)**:
  - Capacity fill rate gauge
  - Simulated gross ticket revenue
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
  - Visual checkout simulation; no card payment is processed.
  - Payment status display is a frontend simulation.
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

## 🔌 Express.js Backend Integration

Live API operations use same-origin `/api` through [`src/services/api.ts`](./src/services/api.ts). In development, Vite proxies `/api` to Express. Some local simulations remain in [`src/context/AppContext.tsx`](./src/context/AppContext.tsx).

The TypeScript models describe client data and do not imply a Prisma schema.
