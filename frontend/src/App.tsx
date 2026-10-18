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
    <div className="min-h-screen bg-[#FAF9F5] dark:bg-[#171513] text-stone-900 dark:text-stone-100 flex flex-col font-sans transition-colors duration-200">
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
            <div className="bg-white dark:bg-[#1E1C19] border border-stone-200/80 dark:border-stone-800/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-stone-100 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60 rounded-xl">
                  <Calendar className="w-5 h-5 text-[#B68366] dark:text-[#D4A58C]" />
                </div>
                <div>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">
                    Active Operational Workspace
                  </span>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedEvent.id}
                      onChange={(e) => {
                        const found = events.find((x) => x.id === e.target.value);
                        if (found) setSelectedEvent(found);
                      }}
                      className="bg-transparent font-bold text-stone-900 dark:text-stone-100 text-base focus:outline-none cursor-pointer hover:text-[#B68366] dark:hover:text-[#D4A58C] transition-colors"
                    >
                      {events.map((evt) => (
                        <option key={evt.id} value={evt.id} className="bg-white dark:bg-[#1E1C19] text-stone-900 dark:text-stone-100">
                          {evt.title} ({evt.category})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Sub-navigation tabs for Organizer */}
              <div className="flex items-center bg-[#EBE7DF] dark:bg-[#272420] p-1 rounded-xl border border-stone-200/70 dark:border-stone-700/60 shadow-inner">
                <button
                  onClick={() => setOrganizerSubTab('impact')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    organizerSubTab === 'impact'
                      ? 'bg-white dark:bg-[#34302B] text-stone-900 dark:text-stone-100 font-semibold shadow-sm'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                  }`}
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>Change-Impact</span>
                </button>

                <button
                  onClick={() => setOrganizerSubTab('matcher')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    organizerSubTab === 'matcher'
                      ? 'bg-white dark:bg-[#34302B] text-stone-900 dark:text-stone-100 font-semibold shadow-sm'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Venue Matcher</span>
                </button>

                <button
                  onClick={() => setOrganizerSubTab('tasks')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    organizerSubTab === 'tasks'
                      ? 'bg-white dark:bg-[#34302B] text-stone-900 dark:text-stone-100 font-semibold shadow-sm'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                  }`}
                >
                  <ListTodo className="w-3.5 h-3.5" />
                  <span>Task DAG</span>
                </button>

                <button
                  onClick={() => setOrganizerSubTab('analytics')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    organizerSubTab === 'analytics'
                      ? 'bg-white dark:bg-[#34302B] text-stone-900 dark:text-stone-100 font-semibold shadow-sm'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
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
      <footer className="border-t border-stone-200/80 dark:border-stone-800/80 bg-[#FAF9F5]/80 dark:bg-[#171513]/80 py-6 text-center text-xs text-stone-500 dark:text-stone-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            <strong className="text-stone-700 dark:text-stone-300">ZABAY</strong> — Relational-Database-Driven Event Planning & Discovery
          </p>
          <p className="font-mono text-[11px] text-stone-400 dark:text-stone-500">
            PostgreSQL • Express.js • Prisma • React 19 • Tailwind CSS v4 • Recharts
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
