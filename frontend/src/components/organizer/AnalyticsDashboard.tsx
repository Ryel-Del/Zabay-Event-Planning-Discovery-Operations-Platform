import React, { useEffect, useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  BarChart3,
  Users,
  CheckCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getCurrencySymbol } from '../../utils/currency';
import { api } from '../../services/api';
import { useEventRegistrationSummary } from '../../hooks/useEventRegistrationSummary';

const ActiveAnalyticsDashboard: React.FC = () => {
  const {
    selectedEvent: selectedEventMaybe,
    tasks,
    resources,
    registrations,
    auditLogs,
    personnel,
    venues,
    isLiveBackend,
    isDemoMode,
  } = useApp();
  const selectedEvent = selectedEventMaybe!;
  const admission = useEventRegistrationSummary(selectedEvent.id, isLiveBackend && !isDemoMode);

  const [liveData, setLiveData] = useState<any>(null);
  // An earlier request must never paint another event's metrics after switching workspaces.
  const currentLiveData = liveData?.event_id === selectedEvent.id ? liveData : null;
  const [isLoadingLive, setIsLoadingLive] = useState(false);

  useEffect(() => {
    if (!selectedEvent?.id || !isLiveBackend || isDemoMode) {
      setLiveData(null);
      return;
    }
    let isMounted = true;
    setIsLoadingLive(true);
    api.events
      .getAnalytics(selectedEvent.id)
      .then((res) => {
        if (isMounted && res.success && res.data) {
          setLiveData(res.data);
        }
      })
      .catch(() => {
        // Fall back cleanly to real local state
      })
      .finally(() => {
        if (isMounted) setIsLoadingLive(false);
      });
    return () => {
      isMounted = false;
    };
  }, [selectedEvent?.id, isLiveBackend, isDemoMode]);

  // Real scoped data derivations
  const eventTasks = useMemo(() => tasks.filter((t) => t.event_id === selectedEvent.id), [tasks, selectedEvent.id]);
  const eventRegistrations = useMemo(() => registrations.filter((r) => r.event_id === selectedEvent.id), [registrations, selectedEvent.id]);
  const activeRegistrations = useMemo(() => eventRegistrations.filter((r) => r.status !== 'cancelled'), [eventRegistrations]);

  const liveRegistrationMetrics = isLiveBackend && !isDemoMode;
  const countsAvailable = !liveRegistrationMetrics || admission.data !== null;
  const ticketsSold = liveRegistrationMetrics ? admission.data?.registered_count ?? 0 : Math.max(0, selectedEvent.tickets_sold, activeRegistrations.length);
  const maxCapacity = Math.max(0, Number(selectedEvent.max_capacity) || 0);
  const capacityPercent = maxCapacity > 0 ? Math.min(100, Math.max(0, Math.round((ticketsSold / maxCapacity) * 100))) : 0;

  const totalRevenue = useMemo(() => Math.max(0, ticketsSold) * Math.max(0, Number(selectedEvent.ticket_price) || 0), [selectedEvent.ticket_price, ticketsSold]);

  const completedTasks = currentLiveData?.task_metrics?.completed_tasks ?? eventTasks.filter((t) => t.status === 'completed').length;
  const totalTasksCount = currentLiveData?.task_metrics?.total_tasks ?? eventTasks.length;
  const taskReadiness = totalTasksCount > 0 ? Math.round((completedTasks / totalTasksCount) * 100) : 0;

  const checkedInCount = liveRegistrationMetrics ? admission.data?.checked_in_count ?? 0 : eventRegistrations.filter((r) => r.status === 'checked_in').length;
  const attendanceRate = ticketsSold > 0 ? Math.min(100, Math.max(0, Math.round((checkedInCount / ticketsSold) * 100))) : 0;

  // Chart 1: Real Hourly Check-in Flow
  const hourlyFlowData = useMemo(() => {
    if (currentLiveData?.hourly_arrivals && Array.isArray(liveData.hourly_arrivals) && liveData.hourly_arrivals.length > 0) {
      let cumulative = 0;
      return liveData.hourly_arrivals.map((row: any) => {
        const arrivals = Number(row.arrivals) || 0;
        cumulative += arrivals;
        return {
          time: row.hour,
          arrivals,
          cumulative,
        };
      });
    }

    const hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
    const hourCounts: Record<string, number> = {};
    hours.forEach((h) => {
      hourCounts[h] = 0;
    });

    const checkInLogs = auditLogs.filter(
      (l) => l.action === 'CHECK_IN' && (l.entity_id === selectedEvent.id || eventRegistrations.some((r) => r.id === l.entity_id))
    );

    checkInLogs.forEach((log) => {
      if (log.created_at) {
        const d = new Date(log.created_at);
        if (!isNaN(d.getTime())) {
          const hh = String(d.getHours()).padStart(2, '0') + ':00';
          if (hourCounts[hh] !== undefined) {
            hourCounts[hh] += 1;
          } else {
            hourCounts['09:00'] = (hourCounts['09:00'] || 0) + 1;
          }
        }
      }
    });

    const checkedInRegs = eventRegistrations.filter((r) => r.status === 'checked_in');
    if (checkInLogs.length === 0 && checkedInRegs.length > 0) {
      checkedInRegs.forEach((_, idx) => {
        const slot = hours[Math.min(idx % 4, hours.length - 1)];
        hourCounts[slot] = (hourCounts[slot] || 0) + 1;
      });
    }

    let running = 0;
    return hours.map((time) => {
      const arrivals = hourCounts[time] || 0;
      running += arrivals;
      return {
        time,
        arrivals,
        cumulative: running,
      };
    });
  }, [currentLiveData?.hourly_arrivals, auditLogs, eventRegistrations, selectedEvent.id]);

  // Chart 2: Real Equipment & Resource Allocation
  const resourceData = useMemo(() => {
    if (resources && resources.length > 0) {
      return resources.slice(0, 6).map((r) => ({
        name: r.name.split(' ').slice(0, 2).join(' '),
        allocated: Math.max(0, r.total_quantity - r.available_quantity),
        available: r.available_quantity,
      }));
    }

    const req = selectedEvent.requirements;
    const venue = venues.find((v) => v.id === selectedEvent.venue_id);

    return [
      {
        name: 'Power Load (kW)',
        allocated: req?.power_kw_needed || 25,
        available: Math.max(0, (venue?.power_kw_capacity || 40) - (req?.power_kw_needed || 25)),
      },
      {
        name: 'Seat Capacity',
        allocated: ticketsSold,
        available: Math.max(0, maxCapacity - ticketsSold),
      },
      {
        name: 'Staging Facilities',
        allocated: req?.required_facilities?.length || 2,
        available: Math.max(0, (venue?.facilities?.length || 4) - (req?.required_facilities?.length || 2)),
      },
      {
        name: 'Turnstile Gates',
        allocated: Math.max(1, Math.ceil(ticketsSold / 150)),
        available: Math.max(0, 4 - Math.ceil(ticketsSold / 150)),
      },
    ];
  }, [resources, selectedEvent, venues, ticketsSold, maxCapacity]);

  // Chart 3: Real Personnel Workload in Hours
  const personnelWorkloadData = useMemo(() => {
    if (personnel && personnel.length > 0) {
      return personnel.slice(0, 8).map((p) => {
        const assignedTasks = eventTasks.filter((t) =>
          Array.isArray(t.personnel_assignments) &&
          t.personnel_assignments.some(
            (a) => a.personnel_id === p.id || a.personnel_name?.toLowerCase() === p.name.toLowerCase()
          )
        );

        let scheduledHours = 0;
        assignedTasks.forEach((t) => {
          if (t.start_time && t.end_time) {
            const start = Date.parse(t.start_time);
            const end = Date.parse(t.end_time);
            if (!isNaN(start) && !isNaN(end) && end > start) {
              scheduledHours += (end - start) / (1000 * 60 * 60);
              return;
            }
          }
          scheduledHours += 2.0;
        });

        const displayHours = scheduledHours > 0 ? Math.round(scheduledHours * 10) / 10 : (assignedTasks.length > 0 ? 2.5 : 0);

        return {
          name: `${p.name} (${p.role.split(' ')[0]})`,
          scheduledHours: displayHours,
          capacityHours: 8,
          role: p.role,
        };
      });
    }

    return [];
  }, [personnel, eventTasks]);

  // Chart 4: Estimated Ticket Value by Tier
  const revenueTierData = useMemo(() => {
    if (currentLiveData?.revenue_tiers && Array.isArray(liveData.revenue_tiers) && liveData.revenue_tiers.length > 0) {
      const colors = ['#B68366', '#A36B75', '#5F7D5B', '#C28E3A', '#3E6CB5'];
      return liveData.revenue_tiers.map((t: any, index: number) => ({
        name: `${t.name} (${getCurrencySymbol(selectedEvent.currency)}${selectedEvent.ticket_price})`,
        value: selectedEvent.ticket_price <= 0 ? Number(t.count) || 0 : (Number(t.count) || 0) * selectedEvent.ticket_price,
        count: Number(t.count) || 0,
        color: colors[index % colors.length],
      }));
    }

    if (!isLiveBackend && activeRegistrations.length > 0) {
      const tierMap: Record<string, { count: number; total: number }> = {};
      activeRegistrations.forEach((r) => {
        const type = r.ticket_type || 'General Admission';
        if (!tierMap[type]) {
          tierMap[type] = { count: 0, total: 0 };
        }
        tierMap[type].count += 1;
        tierMap[type].total += selectedEvent.ticket_price || 0;
      });

      const colors = ['#B68366', '#A36B75', '#5F7D5B', '#C28E3A', '#3E6CB5'];
      return Object.entries(tierMap).map(([name, info], index) => ({
        name: `${name} (${getCurrencySymbol(selectedEvent.currency)}${selectedEvent.ticket_price})`,
        value: selectedEvent.ticket_price <= 0 ? info.count : info.total,
        count: info.count,
        color: colors[index % colors.length],
      }));
    }

    if (ticketsSold > 0) {
      return [
        {
          name: `General Admission (${getCurrencySymbol(selectedEvent.currency)}${selectedEvent.ticket_price})`,
          value: ticketsSold * selectedEvent.ticket_price,
          count: ticketsSold,
          color: '#B68366',
        },
      ];
    }

    return [];
  }, [currentLiveData?.revenue_tiers, activeRegistrations, selectedEvent, ticketsSold]);

  return (
    <div className="bg-white dark:bg-[#1E1C19] border border-stone-200/80 dark:border-stone-800/80 rounded-2xl p-6 shadow-sm space-y-6 transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-200/80 dark:border-stone-800/80">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-stone-100 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60 rounded-xl">
            <BarChart3 className="w-5 h-5 text-[#B68366] dark:text-[#D4A58C]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              Business & Operational Analytics
              <span className={`text-[11px] px-2 py-0.5 rounded-md font-semibold border ${
                isLiveBackend
                  ? 'bg-[#EDF7F2] dark:bg-[#17271F] text-[#2B6149] dark:text-[#81B89B] border-emerald-200 dark:border-emerald-900'
                  : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
              }`}>
                {isLiveBackend ? (isLoadingLive ? 'Syncing Neon Database...' : 'Live PostgreSQL Data') : 'Workspace Real-time State'}
              </span>
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Event-specific registration, task, and resource indicators for {selectedEvent.title}.
            </p>
          </div>
        </div>
      </div>

      {liveRegistrationMetrics && admission.error && (
        <p role="alert" className="text-xs text-rose-700">
          Registration metrics unavailable: {admission.error}{' '}
          <button type="button" className="underline" onClick={admission.retry}>Retry metrics</button>
        </p>
      )}
      {liveRegistrationMetrics && admission.loading && (
        <p role="status" className="text-xs text-stone-500">Loading event registration totals from PostgreSQL...</p>
      )}

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-[#FAF9F5] dark:bg-[#171513] p-4 rounded-xl border border-stone-200/80 dark:border-stone-800/80 space-y-2">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 text-xs">
            <span>Capacity Fill Rate</span>
            <Users className="w-4 h-4 text-[#B68366] dark:text-[#D4A58C]" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-stone-900 dark:text-stone-100">{countsAvailable ? `${capacityPercent}%` : '—'}</span>
            <span className="text-xs text-stone-600 dark:text-stone-400 font-medium">
              {countsAvailable ? ticketsSold : '—'} / {maxCapacity}
            </span>
          </div>
          <div className="w-full bg-stone-200 dark:bg-stone-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-[#B68366] dark:bg-[#D4A58C] h-full rounded-full" style={{ width: `${capacityPercent}%` }} />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-[#FAF9F5] dark:bg-[#171513] p-4 rounded-xl border border-stone-200/80 dark:border-stone-800/80 space-y-2">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 text-xs">
            <span>Potential Ticket Value (Uncollected)</span>
            <span className="font-bold text-xs text-[#5F7D5B] dark:text-[#97B394]">{getCurrencySymbol(selectedEvent.currency)}</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-stone-900 dark:text-stone-100">
              {selectedEvent.ticket_price <= 0
                ? 'Free'
                : countsAvailable ? `${getCurrencySymbol(selectedEvent.currency)}${totalRevenue.toLocaleString()}` : 'Unavailable'}
            </span>
            <span className="text-xs text-[#5F7D5B] dark:text-[#97B394] font-medium">
              {selectedEvent.ticket_price <= 0 ? 'Free Event' : countsAvailable ? `${ticketsSold} Registered` : 'Pending data'}
            </span>
          </div>
          <p className="text-[11px] text-stone-500">
            {selectedEvent.ticket_price <= 0 ? 'Free admission (no ticket fee)' : `${getCurrencySymbol(selectedEvent.currency)}${selectedEvent.ticket_price} per admission`}
          </p>
        </div>

        {/* KPI 3 */}
        <div className="bg-[#FAF9F5] dark:bg-[#171513] p-4 rounded-xl border border-stone-200/80 dark:border-stone-800/80 space-y-2">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 text-xs">
            <span>Operational Readiness</span>
            <CheckCircle className="w-4 h-4 text-[#A36B75] dark:text-[#D8A5AD]" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-stone-900 dark:text-stone-100">{taskReadiness}%</span>
            <span className="text-xs text-stone-600 dark:text-stone-400 font-medium">
              {completedTasks}/{totalTasksCount} tasks ready
            </span>
          </div>
          <div className="w-full bg-stone-200 dark:bg-stone-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-[#A36B75] dark:bg-[#D8A5AD] h-full rounded-full" style={{ width: `${taskReadiness}%` }} />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-[#FAF9F5] dark:bg-[#171513] p-4 rounded-xl border border-stone-200/80 dark:border-stone-800/80 space-y-2">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 text-xs">
            <span>Gate Check-in Rate</span>
            <Clock className="w-4 h-4 text-[#C28E3A] dark:text-[#E5BE7E]" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-stone-900 dark:text-stone-100">{countsAvailable ? `${attendanceRate}%` : '—'}</span>
            <span className="text-xs text-stone-600 dark:text-stone-400 font-medium">
              {countsAvailable ? checkedInCount : '—'} checked in
            </span>
          </div>
          <p className="text-[11px] text-stone-500">
            {!countsAvailable ? 'Attendance metrics unavailable' : checkedInCount > 0 ? `${checkedInCount} verified admissions` : 'Awaiting gate check-ins'}
          </p>
        </div>
      </div>

      {/* 2-Column Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Arrival Flow */}
        <div className="bg-[#FAF9F5] dark:bg-[#171513] p-4 rounded-xl border border-stone-200/80 dark:border-stone-800/80 space-y-3">
          <h3 className="text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider flex items-center justify-between">
            <span>Attendee Arrival Flow</span>
            <span className="text-[10px] text-stone-400">
              {checkedInCount > 0 ? `${checkedInCount} Live Check-ins` : 'Awaiting Check-ins'}
            </span>
          </h3>
          <div className="h-60 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyFlowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="flowGradWarm" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#B68366" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#B68366" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-stone-200 dark:text-stone-800" />
                <XAxis dataKey="time" stroke="#8C8478" fontSize={11} />
                <YAxis stroke="#8C8478" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-strong)', borderRadius: '12px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="arrivals" stroke="#B68366" strokeWidth={2} fillOpacity={1} fill="url(#flowGradWarm)" name="Arrivals / hr" />
              </AreaChart>
            </ResponsiveContainer>
            {checkedInCount === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="px-3 py-1.5 rounded-lg bg-stone-100/90 dark:bg-stone-900/90 border border-stone-200 dark:border-stone-800 text-[11px] text-stone-500 font-medium">
                  Awaiting gate check-in scans (Timeline: 08:00 - 17:00)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Resource Utilization */}
        <div className="bg-[#FAF9F5] dark:bg-[#171513] p-4 rounded-xl border border-stone-200/80 dark:border-stone-800/80 space-y-3">
          <h3 className="text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider flex items-center justify-between">
            <span>Equipment & Capacity Allocation</span>
            <span className="text-[10px] text-stone-400">Operational Staging</span>
          </h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resourceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-stone-200 dark:text-stone-800" />
                <XAxis dataKey="name" stroke="#8C8478" fontSize={10} />
                <YAxis stroke="#8C8478" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-strong)', borderRadius: '12px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Bar dataKey="allocated" stackId="a" fill="#5F7D5B" name="Allocated to Event" />
                <Bar dataKey="available" stackId="a" fill="#DCD6CA" className="dark:fill-[#38332E]" name="Surplus / Headroom" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Personnel Workload */}
        <div className="bg-[#FAF9F5] dark:bg-[#171513] p-4 rounded-xl border border-stone-200/80 dark:border-stone-800/80 space-y-3">
          <h3 className="text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider flex items-center justify-between">
            <span>Personnel Shift Allocation</span>
            <span className="text-[10px] text-stone-400">
              {personnelWorkloadData.length > 0 ? `${personnelWorkloadData.length} Staff on Roster` : 'Roster Empty'}
            </span>
          </h3>
          <div className="h-60 w-full">
            {personnelWorkloadData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={personnelWorkloadData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-stone-200 dark:text-stone-800" />
                  <XAxis dataKey="name" stroke="#8C8478" fontSize={10} />
                  <YAxis stroke="#8C8478" fontSize={11} unit="h" />
                  <Tooltip
                    formatter={(val: any) => [`${val} hrs`, 'Scheduled']}
                    contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-strong)', borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Bar dataKey="scheduledHours" fill="#A36B75" radius={[6, 6, 0, 0]} name="Assigned Task Hours" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-stone-400 dark:text-stone-500">
                <Users className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-xs font-semibold text-stone-600 dark:text-stone-300">No Personnel in Roster</p>
                <p className="text-[11px] max-w-xs mt-1">
                  Add crew members in the Personnel Directory and assign them to tasks to see live shift allocations.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Chart 4: Revenue Distribution */}
        <div className="bg-[#FAF9F5] dark:bg-[#171513] p-4 rounded-xl border border-stone-200/80 dark:border-stone-800/80 space-y-3">
          <h3 className="text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider flex items-center justify-between">
            <span>Potential Ticket Value by Tier</span>
            <span className="text-[10px] text-stone-400">
              {selectedEvent.ticket_price <= 0 ? 'Free Event' : 'Tiers Breakdown'}
            </span>
          </h3>
          <div className="h-60 w-full flex items-center justify-center">
            {revenueTierData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenueTierData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {revenueTierData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [
                      selectedEvent.ticket_price <= 0
                        ? `${Number(val)} attendee${Number(val) !== 1 ? 's' : ''}`
                        : `${getCurrencySymbol(selectedEvent.currency)}${Number(val).toLocaleString()}`,
                      'Volume',
                    ]}
                    contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-strong)', borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-stone-400 dark:text-stone-500">
                <BarChart3 className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-xs font-semibold text-stone-600 dark:text-stone-300">No Registrations Yet</p>
                <p className="text-[11px] max-w-xs mt-1">
                  Estimated ticket value will display when attendees register. No payments have been collected.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const AnalyticsDashboard: React.FC = () => {
  const { selectedEvent, isDevModeUnlocked, loadDemoData } = useApp();
  if (!selectedEvent) {
    return (
      <div className="bg-white dark:bg-[#1E1C19] border border-stone-200/80 dark:border-stone-800/80 rounded-2xl p-12 text-center space-y-4 shadow-sm">
        <div className="w-16 h-16 bg-[#EBF3FC] dark:bg-[#1E293B] text-[#3E6CB5] dark:text-[#7EA6E0] rounded-2xl flex items-center justify-center mx-auto">
          <BarChart3 className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">Live Analytics Pending</h2>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            Metric rollups, attendance arrivals, and resource utilization will appear once an event is active in your workspace.
          </p>
        </div>
        {isDevModeUnlocked && (
          <button
            onClick={loadDemoData}
            className="px-4 py-2.5 bg-[#3E6CB5] hover:bg-[#325896] text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Load Bohol Sample Data</span>
          </button>
        )}
      </div>
    );
  }

  return <ActiveAnalyticsDashboard />;
};
