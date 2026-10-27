import React from 'react';
import { Check } from 'lucide-react';
import { MlStatus } from '../data/clientMandatoryLearningData';

/** Desktop badges: Completed green, In-Progress amber, Not Started neutral (redesign 2.5) */
const STATUS_STYLE: Record<MlStatus, string> = {
  Completed: 'bg-[#E8F8F0] text-[#10B981]',
  'In-Progress': 'bg-[#FEF8E7] text-[#D97706]',
  'Not Started': 'bg-slate-100 text-slate-600',
};

export const MlStatusPill: React.FC<{ status: MlStatus }> = ({ status }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap ${STATUS_STYLE[status]}`}>{status}</span>
);

const RING_R = 18;
const RING_C = 2 * Math.PI * RING_R;

/** Total Completed of Total Assigned as a ring (redesign 11a), completed count in the centre */
export const CompletionRing: React.FC<{ completed: number; assigned: number }> = ({ completed, assigned }) => {
  const share = assigned ? completed / assigned : 0;
  return (
    <span className="relative w-12 h-12 shrink-0 flex items-center justify-center" role="img" aria-label={`${completed} of ${assigned} completed`}>
      <svg viewBox="0 0 44 44" className="absolute inset-0 w-full h-full -rotate-90" aria-hidden="true">
        <circle cx="22" cy="22" r={RING_R} fill="none" stroke="#DBEAFE" strokeWidth="4" />
        {share > 0 && (
          <circle
            cx="22"
            cy="22"
            r={RING_R}
            fill="none"
            stroke="#2F68FE"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={RING_C}
            strokeDashoffset={RING_C * (1 - share)}
            className="transition-[stroke-dashoffset] duration-500 motion-reduce:transition-none"
          />
        )}
      </svg>
      <span className="relative text-[11px] font-extrabold text-[#1E293B] tabular-nums" aria-hidden="true">
        {completed}
      </span>
    </span>
  );
};

/** Assigned On → Completed On track; the end step and connector follow the status */
export const MlProgressTrack: React.FC<{ status: MlStatus }> = ({ status }) => {
  const done = status === 'Completed';
  const active = status === 'In-Progress';
  return (
    <div className="flex items-center" aria-hidden="true">
      <span className="w-4 h-4 rounded-full bg-[#2F68FE] text-white flex items-center justify-center shrink-0">
        <Check className="w-2.5 h-2.5 stroke-3" />
      </span>
      <span className={`flex-1 mx-1 ${done ? 'h-0.5 rounded-full bg-[#2F68FE]' : `border-t-2 border-dashed ${active ? 'border-[#2F68FE]' : 'border-slate-300'}`}`} />
      <span
        className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
          done ? 'bg-[#2F68FE] text-white' : active ? 'bg-white border-2 border-[#2F68FE] ring-4 ring-blue-50' : 'bg-white border-2 border-slate-300'
        }`}
      >
        {done && <Check className="w-2.5 h-2.5 stroke-3" />}
      </span>
    </div>
  );
};
