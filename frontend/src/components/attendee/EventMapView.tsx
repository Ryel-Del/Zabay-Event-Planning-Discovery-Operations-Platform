import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, ArrowRight, Crosshair, Loader2 } from 'lucide-react';
import type { ZabayEvent, Venue } from '../../types';

interface EventMapViewProps {
  events: ZabayEvent[];
  venues: Venue[];
  onSelectEvent: (event: ZabayEvent) => void;
}

// Custom modern marker icon for Leaflet venues
const createCustomIcon = (_category?: string) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        background: #1E293B;
        color: #F8FAFD;
        padding: 6px;
        border-radius: 50%;
        width: 34px;
        height: 34px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 14px rgba(30, 41, 59, 0.4);
        border: 2px solid #86ABDF;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#86ABDF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -34],
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

export const EventMapView: React.FC<EventMapViewProps> = ({ events, venues, onSelectEvent }) => {
  const defaultCenter: [number, number] = [9.64819, 123.85582];
  const [mapTargetCenter, setMapTargetCenter] = useState<[number, number] | null>(null);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);

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

        {/* Event Venues Markers */}
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
                    <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                    <span>{venue.name}{event.hall_name ? ` • ${event.hall_name}` : ''}</span>
                  </p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200 text-xs">
                    <span className="font-bold text-slate-900">₱{event.ticket_price}</span>
                    <button
                      onClick={() => onSelectEvent(event)}
                      className="px-2.5 py-1 bg-[#3E6CB5] hover:bg-[#325896] text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      Details & Tickets <ArrowRight className="w-3 h-3" />
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
