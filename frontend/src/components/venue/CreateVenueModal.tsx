import React, { useState } from 'react';
import {
  X,
  Trophy,
  Clock,
  Zap,
  Users,
  Check,
  Plus,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Venue, VenueHall } from '../../types';

interface CreateVenueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVenueCreated?: (venue: Venue) => void;
}

const BOHOL_CITIES = [
  'Tagbilaran City',
  'Panglao',
  'Dauis',
  'Baclayon',
  'Tubigon',
  'Carmen',
  'Jagna',
  'Loon',
  'Talibon',
  'Ubay',
];

const PRESET_SPORTS_CATEGORIES = [
  {
    id: 'basketball',
    label: 'Basketball & Volleyball Arena',
    icon: '🏀',
    defaultFacilities: [
      'Indoor Arena Hardwood Court',
      'Electronic Digital Scoreboards',
      'Bleacher Seating System',
      'Dedicated Gigabit Fiber WiFi',
      'Wheelchair & ADA Accessible',
    ],
    defaultRate: 2500,
    defaultCap: 2500,
    isIndoor: true,
    image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'track',
    label: 'Athletics & Track Oval Complex',
    icon: '🏃',
    defaultFacilities: [
      'Olympic 8-Lane Rubberized Tartan Track Oval',
      'Grandstand Bleacher Seating (12,000 capacity)',
      'High-Intensity Stadium Floodlights',
      'Athlete Locker Rooms & Shower Facilities',
      'Ambulance & Emergency Medical Staging Bay',
    ],
    defaultRate: 3500,
    defaultCap: 8000,
    isIndoor: false,
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'sand',
    label: 'Beach Volleyball & Sand Court',
    icon: '🏐',
    defaultFacilities: [
      'Dual Regulation Beach Volleyball Quartz Sand Courts',
      'Outdoor Rinse Showers & Changing Cabanas',
      'Beachfront Spectator Bleachers',
      'Night Floodlights',
    ],
    defaultRate: 1800,
    defaultCap: 1200,
    isIndoor: false,
    image: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'badminton',
    label: 'Badminton & Racket Sports Hub',
    icon: '🏸',
    defaultFacilities: [
      '4-Court Synthetic Badminton Floor Mats',
      'Electronic Digital Scoreboard',
      'Locker & Shower Rooms',
      'Public Address Sound System',
    ],
    defaultRate: 1500,
    defaultCap: 1500,
    isIndoor: true,
    image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'convention',
    label: 'Convention Center & Plenary Hall',
    icon: '🏛️',
    defaultFacilities: [
      'Dedicated Gigabit Fiber WiFi',
      '4K Laser Projection System',
      'Dual Keynote Stages',
      'Backstage VIP Green Rooms',
      'Surround Line-Array Sound',
      'Wheelchair & ADA Accessible',
    ],
    defaultRate: 4000,
    defaultCap: 2000,
    isIndoor: true,
    image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80',
  },
];

const COMMON_FACILITIES = [
  'Indoor Arena Hardwood Court',
  'Olympic 8-Lane Rubberized Tartan Track Oval',
  'Dual Regulation Beach Volleyball Quartz Sand Courts',
  '4-Court Synthetic Badminton Floor Mats',
  'Electronic Digital Scoreboards',
  'High-Intensity Stadium Floodlights',
  'Bleacher Seating System',
  'Athlete Locker Rooms & Shower Facilities',
  'Ambulance & Emergency Medical Staging Bay',
  'Dedicated Gigabit Fiber WiFi',
  'Concert PA & Audio System',
  '4K LED Wall & Displays',
  'Commercial Prep Kitchen',
  'Wheelchair & ADA Accessible',
  'Standby Generator Backup',
];

export const CreateVenueModal: React.FC<CreateVenueModalProps> = ({
  isOpen,
  onClose,
  onVenueCreated,
}) => {
  const { addVenue, currentUser } = useApp();

  const [name, setName] = useState('');
  const [city, setCity] = useState('Tagbilaran City');
  const [address, setAddress] = useState('');
  const [capacity, setCapacity] = useState<number>(2000);
  const [hourlyRate, setHourlyRate] = useState<number>(2500);
  const [powerKw, setPowerKw] = useState<number>(250);
  const [isIndoor, setIsIndoor] = useState<boolean>(true);
  const [openTime, setOpenTime] = useState('06:00');
  const [closeTime, setCloseTime] = useState('22:00');
  const [contactEmail, setContactEmail] = useState('sports@bohol.gov.ph');
  const [contactPhone, setContactPhone] = useState('+63 (38) 411-2800');
  const [imageUrl, setImageUrl] = useState(PRESET_SPORTS_CATEGORIES[0].image);
  const [lat, setLat] = useState<number>(9.6496);
  const [lng, setLng] = useState<number>(123.8624);
  const [selectedLocationPreset, setSelectedLocationPreset] = useState<string>('tagbilaran');
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>(
    PRESET_SPORTS_CATEGORIES[0].defaultFacilities
  );

  const BOHOL_LOCATION_PRESETS = [
    { id: 'tagbilaran', name: 'Tagbilaran City Center (CPG Ave)', city: 'Tagbilaran City', address: 'CPG Avenue, Tagbilaran City, Bohol', lat: 9.6496, lng: 123.8624 },
    { id: 'cultural_center', name: 'Bohol Cultural Center', city: 'Tagbilaran City', address: 'J.A. Clarin St, Cogon District, Tagbilaran City, Bohol', lat: 9.6482, lng: 123.8558 },
    { id: 'cpg_sports', name: 'CPG Sports Complex & Oval', city: 'Tagbilaran City', address: 'CPG Sports Complex, Dampas, Tagbilaran City, Bohol', lat: 9.6445, lng: 123.8580 },
    { id: 'hnu_gym', name: 'HNU Barder Gymnasium', city: 'Tagbilaran City', address: 'Janssen Heights, Dampas District, Tagbilaran City, Bohol', lat: 9.6504, lng: 123.8679 },
    { id: 'bws_gym', name: 'Bohol Wisdom School Gymnasium', city: 'Tagbilaran City', address: 'CPG North Avenue, Cogon District, Tagbilaran City, Bohol', lat: 9.6606, lng: 123.8561 },
    { id: 'panglao', name: 'Panglao Convention Pavilion', city: 'Panglao', address: 'Tawala, Panglao, Bohol', lat: 9.5785, lng: 123.7745 },
    { id: 'tubigon', name: 'Tubigon Sports Complex', city: 'Tubigon', address: 'Centro, Tubigon, Bohol', lat: 9.9515, lng: 123.9620 },
  ];

  const handleApplyLocationPreset = (presetId: string) => {
    setSelectedLocationPreset(presetId);
    const preset = BOHOL_LOCATION_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setCity(preset.city);
      setAddress(preset.address);
      setLat(preset.lat);
      setLng(preset.lng);
    }
  };

  // Sub-Halls / Sub-Courts Builder
  const [halls, setHalls] = useState<
    Array<{
      id?: string;
      name: string;
      capacity: number;
      hourly_rate: number;
      dimensions: string;
      facilities: string[];
      description: string;
    }>
  >([
    {
      name: 'Main Tournament Court 1',
      capacity: 1800,
      hourly_rate: 2500,
      dimensions: '32m x 20m (640 sqm)',
      facilities: ['Hardwood Court', 'Electronic Scoreboard', 'Bleachers'],
      description: 'Championship court with regulation dimensions, electronic matrix, and broadcast camera stands.',
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: (typeof PRESET_SPORTS_CATEGORIES)[0]) => {
    setName((prev) => prev ? prev : `${preset.label}`);
    setCapacity(preset.defaultCap);
    setHourlyRate(preset.defaultRate);
    setIsIndoor(preset.isIndoor);
    setImageUrl(preset.image);
    setSelectedFacilities(preset.defaultFacilities);
    setHalls([
      {
        name: `${preset.label} — Court A`,
        capacity: preset.defaultCap,
        hourly_rate: preset.defaultRate,
        dimensions: preset.isIndoor ? '32m x 20m (640 sqm)' : '400m Oval Track',
        facilities: preset.defaultFacilities.slice(0, 3),
        description: `Primary competition and tournament facility configured for ${preset.label.toLowerCase()}.`,
      },
    ]);
  };

  const handleToggleFacility = (facility: string) => {
    setSelectedFacilities((prev) =>
      prev.includes(facility) ? prev.filter((f) => f !== facility) : [...prev, facility]
    );
  };

  const handleAddHall = () => {
    setHalls((prev) => [
      ...prev,
      {
        name: `Court / Sub-Facility ${prev.length + 1}`,
        capacity: Math.round(capacity * 0.4),
        hourly_rate: Math.round(hourlyRate * 0.6),
        dimensions: '24m x 15m (360 sqm)',
        facilities: selectedFacilities.slice(0, 2),
        description: 'Secondary court for elimination brackets and warmups.',
      },
    ]);
  };

  const handleRemoveHall = (index: number) => {
    setHalls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleHallChange = (index: number, field: string, value: any) => {
    setHalls((prev) =>
      prev.map((h, i) => (i === index ? { ...h, [field]: value } : h))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Please enter a facility or venue name.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const formattedHalls: VenueHall[] = halls.map((h, i) => ({
        id: `vh-custom-${Date.now()}-${i}`,
        name: h.name.trim() || `Court ${i + 1}`,
        capacity: Number(h.capacity) || 500,
        hourly_rate: Number(h.hourly_rate) || 1000,
        is_indoor: isIndoor,
        dimensions: h.dimensions || '28m x 15m',
        facilities: h.facilities,
        description: h.description,
      }));

      const newVenue = await addVenue({
        name: name.trim(),
        city,
        address: address.trim() || `${city}, Bohol`,
        lat: Number(lat) || 9.6496,
        lng: Number(lng) || 123.8624,
        capacity: Number(capacity) || 1000,
        hourly_rate: Number(hourlyRate) || 1500,
        facilities: selectedFacilities,
        power_kw_capacity: Number(powerKw) || 200,
        is_indoor: isIndoor,
        operating_hours: { open: openTime, close: closeTime },
        manager_id: currentUser?.id || 'usr-vm-1',
        image_url: imageUrl || PRESET_SPORTS_CATEGORIES[0].image,
        contact_email: contactEmail.trim(),
        contact_phone: contactPhone.trim(),
        halls: formattedHalls,
      });

      setSuccessMessage(`Successfully registered "${newVenue.name}"!`);
      if (onVenueCreated) {
        onVenueCreated(newVenue);
      }

      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to register venue. Please check inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl bg-white dark:bg-[#171E2B] border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-800 dark:text-slate-100 transition-colors">
        {/* Header */}
        <div className="p-6 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Register Facility or Sports Court</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Register courts, arenas, gymnasiums, and venues for Bohol tournaments and events.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Preset Buttons */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Quick Fill by Sports & Venue Category:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {PRESET_SPORTS_CATEGORIES.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-400/60 dark:hover:border-amber-500/60 bg-white dark:bg-[#111722] hover:bg-amber-50/30 dark:hover:bg-amber-950/20 text-left transition-all group flex flex-col justify-between"
                >
                  <span className="text-lg mb-1">{preset.icon}</span>
                  <span className="font-semibold text-[11px] text-slate-800 dark:text-slate-200 group-hover:text-amber-600 dark:group-hover:text-amber-400">
                    {preset.label}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1">
                    ₱{preset.defaultRate.toLocaleString()}/hr
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Facility / Venue Name *
              </label>
              <input
                type="text"
                placeholder="e.g. CPG Sports Complex - Court C"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#3E6CB5]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                City / Municipality (Bohol)
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#3E6CB5]"
              >
                {BOHOL_CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Specific Street Address / Landmark
              </label>
              <input
                type="text"
                placeholder="e.g. CPG North Avenue, Cogon District, Tagbilaran City"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#3E6CB5]"
              />
            </div>

            {/* Exact GPS Coordinates & Bohol Location Presets */}
            <div className="md:col-span-2 p-3.5 rounded-2xl bg-[#FAF9F5] dark:bg-[#12161F] border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <span className="text-emerald-600 dark:text-emerald-400">📍</span>
                  Exact GPS Coordinates & Location Presets
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Used for interactive public map positioning
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Quick-Fill Bohol Location Preset:
                </label>
                <select
                  value={selectedLocationPreset}
                  onChange={(e) => handleApplyLocationPreset(e.target.value)}
                  className="w-full bg-white dark:bg-[#171E2B] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 font-medium focus:outline-none cursor-pointer"
                >
                  {BOHOL_LOCATION_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.lat.toFixed(4)}, {p.lng.toFixed(4)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    Latitude (°N) *
                  </label>
                  <input
                    type="number"
                    step="0.00001"
                    placeholder="9.6496"
                    value={lat}
                    onChange={(e) => setLat(Number(e.target.value))}
                    required
                    className="w-full bg-white dark:bg-[#171E2B] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    Longitude (°E) *
                  </label>
                  <input
                    type="number"
                    step="0.00001"
                    placeholder="123.8624"
                    value={lng}
                    onChange={(e) => setLng(Number(e.target.value))}
                    required
                    className="w-full bg-white dark:bg-[#171E2B] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Capacity, Rates & Power */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-blue-500" />
                Max Spectator / Attendee Capacity
              </label>
              <input
                type="number"
                min={10}
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="w-full bg-white dark:bg-[#111722] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <span>₱</span>
                Hourly Rental Rate (PHP)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 font-bold">₱</span>
                <input
                  type="number"
                  min={0}
                  step={50}
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value))}
                  className="w-full pl-8 bg-white dark:bg-[#111722] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-semibold"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                Power Grid Capacity (kW)
              </label>
              <input
                type="number"
                min={10}
                value={powerKw}
                onChange={(e) => setPowerKw(Number(e.target.value))}
                className="w-full bg-white dark:bg-[#111722] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-semibold"
              />
            </div>
          </div>

          {/* Environment & Operating Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Facility Environment
              </label>
              <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsIndoor(true)}
                  className={`flex-1 py-2 font-medium transition-colors ${
                    isIndoor
                      ? 'bg-[#3E6CB5] text-white font-bold'
                      : 'bg-white dark:bg-[#111722] text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Indoor / Covered
                </button>
                <button
                  type="button"
                  onClick={() => setIsIndoor(false)}
                  className={`flex-1 py-2 font-medium transition-colors ${
                    !isIndoor
                      ? 'bg-amber-600 text-white font-bold'
                      : 'bg-white dark:bg-[#111722] text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Outdoor / Open-Air
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Opening Time
              </label>
              <input
                type="time"
                value={openTime}
                onChange={(e) => setOpenTime(e.target.value)}
                className="w-full bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Closing Time
              </label>
              <input
                type="time"
                value={closeTime}
                onChange={(e) => setCloseTime(e.target.value)}
                className="w-full bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Facilities Checklist */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Facilities & Athletic Features Checklist
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800">
              {COMMON_FACILITIES.map((facility) => {
                const checked = selectedFacilities.includes(facility);
                return (
                  <button
                    key={facility}
                    type="button"
                    onClick={() => handleToggleFacility(facility)}
                    className={`flex items-center gap-2 p-2 rounded-xl text-left transition-all ${
                      checked
                        ? 'bg-[#EBF3FC] text-[#244A85] dark:bg-[#1E293B] dark:text-[#8BB0E8] font-bold border border-[#C8DCF7] dark:border-[#2D4160]'
                        : 'bg-white dark:bg-[#111722] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 ${
                        checked ? 'bg-[#3E6CB5] text-white' : 'border border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {checked && <Check className="w-3 h-3" />}
                    </div>
                    <span className="text-[11px] leading-tight">{facility}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sub-Courts / Sub-Halls Builder */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                  Courts & Sub-Facility Zones ({halls.length})
                </h4>
                <p className="text-[11px] text-slate-500">
                  Allows double-booking prevention for specific courts (e.g. Court A vs Court B).
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddHall}
                className="px-3 py-1.5 rounded-xl bg-[#EBF3FC] text-[#244A85] dark:bg-[#1E293B] dark:text-[#8BB0E8] border border-[#C8DCF7] dark:border-[#2D4160] hover:bg-[#3E6CB5] hover:text-white transition-colors flex items-center gap-1 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Court
              </button>
            </div>

            <div className="space-y-3">
              {halls.map((hall, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-white dark:bg-[#111722] border border-slate-200 dark:border-slate-800 space-y-2 relative"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-500 text-[11px]">Court / Zone #{idx + 1}</span>
                    {halls.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveHall(idx)}
                        className="text-red-500 hover:text-red-700 p-1 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Court name (e.g. Center Court)"
                      value={hall.name}
                      onChange={(e) => handleHallChange(idx, 'name', e.target.value)}
                      className="bg-[#F8FAFD] dark:bg-[#171E2B] border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                    />
                    <input
                      type="number"
                      placeholder="Capacity"
                      value={hall.capacity}
                      onChange={(e) => handleHallChange(idx, 'capacity', Number(e.target.value))}
                      className="bg-[#F8FAFD] dark:bg-[#171E2B] border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                    />
                    <div className="relative">
                      <span className="absolute left-2.5 top-1.5 text-slate-400 font-bold text-xs">₱</span>
                      <input
                        type="number"
                        placeholder="Hourly Rate"
                        value={hall.hourly_rate}
                        onChange={(e) => handleHallChange(idx, 'hourly_rate', Number(e.target.value))}
                        className="w-full pl-6 bg-[#F8FAFD] dark:bg-[#171E2B] border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <input
                    type="text"
                    placeholder="Brief description or court specifications (e.g. FIBA hardwood with digital clock)"
                    value={hall.description}
                    onChange={(e) => handleHallChange(idx, 'description', e.target.value)}
                    className="w-full bg-[#F8FAFD] dark:bg-[#171E2B] border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-900 dark:text-slate-100"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Contact & Image URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Contact Email
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Contact Phone
              </label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                Cover Photo URL
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Feedback messages */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 font-medium">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {successMessage}
            </div>
          )}

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {isSubmitting ? 'Registering Facility...' : 'Register Venue / Court'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
