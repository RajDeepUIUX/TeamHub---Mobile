import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet';

interface SelectDateRangeSheetProps {
  isOpen: boolean;
  onClose: () => void;
  initialStartDate?: string; // e.g. "20 Oct 2026"
  initialEndDate?: string;   // e.g. "23 Oct 2026"
  onApply: (startDate: string, endDate: string, daysCount: number) => void;
}

export const SelectDateRangeSheet: React.FC<SelectDateRangeSheetProps> = ({
  isOpen,
  onClose,
  initialStartDate = '20 Oct 2026',
  initialEndDate = '23 Oct 2026',
  onApply,
}) => {
  const [currentMonthIndex, setCurrentMonthIndex] = useState(9); // 9 = October
  const [currentYear, setCurrentYear] = useState(2026);
  const [selectedStartDay, setSelectedStartDay] = useState<number | null>(20);
  const [selectedEndDay, setSelectedEndDay] = useState<number | null>(23);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // October 2026 starts on Thursday (index 4 in Sun-first week: Sun=0, Mon=1, Tue=2, Wed=3, Thu=4, Fri=5, Sat=6)
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const totalDays = getDaysInMonth(currentYear, currentMonthIndex);
  const startDayOffset = getFirstDayOfMonth(currentYear, currentMonthIndex);

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
    // If we only have start date selected and no end date yet
    if (selectedStartDay !== null && selectedEndDay === null) {
      if (day < selectedStartDay) {
        setSelectedStartDay(day);
      } else {
        setSelectedEndDay(day);
      }
    } else {
      // Start a new selection
      setSelectedStartDay(day);
      setSelectedEndDay(null);
    }
  };

  const handleApply = () => {
    const start = selectedStartDay ?? 20;
    const end = selectedEndDay ?? start;
    const shortMonth = monthNames[currentMonthIndex].substring(0, 3);
    const startFormatted = `${start} ${shortMonth} ${currentYear}`;
    const endFormatted = `${end} ${shortMonth} ${currentYear}`;
    const days = end - start + 1;
    onApply(startFormatted, endFormatted, days > 0 ? days : 1);
    onClose();
  };

  const shortMonth = monthNames[currentMonthIndex].substring(0, 3);
  const startFormatted = selectedStartDay !== null
    ? `${selectedStartDay} ${shortMonth} ${currentYear}`
    : initialStartDate;
  const endFormatted = selectedEndDay !== null
    ? `${selectedEndDay} ${shortMonth} ${currentYear}`
    : (selectedStartDay !== null ? `${selectedStartDay} ${shortMonth} ${currentYear}` : initialEndDate);

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
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
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
            onClick={handlePrevMonth}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h3 className="font-bold text-sm text-[#1E293B]">
            {monthNames[currentMonthIndex]} {currentYear}
          </h3>
          <button
            type="button"
            onClick={handleNextMonth}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {daysOfWeek.map((day) => (
            <span key={day} className="text-[11px] font-semibold text-slate-400 py-1">
              {day}
            </span>
          ))}
        </div>

        {/* Days Grid matching Image 5 */}
        <div className="grid grid-cols-7 gap-y-1.5 text-center text-xs font-semibold">
          {Array.from({ length: startDayOffset }).map((_, i) => (
            <div key={`empty-${i}`} className="h-9" />
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
              <div
                key={day}
                className="relative flex items-center justify-center h-9"
              >
                {/* Background pill band for range - strictly boolean guarded */}
                {inRange ? (
                  <div className="absolute inset-y-0 inset-x-0 bg-blue-100/80 pointer-events-none" />
                ) : null}

                {isStart && hasMultipleDays ? (
                  <div className="absolute inset-y-0 right-0 w-1/2 bg-blue-100/80 pointer-events-none" />
                ) : null}

                {isEnd && hasMultipleDays ? (
                  <div className="absolute inset-y-0 left-0 w-1/2 bg-blue-100/80 pointer-events-none" />
                ) : null}

                {/* Day circle */}
                <button
                  type="button"
                  onClick={() => handleDayClick(day)}
                  className={`relative z-10 w-8.5 h-8.5 rounded-full flex items-center justify-center transition-all cursor-pointer ${
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
        </div>

        {/* Start Date & End Date Info Card matching Image 5 */}
        <div className="bg-[#F0F5FF] border border-blue-100/80 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
          <div className="flex-1">
            <span className="block text-[11px] font-semibold text-[#2F68FE]">Start Date</span>
            <span className="block text-sm font-bold text-[#1E293B] mt-0.5">{startFormatted}</span>
          </div>
          <div className="w-px h-8 bg-blue-200/80 mx-4" />
          <div className="flex-1 text-right">
            <span className="block text-[11px] font-semibold text-[#2F68FE]">End Date</span>
            <span className="block text-sm font-bold text-[#1E293B] mt-0.5">{endFormatted}</span>
          </div>
        </div>
      </div>

      {/* Bottom CTA Button */}
      <div className="p-5 pt-2 pb-8 border-t border-slate-100">
        <button
          type="button"
          onClick={handleApply}
          className="w-full h-12 bg-[#2F68FE] hover:bg-[#2558E6] active:bg-[#1D4ED8] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center"
        >
          Apply
        </button>
      </div>
    </BottomSheet>
  );
};
