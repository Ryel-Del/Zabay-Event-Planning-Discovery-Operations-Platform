import React, { useState } from 'react';
import {
  Search,
  Map,
  Grid,
  Calendar,
  MapPin,
  Users,
  Ticket,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { ZabayEvent } from '../../types';
import { EventMapView } from './EventMapView';
import { StripeCheckoutModal } from './StripeCheckoutModal';
import { AttendeePassView } from './AttendeePassView';

interface EventDiscoveryProps {
  onOpenScannerWithPass?: (code: string) => void;
}

export const EventDiscovery: React.FC<EventDiscoveryProps> = ({ onOpenScannerWithPass }) => {
  const { events, venues } = useApp();

  const [activeTab, setActiveTab] = useState<'browse' | 'passes'>('browse');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedEventForCheckout, setSelectedEventForCheckout] = useState<ZabayEvent | null>(null);

  const categories: string[] = ['All', 'Tech & AI', 'Music & Festival', 'Gaming & Esports'];

  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || e.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Tab Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            Public Event Discovery & Passes
          </h2>
          <p className="text-xs text-slate-400">
            Explore public events, discover venues on OpenStreetMap, and claim your digital QR pass.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'browse'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Browse Events
          </button>
          <button
            onClick={() => setActiveTab('passes')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'passes'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Ticket className="w-3.5 h-3.5" />
            My Event Passes
          </button>
        </div>
      </div>

      {activeTab === 'browse' ? (
        <>
          {/* Search, Filter & View Controls */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search events, topics, or keynotes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Category Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                      : 'text-slate-400 hover:text-white bg-slate-950 border border-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Grid / Map Toggle */}
            <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded text-xs font-medium ${
                  viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Grid Cards View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`p-1.5 rounded text-xs font-medium ${
                  viewMode === 'map' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="OpenStreetMap Map View"
              >
                <Map className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* View Container */}
          {viewMode === 'map' ? (
            <EventMapView
              events={filteredEvents}
              venues={venues}
              onSelectEvent={(evt) => setSelectedEventForCheckout(evt)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => {
                const venue = venues.find((v) => v.id === event.venue_id);

                return (
                  <div
                    key={event.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg hover:border-slate-700 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Banner Image */}
                      <div className="relative h-44 overflow-hidden bg-slate-950">
                        <img
                          src={event.banner_url}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                        <span className="absolute top-3 left-3 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-900/80 backdrop-blur-md text-indigo-400 border border-slate-700">
                          {event.category}
                        </span>
                        <span className="absolute top-3 right-3 px-2 py-0.5 rounded-md text-xs font-black bg-indigo-600 text-white shadow-md">
                          ${event.ticket_price}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="p-5 space-y-3">
                        <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors leading-snug">
                          {event.title}
                        </h3>
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {event.description}
                        </p>

                        <div className="space-y-1.5 text-xs text-slate-400 pt-2 border-t border-slate-800">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
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
                              <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                              <span className="truncate">{venue.name}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                            <span>
                              {event.tickets_sold} / {event.max_capacity} registered
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="p-5 pt-0">
                      <button
                        onClick={() => setSelectedEventForCheckout(event)}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                      >
                        <Ticket className="w-4 h-4" />
                        Register & Pay with Stripe
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

      {/* Stripe Checkout Modal */}
      {selectedEventForCheckout && (
        <StripeCheckoutModal
          event={selectedEventForCheckout}
          isOpen={true}
          onClose={() => setSelectedEventForCheckout(null)}
          onSuccess={() => {
            // Stay open for pass display
          }}
        />
      )}
    </div>
  );
};
