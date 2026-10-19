import React, { useEffect, useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { RangeCalendar, formatShortDate } from '../../design-system/components/RangeCalendar';

interface DateRangeFieldsProps {
  start: Date | null;
  end: Date | null;
  onChange: (start: Date | null, end: Date | null) => void;
  /** Latest selectable day (e.g. today for attendance); omit to allow future dates */
  maxDate?: Date;
  /** Collapses the calendar whenever this changes (pass the sheet's isOpen) */
  resetKey?: unknown;
}

/**
 * The standard date range for every filter bottom sheet: Start Date | End Date side by side,
 * with the calendar opening inline underneath the field being picked (the highlighted field says which end is next).
 */
export const DateRangeFields: React.FC<DateRangeFieldsProps> = ({ start, end, onChange, maxDate, resetKey }) => {
  const [active, setActive] = useState<'start' | 'end' | null>(null);

  useEffect(() => setActive(null), [resetKey]);

  // Pick start, then end; a tap before the start begins a new range
  const handleDaySelect = (day: Date) => {
    if (active === 'start' || !start) {
      onChange(day, end && day > end ? null : end);
      setActive('end');
    } else if (day < start) {
      onChange(day, null);
    } else {
      onChange(start, day);
      setActive(null);
    }
  };

  const field = (which: 'start' | 'end', label: string, value: Date | null) => {
    const isActive = active === which;
    return (
      <div>
        <span className="block mb-1.5 text-xs font-bold text-[#1E293B]">{label}</span>
        <button
          type="button"
          onClick={() => setActive(isActive ? null : which)}
          aria-expanded={isActive}
          className={`w-full h-11 px-3 rounded-xl border bg-white flex items-center justify-between text-xs font-medium transition-all cursor-pointer shadow-2xs ${
            isActive ? 'border-[#2F68FE] ring-4 ring-blue-50' : 'border-slate-200'
          }`}
        >
          <span className="flex items-center gap-2 min-w-0">
            <Calendar className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#2F68FE]' : 'text-slate-400'}`} />
            <span className={`truncate ${value ? 'text-slate-700 font-semibold' : 'text-slate-400'}`}>
              {value ? formatShortDate(value) : 'Select date'}
            </span>
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${isActive ? 'rotate-180 text-[#2F68FE]' : 'text-slate-400'}`}
          />
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-3">
        {field('start', 'Start Date', start)}
        {field('end', 'End Date', end)}
      </div>
      {active && (
        <div className="pt-1">
          <RangeCalendar key={active} start={start} end={end} activeField={active} onSelect={handleDaySelect} maxDate={maxDate} />
        </div>
      )}
    </div>
  );
};
