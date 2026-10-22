import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { CalendarPlus, CalendarRange, CheckCircle2, ChevronRight, ClipboardCheck, Download, Eye, Hourglass, Loader2, Play, RotateCw, SearchX, SlidersHorizontal, UserRound, X } from 'lucide-react';
import { FilterIconButton } from '../../common/TeamFilterSheet';
import {
  ClientSurvey,
  FEEDBACK_PAGE_SIZE,
  SURVEY_TYPES,
  SURVEY_TYPE_LABEL,
  SurveyAnswers,
  SurveyStatus,
  SurveyType,
  daysLeft,
  expiryDate,
  formatSurveyDate,
  surveyStatus,
  todayIso,
} from '../data/clientFeedbackData';
import { StaffSkeleton } from '../staff/ClientStaffParts';
import { ScreenHeader, Card, DesignVersion, EmptyCard } from '../staff/tabs/StaffTabParts';
import { EMPTY_FEEDBACK_FILTERS, FeedbackFilterSheet, FeedbackFilters, feedbackFilterCount } from './FeedbackFilterSheet';
import { SurveyFormView } from './SurveyFormView';
import { SurveyIntroView } from './SurveyIntroView';
import { SurveyStatusPill, SurveyTypeIcon, useSurveyToast } from './SurveyParts';
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
const DESIGN_VERSIONS = ['V1', 'V2'] as const;

/** V2 card header band per survey type (type icon colours) */
const TYPE_BAND: Record<SurveyType, string> = {
  service: 'bg-gradient-to-b from-[#E0E7FF] to-[#EEF2FF]',
  staff: 'bg-gradient-to-b from-[#DBEAFE] to-[#EFF6FF]',
  thirty: 'bg-gradient-to-b from-[#D1FAE5] to-[#E8F8F0]',
  sixty: 'bg-gradient-to-b from-[#FDECC8] to-[#FEF8E7]',
  hbr: 'bg-gradient-to-b from-[#FFE4E6] to-[#FEF2F2]',
};

/** V2 status chip: white chip, coloured dot + text (stays readable on every band) */
const STATUS_CHIP: Record<SurveyStatus, { dot: string; text: string }> = {
  'Not Started': { dot: 'bg-[#2F68FE]', text: 'text-[#1D4ED8]' },
  'In Progress': { dot: 'bg-[#F59E0B]', text: 'text-[#D97706]' },
  Completed: { dot: 'bg-[#10B981]', text: 'text-[#059669]' },
  Expired: { dot: 'bg-slate-400', text: 'text-slate-500' },
};


const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');

const ListSkeleton: React.FC<{ v2: boolean }> = ({ v2 }) => (
  <div className={v2 ? 'space-y-4' : 'space-y-3'} aria-busy="true" aria-label="Loading surveys">
    {[0, 1, 2].map((i) =>
      v2 ? (
        <div key={i} className="bg-white rounded-[20px] overflow-hidden border border-[#E6ECF5]">
          <div className="bg-slate-50 px-3.5 pt-3.5 pb-8 flex items-center gap-2.5">
            <StaffSkeleton className="w-10 h-10 rounded-xl" />
            <StaffSkeleton className="flex-1 h-4" />
            <StaffSkeleton className="w-16 h-5 rounded-md" />
          </div>
          <div className="-mt-5 mx-3 p-3 rounded-xl bg-white border border-[#E2E8F0] flex items-center gap-3">
            <StaffSkeleton className="w-10 h-10 rounded-full" />
            <StaffSkeleton className="flex-1 h-4" />
          </div>
          <div className="p-3.5 grid grid-cols-3 gap-3">
            <StaffSkeleton className="h-9 rounded-lg" />
            <StaffSkeleton className="h-9 rounded-lg" />
            <StaffSkeleton className="h-9 rounded-lg" />
          </div>
        </div>
      ) : (
        <div key={i} className="bg-white border border-[#DCE3ED] rounded-[20px] p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 space-y-1.5">
              <StaffSkeleton className="w-40 h-3.5" />
              <StaffSkeleton className="w-28 h-3" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <StaffSkeleton className="h-11 rounded-xl" />
            <StaffSkeleton className="h-11 rounded-xl" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <StaffSkeleton className="h-11 rounded-xl" />
            <StaffSkeleton className="h-11 rounded-xl" />
            <StaffSkeleton className="h-11 rounded-xl" />
          </div>
        </div>
      ),
    )}
  </div>
);

/** Desktop "Feedback & Evaluation" (hbrreports): every survey assigned to the client, with Start / Resume / View / PDF */
export const ClientFeedbackView: React.FC<ClientFeedbackViewProps> = ({ surveys, userName, onUpdate, onBack }) => {
  const [screen, setScreen] = useState<Screen>({ mode: 'list' });
  const [version, setVersion] = useState<DesignVersion>('V1');
  const v2 = version === 'V2';
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
    const outline = v2
      ? 'h-9 px-3 rounded-lg bg-[#EEF2FF] text-[#2F68FE] text-[11.5px] font-bold flex items-center gap-1.5 active:bg-[#E0E7FF] shrink-0 cursor-pointer disabled:cursor-wait'
      : 'h-9 px-3.5 rounded-full border border-[#BFDBFE] bg-[#EFF6FF] text-[#2F68FE] text-[11.5px] font-bold flex items-center gap-1.5 active:bg-blue-100 shrink-0 cursor-pointer disabled:cursor-wait';
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
            : v2
              ? 'w-9 h-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center active:bg-slate-200 shrink-0 cursor-pointer disabled:cursor-wait'
              : 'w-9 h-9 rounded-full border border-slate-200 bg-white text-slate-500 flex items-center justify-center active:bg-slate-50 shrink-0 cursor-pointer disabled:cursor-wait'
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
          className={
            v2
              ? 'h-9 px-3.5 rounded-lg bg-[#2F68FE] text-white text-[11.5px] font-bold flex items-center gap-1.5 active:bg-[#1D4ED8] shrink-0 cursor-pointer'
              : 'h-9 px-4 rounded-full bg-[#2F68FE] text-white text-[11.5px] font-bold flex items-center gap-1.5 shadow-[0_6px_14px_-6px_rgba(47,104,254,0.7)] active:bg-[#1D4ED8] shrink-0 cursor-pointer'
          }
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

  const cardInfo = (s: ClientSurvey) => {
    const status = surveyStatus(s);
    const clickable = s.type !== 'hbr' && !(status === 'Expired' && Object.keys(s.answers).length === 0) && (canFill(s) || perm.view);
    const expires = expiresIn(s);
    const tone: 'expired' | 'soon' | 'normal' = status === 'Expired' ? 'expired' : expires !== '-' && daysLeft(s) <= 5 ? 'soon' : 'normal';
    return { status, clickable, expires, tone };
  };

  const surveyTitle = (s: ClientSurvey, clickable: boolean, size: string) =>
    clickable ? (
      <button
        type="button"
        onClick={() => open(s)}
        className={`text-left text-[#2F68FE] font-bold leading-snug underline-offset-2 active:underline cursor-pointer ${size}`}
      >
        {SURVEY_TYPE_LABEL[s.type]}
      </button>
    ) : (
      <span className={`font-bold text-[#1E293B] leading-snug ${size}`}>{SURVEY_TYPE_LABEL[s.type]}</span>
    );

  /** V1 — soft card: title head, staff / period chips, date tiles, pill actions */
  const cardV1 = (s: ClientSurvey) => {
    const { status, clickable, expires, tone } = cardInfo(s);
    const expiresTile =
      tone === 'expired' ? 'bg-[#FEF2F2] text-rose-500' : tone === 'soon' ? 'bg-[#FEF8E7] text-[#D97706]' : 'bg-[#F8FAFC] text-[#1E293B]';
    return (
      <li key={s.id}>
        <Card className="overflow-hidden rounded-[20px]">
          <div className="p-4">
            <div className="flex items-start gap-3">
              <span className="flex-1 min-w-0">
                <span className="block text-[10.5px] font-semibold text-slate-400">Survey Type</span>
                <span className="block mt-0.5">{surveyTitle(s, clickable, 'text-[14px]')}</span>
              </span>
              <span className="shrink-0 flex flex-col items-end">
                <span className="text-[10.5px] font-semibold text-slate-400">Status</span>
                <span className="mt-0.5">
                  <SurveyStatusPill status={status} />
                </span>
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              {[
                { label: 'Staff Name', value: s.staffName ?? '-' },
                { label: 'Period', value: s.period ?? '-' },
              ].map(({ label, value }) => (
                <div key={label} className="min-w-0 px-3 py-2 rounded-xl bg-[#EFF6FF]">
                  <span className="block text-[10px] font-semibold text-slate-400">{label}</span>
                  <span className="block text-[12px] font-bold text-[#1E293B] truncate">{value}</span>
                </div>
              ))}
            </div>

            <dl className="mt-2 grid grid-cols-3 gap-2">
              <div className="min-w-0 px-2.5 py-2 rounded-xl bg-[#F8FAFC] border border-slate-100">
                <dt className="text-[10px] font-semibold text-slate-400">Assigned On</dt>
                <dd className="mt-0.5 text-[11.5px] font-bold text-[#1E293B] tabular-nums leading-snug">{formatSurveyDate(s.assignedOn)}</dd>
              </div>
              <div className="min-w-0 px-2.5 py-2 rounded-xl bg-[#F8FAFC] border border-slate-100">
                <dt className="text-[10px] font-semibold text-slate-400">Submitted On</dt>
                <dd className="mt-0.5 text-[11.5px] font-bold text-[#1E293B] tabular-nums leading-snug">
                  {s.submittedOn ? formatSurveyDate(s.submittedOn) : '-'}
                </dd>
              </div>
              <div className={`min-w-0 px-2.5 py-2 rounded-xl ${expiresTile}`}>
                <dt className="text-[10px] font-semibold text-slate-400">Expires In</dt>
                <dd className="mt-0.5 text-[11.5px] font-bold tabular-nums leading-snug">{expires}</dd>
              </div>
            </dl>
          </div>

          <div className="px-4 pb-4 flex items-center gap-2">
            <span className="flex-1 min-w-0">
              <span className="block text-[10px] font-semibold text-slate-400">Submitted By</span>
              <span className="block text-[11.5px] font-bold text-[#1E293B] truncate">{s.completed ? s.assignedTo : '-'}</span>
            </span>
            {actionButton(s)}
          </div>
        </Card>
      </li>
    );
  };

  /** V2 — type-tinted header band, floating staff panel, icon stepper Assigned → Submitted → Expires, Submitted By footer + compact actions */
  const cardV2 = (s: ClientSurvey) => {
    const { status, clickable, expires, tone } = cardInfo(s);
    const hasExpiry = expires !== '-';
    const steps = [
      { label: 'Assigned On', value: formatSurveyDate(s.assignedOn), icon: CalendarPlus, tint: 'bg-[#2F68FE] text-white shadow-[0_4px_10px_-4px_rgba(47,104,254,0.7)]', valueClass: 'text-[#1E293B]' },
      {
        label: 'Submitted On',
        value: s.submittedOn ? formatSurveyDate(s.submittedOn) : '-',
        icon: CheckCircle2,
        tint: s.submittedOn ? 'bg-[#10B981] text-white shadow-[0_4px_10px_-4px_rgba(16,185,129,0.7)]' : 'bg-white text-slate-400 border-2 border-dashed border-slate-300',
        valueClass: 'text-[#1E293B]',
      },
      {
        label: 'Expires In',
        value: expires,
        icon: Hourglass,
        tint: !hasExpiry
          ? 'bg-white text-slate-400 border-2 border-dashed border-slate-300'
          : tone === 'expired'
            ? 'bg-rose-500 text-white shadow-[0_4px_10px_-4px_rgba(244,63,94,0.7)]'
            : tone === 'soon'
              ? 'bg-[#F59E0B] text-white shadow-[0_4px_10px_-4px_rgba(245,158,11,0.7)]'
              : 'bg-[#4F46E5] text-white shadow-[0_4px_10px_-4px_rgba(79,70,229,0.7)]',
        valueClass:
          tone === 'expired'
            ? 'px-1.5 rounded-md bg-[#FEF2F2] text-rose-600'
            : tone === 'soon'
              ? 'px-1.5 rounded-md bg-[#FEF8E7] text-[#B45309]'
              : 'text-[#1E293B]',
      },
    ];
    const segment = [
      s.submittedOn ? 'bg-gradient-to-r from-[#2F68FE] to-[#10B981]' : 'bg-gradient-to-r from-[#2F68FE] to-[#CBD5E1]',
      status === 'Completed' ? 'bg-[#10B981]' : status === 'Expired' ? 'bg-rose-300' : 'bg-[#CBD5E1]',
    ];
    return (
      <li key={s.id}>
        <section className="bg-white rounded-[20px] overflow-hidden border border-[#E6ECF5] shadow-[0_10px_28px_-16px_rgba(15,23,42,0.28)]">
          <div className={`px-4 pt-3.5 pb-10 ${TYPE_BAND[s.type]}`}>
            <div className="flex items-start gap-3">
              <span className="p-1 rounded-2xl bg-white shadow-[0_4px_10px_-6px_rgba(15,23,42,0.3)] shrink-0">
                <SurveyTypeIcon type={s.type} />
              </span>
              <span className="flex-1 min-w-0 pt-0.5">
                <span className="block text-[10px] font-semibold text-slate-600">Survey Type</span>
                <span className="block mt-0.5">{surveyTitle(s, clickable, 'text-[15px]')}</span>
              </span>
              <span className="shrink-0 pt-0.5 flex flex-col items-end">
                <span className="text-[10px] font-semibold text-slate-600">Status</span>
                <span
                  className={`mt-1 h-6 px-2 rounded-full bg-white shadow-[0_2px_6px_-2px_rgba(15,23,42,0.2)] text-[10.5px] font-bold flex items-center gap-1.5 whitespace-nowrap ${STATUS_CHIP[status].text}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CHIP[status].dot}`} aria-hidden="true" />
                  {status}
                </span>
              </span>
            </div>
          </div>

          <div className="-mt-7 mx-3.5 px-3 py-2.5 rounded-2xl bg-white border border-[#E6ECF5] shadow-[0_8px_18px_-12px_rgba(15,23,42,0.35)] flex items-center gap-2.5">
            <span
              className="w-10 h-10 rounded-full bg-[#2F68FE] text-white text-[12px] font-bold flex items-center justify-center ring-4 ring-[#EFF6FF] shrink-0"
              aria-hidden="true"
            >
              {s.staffName ? initials(s.staffName) : <UserRound className="w-4.5 h-4.5" />}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-[10px] font-semibold text-slate-400">Staff Name</span>
              <span className="block text-[13px] font-bold text-[#1E293B] truncate">{s.staffName ?? '-'}</span>
            </span>
            <span className="shrink-0 flex flex-col items-end">
              <span className="text-[10px] font-semibold text-slate-400">Period</span>
              <span className="mt-0.5 h-6 px-2 rounded-lg bg-[#EFF6FF] text-[#2F68FE] text-[11px] font-bold flex items-center gap-1">
                <CalendarRange className="w-3 h-3" aria-hidden="true" />
                {s.period ?? '-'}
              </span>
            </span>
          </div>

          <ol className="mx-3.5 mt-4 grid grid-cols-3">
            {steps.map((st, i) => {
              const Icon = st.icon;
              return (
                <li key={st.label} className="relative min-w-0 flex flex-col items-center text-center">
                  {i < steps.length - 1 && (
                    <span className={`absolute top-[15px] left-[calc(50%+20px)] right-[calc(-50%+20px)] h-0.5 rounded-full ${segment[i]}`} aria-hidden="true" />
                  )}
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center ${st.tint}`} aria-hidden="true">
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="mt-1.5 text-[10px] font-semibold text-slate-400">{st.label}</span>
                  <span className={`mt-0.5 text-[11.5px] font-bold tabular-nums leading-5 ${st.valueClass}`}>{st.value}</span>
                </li>
              );
            })}
          </ol>

          <div className="mt-4 px-3.5 py-3 bg-[#F8FAFC] border-t border-[#EEF2F7] flex items-center gap-2.5">
            <span className="flex-1 min-w-0 flex items-center gap-2">
              <span
                className={`w-7 h-7 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
                  s.completed ? 'bg-[#E8F8F0] text-[#10B981]' : 'bg-white border border-dashed border-slate-300 text-slate-400'
                }`}
                aria-hidden="true"
              >
                {s.completed ? initials(s.assignedTo) : <UserRound className="w-3.5 h-3.5" />}
              </span>
              <span className="min-w-0">
                <span className="block text-[10px] font-semibold text-slate-400">Submitted By</span>
                <span className="block text-[11.5px] font-bold text-[#1E293B] truncate">{s.completed ? s.assignedTo : '-'}</span>
              </span>
            </span>
            {actionButton(s)}
          </div>
        </section>
      </li>
    );
  };

  const appliedChips = (
    <div className={v2 ? 'flex flex-wrap gap-1.5' : 'flex-1 min-w-0 flex gap-1.5 overflow-x-auto no-scrollbar'} aria-label="Applied filters">
      {applied.map((a) => (
        <span
          key={a.key}
          className={`shrink-0 h-7 pl-2.5 pr-1 border text-[11px] font-semibold flex items-center gap-1 ${
            v2 ? 'max-w-full rounded-lg bg-[#EFF6FF] border-transparent text-[#1D4ED8]' : 'rounded-full bg-[#EFF6FF] border-[#BFDBFE] text-[#1D4ED8]'
          }`}
        >
          {a.label}
          <button
            type="button"
            onClick={() => applyFilters(a.next)}
            aria-label={`Remove ${a.label}`}
            className={`w-5 h-5 flex items-center justify-center text-[#2F68FE] active:bg-blue-100 cursor-pointer ${v2 ? 'rounded' : 'rounded-full'}`}
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
    </div>
  );

  const countLabel = loading ? '' : `${results.length} ${results.length === 1 ? 'survey' : 'surveys'}`;

  const toolbarV1 = (
    <div className="px-4 pt-3">
      <div className="flex items-center gap-2.5">
        <span className="flex-1 min-w-0 flex items-center gap-2">
          <span className="w-9 h-9 rounded-full bg-[#EFF6FF] text-[#2F68FE] flex items-center justify-center shrink-0" aria-hidden="true">
            <ClipboardCheck className="w-4.5 h-4.5" />
          </span>
          <span className="min-w-0 truncate text-[15px] font-bold text-[#1E293B] tabular-nums">{countLabel}</span>
        </span>
        <FilterIconButton count={filterCount} onClick={() => setFilterOpen(true)} />
      </div>
      {applied.length > 0 && (
        <div className="mt-2.5 flex items-center gap-2">
          {appliedChips}
          <button
            type="button"
            onClick={clearAll}
            className="shrink-0 h-7 px-3 rounded-full bg-[#EEF2FF] text-[11px] font-bold text-[#2F68FE] active:bg-[#E0E7FF] cursor-pointer"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );

  const toolbarV2 = (
    <div className="px-4 pt-3">
      <div className="h-12 pl-2 pr-1.5 rounded-xl bg-[#2F68FE] flex items-center gap-2 text-white shadow-[0_8px_18px_-12px_rgba(47,104,254,0.8)]">
        <span className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0" aria-hidden="true">
          <ClipboardCheck className="w-4 h-4" />
        </span>
        <span className="flex-1 min-w-0 flex items-baseline gap-1">
          {!loading && (
            <>
              <span className="text-[17px] font-bold leading-none tabular-nums">{results.length}</span>
              <span className="text-[11.5px] font-semibold text-white/80 truncate">{results.length === 1 ? 'survey' : 'surveys'}</span>
            </>
          )}
        </span>
        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          aria-label={filterCount ? `Filters (${filterCount} applied)` : 'Filters'}
          className="h-9 pl-2.5 pr-2 rounded-lg bg-white text-[#2F68FE] text-[12px] font-bold flex items-center gap-1.5 shrink-0 active:bg-blue-50 cursor-pointer focus-visible:outline-2 focus-visible:outline-white"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filter
          {filterCount > 0 ? (
            <span className="min-w-4.5 h-4.5 px-1 rounded-full bg-[#2F68FE] text-white text-[10px] font-bold flex items-center justify-center">
              {filterCount}
            </span>
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-[#93C5FD]" aria-hidden="true" />
          )}
        </button>
      </div>

      {applied.length > 0 && (
        <div className="mt-2.5 flex items-start gap-2">
          <div className="flex-1 min-w-0">{appliedChips}</div>
          <button
            type="button"
            onClick={clearAll}
            className="shrink-0 h-7 px-2 rounded-lg bg-[#FEF2F2] text-[11px] font-bold text-rose-500 flex items-center gap-1 active:bg-rose-100 cursor-pointer"
          >
            <X className="w-3 h-3" />
            Clear All
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="relative flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      <ScreenHeader title="Feedback & Evaluation" onBack={onBack} version={{ versions: DESIGN_VERSIONS, value: version, onChange: setVersion }} />
      <div ref={listRef} className="flex-1 overflow-y-auto no-scrollbar pb-6">
        {v2 ? toolbarV2 : toolbarV1}

        <div className="px-4 mt-4">
          {loading ? (
            <ListSkeleton v2={v2} />
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
                    className={`mt-4 h-10 px-5 bg-[#EEF2FF] text-[#2F68FE] text-xs font-bold active:bg-[#E0E7FF] cursor-pointer ${v2 ? 'rounded-xl' : 'rounded-full'}`}
                  >
                    Clear All
                  </button>
                ) : undefined
              }
            />
          ) : (
            <>
              <ul className={v2 ? 'space-y-4' : 'space-y-3'}>{visible.map(v2 ? cardV2 : cardV1)}</ul>

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
                  className={`mt-3 w-full h-11 text-xs font-bold text-[#2F68FE] flex items-center justify-center gap-2 disabled:cursor-wait transition-colors cursor-pointer ${
                    v2 ? 'rounded-2xl border border-dashed border-[#93C5FD] bg-white active:bg-[#EFF6FF]' : 'rounded-full border border-[#BFDBFE] bg-white active:bg-slate-50'
                  }`}
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
