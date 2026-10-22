import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Briefcase,
  CalendarClock,
  CalendarPlus,
  Check,
  ChevronRight,
  CircleCheck,
  CircleX,
  ClipboardCheck,
  Eye,
  Headset,
  Hourglass,
  Loader2,
  MessageSquareText,
  MoreHorizontal,
  SearchX,
  SlidersHorizontal,
  UsersRound,
  Video,
  X,
} from 'lucide-react';
import { useClientPermission } from '../context/ClientPermissionContext';
import { FilterIconButton } from '../../common/TeamFilterSheet';
import { avatarTint, initialsOf } from '../../home/celebrationUtils';
import { ScreenHeader, DesignVersion, EmptyCard } from '../staff/tabs/StaffTabParts';
import { StaffAvatar } from '../staff/ClientStaffParts';
import { useTimesheetNotice } from '../timesheets/TimesheetParts';
import {
  ASSESSMENT_CATALOG,
  ASSESSMENT_MAX,
  AssignedAssessment,
  CANDIDATE_PAGE_SIZE,
  CANDIDATE_STATUSES,
  CLIENT_TZ,
  CandidateFeedback,
  CandidateFilters,
  CandidateStatus,
  CandidateStatusChip,
  EMPTY_CANDIDATE_FILTERS,
  candidateFilterCount,
  ScheduledInterview,
  ShortlistedCandidate,
  activeAssignments,
  assessmentActionOf,
  atAssessmentMax,
  canBulkAssign,
  canManageInterview,
  canRequestInterview,
  feedbackAvailable,
  formatShortDate,
  interviewCountdown,
  interviewLabels,
  interviewWindow,
  isBulkSelectable,
  isoOfDate,
  matchesCandidate,
  remainingAssessmentSlots,
} from '../data/clientInterviewsData';
import { AssessmentAssignSheet, AssessmentProgressSheet } from './AssessmentSheets';
import { CandidateResumeView } from './CandidateResumeView';
import { InterviewFeedbackSheet } from './InterviewFeedbackSheet';
import { InterviewFilterSheet } from './InterviewFilterSheet';
import {
  CandidateCvSheet,
  CandidateListSkeletonV1,
  CandidateListSkeletonV2,
  CandidateStatusPill,
  CardActionsSheet,
  InterviewConfirmSheet,
} from './InterviewParts';
import { InterviewScheduleSheet, InterviewScheduledSheet } from './InterviewScheduleSheet';

interface Props {
  candidates: ShortlistedCandidate[];
  /** Candidates live in ClientApp so changes are kept while switching modules */
  onUpdate: (id: string, patch: Partial<ShortlistedCandidate>) => void;
  onContactManager: () => void;
  /** Staff Requirement "N Shortlisted" opens the list filtered to that profile (desktop `p_id`) */
  initialProfile?: string | null;
  /** Header back arrow (Dashboard) */
  onBack?: () => void;
}

type Sheet = 'filter' | 'feedback' | 'schedule' | 'scheduled' | 'assign' | 'progress' | 'cv' | 'cancel' | 'more' | null;

/** Desktop loads the table by ajax */
const LOAD_MS = 600;

/** Join / Reschedule / Cancel depend on the clock, so the cards re-check every 30 seconds */
const useNow = (intervalMs = 30_000) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
};

type StatusTone = 'blue' | 'amber' | 'green' | 'red';

const DESIGN_VERSIONS = ['V1', 'V2'] as const;

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]';

/** Desktop status card icons: tick (Applied / Shortlisted), hourglass (waiting), circle tick (done), circle cross (closed) */
const STATUS_CARD: Record<CandidateStatus, { icon: React.ElementType; tone: StatusTone }> = {
  Applied: { icon: Check, tone: 'blue' },
  Shortlisted: { icon: Check, tone: 'blue' },
  'Interview Scheduled': { icon: Hourglass, tone: 'amber' },
  'In Process': { icon: Hourglass, tone: 'amber' },
  Hired: { icon: CircleCheck, tone: 'green' },
  Hold: { icon: Hourglass, tone: 'amber' },
  Selected: { icon: CircleCheck, tone: 'green' },
  'Not Selected': { icon: CircleX, tone: 'red' },
  Left: { icon: CircleX, tone: 'red' },
};

/** Theme tones per status family: accent bar, icon tile, solid chip, soft band, dot, text and selected tile */
const TONE: Record<StatusTone, { bar: string; tile: string; solid: string; band: string; dot: string; text: string; ring: string }> = {
  blue: { bar: 'bg-[#2F68FE]', tile: 'bg-[#EFF6FF] text-[#2F68FE]', solid: 'bg-[#2F68FE] text-white border-[#2F68FE]', band: 'bg-[#F5F8FF]', dot: 'bg-[#2F68FE]', text: 'text-[#2F68FE]', ring: 'border-[#2F68FE] bg-[#F5F8FF]' },
  amber: { bar: 'bg-[#F59E0B]', tile: 'bg-[#FFFBEB] text-[#D97706]', solid: 'bg-[#D97706] text-white border-[#D97706]', band: 'bg-[#FEF8E7]', dot: 'bg-[#D97706]', text: 'text-[#B45309]', ring: 'border-[#D97706] bg-[#FFFCF5]' },
  green: { bar: 'bg-[#10B981]', tile: 'bg-[#F0FDF4] text-[#16A34A]', solid: 'bg-[#16A34A] text-white border-[#16A34A]', band: 'bg-[#E8F8F0]', dot: 'bg-[#10B981]', text: 'text-[#047857]', ring: 'border-[#16A34A] bg-[#F7FDF9]' },
  red: { bar: 'bg-[#EF4444]', tile: 'bg-[#FEF2F2] text-[#DC2626]', solid: 'bg-[#DC2626] text-white border-[#DC2626]', band: 'bg-[#FEF2F2]', dot: 'bg-[#DC2626]', text: 'text-[#DC2626]', ring: 'border-[#DC2626] bg-[#FFF8F8]' },
};

/** V2: label / value row */
const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex items-center justify-between gap-3 py-2 min-h-9">
    <dt className="text-[12px] font-medium text-slate-500 shrink-0">{label}</dt>
    <dd className="min-w-0 text-[12.5px] font-semibold text-[#1E293B] text-right flex items-center justify-end gap-2 flex-wrap">{children}</dd>
  </div>
);

const Dash: React.FC = () => <span className="text-slate-400 font-medium">-</span>;

const SelectBox: React.FC<{ checked: boolean; disabled: boolean; round?: boolean }> = ({ checked, disabled, round }) => (
  <span
    className={`w-5 h-5 ${round ? 'rounded-full' : 'rounded'} border flex items-center justify-center shrink-0 ${
      disabled ? 'bg-slate-100 border-slate-200' : checked ? 'bg-[#2F68FE] border-[#2F68FE] text-white' : 'bg-white border-slate-300'
    }`}
    aria-hidden="true"
  >
    {checked && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
  </span>
);

type ActTone = 'primary' | 'success' | 'soft';

/** Card footer action (same set in both designs) */
interface CardAct {
  key: string;
  label: string;
  icon: React.ElementType;
  tone: ActTone;
  ariaLabel?: string;
  onClick: () => void;
}

const stop = (fn: () => void) => (e: React.MouseEvent) => {
  e.stopPropagation();
  fn();
};

const hasResumeOf = (c: ShortlistedCandidate) => (c.source === 'hub' ? Boolean(c.resume) : Boolean(c.cvFile));

/**
 * Hire New Staff › Shortlisted Candidates (desktop `interviews&task=shortlistedcandidates`): status cards, search, candidate
 * list with assessments, View Resume, Interview Feedback, Request / Reschedule / Cancel Interview, Join Interview and
 * bulk "Request Assessment". V1 / V2 = two list designs with the same content and behaviour.
 */
export const ClientInterviewsView: React.FC<Props> = ({ candidates, onUpdate, onContactManager, initialProfile, onBack }) => {
  // view = resume / feedback / progress; add = feedback, request interview, assign assessment; edit = reschedule; delete = cancel interview; download = files
  const { view: canView, add: canAdd, edit: canEdit, delete: canDelete, download: canDownload } = useClientPermission('interviews');

  const [version, setVersion] = useState<DesignVersion>('V1');
  const v2 = version === 'V2';
  const now = useNow();
  const [loading, setLoading] = useState(true);
  const [chip, setChip] = useState<CandidateStatusChip>('All');
  const [filters, setFilters] = useState<CandidateFilters>(() => (initialProfile ? { ...EMPTY_CANDIDATE_FILTERS, profile: initialProfile } : EMPTY_CANDIDATE_FILTERS));
  const [pages, setPages] = useState(1);
  const [moreLoading, setMoreLoading] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [sheet, setSheet] = useState<Sheet>(null);
  // Kept after a sheet closes so its content doesn't blank out during the close animation
  const [targetId, setTargetId] = useState<string | null>(null);
  const [scheduleMode, setScheduleMode] = useState<'request' | 'reschedule'>('request');
  const [assignIds, setAssignIds] = useState<string[]>([]);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [notice, showNotice] = useTimesheetNotice();
  const listRef = useRef<HTMLDivElement>(null);
  const listScroll = useRef(0);

  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setLoading(false), LOAD_MS);
    return () => clearTimeout(t);
  }, [loading]);

  // Back from View Resume returns to the same place in the list
  useLayoutEffect(() => {
    if (!resumeId && listRef.current) listRef.current.scrollTop = listScroll.current;
  }, [resumeId]);

  const byId = (id: string | null) => candidates.find((c) => c.id === id) ?? null;
  const target = byId(targetId);
  const closeSheet = () => setSheet(null);
  const openSheet = (next: Exclude<Sheet, null>, id?: string) => {
    if (id) setTargetId(id);
    setSheet(next);
  };

  const profiles = useMemo(() => [...new Set(candidates.map((c) => c.profile))].sort(), [candidates]);

  // Desktop status cards count the searched list; tapping one filters by that status (tap again for all)
  const base = candidates.filter((c) => matchesCandidate(c, filters));
  const counts = Object.fromEntries([
    ['All', base.length],
    ...CANDIDATE_STATUSES.map((s) => [s, base.filter((c) => c.status === s).length]),
  ]) as Record<CandidateStatusChip, number>;
  const results = chip === 'All' ? base : base.filter((c) => c.status === chip);
  const visible = results.slice(0, pages * CANDIDATE_PAGE_SIZE);

  const filterCount = candidateFilterCount(filters);
  const isFiltered = filterCount > 0 || chip !== 'All';

  const anySelectable = canAdd && candidates.some(isBulkSelectable);
  // Rows whose checkbox can be ticked (desktop disables it when the assessment slots are full)
  const pickable = visible.filter(canBulkAssign);

  const reload = () => {
    setPages(1);
    setLoading(true);
    listRef.current?.scrollTo({ top: 0 });
  };
  const applyFilters = (next: CandidateFilters) => {
    setFilters(next);
    reload();
  };
  const clearAll = () => {
    setChip('All');
    applyFilters(EMPTY_CANDIDATE_FILTERS);
  };

  const exitSelect = () => {
    setSelectMode(false);
    setSelected([]);
  };

  const openResume = (c: ShortlistedCandidate) => {
    if (!canView || !hasResumeOf(c)) return;
    if (c.source === 'hub') {
      listScroll.current = listRef.current?.scrollTop ?? 0;
      setResumeId(c.id);
    } else {
      openSheet('cv', c.id);
    }
  };

  const openAssign = (ids: string[]) => {
    setAssignIds(ids);
    setSheet('assign');
  };

  const scheduleInterview = (id: string, interview: ScheduledInterview) => {
    onUpdate(id, { interview, status: 'Interview Scheduled' });
    setSheet('scheduled');
  };

  const saveFeedback = (id: string, feedback: CandidateFeedback) => {
    // The interview result decides the candidate's status (Rejected shows as Not Selected); Hired also stamps the date
    const decided = feedback.result === 'Rejected' ? 'Not Selected' : feedback.result;
    onUpdate(id, decided ? { feedback, status: decided, completedOn: decided === 'Hired' ? feedback.submittedOn : null } : { feedback });
    setSheet(null);
    showNotice('Feedback Added Successfully.');
  };

  const assign = (picks: Record<string, string[]>) => {
    const today = isoOfDate(new Date());
    let people = 0;
    Object.entries(picks).forEach(([id, ids]) => {
      const c = byId(id);
      if (!c) return;
      const added: AssignedAssessment[] = ids.flatMap((assessmentId, i) => {
        const a = ASSESSMENT_CATALOG.find((x) => x.id === assessmentId);
        return a ? [{ id: `sa-${Date.now()}-${id}-${i}`, assessmentId, name: a.name, assignedOn: today, status: 'Pending' as const }] : [];
      });
      if (added.length) {
        people += 1;
        onUpdate(id, { assessments: [...c.assessments, ...added] });
      }
    });
    setSheet(null);
    exitSelect();
    showNotice(`Assessments assigned. ${people === 1 ? 'The candidate has' : `${people} candidates have`} been emailed an invitation.`);
  };

  /** Reschedule / Cancel Interview (clock-dependent, so they are worked out per render) */
  const menuFor = (c: ShortlistedCandidate) => {
    const win = c.interview ? interviewWindow(c.interview, now) : null;
    const manage = canManageInterview(c);
    const out: { key: string; label: string; icon: React.ElementType; danger?: boolean; onClick: () => void }[] = [];
    if (canEdit && manage && win?.reschedule) {
      out.push({
        key: 'reschedule',
        label: 'Reschedule Interview',
        icon: CalendarClock,
        onClick: () => {
          setScheduleMode('reschedule');
          openSheet('schedule', c.id);
        },
      });
    }
    if (canDelete && manage && win?.cancel) {
      out.push({ key: 'cancel', label: 'Cancel Interview', icon: X, danger: true, onClick: () => openSheet('cancel', c.id) });
    }
    return out;
  };

  /** Values + actions shared by both designs (same content and behaviour) */
  const cardData = (c: ShortlistedCandidate) => {
    const win = c.interview ? interviewWindow(c.interview, now) : null;
    const selectable = selectMode && isBulkSelectable(c);
    const atMax = atAssessmentMax(c);
    const resumeReady = canView && hasResumeOf(c);
    const tapOpens = selectMode ? selectable && !atMax : resumeReady;
    const checked = selected.includes(c.id);

    const tap = () => {
      if (selectMode) {
        if (selectable && !atMax) setSelected((s) => (s.includes(c.id) ? s.filter((x) => x !== c.id) : [...s, c.id]));
        return;
      }
      openResume(c);
    };

    // Main actions share the footer row; Reschedule / Cancel live behind the "More" button
    const actions: CardAct[] = [];
    if (canView && c.source === 'hub' && c.status === 'Interview Scheduled' && c.interview?.zoomUrl && win?.join) {
      actions.push({ key: 'join', label: 'Join', ariaLabel: `Join interview with ${c.name}`, icon: Video, tone: 'success', onClick: () => showNotice('Opening the Zoom meeting…') });
    }
    if (canAdd && canRequestInterview(c)) {
      actions.push({
        key: 'request',
        label: 'Request Interview',
        icon: CalendarPlus,
        tone: 'primary',
        onClick: () => {
          setScheduleMode('request');
          openSheet('schedule', c.id);
        },
      });
    }
    if (feedbackAvailable(c) && (c.feedback ? canView : canAdd)) {
      actions.push({ key: 'feedback', label: c.feedback ? 'View Feedback' : 'Feedback', icon: MessageSquareText, tone: 'soft', onClick: () => openSheet('feedback', c.id) });
    }
    const hasMenu = menuFor(c).length > 0;

    return {
      tone: STATUS_CARD[c.status].tone,
      iv: interviewLabels(c),
      countdown: c.status === 'Interview Scheduled' && c.interview ? interviewCountdown(c.interview, now) : null,
      used: activeAssignments(c).length,
      assessAction: assessmentActionOf(c),
      selectable,
      atMax,
      checked,
      resumeReady,
      tapOpens,
      actions,
      hasMenu,
      showFooter: !selectMode && (actions.length > 0 || resumeReady || hasMenu),
      accountManagerNote: c.source === 'hub' && c.status === 'Shortlisted' && !canRequestInterview(c),
      tapProps: {
        role: tapOpens ? (selectMode ? 'checkbox' : 'button') : undefined,
        'aria-checked': selectMode && tapOpens ? checked : undefined,
        tabIndex: tapOpens ? 0 : undefined,
        onClick: tap,
        onKeyDown: (e: React.KeyboardEvent) => {
          if (tapOpens && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            tap();
          }
        },
        'aria-label': tapOpens ? (selectMode ? `Select ${c.name} for assessment` : `${c.name}, ${c.status}. View resume`) : undefined,
      },
    };
  };
  type CardData = ReturnType<typeof cardData>;

  const interviewValue = (d: CardData, badge: (soon: boolean) => string) =>
    d.iv ? (
      <>
        <span className="tabular-nums">
          {d.iv.date} · {d.iv.time.replace(` (${CLIENT_TZ})`, '')}
        </span>
        {d.countdown && <span className={`px-2 py-0.5 text-[10.5px] font-bold whitespace-nowrap ${badge(d.countdown.soon)}`}>{d.countdown.label}</span>}
      </>
    ) : (
      <Dash />
    );

  /** Assessment slots + text-link Assign / View (same rules in both designs) */
  const assessmentsValue = (c: ShortlistedCandidate, d: CardData, dot: string) =>
    d.assessAction === 'none' ? (
      <Dash />
    ) : (
      <>
        <span className="flex items-center gap-1" aria-label={`${d.used} of ${ASSESSMENT_MAX} assessment slots used`}>
          {Array.from({ length: ASSESSMENT_MAX }, (_, i) => (
            <span key={i} className={`${dot} ${i < d.used ? 'bg-[#2F68FE]' : 'bg-slate-200'}`} />
          ))}
        </span>
        <span className="text-slate-600 tabular-nums">
          {d.used}/{ASSESSMENT_MAX}
        </span>
        {d.assessAction === 'assign' && canAdd && !selectMode && (
          <button type="button" onClick={stop(() => openAssign([c.id]))} aria-label={`Assign assessments to ${c.name}`} className={`ml-1 text-[12px] font-bold text-[#2F68FE] cursor-pointer rounded ${FOCUS}`}>
            Assign
          </button>
        )}
        {d.assessAction === 'view' && canView && !selectMode && (
          <button
            type="button"
            onClick={stop(() => openSheet('progress', c.id))}
            aria-label={`View assessment progress for ${c.name}`}
            className={`ml-1 text-[12px] font-bold text-[#2F68FE] cursor-pointer rounded ${FOCUS}`}
          >
            View
          </button>
        )}
      </>
    );

  /* ---------- Card (V1): soft card ---------- */
  const cardV1 = (c: ShortlistedCandidate) => {
    const d = cardData(c);
    const t = TONE[d.tone];
    const pill = `h-10 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${FOCUS}`;
    const actStyle: Record<ActTone, string> = {
      primary: 'bg-[#2F68FE] text-white shadow-[0_6px_14px_-6px_rgba(47,104,254,0.7)] active:bg-[#1D4ED8]',
      success: 'bg-[#10B981] text-white shadow-[0_6px_14px_-6px_rgba(16,185,129,0.7)] active:bg-[#059669]',
      soft: 'bg-[#F1F5F9] text-slate-600 active:bg-slate-200',
    };
    const roundIcon = (Icon: React.ElementType, label: string, onClick: () => void) => (
      <button type="button" onClick={stop(onClick)} aria-label={label} title={label} className={`w-10 shrink-0 border border-slate-200 bg-white text-slate-600 active:bg-slate-50 ${pill}`}>
        <Icon className="w-4 h-4" />
      </button>
    );

    return (
      <li key={c.id}>
        <article
          className={`relative bg-white rounded-2xl border shadow-[0_4px_16px_-8px_rgba(15,23,42,0.12)] ${
            selectMode && d.checked ? 'border-[#2F68FE] ring-2 ring-[#2F68FE]/25' : 'border-slate-100'
          }`}
        >
          <span aria-hidden="true" className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full ${t.bar}`} />
          <div {...d.tapProps} className={`pl-5 pr-4 pt-4 ${d.showFooter || d.accountManagerNote ? 'pb-3' : 'pb-4'} rounded-2xl ${d.tapOpens ? 'active:bg-slate-50/70 cursor-pointer' : ''} transition-colors`}>
            <div className="flex items-center gap-3">
              {d.selectable && <SelectBox round checked={d.checked} disabled={d.atMax} />}
              <StaffAvatar name={c.name} tint={candidates.findIndex((x) => x.id === c.id)} />
              <span className="flex-1 min-w-0">
                <span className="block text-[15px] font-bold text-[#1E293B] truncate">{c.name}</span>
                <span className="block mt-0.5 text-[11.5px] text-slate-500 truncate">
                  Resume ID <span className="font-semibold text-slate-700 tabular-nums">{c.resumeId || '-'}</span>
                </span>
              </span>
              <span className="shrink-0 self-start">
                <CandidateStatusPill status={c.status} />
              </span>
            </div>

            <div className="mt-3 flex items-start gap-2">
              <Briefcase className="w-4 h-4 mt-0.5 shrink-0 text-[#2F68FE]" aria-hidden="true" />
              <p className="min-w-0 text-[13px] leading-snug">
                <span className="sr-only">Profile: </span>
                <span className="font-semibold text-[#1E293B]">{c.profile || '-'}</span>
                {c.domain && (
                  <span className="ml-1.5 inline-block align-middle px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[10.5px] font-semibold text-[#4F46E5] whitespace-nowrap">{c.domain}</span>
                )}
              </p>
            </div>

            <dl className="mt-3 rounded-xl bg-[#F5F8FF] border border-dashed border-[#BFDBFE] px-3 py-2.5 flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-lg bg-white text-[#2F68FE] flex items-center justify-center shrink-0 shadow-2xs" aria-hidden="true">
                <CalendarClock className="w-4.5 h-4.5" />
              </span>
              <div className="flex-1 min-w-0">
                <dt className="text-[10.5px] font-medium text-slate-500 leading-tight">Interview ({CLIENT_TZ})</dt>
                <dd className="mt-0.5 text-[12.5px] font-bold text-[#1E293B] flex items-center gap-2 flex-wrap">
                  {interviewValue(d, (soon) => `rounded-full ${soon ? 'bg-[#2F68FE] text-white' : 'bg-white text-[#2F68FE] border border-[#BFDBFE]'}`)}
                </dd>
              </div>
            </dl>

            <dl className="mt-2 grid grid-cols-2 gap-2">
              <div className="min-w-0 rounded-xl bg-[#F8FAFC] px-3 py-2.5 flex items-start gap-2">
                <CircleCheck className="w-4 h-4 mt-0.5 shrink-0 text-[#10B981]" aria-hidden="true" />
                <div className="min-w-0">
                  <dt className="text-[10.5px] font-medium text-slate-400 leading-tight">Completed On</dt>
                  <dd className="mt-0.5 text-[12.5px] font-semibold text-[#1E293B] tabular-nums">{c.completedOn ? formatShortDate(c.completedOn) : <Dash />}</dd>
                </div>
              </div>
              <div className="min-w-0 rounded-xl bg-[#F8FAFC] px-3 py-2.5 flex items-start gap-2">
                <ClipboardCheck className="w-4 h-4 mt-0.5 shrink-0 text-[#2F68FE]" aria-hidden="true" />
                <div className="min-w-0">
                  <dt className="text-[10.5px] font-medium text-slate-400 leading-tight">Assessments</dt>
                  <dd className="mt-0.5 text-[12.5px] font-semibold text-[#1E293B] flex items-center gap-1.5 flex-wrap">{assessmentsValue(c, d, 'w-1.5 h-1.5 rounded-full')}</dd>
                </div>
              </div>
            </dl>
          </div>

          {d.accountManagerNote && (
            <p className="ml-5 mr-4 mb-3 pl-3 pr-1 py-1 rounded-full bg-amber-50 text-[11px] text-amber-800 leading-snug flex items-center gap-2">
              <Headset className="w-4 h-4 shrink-0 text-amber-600" aria-hidden="true" />
              <span className="flex-1">{`${c.replacement ? 'Replacement profile. ' : ''}Your account manager will schedule this interview.`}</span>
              <button type="button" onClick={onContactManager} className={`shrink-0 h-8 px-3 rounded-full bg-white text-[11px] font-bold text-[#2F68FE] cursor-pointer ${FOCUS}`}>
                Contact
              </button>
            </p>
          )}

          {d.showFooter && (
            <div className="pl-5 pr-4 pb-4 flex items-center gap-2">
              {d.actions.map((a) => (
                <button key={a.key} type="button" onClick={stop(a.onClick)} aria-label={a.ariaLabel ?? a.label} className={`flex-1 min-w-0 px-3 ${actStyle[a.tone]} ${pill}`}>
                  <a.icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{a.label}</span>
                </button>
              ))}
              {d.resumeReady &&
                (d.actions.length === 0 ? (
                  <button type="button" onClick={stop(() => openResume(c))} aria-label={`View resume of ${c.name}`} className={`flex-1 min-w-0 px-3 border border-[#BFDBFE] bg-[#EFF6FF] text-[#2F68FE] active:bg-blue-100 ${pill}`}>
                    <Eye className="w-4 h-4 shrink-0" />
                    <span className="truncate">View Resume</span>
                  </button>
                ) : (
                  roundIcon(Eye, `View resume of ${c.name}`, () => openResume(c))
                ))}
              {d.actions.length === 0 && !d.resumeReady && <span className="flex-1" />}
              {d.hasMenu && roundIcon(MoreHorizontal, `More actions for ${c.name}`, () => openSheet('more', c.id))}
            </div>
          )}
        </article>
      </li>
    );
  };

  /* ---------- Card (V2): compact ticket ---------- */
  const cardV2 = (c: ShortlistedCandidate) => {
    const d = cardData(c);
    const t = TONE[d.tone];
    const seg = `relative min-w-0 h-11 px-1.5 text-xs flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#2F68FE]`;
    const actStyle: Record<ActTone, string> = {
      primary: 'font-bold text-[#2F68FE] active:bg-[#EFF6FF]',
      success: 'font-bold text-[#059669] active:bg-[#E8F8F0]',
      soft: 'font-semibold text-slate-600 active:bg-slate-100',
    };
    const iconSeg = (Icon: React.ElementType, label: string, onClick: () => void) => (
      <button type="button" onClick={stop(onClick)} aria-label={label} title={label} className={`w-12 shrink-0 text-slate-500 active:bg-slate-100 ${seg}`}>
        <Icon className="w-4 h-4" />
      </button>
    );

    return (
      <li key={c.id}>
        <article className={`bg-white rounded-xl border shadow-2xs overflow-hidden ${selectMode && d.checked ? 'border-[#2F68FE] ring-1 ring-[#2F68FE]' : 'border-[#E2E8F0]'}`}>
          <div {...d.tapProps} className={`block ${d.tapOpens ? 'active:bg-slate-50 cursor-pointer' : ''} transition-colors`}>
            <div className={`h-9 px-3.5 flex items-center gap-2 border-b border-[#EBF0F7] ${t.band}`}>
              {d.selectable && <SelectBox checked={d.checked} disabled={d.atMax} />}
              <span className={`flex items-center gap-1.5 text-[11.5px] font-bold ${t.text}`}>
                <span aria-hidden="true" className={`w-1.5 h-1.5 rounded-full ${t.dot}`} />
                {c.status}
              </span>
              <span className="ml-auto text-[10.5px] font-medium text-slate-500 truncate">
                Resume ID <span className="font-bold text-[#1E293B] tabular-nums">{c.resumeId || '-'}</span>
              </span>
            </div>

            <div className="px-3.5 pt-3 pb-2">
              <div className="flex items-center gap-2.5">
                <span className={`w-9 h-9 rounded-lg flex items-center justify-center text-[11.5px] font-bold shrink-0 ${avatarTint(candidates.findIndex((x) => x.id === c.id))}`} aria-hidden="true">
                  {initialsOf(c.name)}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="flex items-center gap-1 text-[14.5px] font-bold text-[#1E293B]">
                    <span className="truncate">{c.name}</span>
                    {d.tapOpens && !selectMode && <ChevronRight className="w-4 h-4 shrink-0 text-[#2F68FE]" aria-hidden="true" />}
                  </span>
                  <span className="block mt-0.5 text-[11.5px] text-slate-500 truncate">
                    <span className="sr-only">Profile: </span>
                    <span className="font-semibold text-slate-700">{c.profile || '-'}</span>
                    {c.domain && <span className="text-slate-400"> · {c.domain}</span>}
                  </span>
                </span>
              </div>

              <dl className="mt-2 divide-y divide-dashed divide-slate-200">
                <Row label={`Interview (${CLIENT_TZ})`}>{interviewValue(d, (soon) => `rounded ${soon ? 'bg-[#2F68FE] text-white' : 'bg-[#EFF6FF] text-[#2F68FE]'}`)}</Row>
                <Row label="Completed On">{c.completedOn ? <span className="tabular-nums">{formatShortDate(c.completedOn)}</span> : <Dash />}</Row>
                <Row label="Assessments">{assessmentsValue(c, d, 'w-2.5 h-1.5 rounded-sm')}</Row>
              </dl>
            </div>
          </div>

          {d.accountManagerNote && (
            <div className="px-3.5 py-2 border-t border-dashed border-amber-200 bg-amber-50/60 flex items-center gap-2 text-[11px] text-amber-800 leading-snug">
              <Headset className="w-3.5 h-3.5 shrink-0 text-amber-600" aria-hidden="true" />
              <span className="flex-1">{`${c.replacement ? 'Replacement profile. ' : ''}Your account manager will schedule this interview.`}</span>
              <button type="button" onClick={onContactManager} className={`shrink-0 text-[11px] font-bold text-[#2F68FE] underline underline-offset-2 cursor-pointer rounded ${FOCUS}`}>
                Contact
              </button>
            </div>
          )}

          {d.showFooter && (
            <div className="flex border-t border-slate-100 divide-x divide-slate-100 bg-[#FBFCFE]">
              {d.actions.map((a) => (
                <button key={a.key} type="button" onClick={stop(a.onClick)} aria-label={a.ariaLabel ?? a.label} className={`flex-1 ${actStyle[a.tone]} ${seg}`}>
                  <a.icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{a.label}</span>
                </button>
              ))}
              {d.resumeReady &&
                (d.actions.length === 0 ? (
                  <button type="button" onClick={stop(() => openResume(c))} aria-label={`View resume of ${c.name}`} className={`flex-1 font-bold text-[#2F68FE] active:bg-[#EFF6FF] ${seg}`}>
                    <Eye className="w-4 h-4 shrink-0" />
                    <span className="truncate">View Resume</span>
                  </button>
                ) : (
                  iconSeg(Eye, `View resume of ${c.name}`, () => openResume(c))
                ))}
              {d.actions.length === 0 && !d.resumeReady && <span className="flex-1" />}
              {d.hasMenu && iconSeg(MoreHorizontal, `More actions for ${c.name}`, () => openSheet('more', c.id))}
            </div>
          )}
        </article>
      </li>
    );
  };

  const countLabel = results.length === 1 ? 'candidate' : 'candidates';
  const appliedFilters = (
    [
      ['resumeId', 'Resume ID'],
      ['profile', 'Profile'],
    ] as const
  ).filter(([key]) => filters[key].trim());
  const pickStatus = (s: CandidateStatus) => {
    setChip(chip === s ? 'All' : s);
    reload();
  };
  const toggleSelect = () => (selectMode ? exitSelect() : setSelectMode(true));

  /* ---------- Toolbar (V1): big count, pill Select, round filter, pill chips, pill status chips ---------- */
  const toolbarV1 = (
    <div className="pt-3">
      <div className="px-4 flex items-center gap-2">
        <div className="flex-1 min-w-0">
          {loading ? (
            <span className="block w-24 h-4 rounded-md bg-slate-200/70 animate-pulse" aria-hidden="true" />
          ) : (
            <p className="flex items-baseline gap-1 truncate tabular-nums">
              <span className="text-[15px] font-extrabold text-[#1E293B] leading-none">{results.length}</span>
              <span className="text-xs font-semibold text-slate-500">{countLabel}</span>
            </p>
          )}
        </div>
        {anySelectable && (
          <button
            type="button"
            onClick={toggleSelect}
            disabled={loading}
            aria-label={selectMode ? 'Cancel selection' : 'Select candidates for assessment'}
            className={`h-11 pl-3 pr-3.5 rounded-full text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors disabled:opacity-60 cursor-pointer ${FOCUS} ${
              selectMode ? 'bg-slate-200 text-slate-600 active:bg-slate-300' : 'bg-[#2F68FE] text-white shadow-[0_6px_14px_-6px_rgba(47,104,254,0.7)] active:bg-[#1D4ED8]'
            }`}
          >
            {selectMode ? <X className="w-4 h-4" /> : <ClipboardCheck className="w-4 h-4" />}
            {selectMode ? 'Cancel' : 'Select'}
          </button>
        )}
        <FilterIconButton count={filterCount} onClick={() => openSheet('filter')} />
      </div>

      {filterCount > 0 && (
        <div className="mt-3 px-4 flex items-center gap-2">
          <div className="flex-1 min-w-0 flex gap-1.5 overflow-x-auto no-scrollbar" aria-label="Applied filters">
            {appliedFilters.map(([key, label]) => (
              <span key={key} className="shrink-0 h-8 pl-2.5 pr-1 rounded-full bg-white border border-slate-200 shadow-2xs text-[11px] font-semibold text-[#1E293B] flex items-center gap-1.5">
                <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-[#2F68FE]" />
                {label}: {filters[key].trim()}
                <button
                  type="button"
                  onClick={() => applyFilters({ ...filters, [key]: '' })}
                  aria-label={`Remove ${label} filter`}
                  className="w-5.5 h-5.5 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 active:bg-slate-200 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <button type="button" onClick={clearAll} className="shrink-0 h-8 px-1 text-[11px] font-bold text-[#2F68FE] cursor-pointer">
            Clear All
          </button>
        </div>
      )}

      <div className="mt-3 px-4 pb-1 flex gap-2 overflow-x-auto no-scrollbar" role="group" aria-label="Candidate status">
        {CANDIDATE_STATUSES.map((s) => {
          const { icon: Icon, tone } = STATUS_CARD[s];
          const on = TONE[tone];
          const active = chip === s;
          return (
            <button
              key={s}
              type="button"
              aria-pressed={active}
              onClick={() => pickStatus(s)}
              className={`shrink-0 h-10 pl-1.5 pr-1.5 rounded-full border text-[11.5px] font-semibold flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${FOCUS} ${
                active ? `${on.solid} shadow-2xs` : 'bg-white border-slate-200 text-slate-600 active:bg-slate-50'
              }`}
            >
              <span className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${active ? 'bg-white/20' : on.tile}`} aria-hidden="true">
                <Icon className="w-3.5 h-3.5" />
              </span>
              {s}
              <span className={`min-w-6 h-6 px-1.5 rounded-full text-[10.5px] font-bold flex items-center justify-center tabular-nums ${active ? 'bg-white/25 text-white' : 'bg-slate-100 text-[#1E293B]'}`}>
                {counts[s]}
              </span>
              <ChevronRight aria-hidden="true" className={`w-3.5 h-3.5 -ml-1 shrink-0 ${active ? 'text-white/80' : 'text-slate-400'}`} />
            </button>
          );
        })}
      </div>
    </div>
  );

  /* ---------- Toolbar (V2): sticky white bar, text Select / Filter, square chips, one-line status tabs ---------- */
  const toolbarV2 = (
    <>
      <div className="sticky top-0 z-10 bg-[#F8FAFC] px-4 pt-3 pb-1">
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-[0_4px_12px_-8px_rgba(15,23,42,0.15)] px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <span className="flex-1 min-w-0 truncate text-xs font-semibold text-slate-500 tabular-nums">{loading ? '' : `${results.length} ${countLabel}`}</span>
          {anySelectable && (
            <button
              type="button"
              onClick={toggleSelect}
              disabled={loading}
              aria-label={selectMode ? 'Cancel selection' : 'Select candidates for assessment'}
              className={`h-9 px-3 rounded-lg border text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors disabled:opacity-60 cursor-pointer ${FOCUS} ${
                selectMode ? 'border-slate-200 bg-slate-100 text-slate-600 active:bg-slate-200' : 'border-slate-200 bg-white text-[#2F68FE] active:bg-slate-50'
              }`}
            >
              {selectMode ? <X className="w-4 h-4" /> : <ClipboardCheck className="w-4 h-4" />}
              {selectMode ? 'Cancel' : 'Select'}
            </button>
          )}
          <button
            type="button"
            onClick={() => openSheet('filter')}
            aria-label={filterCount ? `Filters (${filterCount} applied)` : 'Filters'}
            className={`h-9 px-3 rounded-lg border text-xs font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer ${FOCUS} ${
              filterCount ? 'border-[#2F68FE] bg-[#EFF6FF] text-[#2F68FE]' : 'border-slate-200 bg-white text-slate-600 active:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filter
            {filterCount > 0 && (
              <span className="min-w-4.5 h-4.5 px-1 rounded bg-[#2F68FE] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">{filterCount}</span>
            )}
          </button>
        </div>

        {filterCount > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 min-w-0 flex gap-1.5 overflow-x-auto no-scrollbar" aria-label="Applied filters">
              {appliedFilters.map(([key, label]) => (
                <span key={key} className="shrink-0 h-7 pl-2 pr-0.5 rounded-md bg-slate-100 text-[11px] font-semibold text-slate-700 flex items-center gap-0.5">
                  {label}: {filters[key].trim()}
                  <button
                    type="button"
                    onClick={() => applyFilters({ ...filters, [key]: '' })}
                    aria-label={`Remove ${label} filter`}
                    className="w-6 h-6 rounded flex items-center justify-center text-slate-500 active:bg-slate-200 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <button type="button" onClick={clearAll} className="shrink-0 h-7 px-1 text-[11px] font-bold text-[#2F68FE] underline underline-offset-2 cursor-pointer">
              Clear All
            </button>
          </div>
        )}
      </div>
      </div>

      <div className="pt-2 px-4 flex gap-1.5 overflow-x-auto no-scrollbar snap-x scroll-px-4" role="group" aria-label="Candidate status">
        {CANDIDATE_STATUSES.map((s) => {
          const on = TONE[STATUS_CARD[s].tone];
          const active = chip === s;
          return (
            <button
              key={s}
              type="button"
              aria-pressed={active}
              onClick={() => pickStatus(s)}
              className={`relative shrink-0 snap-start h-9 pl-3 pr-1.5 rounded-lg border flex items-center gap-2 whitespace-nowrap overflow-hidden transition-colors cursor-pointer ${FOCUS} ${
                active ? on.ring : 'border-[#E2E8F0] bg-white active:bg-slate-50'
              }`}
            >
              <span aria-hidden="true" className={`absolute left-0 top-0 bottom-0 w-[3px] ${on.bar}`} />
              <span className={`text-[11.5px] ${active ? `${on.text} font-bold` : 'text-slate-600 font-semibold'}`}>{s}</span>
              <span
                className={`min-w-6 h-6 px-1.5 rounded-md text-[11px] font-extrabold flex items-center justify-center tabular-nums ${
                  active ? `${on.dot} text-white` : 'bg-slate-100 text-[#1E293B]'
                }`}
              >
                {counts[s]}
              </span>
              <ChevronRight aria-hidden="true" className={`w-3.5 h-3.5 -ml-1 shrink-0 ${active ? on.text : 'text-slate-400'}`} />
            </button>
          );
        })}
      </div>
    </>
  );

  /* ---------- View Resume ---------- */
  const resumeCandidate = resumeId ? byId(resumeId) : null;
  if (resumeCandidate) {
    return <CandidateResumeView candidate={resumeCandidate} canDownload={canDownload} onBack={() => setResumeId(null)} />;
  }

  const assignList = assignIds.map(byId).filter((c): c is ShortlistedCandidate => Boolean(c));
  const selectedReady = selected.map(byId).filter((c): c is ShortlistedCandidate => Boolean(c) && canBulkAssign(c as ShortlistedCandidate));
  const allPicked = pickable.length > 0 && pickable.every((c) => selected.includes(c.id));

  return (
    <div className="relative flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      <ScreenHeader title="Shortlisted Candidates" onBack={onBack} version={{ versions: DESIGN_VERSIONS, value: version, onChange: setVersion }} />
      {notice}
      <div ref={listRef} className="flex-1 overflow-y-auto no-scrollbar pb-6">
        {v2 ? toolbarV2 : toolbarV1}

        <div className={`px-4 ${v2 ? 'mt-3' : 'mt-4'}`}>
          {loading ? (
            v2 ? (
              <CandidateListSkeletonV2 />
            ) : (
              <CandidateListSkeletonV1 />
            )
          ) : candidates.length === 0 ? (
            <EmptyCard icon={UsersRound} title="No shortlisted candidates yet." text="Candidates shortlisted for your staff requirements will show up here." />
          ) : results.length === 0 ? (
            <EmptyCard
              icon={SearchX}
              title="No candidates found."
              text="Try another resume ID, profile or status."
              action={
                isFiltered && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="mt-4 h-10 px-4 rounded-xl bg-[#EEF2FF] text-[#2F68FE] text-xs font-bold active:bg-[#E0E7FF] cursor-pointer"
                  >
                    Clear All
                  </button>
                )
              }
            />
          ) : (
            <>
              <div className="mb-2.5 flex items-center justify-between gap-2">
                <p className={v2 ? 'text-[11px] font-bold text-slate-500 uppercase tracking-wide' : 'text-[13px] font-bold text-[#1E293B]'}>
                  {chip === 'All' ? 'All Candidates' : chip} <span className="text-slate-400 font-semibold tabular-nums">({results.length})</span>
                </p>
                {chip !== 'All' && (
                  <button
                    type="button"
                    onClick={() => {
                      setChip('All');
                      reload();
                    }}
                    className={`text-[11px] font-bold text-[#2F68FE] cursor-pointer ${v2 ? 'underline underline-offset-2' : ''}`}
                  >
                    Show all
                  </button>
                )}
              </div>
              <ul className={v2 ? 'space-y-2.5' : 'space-y-3.5'}>{visible.map(v2 ? cardV2 : cardV1)}</ul>

              {visible.length < results.length && (
                <button
                  type="button"
                  disabled={moreLoading}
                  onClick={() => {
                    setMoreLoading(true);
                    setTimeout(() => {
                      setPages((n) => n + 1);
                      setMoreLoading(false);
                    }, LOAD_MS);
                  }}
                  className={`mt-3 w-full h-11 border text-xs font-bold text-[#2F68FE] flex items-center justify-center gap-2 disabled:cursor-wait transition-colors cursor-pointer ${
                    v2 ? 'rounded-lg border-[#BFDBFE] bg-[#EFF6FF] active:bg-[#DBEAFE]' : 'rounded-full border-slate-200 bg-white shadow-2xs active:bg-slate-50'
                  }`}
                >
                  {moreLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {moreLoading ? 'Loading…' : `Load More (${results.length - visible.length})`}
                </button>
              )}
              {visible.length >= results.length && (
                <p className="mt-4 text-center text-[11px] text-slate-400 tabular-nums">
                  Showing all {results.length} {countLabel}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {selectMode &&
        (v2 ? (
          <div className="shrink-0 bg-white border-t border-[#EBF0F7] px-4 py-2.5 flex items-center gap-3">
            <span className="flex-1 min-w-0 flex items-center gap-2.5">
              <span className="text-[12px] font-bold text-[#1E293B] tabular-nums">{selectedReady.length} selected</span>
              <button
                type="button"
                onClick={() => setSelected(allPicked ? [] : pickable.map((c) => c.id))}
                disabled={pickable.length === 0}
                className="text-[11px] font-bold text-[#2F68FE] underline underline-offset-2 disabled:text-slate-300 disabled:no-underline cursor-pointer disabled:cursor-not-allowed"
              >
                {allPicked ? 'Clear selection' : 'Select all'}
              </button>
            </span>
            <button
              type="button"
              disabled={selectedReady.length === 0}
              onClick={() => openAssign(selectedReady.map((c) => c.id))}
              className={`h-10 px-4 rounded-lg bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${FOCUS}`}
            >
              Request Assessment{selectedReady.length > 0 ? ` (${selectedReady.length})` : ''}
            </button>
          </div>
        ) : (
          <div className="shrink-0 px-3 pb-3 pt-1">
            <div className="rounded-full bg-[#1E293B] text-white shadow-[0_12px_28px_-10px_rgba(15,23,42,0.6)] pl-5 pr-1.5 py-1.5 flex items-center gap-3">
              <span className="flex-1 min-w-0">
                <span className="block text-[12px] font-bold tabular-nums">{selectedReady.length} selected</span>
                <button
                  type="button"
                  onClick={() => setSelected(allPicked ? [] : pickable.map((c) => c.id))}
                  disabled={pickable.length === 0}
                  className="text-[11px] font-semibold text-[#93B4FF] disabled:text-slate-500 cursor-pointer disabled:cursor-not-allowed"
                >
                  {allPicked ? 'Clear selection' : 'Select all'}
                </button>
              </span>
              <button
                type="button"
                disabled={selectedReady.length === 0}
                onClick={() => openAssign(selectedReady.map((c) => c.id))}
                className={`h-11 px-4 rounded-full bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${FOCUS}`}
              >
                Request Assessment{selectedReady.length > 0 ? ` (${selectedReady.length})` : ''}
              </button>
            </div>
          </div>
        ))}

      <InterviewFilterSheet
        isOpen={sheet === 'filter'}
        filters={filters}
        profiles={profiles}
        onClose={closeSheet}
        onApply={(next) => {
          closeSheet();
          applyFilters(next);
        }}
      />

      <CardActionsSheet
        isOpen={sheet === 'more'}
        title={target?.name ?? ''}
        subtitle={target?.profile}
        actions={target ? menuFor(target) : []}
        onClose={closeSheet}
      />

      <InterviewFeedbackSheet isOpen={sheet === 'feedback'} candidate={target} canSubmit={canAdd} onClose={closeSheet} onSave={saveFeedback} />

      <InterviewScheduleSheet isOpen={sheet === 'schedule'} candidate={target} mode={scheduleMode} onClose={closeSheet} onSchedule={scheduleInterview} />

      <InterviewScheduledSheet
        isOpen={sheet === 'scheduled'}
        candidate={target}
        onDone={(id, attendees) => {
          const c = byId(id);
          if (c?.interview) onUpdate(id, { interview: { ...c.interview, attendees } });
          closeSheet();
          showNotice(
            attendees.length
              ? `Calendar invites sent to you and ${attendees.length} more ${attendees.length === 1 ? 'attendee' : 'attendees'}.`
              : 'Interview scheduled. A calendar invite was sent to you.',
          );
        }}
      />

      <InterviewConfirmSheet
        isOpen={sheet === 'cancel'}
        title="Cancel Interview?"
        message="You are about to cancel the scheduled interview. This action cannot be undone and the Zoom meeting will be removed."
        confirmLabel="Yes, Cancel"
        cancelLabel="Go Back"
        danger
        onClose={closeSheet}
        onConfirm={() => {
          if (targetId) onUpdate(targetId, { interview: null, status: 'Shortlisted' });
          closeSheet();
          showNotice('Interview cancelled. The Zoom meeting was removed.');
        }}
      />

      <AssessmentAssignSheet isOpen={sheet === 'assign'} candidates={assignList} onClose={closeSheet} onAssign={assign} />

      <AssessmentProgressSheet
        isOpen={sheet === 'progress'}
        candidate={target}
        canAssignMore={Boolean(target && canAdd && !atAssessmentMax(target) && target.source === 'hub')}
        canOpenFiles={canDownload}
        onClose={closeSheet}
        onAssignMore={() => target && openAssign([target.id])}
        onOpenFile={(label) => {
          closeSheet();
          showNotice(`${label} opened`);
        }}
      />

      <CandidateCvSheet
        isOpen={sheet === 'cv'}
        candidate={target}
        onClose={closeSheet}
        onOpen={(file) => {
          closeSheet();
          showNotice(`${file} opened`);
        }}
      />
    </div>
  );
};
