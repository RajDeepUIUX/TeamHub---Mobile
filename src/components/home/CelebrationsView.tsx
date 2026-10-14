import React, { useState } from 'react';
import { ArrowLeft, Search, X, Check, Users } from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet';
import { TeamCelebration, CELEBRATION_TOTALS } from '../../data/dashboardData';
import { Holiday } from '../../data/holidayData';
import { avatarTint, initialsOf, addDays, formatDayLabel } from './celebrationUtils';

import { FilterIconButton } from '../common/TeamFilterSheet';
export type CelebrationTab = 'Birthdays' | 'Anniversaries' | 'Holidays';
type PeriodFilter = 'All' | 'Today' | 'Tomorrow' | 'Coming Up';

interface CelebrationsViewProps {
  initialTab: CelebrationTab;
  birthdays: TeamCelebration[];
  anniversaries: TeamCelebration[];
  upcomingHolidays: Holiday[];
  /** Holidays in the next 30 days, shown on the Holidays tab badge */
  holidaysNext30Days: number;
  onBack: () => void;
}

const TAB_META: Record<CelebrationTab, { emoji: string }> = {
  Birthdays: { emoji: '🎂' },
  Anniversaries: { emoji: '✨' },
  Holidays: { emoji: '📅' },
};

const PERIODS: PeriodFilter[] = ['All', 'Today', 'Tomorrow', 'Coming Up'];

/** Confetti bits scattered over the hero banner */
const Confetti: React.FC = () => (
  <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
    {[
      ['12%', '58%', 'bg-amber-400', 'rotate-12'],
      ['70%', '50%', 'bg-violet-400', '-rotate-12'],
      ['30%', '66%', 'bg-sky-400', 'rotate-45'],
      ['78%', '92%', 'bg-rose-400', 'rotate-12'],
      ['18%', '90%', 'bg-emerald-400', '-rotate-45'],
      ['55%', '60%', 'bg-amber-300', 'rotate-45'],
    ].map(([top, left, color, rot], i) => (
      <span key={i} className={`absolute w-1.5 h-3 rounded-sm ${color} ${rot}`} style={{ top, left }} />
    ))}
  </div>
);

export const CelebrationsView: React.FC<CelebrationsViewProps> = ({
  initialTab,
  birthdays,
  anniversaries,
  upcomingHolidays,
  holidaysNext30Days,
  onBack,
}) => {
  const [tab, setTab] = useState<CelebrationTab>(initialTab);
  const [query, setQuery] = useState('');
  const [period, setPeriod] = useState<PeriodFilter>('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const today = new Date();
  const people = tab === 'Anniversaries' ? anniversaries : birthdays;
  const noun = tab === 'Anniversaries' ? 'Anniversaries' : 'Birthdays';

  const counts = {
    today: people.filter((p) => p.inDays === 0).length,
    tomorrow: people.filter((p) => p.inDays === 1).length,
    total: people.length,
  };

  const q = query.trim().toLowerCase();
  const visible = people.filter(
    (p) =>
      (!q || p.name.toLowerCase().includes(q) || p.department.toLowerCase().includes(q)) &&
      (period === 'All' ||
        (period === 'Today' && p.inDays === 0) ||
        (period === 'Tomorrow' && p.inDays === 1) ||
        (period === 'Coming Up' && p.inDays > 1))
  );

  const groups = [
    { title: 'Today', items: visible.filter((p) => p.inDays === 0), date: formatDayLabel(today), pill: 'Today' },
    {
      title: 'Tomorrow',
      items: visible.filter((p) => p.inDays === 1),
      date: formatDayLabel(addDays(today, 1)),
      pill: 'Tomorrow',
    },
    { title: 'Coming Up', items: visible.filter((p) => p.inDays > 1), date: '', pill: '' },
  ].filter((g) => g.items.length > 0);

  const tabCounts: Record<CelebrationTab, number> = {
    Birthdays: CELEBRATION_TOTALS.birthdays,
    Anniversaries: CELEBRATION_TOTALS.anniversaries,
    Holidays: holidaysNext30Days,
  };

  const nextHoliday = upcomingHolidays[0];
  const daysUntil = (h: Holiday) =>
    Math.round((new Date(`${h.date}T00:00:00`).getTime() - new Date(today.toDateString()).getTime()) / 86400000);

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      {/* Header */}
      <header className="shrink-0 bg-white px-4 pt-2 pb-3 border-b border-[#EBF0F7]">
        <div className="relative flex items-center h-12">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-[#1E293B] active:bg-slate-100 cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
          <div className="screen-title">
            <h1 className="text-base font-bold text-[#1E293B] leading-tight">Celebrations &amp; Holidays</h1>
            <p className="text-[11px] text-slate-400">Your team's wishes &amp; holidays</p>
          </div>
        </div>

        {/* Segmented tabs */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          {(Object.keys(TAB_META) as CelebrationTab[]).map((t) => {
            const isActive = t === tab;
            return (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setTab(t);
                  setQuery('');
                  setPeriod('All');
                }}
                className={`relative h-10 px-1.5 rounded-xl border flex items-center justify-center gap-1 text-[11px] transition-colors cursor-pointer ${
                  isActive
                    ? 'border-[#2F68FE]/30 bg-blue-50 text-[#2F68FE] font-bold'
                    : 'border-slate-200 bg-white text-slate-600 font-semibold active:bg-slate-50'
                }`}
              >
                <span aria-hidden="true">{TAB_META[t].emoji}</span>
                <span className="truncate">{t}</span>
                <span
                  className={`px-1.5 rounded-md text-[10px] font-bold ${
                    isActive ? 'bg-[#2F68FE]/10 text-[#2F68FE]' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {tabCounts[t]}
                </span>
              </button>
            );
          })}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-4 pb-6 space-y-4">
        {tab === 'Holidays' ? (
          <>
            {/* Holiday hero */}
            <div className="relative overflow-hidden rounded-2xl p-4 bg-linear-to-br from-[#EFF6FF] to-[#E0E7FF] border border-[#C7D2FE]">
              <div className="relative z-10 max-w-[68%]">
                <p className="text-sm font-bold text-[#3730A3]">Next holiday</p>
                {nextHoliday ? (
                  <p className="text-sm text-[#3730A3] mt-1 leading-snug">
                    <strong className="text-base">{nextHoliday.name}</strong> is{' '}
                    {daysUntil(nextHoliday) === 0 ? 'today' : `in ${daysUntil(nextHoliday)} days`}.
                  </p>
                ) : (
                  <p className="text-xs text-[#3730A3] mt-1">No more holidays this year.</p>
                )}
              </div>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-5xl" aria-hidden="true">
                🏖️
              </span>
            </div>

            <div className="space-y-2">
              <h2 className="text-sm font-bold text-[#1E293B]">Upcoming Holidays ({upcomingHolidays.length})</h2>
              {upcomingHolidays.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center gap-3 p-3 bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs"
                >
                  <span className="w-11 h-11 rounded-xl bg-[#EEF2FF] flex flex-col items-center justify-center shrink-0">
                    <span className="text-sm font-extrabold text-[#2F68FE] leading-none">{h.dayNumber}</span>
                    <span className="text-[10px] font-semibold text-[#2F68FE]/80">{h.monthName.slice(0, 3)}</span>
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="block text-sm font-bold text-[#1E293B] truncate">{h.name}</span>
                    <span className="block text-[11px] text-slate-400">{h.dayOfWeek}</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">
                    {daysUntil(h) === 0 ? 'Today' : `In ${daysUntil(h)} days`}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Hero banner */}
            <div
              className={`relative overflow-hidden rounded-2xl p-4 border ${
                tab === 'Birthdays'
                  ? 'bg-linear-to-br from-[#FFF1F2] to-[#FCE7F3] border-[#FECDD3]'
                  : 'bg-linear-to-br from-[#FFFBEB] to-[#FEF3C7] border-[#FDE68A]'
              }`}
            >
              <Confetti />
              <div className="relative z-10 max-w-[62%]">
                <p className={`text-sm font-bold ${tab === 'Birthdays' ? 'text-rose-700' : 'text-amber-800'}`}>
                  Let's celebrate together!
                </p>
                <p className={`text-xs mt-1 leading-snug ${tab === 'Birthdays' ? 'text-rose-700' : 'text-amber-800'}`}>
                  <strong className="text-base">{counts.today}</strong> team member{counts.today === 1 ? '' : 's'}{' '}
                  {counts.today === 1 ? 'has' : 'have'} {tab === 'Birthdays' ? 'a birthday' : 'a work anniversary'} today.
                </p>
              </div>
              <span className="absolute right-5 bottom-2 text-6xl drop-shadow-sm" aria-hidden="true">
                {tab === 'Birthdays' ? '🎂' : '🏆'}
              </span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Today', value: counts.today, tint: 'bg-[#EEF2FF] border-[#E0E7FF]', icon: TAB_META[tab].emoji },
                { label: 'Tomorrow', value: counts.tomorrow, tint: 'bg-[#FFFBEB] border-[#FEF3C7]', icon: TAB_META[tab].emoji },
                { label: 'This Month', value: counts.total, tint: 'bg-[#ECFDF5] border-[#D1FAE5]', icon: null },
              ].map(({ label, value, tint, icon }) => (
                <div key={label} className={`rounded-2xl border p-3 ${tint}`}>
                  <div className="flex items-center gap-1.5">
                    <span className="w-6 h-6 rounded-lg bg-white/80 flex items-center justify-center text-xs">
                      {icon ?? <Users className="w-3.5 h-3.5 text-emerald-600" />}
                    </span>
                    <span className="text-[11px] text-slate-600 font-medium">{label}</span>
                  </div>
                  <span className="block text-xl font-extrabold text-[#1E293B] mt-1.5 leading-none">{value}</span>
                  <span className="block text-[10px] text-slate-500 mt-1">{noun}</span>
                </div>
              ))}
            </div>

            {/* Search + filter */}
            <div className="flex items-center gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search team members..."
                  className="w-full h-11 pl-10 pr-9 bg-white border border-slate-200 rounded-xl text-xs font-medium text-[#1E293B] placeholder:text-slate-400 focus:outline-hidden focus:border-[#2F68FE] focus:ring-4 focus:ring-blue-50 shadow-2xs"
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
              <FilterIconButton count={period !== 'All' ? 1 : 0} onClick={() => setIsFilterOpen(true)} />
            </div>

            {/* Grouped lists */}
            {groups.map((group) => (
              <div key={group.title} className="space-y-2">
                <div className="flex items-center justify-between px-0.5">
                  <h2 className="text-sm font-bold text-[#1E293B]">
                    {group.title} ({group.items.length})
                  </h2>
                  {group.date && <span className="text-[11px] text-slate-400">{group.date}</span>}
                </div>
                {group.items.map((p) => {
                  const idx = Number(p.id.replace(/\D/g, '')) || 0;
                  const pill =
                    group.pill ||
                    addDays(today, p.inDays).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
                  return (
                    <div
                      key={p.id}
                      className="w-full flex items-center gap-3 p-3 bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs"
                    >
                      <span
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarTint(idx)}`}
                      >
                        {initialsOf(p.name)}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#1E293B] truncate">{p.name}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                              p.inDays === 0 ? 'bg-blue-50 text-[#2F68FE]' : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {pill}
                          </span>
                        </span>
                        <span className="block text-[11px] text-slate-400 truncate">
                          {p.department}
                          {p.years ? ` · ${p.years} ${p.years === 1 ? 'year' : 'years'}` : ''}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}

            {groups.length === 0 && (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/80 text-slate-500">
                <p className="text-xs font-medium">No team members match your search.</p>
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setPeriod('All');
                  }}
                  className="mt-2 text-xs font-semibold text-[#2F68FE] cursor-pointer"
                >
                  Clear filters
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Period filter sheet */}
      <BottomSheet isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} maxHeight="max-h-[70%]">
        <div className="pt-3 pb-1 flex justify-center shrink-0">
          <div className="w-10 h-1 bg-slate-300 rounded-full" />
        </div>
        <div className="flex items-center justify-between px-5 pt-1 pb-3 border-b border-slate-100">
          <h2 className="text-base font-bold text-[#1E293B]">Filter {noun}</h2>
          <button
            type="button"
            onClick={() => setIsFilterOpen(false)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-1.5 pb-8">
          {PERIODS.map((opt) => {
            const isSelected = period === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  setPeriod(opt);
                  setIsFilterOpen(false);
                }}
                className={`w-full h-12 px-4 rounded-xl flex items-center justify-between text-xs border transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50 border-[#2F68FE]/30 text-[#2F68FE] font-bold'
                    : 'bg-white border-transparent text-slate-700 font-medium active:bg-slate-50'
                }`}
              >
                {opt}
                {isSelected && <Check className="w-4 h-4 stroke-[2.5]" />}
              </button>
            );
          })}
        </div>
      </BottomSheet>
    </div>
  );
};
