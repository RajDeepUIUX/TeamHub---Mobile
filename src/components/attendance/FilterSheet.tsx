import React, { useEffect, useState } from 'react';
import { X, Calendar, ChevronDown } from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet';
import { Dropdown } from '../../design-system/components/Dropdown';
import { RangeCalendar, formatShortDate } from '../../design-system/components/RangeCalendar';
import { currentAttendanceCycle } from '../../data/attendanceMonths';

/** The 26th → today (recomputed each time it's used) */
export const DEFAULT_ATTENDANCE_RANGE = currentAttendanceCycle();

interface FilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentStatus: string;
  currentFrom: Date;
  currentTo: Date;
  /** Range restored by "Clear All" (the selected month's cycle) */
  defaultRange?: { from: Date; to: Date };
  onApply: (status: string, workMode: string, from: Date, to: Date) => void;
}

export const FilterSheet: React.FC<FilterSheetProps> = ({
  isOpen,
  onClose,
  currentStatus,
  currentFrom,
  currentTo,
  defaultRange = DEFAULT_ATTENDANCE_RANGE,
  onApply,
}) => {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus || 'All');
  const [selectedWorkMode, setSelectedWorkMode] = useState('Office');
  const [fromDate, setFromDate] = useState<Date>(currentFrom);
  const [toDate, setToDate] = useState<Date | null>(currentTo);
  const [activeDateField, setActiveDateField] = useState<'start' | 'end' | null>(null);

  // Re-sync with the applied filters each time the sheet opens
  useEffect(() => {
    if (isOpen) {
      setSelectedStatus(currentStatus || 'All');
      setFromDate(currentFrom);
      setToDate(currentTo);
      setActiveDateField(null);
    }
  }, [isOpen, currentStatus, currentFrom, currentTo]);

  const handleDaySelect = (day: Date) => {
    if (activeDateField === 'start') {
      setFromDate(day);
      if (toDate && day > toDate) setToDate(null);
      setActiveDateField('end');
    } else if (activeDateField === 'end') {
      if (day < fromDate) {
        // Tapped before the start: treat it as a new start date
        setFromDate(day);
        setToDate(null);
      } else {
        setToDate(day);
        setActiveDateField(null);
      }
    }
  };

  const handleApply = () => {
    onApply(selectedStatus, selectedWorkMode, fromDate, toDate ?? fromDate);
    onClose();
  };

  const handleClear = () => {
    setSelectedStatus('All');
    setSelectedWorkMode('Office');
    onApply('All', 'Office', defaultRange.from, defaultRange.to);
    onClose();
  };

  const dateField = (field: 'start' | 'end', label: string, value: Date | null) => {
    const isActive = activeDateField === field;
    return (
      <div>
        <span className="text-slate-500 block mb-1 font-medium">{label}</span>
        <button
          type="button"
          onClick={() => setActiveDateField(isActive ? null : field)}
          className={`w-full h-11 px-3 rounded-xl border bg-white flex items-center justify-between font-medium transition-all cursor-pointer shadow-2xs ${
            isActive
              ? 'border-[#2F68FE] ring-4 ring-blue-50'
              : 'border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Calendar className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#2F68FE]' : 'text-slate-400'}`} />
            <span className={`truncate ${value ? 'text-slate-700 font-semibold' : 'text-slate-400'}`}>
              {value ? formatShortDate(value) : 'Select date'}
            </span>
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
              isActive ? 'rotate-180 text-[#2F68FE]' : 'text-slate-400'
            }`}
          />
        </button>
      </div>
    );
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[90vh]">
      {/* Drag Handle */}
      <div className="pt-3 pb-1 flex justify-center cursor-grab">
        <div className="w-10 h-1 bg-slate-300 rounded-full" />
      </div>

      {/* Sheet Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
        <h2 className="text-lg font-bold text-[#1E293B]">
          Filter Attendance
        </h2>
        <button
          onClick={onClose}
          type="button"
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

        {/* Filter Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 no-scrollbar">
          {/* Section 1: Date Range */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-[#1E293B]">
              Date Range
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {dateField('start', 'From', fromDate)}
              {dateField('end', 'To', toDate)}
            </div>

            {activeDateField && (
              <div className="pt-1 space-y-2">
                <p className="text-[11px] text-slate-500 font-medium px-0.5">
                  {activeDateField === 'start' ? 'Select a start date' : 'Select an end date'}
                </p>
                <RangeCalendar
                  key={activeDateField}
                  start={fromDate}
                  end={toDate}
                  activeField={activeDateField}
                  onSelect={handleDaySelect}
                  maxDate={new Date()}
                />
              </div>
            )}
          </div>

          {/* Section 2: Status */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-[#1E293B]">Status</h3>
            <Dropdown
              size="md"
              ariaLabel="Status"
              value={selectedStatus}
              options={['All', 'Full Day', 'Half Day', 'Absent', 'WO']}
              onChange={setSelectedStatus}
            />
          </div>

          {/* Section 3: Work Mode */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-[#1E293B]">Work Mode</h3>
            <Dropdown
              size="md"
              ariaLabel="Work mode"
              value={selectedWorkMode}
              options={['Office', 'WFH', 'Hybrid']}
              onChange={setSelectedWorkMode}
            />
          </div>
        </div>

        {/* Bottom Actions: Clear All & Apply Filters */}
        <div className="grid grid-cols-2 gap-2.5 p-4 pt-2 pb-8 border-t border-slate-100">
          <button
            type="button"
            onClick={handleClear}
            className="h-12 rounded-xl border border-[#2F68FE] text-[#2F68FE] font-semibold text-xs bg-white active:bg-blue-100 transition-colors"
          >
            Clear All
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="h-12 rounded-xl bg-[#2F68FE] text-white font-semibold text-xs shadow-xs active:bg-[#1D4ED8] transition-colors flex items-center justify-center cursor-pointer"
          >
            Apply Filters
          </button>
        </div>
    </BottomSheet>
  );
};
