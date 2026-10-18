import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/common/Navbar';
import { ChangeImpactAnalyzer } from './components/organizer/ChangeImpactAnalyzer';
import { VenueMatcher } from './components/organizer/VenueMatcher';
import { TaskTimeline } from './components/organizer/TaskTimeline';
import { AnalyticsDashboard } from './components/organizer/AnalyticsDashboard';
import { QRCheckInScanner } from './components/organizer/QRCheckInScanner';
import { VenueManagerPortal } from './components/venue/VenueManagerPortal';
import { EventDiscovery } from './components/attendee/EventDiscovery';
import { AuditLogViewer } from './components/audit/AuditLogViewer';
import {
  GitBranch,
  Building2,
  ListTodo,
  BarChart3,
  Calendar,
} from 'lucide-react';

const MainContent: React.FC = () => {
  const { currentRole, selectedEvent, setSelectedEvent, events } = useApp();
  const [organizerSubTab, setOrganizerSubTab] = useState<'impact' | 'matcher' | 'tasks' | 'analytics'>('impact');
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Main Navbar */}
      <Navbar
        onOpenAudit={() => setIsAuditOpen(true)}
        onOpenScanner={() => setIsScannerOpen(true)}
      />

      {/* Main App Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Organizer Sub-View */}
        {currentRole === 'organizer' && (
          <div className="space-y-6">
            {/* Event Switcher Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                  <Calendar className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Active Operational Workspace
                  </span>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedEvent.id}
                      onChange={(e) => {
                        const found = events.find((x) => x.id === e.target.value);
                        if (found) setSelectedEvent(found);
                      }}
                      className="bg-transparent font-bold text-white text-base focus:outline-none cursor-pointer hover:text-indigo-300 transition-colors"
                    >
                      {events.map((evt) => (
                        <option key={evt.id} value={evt.id} className="bg-slate-900 text-white">
                          {evt.title} ({evt.category})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Sub-navigation tabs for Organizer */}
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setOrganizerSubTab('impact')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    organizerSubTab === 'impact'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>Change-Impact</span>
                </button>

                <button
                  onClick={() => setOrganizerSubTab('matcher')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    organizerSubTab === 'matcher'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Venue Matcher</span>
                </button>

                <button
                  onClick={() => setOrganizerSubTab('tasks')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    organizerSubTab === 'tasks'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ListTodo className="w-3.5 h-3.5" />
                  <span>Task DAG</span>
                </button>

                <button
                  onClick={() => setOrganizerSubTab('analytics')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    organizerSubTab === 'analytics'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Analytics</span>
                </button>
              </div>
            </div>

            {/* Active Organizer Sub-View Content */}
            {organizerSubTab === 'impact' && <ChangeImpactAnalyzer />}
            {organizerSubTab === 'matcher' && <VenueMatcher />}
            {organizerSubTab === 'tasks' && <TaskTimeline />}
            {organizerSubTab === 'analytics' && <AnalyticsDashboard />}
          </div>
        )}

        {/* Venue Manager View */}
        {currentRole === 'venue_manager' && <VenueManagerPortal />}

        {/* Attendee View */}
        {currentRole === 'attendee' && (
          <EventDiscovery
            onOpenScannerWithPass={() => {
              setIsScannerOpen(true);
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            <strong>ZABAY</strong> — Relational-Database-Driven Event Planning, Discovery & Operations
          </p>
          <p className="font-mono text-[11px]">
            PostgreSQL • Express.js • Prisma • React • Tailwind • Leaflet • Recharts
          </p>
        </div>
      </footer>

      {/* Global Modals */}
      <AuditLogViewer isOpen={isAuditOpen} onClose={() => setIsAuditOpen(false)} />
      <QRCheckInScanner isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
