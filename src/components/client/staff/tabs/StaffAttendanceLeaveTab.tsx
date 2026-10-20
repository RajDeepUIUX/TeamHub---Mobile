import React, { useMemo, useState } from 'react';
import { Calendar, ChevronRight, CirclePlus, Clock, Info, Luggage } from 'lucide-react';
import { BottomSheet } from '../../../common/BottomSheet';
import { FilterIconButton } from '../../../common/TeamFilterSheet';
import { SegmentedTabs } from '../../../../design-system/components/SegmentedTabs';
import type { ClientStaffMember } from '../../data/clientStaffData';
import { formatStaffDate } from '../../data/clientStaffData';
import { LeaveBalance, LeaveRecord, StaffWorkMode, leaveBalancesFor, leavesFor, staffRecordsEnd } from '../../data/clientStaffProfileData';
import { EmptyCard, SheetHeader } from './StaffTabParts';
import { Month, MonthFilterSheet, StaffAttendancePanel } from './StaffAttendancePanel';

interface StaffAttendanceLeaveTabProps {
  member: ClientStaffMember;
  workMode: StaffWorkMode;
}

type View = 'attendance' | 'leave';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** Desktop info box icons: PTO (calendar), OT (alarm clock), Additional (plus circle) */
const BALANCE_STYLE: Record<LeaveBalance['label'], { icon: React.ElementType; tile: string; text: string; bar: string }> = {
  'PTO Leaves': { icon: Calendar, tile: 'bg-[#F5F8FF] border-[#DBE6FE]', text: 'text-[#2F68FE]', bar: 'bg-[#2F68FE]' },
  'OT Leaves': { icon: Clock, tile: 'bg-[#F5F5FF] border-[#E0E7FF]', text: 'text-[#4F46E5]', bar: 'bg-[#6366F1]' },
  'Additional Leave': { icon: CirclePlus, tile: 'bg-[#F0FBF6] border-[#D1FAE5]', text: 'text-[#10B981]', bar: 'bg-[#10B981]' },
};

const LEAVE_STYLE: Record<LeaveRecord['leaveType'], { tile: string }> = {
  'Paid Leave': { tile: 'bg-[#EFF6FF] text-[#1D4ED8]' },
  'Half Paid Leave': { tile: 'bg-[#FFF7ED] text-[#C2410C]' },
  'Sick Leave': { tile: 'bg-[#FEF8E7] text-[#B45309]' },
  'Unpaid Leave': { tile: 'bg-[#FEF2F2] text-rose-600' },
};

const parse = (iso: string) => new Date(`${iso}T00:00:00`);
const pad = (n: number) => String(n).padStart(2, '0');
const monthStart = (m: Month) => `${m.y}-${pad(m.m + 1)}-01`;
const monthEnd = (m: Month) => `${m.y}-${pad(m.m + 1)}-${pad(new Date(m.y, m.m + 1, 0).getDate())}`;

/** Desktop "Attendance & Leave" tab (attendance-leave.tpl): monthly attendance + KPIs, leave balances + leave list */
export const StaffAttendanceLeaveTab: React.FC<StaffAttendanceLeaveTabProps> = ({ member, workMode }) => {
  const [view, setView] = useState<View>('attendance');
  const [month, setMonth] = useState<Month | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [deductionFor, setDeductionFor] = useState<LeaveRecord | null>(null);

  const balances = useMemo(() => leaveBalancesFor(member), [member]);
  const leaves = useMemo(() => leavesFor(member), [member]);
  const totalLeft = balances.reduce((n, b) => n + Math.max(0, b.balance - b.used), 0);
  // Desktop "Select Month": leaves overlapping the picked month
  const visibleLeaves = month ? leaves.filter((l) => l.startDate <= monthEnd(month) && l.endDate >= monthStart(month)) : leaves;

  const joined = parse(member.joiningDate);
  const end = parse(staffRecordsEnd(member));
  const min: Month = { y: joined.getFullYear(), m: joined.getMonth() };
  const max: Month = { y: end.getFullYear(), m: end.getMonth() };

  return (
    <>
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
        <div className="mt-3 space-y-4">
          {/* Leave balance: Staff Leaves card with desktop "used / balance" values */}
          <div className="bg-white border border-[#EBF0F7] rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-[#1E293B]">Leave Balance</span>
                <button
                  type="button"
                  onClick={() => setShowInfo((v) => !v)}
                  aria-label="About leave balance"
                  aria-expanded={showInfo}
                  className="w-5 h-5 rounded-full text-slate-400 flex items-center justify-center active:bg-slate-100 cursor-pointer"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#EFF6FF] text-[11px] font-bold text-[#2F68FE] tabular-nums">
                {totalLeft.toFixed(2)} days left
              </span>
            </div>
            {showInfo && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-[#2F68FE] leading-relaxed animate-in fade-in duration-200">
                Each balance shows leave used / total balance for {member.name}.
              </div>
            )}
            <div className="mt-3 grid grid-cols-3 gap-2">
              {balances.map((b) => {
                const style = BALANCE_STYLE[b.label];
                const Icon = style.icon;
                const pct = b.balance > 0 ? Math.min(100, (b.used / b.balance) * 100) : 0;
                return (
                  <div key={b.label} className={`rounded-xl border p-2.5 min-w-0 flex flex-col ${style.tile}`}>
                    <span className={`w-7 h-7 rounded-lg bg-white flex items-center justify-center shadow-2xs ${style.text}`}>
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="mt-2 text-[11px] font-semibold text-slate-500 leading-tight min-h-7">{b.label}</span>
                    <span className="mt-1 text-[17px] font-extrabold text-[#1E293B] leading-none tabular-nums">
                      {b.used.toFixed(2)}
                      <span className="text-[11px] font-bold text-slate-400"> / {b.balance.toFixed(2)}</span>
                    </span>
                    <span className="mt-2 block h-1.5 rounded-full bg-white overflow-hidden" role="img" aria-label={`${Math.round(pct)}% of ${b.label} used`}>
                      <span className={`block h-full rounded-full ${style.bar}`} style={{ width: `${pct}%` }} />
                    </span>
                    <span className="mt-1 text-[10px] text-slate-400">Used / Balance</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Leaves header + desktop month filter */}
          <div className="flex items-center justify-between px-1 pt-1 gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <h4 className="text-sm font-bold text-[#1E293B]">Leaves</h4>
              <span className="px-2 py-0.5 text-[11px] font-bold bg-[#EFF6FF] text-[#2F68FE] rounded-full tabular-nums">{visibleLeaves.length}</span>
              {month && (
                <span className="text-[11px] font-semibold text-slate-500 truncate">
                  {MONTHS[month.m].slice(0, 3)} {month.y}
                </span>
              )}
            </div>
            <FilterIconButton count={month ? 1 : 0} onClick={() => setFilterOpen(true)} label="Filter leaves" />
          </div>

          {visibleLeaves.length === 0 ? (
            <EmptyCard
              icon={Luggage}
              title="No Data Found"
              text={month ? `No leaves in ${MONTHS[month.m]} ${month.y}.` : 'Leaves taken by this staff will show up here.'}
              action={
                month ? (
                  <button type="button" onClick={() => setMonth(null)} className="mt-3 text-xs font-bold text-[#2F68FE] cursor-pointer">
                    Clear All
                  </button>
                ) : undefined
              }
            />
          ) : (
            <div className="space-y-3">
              {visibleLeaves.map((l) => {
                const total = l.deductions.reduce((n, d) => n + d.days, 0);
                const multi = l.endDate !== l.startDate;
                const style = LEAVE_STYLE[l.leaveType];
                const start = parse(l.startDate);
                return (
                  <div key={l.id} className="bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-center gap-3">
                        <span className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 ${style.tile}`}>
                          <span className="text-[16px] font-extrabold leading-none tabular-nums">{pad(start.getDate())}</span>
                          <span className="mt-0.5 text-[9.5px] font-bold uppercase">{MONTHS[start.getMonth()].slice(0, 3)}</span>
                        </span>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-[#1E293B] leading-snug truncate">{l.leaveType}</h3>
                          <p className="mt-0.5 text-xs text-slate-500 tabular-nums truncate">
                            {formatStaffDate(l.startDate)}
                            {multi && ` – ${formatStaffDate(l.endDate)}`}
                          </p>
                        </div>
                        <span className="shrink-0 text-right">
                          <span className="block text-[18px] font-extrabold text-[#1E293B] leading-none tabular-nums">{total}</span>
                          <span className="block mt-1 text-[10px] font-semibold text-slate-400">{total === 1 ? 'day' : 'days'}</span>
                        </span>
                      </div>

                      <dl className="mt-3 grid grid-cols-2 rounded-xl bg-slate-50 border border-slate-100 divide-x divide-slate-100">
                        <div className="px-3 py-2 min-w-0">
                          <dt className="text-[10px] text-slate-400">Deducted From</dt>
                          <dd className="mt-0.5 text-[12px] font-bold text-[#1E293B] truncate">{l.deductedFrom}</dd>
                        </div>
                        <div className="px-3 py-2 min-w-0">
                          <dt className="text-[10px] text-slate-400">Applied On</dt>
                          <dd className="mt-0.5 text-[12px] font-bold text-[#1E293B] truncate tabular-nums">{formatStaffDate(l.appliedOn)}</dd>
                        </div>
                      </dl>

                      <p className="mt-2 px-1 text-xs text-slate-600 leading-snug">
                        <span className="text-slate-400">Reason: </span>
                        {l.reason}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDeductionFor(l)}
                      className="w-full h-10 px-4 border-t border-slate-100 flex items-center justify-center gap-1 text-[12px] font-bold text-[#2F68FE] active:bg-[#F5F8FF] cursor-pointer"
                    >
                      View Deduction Details
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <MonthFilterSheet
        isOpen={filterOpen}
        title="Filter Leaves"
        month={month}
        min={min}
        max={max}
        onClose={() => setFilterOpen(false)}
        onApply={(m) => {
          setMonth(m);
          setFilterOpen(false);
        }}
        onClear={() => {
          setMonth(null);
          setFilterOpen(false);
        }}
      />

      <BottomSheet isOpen={deductionFor !== null} onClose={() => setDeductionFor(null)} maxHeight="max-h-[75%]">
        <SheetHeader title="Leave Deduction Details" subtitle={deductionFor ? `${deductionFor.leaveType} · ${member.name}` : ''} onClose={() => setDeductionFor(null)} />
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
            Cancel
          </button>
        </div>
      </BottomSheet>
    </>
  );
};
