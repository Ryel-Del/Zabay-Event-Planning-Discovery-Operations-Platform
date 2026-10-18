import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, ArrowRight } from 'lucide-react';
import type { ZabayEvent, Venue } from '../../types';

interface EventMapViewProps {
  events: ZabayEvent[];
  venues: Venue[];
  onSelectEvent: (event: ZabayEvent) => void;
}

// Custom modern SVG marker icon for Leaflet
const createCustomIcon = (_category?: string) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        color: white;
        padding: 6px;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.5);
        border: 2px solid white;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

export const EventMapView: React.FC<EventMapViewProps> = ({ events, venues, onSelectEvent }) => {
  // Center roughly on San Francisco
  const defaultCenter: [number, number] = [37.7891, -122.4014];

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-800 shadow-xl bg-slate-950 relative h-[520px]">
      <MapContainer
        center={defaultCenter}
        zoom={13}
        scrollWheelZoom={false}
        className="w-full h-full z-10"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {events.map((event) => {
          const venue = venues.find((v) => v.id === event.venue_id);
          if (!venue) return null;

          return (
            <Marker
              key={event.id}
              position={[venue.lat, venue.lng]}
              icon={createCustomIcon(event.category)}
            >
              <Popup className="zabay-leaflet-popup">
                <div className="p-1 max-w-[240px] text-slate-900 font-sans">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                    {event.category}
                  </span>
                  <h4 className="font-bold text-sm leading-snug mt-0.5">{event.title}</h4>
                  <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {venue.name}
                  </p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200 text-xs">
                    <span className="font-bold text-indigo-700">${event.ticket_price}</span>
                    <button
                      onClick={() => onSelectEvent(event)}
                      className="px-2.5 py-1 bg-indigo-600 text-white rounded text-[11px] font-bold flex items-center gap-1 hover:bg-indigo-700 transition-colors"
                    >
                      Tickets <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
