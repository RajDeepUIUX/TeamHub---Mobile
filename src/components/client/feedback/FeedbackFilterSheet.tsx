import React, { useEffect, useState } from 'react';
import { BottomSheet } from '../../common/BottomSheet';
import { MultiSelectDropdown } from '../../common/MultiSelectDropdown';
import { SheetHeader } from '../staff/tabs/StaffTabParts';

export interface FeedbackFilters {
  type: string[];
  staff: string[];
  period: string[];
}

export const EMPTY_FEEDBACK_FILTERS: FeedbackFilters = { type: [], staff: [], period: [] };

export const feedbackFilterCount = (f: FeedbackFilters) => f.type.length + f.staff.length + f.period.length;

type Key = keyof FeedbackFilters;

const FIELDS: { key: Key; label: string; placeholder: string }[] = [
  { key: 'type', label: 'Survey Type', placeholder: 'All survey types' },
  { key: 'staff', label: 'Staff Name', placeholder: 'All staff' },
  { key: 'period', label: 'Period', placeholder: 'All periods' },
];

/** Desktop filter bar (Survey Type, Staff Name, Period) → Search / Clear All */
export const FeedbackFilterSheet: React.FC<{
  isOpen: boolean;
  filters: FeedbackFilters;
  options: Record<Key, { value: string; label: string }[]>;
  onClose: () => void;
  onApply: (f: FeedbackFilters) => void;
}> = ({ isOpen, filters, options, onClose, onApply }) => {
  const [draft, setDraft] = useState<FeedbackFilters>(filters);

  useEffect(() => {
    if (isOpen) setDraft(filters);
  }, [isOpen, filters]);

  const count = feedbackFilterCount(draft);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[88%]">
      <SheetHeader title="Filter Surveys" subtitle="Pick one or more options in each filter" onClose={onClose} />
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-4 space-y-4">
        {FIELDS.map(({ key, label, placeholder }) => (
          <MultiSelectDropdown
            key={key}
            label={label}
            placeholder={placeholder}
            options={options[key]}
            selected={draft[key]}
            onChange={(next) => setDraft((d) => ({ ...d, [key]: next }))}
            searchable={options[key].length > 6}
            disabled={options[key].length === 0}
            disabledHint={`No ${label.toLowerCase()} yet`}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 p-4 pt-3 pb-6 border-t border-slate-100 shrink-0">
        <button
          type="button"
          onClick={() => onApply(EMPTY_FEEDBACK_FILTERS)}
          className="h-12 rounded-xl border border-[#2F68FE] text-[#2F68FE] text-xs font-bold bg-white active:bg-blue-50 cursor-pointer"
        >
          Clear All
        </button>
        <button
          type="button"
          onClick={() => onApply(draft)}
          className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] cursor-pointer"
        >
          {count ? `Apply Filters (${count})` : 'Apply Filters'}
        </button>
      </div>
    </BottomSheet>
  );
};
