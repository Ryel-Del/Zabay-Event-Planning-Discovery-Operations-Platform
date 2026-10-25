import {
  LayoutDashboard,
  CheckSquare,
  Building2,
  QrCode,
  Users,
  Compass,
  Ticket,
  User,
  Calendar,
  Box,
  ClipboardList,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface MobileBottomNavProps {
  currentView: string;
  onSelectView: (view: any) => void;
  onOpenScanner: () => void;
  onOpenProfile: () => void;
  onOpenAuth?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onSelectView,
  onOpenScanner,
  onOpenProfile,
  onOpenAuth,
}) => {
  const { currentRole, setCurrentRole, tasks, currentUser, isDevModeUnlocked } = useApp();

  const conflictCount = tasks.filter((t) => t.has_conflict).length;

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#111722]/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] px-2 pt-1 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] flex items-center justify-around select-none transition-colors"
    >
      {/* 1. ORGANIZER STUDIO BOTTOM BAR */}
      {currentRole === 'organizer' && (
        <>
          <button
            onClick={() => onSelectView('overview')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
              currentView === 'overview'
                ? 'text-[#244A85] dark:text-[#7EA6E0]'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-lg ${currentView === 'overview' ? 'bg-[#EBF3FC] dark:bg-[#1E293B]' : ''}`}>
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <span className={`text-[10px] mt-0.5 ${currentView === 'overview' ? 'font-bold' : 'font-medium'}`}>
              Overview
            </span>
          </button>

          <button
            onClick={() => onSelectView('kanban')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer relative ${
              currentView === 'kanban'
                ? 'text-[#244A85] dark:text-[#7EA6E0]'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-lg ${currentView === 'kanban' ? 'bg-[#EBF3FC] dark:bg-[#1E293B]' : ''}`}>
              <CheckSquare className="w-5 h-5" />
            </div>
            {conflictCount > 0 && (
              <span className="absolute top-0.5 right-2 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
            <span className={`text-[10px] mt-0.5 ${currentView === 'kanban' ? 'font-bold' : 'font-medium'}`}>
              Tasks
            </span>
          </button>

          {/* Central Elevated QR Scanner CTA */}
          <button
            onClick={onOpenScanner}
            className="flex flex-col items-center justify-center -mt-5 cursor-pointer group"
            title="Scan Attendee Pass QR"
          >
            <div className="w-12 h-12 rounded-full bg-[#3E6CB5] hover:bg-[#325896] text-white flex items-center justify-center shadow-lg shadow-blue-500/25 ring-4 ring-white dark:ring-[#111722] group-active:scale-95 transition-transform">
              <QrCode className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold text-[#3E6CB5] dark:text-[#7EA6E0] mt-0.5">
              Scanner
            </span>
          </button>

          <button
            onClick={() => onSelectView('venues')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
              currentView === 'venues'
                ? 'text-[#244A85] dark:text-[#7EA6E0]'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-lg ${currentView === 'venues' ? 'bg-[#EBF3FC] dark:bg-[#1E293B]' : ''}`}>
              <Building2 className="w-5 h-5" />
            </div>
            <span className={`text-[10px] mt-0.5 ${currentView === 'venues' ? 'font-bold' : 'font-medium'}`}>
              Venues
            </span>
          </button>

          <button
            onClick={() => onSelectView('attendees')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
              currentView === 'attendees'
                ? 'text-[#244A85] dark:text-[#7EA6E0]'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-lg ${currentView === 'attendees' ? 'bg-[#EBF3FC] dark:bg-[#1E293B]' : ''}`}>
              <Users className="w-5 h-5" />
            </div>
            <span className={`text-[10px] mt-0.5 ${currentView === 'attendees' ? 'font-bold' : 'font-medium'}`}>
              Guests
            </span>
          </button>
        </>
      )}

      {/* 2. VENUE MANAGER BOTTOM BAR */}
      {currentRole === 'venue_manager' && (
        <>
          <button
            onClick={() => onSelectView('overview')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
              currentView === 'overview'
                ? 'text-[#2B6149] dark:text-[#81B89B]'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <div className={`p-1 rounded-lg ${currentView === 'overview' ? 'bg-[#EDF7F2] dark:bg-[#17271F]' : ''}`}>
              <Building2 className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 font-medium">Halls</span>
          </button>

          <button
            onClick={() => onSelectView('calendar')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
              currentView === 'calendar'
                ? 'text-[#2B6149] dark:text-[#81B89B]'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <div className={`p-1 rounded-lg ${currentView === 'calendar' ? 'bg-[#EDF7F2] dark:bg-[#17271F]' : ''}`}>
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 font-medium">Schedule</span>
          </button>

          <button
            onClick={onOpenScanner}
            className="flex flex-col items-center justify-center -mt-5 cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-full bg-[#2B6149] hover:bg-[#234232] text-white flex items-center justify-center shadow-lg shadow-emerald-500/25 ring-4 ring-white dark:ring-[#111722] group-active:scale-95 transition-transform">
              <QrCode className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold text-[#2B6149] dark:text-[#81B89B] mt-0.5">Scanner</span>
          </button>

          <button
            onClick={() => onSelectView('inventory')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
              currentView === 'inventory'
                ? 'text-[#2B6149] dark:text-[#81B89B]'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <div className={`p-1 rounded-lg ${currentView === 'inventory' ? 'bg-[#EDF7F2] dark:bg-[#17271F]' : ''}`}>
              <Box className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 font-medium">Equipment</span>
          </button>

          <button
            onClick={onOpenProfile}
            className="flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer text-slate-500 dark:text-slate-400"
          >
            <div className="p-1 rounded-lg">
              <User className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 font-medium">Profile</span>
          </button>
        </>
      )}

      {/* 3. STAFF PORTAL BOTTOM BAR */}
      {currentRole === 'staff' && (
        <>
          <button
            onClick={() => setCurrentRole('staff')}
            className="flex flex-col items-center justify-center py-1 px-4 rounded-xl text-[#8C6212] dark:text-[#E8BD68]"
          >
            <div className="p-1 rounded-lg bg-[#FAF7EE] dark:bg-[#252219]">
              <ClipboardList className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 font-bold">My Shifts</span>
          </button>

          <button
            onClick={onOpenScanner}
            className="flex flex-col items-center justify-center -mt-5 cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-full bg-[#8C6212] hover:bg-[#68470B] text-white flex items-center justify-center shadow-lg ring-4 ring-white dark:ring-[#111722] group-active:scale-95 transition-transform">
              <QrCode className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold text-[#8C6212] dark:text-[#E8BD68] mt-0.5">Turnstile</span>
          </button>

          <button
            onClick={onOpenProfile}
            className="flex flex-col items-center justify-center py-1 px-4 rounded-xl text-slate-500 dark:text-slate-400"
          >
            <div className="p-1 rounded-lg">
              <User className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 font-medium">Crew Info</span>
          </button>
        </>
      )}

      {/* 4. PUBLIC ATTENDEE BOTTOM BAR */}
      {currentRole === 'attendee' && (
        <>
          <button
            onClick={() => {
              // Scroll to top or trigger explore
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex flex-col items-center justify-center py-1 px-3 text-[#244A85] dark:text-[#7EA6E0] cursor-pointer"
          >
            <div className="p-1 rounded-lg bg-[#EBF3FC] dark:bg-[#1E293B]">
              <Compass className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 font-bold">Discover</span>
          </button>

          <button
            onClick={onOpenProfile}
            className="flex flex-col items-center justify-center py-1 px-3 text-slate-500 dark:text-slate-400 cursor-pointer"
          >
            <div className="p-1 rounded-lg">
              <Ticket className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 font-medium">My Passes</span>
          </button>

          {(isDevModeUnlocked || currentUser.id !== 'usr-guest') && (
            <button
              onClick={() => setCurrentRole('organizer')}
              className="flex flex-col items-center justify-center py-1 px-3 text-slate-500 dark:text-slate-400 cursor-pointer"
            >
              <div className="p-1 rounded-lg">
                <LayoutDashboard className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5 font-medium">Studio</span>
            </button>
          )}

          <button
            onClick={() => (onOpenAuth ? onOpenAuth() : onOpenProfile())}
            className="flex flex-col items-center justify-center py-1 px-3 text-slate-500 dark:text-slate-400 cursor-pointer"
          >
            <div className="p-1 rounded-lg">
              <User className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 font-medium">
              {currentUser.id === 'usr-guest' ? 'Sign In' : 'Account'}
            </span>
          </button>
        </>
      )}
    </nav>
  );
};
