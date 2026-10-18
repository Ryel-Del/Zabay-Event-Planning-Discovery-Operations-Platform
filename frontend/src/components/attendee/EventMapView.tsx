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

// Custom modern warm marker icon for Leaflet
const createCustomIcon = (_category?: string) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        background: #201D1A;
        color: #FAF9F5;
        padding: 6px;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(32, 29, 26, 0.35);
        border: 2px solid #FAF9F5;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D5A78E" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

export const EventMapView: React.FC<EventMapViewProps> = ({ events, venues, onSelectEvent }) => {
  const defaultCenter: [number, number] = [37.7891, -122.4014];

  return (
    <div className="rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800 shadow-sm bg-[#FAF9F5] dark:bg-[#171513] relative h-[520px]">
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
                <div className="p-1 max-w-[240px] text-stone-900 font-sans">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#885B43]">
                    {event.category}
                  </span>
                  <h4 className="font-bold text-sm leading-snug mt-0.5 text-stone-900">{event.title}</h4>
                  <p className="text-xs text-stone-600 mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-stone-400" />
                    {venue.name}
                  </p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-200 text-xs">
                    <span className="font-bold text-stone-900">${event.ticket_price}</span>
                    <button
                      onClick={() => onSelectEvent(event)}
                      className="px-2.5 py-1 bg-stone-900 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 hover:bg-stone-800 transition-colors"
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
