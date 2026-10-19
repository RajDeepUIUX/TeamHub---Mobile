import React, { useEffect, useState } from 'react';
import { BottomSheet } from '../../common/BottomSheet';
import { MultiSelectDropdown } from '../../common/MultiSelectDropdown';
import { SheetHeader } from '../staff/tabs/StaffTabParts';
import { CandidateFilters, EMPTY_CANDIDATE_FILTERS, candidateFilterCount } from '../data/clientInterviewsData';

interface Props {
  isOpen: boolean;
  filters: CandidateFilters;
  profiles: string[];
  domains: string[];
  onClose: () => void;
  onApply: (filters: CandidateFilters) => void;
}

/** Desktop "Search By Profile" as a multi-select (+ Domain, added by designer); Resume ID is the list search; Search / Clear All */
export const InterviewFilterSheet: React.FC<Props> = ({ isOpen, filters, profiles, domains, onClose, onApply }) => {
  const [draft, setDraft] = useState<CandidateFilters>(filters);

  useEffect(() => {
    if (isOpen) setDraft(filters);
  }, [isOpen, filters]);

  const count = candidateFilterCount(draft);
  const asOptions = (items: string[]) => items.map((v) => ({ value: v, label: v }));

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[80%]">
      <SheetHeader title="Filter Candidates" subtitle="Profile and domain" onClose={onClose} />

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-4 space-y-4">
        <MultiSelectDropdown
          label="Profile"
          placeholder="All profiles"
          options={asOptions(profiles)}
          selected={draft.profiles}
          onChange={(next) => setDraft((d) => ({ ...d, profiles: next }))}
          searchable
          disabled={profiles.length === 0}
          disabledHint="No candidates yet"
        />
        <MultiSelectDropdown
          label="Domain"
          placeholder="All domains"
          options={asOptions(domains)}
          selected={draft.domains}
          onChange={(next) => setDraft((d) => ({ ...d, domains: next }))}
          disabled={domains.length === 0}
          disabledHint="No candidates yet"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 pt-3 pb-6 border-t border-slate-100 shrink-0">
        <button
          type="button"
          onClick={() => onApply(EMPTY_CANDIDATE_FILTERS)}
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
