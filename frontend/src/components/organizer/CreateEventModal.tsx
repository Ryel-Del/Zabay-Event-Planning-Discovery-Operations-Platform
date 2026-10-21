import React, { useEffect, useState } from 'react';
import {
  X,
  Calendar,
  Zap,
  Sparkles,
  CheckCircle,
  Globe,
  Lock,
  ArrowRight,
  ArrowLeft,
  Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { EventCategory, ZabayEvent } from '../../types';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (newEvent: ZabayEvent) => void;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({ isOpen, onClose, onCreated }) => {
  const { venues, personnel, createEvent, bookVenue, broadcastEventChange, loadDemoData, isDemoMode, isLiveBackend } = useApp();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Basics
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<EventCategory>('Sports & Athletics');
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [expectedAttendance, setExpectedAttendance] = useState(250);

  // Step 2: Venue & Hall
  const [venueId, setVenueId] = useState<string>(venues[0]?.id || '');
  const [hallId, setHallId] = useState<string>('');
  const [startDate, setStartDate] = useState('2026-11-20');
  const [endDate, setEndDate] = useState('2026-11-20');
  const [powerKw, setPowerKw] = useState(30);

  // Step 3: Staff Delegation
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>(['per-1', 'per-2']);

  // Step 4: Ticketing & Launch
  const [ticketPrice, setTicketPrice] = useState(50);
  const [maxCapacity, setMaxCapacity] = useState(500);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [persistedEvent, setPersistedEvent] = useState<ZabayEvent | null>(null);

  useEffect(() => {
    if (!venues.some((venue) => venue.id === venueId)) {
      setVenueId(venues[0]?.id || '');
      setHallId('');
    }
  }, [venues, venueId]);

  if (!isOpen) return null;

  const selectedVenue = venues.find((v) => v.id === venueId);
  const selectedHall = selectedVenue?.halls?.find((h) => h.id === hallId);

  const getBannerForCategory = (cat: EventCategory) => {
    switch (cat) {
      case 'Sports & Athletics':
        return 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&auto=format&fit=crop&q=80';
      case 'Festivals & Cultural':
        return 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&auto=format&fit=crop&q=80';
      case 'Workshops & Bootcamps':
        return 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&auto=format&fit=crop&q=80';
      case 'Conferences & Seminars':
        return 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1200&auto=format&fit=crop&q=80';
      case 'School & Youth':
        return 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=1200&auto=format&fit=crop&q=80';
      case 'Music & Concert':
        return 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80';
      case 'Community & Civic':
        return 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&auto=format&fit=crop&q=80';
      default:
        return 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80';
    }
  };

  const handleNext = () => {
    if (currentStep === 1 && !title.trim()) return;
    if (currentStep < 4) {
      setCurrentStep((prev) => (prev + 1) as any);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as any);
    }
  };

  const toggleStaff = (id: string) => {
    setSelectedStaffIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (saving) return;
    setSaving(true);
    setSubmitError('');
    try {
    const newEvent = persistedEvent || await createEvent({
      title: title.trim(),
      description: description.trim() || 'Custom Bohol event workspace.',
      category,
      event_type: isPrivate ? 'private' : 'public',
      is_private: isPrivate,
      start_date: `${startDate}T08:00:00Z`,
      end_date: `${endDate}T17:00:00Z`,
      expected_attendance: Number(expectedAttendance) || 100,
      max_capacity: Number(maxCapacity) || 200,
      ticket_price: Number(ticketPrice) || 0,
      status: 'planning',
      banner_url: getBannerForCategory(category),
      requirements: {
        min_capacity: Number(expectedAttendance) || 100,
        power_kw_needed: Number(powerKw) || 25,
        requires_indoor: true,
        required_facilities: selectedVenue ? selectedVenue.facilities.slice(0, 3) : ['Dedicated Gigabit Fiber WiFi'],
        min_setup_hours: 3,
      },
    });
    setPersistedEvent(newEvent);

    // Auto-reserve venue slot if chosen
    if (venueId) {
      const booking = await bookVenue(
        venueId,
        newEvent.id,
        newEvent.start_date,
        newEvent.end_date,
        hallId || undefined,
        newEvent.title
      );
      if (!booking.success) {
        setSubmitError(`Event saved in planning as ${newEvent.id}. Booking failed: ${booking.message} Retry to book this event without creating another.`);
        return;
      }
    }

    // Broadcast launch alert
    broadcastEventChange({
      eventId: newEvent.id,
      eventTitle: newEvent.title,
      summary: isDemoMode
        ? `Sample event created: "${newEvent.title}"${venueId ? ' with a sample venue reservation' : ''}.`
        : `Event saved in planning: "${newEvent.title}"${venueId ? `; venue booking confirmed at ${selectedVenue?.name}` : '; no venue booked'}.`,
    });

    if (onCreated) onCreated(newEvent);
    onClose();
    setPersistedEvent(null);
    setTitle('');
    setDescription('');
    setCurrentStep(1);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Event could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    { num: 1, label: 'Basics' },
    { num: 2, label: 'Venue & Hall' },
    { num: 3, label: 'Staffing' },
    { num: 4, label: 'Tickets' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-[#171E2B] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header & Stepper */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#EBF3FC] dark:bg-[#1E293B] text-[#3E6CB5] dark:text-[#7EA6E0] flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Guided Event Launch Wizard
                </h3>
                <p className="text-[11px] text-slate-500">
                  Step {currentStep} of 4: {steps[currentStep - 1].label}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Stepper Progress Bar */}
          <div className="flex items-center justify-between gap-2 pt-1">
            {steps.map((s) => (
              <div key={s.num} className="flex-1 flex items-center gap-2">
                <div
                  className={`h-1.5 flex-1 rounded-full transition-all ${
                    s.num <= currentStep
                      ? 'bg-[#3E6CB5] dark:bg-[#7EA6E0]'
                      : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                />
                <span
                  className={`text-[10px] font-bold ${
                    s.num === currentStep
                      ? 'text-[#3E6CB5] dark:text-[#7EA6E0]'
                      : s.num < currentStep
                      ? 'text-slate-700 dark:text-slate-300'
                      : 'text-slate-400'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Wizard Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
          {/* STEP 1: BASICS */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Quick Demo Seed */}
              <div className="p-3 bg-[#EBF3FC] dark:bg-[#152030] border border-[#C8DCF7] dark:border-[#2D4160] rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#3E6CB5] dark:text-[#7EA6E0] shrink-0" />
                  <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                    Want to test with full Bohol sample data instead?
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    loadDemoData();
                    onClose();
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold bg-[#3E6CB5] text-white rounded-lg hover:bg-[#325896] transition-colors shrink-0 cursor-pointer"
                >
                  Load Sample
                </button>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Event Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bohol Tech Summit or Sandugo Cultural Expo"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#3E6CB5]"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as EventCategory)}
                  className="w-full bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#3E6CB5]"
                >
                  <option value="Sports & Athletics">Sports & Athletics</option>
                  <option value="Festivals & Cultural">Festivals & Cultural</option>
                  <option value="Workshops & Bootcamps">Workshops & Bootcamps</option>
                  <option value="Conferences & Seminars">Conferences & Seminars</option>
                  <option value="Music & Concert">Music & Concert</option>
                  <option value="Tech & Innovation">Tech & Innovation</option>
                  <option value="School & Youth">School & Youth</option>
                  <option value="Community & Civic">Community & Civic</option>
                </select>
              </div>

              {/* Public vs Private */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Visibility
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsPrivate(false)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      !isPrivate
                        ? 'border-[#3E6CB5] bg-[#EBF3FC] dark:bg-[#152338]'
                        : 'border-slate-200 dark:border-slate-800 bg-[#F8FAFD] dark:bg-[#111722]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 font-bold text-xs">
                      <Globe className="w-3.5 h-3.5 text-[#3E6CB5]" />
                      <span>Public Event</span>
                    </div>
                    <p className="text-[10px] text-slate-500">Listed on Public Explore Feed</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPrivate(true)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isPrivate
                        ? 'border-[#B87A44] bg-[#FEF8F2] dark:bg-[#281D14]'
                        : 'border-slate-200 dark:border-slate-800 bg-[#F8FAFD] dark:bg-[#111722]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 font-bold text-xs">
                      <Lock className="w-3.5 h-3.5 text-[#B87A44]" />
                      <span>Private / Invite</span>
                    </div>
                    <p className="text-[10px] text-slate-500">Direct registration link only</p>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Expected Attendance
                </label>
                <input
                  type="number"
                  min={10}
                  value={expectedAttendance}
                  onChange={(e) => setExpectedAttendance(Number(e.target.value))}
                  className="w-full bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#3E6CB5]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Brief Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Summary of event objectives and schedule..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none resize-none text-xs"
                />
              </div>
            </div>
          )}

          {/* STEP 2: VENUE & HALL SELECTION */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Bohol Venue
                </label>
                <select
                  value={venueId}
                  onChange={(e) => {
                    setVenueId(e.target.value);
                    setHallId('');
                  }}
                  className="w-full bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#3E6CB5]"
                >
                  {venues.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.city}) — Cap: {v.capacity.toLocaleString()} • ₱{v.hourly_rate.toLocaleString()}/hr
                    </option>
                  ))}
                </select>
              </div>

              {/* Sub-Venue / Hall Picker */}
              {selectedVenue?.halls && selectedVenue.halls.length > 0 && (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 space-y-2">
                  <label className="block font-bold text-slate-800 dark:text-slate-200 text-xs">
                    Select Specific Hall / Ballroom
                  </label>
                  <select
                    value={hallId}
                    onChange={(e) => setHallId(e.target.value)}
                    className="w-full bg-white dark:bg-[#171E2B] border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                  >
                    <option value="">Entire Facility</option>
                    {selectedVenue.halls.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} (Cap: {h.capacity.toLocaleString()} • ₱{h.hourly_rate.toLocaleString()}/hr)
                      </option>
                    ))}
                  </select>
                  {selectedHall && (
                    <p className="text-[11px] text-slate-500 italic">
                      {selectedHall.description || `${selectedHall.name} configured for breakout and main stages.`}
                    </p>
                  )}
                </div>
              )}

              {/* Multi-Day Event Date Range Selector */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#3E6CB5]" />
                    <span>Event Schedule & Multi-Day Span</span>
                  </label>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono ${
                      Math.max(
                        1,
                        Math.round(
                          (new Date(endDate).getTime() - new Date(startDate).getTime()) /
                            (1000 * 60 * 60 * 24)
                        ) + 1
                      ) > 1
                        ? 'bg-[#EBF3FC] text-[#244A85] dark:bg-[#1E293B] dark:text-[#8BB0E8] border border-[#C8DCF7] dark:border-[#2D4160]'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {Math.max(
                      1,
                      Math.round(
                        (new Date(endDate).getTime() - new Date(startDate).getTime()) /
                          (1000 * 60 * 60 * 24)
                      ) + 1
                    ) === 1
                      ? '1-Day Intensive'
                      : `${Math.max(
                          1,
                          Math.round(
                            (new Date(endDate).getTime() - new Date(startDate).getTime()) /
                              (1000 * 60 * 60 * 24)
                          ) + 1
                        )}-Day Multi-Day Block`}
                  </span>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 font-semibold">Presets:</span>
                  {[
                    { label: '1 Day', days: 1 },
                    { label: '2 Days (Weekend)', days: 2 },
                    { label: '3 Days (Summit)', days: 3 },
                    { label: '5 Days (Festival)', days: 5 },
                  ].map((p) => {
                    const currentDays = Math.max(
                      1,
                      Math.round(
                        (new Date(endDate).getTime() - new Date(startDate).getTime()) /
                          (1000 * 60 * 60 * 24)
                      ) + 1
                    );
                    return (
                      <button
                        key={p.days}
                        type="button"
                        onClick={() => {
                          const start = new Date(startDate || '2026-11-20');
                          const end = new Date(start);
                          end.setDate(start.getDate() + (p.days - 1));
                          setEndDate(end.toISOString().split('T')[0]);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          currentDays === p.days
                            ? 'bg-[#3E6CB5] text-white shadow-xs'
                            : 'bg-white dark:bg-[#171E2B] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        if (new Date(e.target.value) > new Date(endDate)) {
                          setEndDate(e.target.value);
                        }
                      }}
                      className="w-full bg-white dark:bg-[#171E2B] border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-slate-100 font-mono text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      min={startDate}
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-white dark:bg-[#171E2B] border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-slate-100 font-mono text-xs focus:outline-none"
                    />
                  </div>
                </div>

                {Math.max(
                  1,
                  Math.round(
                    (new Date(endDate).getTime() - new Date(startDate).getTime()) /
                      (1000 * 60 * 60 * 24)
                  ) + 1
                ) > 1 && (
                  <p className="text-[10px] text-[#244A85] dark:text-[#8BB0E8] bg-[#EBF3FC]/60 dark:bg-[#1E293B]/40 p-2 rounded-lg">
                    ✨ {isDemoMode ? 'Sample mode will mark a local reservation' : 'PostgreSQL will reserve a continuous time window'} on{' '}
                    {selectedHall ? selectedHall.name : selectedVenue?.name}.
                  </p>
                )}
              </div>

              {/* Power kw */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Required Power (kW)
                </label>
                <div className="relative">
                  <Zap className="w-3.5 h-3.5 text-amber-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min={5}
                    value={powerKw}
                    onChange={(e) => setPowerKw(Number(e.target.value))}
                    className="w-full bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: STAFF DELEGATION */}
          {currentStep === 3 && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <p className="text-[11px] text-slate-500">
                Select personnel to auto-assign key operational responsibilities (Gate Check-In, Stage Lead, Technical Director):
              </p>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {personnel.map((person) => {
                  const isAssigned = selectedStaffIds.includes(person.id);
                  return (
                    <div
                      key={person.id}
                      onClick={() => toggleStaff(person.id)}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                        isAssigned
                          ? 'bg-[#EBF3FC] dark:bg-[#152338] border-[#3E6CB5]'
                          : 'bg-[#F8FAFD] dark:bg-[#111722] border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center text-xs ${
                            isAssigned
                              ? 'bg-[#3E6CB5] text-white'
                              : 'border border-slate-300 dark:border-slate-700'
                          }`}
                        >
                          {isAssigned && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-100">{person.name}</p>
                          <p className="text-[10px] text-slate-500">{person.role} • ₱{person.hourly_rate.toLocaleString()}/hr</p>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                        {(person.role || 'crew').toUpperCase()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: TICKETING & LAUNCH REVIEW */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ticket Price (₱)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={ticketPrice}
                    onChange={(e) => setTicketPrice(Number(e.target.value))}
                    className="w-full bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-mono focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">0 for Free admission</span>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Max Ticket Capacity
                  </label>
                  <input
                    type="number"
                    min={10}
                    value={maxCapacity}
                    onChange={(e) => setMaxCapacity(Number(e.target.value))}
                    className="w-full bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-mono focus:outline-none"
                  />
                </div>
              </div>

              {/* Review Card */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Event Launch Summary
                </span>
                <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800">
                  <span className="text-slate-500">Event Title:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{title}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800">
                  <span className="text-slate-500">Venue:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedVenue?.name} {selectedHall ? `(${selectedHall.name})` : ''}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800">
                  <span className="text-slate-500">Assigned Crew:</span>
                  <span className="font-semibold text-[#3E6CB5]">{selectedStaffIds.length} crew members</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Projected Revenue:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    ₱{(ticketPrice * expectedAttendance).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {submitError && <div role="alert" className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-rose-800 dark:bg-rose-950/30 dark:text-rose-200">{submitError}</div>}
          {!isDemoMode && !isLiveBackend && <div role="status" className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">PostgreSQL is unavailable. Event saving requires a database connection. Sample Data mode is available for a local demo.</div>}
          {/* Footer Navigation Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-400 hover:text-slate-600 font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={saving || (currentStep === 1 && !title.trim())}
                className="px-5 py-2 bg-[#3E6CB5] hover:bg-[#325896] disabled:opacity-50 text-white rounded-xl font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={saving || (!isDemoMode && !isLiveBackend)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{saving ? 'Saving…' : persistedEvent ? 'Retry Venue Booking' : isDemoMode ? 'Create Sample Event' : 'Save Event & Book Venue'}</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
