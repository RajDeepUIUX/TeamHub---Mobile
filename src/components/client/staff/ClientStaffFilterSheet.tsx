import React, { useEffect, useState } from 'react';
import { Calendar, ChevronDown, X } from 'lucide-react';
import { BottomSheet } from '../../common/BottomSheet';
import { MultiSelectDropdown } from '../../common/MultiSelectDropdown';
import { RangeCalendar, formatShortDate, toDateKey } from '../../../design-system/components/RangeCalendar';

export interface ClientStaffFilters {
  /** ISO dates; both set = joining date range */
  joinedFrom: string | null;
  joinedTo: string | null;
  level: string[];
  designation: string[];
  engagementType: string[];
  location: string[];
}

export const EMPTY_STAFF_FILTERS: ClientStaffFilters = {
  joinedFrom: null,
  joinedTo: null,
  level: [],
  designation: [],
  engagementType: [],
  location: [],
};

export const staffFilterCount = (f: ClientStaffFilters) =>
  (f.joinedFrom ? 1 : 0) + f.level.length + f.designation.length + f.engagementType.length + f.location.length;

type ListKey = 'level' | 'designation' | 'engagementType' | 'location';

interface ClientStaffFilterSheetProps {
  isOpen: boolean;
  filters: ClientStaffFilters;
  options: Record<ListKey, string[]>;
  onClose: () => void;
  onApply: (filters: ClientStaffFilters) => void;
}

const LIST_FIELDS: { key: ListKey; label: string }[] = [
  { key: 'level', label: 'Level' },
  { key: 'designation', label: 'Designation' },
  { key: 'engagementType', label: 'Engagement Type' },
  { key: 'location', label: 'Location' },
];

const parse = (iso: string | null) => (iso ? new Date(`${iso}T00:00:00`) : null);

/** Desktop filter bar (Joining Date, Level, Designation, Engagement Type, Location); applies on "Apply Filters" */
export const ClientStaffFilterSheet: React.FC<ClientStaffFilterSheetProps> = ({ isOpen, filters, options, onClose, onApply }) => {
  const [draft, setDraft] = useState<ClientStaffFilters>(filters);
  // Same date flow as the Manager team filters: Start Date / End Date fields open the inline calendar
  const [activeDateField, setActiveDateField] = useState<'start' | 'end' | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setDraft(filters);
    setActiveDateField(null);
  }, [isOpen, filters]);

  const from = parse(draft.joinedFrom);
  const to = parse(draft.joinedTo);
  const rangeIncomplete = Boolean(draft.joinedFrom && !draft.joinedTo);
  const draftCount = staffFilterCount(draft);

  const selectDay = (day: Date) => {
    const key = toDateKey(day);
    if (activeDateField === 'start') {
      setDraft((d) => ({ ...d, joinedFrom: key, joinedTo: d.joinedTo && key > d.joinedTo ? null : d.joinedTo }));
      setActiveDateField('end');
    } else if (activeDateField === 'end') {
      if (draft.joinedFrom && key < draft.joinedFrom) {
        setDraft((d) => ({ ...d, joinedFrom: key, joinedTo: null }));
      } else {
        setDraft((d) => ({ ...d, joinedTo: key }));
        setActiveDateField(null);
      }
    }
  };

  const dateField = (field: 'start' | 'end', label: string, value: Date | null) => {
    const isActive = activeDateField === field;
    return (
      <div>
        <span className="block mb-1.5 text-xs font-bold text-[#1E293B]">{label}</span>
        <button
          type="button"
          onClick={() => setActiveDateField(isActive ? null : field)}
          className={`w-full h-11 px-3 rounded-xl border bg-white flex items-center justify-between text-xs font-medium transition-all cursor-pointer shadow-2xs ${
            isActive ? 'border-[#2F68FE] ring-4 ring-blue-50' : 'border-slate-200'
          }`}
        >
          <span className="flex items-center gap-2 min-w-0">
            <Calendar className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#2F68FE]' : 'text-slate-400'}`} />
            <span className={`truncate ${value ? 'text-slate-700 font-semibold' : 'text-slate-400'}`}>
              {value ? formatShortDate(value) : 'Select date'}
            </span>
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${isActive ? 'rotate-180 text-[#2F68FE]' : 'text-slate-400'}`}
          />
        </button>
      </div>
    );
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[88%]">
      <div className="pt-3 pb-1 flex justify-center shrink-0">
        <div className="w-10 h-1 bg-slate-300 rounded-full" />
      </div>
      <div className="flex items-center justify-between px-5 pt-1 pb-3 border-b border-slate-100 shrink-0">
        <div>
          <h2 className="text-base font-bold text-[#1E293B]">Filter Staff</h2>
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

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-4 space-y-4">
        {/* Joining date range */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">Joining Date</span>
            {draft.joinedFrom && (
              <button
                type="button"
                onClick={() => {
                  setDraft((d) => ({ ...d, joinedFrom: null, joinedTo: null }));
                  setActiveDateField(null);
                }}
                className="text-[11px] font-semibold text-[#2F68FE] cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {dateField('start', 'Start Date', from)}
            {dateField('end', 'End Date', to)}
          </div>
          {activeDateField && (
            <div className="pt-1 space-y-2">
              <p className="text-[11px] text-slate-500 font-medium px-0.5">
                {activeDateField === 'start' ? 'Select a start date' : 'Select an end date'}
              </p>
              <RangeCalendar
                key={activeDateField}
                start={from}
                end={to}
                activeField={activeDateField}
                onSelect={selectDay}
                initialMonth={from ?? undefined}
                maxDate={new Date()}
              />
            </div>
          )}
          {rangeIncomplete && !activeDateField && <p className="px-0.5 text-[11px] font-medium text-rose-500">Select an end date to complete the range.</p>}
        </div>

        {LIST_FIELDS.map(({ key, label }) => (
          <MultiSelectDropdown
            key={key}
            label={label}
            placeholder={`All ${label.toLowerCase()}s`}
            options={options[key].map((o) => ({ value: o, label: o }))}
            selected={draft[key]}
            onChange={(next) => setDraft((d) => ({ ...d, [key]: next }))}
            searchable={options[key].length > 6}
            disabled={options[key].length === 0}
            disabledHint={`No ${label.toLowerCase()} set for your staff yet`}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 pt-3 pb-6 border-t border-slate-100 shrink-0">
        <button
          type="button"
          onClick={() => onApply(EMPTY_STAFF_FILTERS)}
          className="h-12 rounded-xl border border-[#2F68FE] text-[#2F68FE] text-xs font-bold bg-white active:bg-blue-50 cursor-pointer"
        >
          Clear All
        </button>
        <button
          type="button"
          disabled={rangeIncomplete}
          onClick={() => onApply(draft)}
          className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {draftCount ? `Apply Filters (${draftCount})` : 'Apply Filters'}
        </button>
      </div>
    </BottomSheet>
  );
};
