import React, { useEffect, useState } from 'react';
import { X, Calendar, ChevronDown } from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet';
import { MultiSelectDropdown } from '../common/MultiSelectDropdown';
import { RangeCalendar, formatShortDate, toDateKey } from '../../design-system/components/RangeCalendar';
import { TEAM_CYCLE, TEAM_REPORTING_MANAGERS } from '../../data/teamAttendanceData';

export interface TeamAttendanceFilters {
  managers: string[];
  /** Managers ticked automatically because one of their staff was picked (they don't narrow the staff list) */
  autoManagers: string[];
  staff: string[];
  /** yyyy-mm-dd; always set (defaults to the current attendance cycle, like the staff filter) */
  from: string;
  to: string;
  editOnly: boolean;
  status: string[];
  workMode: string[];
}

export const DEFAULT_TEAM_ATTENDANCE_FILTERS: TeamAttendanceFilters = {
  managers: [],
  autoManagers: [],
  staff: [],
  // Current attendance cycle (26th → 25th)
  from: TEAM_CYCLE.from,
  to: TEAM_CYCLE.to,
  // Normal logs + edit requests by default
  editOnly: false,
  status: [],
  workMode: [],
};

/** Number of filters that differ from the defaults (for the badge) */
export const teamAttendanceFilterCount = (f: TeamAttendanceFilters) =>
  f.managers.length +
  f.staff.length +
  (f.from !== DEFAULT_TEAM_ATTENDANCE_FILTERS.from || f.to !== DEFAULT_TEAM_ATTENDANCE_FILTERS.to ? 1 : 0) +
  (f.editOnly ? 1 : 0) +
  f.status.length +
  f.workMode.length;

const toOptions = (values: string[]) => values.map((v) => ({ value: v, label: v }));

interface TeamAttendanceFilterSheetProps {
  isOpen: boolean;
  filters: TeamAttendanceFilters;
  /** All staff names present in the team's records */
  staffNames: string[];
  /** Employee code per staff name, shown next to the name */
  staffCodes: Record<string, string>;
  onClose: () => void;
  onApply: (filters: TeamAttendanceFilters) => void;
}

export const TeamAttendanceFilterSheet: React.FC<TeamAttendanceFilterSheetProps> = ({
  isOpen,
  filters,
  staffNames,
  staffCodes,
  onClose,
  onApply,
}) => {
  const [draft, setDraft] = useState<TeamAttendanceFilters>(filters);
  const [activeDateField, setActiveDateField] = useState<'start' | 'end' | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDraft(filters);
      setActiveDateField(null);
    }
  }, [isOpen, filters]);

  const parse = (iso: string) => (iso ? new Date(`${iso}T00:00:00`) : null);
  const fromDate = parse(draft.from);
  const toDate = parse(draft.to);

  // Same flow as the staff attendance filter: pick start, then end
  const handleDaySelect = (day: Date) => {
    const key = toDateKey(day);
    if (activeDateField === 'start') {
      setDraft((prev) => ({ ...prev, from: key, to: prev.to && key > prev.to ? '' : prev.to }));
      setActiveDateField('end');
    } else if (activeDateField === 'end') {
      if (draft.from && key < draft.from) {
        setDraft((prev) => ({ ...prev, from: key, to: '' }));
      } else {
        setDraft((prev) => ({ ...prev, to: key }));
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
            isActive ? 'border-[#2F68FE] ring-4 ring-blue-50' : 'border-slate-200 hover:border-slate-300'
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

  const set = <K extends keyof TeamAttendanceFilters>(key: K, value: TeamAttendanceFilters[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  // Staff list follows the managers picked by hand (auto-ticked ones don't narrow it), grouped under each manager
  const managerLabel = (m: (typeof TEAM_REPORTING_MANAGERS)[number]) => `${m.name} (${m.code})`;
  const pickedManagers = draft.managers.filter((m) => !draft.autoManagers.includes(m));
  const staffOptions = TEAM_REPORTING_MANAGERS.filter((m) => !pickedManagers.length || pickedManagers.includes(m.name)).flatMap((m) =>
    m.members.map((x) => x.staffName).filter((name) => staffNames.includes(name)).map((name) => ({ value: name, label: staffCodes[name] ? `${name} (${staffCodes[name]})` : name, group: managerLabel(m) }))
  );

  const setManagers = (managers: string[]) =>
    setDraft((prev) => {
      const allowed = managers.length
        ? TEAM_REPORTING_MANAGERS.filter((m) => managers.includes(m.name)).flatMap((m) => m.members.map((x) => x.staffName))
        : staffNames;
      return {
        ...prev,
        managers,
        autoManagers: prev.autoManagers.filter((m) => managers.includes(m)),
        staff: prev.staff.filter((s) => allowed.includes(s)),
      };
    });

  // Picking staff auto-ticks their reporting manager; an auto-ticked manager is dropped once none of their staff are picked
  const setStaff = (staff: string[]) =>
    setDraft((prev) => {
      const needed = TEAM_REPORTING_MANAGERS.filter((m) => m.members.some((x) => staff.includes(x.staffName))).map((m) => m.name);
      const added = needed.filter((m) => !prev.managers.includes(m));
      const autoManagers = [...prev.autoManagers.filter((m) => needed.includes(m)), ...added];
      const managers = [...prev.managers.filter((m) => !prev.autoManagers.includes(m) || needed.includes(m)), ...added];
      return { ...prev, staff, managers, autoManagers };
    });

  const draftCount = teamAttendanceFilterCount(draft);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[90%]">
      <div className="pt-3 pb-1 flex justify-center shrink-0">
        <div className="w-10 h-1 bg-slate-300 rounded-full" />
      </div>
      <div className="flex items-center justify-between px-5 pt-1 pb-3 border-b border-slate-100 shrink-0">
        <div>
          <h2 className="text-base font-bold text-[#1E293B]">Filter Team's Attendance</h2>
          <p className="text-[11px] text-slate-400">Pick one or more options in each dropdown</p>
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
        <MultiSelectDropdown
          label="Reporting Manager"
          placeholder="All reporting managers"
          options={TEAM_REPORTING_MANAGERS.map((m) => ({ value: m.name, label: `${m.name} (${m.code})` }))}
          selected={draft.managers}
          onChange={setManagers}
          searchable
        />

        <MultiSelectDropdown
          label="Staff Name"
          placeholder={pickedManagers.length ? 'All staff under selected managers' : 'All staff'}
          options={staffOptions}
          selected={draft.staff}
          onChange={setStaff}
          searchable
        />

        {/* Date range */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-3">
            {dateField('start', 'Start Date', fromDate)}
            {dateField('end', 'End Date', toDate)}
          </div>
          {activeDateField && (
            <div className="pt-1 space-y-2">
              <p className="text-[11px] text-slate-500 font-medium px-0.5">
                {activeDateField === 'start' ? 'Select a start date' : 'Select an end date'}
              </p>
              <RangeCalendar
                key={activeDateField}
                start={fromDate}
                end={toDate}
                activeField={activeDateField}
                onSelect={handleDaySelect}
              />
            </div>
          )}
        </div>

        {/* Edit requests only */}
        <button
          type="button"
          role="switch"
          aria-checked={draft.editOnly}
          onClick={() => set('editOnly', !draft.editOnly)}
          className="w-full flex items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200 bg-white text-left cursor-pointer"
        >
          <span>
            <span className="block text-xs font-bold text-[#1E293B]">Only see Edit Requests</span>
            <span className="block text-[10px] text-slate-400 mt-0.5">
              {draft.editOnly ? 'Showing days with an edit request' : 'Showing all attendance records'}
            </span>
          </span>
          <span
            className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${draft.editOnly ? 'bg-[#2F68FE]' : 'bg-slate-300'}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                draft.editOnly ? 'translate-x-4' : ''
              }`}
            />
          </span>
        </button>

        <MultiSelectDropdown
          label="Status"
          placeholder="All statuses"
          options={toOptions(['Pending', 'Approved', 'Rejected'])}
          selected={draft.status}
          onChange={(v) => set('status', v)}
        />

        <MultiSelectDropdown
          label="Work Mode"
          placeholder="All work modes"
          options={toOptions(['Office', 'Hybrid', 'Remote'])}
          selected={draft.workMode}
          onChange={(v) => set('workMode', v)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 pt-3 pb-6 border-t border-slate-100 shrink-0">
        <button
          type="button"
          onClick={() => onApply(DEFAULT_TEAM_ATTENDANCE_FILTERS)}
          className="h-12 rounded-xl border border-[#2F68FE] text-[#2F68FE] text-xs font-bold bg-white active:bg-blue-50 cursor-pointer"
        >
          Clear All
        </button>
        <button
          type="button"
          onClick={() => onApply({ ...draft, to: draft.to || draft.from })}
          className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] cursor-pointer"
        >
          {draftCount ? `Apply Filters (${draftCount})` : 'Apply Filters'}
        </button>
      </div>
    </BottomSheet>
  );
};
