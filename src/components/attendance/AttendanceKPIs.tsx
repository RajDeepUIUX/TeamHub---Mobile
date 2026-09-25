import React from 'react';
import { AttendanceKPIs as AttendanceKPIsType } from '../../types/attendance';
import { ChevronRight, BarChart2 } from 'lucide-react';

interface AttendanceKPIsProps {
  kpis: AttendanceKPIsType;
  onOpenSummarySheet: () => void;
}

export const AttendanceKPIs: React.FC<AttendanceKPIsProps> = ({
  kpis,
  onOpenSummarySheet,
}) => {
  return (
    <div className="bg-white border border-[#EBF0F7] rounded-[20px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
      {/* 3 KPI Columns */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {/* Present Days */}
        <div className="flex flex-col items-center">
          <div className="w-14 h-9 rounded-lg bg-[#E8F8F0] text-[#10B981] font-bold text-lg flex items-center justify-center mb-1.5">
            {kpis.presentDays}
          </div>
          <span className="text-xs text-gray-500 font-medium">
            Present Days
          </span>
        </div>

        {/* Absent Days */}
        <div className="flex flex-col items-center">
          <div className="w-14 h-9 rounded-lg bg-[#FDECEC] text-[#F43F5E] font-bold text-lg flex items-center justify-center mb-1.5">
            {kpis.absentDays}
          </div>
          <span className="text-xs text-gray-500 font-medium">
            Absent Days
          </span>
        </div>

        {/* Leave Days */}
        <div className="flex flex-col items-center">
          <div className="w-14 h-9 rounded-lg bg-[#FEF8E7] text-[#F59E0B] font-bold text-lg flex items-center justify-center mb-1.5">
            {kpis.leaveDays}
          </div>
          <span className="text-xs text-gray-500 font-medium">
            Leave Days
          </span>
        </div>
      </div>

      {/* View Full Summary Row */}
      <div className="border-t border-[#F1F5F9] mt-3.5 pt-3">
        <button
          type="button"
          onClick={onOpenSummarySheet}
          className="w-full flex items-center justify-between text-xs font-semibold text-[#1E293B] hover:text-[#2F68FE] transition-colors group"
        >
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-[#2F68FE]" />
            <span>View Full Summary</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};
