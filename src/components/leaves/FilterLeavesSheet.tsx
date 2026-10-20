import React, { useState } from 'react';
import { X } from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet';
import { DateRangeFields } from '../common/DateRangeFields';
import { Dropdown } from '../../design-system/components/Dropdown';

interface FilterLeavesSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentStatus: string;
  onApply: (status: string, dateRangeStr: string) => void;
  onClear: () => void;
}

const statusOptions = ['All', 'Pending', 'Approved', 'Rejected'];
const formatDay = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export const FilterLeavesSheet: React.FC<FilterLeavesSheetProps> = ({
  isOpen,
  onClose,
  currentStatus,
  onApply,
  onClear,
}) => {
  const [status, setStatus] = useState<string>(currentStatus || 'All');
  const [start, setStart] = useState<Date | null>(null);
  const [end, setEnd] = useState<Date | null>(null);

  // Empty when no range is picked, so it doesn't count as an active filter
  const formattedDateRange = start ? `${formatDay(start)}  →  ${formatDay(end ?? start)}` : '';

  const handleApply = () => {
    onApply(status, formattedDateRange);
    onClose();
  };

  const handleClearAll = () => {
    setStatus('All');
    setStart(null);
    setEnd(null);
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

        {/* Date range (shared filter design); leaves can be in the future, so no max date */}
        <DateRangeFields
          start={start}
          end={end}
          onChange={(s, e) => {
            setStart(s);
            setEnd(e);
          }}
          resetKey={isOpen}
        />
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
