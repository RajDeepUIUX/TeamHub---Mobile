import React, { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Paperclip,
  ChevronDown,
  ChevronRight,
  X,
} from 'lucide-react';
import { LeaveDurationType, LeaveDayItem, LeaveRequest } from '../../types/leaves';
import { SelectDateRangeSheet } from './SelectDateRangeSheet';
import { SelectDurationSheet } from './SelectDurationSheet';
import { SelectReasonSheet } from './SelectReasonSheet';

export const LEAVE_REASONS = [
  'Medical (Personal)',
  'Medical (Family)',
  'Functions/Rituals',
  'Marriage (Self)',
  'Marriage (In Family)',
  'Pregnancy',
  'Travel/Vacation',
  'Going Hometown',
  'Moving Houses',
  'Personal Task',
  'Mental Health Break',
  'Child Related',
  'Study for CA',
  'Study for EA',
  'Study for ACCA',
  'Study for CPA',
  'Sabbatical',
  'Others',
];

interface ApplyLeaveViewProps {
  onBack: () => void;
  onSubmit: (data: {
    startDate: string;
    endDate: string;
    daysCount: number;
    reason: string;
    description?: string;
    dayItems: LeaveDayItem[];
    attachmentName?: string;
  }) => void;
  availableBalance?: number;
  totalBalance?: number;
  /** When provided, the form opens pre-filled to edit this pending request */
  initialRequest?: LeaveRequest | null;
}

export const ApplyLeaveView: React.FC<ApplyLeaveViewProps> = ({
  onBack,
  onSubmit,
  availableBalance = 16,
  totalBalance = 18,
  initialRequest = null,
}) => {
  const isEditMode = !!initialRequest;
  const initialDays = initialRequest?.dayItems ?? [];

  // Date Range state
  const [hasSelectedDates, setHasSelectedDates] = useState(isEditMode);
  const [startDate, setStartDate] = useState(initialDays[0]?.date ?? '20 Oct 2026');
  const [endDate, setEndDate] = useState(initialDays[initialDays.length - 1]?.date ?? '23 Oct 2026');
  const [daysCount, setDaysCount] = useState(initialRequest?.daysCount ?? 4);

  // Day breakdown
  const [dayItems, setDayItems] = useState<LeaveDayItem[]>(initialDays.length ? initialDays : [
    { date: '20 Oct 2026', dayOfWeek: 'Monday', duration: 'Full Day' },
    { date: '21 Oct 2026', dayOfWeek: 'Tuesday', duration: 'Full Day' },
    { date: '22 Oct 2026', dayOfWeek: 'Wednesday', duration: 'Full Day' },
    { date: '23 Oct 2026', dayOfWeek: 'Thursday', duration: 'Full Day' },
  ]);

  // Master duration
  const [masterDuration, setMasterDuration] = useState<LeaveDurationType>(
    initialDays[0]?.duration ?? 'Full Day'
  );

  // Reason state (opens Bottom Sheet instead of dropdown)
  const [selectedReason, setSelectedReason] = useState<string>(initialRequest?.reason ?? '');
  const [isReasonSheetOpen, setIsReasonSheetOpen] = useState(false);

  // Description & Attachment
  const [description, setDescription] = useState(initialRequest?.description ?? '');
  const [attachment, setAttachment] = useState<string | null>(initialRequest?.attachmentName ?? null);

  // Sheets
  const [isDateSheetOpen, setIsDateSheetOpen] = useState(false);
  const [isDurationSheetOpen, setIsDurationSheetOpen] = useState(false);
  const [editingDayIndex, setEditingDayIndex] = useState<number | null>(null);

  const handleApplyDateRange = (start: string, end: string, count: number) => {
    setStartDate(start);
    setEndDate(end);
    setDaysCount(count);
    setHasSelectedDates(true);

    // Generate day items for range
    const days: LeaveDayItem[] = [];
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Parse start day number e.g. "20 Oct 2026"
    const startNum = parseInt(start.split(' ')[0], 10) || 20;
    for (let i = 0; i < count; i++) {
      const curNum = startNum + i;
      const d = new Date(2026, 9, curNum);
      const dayName = weekdays[d.getDay()];
      days.push({
        date: `${curNum} Oct 2026`,
        dayOfWeek: dayName,
        duration: masterDuration,
      });
    }
    setDayItems(days);
  };

  const handleMasterDurationChange = (dur: LeaveDurationType) => {
    setMasterDuration(dur);
    setDayItems((prev) => prev.map((item) => ({ ...item, duration: dur })));
  };

  const handleDayDurationChange = (dur: LeaveDurationType) => {
    if (editingDayIndex !== null) {
      setDayItems((prev) =>
        prev.map((item, idx) => (idx === editingDayIndex ? { ...item, duration: dur } : item))
      );
    }
  };

  const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachment(e.target.files[0].name);
    }
  };

  const handleContinueOrSubmit = () => {
    if (!hasSelectedDates) {
      setIsDateSheetOpen(true);
      return;
    }

    if (!selectedReason) {
      alert('Please select a reason for leave.');
      return;
    }

    onSubmit({
      startDate,
      endDate,
      daysCount,
      reason: selectedReason,
      description: description.trim(),
      dayItems,
      attachmentName: attachment || undefined,
    });
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      {/* Top Header */}
      <div className="bg-white border-b border-[#EBF0F7] px-4 py-3 flex items-center justify-between shadow-2xs shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
          <h1 className="text-base font-bold text-[#1E293B]">
            {isEditMode ? 'Edit Leave Request' : 'Apply for Leave'}
          </h1>
        </div>
      </div>

      {/* Form Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {/* Top PTO Balance Summary Card */}
        <div className="bg-white border border-[#EBF0F7] rounded-2xl p-4 shadow-2xs space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2F68FE] shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1E293B]">{initialRequest?.type ?? 'PTO'}</h2>
              {hasSelectedDates && (
                <p className="text-xs text-slate-500 font-medium">
                  {startDate} – {endDate}
                  <span className="block text-[11px] text-slate-400 mt-0.5">{daysCount} days</span>
                </p>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Available balance</span>
            <div className="font-bold text-[#1E293B]">
              <span className="text-[#2F68FE]">{availableBalance.toFixed(2)}</span>
              <span className="text-slate-400 font-normal"> / {totalBalance.toFixed(2)} days</span>
            </div>
          </div>
        </div>

        {/* Date Range Selection: Initial vs Configured */}
        {!hasSelectedDates ? (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[#1E293B]">Select Date Range</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-500">From Date</label>
                <button
                  type="button"
                  onClick={() => setIsDateSheetOpen(true)}
                  className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl flex items-center gap-2 text-xs font-medium text-slate-400 shadow-2xs hover:border-[#2F68FE] transition-colors cursor-pointer"
                >
                  <Calendar className="w-4 h-4 text-[#2F68FE]" />
                  <span>Select date</span>
                </button>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-500">To Date</label>
                <button
                  type="button"
                  onClick={() => setIsDateSheetOpen(true)}
                  className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl flex items-center gap-2 text-xs font-medium text-slate-400 shadow-2xs hover:border-[#2F68FE] transition-colors cursor-pointer"
                >
                  <Calendar className="w-4 h-4 text-[#2F68FE]" />
                  <span>Select date</span>
                </button>
              </div>
            </div>

            {/* Leave Duration Initial Notice Card */}
            <div className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-2xl flex items-center gap-3 text-xs">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="block font-bold text-slate-700">Leave Duration</span>
                <span className="text-[11px] text-slate-400 font-normal">
                  Select date range to configure leave duration
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Configured Date Range & Daily Breakdown */
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-[#1E293B]">Leave Duration</h3>
                <p className="text-[11px] text-slate-400 font-normal">
                  Apply the same duration to all days
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDateSheetOpen(true)}
                className="text-[11px] font-bold text-[#2F68FE] hover:underline cursor-pointer"
              >
                Change Dates
              </button>
            </div>

            {/* Master Dropdown for all days */}
            <button
              type="button"
              onClick={() => {
                setEditingDayIndex(null);
                setIsDurationSheetOpen(true);
              }}
              className="w-full h-11 px-3.5 bg-white border border-blue-200/80 rounded-xl flex items-center justify-between text-xs font-semibold text-[#1E293B] shadow-2xs hover:border-[#2F68FE] transition-colors cursor-pointer"
            >
              <span>{masterDuration}</span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {/* Individual Day Rows */}
            <div className="bg-white border border-[#EBF0F7] rounded-2xl divide-y divide-slate-100 shadow-2xs overflow-hidden">
              {dayItems.map((item, idx) => (
                <div
                  key={item.date}
                  onClick={() => {
                    setEditingDayIndex(idx);
                    setIsDurationSheetOpen(true);
                  }}
                  className="px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div>
                    <span className="block text-xs font-bold text-[#1E293B]">{item.date}</span>
                    <span className="block text-[11px] text-slate-400 font-normal">{item.dayOfWeek}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#2F68FE]">
                    <span>{item.duration}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 1. Reason Field (Triggers Bottom Sheet with all options) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-[#1E293B]">
            Reason<span className="text-rose-500">*</span>
          </label>
          <button
            type="button"
            onClick={() => setIsReasonSheetOpen(true)}
            className="w-full h-11 px-3.5 bg-white border border-slate-300 hover:border-slate-400 rounded-xl flex items-center justify-between text-xs font-medium transition-all shadow-2xs cursor-pointer"
          >
            <span className={selectedReason ? 'text-[#1E293B] font-semibold' : 'text-slate-500'}>
              {selectedReason || 'Select Reason'}
            </span>
            <ChevronDown className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* 2. Description */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-[#1E293B]">
            Description
          </label>
          <div className="relative">
            <textarea
              rows={3}
              value={description}
              maxLength={500}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add description..."
              className="w-full p-3.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-[#1E293B] placeholder:text-slate-400 focus:outline-hidden focus:border-[#2F68FE] focus:ring-1 focus:ring-[#2F68FE] resize-none shadow-2xs"
            />
            <span className="absolute bottom-2.5 right-3 text-[10px] text-slate-400 pointer-events-none">
              {description.length}/500
            </span>
          </div>
        </div>

        {/* Attachment Card */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-[#1E293B]">Attachment</label>
          <label className="border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/20 rounded-2xl p-4 flex items-center gap-3 cursor-pointer transition-colors block">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2F68FE] shrink-0">
              <Paperclip className="w-4.5 h-4.5" />
            </div>
            <div className="flex-1 min-w-0">
              {attachment ? (
                <div>
                  <span className="text-xs font-bold text-[#2F68FE] block truncate">{attachment}</span>
                  <span className="text-[10px] text-emerald-600 font-medium">Ready to upload</span>
                </div>
              ) : (
                <div>
                  <span className="text-xs font-bold text-[#2F68FE] block">Add attachment</span>
                  <span className="text-[11px] text-slate-400 block font-normal">PDF, JPG or PNG (Max 5 MB)</span>
                </div>
              )}
            </div>
            {attachment && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setAttachment(null);
                }}
                className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <input
              type="file"
              className="hidden"
              onChange={handleAttachmentUpload}
              accept=".pdf,.jpg,.jpeg,.png"
            />
          </label>
        </div>
      </div>

      {/* Sticky Bottom Action */}
      <div className="p-4 bg-white border-t border-[#EBF0F7] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] shrink-0 pb-6">
        <button
          type="button"
          onClick={handleContinueOrSubmit}
          className="w-full h-12 rounded-xl bg-[#2F68FE] text-white hover:bg-[#2558E6] active:bg-[#1D4ED8] font-bold text-xs flex items-center justify-center transition-all cursor-pointer shadow-xs"
        >
          {!hasSelectedDates ? 'Continue' : isEditMode ? 'Update Request' : 'Apply for Leave'}
        </button>
      </div>

      {/* Reason Bottom Sheet (opens instead of dropdown) */}
      <SelectReasonSheet
        isOpen={isReasonSheetOpen}
        onClose={() => setIsReasonSheetOpen(false)}
        selectedReason={selectedReason}
        onSelect={setSelectedReason}
      />

      {/* Date Range Bottom Sheet */}
      <SelectDateRangeSheet
        isOpen={isDateSheetOpen}
        onClose={() => setIsDateSheetOpen(false)}
        initialStartDate={startDate}
        initialEndDate={endDate}
        onApply={handleApplyDateRange}
      />

      {/* Duration Bottom Sheet */}
      <SelectDurationSheet
        isOpen={isDurationSheetOpen}
        onClose={() => {
          setIsDurationSheetOpen(false);
          setEditingDayIndex(null);
        }}
        selectedDuration={
          editingDayIndex !== null ? dayItems[editingDayIndex].duration : masterDuration
        }
        onSelect={
          editingDayIndex !== null ? handleDayDurationChange : handleMasterDurationChange
        }
        targetDayLabel={
          editingDayIndex !== null ? `For ${dayItems[editingDayIndex].date}` : undefined
        }
      />
    </div>
  );
};
