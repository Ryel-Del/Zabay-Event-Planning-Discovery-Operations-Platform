import React from 'react';
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

export const AnalyticsDashboard: React.FC = () => {
  const { selectedEvent, tasks, resources, registrations, isDevModeUnlocked, loadDemoData } = useApp();

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

  // Metric derivations from views scoped to selectedEvent
  const eventTasks = tasks.filter((t) => t.event_id === selectedEvent.id);
  const eventRegistrations = registrations.filter((r) => r.event_id === selectedEvent.id);
  const totalRevenue = selectedEvent.tickets_sold * selectedEvent.ticket_price;
  const capacityPercent = selectedEvent.max_capacity > 0 ? Math.round((selectedEvent.tickets_sold / selectedEvent.max_capacity) * 100) : 0;
  const completedTasks = eventTasks.filter((t) => t.status === 'completed').length;
  const taskReadiness = eventTasks.length > 0 ? Math.round((completedTasks / eventTasks.length) * 100) : 0;
  const checkedInCount = eventRegistrations.filter((r) => r.status === 'checked_in').length;
  const attendanceRate = eventRegistrations.length > 0 ? Math.round((checkedInCount / eventRegistrations.length) * 100) : 0;

  // Chart 1: Hourly Check-in Flow (v_attendance_arrival_flow)
  const hourlyFlowData = [
    { time: '08:00', arrivals: 45, cumulative: 45 },
    { time: '09:00', arrivals: 320, cumulative: 365 },
    { time: '10:00', arrivals: 580, cumulative: 945 },
    { time: '11:00', arrivals: 260, cumulative: 1205 },
    { time: '12:00', arrivals: 115, cumulative: 1320 },
    { time: '13:00', arrivals: 60, cumulative: 1380 },
    { time: '14:00', arrivals: 40, cumulative: 1420 },
  ];

  // Chart 2: Resource Utilization (v_resource_utilization)
  const resourceData = resources.map((r) => ({
    name: r.name.split(' ').slice(0, 2).join(' '),
    allocated: r.total_quantity - r.available_quantity,
    available: r.available_quantity,
  }));

  // Chart 3: Personnel Workload in Hours (v_personnel_workload)
  const personnelWorkloadData = [
    { name: 'Danilo (Sound)', scheduledHours: 7.5, capacityHours: 8 },
    { name: 'Bea (Lights)', scheduledHours: 6.0, capacityHours: 8 },
    { name: 'Carlos (Stage)', scheduledHours: 8.0, capacityHours: 8 },
    { name: 'Aileen (Security)', scheduledHours: 7.0, capacityHours: 8 },
    { name: 'Mark (Referee)', scheduledHours: 5.5, capacityHours: 8 },
  ];

  // Chart 4: Revenue by Tier with matte organic tones
  const revenueTierData = [
    { name: 'General Admission (₱349)', value: 1040 * 349, color: '#B68366' },
    { name: 'VIP All-Access (₱499)', value: 380 * 499, color: '#A36B75' },
    { name: 'Sponsorship Exhibits', value: 85000, color: '#5F7D5B' },
  ];

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
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#EDF7F2] dark:bg-[#17271F] text-[#2B6149] dark:text-[#81B89B] border border-emerald-200 dark:border-emerald-900 font-semibold">
                Live Operational Metrics
              </span>
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Key indicators derived from registrations, task readiness, and resource allocations for {selectedEvent.title}.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-[#FAF9F5] dark:bg-[#171513] p-4 rounded-xl border border-stone-200/80 dark:border-stone-800/80 space-y-2">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 text-xs">
            <span>Capacity Fill Rate</span>
            <Users className="w-4 h-4 text-[#B68366] dark:text-[#D4A58C]" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-stone-900 dark:text-stone-100">{capacityPercent}%</span>
            <span className="text-xs text-stone-600 dark:text-stone-400 font-medium">
              {selectedEvent.tickets_sold} / {selectedEvent.max_capacity}
            </span>
          </div>
          <div className="w-full bg-stone-200 dark:bg-stone-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-[#B68366] dark:bg-[#D4A58C] h-full rounded-full" style={{ width: `${capacityPercent}%` }} />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-[#FAF9F5] dark:bg-[#171513] p-4 rounded-xl border border-stone-200/80 dark:border-stone-800/80 space-y-2">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 text-xs">
            <span>Gross Ticket Revenue</span>
            <span className="font-bold text-xs text-[#5F7D5B] dark:text-[#97B394]">₱</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-stone-900 dark:text-stone-100">₱{totalRevenue.toLocaleString()}</span>
            <span className="text-xs text-[#5F7D5B] dark:text-[#97B394] font-medium">Estimate</span>
          </div>
          <p className="text-[11px] text-stone-500">Payment processing is not connected</p>
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
              {completedTasks}/{tasks.length} tasks ready
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
            <span className="text-2xl font-black text-stone-900 dark:text-stone-100">{attendanceRate}%</span>
            <span className="text-xs text-stone-600 dark:text-stone-400 font-medium">
              {checkedInCount} checked in
            </span>
          </div>
          <p className="text-[11px] text-stone-500">Zero duplicate entries allowed</p>
        </div>
      </div>

      {/* 2-Column Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Arrival Flow */}
        <div className="bg-[#FAF9F5] dark:bg-[#171513] p-4 rounded-xl border border-stone-200/80 dark:border-stone-800/80 space-y-3">
          <h3 className="text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider flex items-center justify-between">
            <span>Attendee Arrival Flow</span>
            <span className="text-[10px] text-stone-400">Peak Check-in Timeline</span>
          </h3>
          <div className="h-60 w-full">
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
                <YAxis stroke="#8C8478" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-strong)', borderRadius: '12px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="arrivals" stroke="#B68366" strokeWidth={2} fillOpacity={1} fill="url(#flowGradWarm)" name="Arrivals / hr" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Resource Utilization */}
        <div className="bg-[#FAF9F5] dark:bg-[#171513] p-4 rounded-xl border border-stone-200/80 dark:border-stone-800/80 space-y-3">
          <h3 className="text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider flex items-center justify-between">
            <span>Equipment Allocation</span>
            <span className="text-[10px] text-stone-400">Allocated vs Free</span>
          </h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resourceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-stone-200 dark:text-stone-800" />
                <XAxis dataKey="name" stroke="#8C8478" fontSize={11} />
                <YAxis stroke="#8C8478" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-strong)', borderRadius: '12px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Bar dataKey="allocated" stackId="a" fill="#5F7D5B" name="Allocated to Tasks" />
                <Bar dataKey="available" stackId="a" fill="#DCD6CA" className="dark:fill-[#38332E]" name="Surplus Available" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Personnel Workload */}
        <div className="bg-[#FAF9F5] dark:bg-[#171513] p-4 rounded-xl border border-stone-200/80 dark:border-stone-800/80 space-y-3">
          <h3 className="text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider flex items-center justify-between">
            <span>Personnel Shift Allocation</span>
            <span className="text-[10px] text-stone-400">Hours Scheduled</span>
          </h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={personnelWorkloadData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-stone-200 dark:text-stone-800" />
                <XAxis dataKey="name" stroke="#8C8478" fontSize={11} />
                <YAxis stroke="#8C8478" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-strong)', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="scheduledHours" fill="#A36B75" radius={[6, 6, 0, 0]} name="Assigned Hours" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Revenue Distribution */}
        <div className="bg-[#FAF9F5] dark:bg-[#171513] p-4 rounded-xl border border-stone-200/80 dark:border-stone-800/80 space-y-3">
          <h3 className="text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider flex items-center justify-between">
            <span>Gross Revenue Stream</span>
            <span className="text-[10px] text-stone-400">Tiers & Sponsors</span>
          </h3>
          <div className="h-60 w-full flex items-center justify-center">
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
                  {revenueTierData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`₱${Number(val).toLocaleString()}`, 'Revenue']}
                  contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-strong)', borderRadius: '12px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
