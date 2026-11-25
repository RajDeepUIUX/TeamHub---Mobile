import React, { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { BottomSheet } from '../../common/BottomSheet';
import { McButton, McCheckBox } from '../common/McUi';
import { MYCPE_QUALIFICATIONS } from '../data/mycpeAuthData';

/** Multi-select; nothing changes in the form until "Select" is tapped */
export const McQualificationSheet: React.FC<{
  isOpen: boolean;
  selected: string[];
  onClose: () => void;
  onSelect: (selected: string[]) => void;
}> = ({ isOpen, selected, onClose, onSelect }) => {
  const [picked, setPicked] = useState<string[]>(selected);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setPicked(selected);
    setQuery('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const q = query.trim().toLowerCase();
  const list = MYCPE_QUALIFICATIONS.filter((x) => x.toLowerCase().includes(q));
  const toggle = (x: string) => setPicked((p) => (p.includes(x) ? p.filter((y) => y !== x) : [...p, x]));

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="h-[86%]" className="font-mc text-mc-ink-2">
      <div className="pt-2.5 flex justify-center shrink-0">
        <span className="w-14 h-1 rounded-full bg-mc-line-strong" />
      </div>
      <div className="relative h-14 px-4 flex items-center justify-between shrink-0">
        <button type="button" onClick={onClose} className="-ml-2 w-10 h-10 flex items-center justify-center text-mc-text cursor-pointer" aria-label="Close">
          <X className="w-5 h-5" />
        </button>
        <h2 className="absolute inset-x-20 text-center text-base font-medium text-mc-ink-2 pointer-events-none">Qualification</h2>
        <button type="button" onClick={() => setPicked([])} className="h-10 text-sm font-medium text-mc-primary cursor-pointer">
          Reset
        </button>
      </div>
      <div className="px-4 shrink-0">
        <div className="h-10 px-2.5 rounded-[4px] border border-mc-line-strong flex items-center gap-2.5 focus-within:border-mc-primary">
          <Search className="w-4.5 h-4.5 text-mc-muted shrink-0 stroke-[1.6]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Qualification"
            aria-label="Search Qualification"
            className="flex-1 min-w-0 h-full bg-transparent text-sm text-mc-ink-2 placeholder:text-mc-muted focus:outline-hidden select-text"
          />
        </div>
      </div>
      <div className="mt-2 flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 divide-y divide-mc-line-strong">
        {list.map((x) => (
          <button
            key={x}
            type="button"
            role="checkbox"
            aria-checked={picked.includes(x)}
            onClick={() => toggle(x)}
            className="w-full py-3.5 flex items-start gap-2 text-left text-sm leading-5 text-mc-ink-2 cursor-pointer"
          >
            <span className="pt-0.5">
              <McCheckBox checked={picked.includes(x)} />
            </span>
            {x}
          </button>
        ))}
        {list.length === 0 && <p className="py-10 text-center text-sm text-mc-muted">No qualification found</p>}
      </div>
      <div className="shrink-0 px-4 pt-2 pb-8 bg-white">
        <McButton size="md" onClick={() => onSelect(picked)}>
          Select
        </McButton>
      </div>
    </BottomSheet>
  );
};
