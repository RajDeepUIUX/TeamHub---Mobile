import React, { useState } from 'react';
import {
  Search,
  X,
  UserRound,
  Clock3,
  TrendingUp,
  IdCard,
  ChevronRight,
  Timer,
  Headphones,
  FileText,
  Ticket,
  MessageCircle,
  Coins,
  Phone,
  Laptop,
  Users,
  Car,
  CalendarCheck,
  CalendarDays,
  Luggage,
  Building2,
  Newspaper,
  Megaphone,
  UsersRound,
  GraduationCap,
  BookOpen,
  ClipboardList,
  Award,
} from 'lucide-react';
import type { UserRole } from '../../types/user';

export interface MoreModule {
  id: string;
  label: string;
  hint: string;
  icon: React.ElementType;
  tint: string;
  /** Roles that can see this module (all roles when omitted) */
  roles?: UserRole[];
}

export interface MoreGroup {
  id: string;
  label: string;
  icon: React.ElementType;
  modules: MoreModule[];
}

/** Portal modules shown under "More" (add new groups/modules here) */
export const MORE_GROUPS: MoreGroup[] = [
  {
    // Company-wide announcements, the same for every role
    id: 'company',
    label: 'Company',
    icon: Megaphone,
    modules: [
      { id: 'company-feed', label: 'Company Feed', hint: "What's happening around the company", icon: Newspaper, tint: 'bg-indigo-50 text-indigo-600' },
    ],
  },
  {
    // Same tabs as the Attendance bottom-nav screen
    id: 'attendance-leaves',
    label: 'Attendance & Leaves',
    icon: CalendarCheck,
    modules: [
      { id: 'Attendance', label: 'Attendance', hint: 'Daily punches & regularization', icon: CalendarCheck, tint: 'bg-blue-50 text-[#2F68FE]' },
      { id: 'Leaves', label: 'Leaves', hint: 'Apply for leave & check balances', icon: Luggage, tint: 'bg-rose-50 text-rose-500' },
      { id: 'Holidays', label: 'Holidays', hint: 'Company holiday calendar', icon: CalendarDays, tint: 'bg-amber-50 text-amber-600' },
      { id: 'WFO Days', label: 'WFO Days', hint: 'Work-from-office days & requests', icon: Building2, tint: 'bg-emerald-50 text-emerald-600' },
    ],
  },
  {
    id: 'staff',
    label: 'Staff',
    icon: UserRound,
    modules: [
      {
        id: 'my-team',
        label: 'My Team',
        hint: 'Team members, CTC & reviews',
        icon: UsersRound,
        tint: 'bg-sky-50 text-sky-600',
        roles: ['Manager'],
      },
      { id: 'work-timing', label: 'Work Timing', hint: 'Shift hours & flexibility requests', icon: Clock3, tint: 'bg-blue-50 text-[#2F68FE]' },
      { id: 'ot-request', label: 'OT Availability', hint: 'Share the extra hours you can take on', icon: Timer, tint: 'bg-amber-50 text-amber-600' },
      {
        id: 'appraisal',
        label: 'Appraisal',
        hint: 'Reviews, goals & ratings',
        icon: TrendingUp,
        tint: 'bg-emerald-50 text-emerald-600',
        roles: ['Manager'],
      },
      {
        id: 'work-profile',
        label: 'Work Profile',
        hint: 'Role, team & reporting line',
        icon: IdCard,
        tint: 'bg-violet-50 text-violet-600',
        roles: ['Manager'],
      },
    ],
  },
  {
    // Learning & Development, the same for every role
    id: 'learning-development',
    label: 'L&D',
    icon: GraduationCap,
    modules: [
      { id: 'my-learning', label: 'My Learning', hint: 'Your courses, progress & certificates', icon: BookOpen, tint: 'bg-indigo-50 text-indigo-600' },
      { id: 'training-request', label: 'Training Request', hint: 'Request a course or training session', icon: ClipboardList, tint: 'bg-teal-50 text-teal-600' },
      { id: 'recognitions', label: 'Recognitions', hint: 'Awards & appreciation from your team', icon: Award, tint: 'bg-amber-50 text-amber-600' },
    ],
  },
  {
    // Same modules as Profile › Support
    id: 'support',
    label: 'Support',
    icon: Headphones,
    modules: [
      { id: 'Resignation', label: 'Resignation', hint: 'Apply for or track your resignation', icon: FileText, tint: 'bg-rose-50 text-rose-500' },
      { id: 'Tickets', label: 'Tickets', hint: 'Raise and track support tickets', icon: Ticket, tint: 'bg-violet-50 text-violet-600' },
      { id: 'Feedback', label: 'Feedback', hint: 'Share feedback with the team', icon: MessageCircle, tint: 'bg-sky-50 text-sky-600' },
      {
        id: 'Adv. Salary & EV Loan',
        label: 'Adv. Salary & EV Loan',
        hint: 'Salary advance and EV loan requests',
        icon: Coins,
        tint: 'bg-amber-50 text-amber-600',
      },
      { id: 'Relevant Contacts', label: 'Relevant Contacts', hint: 'Key people to reach out to', icon: Phone, tint: 'bg-emerald-50 text-emerald-600' },
      { id: 'Asset', label: 'Asset', hint: 'Devices and equipment assigned to you', icon: Laptop, tint: 'bg-indigo-50 text-indigo-600' },
      { id: 'VOIP Directory', label: 'VOIP Directory', hint: "Find colleagues' extensions", icon: Users, tint: 'bg-teal-50 text-teal-600' },
      { id: 'Cab Request', label: 'Cab Request', hint: 'Book office transport', icon: Car, tint: 'bg-cyan-50 text-cyan-600' },
    ],
  },
];

interface MoreViewProps {
  role: UserRole;
  onOpenModule: (module: MoreModule) => void;
}

export const MoreView: React.FC<MoreViewProps> = ({ role, onOpenModule }) => {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  const groups = MORE_GROUPS.map((g) => ({
    ...g,
    modules: g.modules.filter(
      (m) =>
        (!m.roles || m.roles.includes(role)) &&
        (!q || m.label.toLowerCase().includes(q) || m.hint.toLowerCase().includes(q))
    ),
  })).filter((g) => g.modules.length > 0);

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      <header className="shrink-0 bg-white border-b border-[#EBF0F7] px-4 pt-3 pb-3">
        <h1 className="text-lg font-bold">More</h1>
        <p className="text-[11px] text-slate-400">All modules in your MYCPE ONE portal</p>
        <div className="relative mt-3">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search modules..."
            className="w-full h-11 pl-10 pr-9 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-[#1E293B] placeholder:text-slate-400 focus:outline-hidden focus:border-[#2F68FE] focus:ring-4 focus:ring-blue-50 select-text"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
        {groups.map((g) => {
          const GroupIcon = g.icon;
          return (
            <section key={g.id}>
              <h2 className="px-1 mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <GroupIcon className="w-3.5 h-3.5" />
                {g.label}
                <span className="font-medium normal-case tracking-normal">· {g.modules.length}</span>
              </h2>
              <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden">
                {g.modules.map((m, idx) => {
                  const Icon = m.icon;
                  const last = idx === g.modules.length - 1;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => onOpenModule(m)}
                      className="w-full flex items-center gap-3 pl-3.5 text-left active:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${m.tint}`}>
                        <Icon className="w-5 h-5" />
                      </span>
                      <span className={`flex-1 min-w-0 flex items-center gap-3 py-3.5 pr-3.5 ${last ? '' : 'border-b border-slate-100'}`}>
                        <span className="flex-1 min-w-0">
                          <span className="block text-[13px] font-semibold text-[#1E293B] truncate">{m.label}</span>
                          <span className="block text-[11px] text-slate-400 truncate">{m.hint}</span>
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}

        {groups.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-sm font-bold text-[#1E293B]">No modules found</p>
            <p className="text-xs text-slate-500">Try a different search term.</p>
          </div>
        )}
      </div>
    </div>
  );
};
