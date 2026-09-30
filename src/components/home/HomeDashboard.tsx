import React from 'react';
import {
  Bell,
  Cake,
  ChevronRight,
  ArrowRight,
  ListChecks,
  GraduationCap,
  Clock,
  Sun,
  Coffee,
  CalendarDays,
  LayoutGrid,
  AlertTriangle,
  CheckSquare,
  MessageSquare,
  Monitor,
  Sparkles,
  CalendarCheck,
} from 'lucide-react';
import { RECENT_ATTENDANCE, CELEBRATION_TOTALS, TeamCelebration } from '../../data/dashboardData';
import { BrandLogoHorizontal } from '../auth/BrandLogo';
import { OverviewTasks } from './OverviewTasks';
import { ProfileAvatar } from '../profile/ProfileAvatar';

interface HomeDashboardProps {
  userName: string;
  todaysBirthdays: TeamCelebration[];
  upcomingHolidayCount: number;
  onOpenAttendance: () => void;
  onOpenCelebrations: (tab: 'Birthdays' | 'Anniversaries' | 'Holidays') => void;
  onViewLog: () => void;
  onWish: (person: TeamCelebration) => void;
  onComingSoon: (feature: string) => void;
  onOpenProfile: () => void;
  onOpenNotifications: () => void;
  unreadNotifications: number;
  fullName: string;
  profilePhoto: string | null;
}

const greetingFor = (date: Date) => {
  const h = date.getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

/** Rounded card with an icon + title header, used for every dashboard section */
const SectionCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  action?: { label: string; onClick: () => void };
  children: React.ReactNode;
}> = ({ icon, title, action, children }) => (
  <section className="bg-white border border-[#EBF0F7] rounded-2xl p-4 shadow-2xs">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-[#EEF2FF] text-[#2F68FE] flex items-center justify-center">{icon}</div>
        <h3 className="text-sm font-bold text-[#1E293B]">{title}</h3>
      </div>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="text-[11px] font-semibold text-[#2F68FE] flex items-center gap-1 hover:underline cursor-pointer"
        >
          {action.label}
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
    {children}
  </section>
);

/** Big number + two-line label row with a chevron, used in several sections */
const StatRow: React.FC<{
  value: React.ReactNode;
  title: string;
  subtitle?: string;
  onClick: () => void;
  last?: boolean;
  /** Low-opacity badge colour behind the number */
  tint?: string;
}> = ({ value, title, subtitle, onClick, last, tint = 'bg-slate-500/8 text-[#1E293B]' }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full flex items-center gap-3 py-2.5 text-left cursor-pointer group ${last ? '' : 'border-b border-slate-100'}`}
  >
    {/* Same 32px width as the section icon so numbers line up under it */}
    <span
      className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-extrabold tabular-nums shrink-0 ${tint}`}
    >
      {value}
    </span>
    <span className="flex-1 min-w-0">
      <span className="block text-xs font-semibold text-slate-700 truncate">{title}</span>
      {subtitle && <span className="block text-[11px] text-slate-400 truncate">{subtitle}</span>}
    </span>
    <ChevronRight className="w-4 h-4 text-[#2F68FE] shrink-0 group-hover:translate-x-0.5 transition-transform" />
  </button>
);

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  userName,
  todaysBirthdays,
  upcomingHolidayCount,
  onOpenAttendance,
  onOpenCelebrations,
  onViewLog,
  onWish,
  onComingSoon,
  onOpenProfile,
  onOpenNotifications,
  unreadNotifications,
  fullName,
  profilePhoto,
}) => {
  const now = new Date();
  const dateLabel = now.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
  const timeLabel = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  // Demo office-time figures (8h requirement, day started at 12:11 PM)
  const workedMins = 2 * 60 + 33;
  const requiredMins = 8 * 60;
  const remaining = requiredMins - workedMins;
  const progress = Math.round((workedMins / requiredMins) * 100);

  const firstBirthday = todaysBirthdays[0];

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      {/* App Header */}
      <header className="shrink-0 bg-white/95 backdrop-blur-md px-4 h-14 flex items-center justify-between border-b border-[#EBF0F7]">
        <BrandLogoHorizontal className="h-5" />
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenNotifications}
            className="relative w-9 h-9 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifications > 0 && (
              <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={onOpenProfile}
            className="w-8 h-8 rounded-full ring-2 ring-white shadow-xs hover:ring-[#C7D2FE] transition cursor-pointer"
            aria-label="My profile"
          >
            <ProfileAvatar name={fullName} photoUrl={profilePhoto} className="w-8 h-8 rounded-full" textClassName="text-[11px]" />
          </button>
        </div>
      </header>

      {/* Scrollable Dashboard */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-4 pb-6 space-y-3.5">
        {/* Greeting */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-slate-600 font-medium">{greetingFor(now)},</p>
            <h1 className="text-2xl font-extrabold text-[#1E293B] leading-tight truncate">{userName}.</h1>
          </div>
          <div className="shrink-0 text-right">
            <span className="block text-xs font-semibold text-slate-600">{dateLabel}</span>
            <span className="block text-[11px] text-slate-400 tabular-nums">{timeLabel}</span>
          </div>
        </div>

        {/* Birthday nudge */}
        {firstBirthday && (
          <button
            type="button"
            onClick={() => onWish(firstBirthday)}
            className="w-full flex items-center gap-3 p-3 rounded-2xl bg-[#FFF1F2] border border-[#FECDD3] text-left cursor-pointer hover:bg-[#FFE4E6] transition-colors"
          >
            <span className="w-8 h-8 rounded-xl bg-white text-rose-500 flex items-center justify-center shrink-0 shadow-2xs">
              <Cake className="w-4 h-4" />
            </span>
            <span className="flex-1 text-xs text-rose-700 leading-snug">
              <strong className="font-bold">{firstBirthday.name}'s</strong> birthday is today — a quick wish would be nice.
            </span>
            <ChevronRight className="w-4 h-4 text-rose-400 shrink-0" />
          </button>
        )}

        {/* Action queue nudge */}
        <button
          type="button"
          onClick={() => onComingSoon('Action Queue')}
          className="w-full flex items-center gap-3 p-3 rounded-2xl bg-[#EEF2FF] border border-[#C7D2FE] text-left cursor-pointer hover:bg-[#E0E7FF] transition-colors"
        >
          <span className="w-8 h-8 rounded-xl bg-white text-[#4F46E5] flex items-center justify-center shrink-0 shadow-2xs">
            <ListChecks className="w-4 h-4" />
          </span>
          <span className="flex-1 text-xs text-[#3730A3] font-medium">1 thing in your Action Queue needs your attention.</span>
          <ChevronRight className="w-4 h-4 text-[#818CF8] shrink-0" />
        </button>

        {/* Overview & Tasks (switchable layout) */}
        <OverviewTasks onSelect={onComingSoon} />

        {/* Today's Office Time */}
        <section className="bg-white border border-[#EBF0F7] rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#EEF2FF] text-[#2F68FE] flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-[#1E293B]">Today's Office Time</h3>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8F8F0] text-[#059669] text-[11px] font-bold">
              <span className="relative flex w-1.5 h-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </span>
              Live
            </span>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#1E293B] tabular-nums">
              {Math.floor(remaining / 60)}h {remaining % 60}m
            </span>
            <span className="text-xs text-slate-400 font-medium">Remaining Today</span>
          </div>

          <div className="mt-2.5 h-2 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full bg-linear-to-r from-[#2F68FE] to-[#6366F1]" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500">
            <span className="font-bold text-[#1E293B]">
              {Math.floor(workedMins / 60)}h {workedMins % 60}m
            </span>{' '}
            worked of {requiredMins / 60}h required
          </p>

          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              { icon: Sun, label: 'Day Start', value: '12:11 PM', tint: 'text-amber-500' },
              { icon: Clock, label: 'Suggested Logout', value: '9:11 PM', tint: 'text-[#2F68FE]' },
              { icon: Coffee, label: 'Break Time', value: '0m', tint: 'text-slate-500' },
            ].map(({ icon: Icon, label, value, tint }) => (
              <div key={label} className="rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 flex items-center gap-2">
                <Icon className={`w-4 h-4 shrink-0 ${tint}`} />
                <div className="min-w-0">
                  <span className="block text-[9.5px] text-slate-400 leading-tight">{label}</span>
                  <span className="block text-[11px] font-bold text-[#1E293B]">{value}</span>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={onViewLog}
            className="mt-3 w-full h-10 rounded-xl bg-[#EEF2FF] text-[#2F68FE] text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-[#E0E7FF] transition-colors cursor-pointer"
          >
            View Log
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </section>

        {/* Celebrations & Holidays */}
        <SectionCard
          icon={<Sparkles className="w-4 h-4" />}
          title="Celebrations & Holidays"
          action={{ label: 'View All', onClick: () => onOpenCelebrations('Birthdays') }}
        >
          <div className="grid grid-cols-3 gap-2">
            {[
              { tab: 'Birthdays' as const, value: CELEBRATION_TOTALS.birthdays, icon: Cake, tint: 'bg-[#FFF1F2] text-rose-500' },
              { tab: 'Anniversaries' as const, value: CELEBRATION_TOTALS.anniversaries, icon: Sparkles, tint: 'bg-[#FFFBEB] text-amber-500' },
              { tab: 'Holidays' as const, value: upcomingHolidayCount, icon: CalendarDays, tint: 'bg-[#EFF6FF] text-[#2563EB]' },
            ].map(({ tab, value, icon: Icon, tint }) => (
              <button
                key={tab}
                type="button"
                onClick={() => onOpenCelebrations(tab)}
                className={`rounded-xl p-2.5 text-left cursor-pointer hover:brightness-95 transition ${tint}`}
              >
                <div className="flex items-center gap-1.5">
                  <Icon className="w-4 h-4" />
                  <span className="text-base font-extrabold text-[#1E293B]">{value}</span>
                </div>
                <span className="block text-[11px] text-slate-600 font-medium mt-0.5">{tab}</span>
              </button>
            ))}
          </div>
        </SectionCard>

        {/* Attendance */}
        <SectionCard
          icon={<CalendarCheck className="w-4 h-4" />}
          title="Attendance"
          action={{ label: 'View Attendance', onClick: onOpenAttendance }}
        >
          <p className="text-xs font-semibold text-slate-600 -mt-1 mb-1">September 2026</p>
          <div>
            {RECENT_ATTENDANCE.map((row, idx) => (
              <button
                key={row.day}
                type="button"
                onClick={onOpenAttendance}
                className={`w-full flex items-center gap-3 py-2.5 text-left cursor-pointer ${
                  idx < RECENT_ATTENDANCE.length - 1 ? 'border-b border-slate-100' : ''
                }`}
              >
                <span className="w-11 h-11 rounded-xl bg-[#EEF2FF] flex flex-col items-center justify-center shrink-0">
                  <span className="text-sm font-extrabold text-[#2F68FE] leading-none">{row.day}</span>
                  <span className="text-[10px] font-semibold text-[#2F68FE]/80">{row.month}</span>
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[10px] text-slate-400 tabular-nums">
                    {row.start} <span className="mx-1">→</span> {row.end}
                  </span>
                  <span className="block text-sm font-bold text-[#1E293B]">{row.hours}</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#E8F8F0] text-[#059669] text-[11px] font-semibold">
                  {row.status}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </button>
            ))}
          </div>
        </SectionCard>

        {/* My L&D */}
        <section className="bg-white border border-[#EBF0F7] rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#EEF2FF] text-[#2F68FE] flex items-center justify-center">
                <GraduationCap className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-[#1E293B]">My L&amp;D</h3>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">Target: 75 Hours</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-[#1E293B]">0</span>
            <span className="text-xs text-slate-500">Hours completed this year</span>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-slate-100" />
            <span className="text-[11px] font-bold text-[#2F68FE]">0%</span>
          </div>
          <div className="mt-2 border-t border-slate-100">
            <StatRow value={1} title="Courses Assigned" subtitle="Not Yet Completed" onClick={() => onComingSoon('Learning')} last />
          </div>
        </section>

        {/* MYCPE ONE Updates */}
        <SectionCard icon={<LayoutGrid className="w-4 h-4" />} title="MYCPE ONE Updates">
          <StatRow value={50} title="Policies Updated" subtitle="In the last 60 days" onClick={() => onComingSoon('Policies')} />
          <StatRow
            value={<span className="text-[9px] font-extrabold uppercase tracking-wide">New</span>}
            title="Annual Letter 2025-26"
            subtitle="Latest available"
            onClick={() => onComingSoon('Annual Letter')}
            last
          />
        </SectionCard>

        {/* Requests */}
        <SectionCard
          icon={<AlertTriangle className="w-4 h-4" />}
          title="Requests"
          action={{ label: 'View All', onClick: () => onComingSoon('Requests') }}
        >
          <StatRow
            value={1}
            title="My Tickets"
            subtitle="Open IT ticket"
            onClick={() => onComingSoon('IT Tickets')}
          />
          <StatRow
            value={1}
            title="Reimbursement Request"
            subtitle="Pending approval"
            onClick={() => onComingSoon('Reimbursements')}
            last
          />
        </SectionCard>

        {/* Action Queue */}
        <SectionCard
          icon={<CheckSquare className="w-4 h-4" />}
          title="Action Queue"
          action={{ label: 'View All', onClick: () => onComingSoon('Action Queue') }}
        >
          <button
            type="button"
            onClick={() => onComingSoon('Staff Review')}
            className="w-full flex items-center gap-3 text-left cursor-pointer group"
          >
            <span className="w-8 h-8 rounded-xl bg-slate-500/8 text-[#1E293B] text-sm font-extrabold flex items-center justify-center shrink-0">
              1
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-xs font-semibold text-slate-700">Time to fill out your Staff Review</span>
              <span className="block text-[11px] text-slate-400">Form 180d open · Your action</span>
            </span>
            <ChevronRight className="w-4 h-4 text-[#2F68FE] shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </SectionCard>

        {/* Feedback Received (empty state) */}
        <SectionCard icon={<MessageSquare className="w-4 h-4" />} title="Feedback Received">
          <div className="flex items-center gap-3.5">
            <div className="w-16 h-14 rounded-xl bg-slate-100 p-2.5 space-y-1.5 shrink-0" aria-hidden="true">
              <div className="h-1.5 rounded-full bg-slate-300 w-full" />
              <div className="h-1.5 rounded-full bg-slate-300 w-4/5" />
              <div className="h-1.5 rounded-full bg-slate-300 w-full" />
              <div className="h-1.5 rounded-full bg-slate-300 w-3/5" />
            </div>
            <div>
              <span className="block text-xs font-bold text-slate-700">No feedback yet</span>
              <span className="block text-[11px] text-slate-400 leading-snug">
                Submit your first self-review to start the loop.
              </span>
            </div>
          </div>
        </SectionCard>

        {/* IT & Systems */}
        <SectionCard icon={<Monitor className="w-4 h-4" />} title="IT & Systems">
          <StatRow value={5} title="Assets Assigned" subtitle="Hardware on your name" onClick={() => onComingSoon('Assets')} />
          <StatRow value={2} title="Software Subscriptions" subtitle="Active licences" onClick={() => onComingSoon('Software')} last />
        </SectionCard>
      </div>
    </div>
  );
};
