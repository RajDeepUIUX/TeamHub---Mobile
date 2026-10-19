import React from 'react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Calendar-style tile with the leave's first day (month + date), used in place of a leave-type icon */
export const LeaveDateBadge: React.FC<{ startDate: string; size?: 'md' | 'lg' }> = ({ startDate, size = 'md' }) => {
  const [, m, d] = startDate.split('-').map(Number);
  const box = size === 'lg' ? 'w-12 h-12 rounded-2xl' : 'w-10 h-10 rounded-xl';
  return (
    <div className={`${box} bg-blue-50 border border-blue-100 flex flex-col items-center justify-center shrink-0 overflow-hidden`}>
      <span className="text-[9px] font-bold uppercase tracking-wide text-[#2F68FE] leading-none">{MONTHS[(m || 1) - 1]}</span>
      <span className={`${size === 'lg' ? 'text-lg' : 'text-base'} font-extrabold text-[#1E293B] leading-none mt-0.5 tabular-nums`}>
        {d || '–'}
      </span>
    </div>
  );
};
