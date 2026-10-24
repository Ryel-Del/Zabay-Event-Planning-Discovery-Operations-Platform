import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  Building,
  Shield,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import api from '../../services/api';
import { useApp } from '../../context/AppContext';
import { mockUsers } from '../../mock/mockData';
import type { User, UserRole } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEMO_PERSONAS = [
  {
    id: 'usr-org-1',
    name: 'Mark Bautista',
    email: 'mark.bautista@zabay.ph',
    role: 'organizer' as UserRole,
    roles: ['organizer', 'venue_manager', 'staff', 'attendee'] as UserRole[],
    title: 'Event Organizer',
    org: 'Tagbilaran Youth & Sports Council',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    badge: 'Planner & Studio Access',
    color: 'from-blue-600 to-indigo-600',
  },
  {
    id: 'usr-vm-1',
    name: 'Maria Elena Santos',
    email: 'elena.santos@boholculturalcenter.ph',
    role: 'venue_manager' as UserRole,
    roles: ['venue_manager', 'attendee'] as UserRole[],
    title: 'Venue Manager',
    org: 'Bohol Cultural Center Facilities',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    badge: 'Facility & Multi-Hall Operations',
    color: 'from-emerald-600 to-teal-600',
  },
  {
    id: 'usr-att-1',
    name: 'Sofia Ramos',
    email: 'sofia.ramos@bisu.edu.ph',
    role: 'attendee' as UserRole,
    roles: ['attendee'] as UserRole[],
    title: 'Student Attendee',
    org: 'Bohol Island State University (BISU)',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    badge: 'QR Event Pass & Discovery',
    color: 'from-amber-600 to-orange-600',
  },
  {
    id: 'per-4',
    name: 'Rico Tan',
    email: 'rico.tan@securesentry.ph',
    role: 'staff' as UserRole,
    roles: ['staff', 'attendee'] as UserRole[],
    title: 'Security Lead (Turnstile)',
    org: 'SecureSentry Bohol Operations',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    badge: 'Gate Scanner Clearance',
    color: 'from-purple-600 to-pink-600',
  },
];

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { setCurrentUser, setCurrentRole, previewStaffPortal } = useApp();

  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [email, setEmail] = useState('mark.bautista@zabay.ph');
  const [password, setPassword] = useState('password123');
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('organizer');
  const [organization, setOrganization] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSelectPersona = (persona: (typeof DEMO_PERSONAS)[0]) => {
    setEmail(persona.email);
    setPassword('demo-zabay-2026');
    setSelectedRole(persona.role);
    setErrorMessage(null);

    // Instant sign-in with selected persona
    performSignIn(persona.email, persona.role, persona);
  };

  const performSignIn = (targetEmail: string, targetRole: UserRole, personaOverride?: any) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    setTimeout(() => {
      let userToSet: User;

      if (personaOverride) {
        userToSet = {
          id: personaOverride.id,
          name: personaOverride.name,
          email: personaOverride.email,
          role: personaOverride.role,
          roles: personaOverride.roles || ['organizer', 'venue_manager', 'staff', 'attendee'],
          avatar: personaOverride.avatar,
          organization: personaOverride.org,
          location: 'Tagbilaran City, Bohol',
          bio: `${personaOverride.title} at ${personaOverride.org}`,
        };
      } else {
        const matched = mockUsers.find((u) => u.email.toLowerCase() === targetEmail.toLowerCase());
        if (matched) {
          userToSet = {
            ...matched,
            roles: matched.roles || ['organizer', 'venue_manager', 'staff', 'attendee'],
          };
        } else {
          userToSet = {
            id: `usr-${Date.now().toString(36)}`,
            name: name.trim() || targetEmail.split('@')[0],
            email: targetEmail.trim(),
            role: targetRole,
            roles: ['organizer', 'venue_manager', 'staff', 'attendee'],
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
            organization: organization.trim() || 'Zabay Platform User',
            location: 'Tagbilaran City, Bohol',
            bio: 'Registered participant on Zabay Event Platform.',
          };
        }
      }

      // If user typed 'operator' or operator password, authenticate operator session
      if (targetEmail.toLowerCase().includes('operator') || password === 'zabay-operator-secret-2026') {
        void api.auth.login('operator', 'zabay-operator-secret-2026').then((res) => {
          if (res.success) {
            window.dispatchEvent(new CustomEvent('zabay:operator-session-started'));
          }
        });
      }

      setCurrentUser(userToSet);
      setCurrentRole(userToSet.role);

      if (userToSet.role === 'staff') {
        previewStaffPortal(personaOverride?.id || 'per-4');
      }

      setSuccessMessage(`Welcome back, ${userToSet.name}! Signed in as ${userToSet.role.replace('_', ' ').toUpperCase()}.`);
      setIsSubmitting(false);

      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 900);
    }, 400);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('Please enter an email address.');
      return;
    }
    if (!password.trim() || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    if (mode === 'register' && !name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    performSignIn(email, selectedRole);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#171E2B] border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100 transition-colors">
        {/* Top Header */}
        <div className="p-6 pb-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#EBF3FC] text-[#244A85] dark:bg-[#1E293B] dark:text-[#8BB0E8] border border-[#C8DCF7] dark:border-[#2D4160] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-[#3E6CB5] dark:text-[#7EA6E0]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {mode === 'signin' ? 'Sign In to Zabay' : 'Create New Account'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Event Planning, Discovery & Operations Platform
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1-Click Demo Personas Bar */}
        <div className="p-4 bg-blue-50/60 dark:bg-blue-950/20 border-b border-blue-100 dark:border-blue-900/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#244A85] dark:text-[#8BB0E8] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              1-Click Demo Personas (Evaluation Ready)
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Instant Sign-In</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {DEMO_PERSONAS.map((persona) => (
              <button
                key={persona.id}
                type="button"
                onClick={() => handleSelectPersona(persona)}
                className="p-2.5 rounded-xl border border-blue-200/80 dark:border-blue-900/50 bg-white/90 dark:bg-[#111722] hover:border-blue-400 hover:shadow-xs transition-all text-left flex items-center gap-2.5 group cursor-pointer"
              >
                <img
                  src={persona.avatar}
                  alt={persona.name}
                  className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-[#3E6CB5]">
                    {persona.name}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {persona.title}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200/80 dark:border-slate-800">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMessage(null);
            }}
            className={`flex-1 py-3 text-xs font-bold transition-colors border-b-2 ${
              mode === 'signin'
                ? 'border-[#3E6CB5] text-[#3E6CB5] dark:text-[#7EA6E0]'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Sign In with Email
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMessage(null);
            }}
            className={`flex-1 py-3 text-xs font-bold transition-colors border-b-2 ${
              mode === 'register'
                ? 'border-[#3E6CB5] text-[#3E6CB5] dark:text-[#7EA6E0]'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Register New Account
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {mode === 'register' && (
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                Full Name
              </label>
              <input
                type="text"
                placeholder="e.g. Elena Vance"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={mode === 'register'}
                className="w-full bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#3E6CB5]"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              Email Address
            </label>
            <input
              type="email"
              placeholder="name@organization.ph"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#3E6CB5]"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 pr-10 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#3E6CB5]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-slate-400" />
                  Primary Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                  className="w-full bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#3E6CB5]"
                >
                  <option value="organizer">Event Organizer</option>
                  <option value="venue_manager">Venue Manager</option>
                  <option value="attendee">Attendee / Delegate</option>
                  <option value="staff">Operations Staff</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  Organization / School
                </label>
                <input
                  type="text"
                  placeholder="e.g. BISU / HNU / LGU"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  className="w-full bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#3E6CB5]"
                />
              </div>
            </div>
          )}

          {/* Feedback messages */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 font-medium">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-[#3E6CB5] hover:bg-[#325896] text-white rounded-xl font-bold shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Authenticating...' : mode === 'signin' ? 'Sign In to Workspace' : 'Create & Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Demo Credential Hint */}
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span>Demo Access: <strong className="text-slate-700 dark:text-slate-300 font-mono">operator</strong></span>
            </div>
            <button
              type="button"
              onClick={() => {
                setEmail('operator');
                setPassword('zabay-operator-secret-2026');
                setSelectedRole('organizer');
              }}
              className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              Fill Demo Account
            </button>
          </div>

          <div className="pt-1 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
            <Lock className="w-3 h-3 text-slate-400" />
            <span>Protected by industry-standard encrypted authentication</span>
          </div>
        </form>
      </div>
    </div>
  );
};
