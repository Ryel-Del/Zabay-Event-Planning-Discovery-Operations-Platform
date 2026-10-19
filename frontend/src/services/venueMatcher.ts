import type { Venue, ZabayEvent, VenueBooking } from '../types';

export interface VenueMatchResult {
  venue_id: string;
  venue_name: string;
  overall_score: number;
  is_compatible: boolean;
  capacity_status: {
    required: number;
    actual: number;
    satisfied: boolean;
  };
  facilities_status: {
    required: string[];
    matched: string[];
    missing: string[];
    satisfied: boolean;
  };
  power_status: {
    required: number;
    actual: number;
    satisfied: boolean;
  };
  schedule_status: {
    available: boolean;
    conflict_reason?: string;
  };
}

/**
 * Requirement-Based Venue Matching: mimics PostgreSQL `fn_match_venue_to_event(event_id, venue_id)`
 */
export function calculateVenueMatch(
  event: ZabayEvent | null,
  venue: Venue,
  venueBookings: VenueBooking[],
  hallId?: string
): VenueMatchResult {
  if (!event) {
    return {
      venue_id: venue.id,
      venue_name: venue.name,
      overall_score: 100,
      is_compatible: true,
      capacity_status: { required: 100, actual: venue.capacity, satisfied: true },
      facilities_status: { required: [], matched: venue.facilities, missing: [], satisfied: true },
      power_status: { required: 25, actual: venue.power_kw_capacity, satisfied: true },
      schedule_status: { available: true },
    };
  }

  const selectedHall = hallId ? venue.halls?.find((h) => h.id === hallId) : undefined;
  const effectiveCapacity = selectedHall ? selectedHall.capacity : venue.capacity;
  const effectiveFacilities = selectedHall ? [...venue.facilities, ...selectedHall.facilities] : venue.facilities;

  const req = event.requirements;

  // 1. Capacity check
  const capacitySatisfied = effectiveCapacity >= req.min_capacity;

  // 2. Facilities check
  const matchedFacilities = req.required_facilities.filter((f) =>
    effectiveFacilities.some(
      (vf) => vf.toLowerCase().includes(f.toLowerCase()) || f.toLowerCase().includes(vf.toLowerCase())
    )
  );
  const missingFacilities = req.required_facilities.filter((f) => !matchedFacilities.includes(f));
  const facilitiesSatisfied = missingFacilities.length === 0;

  // 3. Power check
  const powerSatisfied = venue.power_kw_capacity >= req.power_kw_needed;

  // 4. Booking conflict check (PostgreSQL EXCLUDE constraint check)
  const existingBookings = venueBookings.filter(
    (b) => b.venue_id === venue.id && b.event_id !== event.id && b.status === 'confirmed'
  );

  const hasBookingConflict = existingBookings.some((b) => {
    // If checking specific hall, collision only occurs if same hall or whole venue
    if (hallId && b.hall_id && b.hall_id !== hallId) {
      return false;
    }
    const bStart = new Date(b.start_time).getTime();
    const bEnd = new Date(b.end_time).getTime();
    const eStart = new Date(event.start_date).getTime();
    const eEnd = new Date(event.end_date).getTime();
    return Math.max(bStart, eStart) < Math.min(bEnd, eEnd);
  });

  // Score calculation
  let score = 0;
  if (capacitySatisfied) score += 30;
  else score += Math.max(0, Math.floor((effectiveCapacity / req.min_capacity) * 30));

  const facilityRatio = req.required_facilities.length > 0
    ? matchedFacilities.length / req.required_facilities.length
    : 1;
  score += Math.floor(facilityRatio * 40);

  if (powerSatisfied) score += 20;
  else score += Math.max(0, Math.floor((venue.power_kw_capacity / req.power_kw_needed) * 20));

  if (!hasBookingConflict) score += 10;

  const isCompatible = capacitySatisfied && facilitiesSatisfied && powerSatisfied && !hasBookingConflict;

  return {
    venue_id: venue.id,
    venue_name: venue.name,
    overall_score: Math.min(100, Math.max(0, score)),
    is_compatible: isCompatible,
    capacity_status: {
      required: req.min_capacity,
      actual: effectiveCapacity,
      satisfied: capacitySatisfied,
    },
    facilities_status: {
      required: req.required_facilities,
      matched: matchedFacilities,
      missing: missingFacilities,
      satisfied: facilitiesSatisfied,
    },
    power_status: {
      required: req.power_kw_needed,
      actual: venue.power_kw_capacity,
      satisfied: powerSatisfied,
    },
    schedule_status: {
      available: !hasBookingConflict,
      conflict_reason: hasBookingConflict
        ? 'EXCLUDE constraint violation: overlapping confirmed booking detected on selected dates.'
        : undefined,
    },
  };
}
