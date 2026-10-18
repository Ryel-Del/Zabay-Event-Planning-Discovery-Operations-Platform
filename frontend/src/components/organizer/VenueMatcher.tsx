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
    setTimeout(() => setBookingFeedback(null), 5000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-violet-500/10 border border-violet-500/20 rounded-xl">
            <Building2 className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Requirement-Based Venue Matcher
              <span className="text-xs px-2 py-0.5 rounded-full bg-violet-950 text-violet-400 border border-violet-800/80 font-mono">
                fn_match_venue_to_event()
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Validates capacity, facilities, electrical power, and EXCLUDE temporal non-overlap constraints.
            </p>
          </div>
        </div>

        {/* Selected Event Requirements Badge */}
        <div className="text-right text-xs text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
          <p className="font-semibold text-slate-200">Event: {selectedEvent.title}</p>
          <p>Needs ≥ {selectedEvent.requirements.min_capacity.toLocaleString()} seats | {selectedEvent.requirements.power_kw_needed} kW</p>
        </div>
      </div>

      {bookingFeedback && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 border ${
            bookingFeedback.success
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {bookingFeedback.success ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
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
              ? 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40'
              : result.overall_score >= 50
              ? 'text-amber-400 border-amber-500/40 bg-amber-950/40'
              : 'text-rose-400 border-rose-500/40 bg-rose-950/40';

          return (
            <div
              key={venue.id}
              onClick={() => setSelectedVenueId(venue.id)}
              className={`cursor-pointer rounded-xl border p-4 transition-all relative overflow-hidden ${
                isSelected
                  ? 'bg-slate-800/90 border-indigo-500 ring-2 ring-indigo-500/30 shadow-lg'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">{venue.name}</h3>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    {venue.city}
                  </p>
                </div>
                <div className={`px-2 py-1 rounded-lg border font-mono text-xs font-black ${scoreColor}`}>
                  {result.overall_score}% Match
                </div>
              </div>

              {/* Specs snapshot */}
              <div className="space-y-1.5 text-xs text-slate-300 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80 mb-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Users className="w-3 h-3" /> Capacity
                  </span>
                  <span className={result.capacity_status.satisfied ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                    {venue.capacity.toLocaleString()} / {result.capacity_status.required.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Power Grid
                  </span>
                  <span className={result.power_status.satisfied ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                    {venue.power_kw_capacity} kW (need {result.power_status.required} kW)
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">EXCLUDE Constraint</span>
                  <span className={result.schedule_status.available ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                    {result.schedule_status.available ? 'No Overlap' : 'Slot Overlap!'}
                  </span>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleBook(venue);
                }}
                disabled={!result.schedule_status.available}
                className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  result.schedule_status.available
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                <CalendarCheck className="w-3.5 h-3.5" />
                {result.schedule_status.available ? 'Book Venue for Event' : 'Slot Overlaps (Blocked)'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Deep-Dive Inspection of Selected Venue */}
      {activeVenueMatch && (
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-400" />
              Detailed Match Breakdown: {activeVenueMatch.venue.name}
            </h3>
            <span className="text-[11px] text-slate-400">
              ${activeVenueMatch.venue.hourly_rate}/hr • Operating: {activeVenueMatch.venue.operating_hours.open} - {activeVenueMatch.venue.operating_hours.close}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Matched Facilities */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                Matched Requirements ({activeVenueMatch.result.facilities_status.matched.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {activeVenueMatch.result.facilities_status.matched.map((facility, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 text-[11px] font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-800/80 rounded-md"
                  >
                    ✓ {facility}
                  </span>
                ))}
              </div>
            </div>

            {/* Missing or Unmet Facilities */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
                <X className="w-3.5 h-3.5" />
                Unmet Event Requirements ({activeVenueMatch.result.facilities_status.missing.length})
              </span>
              {activeVenueMatch.result.facilities_status.missing.length === 0 ? (
                <p className="text-xs text-slate-400 italic">All requested facilities are satisfied by this venue.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {activeVenueMatch.result.facilities_status.missing.map((missing, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 text-[11px] font-medium bg-rose-950/60 text-rose-300 border border-rose-800/80 rounded-md"
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
