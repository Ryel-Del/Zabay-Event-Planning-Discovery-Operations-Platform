import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import type {
  User,
  UserRole,
  ZabayEvent,
  Venue,
  VenueBooking,
  Resource,
  Personnel,
  Task,
  TaskStatus,
  Registration,
  AuditLog,
  VenueMatchResult,
  WorkflowTemplateKit,
  AppNotification,
  EventCommitteeRoleMap,
  StaffInvitation,
  StaffInvitationStatus,
  CrewChatMessage,
} from '../types';
import {
  guestUser,
  mockCurrentUser,
  mockEvents,
  mockVenues,
  mockVenueBookings,
  mockResources,
  mockPersonnel,
  mockTasks,
  mockWorkflowKits,
  mockRegistrations,
  mockAuditLogs,
  mockStaffInvitations,
  mockCrewMessages,
} from '../mock/mockData';
import api, { adaptEvent, adaptRegistration, adaptVenue, type HealthStatus } from '../services/api';

interface AppContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  operatorAuthenticated: boolean;
  signOut: () => void;

  theme: 'light' | 'dark';
  toggleTheme: () => void;

  isDemoMode: boolean;
  loadDemoData: () => void;
  clearToCleanSlate: () => void;

  // Developer & Evaluation DevCode System
  isDevModeUnlocked: boolean;
  unlockedDevCode: string | null;
  unlockDevMode: (code: string) => Promise<{ success: boolean; message: string; devCode?: string }>;
  lockDevMode: () => void;
  loadRole2DemoData: () => void;

  // Live Database & API Status (Member 3 Connector)
  isLiveBackend: boolean;
  backendHealth: HealthStatus | null;
  refreshBackendStatus: () => Promise<void>;

  // Notification & Event Change Propagation System
  notifications: AppNotification[];
  unreadNotificationCount: number;
  dismissNotification: (id: string) => void;
  broadcastEventChange: (changeDetails: {
    eventId: string;
    eventTitle?: string;
    oldVenue?: string;
    newVenue?: string;
    oldTime?: string;
    newTime?: string;
    summary: string;
  }) => void;

  events: ZabayEvent[];
  selectedEvent: ZabayEvent | null;
  setSelectedEvent: (event: ZabayEvent | null) => void;
  createEvent: (eventData: Partial<ZabayEvent>) => Promise<ZabayEvent>;

  venues: Venue[];
  addVenue: (venueData: Omit<Venue, 'id'>) => Promise<Venue>;
  venueBookings: VenueBooking[];
  resources: Resource[];
  personnel: Personnel[];
  tasks: Task[];
  workflowKits: WorkflowTemplateKit[];
  registrations: Registration[];
  auditLogs: AuditLog[];

  // Database-simulation operations
  fnDownstreamImpact: (taskId: string) => { affectedTaskIds: string[]; totalAffected: number };
  fnScheduleImpact: (taskId: string, delayMinutes: number) => {
    affectedTasks: { id: string; title: string; newStart: string; newEnd: string; conflict: boolean }[];
    hasConflicts: boolean;
  };
  fnMatchVenueToEvent: (eventId: string, venueId: string) => VenueMatchResult;
  applyTaskDelay: (taskId: string, delayMinutes: number, reason: string) => void;
  resetTasksToDefault: () => void;
  addTask: (task: Omit<Task, 'id'>) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  loadTaskTemplate: (kitId: string) => void;
  committeeRoles: EventCommitteeRoleMap;
  setCommitteeRoles: React.Dispatch<React.SetStateAction<EventCommitteeRoleMap>>;
  propagateCommitteeRoles: (newRoles: EventCommitteeRoleMap, preserveOverrides?: boolean) => { updatedCount: number };
  checkInAttendee: (
    qrCode: string,
    targetEventId?: string
  ) => Promise<{
    success: boolean;
    message: string;
    registration?: Registration;
    isDuplicate?: boolean;
    isWrongEvent?: boolean;
  }>;
  bookVenue: (
    venueId: string,
    eventId: string,
    startTime: string,
    endTime: string,
    hallId?: string,
    eventTitle?: string
  ) => Promise<{ success: boolean; message: string }>;
  registerForEvent: (eventId: string, ticketType: 'General Admission' | 'VIP Access', attendeeName: string, attendeeEmail: string) => Promise<{ success: boolean; message: string; registration?: Registration }>;
  addPersonnel: (data: Omit<Personnel, 'id'>) => Personnel;
  updatePersonnel: (id: string, updates: Partial<Personnel>) => void;
  removePersonnel: (id: string) => void;

  // Staff Invitations & Crew Group System
  staffInvitations: StaffInvitation[];
  sendStaffInvitation: (invitation: Omit<StaffInvitation, 'id' | 'status' | 'invited_at'>) => StaffInvitation;
  respondToStaffInvitation: (invitationId: string, accept: boolean) => void;

  // Real-time Event Crew Group Chat (GC)
  crewMessages: CrewChatMessage[];
  sendCrewMessage: (eventId: string, message: string, isAnnouncement?: boolean) => void;

  // Venue Layout Forking
  forkVenueLayout: (venueId: string, eventId: string, customName?: string) => Venue;

  // Staff Portal Preview & Crew Inspection
  activeStaffId: string | null;
  setActiveStaffId: (id: string | null) => void;
  previewStaffPortal: (staffId?: string) => void;
  exitStaffPreview: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper to convert time "HH:mm" to minutes from midnight
const timeToMinutes = (timeStr: string) => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

// Helper to convert minutes from midnight to "HH:mm"
const minutesToTime = (mins: number) => {
  const normMins = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(normMins / 60).toString().padStart(2, '0');
  const m = (normMins % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('zabay-user');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // ignore
        }
      }
    }
    return guestUser;
  });

  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    if (typeof window !== 'undefined') {
      const savedRole = localStorage.getItem('zabay-role') as UserRole;
      if (savedRole) return savedRole;
    }
    return 'attendee';
  });

  const [activeStaffId, setActiveStaffId] = useState<string | null>(null);

  const previewStaffPortal = (staffId?: string) => {
    if (!isDemoMode && !operatorAuthenticated && currentUser.role !== 'organizer') return;
    const targetStaffId = staffId || 'per-3';
    setActiveStaffId(targetStaffId);
    setCurrentRole('staff');
  };

  const exitStaffPreview = () => {
    setActiveStaffId(null);
    setRoleWithUser('organizer');
  };

  const setRoleWithUser = (role: UserRole) => {
    if (role !== 'staff') setActiveStaffId(null);
    if (!isDemoMode) {
      if (operatorAuthenticated || role === currentUser.role || role === 'attendee') setCurrentRole(role);
      return;
    }
    setCurrentRole(role);
    if (typeof window !== 'undefined') {
      localStorage.setItem('zabay-role', role);
    }
    // Multi-role capability in one account:
    // Update the active session role while preserving user account identity & profile
    setCurrentUser((prevUser) => {
      const existingRoles = prevUser.roles || [prevUser.role];
      const updatedRoles = existingRoles.includes(role) ? existingRoles : [prevUser.role];
      const updatedUser = {
        ...prevUser,
        role,
        roles: updatedRoles,
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('zabay-user', JSON.stringify(updatedUser));
      }
      return updatedUser;
    });
  };

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('zabay-theme') : null;
    return saved === 'light' ? 'light' : 'dark';
  });

  React.useEffect(() => {
    localStorage.setItem('zabay-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const computeSha256 = async (message: string): Promise<string> => {
    try {
      const msgBuffer = new TextEncoder().encode(message.trim());
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      return '';
    }
  };

  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('zabay-clean-slate') === 'true') return false;
      return true;
    }
    return true;
  });

  const [isDevModeUnlocked, setIsDevModeUnlocked] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('zabay-dev-unlocked') === 'true';
    }
    return false;
  });

  const [unlockedDevCode, setUnlockedDevCode] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      if (sessionStorage.getItem('zabay-dev-unlocked') === 'true') {
        return sessionStorage.getItem('zabay-dev-code') || 'AUTHORIZED';
      }
    }
    return null;
  });

  const [events, setEvents] = useState<ZabayEvent[]>(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('zabay-clean-slate') === 'true') {
      return [];
    }
    return mockEvents;
  });
  const [selectedEvent, setSelectedEvent] = useState<ZabayEvent | null>(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('zabay-clean-slate') === 'true') {
        return null;
      }
      const isDevUnlocked = sessionStorage.getItem('zabay-dev-unlocked') === 'true';
      const savedUserStr = localStorage.getItem('zabay-user');
      let userId = 'usr-guest';
      if (savedUserStr) {
        try {
          const parsed = JSON.parse(savedUserStr);
          if (parsed && parsed.id) userId = parsed.id;
        } catch {
          // ignore
        }
      }
      // Only preselect mockEvents[0] if explicitly dev unlocked and user is Mark Bautista ('usr-org-1')
      if (isDevUnlocked && userId === 'usr-org-1') {
        return mockEvents[0] || null;
      }
      return null;
    }
    return null;
  });

  const [venues, setVenues] = useState<Venue[]>(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('zabay-clean-slate') === 'true') {
      return [];
    }
    return mockVenues;
  });
  const [venueBookings, setVenueBookings] = useState<VenueBooking[]>(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('zabay-clean-slate') === 'true') return [];
      if (sessionStorage.getItem('zabay-dev-unlocked') === 'true') return mockVenueBookings;
    }
    return [];
  });
  const [resources] = useState<Resource[]>(mockResources);
  const [personnel, setPersonnel] = useState<Personnel[]>(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('zabay-clean-slate') === 'true') return [];
      const saved = localStorage.getItem('zabay_custom_personnel');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // ignore parsing error
        }
      }
      if (sessionStorage.getItem('zabay-dev-unlocked') === 'true') return mockPersonnel;
    }
    return [];
  });

  const [staffInvitations, setStaffInvitations] = useState<StaffInvitation[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('zabay_staff_invitations');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // ignore
        }
      }
    }
    return mockStaffInvitations;
  });

  const [crewMessages, setCrewMessages] = useState<CrewChatMessage[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('zabay_crew_messages');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // ignore
        }
      }
    }
    return mockCrewMessages;
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('zabay-clean-slate') === 'true') return [];
      if (sessionStorage.getItem('zabay-dev-unlocked') === 'true') return mockTasks;
    }
    return [];
  });
  const [registrations, setRegistrations] = useState<Registration[]>(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('zabay-clean-slate') === 'true') return [];
      if (sessionStorage.getItem('zabay-dev-unlocked') === 'true') return mockRegistrations;
    }
    return [];
  });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('zabay-clean-slate') === 'true') return [];
      if (sessionStorage.getItem('zabay-dev-unlocked') === 'true') return mockAuditLogs;
    }
    return [];
  });

  const [committeeRoles, setCommitteeRoles] = useState<EventCommitteeRoleMap>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('zabay_committee_roles');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // ignore
        }
      }
    }
    return {
      event_head: '',
      secretary: '',
      letters_head: '',
      finance_head: '',
      logistics_head: '',
      documentation_head: '',
      publicity_head: '',
      program_head: '',
    };
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('zabay_committee_roles', JSON.stringify(committeeRoles));
    }
  }, [committeeRoles]);

  // Live Backend & PostgreSQL Connection State (Member 3 Connector)
  const [isLiveBackend, setIsLiveBackend] = useState<boolean>(false);
  const [backendHealth, setBackendHealth] = useState<HealthStatus | null>(null);
  const [operatorAuthenticated, setOperatorAuthenticated] = useState(false);

  useEffect(() => {
    if (isDemoMode) return;
    let active = true;
    api.auth.session().then(async (serverSession) => {
      if (!active) return;
      if (serverSession.operator) {
        setOperatorAuthenticated(true);
        setCurrentUser({ id: 'zabay-operator', name: 'Zabay Operator', email: '', role: 'organizer', roles: ['organizer'], avatar: '', organization: '', location: '', bio: '' });
        setCurrentRole('organizer');
        return;
      }
      setOperatorAuthenticated(false);
      const response = serverSession.authenticated ? await api.auth.getMe() : { success: false, data: undefined };
      if (!active) return;
      const user = response.data?.user;
      if (response.success && user) {
        setCurrentUser({ ...user, roles: [user.role] });
        setCurrentRole(user.role);
      } else {
        const savedUser = typeof window !== 'undefined' ? localStorage.getItem('zabay-user') : null;
        if (!savedUser) {
          setCurrentUser(guestUser);
          setCurrentRole('attendee');
          localStorage.removeItem('zabay-role');
        }
      }
    }).catch(() => {
      if (active) {
        setOperatorAuthenticated(false);
        const savedUser = typeof window !== 'undefined' ? localStorage.getItem('zabay-user') : null;
        if (!savedUser) {
          setCurrentUser(guestUser);
          setCurrentRole('attendee');
        }
      }
    });
    return () => { active = false; };
  }, [isDemoMode]);

  const refreshBackendStatus = async () => {
    try {
      const res = await api.health.check();
      setBackendHealth(res.success ? res.data || null : null);
      if (!res.success || localStorage.getItem('zabay-demo-mode') === 'true') { setIsLiveBackend(false); return; }
      const [venueRes, eventRes] = await Promise.all([api.venues.getAll(), api.events.getAll()]);
      if (!venueRes.success || !eventRes.success || !venueRes.data || !eventRes.data) {
        setIsLiveBackend(false);
        return;
      }
      const venueDetails = await Promise.all(venueRes.data.map((venue) => api.venues.getById(venue.id)));
      if (venueDetails.some((detail) => !detail.success || !detail.data)) {
        setIsLiveBackend(false);
        return;
      }
      if (localStorage.getItem('zabay-demo-mode') === 'true') return;
      const liveEvents = eventRes.data.map(adaptEvent);
      setVenues(venueRes.data.map(adaptVenue));
      setEvents(liveEvents);
      setVenueBookings(venueDetails.flatMap((detail) => (detail.data?.bookings || []) as VenueBooking[]));
      setSelectedEvent((previous) => {
        if (previous?.id) {
          const found = liveEvents.find((event) => event.id === previous.id);
          if (found) return found;
        }
        if (isDevModeUnlocked && currentUser.id === 'usr-org-1') {
          return liveEvents[0] || null;
        }
        if (currentUser.id && currentUser.id !== 'usr-guest') {
          return liveEvents.find((event) => event.organizer_id === currentUser.id) || null;
        }
        return null;
      });
      setIsLiveBackend(true);
    } catch {
      setIsLiveBackend(false);
    }
  };

  useEffect(() => {
    refreshBackendStatus();
  }, []);

  // Synchronize active workspace (selectedEvent) with currentUser session and devMode state
  useEffect(() => {
    if (isDevModeUnlocked && currentUser.id === 'usr-org-1') {
      setSelectedEvent((prev) => prev || events[0] || null);
      return;
    }
    if (currentUser.id === 'usr-guest') {
      setSelectedEvent(null);
      return;
    }
    setSelectedEvent((prev) => {
      if (prev && prev.organizer_id === currentUser.id) {
        return prev;
      }
      const owned = events.find((e) => e.organizer_id === currentUser.id) || null;
      return owned;
    });
  }, [currentUser.id, isDevModeUnlocked, events]);

  // Event Change Notifications & Live Alerts System
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const unreadNotificationCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const broadcastEventChange = (changeDetails: {
    eventId: string;
    eventTitle?: string;
    oldVenue?: string;
    newVenue?: string;
    oldTime?: string;
    newTime?: string;
    summary: string;
  }) => {
    const title = changeDetails.eventTitle || 'Event Update Broadcast';
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: `Event Notice: ${title}`,
      message: changeDetails.summary,
      type: 'warning',
      timestamp: new Date().toISOString(),
      targetRole: 'all',
      eventId: changeDetails.eventId,
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);

    const auditLog: AuditLog = {
      id: `aud-${Date.now()}`,
      user_id: currentUser.id,
      user_name: currentUser.name,
      action: 'VENUE_CHANGE',
      entity_type: 'venue',
      entity_id: changeDetails.eventId,
      change_summary: `In-app notice (current session): ${changeDetails.summary}`,
      created_at: new Date().toISOString(),
    };
    setAuditLogs((prev) => [auditLog, ...prev]);
  };

  const loadDemoData = () => {
    setIsLiveBackend(false);
    setVenues(mockVenues);
    setEvents(mockEvents);
    setSelectedEvent(mockEvents[0]);
    setVenueBookings(mockVenueBookings);
    setTasks(mockTasks);
    setPersonnel(mockPersonnel);
    setRegistrations(mockRegistrations);
    setAuditLogs(mockAuditLogs);
    setIsDemoMode(true);
    setIsDevModeUnlocked(true);
    setUnlockedDevCode((prev) => prev || 'AUTHORIZED');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('zabay-clean-slate');
      sessionStorage.setItem('zabay-demo-mode', 'true');
      sessionStorage.setItem('zabay-dev-unlocked', 'true');
      sessionStorage.setItem('zabay-dev-code', 'AUTHORIZED');
      localStorage.removeItem('zabay-dev-unlocked');
      localStorage.removeItem('zabay-dev-code');
      localStorage.removeItem('zabay_custom_personnel');
    }
  };

  const loadRole2DemoData = () => {
    setIsLiveBackend(false);
    setVenues(mockVenues);
    setEvents(mockEvents);
    setSelectedEvent(mockEvents[0]);
    setVenueBookings(mockVenueBookings);
    setTasks(mockTasks);
    setPersonnel(mockPersonnel);

    // Seed specialized Role 2 registrations with tested duplicate check-in target
    const role2Registrations: Registration[] = [
      {
        id: 'reg-r2-01',
        event_id: 'evt-1',
        event_title: 'Tagbilaran Inter-Barangay & School Basketball Championship 2026',
        attendee_id: 'usr-att-1',
        attendee_name: 'Sofia Ramos',
        attendee_email: 'sofia.ramos@bisu.edu.ph',
        status: 'confirmed',
        ticket_type: 'Courtside Reserved',
        qr_pass_code: 'ZABAY-PASS-9042-SOFIA',
        registered_at: '2026-10-01T14:22:10Z',
        amount_paid: 150,
      },
      {
        id: 'reg-r2-02',
        event_id: 'evt-1',
        event_title: 'Tagbilaran Inter-Barangay & School Basketball Championship 2026',
        attendee_id: 'usr-att-2',
        attendee_name: 'Liam Mendoza',
        attendee_email: 'liam.mendoza@hnu.edu.ph',
        status: 'checked_in', // Already checked in -> duplicate check-in test target
        ticket_type: 'General Bleachers',
        qr_pass_code: 'ZABAY-PASS-3108-LIAM',
        registered_at: '2026-10-02T11:15:00Z',
        amount_paid: 50,
      },
      {
        id: 'reg-r2-03',
        event_id: 'evt-1',
        event_title: 'Tagbilaran Inter-Barangay & School Basketball Championship 2026',
        attendee_id: 'usr-att-3',
        attendee_name: 'Amara Torres',
        attendee_email: 'amara.torres@gmail.com',
        status: 'confirmed',
        ticket_type: 'General Bleachers',
        qr_pass_code: 'ZABAY-PASS-5821-AMARA',
        registered_at: '2026-10-04T09:40:00Z',
        amount_paid: 50,
      },
      {
        id: 'reg-r2-04',
        event_id: 'evt-1',
        event_title: 'Tagbilaran Inter-Barangay & School Basketball Championship 2026',
        attendee_id: 'usr-att-4',
        attendee_name: 'Kenji Tan',
        attendee_email: 'kenji.tan@outlook.ph',
        status: 'confirmed',
        ticket_type: 'Courtside Reserved',
        qr_pass_code: 'ZABAY-PASS-1029-KENJI',
        registered_at: '2026-10-05T16:04:12Z',
        amount_paid: 150,
      },
    ];
    setRegistrations(role2Registrations);

    const role2AuditLogs: AuditLog[] = [
      {
        id: `aud-r2-init-${Date.now()}`,
        user_id: 'usr-org-1',
        user_name: 'Engr. David Soriano (Operations Lead)',
        action: 'RESOURCE_ASSIGNMENT',
        entity_type: 'resource',
        entity_id: 'pg-triggers-v16',
        change_summary: 'Verification testbed loaded: schedule collision prevention, verified gate check-in, and audit logging active.',
        created_at: new Date().toISOString(),
      },
      ...mockAuditLogs,
    ];
    setAuditLogs(role2AuditLogs);

    setIsDemoMode(true);
    setIsDevModeUnlocked(true);
    setUnlockedDevCode('AUTHORIZED');
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('zabay-demo-mode', 'true');
      sessionStorage.setItem('zabay-dev-unlocked', 'true');
      sessionStorage.setItem('zabay-dev-code', 'AUTHORIZED');
      localStorage.removeItem('zabay-dev-unlocked');
      localStorage.removeItem('zabay-dev-code');
      localStorage.removeItem('zabay_custom_personnel');
    }

    const testbedNotice: AppNotification = {
      id: `notif-r2-${Date.now()}`,
      title: 'Verification Testbed Active',
      message: 'Collision checks and single-admission rules loaded: test duplicate check-in with Liam Mendoza (ZABAY-PASS-3108-LIAM) or schedule overlap.',
      type: 'info',
      timestamp: new Date().toISOString(),
      targetRole: 'all',
      read: false,
    };
    setNotifications((prev) => [testbedNotice, ...prev]);
  };

  const unlockDevMode = async (code: string): Promise<{ success: boolean; message: string; devCode?: string }> => {
    const raw = (code || '').trim();
    if (!raw) {
      return {
        success: false,
        message: 'Developer access key is required.',
      };
    }

    // 1. If backend API is live or reachable, attempt secure server-side verification
    if (isLiveBackend) {
      try {
        const res = await api.auth.verifyDevKey(raw);
        if (res.success) {
          loadDemoData();
          setIsDevModeUnlocked(true);
          setUnlockedDevCode('AUTHORIZED');
          setCurrentUser(mockCurrentUser);
          setCurrentRole('organizer');
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('zabay-dev-unlocked', 'true');
            sessionStorage.setItem('zabay-dev-code', 'AUTHORIZED');
            sessionStorage.setItem('zabay-demo-mode', 'true');
            localStorage.setItem('zabay-user', JSON.stringify(mockCurrentUser));
            localStorage.setItem('zabay-role', 'organizer');
            localStorage.removeItem('zabay-dev-unlocked');
            localStorage.removeItem('zabay-dev-code');
          }
          return {
            success: true,
            message: 'Developer session authorized via secure server key.',
            devCode: 'AUTHORIZED',
          };
        }
      } catch (err: any) {
        if (err?.message?.includes('Too many') || err?.message?.includes('Access locked')) {
          return {
            success: false,
            message: 'Too many failed attempts. Console locked for 15 minutes.',
          };
        }
        if (err?.status === 401 || err?.status === 403) {
          return {
            success: false,
            message: 'Invalid developer key. Access denied.',
          };
        }
      }
    }

    // 2. Offline / Resilient Cryptographic SHA-256 verification (no plaintext passcodes in client JS)
    const normalized = raw.toUpperCase();
    const hash = await computeSha256(normalized);

    // Cryptographic hashes of authorized developer keys:
    // Local demo key hash; this never authorizes backend requests.
    const HASH_MASTER = '6058ab1776a2b6c08c1d403fc10b8683cd5aef62e231dbce890c4601366e4840';
    const HASH_ROLE2 = 'f24b41698af9cdd65c9ac8b36a439c803dac87e5d4b46011850918b2a4407324';
    const HASH_CLEAN = 'c0ef37c9ed162dbdb951a5eefc91f453cb5a834024def49cf21b13ae64704cf6';

    const customEnvKey = (import.meta as any).env?.VITE_DEV_KEY;
    const isCustomMatch = customEnvKey && (raw === customEnvKey || normalized === customEnvKey.toUpperCase());

    if (hash === HASH_MASTER || isCustomMatch) {
      loadDemoData();
      setIsDevModeUnlocked(true);
      setUnlockedDevCode('AUTHORIZED');
      setCurrentUser(mockCurrentUser);
      setCurrentRole('organizer');
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('zabay-dev-unlocked', 'true');
        sessionStorage.setItem('zabay-dev-code', 'AUTHORIZED');
        sessionStorage.setItem('zabay-demo-mode', 'true');
        localStorage.setItem('zabay-user', JSON.stringify(mockCurrentUser));
        localStorage.setItem('zabay-role', 'organizer');
        localStorage.removeItem('zabay-dev-unlocked');
        localStorage.removeItem('zabay-dev-code');
      }
      return {
        success: true,
        message: 'Developer session authorized! Bohol evaluation dataset & persona loaded.',
        devCode: 'AUTHORIZED',
      };
    }

    if (hash === HASH_ROLE2) {
      loadRole2DemoData();
      return {
        success: true,
        message: 'Developer testbed loaded: collision checks and single-admission rules active.',
        devCode: 'AUTHORIZED',
      };
    }

    if (hash === HASH_CLEAN) {
      clearToCleanSlate();
      setIsDevModeUnlocked(true);
      setUnlockedDevCode('AUTHORIZED');
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('zabay-dev-unlocked', 'true');
        sessionStorage.setItem('zabay-dev-code', 'AUTHORIZED');
        localStorage.removeItem('zabay-dev-unlocked');
        localStorage.removeItem('zabay-dev-code');
      }
      return {
        success: true,
        message: 'Workspace reset to clean slate.',
        devCode: 'AUTHORIZED',
      };
    }

    return {
      success: false,
      message: 'Invalid developer key. Access denied.',
    };
  };

  const lockDevMode = () => {
    setOperatorAuthenticated(false);
    setIsDevModeUnlocked(false);
    setUnlockedDevCode(null);
    setCurrentUser(guestUser);
    setCurrentRole('attendee');
    setTasks([]);
    setPersonnel([]);
    setRegistrations([]);
    setVenueBookings([]);
    setAuditLogs([]);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('zabay-dev-unlocked');
      sessionStorage.removeItem('zabay-dev-code');
      sessionStorage.removeItem('zabay-demo-mode');
      localStorage.removeItem('zabay-dev-unlocked');
      localStorage.removeItem('zabay-dev-code');
      localStorage.removeItem('zabay-user');
      localStorage.removeItem('zabay-role');
    }
  };

  const signOut = () => {
    void api.auth.logout().then((result) => {
      if (result.success) lockDevMode();
    });
  };

  const clearToCleanSlate = () => {
    setVenues([]);
    setEvents([]);
    setSelectedEvent(null);
    setVenueBookings([]);
    setTasks([]);
    setPersonnel([]);
    setRegistrations([]);
    setAuditLogs([]);
    setIsDemoMode(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('zabay-clean-slate', 'true');
      localStorage.setItem('zabay-demo-mode', 'false');
      localStorage.removeItem('zabay_custom_personnel');
    }
    void refreshBackendStatus();
  };

  const createEvent = async (data: Partial<ZabayEvent>): Promise<ZabayEvent> => {
    const todayIso = new Date().toISOString().split('T')[0];
    const eventStartDate = (data.start_date || '').slice(0, 10);
    const eventEndDate = (data.end_date || '').slice(0, 10);
    if (eventStartDate && eventStartDate < todayIso) {
      throw new Error('Events cannot be scheduled in the past. Please select today or a future date.');
    }
    if (eventEndDate && eventStartDate && eventEndDate < eventStartDate) {
      throw new Error('End date cannot precede the event start date.');
    }

    if (!(isDemoMode && isDevModeUnlocked)) {
      if (!isLiveBackend) throw new Error('Server is currently offline. Event was not saved.');
      let response;
      try {
        response = await api.events.create({
          ...data,
          organizer_id: currentUser.id,
          venue_id: undefined,
          hall_id: undefined,
          hall_name: undefined,
        });
      } catch {
        throw new Error('Could not confirm whether the event was saved. Check your events before trying again.');
      }
      if (response.code === 'NETWORK_ERROR') {
        throw new Error('Could not confirm whether the event was saved. Check your events before trying again.');
      }
      if (!response.success || !response.data?.id) throw new Error(response.error || 'Event was not saved.');
      const saved = adaptEvent(response.data);
      saved.organizer_id = response.data.organizer_id || currentUser.id;
      setEvents((previous) => [saved, ...previous]);
      setSelectedEvent(saved);
      return saved;
    }

    const newEvt: ZabayEvent = {
      id: `evt-${Date.now()}`,
      title: data.title || 'Untitled Bohol Event',
      description: data.description || 'Newly created event workspace.',
      category: data.category || 'Sports & Athletics',
      event_type: data.event_type || (data.is_private ? 'private' : 'public'),
      is_private: data.is_private !== undefined ? data.is_private : data.event_type === 'private',
      status: data.status || 'planning',
      venue_id: data.venue_id,
      start_date: data.start_date || '2026-11-20T08:00:00Z',
      end_date: data.end_date || '2026-11-20T17:00:00Z',
      expected_attendance: data.expected_attendance || 100,
      max_capacity: data.max_capacity || 200,
      ticket_price: data.ticket_price || 0,
      currency: data.currency || 'PHP',
      tickets_sold: 0,
      banner_url: data.banner_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
      organizer_id: currentUser.id,
      requirements: data.requirements || {
        min_capacity: data.expected_attendance || 100,
        power_kw_needed: 25,
        requires_indoor: true,
        required_facilities: ['Dedicated Gigabit Fiber WiFi'],
        min_setup_hours: 3,
      },
      budget: (data.ticket_price || 0) * (data.expected_attendance || 100),
      created_at: new Date().toISOString(),
    };

    setEvents((prev) => [newEvt, ...prev]);
    setSelectedEvent(newEvt);
    return newEvt;
  };

  // Recursive Downstream Impact Tracing: mimics PostgreSQL CTE `fn_downstream_impact(task_id)`
  const fnDownstreamImpact = (taskId: string) => {
    const visited = new Set<string>();

    const traverse = (currentId: string) => {
      // Find all tasks that have currentId in their dependencies
      const directDependents = tasks.filter((t) => t.dependencies.includes(currentId));
      for (const dep of directDependents) {
        if (!visited.has(dep.id)) {
          visited.add(dep.id);
          traverse(dep.id);
        }
      }
    };

    traverse(taskId);
    return {
      affectedTaskIds: Array.from(visited),
      totalAffected: visited.size,
    };
  };

  // Schedule Impact Propagation: mimics PostgreSQL `fn_schedule_impact(task_id, delay_minutes)`
  const fnScheduleImpact = (taskId: string, delayMinutes: number) => {
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask) return { affectedTasks: [], hasConflicts: false };

    const { affectedTaskIds } = fnDownstreamImpact(taskId);
    const affectedTasks: { id: string; title: string; newStart: string; newEnd: string; conflict: boolean }[] = [];
    let hasConflicts = false;

    // Projected end time of target task
    const targetCurrentEndMins = timeToMinutes(targetTask.end_time);
    const targetNewEndMins = targetCurrentEndMins + delayMinutes;

    affectedTasks.push({
      id: targetTask.id,
      title: targetTask.title,
      newStart: targetTask.start_time,
      newEnd: minutesToTime(targetNewEndMins),
      conflict: delayMinutes > 60, // flag if delay pushes beyond comfortable window
    });

    // Check ripple across affected tasks in dependency order
    for (const id of affectedTaskIds) {
      const task = tasks.find((t) => t.id === id);
      if (!task) continue;

      const currentStartMins = timeToMinutes(task.start_time);
      const currentEndMins = timeToMinutes(task.end_time);
      const durationMins = currentEndMins - currentStartMins;

      // Finish-to-Start constraint check
      const willConflict = currentStartMins < targetNewEndMins;
      if (willConflict) {
        hasConflicts = true;
      }

      // Propagate projected shift
      const projectedStartMins = Math.max(currentStartMins, targetNewEndMins);
      const projectedEndMins = projectedStartMins + durationMins;

      affectedTasks.push({
        id: task.id,
        title: task.title,
        newStart: minutesToTime(projectedStartMins),
        newEnd: minutesToTime(projectedEndMins),
        conflict: willConflict,
      });
    }

    return { affectedTasks, hasConflicts };
  };

  // Requirement-Based Venue Matching: mimics PostgreSQL `fn_match_venue_to_event(event_id, venue_id)`
  const fnMatchVenueToEvent = (eventId: string, venueId: string): VenueMatchResult => {
    const event = events.find((e) => e.id === eventId) || selectedEvent;
    const venue = venues.find((v) => v.id === venueId);

    if (!venue) {
      throw new Error('Venue not found');
    }

    if (!event) {
      return {
        venue_id: venue.id,
        venue_name: venue.name,
        overall_score: 100,
        is_compatible: true,
        capacity_status: {
          required: 100,
          actual: venue.capacity,
          satisfied: true,
        },
        facilities_status: {
          required: [],
          matched: venue.facilities,
          missing: [],
          satisfied: true,
        },
        power_status: {
          required: 25,
          actual: venue.power_kw_capacity,
          satisfied: true,
        },
        schedule_status: {
          available: true,
        },
      };
    }

    const req = event.requirements;

    // 1. Capacity check
    const capacitySatisfied = venue.capacity >= req.min_capacity;

    // 2. Facilities check
    const matchedFacilities = req.required_facilities.filter((f) =>
      venue.facilities.some((vf) => vf.toLowerCase().includes(f.toLowerCase()) || f.toLowerCase().includes(vf.toLowerCase()))
    );
    const missingFacilities = req.required_facilities.filter(
      (f) => !matchedFacilities.includes(f)
    );
    const facilitiesSatisfied = missingFacilities.length === 0;

    // 3. Power check
    const powerSatisfied = venue.power_kw_capacity >= req.power_kw_needed;

    // 4. Booking conflict check (PostgreSQL EXCLUDE constraint check)
    const existingBookings = venueBookings.filter(
      (b) => b.venue_id === venueId && b.event_id !== eventId && b.status === 'confirmed'
    );
    const hasBookingConflict = existingBookings.some((b) => {
      // Overlap calculation
      const bStart = new Date(b.start_time).getTime();
      const bEnd = new Date(b.end_time).getTime();
      const eStart = new Date(event.start_date).getTime();
      const eEnd = new Date(event.end_date).getTime();
      return Math.max(bStart, eStart) < Math.min(bEnd, eEnd);
    });

    // Score calculation
    let score = 0;
    if (capacitySatisfied) score += 30;
    else score += Math.max(0, Math.floor((venue.capacity / req.min_capacity) * 30));

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
        actual: venue.capacity,
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
  };

  // Apply a Task Delay and record audit log with downstream ripples
  const applyTaskDelay = (taskId: string, delayMinutes: number, reason: string) => {
    const { affectedTasks, hasConflicts } = fnScheduleImpact(taskId, delayMinutes);
    const target = tasks.find((t) => t.id === taskId);
    if (!target) return;

    setTasks((prevTasks) =>
      prevTasks.map((t) => {
        const affected = affectedTasks.find((at) => at.id === t.id);
        if (affected) {
          return {
            ...t,
            start_time: affected.newStart,
            end_time: affected.newEnd,
            has_conflict: affected.conflict,
            conflict_reason: affected.conflict
              ? `Finish-to-start dependency violation: Predecessor delayed by ${delayMinutes}m`
              : undefined,
          };
        }
        return t;
      })
    );

    // Record Audit Log
    const rippleDescriptions = affectedTasks
      .filter((at) => at.id !== taskId)
      .map((at) => `${at.title} shifted to [${at.newStart} - ${at.newEnd}]${at.conflict ? ' (CONFLICT)' : ''}`);

    const newAuditLog: AuditLog = {
      id: `aud-${Date.now()}`,
      user_id: currentUser.id,
      user_name: currentUser.name,
      action: 'TASK_DELAY',
      entity_type: 'task',
      entity_id: taskId,
      change_summary: `${target.title}: Delayed by ${delayMinutes} mins. Reason: ${reason}. (${hasConflicts ? 'Conflicts Triggered' : 'Schedule Adjusted'})`,
      created_at: new Date().toISOString(),
      downstream_ripples: rippleDescriptions,
    };

    setAuditLogs((prev) => [newAuditLog, ...prev]);
  };

  const resetTasksToDefault = () => {
    setTasks(mockTasks);
    const newLog: AuditLog = {
      id: `aud-${Date.now()}`,
      user_id: currentUser.id,
      user_name: currentUser.name,
      action: 'SCHEDULE_REBALANCED',
      entity_type: 'task',
      entity_id: 'all',
      change_summary: 'Reset task schedule to baseline operational plan.',
      created_at: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const addTask = (newTaskData: Omit<Task, 'id'>) => {
    const newTask: Task = {
      ...newTaskData,
      id: `task-${Date.now()}`,
      event_id: newTaskData.event_id || selectedEvent?.id || 'evt-1',
    };
    setTasks((prev) => [...prev, newTask]);

    const newLog: AuditLog = {
      id: `aud-${Date.now()}`,
      user_id: currentUser.id,
      user_name: currentUser.name,
      action: 'SCHEDULE_REBALANCED',
      entity_type: 'task',
      entity_id: newTask.id,
      change_summary: `Created new operational task: "${newTask.title}" [${newTask.priority.toUpperCase()} priority]`,
      created_at: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
    );

    const newLog: AuditLog = {
      id: `aud-${Date.now()}`,
      user_id: currentUser.id,
      user_name: currentUser.name,
      action: 'SCHEDULE_REBALANCED',
      entity_type: 'task',
      entity_id: taskId,
      change_summary: `Modified operational task details (${Object.keys(updates).join(', ')})`,
      created_at: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const deleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    const newLog: AuditLog = {
      id: `aud-${Date.now()}`,
      user_id: currentUser.id,
      user_name: currentUser.name,
      action: 'SCHEDULE_REBALANCED',
      entity_type: 'task',
      entity_id: taskId,
      change_summary: `Removed operational task`,
      created_at: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status } : t))
    );
  };

  const propagateCommitteeRoles = (newRoles: EventCommitteeRoleMap, preserveOverrides: boolean = true) => {
    setCommitteeRoles(newRoles);

    const roleMapping: Record<string, { name: string; title: string }> = {
      letters: { name: newRoles.letters_head || '', title: 'Letters Committee Head' },
      finance: { name: newRoles.finance_head || '', title: 'Finance Head' },
      logistics: { name: newRoles.logistics_head || '', title: 'Logistics Head' },
      documentation: { name: newRoles.documentation_head || '', title: 'Documentation Head' },
      publicity: { name: newRoles.publicity_head || '', title: 'Publicity Head' },
      program: { name: newRoles.program_head || '', title: 'Program Head' },
      secretary: { name: newRoles.secretary || '', title: 'Secretary' },
    };

    let updatedCount = 0;

    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        const comm = task.committee ? String(task.committee).toLowerCase() : '';
        const mapped = roleMapping[comm];

        // If preserving manual overrides and this task already has an assigned owner, keep it
        if (preserveOverrides && task.personnel_assignments && task.personnel_assignments.length > 0) {
          return task;
        }

        if (mapped && mapped.name.trim()) {
          updatedCount++;
          return {
            ...task,
            personnel_assignments: [
              {
                personnel_id: `per-${mapped.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
                personnel_name: mapped.name.trim(),
                role: mapped.title,
              },
            ],
          };
        } else if (mapped && !mapped.name.trim()) {
          return {
            ...task,
            personnel_assignments: [],
          };
        }

        return task;
      })
    );

    const newLog: AuditLog = {
      id: `aud-${Date.now()}`,
      user_id: currentUser.id,
      user_name: currentUser.name,
      action: 'ROLE_PROPAGATED' as any,
      entity_type: 'task',
      entity_id: 'all',
      change_summary: `Propagated committee role assignments across relevant event tasks.`,
      created_at: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);

    return { updatedCount };
  };

  const loadTaskTemplate = (kitId: string) => {
    const kit = mockWorkflowKits.find((k) => k.id === kitId);
    if (!kit) return;

    const roleMapping: Record<string, { name: string; title: string }> = {
      letters: { name: committeeRoles.letters_head || '', title: 'Letters Committee Head' },
      finance: { name: committeeRoles.finance_head || '', title: 'Finance Head' },
      logistics: { name: committeeRoles.logistics_head || '', title: 'Logistics Head' },
      documentation: { name: committeeRoles.documentation_head || '', title: 'Documentation Head' },
      publicity: { name: committeeRoles.publicity_head || '', title: 'Publicity Head' },
      program: { name: committeeRoles.program_head || '', title: 'Program Head' },
      secretary: { name: committeeRoles.secretary || '', title: 'Secretary' },
    };

    const newTasks: Task[] = kit.tasks.map((t, idx) => {
      const comm = t.committee ? String(t.committee).toLowerCase() : '';
      const mapped = roleMapping[comm];
      const initialAssignments = (mapped && mapped.name.trim())
        ? [
            {
              personnel_id: `per-${mapped.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
              personnel_name: mapped.name.trim(),
              role: mapped.title,
            },
          ]
        : [];

      return {
        ...t,
        id: `task-${Date.now()}-${idx + 1}`,
        event_id: selectedEvent ? selectedEvent.id : 'evt-draft',
        status: 'todo' as TaskStatus, // ALL generated tasks strictly in To Do state!
        personnel_assignments: initialAssignments,
        downstream_impact_count: kit.tasks.filter((other) => other.dependencies.includes(t.title)).length,
      };
    });

    setTasks(newTasks);

    const newLog: AuditLog = {
      id: `aud-${Date.now()}`,
      user_id: currentUser.id,
      user_name: currentUser.name,
      action: 'SCHEDULE_REBALANCED',
      entity_type: 'task',
      entity_id: 'all',
      change_summary: `Loaded 1-Click Workflow Kit: "${kit.name}" with ${newTasks.length} tasks initialized in To Do state.`,
      created_at: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Check-In Attendee with Database Duplicate Prevention & Wrong-Event Enforcement
  const checkInAttendee = async (qrCode: string, targetEventId?: string) => {
    const expectedEventId = targetEventId || selectedEvent?.id;

    if (!isDemoMode) {
      if (!isLiveBackend) return { success: false, message: 'Server is currently offline. No attendee was checked in.' };
      const response = await api.attendees.checkIn(qrCode, expectedEventId);
      if (!response.success || !response.data) {
        if (response.code === 'NETWORK_ERROR') setIsLiveBackend(false);
        return {
          success: false,
          isDuplicate: response.isDuplicate || response.code === 'DUPLICATE_CHECK_IN',
          isWrongEvent: (response as any).isWrongEvent || response.code === 'WRONG_EVENT',
          message: response.error || 'Check-in failed.',
        };
      }
      const known = registrations.find((registration) => registration.id === response.data?.id);
      const title = known?.event_title || events.find((event) => event.id === response.data?.event_id)?.title || 'Event';
      const checkedIn = adaptRegistration(response.data, title);
      setRegistrations((previous) => previous.some((registration) => registration.id === checkedIn.id)
        ? previous.map((registration) => registration.id === checkedIn.id ? checkedIn : registration)
        : [checkedIn, ...previous]);
      return { success: true, registration: checkedIn, message: `Checked in ${checkedIn.attendee_name}.` };
    }

    const reg = registrations.find(
      (r) => r.qr_pass_code.toUpperCase() === qrCode.trim().toUpperCase()
    );

    if (!reg) {
      return {
        success: false,
        message: 'Invalid QR pass code: No registration record found in database.',
      };
    }

    // Wrong-Event Validation: Pass must belong to the active gate event
    if (expectedEventId && reg.event_id !== expectedEventId) {
      const ticketEvent = events.find((e) => e.id === reg.event_id);
      const currentEvent = events.find((e) => e.id === expectedEventId) || selectedEvent;
      const ticketTitle = reg.event_title || ticketEvent?.title || reg.event_id;
      const currentTitle = currentEvent?.title || expectedEventId;
      return {
        success: false,
        isWrongEvent: true,
        registration: reg,
        message: `WRONG EVENT PASS: This ticket was issued for "${ticketTitle}", NOT for "${currentTitle}". Turnstile admission rejected!`,
      };
    }

    if (reg.status === 'cancelled') {
      return { success: false, message: 'This registration was cancelled.' };
    }

    if (reg.status === 'checked_in') {
      return {
        success: false,
        isDuplicate: true,
        registration: reg,
        message: `DUPLICATE CHECK-IN PREVENTED: ${reg.attendee_name} was already verified and admitted.`,
      };
    }

    // Mark as checked in
    setRegistrations((prev) =>
      prev.map((r) => (r.id === reg.id ? { ...r, status: 'checked_in' } : r))
    );

    const checkInLog: AuditLog = {
      id: `aud-${Date.now()}`,
      user_id: currentUser.id,
      user_name: currentUser.name,
      action: 'CHECK_IN',
      entity_type: 'registration',
      entity_id: reg.id,
      change_summary: `Gate turnstile checked in ${reg.attendee_name} (${reg.ticket_type}) for ${reg.event_title}.`,
      created_at: new Date().toISOString(),
    };
    setAuditLogs((prev) => [checkInLog, ...prev]);

    return {
      success: true,
      registration: { ...reg, status: 'checked_in' as const },
      message: `Verified! Welcome ${reg.attendee_name} (${reg.ticket_type}).`,
    };
  };

  // Venue booking with PostgreSQL EXCLUDE constraint handling
  const bookVenue = async (
    venueId: string,
    eventId: string,
    startTime: string,
    endTime: string,
    hallId?: string,
    eventTitle?: string
  ): Promise<{ success: boolean; message: string }> => {
    const venue = venues.find((v) => v.id === venueId);
    if (!venue) return { success: false, message: 'Venue does not exist' };

    const selectedHall = hallId ? venue.halls?.find((h) => h.id === hallId) : undefined;
    const spaceName = selectedHall ? `${venue.name} • ${selectedHall.name}` : venue.name;
    const event = events.find((e) => e.id === eventId) || selectedEvent;

    if (!(isDemoMode && isDevModeUnlocked)) {
      if (!isLiveBackend) return { success: false, message: 'Server is currently offline. Venue was not booked.' };
      try {
        const savedEvent = await api.events.getById(eventId);
        if (savedEvent.code === 'NETWORK_ERROR') {
          return { success: false, message: 'Could not verify the event because the server connection failed. No booking was confirmed.' };
        }
        if (!savedEvent.success || !savedEvent.data?.id) {
          return { success: false, message: savedEvent.error || 'Event could not be verified. Venue was not booked.' };
        }
        const apiRes = await api.venues.book(venueId, {
          event_id: eventId,
          event_title: savedEvent.data.title,
          start_time: startTime,
          end_time: endTime,
          hall_id: hallId,
          hall_name: selectedHall?.name,
        });

        if (apiRes.success && apiRes.data?.id) {
          setVenueBookings((previous) => [...previous, apiRes.data as VenueBooking]);
          setEvents((previous) => previous.map((item) => item.id === eventId
            ? { ...item, venue_id: venueId, hall_id: hallId, hall_name: selectedHall?.name }
            : item));
          setSelectedEvent((previous) => previous?.id === eventId
            ? { ...previous, venue_id: venueId, hall_id: hallId, hall_name: selectedHall?.name }
            : previous);
          return { success: true, message: `Venue booking confirmed for ${spaceName}.` };
        }
        if (apiRes.code === 'NETWORK_ERROR') {
          return { success: false, message: 'Could not confirm whether the venue was booked. Check reservations before trying again.' };
        }
        return { success: false, message: apiRes.error || `Database EXCLUDE conflict detected on ${spaceName}` };
      } catch {
        return { success: false, message: 'Could not confirm whether the venue was booked. Check reservations before trying again.' };
      }
    }

    const overlap = venueBookings.some((b) => {
      if (b.venue_id !== venueId || b.status === 'cancelled') return false;
      // If booking a specific hall, collision only occurs if the existing booking is for the SAME hall,
      // or if either booking is for the entire venue (no hallId)!
      if (hallId && b.hall_id && b.hall_id !== hallId) {
        return false;
      }
      const bStart = new Date(b.start_time).getTime();
      const bEnd = new Date(b.end_time).getTime();
      const nStart = new Date(startTime).getTime();
      const nEnd = new Date(endTime).getTime();
      return Math.max(bStart, nStart) < Math.min(bEnd, nEnd);
    });

    if (overlap) {
      return {
        success: false,
        message: `Sample booking conflict: ${spaceName} already has a reservation that overlaps with the requested time window.`,
      };
    }

    const newBooking: VenueBooking = {
      id: `demo-vb-${Date.now()}`,
      venue_id: venueId,
      hall_id: hallId,
      hall_name: selectedHall?.name,
      event_id: eventId,
      event_title: eventTitle || event?.title || 'Sample Event',
      start_time: startTime,
      end_time: endTime,
      status: 'confirmed',
    };

    setVenueBookings((prev) => [...prev, newBooking]);
    return {
      success: true,
      message: `Venue booking confirmed for ${spaceName}!`,
    };
  };

  const addVenue = async (venueData: Omit<Venue, 'id'>): Promise<Venue> => {
    let newVenue: Venue;

    if (!isDemoMode && isLiveBackend) {
      try {
        const res = await api.venues.create(venueData);
        if (res.success && res.data) {
          newVenue = adaptVenue(res.data);
        } else {
          const newId = `ven-${Date.now().toString(36)}`;
          newVenue = {
            ...venueData,
            id: newId,
          };
        }
      } catch {
        const newId = `ven-${Date.now().toString(36)}`;
        newVenue = {
          ...venueData,
          id: newId,
        };
      }
    } else {
      const newId = `ven-${Date.now().toString(36)}`;
      newVenue = {
        ...venueData,
        id: newId,
      };
    }

    setVenues((prev) => [newVenue, ...prev]);

    const auditLog: AuditLog = {
      id: `aud-${Date.now()}`,
      user_id: currentUser.id,
      user_name: currentUser.name,
      action: 'VENUE_CHANGE',
      entity_type: 'venue',
      entity_id: newVenue.id,
      change_summary: `Registered facility: "${newVenue.name}" in ${newVenue.city} (Capacity: ${newVenue.capacity.toLocaleString()}, Rate: ₱${newVenue.hourly_rate.toLocaleString()}/hr).`,
      created_at: new Date().toISOString(),
    };
    setAuditLogs((prev) => [auditLog, ...prev]);

    return newVenue;
  };


  // Register for an event and retain the returned QR pass in this workspace.
  const registerForEvent = async (
    eventId: string,
    ticketType: 'General Admission' | 'VIP Access',
    attendeeName: string,
    attendeeEmail: string
  ): Promise<{ success: boolean; message: string; registration?: Registration }> => {
    const event = events.find((e) => e.id === eventId) || selectedEvent;
    if (!event) {
      return { success: false, message: 'Event not found.' };
    }

    if (isLiveBackend) {
      try {
        const response = await api.attendees.register({ event_id: eventId, attendee_name: attendeeName, attendee_email: attendeeEmail, ticket_type: ticketType });
        if (response.success && response.data?.qr_pass_code) {
          const saved = adaptRegistration(response.data, event.title);
          setRegistrations((previous) => [saved, ...previous]);
          setEvents((previous) => previous.map((item) => item.id === eventId ? { ...item, tickets_sold: item.tickets_sold + 1 } : item));
          setSelectedEvent((previous) => previous?.id === eventId ? { ...previous, tickets_sold: previous.tickets_sold + 1 } : previous);
          let sessionPassIds: string[] = [];
          try { sessionPassIds = JSON.parse(sessionStorage.getItem('zabay-session-pass-ids') || '[]'); } catch { /* reset malformed browser state */ }
          sessionStorage.setItem('zabay-session-pass-ids', JSON.stringify([...new Set([...sessionPassIds, saved.id])]));
          return { success: true, registration: saved, message: 'Registration confirmed! Digital pass generated.' };
        }
        if (response.code === 'NETWORK_ERROR') {
          setIsLiveBackend(false);
        } else {
          return { success: false, message: response.error || 'Registration failed. No pass was issued.' };
        }
      } catch {
        // Fall back to client pass generation
      }
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const qrCode = `ZABAY-PASS-${randomSuffix}-${(attendeeName || 'GUEST').split(' ')[0].toUpperCase()}`;

    const newReg: Registration = {
      id: `reg-${Date.now()}`,
      event_id: event.id,
      event_title: event.title,
      attendee_id: currentUser.id,
      attendee_name: attendeeName,
      attendee_email: attendeeEmail,
      status: 'confirmed',
      ticket_type: ticketType,
      qr_pass_code: qrCode,
      registered_at: new Date().toISOString(),
      amount_paid: ticketType === 'VIP Access' ? Math.round(event.ticket_price * 1.4) : event.ticket_price,
    };

    setRegistrations((prev) => [newReg, ...prev]);
    setEvents((previous) => previous.map((item) => item.id === eventId ? { ...item, tickets_sold: item.tickets_sold + 1 } : item));
    setSelectedEvent((previous) => previous?.id === eventId ? { ...previous, tickets_sold: previous.tickets_sold + 1 } : previous);

    return {
      success: true,
      registration: newReg,
      message: 'Registration confirmed! Digital pass generated.',
    };
  };

  const addPersonnel = (data: Omit<Personnel, 'id'>): Personnel => {
    const newPerson: Personnel = {
      id: `per-${Date.now()}`,
      ...data,
    };
    setPersonnel((prev) => {
      const updated = [newPerson, ...prev];
      if (typeof window !== 'undefined') {
        localStorage.setItem('zabay_custom_personnel', JSON.stringify(updated));
      }
      return updated;
    });

    const log: AuditLog = {
      id: `aud-${Date.now()}`,
      action: 'RESOURCE_ASSIGNMENT',
      entity_type: 'resource',
      entity_id: newPerson.id,
      user_id: currentUser?.id || 'usr-org-1',
      user_name: currentUser?.name || 'Lead Organizer',
      change_summary: `Registered personnel member "${newPerson.name}" (${newPerson.role}) with rate ₱${newPerson.hourly_rate.toLocaleString()}/hr`,
      created_at: new Date().toISOString(),
    };
    setAuditLogs((prev) => [log, ...prev]);

    return newPerson;
  };

  const updatePersonnel = (id: string, updates: Partial<Personnel>) => {
    setPersonnel((prev) => {
      const updated = prev.map((p) => (p.id === id ? { ...p, ...updates } : p));
      if (typeof window !== 'undefined') {
        localStorage.setItem('zabay_custom_personnel', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const removePersonnel = (id: string) => {
    setPersonnel((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      if (typeof window !== 'undefined') {
        localStorage.setItem('zabay_custom_personnel', JSON.stringify(updated));
      }
      return updated;
    });

    const log: AuditLog = {
      id: `aud-${Date.now()}`,
      action: 'RESOURCE_ASSIGNMENT',
      entity_type: 'resource',
      entity_id: id,
      user_id: currentUser?.id || 'usr-org-1',
      user_name: currentUser?.name || 'Lead Organizer',
      change_summary: `Removed personnel member ID "${id}" from event roster`,
      created_at: new Date().toISOString(),
    };
    setAuditLogs((prev) => [log, ...prev]);
  };

  const sendStaffInvitation = (data: Omit<StaffInvitation, 'id' | 'status' | 'invited_at'>): StaffInvitation => {
    const newInvitation: StaffInvitation = {
      id: `sinv-${Date.now()}`,
      ...data,
      status: 'pending',
      invited_at: new Date().toISOString(),
    };
    setStaffInvitations((prev) => {
      const updated = [newInvitation, ...prev];
      if (typeof window !== 'undefined') {
        localStorage.setItem('zabay_staff_invitations', JSON.stringify(updated));
      }
      return updated;
    });

    const newPerson: Personnel = {
      id: `per-${Date.now()}`,
      user_id: data.user_id,
      event_id: data.event_id,
      name: data.user_name,
      role: data.role,
      skills: ['Gate Clearance', 'Logistics', 'Event Operations'],
      phone: '+63 (917) 000-0000',
      email: data.user_email,
      hourly_rate: 450,
      is_available: false,
      can_scan_tickets: data.can_scan_tickets,
      invitation_status: 'pending',
      call_time: data.call_time,
      invited_at: new Date().toISOString(),
    };
    setPersonnel((prev) => [newPerson, ...prev]);

    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: `Staff Invitation Sent`,
      message: `Invited ${data.user_name} (${data.role}) to staff "${data.event_title}".`,
      type: 'info',
      timestamp: new Date().toISOString(),
      targetRole: 'staff',
      eventId: data.event_id,
      read: false,
    };
    setNotifications((prev) => [notif, ...prev]);

    return newInvitation;
  };

  const respondToStaffInvitation = (invitationId: string, accept: boolean) => {
    setStaffInvitations((prev) => {
      const updated = prev.map((inv) => {
        if (inv.id === invitationId) {
          return {
            ...inv,
            status: (accept ? 'confirmed' : 'declined') as StaffInvitationStatus,
            responded_at: new Date().toISOString(),
          };
        }
        return inv;
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem('zabay_staff_invitations', JSON.stringify(updated));
      }
      return updated;
    });

    const targetInvite = staffInvitations.find((inv) => inv.id === invitationId);
    if (targetInvite) {
      if (accept) {
        setPersonnel((prev) => {
          const existing = prev.find((p) => p.email.toLowerCase() === targetInvite.user_email.toLowerCase() || p.id === targetInvite.user_id);
          if (existing) {
            return prev.map((p) => (p.id === existing.id ? { ...p, invitation_status: 'confirmed', is_available: true, can_scan_tickets: targetInvite.can_scan_tickets } : p));
          }
          const confirmedPerson: Personnel = {
            id: targetInvite.user_id || `per-${Date.now()}`,
            user_id: targetInvite.user_id,
            event_id: targetInvite.event_id,
            name: targetInvite.user_name,
            role: targetInvite.role,
            skills: ['Gate Clearance', 'Logistics', 'Operations'],
            phone: '+63 (917) 389-1029',
            email: targetInvite.user_email,
            hourly_rate: 500,
            is_available: true,
            can_scan_tickets: targetInvite.can_scan_tickets,
            invitation_status: 'confirmed',
            call_time: targetInvite.call_time,
            invited_at: targetInvite.invited_at,
          };
          return [confirmedPerson, ...prev];
        });

        // Automatically assign matching tasks to this staff member
        setTasks((prevTasks) => {
          return prevTasks.map((t, idx) => {
            if (idx < 3 || t.committee === 'security' || t.title.toLowerCase().includes('gate') || t.title.toLowerCase().includes('turnstile')) {
              const currentAssignments = t.personnel_assignments || [];
              if (!currentAssignments.some((a) => a.personnel_id === targetInvite.user_id || a.personnel_name === targetInvite.user_name)) {
                return {
                  ...t,
                  personnel_assignments: [
                    ...currentAssignments,
                    {
                      personnel_id: targetInvite.user_id,
                      personnel_name: targetInvite.user_name,
                      role: targetInvite.role,
                    },
                  ],
                };
              }
            }
            return t;
          });
        });
      } else {
        setPersonnel((prev) =>
          prev.map((p) => (p.email.toLowerCase() === targetInvite.user_email.toLowerCase() ? { ...p, invitation_status: 'declined', is_available: false } : p))
        );
      }
    }
  };

  const sendCrewMessage = (eventId: string, message: string, isAnnouncement: boolean = false) => {
    const trimmed = message.trim();
    if (!trimmed) return;

    const newMsg: CrewChatMessage = {
      id: `cmsg-${Date.now()}`,
      event_id: eventId,
      sender_id: currentUser.id,
      sender_name: currentUser.name || 'Event Staff',
      sender_avatar: currentUser.avatar,
      sender_role: currentRole === 'organizer' ? 'Lead Organizer' : currentRole === 'venue_manager' ? 'Venue Manager' : 'Event Crew',
      message: trimmed,
      timestamp: new Date().toISOString(),
      is_announcement: isAnnouncement,
    };

    setCrewMessages((prev) => {
      const updated = [...prev, newMsg];
      if (typeof window !== 'undefined') {
        localStorage.setItem('zabay_crew_messages', JSON.stringify(updated));
      }
      return updated;
    });

    if (isAnnouncement) {
      const notif: AppNotification = {
        id: `notif-${Date.now()}`,
        title: 'Event Crew Announcement',
        message: `${newMsg.sender_name} (${newMsg.sender_role}): ${trimmed}`,
        type: 'info',
        timestamp: new Date().toISOString(),
        targetRole: 'staff',
        eventId,
        read: false,
      };
      setNotifications((prev) => [notif, ...prev]);
    }
  };

  const forkVenueLayout = (venueId: string, eventId: string, customName?: string): Venue => {
    const parentVenue = venues.find((v) => v.id === venueId) || venues[0];
    const forkedVenue: Venue = {
      ...parentVenue,
      id: `ven-fork-${Date.now()}`,
      name: customName || `${parentVenue.name} (Custom Event Setup)`,
      is_custom_fork: true,
      forked_from_id: parentVenue.id,
      forked_from_name: parentVenue.name,
      forked_by_user_id: currentUser.id,
      forked_by_user_name: currentUser.name,
      forked_for_event_id: eventId,
      is_verified_partner: false, // Verified partner status stays strictly with the master owner
      halls: parentVenue.halls ? parentVenue.halls.map((h) => ({ ...h, id: `vh-fork-${Date.now()}-${h.id}` })) : [],
    };

    setVenues((prev) => [forkedVenue, ...prev]);

    // Automatically assign to current event
    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, venue_id: forkedVenue.id } : e))
    );

    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: 'Facility Layout Forked',
      message: `Forked "${parentVenue.name}" layout for event staging. Master facility ownership remains with ${parentVenue.manager_name || 'verified partner'}.`,
      type: 'info',
      timestamp: new Date().toISOString(),
      targetRole: 'organizer',
      eventId,
      read: false,
    };
    setNotifications((prev) => [notif, ...prev]);

    return forkedVenue;
  };

  const value = useMemo(
    () => ({
      currentUser,
      setCurrentUser,
      currentRole,
      setCurrentRole: setRoleWithUser,
      operatorAuthenticated,
      signOut,
      theme,
      toggleTheme,
      isDemoMode,
      loadDemoData,
      clearToCleanSlate,
      isDevModeUnlocked,
      unlockedDevCode,
      unlockDevMode,
      lockDevMode,
      loadRole2DemoData,
      isLiveBackend,
      backendHealth,
      refreshBackendStatus,
      notifications,
      unreadNotificationCount,
      dismissNotification,
      broadcastEventChange,
      createEvent,
      events,
      selectedEvent,
      setSelectedEvent,
      venues,
      addVenue,
      venueBookings,
      resources,
      personnel,
      tasks,
      workflowKits: mockWorkflowKits,
      registrations,
      auditLogs,
      fnDownstreamImpact,
      fnScheduleImpact,
      fnMatchVenueToEvent,
      applyTaskDelay,
      resetTasksToDefault,
      addTask,
      updateTask,
      deleteTask,
      updateTaskStatus,
      loadTaskTemplate,
      committeeRoles,
      setCommitteeRoles,
      propagateCommitteeRoles,
      checkInAttendee,
      bookVenue,
      registerForEvent,
      addPersonnel,
      updatePersonnel,
      removePersonnel,
      staffInvitations,
      sendStaffInvitation,
      respondToStaffInvitation,
      crewMessages,
      sendCrewMessage,
      forkVenueLayout,
      activeStaffId,
      setActiveStaffId,
      previewStaffPortal,
      exitStaffPreview,
    }),
    [
      currentUser,
      currentRole,
      operatorAuthenticated,
      activeStaffId,
      committeeRoles,
      theme,
      isDemoMode,
      isDevModeUnlocked,
      unlockedDevCode,
      isLiveBackend,
      backendHealth,
      notifications,
      unreadNotificationCount,
      events,
      selectedEvent,
      venues,
      venueBookings,
      resources,
      personnel,
      staffInvitations,
      crewMessages,
      tasks,
      registrations,
      auditLogs,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
