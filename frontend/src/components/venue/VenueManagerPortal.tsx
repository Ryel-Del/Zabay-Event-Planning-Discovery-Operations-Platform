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
  const [testHallId, setTestHallId] = useState<string>('');

  const handleTestBooking = async () => {
    const res = await bookVenue(
      selectedVenue.id,
      'test-conflict-check',
      testStart,
      testEnd,
      testHallId || undefined
    );
    setBookingStatus(res);
    setTimeout(() => setBookingStatus(null), 4500);
  };

  return (
    <div className="space-y-6">
      {/* Venue Header */}
      <div className="bg-white dark:bg-[#1E1C19] border border-stone-200/80 dark:border-stone-800/80 rounded-2xl p-6 shadow-sm transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-200/80 dark:border-stone-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-stone-100 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60 rounded-xl">
              <Building2 className="w-5 h-5 text-[#B68366] dark:text-[#D4A58C]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                Venue Operations & Calendar Manager
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 font-mono">
                  EXCLUDE Constraint Guard
                </span>
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Manage physical specifications, multi-hall inventories, and database-enforced non-overlapping time slots.
              </p>
            </div>
          </div>

          {/* Venue Selector */}
          <select
            value={selectedVenue.id}
            onChange={(e) => {
              const v = venues.find((x) => x.id === e.target.value);
              if (v) {
                setSelectedVenue(v);
                setTestHallId('');
              }
            }}
            className="bg-[#FAF9F5] dark:bg-[#171513] border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-semibold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-[#B68366]"
          >
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.capacity.toLocaleString()} guests)
              </option>
            ))}
          </select>
        </div>

        {/* Venue Profile Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-[#FAF9F5] dark:bg-[#171513] p-4 rounded-xl border border-stone-200/80 dark:border-stone-800/80 space-y-1">
            <span className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-[#B68366] dark:text-[#D4A58C]" /> Max Seating Capacity
            </span>
            <p className="text-xl font-black text-stone-900 dark:text-stone-100">{selectedVenue.capacity.toLocaleString()} guests</p>
            <p className="text-[11px] text-stone-500">{selectedVenue.is_indoor ? 'Indoor Facility' : 'Outdoor Amphitheater'}</p>
          </div>

          <div className="bg-[#FAF9F5] dark:bg-[#171513] p-4 rounded-xl border border-stone-200/80 dark:border-stone-800/80 space-y-1">
            <span className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-[#C28E3A] dark:text-[#E5BE7E]" /> Power Grid Capacity
            </span>
            <p className="text-xl font-black text-stone-900 dark:text-stone-100">{selectedVenue.power_kw_capacity} kW</p>
            <p className="text-[11px] text-stone-500">Dedicated 3-phase substation</p>
          </div>

          <div className="bg-[#FAF9F5] dark:bg-[#171513] p-4 rounded-xl border border-stone-200/80 dark:border-stone-800/80 space-y-1">
            <span className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-stone-400" /> Operating Window
            </span>
            <p className="text-xl font-black text-stone-900 dark:text-stone-100">
              {selectedVenue.operating_hours.open} - {selectedVenue.operating_hours.close}
            </p>
            <p className="text-[11px] text-stone-500">Hourly Rate: ₱{selectedVenue.hourly_rate.toLocaleString()}/hr</p>
          </div>

          <div className="bg-[#FAF9F5] dark:bg-[#171513] p-4 rounded-xl border border-stone-200/80 dark:border-stone-800/80 space-y-1">
            <span className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-[#5F7D5B] dark:text-[#97B394]" /> Overlap Protection
            </span>
            <p className="text-xl font-black text-[#455C42] dark:text-[#A7C2A4]">PostgreSQL GiST</p>
            <p className="text-[11px] text-stone-500">EXCLUDE USING gist(tsrange)</p>
          </div>
        </div>
      </div>

      {/* Halls & Function Spaces Inventory */}
      {selectedVenue.halls && selectedVenue.halls.length > 0 && (
        <div className="bg-white dark:bg-[#1E1C19] border border-stone-200/80 dark:border-stone-800/80 rounded-2xl p-6 shadow-sm space-y-4 transition-colors">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200/80 dark:border-stone-800">
            <h3 className="text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#B68366] dark:text-[#D4A58C]" />
              Halls & Sub-Venues Inventory ({selectedVenue.halls.length} Individual Spaces)
            </h3>
            <span className="text-[11px] text-stone-500 dark:text-stone-400 font-mono">
              Independent EXCLUDE Booking Partitions
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {selectedVenue.halls.map((hall) => (
              <div
                key={hall.id}
                className="p-4 rounded-xl bg-[#FAF9F5] dark:bg-[#171513] border border-stone-200/80 dark:border-stone-800 space-y-2 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-stone-900 dark:text-stone-100">{hall.name}</h4>
                  <span className="font-bold text-[#B68366] dark:text-[#D4A58C] font-mono shrink-0">
                    ₱{hall.hourly_rate.toLocaleString()}/hr
                  </span>
                </div>
                {hall.description && (
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-2">
                    {hall.description}
                  </p>
                )}
                <div className="flex items-center gap-2 text-[10px] text-stone-400 font-mono pt-2 border-t border-stone-200/60 dark:border-stone-800">
                  <span className="font-semibold text-stone-700 dark:text-stone-300">
                    Cap: {hall.capacity.toLocaleString()}
                  </span>
                  {hall.dimensions && <span>• {hall.dimensions}</span>}
                  <span>• {hall.is_indoor ? 'Indoor' : 'Outdoor'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Facilities & Equipment Inventory */}
      <div className="bg-white dark:bg-[#1E1C19] border border-stone-200/80 dark:border-stone-800/80 rounded-2xl p-6 shadow-sm space-y-4 transition-colors">
        <h3 className="text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#B68366] dark:text-[#D4A58C]" />
          Certified Facilities & Infrastructure Checklist
        </h3>
        <div className="flex flex-wrap gap-2">
          {selectedVenue.facilities.map((fac, idx) => (
            <span
              key={idx}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#FAF9F5] dark:bg-[#171513] border border-stone-200/80 dark:border-stone-800 text-stone-700 dark:text-stone-300 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-[#5F7D5B] dark:text-[#97B394]" />
              {fac}
            </span>
          ))}
        </div>
      </div>

      {/* Booking Calendar & Temporal Non-Overlap Demonstrator */}
      <div className="bg-white dark:bg-[#1E1C19] border border-stone-200/80 dark:border-stone-800/80 rounded-2xl p-6 shadow-sm space-y-6 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#B68366] dark:text-[#D4A58C]" />
              Scheduled Venue Bookings ({bookingsForVenue.length} Confirmed)
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Database blocks overlapping time intervals automatically via PostgreSQL EXCLUDE constraint.
            </p>
          </div>
        </div>

        {/* Existing Bookings */}
        <div className="space-y-3">
          {bookingsForVenue.map((booking) => (
            <div
              key={booking.id}
              className="p-4 rounded-xl bg-[#FAF9F5] dark:bg-[#171513] border border-stone-200/80 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <span className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  {booking.event_title}
                  {booking.hall_name && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#FAF0E6] dark:bg-[#2A231C] text-[#8C5D39] dark:text-[#E8BA97] border border-[#B68366]/30 font-semibold">
                      {booking.hall_name}
                    </span>
                  )}
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#EEF3ED] dark:bg-[#222D21] text-[#455C42] dark:text-[#A7C2A4] border border-[#5F7D5B]/20 font-semibold uppercase">
                    {booking.status}
                  </span>
                </span>
                <p className="text-xs font-mono text-stone-500 dark:text-stone-400 mt-1">
                  Interval: {new Date(booking.start_time).toLocaleDateString()} {new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} → {new Date(booking.end_time).toLocaleDateString()} {new Date(booking.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              <div className="text-right text-[11px] text-stone-400 font-mono">
                Ref: {booking.id}
              </div>
            </div>
          ))}
        </div>

        {/* EXCLUDE Constraint Test Suite */}
        <div className="p-4 rounded-xl bg-[#FAF9F5] dark:bg-[#171513] border border-stone-200/80 dark:border-stone-800 space-y-3">
          <h4 className="text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#5F7D5B] dark:text-[#97B394]" />
            Test Double-Booking Prevention (Simulate Database Conflict)
          </h4>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Attempt to schedule an overlapping event booking during an existing slot to see the database EXCLUDE constraint actively block it:
          </p>

          <div className="flex flex-wrap items-center gap-3">
            {selectedVenue.halls && selectedVenue.halls.length > 0 && (
              <select
                value={testHallId}
                onChange={(e) => setTestHallId(e.target.value)}
                className="bg-white dark:bg-[#1E1C19] border border-stone-300 dark:border-stone-700 px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-900 dark:text-stone-100 focus:outline-none"
              >
                <option value="">Entire Facility</option>
                {selectedVenue.halls.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} (Cap: {h.capacity})
                  </option>
                ))}
              </select>
            )}
            <input
              type="text"
              value={testStart}
              onChange={(e) => setTestStart(e.target.value)}
              className="bg-white dark:bg-[#1E1C19] border border-stone-300 dark:border-stone-700 px-3 py-1.5 rounded-lg text-xs font-mono text-stone-900 dark:text-stone-100 focus:outline-none"
              title="Booking Start Time"
            />
            <span className="text-stone-400 text-xs font-bold">to</span>
            <input
              type="text"
              value={testEnd}
              onChange={(e) => setTestEnd(e.target.value)}
              className="bg-white dark:bg-[#1E1C19] border border-stone-300 dark:border-stone-700 px-3 py-1.5 rounded-lg text-xs font-mono text-stone-900 dark:text-stone-100 focus:outline-none"
              title="Booking End Time"
            />
            <button
              onClick={handleTestBooking}
              className="px-4 py-1.5 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 rounded-lg text-xs font-semibold transition-all shadow-sm cursor-pointer"
            >
              Verify DB Conflict Check
            </button>
          </div>

          {bookingStatus && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
                bookingStatus.success
                  ? 'bg-[#EEF3ED] dark:bg-[#222D21] border-[#5F7D5B]/30 text-[#455C42] dark:text-[#A7C2A4]'
                  : 'bg-[#F9ECE9] dark:bg-[#341D1A] border-[#BA4E3E]/30 text-[#822E22] dark:text-[#E48D80]'
              }`}
            >
              {bookingStatus.success ? (
                <CheckCircle2 className="w-4 h-4 text-[#5F7D5B] dark:text-[#A7C2A4] shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-[#BA4E3E] dark:text-[#E48D80] shrink-0" />
              )}
              <span>{bookingStatus.message}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
