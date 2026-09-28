import React, { useState, useEffect } from 'react';
import { X, Info, AlertCircle } from 'lucide-react';
import { WFORecord } from '../../types/wfo';
import {
  MONTH_NAMES,
  YEAR_OPTIONS,
  WFO_DAILY_ALLOWANCE,
  WFO_ALLOWANCE_BRANCH,
  formatINR,
  wfoAllowanceFor,
} from '../../data/wfoData';
import { BottomSheet } from '../common/BottomSheet';
import { Dropdown } from '../../design-system/components/Dropdown';

interface AddWFOSheetProps {
  isOpen: boolean;
  onClose: () => void;
  recordToEdit: WFORecord | null;
  onSubmit: (month: string, year: number, days: number, idToEdit?: string) => void;
  /** Existing requests, used to block months that were already submitted */
  existingRecords?: WFORecord[];
}

// New requests default to the current month and year
const currentPeriod = () => {
  const now = new Date();
  return { year: now.getFullYear(), month: MONTH_NAMES[now.getMonth()] };
};

export const AddWFOSheet: React.FC<AddWFOSheetProps> = ({
  isOpen,
  onClose,
  recordToEdit,
  onSubmit,
  existingRecords = [],
}) => {
  const [cachedRecord, setCachedRecord] = useState<WFORecord | null>(recordToEdit);
  const [year, setYear] = useState<number>(2026);
  const [month, setMonth] = useState<string>('September');
  const [days, setDays] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const editingId = (recordToEdit || cachedRecord)?.id;

  // A month can't be requested twice: approved months are locked, and a pending
  // request should be edited rather than duplicated
  const takenMonth = (m: string, y: number) =>
    existingRecords.find((r) => r.month === m && r.year === y && r.id !== editingId && r.status !== 'Rejected');

  useEffect(() => {
    if (recordToEdit) {
      setCachedRecord(recordToEdit);
      setYear(recordToEdit.year);
      setMonth(recordToEdit.month);
      setDays(recordToEdit.days);
    } else if (isOpen) {
      setCachedRecord(null);
      const { year: y, month: m } = currentPeriod();
      setYear(y);
      setMonth(m);
      setDays(null);
    }
  }, [recordToEdit, isOpen]);

  const conflict = takenMonth(month, year);

  // No future periods: hide later years, and later months of the current year
  const now = currentPeriod();
  const currentMonthIdx = MONTH_NAMES.indexOf(now.month);
  const yearOptions = YEAR_OPTIONS.filter((y) => y <= now.year);
  const selectableMonths = year === now.year ? MONTH_NAMES.slice(0, currentMonthIdx + 1) : MONTH_NAMES;

  const handleYearChange = (y: number) => {
    setYear(y);
    // Switching to the current year can leave a future month selected
    if (y === now.year && MONTH_NAMES.indexOf(month) > currentMonthIdx) setMonth(now.month);
  };

  const monthOptions = selectableMonths.map((m) => {
    const taken = takenMonth(m, year);
    return {
      value: m,
      label: m,
      disabled: Boolean(taken),
      description: taken ? (taken.status === 'Approved' ? 'Already approved' : 'Already submitted') : undefined,
    };
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (conflict || days === null) return;
    setIsSubmitting(true);
    setTimeout(() => {
      onSubmit(month, year, days, (recordToEdit || cachedRecord)?.id);
      setIsSubmitting(false);
      onClose();
    }, 300);
  };

  const dayOptions = Array.from({ length: 31 }, (_, i) => i + 1);
  const isEditing = Boolean(recordToEdit || cachedRecord);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[90vh]">
      {/* Drag Handle */}
      <div className="pt-3 pb-1 flex justify-center cursor-grab">
        <div className="w-10 h-1 bg-slate-300 rounded-full" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
        <h2 className="text-base font-bold text-[#1E293B]">
          {isEditing ? 'Edit WFO Days' : 'Add WFO Days'}
        </h2>
        <button
          onClick={onClose}
          type="button"
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Form Body */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
        {/* Year · Month · Days on one row */}
        <div className="space-y-1.5">
          <div className="grid grid-cols-[1fr_1.35fr_1fr] gap-2">
            <div className="space-y-1.5 min-w-0">
              <label className="block text-xs font-semibold text-slate-700">
                Year <span className="text-rose-500">*</span>
              </label>
              <Dropdown
                ariaLabel="Year"
                value={year}
                options={yearOptions}
                onChange={handleYearChange}
              />
            </div>
            <div className="space-y-1.5 min-w-0">
              <label className="block text-xs font-semibold text-slate-700">
                Month <span className="text-rose-500">*</span>
              </label>
              <Dropdown
                ariaLabel="Month"
                value={month}
                options={monthOptions}
                onChange={setMonth}
                menuMinWidth={180}
              />
            </div>
            <div className="space-y-1.5 min-w-0">
              <label className="block text-xs font-semibold text-slate-700">
                Days <span className="text-rose-500">*</span>
              </label>
              <Dropdown
                ariaLabel="Days"
                value={days}
                placeholder="Select"
                options={dayOptions}
                onChange={setDays}
              />
            </div>
          </div>
          {conflict && (
            <p className="flex items-start gap-1.5 px-0.5 text-[11px] font-medium text-rose-500">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" />
              {conflict.status === 'Approved'
                ? `${month} ${year} is already approved. Choose another month.`
                : `A request for ${month} ${year} is already pending. Edit that request instead.`}
            </p>
          )}
        </div>

        {/* Notice Box matching Image 3 */}
        <div className="bg-[#EFF6FF] border border-[#DBEAFE] text-[#2563EB] rounded-xl p-3.5 flex items-center gap-2.5 text-xs font-medium">
          <Info className="w-4 h-4 text-[#2563EB] shrink-0" />
          <span>WFO days will be submitted for approval.</span>
        </div>

        {/* Live allowance estimate */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 flex items-center justify-between text-xs">
          <div>
            <span className="block font-semibold text-slate-600">Estimated allowance</span>
            <span className="block text-[11px] text-slate-400 tabular-nums">
              {days === null
                ? `Select days · ${formatINR(WFO_DAILY_ALLOWANCE)} per day`
                : `${days} days × ${formatINR(WFO_DAILY_ALLOWANCE)} · paid once approved`}
            </span>
            <span className="block text-[10px] text-slate-400 mt-0.5">Applicable to {WFO_ALLOWANCE_BRANCH} staff only</span>
          </div>
          <span className="text-base font-extrabold text-[#1E293B] tabular-nums">{days === null ? '—' : formatINR(wfoAllowanceFor(days))}
          </span>
        </div>

        {/* Actions: Cancel & Submit */}
        <div className="grid grid-cols-2 gap-3 pt-2 pb-6">
          <button
            type="button"
            onClick={onClose}
            className="h-12 rounded-xl border border-[#2F68FE] text-[#2F68FE] font-bold text-xs bg-white hover:bg-blue-50/50 active:bg-blue-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || Boolean(conflict) || days === null}
            className="h-12 rounded-xl bg-[#2F68FE] text-white font-bold text-xs shadow-xs hover:bg-[#2558E6] active:bg-[#1D4ED8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center cursor-pointer"
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </form>
    </BottomSheet>
  );
};
