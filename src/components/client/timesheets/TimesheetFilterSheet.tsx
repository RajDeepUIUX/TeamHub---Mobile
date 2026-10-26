import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { BottomSheet } from '../../common/BottomSheet';
import { MultiSelectDropdown } from '../../common/MultiSelectDropdown';
import { RangeCalendar, formatShortDate } from '../../../design-system/components/RangeCalendar';
import { SheetHeader } from '../staff/tabs/StaffTabParts';
import type { ClientStaffMember } from '../data/clientStaffData';
import {
  TimesheetRange,
  addDays,
  defaultTimesheetRange,
  isoOf,
  latestTimesheetStart,
  parseIso,
  sameRange,
} from '../data/clientTimesheetsData';

export interface TimesheetFilters {
  range: TimesheetRange;
  /** Empty = all staff (desktop "Select Staff" multi-select) */
  staffIds: string[];
}

export const timesheetFilterCount = (f: TimesheetFilters) =>
  f.staffIds.length + (sameRange(f.range, defaultTimesheetRange()) ? 0 : 1);

interface Props {
  isOpen: boolean;
  filters: TimesheetFilters;
  staff: ClientStaffMember[];
  onClose: () => void;
  onApply: (filters: TimesheetFilters) => void;
}

type Draft = { from: string; to: string | null; staffIds: string[] };

const minIso = (a: string, b: string) => (a < b ? a : b);

/** Desktop filter bar: From Date, To Date (From + 6 days on pick), Select Staff; Search / Clear All */
export const TimesheetFilterSheet: React.FC<Props> = ({ isOpen, filters, staff, onClose, onApply }) => {
  const [draft, setDraft] = useState<Draft>({ ...filters.range, staffIds: filters.staffIds });
  const [activeField, setActiveField] = useState<'start' | 'end' | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setDraft({ ...filters.range, staffIds: filters.staffIds });
    setActiveField(null);
  }, [isOpen, filters]);

  const todayKey = isoOf(new Date());
  const latestStart = latestTimesheetStart();

  const staffOptions = useMemo(
    () =>
      [...staff]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((s) => ({ value: s.id, label: s.name, group: s.status === 'Inactive' ? 'Former Staff' : 'Current Staff' }))
        .sort((a, b) => (a.group === b.group ? 0 : a.group === 'Current Staff' ? -1 : 1)),
    [staff],
  );

  const selectDay = (day: Date) => {
    const key = isoOf(day);
    if (activeField === 'start') {
      // Desktop: picking From sets To = From + 6 days
      setDraft((d) => ({ ...d, from: key, to: minIso(addDays(key, 6), todayKey) }));
      setActiveField(null);
    } else if (activeField === 'end') {
      if (key < draft.from) {
        setDraft((d) => ({ ...d, from: minIso(key, latestStart), to: null }));
      } else {
        setDraft((d) => ({ ...d, to: key }));
        setActiveField(null);
      }
    }
  };

  const draftFilters: TimesheetFilters | null = draft.to ? { range: { from: draft.from, to: draft.to }, staffIds: draft.staffIds } : null;
  const draftCount = draftFilters ? timesheetFilterCount(draftFilters) : draft.staffIds.length + 1;

  const dateField = (field: 'start' | 'end', label: string, value: string | null) => {
    const isActive = activeField === field;
    return (
      <div>
        <span className="block mb-1.5 text-xs font-bold text-[#1E293B]">{label}</span>
        <button
          type="button"
          onClick={() => setActiveField(isActive ? null : field)}
          aria-expanded={isActive}
          className={`w-full h-11 px-3 rounded-xl border bg-white flex items-center justify-between text-xs font-medium transition-all cursor-pointer shadow-2xs ${
            isActive ? 'border-[#2F68FE] ring-4 ring-blue-50' : 'border-slate-200'
          }`}
        >
          <span className="flex items-center gap-2 min-w-0">
            <Calendar className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#2F68FE]' : 'text-slate-400'}`} />
            <span className={`truncate ${value ? 'text-slate-700 font-semibold' : 'text-slate-400'}`}>
              {value ? formatShortDate(parseIso(value)) : 'Select Date'}
            </span>
          </span>
          <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${isActive ? 'rotate-180 text-[#2F68FE]' : 'text-slate-400'}`} />
        </button>
      </div>
    );
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[88%]">
      <SheetHeader title="Filter Timesheets" subtitle="From Date, To Date and staff" onClose={onClose} />

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-4 space-y-4">
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-3">
            {dateField('start', 'From Date', draft.from)}
            {dateField('end', 'To Date', draft.to)}
          </div>
          {activeField && (
            <div className="pt-1 space-y-2">
              <p className="text-[11px] text-slate-500 font-medium px-0.5">
                {activeField === 'start' ? 'Select a start date · To Date fills in 7 days' : 'Select an end date'}
              </p>
              <RangeCalendar
                key={activeField}
                start={parseIso(draft.from)}
                end={draft.to ? parseIso(draft.to) : null}
                activeField={activeField}
                onSelect={selectDay}
                initialMonth={parseIso(activeField === 'end' && draft.to ? draft.to : draft.from)}
                maxDate={parseIso(activeField === 'start' ? latestStart : todayKey)}
              />
            </div>
          )}
          {!draft.to && !activeField && <p className="px-0.5 text-[11px] font-medium text-rose-500">Select a To Date to complete the period.</p>}
          {activeField !== 'start' && (
            <p className="px-0.5 text-[11px] text-slate-400">Timesheets are reported week by week; the latest From Date is the last completed week.</p>
          )}
        </div>

        <MultiSelectDropdown
          label="Select Staff"
          placeholder="Select Staff"
          options={staffOptions}
          selected={draft.staffIds}
          onChange={(next) => setDraft((d) => ({ ...d, staffIds: next }))}
          searchable
          disabled={staffOptions.length === 0}
          disabledHint="No staff hired yet"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 pt-3 pb-6 border-t border-slate-100 shrink-0">
        <button
          type="button"
          onClick={() => onApply({ range: defaultTimesheetRange(), staffIds: [] })}
          className="h-12 rounded-xl border border-[#2F68FE] text-[#2F68FE] text-xs font-bold bg-white active:bg-blue-50 cursor-pointer"
        >
          Clear All
        </button>
        <button
          type="button"
          disabled={!draftFilters}
          onClick={() => draftFilters && onApply(draftFilters)}
          className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {draftCount ? `Search (${draftCount})` : 'Search'}
        </button>
      </div>
    </BottomSheet>
  );
};
