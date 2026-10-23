import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  ChevronRight,
  Newspaper,
  UserPlus,
  UsersRound,
  BarChart3,
  CalendarDays,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { Dropdown } from '../../../design-system/components/Dropdown';
import { avatarTint, initialsOf } from '../../home/celebrationUtils';
import {
  CLIENT_FEED_PAGE_SIZE,
  CLIENT_FEED_TABS,
  ClientFeedPost,
  ClientFeedTab,
  OFFSHORE_PERIODS,
  OFFSHORE_PREVIEW_COUNT,
  OffshorePeriod,
  OffshoreStaff,
} from '../data/clientDashboardData';
import { ClientPostCard } from './ClientPostCard';
import { DesignVersion, DesignVersionSwitch } from '../staff/tabs/StaffTabParts';

const DESIGN_VERSIONS = ['V1', 'V2'] as const;

interface ClientDashboardProps {
  userName: string;
  posts: ClientFeedPost[];
  staff: OffshoreStaff[];
  /** Feed tabs already opened (their unread counts are cleared — desktop `notification_update`) */
  seenTabs: ClientFeedTab[];
  /** Show the skeleton while the dashboard data loads (when the app opens) */
  loading: boolean;
  onSeeTab: (tab: ClientFeedTab) => void;
  onUpdatePost: (id: string, patch: Partial<ClientFeedPost>) => void;
  /** Hidden when the role has no Available Staff Hub / My Staff access */
  onHireNewStaff?: () => void;
  onOpenMyStaff?: () => void;
}

const greetingFor = (date: Date) => {
  const h = date.getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const formatHrs = (hrs: number) => `${Number.isInteger(hrs) ? hrs : hrs.toFixed(1)} Hrs`;

/** Desktop shows a loader while AJAX reloads a block */
const LOAD_MS = 600;

const Skeleton: React.FC<{ className: string }> = ({ className }) => <span className={`block rounded-lg bg-slate-200/70 animate-pulse ${className}`} />;

const DashboardSkeleton: React.FC = () => (
  <div className="space-y-3.5" aria-busy="true" aria-label="Loading dashboard">
    <div className="space-y-2">
      <Skeleton className="w-28 h-3.5" />
      <Skeleton className="w-40 h-7" />
    </div>
    <Skeleton className="w-full h-[76px] rounded-2xl" />
    <div className="bg-white border border-[#DCE3ED] rounded-2xl p-4 space-y-3">
      <Skeleton className="w-44 h-8" />
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="w-9 h-9 rounded-full" />
          <Skeleton className="flex-1 h-4" />
          <Skeleton className="w-14 h-4" />
        </div>
      ))}
    </div>
    <Skeleton className="w-48 h-5" />
    <Skeleton className="w-full h-40 rounded-2xl" />
  </div>
);

/* ------------------------------- Dashboard ------------------------------ */

export const ClientDashboard: React.FC<ClientDashboardProps> = ({
  userName,
  posts,
  staff,
  seenTabs,
  loading,
  onSeeTab,
  onUpdatePost,
  onHireNewStaff,
  onOpenMyStaff,
}) => {
  const [period, setPeriod] = useState<OffshorePeriod>('Past Week');
  const [tab, setTab] = useState<ClientFeedTab>(CLIENT_FEED_TABS[0]);
  const [pages, setPages] = useState(1);
  const [staffLoading, setStaffLoading] = useState(false);
  const [moreLoading, setMoreLoading] = useState(false);
  const [tabLoading, setTabLoading] = useState(false);
  const [version, setVersion] = useState<DesignVersion>('V1');
  const v2 = version === 'V2';
  const tabsRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const dateLabel = now.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
  const firstName = userName.split(' ')[0];

  useEffect(() => {
    tabsRef.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [tab]);

  // Each block reloads on its own (desktop AJAX: period, tab, Show More)
  const withLoader = (set: (v: boolean) => void, after?: () => void) => {
    set(true);
    setTimeout(() => {
      after?.();
      set(false);
    }, LOAD_MS);
  };

  const changePeriod = (next: OffshorePeriod) => {
    if (next === period) return;
    setPeriod(next);
    withLoader(setStaffLoading);
  };

  const selectTab = (t: ClientFeedTab) => {
    if (t === tab) return;
    setTab(t);
    setPages(1);
    withLoader(setTabLoading, () => onSeeTab(t));
  };

  const tabPosts = posts.filter((p) => p.tab === tab);
  const visiblePosts = tabPosts.slice(0, pages * CLIENT_FEED_PAGE_SIZE);
  const unreadIn = (t: ClientFeedTab) => (seenTabs.includes(t) ? 0 : posts.filter((p) => p.tab === t && p.unread).length);

  const previewStaff = staff.slice(0, OFFSHORE_PREVIEW_COUNT);
  const totalHrs = staff.reduce((sum, s) => sum + (s.productiveHrs[period] ?? 0), 0);
  const maxHrs = Math.max(0, ...previewStaff.map((s) => s.productiveHrs[period] ?? 0));
  const versionSwitch = <DesignVersionSwitch versions={DESIGN_VERSIONS} value={version} onChange={setVersion} />;

  if (loading) {
    return (
      <div className="flex-1 flex flex-col bg-[#F8FAFC] overflow-hidden">
        <div className="flex-1 overflow-hidden px-4 pt-4">
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      <div className={`flex-1 overflow-y-auto no-scrollbar px-4 pt-4 pb-6 ${v2 ? 'space-y-4' : 'space-y-3.5'}`}>
        {v2 ? (
          <>
            {/* Hero (V2): greeting + Hire New Staff in one gradient card */}
            <section className="relative isolate overflow-hidden rounded-3xl bg-linear-to-br from-[#1D4ED8] via-[#2F68FE] to-[#4F46E5] p-4 text-white shadow-[0_14px_30px_-16px_rgba(47,104,254,0.85)]">
              <span aria-hidden="true" className="absolute -z-10 -top-16 -right-12 w-44 h-44 rounded-full bg-white/10" />
              <span aria-hidden="true" className="absolute -z-10 -bottom-20 -left-10 w-40 h-40 rounded-full bg-white/10" />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-white/80 font-medium">{greetingFor(now)},</p>
                  <h1 className="text-2xl font-extrabold leading-tight truncate">{firstName}.</h1>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1.5">
                  {versionSwitch}
                  <span className="h-6 px-2 rounded-full bg-white/15 border border-white/20 text-[11px] font-semibold flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" aria-hidden="true" />
                    {dateLabel}
                  </span>
                </div>
              </div>

              {onHireNewStaff && (
                <button
                  type="button"
                  onClick={onHireNewStaff}
                  className="mt-4 w-full p-3 rounded-2xl bg-white text-left flex items-center gap-3 shadow-[0_8px_18px_-12px_rgba(15,23,42,0.6)] active:scale-[0.99] transition-transform cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <span className="w-10 h-10 rounded-xl bg-[#EEF2FF] text-[#2F68FE] flex items-center justify-center shrink-0">
                    <UserPlus className="w-5 h-5" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[14px] font-extrabold text-[#1E293B] leading-tight">Hire New Staff</span>
                    <span className="block mt-0.5 text-[11px] text-slate-500 leading-snug">Browse ready-to-hire profiles in the Available Staff Hub</span>
                  </span>
                  <span className="w-8 h-8 rounded-full bg-linear-to-br from-[#2F68FE] to-[#4F46E5] text-white flex items-center justify-center shrink-0">
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </button>
              )}
            </section>

            {/* My Offshore Staff (V2): big team total + hours bars */}
            <section className="bg-white border border-[#EBF0F7] rounded-3xl overflow-hidden shadow-[0_2px_10px_-2px_rgba(15,23,42,0.08)]">
              <div className="px-4 pt-4 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={onOpenMyStaff}
                  disabled={!onOpenMyStaff}
                  className="flex items-center gap-2.5 min-w-0 rounded-lg cursor-pointer disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]"
                  aria-label="Open My Staff"
                >
                  <span className="w-9 h-9 rounded-xl bg-linear-to-br from-[#2F68FE] to-[#4F46E5] text-white flex items-center justify-center shrink-0">
                    <UsersRound className="w-4 h-4" />
                  </span>
                  <h2 className="text-[14px] font-extrabold text-[#1E293B] truncate">My Offshore Staff</h2>
                  {onOpenMyStaff && <ArrowUpRight className="w-4 h-4 text-[#2F68FE] shrink-0" />}
                </button>
                <div className="w-[128px] shrink-0">
                  <Dropdown size="md" ariaLabel="Period" value={period} options={OFFSHORE_PERIODS} onChange={changePeriod} menuMinWidth={150} />
                </div>
              </div>

              {staffLoading ? (
                <div className="p-4 space-y-3" aria-busy="true" aria-label="Loading staff hours">
                  <Skeleton className="w-full h-[68px] rounded-2xl" />
                  {previewStaff.map((s) => (
                    <div key={s.id} className="flex items-center gap-3">
                      <Skeleton className="w-9 h-9 rounded-xl" />
                      <Skeleton className="flex-1 h-6" />
                      <Skeleton className="w-14 h-4" />
                    </div>
                  ))}
                </div>
              ) : staff.length === 0 ? (
                <div className="px-4 py-10 flex flex-col items-center text-center">
                  <span className="w-14 h-14 rounded-2xl bg-[#EEF2FF] text-[#2F68FE] flex items-center justify-center">
                    <UsersRound className="w-6 h-6" />
                  </span>
                  <p className="mt-3 text-sm font-bold text-[#1E293B]">No active staff to display yet.</p>
                  <p className="mt-1 text-xs text-slate-500">Hired staff will show up here.</p>
                </div>
              ) : (
                <>
                  <div className="mx-4 mt-3 px-3.5 py-3 rounded-2xl bg-linear-to-br from-[#E3EBFF] via-[#EEF2FF] to-[#F1EDFF] border border-[#D6E0FF] flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-white text-[#2F68FE] flex items-center justify-center shrink-0 shadow-2xs">
                      <BarChart3 className="w-5 h-5" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[11px] font-semibold text-slate-500">Team total</span>
                      <span className="block text-[11px] font-bold text-[#2F68FE] truncate">{period}</span>
                    </span>
                    <span className="shrink-0 text-xl font-extrabold text-[#1E293B] tabular-nums">{formatHrs(totalHrs)}</span>
                  </div>

                  <div className="mx-4 mt-3 flex items-center justify-between px-1 text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">
                    <span>Staff Name</span>
                    <span>Productive Hrs</span>
                  </div>
                  <ul className="px-4 pt-1 pb-1">
                    {previewStaff.map((s, idx) => {
                      const hrs = s.productiveHrs[period];
                      const pct = hrs == null || maxHrs === 0 ? 0 : Math.max(4, Math.round((hrs / maxHrs) * 100));
                      return (
                        <li key={s.id} className="flex items-center gap-3 py-2">
                          <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-bold shrink-0 ${avatarTint(idx)}`}>
                            {initialsOf(s.name)}
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="block text-[13px] font-semibold text-[#1E293B] truncate">{s.name}</span>
                            <span className="mt-1 block h-1.5 rounded-full bg-slate-100 overflow-hidden" aria-hidden="true">
                              <span className="block h-full rounded-full bg-linear-to-r from-[#2F68FE] to-[#4F46E5] transition-[width] duration-500" style={{ width: `${pct}%` }} />
                            </span>
                          </span>
                          <span className={`shrink-0 min-w-[58px] text-right text-[12.5px] tabular-nums ${hrs == null ? 'text-slate-300 font-semibold' : 'font-bold text-[#1E293B]'}`}>
                            {hrs == null ? '–' : formatHrs(hrs)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  {onOpenMyStaff && staff.length > previewStaff.length ? (
                    <div className="p-4 pt-2">
                      <button
                        type="button"
                        onClick={onOpenMyStaff}
                        className="w-full h-10 rounded-xl bg-linear-to-r from-[#2F68FE] to-[#4F46E5] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-[0_6px_14px_-8px_rgba(47,104,254,0.9)] active:opacity-90 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]"
                      >
                        View all {staff.length} staff
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="h-3" />
                  )}
                </>
              )}
            </section>

            {/* What's Happening Around! (V2): pill tabs + accent cards */}
            <section>
              <h2 className="px-1 flex items-center gap-2 text-base font-extrabold text-[#1E293B]">
                <span className="w-7 h-7 rounded-lg bg-[#EEF2FF] text-[#2F68FE] flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                </span>
                What's Happening Around!
              </h2>
              <div ref={tabsRef} className="-mx-4 mt-3 flex gap-2 overflow-x-auto no-scrollbar px-4 pb-1" role="tablist" aria-label="Update categories">
                {CLIENT_FEED_TABS.map((t) => {
                  const on = t === tab;
                  const unread = unreadIn(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      role="tab"
                      aria-selected={on}
                      onClick={() => selectTab(t)}
                      className={`h-9 px-3.5 rounded-full flex items-center gap-1.5 text-[12.5px] font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE] ${
                        on
                          ? 'bg-linear-to-r from-[#2F68FE] to-[#4F46E5] text-white shadow-[0_6px_14px_-8px_rgba(47,104,254,0.9)]'
                          : 'bg-white border border-[#DCE3ED] text-slate-600 active:bg-slate-50'
                      }`}
                    >
                      {t}
                      {unread > 0 && (
                        <span
                          className={`min-w-5 h-5 px-1 rounded-full text-[10px] font-bold flex items-center justify-center tabular-nums ${
                            on ? 'bg-white text-[#2F68FE]' : 'bg-[#2F68FE] text-white'
                          }`}
                        >
                          {unread}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div key={tab} className="mt-3 space-y-3 animate-in fade-in duration-200" role="tabpanel" aria-label={tab}>
                {tabLoading &&
                  [0, 1].map((i) => (
                    <div key={i} className="bg-white border border-[#EBF0F7] rounded-3xl p-4 space-y-2.5" aria-busy="true">
                      <Skeleton className="w-24 h-5 rounded-full" />
                      <Skeleton className="w-3/4 h-4" />
                      <Skeleton className="w-full h-3" />
                      <Skeleton className="w-5/6 h-3" />
                      <div className="flex gap-2 pt-1">
                        <Skeleton className="flex-1 h-9 rounded-xl" />
                        <Skeleton className="flex-1 h-9 rounded-xl" />
                      </div>
                    </div>
                  ))}

                {!tabLoading &&
                  visiblePosts.map((p) => (
                    <ClientPostCard key={p.id} post={p} unread={p.unread} variant="V2" onUpdate={(patch) => onUpdatePost(p.id, patch)} />
                  ))}

                {!tabLoading && tabPosts.length === 0 && (
                  <div className="py-12 flex flex-col items-center text-center bg-white border border-dashed border-[#C7D7FE] rounded-3xl">
                    <span className="w-14 h-14 rounded-2xl bg-[#EEF2FF] text-[#2F68FE] flex items-center justify-center">
                      <Newspaper className="w-6 h-6" />
                    </span>
                    <p className="mt-3 text-sm font-bold text-[#1E293B]">No updates yet.</p>
                    <p className="mt-1 text-xs text-slate-500">New posts in {tab} will show up here.</p>
                  </div>
                )}

                {!tabLoading && visiblePosts.length < tabPosts.length && (
                  <button
                    type="button"
                    disabled={moreLoading}
                    onClick={() => withLoader(setMoreLoading, () => setPages((n) => n + 1))}
                    className="w-full h-11 rounded-full bg-[#EEF2FF] text-xs font-bold text-[#2F68FE] flex items-center justify-center gap-2 active:bg-[#E0E7FF] disabled:cursor-wait transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]"
                  >
                    {moreLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {moreLoading ? 'Loading…' : 'Show More'}
                  </button>
                )}
              </div>
            </section>
          </>
        ) : (
          <>
            {/* Greeting */}
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-slate-600 font-medium">{greetingFor(now)},</p>
                <h1 className="text-2xl font-extrabold text-[#1E293B] leading-tight truncate">{firstName}.</h1>
              </div>
              <div className="shrink-0 flex flex-col items-end gap-1.5">
                {versionSwitch}
                <span className="text-xs font-semibold text-slate-600">{dateLabel}</span>
              </div>
            </div>

            {/* Hire New Staff */}
            {onHireNewStaff && (
            <button
              type="button"
              onClick={onHireNewStaff}
              className="relative w-full overflow-hidden rounded-2xl bg-linear-to-br from-[#1D4ED8] via-[#2F68FE] to-[#6366F1] p-4 text-left text-white cursor-pointer active:scale-[0.99] transition-transform"
            >
              <span className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" aria-hidden="true" />
              <span className="absolute right-10 -bottom-10 w-24 h-24 rounded-full bg-white/10" aria-hidden="true" />
              <span className="relative flex items-center gap-3">
                <span className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                  <UserPlus className="w-5 h-5" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[15px] font-extrabold leading-tight">Hire New Staff</span>
                  <span className="block mt-0.5 text-[11.5px] text-white/80">Browse ready-to-hire profiles in the Available Staff Hub</span>
                </span>
                <ChevronRight className="w-5 h-5 text-white/90 shrink-0" />
              </span>
            </button>
            )}

            {/* My Offshore Staff */}
            <section className="bg-white border border-[#DCE3ED] rounded-2xl p-4 shadow-[0_2px_10px_-2px_rgba(15,23,42,0.10)]">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={onOpenMyStaff}
                  disabled={!onOpenMyStaff}
                  className="flex items-center gap-2 min-w-0 cursor-pointer disabled:cursor-default"
                  aria-label="Open My Staff"
                >
                  <span className="w-7 h-7 rounded-lg bg-[#EEF2FF] text-[#2F68FE] flex items-center justify-center shrink-0">
                    <UsersRound className="w-3.5 h-3.5" />
                  </span>
                  <h2 className="text-[13.5px] font-bold text-[#1E293B] truncate">My Offshore Staff</h2>
                  {onOpenMyStaff && <ArrowUpRight className="w-3.5 h-3.5 text-[#2F68FE] shrink-0" />}
                </button>
                <div className="w-[128px] shrink-0">
                  <Dropdown size="md" ariaLabel="Period" value={period} options={OFFSHORE_PERIODS} onChange={changePeriod} menuMinWidth={150} />
                </div>
              </div>

              {staffLoading ? (
                <div className="mt-3 space-y-3" aria-busy="true" aria-label="Loading staff hours">
                  <Skeleton className="w-full h-9 rounded-xl" />
                  {previewStaff.map((s) => (
                    <div key={s.id} className="flex items-center gap-3">
                      <Skeleton className="w-9 h-9 rounded-full" />
                      <Skeleton className="flex-1 h-4" />
                      <Skeleton className="w-14 h-4" />
                    </div>
                  ))}
                </div>
              ) : staff.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm font-bold text-[#1E293B]">No active staff to display yet.</p>
                  <p className="mt-1 text-xs text-slate-500">Hired staff will show up here.</p>
                </div>
              ) : (
                <>
                  <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100">
                    <BarChart3 className="w-4 h-4 text-[#2F68FE] shrink-0" />
                    <span className="flex-1 text-[11px] text-slate-500">
                      Team total · <span className="font-semibold text-slate-600">{period}</span>
                    </span>
                    <span className="text-[13px] font-extrabold text-[#1E293B] tabular-nums">{formatHrs(totalHrs)}</span>
                  </div>

                  <div className="mt-3 flex items-center justify-between px-1 pb-2 border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                    <span>Staff Name</span>
                    <span>Productive Hrs</span>
                  </div>
                  <ul>
                    {previewStaff.map((s, idx) => {
                      const hrs = s.productiveHrs[period];
                      return (
                        <li key={s.id} className={`flex items-center gap-3 py-2.5 ${idx < previewStaff.length - 1 ? 'border-b border-slate-100' : ''}`}>
                          <span className={`w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${avatarTint(idx)}`}>
                            {initialsOf(s.name)}
                          </span>
                          <span className="flex-1 min-w-0 text-[13px] font-semibold text-[#1E293B] truncate">{s.name}</span>
                          <span className={`shrink-0 text-[12.5px] tabular-nums ${hrs == null ? 'text-slate-300 font-semibold' : 'font-bold text-[#1E293B]'}`}>
                            {hrs == null ? '–' : formatHrs(hrs)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  {onOpenMyStaff && staff.length > previewStaff.length && (
                    <button
                      type="button"
                      onClick={onOpenMyStaff}
                      className="mt-2 w-full h-10 rounded-xl bg-[#EEF2FF] text-[#2F68FE] text-xs font-bold flex items-center justify-center gap-1.5 active:bg-[#E0E7FF] transition-colors cursor-pointer"
                    >
                      View all {staff.length} staff
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </>
              )}
            </section>

            {/* What's Happening Around! */}
            <section className="pt-1">
              <h2 className="px-1 text-base font-extrabold text-[#1E293B]">What's Happening Around!</h2>
              <div ref={tabsRef} className="-mx-4 mt-1 flex gap-1 overflow-x-auto no-scrollbar px-2 border-b border-slate-200/80" role="tablist" aria-label="Update categories">
                {CLIENT_FEED_TABS.map((t) => {
                  const on = t === tab;
                  const unread = unreadIn(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      role="tab"
                      aria-selected={on}
                      onClick={() => selectTab(t)}
                      className={`relative h-12 px-3 flex items-center gap-1.5 text-[13px] font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                        on ? 'text-[#2F68FE]' : 'text-slate-500 active:text-[#1E293B]'
                      }`}
                    >
                      {t}
                      {unread > 0 && (
                        <span className="min-w-5 h-5 px-1 rounded-full bg-[#2F68FE] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                          {unread}
                        </span>
                      )}
                      <span
                        className={`absolute left-2 right-2 bottom-0 h-[3px] rounded-t-full bg-[#2F68FE] transition-opacity duration-200 ${
                          on ? 'opacity-100' : 'opacity-0'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              <div key={tab} className="mt-3 space-y-3 animate-in fade-in duration-200" role="tabpanel" aria-label={tab}>
                {tabLoading &&
                  [0, 1].map((i) => (
                    <div key={i} className="bg-white border border-[#DCE3ED] rounded-2xl p-4 space-y-2.5" aria-busy="true">
                      <Skeleton className="w-3/4 h-4" />
                      <Skeleton className="w-full h-3" />
                      <Skeleton className="w-5/6 h-3" />
                      <div className="flex justify-end gap-2 pt-1">
                        <Skeleton className="w-16 h-8 rounded-full" />
                        <Skeleton className="w-20 h-8 rounded-full" />
                      </div>
                    </div>
                  ))}

                {!tabLoading &&
                  visiblePosts.map((p) => (
                    <ClientPostCard key={p.id} post={p} unread={p.unread} onUpdate={(patch) => onUpdatePost(p.id, patch)} />
                  ))}

                {!tabLoading && tabPosts.length === 0 && (
                  <div className="py-12 flex flex-col items-center text-center bg-white border border-[#DCE3ED] rounded-2xl">
                    <span className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                      <Newspaper className="w-6 h-6" />
                    </span>
                    <p className="mt-3 text-sm font-bold text-[#1E293B]">No updates yet.</p>
                    <p className="mt-1 text-xs text-slate-500">New posts in {tab} will show up here.</p>
                  </div>
                )}

                {!tabLoading && visiblePosts.length < tabPosts.length && (
                  <button
                    type="button"
                    disabled={moreLoading}
                    onClick={() => withLoader(setMoreLoading, () => setPages((n) => n + 1))}
                    className="w-full h-11 rounded-xl border border-slate-200 bg-white text-xs font-bold text-[#2F68FE] flex items-center justify-center gap-2 active:bg-slate-50 disabled:cursor-wait transition-colors cursor-pointer"
                  >
                    {moreLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {moreLoading ? 'Loading…' : 'Show More'}
                  </button>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};
