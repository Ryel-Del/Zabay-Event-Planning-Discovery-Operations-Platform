import type { Venue, ZabayEvent, Task, Registration } from '../types';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  count?: number;
  isDuplicate?: boolean;
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
  attendee_name: string;
  attendee_email: string;
  ticket_type: string;
}

export type DbRegistration = Omit<Registration, 'event_title' | 'attendee_id' | 'amount_paid'> & {
  attendee_id: string | null;
  amount_paid: string | number;
};

export function adaptRegistration(row: DbRegistration, eventTitle: string): Registration {
  return {
    ...row,
    event_title: eventTitle,
    attendee_id: row.attendee_id || '',
    amount_paid: asNumber(row.amount_paid),
  };
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
      return 'Schedule Conflict: This venue or hall has already been reserved for the selected date and time window.';
    case '23505': // unique_violation
      return 'Conflict: A record with this unique identifier or email already exists.';
    case '23503': // foreign_key_violation
      return 'Unable to find associated venue, hall, or user record.';
    case '23514': // check_violation
      return 'Validation Error: Please check input values (e.g., capacity or date/time range).';
    default:
      return message || 'Operation could not be completed. Please try again.';
  }
}

let csrfToken: string | undefined;
async function csrf() {
  if (!csrfToken) {
    const response = await fetch('/api/auth/session');
    csrfToken = (await response.json()).csrfToken;
  }
  return csrfToken;
}
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const mutation = options.method && !['GET', 'HEAD'].includes(options.method);
  const token = mutation && endpoint !== '/api/attendees/register' ? await csrf().catch(() => undefined) : undefined;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'X-CSRF-Token': token } : {}),
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      if (response.status === 401) {
        csrfToken = undefined;
        window.dispatchEvent(new Event('zabay:operator-session-ended'));
      }
      if (!data) {
        return { success: false, error: 'Backend API is unavailable. No database change was confirmed.', code: 'NETWORK_ERROR' };
      }
      const friendlyMessage = translateDbError(data);
      return {
        success: false,
        error: friendlyMessage,
        code: data?.code || (response.status === 401 ? 'UNAUTHORIZED' : response.status === 403 ? 'FORBIDDEN' : undefined),
        isDuplicate: data?.isDuplicate,
      };
    }

    if (data?.csrfToken) csrfToken = data.csrfToken;
    return data as ApiResponse<T>;
  } catch {
    return {
      success: false,
      error: 'Backend API is unavailable. No database change was confirmed.',
      code: 'NETWORK_ERROR',
    };
  }
}

export const api = {
  auth: {
    session: async () => {
      const response = await fetch('/api/auth/session');
      if (!response.ok) throw new Error('Could not check operator session');
      const data = await response.json() as { authenticated: boolean; csrfToken?: string };
      csrfToken = data.authenticated ? data.csrfToken : undefined;
      return data;
    },
    login: async (username: string, password: string) => {
      try {
        const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
        const data = await response.json();
        if (response.ok) csrfToken = data.csrfToken;
        return { success: response.ok, error: data.error };
      } catch {
        return { success: false, error: 'Operator login is unavailable.' };
      }
    },
    logout: async () => {
      try {
        const token = await csrf();
        const response = await fetch('/api/auth/logout', { method: 'POST', headers: { 'X-CSRF-Token': token || '' } });
        if (response.ok || response.status === 401) {
          csrfToken = undefined;
          return { success: true };
        }
        return { success: false, error: 'Operator logout failed. Please retry.' };
      } catch {
        return { success: false, error: 'Operator logout failed. Please retry.' };
      }
    },
    verifyDevKey: (devKey: string) =>
      request<{ message: string; csrfToken?: string }>('/api/auth/verify-key', {
        method: 'POST',
        body: JSON.stringify({ devKey }),
      }),
    register: (payload: {
      name: string;
      email: string;
      password: string;
      role?: string;
      organization?: string;
      phone?: string;
    }) =>
      request<{ user: any; csrfToken?: string }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    userLogin: (payload: { email: string; password: string }) =>
      request<{ user: any; csrfToken?: string }>('/api/auth/user-login', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    firebaseLogin: (idToken: string) =>
      request<{ user: any; csrfToken?: string }>('/api/auth/firebase-login', {
        method: 'POST', body: JSON.stringify({ idToken }),
      }),
    getMe: () =>
      request<{ user: any; csrfToken?: string }>('/api/auth/me'),
    searchUsers: (q?: string) =>
      request<{ users: any[] }>(`/api/auth/search-users${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  },
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
    create: (venueData: Partial<Venue>) =>
      request<DbVenue>('/api/venues', {
        method: 'POST',
        body: JSON.stringify(venueData),
      }),
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
      request<DbRegistration>(`/api/attendees/register`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    checkIn: (qrPassCode: string, eventId?: string) =>
      request<DbRegistration>(
        '/api/attendees/checkin',
        {
          method: 'POST',
          body: JSON.stringify({ qr_pass_code: qrPassCode, event_id: eventId }),
        }
      ),
  },
};

export default api;
