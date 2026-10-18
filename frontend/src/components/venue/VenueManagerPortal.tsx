import React, { useState } from 'react';
import {
  Building2,
  Calendar,
  ShieldCheck,
  Zap,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Layers,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Venue } from '../../types';

export const VenueManagerPortal: React.FC = () => {
  const { venues, venueBookings, bookVenue } = useApp();
  const [selectedVenue, setSelectedVenue] = useState<Venue>(venues[0]);
  const [testStart, setTestStart] = useState('2026-11-13T10:00:00Z');
  const [testEnd, setTestEnd] = useState('2026-11-13T18:00:00Z');
  const [bookingStatus, setBookingStatus] = useState<{ success: boolean; message: string } | null>(null);

  const bookingsForVenue = venueBookings.filter((b) => b.venue_id === selectedVenue.id);

  const handleTestBooking = () => {
    const res = bookVenue(selectedVenue.id, 'test-conflict-check', testStart, testEnd);
    setBookingStatus(res);
    setTimeout(() => setBookingStatus(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Venue Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
              <Building2 className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Venue Operations & Calendar Manager
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-800/80 font-mono">
                  EXCLUDE Constraint Guard
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Manage venue specs, operational hours, facilities, and database-enforced non-overlapping bookings.
              </p>
            </div>
          </div>

          {/* Venue Selector */}
          <select
            value={selectedVenue.id}
            onChange={(e) => {
              const v = venues.find((x) => x.id === e.target.value);
              if (v) setSelectedVenue(v);
            }}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.capacity.toLocaleString()} cap)
              </option>
            ))}
          </select>
        </div>

        {/* Venue Profile Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-indigo-400" /> Max Seating Capacity
            </span>
            <p className="text-xl font-black text-white">{selectedVenue.capacity.toLocaleString()} guests</p>
            <p className="text-[11px] text-slate-500">{selectedVenue.is_indoor ? 'Indoor Facility' : 'Outdoor Amphitheater'}</p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Power Grid Capacity
            </span>
            <p className="text-xl font-black text-white">{selectedVenue.power_kw_capacity} kW</p>
            <p className="text-[11px] text-slate-500">Dedicated 3-phase substation</p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-cyan-400" /> Operating Window
            </span>
            <p className="text-xl font-black text-white">
              {selectedVenue.operating_hours.open} - {selectedVenue.operating_hours.close}
            </p>
            <p className="text-[11px] text-slate-500">Hourly Rate: ${selectedVenue.hourly_rate}/hr</p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-emerald-400" /> Overlap Protection
            </span>
            <p className="text-xl font-black text-emerald-400">PostgreSQL GiST</p>
            <p className="text-[11px] text-slate-500">EXCLUDE USING gist(tsrange)</p>
          </div>
        </div>
      </div>

      {/* Facilities & Equipment Inventory */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-violet-400" />
          Certified Facilities & Hardware Infrastructure
        </h3>
        <div className="flex flex-wrap gap-2">
          {selectedVenue.facilities.map((fac, idx) => (
            <span
              key={idx}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-950 border border-slate-800 text-slate-200 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              {fac}
            </span>
          ))}
        </div>
      </div>

      {/* Booking Calendar & Temporal Non-Overlap Demonstrator */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400" />
              Scheduled Venue Bookings ({bookingsForVenue.length} Confirmed)
            </h3>
            <p className="text-xs text-slate-400">
              Database blocks overlapping time intervals automatically via PostgreSQL EXCLUDE constraint.
            </p>
          </div>
        </div>

        {/* Existing Bookings */}
        <div className="space-y-3">
          {bookingsForVenue.map((booking) => (
            <div
              key={booking.id}
              className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  {booking.event_title}
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-semibold uppercase">
                    {booking.status}
                  </span>
                </span>
                <p className="text-xs font-mono text-slate-400 mt-1">
                  Interval: {new Date(booking.start_time).toLocaleDateString()} {new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} → {new Date(booking.end_time).toLocaleDateString()} {new Date(booking.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              <div className="text-right text-[11px] text-slate-500 font-mono">
                Booking ID: {booking.id}
              </div>
            </div>
          ))}
        </div>

        {/* EXCLUDE Constraint Test Suite */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            Test Double-Booking Prevention (Simulate Database Conflict)
          </h4>
          <p className="text-xs text-slate-400">
            Attempt to schedule an overlapping event booking during an existing slot to see the database EXCLUDE constraint actively block it:
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={testStart}
              onChange={(e) => setTestStart(e.target.value)}
              className="bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-mono text-white focus:outline-none"
              title="Booking Start Time"
            />
            <span className="text-slate-500 text-xs font-bold">to</span>
            <input
              type="text"
              value={testEnd}
              onChange={(e) => setTestEnd(e.target.value)}
              className="bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-mono text-white focus:outline-none"
              title="Booking End Time"
            />
            <button
              onClick={handleTestBooking}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-indigo-600/30"
            >
              Verify DB Conflict Check
            </button>
          </div>

          {bookingStatus && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
                bookingStatus.success
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                  : 'bg-rose-950/60 border-rose-500/50 text-rose-300'
              }`}
            >
              {bookingStatus.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{bookingStatus.message}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
