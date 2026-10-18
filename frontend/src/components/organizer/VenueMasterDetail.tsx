import React, { useState } from 'react';
import {
  Building2,
  Check,
  X,
  ShieldAlert,
  CalendarCheck,
  CheckCircle2,
  MapPin,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Venue } from '../../types';

export const VenueMasterDetail: React.FC = () => {
  const { venues, selectedEvent, fnMatchVenueToEvent, bookVenue } = useApp();
  const [selectedVenueId, setSelectedVenueId] = useState<string>(venues[0]?.id);
  const [bookingFeedback, setBookingFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const matchResults = venues.map((venue) => ({
    venue,
    result: fnMatchVenueToEvent(selectedEvent.id, venue.id),
  }));

  const activeVenueMatch = matchResults.find((m) => m.venue.id === selectedVenueId) || matchResults[0];

  const handleBook = (venue: Venue) => {
    const res = bookVenue(venue.id, selectedEvent.id, selectedEvent.start_date, selectedEvent.end_date);
    setBookingFeedback(res);
    setTimeout(() => setBookingFeedback(null), 4500);
  };

  return (
    <div className="bg-white dark:bg-[#1E1C19] border border-stone-200/80 dark:border-stone-800/80 rounded-2xl p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200/80 dark:border-stone-800/80">
        <div>
          <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#B68366] dark:text-[#D4A58C]" />
            Requirement-Based Venue Matcher & Booking
          </h2>
          <p className="text-xs text-stone-500">
            Compares event requirements against candidate venue capabilities and database EXCLUDE constraints.
          </p>
        </div>

        <div className="text-xs bg-[#FAF9F5] dark:bg-[#171513] px-3 py-1.5 rounded-xl border border-stone-200/80 dark:border-stone-800/80 text-stone-600 dark:text-stone-400">
          Target: ≥ <strong>{selectedEvent.requirements.min_capacity.toLocaleString()}</strong> capacity • <strong>{selectedEvent.requirements.power_kw_needed} kW</strong> power
        </div>
      </div>

      {bookingFeedback && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 border ${
            bookingFeedback.success
              ? 'bg-[#EEF3ED] dark:bg-[#222D21] border-[#5F7D5B]/30 text-[#455C42] dark:text-[#A7C2A4]'
              : 'bg-[#F9ECE9] dark:bg-[#341D1A] border-[#BA4E3E]/30 text-[#822C20] dark:text-[#E48D80]'
          }`}
        >
          {bookingFeedback.success ? (
            <CheckCircle2 className="w-4 h-4 text-[#5F7D5B] dark:text-[#A7C2A4] shrink-0" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-[#BA4E3E] dark:text-[#E48D80] shrink-0" />
          )}
          <span>{bookingFeedback.message}</span>
        </div>
      )}

      {/* Cvent-Style Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Venue Master Directory List (4 cols) */}
        <div className="lg:col-span-4 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 px-1">
            Candidate Venues ({venues.length})
          </span>

          <div className="space-y-2">
            {matchResults.map(({ venue, result }) => {
              const isSelected = venue.id === selectedVenueId;
              const isHigh = result.overall_score >= 80;

              return (
                <div
                  key={venue.id}
                  onClick={() => setSelectedVenueId(venue.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-stone-100 dark:bg-[#25221E] border-stone-900 dark:border-stone-100 ring-1 ring-stone-900/10 dark:ring-stone-100/10 shadow-sm'
                      : 'bg-[#FAF9F5] dark:bg-[#171513] border-stone-200/80 dark:border-stone-800/80 hover:border-stone-300 dark:hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                      {venue.name}
                    </h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        isHigh
                          ? 'bg-[#EEF3ED] text-[#455C42] dark:bg-[#222D21] dark:text-[#A7C2A4]'
                          : 'bg-[#FBF4E8] text-[#7C5517] dark:bg-[#332615] dark:text-[#E5BE7E]'
                      }`}
                    >
                      {result.overall_score}% Match
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-stone-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {venue.city}
                    </span>
                    <span>{venue.capacity.toLocaleString()} cap</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Deep Inspection Panel (8 cols) */}
        {activeVenueMatch && (
          <div className="lg:col-span-8 bg-[#FAF9F5] dark:bg-[#171513] border border-stone-200/80 dark:border-stone-800/80 rounded-2xl p-6 space-y-6">
            {/* Banner Header with Photo & Key Specs */}
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4 pb-4 border-b border-stone-200/80 dark:border-stone-800/80">
              <div>
                <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                  {activeVenueMatch.venue.name}
                </h3>
                <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-stone-400" />
                  {activeVenueMatch.venue.address}, {activeVenueMatch.venue.city}
                </p>
              </div>

              <div className="text-right">
                <span className="text-base font-black text-stone-900 dark:text-stone-100">
                  ${activeVenueMatch.venue.hourly_rate}/hr
                </span>
                <p className="text-[10px] text-stone-400 font-mono">
                  {activeVenueMatch.venue.operating_hours.open} - {activeVenueMatch.venue.operating_hours.close}
                </p>
              </div>
            </div>

            {/* Requirement Comparison Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white dark:bg-[#1E1C19] p-3 rounded-xl border border-stone-200/80 dark:border-stone-800 text-xs space-y-1">
                <span className="text-stone-500">Attendance Capacity</span>
                <p className="font-bold text-stone-900 dark:text-stone-100">
                  {activeVenueMatch.venue.capacity.toLocaleString()} / {selectedEvent.requirements.min_capacity.toLocaleString()}
                </p>
                <span className="text-[10px] text-[#5F7D5B] dark:text-[#97B394] font-semibold">
                  ✓ Capacity Satisfied
                </span>
              </div>

              <div className="bg-white dark:bg-[#1E1C19] p-3 rounded-xl border border-stone-200/80 dark:border-stone-800 text-xs space-y-1">
                <span className="text-stone-500">Power Substation</span>
                <p className="font-bold text-stone-900 dark:text-stone-100">
                  {activeVenueMatch.venue.power_kw_capacity} kW (need {selectedEvent.requirements.power_kw_needed} kW)
                </p>
                <span className="text-[10px] text-[#5F7D5B] dark:text-[#97B394] font-semibold">
                  ✓ Power Grid Satisfied
                </span>
              </div>

              <div className="bg-white dark:bg-[#1E1C19] p-3 rounded-xl border border-stone-200/80 dark:border-stone-800 text-xs space-y-1">
                <span className="text-stone-500">EXCLUDE Constraint</span>
                <p className="font-bold text-stone-900 dark:text-stone-100">
                  {activeVenueMatch.result.schedule_status.available ? 'No Overlap' : 'Slot Clashed'}
                </p>
                <span className={activeVenueMatch.result.schedule_status.available ? 'text-[10px] text-[#5F7D5B] dark:text-[#97B394] font-semibold' : 'text-[10px] text-[#BA4E3E] font-semibold'}>
                  {activeVenueMatch.result.schedule_status.available ? '✓ Slot Free to Book' : '✗ Overlap Blocked'}
                </span>
              </div>
            </div>

            {/* Facilities Checklist Breakdown */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                Facility Requirements Checklist
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {activeVenueMatch.result.facilities_status.matched.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-[#EEF3ED] dark:bg-[#222D21] text-[#455C42] dark:text-[#A7C2A4] border border-[#5F7D5B]/20">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{f}</span>
                  </div>
                ))}
                {activeVenueMatch.result.facilities_status.missing.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-[#F9ECE9] dark:bg-[#341D1A] text-[#822E22] dark:text-[#E48D80] border border-[#BA4E3E]/20">
                    <X className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Missing: {f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-2 border-t border-stone-200/80 dark:border-stone-800/80 flex items-center justify-end gap-3">
              <button
                onClick={() => handleBook(activeVenueMatch.venue)}
                disabled={!activeVenueMatch.result.schedule_status.available}
                className={`py-2.5 px-5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                  activeVenueMatch.result.schedule_status.available
                    ? 'bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900'
                    : 'bg-stone-300 dark:bg-stone-800 text-stone-500 cursor-not-allowed'
                }`}
              >
                <CalendarCheck className="w-4 h-4" />
                Confirm Venue Booking for Event
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
