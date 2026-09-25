import React from 'react';
import { AttendanceRecord } from '../../types/attendance';
import {
  MapPin,
  Briefcase,
  Clock,
  Building,
  BarChart2,
  List,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Info,
  FileText,
} from 'lucide-react';

interface AttendanceCardProps {
  record: AttendanceRecord;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onViewPunchLogs: (record: AttendanceRecord) => void;
  onRequestEdit: (record: AttendanceRecord) => void;
  onApplyLeave: (record: AttendanceRecord) => void;
}

export const AttendanceCard: React.FC<AttendanceCardProps> = ({
  record,
  isExpanded = false,
  onToggleExpand,
  onViewPunchLogs,
  onRequestEdit,
  onApplyLeave,
}) => {
  const isHalfDay = record.status === 'half_day';
  const isAbsent = record.status === 'absent';
  const isWeeklyOff = record.status === 'weekly_off';
  const isFullDay = record.status === 'full_day';

  // Status badge styling matching screenshots
  const renderStatusBadge = () => {
    switch (record.status) {
      case 'half_day':
        return (
          <span className="bg-[#FEF8E7] text-[#D97706] text-[11px] font-semibold px-2.5 py-0.5 rounded-full shrink-0">
            Half Day
          </span>
        );
      case 'full_day':
        return (
          <span className="bg-[#E8F8F0] text-[#10B981] text-[11px] font-semibold px-2.5 py-0.5 rounded-full shrink-0">
            Full Day
          </span>
        );
      case 'absent':
        return (
          <span className="bg-[#EDE9FE] text-[#6366F1] text-[11px] font-semibold px-2.5 py-0.5 rounded-full shrink-0">
            Absent
          </span>
        );
      case 'weekly_off':
        return (
          <span className="bg-[#FEF8E7] text-[#D97706] text-[11px] font-semibold px-2.5 py-0.5 rounded-full shrink-0">
            WO
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`bg-white border rounded-[20px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition-all ${
        isExpanded ? 'border-[#C7D9FB] shadow-[0_4px_14px_rgba(47,104,254,0.06)]' : 'border-[#EBF0F7] hover:border-[#D9E4F5]'
      }`}
    >
      {/* Header: Clickable row to toggle expand/collapse */}
      <div
        onClick={onToggleExpand}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggleExpand?.();
          }
        }}
        className="flex items-center justify-between gap-3 cursor-pointer select-none group focus:outline-hidden"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-[15px] text-[#1E293B] group-hover:text-[#2F68FE] transition-colors leading-tight">
              {record.dateFormatted}
            </h3>
            {record.editRequested && (
              <span className="bg-[#EFF6FF] border border-[#BFDBFE] text-[#2F68FE] text-[10px] font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                <Clock className="w-2.5 h-2.5 text-[#2F68FE]" />
                <span>Edit Submitted</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium mt-1">
            <span>{record.dayOfWeek}</span>
            <span className="text-gray-300">·</span>
            <span className="truncate">
              {record.date === '2026-09-04'
                ? 'Janmasthmi (Holiday)'
                : isWeeklyOff
                ? 'Weekly Off'
                : record.workMode || 'In Office'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {renderStatusBadge()}
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
              isExpanded
                ? 'bg-[#EFF6FF] text-[#2F68FE]'
                : 'bg-slate-50 text-gray-400 group-hover:bg-[#EFF6FF] group-hover:text-[#2F68FE]'
            }`}
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-250 ${
                isExpanded ? 'rotate-180 text-[#2F68FE]' : ''
              }`}
            />
          </div>
        </div>
      </div>

      {/* Collapsed State: Clean, Structured Mini Stats Row */}
      {!isExpanded && !isWeeklyOff && (!isAbsent || record.punches.length > 0) && (
        <div
          onClick={onToggleExpand}
          className="mt-3 pt-3 border-t border-[#F1F5F9] grid grid-cols-2 gap-2.5 cursor-pointer"
        >
          <div className="flex items-center gap-2.5 bg-[#F8FAFC] hover:bg-[#F1F5F9] rounded-xl px-3 py-2 border border-[#EBF0F7] transition-colors">
            <div className="w-6 h-6 rounded-lg bg-[#EFF6FF] flex items-center justify-center text-[#2F68FE] shrink-0">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider leading-none">
                Office
              </div>
              <div className="text-xs font-bold text-[#1E293B] mt-0.5 truncate">
                {record.totalOfficeTime}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-[#F8FAFC] hover:bg-[#F1F5F9] rounded-xl px-3 py-2 border border-[#EBF0F7] transition-colors">
            <div className="w-6 h-6 rounded-lg bg-[#E8F8F0] flex items-center justify-center text-[#10B981] shrink-0">
              <BarChart2 className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider leading-none">
                Working
              </div>
              <div className="text-xs font-bold text-[#1E293B] mt-0.5 truncate">
                {record.totalWorkingTime}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collapsed State: Weekly Off */}
      {!isExpanded && isWeeklyOff && (
        <div
          onClick={onToggleExpand}
          className="mt-2.5 pt-2.5 border-t border-[#F1F5F9] flex items-center gap-2 text-xs text-blue-600 font-medium cursor-pointer"
        >
          <Info className="w-3.5 h-3.5" />
          <span>
            {record.date === '2026-09-04'
              ? 'Public Holiday (Janmasthmi) · Status: WO'
              : 'Scheduled Weekly Off'}
          </span>
        </div>
      )}

      {/* Collapsed State: Absent */}
      {!isExpanded && isAbsent && record.punches.length === 0 && (
        <div
          onClick={onToggleExpand}
          className="mt-2.5 pt-2.5 border-t border-[#F1F5F9] flex items-center gap-2 text-xs text-red-500 font-medium cursor-pointer"
        >
          <AlertCircle className="w-3.5 h-3.5" />
          <span>No attendance logged</span>
        </div>
      )}

      {/* Expanded Content Body */}
      {isExpanded && (
        <div className="pt-3.5 mt-3 border-t border-[#F1F5F9] space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
          {/* Workplace & Work Mode Row */}
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              <span>{record.workplace}</span>
            </div>
            <span className="text-gray-300">|</span>
            <div className="flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-gray-400" />
              <span>{record.workMode}</span>
            </div>
          </div>

          {/* State-specific Body */}
          {isWeeklyOff && (
            <div className="bg-[#EFF6FF] border border-[#DBEAFE] text-[#2563EB] rounded-xl p-3 text-xs flex items-center gap-2 font-medium">
              <Info className="w-4 h-4 text-[#2563EB] shrink-0" />
              <span>Weekly Off</span>
            </div>
          )}

          {isAbsent && record.punches.length === 0 && (
            <div className="bg-[#FEF2F2] border border-[#FEE2E2] text-[#EF4444] rounded-xl p-3 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0" />
              <span>No attendance recorded for this day.</span>
            </div>
          )}

          {!isWeeklyOff && (!isAbsent || record.punches.length > 0) && (
            /* 2x2 Time Tracking Box */
            <div className="rounded-xl border border-[#EBF0F7] bg-white divide-y divide-[#EBF0F7] overflow-hidden">
              {/* Top Row: Start Time & End Time */}
              <div className="grid grid-cols-2 divide-x divide-[#EBF0F7]">
                <div className="p-3">
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Start Time</span>
                  </div>
                  <div className="text-sm font-bold text-[#1E293B] mt-0.5">
                    {record.startTime}
                  </div>
                </div>

                <div className="p-3">
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>End Time</span>
                  </div>
                  <div className="text-sm font-bold text-[#1E293B] mt-0.5">
                    {record.endTime}
                  </div>
                </div>
              </div>

              {/* Bottom Row: Office Time & Working Time */}
              <div className="grid grid-cols-2 divide-x divide-[#EBF0F7]">
                <div className="p-3">
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                    <Building className="w-3.5 h-3.5" />
                    <span>Office Time</span>
                  </div>
                  <div className="text-sm font-bold text-[#1E293B] mt-0.5">
                    {record.totalOfficeTime}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    Required 09h
                  </div>
                </div>

                <div className="p-3">
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
          )}

          {/* Requested Correction Block (If edit was submitted per Screenshot 6) */}
          {record.editRequested && (
            <div className="bg-[#F8FAFF] border border-[#E0EAFF] rounded-xl p-3.5 space-y-2.5">
              <div className="text-xs font-semibold text-[#2F68FE]">
                Requested Correction
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="flex items-center gap-1 text-[11px] text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>Requested Office Time</span>
                  </div>
                  <div className="font-bold text-[#1E293B] text-xs mt-0.5">
                    {record.reqOfficeHrs}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-[11px] text-gray-400">
                    <BarChart2 className="w-3 h-3" />
                    <span>Requested Working Time</span>
                  </div>
                  <div className="font-bold text-[#1E293B] text-xs mt-0.5">
                    {record.reqWorkHrs}
                  </div>
                </div>
              </div>
              <div className="pt-1 border-t border-[#E0EAFF]/70">
                <div className="flex items-center gap-1 text-[11px] text-gray-400">
                  <FileText className="w-3 h-3" />
                  <span>Reason</span>
                </div>
                <div className="font-bold text-[#1E293B] text-xs mt-0.5">
                  {record.editReason || 'Punching Error'}
                </div>
                {record.editNote && (
                  <div className="mt-2 bg-white/90 border border-[#DBEAFE] rounded-lg p-2.5 text-xs">
                    <span className="text-[11px] font-semibold text-slate-500 block mb-0.5">
                      Note:
                    </span>
                    <span className="text-slate-700">
                      &quot;{record.editNote}&quot;
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* View Attendance Details Link Row */}
          {!isWeeklyOff && (
            <button
              type="button"
              onClick={() => onViewPunchLogs(record)}
              className="w-full flex items-center justify-between text-xs font-medium text-gray-600 hover:text-[#2F68FE] pt-1 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <List className="w-4 h-4 text-gray-400 group-hover:text-[#2F68FE]" />
                <span>View Attendance Details</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}

          {/* Pending Approval Notice Banner (If edit submitted per Screenshot 6) */}
          {record.editRequested && (
            <div className="bg-[#FEF8E7] text-[#D97706] rounded-xl p-3 text-xs font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#D97706] shrink-0" />
              <span>Edit request is pending approval.</span>
            </div>
          )}

          {/* Action Buttons: Request Edit & Apply Leave (Only for Half Day / Absent without edit request) */}
          {(isHalfDay || isAbsent) && !record.editRequested && (
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => onRequestEdit(record)}
                className="h-11 rounded-xl border border-[#2F68FE] text-[#2F68FE] text-xs font-semibold bg-white hover:bg-blue-50/50 active:bg-blue-100 transition-colors flex items-center justify-center cursor-pointer"
              >
                Request Edit
              </button>
              <button
                type="button"
                onClick={() => onApplyLeave(record)}
                className="h-11 rounded-xl bg-[#2F68FE] text-white text-xs font-semibold shadow-xs hover:bg-[#2558E6] active:bg-[#1D4ED8] transition-colors flex items-center justify-center cursor-pointer"
              >
                Apply Leave
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
