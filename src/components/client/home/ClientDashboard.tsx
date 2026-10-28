import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Award,
  BookmarkCheck,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  Plus,
  CreditCard,
  UserCheck,
  UserPlus,
  UsersRound,
  CalendarDays,
  Sparkles,
  Gauge,
  Info,
  LayoutGrid,
} from 'lucide-react';
import { Dropdown } from '../../../design-system/components/Dropdown';
import { BottomSheet } from '../../common/BottomSheet';
import { DateRangeFields } from '../../common/DateRangeFields';
import { avatarTint, initialsOf } from '../../home/celebrationUtils';
import { Pill, SheetHeader } from '../staff/tabs/StaffTabParts';
import { DomainTile } from '../marketplace/MarketplaceParts';
import { CandidateStatusPill } from '../interviews/InterviewParts';
import {
  CLIENT_SERVICE_SECTIONS,
  ClientFeedPost,
  ClientFeedTab,
  DEFAULT_UTILIZATION_PERIOD,
  OFFSHORE_PERIODS,
  OFFSHORE_PREVIEW_COUNT,
  OffshorePeriod,
  OffshoreStaff,
  StaffUtilization,
  UTILIZATION_BANDS,
  UTILIZATION_PERIODS,
  UtilizationBandId,
  UtilizationPeriod,
  staffUtilizationFor,
  utilizationBandOf,
  utilizationRangeFor,
} from '../data/clientDashboardData';
import type { BillingActionItem } from '../data/clientBillingData';
import {
  PIPELINE_PREVIEW_COUNT,
  ShortlistedCandidate,
  formatShortDate,
  hasResumeOf,
  interviewLabels,
  pipelineCandidatesOf,
} from '../data/clientInterviewsData';
import {
  REQUIREMENT_PREVIEW_COUNT,
  StaffRequirement,
  openRequirementTotals,
  openRequirementsOf,
  shortlistedFor,
} from '../data/clientRequirementsData';
import type { ClientStaffMember } from '../data/clientStaffData';
import { HubProfile, RECOMMENDED_PREVIEW_COUNT, avgAssessment, experienceLabel, rateLabel } from '../data/clientStaffHubData';
import { TimesheetRange, formatHm, formatTimesheetRange, isoOf, parseIso } from '../data/clientTimesheetsData';
import { formatPostDate } from './ClientPostCard';
import { SERVICE_ICONS } from './ClientServicesSheet';
import { ClientWhatsHappeningView } from './ClientWhatsHappeningView';

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
  /** Hidden when the role has no Talent Marketplace / My Staff access */
  onHireNewStaff?: () => void;
  onOpenMyStaff?: () => void;
  /** Staff for the Staff Utilization section; hidden when the role has no Staff Utilization Report access */
  utilizationMembers?: ClientStaffMember[];
  /** Expired / expiring billing cards; hidden when the role has no Billing Details access */
  actionItems?: BillingActionItem[];
  onOpenBilling?: () => void;
  /** Services You May Need → services sheet, scrolled to the tapped service / section */
  onOpenServices: (focusId?: string) => void;
  /** Talent Marketplace Saved Resumes, newest first; hidden when the role has no Talent Marketplace access */
  savedProfiles?: HubProfile[];
  /** Opens View Resume for one profile (Back returns to the Dashboard) */
  onOpenSavedProfile?: (profileId: string) => void;
  /** Opens the Talent Marketplace on its Saved Resumes view */
  onOpenSavedResumes?: () => void;
  /** Strongest Talent Marketplace profiles (not saved / requested), best first; hidden when the role has no Talent Marketplace access */
  recommendedProfiles?: HubProfile[];
  /** Opens the Talent Profile for one recommended profile (Back returns to the Dashboard) */
  onOpenRecommendedProfile?: (profileId: string) => void;
  /** Opens the Talent Marketplace on its available profiles */
  onOpenMarketplace?: () => void;
  /** Shortlisted Candidates list; hidden when the role has no Shortlisted Candidates access */
  shortlistedCandidates?: ShortlistedCandidate[];
  /** Opens View Resume (Hub profile) or the CV sheet (recruiter candidate) for one candidate */
  onOpenCandidate?: (candidateId: string) => void;
  /** Opens the Shortlisted Candidates module */
  onOpenShortlisted?: () => void;
  /** Staff Requirements; hidden when the role has no Staff Requirement access */
  requirements?: StaffRequirement[];
  /** Hub profiles + candidates behind the Available Resumes / Shortlisted counts */
  requirementHub?: HubProfile[];
  requirementCandidates?: ShortlistedCandidate[];
  /** Opens Staff Requirement on View Requirement for one requirement (no `requirements` view access → undefined) */
  onOpenRequirement?: (requirementId: string) => void;
  /** Opens the Staff Requirement module */
  onOpenRequirements?: () => void;
  /** Opens Staff Requirement on Add Requirement (no `requirements` add access → undefined) */
  onAddRequirement?: () => void;
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
    <div className="bg-white border border-[#EBF0F7] rounded-2xl p-4 shadow-2xs space-y-3">
      <Skeleton className="w-44 h-8" />
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="w-9 h-9 rounded-full" />
          <Skeleton className="flex-1 h-4" />
          <Skeleton className="w-14 h-4" />
        </div>
      ))}
    </div>
    <Skeleton className="w-full h-[200px] rounded-2xl" />
    <Skeleton className="w-full h-[120px] rounded-2xl" />
  </div>
);

/* ---------------------------- Action Required ---------------------------- */

/** Expiring soon = warning (amber), expired = critical (rose) */
const ACTION_STYLE: Record<
  BillingActionItem['state'],
  { panel: string; tile: string; dot: string; chip: string; divider: string; Icon: React.ElementType }
> = {
  soon: {
    panel: 'bg-[#FFFBEB]/70 border-amber-100',
    tile: 'border-amber-200/70 text-[#D97706]',
    dot: 'bg-[#F59E0B]',
    chip: 'bg-[#FEF8E7] text-[#D97706] border-amber-200/60',
    divider: 'border-amber-200/50',
    Icon: Clock,
  },
  expired: {
    panel: 'bg-[#FFF1F2]/70 border-rose-100',
    tile: 'border-rose-200/70 text-[#EF4444]',
    dot: 'bg-[#EF4444]',
    chip: 'bg-[#FEF2F2] text-[#EF4444] border-rose-200/60',
    divider: 'border-rose-200/50',
    Icon: AlertCircle,
  },
};

const ActionRequiredCard: React.FC<{ items: BillingActionItem[]; onOpenBilling?: () => void }> = ({ items, onOpenBilling }) => {
  const tone = items.some((i) => i.state === 'expired') ? ACTION_STYLE.expired : ACTION_STYLE.soon;

  return (
    <section className="bg-white border border-[#EBF0F7] rounded-[20px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-3" aria-labelledby="client-action-required-title">
      <div className="flex items-center gap-2.5">
        <span
          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${items.length ? `${tone.chip} border` : 'bg-[#FEF8E7] text-[#D97706]'}`}
        >
          <AlertTriangle className="w-4 h-4" />
        </span>
        <h2 id="client-action-required-title" className="flex-1 min-w-0 text-sm font-bold text-[#1E293B] truncate">
          Action Required
        </h2>
        {items.length > 0 && (
          <span className={`shrink-0 h-6 px-2.5 rounded-full border flex items-center gap-1.5 text-[11px] font-bold tabular-nums ${tone.chip}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} aria-hidden="true" />
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="p-3 rounded-2xl bg-[#ECFDF5]/70 border border-emerald-100 flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-white border border-emerald-200/70 text-[#10B981] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-[13px] font-bold text-[#1E293B]">You're all caught up</span>
            <span className="block mt-0.5 text-[11px] text-slate-500">No billing actions need your attention.</span>
          </span>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {items.map((item) => {
            const style = ACTION_STYLE[item.state];
            return (
              <li key={item.id} className={`p-3 rounded-2xl border ${style.panel}`}>
                <div className="flex gap-3">
                  <span className={`relative w-10 h-10 rounded-xl bg-white border flex items-center justify-center shrink-0 ${style.tile}`}>
                    <CreditCard className="w-5 h-5" />
                    <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ring-2 ring-white text-white flex items-center justify-center ${style.dot}`} aria-hidden="true">
                      <style.Icon className="w-2.5 h-2.5" strokeWidth={3} />
                    </span>
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-[#1E293B] leading-snug">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-600 leading-relaxed">{item.description}</p>
                  </div>
                </div>
                <div className={`mt-3 pt-2.5 border-t flex items-center justify-between gap-2 ${style.divider}`}>
                  <span className={`h-6 px-2.5 rounded-full border flex items-center gap-1 text-[11px] font-bold tabular-nums ${style.chip}`}>
                    <style.Icon className="w-3 h-3" aria-hidden="true" />
                    {item.status}
                  </span>
                  {onOpenBilling && (
                    <button
                      type="button"
                      onClick={onOpenBilling}
                      className="shrink-0 h-8 px-3 rounded-full bg-white border border-blue-100 shadow-2xs flex items-center gap-1 text-[11px] font-bold text-[#2F68FE] active:bg-blue-50 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]"
                    >
                      Update Card
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

/* --------------------------- Staff Utilization --------------------------- */

/** Range colors follow meaning: low = danger, moderate = warning, high = success */
const BAND_STYLE: Record<UtilizationBandId, { tile: string; bar: string; chip: string }> = {
  low: { tile: 'bg-[#FDECEC] text-[#F43F5E]', bar: 'bg-[#F43F5E]', chip: 'bg-[#FEF2F2] text-[#EF4444]' },
  mid: { tile: 'bg-[#FEF8E7] text-[#F59E0B]', bar: 'bg-[#F59E0B]', chip: 'bg-[#FEF8E7] text-[#D97706]' },
  high: { tile: 'bg-[#E8F8F0] text-[#10B981]', bar: 'bg-[#10B981]', chip: 'bg-[#E8F8F0] text-[#10B981]' },
};

/** Desktop shows "-" for no time, else HH:MM */
const hmOrDash = (seconds: number) => (seconds > 0 ? formatHm(seconds) : '-');

const CustomRangeSheet: React.FC<{
  isOpen: boolean;
  initial: TimesheetRange | null;
  onClose: () => void;
  onApply: (range: TimesheetRange) => void;
}> = ({ isOpen, initial, onClose, onApply }) => {
  const [start, setStart] = useState<Date | null>(null);
  const [end, setEnd] = useState<Date | null>(null);
  const [lastOpen, setLastOpen] = useState(false);

  // Reset the draft each time the sheet opens
  if (isOpen !== lastOpen) {
    setLastOpen(isOpen);
    if (isOpen) {
      setStart(initial ? parseIso(initial.from) : null);
      setEnd(initial ? parseIso(initial.to) : null);
    }
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[88%]">
      <SheetHeader title="Custom Range" subtitle="Select a start and end date" onClose={onClose} />
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-4">
        <DateRangeFields
          start={start}
          end={end}
          maxDate={new Date()}
          resetKey={isOpen}
          onChange={(s, e) => {
            setStart(s);
            setEnd(e);
          }}
        />
      </div>
      <div className="grid grid-cols-2 gap-3 p-4 pt-3 pb-6 border-t border-slate-100 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="h-12 rounded-xl border border-[#2F68FE] text-[#2F68FE] text-xs font-bold bg-white active:bg-blue-50 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!start || !end}
          onClick={() => start && end && onApply({ from: isoOf(start), to: isoOf(end) })}
          className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          Apply
        </button>
      </div>
    </BottomSheet>
  );
};

const BandStaffSheet: React.FC<{
  band: UtilizationBandId | null;
  rows: StaffUtilization[];
  periodLabel: string;
  onClose: () => void;
}> = ({ band, rows, periodLabel, onClose }) => {
  // Keep the last band while the sheet slides out
  const [shown, setShown] = useState<UtilizationBandId>('low');
  if (band && band !== shown) setShown(band);
  const meta = UTILIZATION_BANDS.find((b) => b.id === shown)!;
  const style = BAND_STYLE[shown];
  const list = rows.filter((r) => utilizationBandOf(r.productivity) === shown);

  return (
    <BottomSheet isOpen={band !== null} onClose={onClose} maxHeight="max-h-[85%]">
      <SheetHeader
        title={`Productivity ${meta.label}`}
        subtitle={`${periodLabel} · ${list.length} staff`}
        onClose={onClose}
      />
      <ul className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-4 pb-6 space-y-3">
        {list.map((r) => (
          <li key={r.id} className="bg-white border border-[#EBF0F7] rounded-2xl p-3.5 shadow-2xs space-y-3">
            <div className="flex items-center gap-3">
              <span className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarTint(rows.indexOf(r))}`}>
                {initialsOf(r.name)}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-bold text-[#1E293B] truncate">{r.name}</span>
                <span className="block text-[11px] text-slate-400 truncate">{r.designation}</span>
              </span>
              <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold tabular-nums ${style.chip}`}>{r.productivity}%</span>
            </div>
            <span className="block h-1.5 rounded-full bg-slate-100 overflow-hidden" aria-hidden="true">
              <span className={`block h-full rounded-full ${style.bar}`} style={{ width: `${Math.max(2, r.productivity)}%` }} />
            </span>
            <dl className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100">
              {[
                ['Total Hours', r.totalSeconds],
                ['Productive Hours', r.productiveSeconds],
                ['Non-Productive Hours', r.totalSeconds - r.productiveSeconds],
              ].map(([label, secs]) => (
                <div key={label as string} className="min-w-0">
                  <dt className="text-[10px] font-medium text-slate-400 leading-tight">{label}</dt>
                  <dd className="mt-0.5 text-xs font-semibold text-[#1E293B] tabular-nums">{hmOrDash(secs as number)}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </BottomSheet>
  );
};

/** Productivity % of current staff split into three ranges (desktop Staff Utilization Report, default Last Week) */
const StaffUtilizationCard: React.FC<{ members: ClientStaffMember[] }> = ({ members }) => {
  const [period, setPeriod] = useState<UtilizationPeriod>(DEFAULT_UTILIZATION_PERIOD);
  const [customRange, setCustomRange] = useState<TimesheetRange | null>(null);
  const [customOpen, setCustomOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [band, setBand] = useState<UtilizationBandId | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);

  const range = period === 'Custom Range' && customRange ? customRange : utilizationRangeFor(period === 'Custom Range' ? DEFAULT_UTILIZATION_PERIOD : period);
  const { from, to } = range;
  const rows = useMemo(() => staffUtilizationFor(members, { from, to }), [members, from, to]);

  const counts = UTILIZATION_BANDS.map((b) => ({ ...b, count: rows.filter((r) => utilizationBandOf(r.productivity) === b.id).length }));
  const average = rows.length ? Math.round((rows.reduce((s, r) => s + r.productivity, 0) / rows.length) * 10) / 10 : 0;
  const rangeLabel = formatTimesheetRange(range);
  const periodLabel = period === 'Custom Range' ? rangeLabel : `${period} · ${rangeLabel}`;

  const reload = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), LOAD_MS);
  };

  const changePeriod = (next: UtilizationPeriod) => {
    if (next === 'Custom Range') {
      setCustomOpen(true);
      return;
    }
    if (next === period) return;
    setPeriod(next);
    reload();
  };

  const applyCustom = (next: TimesheetRange) => {
    setCustomOpen(false);
    setCustomRange(next);
    setPeriod('Custom Range');
    reload();
  };

  return (
    <section className="bg-white border border-[#EBF0F7] rounded-[20px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-3">
      <div className="flex items-center gap-2.5">
        <span className="w-8 h-8 rounded-xl bg-[#EEF2FF] text-[#2F68FE] flex items-center justify-center shrink-0">
          <Gauge className="w-4 h-4" />
        </span>
        <h2 className="flex-1 min-w-0 text-sm font-bold text-[#1E293B] leading-snug">Performance &amp; Productivity Insights</h2>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 min-w-0 text-[11px] font-medium text-slate-400 tabular-nums">
          <CalendarDays className="w-3 h-3 shrink-0" aria-hidden="true" />
          <span className="truncate">{rangeLabel}</span>
        </span>
        <div className="w-[128px] shrink-0">
          <Dropdown size="md" ariaLabel="Date range" value={period} options={UTILIZATION_PERIODS} onChange={changePeriod} menuMinWidth={150} />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3" aria-busy="true" aria-label="Loading staff utilization">
          <Skeleton className="w-full h-[84px] rounded-xl" />
          <div className="grid grid-cols-3 gap-2.5">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-[96px] rounded-2xl" />
            ))}
          </div>
        </div>
      ) : rows.length === 0 ? (
        <div className="py-8 flex flex-col items-center text-center">
          <span className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
            <Gauge className="w-6 h-6" />
          </span>
          <p className="mt-3 text-sm font-bold text-[#1E293B]">No tracked hours for this period.</p>
          <p className="mt-1 text-xs text-slate-500">Try another date range.</p>
        </div>
      ) : (
        <>
          <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 space-y-2.5">
            <div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold text-slate-500">Avg. Productivity</p>
                <button
                  type="button"
                  onClick={() => setInfoOpen((v) => !v)}
                  aria-expanded={infoOpen}
                  className="shrink-0 h-6 px-1.5 -mr-1.5 rounded-lg flex items-center gap-1 text-[11px] font-semibold text-slate-500 active:bg-slate-100 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]"
                >
                  Productivity %
                  <Info className={`w-3.5 h-3.5 ${infoOpen ? 'text-[#2F68FE]' : 'text-slate-400'}`} />
                </button>
              </div>
              <div className="flex items-end justify-between gap-3">
                <p className="text-lg font-extrabold text-[#1E293B] leading-tight tabular-nums">{average}%</p>
                <p className="text-[11px] font-medium text-slate-400 tabular-nums">{rows.length} staff tracked</p>
              </div>
            </div>
            {infoOpen && (
              <p className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-[#2F68FE]">
                Productivity % = (Productive hours ÷ Total hours) × 100
              </p>
            )}
            <div
              className="h-2.5 rounded-full bg-slate-100 overflow-hidden flex gap-0.5"
              role="img"
              aria-label={counts.map((c) => `${c.count} staff ${c.label}`).join(', ')}
            >
              {counts
                .filter((c) => c.count > 0)
                .map((c) => (
                  <span key={c.id} className={`h-full transition-[width] duration-500 ${BAND_STYLE[c.id].bar}`} style={{ width: `${(c.count / rows.length) * 100}%` }} />
                ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {counts.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setBand(c.id)}
                disabled={c.count === 0}
                aria-label={`${c.count} staff with productivity ${c.label}`}
                className="p-3 rounded-2xl border border-[#EBF0F7] bg-white shadow-2xs flex flex-col items-center text-center active:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]"
              >
                <span className={`w-14 h-9 rounded-lg flex items-center justify-center text-lg font-bold tabular-nums ${BAND_STYLE[c.id].tile}`}>{c.count}</span>
                <span className="mt-2 text-xs font-bold text-[#1E293B] tabular-nums">{c.label}</span>
                <span className="mt-0.5 flex items-center gap-0.5 text-[10px] font-semibold text-slate-400">
                  {c.name}
                  {c.count > 0 && <ChevronRight className="w-3 h-3 text-[#2F68FE]" />}
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      <BandStaffSheet band={band} rows={rows} periodLabel={periodLabel} onClose={() => setBand(null)} />
      <CustomRangeSheet isOpen={customOpen} initial={customRange} onClose={() => setCustomOpen(false)} onApply={applyCustom} />
    </section>
  );
};

/* -------------------- Profiles You May Be Interested In -------------------- */

/** Top Talent Marketplace profiles (`recommendedProfilesOf`); a row opens the Talent Profile */
const RecommendedProfilesCard: React.FC<{
  profiles: HubProfile[];
  onOpenProfile?: (profileId: string) => void;
  onOpenAll?: () => void;
}> = ({ profiles, onOpenProfile, onOpenAll }) => (
  <section className="bg-white border border-[#EBF0F7] rounded-[20px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)]" aria-labelledby="client-recommended-title">
    <div className="flex items-center gap-2.5">
      <span className="w-8 h-8 rounded-xl bg-[#EEF2FF] text-[#2F68FE] flex items-center justify-center shrink-0">
        <Award className="w-4 h-4" />
      </span>
      <h2 id="client-recommended-title" className="flex-1 min-w-0 text-sm font-bold text-[#1E293B] leading-snug">
        Profiles You May Be Interested In
      </h2>
      {onOpenAll && (
        <button
          type="button"
          onClick={onOpenAll}
          className="shrink-0 h-8 px-2 -mr-2 rounded-lg flex items-center gap-0.5 text-[11px] font-bold text-[#2F68FE] active:bg-blue-50/50 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]"
        >
          View All
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>

    <ul className="mt-2 -mb-1 divide-y divide-slate-100">
      {profiles.slice(0, RECOMMENDED_PREVIEW_COUNT).map((p) => {
        const assessment = avgAssessment(p);
        return (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => onOpenProfile?.(p.id)}
              aria-label={`${p.profile} (${p.resumeId}). View profile`}
              className="w-full py-2.5 flex items-center gap-3 text-left rounded-lg active:bg-slate-50 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]"
            >
              <DomainTile domain={p.domain} vetted={p.resume.backgroundVerified} size="sm" />
              <span className="flex-1 min-w-0">
                <span className="block text-[13px] font-bold text-[#1E293B] truncate">{p.profile}</span>
                <span className="block text-[11px] text-slate-500 truncate">{[p.domain, p.resume.level, experienceLabel(p)].filter(Boolean).join(' · ')}</span>
                <span className="mt-1 flex items-center flex-wrap gap-x-2.5 gap-y-1 text-[11px] font-semibold text-slate-600 tabular-nums">
                  {rateLabel(p)}
                  {assessment !== null && (
                    <span className="flex items-center gap-1 text-[#059669]">
                      <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                      {assessment}% Avg. assessment
                    </span>
                  )}
                </span>
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
            </button>
          </li>
        );
      })}
    </ul>
  </section>
);

/* ----------------------- Previously Saved Profiles ----------------------- */

/** Talent Marketplace Saved Resumes (desktop `linkedprofile`); a row opens the Talent Profile */
const SavedProfilesCard: React.FC<{
  profiles: HubProfile[];
  onOpenProfile?: (profileId: string) => void;
  onOpenAll?: () => void;
}> = ({ profiles, onOpenProfile, onOpenAll }) => (
  <section className="bg-white border border-[#EBF0F7] rounded-[20px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)]" aria-labelledby="client-saved-profiles-title">
    <div className="flex items-center gap-2.5">
      <span className="w-8 h-8 rounded-xl bg-[#EEF2FF] text-[#2F68FE] flex items-center justify-center shrink-0">
        <BookmarkCheck className="w-4 h-4" />
      </span>
      <h2 id="client-saved-profiles-title" className="flex-1 min-w-0 text-sm font-bold text-[#1E293B] truncate">
        Previously Saved Profiles
      </h2>
      {profiles.length > 0 && onOpenAll && (
        <button
          type="button"
          onClick={onOpenAll}
          className="shrink-0 h-8 px-2 -mr-2 rounded-lg flex items-center gap-0.5 text-[11px] font-bold text-[#2F68FE] active:bg-blue-50/50 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]"
        >
          View All
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>

    {profiles.length === 0 ? (
      <div className="mt-3 p-3 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center gap-3">
        <span className="flex-1 min-w-0">
          <span className="block text-xs font-bold text-[#1E293B]">No saved profiles yet</span>
          <span className="block mt-0.5 text-[11px] text-slate-500 leading-snug">Save profiles in the Talent Marketplace to find them here.</span>
        </span>
        {onOpenAll && (
          <button
            type="button"
            onClick={onOpenAll}
            className="shrink-0 h-8 px-3 rounded-full bg-white border border-blue-100 shadow-2xs flex items-center gap-1 text-[11px] font-bold text-[#2F68FE] active:bg-blue-50 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]"
          >
            Browse
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    ) : (
      <ul className="mt-2 -mb-1 divide-y divide-slate-100">
        {profiles.slice(0, PIPELINE_PREVIEW_COUNT).map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => onOpenProfile?.(p.id)}
              aria-label={`${p.profile} (${p.resumeId}). View resume`}
              className="w-full py-2.5 flex items-center gap-3 text-left rounded-lg active:bg-slate-50 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]"
            >
              <span className="flex-1 min-w-0">
                <span className="block text-[13px] font-bold text-[#1E293B] truncate">{p.profile}</span>
                <span className="block text-[11px] text-slate-500 truncate">
                  {p.domain}
                  <span className="tabular-nums"> · {p.resumeId}</span>
                </span>
                <span className="mt-1.5 flex items-center flex-wrap gap-x-2 gap-y-1">
                  <Pill tone="blue">{p.resume.level}</Pill>
                  <span className="text-[11px] font-semibold text-slate-600 tabular-nums">{rateLabel(p)}</span>
                </span>
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    )}
  </section>
);

/* ------------------------ Shortlisted Candidates ------------------------ */

const CANDIDATE_ROW = 'py-3 flex items-start gap-3 rounded-lg';

/** Candidates still in the hiring pipeline (desktop Shortlisted Candidates) as rows; a row opens View Resume / the CV */
const ShortlistedCandidatesCard: React.FC<{
  candidates: ShortlistedCandidate[];
  onOpenCandidate?: (candidateId: string) => void;
  onOpenAll?: () => void;
  onBrowse?: () => void;
}> = ({ candidates, onOpenCandidate, onOpenAll, onBrowse }) => {
  const pipeline = useMemo(() => pipelineCandidatesOf(candidates), [candidates]);
  const preview = pipeline.slice(0, PIPELINE_PREVIEW_COUNT);

  return (
    <section className="bg-white border border-[#EBF0F7] rounded-[20px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)]" aria-labelledby="client-shortlisted-title">
      <div className="flex items-center gap-2.5">
        <span className="w-8 h-8 rounded-xl bg-[#EEF2FF] text-[#2F68FE] flex items-center justify-center shrink-0">
          <UserCheck className="w-4 h-4" />
        </span>
        <h2 id="client-shortlisted-title" className="flex-1 min-w-0 text-sm font-bold text-[#1E293B] truncate">
          Shortlisted Candidates
        </h2>
        {pipeline.length > 0 && onOpenAll && (
          <button
            type="button"
            onClick={onOpenAll}
            className="shrink-0 h-8 px-2 -mr-2 rounded-lg flex items-center gap-0.5 text-[11px] font-bold text-[#2F68FE] active:bg-blue-50/50 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]"
          >
            View All
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {pipeline.length === 0 ? (
        <div className="mt-3 p-3 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center gap-3">
          <span className="flex-1 min-w-0">
            <span className="block text-xs font-bold text-[#1E293B]">No candidates in progress</span>
            <span className="block mt-0.5 text-[11px] text-slate-500 leading-snug">Request to hire profiles in the Talent Marketplace to track them here.</span>
          </span>
          {onBrowse && (
            <button
              type="button"
              onClick={onBrowse}
              className="shrink-0 h-8 px-3 rounded-full bg-white border border-blue-100 shadow-2xs flex items-center gap-1 text-[11px] font-bold text-[#2F68FE] active:bg-blue-50 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]"
            >
              Browse
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        <ul className="mt-2 -mb-1 divide-y divide-slate-100">
          {preview.map((c) => {
            const interview = interviewLabels(c);
            const opens = onOpenCandidate && hasResumeOf(c);
            const body = (
              <>
                <span
                  aria-hidden="true"
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarTint(candidates.findIndex((x) => x.id === c.id))}`}
                >
                  {initialsOf(c.name)}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="flex items-start justify-between gap-2">
                    <span className="min-w-0 text-[13px] font-bold text-[#1E293B] truncate">{c.name}</span>
                    <span className="shrink-0">
                      <CandidateStatusPill status={c.status} />
                    </span>
                  </span>
                  <span className="block mt-0.5 text-[11px] text-slate-500 truncate">
                    {c.profile}
                    {c.resumeId !== '-' && <span className="tabular-nums"> · {c.resumeId}</span>}
                  </span>
                  {interview && (
                    <span className="mt-1.5 inline-flex max-w-full items-center gap-1.5 px-2 py-1 rounded-md bg-blue-50 text-[11px] font-semibold text-[#2F68FE] tabular-nums">
                      <CalendarClock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span className="truncate">
                        {interview.date}, {interview.time}
                      </span>
                    </span>
                  )}
                </span>
                {opens ? <ChevronRight className="w-4 h-4 self-center text-slate-400 shrink-0" aria-hidden="true" /> : <span className="w-4 shrink-0" aria-hidden="true" />}
              </>
            );
            return (
              <li key={c.id}>
                {opens ? (
                  <button
                    type="button"
                    onClick={() => onOpenCandidate(c.id)}
                    aria-label={`${c.name}, ${c.status}. View resume`}
                    className={`w-full ${CANDIDATE_ROW} text-left active:bg-slate-50 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]`}
                  >
                    {body}
                  </button>
                ) : (
                  <div className={CANDIDATE_ROW}>{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

/* --------------------------- Staff Requirement --------------------------- */

/** Open requirements (desktop Staff Requirement, status In Progress) with their resume / shortlist totals; a row opens View Requirement */
const StaffRequirementCard: React.FC<{
  requirements: StaffRequirement[];
  hub: HubProfile[];
  candidates: ShortlistedCandidate[];
  onOpenRequirement?: (requirementId: string) => void;
  onOpenAll?: () => void;
  onAdd?: () => void;
}> = ({ requirements, hub, candidates, onOpenRequirement, onOpenAll, onAdd }) => {
  const open = useMemo(() => openRequirementsOf(requirements), [requirements]);
  const totals = useMemo(() => openRequirementTotals(open, hub, candidates), [open, hub, candidates]);
  const preview = open.slice(0, REQUIREMENT_PREVIEW_COUNT);
  const stats = [
    { label: 'In Progress', value: open.length },
    { label: 'Resumes', value: totals.resumes },
    { label: 'Shortlisted', value: totals.shortlisted },
  ];

  return (
    <section className="bg-white border border-[#EBF0F7] rounded-[20px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)]" aria-labelledby="client-requirements-title">
      <div className="flex items-center gap-2.5">
        <span className="w-8 h-8 rounded-xl bg-[#EEF2FF] text-[#2F68FE] flex items-center justify-center shrink-0">
          <ClipboardList className="w-4 h-4" />
        </span>
        <h2 id="client-requirements-title" className="flex-1 min-w-0 text-sm font-bold text-[#1E293B] truncate">
          Staff Requirement
        </h2>
        {onOpenAll && (
          <button
            type="button"
            onClick={onOpenAll}
            className="shrink-0 h-8 px-2 -mr-2 rounded-lg flex items-center gap-0.5 text-[11px] font-bold text-[#2F68FE] active:bg-blue-50/50 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]"
          >
            View All
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {open.length === 0 ? (
        <div className="mt-3 p-3 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center gap-3">
          <span className="flex-1 min-w-0">
            <span className="block text-xs font-bold text-[#1E293B]">No open requirements</span>
            <span className="block mt-0.5 text-[11px] text-slate-500 leading-snug">Add a requirement to get matching resumes from the Talent Marketplace.</span>
          </span>
          {onAdd && (
            <button
              type="button"
              onClick={onAdd}
              className="shrink-0 h-8 px-3 rounded-full bg-white border border-blue-100 shadow-2xs flex items-center gap-1 text-[11px] font-bold text-[#2F68FE] active:bg-blue-50 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          )}
        </div>
      ) : (
        <>
          <dl className="mt-3 grid grid-cols-3 rounded-xl bg-slate-50/80 border border-slate-100 divide-x divide-slate-100">
            {stats.map((s) => (
              <div key={s.label} className="min-w-0 px-2 py-2 text-center flex flex-col-reverse">
                <dt className="mt-0.5 text-[10px] font-semibold text-slate-500 truncate">{s.label}</dt>
                <dd className="text-base font-extrabold text-[#1E293B] leading-tight tabular-nums">{s.value}</dd>
              </div>
            ))}
          </dl>

          <ul className="mt-2 -mb-1 divide-y divide-slate-100">
            {preview.map((r) => {
              const shortlisted = shortlistedFor(r, candidates);
              const body = (
                <>
                  <DomainTile domain={r.domain} size="sm" />
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] font-bold text-[#1E293B] truncate">{r.profile}</span>
                    <span className="block text-[11px] text-slate-500 truncate">
                      {[r.level, r.hoursPerWeek ? `${r.hoursPerWeek} Hrs/Week` : '', r.workMode].filter(Boolean).join(' · ')}
                    </span>
                    <span className="mt-1 flex items-center flex-wrap gap-x-2.5 gap-y-1 text-[11px] font-semibold text-slate-600">
                      {r.startDate && (
                        <span className="flex items-center gap-1 tabular-nums">
                          <CalendarDays className="w-3 h-3 text-[#2F68FE]" aria-hidden="true" />
                          Starts {formatShortDate(r.startDate)}
                        </span>
                      )}
                      {shortlisted > 0 && (
                        <span className="flex items-center gap-1 tabular-nums">
                          <UserCheck className="w-3 h-3 text-[#059669]" aria-hidden="true" />
                          {shortlisted} Shortlisted
                        </span>
                      )}
                    </span>
                  </span>
                  {onOpenRequirement && <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />}
                </>
              );
              return (
                <li key={r.id}>
                  {onOpenRequirement ? (
                    <button
                      type="button"
                      onClick={() => onOpenRequirement(r.id)}
                      aria-label={`${r.profile}. View requirement`}
                      className="w-full py-2.5 flex items-center gap-3 text-left rounded-lg active:bg-slate-50 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]"
                    >
                      {body}
                    </button>
                  ) : (
                    <div className="py-2.5 flex items-center gap-3">{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
};

/* ------------------------ Services You May Need ------------------------ */

/** Desktop header "Other Modules & Services" megamenu, minimized: suggested services + active modules; details open in ClientServicesSheet */
const ServicesCard: React.FC<{ onOpen: (focusId?: string) => void }> = ({ onOpen }) => {
  const [current, ...rest] = CLIENT_SERVICE_SECTIONS;
  const suggested = rest.flatMap((section) => section.services);

  return (
    <section className="bg-white border border-[#EBF0F7] rounded-[20px] py-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)]" aria-labelledby="client-services-title">
      <div className="px-4 flex items-center gap-2.5">
        <span className="w-8 h-8 rounded-xl bg-[#EEF2FF] text-[#2F68FE] flex items-center justify-center shrink-0">
          <LayoutGrid className="w-4 h-4" />
        </span>
        <h2 id="client-services-title" className="flex-1 min-w-0 text-sm font-bold text-[#1E293B] truncate">
          Services You May Need
        </h2>
        <button
          type="button"
          onClick={() => onOpen()}
          className="shrink-0 h-8 px-2 -mr-2 rounded-lg flex items-center gap-0.5 text-[11px] font-bold text-[#2F68FE] active:bg-blue-50/50 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]"
        >
          View All
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <ul className="mt-2 px-4 divide-y divide-slate-100">
        {suggested.map((s) => {
          const Icon = SERVICE_ICONS[s.id] ?? LayoutGrid;
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onOpen(s.id)}
                className="w-full py-2.5 flex items-center gap-3 text-left rounded-lg active:bg-slate-50 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]"
              >
                <span className="w-9 h-9 min-w-9 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 flex items-center justify-center shrink-0" aria-hidden="true">
                  <Icon className="w-4 h-4 shrink-0" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[13px] font-bold text-[#1E293B] truncate">{s.title}</span>
                  <span className="block text-[11px] text-slate-500 truncate">{s.description}</span>
                  {s.tag && <span className="mt-1 block text-[11px] font-semibold text-[#2F68FE] truncate">{s.tag}</span>}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>

      <div className="px-4 mt-2">
        <button
          type="button"
          onClick={() => onOpen(current.id)}
          className="w-full p-3 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center gap-3 text-left active:bg-slate-100 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]"
        >
          <span className="flex -space-x-2 shrink-0" aria-hidden="true">
            {current.services.map((s) => {
              const Icon = SERVICE_ICONS[s.id] ?? LayoutGrid;
              return (
                <span
                  key={s.id}
                  className={`w-7 h-7 rounded-full border-2 border-white flex items-center justify-center ${
                    s.state === 'current' ? 'bg-[#2F68FE] text-white' : 'bg-[#EEF2FF] text-[#2F68FE]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </span>
              );
            })}
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-xs font-bold text-[#1E293B] truncate">{current.title}</span>
            <span className="block text-[11px] text-slate-500 truncate">{current.services.map((s) => s.title).join(' · ')}</span>
          </span>
          <span className="shrink-0 px-2 py-0.5 rounded-full bg-[#E8F8F0] text-[#059669] text-[10px] font-bold tabular-nums">{current.services.length} Active</span>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        </button>
      </div>
    </section>
  );
};

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
  utilizationMembers,
  actionItems,
  onOpenBilling,
  onOpenServices,
  savedProfiles,
  onOpenSavedProfile,
  onOpenSavedResumes,
  recommendedProfiles,
  onOpenRecommendedProfile,
  onOpenMarketplace,
  shortlistedCandidates,
  onOpenCandidate,
  onOpenShortlisted,
  requirements,
  requirementHub = [],
  requirementCandidates = [],
  onOpenRequirement,
  onOpenRequirements,
  onAddRequirement,
}) => {
  const [period, setPeriod] = useState<OffshorePeriod>('Past Week');
  const [staffLoading, setStaffLoading] = useState(false);
  // What's Happening Around! opens as its own page (back returns to the Dashboard)
  const [feedOpen, setFeedOpen] = useState(false);

  const now = new Date();
  const dateLabel = now.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
  const firstName = userName.split(' ')[0];

  // The staff block reloads on its own (desktop AJAX: period)
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

  const totalUnread = posts.filter((p) => p.unread && !seenTabs.includes(p.tab)).length;
  const latestPost = posts.reduce<ClientFeedPost | null>((latest, p) => (!latest || p.publishDate > latest.publishDate ? p : latest), null);

  const previewStaff = staff.slice(0, OFFSHORE_PREVIEW_COUNT);
  const maxHrs = Math.max(0, ...previewStaff.map((s) => s.productiveHrs[period] ?? 0));

  if (feedOpen) {
    return <ClientWhatsHappeningView posts={posts} seenTabs={seenTabs} onSeeTab={onSeeTab} onUpdatePost={onUpdatePost} onBack={() => setFeedOpen(false)} />;
  }

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
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-4 pb-6 space-y-4">
        {/* Greeting card: greeting + Hire New Staff on the Sign In button gradient */}
        <section className="relative isolate overflow-hidden bg-linear-to-r from-[#5B7BFA] to-[#7C5CFA] rounded-2xl p-4 text-white shadow-[0_12px_24px_-10px_rgba(99,91,250,0.6)]">
          <span aria-hidden="true" className="absolute -z-10 -top-14 -right-10 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />
          <span aria-hidden="true" className="absolute -z-10 -bottom-16 -left-10 w-32 h-32 rounded-full bg-white/10 pointer-events-none" />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm text-white/80 font-medium">{greetingFor(now)},</p>
              <h1 className="text-2xl font-extrabold text-white leading-tight truncate">{firstName}.</h1>
            </div>
            <div className="shrink-0 flex flex-col items-end gap-1.5">
              <span className="h-6 px-2.5 rounded-full bg-white/15 border border-white/20 text-white text-[11px] font-semibold flex items-center gap-1 tabular-nums">
                <CalendarDays className="w-3 h-3 text-white/80" aria-hidden="true" />
                {dateLabel}
              </span>
            </div>
          </div>

          {onHireNewStaff && (
            <button
              type="button"
              onClick={onHireNewStaff}
              className="mt-4 w-full p-3 rounded-xl bg-white text-left flex items-center gap-3 shadow-[0_8px_18px_-12px_rgba(15,23,42,0.5)] active:bg-blue-50 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <span className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-[#2F68FE] flex items-center justify-center shrink-0">
                <UserPlus className="w-5 h-5" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-bold text-[#1E293B] leading-tight">Hire New Staff</span>
                <span className="block mt-0.5 text-[11px] text-slate-500 leading-snug">Browse ready-to-hire profiles in the Talent Marketplace</span>
              </span>
              <span className="w-8 h-8 rounded-full bg-linear-to-r from-[#5B7BFA] to-[#7C5CFA] text-white flex items-center justify-center shrink-0">
                <ChevronRight className="w-4 h-4" />
              </span>
            </button>
          )}
        </section>

        {actionItems && <ActionRequiredCard items={actionItems} onOpenBilling={onOpenBilling} />}

        {utilizationMembers && <StaffUtilizationCard members={utilizationMembers} />}

        {recommendedProfiles && recommendedProfiles.length > 0 && (
          <RecommendedProfilesCard profiles={recommendedProfiles} onOpenProfile={onOpenRecommendedProfile} onOpenAll={onOpenMarketplace} />
        )}

        {savedProfiles && <SavedProfilesCard profiles={savedProfiles} onOpenProfile={onOpenSavedProfile} onOpenAll={onOpenSavedResumes} />}

        {shortlistedCandidates && (
          <ShortlistedCandidatesCard
            candidates={shortlistedCandidates}
            onOpenCandidate={onOpenCandidate}
            onOpenAll={onOpenShortlisted}
            onBrowse={onHireNewStaff}
          />
        )}

        {requirements && (
          <StaffRequirementCard
            requirements={requirements}
            hub={requirementHub}
            candidates={requirementCandidates}
            onOpenRequirement={onOpenRequirement}
            onOpenAll={onOpenRequirements}
            onAdd={onAddRequirement}
          />
        )}

        <ServicesCard onOpen={onOpenServices} />

        {/* My Offshore Staff: hours bars */}
        <section className="bg-white border border-[#EBF0F7] rounded-[20px] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <div className="px-4 pt-4 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onOpenMyStaff}
              disabled={!onOpenMyStaff}
              className="flex items-center gap-2.5 min-w-0 rounded-lg cursor-pointer disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]"
              aria-label="Open My Staff"
            >
              <span className="w-8 h-8 rounded-xl bg-[#EEF2FF] text-[#2F68FE] flex items-center justify-center shrink-0">
                <UsersRound className="w-4 h-4" />
              </span>
              <h2 className="text-sm font-bold text-[#1E293B] truncate">My Offshore Staff</h2>
              {onOpenMyStaff && <ArrowUpRight className="w-4 h-4 text-[#2F68FE] shrink-0" />}
            </button>
            <div className="w-[128px] shrink-0">
              <Dropdown size="md" ariaLabel="Period" value={period} options={OFFSHORE_PERIODS} onChange={changePeriod} menuMinWidth={150} />
            </div>
          </div>

          {staffLoading ? (
            <div className="p-4 space-y-3" aria-busy="true" aria-label="Loading staff hours">
              {previewStaff.map((s) => (
                <div key={s.id} className="flex items-center gap-3">
                  <Skeleton className="w-9 h-9 rounded-full" />
                  <Skeleton className="flex-1 h-6" />
                  <Skeleton className="w-14 h-4" />
                </div>
              ))}
            </div>
          ) : staff.length === 0 ? (
            <div className="px-4 py-10 flex flex-col items-center text-center">
              <span className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                <UsersRound className="w-6 h-6" />
              </span>
              <p className="mt-3 text-sm font-bold text-[#1E293B]">No active staff to display yet.</p>
              <p className="mt-1 text-xs text-slate-500">Hired staff will show up here.</p>
            </div>
          ) : (
            <>
              <div className="mx-4 mt-3 flex items-center justify-between px-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                <span>Staff Name</span>
                <span>Productive Hrs</span>
              </div>
              <ul className="px-4 pt-1 pb-1">
                {previewStaff.map((s, idx) => {
                  const hrs = s.productiveHrs[period];
                  const pct = hrs == null || maxHrs === 0 ? 0 : Math.max(4, Math.round((hrs / maxHrs) * 100));
                  return (
                    <li key={s.id} className="flex items-center gap-3 py-2">
                      <span className={`w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${avatarTint(idx)}`}>
                        {initialsOf(s.name)}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[13px] font-semibold text-[#1E293B] truncate">{s.name}</span>
                        <span className="mt-1 block h-1.5 rounded-full bg-slate-100 overflow-hidden" aria-hidden="true">
                          <span className="block h-full rounded-full bg-linear-to-r from-[#2F68FE] to-[#6366F1] transition-[width] duration-500" style={{ width: `${pct}%` }} />
                        </span>
                      </span>
                      <span className={`shrink-0 min-w-[58px] text-right text-xs tabular-nums ${hrs == null ? 'text-slate-400 font-semibold' : 'font-bold text-[#1E293B]'}`}>
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
                    className="w-full h-10 rounded-xl border border-[#2F68FE] bg-white text-[#2F68FE] text-xs font-bold flex items-center justify-center gap-1.5 active:bg-blue-50 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]"
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

        {/* What's Happening Around!: card opens the full feed page */}
        <button
          type="button"
          onClick={() => setFeedOpen(true)}
          className="w-full bg-white border border-[#EBF0F7] rounded-2xl p-4 shadow-2xs text-left active:bg-slate-50 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]"
        >
          <span className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-[#EEF2FF] text-[#2F68FE] flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="flex-1 min-w-0 text-sm font-bold text-[#1E293B] truncate">What's Happening Around!</span>
            {totalUnread > 0 && (
              <span className="min-w-5 h-5 px-1 rounded-full bg-[#2F68FE] text-white text-[10px] font-bold flex items-center justify-center tabular-nums shrink-0">
                {totalUnread}
              </span>
            )}
            <ChevronRight className="w-4 h-4 text-[#2F68FE] shrink-0" />
          </span>
          {latestPost && (
            <span className="mt-3 block p-3 rounded-xl bg-slate-50/80 border border-slate-100">
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 tabular-nums">
                <CalendarDays className="w-3 h-3" aria-hidden="true" />
                {formatPostDate(latestPost.publishDate)} · {latestPost.tab}
              </span>
              <span className="mt-1 block text-xs font-semibold text-slate-700 leading-snug line-clamp-2">{latestPost.title}</span>
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
