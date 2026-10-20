import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ClipboardCheck, Download, Eye, Loader2, Play, RotateCw, SearchX, X } from 'lucide-react';
import { FilterIconButton } from '../../common/TeamFilterSheet';
import {
  ClientSurvey,
  FEEDBACK_PAGE_SIZE,
  SURVEY_TYPES,
  SURVEY_TYPE_LABEL,
  SurveyAnswers,
  SurveyType,
  daysLeft,
  expiryDate,
  formatSurveyDate,
  surveyStatus,
  todayIso,
} from '../data/clientFeedbackData';
import { StaffSkeleton } from '../staff/ClientStaffParts';
import { ScreenHeader, Card, EmptyCard } from '../staff/tabs/StaffTabParts';
import { EMPTY_FEEDBACK_FILTERS, FeedbackFilterSheet, FeedbackFilters, feedbackFilterCount } from './FeedbackFilterSheet';
import { SurveyFormView } from './SurveyFormView';
import { SurveyIntroView } from './SurveyIntroView';
import { SurveyStatusPill, useSurveyToast } from './SurveyParts';
import { useClientPermission } from '../context/ClientPermissionContext';

type Screen = { mode: 'list' } | { mode: 'intro' | 'form' | 'view'; id: string };

interface ClientFeedbackViewProps {
  surveys: ClientSurvey[];
  /** Signed-in client contact (primary contact → sees every survey) */
  userName: string;
  companyName: string;
  onUpdate: (id: string, patch: Partial<ClientSurvey>) => void;
  /** Header back arrow (Dashboard) */
  onBack?: () => void;
}

const LOAD_MS = 600;

const ListSkeleton: React.FC = () => (
  <div className="space-y-3" aria-busy="true" aria-label="Loading surveys">
    {[0, 1, 2].map((i) => (
      <div key={i} className="bg-white border border-[#DCE3ED] rounded-2xl p-4 space-y-3">
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

/** Desktop table column as a label / value pair */
const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="min-w-0">
    <dt className="text-[10.5px] font-semibold text-slate-400">{label}</dt>
    <dd className="mt-0.5 text-[12.5px] text-[#1E293B] leading-snug break-words">{children}</dd>
  </div>
);

/** Desktop "Feedback & Evaluation" (hbrreports): every survey assigned to the client, with Start / Resume / View / PDF */
export const ClientFeedbackView: React.FC<ClientFeedbackViewProps> = ({ surveys, userName, onUpdate, onBack }) => {
  const [screen, setScreen] = useState<Screen>({ mode: 'list' });
  // Back from a survey returns to the same place in the list
  const listRef = useRef<HTMLDivElement>(null);
  const listScroll = useRef(0);
  const [loading, setLoading] = useState(true);
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

  const results = sorted.filter((s) => {
    if (filters.type.length && !filters.type.includes(s.type)) return false;
    if (filters.staff.length && !(s.staffName && filters.staff.includes(s.staffName))) return false;
    if (filters.period.length && !(s.period && filters.period.includes(s.period))) return false;
    return true;
  });
  const visible = results.slice(0, pages * FEEDBACK_PAGE_SIZE);

  const filterCount = feedbackFilterCount(filters);
  const isFiltered = filterCount > 0;
  const applied: { key: string; label: string; next: FeedbackFilters }[] = [
    ...filters.type.map((t) => ({ key: `t-${t}`, label: SURVEY_TYPE_LABEL[t as SurveyType], next: { ...filters, type: filters.type.filter((x) => x !== t) } })),
    ...filters.staff.map((n) => ({ key: `s-${n}`, label: n, next: { ...filters, staff: filters.staff.filter((x) => x !== n) } })),
    ...filters.period.map((p) => ({ key: `p-${p}`, label: p, next: { ...filters, period: filters.period.filter((x) => x !== p) } })),
  ];

  const reload = () => {
    setPages(1);
    setLoading(true);
    listRef.current?.scrollTo({ top: 0 });
  };

  const applyFilters = (next: FeedbackFilters) => {
    setFilters(next);
    reload();
  };
  const clearAll = () => applyFilters(EMPTY_FEEDBACK_FILTERS);

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

  /** Desktop "Expires In": days left while open, "Expired" once closed, "-" for submitted surveys and HBR reports */
  const expiresIn = (s: ClientSurvey) => {
    const status = surveyStatus(s);
    if (s.type === 'hbr' || status === 'Completed') return '-';
    if (status === 'Expired') return 'Expired';
    const left = daysLeft(s);
    return `${left} ${left === 1 ? 'day' : 'days'}`;
  };

  const card = (s: ClientSurvey) => {
    const status = surveyStatus(s);
    const clickable = s.type !== 'hbr' && !(status === 'Expired' && Object.keys(s.answers).length === 0) && (canFill(s) || perm.view);
    const expires = expiresIn(s);
    const expiresTone = status === 'Expired' ? 'text-rose-500' : expires !== '-' && daysLeft(s) <= 5 ? 'text-[#D97706] font-semibold' : '';
    return (
      <li key={s.id}>
        <Card className="overflow-hidden">
          <div className="p-3.5">
            <div className="flex items-start gap-3">
              <span className="flex-1 min-w-0">
                <span className="block text-[10.5px] font-semibold text-slate-400">Survey Type</span>
                <span className="block mt-0.5 text-[14px] leading-snug">
                  {clickable ? (
                    <button
                      type="button"
                      onClick={() => open(s)}
                      className="text-left text-[#2F68FE] font-medium underline-offset-2 active:underline cursor-pointer"
                    >
                      {SURVEY_TYPE_LABEL[s.type]}
                    </button>
                  ) : (
                    <span className="font-medium text-[#1E293B]">{SURVEY_TYPE_LABEL[s.type]}</span>
                  )}
                </span>
              </span>
              <span className="shrink-0 flex flex-col items-end">
                <span className="text-[10.5px] font-semibold text-slate-400">Status</span>
                <span className="mt-0.5">
                  <SurveyStatusPill status={status} />
                </span>
              </span>
            </div>

            <dl className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-x-4 gap-y-3">
              <Field label="Staff Name">{s.staffName ?? '-'}</Field>
              <Field label="Submitted By">{s.completed ? s.assignedTo : '-'}</Field>
              <Field label="Period">{s.period ?? '-'}</Field>
              <Field label="Assigned On">
                <span className="tabular-nums">{formatSurveyDate(s.assignedOn)}</span>
              </Field>
              <Field label="Submitted On">
                <span className="tabular-nums">{s.submittedOn ? formatSurveyDate(s.submittedOn) : '-'}</span>
              </Field>
              <Field label="Expires In">
                <span className={`tabular-nums ${expiresTone}`}>{expires}</span>
              </Field>
            </dl>
          </div>

          <div className="px-3.5 py-2.5 border-t border-slate-100 flex items-center justify-end gap-2">
            {actionButton(s)}
          </div>
        </Card>
      </li>
    );
  };

  return (
    <div className="relative flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      <ScreenHeader title="Feedback & Evaluation" onBack={onBack} />
      <div ref={listRef} className="flex-1 overflow-y-auto no-scrollbar pb-6">
        <div className="px-4 pt-3">
          <div className="flex items-center gap-2.5">
            <span className="flex-1 min-w-0 truncate text-xs font-semibold text-slate-500 tabular-nums">
              {loading ? '' : `${results.length} ${results.length === 1 ? 'survey' : 'surveys'}`}
            </span>
            <FilterIconButton count={filterCount} onClick={() => setFilterOpen(true)} />
          </div>

          {applied.length > 0 && (
            <div className="mt-2.5 flex items-center gap-2">
              <div className="flex-1 min-w-0 flex gap-1.5 overflow-x-auto no-scrollbar" aria-label="Applied filters">
                {applied.map((a) => (
                  <span
                    key={a.key}
                    className="shrink-0 h-7 pl-2.5 pr-1 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[11px] font-semibold text-[#1D4ED8] flex items-center gap-1"
                  >
                    {a.label}
                    <button
                      type="button"
                      onClick={() => applyFilters(a.next)}
                      aria-label={`Remove ${a.label}`}
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
        </div>

        <div className="px-4 mt-4">
          {loading ? (
            <ListSkeleton />
          ) : results.length === 0 ? (
            <EmptyCard
              icon={surveys.length === 0 ? ClipboardCheck : SearchX}
              title={surveys.length === 0 ? 'No Data Found' : 'No surveys found.'}
              text={surveys.length === 0 ? 'Surveys assigned to you will show up here.' : 'Try another survey type, staff name or period.'}
              action={
                isFiltered ? (
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
                  Showing all {results.length} {results.length === 1 ? 'survey' : 'surveys'}
                </p>
              )}
            </>
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
          setFilterOpen(false);
          applyFilters(next);
        }}
      />
    </div>
  );
};
