import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Building2, CalendarClock, CalendarRange, Check, CheckCircle2, FileBarChart, UserRound } from 'lucide-react';
import { NOT_APPLICABLE, RATING_SCALE, SurveyStatus, SurveyType } from '../data/clientFeedbackData';

const STATUS_STYLE: Record<SurveyStatus, string> = {
  'Not Started': 'bg-[#EFF6FF] text-[#1D4ED8]',
  'In Progress': 'bg-[#FEF8E7] text-[#D97706]',
  Completed: 'bg-[#E8F8F0] text-[#10B981]',
  Expired: 'bg-slate-100 text-slate-500',
};

export const SurveyStatusPill: React.FC<{ status: SurveyStatus }> = ({ status }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-bold whitespace-nowrap ${STATUS_STYLE[status]}`}>{status}</span>
);

const TYPE_ICON: Record<SurveyType, { icon: React.ElementType; tint: string }> = {
  service: { icon: Building2, tint: 'bg-[#EEF2FF] text-[#4F46E5]' },
  staff: { icon: UserRound, tint: 'bg-[#EFF6FF] text-[#2F68FE]' },
  thirty: { icon: CalendarClock, tint: 'bg-[#E8F8F0] text-[#10B981]' },
  sixty: { icon: CalendarRange, tint: 'bg-[#FEF8E7] text-[#D97706]' },
  hbr: { icon: FileBarChart, tint: 'bg-[#FEF2F2] text-rose-500' },
};

export const SurveyTypeIcon: React.FC<{ type: SurveyType; size?: 'md' | 'lg' }> = ({ type, size = 'md' }) => {
  const { icon: Icon, tint } = TYPE_ICON[type];
  return (
    <span className={`rounded-xl flex items-center justify-center shrink-0 ${tint} ${size === 'lg' ? 'w-12 h-12' : 'w-10 h-10'}`} aria-hidden="true">
      <Icon className={size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'} />
    </span>
  );
};

/** Rating colours: 1 = rose … 5 = green (desktop r_one … r_five) */
export const RATING_TONE: Record<number, { dot: string; text: string; soft: string }> = {
  1: { dot: 'bg-rose-500', text: 'text-rose-600', soft: 'bg-[#FEF2F2] text-rose-600' },
  2: { dot: 'bg-orange-400', text: 'text-orange-600', soft: 'bg-orange-50 text-orange-600' },
  3: { dot: 'bg-amber-400', text: 'text-[#D97706]', soft: 'bg-[#FEF8E7] text-[#D97706]' },
  4: { dot: 'bg-teal-500', text: 'text-teal-600', soft: 'bg-teal-50 text-teal-600' },
  5: { dot: 'bg-[#10B981]', text: 'text-[#10B981]', soft: 'bg-[#E8F8F0] text-[#10B981]' },
};

export const ratingLabel = (v: number) => (v === NOT_APPLICABLE ? 'Not Applicable' : RATING_SCALE.find((o) => o.value === v)?.label ?? '');

/** Read-only answer chip */
export const RatingChip: React.FC<{ value: number }> = ({ value }) => (
  <span
    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11.5px] font-bold ${
      value === NOT_APPLICABLE ? 'bg-slate-100 text-slate-500' : RATING_TONE[value].soft
    }`}
  >
    {value !== NOT_APPLICABLE && <span className="tabular-nums">{value}</span>}
    {value !== NOT_APPLICABLE && <span className="w-1 h-1 rounded-full bg-current opacity-50" />}
    {ratingLabel(value)}
  </span>
);

/**
 * Desktop 5-point radio row as small 1–5 boxes on one line (N/A box at the end where the desktop offers it);
 * the chosen meaning shows underneath
 */
export const RatingOptions: React.FC<{
  name: string;
  value: number | undefined;
  allowNA?: boolean;
  invalid?: boolean;
  /** Scale hint under an unanswered row (off for i–v sub-questions after the first) */
  hint?: boolean;
  onChange: (v: number) => void;
}> = ({ name, value, allowNA, invalid, hint = true, onChange }) => {
  const isNA = value === NOT_APPLICABLE;
  const idle = `bg-white text-slate-600 active:bg-slate-50 ${invalid ? 'border-rose-200' : 'border-slate-200'}`;
  return (
    <div role="radiogroup" aria-label={name} aria-invalid={invalid}>
      <div className="flex items-center gap-2">
        {RATING_SCALE.map((o) => {
          const on = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={`${o.value}, ${o.label}`}
              title={o.label}
              onClick={() => onChange(o.value)}
              className={`w-9 h-9 rounded-lg border text-[13px] font-bold tabular-nums transition-colors cursor-pointer shrink-0 ${
                on ? `${RATING_TONE[o.value].dot} border-transparent text-white shadow-xs` : idle
              }`}
            >
              {o.value}
            </button>
          );
        })}
        {allowNA && (
          <button
            type="button"
            role="radio"
            aria-checked={isNA}
            aria-label="Not Applicable"
            onClick={() => onChange(NOT_APPLICABLE)}
            className={`h-9 px-2.5 rounded-lg border text-[11px] font-bold transition-colors cursor-pointer shrink-0 ${
              isNA ? 'bg-slate-600 border-slate-600 text-white' : idle
            }`}
          >
            N/A
          </button>
        )}
      </div>
      <div className={value !== undefined || hint ? 'mt-1.5' : ''}>
        {value !== undefined && !isNA ? (
          <span className={`text-[11.5px] font-bold ${RATING_TONE[value].text}`}>{ratingLabel(value)}</span>
        ) : isNA ? (
          <span className="text-[11.5px] font-bold text-slate-500">Not Applicable</span>
        ) : hint ? (
          <span className="text-[10.5px] font-medium text-slate-400 leading-tight">
            1 = Does not meet · 5 = Exceeds expectations
          </span>
        ) : null}
      </div>
    </div>
  );
};

/** NPS 0–10 */
export const NpsScale: React.FC<{ value: number | undefined; invalid?: boolean; readOnly?: boolean; onChange: (v: number) => void }> = ({
  value,
  invalid,
  readOnly,
  onChange,
}) => {
  const tone = (n: number) => (n <= 6 ? 'bg-rose-500' : n <= 8 ? 'bg-amber-400' : 'bg-[#10B981]');
  return (
    <div>
      <div role="radiogroup" aria-label="Score from 0 to 10" className="grid grid-cols-6 gap-1.5">
        {Array.from({ length: 11 }, (_, n) => {
          const on = value === n;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={on}
              disabled={readOnly}
              onClick={() => onChange(n)}
              className={`h-10 rounded-xl border text-[13px] font-bold tabular-nums transition-colors cursor-pointer disabled:cursor-default ${
                on
                  ? `${tone(n)} border-transparent text-white`
                  : `bg-white text-slate-600 active:bg-slate-50 ${invalid ? 'border-rose-200' : 'border-slate-200'} ${readOnly ? 'opacity-50' : ''}`
              }`}
            >
              {n}
            </button>
          );
        })}
      </div>
      <div className="mt-1.5 flex justify-between text-[10.5px] font-medium text-slate-400">
        <span>0 = Not likely</span>
        <span>10 = Extremely likely</span>
      </div>
    </div>
  );
};

/** Back arrow + centred title, like Staff Details */
export const SurveyScreenHeader: React.FC<{ title: string; backLabel: string; onBack: () => void; action?: React.ReactNode }> = ({
  title,
  backLabel,
  onBack,
  action,
}) => (
  <header className="shrink-0 bg-white h-14 px-4 flex items-center justify-between gap-2 border-b border-[#EBF0F7] relative">
    <button
      type="button"
      onClick={onBack}
      aria-label={backLabel}
      className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-[#1E293B] active:bg-slate-100 cursor-pointer relative z-10"
    >
      <ArrowLeft className="w-5 h-5" />
    </button>
    <h1 className="text-base font-bold screen-title truncate">{title}</h1>
    <span className="relative z-10">{action}</span>
  </header>
);

/** Floating toast above the footer (same as Work Flexibility), visible wherever the list is scrolled */
export const useSurveyToast = (bottomClass = 'bottom-4') => {
  const [text, setText] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const show = useCallback((msg: string) => {
    clearTimeout(timer.current);
    setText(msg);
    timer.current = setTimeout(() => setText(null), 2600);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  const node = text ? (
    <div
      role="status"
      className={`absolute left-4 right-4 ${bottomClass} z-20 flex items-center gap-2 px-3.5 py-3 rounded-xl bg-[#1E293B] text-white text-[12px] font-semibold shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200`}
    >
      <CheckCircle2 className="w-4 h-4 text-[#34D399] shrink-0" />
      <span className="flex-1">{text}</span>
    </div>
  ) : null;
  return [node, show] as const;
};

// Decorative confetti dots around the success icon (LeaveSubmittedModal)
const CONFETTI = [
  { top: '8%', left: '22%', color: 'bg-amber-400', size: 'w-1.5 h-1.5' },
  { top: '18%', left: '12%', color: 'bg-rose-400', size: 'w-1 h-1' },
  { top: '4%', left: '38%', color: 'bg-[#2F68FE]', size: 'w-1 h-1' },
  { top: '10%', left: '68%', color: 'bg-emerald-400', size: 'w-1.5 h-1.5' },
  { top: '2%', left: '58%', color: 'bg-violet-400', size: 'w-1 h-1' },
  { top: '22%', left: '84%', color: 'bg-amber-400', size: 'w-1 h-1' },
  { top: '30%', left: '18%', color: 'bg-[#2F68FE]', size: 'w-1 h-1' },
  { top: '28%', left: '78%', color: 'bg-rose-400', size: 'w-1.5 h-1.5' },
];

/** Desktop "Survey Submitted" popup that returns to the list after 5 seconds */
export const SurveySubmittedModal: React.FC<{
  open: boolean;
  title: string;
  subtitle: string;
  answered: string;
  submittedOn: string;
  onDone: () => void;
  autoCloseMs?: number;
}> = ({ open, title, subtitle, answered, submittedOn, onDone, autoCloseMs = 5000 }) => {
  // Latest callback in a ref so parent re-renders don't restart the 5-second countdown
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => doneRef.current(), autoCloseMs);
    return () => clearTimeout(t);
  }, [open, autoCloseMs]);

  if (!open) return null;
  return (
    <div
      className="absolute inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center px-6 animate-in fade-in duration-200"
      onClick={onDone}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Survey Submitted"
        className="w-full bg-white rounded-3xl p-5 shadow-xl text-[#1E293B] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-24 flex items-center justify-center">
          {CONFETTI.map((c, i) => (
            <span key={i} className={`absolute rounded-full ${c.color} ${c.size}`} style={{ top: c.top, left: c.left }} />
          ))}
          <div className="w-16 h-16 rounded-full bg-[#10B981] flex items-center justify-center shadow-[0_8px_24px_rgba(16,185,129,0.35)] ring-8 ring-emerald-50">
            <Check className="w-8 h-8 text-white stroke-[3]" />
          </div>
        </div>
        <div className="text-center space-y-1 mt-1">
          <h2 className="text-base font-extrabold">Survey Submitted</h2>
          <p className="text-xs text-slate-500 leading-relaxed">Thank you! A summary report of your responses is ready to download.</p>
        </div>
        <div className="mt-4 p-3 bg-slate-50 border border-[#EBF0F7] rounded-2xl">
          <span className="block text-xs font-bold truncate">{title}</span>
          <span className="block text-[11px] text-slate-500 truncate">{subtitle}</span>
        </div>
        <div className="mt-3 space-y-2.5 text-xs px-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Answered</span>
            <span className="font-bold tabular-nums">{answered}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Submitted On</span>
            <span className="font-bold">{submittedOn}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Status</span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E8F8F0] text-[#10B981]">Completed</span>
          </div>
        </div>
        <div className="mt-4 space-y-1.5">
          <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#2F68FE] rounded-full origin-left" style={{ animation: `survey-submitted-progress ${autoCloseMs}ms linear forwards` }} />
          </div>
          <p className="text-center text-[10px] text-slate-400">Returning to Feedback & Evaluation…</p>
        </div>
        <style>{`@keyframes survey-submitted-progress { from { transform: scaleX(0); } to { transform: scaleX(1); } }`}</style>
      </div>
    </div>
  );
};
