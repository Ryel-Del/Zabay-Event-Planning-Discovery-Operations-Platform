# 🎪 ZABAY — Event Planning, Discovery & Operations Platform

> **An all-in-one, relational-database-driven event operating system designed for Bohol & Tagbilaran City ecosystems.**  
> Unifies Public Discovery, Venue Facility Management, Host Operations, and On-Ground Gate Admittance under ACID concurrency and PostgreSQL exclusion constraints.

[![Frontend](https://img.shields.io/badge/Frontend-Vercel-black?style=flat&logo=vercel)](https://zabay.vercel.app)
[![Backend](https://img.shields.io/badge/Backend-Render-46E3B7?style=flat&logo=render)](https://zabay-api.onrender.com)
[![Database](https://img.shields.io/badge/Database-Neon_PostgreSQL_16-00E599?style=flat&logo=postgresql)](https://neon.tech)
[![Auth](https://img.shields.io/badge/Auth-Firebase_Google_SSO-FFCA28?style=flat&logo=firebase)](https://firebase.google.com)
[![Tests](https://img.shields.io/badge/E2E-Cypress_Automated-007788?style=flat&logo=cypress)](https://cypress.io)

---

## 📌 Executive Overview & The Problem

In regional university and local government ecosystems like Tagbilaran City and Bohol, event operations are notoriously disconnected:

1. **Fragmented Communication**: Sign-ups happen on Google Forms, team tasks are lost in chaotic Facebook Messenger group chats, and equipment logistics are tracked on paper clipboards.
2. **Double-Booking Collisions**: Cultural centers and campus gymnasiums manage multiple sub-halls across static spreadsheets without storage-level concurrency controls, leading to simultaneous reservations for the same space.
3. **Gate Admittance Bottlenecks & Pass Fraud**: Event check-in relies on manual highlighter pens on printed attendance sheets, inviting duplicate entries and line delays.

**Zabay** solves this with a unified, role-based platform backed by hard relational database constraints. It coordinates four interconnected stakeholders: **Attendees**, **Venue Facility Managers**, **Event Organizers**, and **On-Ground Crew Staff**.

---

## 🏛️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Vercel Edge)                          │
│     React 19 + TypeScript + Vite + Tailwind CSS + Lucide Icons         │
│     • Fast responsive layouts (Desktop Studio + Mobile Run-of-Show)    │
│     • Hybrid state: Live Neon API Sync + Offline-Resilient Local Cache │
└──────────────────┬─────────────────────────────────┬───────────────────┘
                   │ HTTPS API Requests              │ OAuth 2.0 Popup
                   ▼                                 ▼
┌────────────────────────────────────┐  ┌────────────────────────────────┐
│         BACKEND (Render)           │  │      FIREBASE (Google Auth)    │
│   Node.js + Express + TypeScript   │  │  • Google SSO Identity Provider│
│   • SameSite Cookie Sessions       │  │  • Cryptographic JWT issuance  │
│   • CSRF Token Protection          │  │  • Verified by Server SDK      │
│   • Parameterized SQL (`pg`)       │  └────────────────────────────────┘
└──────────────────┬─────────────────┘
                   │ SSL Pooled Connection
                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    DATABASE (Neon PostgreSQL 16)                       │
│     Serverless Cloud PostgreSQL 16 Instance                            │
│     • ACID Transaction Guarantees & Row-Level Locking (`FOR UPDATE`)   │
│     • Exclusion Constraints (`tsrange`, GiST) for Zero-Overlap Bookings│
│     • 8 Live Production Tables + 11 Staged Domain Entities             │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🎭 The 4 Integrated Roles

| Role | Primary Purpose | Key Features |
| :--- | :--- | :--- |
| **1. Public Attendee** | Event exploration & pass management | Luma-style event discovery, interactive OpenStreetMap venue pins, Firebase Google 1-click sign-in, instant QR ticket generation, PNG ticket export. |
| **2. Venue Manager** | Facility oversight & double-booking defense | Hall & sub-venue inventory (e.g., Bohol Cultural Center Main Auditorium vs Gallery), hourly rental rates, real-time schedule conflict engine (`EXCLUDE` GiST check). |
| **3. Event Organizer** | Full lifecycle operations studio | 4-stage event pipeline (`Organize` ➔ `Prepare` ➔ `Market` ➔ `Execute`), Gantt & Kanban boards, task delay cascading impact simulator, committee roster management, live crew broadcast console. |
| **4. Event Staff / Crew** | Turnstile check-in & gate admittance | Live webcam / camera QR scanner, fast manual lookup, instant duplicate entry alert, offline-ready check-in records. |

---

## 💾 Relational Database & Concurrency Defense

### 1. Storage-Level Double-Booking Prevention (`EXCLUDE USING gist`)
Rather than relying on fragile application-level checks, Zabay delegates calendar collision detection to the PostgreSQL engine:
```sql
ALTER TABLE venue_bookings 
ADD CONSTRAINT no_overlapping_hall_bookings 
EXCLUDE USING gist (
  hall_id WITH =,
  tstzrange(start_time, end_time) WITH &&
) WHERE (status <> 'cancelled');
```
If two simultaneous booking requests target the same hall during overlapping timestamps, PostgreSQL atomically rejects the collision with code `23P01` (`exclusion_violation`).

### 2. Zero-Overselling Ticket Checkouts (`SELECT ... FOR UPDATE`)
When attendees purchase high-demand ticket tiers, the backend wraps the checkout in an ACID transaction:
```sql
BEGIN;
SELECT tickets_sold, capacity FROM ticket_tiers 
WHERE id = $1 FOR UPDATE;
-- Verify quota availability under lock
UPDATE ticket_tiers SET tickets_sold = tickets_sold + 1 WHERE id = $1;
INSERT INTO registrations (id, event_id, attendee_id, qr_pass_code) VALUES (...);
COMMIT;
```
This eliminates race conditions and guarantees that ticket limits are strictly enforced.

### 3. Idempotent QR Check-In Verification
Each ticket pass contains a cryptographically unique `qr_pass_code`. Upon scanning at the gate:
- First scan commits an attendance record with a timestamp.
- Immediate re-scan triggers a duplicate entry violation, preventing pass re-use.

### 4. 8-Table Production Core vs 19-Table Domain Model
- **Core Production MVP (8 Tables)**: `users`, `events`, `venues`, `venue_halls`, `venue_bookings`, `tasks`, `registrations`, `attendance_records`.
- **Staged 3NF Domain Entities (11 Tables)**: Fully modeled in [`db/schema.sql`](file:///c:/Users/Radel/OneDrive/Documents/New%20folder%20%282%29/zabay/db/schema.sql) for Phase 2 expansion (e.g., physical equipment assets, task DAG dependencies, financial ledgers).

---

## 🚀 Quick Start & Local Development

### 1. Prerequisites
- **Node.js**: v22+ (v24 recommended)
- **PostgreSQL**: v16+ (or Neon serverless connection string)
- **npm** or **pnpm**

### 2. Clone and Install Dependencies
```bash
git clone https://github.com/db-larpers/Zabay-Event-Planning-Discovery-Operations-Platform.git
cd Zabay-Event-Planning-Discovery-Operations-Platform

# Install Backend dependencies
npm install --prefix backend

# Install Frontend dependencies
npm install --prefix frontend
```

### 3. Environment Configuration

Create `backend/.env`:
```env
PORT=5000
DATABASE_URL=postgresql://user:password@ep-sample-pooler.neon.tech/zabay?sslmode=require
OPERATOR_USERNAME=operator
OPERATOR_PASSWORD=zabay-operator-secret-2026
SESSION_SECRET=zabay-super-secure-production-secret-2026
FIREBASE_PROJECT_ID=zabay-event-platform
```

Create `frontend/.env`:
```env
VITE_API_URL=http://127.0.0.1:5000
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-firebase-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
```

### 4. Run Development Servers
```bash
# Terminal 1: Backend API
npm run dev --prefix backend

# Terminal 2: Frontend Client (Vite)
npm run dev --prefix frontend
```
Visit `http://localhost:5173` in your browser.

---

## 🧪 Testing & Verification

### Backend Automated Unit & Security Suite
```bash
npm run test --prefix backend
```
Executes 13 automated tests verifying health, rate-limiting, CSRF token validation, passwordless protection, Firebase token bounds, and operator role elevation safeguards.

### Cypress End-to-End Suite
```bash
npm run test:e2e:local --prefix frontend
```
Runs full browser E2E flows against a disposable PostgreSQL 16 container, validating:
- Session hydration and operator authentication
- Seeded Bohol venue discovery
- Venue booking collision enforcement
- Pass registration and webcam QR gate scanner verification

---

## 🔑 Demo & Evaluation Access

- **Evaluation Dataset**: Toggle **"Try Bohol Demo"** or use shortcut `Ctrl+Shift+D` to instantly load the curated Bohol demonstration dataset (*Sandugo Tech & AI Youth Summit 2026* at Bohol Cultural Center).
- **Default Operator Credentials**:
  - **Username**: `operator`
  - **Password**: `zabay-operator-secret-2026`
- **One-Click Role Switching**: Switch between Attendee, Venue Manager, Organizer Studio, and Staff Portal directly via the top-right profile menu without re-logging.

---

## 👥 Engineering Team

Developed for the final project defense by **Team Zabay**:
- **System & Presentation Lead**: Product narrative, attendee experience, and operational validation.
- **Operations & Full-Stack Engineer**: Organizer studio, venue facility hub, camera scanner, and responsive UI.
- **Database & Cloud Architect**: Neon PostgreSQL schema, GiST exclusion constraints, ACID checkouts, and Firebase Auth boundary.

---

## 📄 License
This project is open-source under the MIT License.
