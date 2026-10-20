import React, { useEffect, useMemo, useState } from 'react';
import { BottomSheet } from '../../common/BottomSheet';
import { MultiSelectDropdown } from '../../common/MultiSelectDropdown';
import { Dropdown } from '../../../design-system/components/Dropdown';
import { SheetHeader } from '../staff/tabs/StaffTabParts';
import { CLIENT_IS_MOS } from '../data/clientTimesheetsData';
import {
  EMPTY_HUB_FILTERS,
  HUB_JOINING_OPTIONS,
  HUB_LEVELS,
  HUB_RATE_OPTIONS,
  HUB_WORK_MODES,
  HubFilters,
  HubWorkMode,
  hubFilterCount,
} from '../data/clientStaffHubData';

export interface HubFilterOptions {
  domains: string[];
  profiles: { name: string; domain: string }[];
  software: string[];
  skills: string[];
  locations: string[];
  qualifications: string[];
}

interface Props {
  isOpen: boolean;
  filters: HubFilters;
  options: HubFilterOptions;
  onClose: () => void;
  onApply: (filters: HubFilters) => void;
}

const asOptions = (items: string[]) => items.map((v) => ({ value: v, label: v }));

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => <span className="block text-xs font-bold text-[#1E293B]">{children}</span>;

/**
 * Desktop filter row (Domain, Profile, Level, Work Mode, Hourly Rate / Talent Cost, Joining Days, Software, Technical Skills,
 * Location, Qualification; Apply / Clear). Resume ID is the list search on mobile. Choosing a domain limits the Profile list.
 */
export const HubFilterSheet: React.FC<Props> = ({ isOpen, filters, options, onClose, onApply }) => {
  const [draft, setDraft] = useState<HubFilters>(filters);

  useEffect(() => {
    if (isOpen) setDraft(filters);
  }, [isOpen, filters]);

  const profileNames = useMemo(
    () => [...new Set(options.profiles.filter((p) => !draft.domain || p.domain === draft.domain).map((p) => p.name))].sort(),
    [options.profiles, draft.domain],
  );

  const count = hubFilterCount(draft);
  const set = <K extends keyof HubFilters>(key: K, value: HubFilters[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const rateLabel = CLIENT_IS_MOS ? 'Talent Cost' : 'Hourly Rate';
  const domainOptions = [{ value: '', label: 'Select Domain' }, ...asOptions(options.domains)];
  const rateOptions = [{ value: '', label: CLIENT_IS_MOS ? 'Select Talent Cost' : 'Select Hourly Rate' }, ...HUB_RATE_OPTIONS];
  const joiningOptions = [{ value: '', label: 'Select Joining Days' }, ...HUB_JOINING_OPTIONS];

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[90%]">
      <SheetHeader title="Filter Resumes" subtitle="Narrow down the resumes you see" onClose={onClose} />

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-4 space-y-4">
        <div className="space-y-1.5">
          <Label>Domain</Label>
          <Dropdown
            ariaLabel="Domain"
            sheetTitle="Domain"
            value={draft.domain || null}
            placeholder="Select Domain"
            options={domainOptions}
            onChange={(v) =>
              setDraft((d) => ({
                ...d,
                domain: v,
                // A profile from another domain can't stay selected
                profiles: v ? d.profiles.filter((name) => options.profiles.some((p) => p.name === name && p.domain === v)) : d.profiles,
              }))
            }
          />
        </div>

        <MultiSelectDropdown
          label="Profile"
          placeholder="Select Profile"
          options={asOptions(profileNames)}
          selected={draft.profiles}
          onChange={(next) => set('profiles', next)}
          searchable
          disabled={profileNames.length === 0}
          disabledHint="No profiles in this domain"
        />

        <MultiSelectDropdown label="Level" placeholder="Select Level" options={asOptions(HUB_LEVELS)} selected={draft.levels} onChange={(next) => set('levels', next)} />

        <MultiSelectDropdown
          label="Work Mode"
          placeholder="Select Work Mode"
          options={asOptions(HUB_WORK_MODES)}
          selected={draft.workModes}
          onChange={(next) => set('workModes', next as HubWorkMode[])}
        />

        <div className="space-y-1.5">
          <Label>{rateLabel}</Label>
          <Dropdown
            ariaLabel={rateLabel}
            sheetTitle={rateLabel}
            value={draft.rate || null}
            placeholder={rateOptions[0].label}
            options={rateOptions}
            onChange={(v) => set('rate', v)}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Joining Days</Label>
          <Dropdown
            ariaLabel="Joining Days"
            sheetTitle="Joining Days"
            value={draft.joining || null}
            placeholder={joiningOptions[0].label}
            options={joiningOptions}
            onChange={(v) => set('joining', v)}
          />
        </div>

        <MultiSelectDropdown
          label="Software"
          placeholder="Select Software"
          options={asOptions(options.software)}
          selected={draft.software}
          onChange={(next) => set('software', next)}
          searchable
        />

        <MultiSelectDropdown
          label="Technical Skills"
          placeholder="Select Technical Skills"
          options={asOptions(options.skills)}
          selected={draft.skills}
          onChange={(next) => set('skills', next)}
          searchable
        />

        <MultiSelectDropdown
          label="Location"
          placeholder="Select Location"
          options={asOptions(options.locations)}
          selected={draft.locations}
          onChange={(next) => set('locations', next)}
        />

        <MultiSelectDropdown
          label="Qualification"
          placeholder="Select Qualification"
          options={asOptions(options.qualifications)}
          selected={draft.qualifications}
          onChange={(next) => set('qualifications', next)}
          searchable
        />
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 pt-3 pb-6 border-t border-slate-100 shrink-0">
        <button
          type="button"
          onClick={() => onApply(EMPTY_HUB_FILTERS)}
          className="h-12 rounded-xl border border-[#2F68FE] text-[#2F68FE] text-xs font-bold bg-white active:bg-blue-50 cursor-pointer"
        >
          Clear
        </button>
        <button type="button" onClick={() => onApply(draft)} className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] cursor-pointer">
          {count ? `Apply (${count})` : 'Apply'}
        </button>
      </div>
    </BottomSheet>
  );
};
