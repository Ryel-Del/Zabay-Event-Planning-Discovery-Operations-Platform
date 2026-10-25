import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, ArrowRight, Crosshair, Loader2, ChevronLeft, ChevronRight, Calendar, Layers } from 'lucide-react';
import type { ZabayEvent, Venue } from '../../types';
import { formatTicketPrice } from '../../utils/currency';

interface EventMapViewProps {
  events: ZabayEvent[];
  venues: Venue[];
  onSelectEvent: (event: ZabayEvent) => void;
}

// Custom modern marker icon for Leaflet venues with category-specific glyphs and multi-event badge
const createCustomIcon = (category?: string, eventCount: number = 1) => {
  const cat = (category || '').toLowerCase();

  let glyphSvg = '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>';
  let accentColor = '#3E6CB5';
  let bgColor = '#1E293B';

  if (cat.includes('sport') || cat.includes('athletic')) {
    // Trophy
    glyphSvg = '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>';
    accentColor = '#F59E0B';
    bgColor = '#291804';
  } else if (cat.includes('tech') || cat.includes('hackathon') || cat.includes('code')) {
    // Laptop / Tech
    glyphSvg = '<path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16"/>';
    accentColor = '#38BDF8';
    bgColor = '#082538';
  } else if (cat.includes('school') || cat.includes('youth') || cat.includes('academic') || cat.includes('student')) {
    // Graduation Cap
    glyphSvg = '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>';
    accentColor = '#34D399';
    bgColor = '#062619';
  } else if (cat.includes('outreach') || cat.includes('community') || cat.includes('medical') || cat.includes('relief')) {
    // Heart
    glyphSvg = '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>';
    accentColor = '#FB7185';
    bgColor = '#2B0810';
  } else if (cat.includes('festival') || cat.includes('cultural') || cat.includes('showcase')) {
    // Sparkles
    glyphSvg = '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>';
    accentColor = '#A78BFA';
    bgColor = '#201035';
  } else if (cat.includes('conference') || cat.includes('seminar') || cat.includes('workshop')) {
    // Briefcase
    glyphSvg = '<rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>';
    accentColor = '#60A5FA';
    bgColor = '#0C1C38';
  }

  const badgeHtml = eventCount > 1
    ? `<div style="
        position: absolute;
        top: -6px;
        right: -8px;
        background: #DC2626;
        color: #FFFFFF;
        font-size: 10px;
        font-weight: 800;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        border-radius: 9999px;
        min-width: 19px;
        height: 19px;
        padding: 0 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid #FFFFFF;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
        line-height: 1;
        z-index: 10;
      ">${eventCount}</div>`
    : '';

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="position: relative; width: 36px; height: 36px;">
        <div style="
          background: ${bgColor};
          color: #F8FAFD;
          padding: 6px;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.45);
          border: 2px solid ${accentColor};
          transition: transform 0.2s ease;
        ">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${accentColor}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${glyphSvg}</svg>
        </div>
        ${badgeHtml}
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
};

// Pulsing marker for user's detected GPS position
const createUserLocationIcon = () => {
  return L.divIcon({
    className: 'custom-user-marker',
    html: `
      <div style="
        position: relative;
        width: 22px;
        height: 22px;
        background: #10B981;
        border-radius: 50%;
        border: 3px solid #FFFFFF;
        box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.35);
      ">
        <div style="
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          background: rgba(16, 185, 129, 0.25);
          animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
};

// Dynamic map view controller to smoothly pan/zoom
const MapController: React.FC<{ center: [number, number] | null }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 14, { duration: 1.5 });
    }
  }, [center, map]);
  return null;
};

interface VenueMarkerProps {
  venue: Venue;
  venueEvents: ZabayEvent[];
  onSelectEvent: (event: ZabayEvent) => void;
}

const VenueMarker: React.FC<VenueMarkerProps> = ({ venue, venueEvents, onSelectEvent }) => {
  const [activeEventIndex, setActiveEventIndex] = useState(0);

  const hasMultiple = venueEvents.length > 1;
  const currentEvent = venueEvents[activeEventIndex] || venueEvents[0];
  const primaryCategory = currentEvent?.category || 'General';

  return (
    <Marker
      position={[venue.lat, venue.lng]}
      icon={createCustomIcon(primaryCategory, venueEvents.length)}
    >
      <Popup minWidth={270} maxWidth={320} className="zabay-leaflet-popup">
        <div className="p-1 text-slate-900 font-sans">
          {/* Venue Header */}
          <div className="border-b border-slate-200/80 pb-2 mb-2">
            <div className="flex items-center justify-between gap-1.5">
              <span className="font-bold text-xs text-slate-900 truncate">
                {venue.name}
              </span>
              {hasMultiple ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 shrink-0">
                  {venueEvents.length} Events
                </span>
              ) : (
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 shrink-0">
                  {venue.city}
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5 truncate flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
              <span>{venue.address || venue.city}</span>
            </p>
          </div>

          {/* Multiple Events Switcher Carousel / Pagination */}
          {hasMultiple && (
            <div className="flex items-center justify-between bg-slate-100 rounded-lg px-2 py-1 mb-2 text-xs">
              <button
                type="button"
                onClick={() => setActiveEventIndex((prev) => (prev > 0 ? prev - 1 : venueEvents.length - 1))}
                className="p-1 hover:bg-white rounded transition-colors text-slate-600 cursor-pointer"
                title="Previous event at this venue"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-bold text-slate-700">
                Event {activeEventIndex + 1} of {venueEvents.length}
              </span>
              <button
                type="button"
                onClick={() => setActiveEventIndex((prev) => (prev < venueEvents.length - 1 ? prev + 1 : 0))}
                className="p-1 hover:bg-white rounded transition-colors text-slate-600 cursor-pointer"
                title="Next event at this venue"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Active Event Card Details */}
          {currentEvent && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                  {currentEvent.category}
                </span>
                {currentEvent.hall_name && (
                  <span className="text-[9px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                    {currentEvent.hall_name}
                  </span>
                )}
              </div>

              <h4 className="font-bold text-xs text-slate-900 leading-tight">
                {currentEvent.title}
              </h4>

              <div className="flex items-center gap-3 text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {new Date(currentEvent.start_date).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                <span className={`font-semibold ${currentEvent.ticket_price <= 0 ? 'text-emerald-600 font-bold' : 'text-slate-800'}`}>
                  {formatTicketPrice(currentEvent.ticket_price, currentEvent.currency, true)}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">
                <span className="text-[10px] text-slate-500">
                  {currentEvent.tickets_sold || 0} / {currentEvent.max_capacity} attending
                </span>
                <button
                  onClick={() => onSelectEvent(currentEvent)}
                  className="px-2.5 py-1 bg-[#3E6CB5] hover:bg-[#325896] text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Details & Tickets</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Quick List of All Events at this Venue */}
          {hasMultiple && (
            <div className="mt-2.5 pt-2 border-t border-slate-200/60">
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Layers className="w-3 h-3" />
                <span>All Events at this Venue</span>
              </div>
              <div className="space-y-1 max-h-24 overflow-y-auto pr-0.5">
                {venueEvents.map((evt, idx) => (
                  <button
                    key={evt.id}
                    onClick={() => setActiveEventIndex(idx)}
                    className={`w-full text-left p-1.5 rounded text-[11px] flex items-center justify-between transition-colors cursor-pointer ${
                      idx === activeEventIndex
                        ? 'bg-blue-50 text-blue-900 font-bold border border-blue-200'
                        : 'hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    <span className="truncate pr-1">{evt.title}</span>
                    <span className="text-[9px] text-slate-400 shrink-0">
                      {new Date(evt.start_date).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
};

export const EventMapView: React.FC<EventMapViewProps> = ({ events, venues, onSelectEvent }) => {
  const defaultCenter: [number, number] = [9.64819, 123.85582];
  const [mapTargetCenter, setMapTargetCenter] = useState<[number, number] | null>(null);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);

  // Group events by venue so multiple events at 1 venue share a consolidated marker & interactive multi-event popup
  const venuesWithEvents = useMemo(() => {
    const grouped = new Map<string, { venue: Venue; events: ZabayEvent[] }>();

    for (const event of events) {
      if (!event.venue_id) continue;
      const venue = venues.find((v) => v.id === event.venue_id);
      if (!venue) continue;

      if (!grouped.has(venue.id)) {
        grouped.set(venue.id, { venue, events: [event] });
      } else {
        grouped.get(venue.id)!.events.push(event);
      }
    }

    return Array.from(grouped.values());
  }, [events, venues]);

  const handleLocateMe = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser');
      setTimeout(() => setLocationStatus(null), 4000);
      return;
    }

    setIsLocating(true);
    setLocationStatus('Detecting your GPS coordinates...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserPos(coords);
        setMapTargetCenter(coords);
        setIsLocating(false);
        setLocationStatus('Centered to your location!');
        setTimeout(() => setLocationStatus(null), 3000);
      },
      (err) => {
        setIsLocating(false);
        setLocationStatus(err.message || 'Unable to retrieve location');
        setTimeout(() => setLocationStatus(null), 4000);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-[#FAF9F5] dark:bg-[#171513] relative h-[540px]">
      {/* Control Overlay: Locate Me & Status */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
        <button
          onClick={handleLocateMe}
          disabled={isLocating}
          className="bg-white/95 dark:bg-[#171E2B]/95 backdrop-blur-xs px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          title="Center map on your current location"
        >
          {isLocating ? (
            <Loader2 className="w-3.5 h-3.5 text-[#3E6CB5] animate-spin" />
          ) : (
            <Crosshair className="w-3.5 h-3.5 text-[#3E6CB5] dark:text-[#7EA6E0]" />
          )}
          <span>{isLocating ? 'Locating...' : 'Locate Me'}</span>
        </button>

        {locationStatus && (
          <span className="bg-slate-900/90 text-white text-[11px] px-3 py-1 rounded-xl shadow-md animate-in fade-in">
            {locationStatus}
          </span>
        )}
      </div>

      {/* Scroll to Zoom Hint Pill */}
      <div className="absolute top-3 right-3 z-20 bg-white/90 dark:bg-[#171E2B]/90 backdrop-blur-xs px-3 py-1 rounded-full border border-slate-200/80 dark:border-slate-700/80 text-[11px] font-medium text-slate-700 dark:text-slate-300 shadow-xs flex items-center gap-1.5 pointer-events-none">
        <span className="w-1.5 h-1.5 rounded-full bg-[#3E6CB5] animate-pulse" />
        Scroll to zoom • Drag to pan
      </div>

      <MapContainer
        center={defaultCenter}
        zoom={13}
        scrollWheelZoom={true}
        className="w-full h-full z-10"
      >
        <MapController center={mapTargetCenter} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User GPS Location Marker */}
        {userPos && (
          <Marker position={userPos} icon={createUserLocationIcon()}>
            <Popup>
              <div className="p-1 font-sans text-xs">
                <span className="font-bold text-emerald-600 block">
                  📍 You Are Here
                </span>
                <p className="text-[11px] text-slate-600 mt-0.5">Your current detected position</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Consolidated Venue Markers Supporting Multi-Event Locations */}
        {venuesWithEvents.map(({ venue, events: venueEvents }) => (
          <VenueMarker
            key={venue.id}
            venue={venue}
            venueEvents={venueEvents}
            onSelectEvent={onSelectEvent}
          />
        ))}
      </MapContainer>
    </div>
  );
};
