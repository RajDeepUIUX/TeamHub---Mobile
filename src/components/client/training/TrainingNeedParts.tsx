import React, { useEffect, useRef } from 'react';
import { TNI_STATUS_LABEL, TniStatus } from '../data/clientTrainingNeedData';

/** Pending amber, Assigned (In-Progress) indigo, Completed green: same tones as the other Client status pills */
const STATUS_STYLE: Record<TniStatus, string> = {
  Pending: 'bg-[#FEF8E7] text-[#D97706]',
  'In-Progress': 'bg-[#EEF2FF] text-[#4F46E5]',
  Completed: 'bg-[#E8F8F0] text-[#10B981]',
};

export const TniStatusPill: React.FC<{ status: TniStatus }> = ({ status }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-bold whitespace-nowrap ${STATUS_STYLE[status]}`}>{TNI_STATUS_LABEL[status]}</span>
);

const STATUS_SOLID: Record<TniStatus, string> = { Pending: 'bg-[#F59E0B]', 'In-Progress': 'bg-[#4F46E5]', Completed: 'bg-[#10B981]' };
const STATUS_RING: Record<TniStatus, string> = { Pending: 'ring-[#FEF3C7]', 'In-Progress': 'ring-[#E0E7FF]', Completed: 'ring-[#D1FAE5]' };
const STEP_LABELS = ['Requested', 'Assigned', 'Completed'] as const;

/** Pending → Assigned → Completed tracker; the Requested and Completed steps carry their dates */
export const TniProgress: React.FC<{ status: TniStatus; requestedOn: string; completedOn: string | null; formatDate: (iso: string | null) => string }> = ({
  status,
  requestedOn,
  completedOn,
  formatDate,
}) => {
  const reached = status === 'Pending' ? 0 : status === 'In-Progress' ? 1 : 2;
  const dates = [formatDate(requestedOn), '', completedOn ? formatDate(completedOn) : ''];
  return (
    <ol className="grid grid-cols-3" aria-label={`Progress: ${TNI_STATUS_LABEL[status]}`}>
      {STEP_LABELS.map((label, i) => {
        const done = i <= reached;
        const current = i === reached;
        return (
          <li key={label} className="relative min-w-0">
            {i < 2 && <span className={`absolute left-4 right-0 top-[7px] h-0.5 rounded-full ${i < reached ? STATUS_SOLID[status] : 'bg-slate-200'}`} aria-hidden="true" />}
            <span
              className={`relative block w-4 h-4 rounded-full border-2 ${
                done ? `${STATUS_SOLID[status]} border-transparent` : 'bg-white border-slate-300'
              } ${current ? `ring-4 ${STATUS_RING[status]}` : ''}`}
              aria-hidden="true"
            />
            <span className={`mt-1.5 block text-[11px] leading-tight ${done ? 'font-bold text-[#1E293B]' : 'font-medium text-slate-400'}`}>{label}</span>
            <span className="block text-[10.5px] leading-tight text-slate-400 tabular-nums min-h-3">{dates[i]}</span>
          </li>
        );
      })}
    </ol>
  );
};

/** Read-only value chips (sub programmes, training names, software) */
export const TniChips: React.FC<{ values: string[]; tone?: 'blue' | 'slate' }> = ({ values, tone = 'slate' }) =>
  values.length === 0 ? (
    <span className="text-[12px] font-semibold text-slate-400">-</span>
  ) : (
    <span className="flex flex-wrap gap-1.5">
      {values.map((v) => (
        <span
          key={v}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold ${tone === 'blue' ? 'bg-[#EFF6FF] text-[#1D4ED8]' : 'bg-slate-100 text-slate-700'}`}
        >
          {v}
        </span>
      ))}
    </span>
  );

/** Status chips with counts (same look as My Staff); "In-Progress" reads "Assigned" like desktop */
export function TniStatusChips<T extends string>({
  options,
  value,
  onChange,
  counts,
  labelOf,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  counts: Record<T, number>;
  labelOf: (v: T) => string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('[aria-pressed="true"]')?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [value]);
  return (
    <div ref={ref} className="-mx-4 flex gap-1.5 overflow-x-auto no-scrollbar px-4 pb-1" role="group" aria-label="Status">
      {options.map((o) => {
        const on = o === value;
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o)}
            className={`shrink-0 h-8 pl-3 pr-1.5 rounded-full text-[11.5px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              on ? 'bg-[#2F68FE] text-white' : 'bg-slate-100 text-slate-600 active:bg-slate-200'
            }`}
          >
            {labelOf(o)}
            <span className={`min-w-5 h-5 px-1 rounded-full text-[10px] font-bold flex items-center justify-center tabular-nums bg-white ${on ? 'text-[#2F68FE]' : 'text-slate-500'}`}>
              {counts[o]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
