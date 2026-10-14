import React, { useEffect, useState } from 'react';
import { X, Filter, Users, ChevronRight } from 'lucide-react';
import { BottomSheet } from './BottomSheet';
import { MultiSelectDropdown } from './MultiSelectDropdown';
import { ChoiceTiles } from './ChoiceTiles';

export interface FilterSection {
  id: string;
  label: string;
  options: string[];
}

/** Selected values per section id; an empty/missing list means "any" */
export type FilterSelection = Record<string, string[]>;

export const activeFilterCount = (selection: FilterSelection) =>
  Object.values(selection).reduce((n, values) => n + values.length, 0);

/** True when a record passes every section that has selections */
export const matchesFilters = (selection: FilterSelection, valuesById: Record<string, string>) =>
  Object.entries(selection).every(([id, selected]) => selected.length === 0 || selected.includes(valuesById[id]));

/* ------------------------------ Trigger icon ------------------------------ */

/** The one filter button used on every screen (44px, funnel icon, count badge when filters are on) */
export const FilterIconButton: React.FC<{ count: number; onClick: () => void; label?: string }> = ({ count, onClick, label = 'Filters' }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={count ? `${label} (${count} applied)` : label}
    className={`relative w-11 h-11 rounded-xl border flex items-center justify-center shadow-2xs transition-colors shrink-0 cursor-pointer ${
      count ? 'bg-blue-50 border-[#2F68FE] text-[#2F68FE]' : 'bg-white border-slate-200 text-[#2F68FE] active:bg-slate-50'
    }`}
  >
    <Filter className="w-4.5 h-4.5 stroke-[1.9]" />
    {count > 0 && (
      <span className="absolute -top-1.5 -right-1.5 min-w-4.5 h-4.5 px-1 rounded-full bg-[#2F68FE] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-[#F8FAFC]">
        {count}
      </span>
    )}
  </button>
);

/* ------------------------------- Top filter bar ------------------------------- */

/** Full-width filter row shown above the KPIs (mirrors the staff date + filter row) */
export const TeamFilterBar: React.FC<{ selection: FilterSelection; placeholder: string; onClick: () => void }> = ({
  selection,
  placeholder,
  onClick,
}) => {
  const values = Object.values(selection).flat();
  const count = values.length;
  const summary = count === 0 ? placeholder : values.length > 2 ? `${values.slice(0, 2).join(', ')} +${values.length - 2}` : values.join(', ');
  return (
    <div className="flex items-center gap-2.5">
      <button
        type="button"
        onClick={onClick}
        className="flex-1 min-w-0 h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 flex items-center justify-between gap-2 shadow-2xs active:bg-slate-50 transition-colors cursor-pointer"
      >
        <span className="flex items-center gap-2 min-w-0">
          <Users className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="truncate">{summary}</span>
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      </button>
      <FilterIconButton count={count} onClick={onClick} />
    </div>
  );
};

/* ---------------------------------- Sheet --------------------------------- */

interface TeamFilterSheetProps {
  isOpen: boolean;
  title: string;
  sections: FilterSection[];
  selection: FilterSelection;
  onClose: () => void;
  onApply: (selection: FilterSelection) => void;
}

/** Multi-select chip filters for a manager's team list; changes apply on "Apply Filters" */
export const TeamFilterSheet: React.FC<TeamFilterSheetProps> = ({ isOpen, title, sections, selection, onClose, onApply }) => {
  const [draft, setDraft] = useState<FilterSelection>(selection);

  useEffect(() => {
    if (isOpen) setDraft(selection);
  }, [isOpen, selection]);

  const draftCount = activeFilterCount(draft);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[85%]">
      <div className="pt-3 pb-1 flex justify-center shrink-0">
        <div className="w-10 h-1 bg-slate-300 rounded-full" />
      </div>
      <div className="flex items-center justify-between px-5 pt-1 pb-3 border-b border-slate-100 shrink-0">
        <div>
          <h2 className="text-base font-bold text-[#1E293B]">{title}</h2>
          <p className="text-[11px] text-slate-400">Pick one or more options in each filter</p>
        </div>
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
        {sections.map((section) => {
          const selected = draft[section.id] ?? [];
          const setSelected = (next: string[]) => setDraft((prev) => ({ ...prev, [section.id]: next }));
          // Two options: side-by-side tiles; more: a multi-select dropdown (no chips)
          return section.options.length <= 2 ? (
            <div key={section.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1E293B]">{section.label}</span>
                {selected.length > 0 && (
                  <button type="button" onClick={() => setSelected([])} className="text-[11px] font-semibold text-[#2F68FE] cursor-pointer">
                    Clear
                  </button>
                )}
              </div>
              <ChoiceTiles options={section.options} selected={selected} onChange={setSelected} />
            </div>
          ) : (
            <MultiSelectDropdown
              key={section.id}
              label={section.label}
              placeholder={`All ${section.label.toLowerCase()}`}
              options={section.options.map((o) => ({ value: o, label: o }))}
              selected={selected}
              onChange={setSelected}
              searchable={section.options.length > 6}
            />
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 pt-3 pb-6 border-t border-slate-100 shrink-0">
        <button
          type="button"
          onClick={() => onApply({})}
          className="h-12 rounded-xl border border-[#2F68FE] text-[#2F68FE] text-xs font-bold bg-white active:bg-blue-50 cursor-pointer"
        >
          Clear All
        </button>
        <button
          type="button"
          onClick={() => onApply(draft)}
          className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] cursor-pointer"
        >
          {draftCount ? `Apply Filters (${draftCount})` : 'Apply Filters'}
        </button>
      </div>
    </BottomSheet>
  );
};
