# ZABAY — Event Planning, Discovery & Operations Platform

ZABAY is a relational-database-driven platform for planning, running, and analyzing events in Bohol and Tagbilaran City. It models venues, tasks, personnel, and resources as interconnected entities so that organizers can see how a single change ripples across every dependent part of an event, instead of discovering conflicts on the day of the event.

---

## Key Features

- **Tagbilaran & Bohol Venue Directory**: Built-in verified registry of iconic Bohol venues (Bohol Cultural Center, Holy Name University Barder Gymnasium, Bohol Wisdom Gymnasium, Fortridge Pavilion, Bohol Tropics Resort, Plaza Rizal, etc.) with power (kW), seating capacities, and equipment specifications.
- **Relational Change-Impact Analyzer (`fn_downstream_impact`)**: Recursively traces cascading schedule slippages across predecessor-successor task trees.
- **Automated Venue Feasibility Matcher (`fn_match_venue_to_event`)**: Automatically evaluates physical specifications, electrical substation requirements, and booking conflicts (`EXCLUDE` constraints).
- **Interactive Kanban Board with 1-Click Starter Kits**: Pre-configured task templates for Student Organization Assemblies, Esports Tournaments, and Corporate Summits.
- **Live Camera QR Gate Scanner**: Attendee check-in using your laptop or webcam with instant duplicate ticket prevention.
- **Luma-Style Event Experience**: Public event discovery, interactive OpenStreetMap venue pins, and simulated digital pass checkout.
- **Philippine Peso (₱) Ticketing & Budgets**: Fully localized currency for event budgets, hourly rates, and ticket tiers.

---

## Clean Initial Workspace & Demo Environment

For an initial commit and production-ready setup:
- **Clean Workspace by Default**: Starts with an empty event ledger, 0 attendee registrations, and a clean task board ready for organizers to create their own events.
- **1-Click Bohol Sample Environment**: Toggle the **"Load Bohol Sample Data"** button in the header or empty states to instantly populate a full Bohol demonstration event (*Sandugo Tech & AI Youth Summit 2026*) with real passes, tasks, and schedules.
- **Reset Anytime**: Click **"Clear to Clean Slate"** to return to a blank workspace.

---

## Project Structure

```
zabay/
├── db/              # PostgreSQL schema, migrations, triggers, views, and functions
├── backend/         # Express.js + Prisma API
├── frontend/        # React + TypeScript + Vite + Tailwind CSS client
│   ├── src/
│   │   ├── assets/       # Official Zabay emblems and graphics
│   │   ├── components/   # Modular Attendee, Organizer, Venue, and Layout components
│   │   ├── context/      # Reactive application state & simulated database functions
│   │   ├── mock/         # Curated Bohol seed fixtures for demo/testing
│   │   └── types/        # TypeScript interfaces matching the 20-table schema
└── README.md
```

---

## Getting Started

### 1. Prerequisites
- **Node.js** (v18 or higher recommended)
- **npm** or **pnpm**

### 2. Running the Client Application
```bash
cd frontend
npm install
npm run dev
```

Visit the local Vite development server in your browser (default: `http://localhost:5173`).

---

## Switching Perspectives

Use the user profile menu in the top-right header to switch between perspectives:
1. **Organizer / Ops Studio**: 4-stage event planning lifecycle (`1. Organize` ➔ `2. Prepare` ➔ `3. Market` ➔ `4. Execute`), Kanban board, change-impact simulator, and calendar.
2. **Venue Partner Hub**: Facility capacity oversight, operating rates, and `EXCLUDE` constraint booking logs.
3. **Public Event Feed**: Luma-style attendee event exploration, interactive map, and pass generator.
