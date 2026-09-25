import React, { useState } from 'react';
import { AttendanceRecord } from '../../types/attendance';
import { Dropdown } from '../../design-system/components/Dropdown';
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  BarChart2,
  Clock,
  PieChart,
} from 'lucide-react';

interface ApplyLeaveViewProps {
  record: AttendanceRecord;
  onBack: () => void;
  onSubmit: (recordId: string, leaveType: string, session: string, reason: string) => void;
}

export const ApplyLeaveView: React.FC<ApplyLeaveViewProps> = ({
  record,
  onBack,
  onSubmit,
}) => {
  const [leaveType, setLeaveType] = useState('Casual Leave');
  const [session, setSession] = useState<'First Half' | 'Second Half'>('Second Half');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      onSubmit(record.id, leaveType, session, reason);
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
          className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-bold text-[#1E293B] ml-1">
          Apply Leave
        </h1>
      </header>

      {/* Scrollable Content Body matching Screenshot 5 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 no-scrollbar">
        {/* Date & Workplace Card */}
        <div className="bg-white border border-[#EBF0F7] rounded-[20px] p-4 shadow-2xs space-y-3">
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

          <div className="space-y-2 pt-1 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-500">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Workplace</span>
              </div>
              <span className="font-medium text-[#1E293B]">{record.workplace}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-500">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                <span>Work Mode</span>
              </div>
              <span className="font-medium text-[#1E293B]">{record.workMode}</span>
            </div>
          </div>
        </div>

        {/* Attendance Summary Card */}
        <div className="bg-white border border-[#EBF0F7] rounded-[20px] p-4 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-[#1E293B]">
            <BarChart2 className="w-4 h-4 text-[#2F68FE]" />
            <span>Attendance Summary</span>
          </div>

          <div className="rounded-xl border border-[#EBF0F7] bg-white divide-x divide-[#EBF0F7] grid grid-cols-2 p-3">
            <div className="pr-3">
              <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                <Clock className="w-3.5 h-3.5" />
                <span>Office Time</span>
              </div>
              <div className="text-sm font-bold text-[#1E293B] mt-0.5">
                {record.totalOfficeTime}
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                Required 09h
              </div>
            </div>

            <div className="pl-3">
              <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                <BarChart2 className="w-3.5 h-3.5" />
                <span>Working Time</span>
              </div>
              <div className="text-sm font-bold text-[#1E293B] mt-0.5">
                {record.totalWorkingTime}
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                Required 08h
              </div>
            </div>
          </div>
        </div>

        {/* Leave Application Form */}
        <div className="bg-white border border-[#EBF0F7] rounded-[20px] p-4 shadow-2xs space-y-4">
          {/* Leave Type */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Leave Type<span className="text-rose-500">*</span>
            </label>
            <Dropdown
              size="md"
              ariaLabel="Leave Type"
              value={leaveType}
              options={['Casual Leave', 'Sick Leave', 'Privilege Leave', 'Compensatory Off']}
              onChange={setLeaveType}
            />
          </div>

          {/* Duration (Read-only) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Duration
            </label>
            <div className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 flex items-center">
              Half Day
            </div>
          </div>

          {/* Session Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Session<span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setSession('First Half')}
                className={`h-11 rounded-xl text-xs font-semibold transition-all ${
                  session === 'First Half'
                    ? 'border-2 border-[#2F68FE] bg-[#F0F5FF] text-[#2F68FE] shadow-2xs'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                First Half
              </button>
              <button
                type="button"
                onClick={() => setSession('Second Half')}
                className={`h-11 rounded-xl text-xs font-semibold transition-all ${
                  session === 'Second Half'
                    ? 'border-2 border-[#2F68FE] bg-[#F0F5FF] text-[#2F68FE] shadow-2xs'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                Second Half
              </button>
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Reason<span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <textarea
                rows={3}
                value={reason}
                maxLength={500}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason for leave request..."
                className="w-full p-3 rounded-xl border border-slate-200 text-xs text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2F68FE] placeholder:text-slate-400"
              />
              <div className="text-[10px] text-slate-400 text-right mt-1">
                {reason.length}/500
              </div>
            </div>
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
          className="h-12 rounded-xl border border-[#2F68FE] text-[#2F68FE] font-semibold text-xs bg-white hover:bg-blue-50/50 active:bg-blue-100 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="h-12 rounded-xl bg-[#2F68FE] text-white font-semibold text-xs shadow-xs hover:bg-[#2558E6] active:bg-[#1D4ED8] transition-colors flex items-center justify-center"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Leave Request'}
        </button>
      </div>
    </div>
  );
};
