import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Building2, Calendar, CalendarX2, ChevronLeft, ChevronRight, Coffee, House, PartyPopper, Plane } from 'lucide-react';
import { BottomSheet } from '../../../common/BottomSheet';
import { ChoiceTiles } from '../../../common/ChoiceTiles';
import { FilterIconButton } from '../../../common/TeamFilterSheet';
import type { ClientStaffMember } from '../../data/clientStaffData';
import {
  ATTENDANCE_STATUSES,
  AttendanceDay,
  AttendanceStatus,
  StaffWorkMode,
  attendanceFor,
  holidayName,
  staffRecordsEnd,
  summarizeAttendance,
} from '../../data/clientStaffProfileData';
import { EmptyCard, SheetHeader } from './StaffTabParts';
import { StaffSkeleton } from '../ClientStaffParts';

interface StaffAttendancePanelProps {
  member: ClientStaffMember;
  workMode: StaffWorkMode;
}

/** Readable labels for desktop status codes */
export const STATUS_LABEL: Record<AttendanceStatus, string> = {
  'Full day': 'Full Day',
  'Half Day': 'Half Day',
  'Half PL': 'Half Paid Leave',
  PL: 'Paid Leave',
  Absent: 'Absent',
  WO: 'Weekly Off',
  Holiday: 'Holiday',
};

export const STATUS_PILL: Record<AttendanceStatus, string> = {
  'Full day': 'bg-[#E8F8F0] text-[#10B981]',
  'Half Day': 'bg-[#FEF8E7] text-[#D97706]',
  'Half PL': 'bg-[#FFF7ED] text-[#EA580C]',
  PL: 'bg-[#EFF6FF] text-[#1D4ED8]',
  Absent: 'bg-[#FEF2F2] text-rose-600',
  WO: 'bg-slate-100 text-slate-500',
  Holiday: 'bg-[#EEF2FF] text-[#4F46E5]',
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const LOAD_MS = 400;
const ALL = 'All';

const parse = (iso: string) => new Date(`${iso}T00:00:00`);
const monthKey = (y: number, m: number) => y * 12 + m;

export type Month = { y: number; m: number };

/* --------------------------------- Pieces --------------------------------- */

const InfoBanner: React.FC<{ day: AttendanceDay }> = ({ day }) => {
  const config: Partial<Record<AttendanceStatus, { icon: React.ElementType; text: string; cls: string }>> = {
    Holiday: { icon: PartyPopper, text: `Public Holiday (${holidayName(day.date) ?? 'Holiday'})`, cls: 'bg-[#EEF2FF] border-[#E0E7FF] text-[#4F46E5]' },
    WO: { icon: Coffee, text: 'Scheduled Weekly Off', cls: 'bg-[#EFF6FF] border-[#DBEAFE] text-[#2563EB]' },
    PL: { icon: Plane, text: 'On paid leave for the full day', cls: 'bg-[#EFF6FF] border-[#DBEAFE] text-[#1D4ED8]' },
    Absent: { icon: AlertCircle, text: 'No attendance recorded for this day.', cls: 'bg-[#FEF2F2] border-[#FEE2E2] text-rose-600' },
  };
  const c = config[day.status];
  if (!c) return null;
  const Icon = c.icon;
  return (
    <div className={`rounded-xl border p-3 text-xs font-medium flex items-center gap-2 ${c.cls}`}>
      <Icon className="w-4 h-4 shrink-0" />
      <span>{c.text}</span>
    </div>
  );
};

/** One desktop table row: Date, Check In, Check Out, Total Office Time, Break Time, Overtime, Work Mode, Level, Designation, Status */
const DayCard: React.FC<{ day: AttendanceDay; member: ClientStaffMember }> = ({ day, member }) => {
  const d = parse(day.date);
  const worked = Boolean(day.checkIn);
  const ModeIcon = day.workMode === 'WFH' ? House : Building2;
  const modeLabel = day.workMode === 'WFH' ? 'Work From Home' : day.workMode === 'Office' ? 'Work From Office' : '--';
  const hasOt = Boolean(day.overtime && day.overtime !== '00:00');
  return (
    <div className="bg-white border border-[#EBF0F7] rounded-[20px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-[15px] text-[#1E293B] leading-tight tabular-nums">
            {d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium mt-1">
            <span>{d.toLocaleDateString('en-US', { weekday: 'long' })}</span>
            {worked && (
              <>
                <span className="text-gray-300">·</span>
                <span className="flex items-center gap-1 truncate">
                  <ModeIcon className="w-3.5 h-3.5 shrink-0" />
                  {modeLabel}
                </span>
              </>
            )}
          </div>
        </div>
        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full shrink-0 ${STATUS_PILL[day.status]}`}>{STATUS_LABEL[day.status]}</span>
      </div>

      <div className="pt-3.5 mt-3 border-t border-[#F1F5F9] space-y-3">
        {worked ? (
          <dl className="rounded-xl border border-[#EBF0F7] overflow-hidden">
            <div className="grid grid-cols-2 divide-x divide-[#EBF0F7]">
              {[
                ['Check In', day.checkIn],
                ['Check Out', day.checkOut],
              ].map(([label, value]) => (
                <div key={label} className="p-3">
                  <dt className="text-[11px] text-gray-400">{label}</dt>
                  <dd className="mt-0.5 text-sm font-bold text-[#1E293B] tabular-nums">{value ?? '--'}</dd>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 divide-x divide-[#EBF0F7] border-t border-[#EBF0F7]">
              {[
                ['Total Office Time', day.officeTime, 'text-[#1E293B]'],
                ['Break Time', day.breakTime, 'text-[#1E293B]'],
                ['Overtime', day.overtime, hasOt ? 'text-[#4F46E5]' : 'text-[#1E293B]'],
              ].map(([label, value, color]) => (
                <div key={label} className="p-3 min-w-0">
                  <dt className="text-[11px] text-gray-400 truncate">{label}</dt>
                  <dd className={`mt-0.5 text-sm font-bold tabular-nums ${color}`}>{value ?? '--'}</dd>
                </div>
              ))}
            </div>
          </dl>
        ) : (
          <InfoBanner day={day} />
        )}

        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
          <dt className="text-gray-400">Level</dt>
          <dd className="font-semibold text-[#1E293B] text-right">{member.level}</dd>
          <dt className="text-gray-400">Designation</dt>
          <dd className="font-semibold text-[#1E293B] text-right break-words">{member.designation}</dd>
        </dl>
      </div>
    </div>
  );
};

/** Desktop "Select Month" field (+ optional Status dropdown), applied with Search. Shared by Attendance and Leave. */
export const MonthFilterSheet: React.FC<{
  isOpen: boolean;
  title: string;
  /** null = no month picked (Leave: all months) */
  month: Month | null;
  status?: string;
  /** Status choices; omitted = no Status filter */
  statusOptions?: string[];
  min: Month;
  max: Month;
  onClose: () => void;
  onApply: (month: Month | null, status: string) => void;
  onClear: () => void;
}> = ({ isOpen, title, month, status = ALL, statusOptions, min, max, onClose, onApply, onClear }) => {
  const [draftMonth, setDraftMonth] = useState(month);
  const [draftStatus, setDraftStatus] = useState(status);
  const [year, setYear] = useState((month ?? max).y);

  useEffect(() => {
    if (!isOpen) return;
    setDraftMonth(month);
    setDraftStatus(status);
    setYear((month ?? max).y);
  }, [isOpen, month, status]);

  const minKey = monthKey(min.y, min.m);
  const maxKey = monthKey(max.y, max.m);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[88%]">
      <SheetHeader title={title} subtitle={statusOptions ? 'Pick a month and status, then tap Search' : 'Pick a month, then tap Search'} onClose={onClose} />
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-4 space-y-5">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#1E293B]">Month</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setYear((y) => y - 1)}
                disabled={year - 1 < min.y}
                aria-label="Previous year"
                className="w-8 h-8 rounded-lg border border-slate-200 text-slate-600 flex items-center justify-center disabled:text-slate-200 disabled:border-slate-100 cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="w-12 text-center text-xs font-bold text-[#1E293B] tabular-nums">{year}</span>
              <button
                type="button"
                onClick={() => setYear((y) => y + 1)}
                disabled={year + 1 > max.y}
                aria-label="Next year"
                className="w-8 h-8 rounded-lg border border-slate-200 text-slate-600 flex items-center justify-center disabled:text-slate-200 disabled:border-slate-100 cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {MONTHS.map((name, m) => {
              const key = monthKey(year, m);
              const disabled = key < minKey || key > maxKey;
              const on = draftMonth?.y === year && draftMonth?.m === m;
              return (
                <button
                  key={name}
                  type="button"
                  disabled={disabled}
                  aria-pressed={on}
                  onClick={() => setDraftMonth({ y: year, m })}
                  className={`h-10 rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed ${
                    on
                      ? 'bg-[#2F68FE] text-white'
                      : disabled
                        ? 'bg-slate-50 text-slate-300'
                        : 'bg-white border border-slate-200 text-slate-600 active:bg-slate-50'
                  }`}
                >
                  {name.slice(0, 3)}
                </button>
              );
            })}
          </div>
        </div>

        {statusOptions && (
          <div className="space-y-2">
            <span className="text-xs font-bold text-[#1E293B]">Status</span>
            <ChoiceTiles multiple={false} options={[ALL, ...statusOptions]} selected={[draftStatus]} onChange={(v) => setDraftStatus(v[0] ?? ALL)} />
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 p-4 pt-3 pb-6 border-t border-slate-100 shrink-0">
        <button
          type="button"
          onClick={onClear}
          className="h-12 rounded-xl border border-[#2F68FE] text-[#2F68FE] text-xs font-bold bg-white active:bg-blue-50 cursor-pointer"
        >
          Clear All
        </button>
        <button
          type="button"
          onClick={() => onApply(draftMonth, draftStatus)}
          className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] cursor-pointer"
        >
          Search
        </button>
      </div>
    </BottomSheet>
  );
};

/* ---------------------------------- Panel --------------------------------- */

/** Attendance view of the staff "Attendance & Leave" tab (desktop attendance-leave.tpl): KPIs, month + status filter, daily records */
export const StaffAttendancePanel: React.FC<StaffAttendancePanelProps> = ({ member, workMode }) => {
  const joined = parse(member.joiningDate);
  // Staff who already left open on their last month (no records after the last working day)
  const end = parse(staffRecordsEnd(member));
  const min: Month = { y: joined.getFullYear(), m: joined.getMonth() };
  const max: Month = { y: end.getFullYear(), m: end.getMonth() };
  const [month, setMonth] = useState<Month>(max);
  const [status, setStatus] = useState(ALL);
  const [filterOpen, setFilterOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setLoading(false), LOAD_MS);
    return () => clearTimeout(t);
  }, [loading]);

  const days = useMemo(() => attendanceFor(member, month.y, month.m, workMode), [member, month, workMode]);
  const summary = summarizeAttendance(days);
  const statusCode = ATTENDANCE_STATUSES.find((s) => STATUS_LABEL[s] === status);
  const visibleDays = statusCode ? days.filter((d) => d.status === statusCode) : days;
  const isDefault = status === ALL && month.y === max.y && month.m === max.m;
  const filterCount = (status === ALL ? 0 : 1) + (month.y === max.y && month.m === max.m ? 0 : 1);

  const apply = (nextMonth: Month | null, nextStatus: string) => {
    setMonth(nextMonth ?? max);
    setStatus(nextStatus);
    setFilterOpen(false);
    setLoading(true);
  };
  const clearAll = () => apply(max, ALL);

  const kpis: { label: string; value: number; tile: string }[] = [
    { label: 'Present Days', value: summary.present, tile: 'bg-[#E8F8F0] text-[#10B981]' },
    { label: 'Absent Days', value: summary.absent, tile: 'bg-[#FDECEC] text-[#F43F5E]' },
    { label: 'Leave Days', value: summary.leave, tile: 'bg-[#FEF8E7] text-[#F59E0B]' },
  ];
  const totals: { label: string; value: number }[] = [
    { label: 'Working Days', value: summary.working },
    { label: 'Holidays', value: summary.holidays },
    { label: 'Total Days', value: summary.total },
    { label: 'Salary Days', value: summary.salary },
  ];

  return (
    <div className="mt-3 space-y-3.5">
      {/* Month + filter row (Staff attendance layout) */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          className="flex-1 h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 flex items-center justify-between shadow-2xs active:bg-slate-50 transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            {MONTHS[month.m].slice(0, 3)} {month.y}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </button>
        <FilterIconButton count={filterCount} onClick={() => setFilterOpen(true)} label="Filter attendance" />
      </div>

      {/* Desktop KPIs */}
      <div className="bg-white border border-[#EBF0F7] rounded-[20px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
        {loading ? (
          <div className="space-y-3" aria-busy="true" aria-label="Loading attendance">
            <StaffSkeleton className="w-full h-14 rounded-xl" />
            <StaffSkeleton className="w-full h-12 rounded-xl" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 text-center">
              {kpis.map((k) => (
                <div key={k.label} className="flex flex-col items-center">
                  <div className={`w-14 h-9 rounded-lg font-bold text-lg flex items-center justify-center mb-1.5 tabular-nums ${k.tile}`}>{k.value}</div>
                  <span className="text-xs text-gray-500 font-medium">{k.label}</span>
                </div>
              ))}
            </div>
            <dl className="mt-3.5 pt-3 border-t border-[#F1F5F9] grid grid-cols-4 gap-1.5 text-center">
              {totals.map((t) => (
                <div key={t.label} className="flex flex-col items-center min-w-0">
                  <dd className="w-11 h-8 rounded-lg bg-[#EEF2FF] text-[#2F68FE] font-bold text-[15px] flex items-center justify-center tabular-nums">{t.value}</dd>
                  <dt className="mt-1 text-[10.5px] text-gray-500 font-medium leading-tight">{t.label}</dt>
                </div>
              ))}
            </dl>
          </>
        )}
      </div>

      {/* Month heading + records */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between px-1 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-bold text-sm text-[#1E293B]">
              {MONTHS[month.m]} {month.y}
            </span>
            {!loading && (
              <span className="px-2 py-0.5 text-[11px] font-bold bg-[#EFF6FF] text-[#2F68FE] rounded-full tabular-nums">{visibleDays.length}</span>
            )}
          </div>
          {status !== ALL && (
            <span className="text-[11px] font-semibold text-slate-500 truncate">Status: {status}</span>
          )}
        </div>

        {loading ? (
          <div className="space-y-3" aria-hidden="true">
            <StaffSkeleton className="w-full h-40 rounded-[20px]" />
            <StaffSkeleton className="w-full h-40 rounded-[20px]" />
          </div>
        ) : visibleDays.length === 0 ? (
          <EmptyCard
            icon={CalendarX2}
            title="No Data Found"
            text={status === ALL ? `Nothing recorded for ${MONTHS[month.m]} ${month.y}.` : `No ${status} days in ${MONTHS[month.m]} ${month.y}.`}
            action={
              !isDefault ? (
                <button type="button" onClick={clearAll} className="mt-3 text-xs font-bold text-[#2F68FE] cursor-pointer">
                  Clear All
                </button>
              ) : undefined
            }
          />
        ) : (
          visibleDays.map((d) => <DayCard key={d.date} day={d} member={member} />)
        )}
      </div>

      <MonthFilterSheet
        isOpen={filterOpen}
        title="Filter Attendance"
        month={month}
        status={status}
        statusOptions={ATTENDANCE_STATUSES.map((s) => STATUS_LABEL[s])}
        min={min}
        max={max}
        onClose={() => setFilterOpen(false)}
        onApply={apply}
        onClear={clearAll}
      />
    </div>
  );
};
