import React, { useEffect, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { BottomSheet } from '../../common/BottomSheet';
import { DatePickerSheet } from '../../common/DatePickerSheet';
import { MultiSelectDropdown } from '../../common/MultiSelectDropdown';
import { SheetHeader, fieldInputClass } from '../staff/tabs/StaffTabParts';
import { EMPTY_TNI_FILTERS, TNI_STATUSES, TNI_STATUS_LABEL, TniFilters, formatTniDate, tniFilterCount } from '../data/clientTrainingNeedData';

interface Props {
  isOpen: boolean;
  filters: TniFilters;
  staffOptions: string[];
  onClose: () => void;
  onApply: (filters: TniFilters) => void;
}

type DateKey = 'requestedOn' | 'completedOn';

/** Desktop filter row in a bottom drawer: Staff Name, Requested On, Status, Completed On; Search / Clear All */
export const TrainingNeedFilterSheet: React.FC<Props> = ({ isOpen, filters, staffOptions, onClose, onApply }) => {
  const [draft, setDraft] = useState<TniFilters>(filters);
  const [dateField, setDateField] = useState<DateKey | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setDraft(filters);
    setDateField(null);
  }, [isOpen, filters]);

  const count = tniFilterCount(draft);
  const dateRow = (key: DateKey, label: string) => (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-[#1E293B]">{label}</span>
        {draft[key] && (
          <button type="button" onClick={() => setDraft((d) => ({ ...d, [key]: '' }))} className="text-[11px] font-semibold text-[#2F68FE] cursor-pointer">
            Clear
          </button>
        )}
      </div>
      <button type="button" onClick={() => setDateField(key)} aria-label={label} className={`${fieldInputClass()} flex items-center justify-between gap-2 text-left cursor-pointer`}>
        <span className={`truncate ${draft[key] ? 'font-semibold' : 'text-slate-400'}`}>{draft[key] ? formatTniDate(draft[key]) : label}</span>
        <CalendarDays className="w-4 h-4 text-slate-400 shrink-0" />
      </button>
    </div>
  );

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[88%]">
      <SheetHeader title="Filter" subtitle="Training Need Identification" onClose={onClose} />
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-4 space-y-4">
        <MultiSelectDropdown
          label="Staff Name"
          placeholder="Staff Name"
          options={staffOptions.map((o) => ({ value: o, label: o }))}
          selected={draft.staff}
          onChange={(next) => setDraft((d) => ({ ...d, staff: next }))}
          searchable={staffOptions.length > 6}
          disabled={staffOptions.length === 0}
          disabledHint="No TNI requests yet"
        />
        {dateRow('requestedOn', 'Requested On')}
        <div className="space-y-1.5">
          <span className="block text-xs font-bold text-[#1E293B]">Status</span>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Status">
            {TNI_STATUSES.map((st) => {
              const on = draft.status === st;
              return (
                <button
                  key={st}
                  type="button"
                  aria-pressed={on}
                  // Desktop select is single choice; tapping the selected one clears it
                  onClick={() => setDraft((d) => ({ ...d, status: on ? '' : st }))}
                  className={`h-9 px-3.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                    on ? 'bg-[#2F68FE] border-[#2F68FE] text-white' : 'bg-white border-slate-200 text-slate-600 active:bg-slate-50'
                  }`}
                >
                  {TNI_STATUS_LABEL[st]}
                </button>
              );
            })}
          </div>
        </div>
        {dateRow('completedOn', 'Completed On')}
      </div>
      <div className="grid grid-cols-2 gap-3 p-4 pt-3 pb-6 border-t border-slate-100 shrink-0">
        <button
          type="button"
          onClick={() => onApply(EMPTY_TNI_FILTERS)}
          className="h-12 rounded-xl border border-[#2F68FE] text-[#2F68FE] text-xs font-bold bg-white active:bg-blue-50 cursor-pointer"
        >
          Clear All
        </button>
        <button type="button" onClick={() => onApply(draft)} className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] cursor-pointer">
          {count ? `Search (${count})` : 'Search'}
        </button>
      </div>
      <DatePickerSheet
        isOpen={dateField !== null}
        mode="single"
        title={dateField === 'completedOn' ? 'Completed On' : 'Requested On'}
        start={dateField ? draft[dateField] || null : null}
        onClose={() => setDateField(null)}
        onApply={(iso) => {
          if (dateField) setDraft((d) => ({ ...d, [dateField]: iso }));
          setDateField(null);
        }}
      />
    </BottomSheet>
  );
};
