import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
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
  UsersRound,
  Video,
  X,
} from 'lucide-react';
import { useClientPermission } from '../context/ClientPermissionContext';
import { avatarTint, initialsOf } from '../../home/celebrationUtils';
import { FilterIconButton } from '../../common/TeamFilterSheet';
import { ScreenHeader, EmptyCard } from '../staff/tabs/StaffTabParts';
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
  hasResumeOf,
  interviewCountdown,
  interviewLabels,
  interviewWindow,
  isBulkSelectable,
  isoOfDate,
  matchesCandidate,
  remainingAssessmentSlots,
  statusTone,
} from '../data/clientInterviewsData';
import { AssessmentAssignSheet, AssessmentProgressSheet } from './AssessmentSheets';
import { CandidateResumeView } from './CandidateResumeView';
import { InterviewFeedbackSheet } from './InterviewFeedbackSheet';
import { InterviewFilterSheet } from './InterviewFilterSheet';
import {
  CandidateCvSheet,
  CandidateListSkeleton,
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
  /** Dashboard › Shortlisted Candidates opens one candidate straight away: Hub resume (its Back returns to the Dashboard) or the CV sheet */
  initialCandidateId?: string | null;
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

type StatusTone = ReturnType<typeof statusTone>;

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]';

/** Desktop status card icons: tick (Applied / Shortlisted), hourglass (waiting), circle tick (done), circle cross (closed) */
const STATUS_ICON: Record<CandidateStatus, React.ElementType> = {
  Applied: Check,
  Shortlisted: Check,
  'Interview Scheduled': Hourglass,
  'In Process': Hourglass,
  Hired: CircleCheck,
  Hold: Hourglass,
  Selected: CircleCheck,
  'Not Selected': CircleX,
  Left: CircleX,
};

/** Status card icon tile (same tone as the status pill) */
const TONE: Record<StatusTone, string> = {
  blue: 'bg-[#EFF6FF] text-[#2F68FE]',
  amber: 'bg-[#FEF8E7] text-[#D97706]',
  green: 'bg-[#E8F8F0] text-[#10B981]',
  rose: 'bg-[#FEF2F2] text-[#EF4444]',
};

const Dash: React.FC = () => <span className="text-slate-400 font-medium">-</span>;

const SelectBox: React.FC<{ checked: boolean; disabled: boolean; round?: boolean }> = ({ checked, disabled, round }) => (
  <span
    className={`w-5 h-5 ${round ? 'rounded-full' : 'rounded-md'} border-2 flex items-center justify-center shrink-0 ${
      disabled ? 'bg-slate-100 border-slate-200' : checked ? 'bg-[#2F68FE] border-[#2F68FE] text-white' : 'bg-white border-slate-300'
    }`}
    aria-hidden="true"
  >
    {checked && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
  </span>
);

type ActTone = 'primary' | 'success' | 'soft';

/** Card footer action */
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

/**
 * Hire New Staff › Shortlisted Candidates (desktop `interviews&task=shortlistedcandidates`): status cards, search, candidate
 * list with assessments, View Resume, Interview Feedback, Request / Reschedule / Cancel Interview, Join Interview and
 * bulk "Request Assessment".
 */
export const ClientInterviewsView: React.FC<Props> = ({ candidates, onUpdate, onContactManager, initialProfile, initialCandidateId, onBack }) => {
  // view = resume / feedback / progress; add = feedback, request interview, assign assessment; edit = reschedule; delete = cancel interview; download = files
  const { view: canView, add: canAdd, edit: canEdit, delete: canDelete, download: canDownload } = useClientPermission('interviews');

  const now = useNow();
  const [loading, setLoading] = useState(true);
  const [chip, setChip] = useState<CandidateStatusChip>('All');
  const [filters, setFilters] = useState<CandidateFilters>(() => (initialProfile ? { ...EMPTY_CANDIDATE_FILTERS, profile: initialProfile } : EMPTY_CANDIDATE_FILTERS));
  const [pages, setPages] = useState(1);
  const [moreLoading, setMoreLoading] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [entry] = useState(() => {
    const c = canView && initialCandidateId ? candidates.find((x) => x.id === initialCandidateId) : undefined;
    return c && hasResumeOf(c) ? c : null;
  });
  const [sheet, setSheet] = useState<Sheet>(entry?.source === 'recruiter' ? 'cv' : null);
  // Kept after a sheet closes so its content doesn't blank out during the close animation
  const [targetId, setTargetId] = useState<string | null>(entry?.source === 'recruiter' ? entry.id : null);
  const [scheduleMode, setScheduleMode] = useState<'request' | 'reschedule'>('request');
  const [assignIds, setAssignIds] = useState<string[]>([]);
  const [resumeId, setResumeId] = useState<string | null>(entry?.source === 'hub' ? entry.id : null);
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

  /** Card values + actions */
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
      tone: statusTone(c.status),
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

  /** Assessment slots + text-link Assign / View */
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
          <button type="button" onClick={stop(() => openAssign([c.id]))} aria-label={`Assign assessments to ${c.name}`} className={`basis-full text-left text-xs font-bold text-[#2F68FE] cursor-pointer rounded ${FOCUS}`}>
            Assign
          </button>
        )}
        {d.assessAction === 'view' && canView && !selectMode && (
          <button
            type="button"
            onClick={stop(() => openSheet('progress', c.id))}
            aria-label={`View assessment progress for ${c.name}`}
            className={`basis-full text-left text-xs font-bold text-[#2F68FE] cursor-pointer rounded ${FOCUS}`}
          >
            View
          </button>
        )}
      </>
    );

  /* ---------- Card: ticket — status / Resume ID header, avatar + name + profile, perforated stub (Interview | Completed On | Assessments), footer ---------- */
  const card = (c: ShortlistedCandidate) => {
    const d = cardData(c);
    const btn = `h-9 px-3.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${FOCUS}`;
    const actStyle: Record<ActTone, string> = {
      primary: 'bg-[#2F68FE] text-white shadow-xs active:bg-[#1D4ED8]',
      success: 'bg-emerald-600 text-white active:bg-emerald-700',
      soft: 'border border-[#2F68FE] bg-white text-[#2F68FE] active:bg-blue-50',
    };
    const soon = Boolean(d.countdown?.soon);
    const picked = selectMode && d.checked;
    const notch = `absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#F8FAFC] border ${picked ? 'border-[#2F68FE]' : 'border-[#EBF0F7]'}`;

    return (
      <li key={c.id}>
        <article
          className={`bg-white rounded-[20px] border shadow-[0_2px_8px_rgba(0,0,0,0.03)] overflow-hidden transition-colors ${
            picked ? 'border-[#2F68FE] ring-4 ring-blue-50' : 'border-[#EBF0F7]'
          }`}
        >
          <div {...d.tapProps} className={`block transition-colors ${d.tapOpens ? 'active:bg-slate-50 cursor-pointer' : ''}`}>
            <div className="px-4 pt-3.5 pb-4">
              <div className="flex items-center gap-2">
                {d.selectable && <SelectBox round checked={d.checked} disabled={d.atMax} />}
                <CandidateStatusPill status={c.status} />
                <span className="ml-auto min-w-0 text-[11px] text-slate-400 truncate">
                  Resume ID <span className="font-bold text-[#1E293B] tabular-nums">{c.resumeId || '-'}</span>
                </span>
              </div>

              <div className="mt-3.5 flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ring-4 ring-slate-50 ${avatarTint(candidates.findIndex((x) => x.id === c.id))}`}
                >
                  {initialsOf(c.name)}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-base font-bold text-[#1E293B] leading-tight truncate">{c.name}</span>
                  <span className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs leading-snug">
                    <span className="sr-only">Profile: </span>
                    <span className="min-w-0 font-semibold text-slate-600">{c.profile || '-'}</span>
                    {c.domain && <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[11px] font-semibold text-[#2F68FE] whitespace-nowrap">{c.domain}</span>}
                  </span>
                </span>
              </div>
            </div>

            <div className="relative h-0" aria-hidden="true">
              <span className={`${notch} -left-3`} />
              <span className={`${notch} -right-3`} />
              <span className="absolute left-5 right-5 top-0 border-t-2 border-dashed border-slate-200" />
            </div>

            <div className="bg-slate-50/60">
              <dl className="px-4 pt-3.5 pb-3.5 grid grid-cols-[1.25fr_1.1fr_1fr] divide-x divide-slate-200/70">
                <div className="min-w-0 pr-2.5">
                  <dt className="text-[11px] font-medium text-slate-400 leading-tight whitespace-nowrap">Interview ({CLIENT_TZ})</dt>
                  <dd className="mt-1">
                    {d.iv ? (
                      <>
                        <span className="block text-xs font-bold text-[#1E293B] tabular-nums">{d.iv.date}</span>
                        <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1">
                          <span className="text-[11px] font-semibold text-slate-600 tabular-nums">{d.iv.time.replace(` (${CLIENT_TZ})`, '')}</span>
                          {d.countdown && (
                            <span
                              className={`px-1.5 py-px rounded-full text-[10px] font-bold whitespace-nowrap ${
                                soon ? 'bg-[#2F68FE] text-white' : 'bg-blue-50 text-[#2F68FE] border border-blue-100'
                              }`}
                            >
                              {d.countdown.label}
                            </span>
                          )}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs font-bold">
                        <Dash />
                      </span>
                    )}
                  </dd>
                </div>
                <div className="min-w-0 px-2.5">
                  <dt className="text-[11px] font-medium text-slate-400 leading-tight whitespace-nowrap">Completed On</dt>
                  <dd className="mt-1 text-xs font-bold text-[#1E293B] tabular-nums">{c.completedOn ? formatShortDate(c.completedOn) : <Dash />}</dd>
                </div>
                <div className="min-w-0 pl-2.5">
                  <dt className="text-[11px] font-medium text-slate-400 leading-tight whitespace-nowrap">Assessments</dt>
                  <dd className="mt-1 text-xs font-bold text-[#1E293B] flex flex-wrap items-center gap-x-1.5 gap-y-0.5">{assessmentsValue(c, d, 'w-3 h-1.5 rounded-full')}</dd>
                </div>
              </dl>

              {d.accountManagerNote && (
                <p className="mx-4 mb-3.5 pl-3 pr-1.5 py-1.5 rounded-xl bg-[#FEF8E7] border border-amber-200/50 text-[11px] text-amber-700 leading-snug flex items-center gap-2">
                  <Headset className="w-4 h-4 shrink-0 text-[#D97706]" aria-hidden="true" />
                  <span className="flex-1">{`${c.replacement ? 'Replacement profile. ' : ''}Your account manager will schedule this interview.`}</span>
                  <button
                    type="button"
                    onClick={stop(onContactManager)}
                    className={`shrink-0 h-8 px-3 rounded-xl bg-white border border-amber-200/50 text-[11px] font-bold text-[#2F68FE] active:bg-blue-50 cursor-pointer ${FOCUS}`}
                  >
                    Contact
                  </button>
                </p>
              )}
            </div>
          </div>

          {d.showFooter && (
            <div className="px-4 py-2.5 border-t border-slate-100 flex items-center gap-2">
              {d.resumeReady && (
                <button
                  type="button"
                  onClick={stop(() => openResume(c))}
                  aria-label={`View resume of ${c.name}`}
                  className={`shrink-0 h-9 -ml-1.5 px-1.5 rounded-lg flex items-center gap-1.5 text-[11px] font-bold text-[#2F68FE] active:bg-blue-50/50 transition-colors cursor-pointer ${FOCUS}`}
                >
                  <Eye className="w-4 h-4" />
                  View Resume
                </button>
              )}
              <div className="flex-1 min-w-0 flex items-center justify-end gap-2">
                {d.actions.map((a) => (
                  <button key={a.key} type="button" onClick={stop(a.onClick)} aria-label={a.ariaLabel ?? a.label} className={`min-w-0 ${btn} ${actStyle[a.tone]}`}>
                    <a.icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{a.label}</span>
                  </button>
                ))}
                {d.hasMenu && (
                  <button
                    type="button"
                    onClick={stop(() => openSheet('more', c.id))}
                    aria-label={`More actions for ${c.name}`}
                    title={`More actions for ${c.name}`}
                    className={`w-9 h-9 shrink-0 rounded-full border border-slate-200 bg-white text-slate-600 flex items-center justify-center active:bg-slate-100 transition-colors cursor-pointer ${FOCUS}`}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </article>
      </li>
    );
  };

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

  /* ---------- Toolbar: one compact row — status chips scroll on the left, Select + Filter on the right; applied filters below ---------- */
  const toolbar = (
    <div className="px-4 pt-3.5">
      <section className="bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs overflow-hidden">
        <div className="py-2 pr-2 flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <div className="pl-2 pr-6 flex gap-1.5 overflow-x-auto no-scrollbar snap-x scroll-px-2" role="group" aria-label="Candidate status">
              {CANDIDATE_STATUSES.map((s) => {
                const Icon = STATUS_ICON[s];
                const active = chip === s;
                return (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={active}
                    aria-label={`${s} (${counts[s]})`}
                    onClick={() => pickStatus(s)}
                    className={`shrink-0 snap-start h-9 pl-1.5 pr-1.5 rounded-xl border flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${FOCUS} ${
                      active ? 'border-[#2F68FE] bg-blue-50' : 'border-slate-200 bg-white active:bg-slate-50'
                    }`}
                  >
                    <span aria-hidden="true" className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${active ? 'bg-[#2F68FE] text-white' : TONE[statusTone(s)]}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <span className={`text-[11px] font-semibold ${active ? 'text-[#2F68FE]' : 'text-slate-600'}`}>{s}</span>
                    <span
                      className={`min-w-5 h-5 px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center tabular-nums ${
                        active ? 'bg-[#2F68FE] text-white' : counts[s] ? 'bg-slate-100 text-[#1E293B]' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {counts[s]}
                    </span>
                    <ChevronRight aria-hidden="true" className={`w-3.5 h-3.5 -ml-0.5 shrink-0 ${active ? 'text-[#2F68FE]' : 'text-slate-400'}`} />
                  </button>
                );
              })}
            </div>
            <span aria-hidden="true" className="pointer-events-none absolute right-0 inset-y-0 w-8 bg-linear-to-l from-white to-transparent" />
          </div>
          <span aria-hidden="true" className="w-px h-7 bg-slate-200 shrink-0" />
          {anySelectable && (
            <button
              type="button"
              onClick={toggleSelect}
              disabled={loading}
              aria-label={selectMode ? 'Cancel selection' : 'Select candidates for assessment'}
              className={`h-10 px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors disabled:opacity-60 cursor-pointer ${FOCUS} ${
                selectMode ? 'border-slate-200 bg-slate-100 text-slate-600 active:bg-slate-200' : 'border-[#2F68FE] bg-white text-[#2F68FE] shadow-2xs active:bg-blue-50'
              }`}
            >
              {selectMode ? <X className="w-4 h-4" /> : <ClipboardCheck className="w-4 h-4" />}
              {selectMode ? 'Cancel' : 'Select'}
            </button>
          )}
          <FilterIconButton compact count={filterCount} onClick={() => openSheet('filter')} />
        </div>

        {filterCount > 0 && (
          <div className="px-3 py-2.5 border-t border-slate-100 flex items-center gap-2">
            <div className="flex-1 min-w-0 flex gap-1.5 overflow-x-auto no-scrollbar" aria-label="Applied filters">
              {appliedFilters.map(([key, label]) => (
                <span key={key} className="shrink-0 h-8 pl-2.5 pr-1 rounded-full bg-slate-50 border border-slate-200 text-[11px] font-semibold text-[#1E293B] flex items-center gap-1.5">
                  <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-[#2F68FE]" />
                  {label}: {filters[key].trim()}
                  <button
                    type="button"
                    onClick={() => applyFilters({ ...filters, [key]: '' })}
                    aria-label={`Remove ${label} filter`}
                    className="w-5.5 h-5.5 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 active:bg-slate-100 cursor-pointer"
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
      </section>
    </div>
  );

  /* ---------- View Resume ---------- */
  const resumeCandidate = resumeId ? byId(resumeId) : null;
  if (resumeCandidate) {
    const toDashboard = resumeCandidate.id === entry?.id && onBack;
    return (
      <CandidateResumeView
        candidate={resumeCandidate}
        canDownload={canDownload}
        backLabel={toDashboard ? 'Dashboard' : undefined}
        onBack={() => (toDashboard ? onBack() : setResumeId(null))}
      />
    );
  }

  const assignList = assignIds.map(byId).filter((c): c is ShortlistedCandidate => Boolean(c));
  const selectedReady = selected.map(byId).filter((c): c is ShortlistedCandidate => Boolean(c) && canBulkAssign(c as ShortlistedCandidate));
  const allPicked = pickable.length > 0 && pickable.every((c) => selected.includes(c.id));

  return (
    <div className="relative flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      <ScreenHeader title="Shortlisted Candidates" onBack={onBack} />
      {notice}
      <div ref={listRef} className="flex-1 overflow-y-auto no-scrollbar pb-6">
        {toolbar}

        <div className="px-4 mt-4">
          {loading ? (
            <CandidateListSkeleton />
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
                    className="mt-4 h-10 px-4 rounded-xl border border-[#2F68FE] bg-white text-[#2F68FE] text-xs font-bold active:bg-blue-50 cursor-pointer"
                  >
                    Clear All
                  </button>
                )
              }
            />
          ) : (
            <>
              {chip !== 'All' && (
                <div className="mb-2.5 flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-[#1E293B]">
                    {chip} <span className="text-slate-400 font-semibold tabular-nums">({results.length})</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setChip('All');
                      reload();
                    }}
                    className="text-[11px] font-bold text-[#2F68FE] cursor-pointer"
                  >
                    Show all
                  </button>
                </div>
              )}
              <ul className="space-y-3">{visible.map(card)}</ul>

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
                  className="mt-3 w-full h-11 rounded-xl border border-slate-200 bg-white shadow-2xs text-xs font-bold text-[#2F68FE] flex items-center justify-center gap-2 active:bg-slate-50 disabled:cursor-wait transition-colors cursor-pointer"
                >
                  {moreLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {moreLoading ? 'Loading…' : `Load More (${results.length - visible.length})`}
                </button>
              )}
              {visible.length >= results.length && (
                <p className="mt-4 text-center text-[11px] text-slate-400 tabular-nums">
                  Showing {results.length} Of {results.length} Records
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {selectMode && (
        <div className="shrink-0 z-20 p-4 bg-white/95 backdrop-blur-md border-t border-[#EBF0F7] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] flex items-center gap-3">
          <span className="flex-1 min-w-0">
            <span className="block text-xs font-bold text-[#1E293B] tabular-nums">{selectedReady.length} selected</span>
            <button
              type="button"
              onClick={() => setSelected(allPicked ? [] : pickable.map((c) => c.id))}
              disabled={pickable.length === 0}
              className={`mt-0.5 text-[11px] font-semibold text-[#2F68FE] rounded disabled:text-slate-400 cursor-pointer disabled:cursor-not-allowed ${FOCUS}`}
            >
              {allPicked ? 'Clear selection' : 'Select all'}
            </button>
          </span>
          <button
            type="button"
            disabled={selectedReady.length === 0}
            onClick={() => openAssign(selectedReady.map((c) => c.id))}
            className={`h-12 px-5 rounded-xl bg-[#2F68FE] text-white text-xs font-bold shadow-xs active:bg-[#1D4ED8] transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer ${FOCUS}`}
          >
            Request Assessment{selectedReady.length > 0 ? ` (${selectedReady.length})` : ''}
          </button>
        </div>
      )}

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
