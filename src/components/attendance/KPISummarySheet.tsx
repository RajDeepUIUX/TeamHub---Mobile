import React from 'react';
import { AttendanceKPIs } from '../../types/attendance';
import { X, Briefcase, Calendar, ChevronRight, DollarSign, Umbrella } from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet';

interface KPISummarySheetProps {
  isOpen: boolean;
  onClose: () => void;
  kpis: AttendanceKPIs;
  monthTitle: string;
  /** Tapping a tile that maps to a list filter closes the sheet and filters the days by that status */
  onPick: (status: 'All' | 'Absent') => void;
}

/** Tappable tile look: same card plus press feedback */
const pickCls = 'text-left active:bg-slate-50 active:border-[#2F68FE]/40 transition-colors cursor-pointer';

export const KPISummarySheet: React.FC<KPISummarySheetProps> = ({
  isOpen,
  onClose,
  kpis,
  monthTitle,
  onPick,
}) => {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[90vh]">
      {/* Drag Handle */}
      <div className="pt-3 pb-1 flex justify-center cursor-grab">
        <div className="w-10 h-1 bg-slate-300 rounded-full" />
      </div>

      {/* Sheet Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-[#1E293B]">
            Attendance Summary
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-normal">
            {monthTitle} · Complete KPI Breakdown
          </p>
        </div>
        <button
          onClick={onClose}
          type="button"
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

        {/* Scrollable Body with all 9 KPIs */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 no-scrollbar text-xs">
          {/* Section 1: Office & Working Days */}
          <div className="bg-[#F8FAFC] border border-[#EBF0F7] rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center gap-2 font-bold text-[#1E293B]">
              <Briefcase className="w-4 h-4 text-[#2F68FE]" />
              <span>Office &amp; Working Presence</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/60 shadow-2xs">
                <span className="text-[11px] text-slate-500 block mb-0.5">Working Days</span>
                <span className="text-base font-bold text-[#1E293B] tabular-nums">
                  {kpis.workingDays}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/60 shadow-2xs">
                <span className="text-[11px] text-slate-500 block mb-0.5">Present Days</span>
                <span className="text-base font-bold text-[#10B981] tabular-nums">
                  {kpis.presentDays}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onPick('All')}
                className={`bg-white p-2.5 rounded-xl border border-slate-200/60 shadow-2xs ${pickCls} text-center`}
                aria-label="Show all days"
              >
                <span className="text-[11px] text-slate-500 flex items-center justify-center gap-0.5 mb-0.5">
                  Total Days
                  <ChevronRight className="w-3 h-3 text-slate-300" />
                </span>
                <span className="text-base font-bold text-slate-700 tabular-nums">
                  {kpis.totalDays}
                </span>
              </button>
            </div>
          </div>

          {/* Section 2: Absences & Leaves */}
          <div className="bg-[#F8FAFC] border border-[#EBF0F7] rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center gap-2 font-bold text-[#1E293B]">
              <Umbrella className="w-4 h-4 text-[#F59E0B]" />
              <span>Leaves, Holidays &amp; Absences</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => onPick('Absent')}
                className={`bg-white p-2.5 rounded-xl border border-slate-200/60 flex items-center justify-between shadow-2xs ${pickCls}`}
                aria-label="Show absent days"
              >
                <span className="text-slate-600 font-medium">Absent Days</span>
                <span className="flex items-center gap-1">
                  <span className="text-sm font-bold text-[#F43F5E] tabular-nums">{kpis.absentDays}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                </span>
              </button>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/60 flex items-center justify-between shadow-2xs">
                <span className="text-slate-600 font-medium">Leave Days</span>
                <span className="text-sm font-bold text-[#F59E0B] tabular-nums">
                  {kpis.leaveDays}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/60 flex items-center justify-between shadow-2xs">
                <span className="text-slate-600 font-medium">Public Holidays</span>
                <span className="text-sm font-bold text-slate-700 tabular-nums">
                  {kpis.holidays}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/60 flex items-center justify-between shadow-2xs">
                <span className="text-slate-600 font-medium">LWP (Without Pay)</span>
                <span className="text-sm font-bold text-slate-700 tabular-nums">
                  {kpis.lwpDays}
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Payroll Compensation */}
          <div className="bg-[#F8FAFC] border border-[#EBF0F7] rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center gap-2 font-bold text-[#1E293B]">
              <DollarSign className="w-4 h-4 text-[#10B981]" />
              <span>Payroll Calculation</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="bg-white p-2.5 rounded-xl border border-blue-100 flex items-center justify-between shadow-2xs">
                <span className="text-slate-700 font-medium">Salary Days</span>
                <span className="text-base font-bold text-[#2F68FE] tabular-nums">
                  {kpis.salaryDays}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onPick('Absent')}
                className={`bg-white p-2.5 rounded-xl border border-slate-200/60 flex items-center justify-between shadow-2xs ${pickCls}`}
                aria-label="Show deduction days"
              >
                <span className="text-slate-600 font-medium">Deduction Days</span>
                <span className="flex items-center gap-1">
                  <span className="text-base font-bold text-slate-700 tabular-nums">{kpis.deductionDays}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Close Action */}
        <div className="p-4 pt-2 pb-8 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="w-full h-12 rounded-xl bg-[#2F68FE] text-white font-semibold text-sm shadow-xs active:bg-[#2558E6] transition-colors cursor-pointer"
          >
            Close Summary
          </button>
        </div>
    </BottomSheet>
  );
};
