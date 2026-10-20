import React, { useEffect, useState } from 'react';
import { Hash, Search, UserRound } from 'lucide-react';
import { BottomSheet } from '../../common/BottomSheet';
import { SheetHeader } from '../staff/tabs/StaffTabParts';
import { CandidateFilters, EMPTY_CANDIDATE_FILTERS, candidateFilterCount } from '../data/clientInterviewsData';

interface Props {
  isOpen: boolean;
  filters: CandidateFilters;
  /** Profile suggestions for "Search By Profile" */
  profiles: string[];
  onClose: () => void;
  onApply: (filters: CandidateFilters) => void;
}

const INPUT =
  'w-full h-12 pl-10 pr-3 rounded-xl border border-[#DCE3ED] bg-[#F8FAFC] text-[13px] text-[#1E293B] placeholder:text-slate-400 outline-none focus:bg-white focus:border-[#2F68FE] focus:ring-2 focus:ring-[#2F68FE]/15 transition-colors';

/** Desktop search row (Search By Resume ID, Search By Profile, Search / Clear All) as a bottom drawer */
export const InterviewFilterSheet: React.FC<Props> = ({ isOpen, filters, profiles, onClose, onApply }) => {
  const [draft, setDraft] = useState<CandidateFilters>(filters);

  useEffect(() => {
    if (isOpen) setDraft(filters);
  }, [isOpen, filters]);

  const count = candidateFilterCount(draft);
  const field = (key: keyof CandidateFilters, label: string, placeholder: string, Icon: React.ElementType, list?: string) => (
    <label className="block">
      <span className="block mb-1.5 text-[12px] font-semibold text-slate-600">{label}</span>
      <span className="relative block">
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden="true" />
        <input
          type="search"
          list={list}
          value={draft[key]}
          onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
          placeholder={placeholder}
          className={INPUT}
        />
      </span>
    </label>
  );

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[80%]">
      <SheetHeader title="Filter Candidates" subtitle="Search by resume ID or profile" onClose={onClose} />

      <form
        className="flex-1 min-h-0 flex flex-col"
        onSubmit={(e) => {
          e.preventDefault();
          onApply(draft);
        }}
      >
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-4 space-y-4">
          {field('resumeId', 'Resume ID', 'Search By Resume ID', Hash)}
          {field('profile', 'Profile', 'Search By Profile', UserRound, 'shortlisted-profiles')}
          <datalist id="shortlisted-profiles">
            {profiles.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
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
            type="submit"
            className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-1.5 active:bg-[#1D4ED8] cursor-pointer"
          >
            <Search className="w-4 h-4" aria-hidden="true" />
            {count ? `Search (${count})` : 'Search'}
          </button>
        </div>
      </form>
    </BottomSheet>
  );
};
