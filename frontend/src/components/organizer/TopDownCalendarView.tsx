import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Users,
  AlertTriangle,
  Filter,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Task, VenueBooking, TaskTrack } from '../../types';

export const TopDownCalendarView: React.FC = () => {
  const { tasks, selectedEvent, venues, venueBookings } = useApp();

  // Current calendar view month (Default to November 2026 for Bohol Basketball Championship)
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(10); // 0-indexed: 10 = November
  const [selectedDate, setSelectedDate] = useState<string>('2026-11-12');
  const [activeTrackFilter, setActiveTrackFilter] = useState<string>('all');

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Generate days in current month
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();

    const days: { dateString: string; dayNumber: number; isCurrentMonth: boolean }[] = [];

    // Prev month padding
    const prevMonthTotalDays = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthTotalDays - i;
      const m = currentMonth === 0 ? 12 : currentMonth;
      const y = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateString = `${y}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
      days.push({ dateString, dayNumber: d, isCurrentMonth: false });
    }

    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      const m = (currentMonth + 1).toString().padStart(2, '0');
      const dateString = `${currentYear}-${m}-${d.toString().padStart(2, '0')}`;
      days.push({ dateString, dayNumber: d, isCurrentMonth: true });
    }

    // Trailing days padding to 35 or 42
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const m = currentMonth === 11 ? 1 : currentMonth + 2;
      const y = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateString = `${y}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
      days.push({ dateString, dayNumber: d, isCurrentMonth: false });
    }

    return days;
  }, [currentYear, currentMonth]);

  // Aggregate items per date
  const dateDataMap = useMemo(() => {
    const map = new Map<
      string,
      {
        tasks: Task[];
        bookings: VenueBooking[];
        isEventDay: boolean;
        hasConflict: boolean;
      }
    >();

    calendarDays.forEach((day) => {
      // Find tasks matching due_date or default to 2026-11-12
      const dayTasks = tasks.filter((t) => {
        if (selectedEvent && t.event_id && t.event_id !== selectedEvent.id) return false;
        const d = t.due_date || '2026-11-12';
        if (d !== day.dateString) return false;
        if (activeTrackFilter !== 'all' && t.track !== activeTrackFilter) return false;
        return true;
      });

      // Find venue bookings that overlap with this date
      const dayBookings = venueBookings.filter((b) => {
        if (selectedEvent && b.event_id && b.event_id !== selectedEvent.id) return false;
        const bStart = b.start_time.split('T')[0];
        const bEnd = b.end_time.split('T')[0];
        return day.dateString >= bStart && day.dateString <= bEnd;
      });

      const isEventDay = selectedEvent
        ? day.dateString >= selectedEvent.start_date.split('T')[0] &&
          day.dateString <= selectedEvent.end_date.split('T')[0]
        : false;

      const hasConflict = dayTasks.some((t) => t.has_conflict);

      map.set(day.dateString, {
        tasks: dayTasks,
        bookings: dayBookings,
        isEventDay,
        hasConflict,
      });
    });

    return map;
  }, [calendarDays, tasks, venueBookings, selectedEvent, activeTrackFilter]);

  // Currently selected date breakdown
  const activeDayData = dateDataMap.get(selectedDate) || {
    tasks: [],
    bookings: [],
    isEventDay: false,
    hasConflict: false,
  };

  const venueMap = useMemo(() => {
    const vm = new Map<string, string>();
    venues.forEach((v) => vm.set(v.id, v.name));
    return vm;
  }, [venues]);

  // Operational metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const conflictCount = tasks.filter((t) => t.has_conflict).length;

  const getTrackBadge = (track?: TaskTrack) => {
    switch (track) {
      case 'venue_logistics':
        return { label: 'Venue', dot: 'bg-[#2B6149]', pill: 'bg-[#EDF7F2] text-[#2B6149] dark:bg-[#17271F] dark:text-[#81B89B]' };
      case 'technical_av':
        return { label: 'Stage & Sound', dot: 'bg-[#3E6CB5]', pill: 'bg-[#EBF3FC] text-[#244A85] dark:bg-[#1E293B] dark:text-[#8BB0E8]' };
      case 'marketing_tickets':
        return { label: 'Passes', dot: 'bg-[#7E57C2]', pill: 'bg-[#F5F0FA] text-[#5C3B87] dark:bg-[#231A2E] dark:text-[#B393DB]' };
      case 'day_of_ops':
        return { label: 'Day-of', dot: 'bg-[#D97706]', pill: 'bg-[#FFF9EB] text-[#7A5B14] dark:bg-[#2A2312] dark:text-[#E2C37A]' };
      default:
        return { label: 'Ops', dot: 'bg-slate-400', pill: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top-Down Executive Readiness Header */}
      <div className="bg-white dark:bg-[#171E2B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#EBF3FC] dark:bg-[#1E293B] text-[#3E6CB5] dark:text-[#7EA6E0]">
                <CalendarIcon className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Top-Down Operations & Schedule Calendar
              </h2>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-[#EDF7F2] text-[#2B6149] dark:bg-[#17271F] dark:text-[#81B89B]">
                Full Event Horizon
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Top-down bird's-eye view of venue access, technical staging windows, rehearsals, and gate openings.
            </p>
          </div>

          {/* Month Stepper */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-xs font-bold px-3 py-2 rounded-xl bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200/90 dark:border-slate-800 min-w-[140px] text-center text-slate-900 dark:text-slate-100">
              {monthNames[currentMonth]} {currentYear}
            </div>
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Readiness Bar */}
        <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <div className="flex justify-between text-slate-500 mb-1">
              <span>Event Preparation Readiness</span>
              <strong className="text-slate-800 dark:text-slate-200">{completionRate}%</strong>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-[#3E6CB5] dark:bg-[#6093DB] transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-[#2B6149] shrink-0" />
            <span className="text-slate-600 dark:text-slate-400">
              <strong>{completedTasks}</strong> of <strong>{totalTasks}</strong> tasks completed
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <span
              className={`w-3 h-3 rounded-full shrink-0 ${
                conflictCount > 0 ? 'bg-[#C45547]' : 'bg-[#2B6149]'
              }`}
            />
            <span className="text-slate-600 dark:text-slate-400">
              {conflictCount > 0 ? (
                <strong className="text-[#C45547]">{conflictCount} schedule bottleneck</strong>
              ) : (
                'Zero finish-to-start conflicts'
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mr-1">
          <Filter className="w-3.5 h-3.5" />
          Filter Track:
        </span>
        {[
          { id: 'all', label: 'All Operations' },
          { id: 'venue_logistics', label: 'Venue & Facilities' },
          { id: 'technical_av', label: 'Lights, Sound & Stage' },
          { id: 'marketing_tickets', label: 'Registration & Promotion' },
          { id: 'day_of_ops', label: 'Day-of Coordination' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTrackFilter(tab.id)}
            className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTrackFilter === tab.id
                ? 'bg-[#3E6CB5] text-white shadow-xs'
                : 'bg-white dark:bg-[#171E2B] border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Calendar Matrix & Daily Detail Drawer Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Monthly Calendar Grid (2 Cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-[#171E2B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3 transition-colors">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day) => {
              const data = dateDataMap.get(day.dateString);
              const isSelected = selectedDate === day.dateString;
              const hasTasks = data && data.tasks.length > 0;
              const hasBookings = data && data.bookings.length > 0;
              const isEventDay = data?.isEventDay;
              const hasConflict = data?.hasConflict;

              return (
                <div
                  key={day.dateString}
                  onClick={() => setSelectedDate(day.dateString)}
                  className={`min-h-[92px] p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#3E6CB5] ring-2 ring-[#3E6CB5]/20 bg-[#F3F7FD] dark:bg-[#1B2435]'
                      : isEventDay
                      ? 'border-[#C8DCF7] dark:border-[#2D4160] bg-[#FAFCFF] dark:bg-[#131A26]'
                      : 'border-slate-200/70 dark:border-slate-800/80 bg-[#FAFBFD] dark:bg-[#111722] hover:border-slate-300 dark:hover:border-slate-700'
                  } ${!day.isCurrentMonth ? 'opacity-40' : ''}`}
                >
                  {/* Date Number & Top Status */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold ${
                        isSelected
                          ? 'text-[#3E6CB5] dark:text-[#8BB0E8]'
                          : day.isCurrentMonth
                          ? 'text-slate-800 dark:text-slate-200'
                          : 'text-slate-400'
                      }`}
                    >
                      {day.dayNumber}
                    </span>

                    <div className="flex items-center gap-1">
                      {isEventDay && (
                        <span className="w-2 h-2 rounded-full bg-[#3E6CB5] shrink-0" title="Summit Day" />
                      )}
                      {hasConflict && (
                        <span className="w-2 h-2 rounded-full bg-[#C45547] shrink-0 animate-pulse" title="Bottleneck" />
                      )}
                    </div>
                  </div>

                  {/* Task & Booking Pills */}
                  <div className="space-y-1 my-1 overflow-hidden">
                    {hasBookings && (
                      <div className="text-[10px] px-1.5 py-0.5 rounded bg-[#EDF7F2] text-[#2B6149] dark:bg-[#17271F] dark:text-[#81B89B] truncate font-medium">
                        🏛️ {data.bookings[0].event_title.split(' ')[0]}
                      </div>
                    )}

                    {hasTasks && (
                      <div className="text-[10px] px-1.5 py-0.5 rounded bg-[#EBF3FC] text-[#244A85] dark:bg-[#1E293B] dark:text-[#8BB0E8] truncate font-medium">
                        ⚡ {data.tasks.length} task{data.tasks.length > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>

                  {/* Bottom Activity Indicators */}
                  <div className="flex items-center gap-1 pt-0.5">
                    {data?.tasks.slice(0, 3).map((t) => {
                      const badge = getTrackBadge(t.track);
                      return <span key={t.id} className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />;
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Date Run-Sheet Breakdown Drawer (1 Col) */}
        <div className="bg-white dark:bg-[#171E2B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4 transition-colors">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Selected Schedule Horizon
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-[#3E6CB5] dark:text-[#7EA6E0]" />
                {selectedDate}
              </h3>
            </div>

            {activeDayData.isEventDay && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#EBF3FC] text-[#244A85] dark:bg-[#1E293B] dark:text-[#8BB0E8] border border-[#C8DCF7] dark:border-[#2D4160]">
                Summit Live
              </span>
            )}
          </div>

          {/* Confirmed Venue Bookings on this Day */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#3E6CB5]" />
              Venue Reservations & Permits
            </h4>
            {activeDayData.bookings.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No venue reservation blocks on this date.</p>
            ) : (
              activeDayData.bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-[#F8FAFD] dark:bg-[#111722] space-y-1 text-xs"
                >
                  <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between gap-2">
                    <span>{venueMap.get(booking.venue_id) || 'Bohol Cultural Center'}</span>
                    {booking.hall_name && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#EBF3FC] dark:bg-[#1E293B] text-[#244A85] dark:text-[#8BB0E8] font-semibold shrink-0">
                        {booking.hall_name}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center justify-between">
                    <span>{booking.event_title}</span>
                    <span className="font-mono text-[#2B6149] dark:text-[#81B89B] font-semibold">
                      Confirmed
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Scheduled Tasks for this Day */}
          <div className="space-y-2 pt-2 border-t border-slate-200/80 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#3E6CB5]" />
              Operational Milestones ({activeDayData.tasks.length})
            </h4>

            {activeDayData.tasks.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No specific milestones scheduled for this date.</p>
            ) : (
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {activeDayData.tasks.map((task) => {
                  const trackBadge = getTrackBadge(task.track);

                  return (
                    <div
                      key={task.id}
                      className={`p-3 rounded-xl border text-xs space-y-1.5 transition-all ${
                        task.has_conflict
                          ? 'border-[#F5C2BC] dark:border-[#52251F] bg-[#FDF1EF] dark:bg-[#2E1A17]'
                          : 'border-slate-200/80 dark:border-slate-800 bg-[#F8FAFD] dark:bg-[#111722]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${trackBadge.pill}`}>
                          {trackBadge.label}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500">
                          {task.start_time} - {task.end_time}
                        </span>
                      </div>

                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        {task.title}
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        {task.description}
                      </p>

                      {task.personnel_assignments.length > 0 && (
                        <div className="pt-1 flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-300">
                          <Users className="w-3 h-3 text-slate-400" />
                          <span>
                            {task.personnel_assignments[0].personnel_name} ({task.personnel_assignments[0].role})
                          </span>
                        </div>
                      )}

                      {task.has_conflict && (
                        <div className="p-1.5 rounded bg-red-100 dark:bg-red-950/50 text-[#C45547] text-[10px] font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{task.conflict_reason}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
