import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  CalendarClock,
  CalendarPlus,
  Check,
  ChevronRight,
  ClipboardCheck,
  Eye,
  Headset,
  Loader2,
  MessageSquareText,
  MoreHorizontal,
  SearchX,
  UsersRound,
  Video,
  X,
} from 'lucide-react';
import { FilterIconButton } from '../../common/TeamFilterSheet';
import { useClientPermission } from '../context/ClientPermissionContext';
import { Card, ChipRow, EmptyCard, SearchField } from '../staff/tabs/StaffTabParts';
import { StaffAvatar } from '../staff/ClientStaffParts';
import { useTimesheetNotice } from '../timesheets/TimesheetParts';
import {
  ASSESSMENT_CATALOG,
  ASSESSMENT_MAX,
  AssignedAssessment,
  CANDIDATE_PAGE_SIZE,
  CANDIDATE_STATUS_CHIPS,
  CANDIDATE_STATUSES,
  CandidateFeedback,
  CandidateFilters,
  CandidateStatusChip,
  EMPTY_CANDIDATE_FILTERS,
  ScheduledInterview,
  ShortlistedCandidate,
  activeAssignments,
  assessmentActionOf,
  atAssessmentMax,
  canBulkAssign,
  canManageInterview,
  canRequestInterview,
  candidateFilterCount,
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

const hasResumeOf = (c: ShortlistedCandidate) => (c.source === 'hub' ? Boolean(c.resume) : Boolean(c.cvFile));

/**
 * Hire New Staff › Shortlisted Candidates (desktop `interviews&task=shortlistedcandidates`): status cards, search, candidate
 * list with assessments, View Resume, Interview Feedback, Request / Reschedule / Cancel Interview, Join Interview and
 * bulk "Request Assessment".
 */
export const ClientInterviewsView: React.FC<Props> = ({ candidates, onUpdate, onContactManager }) => {
  // view = resume / feedback / progress; add = feedback, request interview, assign assessment; edit = reschedule; delete = cancel interview; download = files
  const { view: canView, add: canAdd, edit: canEdit, delete: canDelete, download: canDownload } = useClientPermission('interviews');

  const now = useNow();
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [chip, setChip] = useState<CandidateStatusChip>('All');
  const [filters, setFilters] = useState<CandidateFilters>(EMPTY_CANDIDATE_FILTERS);
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
  const domains = useMemo(() => [...new Set(candidates.map((c) => c.domain))].sort(), [candidates]);

  // Desktop status cards count the searched / filtered list; tapping one filters by that status
  const base = candidates.filter((c) => matchesCandidate(c, query, filters));
  const counts = Object.fromEntries([
    ['All', base.length],
    ...CANDIDATE_STATUSES.map((s) => [s, base.filter((c) => c.status === s).length]),
  ]) as Record<CandidateStatusChip, number>;
  const results = chip === 'All' ? base : base.filter((c) => c.status === chip);
  const visible = results.slice(0, pages * CANDIDATE_PAGE_SIZE);

  const filterCount = candidateFilterCount(filters);
  const term = query.trim();
  const isFiltered = filterCount > 0 || term.length > 0 || chip !== 'All';

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
    setQuery('');
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
    const tint = candidates.findIndex((x) => x.id === c.id);
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
            className={`p-3.5 ${tapOpens ? 'active:bg-slate-50 cursor-pointer' : ''} transition-colors`}
          >
            <div className="flex items-start gap-3">
              {selectMode && selectable && (
                <span
                  className={`mt-2.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                    atMax ? 'bg-slate-100 border-slate-200' : checked ? 'bg-[#2F68FE] border-[#2F68FE] text-white' : 'bg-white border-slate-300'
                  }`}
                  aria-hidden="true"
                >
                  {checked && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                </span>
              )}
              <StaffAvatar name={c.name} tint={tint} />
              <span className="flex-1 min-w-0">
                <span className="block text-[13px] font-bold text-[#1E293B] truncate">{c.name}</span>
                <span className="block text-[11px] text-slate-500 truncate">
                  Resume ID <span className="font-semibold text-slate-600 tabular-nums">{c.resumeId}</span>
                </span>
              </span>
              <CandidateStatusPill status={c.status} />
            </div>

            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <p className="text-[13px] font-bold text-[#1E293B] leading-snug">{c.profile}</p>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10.5px] font-semibold text-slate-500 whitespace-nowrap">{c.domain}</span>
            </div>

            {/* Interview + completed date in one tinted strip */}
            <div
              className={`mt-3 rounded-xl border px-3 py-2.5 flex items-center gap-3 ${
                countdown?.soon ? 'bg-[#EFF6FF] border-[#BFDBFE]' : 'bg-slate-50 border-slate-100'
              }`}
            >
              <span
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${iv ? 'bg-white text-[#2F68FE] shadow-2xs' : 'bg-slate-100 text-slate-400'}`}
                aria-hidden="true"
              >
                <CalendarClock className="w-[18px] h-[18px]" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[10.5px] text-slate-400">Interview{iv ? '' : ' not scheduled yet'}</span>
                {iv && (
                  <span className="block text-[12px] font-bold text-[#1E293B] tabular-nums truncate">
                    {iv.date} · {iv.time}
                  </span>
                )}
              </span>
              {countdown && (
                <span
                  className={`shrink-0 px-2 py-0.5 rounded-md text-[10.5px] font-bold whitespace-nowrap ${
                    countdown.soon ? 'bg-[#2F68FE] text-white' : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  {countdown.label}
                </span>
              )}
              {c.completedOn && (
                <span className="shrink-0 text-right">
                  <span className="block text-[10.5px] text-slate-400">Completed</span>
                  <span className="block text-[11.5px] font-bold text-slate-700 tabular-nums">{formatShortDate(c.completedOn)}</span>
                </span>
              )}
            </div>

            {assessAction !== 'none' && (
              <div className="mt-3 flex items-center gap-2.5 min-h-8">
                <ClipboardCheck className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                <span className="flex-1 min-w-0 flex items-center gap-2">
                  <span className="text-[11.5px] font-semibold text-slate-600">Assessments</span>
                  <span className="flex items-center gap-1" aria-label={`${activeAssessments} of ${ASSESSMENT_MAX} assessment slots used`}>
                    {Array.from({ length: ASSESSMENT_MAX }, (_, i) => (
                      <span key={i} className={`w-2 h-2 rounded-full ${i < activeAssessments ? 'bg-[#2F68FE]' : 'bg-slate-200'}`} />
                    ))}
                  </span>
                  <span className="text-[11px] text-slate-400 tabular-nums">
                    {activeAssessments}/{ASSESSMENT_MAX}
                  </span>
                </span>
                {assessAction === 'assign' && canAdd && !selectMode && (
                  <CardAction label="Assign" tone="soft" onClick={() => openAssign([c.id])} ariaLabel={`Assign assessments to ${c.name}`} />
                )}
                {assessAction === 'view' && canView && !selectMode && (
                  <CardAction label="View" tone="soft" onClick={() => openSheet('progress', c.id)} ariaLabel={`View assessment progress for ${c.name}`} />
                )}
              </div>
            )}
          </div>

          {accountManagerNote && (
            <p className="mx-3.5 mb-3 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 leading-snug flex items-center gap-2">
              <Headset className="w-3.5 h-3.5 shrink-0 text-slate-400" />
              <span className="flex-1">{`${c.replacement ? 'Replacement profile. ' : ''}Your account manager will schedule this interview.`}</span>
              <button type="button" onClick={onContactManager} className="shrink-0 text-[11px] font-bold text-[#2F68FE] cursor-pointer">
                Contact
              </button>
            </p>
          )}

          {!selectMode && (primary.length > 0 || resumeReady || hasMenu) && (
            <div className="px-3.5 py-3 border-t border-slate-100 flex items-center gap-2">
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
      {notice}
      <div ref={listRef} className="flex-1 overflow-y-auto no-scrollbar pb-6">
        <div className="px-4 pt-4">
          <p className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
            Hire New Staff <ChevronRight className="w-3 h-3" /> <span className="text-slate-600">Shortlisted Candidates</span>
          </p>
          <div className="mt-0.5 flex items-center justify-between gap-3">
            <h1 className="text-2xl font-extrabold leading-tight">Shortlisted Candidates</h1>
            {anySelectable && (
              <button
                type="button"
                onClick={() => (selectMode ? exitSelect() : setSelectMode(true))}
                disabled={loading}
                className={`h-9 px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 disabled:opacity-60 shrink-0 cursor-pointer ${
                  selectMode ? 'border-slate-200 bg-white text-slate-600 active:bg-slate-50' : 'border-[#BFDBFE] bg-[#EFF6FF] text-[#2F68FE] active:bg-blue-100'
                }`}
              >
                {selectMode ? <X className="w-4 h-4" /> : <ClipboardCheck className="w-4 h-4" />}
                {selectMode ? 'Cancel' : 'Select'}
              </button>
            )}
          </div>

          <div className="mt-3 flex items-center gap-2.5">
            <div className="flex-1 min-w-0">
              <SearchField
                value={query}
                onChange={(v) => {
                  setQuery(v);
                  setPages(1);
                }}
                placeholder="Search by name, resume ID or profile"
              />
            </div>
            <FilterIconButton count={filterCount} onClick={() => openSheet('filter')} />
          </div>

          {filterCount > 0 && (
            <div className="mt-2.5 flex items-center gap-2">
              <div className="flex-1 min-w-0 flex gap-1.5 overflow-x-auto no-scrollbar">
                {filters.profiles.map((p) => (
                  <span key={p} className="shrink-0 h-7 pl-2.5 pr-1 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[11px] font-semibold text-[#1D4ED8] flex items-center gap-1">
                    {p}
                    <button
                      type="button"
                      onClick={() => applyFilters({ ...filters, profiles: filters.profiles.filter((x) => x !== p) })}
                      aria-label={`Remove ${p}`}
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[#2F68FE] active:bg-blue-100 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {filters.domains.map((d) => (
                  <span key={d} className="shrink-0 h-7 pl-2.5 pr-1 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[11px] font-semibold text-[#1D4ED8] flex items-center gap-1">
                    {d}
                    <button
                      type="button"
                      onClick={() => applyFilters({ ...filters, domains: filters.domains.filter((x) => x !== d) })}
                      aria-label={`Remove ${d}`}
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

          <div className="mt-3">
            <ChipRow
              options={CANDIDATE_STATUS_CHIPS}
              value={chip}
              onChange={(c) => {
                setChip(c);
                reload();
              }}
              counts={counts}
              label="Candidate status"
            />
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
              text="Try another name, resume ID, profile or status."
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
        domains={domains}
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
