import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  CalendarClock,
  CalendarPlus,
  Check,
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
import { FilterIconButton } from '../../common/TeamFilterSheet';
import { ScreenHeader, Card, EmptyCard } from '../staff/tabs/StaffTabParts';
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
  CandidateListSkeleton,
  CandidateStatusPill,
  CardAction,
  CardActionsSheet,
  CardIconButton,
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

const TONE_ICON: Record<StatusTone, string> = {
  blue: 'bg-[#EFF6FF] text-[#2F68FE]',
  amber: 'bg-[#FFFBEB] text-[#D97706]',
  green: 'bg-[#F0FDF4] text-[#16A34A]',
  red: 'bg-[#FEF2F2] text-[#DC2626]',
};

/** Desktop table column as a label / value row */
const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex items-center justify-between gap-3 py-2.5 min-h-10">
    <dt className="text-[11.5px] font-medium text-slate-500 shrink-0">{label}</dt>
    <dd className="min-w-0 text-[12.5px] font-semibold text-[#1E293B] text-right flex items-center justify-end gap-2 flex-wrap">{children}</dd>
  </div>
);

const hasResumeOf = (c: ShortlistedCandidate) => (c.source === 'hub' ? Boolean(c.resume) : Boolean(c.cvFile));

/**
 * Hire New Staff › Shortlisted Candidates (desktop `interviews&task=shortlistedcandidates`): status cards, search, candidate
 * list with assessments, View Resume, Interview Feedback, Request / Reschedule / Cancel Interview, Join Interview and
 * bulk "Request Assessment".
 */
export const ClientInterviewsView: React.FC<Props> = ({ candidates, onUpdate, onContactManager, initialProfile, onBack }) => {
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

  const card = (c: ShortlistedCandidate) => {
    const iv = interviewLabels(c);
    const countdown = c.status === 'Interview Scheduled' && c.interview ? interviewCountdown(c.interview, now) : null;
    const activeAssessments = activeAssignments(c).length;
    const win = c.interview ? interviewWindow(c.interview, now) : null;
    const assessAction = assessmentActionOf(c);
    const selectable = selectMode && isBulkSelectable(c);
    const atMax = atAssessmentMax(c);
    const checked = selected.includes(c.id);
    const resumeReady = canView && hasResumeOf(c);
    const tapOpens = selectMode ? selectable && !atMax : resumeReady;

    const tap = () => {
      if (selectMode) {
        if (selectable && !atMax) setSelected((s) => (s.includes(c.id) ? s.filter((x) => x !== c.id) : [...s, c.id]));
        return;
      }
      openResume(c);
    };

    // Main actions share the footer row; Reschedule / Cancel live behind the "More" button
    const primary: React.ReactNode[] = [];
    if (canView && c.source === 'hub' && c.status === 'Interview Scheduled' && c.interview?.zoomUrl && win?.join) {
      primary.push(<CardAction key="join" size="lg" label="Join" ariaLabel={`Join interview with ${c.name}`} icon={Video} tone="success" onClick={() => showNotice('Opening the Zoom meeting…')} />);
    }
    if (canAdd && canRequestInterview(c)) {
      primary.push(
        <CardAction
          key="request"
          size="lg"
          label="Request Interview"
          icon={CalendarPlus}
          tone="primary"
          onClick={() => {
            setScheduleMode('request');
            openSheet('schedule', c.id);
          }}
        />,
      );
    }
    if (feedbackAvailable(c) && (c.feedback ? canView : canAdd)) {
      primary.push(
        <CardAction key="feedback" size="lg" tone="soft" label={c.feedback ? 'View Feedback' : 'Feedback'} icon={MessageSquareText} onClick={() => openSheet('feedback', c.id)} />,
      );
    }
    const hasMenu = menuFor(c).length > 0;

    const accountManagerNote = c.source === 'hub' && c.status === 'Shortlisted' && !canRequestInterview(c);

    return (
      <li key={c.id}>
        <Card className={`overflow-hidden ${selectMode && checked ? 'ring-2 ring-[#2F68FE]' : ''}`}>
          <div
            role={tapOpens ? (selectMode ? 'checkbox' : 'button') : undefined}
            aria-checked={selectMode && tapOpens ? checked : undefined}
            tabIndex={tapOpens ? 0 : undefined}
            onClick={tap}
            onKeyDown={(e) => {
              if (tapOpens && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                tap();
              }
            }}
            aria-label={tapOpens ? (selectMode ? `Select ${c.name} for assessment` : `${c.name}, ${c.status}. View resume`) : undefined}
            className={`p-4 ${tapOpens ? 'active:bg-slate-50 cursor-pointer' : ''} transition-colors`}
          >
            <div className="flex items-center gap-3">
              {selectMode && selectable && (
                <span
                  className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                    atMax ? 'bg-slate-100 border-slate-200' : checked ? 'bg-[#2F68FE] border-[#2F68FE] text-white' : 'bg-white border-slate-300'
                  }`}
                  aria-hidden="true"
                >
                  {checked && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                </span>
              )}
              <StaffAvatar name={c.name} tint={candidates.findIndex((x) => x.id === c.id)} />
              <span className="flex-1 min-w-0">
                <span className="block text-[14.5px] font-bold text-[#1E293B] truncate">{c.name}</span>
                <span className="block mt-0.5 text-[11.5px] text-slate-500 truncate">
                  Resume ID <span className="font-semibold text-slate-700 tabular-nums">{c.resumeId || '-'}</span>
                </span>
              </span>
              <span className="shrink-0 self-start">
                <CandidateStatusPill status={c.status} />
              </span>
            </div>

            <div className="mt-3.5 p-3 rounded-xl bg-[#F8FAFF] border border-[#E0EAFF]">
              <p className="text-[11px] font-semibold text-[#2F68FE]/70">Profile</p>
              <div className="mt-1 flex items-center gap-2 flex-wrap">
                <span className="text-[13.5px] font-bold text-[#1E293B] leading-snug">{c.profile || '-'}</span>
                {c.domain && (
                  <span className="px-2 py-0.5 rounded-md bg-white border border-[#DBEAFE] text-[10.5px] font-semibold text-[#2F68FE] whitespace-nowrap">{c.domain}</span>
                )}
              </div>
            </div>

            <dl className="mt-2.5 px-3 rounded-xl border border-slate-100 bg-[#FAFBFD] divide-y divide-slate-100">
              <Row label={`Interview (${CLIENT_TZ})`}>
                {iv ? (
                  <>
                    <span className="tabular-nums">
                      {iv.date} · {iv.time.replace(` (${CLIENT_TZ})`, '')}
                    </span>
                    {countdown && (
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold whitespace-nowrap ${
                          countdown.soon ? 'bg-[#2F68FE] text-white' : 'bg-[#EFF6FF] text-[#2F68FE]'
                        }`}
                      >
                        {countdown.label}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-slate-400 font-medium">-</span>
                )}
              </Row>
              <Row label="Completed On">
                {c.completedOn ? <span className="tabular-nums">{formatShortDate(c.completedOn)}</span> : <span className="text-slate-400 font-medium">-</span>}
              </Row>
              <Row label="Assessments">
                {assessAction === 'none' ? (
                  <span className="text-slate-400 font-medium">-</span>
                ) : (
                  <>
                    <span className="flex items-center gap-1" aria-label={`${activeAssessments} of ${ASSESSMENT_MAX} assessment slots used`}>
                      {Array.from({ length: ASSESSMENT_MAX }, (_, i) => (
                        <span key={i} className={`w-2 h-2 rounded-full ${i < activeAssessments ? 'bg-[#2F68FE]' : 'bg-slate-200'}`} />
                      ))}
                    </span>
                    <span className="text-slate-600 tabular-nums">
                      {activeAssessments}/{ASSESSMENT_MAX}
                    </span>
                    {assessAction === 'assign' && canAdd && !selectMode && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openAssign([c.id]);
                        }}
                        aria-label={`Assign assessments to ${c.name}`}
                        className="ml-1 text-[12px] font-bold text-[#2F68FE] cursor-pointer"
                      >
                        Assign
                      </button>
                    )}
                    {assessAction === 'view' && canView && !selectMode && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openSheet('progress', c.id);
                        }}
                        aria-label={`View assessment progress for ${c.name}`}
                        className="ml-1 text-[12px] font-bold text-[#2F68FE] cursor-pointer"
                      >
                        View
                      </button>
                    )}
                  </>
                )}
              </Row>
            </dl>
          </div>

          {accountManagerNote && (
            <p className="mx-4 mb-3 px-3 py-2.5 rounded-xl bg-amber-50/70 border border-amber-100 text-[11px] text-amber-800 leading-snug flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-full bg-white border border-amber-100 flex items-center justify-center shrink-0" aria-hidden="true">
                <Headset className="w-3.5 h-3.5 text-amber-600" />
              </span>
              <span className="flex-1">{`${c.replacement ? 'Replacement profile. ' : ''}Your account manager will schedule this interview.`}</span>
              <button type="button" onClick={onContactManager} className="shrink-0 text-[11px] font-bold text-[#2F68FE] cursor-pointer">
                Contact
              </button>
            </p>
          )}

          {!selectMode && (primary.length > 0 || resumeReady || hasMenu) && (
            <div className="px-4 pb-4 flex items-center gap-2">
              {primary}
              {resumeReady &&
                (primary.length === 0 ? (
                  <CardAction size="lg" label="View Resume" icon={Eye} ariaLabel={`View resume of ${c.name}`} onClick={() => openResume(c)} />
                ) : (
                  <CardIconButton icon={Eye} label={`View resume of ${c.name}`} onClick={() => openResume(c)} />
                ))}
              {primary.length === 0 && !resumeReady && <span className="flex-1" />}
              {hasMenu && <CardIconButton icon={MoreHorizontal} label={`More actions for ${c.name}`} onClick={() => openSheet('more', c.id)} />}
            </div>
          )}
        </Card>
      </li>
    );
  };

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
      <ScreenHeader title="Shortlisted Candidates" onBack={onBack} />
      {notice}
      <div ref={listRef} className="flex-1 overflow-y-auto no-scrollbar pb-6">
        <div className="px-4 pt-3">
          <div className="flex items-center gap-2.5">
            <span className="flex-1 min-w-0 truncate text-xs font-semibold text-slate-500 tabular-nums">
              {loading ? '' : `${results.length} ${results.length === 1 ? 'candidate' : 'candidates'}`}
            </span>
            {anySelectable && (
              <button
                type="button"
                onClick={() => (selectMode ? exitSelect() : setSelectMode(true))}
                disabled={loading}
                aria-label={selectMode ? 'Cancel selection' : 'Select candidates for assessment'}
                className={`h-11 px-3.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors disabled:opacity-60 shrink-0 cursor-pointer ${
                  selectMode ? 'border-slate-200 bg-slate-100 text-slate-600 active:bg-slate-200' : 'border-slate-200 bg-white text-[#2F68FE] active:bg-slate-50'
                }`}
              >
                {selectMode ? <X className="w-4 h-4" /> : <ClipboardCheck className="w-4 h-4" />}
                {selectMode ? 'Cancel' : 'Select'}
              </button>
            )}
            <FilterIconButton count={filterCount} onClick={() => openSheet('filter')} />
          </div>

          {filterCount > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 min-w-0 flex gap-1.5 overflow-x-auto no-scrollbar">
                {(
                  [
                    ['resumeId', 'Resume ID'],
                    ['profile', 'Profile'],
                  ] as const
                )
                  .filter(([key]) => filters[key].trim())
                  .map(([key, label]) => (
                    <span
                      key={key}
                      className="shrink-0 h-7 pl-2.5 pr-1 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[11px] font-semibold text-[#1D4ED8] flex items-center gap-1"
                    >
                      {label}: {filters[key].trim()}
                      <button
                        type="button"
                        onClick={() => applyFilters({ ...filters, [key]: '' })}
                        aria-label={`Remove ${label} filter`}
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[#2F68FE] active:bg-blue-100 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
              </div>
              <button type="button" onClick={clearAll} className="shrink-0 text-[11px] font-bold text-[#2F68FE] cursor-pointer">
                Clear All
              </button>
            </div>
          )}

          <div className="mt-4 -mx-4 px-4 flex gap-2.5 overflow-x-auto no-scrollbar" role="group" aria-label="Candidate status">
            {CANDIDATE_STATUSES.map((s) => {
              const { icon: Icon, tone } = STATUS_CARD[s];
              const active = chip === s;
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setChip(active ? 'All' : s);
                    reload();
                  }}
                  className={`shrink-0 w-[128px] px-3 py-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                    active ? 'border-[#2F68FE] bg-[#EFF6FF] ring-1 ring-[#2F68FE]' : 'border-[#DCE3ED] bg-white active:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${TONE_ICON[tone]}`} aria-hidden="true">
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="text-[18px] font-bold text-[#1E293B] tabular-nums">{counts[s]}</span>
                  </span>
                  <span className={`block mt-2 text-[11px] leading-tight truncate ${active ? 'text-[#1D4ED8] font-semibold' : 'text-slate-500 font-medium'}`}>{s}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-4 mt-3">
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
                <p className="text-[12px] font-bold text-[#1E293B]">
                  {chip === 'All' ? 'All Candidates' : chip} <span className="text-slate-400 font-semibold tabular-nums">({results.length})</span>
                </p>
                {chip !== 'All' && (
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
                )}
              </div>
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
                  className="mt-3 w-full h-11 rounded-xl border border-slate-200 bg-white text-xs font-bold text-[#2F68FE] flex items-center justify-center gap-2 active:bg-slate-50 disabled:cursor-wait transition-colors cursor-pointer"
                >
                  {moreLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {moreLoading ? 'Loading…' : `Load More (${results.length - visible.length})`}
                </button>
              )}
              {visible.length >= results.length && (
                <p className="mt-4 text-center text-[11px] text-slate-400 tabular-nums">
                  Showing all {results.length} {results.length === 1 ? 'candidate' : 'candidates'}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {selectMode && (
        <div className="shrink-0 bg-white border-t border-[#EBF0F7] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] px-4 py-3 flex items-center gap-3">
          <span className="flex-1 min-w-0">
            <span className="block text-[12px] font-bold text-[#1E293B] tabular-nums">{selectedReady.length} selected</span>
            <button
              type="button"
              onClick={() => setSelected(allPicked ? [] : pickable.map((c) => c.id))}
              disabled={pickable.length === 0}
              className="text-[11px] font-bold text-[#2F68FE] disabled:text-slate-300 cursor-pointer disabled:cursor-not-allowed"
            >
              {allPicked ? 'Clear selection' : 'Select all'}
            </button>
          </span>
          <button
            type="button"
            disabled={selectedReady.length === 0}
            onClick={() => openAssign(selectedReady.map((c) => c.id))}
            className="h-12 px-5 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
