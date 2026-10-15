import React, { useState } from 'react';
import { CalendarDays, X } from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet';
import { LeaveDayItem, LeaveRequest } from '../../types/leaves';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Day-wise items; falls back to one full day per calendar day for requests saved without a breakdown */
export const leaveDays = (r: LeaveRequest): LeaveDayItem[] => {
  if (r.dayItems?.length) return r.dayItems;
  const start = new Date(r.startDate);
  if (Number.isNaN(start.getTime())) return [];
  return Array.from({ length: r.daysCount }, (_, i) => {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    return {
      date: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      dayOfWeek: WEEKDAYS[d.getDay()],
      duration: 'Full Day' as const,
    };
  });
};

const DURATION_TONE: Record<LeaveDayItem['duration'], string> = {
  'Full Day': 'bg-blue-50 text-[#2F68FE]',
  '6 Hours': 'bg-violet-50 text-violet-600',
  '4 Hours': 'bg-amber-50 text-amber-700',
  '2 Hours': 'bg-emerald-50 text-emerald-700',
};

/** Which day is off for how long, opened from the dates on a leave card */
export const LeaveBreakdownSheet: React.FC<{ request: LeaveRequest | null; onClose: () => void }> = ({ request, onClose }) => {
  // Keep the last request on screen while the sheet animates out
  const [shown, setShown] = useState<LeaveRequest | null>(request);
  if (request && request !== shown) setShown(request);
  const r = shown;
  const days = r ? leaveDays(r) : [];

  return (
    <BottomSheet isOpen={Boolean(request)} onClose={onClose} maxHeight="max-h-[80%]">
      <div className="pt-3 pb-1 flex justify-center shrink-0">
        <div className="w-10 h-1 bg-slate-300 rounded-full" />
      </div>
      <div className="flex items-start justify-between gap-3 px-5 pt-1 pb-3 border-b border-slate-100 shrink-0">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-[#1E293B]">Leave Duration</h2>
          {r && (
            <p className="mt-0.5 text-[11px] text-slate-500 truncate">
              {r.staffName ? `${r.staffName} · ` : ''}
              {r.daysCount} {r.daysCount === 1 ? 'day' : 'days'}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 cursor-pointer shrink-0"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {r && (
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 py-3 pb-8 space-y-3">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <CalendarDays className="w-4 h-4 text-[#2F68FE] shrink-0" />
            <span className="text-xs font-bold text-[#1E293B]">{r.dateRange}</span>
          </div>
          <ul className="rounded-xl border border-slate-100 divide-y divide-slate-100 overflow-hidden">
            {days.map((item) => (
              <li key={item.date} className="px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0">
                  <span className="block font-bold text-[#1E293B]">{item.date}</span>
                  <span className="block text-[11px] text-slate-400">{item.dayOfWeek}</span>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold shrink-0 ${DURATION_TONE[item.duration]}`}>
                  {item.duration}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </BottomSheet>
  );
};
