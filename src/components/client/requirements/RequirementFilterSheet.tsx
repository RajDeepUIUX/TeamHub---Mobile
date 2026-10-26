import React, { useEffect, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { BottomSheet } from '../../common/BottomSheet';
import { DatePickerSheet } from '../../common/DatePickerSheet';
import { MultiSelectDropdown } from '../../common/MultiSelectDropdown';
import { SheetHeader } from '../staff/tabs/StaffTabParts';
import { formatShortDate } from '../data/clientInterviewsData';
import {
  EMPTY_REQUIREMENT_FILTERS,
  OFFSHORE_LOCATIONS,
  REQUIREMENT_STATUSES,
  RequirementFilters,
  RequirementStatus,
} from '../data/clientRequirementsData';

interface Props {
  isOpen: boolean;
  filters: RequirementFilters;
  profiles: string[];
  onClose: () => void;
  onApply: (filters: RequirementFilters) => void;
}

const asOptions = (items: string[]) => items.map((v) => ({ value: v, label: v }));

/** Desktop filter bar in a bottom drawer: Tentative Date, Select Profile, Select Location, status; Search / Clear All */
export const RequirementFilterSheet: React.FC<Props> = ({ isOpen, filters, profiles, onClose, onApply }) => {
  const [draft, setDraft] = useState<RequirementFilters>(filters);
  const [dateOpen, setDateOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDraft(filters);
      setDateOpen(false);
    }
  }, [isOpen, filters]);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[85%]">
      <SheetHeader title="Filter" subtitle="Staff Requirement" onClose={onClose} />

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
            className={`w-full h-11 px-3 rounded-xl border bg-white flex items-center gap-2 text-left text-xs shadow-2xs transition-colors cursor-pointer ${
              dateOpen ? 'border-[#2F68FE] ring-4 ring-blue-50' : 'border-slate-200'
            }`}
          >
            <CalendarDays className="w-4 h-4 text-[#2F68FE] shrink-0" />
            <span className={`flex-1 truncate ${draft.date ? 'font-semibold text-[#1E293B]' : 'font-medium text-slate-400'}`}>
              {draft.date ? formatShortDate(draft.date) : 'Tentative Date'}
            </span>
          </button>
        </div>

        <MultiSelectDropdown
          label="Profile"
          placeholder="Select Profile"
          options={asOptions(profiles)}
          selected={draft.profiles}
          onChange={(next) => setDraft((d) => ({ ...d, profiles: next }))}
          searchable
        />
        <MultiSelectDropdown
          label="Location"
          placeholder="Select Location"
          options={asOptions(OFFSHORE_LOCATIONS)}
          selected={draft.locations}
          onChange={(next) => setDraft((d) => ({ ...d, locations: next }))}
        />
        <MultiSelectDropdown
          label="Status"
          placeholder="Select Status"
          options={asOptions(REQUIREMENT_STATUSES)}
          selected={draft.statuses}
          onChange={(next) => setDraft((d) => ({ ...d, statuses: next as RequirementStatus[] }))}
        />
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
          Search
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
    </BottomSheet>
  );
};
