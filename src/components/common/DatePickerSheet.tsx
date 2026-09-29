import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { BottomSheet } from './BottomSheet';
import { RangeCalendar, toDateKey, formatShortDate } from '../../design-system/components/RangeCalendar';

interface DatePickerSheetProps {
  isOpen: boolean;
  mode: 'single' | 'range';
  title: string;
  /** YYYY-MM-DD values */
  start: string | null;
  end?: string | null;
  /** Earliest selectable date (YYYY-MM-DD); earlier taps are ignored */
  minDate?: string;
  onClose: () => void;
  onApply: (start: string, end: string | null) => void;
}

const parse = (iso: string | null | undefined) => (iso ? new Date(`${iso}T00:00:00`) : null);

export const DatePickerSheet: React.FC<DatePickerSheetProps> = ({
  isOpen,
  mode,
  title,
  start,
  end = null,
  minDate,
  onClose,
  onApply,
}) => {
  const [draftStart, setDraftStart] = useState<Date | null>(parse(start));
  const [draftEnd, setDraftEnd] = useState<Date | null>(parse(end));
  const [picking, setPicking] = useState<'start' | 'end'>('start');

  useEffect(() => {
    if (isOpen) {
      setDraftStart(parse(start));
      setDraftEnd(parse(end));
      setPicking('start');
    }
  }, [isOpen, start, end]);

  const handleSelect = (day: Date) => {
    if (minDate && toDateKey(day) < minDate) return;
    if (mode === 'single') {
      setDraftStart(day);
      return;
    }
    if (picking === 'start' || !draftStart || day < draftStart) {
      setDraftStart(day);
      setDraftEnd(null);
      setPicking('end');
    } else {
      setDraftEnd(day);
      setPicking('start');
    }
  };

  const canApply = mode === 'single' ? Boolean(draftStart) : Boolean(draftStart && draftEnd);
  const summary =
    mode === 'single'
      ? draftStart
        ? formatShortDate(draftStart)
        : 'Select a date'
      : draftStart
        ? `${formatShortDate(draftStart)} → ${draftEnd ? formatShortDate(draftEnd) : 'select end date'}`
        : 'Select a start date';

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[90%]">
      <div className="pt-3 pb-1 flex justify-center shrink-0">
        <div className="w-10 h-1 bg-slate-300 rounded-full" />
      </div>
      <div className="flex items-center justify-between px-5 pt-1 pb-3 border-b border-slate-100 shrink-0">
        <div>
          <h2 className="text-base font-bold text-[#1E293B]">{title}</h2>
          <p className="text-[11px] text-slate-500 tabular-nums">{summary}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar p-4">
        <RangeCalendar
          start={draftStart}
          end={mode === 'single' ? null : draftEnd}
          activeField={picking}
          onSelect={handleSelect}
        />
        {minDate && <p className="mt-2 px-1 text-[11px] text-slate-400">Dates before today can't be selected.</p>}
      </div>
      <div className="p-4 pt-3 pb-6 border-t border-slate-100 shrink-0">
        <button
          type="button"
          disabled={!canApply}
          onClick={() => draftStart && onApply(toDateKey(draftStart), draftEnd ? toDateKey(draftEnd) : null)}
          className="w-full h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          Apply
        </button>
      </div>
    </BottomSheet>
  );
};
