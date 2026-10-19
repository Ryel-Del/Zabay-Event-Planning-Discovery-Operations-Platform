import React, { useState } from 'react';
import {
  Building2,
  Check,
  X,
  Zap,
  Users,
  ShieldAlert,
  CalendarCheck,
  CheckCircle2,
  MapPin,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Venue } from '../../types';

export const VenueMatcher: React.FC = () => {
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
    <div className="bg-white dark:bg-[#1E1C19] border border-stone-200/80 dark:border-stone-800/80 rounded-2xl p-6 shadow-sm space-y-6 transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-200/80 dark:border-stone-800/80">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-stone-100 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60 rounded-xl">
            <Building2 className="w-5 h-5 text-[#B68366] dark:text-[#D4A58C]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              Requirement-Based Venue Matcher
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 font-mono">
                fn_match_venue_to_event()
              </span>
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Compares requirements against physical capacities and database temporal EXCLUDE non-overlap locks.
            </p>
          </div>
        </div>

        {/* Selected Event Requirements Badge */}
        <div className="text-right text-xs text-stone-600 dark:text-stone-400 bg-[#FAF9F5] dark:bg-[#171513] p-2.5 rounded-xl border border-stone-200/80 dark:border-stone-800/80">
          <p className="font-semibold text-stone-900 dark:text-stone-200">{selectedEvent.title}</p>
          <p>Target: ≥ {selectedEvent.requirements.min_capacity.toLocaleString()} guests • {selectedEvent.requirements.power_kw_needed} kW</p>
        </div>
      </div>

      {bookingFeedback && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 border ${
            bookingFeedback.success
              ? 'bg-[#EEF3ED] dark:bg-[#222D21] border-[#5F7D5B]/30 text-[#455C42] dark:text-[#A7C2A4]'
              : 'bg-[#F9ECE9] dark:bg-[#301C19] border-[#BA4E3E]/30 text-[#822C20] dark:text-[#E48D80]'
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

      {/* Venues Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {matchResults.map(({ venue, result }) => {
          const isSelected = venue.id === selectedVenueId;
          const scoreColor =
            result.overall_score >= 80
              ? 'text-[#455C42] dark:text-[#A7C2A4] border-[#5F7D5B]/30 bg-[#EEF3ED] dark:bg-[#222D21]'
              : result.overall_score >= 50
              ? 'text-[#7C5517] dark:text-[#E5BE7E] border-[#C28E3A]/30 bg-[#FBF4E8] dark:bg-[#332615]'
              : 'text-[#822E22] dark:text-[#E48D80] border-[#BA4E3E]/30 bg-[#F9ECE9] dark:bg-[#341D1A]';

          return (
            <div
              key={venue.id}
              onClick={() => setSelectedVenueId(venue.id)}
              className={`cursor-pointer rounded-2xl border p-4 transition-all relative overflow-hidden ${
                isSelected
                  ? 'bg-white dark:bg-[#23201D] border-[#B68366] dark:border-[#D4A58C] ring-2 ring-[#B68366]/20 shadow-sm'
                  : 'bg-[#FAF9F5] dark:bg-[#171513] border-stone-200/80 dark:border-stone-800/80 hover:border-stone-300 dark:hover:border-stone-700'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 leading-tight">{venue.name}</h3>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-stone-400" />
                    {venue.city}
                  </p>
                </div>
                <div className={`px-2 py-0.5 rounded-lg border font-mono text-xs font-bold ${scoreColor}`}>
                  {result.overall_score}% Match
                </div>
              </div>

              {/* Specs snapshot */}
              <div className="space-y-1.5 text-xs text-stone-600 dark:text-stone-300 bg-white dark:bg-[#1E1C19] p-2.5 rounded-xl border border-stone-200/70 dark:border-stone-800/80 mb-3">
                <div className="flex justify-between items-center">
                  <span className="text-stone-500 dark:text-stone-400 flex items-center gap-1">
                    <Users className="w-3 h-3" /> Capacity
                  </span>
                  <span className={result.capacity_status.satisfied ? 'text-[#5F7D5B] dark:text-[#A7C2A4] font-semibold' : 'text-[#BA4E3E] dark:text-[#E48D80] font-semibold'}>
                    {venue.capacity.toLocaleString()} / {result.capacity_status.required.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500 dark:text-stone-400 flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Power Grid
                  </span>
                  <span className={result.power_status.satisfied ? 'text-[#5F7D5B] dark:text-[#A7C2A4] font-semibold' : 'text-[#BA4E3E] dark:text-[#E48D80] font-semibold'}>
                    {venue.power_kw_capacity} kW (need {result.power_status.required} kW)
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500 dark:text-stone-400">EXCLUDE Constraint</span>
                  <span className={result.schedule_status.available ? 'text-[#5F7D5B] dark:text-[#A7C2A4] font-semibold' : 'text-[#BA4E3E] dark:text-[#E48D80] font-semibold'}>
                    {result.schedule_status.available ? 'Available' : 'Slot Overlap!'}
                  </span>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleBook(venue);
                }}
                disabled={!result.schedule_status.available}
                className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  result.schedule_status.available
                    ? 'bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 shadow-sm cursor-pointer'
                    : 'bg-stone-200 dark:bg-stone-800 text-stone-400 dark:text-stone-600 cursor-not-allowed border border-stone-300 dark:border-stone-700'
                }`}
              >
                <CalendarCheck className="w-3.5 h-3.5" />
                {result.schedule_status.available ? 'Confirm Venue Allocation' : 'Overlaps (Blocked by DB)'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Deep-Dive Inspection of Selected Venue */}
      {activeVenueMatch && (
        <div className="bg-[#FAF9F5] dark:bg-[#171513] p-5 rounded-2xl border border-stone-200/80 dark:border-stone-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#B68366] dark:text-[#D4A58C]" />
              Detailed Verification: {activeVenueMatch.venue.name}
            </h3>
            <span className="text-[11px] text-stone-500 dark:text-stone-400">
              ₱{activeVenueMatch.venue.hourly_rate}/hr • Operating: {activeVenueMatch.venue.operating_hours.open} - {activeVenueMatch.venue.operating_hours.close}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Matched Facilities */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-[#5F7D5B] dark:text-[#A7C2A4] flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                Matched Requirements ({activeVenueMatch.result.facilities_status.matched.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {activeVenueMatch.result.facilities_status.matched.map((facility, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 text-[11px] font-medium bg-[#EEF3ED] dark:bg-[#222D21] text-[#455C42] dark:text-[#A7C2A4] border border-[#5F7D5B]/20 rounded-lg"
                  >
                    ✓ {facility}
                  </span>
                ))}
              </div>
            </div>

            {/* Missing or Unmet Facilities */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-[#BA4E3E] dark:text-[#E48D80] flex items-center gap-1.5">
                <X className="w-3.5 h-3.5" />
                Unmet Event Requirements ({activeVenueMatch.result.facilities_status.missing.length})
              </span>
              {activeVenueMatch.result.facilities_status.missing.length === 0 ? (
                <p className="text-xs text-stone-500 italic">All requested facilities are satisfied by this venue.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {activeVenueMatch.result.facilities_status.missing.map((missing, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 text-[11px] font-medium bg-[#F9ECE9] dark:bg-[#341D1A] text-[#822E22] dark:text-[#E48D80] border border-[#BA4E3E]/20 rounded-lg"
                    >
                      ✗ Missing: {missing}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
