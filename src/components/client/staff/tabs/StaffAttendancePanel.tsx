import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowRight, BarChart2, Building2, Calendar, CalendarDays, CalendarX2, ChevronLeft, ChevronRight, Coffee, House, LayoutGrid, PartyPopper, Plane, X } from 'lucide-react';
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
import { AmendRequest, withApprovedAmends } from '../../data/clientAttendanceData';
import { EmptyCard, SheetHeader } from './StaffTabParts';
import { StaffSkeleton } from '../ClientStaffParts';

interface StaffAttendancePanelProps {
  member: ClientStaffMember;
  workMode: StaffWorkMode;
  /** Attendance Amend requests; approved ones replace the recorded day */
  amends?: AmendRequest[];
  v2?: boolean;
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
    WO: { icon: Coffee, text: 'Scheduled Weekly Off', cls: 'bg-[#EFF6FF] border-[#BFDBFE] text-[#2563EB]' },
    PL: { icon: Plane, text: 'On paid leave for the full day', cls: 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1D4ED8]' },
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
  const tile = (label: string, value: string | null | undefined, color = 'text-[#1E293B]') => (
    <div key={label} className="min-w-0 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100">
      <dt className="text-[10px] font-semibold text-slate-400 leading-tight">{label}</dt>
      <dd className={`mt-0.5 text-xs font-bold tabular-nums ${color}`}>{value ?? '--'}</dd>
    </div>
  );
  return (
    <article className="bg-white border border-[#EBF0F7] rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.03)] overflow-hidden">
      <div className="p-3.5 pb-3 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-[#1E293B] tabular-nums">
            {d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
          </h3>
          <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500 min-w-0">
            <span className="shrink-0">{d.toLocaleDateString('en-US', { weekday: 'long' })}</span>
            {worked && (
              <>
                <span className="text-slate-300">·</span>
                <span className="flex items-center gap-1 min-w-0">
                  <ModeIcon className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{modeLabel}</span>
                </span>
              </>
            )}
          </p>
        </div>
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${STATUS_PILL[day.status]}`}>{STATUS_LABEL[day.status]}</span>
      </div>

      <div className="px-3.5">
        {worked ? (
          <dl className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {tile('Check In', day.checkIn)}
              {tile('Check Out', day.checkOut)}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {tile('Total Office Time', day.officeTime)}
              {tile('Break Time', day.breakTime)}
              {tile('Overtime', day.overtime, hasOt ? 'text-[#4F46E5]' : 'text-[#1E293B]')}
            </div>
          </dl>
        ) : (
          <InfoBanner day={day} />
        )}
      </div>

      <dl className="mt-3 px-3.5 py-2.5 border-t border-slate-100 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[11px]">
        <dt className="text-slate-400">Level</dt>
        <dd className="font-semibold text-[#1E293B] text-right">{member.level}</dd>
        <dt className="text-slate-400">Designation</dt>
        <dd className="font-semibold text-[#1E293B] text-right break-words">{member.designation}</dd>
      </dl>
    </article>
  );
};

const STATUS_DOT: Record<AttendanceStatus, string> = {
  'Full day': 'bg-[#10B981]',
  'Half Day': 'bg-[#F59E0B]',
  'Half PL': 'bg-[#EA580C]',
  PL: 'bg-[#1D4ED8]',
  Absent: 'bg-rose-500',
  WO: 'bg-slate-300',
  Holiday: 'bg-[#4F46E5]',
};

/** V2 day row: date block on the left, check-in → check-out line, time chips, Level / Designation rows */
const DayCardV2: React.FC<{ day: AttendanceDay; member: ClientStaffMember }> = ({ day, member }) => {
  const d = parse(day.date);
  const worked = Boolean(day.checkIn);
  const ModeIcon = day.workMode === 'WFH' ? House : Building2;
  const modeLabel = day.workMode === 'WFH' ? 'Work From Home' : day.workMode === 'Office' ? 'Work From Office' : '--';
  const hasOt = Boolean(day.overtime && day.overtime !== '00:00');
  return (
    <div className="relative bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs overflow-hidden">
      <span aria-hidden="true" className={`absolute left-0 inset-y-0 w-1 ${STATUS_DOT[day.status]}`} />
      <div className="pl-4 pr-3.5 py-3.5 flex gap-3">
        <div className={`w-14 shrink-0 rounded-xl py-2 flex flex-col items-center justify-center ${STATUS_PILL[day.status]}`}>
          <span className="text-[10px] font-bold uppercase leading-none">{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
          <span className="mt-1 text-[20px] font-extrabold leading-none tabular-nums">{String(d.getDate()).padStart(2, '0')}</span>
          <span className="mt-1 text-[10px] font-bold uppercase leading-none">{MONTHS[d.getMonth()].slice(0, 3)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-[#1E293B] tabular-nums">
                {d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
              </p>
              <p className="text-[11px] text-slate-400">{d.toLocaleDateString('en-US', { weekday: 'long' })}</p>
            </div>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md shrink-0 ${STATUS_PILL[day.status]}`}>{STATUS_LABEL[day.status]}</span>
          </div>
          {worked ? (
            <>
              <div className="mt-2.5 flex items-center gap-2 text-xs font-bold text-[#1E293B] tabular-nums">
                <span className="min-w-0">
                  <span className="block text-[10px] font-semibold text-slate-400">Check In</span>
                  {day.checkIn ?? '--'}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0 mt-3" />
                <span className="min-w-0">
                  <span className="block text-[10px] font-semibold text-slate-400">Check Out</span>
                  {day.checkOut ?? '--'}
                </span>
                <span className="ml-auto mt-3 h-6 px-2 rounded-full bg-[#F8FAFC] border border-[#EBF0F7] text-[11px] font-semibold text-slate-500 flex items-center gap-1 min-w-0">
                  <ModeIcon className="w-3 h-3 shrink-0" />
                  <span className="truncate">{modeLabel}</span>
                </span>
              </div>
              <dl className="mt-2.5 grid grid-cols-3 gap-1.5">
                {[
                  ['Total Office Time', day.officeTime, 'text-[#1E293B]'],
                  ['Break Time', day.breakTime, 'text-[#1E293B]'],
                  ['Overtime', day.overtime, hasOt ? 'text-[#4F46E5]' : 'text-[#1E293B]'],
                ].map(([label, value, color]) => (
                  <div key={label} className="min-w-0 rounded-lg bg-[#F8FAFC] px-2 py-1.5">
                    <dt className="text-[10px] text-slate-400 truncate">{label}</dt>
                    <dd className={`text-[12px] font-bold tabular-nums ${color}`}>{value ?? '--'}</dd>
                  </div>
                ))}
              </dl>
            </>
          ) : (
            <div className="mt-2.5">
              <InfoBanner day={day} />
            </div>
          )}
        </div>
      </div>
      <dl className="px-4 py-2 border-t border-slate-100 bg-[#F8FAFC] flex items-center gap-3 text-[11px]">
        <dt className="text-slate-400">Level</dt>
        <dd className="font-semibold text-[#1E293B]">{member.level}</dd>
        <span className="w-1 h-1 rounded-full bg-slate-300 shrink-0" aria-hidden="true" />
        <dt className="text-slate-400 shrink-0">Designation</dt>
        <dd className="font-semibold text-[#1E293B] truncate">{member.designation}</dd>
      </dl>
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

type SummaryTile = { label: string; value: number; text: string };

/** Full month breakdown (same layout as the manager Team Requests Summary) */
const AttendanceSummarySheet: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  monthLabel: string;
  overview: SummaryTile[];
  breakdown: SummaryTile[];
}> = ({ isOpen, onClose, monthLabel, overview, breakdown }) => {
  const section = (icon: React.ReactNode, title: string, tiles: SummaryTile[]) => (
    <div className="bg-[#F8FAFC] border border-[#EBF0F7] rounded-2xl p-3.5 space-y-2.5">
      <div className="flex items-center gap-2 font-bold text-[#1E293B]">
        {icon}
        <span>{title}</span>
      </div>
      <dl className="grid grid-cols-2 gap-2 pt-1">
        {tiles.map((t) => (
          <div key={t.label} className="bg-white p-2.5 rounded-xl border border-slate-200/60 flex items-center justify-between gap-2 shadow-2xs">
            <dt className="text-slate-600 font-medium truncate">{t.label}</dt>
            <dd className={`text-sm font-bold tabular-nums ${t.text}`}>{t.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[90%]">
      <div className="pt-3 pb-1 flex justify-center shrink-0">
        <div className="w-10 h-1 bg-slate-300 rounded-full" />
      </div>
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 shrink-0">
        <div>
          <h2 className="text-lg font-bold text-[#1E293B]">Attendance Summary</h2>
          <p className="text-xs text-slate-500 mt-0.5 font-normal">{monthLabel} · Complete Breakdown</p>
        </div>
        <button
          onClick={onClose}
          type="button"
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-4 no-scrollbar text-xs">
        {section(<LayoutGrid className="w-4 h-4 text-[#2F68FE]" />, 'Attendance Overview', overview)}
        {section(<CalendarDays className="w-4 h-4 text-[#F59E0B]" />, 'Days Breakdown', breakdown)}
      </div>

      <div className="p-4 pt-2 pb-8 border-t border-slate-100 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="w-full h-12 rounded-xl bg-[#2F68FE] text-white font-semibold text-sm shadow-xs active:bg-[#1D4ED8] cursor-pointer"
        >
          Close Summary
        </button>
      </div>
    </BottomSheet>
  );
};

/* ---------------------------------- Panel --------------------------------- */

/** Attendance view of the staff "Attendance & Leave" tab (desktop attendance-leave.tpl): KPIs, month + status filter, daily records */
export const StaffAttendancePanel: React.FC<StaffAttendancePanelProps> = ({ member, workMode, amends = [], v2 }) => {
  const joined = parse(member.joiningDate);
  // Staff who already left open on their last month (no records after the last working day)
  const end = parse(staffRecordsEnd(member));
  const min: Month = { y: joined.getFullYear(), m: joined.getMonth() };
  const max: Month = { y: end.getFullYear(), m: end.getMonth() };
  const [month, setMonth] = useState<Month>(max);
  const [status, setStatus] = useState(ALL);
  const [filterOpen, setFilterOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setLoading(false), LOAD_MS);
    return () => clearTimeout(t);
  }, [loading]);

  const days = useMemo(() => withApprovedAmends(member.id, attendanceFor(member, month.y, month.m, workMode), amends), [member, month, workMode, amends]);
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

  const kpis: { label: string; value: number; tile: string; text: string }[] = [
    { label: 'Present Days', value: summary.present, tile: 'bg-[#E8F8F0] text-[#10B981]', text: 'text-[#10B981]' },
    { label: 'Absent Days', value: summary.absent, tile: 'bg-[#FDECEC] text-[#F43F5E]', text: 'text-[#F43F5E]' },
    { label: 'Leave Days', value: summary.leave, tile: 'bg-[#FEF8E7] text-[#F59E0B]', text: 'text-[#F59E0B]' },
    { label: 'Working Days', value: summary.working, tile: 'bg-[#EEF2FF] text-[#2F68FE]', text: 'text-[#2F68FE]' },
  ];
  const breakdown: SummaryTile[] = [
    { label: 'Holidays', value: summary.holidays, text: 'text-[#1E293B]' },
    { label: 'Total Days', value: summary.total, text: 'text-[#1E293B]' },
    { label: 'Salary Days', value: summary.salary, text: 'text-[#1E293B]' },
  ];

  const viewSummary = (
    <div className="border-t border-[#F1F5F9] mt-3.5 pt-3">
      <button
        type="button"
        onClick={() => setSummaryOpen(true)}
        className="w-full flex items-center justify-between text-xs font-semibold text-[#1E293B] cursor-pointer"
      >
        <span className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-[#2F68FE]" />
          View Full Summary
        </span>
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </button>
    </div>
  );

  const summarySheet = (
    <AttendanceSummarySheet
      isOpen={summaryOpen}
      onClose={() => setSummaryOpen(false)}
      monthLabel={`${MONTHS[month.m]} ${month.y}`}
      overview={kpis}
      breakdown={breakdown}
    />
  );

  const records = (
    <>
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
        visibleDays.map((d) => (v2 ? <DayCardV2 key={d.date} day={d} member={member} /> : <DayCard key={d.date} day={d} member={member} />))
      )}
    </>
  );

  const filterSheet = (
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
  );

  if (v2) {
    return (
      <div className="mt-3 space-y-3.5">
        {/* Month summary: gradient card with the month picker, KPIs and totals */}
        <section className="relative overflow-hidden rounded-2xl p-4 bg-white border border-[#EBF0F7] text-[#1E293B] shadow-2xs">
                    <div className="relative flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFilterOpen(true)}
              className="flex-1 min-w-0 h-11 px-3 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-2.5 text-left active:bg-slate-50 transition-colors cursor-pointer"
            >
              <Calendar className="w-4 h-4 shrink-0 text-[#2F68FE]" />
              <span className="flex-1 min-w-0 text-xs font-medium truncate">
                {MONTHS[month.m]} {month.y}
              </span>
              <ChevronRight className="w-4 h-4 shrink-0 text-slate-400" />
            </button>
            <FilterIconButton count={filterCount} onClick={() => setFilterOpen(true)} label="Filter attendance" />
          </div>
          {loading ? (
            <div className="relative mt-4 space-y-2" aria-busy="true" aria-label="Loading attendance">
              <span className="block h-14 rounded-xl bg-slate-200/70 animate-pulse" />
              <span className="block h-10 rounded-xl bg-slate-200/70 animate-pulse" />
            </div>
          ) : (
            <>
              <div className="relative mt-4 grid grid-cols-4 gap-2">
                {kpis.map((k) => (
                  <div key={k.label} className="rounded-xl bg-slate-50/80 border border-slate-100 px-1 py-2.5 text-center min-w-0">
                    <p className={`text-[20px] font-extrabold leading-none tabular-nums ${k.text}`}>{k.value}</p>
                    <p className="mt-1.5 text-[11px] font-semibold text-slate-500 leading-tight">{k.label}</p>
                  </div>
                ))}
              </div>
              {viewSummary}
            </>
          )}
        </section>
        {summarySheet}

        {status !== ALL && (
          <div className="flex items-center justify-end px-1">
            <span className="text-[11px] font-semibold text-slate-500 truncate">Status: {status}</span>
          </div>
        )}

        <div className="space-y-2.5">{records}</div>
        {filterSheet}
      </div>
    );
  }

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
            <div className="grid grid-cols-4 gap-1.5 text-center">
              {kpis.map((k) => (
                <div key={k.label} className="flex flex-col items-center min-w-0">
                  <div className={`w-12 h-9 rounded-lg font-bold text-lg flex items-center justify-center mb-1.5 tabular-nums ${k.tile}`}>{k.value}</div>
                  <span className="text-[11px] text-gray-500 font-medium leading-tight">{k.label}</span>
                </div>
              ))}
            </div>
            {viewSummary}
          </>
        )}
      </div>
      {summarySheet}

      {/* Records */}
      <div className="space-y-3 pt-1">
        {status !== ALL && (
          <div className="flex items-center justify-end px-1">
            <span className="text-[11px] font-semibold text-slate-500 truncate">Status: {status}</span>
          </div>
        )}

        {records}
      </div>

      {filterSheet}
    </div>
  );
};
