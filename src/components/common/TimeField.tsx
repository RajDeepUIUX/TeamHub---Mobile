import React, { useState } from 'react';
import { Clock3 } from 'lucide-react';
import { TimeWheelSheet } from './TimeWheelSheet';

interface TimeFieldProps {
  /** "HH:MM" (24h) or null */
  value: string | null;
  placeholder: string;
  /** Sheet heading, e.g. "Office From Time" */
  title: string;
  onChange: (value: string) => void;
  /** The picked time must be after this one ("HH:MM") */
  after?: string | null;
  /** Allow a time equal to `after` */
  inclusive?: boolean;
  invalid?: boolean;
}

/** Field that opens the hour / minute wheels (used for every time pick instead of a long list) */
export const TimeField: React.FC<TimeFieldProps> = ({ value, placeholder, title, onChange, after, inclusive, invalid }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={title}
        className={`w-full h-11 px-3.5 rounded-xl border bg-white flex items-center gap-2.5 text-xs shadow-2xs transition-all cursor-pointer ${
          open ? 'border-[#2F68FE] ring-4 ring-blue-50' : invalid ? 'border-rose-300' : 'border-slate-200'
        }`}
      >
        <Clock3 className={`w-4 h-4 shrink-0 ${value ? 'text-[#2F68FE]' : 'text-slate-400'}`} />
        <span className={`flex-1 min-w-0 truncate text-left tabular-nums ${value ? 'font-semibold text-[#1E293B]' : 'font-medium text-slate-400'}`}>
          {value ?? placeholder}
        </span>
      </button>
      <TimeWheelSheet
        isOpen={open}
        title={title}
        value={value ?? ''}
        after={after}
        inclusive={inclusive}
        onClose={() => setOpen(false)}
        onApply={(t) => {
          onChange(t);
          setOpen(false);
        }}
      />
    </>
  );
};
