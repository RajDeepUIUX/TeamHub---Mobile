import React, { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet';

interface SelectDateRangeSheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** Current selection, e.g. "20 Oct 2026"; omit when nothing has been picked yet */
  initialStartDate?: string;
  initialEndDate?: string;
  onApply: (startDate: string, endDate: string, daysCount: number) => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_MS = 24 * 60 * 60 * 1000;

const startOfToday = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

/** "20 Oct 2026" → Date (local midnight), or null */
export const parseLeaveDate = (s?: string): Date | null => {
  if (!s) return null;
  const [day, mon, year] = s.split(' ');
  const m = MONTH_NAMES.findIndex((n) => n.startsWith(mon));
  const d = new Date(Number(year), m, Number(day));
  return m < 0 || Number.isNaN(d.getTime()) ? null : d;
};

/** Date → "20 Oct 2026" */
export const formatLeaveDate = (d: Date) => `${d.getDate()} ${MONTH_NAMES[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;

const sameDay = (a: Date | null, b: Date | null) => Boolean(a && b && a.getTime() === b.getTime());

export const SelectDateRangeSheet: React.FC<SelectDateRangeSheetProps> = ({
  isOpen,
  onClose,
  initialStartDate,
  initialEndDate,
  onApply,
}) => {
  const today = startOfToday();
  const [start, setStart] = useState<Date | null>(null);
  const [end, setEnd] = useState<Date | null>(null);
  const [view, setView] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  // Re-seed from the form each time the sheet opens: the saved range, or nothing at all
  useEffect(() => {
    if (!isOpen) return;
    const s = parseLeaveDate(initialStartDate);
    const e = parseLeaveDate(initialEndDate);
    const validStart = s && s >= startOfToday() ? s : null;
    setStart(validStart);
    setEnd(validStart && e && e >= validStart ? e : null);
    const anchor = validStart ?? startOfToday();
    setView(new Date(anchor.getFullYear(), anchor.getMonth(), 1));
  }, [isOpen, initialStartDate, initialEndDate]);

  const year = view.getFullYear();
  const month = view.getMonth();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const startDayOffset = new Date(year, month, 1).getDay();
  const canGoPrev = year > today.getFullYear() || (year === today.getFullYear() && month > today.getMonth());

  const handleDayClick = (date: Date) => {
    if (start && !end && date >= start) {
      setEnd(date);
    } else {
      // First tap, a tap before the start, or a new selection after a complete range
      setStart(date);
      setEnd(null);
    }
  };

  const handleApply = () => {
    if (!start) return;
    const last = end ?? start;
    const days = Math.round((last.getTime() - start.getTime()) / DAY_MS) + 1;
    onApply(formatLeaveDate(start), formatLeaveDate(last), days);
    onClose();
  };

  const hasMultipleDays = Boolean(start && end && end > start);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[92%]">
      {/* Drag handle */}
      <div className="pt-3 pb-1 flex justify-center cursor-grab">
        <div className="w-10 h-1 bg-slate-300 rounded-full" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
        <h2 className="text-base font-bold text-[#1E293B]">Select Date Range</h2>
        <button
          onClick={onClose}
          type="button"
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-5 space-y-4 overflow-y-auto no-scrollbar">
        {/* Month Selector */}
        <div className="flex items-center justify-between px-2">
          <button
            type="button"
            onClick={() => setView(new Date(year, month - 1, 1))}
            disabled={!canGoPrev}
            aria-label="Previous month"
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 active:bg-slate-100 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h3 className="font-bold text-sm text-[#1E293B]">
            {MONTH_NAMES[month]} {year}
          </h3>
          <button
            type="button"
            onClick={() => setView(new Date(year, month + 1, 1))}
            aria-label="Next month"
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 active:bg-slate-100 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {DAYS_OF_WEEK.map((day) => (
            <span key={day} className="text-[11px] font-semibold text-slate-400 py-1">
              {day}
            </span>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-y-1.5 text-center text-xs font-semibold">
          {Array.from({ length: startDayOffset }).map((_, i) => (
            <div key={`empty-${i}`} className="h-9" />
          ))}

          {Array.from({ length: totalDays }).map((_, i) => {
            const date = new Date(year, month, i + 1);
            const isPast = date < today;
            const isStart = sameDay(date, start);
            const isEnd = sameDay(date, end);
            const inRange = Boolean(start && end && date > start && date < end);
            const isToday = sameDay(date, today);

            return (
              <div key={i} className="relative flex items-center justify-center h-9">
                {inRange && <div className="absolute inset-y-0 inset-x-0 bg-blue-100/80 pointer-events-none" />}
                {isStart && hasMultipleDays && <div className="absolute inset-y-0 right-0 w-1/2 bg-blue-100/80 pointer-events-none" />}
                {isEnd && hasMultipleDays && <div className="absolute inset-y-0 left-0 w-1/2 bg-blue-100/80 pointer-events-none" />}

                <button
                  type="button"
                  onClick={() => handleDayClick(date)}
                  disabled={isPast}
                  aria-label={formatLeaveDate(date)}
                  aria-pressed={isStart || isEnd || inRange}
                  className={`relative z-10 w-8.5 h-8.5 rounded-full flex items-center justify-center transition-all ${
                    isStart || isEnd
                      ? 'bg-[#2F68FE] text-white font-bold shadow-xs cursor-pointer'
                      : inRange
                        ? 'text-[#2F68FE] font-bold cursor-pointer'
                        : isPast
                          ? 'text-slate-300 cursor-not-allowed'
                          : `${isToday ? 'text-[#2F68FE] ring-1 ring-blue-200' : 'text-slate-700'} active:bg-slate-100 cursor-pointer`
                  }`}
                >
                  {i + 1}
                </button>
              </div>
            );
          })}
        </div>

        {/* Start / End summary */}
        <div className="bg-[#F0F5FF] border border-blue-100/80 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
          <div className="flex-1">
            <span className="block text-[11px] font-semibold text-[#2F68FE]">Start Date</span>
            <span className={`block text-sm font-bold mt-0.5 ${start ? 'text-[#1E293B]' : 'text-slate-400'}`}>
              {start ? formatLeaveDate(start) : 'Select'}
            </span>
          </div>
          <div className="w-px h-8 bg-blue-200/80 mx-4" />
          <div className="flex-1 text-right">
            <span className="block text-[11px] font-semibold text-[#2F68FE]">End Date</span>
            <span className={`block text-sm font-bold mt-0.5 ${end ? 'text-[#1E293B]' : 'text-slate-400'}`}>
              {end ? formatLeaveDate(end) : 'Select'}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom CTA Button */}
      <div className="p-5 pt-2 pb-8 border-t border-slate-100">
        <button
          type="button"
          onClick={handleApply}
          disabled={!start || !end}
          className="w-full h-12 bg-[#2F68FE] active:bg-[#1D4ED8] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Apply
        </button>
      </div>
    </BottomSheet>
  );
};
