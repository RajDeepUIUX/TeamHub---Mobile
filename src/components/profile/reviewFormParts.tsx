import React from 'react';
import { AlertCircle, CalendarDays } from 'lucide-react';

// Small form pieces shared by the Annual Review tabs

export const formatReviewDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

export const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="block mb-1 text-[10.5px] font-semibold text-slate-500">{children}</span>
);

export const ErrorText: React.FC<{ message?: string }> = ({ message }) =>
  message ? (
    <p className="flex items-center gap-1 text-[11px] font-medium text-rose-500">
      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
      {message}
    </p>
  ) : null;

/** Same box as the design-system Dropdown trigger (default size lg = h-12) so fields line up in a grid */
export const fieldBoxClass =
  'w-full h-12 px-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs text-xs transition-all';
export const inputClass = `${fieldBoxClass} text-[#1E293B] font-semibold placeholder:text-slate-400 placeholder:font-medium focus:outline-none focus:border-[#2F68FE] focus:ring-4 focus:ring-blue-50`;
/** Text inside a button-style field: filled vs placeholder */
export const fieldTextClass = (hasValue: boolean) =>
  `flex-1 min-w-0 truncate text-left ${hasValue ? 'font-semibold text-[#1E293B]' : 'font-medium text-slate-400'}`;

export const DateButton: React.FC<{ label: string; value: string; onClick: () => void; disabled?: boolean }> = ({
  label,
  value,
  onClick,
  disabled,
}) => (
  <div className="min-w-0">
    <FieldLabel>{label}</FieldLabel>
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${fieldBoxClass} flex items-center gap-2.5 hover:border-slate-300 disabled:bg-slate-50 disabled:shadow-none disabled:hover:border-slate-200 cursor-pointer disabled:cursor-default`}
    >
      <CalendarDays className="w-4 h-4 text-slate-400 shrink-0" />
      <span className={fieldTextClass(Boolean(value))}>
        {value ? formatReviewDate(value) : 'Pick date'}
      </span>
    </button>
  </div>
);

export const textareaClass =
  'w-full min-h-24 px-3.5 py-3 rounded-xl border border-slate-200 bg-white shadow-2xs text-xs leading-relaxed text-[#1E293B] placeholder:text-slate-400 resize-none focus:outline-none focus:border-[#2F68FE] focus:ring-4 focus:ring-blue-50';
