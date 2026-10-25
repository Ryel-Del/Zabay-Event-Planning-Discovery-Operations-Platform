import React, { useState } from 'react';
import {
  Search,
  Map,
  Grid,
  Calendar,
  MapPin,
  Users,
  Ticket,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { ZabayEvent } from '../../types';
import { EventMapView } from './EventMapView';
import { AuthModal } from '../auth/AuthModal';
import { StripeCheckoutModal } from './StripeCheckoutModal';
import { AttendeePassView } from './AttendeePassView';
import { LumaEventDetailView } from './LumaEventDetailView';
import { formatTicketPrice } from '../../utils/currency';

interface EventDiscoveryProps {
  onOpenScannerWithPass?: (code: string) => void;
}

export const EventDiscovery: React.FC<EventDiscoveryProps> = ({ onOpenScannerWithPass }) => {
  const { events, venues, currentUser, isDemoMode, eventLoadState, refreshBackendStatus } = useApp();

  const [activeTab, setActiveTab] = useState<'browse' | 'passes'>('browse');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedEventForCheckout, setSelectedEventForCheckout] = useState<ZabayEvent | null>(null);
  const [selectedEventDetail, setSelectedEventDetail] = useState<ZabayEvent | null>(null);
  const [pendingEvent, setPendingEvent] = useState<ZabayEvent | null>(null);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const closeAuthPrompt = () => {
    setAuthPromptOpen(false);
    setPendingEvent(null);
  };
  const signedIn = currentUser.id !== 'usr-guest' && currentUser.id !== 'zabay-operator';
  const requestRegistration = (event: ZabayEvent) => {
    if (isDemoMode || signedIn) setSelectedEventForCheckout(event);
    else { setPendingEvent(event); setAuthPromptOpen(true); }
  };
  React.useEffect(() => {
    if (pendingEvent && signedIn) {
      setAuthPromptOpen(false);
      setSelectedEventForCheckout(pendingEvent);
      setPendingEvent(null);
    }
  }, [pendingEvent, signedIn]);

  React.useEffect(() => {
    const handleSetTab = (e: any) => {
      if (e.detail?.tab) setActiveTab(e.detail.tab);
      if (e.detail?.view) setViewMode(e.detail.view);
      setSelectedEventDetail(null);
    };
    window.addEventListener('zabay:set-attendee-tab', handleSetTab);
    return () => window.removeEventListener('zabay:set-attendee-tab', handleSetTab);
  }, []);

  const categories: string[] = [
    'All',
    'Sports & Athletics',
    'Festivals & Cultural',
    'Conferences & Seminars',
    'Workshops & Bootcamps',
    'School & Youth',
    'Tech & Innovation',
  ];

  // PRIVACY RULE: Private and invite-only events are strictly hidden from public Event Finder & Map!
  const publicEvents = events.filter(
    (e) => !e.is_private && e.event_type !== 'private' && e.event_type !== 'invite_only' && e.status !== 'cancelled'
  );

  const filteredEvents = publicEvents.filter((e) => {
    const matchesSearch =
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || e.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // If viewing a single event in Luma-like detail page
  if (selectedEventDetail) {
    const currentDetailEvent = events.find((event) => event.id === selectedEventDetail.id) || selectedEventDetail;
    const venue = venues.find((v) => v.id === currentDetailEvent.venue_id);
    return (
      <div className="space-y-6">
        <LumaEventDetailView
          event={currentDetailEvent}
          venue={venue}
          onBack={() => setSelectedEventDetail(null)}
          onRegister={() => requestRegistration(currentDetailEvent)}
          onViewPass={() => {
            setSelectedEventDetail(null);
            setActiveTab('passes');
          }}
        />

        <AuthModal isOpen={authPromptOpen} intent={pendingEvent ? `Sign in to get a pass for ${pendingEvent.title}. Your event will be ready after sign-in.` : undefined} onClose={closeAuthPrompt} />

        {/* Stripe Checkout Modal */}
        {selectedEventForCheckout && (
          <StripeCheckoutModal
            event={selectedEventForCheckout}
            isOpen={true}
            onClose={() => {
              setSelectedEventForCheckout(null);
              if (activeTab === 'passes') setSelectedEventDetail(null);
            }}
            onSuccess={() => setActiveTab('passes')}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Tab Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Public Event Discovery & Passes
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Explore public events, discover venues on OpenStreetMap, and view Luma-style experience pages.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex items-center gap-1.5 sm:gap-2 bg-[#F1F5FB] dark:bg-[#111722] p-1 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <button
            onClick={() => setActiveTab('browse')}
            data-cy="browse-events"
            className={`px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
              activeTab === 'browse'
                ? 'bg-white dark:bg-[#1E293B] text-slate-900 dark:text-slate-100 shadow-xs border border-slate-200/60 dark:border-slate-700/60'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Browse Events
          </button>
          <button
            onClick={() => setActiveTab('passes')}
            data-cy="my-digital-passes"
            className={`px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center ${
              activeTab === 'passes'
                ? 'bg-white dark:bg-[#1E293B] text-slate-900 dark:text-slate-100 shadow-xs border border-slate-200/60 dark:border-slate-700/60'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Ticket className="w-3.5 h-3.5 text-[#3E6CB5] dark:text-[#7EA6E0]" />
            <span>My Digital Passes</span>
          </button>
        </div>
      </div>

      {activeTab === 'browse' && !isDemoMode && eventLoadState === 'loading' && <p role="status">Loading public events…</p>}
      {activeTab === 'browse' && !isDemoMode && eventLoadState === 'error' && (
        <div role="alert" data-cy="event-load-error" className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-900">
          Public events could not be loaded. Check your connection and try again.
          <button type="button" onClick={refreshBackendStatus} className="ml-3 underline font-semibold">Retry</button>
        </div>
      )}
      {activeTab === 'browse' && (isDemoMode || eventLoadState === 'loaded') ? (
        <>
          {/* Search, Filter & View Controls */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-white dark:bg-[#171E2B] p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                data-cy="event-search"
                type="text"
                placeholder="Search events, topics, or keynotes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#F8FAFD] dark:bg-[#111722] border border-slate-300/80 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#3E6CB5]"
              />
            </div>

            {/* Category Chips and Grid/Map Toggle Row */}
            <div className="flex items-center justify-between gap-2 min-w-0">
              {/* Category Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar flex-1 min-w-0">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                      selectedCategory === cat
                        ? 'bg-[#3E6CB5] text-white font-semibold shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Grid / Map Toggle */}
              <div className="flex items-center bg-[#F1F5FB] dark:bg-[#111722] p-1 rounded-xl border border-slate-200/80 dark:border-slate-800 shrink-0">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-[#1E293B] text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                  title="Grid Cards View"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`p-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                    viewMode === 'map'
                      ? 'bg-white dark:bg-[#1E293B] text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                  title="OpenStreetMap Map View"
                >
                  <Map className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* View Container */}
          {viewMode === 'map' ? (
            <EventMapView
              events={filteredEvents}
              venues={venues}
              onSelectEvent={(evt) => setSelectedEventDetail(evt)}
            />
          ) : filteredEvents.length === 0 ? (
            <div className="bg-white dark:bg-[#171E2B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-12 text-center space-y-4 shadow-xs">
              <div className="w-16 h-16 bg-[#EBF3FC] dark:bg-[#1E293B] text-[#3E6CB5] dark:text-[#7EA6E0] rounded-2xl flex items-center justify-center mx-auto">
                <Calendar className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">No Events Discovered</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {publicEvents.length === 0 ? 'No public events are scheduled right now.' : 'No public events match your search.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => {
                const venue = venues.find((v) => v.id === event.venue_id);

                return (
                  <div
                    key={event.id}
                    data-cy="event-card"
                    onClick={() => setSelectedEventDetail(event)}
                    className="bg-white dark:bg-[#171E2B] border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer"
                  >
                    <div>
                      {/* Banner Image */}
                      <div className="relative h-44 overflow-hidden bg-slate-900">
                        <img
                          src={event.banner_url}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-white/95 dark:bg-slate-900/90 backdrop-blur-md text-slate-900 dark:text-slate-100 shadow-xs">
                          {event.category}
                        </span>
                        <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-md text-xs font-bold shadow-xs ${
                          event.ticket_price <= 0
                            ? 'bg-emerald-600 text-white'
                            : 'bg-[#3E6CB5] text-white'
                        }`}>
                          {formatTicketPrice(event.ticket_price, event.currency, true)}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="p-5 space-y-3">
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#3E6CB5] dark:group-hover:text-[#7EA6E0] transition-colors leading-snug">
                          {event.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {event.description}
                        </p>

                        <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>
                              {new Date(event.start_date).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                              })}{' '}
                              -{' '}
                              {new Date(event.end_date).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          </div>

                          {venue && (
                            <div className="flex items-center gap-1.5 truncate">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{venue.name}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>
                              {event.tickets_sold} / {event.max_capacity} registered
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="p-5 pt-0 flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEventDetail(event);
                        }}
                        className="flex-1 py-2.5 bg-[#F8FAFD] dark:bg-[#111722] hover:bg-[#EBF3FC] dark:hover:bg-[#1E293B] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#3E6CB5] dark:text-[#7EA6E0]" />
                        <span>Experience Page</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          requestRegistration(event);
                        }}
                        data-cy="event-register"
                        className="py-2.5 px-3.5 bg-[#3E6CB5] hover:bg-[#325896] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                        title="Register for a digital pass"
                      >
                        <Ticket className="w-4 h-4 text-white" />
                        <span>Get Pass</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <AttendeePassView onScanPass={onOpenScannerWithPass} />
      )}

      <AuthModal isOpen={authPromptOpen} intent={pendingEvent ? `Sign in to get a pass for ${pendingEvent.title}. Your event will be ready after sign-in.` : undefined} onClose={closeAuthPrompt} />

      {/* Stripe Checkout Modal */}
      {selectedEventForCheckout && (
        <StripeCheckoutModal
          event={selectedEventForCheckout}
          isOpen={true}
          onClose={() => setSelectedEventForCheckout(null)}
          onSuccess={() => setActiveTab('passes')}
        />
      )}
    </div>
  );
};
