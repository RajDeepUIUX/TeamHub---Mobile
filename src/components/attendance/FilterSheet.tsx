import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet';
import { Dropdown } from '../../design-system/components/Dropdown';
import { DateRangeFields } from '../common/DateRangeFields';
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
  const [fromDate, setFromDate] = useState<Date | null>(currentFrom);
  const [toDate, setToDate] = useState<Date | null>(currentTo);

  // Re-sync with the applied filters each time the sheet opens
  useEffect(() => {
    if (isOpen) {
      setSelectedStatus(currentStatus || 'All');
      setFromDate(currentFrom);
      setToDate(currentTo);
    }
  }, [isOpen, currentStatus, currentFrom, currentTo]);

  const handleApply = () => {
    const from = fromDate ?? defaultRange.from;
    onApply(selectedStatus, selectedWorkMode, from, toDate ?? from);
    onClose();
  };

  const handleClear = () => {
    setSelectedStatus('All');
    setSelectedWorkMode('Office');
    onApply('All', 'Office', defaultRange.from, defaultRange.to);
    onClose();
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
          {/* Section 1: Date range (shared filter design) */}
          <DateRangeFields
            start={fromDate}
            end={toDate}
            onChange={(s, e) => {
              setFromDate(s);
              setToDate(e);
            }}
            maxDate={new Date()}
            resetKey={isOpen}
          />

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
