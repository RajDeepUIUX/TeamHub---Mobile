import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const toDateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const formatShortDate = (d: Date) =>
  d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const sameDay = (a: Date | null, b: Date) => !!a && toDateKey(a) === toDateKey(b);

interface RangeCalendarProps {
  start: Date | null;
  end: Date | null;
  /** Which end of the range the next tap sets */
  activeField: 'start' | 'end';
  onSelect: (day: Date) => void;
  /** Month shown first; defaults to the active field's date */
  initialMonth?: Date;
}

/** Month-by-month range calendar that supports ranges spanning multiple months. */
export const RangeCalendar: React.FC<RangeCalendarProps> = ({
  start,
  end,
  activeField,
  onSelect,
  initialMonth,
}) => {
  const seed = initialMonth ?? (activeField === 'end' ? end ?? start : start) ?? new Date();
  const [viewYear, setViewYear] = useState(seed.getFullYear());
  const [viewMonth, setViewMonth] = useState(seed.getMonth());

  const shiftMonth = (delta: number) => {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  const totalDays = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const offset = firstWeekday === 0 ? 6 : firstWeekday - 1; // Monday-first
  const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();
  const trailing = (7 - ((offset + totalDays) % 7)) % 7;

  const startKey = start ? toDateKey(start) : null;
  const endKey = end ? toDateKey(end) : null;
  const hasRange = !!startKey && !!endKey && endKey > startKey;
  const todayKey = toDateKey(new Date());

  return (
    <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-3.5">
      {/* Month Navigation */}
      <div className="flex items-center justify-between px-1">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 cursor-pointer"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h4 className="font-bold text-xs text-[#1E293B]">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </h4>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 cursor-pointer"
          aria-label="Next month"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEK_DAYS.map((d) => (
          <span key={d} className="text-[10px] font-semibold text-slate-400">
            {d}
          </span>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-y-1 text-center text-xs font-semibold">
        {Array.from({ length: offset }).map((_, i) => (
          <div key={`prev-${i}`} className="h-8 flex items-center justify-center text-slate-300 text-[11px]">
            {prevMonthDays - offset + i + 1}
          </div>
        ))}

        {Array.from({ length: totalDays }).map((_, i) => {
          const date = new Date(viewYear, viewMonth, i + 1);
          const key = toDateKey(date);
          const isStart = sameDay(start, date);
          const isEnd = sameDay(end, date);
          const inRange = hasRange && key > startKey! && key < endKey!;
          const isToday = key === todayKey;

          return (
            <div key={key} className="relative flex items-center justify-center h-8">
              {inRange && <div className="absolute inset-0 bg-blue-100/80 pointer-events-none" />}
              {isStart && hasRange && (
                <div className="absolute inset-y-0 right-0 w-1/2 bg-blue-100/80 pointer-events-none" />
              )}
              {isEnd && hasRange && (
                <div className="absolute inset-y-0 left-0 w-1/2 bg-blue-100/80 pointer-events-none" />
              )}
              <button
                type="button"
                onClick={() => onSelect(date)}
                className={`relative z-10 w-7.5 h-7.5 rounded-full flex items-center justify-center text-[11px] transition-all cursor-pointer ${
                  isStart || isEnd
                    ? 'bg-[#2F68FE] text-white font-bold shadow-xs'
                    : inRange
                      ? 'text-[#2F68FE] font-bold'
                      : isToday
                        ? 'text-[#2F68FE] ring-1 ring-[#2F68FE]/40 hover:bg-slate-100'
                        : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {i + 1}
              </button>
            </div>
          );
        })}

        {Array.from({ length: trailing }).map((_, i) => (
          <div key={`next-${i}`} className="h-8 flex items-center justify-center text-slate-300 text-[11px]">
            {i + 1}
          </div>
        ))}
      </div>
    </div>
  );
};
