import React, { useState, useEffect } from 'react';
import { X, Calendar } from 'lucide-react';
import { MONTH_NAMES, YEAR_OPTIONS } from '../../data/wfoData';
import { BottomSheet } from '../common/BottomSheet';
import { Dropdown } from '../../design-system/components/Dropdown';

interface FilterWFOSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMonth: string | null;
  selectedYear: number | null;
  onApply: (month: string | null, year: number | null) => void;
  onClear: () => void;
}

export const FilterWFOSheet: React.FC<FilterWFOSheetProps> = ({
  isOpen,
  onClose,
  selectedMonth,
  selectedYear,
  onApply,
  onClear,
}) => {
  const [month, setMonth] = useState<string>(selectedMonth || 'September');
  const [year, setYear] = useState<number>(selectedYear || 2026);

  useEffect(() => {
    if (selectedMonth) setMonth(selectedMonth);
    if (selectedYear) setYear(selectedYear);
  }, [selectedMonth, selectedYear, isOpen]);

  const handleApply = () => {
    onApply(month, year);
    onClose();
  };

  const handleClear = () => {
    onClear();
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[85vh]">
      {/* Drag Handle */}
      <div className="pt-3 pb-1 flex justify-center cursor-grab">
        <div className="w-10 h-1 bg-slate-300 rounded-full" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
        <h2 className="text-base font-bold text-[#1E293B]">
          Filter WFO Days
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

      {/* Body */}
      <div className="p-5 space-y-4">
        {/* Month Selector */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">
            Month
          </label>
          <Dropdown
            ariaLabel="Month"
            icon={<Calendar className="w-4 h-4" />}
            value={month}
            options={MONTH_NAMES}
            onChange={setMonth}
          />
        </div>

        {/* Year Selector */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">
            Year
          </label>
          <Dropdown
            ariaLabel="Year"
            icon={<Calendar className="w-4 h-4" />}
            value={year}
            options={YEAR_OPTIONS}
            onChange={setYear}
          />
        </div>
      </div>

      {/* Bottom Actions: Clear All & Apply Filters */}
      <div className="grid grid-cols-2 gap-3 p-5 pt-2 pb-8 border-t border-slate-100">
        <button
          type="button"
          onClick={handleClear}
          className="h-12 rounded-xl border border-[#2F68FE] text-[#2F68FE] font-bold text-xs bg-white hover:bg-blue-50/50 active:bg-blue-100 transition-colors cursor-pointer"
        >
          Clear All
        </button>
        <button
          type="button"
          onClick={handleApply}
          className="h-12 rounded-xl bg-[#2F68FE] text-white font-bold text-xs shadow-xs hover:bg-[#2558E6] active:bg-[#1D4ED8] transition-colors cursor-pointer"
        >
          Apply Filters
        </button>
      </div>
    </BottomSheet>
  );
};
