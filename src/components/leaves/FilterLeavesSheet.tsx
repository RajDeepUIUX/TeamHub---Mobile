import React, { useState } from 'react';
import { X, Calendar, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet';

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
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(true);
  const [currentMonthIndex, setCurrentMonthIndex] = useState(8); // September = 8
  const [currentYear, setCurrentYear] = useState(2026);
  const [selectedStartDay, setSelectedStartDay] = useState<number | null>(21);
  const [selectedEndDay, setSelectedEndDay] = useState<number | null>(25);
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
  const startFormatted = selectedStartDay !== null ? `${selectedStartDay} ${shortMonth} ${currentYear}` : 'Select date';
  const endFormatted = selectedEndDay !== null ? `${selectedEndDay} ${shortMonth} ${currentYear}` : 'Select date';
  const formattedDateRange = `${startFormatted}  →  ${endFormatted}`;

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
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Sheet Content */}
      <div className="p-5 space-y-5 overflow-y-auto no-scrollbar">
        {/* Status Chips matching Image 2 */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-[#1E293B]">Status</label>
          <div className="grid grid-cols-4 gap-2">
            {statusOptions.map((opt) => {
              const isSelected = status === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setStatus(opt)}
                  className={`h-11 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                    isSelected
                      ? 'border-[#2F68FE] bg-blue-50/80 text-[#2F68FE] shadow-2xs font-bold'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2 Different Text Fields Aligned Horizontally: Start Date | End Date */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-[#1E293B]">Date Range</label>
            <button
              type="button"
              onClick={() => setIsCalendarExpanded(!isCalendarExpanded)}
              className="text-[11px] font-semibold text-[#2F68FE] flex items-center gap-1 hover:underline cursor-pointer"
            >
              <span>{isCalendarExpanded ? 'Hide Calendar' : 'Show Calendar'}</span>
              {isCalendarExpanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* 2 Horizontal Text Fields */}
          <div className="grid grid-cols-2 gap-3">
            {/* Start Date Field */}
            <div className="space-y-1">
              <span className="block text-[11px] font-semibold text-slate-500">Start Date</span>
              <button
                type="button"
                onClick={() => {
                  setIsCalendarExpanded(true);
                  setActiveDateField('start');
                }}
                className={`w-full h-11 px-3 bg-white border rounded-xl flex items-center justify-between text-xs font-medium transition-all cursor-pointer shadow-2xs ${
                  isCalendarExpanded && activeDateField === 'start'
                    ? 'border-[#2F68FE] ring-1 ring-[#2F68FE] bg-blue-50/30'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Calendar className="w-4 h-4 text-[#2F68FE] shrink-0" />
                  <span
                    className={`truncate text-xs ${
                      selectedStartDay !== null ? 'font-semibold text-slate-800' : 'text-slate-400'
                    }`}
                  >
                    {startFormatted}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
              </button>
            </div>

            {/* End Date Field */}
            <div className="space-y-1">
              <span className="block text-[11px] font-semibold text-slate-500">End Date</span>
              <button
                type="button"
                onClick={() => {
                  setIsCalendarExpanded(true);
                  setActiveDateField('end');
                }}
                className={`w-full h-11 px-3 bg-white border rounded-xl flex items-center justify-between text-xs font-medium transition-all cursor-pointer shadow-2xs ${
                  isCalendarExpanded && activeDateField === 'end'
                    ? 'border-[#2F68FE] ring-1 ring-[#2F68FE] bg-blue-50/30'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Calendar className="w-4 h-4 text-[#2F68FE] shrink-0" />
                  <span
                    className={`truncate text-xs ${
                      selectedEndDay !== null ? 'font-semibold text-slate-800' : 'text-slate-400'
                    }`}
                  >
                    {endFormatted}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
              </button>
            </div>
          </div>

          {/* Interactive Inline Calendar matching Image 3 */}
          {isCalendarExpanded && (
            <div className="mt-2.5 p-4 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Month Navigation */}
              <div className="flex items-center justify-between px-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h4 className="font-bold text-xs text-[#1E293B]">
                  {monthNames[currentMonthIndex]} {currentYear}
                </h4>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 cursor-pointer"
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
                            : 'text-slate-700 hover:bg-slate-100'
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
          className="h-12 rounded-xl text-[#2F68FE] font-bold text-xs bg-white hover:bg-blue-50/50 transition-colors cursor-pointer flex items-center justify-center"
        >
          Clear filters
        </button>
        <button
          type="button"
          onClick={handleApply}
          className="h-12 rounded-xl bg-[#2F68FE] text-white font-bold text-xs shadow-xs hover:bg-[#2558E6] active:bg-[#1D4ED8] transition-colors cursor-pointer flex items-center justify-center"
        >
          Apply Filters
        </button>
      </div>
    </BottomSheet>
  );
};
