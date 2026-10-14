import React, { useEffect, useState } from 'react';
import { ArrowLeft, Search, X, FileText, ExternalLink } from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet';
import { FilterIconButton } from '../common/TeamFilterSheet';
import { Dropdown } from '../../design-system/components/Dropdown';
import { POLICIES, POLICY_CATEGORIES, POLICY_YEARS, Policy, PolicyCategory } from '../../data/policiesData';

const CURRENT_YEAR = new Date().getFullYear();
const DEFAULT_YEAR = POLICY_YEARS.includes(CURRENT_YEAR) ? CURRENT_YEAR : POLICY_YEARS[0];

interface Filters {
  year: number | null;
  category: PolicyCategory | null;
}

/** Year (chips) + Category (searchable dropdown), like the web filters */
const PolicyFilterSheet: React.FC<{ isOpen: boolean; filters: Filters; onClose: () => void; onApply: (f: Filters) => void }> = ({
  isOpen,
  filters,
  onClose,
  onApply,
}) => {
  const [draft, setDraft] = useState<Filters>(filters);
  useEffect(() => {
    if (isOpen) setDraft(filters);
  }, [isOpen, filters]);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[80%]">
      <div className="pt-3 pb-1 flex justify-center shrink-0">
        <div className="w-10 h-1 bg-slate-300 rounded-full" />
      </div>
      <div className="flex items-center justify-between px-5 pt-1 pb-3 border-b border-slate-100 shrink-0">
        <h2 className="text-base font-bold text-[#1E293B]">Filter Policies</h2>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-4 space-y-5">
        <div className="space-y-2">
          <span className="block text-xs font-bold text-[#1E293B]">Year</span>
          <Dropdown
            size="md"
            ariaLabel="Year"
            value={draft.year === null ? 'All years' : String(draft.year)}
            options={['All years', ...POLICY_YEARS.map(String)]}
            onChange={(v) => setDraft({ ...draft, year: v === 'All years' ? null : Number(v) })}
          />
        </div>
        <div className="space-y-2">
          <span className="block text-xs font-bold text-[#1E293B]">Category</span>
          <Dropdown
            size="md"
            ariaLabel="Category"
            sheetTitle="Select Category"
            value={draft.category}
            placeholder="All categories"
            options={POLICY_CATEGORIES}
            onChange={(v) => setDraft({ ...draft, category: v })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 p-4 pt-3 pb-6 border-t border-slate-100 shrink-0">
        <button
          type="button"
          onClick={() => onApply({ year: DEFAULT_YEAR, category: null })}
          className="h-12 rounded-xl border border-[#2F68FE] text-[#2F68FE] text-xs font-bold bg-white active:bg-blue-50 cursor-pointer"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={() => onApply(draft)}
          className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] cursor-pointer"
        >
          Apply Filters
        </button>
      </div>
    </BottomSheet>
  );
};

/** Policies & Guidelines: search, Year / Category filters, and View opens the document in the browser */
export const PoliciesView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Filters>({ year: DEFAULT_YEAR, category: null });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const q = query.trim().toLowerCase();
  const visible = POLICIES.filter(
    (x) =>
      (!q || x.title.toLowerCase().includes(q)) &&
      (filters.year === null || x.year === filters.year) &&
      (!filters.category || x.category === filters.category)
  );
  // The default year doesn't count as an active filter
  const filterCount = (filters.year !== DEFAULT_YEAR ? 1 : 0) + (filters.category ? 1 : 0);
  const openFile = (x: Policy) => window.open(x.fileUrl, '_blank', 'noopener,noreferrer');

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      <header className="shrink-0 bg-white border-b border-[#EBF0F7]">
        <div className="flex items-center h-14 px-4 relative">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-[#1E293B] active:bg-slate-100 cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
          <div className="screen-title">
            <h1 className="text-base font-bold leading-tight">Policies &amp; Guidelines</h1>
            <p className="text-[10.5px] text-slate-400">Access and stay updated on company policies</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-3.5 pb-8 space-y-3.5">
        {/* Search + filters */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search policy title..."
              className="w-full h-11 pl-10 pr-9 bg-white border border-slate-200 rounded-xl text-xs font-medium text-[#1E293B] placeholder:text-slate-400 shadow-2xs focus:outline-hidden focus:border-[#2F68FE] focus:ring-4 focus:ring-blue-50 select-text"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <FilterIconButton count={filterCount} onClick={() => setIsFilterOpen(true)} label="Filter policies" />
        </div>

        {/* Count + active filters */}
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-[#1E293B]">Policies</span>
            <span className="px-2 py-0.5 text-[11px] font-bold bg-[#EFF6FF] text-[#2F68FE] rounded-full tabular-nums">{visible.length}</span>
          </div>
          <span className="text-[11px] text-slate-400 truncate">
            {filters.year ?? 'All years'}
            {filters.category ? ` · ${filters.category}` : ''}
          </span>
        </div>

        {visible.length > 0 ? (
          <div className="bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs overflow-hidden">
            {visible.map((x, idx) => (
              <button
                key={x.id}
                type="button"
                onClick={() => openFile(x)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 text-left active:bg-slate-50 transition-colors cursor-pointer ${
                  idx < visible.length - 1 ? 'border-b border-slate-100' : ''
                }`}
              >
                <span className="w-9 h-9 rounded-xl bg-blue-50 text-[#2F68FE] flex items-center justify-center shrink-0">
                  <FileText className="w-4.5 h-4.5" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[12.5px] font-semibold text-[#1E293B] leading-snug line-clamp-2">{x.title}</span>
                  <span className="block mt-0.5 text-[11px] text-slate-400 truncate">{x.category}</span>
                </span>
                <span className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg bg-[#EFF6FF] text-[#2F68FE] text-[11px] font-bold shrink-0">
                  View
                  <ExternalLink className="w-3.5 h-3.5" />
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center text-center">
            <span className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </span>
            <p className="mt-3 text-sm font-bold text-[#1E293B]">No policies match</p>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setFilters({ year: DEFAULT_YEAR, category: null });
              }}
              className="mt-1 text-xs font-semibold text-[#2F68FE] cursor-pointer"
            >
              Clear search & filters
            </button>
          </div>
        )}
      </div>

      <PolicyFilterSheet
        isOpen={isFilterOpen}
        filters={filters}
        onClose={() => setIsFilterOpen(false)}
        onApply={(f) => {
          setFilters(f);
          setIsFilterOpen(false);
        }}
      />
    </div>
  );
};
