import React, { useState } from 'react';
import {
  X,
  Calendar,
  Building2,
  Users,
  Zap,
  Tag,
  Sparkles,
  CheckCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { EventCategory, ZabayEvent } from '../../types';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (newEvent: ZabayEvent) => void;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({ isOpen, onClose, onCreated }) => {
  const { venues, createEvent, loadDemoData } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<EventCategory>('Tech & AI');
  const [venueId, setVenueId] = useState<string>('');
  const [startDate, setStartDate] = useState('2026-11-20');
  const [endDate, setEndDate] = useState('2026-11-20');
  const [expectedAttendance, setExpectedAttendance] = useState(250);
  const [maxCapacity, setMaxCapacity] = useState(500);
  const [ticketPrice, setTicketPrice] = useState(150);
  const [powerKw, setPowerKw] = useState(30);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const selectedVenue = venues.find((v) => v.id === venueId);

    const newEvent = createEvent({
      title: title.trim(),
      description: description.trim() || 'Custom Bohol event workspace.',
      category,
      venue_id: venueId || undefined,
      start_date: `${startDate}T08:00:00Z`,
      end_date: `${endDate}T17:00:00Z`,
      expected_attendance: Number(expectedAttendance) || 100,
      max_capacity: Number(maxCapacity) || 200,
      ticket_price: Number(ticketPrice) || 0,
      status: 'planning',
      banner_url:
        category === 'Gaming & Esports'
          ? 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop&q=80'
          : category === 'Music & Festival'
          ? 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80'
          : category === 'Business & Summit'
          ? 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1200&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
      requirements: {
        min_capacity: Number(expectedAttendance) || 100,
        power_kw_needed: Number(powerKw) || 25,
        requires_indoor: true,
        required_facilities: selectedVenue ? selectedVenue.facilities.slice(0, 3) : ['Dedicated Gigabit Fiber WiFi'],
        min_setup_hours: 3,
      },
    });

    if (onCreated) onCreated(newEvent);
    onClose();
  };

  const handleQuickSeed = () => {
    loadDemoData();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-[#171E2B] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#EBF3FC] dark:bg-[#1E293B] text-[#3E6CB5] dark:text-[#7EA6E0] flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Create New Event
              </h3>
              <p className="text-[11px] text-slate-500">
                Define core requirements, target dates, and ticketing
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Quick Demo Seed Option */}
          <div className="p-3 bg-[#EBF3FC] dark:bg-[#152030] border border-[#C8DCF7] dark:border-[#2D4160] rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#3E6CB5] dark:text-[#7EA6E0] shrink-0" />
              <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                Want to test with full Bohol sample data instead?
              </span>
            </div>
            <button
              type="button"
              onClick={handleQuickSeed}
              className="px-2.5 py-1 text-[11px] font-bold bg-[#3E6CB5] text-white rounded-lg hover:bg-[#325896] transition-colors shrink-0 cursor-pointer"
            >
              Load Sample Data
            </button>
          </div>

          {/* Title */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Event Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Bohol Youth Leadership Summit 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#3E6CB5]"
            />
          </div>

          {/* Category & Venue */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <div className="relative">
                <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as EventCategory)}
                  className="w-full bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#3E6CB5]"
                >
                  <option value="Tech & AI">Tech & AI</option>
                  <option value="Business & Summit">Business & Summit</option>
                  <option value="Gaming & Esports">Gaming & Esports</option>
                  <option value="Music & Festival">Music & Festival</option>
                  <option value="Design & Arts">Design & Arts</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Venue
              </label>
              <div className="relative">
                <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={venueId}
                  onChange={(e) => setVenueId(e.target.value)}
                  className="w-full bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#3E6CB5]"
                >
                  <option value="">Decide Later / Unassigned</option>
                  {venues.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.capacity} pax)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#3E6CB5]"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#3E6CB5]"
              />
            </div>
          </div>

          {/* Capacities & Pricing */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Expected Guests
              </label>
              <div className="relative">
                <Users className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min={10}
                  value={expectedAttendance}
                  onChange={(e) => setExpectedAttendance(Number(e.target.value))}
                  className="w-full bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-2 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#3E6CB5]"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Max Capacity
              </label>
              <input
                type="number"
                min={10}
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(Number(e.target.value))}
                className="w-full bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#3E6CB5]"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Ticket Price (₱)
              </label>
              <input
                type="number"
                min={0}
                value={ticketPrice}
                onChange={(e) => setTicketPrice(Number(e.target.value))}
                className="w-full bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#3E6CB5]"
              />
            </div>
          </div>

          {/* Power Requirement */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Required Electrical Power (kW)
            </label>
            <div className="relative">
              <Zap className="w-3.5 h-3.5 text-amber-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                min={5}
                max={500}
                value={powerKw}
                onChange={(e) => setPowerKw(Number(e.target.value))}
                className="w-full bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#3E6CB5]"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Used by the venue matcher to verify substation/generator capacity.
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Brief Description
            </label>
            <textarea
              rows={2}
              placeholder="Outline the primary objectives and target audience for this event..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#3E6CB5] resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4.5 py-2 bg-[#3E6CB5] hover:bg-[#325896] text-white rounded-xl font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Create Event & Open Workspace</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
