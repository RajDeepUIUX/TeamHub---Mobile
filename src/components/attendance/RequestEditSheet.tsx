import React, { useState, useEffect } from 'react';
import { AttendanceRecord } from '../../types/attendance';
import { Dropdown } from '../../design-system/components/Dropdown';
import { X, Calendar, Building, BarChart2, Clock, Info } from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet';

interface RequestEditSheetProps {
  isOpen: boolean;
  onClose: () => void;
  record: AttendanceRecord | null;
  onSubmit: (
    recordId: string,
    officeTime: string,
    workingTime: string,
    reason: string,
    note?: string
  ) => void;
}

export const RequestEditSheet: React.FC<RequestEditSheetProps> = ({
  isOpen,
  onClose,
  record,
  onSubmit,
}) => {
  const [cachedRecord, setCachedRecord] = useState<AttendanceRecord | null>(record);
  const [officeTime, setOfficeTime] = useState('09 : 00');
  const [workingTime, setWorkingTime] = useState('08 : 15');
  const [reason, setReason] = useState('Punching Error');
  const [note, setNote] = useState('');
  const [noteError, setNoteError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (record) {
      setCachedRecord(record);
      setOfficeTime('09 : 00');
      setWorkingTime('08 : 15');
      setReason('Punching Error');
      setNote('');
      setNoteError('');
    }
  }, [record]);

  const activeRecord = record || cachedRecord;
  if (!activeRecord) return null;

  const requiresNote = reason === 'Others' || reason === 'Hybrid';

  const handleSubmit = () => {
    if (requiresNote && !note.trim()) {
      setNoteError(`Please provide a note for ${reason}.`);
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      // Clean string
      onSubmit(activeRecord.id, '09h 00m', '08h 15m', reason, note.trim() || undefined);
      setIsSubmitting(false);
      onClose();
    }, 400);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[92vh]">
      {/* Drag Handle */}
      <div className="pt-3 pb-1 flex justify-center cursor-grab">
        <div className="w-10 h-1 bg-slate-300 rounded-full" />
      </div>

      {/* Sheet Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
        <h2 className="text-lg font-bold text-[#1E293B]">
          Request Attendance Edit
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

      {/* Scrollable Form Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 no-scrollbar">
        {/* Date Card */}
        <div className="flex items-center gap-3 p-3 bg-white border border-[#EBF0F7] rounded-xl shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-center text-slate-700 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-sm text-[#1E293B]">
              {activeRecord.dateFormatted}
            </div>
            <div className="text-xs text-slate-400 font-normal">
              {activeRecord.dayOfWeek}
            </div>
          </div>
        </div>

        {/* Current Attendance Box */}
        <div className="p-4 bg-white border border-[#EBF0F7] rounded-xl shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">
              Current Attendance
            </span>
            <span className="bg-[#FEF8E7] text-[#D97706] text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
              {activeRecord.statusLabel}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                <Building className="w-3.5 h-3.5" />
                <span>Office Time</span>
              </div>
              <div className="text-sm font-bold text-[#1E293B] mt-0.5">
                {activeRecord.totalOfficeTime}
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                Required 09h
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                <BarChart2 className="w-3.5 h-3.5" />
                <span>Working Time</span>
              </div>
              <div className="text-sm font-bold text-[#1E293B] mt-0.5">
                {activeRecord.totalWorkingTime}
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                Required 08h
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Inputs for Requested Hours */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Requested Office Time<span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="text"
                value={officeTime}
                onChange={(e) => setOfficeTime(e.target.value)}
                className="w-full h-11 pl-9 pr-3 rounded-xl border border-slate-200 text-xs font-medium text-[#1E293B] focus:outline-hidden focus:ring-2 focus:ring-[#2F68FE]"
              >
              </input>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Requested Working Time<span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="text"
                value={workingTime}
                onChange={(e) => setWorkingTime(e.target.value)}
                className="w-full h-11 pl-9 pr-3 rounded-xl border border-slate-200 text-xs font-medium text-[#1E293B] focus:outline-hidden focus:ring-2 focus:ring-[#2F68FE]"
              >
              </input>
            </div>
          </div>
        </div>

        {/* Reason Dropdown */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">
            Reason<span className="text-rose-500">*</span>
          </label>
          <Dropdown
            size="md"
            ariaLabel="Reason"
            value={reason}
            options={['Punching Error', 'Hybrid', 'Work From Home', 'Others']}
            onChange={(val) => {
              setReason(val);
              setNoteError('');
            }}
          />
        </div>

        {/* Conditional Note Section for 'Hybrid' and 'Others' */}
        {requiresNote && (
          <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700">
                Note<span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">
                {reason === 'Hybrid' ? 'Specify hybrid details' : 'Enter manual note'}
              </span>
            </div>
            <div className="relative">
              <textarea
                rows={3}
                value={note}
                onChange={(e) => {
                  setNote(e.target.value);
                  if (noteError) setNoteError('');
                }}
                placeholder={
                  reason === 'Hybrid'
                    ? 'Enter details regarding hybrid work hours, office location or manager approval...'
                    : 'Enter specific reason or explanation...'
                }
                className={`w-full p-3 rounded-xl border text-xs font-medium text-[#1E293B] placeholder:text-slate-400 focus:outline-hidden focus:ring-1 resize-none transition-colors ${
                  noteError
                    ? 'border-rose-400 bg-rose-50/20 focus:ring-rose-500 focus:border-rose-500'
                    : 'border-slate-200 bg-white focus:ring-[#2F68FE] focus:border-[#2F68FE]'
                }`}
              />
            </div>
            {noteError && (
              <p className="text-[11px] text-rose-500 font-medium">{noteError}</p>
            )}
          </div>
        )}

        {/* Info Notice Box */}
        <div className="bg-[#EFF6FF] border border-[#DBEAFE] text-[#2563EB] rounded-xl p-3.5 flex items-start gap-2.5 text-xs leading-relaxed">
          <Info className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
          <span>
            The submitted values will be recorded as requested hours and will be subject to approval.
          </span>
        </div>
      </div>

      {/* Bottom Actions: Cancel & Submit Request */}
      <div className="grid grid-cols-2 gap-2.5 p-4 pt-2 pb-8 border-t border-slate-100">
        <button
          type="button"
          onClick={onClose}
          className="h-12 rounded-xl border border-[#2F68FE] text-[#2F68FE] font-semibold text-xs bg-white hover:bg-blue-50/50 active:bg-blue-100 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="h-12 rounded-xl bg-[#2F68FE] text-white font-semibold text-xs shadow-xs hover:bg-[#2558E6] active:bg-[#1D4ED8] transition-colors flex items-center justify-center cursor-pointer"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Request'}
        </button>
      </div>
    </BottomSheet>
  );
};
