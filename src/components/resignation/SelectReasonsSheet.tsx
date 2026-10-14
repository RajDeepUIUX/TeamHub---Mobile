import React, { useEffect, useState } from 'react';
import { X, Search, Check } from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet';
import { RESIGNATION_REASONS } from '../../data/resignationData';

interface SelectReasonsSheetProps {
  isOpen: boolean;
  selected: string[];
  onClose: () => void;
  onApply: (reasons: string[]) => void;
}

/** Searchable multi-select for resignation reasons; changes apply on "Done" */
export const SelectReasonsSheet: React.FC<SelectReasonsSheetProps> = ({ isOpen, selected, onClose, onApply }) => {
  const [draft, setDraft] = useState<string[]>(selected);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDraft(selected);
      setQuery('');
    }
  }, [isOpen, selected]);

  const q = query.trim().toLowerCase();
  const visible = RESIGNATION_REASONS.filter((r) => r.toLowerCase().includes(q));

  const toggle = (reason: string) =>
    setDraft((prev) => (prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]));

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[85%]">
      <div className="pt-3 pb-1 flex justify-center shrink-0">
        <div className="w-10 h-1 bg-slate-300 rounded-full" />
      </div>
      <div className="flex items-center justify-between px-5 pt-1 pb-3 shrink-0">
        <div>
          <h2 className="text-base font-bold text-[#1E293B]">Select Reasons</h2>
          <p className="text-[11px] text-slate-400">Choose all that apply</p>
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

      {/* Search */}
      <div className="px-4 pb-3 border-b border-slate-100 shrink-0">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search reasons..."
            className="w-full h-10 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-[#2F68FE] focus:ring-4 focus:ring-blue-50"
          />
        </div>
      </div>

      {/* Options */}
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-3 py-2">
        {visible.map((reason) => {
          const isOn = draft.includes(reason);
          return (
            <button
              key={reason}
              type="button"
              onClick={() => toggle(reason)}
              aria-pressed={isOn}
              className={`w-full h-11 px-3 rounded-xl flex items-center gap-3 text-left text-[13px] transition-colors cursor-pointer ${
                isOn ? 'bg-blue-50/70 text-[#1E293B] font-semibold' : 'text-slate-700 font-medium active:bg-slate-50'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                  isOn ? 'bg-[#2F68FE] border-[#2F68FE] text-white' : 'border-slate-300 bg-white'
                }`}
              >
                {isOn && <Check className="w-3 h-3 stroke-[3]" />}
              </span>
              {reason}
            </button>
          );
        })}
        {visible.length === 0 && <p className="py-8 text-center text-xs text-slate-400">No matching reasons</p>}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 p-4 pt-3 pb-6 border-t border-slate-100 shrink-0">
        <button
          type="button"
          onClick={() => setDraft([])}
          disabled={draft.length === 0}
          className="h-12 px-4 rounded-xl text-xs font-bold text-[#2F68FE] disabled:text-slate-300 cursor-pointer"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={() => onApply(draft)}
          className="flex-1 h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] transition-colors cursor-pointer"
        >
          {draft.length ? `Done (${draft.length} selected)` : 'Done'}
        </button>
      </div>
    </BottomSheet>
  );
};
