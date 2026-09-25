import React, { useEffect, useState } from 'react';
import { X, Calendar, ChevronDown } from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet';
import { RangeCalendar, formatShortDate } from '../../design-system/components/RangeCalendar';

export const DEFAULT_ATTENDANCE_RANGE = {
  from: new Date(2026, 7, 26),
  to: new Date(2026, 8, 23),
};

interface FilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentStatus: string;
  currentFrom: Date;
  currentTo: Date;
  onApply: (status: string, workMode: string, from: Date, to: Date) => void;
}

export const FilterSheet: React.FC<FilterSheetProps> = ({
  isOpen,
  onClose,
  currentStatus,
  currentFrom,
  currentTo,
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
    onApply('All', 'Office', DEFAULT_ATTENDANCE_RANGE.from, DEFAULT_ATTENDANCE_RANGE.to);
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
              : 'border-slate-200 hover:border-slate-300'
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
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
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
                />
              </div>
            )}
          </div>

          {/* Section 2: Status */}
          <div className="space-y-2.5">
            <h3 className="text-sm font-bold text-[#1E293B]">
              Status
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              {/* All */}
              <button
                type="button"
                onClick={() => setSelectedStatus('All')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  selectedStatus === 'All'
                    ? 'bg-[#1E293B] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All
              </button>

              {/* Full Day */}
              <button
                type="button"
                onClick={() => setSelectedStatus('Full Day')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  selectedStatus === 'Full Day'
                    ? 'bg-[#10B981] text-white shadow-2xs'
                    : 'bg-[#E8F8F0] text-[#10B981] hover:bg-[#D8F2E4]'
                }`}
              >
                Full Day
              </button>

              {/* Half Day */}
              <button
                type="button"
                onClick={() => setSelectedStatus('Half Day')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  selectedStatus === 'Half Day'
                    ? 'border-2 border-[#F59E0B] bg-[#FFF9EC] text-[#D97706] shadow-2xs'
                    : 'border border-[#F59E0B]/40 bg-[#FFF9EC] text-[#D97706]'
                }`}
              >
                Half Day
              </button>

              {/* Absent */}
              <button
                type="button"
                onClick={() => setSelectedStatus('Absent')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  selectedStatus === 'Absent'
                    ? 'bg-[#F43F5E] text-white shadow-2xs'
                    : 'bg-[#FDECEC] text-[#F34D59] hover:bg-[#FCD8D8]'
                }`}
              >
                Absent
              </button>

              {/* WO */}
              <button
                type="button"
                onClick={() => setSelectedStatus('WO')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  selectedStatus === 'WO'
                    ? 'bg-[#D97706] text-white shadow-2xs'
                    : 'bg-[#FEF8E7] text-[#D97706]'
                }`}
              >
                WO
              </button>
            </div>
          </div>

          {/* Section 3: Work Mode */}
          <div className="space-y-2.5">
            <h3 className="text-sm font-bold text-[#1E293B]">
              Work Mode
            </h3>
            <div className="flex items-center gap-2">
              {['Office', 'WFH', 'Hybrid'].map((mode) => {
                const isActive = selectedWorkMode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setSelectedWorkMode(mode)}
                    className={`flex-1 h-11 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'border-2 border-[#2F68FE] bg-white text-[#2F68FE] shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {mode}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Actions: Clear All & Apply Filters */}
        <div className="grid grid-cols-2 gap-2.5 p-4 pt-2 pb-8 border-t border-slate-100">
          <button
            type="button"
            onClick={handleClear}
            className="h-12 rounded-xl border border-[#2F68FE] text-[#2F68FE] font-semibold text-xs bg-white hover:bg-blue-50/50 active:bg-blue-100 transition-colors"
          >
            Clear All
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="h-12 rounded-xl bg-[#2F68FE] text-white font-semibold text-xs shadow-xs hover:bg-[#2558E6] active:bg-[#1D4ED8] transition-colors flex items-center justify-center cursor-pointer"
          >
            Apply Filters
          </button>
        </div>
    </BottomSheet>
  );
};
