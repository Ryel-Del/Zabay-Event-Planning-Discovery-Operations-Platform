// ==========================================
// ZABAY PLATFORM - SCHEMA DEFINITIONS & TYPES
// Models the 20-table Relational System
// ==========================================

export type UserRole = 'organizer' | 'venue_manager' | 'staff' | 'attendee' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar: string;
  bio?: string;
  organization?: string;
  location?: string;
}

export type EventStatus = 'draft' | 'planning' | 'ready' | 'in_progress' | 'completed' | 'cancelled';
export type EventCategory =
  | 'Sports & Athletics'
  | 'Festivals & Cultural'
  | 'Workshops & Bootcamps'
  | 'Conferences & Seminars'
  | 'School & Youth'
  | 'Community & Civic'
  | 'Music & Concert'
  | 'Tech & Innovation';

export interface EventRequirements {
  min_capacity: number;
  required_facilities: string[];
  power_kw_needed: number;
  requires_indoor: boolean;
  min_setup_hours: number;
  noise_curfew_override?: boolean;
}

export interface EventResourceRequirement {
  id: string;
  event_id: string;
  resource_type: string;
  quantity_required: number;
  unit: string;
}

export interface ZabayEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  event_type: 'public' | 'private' | 'invite_only';
  is_private?: boolean;
  status: EventStatus;
  start_date: string;
  end_date: string;
  organizer_id: string;
  venue_id?: string;
  hall_id?: string;
  hall_name?: string;
  expected_attendance: number;
  max_capacity: number;
  ticket_price: number;
  tickets_sold: number;
  banner_url: string;
  requirements: EventRequirements;
  budget: number;
  created_at: string;
}

export interface VenueHall {
  id: string;
  name: string;
  capacity: number;
  hourly_rate: number;
  is_indoor: boolean;
  facilities: string[];
  dimensions?: string;
  description?: string;
}

export interface Venue {
  id: string;
  name: string;
  city: string;
  address: string;
  lat: number;
  lng: number;
  capacity: number;
  hourly_rate: number;
  facilities: string[];
  power_kw_capacity: number;
  is_indoor: boolean;
  operating_hours: { open: string; close: string };
  manager_id: string;
  image_url: string;
  contact_email: string;
  contact_phone: string;
  halls?: VenueHall[];
}

export interface VenueBooking {
  id: string;
  venue_id: string;
  hall_id?: string;
  hall_name?: string;
  event_id: string;
  event_title: string;
  start_time: string;
  end_time: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

export type ResourceCategory = 'av_equipment' | 'furniture' | 'stage_lighting' | 'catering' | 'safety' | 'sports_equipment' | 'networking';

export interface Resource {
  id: string;
  name: string;
  category: ResourceCategory;
  total_quantity: number;
  available_quantity: number;
  hourly_cost: number;
  unit: string;
}

export interface Personnel {
  id: string;
  name: string;
  role:
    | 'Sound Engineer'
    | 'Lighting Tech'
    | 'Stage Manager'
    | 'Security Lead'
    | 'Registration Staff'
    | 'Catering Supervisor'
    | 'Event Coordinator'
    | 'Tournament Referee'
    | 'Emcee / Host'
    | 'Medical / First Aid'
    | 'Network Admin';
  skills: string[];
  phone: string;
  email: string;
  hourly_rate: number;
  is_available: boolean;
}

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'completed' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskTrack = 'venue_logistics' | 'technical_av' | 'marketing_tickets' | 'day_of_ops';

export interface TaskAssignment {
  personnel_id: string;
  personnel_name: string;
  role: string;
}

export interface ResourceAssignment {
  resource_id: string;
  resource_name: string;
  quantity: number;
}

export interface Task {
  id: string;
  event_id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  start_time: string; // ISO date-time or relative hour
  end_time: string;
  due_date?: string;
  track?: TaskTrack;
  dependencies: string[]; // finish-to-start predecessor task IDs
  personnel_assignments: TaskAssignment[];
  resource_assignments: ResourceAssignment[];
  has_conflict?: boolean;
  conflict_reason?: string;
  downstream_impact_count?: number;
}

export interface Registration {
  id: string;
  event_id: string;
  event_title: string;
  attendee_id: string;
  attendee_name: string;
  attendee_email: string;
  status: 'confirmed' | 'checked_in' | 'cancelled';
  ticket_type: 'General Admission' | 'VIP Access' | 'Speaker / Staff' | 'Courtside Reserved' | 'General Bleachers';
  qr_pass_code: string;
  registered_at: string;
  payment_id?: string;
  amount_paid: number;
}

export interface Payment {
  id: string;
  registration_id: string;
  event_id: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'pending' | 'failed';
  stripe_payment_intent: string;
  paid_at: string;
  card_last4?: string;
}

export interface AttendanceRecord {
  id: string;
  event_id: string;
  registration_id: string;
  attendee_name: string;
  check_in_time: string;
  verified_by: string;
  is_duplicate: boolean;
}

export interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  action: 'TASK_DELAY' | 'VENUE_CHANGE' | 'RESOURCE_OVERALLOCATION' | 'SCHEDULE_REBALANCED' | 'CHECK_IN' | 'RESOURCE_ASSIGNMENT';
  entity_type: 'task' | 'venue' | 'resource' | 'registration';
  entity_id: string;
  change_summary: string;
  created_at: string;
  downstream_ripples?: string[];
}

export interface VenueMatchResult {
  venue_id: string;
  venue_name: string;
  overall_score: number; // 0 - 100%
  is_compatible: boolean;
  capacity_status: { required: number; actual: number; satisfied: boolean };
  facilities_status: { required: string[]; matched: string[]; missing: string[]; satisfied: boolean };
  power_status: { required: number; actual: number; satisfied: boolean };
  schedule_status: { available: boolean; conflict_reason?: string };
}

export interface WorkflowTemplateKit {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  icon: string;
  task_count: number;
  tasks: Omit<Task, 'id' | 'event_id'>[];
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  timestamp: string;
  targetRole?: UserRole | 'all';
  eventId?: string;
  read: boolean;
}
