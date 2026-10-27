import React, { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { BottomSheet } from '../../common/BottomSheet';
import { SearchField, SheetHeader } from '../staff/tabs/StaffTabParts';
import {
  AVAILABILITY_OPTIONS,
  COST_FILTER_TITLE,
  COST_OPTIONS,
  EMPTY_MARKETPLACE_FILTERS,
  EXPERIENCE_OPTIONS,
  HUB_WORK_MODES,
  HubRangeOption,
  MarketplaceFilters,
  NOT_SPECIFIED,
} from '../data/clientStaffHubData';
import { CheckMark, CountryFlag } from './MarketplaceParts';

export interface MarketplaceFilterOptions {
  countries: string[];
  domains: string[];
  skills: string[];
  qualifications: string[];
}

interface Props {
  isOpen: boolean;
  filters: MarketplaceFilters;
  options: MarketplaceFilterOptions;
  /** Profiles a draft would show (live count on the apply button) */
  countOf: (draft: MarketplaceFilters) => number;
  onClose: () => void;
  onApply: (next: MarketplaceFilters) => void;
}

type GroupKey = keyof MarketplaceFilters;

const asOptions = (values: string[]): HubRangeOption[] => values.map((v) => ({ value: v, label: v }));

/** Groups shown open when the sheet opens (others open once they hold a selection) */
const OPEN_BY_DEFAULT: GroupKey[] = ['countries', 'domains'];

/**
 * Desktop filter sidebar (drawer on small screens) as a bottom sheet: Country, Domain, Technical Skills (parent categories, with
 * search), Availability, Talent Cost, Experience, Qualifications (with search) and Work Mode. Every group is multi-select.
 */
export const MarketplaceFilterSheet: React.FC<Props> = ({ isOpen, filters, options, countOf, onClose, onApply }) => {
  const [draft, setDraft] = useState<MarketplaceFilters>(filters);
  const [open, setOpen] = useState<GroupKey[]>(OPEN_BY_DEFAULT);
  const [skillQuery, setSkillQuery] = useState('');
  const [qualQuery, setQualQuery] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setDraft(filters);
    setOpen([...new Set([...OPEN_BY_DEFAULT, ...(Object.keys(filters) as GroupKey[]).filter((k) => filters[k].length > 0)])]);
    setSkillQuery('');
    setQualQuery('');
  }, [isOpen, filters]);

  const toggle = (key: GroupKey, value: string) =>
    setDraft((d) => {
      const list = d[key] as string[];
      return { ...d, [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] };
    });

  const count = countOf(draft);

  const group = (key: GroupKey, title: string, items: HubRangeOption[], extra?: { query: string; setQuery: (v: string) => void; placeholder: string }) => {
    const isOpenGroup = open.includes(key);
    const selected = draft[key] as string[];
    const q = extra?.query.trim().toLowerCase() ?? '';
    const shown = q ? items.filter((o) => o.label.toLowerCase().includes(q)) : items;
    const panelId = `tm-filter-${key}`;
    return (
      <section key={key} className="border-b border-slate-100 last:border-b-0">
        <button
          type="button"
          onClick={() => setOpen((o) => (o.includes(key) ? o.filter((k) => k !== key) : [...o, key]))}
          aria-expanded={isOpenGroup}
          aria-controls={panelId}
          className="w-full h-12 flex items-center gap-2 text-left cursor-pointer rounded-lg focus-visible:outline-2 focus-visible:outline-[#2F68FE]"
        >
          <span className="flex-1 min-w-0 text-[11px] font-bold uppercase tracking-wide text-[#1E293B]">{title}</span>
          {selected.length > 0 && (
            <span className="min-w-5 h-5 px-1.5 rounded-full bg-[#2F68FE] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">{selected.length}</span>
          )}
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpenGroup ? 'rotate-180' : ''}`} />
        </button>
        {isOpenGroup && (
          <div id={panelId} className="pb-3">
            {extra && (
              <div className="mb-1.5">
                <SearchField value={extra.query} onChange={extra.setQuery} placeholder={extra.placeholder} variant="sheet" />
              </div>
            )}
            {shown.length === 0 ? (
              <p className="py-3 text-center text-[11px] text-slate-400">No matches</p>
            ) : (
              <ul>
                {shown.map((o) => {
                  const on = selected.includes(o.value);
                  return (
                    <li key={o.value}>
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={on}
                        onClick={() => toggle(key, o.value)}
                        className="w-full min-h-11 py-2 flex items-center gap-3 text-left rounded-lg active:bg-slate-50 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2F68FE]"
                      >
                        <CheckMark on={on} />
                        <span className={`flex-1 min-w-0 flex items-center gap-2 text-[13px] leading-snug ${on ? 'font-semibold text-[#1E293B]' : 'font-medium text-slate-700'}`}>
                          {key === 'countries' && o.value !== NOT_SPECIFIED && <CountryFlag country={o.value} />}
                          {o.label}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </section>
    );
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[92%]">
      <SheetHeader title="Filters" onClose={onClose} />
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-1">
        {group('countries', 'Country', asOptions(options.countries))}
        {group('domains', 'Domain', asOptions(options.domains))}
        {group('skills', 'Technical Skills', asOptions(options.skills), { query: skillQuery, setQuery: setSkillQuery, placeholder: 'Search skills...' })}
        {group('availability', 'Availability', AVAILABILITY_OPTIONS)}
        {group('cost', COST_FILTER_TITLE, COST_OPTIONS)}
        {group('experience', 'Experience', EXPERIENCE_OPTIONS)}
        {group('qualifications', 'Qualifications', asOptions(options.qualifications), {
          query: qualQuery,
          setQuery: setQualQuery,
          placeholder: 'Search qualifications...',
        })}
        {group('workModes', 'Work Mode', asOptions(HUB_WORK_MODES))}
      </div>
      <div className="grid grid-cols-2 gap-3 p-4 pt-3 pb-6 border-t border-slate-100 shrink-0">
        <button
          type="button"
          onClick={() => setDraft(EMPTY_MARKETPLACE_FILTERS)}
          className="h-12 rounded-xl border border-[#2F68FE] bg-white text-[#2F68FE] text-xs font-bold active:bg-blue-50 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]"
        >
          Clear All
        </button>
        <button
          type="button"
          onClick={() => onApply(draft)}
          className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold shadow-xs active:bg-[#1D4ED8] transition-colors cursor-pointer tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]"
        >
          Show {count} {count === 1 ? 'Profile' : 'Profiles'}
        </button>
      </div>
    </BottomSheet>
  );
};
