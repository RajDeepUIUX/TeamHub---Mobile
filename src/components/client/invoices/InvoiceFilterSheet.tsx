import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, ChevronDown, X } from 'lucide-react';
import { BottomSheet } from '../../common/BottomSheet';
import { MultiSelectDropdown } from '../../common/MultiSelectDropdown';
import { RangeCalendar, formatShortDate } from '../../../design-system/components/RangeCalendar';
import { SheetHeader } from '../staff/tabs/StaffTabParts';
import type { ClientStaffMember } from '../data/clientStaffData';
import { InvoiceDateRange, invoicePresets } from '../data/clientInvoicesData';
import { isoOf, parseIso } from '../data/clientTimesheetsData';

export interface InvoiceFilters {
  /** Invoice Created On (desktop From Date / To Date, both optional) */
  range: InvoiceDateRange;
  /** Empty = all staff (desktop Staff multi-select, `project_ids`) */
  staffIds: string[];
}

export const EMPTY_INVOICE_FILTERS: InvoiceFilters = { range: { from: null, to: null }, staffIds: [] };

export const invoiceFilterCount = (f: InvoiceFilters) => f.staffIds.length + (f.range.from || f.range.to ? 1 : 0);

interface Props {
  isOpen: boolean;
  filters: InvoiceFilters;
  staff: ClientStaffMember[];
  onClose: () => void;
  onApply: (filters: InvoiceFilters) => void;
}

/** Desktop filter bar: From Date, To Date (each limits the other), Staff; Search / Clear All */
export const InvoiceFilterSheet: React.FC<Props> = ({ isOpen, filters, staff, onClose, onApply }) => {
  const [draft, setDraft] = useState<InvoiceFilters>(filters);
  const [activeField, setActiveField] = useState<'start' | 'end' | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setDraft(filters);
    setActiveField(null);
  }, [isOpen, filters]);

  const todayKey = isoOf(new Date());
  const presets = useMemo(() => invoicePresets(), []);

  const staffOptions = useMemo(
    () =>
      [...staff]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((s) => ({ value: s.id, label: s.name, group: s.status === 'Inactive' ? 'Former Staff' : 'Current Staff' }))
        .sort((a, b) => (a.group === b.group ? 0 : a.group === 'Current Staff' ? -1 : 1)),
    [staff],
  );

  const { from, to } = draft.range;
  const setRange = (range: InvoiceDateRange) => setDraft((d) => ({ ...d, range }));

  const selectDay = (day: Date) => {
    const key = isoOf(day);
    if (activeField === 'start') {
      // Desktop: a From Date after the To Date clears the To Date
      setRange({ from: key, to: to && to < key ? null : to });
      setActiveField(to && to >= key ? null : 'end');
    } else if (activeField === 'end') {
      if (from && key < from) setRange({ from: key, to: null });
      else {
        setRange({ from, to: key });
        setActiveField(null);
      }
    }
  };

  const draftCount = invoiceFilterCount(draft);

  const dateField = (field: 'start' | 'end', label: string, value: string | null) => {
    const isActive = activeField === field;
    return (
      <div>
        <span className="block mb-1.5 text-xs font-bold text-[#1E293B]">{label}</span>
        <div className="relative">
          <button
            type="button"
            onClick={() => setActiveField(isActive ? null : field)}
            aria-expanded={isActive}
            className={`w-full h-11 pl-3 ${value ? 'pr-9' : 'pr-3'} rounded-xl border bg-white flex items-center justify-between text-xs font-medium transition-all cursor-pointer shadow-2xs ${
              isActive ? 'border-[#2F68FE] ring-4 ring-blue-50' : 'border-slate-200'
            }`}
          >
            <span className="flex items-center gap-2 min-w-0">
              <Calendar className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#2F68FE]' : 'text-slate-400'}`} />
              <span className={`truncate ${value ? 'text-slate-700 font-semibold' : 'text-slate-400'}`}>
                {value ? formatShortDate(parseIso(value)) : 'Any date'}
              </span>
            </span>
            {!value && (
              <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${isActive ? 'rotate-180 text-[#2F68FE]' : 'text-slate-400'}`} />
            )}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => setRange(field === 'start' ? { from: null, to } : { from, to: null })}
              aria-label={`Clear ${label}`}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[88%]">
      <SheetHeader title="Filter Invoices" subtitle="Invoice date and staff" onClose={onClose} />

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-4 space-y-4">
        <div className="space-y-2">
          <span className="block text-[11px] font-semibold text-slate-500">Invoice Created On</span>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Quick ranges">
            {presets.map((p) => {
              const on = from === p.from && to === p.to;
              return (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    setRange(on ? { from: null, to: null } : { from: p.from, to: p.to });
                    setActiveField(null);
                  }}
                  className={`h-8 px-3 rounded-full text-[11.5px] font-semibold transition-colors cursor-pointer ${
                    on ? 'bg-[#2F68FE] text-white' : 'bg-slate-100 text-slate-600 active:bg-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            {dateField('start', 'From Date', from)}
            {dateField('end', 'To Date', to)}
          </div>
          {activeField && (
            <div className="pt-1 space-y-2">
              <p className="text-[11px] text-slate-500 font-medium px-0.5">
                {activeField === 'start' ? 'Select the earliest invoice date' : 'Select the latest invoice date'}
              </p>
              <RangeCalendar
                key={activeField}
                start={from ? parseIso(from) : null}
                end={to ? parseIso(to) : null}
                activeField={activeField}
                onSelect={selectDay}
                initialMonth={parseIso((activeField === 'end' ? to ?? from : from ?? to) ?? todayKey)}
                maxDate={parseIso(todayKey)}
              />
            </div>
          )}
        </div>

        <MultiSelectDropdown
          label="Staff"
          placeholder="All staff"
          options={staffOptions}
          selected={draft.staffIds}
          onChange={(next) => setDraft((d) => ({ ...d, staffIds: next }))}
          searchable
          disabled={staffOptions.length === 0}
          disabledHint="No staff hired yet"
        />
        {draft.staffIds.length > 0 && (
          <p className="-mt-2 px-0.5 text-[10.5px] text-slate-400">Amounts show the selected staff's share of each invoice.</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 pt-3 pb-6 border-t border-slate-100 shrink-0">
        <button
          type="button"
          onClick={() => onApply(EMPTY_INVOICE_FILTERS)}
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
