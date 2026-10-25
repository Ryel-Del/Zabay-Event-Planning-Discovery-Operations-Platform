import React, { useState } from 'react';
import {
  Building2,
  Calendar,
  CalendarDays,
  ShieldCheck,
  Zap,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Layers,
  MapPin,
  Mail,
  Phone,
  ArrowRight,
  Plus,
  GitBranch,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { VenueView } from '../layout/AppSidebar';
import { CreateVenueModal } from './CreateVenueModal';

interface VenueManagerPortalProps {
  currentView?: VenueView;
  onSelectView?: (view: VenueView) => void;
}

export const VenueManagerPortal: React.FC<VenueManagerPortalProps> = ({
  currentView = 'overview',
  onSelectView,
}) => {
  const { venues, venueBookings, bookVenue, selectedEvent, currentUser, currentRole, isDevModeUnlocked, forkVenueLayout } = useApp();
  const [internalView, setInternalView] = useState<VenueView>('overview');
  const activeView = currentView || internalView;

  const handleSelectView = (v: VenueView) => {
    if (onSelectView) onSelectView(v);
    else setInternalView(v);
  };

  const [selectedVenueId, setSelectedVenueId] = useState<string>('');
  const [isCreateVenueOpen, setIsCreateVenueOpen] = useState(false);
  const selectedVenue = venues.find((venue) => venue.id === selectedVenueId) || venues[0];
  const [testStart, setTestStart] = useState('2026-11-13T10:00:00Z');
  const [testEnd, setTestEnd] = useState('2026-11-13T18:00:00Z');
  const [bookingStatus, setBookingStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [forkSuccessToast, setForkSuccessToast] = useState<string | null>(null);
  const [managerOverride, setManagerOverride] = useState(false);

  // Permission boundary: Check if logged-in user is verified venue owner or in venue manager role
  const isVenueOwner =
    isDevModeUnlocked ||
    managerOverride ||
    currentRole === 'venue_manager' ||
    (selectedVenue &&
      !selectedVenue.is_custom_fork &&
      (selectedVenue.manager_id === currentUser.id ||
        (selectedVenue.manager_name &&
          selectedVenue.manager_name.toLowerCase() === currentUser.name.toLowerCase()) ||
        (selectedVenue.contact_email &&
          selectedVenue.contact_email.toLowerCase() === currentUser.email.toLowerCase())));

  const handleForkLayout = () => {
    if (!selectedVenue) return;
    const forked = forkVenueLayout(selectedVenue.id, selectedEvent?.id || 'evt-athletics-2026');
    setSelectedVenueId(forked.id);
    setForkSuccessToast(
      `✨ Facility layout for "${selectedVenue.name}" successfully forked into your custom event workspace! Master facility ownership remains with ${selectedVenue.manager_name || 'verified partner'}.`
    );
    setTimeout(() => setForkSuccessToast(null), 6000);
  };

  const bookingsForVenue = venueBookings.filter((b) => b.venue_id === selectedVenue?.id);
  const [testHallId, setTestHallId] = useState<string>('');

  const handleTestBooking = async () => {
    if (!selectedEvent || !selectedVenue) {
      setBookingStatus({ success: false, message: 'Select a saved event and venue first.' });
      return;
    }
    const res = await bookVenue(
      selectedVenue.id,
      selectedEvent.id,
      testStart,
      testEnd,
      testHallId || undefined
    );
    setBookingStatus(res);
    setTimeout(() => setBookingStatus(null), 4500);
  };

  if (!selectedVenue) {
    return (
      <div className="p-8 text-center bg-white dark:bg-[#1E1C19] rounded-2xl border border-stone-200 dark:border-stone-800 text-stone-500">
        Venues are unavailable. Load Sample Data for the offline demo.
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Fork Layout Success Alert */}
      {forkSuccessToast && (
        <div className="bg-emerald-600 text-white p-4 rounded-2xl flex items-center justify-between gap-3 text-xs shadow-md animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="font-semibold">{forkSuccessToast}</span>
          </div>
          <button
            onClick={() => setForkSuccessToast(null)}
            className="text-white/80 hover:text-white text-xs font-bold px-2 py-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Venue Hub Header */}
      <div className="bg-white dark:bg-[#171E2B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#EDF7F2] dark:bg-[#17271F] border border-[#BDE3CF] dark:border-[#234232] rounded-xl text-[#2B6149] dark:text-[#81B89B]">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {selectedVenue.name}
                </h2>
                {selectedVenue.is_custom_fork ? (
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-bold flex items-center gap-1 font-mono">
                    <GitBranch className="w-3 h-3 text-amber-600" /> Custom Event Fork
                  </span>
                ) : (
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#EDF7F2] text-[#2B6149] dark:bg-[#17271F] dark:text-[#81B89B] border border-[#BDE3CF] dark:border-[#234232] font-bold flex items-center gap-1 font-mono">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified Facility Partner
                  </span>
                )}
                {isVenueOwner ? (
                  <button
                    type="button"
                    onClick={() => setManagerOverride(false)}
                    className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-bold font-mono flex items-center gap-1 hover:opacity-80 cursor-pointer"
                    title="Click to switch to Organizer View for testing"
                  >
                    👑 Master Owner Control
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setManagerOverride(true)}
                    className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-medium font-mono flex items-center gap-1 hover:bg-blue-100 dark:hover:bg-blue-900/40 cursor-pointer"
                    title="Click to test as Verified Facility Owner"
                  >
                    👁️ Organizer View (Click to test as Owner)
                  </button>
                )}
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold font-mono">
                  Collision-Safe
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                <p className="flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{selectedVenue.address}</span>
                </p>
                <span className="hidden sm:inline text-slate-300 dark:text-slate-600">•</span>
                <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  {selectedVenue.is_custom_fork ? (
                    <>
                      Forked for Custom Staging • Original Owner:{' '}
                      <strong className="text-slate-800 dark:text-slate-200 font-semibold">
                        {selectedVenue.manager_name || 'Verified Facility Owner'}
                      </strong>
                    </>
                  ) : (
                    <>
                      Managed by:{' '}
                      <strong className="text-slate-800 dark:text-slate-200 font-semibold">
                        {selectedVenue.manager_name || 'Bohol Provincial Facilities'}
                      </strong>{' '}
                      (Verified Facility Owner)
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Venue Selector & Register Button */}
          <div className="flex items-center gap-2">
            <select
              value={selectedVenue.id}
              onChange={(e) => {
                const v = venues.find((x) => x.id === e.target.value);
                if (v) {
                  setSelectedVenueId(v.id);
                  setTestHallId('');
                }
              }}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3E6CB5] transition-all cursor-pointer"
            >
              {venues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.capacity.toLocaleString()} guests) {v.is_custom_fork ? '• 🍴 Fork' : ''}
                </option>
              ))}
            </select>

            <button
              onClick={() => setIsCreateVenueOpen(true)}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register Facility</span>
            </button>
          </div>
        </div>

        {/* View Switcher Tabs (Synchronized with AppSidebar) */}
        <div className="flex flex-wrap items-center gap-2 pt-4">
          <button
            onClick={() => handleSelectView('overview')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeView === 'overview'
                ? 'bg-[#EBF3FC] text-[#244A85] dark:bg-[#1E293B] dark:text-[#8BB0E8] shadow-xs ring-1 ring-[#C8DCF7] dark:ring-[#2D4160]'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Facility Overview</span>
          </button>

          <button
            onClick={() => handleSelectView('calendar')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeView === 'calendar'
                ? 'bg-[#EEF3ED] text-[#455C42] dark:bg-[#222D21] dark:text-[#A7C2A4] shadow-xs ring-1 ring-[#5F7D5B]/30'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>Bookings & Collision Prevention</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono">
              {bookingsForVenue.length} active
            </span>
          </button>

          <button
            onClick={() => handleSelectView('inventory')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeView === 'inventory'
                ? 'bg-[#FAF0E6] text-[#8C5D39] dark:bg-[#2A231C] dark:text-[#E8BA97] shadow-xs ring-1 ring-[#B68366]/30'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Halls & Equipment Inventory</span>
            {selectedVenue.halls && selectedVenue.halls.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-mono">
                {selectedVenue.halls.length} halls
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Custom Fork Notice or Organizer Fork Button */}
      {selectedVenue.is_custom_fork ? (
        <div className="bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs shadow-xs animate-in fade-in">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <GitBranch className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-bold text-amber-900 dark:text-amber-200">
                Custom Event Layout: {selectedVenue.name}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-mono font-bold">
                Forked Workspace
              </span>
            </div>
            <p className="text-amber-800 dark:text-amber-300 text-[11px] leading-relaxed">
              Original Facility: <strong>{selectedVenue.forked_from_name || 'Verified Venue'}</strong>. Forked by{' '}
              <strong>{selectedVenue.forked_by_user_name || 'Event Organizer'}</strong> for custom event staging. Notice: You can customize temporary seating and booth configurations for your event, but master facility ownership and registry remain strictly with the verified partner.
            </p>
          </div>
        </div>
      ) : (
        !isVenueOwner && (
          <div className="bg-[#EBF3FC]/80 dark:bg-[#1E293B]/60 border border-[#C8DCF7] dark:border-[#2D4160] rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs shadow-xs animate-in fade-in">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-bold text-[#244A85] dark:text-[#8BB0E8]">
                  Verified Facility Partner: {selectedVenue.manager_name || 'Designated Facility Manager'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white dark:bg-[#111722] text-slate-600 dark:text-slate-300 font-mono border border-[#C8DCF7] dark:border-[#2D4160]">
                  Protected Master Registry
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                As an event organizer, you have public schedule visibility and collision-safe booking rights. You can fork this facility's architectural partition layout for your custom event staging, while master power ratings, pricing, and hall registry remain exclusively guarded by the verified owner.
              </p>
            </div>

            <button
              onClick={handleForkLayout}
              className="px-4 py-2.5 rounded-xl bg-[#3E6CB5] hover:bg-[#325896] text-white font-bold text-xs flex items-center justify-center gap-2 shrink-0 shadow-xs transition-all cursor-pointer"
            >
              <GitBranch className="w-4 h-4 text-[#D4E4F7]" />
              <span>Fork Layout for Custom Event</span>
            </button>
          </div>
        )
      )}

      {/* ========================================================================= */}
      {/* VIEW 1: FACILITY OVERVIEW                                                */}
      {/* ========================================================================= */}
      {activeView === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* 4 Metric KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#171E2B] p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#3E6CB5] dark:text-[#7EA6E0]" /> Max Seating Capacity
              </span>
              <p className="text-xl font-black text-slate-900 dark:text-slate-100">
                {selectedVenue.capacity.toLocaleString()} guests
              </p>
              <p className="text-[11px] text-slate-500">
                {selectedVenue.halls ? `${selectedVenue.halls.length} configured partition halls` : 'Single main arena'}
              </p>
            </div>

            <div className="bg-white dark:bg-[#171E2B] p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" /> Power Grid Capacity
              </span>
              <p className="text-xl font-black text-slate-900 dark:text-slate-100">
                {selectedVenue.power_kw_capacity} kW
              </p>
              <p className="text-[11px] text-slate-500">3-phase dedicated industrial transformer</p>
            </div>

            <div className="bg-white dark:bg-[#171E2B] p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#2B6149] dark:text-[#81B89B]" /> Operating Hours
              </span>
              <p className="text-xl font-black text-slate-900 dark:text-slate-100">
                {selectedVenue.operating_hours.open} – {selectedVenue.operating_hours.close}
              </p>
              <p className="text-[11px] text-slate-500">Standard rate: ₱{selectedVenue.hourly_rate.toLocaleString()}/hr</p>
            </div>

            <div className="bg-white dark:bg-[#171E2B] p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-500" /> Overlap Protection
              </span>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                Active Guard
              </p>
              <p className="text-[11px] text-slate-500">
                Double-booking prevention active
              </p>
            </div>
          </div>

          {/* Facility Details & Quick Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Venue Profile Card */}
            <div className="lg:col-span-2 bg-white dark:bg-[#171E2B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#3E6CB5] dark:text-[#7EA6E0]" />
                  Facility Specifications & Location
                </h3>
                <span className="text-xs text-slate-500 font-mono">
                  City: {selectedVenue.city}
                </span>
              </div>

              {selectedVenue.image_url && (
                <div className="w-full h-48 rounded-xl overflow-hidden relative border border-slate-200 dark:border-slate-800">
                  <img
                    src={selectedVenue.image_url}
                    alt={selectedVenue.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-4">
                    <div className="text-white">
                      <p className="text-sm font-bold">{selectedVenue.name}</p>
                      <p className="text-xs text-slate-200 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {selectedVenue.address}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 space-y-1">
                  <span className="text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#3E6CB5]" /> Contact Email
                  </span>
                  <p className="font-mono text-slate-800 dark:text-slate-200">
                    {selectedVenue.contact_email || 'bookings@zabay.ph'}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 space-y-1">
                  <span className="text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-500" /> Phone Contact
                  </span>
                  <p className="font-mono text-slate-800 dark:text-slate-200">
                    {selectedVenue.contact_phone || '+63 (38) 411-2244'}
                  </p>
                </div>
              </div>

              {/* Certified Amenities Preview */}
              <div>
                <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Certified Amenities & Rigging Highlights
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedVenue.facilities.map((fac, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      {fac}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right 1 Col: Operational Shortcuts & Schedule Status */}
            <div className="space-y-4">
              <div className="bg-white dark:bg-[#171E2B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Operational Hub Navigation
                </h3>

                <button
                  onClick={() => handleSelectView('calendar')}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-[#EEF3ED] dark:hover:bg-[#222D21] border border-slate-200 dark:border-slate-800 hover:border-emerald-300 transition-all text-left group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        Bookings & Collision Checker
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {bookingsForVenue.length} bookings scheduled. Test EXCLUDE overlaps.
                  </p>
                </button>

                <button
                  onClick={() => handleSelectView('inventory')}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-[#FAF0E6] dark:hover:bg-[#2A231C] border border-slate-200 dark:border-slate-800 hover:border-amber-300 transition-all text-left group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-amber-600" />
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        Halls & Equipment Inventory
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {selectedVenue.halls?.length || 0} halls & {selectedVenue.facilities.length} amenities configured.
                  </p>
                </button>
              </div>

              {/* Database EXCLUDE Safety Status */}
              <div className="bg-[#FAF9F5] dark:bg-[#121924] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-2">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Reservation Integrity Guard
                </span>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  ZABAY automatically enforces double-booking prevention over all venue halls. If two organizers request overlapping times, the system flags the conflict to guarantee schedule integrity.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: BOOKINGS & COLLISION PREVENTION                                  */}
      {/* ========================================================================= */}
      {activeView === 'calendar' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Booking Calendar & Temporal Non-Overlap Demonstrator */}
          <div className="bg-white dark:bg-[#171E2B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#3E6CB5] dark:text-[#7EA6E0]" />
                  Scheduled Venue Bookings ({bookingsForVenue.length} Confirmed)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Collision prevention automatically blocks overlapping booking requests across halls.
                </p>
              </div>
            </div>

            {/* Existing Bookings */}
            <div className="space-y-3">
              {bookingsForVenue.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                  No confirmed bookings yet for {selectedVenue.name}. Use the collision tester below or create an event in the 4-Step Wizard!
                </div>
              ) : (
                bookingsForVenue.map((booking) => (
                  <div
                    key={booking.id}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
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
                      <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1">
                        Interval: {new Date(booking.start_time).toLocaleDateString()} {new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} → {new Date(booking.end_time).toLocaleDateString()} {new Date(booking.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <div className="text-right text-[11px] text-slate-400 font-mono">
                      Ref: {booking.id}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Collision Prevention Interactive Test Suite */}
            <div className="p-5 rounded-xl bg-[#FAF9F5] dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Interactive Double-Booking Collision Test
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Attempt an overlapping booking interval to see the collision guard flag the schedule conflict.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {selectedVenue.halls && selectedVenue.halls.length > 0 && (
                  <select
                    value={testHallId}
                    onChange={(e) => setTestHallId(e.target.value)}
                    className="bg-white dark:bg-[#171E2B] border border-slate-300 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3E6CB5]"
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
                  className="bg-white dark:bg-[#171E2B] border border-slate-300 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3E6CB5]"
                  title="Booking Start Time"
                />
                <span className="text-slate-400 text-xs font-bold">to</span>
                <input
                  type="text"
                  value={testEnd}
                  onChange={(e) => setTestEnd(e.target.value)}
                  className="bg-white dark:bg-[#171E2B] border border-slate-300 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3E6CB5]"
                  title="Booking End Time"
                />
                <button
                  onClick={handleTestBooking}
                  className="px-4 py-2 bg-[#244A85] hover:bg-[#1E3C6D] text-white rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer"
                >
                  Test Reservation Availability
                </button>
              </div>

              {bookingStatus && (
                <div
                  className={`p-3.5 rounded-xl text-xs flex items-center gap-2 border animate-in fade-in duration-150 ${
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
                  <span className="font-medium">{bookingStatus.message}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: HALLS & EQUIPMENT INVENTORY                                      */}
      {/* ========================================================================= */}
      {activeView === 'inventory' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Sub-Venues / Halls Grid */}
          <div className="bg-white dark:bg-[#171E2B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#3E6CB5]" />
                Halls & Sub-Venues Inventory ({selectedVenue.halls?.length || 0} Individual Spaces)
              </h3>
              <span className="text-[11px] text-slate-500">
                Independently Bookable Spaces
              </span>
            </div>

            {selectedVenue.halls && selectedVenue.halls.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedVenue.halls.map((hall) => (
                  <div
                    key={hall.id}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs hover:border-[#3E6CB5]/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-slate-900 dark:text-slate-100">{hall.name}</h4>
                      <span className="font-bold text-[#244A85] dark:text-[#8BB0E8] font-mono shrink-0">
                        ₱{hall.hourly_rate.toLocaleString()}/hr
                      </span>
                    </div>
                    {hall.description && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        {hall.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 font-mono pt-2 border-t border-slate-200 dark:border-slate-800">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Cap: {hall.capacity.toLocaleString()}
                      </span>
                      {hall.dimensions && <span>• {hall.dimensions}</span>}
                      <span>• {hall.is_indoor ? 'Indoor Space' : 'Outdoor Space'}</span>
                    </div>
                    {hall.facilities && hall.facilities.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {hall.facilities.map((f, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] text-slate-600 dark:text-slate-300"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                This facility operates as a single unified arena without partitioned sub-halls.
              </div>
            )}
          </div>

          {/* Certified Infrastructure & Amenities Checklist */}
          <div className="bg-white dark:bg-[#171E2B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Certified Facilities & Equipment Inventory ({selectedVenue.facilities.length} Verified Items)
              </h3>
              <span className="text-[11px] text-slate-500 font-medium">
                Automated Matcher Verification
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {selectedVenue.facilities.map((fac, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2.5"
                >
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <span>{fac}</span>
                </div>
              ))}
            </div>

            {/* Electrical Substation & Power Summary */}
            <div className="mt-4 p-4 rounded-xl bg-[#FAF9F5] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Primary Power Grid Substation
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {selectedVenue.power_kw_capacity} kW continuous industrial capacity with 3-phase automatic transfer switch.
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 shrink-0">
                {selectedVenue.power_kw_capacity} kW Rated
              </span>
            </div>
          </div>
        </div>
      )}

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

