import React, { useMemo, useState } from 'react';
import { CirclePlus, ChevronRight, Clock, Luggage, Palmtree, Plane, Stethoscope, WalletMinimal } from 'lucide-react';
import { BottomSheet } from '../../../common/BottomSheet';
import { SegmentedTabs } from '../../../../design-system/components/SegmentedTabs';
import type { ClientStaffMember } from '../../data/clientStaffData';
import { formatStaffDate } from '../../data/clientStaffData';
import { LeaveBalance, LeaveRecord, StaffWorkMode, leaveBalancesFor, leavesFor } from '../../data/clientStaffProfileData';
import { Card, ChipRow, EmptyCard, SheetHeader, TabTitle } from './StaffTabParts';
import { StaffAttendancePanel } from './StaffAttendancePanel';

interface StaffAttendanceLeaveTabProps {
  member: ClientStaffMember;
  workMode: StaffWorkMode;
}

type View = 'attendance' | 'leave';
const LEAVE_TYPES = ['All', 'Paid Leave', 'Half Paid Leave', 'Sick Leave', 'Unpaid Leave'] as const;
type LeaveTypeFilter = (typeof LEAVE_TYPES)[number];

const BALANCE_STYLE: Record<LeaveBalance['label'], { icon: React.ElementType; tile: string; bar: string }> = {
  'PTO Leaves': { icon: Palmtree, tile: 'bg-[#EFF6FF] text-[#2F68FE]', bar: 'bg-[#2F68FE]' },
  'OT Leaves': { icon: Clock, tile: 'bg-[#EEF2FF] text-[#4F46E5]', bar: 'bg-[#6366F1]' },
  'Additional Leave': { icon: CirclePlus, tile: 'bg-[#E8F8F0] text-[#10B981]', bar: 'bg-[#10B981]' },
};

const LEAVE_STYLE: Record<LeaveRecord['leaveType'], { icon: React.ElementType; tile: string; pill: string }> = {
  'Paid Leave': { icon: Plane, tile: 'bg-[#EFF6FF] text-[#1D4ED8]', pill: 'bg-[#EFF6FF] text-[#1D4ED8]' },
  'Half Paid Leave': { icon: Plane, tile: 'bg-[#FFF7ED] text-[#C2410C]', pill: 'bg-[#FFF7ED] text-[#EA580C]' },
  'Sick Leave': { icon: Stethoscope, tile: 'bg-[#FEF8E7] text-[#B45309]', pill: 'bg-[#FEF8E7] text-[#D97706]' },
  'Unpaid Leave': { icon: WalletMinimal, tile: 'bg-[#FEF2F2] text-rose-600', pill: 'bg-[#FEF2F2] text-rose-600' },
};

const daysBetween =(a: string, b: string) => Math.round((new Date(`${b}T00:00:00`).getTime() - new Date(`${a}T00:00:00`).getTime()) / 86400000) + 1;

/** Desktop "Attendance & Leave" tab (attendance-leave.tpl): monthly attendance + KPIs, leave balances + leave list */
export const StaffAttendanceLeaveTab: React.FC<StaffAttendanceLeaveTabProps> = ({ member, workMode }) => {
  const [view, setView] = useState<View>('attendance');
  const [leaveType, setLeaveType] = useState<LeaveTypeFilter>('All');
  const [deductionFor, setDeductionFor] = useState<LeaveRecord | null>(null);

  const balances = useMemo(() => leaveBalancesFor(member), [member]);
  const leaves = useMemo(() => leavesFor(member), [member]);
  const totalAll = balances.reduce((n, b) => n + b.balance, 0);
  const totalLeft = balances.reduce((n, b) => n + Math.max(0, b.balance - b.used), 0);
  const visibleLeaves = leaveType === 'All' ? leaves : leaves.filter((l) => l.leaveType === leaveType);

  return (
    <>
      <TabTitle title="Attendance & Leave" />
      <div className="mt-2.5">
        <SegmentedTabs<View>
          ariaLabel="Attendance or leave"
          options={[
            { id: 'attendance', label: 'Attendance' },
            { id: 'leave', label: 'Leave' },
          ]}
          value={view}
          onChange={setView}
        />
      </div>

      {view === 'attendance' ? (
        <StaffAttendancePanel member={member} workMode={workMode} />
      ) : (
        <div className="mt-3 space-y-3">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-4 pt-3.5 pb-3 bg-linear-to-br from-[#F5F8FF] to-white border-b border-slate-100">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-slate-400">Total Leave Balance</p>
                <p className="mt-0.5 text-[26px] font-extrabold text-[#2F68FE] leading-none tabular-nums">
                  {totalLeft.toFixed(2)}
                  <span className="text-[13px] font-bold text-slate-300"> / {totalAll.toFixed(2)}</span>
                </p>
              </div>
              <span className="shrink-0 px-2.5 py-1 rounded-full bg-white border border-[#DBE6FE] text-[11px] font-bold text-[#1D4ED8]">days left</span>
            </div>
            <ul className="divide-y divide-slate-100">
              {balances.map((b) => {
                const style = BALANCE_STYLE[b.label];
                const Icon = style.icon;
                const left = Math.max(0, b.balance - b.used);
                const pct = b.balance > 0 ? Math.min(100, (b.used / b.balance) * 100) : 0;
                return (
                  <li key={b.label} className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${style.tile}`}>
                        <Icon className="w-[18px] h-[18px]" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-[#1E293B] truncate">{b.label}</p>
                        <p className="text-[11px] text-slate-400 tabular-nums">
                          {b.used.toFixed(2)} used of {b.balance.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[18px] font-extrabold text-[#1E293B] leading-none tabular-nums">{left.toFixed(2)}</p>
                        <p className="mt-1 text-[10px] font-semibold text-slate-400">Left</p>
                      </div>
                    </div>
                    <span className="mt-2.5 block h-1.5 rounded-full bg-slate-100 overflow-hidden" role="img" aria-label={`${Math.round(pct)}% of ${b.label} used`}>
                      <span className={`block h-full rounded-full ${style.bar}`} style={{ width: `${pct}%` }} />
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>

          <div className="flex items-center justify-between pt-1">
            <h4 className="px-1 text-sm font-bold text-[#1E293B]">Leaves</h4>
            <span className="text-[11px] font-semibold text-slate-400">
              {visibleLeaves.length} {visibleLeaves.length === 1 ? 'record' : 'records'}
            </span>
          </div>
          <ChipRow<LeaveTypeFilter> label="Leave type" options={LEAVE_TYPES} value={leaveType} onChange={setLeaveType} />

          {visibleLeaves.length === 0 ? (
            <EmptyCard
              icon={Luggage}
              title="No leaves found."
              text={leaveType === 'All' ? 'Leaves taken by this staff will show up here.' : `No ${leaveType} records.`}
              action={
                leaveType !== 'All' ? (
                  <button type="button" onClick={() => setLeaveType('All')} className="mt-3 text-xs font-bold text-[#2F68FE] cursor-pointer">
                    Clear All
                  </button>
                ) : undefined
              }
            />
          ) : (
            <ul className="space-y-2.5">
              {visibleLeaves.map((l) => {
                const total = l.deductions.reduce((n, d) => n + d.days, 0);
                const style = LEAVE_STYLE[l.leaveType];
                const Icon = style.icon;
                const multi = l.endDate !== l.startDate;
                const start = new Date(`${l.startDate}T00:00:00`);
                return (
                  <li key={l.id}>
                    <Card className="overflow-hidden">
                      <div className="p-3.5">
                        <div className="flex items-center gap-3">
                          <span className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center shrink-0 ${style.tile}`}>
                            <span className="text-[15px] font-extrabold leading-none tabular-nums">{String(start.getDate()).padStart(2, '0')}</span>
                            <span className="mt-0.5 text-[9px] font-bold uppercase">{start.toLocaleDateString('en-US', { month: 'short' })}</span>
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-bold text-[#1E293B] tabular-nums truncate">
                              {formatStaffDate(l.startDate)}
                              {multi && ` – ${formatStaffDate(l.endDate)}`}
                            </p>
                            <p className="mt-0.5 text-[11px] text-slate-400">
                              {multi ? `${daysBetween(l.startDate, l.endDate)} calendar days` : 'Single day'}
                            </p>
                          </div>
                          <span className="shrink-0 text-right">
                            <span className="block text-[17px] font-extrabold text-[#1E293B] leading-none tabular-nums">{total}</span>
                            <span className="block mt-1 text-[10px] font-semibold text-slate-400">{total === 1 ? 'day' : 'days'}</span>
                          </span>
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold ${style.pill}`}>
                            <Icon className="w-3 h-3" />
                            {l.leaveType}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10.5px] font-bold">
                            From {l.deductedFrom}
                          </span>
                        </div>

                        <p className="mt-3 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2 text-[12px] text-[#1E293B] leading-snug">
                          <span className="block text-[10px] font-semibold text-slate-400">Reason</span>
                          {l.reason}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDeductionFor(l)}
                        className="w-full h-10 px-3.5 border-t border-slate-100 flex items-center justify-between text-[11.5px] font-bold text-[#2F68FE] active:bg-[#F5F8FF] cursor-pointer"
                      >
                        <span className="text-[10.5px] font-medium text-slate-400">Applied on {formatStaffDate(l.appliedOn)}</span>
                        <span className="flex items-center gap-0.5">
                          Deduction details
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </button>
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      <BottomSheet isOpen={deductionFor !== null} onClose={() => setDeductionFor(null)} maxHeight="max-h-[75%]">
        <SheetHeader title="Leave deduction details" subtitle={deductionFor ? `${deductionFor.leaveType} · ${member.name}` : ''} onClose={() => setDeductionFor(null)} />
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-3">
          <div className="grid grid-cols-3 pb-2 border-b border-slate-100 text-[10.5px] font-semibold text-slate-400 uppercase tracking-wide">
            <span>Date</span>
            <span className="text-center">Days</span>
            <span className="text-right">Deducted From</span>
          </div>
          {deductionFor?.deductions.map((d) => (
            <div key={d.date} className="grid grid-cols-3 py-2.5 border-b border-slate-100 text-[12.5px] text-[#1E293B] tabular-nums">
              <span className="font-semibold">{formatStaffDate(d.date)}</span>
              <span className="text-center">{d.days.toFixed(1)}</span>
              <span className="text-right">{d.deductedFrom}</span>
            </div>
          ))}
          {deductionFor && (
            <div className="grid grid-cols-3 py-2.5 text-[12.5px] font-bold text-[#1E293B] tabular-nums">
              <span>Total</span>
              <span className="text-center">{deductionFor.deductions.reduce((n, d) => n + d.days, 0).toFixed(1)}</span>
              <span />
            </div>
          )}
        </div>
        <div className="p-4 pt-3 pb-6 border-t border-slate-100 shrink-0">
          <button type="button" onClick={() => setDeductionFor(null)} className="w-full h-12 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold bg-white active:bg-slate-50 cursor-pointer">
            Close
          </button>
        </div>
      </BottomSheet>
    </>
  );
};
