import React, { createContext, useContext, useState, useMemo } from 'react';
import type {
  User,
  UserRole,
  ZabayEvent,
  Venue,
  VenueBooking,
  Resource,
  Personnel,
  Task,
  Registration,
  AuditLog,
  VenueMatchResult,
} from '../types';
import {
  mockCurrentUser,
  mockUsers,
  mockEvents,
  mockVenues,
  mockVenueBookings,
  mockResources,
  mockPersonnel,
  mockTasks,
  mockRegistrations,
  mockAuditLogs,
} from '../mock/mockData';

interface AppContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;

  theme: 'light' | 'dark';
  toggleTheme: () => void;

  events: ZabayEvent[];
  selectedEvent: ZabayEvent;
  setSelectedEvent: (event: ZabayEvent) => void;

  venues: Venue[];
  venueBookings: VenueBooking[];
  resources: Resource[];
  personnel: Personnel[];
  tasks: Task[];
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
  checkInAttendee: (qrCode: string) => { success: boolean; message: string; registration?: Registration; isDuplicate?: boolean };
  bookVenue: (venueId: string, eventId: string, startTime: string, endTime: string) => { success: boolean; message: string };
  registerForEvent: (eventId: string, ticketType: 'General Admission' | 'VIP Access', attendeeName: string, attendeeEmail: string) => { success: boolean; registration: Registration };
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
  const [currentUser, setCurrentUser] = useState<User>(mockCurrentUser);
  const [currentRole, setCurrentRole] = useState<UserRole>('organizer');

  const setRoleWithUser = (role: UserRole) => {
    setCurrentRole(role);
    const user = mockUsers.find((u) => u.role === role);
    if (user) setCurrentUser(user);
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

  const [events] = useState<ZabayEvent[]>(mockEvents);
  const [selectedEvent, setSelectedEvent] = useState<ZabayEvent>(mockEvents[0]);

  const [venues] = useState<Venue[]>(mockVenues);
  const [venueBookings, setVenueBookings] = useState<VenueBooking[]>(mockVenueBookings);
  const [resources] = useState<Resource[]>(mockResources);
  const [personnel] = useState<Personnel[]>(mockPersonnel);
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [registrations, setRegistrations] = useState<Registration[]>(mockRegistrations);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(mockAuditLogs);

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

  // Check-In Attendee with Database Duplicate Prevention
  const checkInAttendee = (qrCode: string) => {
    const reg = registrations.find(
      (r) => r.qr_pass_code.toUpperCase() === qrCode.trim().toUpperCase()
    );

    if (!reg) {
      return {
        success: false,
        message: 'Invalid QR pass code. No active registration record found in database.',
      };
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
      change_summary: `Admitted attendee ${reg.attendee_name} (${reg.ticket_type}) via QR Pass. Check-in registered into attendance table.`,
      created_at: new Date().toISOString(),
    };
    setAuditLogs((prev) => [checkInLog, ...prev]);

    return {
      success: true,
      registration: { ...reg, status: 'checked_in' as const },
      message: `Verified! Welcome ${reg.attendee_name} (${reg.ticket_type}).`,
    };
  };

  // Venue booking with EXCLUDE constraint simulation
  const bookVenue = (venueId: string, eventId: string, startTime: string, endTime: string) => {
    const venue = venues.find((v) => v.id === venueId);
    if (!venue) return { success: false, message: 'Venue does not exist' };

    const overlap = venueBookings.some((b) => {
      if (b.venue_id !== venueId || b.status === 'cancelled') return false;
      const bStart = new Date(b.start_time).getTime();
      const bEnd = new Date(b.end_time).getTime();
      const nStart = new Date(startTime).getTime();
      const nEnd = new Date(endTime).getTime();
      return Math.max(bStart, nStart) < Math.min(bEnd, nEnd);
    });

    if (overlap) {
      return {
        success: false,
        message: 'Database EXCLUDE Constraint Violation: The venue already has a confirmed booking that overlaps with the requested time window.',
      };
    }

    const newBooking: VenueBooking = {
      id: `vb-${Date.now()}`,
      venue_id: venueId,
      event_id: eventId,
      event_title: selectedEvent.title,
      start_time: startTime,
      end_time: endTime,
      status: 'confirmed',
    };

    setVenueBookings((prev) => [...prev, newBooking]);
    return { success: true, message: `Venue booking confirmed for ${venue.name}!` };
  };

  // Register for event (Attendee flow with simulated Stripe checkout)
  const registerForEvent = (
    eventId: string,
    ticketType: 'General Admission' | 'VIP Access',
    attendeeName: string,
    attendeeEmail: string
  ) => {
    const event = events.find((e) => e.id === eventId) || selectedEvent;
    const price = ticketType === 'VIP Access' ? Math.round(event.ticket_price * 1.4) : event.ticket_price;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const qrCode = `ZABAY-PASS-${randomSuffix}-${attendeeName.split(' ')[0].toUpperCase()}`;

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
      amount_paid: price,
      payment_id: `pay-${Date.now()}`,
    };

    setRegistrations((prev) => [newReg, ...prev]);

    return {
      success: true,
      registration: newReg,
    };
  };

  const value = useMemo(
    () => ({
      currentUser,
      setCurrentUser,
      currentRole,
      setCurrentRole: setRoleWithUser,
      theme,
      toggleTheme,
      events,
      selectedEvent,
      setSelectedEvent,
      venues,
      venueBookings,
      resources,
      personnel,
      tasks,
      registrations,
      auditLogs,
      fnDownstreamImpact,
      fnScheduleImpact,
      fnMatchVenueToEvent,
      applyTaskDelay,
      resetTasksToDefault,
      checkInAttendee,
      bookVenue,
      registerForEvent,
    }),
    [
      currentUser,
      currentRole,
      theme,
      events,
      selectedEvent,
      venues,
      venueBookings,
      resources,
      personnel,
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
