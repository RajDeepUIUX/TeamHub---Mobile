import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, ChevronRight, ClipboardCheck, Download, Eye, Hourglass, Loader2, Play, RotateCw } from 'lucide-react';
import { FilterIconButton } from '../../common/TeamFilterSheet';
import {
  ClientSurvey,
  FEEDBACK_PAGE_SIZE,
  SURVEY_STATUSES,
  SURVEY_TYPES,
  SURVEY_TYPE_LABEL,
  SurveyAnswers,
  SurveyStatus,
  daysLeft,
  expiryDate,
  formatSurveyDate,
  shortPeriod,
  surveyProgress,
  surveyStatus,
  todayIso,
} from '../data/clientFeedbackData';
import { StaffSkeleton } from '../staff/ClientStaffParts';
import { EmptyCard, SearchField } from '../staff/tabs/StaffTabParts';
import { EMPTY_FEEDBACK_FILTERS, FeedbackFilterSheet, FeedbackFilters, feedbackFilterCount } from './FeedbackFilterSheet';
import { SurveyFormView } from './SurveyFormView';
import { SurveyIntroView } from './SurveyIntroView';
import { SurveyStatusPill, SurveyTypeIcon, useSurveyToast } from './SurveyParts';
import { useClientPermission } from '../context/ClientPermissionContext';

type StatusChip = 'All' | SurveyStatus;
const STATUS_CHIPS: StatusChip[] = ['All', ...SURVEY_STATUSES];

type Screen = { mode: 'list' } | { mode: 'intro' | 'form' | 'view'; id: string };

interface ClientFeedbackViewProps {
  surveys: ClientSurvey[];
  /** Signed-in client contact (primary contact → sees every survey) */
  userName: string;
  companyName: string;
  onUpdate: (id: string, patch: Partial<ClientSurvey>) => void;
}

const LOAD_MS = 600;

const ListSkeleton: React.FC = () => (
  <div className="space-y-3" aria-busy="true" aria-label="Loading surveys">
    {[0, 1, 2].map((i) => (
      <div key={i} className="bg-white border border-[#EBF0F7] rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-3">
          <StaffSkeleton className="w-10 h-10 rounded-xl" />
          <div className="flex-1 space-y-1.5">
            <StaffSkeleton className="w-40 h-3.5" />
            <StaffSkeleton className="w-28 h-3" />
          </div>
        </div>
        <StaffSkeleton className="w-full h-10 rounded-xl" />
        <StaffSkeleton className="w-full h-10 rounded-xl" />
      </div>
    ))}
  </div>
);

/** Desktop "Feedback & Evaluation" (hbrreports): every survey assigned to the client, with Start / Resume / View / PDF */
export const ClientFeedbackView: React.FC<ClientFeedbackViewProps> = ({ surveys, userName, companyName, onUpdate }) => {
  const [screen, setScreen] = useState<Screen>({ mode: 'list' });
  // Back from a survey returns to the same place in the list
  const listRef = useRef<HTMLDivElement>(null);
  const listScroll = useRef(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [chip, setChip] = useState<StatusChip>('All');
  const [filters, setFilters] = useState<FeedbackFilters>(EMPTY_FEEDBACK_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [pages, setPages] = useState(1);
  const [moreLoading, setMoreLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [notice, showNotice] = useSurveyToast();
  // Role flags: edit = start / fill / submit, download = PDF, view = open answers
  const perm = useClientPermission('feedback-evaluation');

  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setLoading(false), LOAD_MS);
    return () => clearTimeout(t);
  }, [loading]);

  useLayoutEffect(() => {
    if (screen.mode === 'list' && listRef.current) listRef.current.scrollTop = listScroll.current;
  }, [screen.mode]);

  // Newest first (desktop orders by id DESC)
  const sorted = useMemo(() => [...surveys].sort((a, b) => b.assignedOn.localeCompare(a.assignedOn)), [surveys]);

  const options = useMemo(
    () => ({
      type: SURVEY_TYPES.filter((t) => surveys.some((s) => s.type === t)).map((t) => ({ value: t, label: SURVEY_TYPE_LABEL[t] })),
      staff: Array.from(new Set(surveys.map((s) => s.staffName).filter((n): n is string => Boolean(n))))
        .sort()
        .map((n) => ({ value: n, label: n })),
      period: Array.from(new Set(surveys.map((s) => s.period).filter((p): p is string => Boolean(p))))
        .sort()
        .reverse()
        .map((p) => ({ value: p, label: p })),
    }),
    [surveys],
  );

  const isMine = (s: ClientSurvey) => s.assignedTo === userName;
  const canFill = (s: ClientSurvey) => perm.edit && isMine(s) && s.type !== 'hbr' && (surveyStatus(s) === 'Not Started' || surveyStatus(s) === 'In Progress');

  // To do (Added by designer): my open surveys, most urgent first
  const todo = sorted.filter(canFill).sort((a, b) => daysLeft(a) - daysLeft(b));

  const term = query.trim().toLowerCase();
  const base = sorted.filter((s) => {
    if (term && !`${s.staffName ?? ''} ${SURVEY_TYPE_LABEL[s.type]}`.toLowerCase().includes(term)) return false;
    if (filters.type.length && !filters.type.includes(s.type)) return false;
    if (filters.staff.length && !(s.staffName && filters.staff.includes(s.staffName))) return false;
    if (filters.period.length && !(s.period && filters.period.includes(s.period))) return false;
    return true;
  });
  const inChip = (c: StatusChip, s: ClientSurvey) => c === 'All' || surveyStatus(s) === c;
  const results = base.filter((s) => inChip(chip, s));
  const visible = results.slice(0, pages * FEEDBACK_PAGE_SIZE);

  const filterCount = feedbackFilterCount(filters);
  const isFiltered = filterCount > 0 || term.length > 0 || chip !== 'All';

  const reload = () => {
    setPages(1);
    setLoading(true);
    listRef.current?.scrollTo({ top: 0 });
  };

  const clearAll = () => {
    setQuery('');
    setFilters(EMPTY_FEEDBACK_FILTERS);
    setChip('All');
    reload();
  };

  const download = (s: ClientSurvey) => {
    setDownloadingId(s.id);
    setTimeout(() => {
      setDownloadingId(null);
      showNotice(`${SURVEY_TYPE_LABEL[s.type]} report (PDF) downloaded.`);
    }, 700);
  };

  const open = (s: ClientSurvey) => {
    listScroll.current = listRef.current?.scrollTop ?? 0;
    if (canFill(s)) setScreen({ mode: s.started ? 'form' : 'intro', id: s.id });
    else setScreen({ mode: 'view', id: s.id });
  };

  /* ---------- Sub screens ---------- */
  const current = screen.mode !== 'list' ? surveys.find((s) => s.id === screen.id) : undefined;
  const backToList = () => setScreen({ mode: 'list' });

  if (current && screen.mode === 'intro') {
    return (
      <SurveyIntroView
        survey={current}
        onBack={backToList}
        onStart={() => {
          onUpdate(current.id, { started: true });
          setScreen({ mode: 'form', id: current.id });
        }}
      />
    );
  }
  if (current && (screen.mode === 'form' || screen.mode === 'view')) {
    const status = surveyStatus(current);
    const viewNote = !isMine(current)
      ? `View only — assigned to ${current.assignedTo}`
      : status === 'Expired'
        ? `This survey expired on ${formatSurveyDate(expiryDate(current))}`
        : !perm.edit && status !== 'Completed'
          ? "View only — your role can't fill surveys"
          : undefined;
    return (
      <SurveyFormView
        survey={current}
        mode={screen.mode === 'form' ? 'edit' : 'view'}
        viewNote={viewNote}
        onBack={backToList}
        onAnswer={(answers: SurveyAnswers) => onUpdate(current.id, { answers, started: true })}
        onSubmit={() => onUpdate(current.id, { completed: true, submittedOn: todayIso() })}
      />
    );
  }

  /* ---------- List ---------- */
  const actionButton = (s: ClientSurvey) => {
    const status = surveyStatus(s);
    const outline =
      'h-9 px-3 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] text-[#2F68FE] text-[11.5px] font-bold flex items-center gap-1.5 active:bg-blue-100 shrink-0 cursor-pointer';
    const pdf = perm.download && (
      <button
        type="button"
        onClick={() => download(s)}
        disabled={downloadingId === s.id}
        aria-label={`Download PDF of ${SURVEY_TYPE_LABEL[s.type]}`}
        title="Download PDF"
        className={
          s.type === 'hbr'
            ? outline
            : 'w-9 h-9 rounded-xl border border-slate-200 text-slate-500 flex items-center justify-center active:bg-slate-50 shrink-0 cursor-pointer disabled:cursor-wait'
        }
      >
        {downloadingId === s.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        {s.type === 'hbr' && 'Download PDF'}
      </button>
    );
    const noAccess = <span className="text-[11px] font-semibold text-slate-400 shrink-0">No access</span>;
    if (s.type === 'hbr') return pdf || noAccess;
    if (status === 'Completed')
      return perm.view || pdf ? (
        <>
          {perm.view && (
            <button type="button" onClick={() => open(s)} className={outline}>
              <Eye className="w-4 h-4" /> View
            </button>
          )}
          {pdf}
        </>
      ) : (
        noAccess
      );
    if (canFill(s))
      return (
        <button
          type="button"
          onClick={() => open(s)}
          className="h-9 px-3.5 rounded-xl bg-[#2F68FE] text-white text-[11.5px] font-bold flex items-center gap-1.5 active:bg-[#1D4ED8] shrink-0 cursor-pointer"
        >
          {status === 'In Progress' ? <RotateCw className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          {status === 'In Progress' ? 'Resume Survey' : 'Start Survey'}
        </button>
      );
    if (status === 'Expired' && Object.keys(s.answers).length === 0) return <span className="text-[11px] font-semibold text-slate-400 shrink-0">Closed</span>;
    if (!perm.view) return noAccess;
    return (
      <button type="button" onClick={() => open(s)} className={outline}>
        <Eye className="w-4 h-4" /> View
      </button>
    );
  };

  const metaOf = (s: ClientSurvey): [string, string, string?][] => {
    const status = surveyStatus(s);
    const period = s.period ? shortPeriod(s.period) : '—';
    if (s.type === 'hbr') return [['Period', period], ['Report Date', formatSurveyDate(s.assignedOn)], ['Format', 'PDF']];
    const left = daysLeft(s);
    const third: [string, string, string?] =
      status === 'Completed'
        ? ['Submitted On', s.submittedOn ? formatSurveyDate(s.submittedOn) : '—']
        : status === 'Expired'
          ? ['Expired On', formatSurveyDate(expiryDate(s))]
          : ['Expires In', `${left} ${left === 1 ? 'day' : 'days'}`, left <= 5 ? 'text-[#D97706]' : undefined];
    return [['Period', period], ['Assigned On', formatSurveyDate(s.assignedOn)], third];
  };

  return (
    <div className="relative flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      <div ref={listRef} className="flex-1 overflow-y-auto no-scrollbar pb-6">
        <div className="px-4 pt-4">
          <p className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
            Feedback & Evaluation <ChevronRight className="w-3 h-3" /> <span className="text-slate-600">Surveys</span>
          </p>
          <div className="mt-0.5 flex items-end justify-between gap-3 mb-1.5">
            <h1 className="text-xl font-extrabold leading-tight">Feedback & Evaluation</h1>
            {!loading && <span className="pb-1 text-xs font-semibold text-slate-500 tabular-nums shrink-0">{results.length} {results.length === 1 ? 'survey' : 'surveys'}</span>}
          </div>

          {/* To do (Added by designer) */}
          {!loading && todo.length > 0 && (
            <div className="mt-3 p-3.5 rounded-2xl bg-[#2F68FE] text-white shadow-xs">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                  <ClipboardCheck className="w-5 h-5" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-bold">
                    {todo.length} {todo.length === 1 ? 'survey needs' : 'surveys need'} your feedback
                  </p>
                  <p className="text-[11px] text-blue-100 truncate">
                    Next: {todo[0].staffName ?? companyName} · {SURVEY_TYPE_LABEL[todo[0].type]}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-50">
                  <Hourglass className="w-3.5 h-3.5" />
                  Expires in {daysLeft(todo[0])} {daysLeft(todo[0]) === 1 ? 'day' : 'days'}
                </span>
                <button
                  type="button"
                  onClick={() => open(todo[0])}
                  className="h-9 px-3.5 rounded-xl bg-white text-[#2F68FE] text-[11.5px] font-bold flex items-center gap-1.5 active:bg-blue-50 cursor-pointer"
                >
                  {todo[0].started ? 'Resume' : 'Start now'} <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          <div className="mt-3 flex items-center gap-2.5">
            <div className="flex-1 min-w-0">
              <SearchField
                value={query}
                onChange={(v) => {
                  setQuery(v);
                  setPages(1);
                }}
                placeholder="Search by staff or survey"
              />
            </div>
            <FilterIconButton count={filterCount} onClick={() => setFilterOpen(true)} />
          </div>
        </div>

        <div className="mt-3 flex gap-1.5 overflow-x-auto no-scrollbar px-4 pb-1" role="group" aria-label="Status">
          {STATUS_CHIPS.map((c) => {
            const on = c === chip;
            return (
              <button
                key={c}
                type="button"
                aria-pressed={on}
                onClick={() => {
                  if (on) return;
                  setChip(c);
                  reload();
                }}
                className={`shrink-0 h-8 pl-3 pr-1.5 rounded-full text-[11.5px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  on ? 'bg-[#2F68FE] text-white' : 'bg-slate-100 text-slate-600 active:bg-slate-200'
                }`}
              >
                {c}
                <span
                  className={`min-w-5 h-5 px-1 rounded-full text-[10px] font-bold flex items-center justify-center tabular-nums bg-white ${
                    on ? 'text-[#2F68FE]' : 'text-slate-500'
                  }`}
                >
                  {base.filter((s) => inChip(c, s)).length}
                </span>
              </button>
            );
          })}
        </div>

        {isFiltered && !loading && (
          <div className="px-4 mt-2 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              {chip === 'All' ? 'All statuses' : chip}
              {filterCount > 0 && ` · ${filterCount} ${filterCount === 1 ? 'filter' : 'filters'}`}
            </span>
            <button type="button" onClick={clearAll} className="text-[11px] font-bold text-[#2F68FE] cursor-pointer">
              Clear All
            </button>
          </div>
        )}

        <div className="px-4 mt-3">
          {loading ? (
            <ListSkeleton />
          ) : results.length === 0 ? (
            <EmptyCard
              icon={ClipboardCheck}
              title={surveys.length === 0 ? 'No surveys yet.' : 'No surveys match your search.'}
              text={surveys.length === 0 ? 'Surveys assigned to you will show up here.' : 'Try a different name, status or filter.'}
              action={
                surveys.length > 0 && isFiltered ? (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="mt-4 h-10 px-5 rounded-xl bg-[#EEF2FF] text-[#2F68FE] text-xs font-bold active:bg-[#E0E7FF] cursor-pointer"
                  >
                    Clear All
                  </button>
                ) : undefined
              }
            />
          ) : (
            <ul className="space-y-3">
              {visible.map((s) => {
                const status = surveyStatus(s);
                const progress = surveyProgress(s);
                const clickable = s.type !== 'hbr' && !(status === 'Expired' && Object.keys(s.answers).length === 0) && (canFill(s) || perm.view);
                return (
                  <li key={s.id} className="bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs overflow-hidden">
                    <button
                      type="button"
                      disabled={!clickable}
                      onClick={() => open(s)}
                      className="w-full p-3.5 pb-3 flex items-center gap-3 text-left active:bg-slate-50 disabled:active:bg-transparent transition-colors cursor-pointer disabled:cursor-default"
                    >
                      <SurveyTypeIcon type={s.type} />
                      <span className="flex-1 min-w-0">
                        <span className="block text-[13.5px] font-bold text-[#1E293B] leading-snug">{SURVEY_TYPE_LABEL[s.type]}</span>
                        <span className="block text-[11.5px] text-slate-500 truncate">
                          {s.staffName ? (
                            <>
                              <span className="font-semibold text-[#2F68FE]">{s.staffName}</span>
                              {s.staffLevel !== null && ` · Level ${s.staffLevel}`}
                            </>
                          ) : (
                            `${companyName} · Firm-wide`
                          )}
                        </span>
                      </span>
                      <SurveyStatusPill status={status} />
                    </button>

                    <dl className="mx-3.5 grid grid-cols-3 rounded-xl bg-slate-50 border border-slate-100 divide-x divide-slate-100">
                      {metaOf(s).map(([label, value, tone]) => (
                        <div key={label} className="px-2.5 py-2 min-w-0">
                          <dt className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wide truncate">{label}</dt>
                          <dd className={`mt-0.5 text-[11.5px] font-semibold truncate tabular-nums ${tone ?? 'text-[#1E293B]'}`}>{value}</dd>
                        </div>
                      ))}
                    </dl>

                    {status === 'In Progress' && (
                      <div className="mx-3.5 mt-2.5 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#F59E0B] rounded-full" style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }} />
                        </div>
                        <span className="text-[10.5px] font-semibold text-slate-500 tabular-nums">
                          {progress.done}/{progress.total} answered
                        </span>
                      </div>
                    )}

                    <div className="px-3.5 py-2.5 flex items-center gap-2">
                      <span className="flex-1 min-w-0 text-[11px] text-slate-500 truncate">
                        {s.type === 'hbr' ? (
                          'Half-yearly business review'
                        ) : (
                          <>
                            Assigned to <span className="font-semibold text-slate-600">{isMine(s) ? 'You' : s.assignedTo}</span>
                          </>
                        )}
                      </span>
                      {actionButton(s)}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {!loading && visible.length < results.length && (
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
        </div>
      </div>

      {notice}

      <FeedbackFilterSheet
        isOpen={filterOpen}
        filters={filters}
        options={options}
        onClose={() => setFilterOpen(false)}
        onApply={(next) => {
          setFilters(next);
          setFilterOpen(false);
          reload();
        }}
      />
    </div>
  );
};
