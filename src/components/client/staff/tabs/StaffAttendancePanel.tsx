import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Building2,
  CalendarDays,
  CalendarX2,
  ChevronLeft,
  ChevronRight,
  Coffee,
  House,
  List,
  LogIn,
  LogOut,
  PartyPopper,
  Plane,
} from 'lucide-react';
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
import { Card, ChipRow, EmptyCard } from './StaffTabParts';
import { StaffSkeleton } from '../ClientStaffParts';

interface StaffAttendancePanelProps {
  member: ClientStaffMember;
  workMode: StaffWorkMode;
}

type Layout = 'list' | 'calendar';

/** Readable labels for desktop status codes */
const STATUS_LABEL: Record<AttendanceStatus, string> = {
  'Full day': 'Full Day',
  'Half Day': 'Half Day',
  'Half PL': 'Half Paid Leave',
  PL: 'Paid Leave',
  Absent: 'Absent',
  WO: 'Weekly Off',
  Holiday: 'Holiday',
};

const STATUS_STYLE: Record<AttendanceStatus, { pill: string; cell: string; dot: string }> = {
  'Full day': { pill: 'bg-[#E8F8F0] text-[#10B981]', cell: 'bg-[#E8F8F0] text-[#059669]', dot: 'bg-[#10B981]' },
  'Half Day': { pill: 'bg-[#FEF8E7] text-[#D97706]', cell: 'bg-[#FEF8E7] text-[#B45309]', dot: 'bg-[#F59E0B]' },
  'Half PL': { pill: 'bg-[#FFF7ED] text-[#EA580C]', cell: 'bg-[#FFF7ED] text-[#C2410C]', dot: 'bg-[#FB923C]' },
  PL: { pill: 'bg-[#EFF6FF] text-[#1D4ED8]', cell: 'bg-[#EFF6FF] text-[#1D4ED8]', dot: 'bg-[#3B82F6]' },
  Absent: { pill: 'bg-[#FEF2F2] text-rose-600', cell: 'bg-[#FEF2F2] text-rose-600', dot: 'bg-rose-500' },
  WO: { pill: 'bg-slate-100 text-slate-500', cell: 'bg-slate-100 text-slate-400', dot: 'bg-slate-300' },
  Holiday: { pill: 'bg-[#EEF2FF] text-[#4F46E5]', cell: 'bg-[#EEF2FF] text-[#4F46E5]', dot: 'bg-[#6366F1]' },
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEK_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const LOAD_MS = 400;

const parse = (iso: string) => new Date(`${iso}T00:00:00`);
const pad = (n: number) => String(n).padStart(2, '0');

/* --------------------------------- Pieces --------------------------------- */

const NavButton: React.FC<{ dir: 'prev' | 'next'; disabled: boolean; onClick: () => void }> = ({ dir, disabled, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={dir === 'prev' ? 'Previous month' : 'Next month'}
    className="w-9 h-9 rounded-xl border border-slate-200 bg-white text-slate-600 flex items-center justify-center active:bg-slate-50 disabled:text-slate-200 disabled:border-slate-100 disabled:cursor-not-allowed cursor-pointer"
  >
    {dir === 'prev' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
  </button>
);

const PresenceRing: React.FC<{ pct: number }> = ({ pct }) => (
  <span
    className="w-[76px] h-[76px] rounded-full flex items-center justify-center shrink-0"
    style={{ background: `conic-gradient(#10B981 ${pct * 3.6}deg, #E2E8F0 0deg)` }}
    role="img"
    aria-label={`${pct}% present`}
  >
    <span className="w-[62px] h-[62px] rounded-full bg-white flex flex-col items-center justify-center">
      <span className="text-[17px] font-extrabold text-[#1E293B] tabular-nums leading-none">{pct}%</span>
      <span className="mt-0.5 text-[9.5px] font-semibold text-slate-400">Present</span>
    </span>
  </span>
);

const KpiTile: React.FC<{ value: number; label: string; tint: string; dot: string }> = ({ value, label, tint, dot }) => (
  <div className={`rounded-xl px-2 py-2.5 flex flex-col items-center ${tint}`}>
    <span className="font-extrabold text-xl leading-none tabular-nums">{value}</span>
    <span className="mt-1.5 flex items-center gap-1 text-[10.5px] font-semibold text-slate-500">
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  </div>
);

const InfoBanner: React.FC<{ day: AttendanceDay }> = ({ day }) => {
  const config: Partial<Record<AttendanceStatus, { icon: React.ElementType; text: string; cls: string }>> = {
    Holiday: { icon: PartyPopper, text: `Public holiday · ${holidayName(day.date) ?? 'Holiday'}`, cls: 'bg-[#EEF2FF] border-[#E0E7FF] text-[#4F46E5]' },
    WO: { icon: Coffee, text: 'Scheduled weekly off', cls: 'bg-slate-50 border-slate-100 text-slate-500' },
    PL: { icon: Plane, text: 'On paid leave for the full day', cls: 'bg-[#EFF6FF] border-[#DBEAFE] text-[#1D4ED8]' },
    Absent: { icon: AlertCircle, text: 'No attendance recorded for this day.', cls: 'bg-[#FEF2F2] border-[#FEE2E2] text-rose-600' },
  };
  const c = config[day.status];
  if (!c) return null;
  const Icon = c.icon;
  return (
    <div className={`mt-3 rounded-xl border p-3 text-xs font-medium flex items-center gap-2 ${c.cls}`}>
      <Icon className="w-4 h-4 shrink-0" />
      <span>{c.text}</span>
    </div>
  );
};

const DayCard: React.FC<{ day: AttendanceDay }> = ({ day }) => {
  const d = parse(day.date);
  const worked = Boolean(day.checkIn);
  const hasOt = Boolean(day.overtime && day.overtime !== '00:00');
  const ModeIcon = day.workMode === 'WFH' ? House : Building2;
  return (
    <Card className="p-3.5">
      <div className="flex items-center gap-3">
        <span className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center shrink-0 ${STATUS_STYLE[day.status].cell}`}>
          <span className="text-[15px] font-extrabold leading-none tabular-nums">{pad(d.getDate())}</span>
          <span className="mt-0.5 text-[9px] font-bold uppercase opacity-80">{MONTHS[d.getMonth()].slice(0, 3)}</span>
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[13.5px] font-bold text-[#1E293B]">{d.toLocaleDateString('en-US', { weekday: 'long' })}</p>
          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400 font-medium">
            {worked ? (
              <>
                <ModeIcon className="w-3.5 h-3.5" />
                {day.workMode === 'WFH' ? 'Work From Home' : 'In Office'}
              </>
            ) : (
              STATUS_LABEL[day.status]
            )}
          </p>
        </div>
        <span className={`shrink-0 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${STATUS_STYLE[day.status].pill}`}>{STATUS_LABEL[day.status]}</span>
      </div>

      {worked ? (
        <>
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-[#DBE6FE] bg-[#F5F8FF] px-3 py-2.5">
            <span className="flex items-center gap-2 min-w-0">
              <span className="w-7 h-7 rounded-lg bg-white text-[#10B981] flex items-center justify-center shadow-2xs shrink-0">
                <LogIn className="w-3.5 h-3.5" />
              </span>
              <span className="min-w-0">
                <span className="block text-[10px] text-slate-400">Check In</span>
                <span className="block text-[12.5px] font-bold text-[#1E293B] tabular-nums">{day.checkIn}</span>
              </span>
            </span>
            <span className="flex-1 border-t-2 border-dotted border-[#BFDBFE] mx-1" aria-hidden="true" />
            <span className="flex items-center gap-2 min-w-0">
              <span className="min-w-0 text-right">
                <span className="block text-[10px] text-slate-400">Check Out</span>
                <span className="block text-[12.5px] font-bold text-[#1E293B] tabular-nums">{day.checkOut}</span>
              </span>
              <span className="w-7 h-7 rounded-lg bg-white text-rose-500 flex items-center justify-center shadow-2xs shrink-0">
                <LogOut className="w-3.5 h-3.5" />
              </span>
            </span>
          </div>
          <div className="mt-2 grid grid-cols-3 rounded-xl border border-[#EBF0F7] divide-x divide-[#EBF0F7]">
            {[
              ['Office Time', day.officeTime, 'text-[#1E293B]'],
              ['Break Time', day.breakTime, 'text-[#1E293B]'],
              ['Overtime', day.overtime, hasOt ? 'text-[#4F46E5]' : 'text-slate-300'],
            ].map(([label, value, color]) => (
              <div key={label} className="px-2.5 py-2">
                <p className="text-[10px] text-slate-400">{label}</p>
                <p className={`mt-0.5 text-[13px] font-bold tabular-nums ${color}`}>{value ? `${value} h` : '--'}</p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <InfoBanner day={day} />
      )}
    </Card>
  );
};

/* ---------------------------------- Panel --------------------------------- */

/** Attendance view of the staff "Attendance & Leave" tab: month summary + list / calendar of daily records */
export const StaffAttendancePanel: React.FC<StaffAttendancePanelProps> = ({ member, workMode }) => {
  const now = new Date();
  const joined = parse(member.joiningDate);
  // Staff who already left open on their last month (no records after the last working day)
  const end = parse(staffRecordsEnd(member));
  const [month, setMonth] = useState({ y: end.getFullYear(), m: end.getMonth() });
  const [layout, setLayout] = useState<Layout>('list');
  const [status, setStatus] = useState('All');
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setLoading(false), LOAD_MS);
    return () => clearTimeout(t);
  }, [loading]);

  const days = useMemo(() => attendanceFor(member, month.y, month.m, workMode), [member, month, workMode]);
  const byDate = useMemo(() => new Map(days.map((d) => [d.date, d])), [days]);
  const summary = summarizeAttendance(days);
  const presentPct = summary.working ? Math.round((summary.present / summary.working) * 100) : 0;

  const labelToStatus = (label: string) => ATTENDANCE_STATUSES.find((s) => STATUS_LABEL[s] === label);
  const statusFilter = labelToStatus(status);
  const visibleDays = statusFilter ? days.filter((d) => d.status === statusFilter) : days;
  const chipOptions = ['All', ...ATTENDANCE_STATUSES.map((s) => STATUS_LABEL[s])];
  const chipCounts: Record<string, number> = { All: days.length };
  ATTENDANCE_STATUSES.forEach((s) => (chipCounts[STATUS_LABEL[s]] = days.filter((d) => d.status === s).length));

  const atMin = month.y < joined.getFullYear() || (month.y === joined.getFullYear() && month.m <= joined.getMonth());
  const atMax = month.y > end.getFullYear() || (month.y === end.getFullYear() && month.m >= end.getMonth());
  const stepMonth = (delta: number) => {
    const d = new Date(month.y, month.m + delta, 1);
    setMonth({ y: d.getFullYear(), m: d.getMonth() });
    setStatus('All');
    setSelected(null);
    setLoading(true);
  };

  const first = days.length ? parse(days[days.length - 1].date) : null;
  const last = days.length ? parse(days[0].date) : null;
  const rangeLabel =
    first && last
      ? `${MONTHS[month.m].slice(0, 3)} ${pad(first.getDate())} – ${pad(last.getDate())} · ${days.length} ${days.length === 1 ? 'day' : 'days'} recorded`
      : 'No days recorded';

  // Calendar grid (Monday first)
  const totalDays = new Date(month.y, month.m + 1, 0).getDate();
  const offset = (new Date(month.y, month.m, 1).getDay() + 6) % 7;
  const todayKey = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const selectedDay = (selected && byDate.get(selected)) || days[0];
  const legend = ATTENDANCE_STATUSES.filter((s) => days.some((d) => d.status === s));

  return (
    <div className="mt-3 space-y-3">
      {/* Month summary */}
      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-100">
          <NavButton dir="prev" disabled={atMin} onClick={() => stepMonth(-1)} />
          <div className="flex-1 text-center min-w-0">
            <p className="text-[14px] font-extrabold text-[#1E293B]">
              {MONTHS[month.m]} {month.y}
            </p>
            <p className="text-[10.5px] text-slate-400 truncate">{rangeLabel}</p>
          </div>
          <NavButton dir="next" disabled={atMax} onClick={() => stepMonth(1)} />
        </div>

        {loading ? (
          <div className="p-4 space-y-3" aria-busy="true" aria-label="Loading attendance">
            <div className="flex items-center gap-4">
              <StaffSkeleton className="w-[76px] h-[76px] rounded-full" />
              <div className="flex-1 space-y-2">
                <StaffSkeleton className="w-20 h-3" />
                <StaffSkeleton className="w-24 h-7" />
              </div>
            </div>
            <StaffSkeleton className="w-full h-14 rounded-xl" />
          </div>
        ) : (
          <>
            <div className="p-4">
              <div className="flex items-center gap-4">
                <PresenceRing pct={presentPct} />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-slate-400">Salary Days</p>
                  <p className="mt-0.5 text-[28px] font-extrabold text-[#2F68FE] leading-none tabular-nums">
                    {summary.salary}
                    <span className="text-sm font-bold text-slate-300"> / {summary.working}</span>
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">Present + leave days out of working days</p>
                </div>
              </div>
              {summary.working > 0 && (
                <div className="mt-4 flex h-2 rounded-full overflow-hidden bg-slate-100 gap-0.5" role="img" aria-label="Present, leave and absent days share">
                  <span className="bg-[#10B981]" style={{ width: `${(summary.present / summary.working) * 100}%` }} />
                  <span className="bg-[#F59E0B]" style={{ width: `${(summary.leave / summary.working) * 100}%` }} />
                  <span className="bg-rose-500" style={{ width: `${(summary.absent / summary.working) * 100}%` }} />
                </div>
              )}
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <KpiTile value={summary.present} label="Present" tint="bg-[#F0FBF6] text-[#059669]" dot="bg-[#10B981]" />
                <KpiTile value={summary.leave} label="Leave" tint="bg-[#FEFAEE] text-[#B45309]" dot="bg-[#F59E0B]" />
                <KpiTile value={summary.absent} label="Absent" tint="bg-[#FEF5F5] text-rose-600" dot="bg-rose-500" />
              </div>
            </div>
            <dl className="grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100 bg-slate-50/60">
              {[
                ['Working Days', summary.working],
                ['Holidays', summary.holidays],
                ['Total Days', summary.total],
              ].map(([label, value]) => (
                <div key={label} className="py-2.5 text-center">
                  <dd className="text-[15px] font-extrabold text-[#1E293B] tabular-nums leading-none">{value}</dd>
                  <dt className="mt-1 text-[10px] font-semibold text-slate-400">{label}</dt>
                </div>
              ))}
            </dl>
          </>
        )}
      </Card>

      {/* Daily records header + layout switch */}
      <div className="flex items-center justify-between pt-1">
        <h4 className="px-1 text-sm font-bold text-[#1E293B]">Daily Records</h4>
        <div className="flex p-0.5 rounded-xl bg-slate-100 border border-slate-200/60" role="group" aria-label="Layout">
          {(
            [
              ['list', List, 'List view'],
              ['calendar', CalendarDays, 'Calendar view'],
            ] as const
          ).map(([id, Icon, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={layout === id}
              aria-label={label}
              onClick={() => setLayout(id)}
              className={`w-9 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                layout === id ? 'bg-white text-[#2F68FE] shadow-[0_1px_3px_rgba(15,23,42,0.12)]' : 'text-slate-400'
              }`}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2.5" aria-hidden="true">
          <StaffSkeleton className="w-full h-32 rounded-2xl" />
          <StaffSkeleton className="w-full h-32 rounded-2xl" />
        </div>
      ) : days.length === 0 ? (
        <EmptyCard icon={CalendarX2} title="No attendance records." text={`Nothing recorded for ${MONTHS[month.m]} ${month.y}.`} />
      ) : layout === 'calendar' ? (
        <>
          <Card className="p-3">
            <div className="grid grid-cols-7 gap-1 text-center">
              {WEEK_DAYS.map((w, i) => (
                <span key={i} className="text-[10px] font-semibold text-slate-400 pb-1">
                  {w}
                </span>
              ))}
              {Array.from({ length: offset }).map((_, i) => (
                <span key={`e${i}`} />
              ))}
              {Array.from({ length: totalDays }).map((_, i) => {
                const key = `${month.y}-${pad(month.m + 1)}-${pad(i + 1)}`;
                const rec = byDate.get(key);
                const isSel = rec && selectedDay?.date === key;
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={!rec}
                    onClick={() => setSelected(key)}
                    aria-label={rec ? `${i + 1} ${MONTHS[month.m]}: ${STATUS_LABEL[rec.status]}` : `${i + 1} ${MONTHS[month.m]}: no record`}
                    aria-pressed={Boolean(isSel)}
                    className={`relative h-10 rounded-xl text-[12px] font-bold tabular-nums flex items-center justify-center transition-all cursor-pointer disabled:cursor-default ${
                      rec ? STATUS_STYLE[rec.status].cell : 'text-slate-300'
                    } ${isSel ? 'ring-2 ring-[#2F68FE] ring-offset-1' : ''}`}
                  >
                    {i + 1}
                    {key === todayKey && <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#2F68FE]" />}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-x-3 gap-y-1.5">
              {legend.map((s) => (
                <span key={s} className="flex items-center gap-1.5 text-[10.5px] font-medium text-slate-500">
                  <span className={`w-2 h-2 rounded-full ${STATUS_STYLE[s].dot}`} />
                  {STATUS_LABEL[s]} · {chipCounts[STATUS_LABEL[s]]}
                </span>
              ))}
            </div>
          </Card>
          {selectedDay && <DayCard key={selectedDay.date} day={selectedDay} />}
        </>
      ) : (
        <>
          <ChipRow label="Attendance status" options={chipOptions} value={status} onChange={setStatus} counts={chipCounts} />
          {visibleDays.length === 0 ? (
            <EmptyCard
              icon={CalendarX2}
              title={`No "${status}" days.`}
              text={`Nothing marked ${status} in ${MONTHS[month.m]} ${month.y}.`}
              action={
                <button type="button" onClick={() => setStatus('All')} className="mt-3 text-xs font-bold text-[#2F68FE] cursor-pointer">
                  Clear All
                </button>
              }
            />
          ) : (
            <ul className="space-y-2.5">
              {visibleDays.map((d) => (
                <li key={d.date}>
                  <DayCard day={d} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
};
