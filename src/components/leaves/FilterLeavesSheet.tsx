import React, { useEffect, useState } from 'react';
import { X, Calendar, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet';
import { Dropdown } from '../../design-system/components/Dropdown';

interface FilterLeavesSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentStatus: string;
  onApply: (status: string, dateRangeStr: string) => void;
  onClear: () => void;
}

export const FilterLeavesSheet: React.FC<FilterLeavesSheetProps> = ({
  isOpen,
  onClose,
  currentStatus,
  onApply,
  onClear,
}) => {
  const [status, setStatus] = useState<string>(currentStatus || 'All');
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(false);

  // Calendar starts collapsed each time the sheet opens
  useEffect(() => {
    if (isOpen) setIsCalendarExpanded(false);
  }, [isOpen]);
  const [currentMonthIndex, setCurrentMonthIndex] = useState(() => new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [selectedStartDay, setSelectedStartDay] = useState<number | null>(null);
  const [selectedEndDay, setSelectedEndDay] = useState<number | null>(null);
  const [activeDateField, setActiveDateField] = useState<'start' | 'end'>('start');

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const statusOptions = ['All', 'Pending', 'Approved', 'Rejected'];
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // For Monday-first week: 0=Mon, 1=Tue, ..., 6=Sun
  const getFirstDayOfMonthMon = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const totalDays = getDaysInMonth(currentYear, currentMonthIndex);
  const startDayOffset = getFirstDayOfMonthMon(currentYear, currentMonthIndex);

  const handlePrevMonth = () => {
    if (currentMonthIndex === 0) {
      setCurrentMonthIndex(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonthIndex((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonthIndex === 11) {
      setCurrentMonthIndex(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonthIndex((m) => m + 1);
    }
  };

  const handleDayClick = (day: number) => {
    if (activeDateField === 'start') {
      setSelectedStartDay(day);
      if (selectedEndDay !== null && day > selectedEndDay) {
        setSelectedEndDay(day);
      }
      setActiveDateField('end');
    } else if (activeDateField === 'end') {
      if (selectedStartDay !== null && day < selectedStartDay) {
        setSelectedStartDay(day);
      } else {
        setSelectedEndDay(day);
      }
    } else {
      if (selectedStartDay !== null && selectedEndDay === null) {
        if (day < selectedStartDay) {
          setSelectedStartDay(day);
        } else {
          setSelectedEndDay(day);
        }
      } else {
        setSelectedStartDay(day);
        setSelectedEndDay(null);
      }
    }
  };

  const shortMonth = monthNames[currentMonthIndex].substring(0, 3);
  const startFormatted = selectedStartDay !== null ? `${selectedStartDay} ${shortMonth} ${currentYear}` : 'Start date';
  const endFormatted = selectedEndDay !== null ? `${selectedEndDay} ${shortMonth} ${currentYear}` : 'End date';
  // Empty when no range is picked, so it doesn't count as an active filter
  const formattedDateRange = selectedStartDay !== null ? `${startFormatted}  →  ${selectedEndDay !== null ? endFormatted : startFormatted}` : '';

  const handleApply = () => {
    onApply(status, formattedDateRange);
    onClose();
  };

  const handleClearAll = () => {
    setStatus('All');
    setSelectedStartDay(null);
    setSelectedEndDay(null);
    onClear();
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[92%]">
      {/* Drag handle */}
      <div className="pt-3 pb-1 flex justify-center cursor-grab">
        <div className="w-10 h-1 bg-slate-300 rounded-full" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
        <h2 className="text-base font-bold text-[#1E293B]">Filter Leaves</h2>
        <button
          onClick={onClose}
          type="button"
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Sheet Content */}
      <div className="p-5 space-y-5 overflow-y-auto no-scrollbar">
        {/* Status */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-[#1E293B]">Status</label>
          <Dropdown size="md" ariaLabel="Status" value={status} options={statusOptions} onChange={setStatus} />
        </div>

        {/* Date Range: one field, start → end; tapping a side opens the calendar for it */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-[#1E293B]">Date Range</label>

          <div
            className={`h-11 bg-white border rounded-xl flex items-stretch text-xs shadow-2xs transition-all ${
              isCalendarExpanded ? 'border-[#2F68FE] ring-1 ring-[#2F68FE]' : 'border-slate-200'
            }`}
          >
            {(['start', 'end'] as const).map((field, i) => {
              const picked = field === 'start' ? selectedStartDay !== null : selectedEndDay !== null;
              const active = isCalendarExpanded && activeDateField === field;
              return (
                <React.Fragment key={field}>
                  {i === 1 && <ArrowRight className="w-3.5 h-3.5 text-slate-400 self-center shrink-0" aria-hidden="true" />}
                  <button
                    type="button"
                    onClick={() => {
                      // Tapping the side that's already open closes the calendar
                      if (active) setIsCalendarExpanded(false);
                      else {
                        setIsCalendarExpanded(true);
                        setActiveDateField(field);
                      }
                    }}
                    aria-label={field === 'start' ? 'Start date' : 'End date'}
                    aria-expanded={active}
                    className={`flex-1 min-w-0 flex items-center gap-2 px-3 rounded-xl cursor-pointer ${
                      i === 1 ? 'justify-end' : ''
                    } ${active ? 'bg-blue-50/60' : 'active:bg-slate-50'}`}
                  >
                    {i === 0 && <Calendar className="w-4 h-4 text-[#2F68FE] shrink-0" />}
                    <span className={`truncate ${picked ? 'font-semibold text-slate-800' : 'font-medium text-slate-400'}`}>
                      {field === 'start' ? startFormatted : endFormatted}
                    </span>
                  </button>
                </React.Fragment>
              );
            })}
          </div>

          {/* Interactive Inline Calendar matching Image 3 */}
          {isCalendarExpanded && (
            <div className="mt-2.5 p-4 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Month Navigation */}
              <div className="flex items-center justify-between px-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-slate-500 active:bg-slate-100 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h4 className="font-bold text-xs text-[#1E293B]">
                  {monthNames[currentMonthIndex]} {currentYear}
                </h4>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-slate-500 active:bg-slate-100 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Mon - Sun Headers */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {weekDays.map((d) => (
                  <span key={d} className="text-[10px] font-semibold text-slate-400">
                    {d}
                  </span>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-y-1 text-center text-xs font-semibold">
                {/* Previous month trailing days */}
                {Array.from({ length: startDayOffset }).map((_, i) => (
                  <div key={`prev-${i}`} className="h-8 flex items-center justify-center text-slate-300 text-[11px]">
                    {31 - startDayOffset + i + 1}
                  </div>
                ))}

                {Array.from({ length: totalDays }).map((_, i) => {
                  const day = i + 1;
                  const isStart = selectedStartDay !== null && day === selectedStartDay;
                  const isEnd = selectedEndDay !== null && day === selectedEndDay;
                  const inRange = Boolean(
                    selectedStartDay !== null &&
                    selectedEndDay !== null &&
                    day > selectedStartDay &&
                    day < selectedEndDay
                  );
                  const hasMultipleDays = Boolean(
                    selectedStartDay !== null &&
                    selectedEndDay !== null &&
                    selectedEndDay > selectedStartDay
                  );

                  return (
                    <div key={day} className="relative flex items-center justify-center h-8">
                      {inRange ? (
                        <div className="absolute inset-y-0 inset-x-0 bg-blue-100/80 pointer-events-none" />
                      ) : null}
                      {isStart && hasMultipleDays ? (
                        <div className="absolute inset-y-0 right-0 w-1/2 bg-blue-100/80 pointer-events-none" />
                      ) : null}
                      {isEnd && hasMultipleDays ? (
                        <div className="absolute inset-y-0 left-0 w-1/2 bg-blue-100/80 pointer-events-none" />
                      ) : null}

                      <button
                        type="button"
                        onClick={() => handleDayClick(day)}
                        className={`relative z-10 w-7.5 h-7.5 rounded-full flex items-center justify-center text-[11px] transition-all cursor-pointer ${
                          isStart || isEnd
                            ? 'bg-[#2F68FE] text-white font-bold shadow-xs'
                            : inRange
                            ? 'text-[#2F68FE] font-bold'
                            : 'text-slate-700 active:bg-slate-100'
                        }`}
                      >
                        {day}
                      </button>
                    </div>
                  );
                })}

                {/* Next month leading days */}
                {Array.from({ length: (7 - ((startDayOffset + totalDays) % 7)) % 7 }).map((_, i) => (
                  <div key={`next-${i}`} className="h-8 flex items-center justify-center text-slate-300 text-[11px]">
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Actions: Clear filters & Apply Filters */}
      <div className="grid grid-cols-2 gap-3 p-5 pt-2 pb-8 border-t border-slate-100">
        <button
          type="button"
          onClick={handleClearAll}
          className="h-12 rounded-xl text-[#2F68FE] font-bold text-xs bg-white active:bg-blue-50/50 transition-colors cursor-pointer flex items-center justify-center"
        >
          Clear filters
        </button>
        <button
          type="button"
          onClick={handleApply}
          className="h-12 rounded-xl bg-[#2F68FE] text-white font-bold text-xs shadow-xs active:bg-[#1D4ED8] transition-colors cursor-pointer flex items-center justify-center"
        >
          Apply Filters
        </button>
      </div>
    </BottomSheet>
  );
};
