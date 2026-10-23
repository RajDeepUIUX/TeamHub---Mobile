import React, { useRef, useState } from 'react';
import { AttendanceRecord } from '../../types/attendance';
import { LeaveDurationType } from '../../types/leaves';
import { SelectReasonSheet } from '../leaves/SelectReasonSheet';
import { SelectDurationSheet } from '../leaves/SelectDurationSheet';
import { ArrowLeft, PieChart, ChevronDown, Paperclip, X, Wand2 } from 'lucide-react';
import { FileUploadField } from '../common/FileUploadField';

interface ApplyLeaveViewProps {
  record: AttendanceRecord;
  onBack: () => void;
  onSubmit: (
    recordId: string,
    data: { reason: string; duration: LeaveDurationType; description: string; attachmentName?: string }
  ) => void;
}

export const ApplyLeaveView: React.FC<ApplyLeaveViewProps> = ({
  record,
  onBack,
  onSubmit,
}) => {
  const [reason, setReason] = useState('');
  // Pre-selected from the day: absent -> Full Day, otherwise (half day) -> 4 Hours
  const [duration, setDuration] = useState<LeaveDurationType>(record.status === 'absent' ? 'Full Day' : '4 Hours');
  const [description, setDescription] = useState('');
  const [attachment, setAttachment] = useState<string | null>(null);
  const [isReasonSheetOpen, setIsReasonSheetOpen] = useState(false);
  const [isDurationSheetOpen, setIsDurationSheetOpen] = useState(false);
  const [errors, setErrors] = useState<{ reason?: string; description?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Demo helper: fills every field with realistic sample data
  const quickFill = () => {
    setReason('Medical (Personal)');
    setDescription('Was unwell with fever and could not log in. Doctor visit receipt attached.');
    setAttachment('medical-note.pdf');
    setErrors({});
  };

  const handleSubmit = () => {
    const found: typeof errors = {};
    if (!reason) found.reason = 'Select a reason.';
    if (!description.trim()) found.description = 'Add a description.';
    setErrors(found);
    if (found.reason || found.description) return;
    setIsSubmitting(true);
    setTimeout(() => {
      onSubmit(record.id, { reason, duration, description: description.trim(), attachmentName: attachment ?? undefined });
      setIsSubmitting(false);
      onBack();
    }, 400);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 text-[#1E293B] overflow-hidden select-none">
      {/* Top Header */}
      <header className="sticky top-0 z-30 flex items-center h-14 px-4 bg-white border-b border-[#EBF0F7]">
        <button
          type="button"
          onClick={onBack}
          className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-slate-700 active:bg-slate-100 transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-bold text-[#1E293B] screen-title screen-title-tight">
          Apply Leave
        </h1>
        <button type="button" onClick={quickFill} className="ml-auto h-8 px-2.5 rounded-full bg-indigo-50 text-[#4F46E5] text-[11px] font-semibold flex items-center gap-1 active:bg-indigo-100 cursor-pointer">
          <Wand2 className="w-3.5 h-3.5" />
          Quick Fill
        </button>
      </header>

      {/* Scrollable Content Body matching Screenshot 5 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 no-scrollbar">
        {/* Date & Workplace Card */}
        <div className="bg-white border border-[#EBF0F7] rounded-[20px] p-4 shadow-2xs">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-bold text-[#1E293B]">
                {record.dateFormatted}
              </h2>
              <p className="text-xs text-slate-400 font-normal">
                {record.dayOfWeek.slice(0, 3)}
              </p>
            </div>
            <span className="bg-[#FEF8E7] text-[#D97706] text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
              {record.statusLabel}
            </span>
          </div>

        </div>

        {/* Leave Application Form */}
        <div className="bg-white border border-[#EBF0F7] rounded-[20px] p-4 shadow-2xs space-y-4">
          {/* Reason (searchable sheet) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Reason<span className="text-rose-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setIsReasonSheetOpen(true)}
              className={`w-full h-11 px-3.5 bg-white border rounded-xl flex items-center justify-between text-xs shadow-2xs cursor-pointer ${
                errors.reason ? 'border-rose-300' : 'border-slate-200'
              }`}
            >
              <span className={reason ? 'font-semibold text-[#1E293B]' : 'font-medium text-slate-400'}>{reason || 'Select Reason'}</span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>
            {errors.reason && <p className="px-0.5 text-[11px] font-medium text-rose-500">{errors.reason}</p>}
          </div>

          {/* Leave Duration: 2 / 4 / 6 Hours or Full Day */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Leave Duration<span className="text-rose-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setIsDurationSheetOpen(true)}
              className="w-full h-11 px-3.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs font-semibold text-[#1E293B] shadow-2xs cursor-pointer"
            >
              <span>{duration}</span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Description<span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <textarea
                rows={3}
                value={description}
                maxLength={500}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (errors.description) setErrors((prev) => ({ ...prev, description: undefined }));
                }}
                placeholder="Add a description for your leave..."
                className={`w-full p-3 rounded-xl border text-xs text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2F68FE] placeholder:text-slate-400 resize-none ${
                  errors.description ? 'border-rose-300' : 'border-slate-200'
                }`}
              />
              <div className="flex items-center justify-between mt-1">
                <p className="px-0.5 text-[11px] font-medium text-rose-500">{errors.description}</p>
                <span className="text-[10px] text-slate-400">{description.length}/500</span>
              </div>
            </div>
          </div>

          {/* Attachment (optional, single file) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Attachment</label>
            <FileUploadField fileName={attachment} onChange={setAttachment} label="Add attachment" sheetTitle="Add Attachment" />
          </div>
        </div>

        {/* Leave Balance Card */}
        <div className="bg-white border border-[#EBF0F7] rounded-[20px] p-4 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-[#1E293B]">
            <PieChart className="w-4 h-4 text-[#2F68FE]" />
            <span>Leave Balance</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            <div>
              <span className="text-[11px] text-slate-500 block mb-1">Casual Leave</span>
              <span className="text-base font-bold text-[#2F68FE] tabular-nums">
                6 days
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block mb-1">Sick Leave</span>
              <span className="text-base font-bold text-[#2F68FE] tabular-nums">
                4 days
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block mb-1">Earned Leave</span>
              <span className="text-base font-bold text-[#2F68FE] tabular-nums">
                10 days
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Sticky Action Buttons */}
      <div className="sticky bottom-0 bg-white border-t border-[#EBF0F7] p-4 grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={onBack}
          className="h-12 rounded-xl border border-[#2F68FE] text-[#2F68FE] font-semibold text-xs bg-white active:bg-blue-100 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="h-12 rounded-xl bg-[#2F68FE] text-white font-semibold text-xs shadow-xs active:bg-[#1D4ED8] transition-colors flex items-center justify-center"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Leave Request'}
        </button>
      </div>

      <SelectReasonSheet
        isOpen={isReasonSheetOpen}
        onClose={() => setIsReasonSheetOpen(false)}
        selectedReason={reason}
        onSelect={(r) => {
          setReason(r);
          setErrors((prev) => ({ ...prev, reason: undefined }));
        }}
      />
      <SelectDurationSheet
        isOpen={isDurationSheetOpen}
        onClose={() => setIsDurationSheetOpen(false)}
        selectedDuration={duration}
        onSelect={setDuration}
        targetDayLabel={`for ${record.dateFormatted}`}
      />
    </div>
  );
};
