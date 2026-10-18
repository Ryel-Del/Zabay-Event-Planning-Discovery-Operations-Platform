# ZABAY — Event Planning, Discovery & Operations Platform

ZABAY is a relational-database-driven platform for planning, running, and analyzing events. It models venues, tasks, personnel, and resources as interconnected entities so that organizers can see how a single change ripples across every dependent part of an event, instead of discovering the conflict on the day itself.

## Project Structure

```
zabay/
├── db/              # PostgreSQL schema, migrations, triggers, views, and functions
├── backend/         # Express.js + Prisma API
├── frontend/        # React + TypeScript + Vite + Tailwind CSS client
└── README.md
```

## Running the Frontend Client

```bash
cd frontend
npm install
npm run dev
```

Visit the local Vite development server URL in your browser (usually `http://localhost:5173`).
Use the top role switcher to toggle between:
- **Organizer / Ops**
- **Venue Manager**
- **Attendee Discovery**
