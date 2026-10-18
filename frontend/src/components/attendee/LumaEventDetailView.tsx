import React, { useState } from 'react';
import {
  Calendar,
  MapPin,
  Share2,
  Bell,
  BellRing,
  UserPlus,
  UserCheck,
  Check,
  ArrowLeft,
  Ticket,
  ShieldCheck,
  Sparkles,
  Copy,
  Mail,
  X,
} from 'lucide-react';
import type { ZabayEvent, Venue } from '../../types';
import { useApp } from '../../context/AppContext';

interface LumaEventDetailViewProps {
  event: ZabayEvent;
  venue?: Venue;
  onBack: () => void;
  onRegister: () => void;
  onViewPass?: () => void;
}

export const LumaEventDetailView: React.FC<LumaEventDetailViewProps> = ({
  event,
  venue,
  onBack,
  onRegister,
  onViewPass,
}) => {
  const { registrations } = useApp();

  const [isFollowing, setIsFollowing] = useState(false);
  const [isNotified, setIsNotified] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSent, setInviteSent] = useState(false);

  // Check if current user is registered for this event
  const userRegistration = registrations.find((r) => r.event_id === event.id);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      showToast('Event link copied to clipboard!');
    } else {
      showToast('Link ready to share!');
    }
  };

  const handleToggleNotify = () => {
    setIsNotified(!isNotified);
    showToast(!isNotified ? 'Notifications turned ON for schedule updates & speaker drops.' : 'Notifications turned OFF.');
  };

  const handleToggleFollow = () => {
    setIsFollowing(!isFollowing);
    showToast(!isFollowing ? 'You are now following Marcus Vance (Organizer).' : 'Unfollowed organizer.');
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviteSent(true);
    setTimeout(() => {
      setInviteSent(false);
      setInviteEmail('');
      setIsInviteModalOpen(false);
      showToast(`Invitation sent to ${inviteEmail}!`);
    }, 1200);
  };

  // Mock community attendee avatars
  const attendeeAvatars = [
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
  ];

  const occupancyPercent = Math.round((event.tickets_sold / event.max_capacity) * 100);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-200 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-bottom-3 duration-200">
          <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation & Action Controls */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white px-3 py-2 rounded-xl bg-white dark:bg-[#171E2B] border border-slate-200 dark:border-slate-800 transition-colors shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#3E6CB5] dark:text-[#7EA6E0]" />
          <span>Back to All Events</span>
        </button>

        {/* Luma Social Utility Bar */}
        <div className="flex items-center gap-2">
          {/* Keep Me Updated / Notifications */}
          <button
            onClick={handleToggleNotify}
            className={`p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
              isNotified
                ? 'bg-[#EBF3FC] text-[#244A85] border-[#C8DCF7] dark:bg-[#1E293B] dark:text-[#8BB0E8] dark:border-[#2D4160]'
                : 'bg-white dark:bg-[#171E2B] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
            title="Get Schedule & Speaker Updates"
          >
            {isNotified ? (
              <>
                <BellRing className="w-4 h-4 text-[#3E6CB5] dark:text-[#7EA6E0]" />
                <span className="hidden sm:inline">Updates On</span>
              </>
            ) : (
              <>
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline">Keep Me Updated</span>
              </>
            )}
          </button>

          {/* Share Link */}
          <button
            onClick={handleShare}
            className="p-2 rounded-xl text-xs font-medium bg-white dark:bg-[#171E2B] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-1.5"
            title="Copy Share Link"
          >
            <Share2 className="w-4 h-4 text-[#3E6CB5] dark:text-[#7EA6E0]" />
            <span className="hidden sm:inline">Share</span>
          </button>

          {/* Invite Friends */}
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#171E2B] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-[#3E6CB5] transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Mail className="w-3.5 h-3.5 text-[#3E6CB5] dark:text-[#7EA6E0]" />
            <span>Invite</span>
          </button>
        </div>
      </div>

      {/* Main Luma Editorial Split (65% Story & Details / 35% Sticky Ticket Card) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Hero Art, Host Profile & Event Narrative (7 cols) */}
        <div className="lg:col-span-7 space-y-8">
          {/* Hero Banner Artwork */}
          <div className="relative aspect-video rounded-3xl overflow-hidden shadow-sm border border-slate-200/80 dark:border-slate-800 bg-slate-900">
            <img
              src={event.banner_url}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/95 dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 shadow-sm backdrop-blur-md">
                {event.category}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#3E6CB5]/90 text-white shadow-sm backdrop-blur-md">
                Public Admission
              </span>
            </div>
          </div>

          {/* Title & Headline */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
              {event.title}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {event.description}
            </p>
          </div>

          {/* Host / Organizer Card (Signature Luma Layout) */}
          <div className="bg-white dark:bg-[#171E2B] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                alt="Marcus Vance"
                className="w-12 h-12 rounded-full object-cover ring-2 ring-[#3E6CB5]/30"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Hosted by
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#EDF7F2] text-[#2B6149] dark:bg-[#17271F] dark:text-[#81B89B] border border-[#BDE3CF]/40">
                    Verified Host
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  Marcus Vance
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Lead Director @ ZABAY • 1,420 members • 12 hosted events
                </p>
              </div>
            </div>

            {/* Follow Button */}
            <button
              onClick={handleToggleFollow}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                isFollowing
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700'
                  : 'bg-[#3E6CB5] hover:bg-[#325896] text-white'
              }`}
            >
              {isFollowing ? (
                <>
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Following</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Follow Host</span>
                </>
              )}
            </button>
          </div>

          {/* Time, Date & Location Specifications */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Date & Time */}
            <div className="bg-white dark:bg-[#171E2B] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-2">
              <div className="w-9 h-9 rounded-xl bg-[#EBF3FC] dark:bg-[#1E293B] border border-[#C8DCF7] dark:border-[#2D4160] flex items-center justify-center text-[#3E6CB5] dark:text-[#7EA6E0]">
                <Calendar className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Date & Operational Window
              </h4>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {new Date(event.start_date).toLocaleDateString(undefined, {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
              <p className="text-xs text-slate-500 font-mono">
                09:00 AM – 06:00 PM PDT (Multi-Day Summit)
              </p>
            </div>

            {/* Location & Venue */}
            <div className="bg-white dark:bg-[#171E2B] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-2">
              <div className="w-9 h-9 rounded-xl bg-[#EBF3FC] dark:bg-[#1E293B] border border-[#C8DCF7] dark:border-[#2D4160] flex items-center justify-center text-[#3E6CB5] dark:text-[#7EA6E0]">
                <MapPin className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Event Location & Venue
              </h4>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                {venue ? venue.name : 'Metropolis Convention Center'}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {venue ? `${venue.address}, ${venue.city}` : 'San Francisco, CA'}
              </p>
            </div>
          </div>

          {/* About this Event */}
          <div className="bg-white dark:bg-[#171E2B] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#3E6CB5] dark:text-[#7EA6E0]" />
              About This Experience
            </h3>

            <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed space-y-3">
              <p>
                Welcome to <strong>{event.title}</strong>. This multi-track event brings together university student organizations, engineering teams, and industry leaders for hands-on demos, keynote sessions, and networking.
              </p>

              <div className="p-4 rounded-xl bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="font-bold text-slate-900 dark:text-slate-100 block">
                  Included with Your Registration:
                </span>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-[#3E6CB5]" /> Full Keynote & Workshop Floor Access
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-[#3E6CB5]" /> Networking Lunch & Espresso Bar
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-[#3E6CB5]" /> Digital QR Gate Pass in Wallet
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-[#3E6CB5]" /> Dedicated High-Speed Gigabit WiFi
                  </li>
                </ul>
              </div>

              <p className="text-[11px] text-slate-400">
                <strong>Gate Policy:</strong> Digital passes are scanned via webcam/camera at the turnstiles. Duplicate entries are prevented at the database level. Please present your QR pass on your mobile device or printed ticket upon arrival.
              </p>
            </div>
          </div>

          {/* Social Proof: Who's Coming */}
          <div className="bg-white dark:bg-[#171E2B] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {attendeeAvatars.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt="Attendee"
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-white dark:ring-[#171E2B]"
                  />
                ))}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {event.tickets_sold} Attendees Registered
                </p>
                <p className="text-[11px] text-slate-400">
                  Join Sofia Chen, Liam Henderson, and other registered guests
                </p>
              </div>
            </div>

            <span className="text-xs font-semibold text-[#3E6CB5] dark:text-[#7EA6E0]">
              {occupancyPercent}% Booked
            </span>
          </div>
        </div>

        {/* Right Column: Floating Luma Ticket / Registration Box (5 cols) */}
        <div className="lg:col-span-5 sticky top-20 space-y-4">
          <div className="bg-white dark:bg-[#171E2B] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-md space-y-5">
            {/* Ticket Header & Price */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-200/80 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Official Registration
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  General Admission
                </h3>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
                  ${event.ticket_price}
                </span>
                <span className="text-[10px] text-slate-400 block font-mono">
                  via Stripe Checkout
                </span>
              </div>
            </div>

            {/* Capacity Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Spots Claimed:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {event.tickets_sold} / {event.max_capacity}
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#3E6CB5] dark:bg-[#7EA6E0] h-full rounded-full transition-all"
                  style={{ width: `${occupancyPercent}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 block text-right font-mono">
                {event.max_capacity - event.tickets_sold} tickets remaining
              </span>
            </div>

            {/* CTA Button */}
            {userRegistration ? (
              <div className="space-y-3">
                <div className="p-3 bg-[#EDF7F2] dark:bg-[#17271F] border border-[#BDE3CF] dark:border-[#234232] rounded-xl text-xs font-semibold text-[#2B6149] dark:text-[#81B89B] flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 shrink-0" />
                  <span>You're attending this event! Your digital QR pass is ready.</span>
                </div>
                {onViewPass && (
                  <button
                    onClick={onViewPass}
                    className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                  >
                    <Ticket className="w-4 h-4 text-[#7EA6E0] dark:text-[#3E6CB5]" />
                    <span>View Your Digital QR Pass ↗</span>
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={onRegister}
                className="w-full py-3.5 bg-[#3E6CB5] hover:bg-[#325896] dark:bg-[#4E80CD] dark:hover:bg-[#3E6CB5] text-white rounded-2xl text-xs font-bold tracking-wide shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Ticket className="w-4 h-4 text-[#D4E4F7]" />
                <span>Register & Claim QR Pass</span>
              </button>
            )}

            {/* Trust Assurances */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2 text-[11px] text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#4E8268] shrink-0" />
                <span>Instant QR pass generation with duplicate-proof gate scan</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#3E6CB5] shrink-0" />
                <span>Encrypted checkout powered by Stripe</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invite Friends Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#171E2B] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setIsInviteModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#3E6CB5]" />
                Invite Friends or Team Members
              </h3>
              <p className="text-xs text-slate-500">
                Share this event with friends, classmates, or co-organizers.
              </p>
            </div>

            {/* Invite by Email */}
            <form onSubmit={handleSendInvite} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Recipient Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. teammate@university.edu"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full bg-[#F8FAFD] dark:bg-[#111722] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#3E6CB5]"
                />
              </div>

              <button
                type="submit"
                disabled={inviteSent}
                className="w-full py-2.5 bg-[#3E6CB5] hover:bg-[#325896] text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                {inviteSent ? (
                  <span>Sending Invitation...</span>
                ) : (
                  <>
                    <Mail className="w-3.5 h-3.5" />
                    <span>Send Invite</span>
                  </>
                )}
              </button>
            </form>

            {/* Share Link Copy Box */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Or share direct link
              </span>
              <div className="flex items-center gap-2 bg-[#F8FAFD] dark:bg-[#111722] p-2 rounded-xl border border-slate-200 dark:border-slate-800">
                <input
                  type="text"
                  readOnly
                  value={window.location.href}
                  className="bg-transparent text-xs text-slate-600 dark:text-slate-400 font-mono flex-1 focus:outline-none"
                />
                <button
                  onClick={handleShare}
                  className="px-2.5 py-1 bg-white dark:bg-[#171E2B] border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 cursor-pointer flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
