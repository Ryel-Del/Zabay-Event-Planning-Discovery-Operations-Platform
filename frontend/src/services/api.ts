import type { Venue, ZabayEvent, Task } from '../types';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  count?: number;
}

export interface VenueBookingRequest {
  event_id: string;
  event_title: string;
  start_time: string; // ISO string
  end_time: string;   // ISO string
  hall_id?: string;
  hall_name?: string;
}

export interface AttendeeRegistrationRequest {
  event_id: string;
  name: string;
  email: string;
  ticket_type: string;
  notes?: string;
}

export interface HealthStatus {
  status: string;
  timestamp: string;
  service: string;
  region: string;
}

interface DbVenue extends Omit<Venue, 'operating_hours' | 'halls'> {
  operating_hours_open: string;
  operating_hours_close: string;
  halls: Venue['halls'];
  bookings?: import('../types').VenueBooking[];
}

const asNumber = (value: number | string | null | undefined) => Number(value || 0);

export function adaptVenue(row: any): Venue {
  return {
    ...row,
    lat: asNumber(row.lat), lng: asNumber(row.lng),
    hourly_rate: asNumber(row.hourly_rate),
    operating_hours: { open: row.operating_hours_open, close: row.operating_hours_close },
    image_url: row.image_url || '/zabay-logo.png',
    halls: (row.halls || []).map((hall: any) => ({ ...hall, hourly_rate: asNumber(hall.hourly_rate) })),
  };
}

export function adaptEvent(row: any): ZabayEvent {
  return {
    ...row,
    venue_id: row.venue_id || undefined,
    hall_id: row.hall_id || undefined,
    hall_name: row.hall_name || undefined,
    description: row.description || '',
    ticket_price: asNumber(row.ticket_price),
    budget: asNumber(row.budget),
    tickets_sold: 0,
    banner_url: row.banner_url || '/zabay-logo.png',
    requirements: {
      min_capacity: row.expected_attendance,
      power_kw_needed: 0,
      requires_indoor: false,
      required_facilities: [],
      min_setup_hours: 0,
    },
  };
}

/**
 * Translates PostgreSQL error codes into user-friendly messages for the UI
 */
export function translateDbError(errData: any): string {
  if (!errData) return 'An unexpected error occurred.';

  const code = errData.code;
  const message = errData.error || errData.message;

  switch (code) {
    case '23P01': // exclusion_violation
      return 'Double-Booking Collision Detected: This hall has already been reserved for the selected date and time window. The PostgreSQL temporal constraint prevented an overlap.';
    case '23505': // unique_violation
      return 'Conflict: A record with this unique identifier or email already exists.';
    case '23503': // foreign_key_violation
      return 'Referential Integrity Error: Associated venue, hall, or user record was not found.';
    case '23514': // check_violation
      return 'Validation Error: Values violated database business rules (e.g., negative capacity or invalid time range).';
    default:
      return message || 'A database operation failed.';
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const friendlyMessage = translateDbError(data);
      return {
        success: false,
        error: friendlyMessage,
        code: data?.code,
      };
    }

    return data as ApiResponse<T>;
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Network error: Unable to connect to the backend API server.',
      code: 'NETWORK_ERROR',
    };
  }
}

export const api = {
  // System Health
  health: {
    check: async (): Promise<ApiResponse<HealthStatus>> => {
      try {
        const response = await fetch('/api/health');
        const data = await response.json();
        return response.ok && data?.status === 'online'
          ? { success: true, data }
          : { success: false, error: 'Backend health check failed.' };
      } catch {
        return { success: false, error: 'Backend API is unavailable.' };
      }
    },
  },

  // Venues & Sub-Venues (Halls)
  venues: {
    getAll: () => request<DbVenue[]>('/api/venues'),
    getById: (id: string) => request<DbVenue>(`/api/venues/${id}`),
    book: (venueId: string, booking: VenueBookingRequest) =>
      request<{ id: string; venue_id: string; hall_id?: string; status: string }>(
        `/api/venues/${venueId}/book`,
        {
          method: 'POST',
          body: JSON.stringify(booking),
        }
      ),
  },

  // Events Operations
  events: {
    getAll: () => request<any[]>('/api/events'),
    getById: (id: string) => request<any>(`/api/events/${id}`),
    create: (eventData: Partial<ZabayEvent>) =>
      request<any>('/api/events', {
        method: 'POST',
        body: JSON.stringify(eventData),
      }),
  },

  // Task Operations
  tasks: {
    getAll: () => request<Task[]>('/api/tasks'),
    updateStatus: (taskId: string, status: string) =>
      request<{ id: string; status: string }>(`/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
  },

  // Attendee & Ticket Operations
  attendees: {
    register: (payload: AttendeeRegistrationRequest) =>
      request<{ id: string; ticket_id: string }>(`/api/attendees/register`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    checkIn: (ticketId: string) =>
      request<{ success: boolean; attendee_id: string; checked_in_at: string }>(
        '/api/attendees/checkin',
        {
          method: 'POST',
          body: JSON.stringify({ ticket_id: ticketId }),
        }
      ),
  },
};

export default api;
