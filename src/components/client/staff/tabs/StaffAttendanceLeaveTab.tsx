import React, { useMemo, useState } from 'react';
import { Calendar, CalendarCheck, CirclePlus, Clock, Info, Luggage } from 'lucide-react';
import { FilterIconButton } from '../../../common/TeamFilterSheet';
import type { ClientStaffMember } from '../../data/clientStaffData';
import { formatStaffDate } from '../../data/clientStaffData';
import { LeaveBalance, LeaveRecord, StaffWorkMode, leaveBalancesFor, leavesFor, staffRecordsEnd } from '../../data/clientStaffProfileData';
import { Card, EmptyCard, InfoSheet, RowList, SearchField, SwitchTiles } from './StaffTabParts';
import { Month, MonthFilterSheet, StaffAttendancePanel } from './StaffAttendancePanel';
import type { AmendRequest } from '../../data/clientAttendanceData';

interface StaffAttendanceLeaveTabProps {
  member: ClientStaffMember;
  workMode: StaffWorkMode;
  amends?: AmendRequest[];
}

type View = 'attendance' | 'leave';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** Desktop info box icons: PTO (calendar), OT (alarm clock), Additional (plus circle) */
const BALANCE_STYLE: Record<LeaveBalance['label'], { icon: React.ElementType; tile: string; text: string; bar: string }> = {
  'PTO Leaves': { icon: Calendar, tile: 'bg-[#F8FAFC] border-[#BFDBFE]', text: 'text-[#2F68FE]', bar: 'bg-[#2F68FE]' },
  'OT Leaves': { icon: Clock, tile: 'bg-[#F5F5FF] border-[#E0E7FF]', text: 'text-[#4F46E5]', bar: 'bg-[#6366F1]' },
  'Additional Leave': { icon: CirclePlus, tile: 'bg-[#F0FBF6] border-[#D1FAE5]', text: 'text-[#10B981]', bar: 'bg-[#10B981]' },
};

const LEAVE_STYLE: Record<LeaveRecord['leaveType'], { tile: string; accent: string }> = {
  'Paid Leave': { tile: 'bg-[#EFF6FF] text-[#1D4ED8]', accent: 'bg-[#1D4ED8]' },
  'Half Paid Leave': { tile: 'bg-[#FFF7ED] text-[#C2410C]', accent: 'bg-[#EA580C]' },
  'Sick Leave': { tile: 'bg-[#FEF8E7] text-[#B45309]', accent: 'bg-[#F59E0B]' },
  'Unpaid Leave': { tile: 'bg-[#FEF2F2] text-rose-600', accent: 'bg-rose-500' },
};

const parse = (iso: string) => new Date(`${iso}T00:00:00`);
const pad = (n: number) => String(n).padStart(2, '0');
const monthStart = (m: Month) => `${m.y}-${pad(m.m + 1)}-01`;
const monthEnd = (m: Month) => `${m.y}-${pad(m.m + 1)}-${pad(new Date(m.y, m.m + 1, 0).getDate())}`;

/** Desktop "Attendance & Leave" tab (attendance-leave.tpl): monthly attendance + KPIs, leave balances + leave list */
export const StaffAttendanceLeaveTab: React.FC<StaffAttendanceLeaveTabProps> = ({ member, workMode, amends }) => {
  const [view, setView] = useState<View>('attendance');
  const [month, setMonth] = useState<Month | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [query, setQuery] = useState('');

  const balances = useMemo(() => leaveBalancesFor(member), [member]);
  const leaves = useMemo(() => leavesFor(member), [member]);
  const totalLeft = balances.reduce((n, b) => n + Math.max(0, b.balance - b.used), 0);
  // Desktop "Select Month": leaves overlapping the picked month; search matches leave type, deducted from or reason
  const q = query.trim().toLowerCase();
  const visibleLeaves = leaves.filter(
    (l) =>
      (!month || (l.startDate <= monthEnd(month) && l.endDate >= monthStart(month))) &&
      (!q || [l.leaveType, l.deductedFrom, l.reason].some((v) => v.toLowerCase().includes(q))),
  );

  const joined = parse(member.joiningDate);
  const end = parse(staffRecordsEnd(member));
  const min: Month = { y: joined.getFullYear(), m: joined.getMonth() };
  const max: Month = { y: end.getFullYear(), m: end.getMonth() };

  /* Search + month filter, then the Leaves title */
  const leavesHeader = (
    <>
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <SearchField value={query} onChange={setQuery} placeholder="Search By Leave Type" />
        </div>
        <FilterIconButton count={month ? 1 : 0} onClick={() => setFilterOpen(true)} label="Filter leaves" />
      </div>
      <div className="flex items-center gap-2 px-1 min-w-0">
        <span className="w-1 h-3.5 rounded-full bg-[#2F68FE]" aria-hidden="true" />
        <h4 className="text-sm font-bold text-[#1E293B]">Leaves</h4>
        {month && (
          <span className="text-[11px] font-semibold text-slate-500 truncate">
            {MONTHS[month.m].slice(0, 3)} {month.y}
          </span>
        )}
      </div>
    </>
  );

  const leavesEmpty = (
    <EmptyCard
      icon={Luggage}
      title="No Data Found"
      text={q ? `No leaves match "${query.trim()}".` : month ? `No leaves in ${MONTHS[month.m]} ${month.y}.` : 'Leaves taken by this staff will show up here.'}
      action={
        month || q ? (
          <button
            type="button"
            onClick={() => {
              setMonth(null);
              setQuery('');
            }}
            className="mt-3 text-xs font-bold text-[#2F68FE] cursor-pointer"
          >
            Clear All
          </button>
        ) : undefined
      }
    />
  );

  return (
    <>
      <div className="mt-2.5">
        <SwitchTiles<View>
          label="Attendance or leave"
          options={[
            { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
            { id: 'leave', label: 'Leave', icon: Luggage },
          ]}
          value={view}
          onChange={setView}
        />
      </div>

      {view === 'attendance' ? (
        <StaffAttendancePanel member={member} workMode={workMode} amends={amends} />
      ) : (
        <div className="mt-3 space-y-3.5">
          {/* Leave balance: total on a gradient band, one progress row per balance */}
          <Card className="overflow-hidden">
            <div className="px-4 py-3.5 bg-blue-50 border-b border-blue-100 text-[#1E293B] flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold">Leave Balance</span>
                <button
                  type="button"
                  onClick={() => setShowInfo(true)}
                  aria-label="About leave balance"
                  aria-haspopup="dialog"
                  className="w-6 h-6 rounded-full text-slate-400 flex items-center justify-center active:bg-blue-100 cursor-pointer"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="text-right">
                <span className="block text-lg font-extrabold text-[#2F68FE] leading-none tabular-nums">{totalLeft.toFixed(2)}</span>
                <span className="block mt-0.5 text-[11px] font-semibold text-slate-500">days left</span>
              </span>
            </div>
            <InfoSheet isOpen={showInfo} title="Leave Balance" onClose={() => setShowInfo(false)}>
              Each balance shows leave used / total balance for {member.name}.
            </InfoSheet>
            <ul className="px-4 py-1 divide-y divide-slate-100">
              {balances.map((b) => {
                const style = BALANCE_STYLE[b.label];
                const Icon = style.icon;
                const pct = b.balance > 0 ? Math.min(100, (b.used / b.balance) * 100) : 0;
                return (
                  <li key={b.label} className="py-3 flex items-center gap-3">
                    <span className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${style.tile} ${style.text}`}>
                      <Icon className="w-4 h-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[12px] font-semibold text-[#1E293B] truncate">{b.label}</span>
                        <span className="text-[13px] font-extrabold text-[#1E293B] tabular-nums shrink-0">
                          {b.used.toFixed(2)}
                          <span className="text-[11px] font-bold text-slate-400"> / {b.balance.toFixed(2)}</span>
                        </span>
                      </div>
                      <span className="mt-1.5 block h-1.5 rounded-full bg-slate-100 overflow-hidden" role="img" aria-label={`${Math.round(pct)}% of ${b.label} used`}>
                        <span className={`block h-full rounded-full ${style.bar}`} style={{ width: `${pct}%` }} />
                      </span>
                      <span className="mt-1 block text-[10px] text-slate-400">Used / Balance</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>

          {leavesHeader}

          {visibleLeaves.length === 0 ? (
            leavesEmpty
          ) : (
            <div className="space-y-2.5">
              {visibleLeaves.map((l) => {
                const total = l.deductions.reduce((n, d) => n + d.days, 0);
                const multi = l.endDate !== l.startDate;
                const style = LEAVE_STYLE[l.leaveType];
                return (
                  <Card key={l.id} className="relative overflow-hidden">
                    <span aria-hidden="true" className={`absolute left-0 inset-y-0 w-1 ${style.accent}`} />
                    <div className="pl-4 pr-3.5 pt-3.5 pb-1">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <span className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-bold ${style.tile}`}>{l.leaveType}</span>
                          <p className="mt-1.5 text-[13px] font-bold text-[#1E293B] tabular-nums">
                            {formatStaffDate(l.startDate)}
                            {multi && ` – ${formatStaffDate(l.endDate)}`}
                          </p>
                        </div>
                        <span className="shrink-0 w-12 h-12 rounded-full bg-[#F8FAFC] border border-[#EBF0F7] flex flex-col items-center justify-center">
                          <span className="text-base font-bold text-[#1E293B] leading-none tabular-nums">{total}</span>
                          <span className="mt-0.5 text-[10px] font-semibold text-slate-400 leading-none">{total === 1 ? 'day' : 'days'}</span>
                        </span>
                      </div>
                      <RowList
                        className="mt-2.5 border-t border-slate-100"
                        rows={[
                          { label: 'Deducted From', value: l.deductedFrom },
                          { label: 'Applied On', value: formatStaffDate(l.appliedOn) },
                          { label: 'Reason', value: <span className="font-medium text-slate-600">{l.reason}</span>, wide: true },
                        ]}
                      />
                    </div>
                  </Card>
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
    </>
  );
};
