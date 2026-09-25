import React, { useState } from 'react';
import { AttendanceRecord } from '../../types/attendance';
import { Dropdown } from '../../design-system/components/Dropdown';
import { BottomSheet } from '../../design-system/components/BottomSheet';
import { Calendar, CheckCircle2 } from 'lucide-react';

interface ApplyLeaveSheetProps {
  isOpen: boolean;
  onClose: () => void;
  record: AttendanceRecord | null;
  onSubmit: (recordId: string, leaveType: string, half: string, reason: string) => void;
}

export const ApplyLeaveSheet: React.FC<ApplyLeaveSheetProps> = ({
  isOpen,
  onClose,
  record,
  onSubmit,
}) => {
  const [leaveType, setLeaveType] = useState('Casual Leave');
  const [halfType, setHalfType] = useState('First Half');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!record) return null;

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      onSubmit(record.id, leaveType, halfType, reason);
      setIsSubmitting(false);
      onClose();
    }, 500);
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Apply Leave for Half Day"
      subtitle={`${record.dayOfWeek}, ${record.dateFormatted}`}
      primaryActionLabel="Submit Leave Request"
      onPrimaryAction={handleSubmit}
      primaryActionLoading={isSubmitting}
      secondaryActionLabel="Cancel"
      onSecondaryAction={onClose}
    >
      <div className="space-y-4 text-xs">
        {/* Context Note */}
        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-slate-600 leading-relaxed text-[11px]">
          Apply for a <strong className="text-slate-800">Half Day (0.5 Day)</strong> leave to regularize your attendance record for {record.dateFormatted}.
        </div>

        {/* Leave Type Selector */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-semibold text-slate-700">
            Leave Type <span className="text-rose-500">*</span>
          </label>
          <Dropdown
            size="md"
            ariaLabel="Leave Type"
            value={leaveType}
            options={[
              { value: 'Casual Leave', label: 'Casual Leave (CL)' },
              { value: 'Sick Leave', label: 'Sick Leave (SL)' },
              { value: 'Privilege Leave', label: 'Privilege Leave (PL)' },
              { value: 'Compensatory Off', label: 'Compensatory Off (Comp-Off)' },
            ]}
            onChange={setLeaveType}
          />
        </div>

        {/* Half Day Session */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-semibold text-slate-700">
            Applicable Session
          </label>
          <div className="grid grid-cols-2 gap-2">
            {['First Half', 'Second Half'].map((half) => (
              <button
                key={half}
                type="button"
                onClick={() => setHalfType(half)}
                className={`h-10 rounded-xl font-semibold transition-all text-xs border ${
                  halfType === half
                    ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {half}
              </button>
            ))}
          </div>
        </div>

        {/* Reason / Notes */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-semibold text-slate-700">
            Reason / Comments (Optional)
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Brief reason for the half-day leave..."
            className="w-full p-3 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all shadow-2xs placeholder:text-slate-400"
          />
        </div>
      </div>
    </BottomSheet>
  );
};
