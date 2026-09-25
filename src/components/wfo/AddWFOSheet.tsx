import React, { useState, useEffect } from 'react';
import { X, Calendar, Info } from 'lucide-react';
import { WFORecord } from '../../types/wfo';
import { MONTH_NAMES, YEAR_OPTIONS } from '../../data/wfoData';
import { BottomSheet } from '../common/BottomSheet';
import { Dropdown } from '../../design-system/components/Dropdown';

interface AddWFOSheetProps {
  isOpen: boolean;
  onClose: () => void;
  recordToEdit: WFORecord | null;
  onSubmit: (month: string, year: number, days: number, idToEdit?: string) => void;
}

export const AddWFOSheet: React.FC<AddWFOSheetProps> = ({
  isOpen,
  onClose,
  recordToEdit,
  onSubmit,
}) => {
  const [cachedRecord, setCachedRecord] = useState<WFORecord | null>(recordToEdit);
  const [year, setYear] = useState<number>(2026);
  const [month, setMonth] = useState<string>('September');
  const [days, setDays] = useState<number>(20);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (recordToEdit) {
      setCachedRecord(recordToEdit);
      setYear(recordToEdit.year);
      setMonth(recordToEdit.month);
      setDays(recordToEdit.days);
    } else if (isOpen) {
      setCachedRecord(null);
      setYear(2026);
      setMonth('September');
      setDays(20);
    }
  }, [recordToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
        {/* Year */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">
            Year <span className="text-rose-500">*</span>
          </label>
          <Dropdown
            ariaLabel="Year"
            icon={<Calendar className="w-4 h-4" />}
            value={year}
            options={YEAR_OPTIONS}
            onChange={setYear}
          />
        </div>

        {/* Month */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">
            Month <span className="text-rose-500">*</span>
          </label>
          <Dropdown
            ariaLabel="Month"
            icon={<Calendar className="w-4 h-4" />}
            value={month}
            options={MONTH_NAMES}
            onChange={setMonth}
          />
        </div>

        {/* Days */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">
            Days <span className="text-rose-500">*</span>
          </label>
          <Dropdown
            ariaLabel="Days"
            icon={<Calendar className="w-4 h-4" />}
            value={days}
            options={dayOptions}
            onChange={setDays}
          />
        </div>

        {/* Notice Box matching Image 3 */}
        <div className="bg-[#EFF6FF] border border-[#DBEAFE] text-[#2563EB] rounded-xl p-3.5 flex items-center gap-2.5 text-xs font-medium">
          <Info className="w-4 h-4 text-[#2563EB] shrink-0" />
          <span>WFO days will be submitted for approval.</span>
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
            disabled={isSubmitting}
            className="h-12 rounded-xl bg-[#2F68FE] text-white font-bold text-xs shadow-xs hover:bg-[#2558E6] active:bg-[#1D4ED8] transition-colors flex items-center justify-center cursor-pointer"
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </form>
    </BottomSheet>
  );
};
