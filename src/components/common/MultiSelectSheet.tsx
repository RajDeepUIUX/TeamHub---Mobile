import React, { useEffect, useState } from 'react';
import { Check, Search, X } from 'lucide-react';
import { BottomSheet } from './BottomSheet';

export interface MultiSelectOption {
  value: string;
  label: string;
  /** Small tag shown next to the label (e.g. a software category) */
  badge?: string;
}

interface MultiSelectSheetProps {
  isOpen: boolean;
  title: string;
  options: MultiSelectOption[];
  selected: string[];
  searchPlaceholder?: string;
  /** Adds a "Select all" row above the options */
  showSelectAll?: boolean;
  onClose: () => void;
  onApply: (selected: string[]) => void;
}

/** Searchable checklist in a bottom sheet; changes apply on Done */
export const MultiSelectSheet: React.FC<MultiSelectSheetProps> = ({
  isOpen,
  title,
  options,
  selected,
  searchPlaceholder = 'Search…',
  showSelectAll = false,
  onClose,
  onApply,
}) => {
  const [draft, setDraft] = useState<string[]>(selected);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setDraft(selected);
    setQuery('');
    // Re-seed each time the sheet opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const q = query.trim().toLowerCase();
  const shown = q ? options.filter((o) => `${o.label} ${o.badge ?? ''}`.toLowerCase().includes(q)) : options;
  const toggle = (v: string) => setDraft((d) => (d.includes(v) ? d.filter((x) => x !== v) : [...d, v]));

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[85%]">
      <div className="pt-3 pb-1 flex justify-center shrink-0">
        <div className="w-10 h-1 bg-slate-300 rounded-full" />
      </div>
      <div className="flex items-center justify-between px-5 pt-1 pb-3 shrink-0">
        <div>
          <h2 className="text-base font-bold text-[#1E293B]">{title}</h2>
          <p className="text-[11px] text-slate-400">{draft.length ? `${draft.length} selected` : 'Tap to select one or more'}</p>
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
      <div className="px-4 pb-2 shrink-0">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={`Search ${title}`}
            className="w-full h-11 pl-10 pr-9 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-medium text-[#1E293B] placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:border-[#2F68FE] focus:ring-4 focus:ring-blue-50 select-text [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div role="listbox" aria-multiselectable="true" aria-label={title} className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-3 pb-2">
        {showSelectAll && !q && options.length > 1 && (() => {
          const all = options.every((o) => draft.includes(o.value));
          return (
            <button
              type="button"
              onClick={() => setDraft(all ? [] : options.map((o) => o.value))}
              className="w-full min-h-12 px-3 py-2.5 rounded-xl flex items-center gap-3 text-left border-b border-slate-100 active:bg-slate-50 cursor-pointer"
            >
              <span
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
                  all ? 'bg-[#2F68FE] border-[#2F68FE] text-white' : 'border-slate-300 bg-white'
                }`}
              >
                {all && <Check className="w-3 h-3 stroke-[3]" />}
              </span>
              <span className="flex-1 text-[13px] font-bold text-[#1E293B]">Select all</span>
            </button>
          );
        })()}
        {shown.map((o) => {
          const on = draft.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              role="option"
              aria-selected={on}
              onClick={() => toggle(o.value)}
              className={`w-full min-h-12 px-3 py-2.5 rounded-xl flex items-center gap-3 text-left transition-colors cursor-pointer ${
                on ? 'bg-blue-50/70' : 'active:bg-slate-50'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
                  on ? 'bg-[#2F68FE] border-[#2F68FE] text-white' : 'border-slate-300 bg-white'
                }`}
              >
                {on && <Check className="w-3 h-3 stroke-[3]" />}
              </span>
              <span className={`flex-1 min-w-0 text-[13px] leading-snug ${on ? 'font-semibold text-[#1E293B]' : 'font-medium text-slate-700'}`}>
                {o.label}
              </span>
              {o.badge && (
                <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-[10px] font-semibold text-slate-500 shrink-0">{o.badge}</span>
              )}
            </button>
          );
        })}
        {shown.length === 0 && (
          <p className="py-10 text-center text-xs text-slate-400">Nothing matches “{query.trim()}”. Try a shorter word.</p>
        )}
      </div>

      <div className="grid grid-cols-[1fr_2fr] gap-2.5 p-4 pt-3 pb-6 border-t border-slate-100 shrink-0">
        <button
          type="button"
          onClick={() => setDraft([])}
          disabled={draft.length === 0}
          className="h-12 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold bg-white active:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
        >
          Clear all
        </button>
        <button
          type="button"
          onClick={() => onApply(draft)}
          className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] cursor-pointer"
        >
          Done{draft.length ? ` · ${draft.length} selected` : ''}
        </button>
      </div>
    </BottomSheet>
  );
};
