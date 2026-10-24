import React, { useState, useMemo } from 'react';
import {
  Building2,
  Check,
  X,
  ShieldAlert,
  CalendarCheck,
  CheckCircle2,
  MapPin,
  Sliders,
  Users,
  Zap,
  Plus,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Venue } from '../../types';
import { CreateVenueModal } from '../venue/CreateVenueModal';

export const VenueMasterDetail: React.FC = () => {
  const { venues, selectedEvent, fnMatchVenueToEvent, bookVenue, isDemoMode } = useApp();

  const [isCreateVenueOpen, setIsCreateVenueOpen] = useState(false);

  // Interactive Requirement Controls for Student Orgs & Planners
  const [targetAttendance, setTargetAttendance] = useState<number>(
    selectedEvent?.requirements?.min_capacity || 500
  );
  const [maxBudgetPerHour, setMaxBudgetPerHour] = useState<number>(3500);
  const [selectedCity, setSelectedCity] = useState<string>('All');
  const [powerKwNeeded, setPowerKwNeeded] = useState<number>(
    selectedEvent?.requirements?.power_kw_needed || 80
  );

  // Available facilities student orgs can toggle
  const availableFacilityOptions = [
    'Dedicated Gigabit Fiber WiFi',
    'Indoor Arena Hardwood Court',
    'Olympic 8-Lane Rubberized Tartan Track Oval',
    'Dual Regulation Beach Volleyball Quartz Sand Courts',
    '4-Court Synthetic Badminton Floor Mats',
    'Electronic Digital Scoreboards',
    'High-Intensity Stadium Floodlights',
    'Bleacher Seating System',
    'Athlete Locker Rooms & Shower Facilities',
    'Concert PA & Audio System',
    '4K LED Wall & Displays',
    'Commercial Prep Kitchen',
    'Breakout Workshop Rooms',
    'Grand Ballroom Crystal Chandeliers',
    'Audiovisual Lecture Hall',
    'Private Executive Conference Rooms',
    'Wheelchair & ADA Accessible',
    'Loading Dock & Staging Bay',
  ];

  const [requiredFacilities, setRequiredFacilities] = useState<string[]>([
    'Dedicated Gigabit Fiber WiFi',
    '4K LED Wall & Displays',
    'Catering Prep Kitchen',
    'Wheelchair & ADA Accessible',
  ]);

  const [selectedVenueId, setSelectedVenueId] = useState<string>(venues[0]?.id);
  const [selectedHallId, setSelectedHallId] = useState<string | null>(null);
  const [bookingFeedback, setBookingFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const toggleFacility = (facility: string) => {
    setRequiredFacilities((prev) =>
      prev.includes(facility) ? prev.filter((f) => f !== facility) : [...prev, facility]
    );
  };

  // Dynamic Matching Engine
  const matchResults = useMemo(() => {
    return venues
      .map((venue) => {
        // Base DB check for schedule exclusion
        const baseDbMatch = selectedEvent
          ? fnMatchVenueToEvent(selectedEvent.id, venue.id)
          : {
              venue_id: venue.id,
              venue_name: venue.name,
              overall_score: 100,
              is_compatible: true,
              capacity_status: { required: targetAttendance, actual: venue.capacity, satisfied: true },
              facilities_status: { required: requiredFacilities, matched: venue.facilities, missing: [], satisfied: true },
              power_status: { required: powerKwNeeded, actual: venue.power_kw_capacity, satisfied: true },
              schedule_status: { available: true },
            };

        // 1. Capacity Score (35%)
        const capacityRatio = venue.capacity / targetAttendance;
        let capacityScore = 100;
        if (capacityRatio < 1) {
          capacityScore = Math.max(20, Math.round(capacityRatio * 80));
        }

        // 2. Budget Score (20%)
        let budgetScore = 100;
        if (venue.hourly_rate > maxBudgetPerHour) {
          const overage = venue.hourly_rate - maxBudgetPerHour;
          budgetScore = Math.max(10, 100 - Math.round((overage / maxBudgetPerHour) * 100));
        }

        // 3. Power Score (15%)
        const powerScore = venue.power_kw_capacity >= powerKwNeeded ? 100 : 50;

        // 4. Facilities Checklist (30%)
        const matchedFacilities = requiredFacilities.filter((f) =>
          venue.facilities.some((vf) => vf.toLowerCase().includes(f.toLowerCase().slice(0, 8)))
        );
        const missingFacilities = requiredFacilities.filter((f) => !matchedFacilities.includes(f));
        const facilitiesScore =
          requiredFacilities.length > 0
            ? Math.round((matchedFacilities.length / requiredFacilities.length) * 100)
            : 100;

        // Overall Weighted Match %
        const overallScore = Math.min(
          100,
          Math.round(
            capacityScore * 0.35 +
            facilitiesScore * 0.35 +
            budgetScore * 0.15 +
            powerScore * 0.15
          )
        );

        // City filter check
        const matchesCity = selectedCity === 'All' || venue.city.toLowerCase() === selectedCity.toLowerCase();

        return {
          venue,
          overallScore,
          capacityScore,
          budgetScore,
          facilitiesScore,
          matchedFacilities,
          missingFacilities,
          scheduleStatus: baseDbMatch.schedule_status,
          matchesCity,
        };
      })
      .filter((m) => m.matchesCity)
      .sort((a, b) => b.overallScore - a.overallScore);
  }, [venues, targetAttendance, maxBudgetPerHour, powerKwNeeded, requiredFacilities, selectedCity, selectedEvent, fnMatchVenueToEvent]);

  const activeVenueMatch = matchResults.find((m) => m.venue.id === selectedVenueId) || matchResults[0];

  const handleBook = async (venue: Venue) => {
    if (!selectedEvent) {
      setBookingFeedback({
        success: false,
        message: 'Please create or select an event first before booking a venue.',
      });
      setTimeout(() => setBookingFeedback(null), 4500);
      return;
    }
    const res = await bookVenue(
      venue.id,
      selectedEvent.id,
      selectedEvent.start_date,
      selectedEvent.end_date,
      selectedHallId || undefined
    );
    setBookingFeedback(res);
    setTimeout(() => setBookingFeedback(null), 4500);
  };

  const cities = ['All', 'Tagbilaran City', 'Dauis', 'Panglao'];

  return (
    <div className="bg-white dark:bg-[#171E2B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6 transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#3E6CB5] dark:text-[#7EA6E0]" />
            Student & Organization Venue Matcher
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#EBF3FC] text-[#244A85] dark:bg-[#1E293B] dark:text-[#8BB0E8] border border-[#C8DCF7] dark:border-[#2D4160] font-mono">
              fn_match_venue_to_event()
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Customize requirements (attendees, budget, equipment, facilities) and evaluate real-time compatibility.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs bg-[#F8FAFD] dark:bg-[#111722] px-3.5 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400">
            Target: <strong>{targetAttendance.toLocaleString()}</strong> attendees • Max <strong>₱{maxBudgetPerHour}/hr</strong>
          </div>
          <button
            onClick={() => setIsCreateVenueOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Facility / Court
          </button>
        </div>
      </div>

      {bookingFeedback && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 border transition-all animate-in fade-in ${
            bookingFeedback.success
              ? 'bg-[#EDF7F2] dark:bg-[#17271F] border-[#BDE3CF] dark:border-[#234232] text-[#2B6149] dark:text-[#81B89B]'
              : 'bg-[#FDF1EF] dark:bg-[#2E1A17] border-[#F5C2BC] dark:border-[#52251F] text-[#C45547] dark:text-[#E07D70]'
          }`}
        >
          {bookingFeedback.success ? (
            <CheckCircle2 className="w-4 h-4 text-[#4E8268] dark:text-[#81B89B] shrink-0" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-[#C45547] dark:text-[#E07D70] shrink-0" />
          )}
          <span>{bookingFeedback.message}</span>
        </div>
      )}

      {/* Interactive Requirements Configurator (Slider + Checkbox Matrix) */}
      <div className="bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-[#3E6CB5] dark:text-[#7EA6E0]" />
            Event Needs & Specification Controls
          </span>
          <span className="text-[11px] text-slate-400">Drag to recalculate compatibility</span>
        </div>

        {/* 3 Main Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* 1. Expected Attendance */}
          <div className="space-y-1.5 bg-white dark:bg-[#171E2B] p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500 font-semibold flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-[#3E6CB5]" /> Attendees:
              </span>
              <span className="font-bold text-slate-900 dark:text-slate-100">{targetAttendance.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min={50}
              max={2500}
              step={25}
              value={targetAttendance}
              onChange={(e) => setTargetAttendance(Number(e.target.value))}
              className="w-full accent-[#3E6CB5] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>50 (Workshop)</span>
              <span>2.5k (Summit)</span>
            </div>
          </div>

          {/* 2. Max Hourly Budget */}
          <div className="space-y-1.5 bg-white dark:bg-[#171E2B] p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500 font-semibold flex items-center gap-1">
                <span className="font-bold text-xs text-[#4E8268]">₱</span> Max Budget:
              </span>
              <span className="font-bold text-slate-900 dark:text-slate-100">₱{maxBudgetPerHour.toLocaleString()}/hr</span>
            </div>
            <input
              type="range"
              min={500}
              max={6000}
              step={100}
              value={maxBudgetPerHour}
              onChange={(e) => setMaxBudgetPerHour(Number(e.target.value))}
              className="w-full accent-[#3E6CB5] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>₱500/hr (Civic)</span>
              <span>₱6,000/hr (Grand Ballroom)</span>
            </div>
          </div>

          {/* 3. Power Grid KW */}
          <div className="space-y-1.5 bg-white dark:bg-[#171E2B] p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500 font-semibold flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-[#E07D70]" /> Power Grid:
              </span>
              <span className="font-bold text-slate-900 dark:text-slate-100">{powerKwNeeded} kW</span>
            </div>
            <input
              type="range"
              min={20}
              max={150}
              step={10}
              value={powerKwNeeded}
              onChange={(e) => setPowerKwNeeded(Number(e.target.value))}
              className="w-full accent-[#3E6CB5] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>20 kW (Acoustic)</span>
              <span>150 kW (Rig)</span>
            </div>
          </div>

          {/* 4. Location Filter */}
          <div className="space-y-1.5 bg-white dark:bg-[#171E2B] p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
            <span className="text-slate-500 font-semibold text-xs flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#3E6CB5]" /> Location Area:
            </span>
            <div className="flex flex-wrap gap-1">
              {cities.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCity(c)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer ${
                    selectedCity === c
                      ? 'bg-[#3E6CB5] text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Facility Checklist Toggles */}
        <div className="space-y-2 pt-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Must-Have Facilities & Technical Amenities ({requiredFacilities.length} selected):
          </span>
          <div className="flex flex-wrap gap-2">
            {availableFacilityOptions.map((facility) => {
              const isChecked = requiredFacilities.includes(facility);
              return (
                <button
                  key={facility}
                  onClick={() => toggleFacility(facility)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                    isChecked
                      ? 'bg-[#EBF3FC] text-[#244A85] border-[#C8DCF7] dark:bg-[#1E293B] dark:text-[#8BB0E8] dark:border-[#2D4160] shadow-xs'
                      : 'bg-white dark:bg-[#171E2B] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-[9px] ${
                      isChecked
                        ? 'bg-[#3E6CB5] border-[#3E6CB5] text-white'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span>{facility}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Venue Match List (5 cols) */}
        <div className="lg:col-span-5 space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Matched Venues ({matchResults.length})
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Ranked by Compatibility</span>
          </div>

          <div className="space-y-2">
            {matchResults.map(({ venue, overallScore, scheduleStatus }) => {
              const isSelected = venue.id === (activeVenueMatch?.venue.id || selectedVenueId);
              const isHigh = overallScore >= 75;

              return (
                <div
                  key={venue.id}
                  onClick={() => {
                    setSelectedVenueId(venue.id);
                    setSelectedHallId(null);
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#EBF3FC] dark:bg-[#1E293B] border-[#3E6CB5] dark:border-[#7EA6E0] shadow-xs'
                      : 'bg-white dark:bg-[#171E2B] border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {venue.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {venue.city} • Capacity: {venue.capacity.toLocaleString()}
                      </p>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md inline-block ${
                          isHigh
                            ? 'bg-[#EDF7F2] text-[#2B6149] dark:bg-[#17271F] dark:text-[#81B89B]'
                            : 'bg-[#FEF8EC] text-[#8C6212] dark:bg-[#2B2314] dark:text-[#E8BD68]'
                        }`}
                      >
                        {overallScore}% Match
                      </span>
                      <p className="text-[11px] font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                        ₱{venue.hourly_rate.toLocaleString()}/hr
                      </p>
                    </div>
                  </div>

                  {/* Micro Indicators */}
                  <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px]">
                    <span className={venue.capacity >= targetAttendance ? 'text-[#2B6149] dark:text-[#81B89B]' : 'text-[#C45547]'}>
                      {venue.capacity >= targetAttendance ? '✓ Fits Attendees' : '✗ Under Capacity'}
                    </span>
                    <span className={venue.hourly_rate <= maxBudgetPerHour ? 'text-[#2B6149] dark:text-[#81B89B]' : 'text-[#C45547]'}>
                      {venue.hourly_rate <= maxBudgetPerHour ? '✓ In Budget' : '✗ Over Budget'}
                    </span>
                    <span className={scheduleStatus.available ? 'text-[#2B6149] dark:text-[#81B89B]' : 'text-[#C45547]'}>
                      {scheduleStatus.available ? '✓ Slot Free' : '✗ Booked'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Deep Inspection Panel (7 cols) */}
        {activeVenueMatch && (
          <div className="lg:col-span-7 bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 space-y-6">
            {(() => {
              const selectedHall = activeVenueMatch.venue.halls?.find((h) => h.id === selectedHallId);
              const displayCapacity = selectedHall ? selectedHall.capacity : activeVenueMatch.venue.capacity;
              const displayRate = selectedHall ? selectedHall.hourly_rate : activeVenueMatch.venue.hourly_rate;

              return (
                <>
                  {/* Banner Header with Photo & Key Specs */}
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#3E6CB5] dark:text-[#7EA6E0]">
                        {activeVenueMatch.overallScore}% Overall Compatibility
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5 flex items-center gap-2">
                        {activeVenueMatch.venue.name}
                        {selectedHall && (
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#EBF3FC] dark:bg-[#1E293B] text-[#244A85] dark:text-[#8BB0E8] border border-[#C8DCF7] dark:border-[#2D4160]">
                            {selectedHall.name}
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {activeVenueMatch.venue.address}, {activeVenueMatch.venue.city}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
                        ₱{displayRate.toLocaleString()}/hr
                      </span>
                      <p className="text-[10px] text-slate-400 font-mono">
                        Hours: {activeVenueMatch.venue.operating_hours.open} - {activeVenueMatch.venue.operating_hours.close}
                      </p>
                    </div>
                  </div>

                  {/* Criteria Comparison Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-white dark:bg-[#171E2B] p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs space-y-1">
                      <span className="text-slate-500">{selectedHall ? `${selectedHall.name} Fit` : 'Venue Attendee Fit'}</span>
                      <p className="font-bold text-slate-900 dark:text-slate-100">
                        {displayCapacity.toLocaleString()} / {targetAttendance.toLocaleString()}
                      </p>
                      <span className={displayCapacity >= targetAttendance ? 'text-[10px] text-[#2B6149] dark:text-[#81B89B] font-semibold' : 'text-[10px] text-[#C45547] font-semibold'}>
                        {displayCapacity >= targetAttendance ? '✓ Capacity Satisfied' : '✗ Capacity Shortfall'}
                      </span>
                    </div>

                    <div className="bg-white dark:bg-[#171E2B] p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs space-y-1">
                      <span className="text-slate-500">Power Grid</span>
                      <p className="font-bold text-slate-900 dark:text-slate-100">
                        {activeVenueMatch.venue.power_kw_capacity} kW (need {powerKwNeeded} kW)
                      </p>
                      <span className={activeVenueMatch.venue.power_kw_capacity >= powerKwNeeded ? 'text-[10px] text-[#2B6149] dark:text-[#81B89B] font-semibold' : 'text-[10px] text-[#C45547] font-semibold'}>
                        {activeVenueMatch.venue.power_kw_capacity >= powerKwNeeded ? '✓ Power Sufficient' : '✗ Substation Too Small'}
                      </span>
                    </div>

                    <div className="bg-white dark:bg-[#171E2B] p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs space-y-1">
                      <span className="text-slate-500">EXCLUDE Constraint</span>
                      <p className="font-bold text-slate-900 dark:text-slate-100">
                        {activeVenueMatch.scheduleStatus.available ? 'No Conflict' : 'Clash Blocked'}
                      </p>
                      <span className={activeVenueMatch.scheduleStatus.available ? 'text-[10px] text-[#2B6149] dark:text-[#81B89B] font-semibold' : 'text-[10px] text-[#C45547] font-semibold'}>
                        {activeVenueMatch.scheduleStatus.available ? '✓ Slot Free' : '✗ Overlap Blocked'}
                      </span>
                    </div>
                  </div>

                  {/* Multi-Hall & Function Spaces Breakdown */}
                  {activeVenueMatch.venue.halls && activeVenueMatch.venue.halls.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <span>Halls & Function Spaces</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 font-mono text-slate-700 dark:text-slate-300">
                            {activeVenueMatch.venue.halls.length} Available
                          </span>
                        </h4>
                        {selectedHallId && (
                          <button
                            onClick={() => setSelectedHallId(null)}
                            className="text-[11px] font-semibold text-[#3E6CB5] dark:text-[#7EA6E0] hover:underline cursor-pointer"
                          >
                            Reset to Entire Facility
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {activeVenueMatch.venue.halls.map((hall) => {
                          const isHallActive = selectedHallId === hall.id;
                          return (
                            <div
                              key={hall.id}
                              onClick={() => setSelectedHallId(isHallActive ? null : hall.id)}
                              className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                                isHallActive
                                  ? 'bg-[#EBF3FC] dark:bg-[#1E293B] border-[#3E6CB5] dark:border-[#7EA6E0] ring-1 ring-[#3E6CB5]/30'
                                  : 'bg-white dark:bg-[#171E2B] border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-1.5 mb-1">
                                <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                  {isHallActive && <CheckCircle2 className="w-3.5 h-3.5 text-[#3E6CB5] dark:text-[#7EA6E0] shrink-0" />}
                                  {hall.name}
                                </span>
                                <span className="text-[10px] font-bold text-[#3E6CB5] dark:text-[#7EA6E0] shrink-0 font-mono">
                                  ₱{hall.hourly_rate.toLocaleString()}/hr
                                </span>
                              </div>
                              {hall.description && (
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-2">
                                  {hall.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono pt-1.5 border-t border-slate-100 dark:border-slate-800/80">
                                <span>Cap: {hall.capacity.toLocaleString()}</span>
                                {hall.dimensions && <span>• {hall.dimensions}</span>}
                                <span>• {hall.is_indoor ? 'Indoor' : 'Outdoor'}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Checklist Comparison */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>Facilities Checklist Status</span>
                      <span className="text-[10px] text-[#3E6CB5] dark:text-[#7EA6E0] font-normal">
                        {activeVenueMatch.matchedFacilities.length} of {requiredFacilities.length} matched
                      </span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {activeVenueMatch.matchedFacilities.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-[#EDF7F2] dark:bg-[#17271F] text-[#2B6149] dark:text-[#81B89B] border border-[#BDE3CF]/40">
                          <Check className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{f}</span>
                        </div>
                      ))}
                      {activeVenueMatch.missingFacilities.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-[#FDF1EF] dark:bg-[#2E1A17] text-[#C45547] dark:text-[#E07D70] border border-[#F5C2BC]/40">
                          <X className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">Missing: {f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Estimated 8-Hour Budget Quote */}
                  <div className="bg-white dark:bg-[#171E2B] p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400 font-semibold block">
                        Estimated 8-Hour {selectedHall ? selectedHall.name : 'Venue'} Rental:
                      </span>
                      <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                        ₱{(displayRate * 8).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 text-[11px] block">Your 8h Target Budget:</span>
                      <span className={`text-xs font-bold ${displayRate <= maxBudgetPerHour ? 'text-[#2B6149] dark:text-[#81B89B]' : 'text-[#C45547]'}`}>
                        ₱{(maxBudgetPerHour * 8).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      {isDemoMode ? 'Sample booking check' : 'Protected by PostgreSQL booking constraints'}
                    </span>
                    <button
                      onClick={() => handleBook(activeVenueMatch.venue)}
                      disabled={!activeVenueMatch.scheduleStatus.available}
                      className={`py-2.5 px-5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                        activeVenueMatch.scheduleStatus.available
                          ? 'bg-[#3E6CB5] hover:bg-[#325896] text-white'
                          : 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <CalendarCheck className="w-4 h-4" />
                      Confirm Booking {selectedHall ? `for ${selectedHall.name}` : 'for Entire Venue'}
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>

      <CreateVenueModal
        isOpen={isCreateVenueOpen}
        onClose={() => setIsCreateVenueOpen(false)}
        onVenueCreated={(newV) => {
          setSelectedVenueId(newV.id);
        }}
      />
    </div>
  );
};
