import React, { useEffect, useState } from 'react';
import { CalendarDays, X } from 'lucide-react';
import { BottomSheet } from '../../common/BottomSheet';
import { DatePickerSheet } from '../../common/DatePickerSheet';
import { MultiSelectDropdown } from '../../common/MultiSelectDropdown';
import { SheetHeader, fieldInputClass } from '../staff/tabs/StaffTabParts';
import { formatShortDate } from '../data/clientInterviewsData';
import {
  EMPTY_REQUIREMENT_FILTERS,
  OFFSHORE_LOCATIONS,
  REQUIREMENT_STATUSES,
  RequirementFilters,
  RequirementStatus,
  requirementFilterCount,
} from '../data/clientRequirementsData';

interface Props {
  isOpen: boolean;
  filters: RequirementFilters;
  profiles: string[];
  onClose: () => void;
  onApply: (filters: RequirementFilters) => void;
}

const asOptions = (items: string[]) => items.map((v) => ({ value: v, label: v }));

/** Desktop filters: Tentative Date, Select Profile, Select Location (multi), Select Status (multi); Search / Clear All */
export const RequirementFilterSheet: React.FC<Props> = ({ isOpen, filters, profiles, onClose, onApply }) => {
  const [draft, setDraft] = useState<RequirementFilters>(filters);
  const [dateOpen, setDateOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDraft(filters);
      setDateOpen(false);
    }
  }, [isOpen, filters]);

  const count = requirementFilterCount(draft);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[85%]">
      <SheetHeader title="Filter Requirements" subtitle="Date, profile, location and status" onClose={onClose} />

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-4 space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#1E293B]">Tentative Date</span>
            {draft.date && (
              <button type="button" onClick={() => setDraft((d) => ({ ...d, date: '' }))} className="text-[11px] font-semibold text-[#2F68FE] cursor-pointer">
                Clear
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setDateOpen(true)}
            aria-label="Tentative Date"
            className={`${fieldInputClass()} flex items-center justify-between gap-2 text-left cursor-pointer`}
          >
            <span className={`truncate ${draft.date ? 'font-semibold' : 'text-slate-400'}`}>{draft.date ? formatShortDate(draft.date) : 'Select date'}</span>
            <CalendarDays className="w-4 h-4 text-slate-400 shrink-0" />
          </button>
        </div>
        <DatePickerSheet
          isOpen={dateOpen}
          mode="single"
          title="Tentative Date"
          start={draft.date || null}
          onClose={() => setDateOpen(false)}
          onApply={(iso) => {
            setDraft((d) => ({ ...d, date: iso }));
            setDateOpen(false);
          }}
        />

        <MultiSelectDropdown
          label="Profile"
          placeholder="All profiles"
          options={asOptions(profiles)}
          selected={draft.profiles}
          onChange={(next) => setDraft((d) => ({ ...d, profiles: next }))}
          searchable
        />
        <MultiSelectDropdown
          label="Offshore Location"
          placeholder="All locations"
          options={asOptions(OFFSHORE_LOCATIONS)}
          selected={draft.locations}
          onChange={(next) => setDraft((d) => ({ ...d, locations: next }))}
        />
        <MultiSelectDropdown
          label="Status"
          placeholder="Select status"
          options={asOptions(REQUIREMENT_STATUSES)}
          selected={draft.statuses}
          onChange={(next) => setDraft((d) => ({ ...d, statuses: next as RequirementStatus[] }))}
        />
        {draft.statuses.length === 0 && (
          <p className="-mt-2 flex items-center gap-1 text-[11px] text-slate-400">
            <X className="w-3 h-3" /> No status selected shows every requirement.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 pt-3 pb-6 border-t border-slate-100 shrink-0">
        <button
          type="button"
          onClick={() => onApply(EMPTY_REQUIREMENT_FILTERS)}
          className="h-12 rounded-xl border border-[#2F68FE] text-[#2F68FE] text-xs font-bold bg-white active:bg-blue-50 cursor-pointer"
        >
          Clear All
        </button>
        <button type="button" onClick={() => onApply(draft)} className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] cursor-pointer">
          {count ? `Apply Filters (${count})` : 'Apply Filters'}
        </button>
      </div>
    </BottomSheet>
  );
};
