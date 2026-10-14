import { AttendanceKPIs, AttendanceRecord, PunchRecord } from '../types/attendance';
import { INITIAL_ATTENDANCE_RECORDS, INITIAL_KPIS } from './attendanceData';

/* ------------------------------------------------------------------------- */
/* August 2026 cycle (Jul 26 – Aug 25): generated day-by-day with overrides   */
/* ------------------------------------------------------------------------- */

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const pad = (n: number) => String(n).padStart(2, '0');
const key = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const to12h = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return `${pad(((h + 11) % 12) + 1)}:${pad(m)} ${h >= 12 ? 'PM' : 'AM'}`;
};
const minutesBetween = (start: string, end: string) => {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return eh * 60 + em - (sh * 60 + sm);
};
const fmtDuration = (mins: number) => `${pad(Math.floor(mins / 60))}h ${pad(mins % 60)}m`;

type DayPlan = Partial<AttendanceRecord> & { start?: string; end?: string };

// Days that differ from a regular full day in office
const AUGUST_OVERRIDES: Record<string, DayPlan> = {
  '2026-07-29': { status: 'half_day', start: '14:05', end: '19:10' },
  '2026-08-05': {
    // Half day corrected by manager → counted as full day
    status: 'full_day',
    start: '13:52',
    end: '18:40',
    editRequested: true,
    editStatus: 'approved',
    editReason: 'Punching Error',
    reqOfficeHrs: '09:00',
    reqWorkHrs: '08:10',
    editRequestedAt: 'Aug 06, 2026',
    editReviewedBy: 'Naveen Das',
    editReviewedAt: 'Aug 07, 2026',
  },
  '2026-08-07': { status: 'absent' },
  '2026-08-11': {
    status: 'half_day',
    start: '14:30',
    end: '19:02',
    editRequested: true,
    editStatus: 'rejected',
    editReason: 'Work From Home',
    reqOfficeHrs: '09:00',
    reqWorkHrs: '08:00',
    editRequestedAt: 'Aug 12, 2026',
    editReviewedBy: 'Naveen Das',
    editReviewedAt: 'Aug 13, 2026',
    managerRemark: 'WFH was not pre-approved for this day. Please apply leave instead.',
  },
  '2026-08-19': {
    status: 'full_day',
    start: '12:40',
    end: '18:55',
    editRequested: true,
    editStatus: 'approved',
    editReason: 'Hybrid',
    editNote: 'Client visit in the second half.',
    reqOfficeHrs: '09:00',
    reqWorkHrs: '08:30',
    editRequestedAt: 'Aug 20, 2026',
    editReviewedBy: 'Naveen Das',
    editReviewedAt: 'Aug 20, 2026',
  },
  '2026-08-21': { status: 'half_day', start: '15:10', end: '20:02' },
};

// Slight variety in regular full-day timings
const REGULAR_TIMES: [string, string][] = [
  ['12:14', '21:15'],
  ['12:24', '21:52'],
  ['12:20', '21:40'],
  ['12:08', '21:12'],
  ['12:31', '21:48'],
];

/** Day-by-day records for [start, end], skipping dates in `skip`; `overrides` change specific days */
const buildRecords = (start: Date, end: Date, overrides: Record<string, DayPlan>, skip: Set<string> = new Set()): AttendanceRecord[] => {
  const records: AttendanceRecord[] = [];

  for (let d = new Date(start), i = 0; d <= end; d.setDate(d.getDate() + 1), i++) {
    const dateKey = key(d);
    if (skip.has(dateKey)) continue;
    const weekday = d.getDay();
    // Generated days: every ~9th working day a half day, every ~17th an absence, for some variety
    const generated: DayPlan = i % 17 === 11 ? { status: 'absent' } : i % 9 === 4 ? { status: 'half_day', start: '14:05', end: '19:10' } : {};
    const plan = overrides[dateKey] ?? (overrides === AUGUST_OVERRIDES ? {} : generated);
    const isWeekend = weekday === 0 || weekday === 6;
    const status = isWeekend ? 'weekly_off' : plan.status ?? 'full_day';

    const [defStart, defEnd] = REGULAR_TIMES[i % REGULAR_TIMES.length];
    const hasPunches = status === 'full_day' || status === 'half_day';
    const startTime = hasPunches ? plan.start ?? defStart : '';
    const endTime = hasPunches ? plan.end ?? defEnd : '';
    const officeMins = hasPunches ? minutesBetween(startTime, endTime) : 0;
    const workMins = Math.max(0, officeMins - (hasPunches ? 38 : 0));

    const punches: PunchRecord[] = hasPunches
      ? [
          { id: `p-${dateKey}-1`, time: to12h(startTime), type: 'IN', location: 'Gota Right side' },
          { id: `p-${dateKey}-2`, time: to12h(endTime), type: 'OUT', location: 'Gota Right side' },
        ]
      : [];

    const statusLabel =
      plan.editStatus === 'approved'
        ? 'Full Day (Approved)'
        : plan.editStatus === 'rejected'
          ? 'Rejected'
          : { full_day: 'Full Day', half_day: 'Half Day', absent: 'Absent', weekly_off: 'WO', holiday: 'Holiday' }[status];

    const { start: _s, end: _e, ...extra } = plan;
    records.push({
      id: `att-${dateKey.replace(/-/g, '')}`,
      date: dateKey,
      dateFormatted: `${MONTHS_SHORT[d.getMonth()]} ${pad(d.getDate())}, ${d.getFullYear()}`,
      dayOfWeek: WEEKDAYS[weekday],
      staffName: 'John Smith',
      workplace: 'Ahmedabad - Gota Office',
      workMode: 'Office',
      startTime,
      endTime,
      totalOfficeTime: hasPunches ? fmtDuration(officeMins) : '00h 00m',
      totalWorkingTime: hasPunches ? fmtDuration(workMins) : '00h 00m',
      punches,
      ...extra,
      status,
      statusLabel,
    });
  }
  return records;
};

export const AUGUST_ATTENDANCE_RECORDS = buildRecords(new Date(2026, 6, 26), new Date(2026, 7, 25), AUGUST_OVERRIDES);

export const kpisFrom = (records: AttendanceRecord[]): AttendanceKPIs => {
  const count = (fn: (r: AttendanceRecord) => boolean) => records.filter(fn).length;
  const weeklyOff = count((r) => r.status === 'weekly_off');
  const holidays = count((r) => r.status === 'holiday');
  const absent = count((r) => r.status === 'absent');
  const present = count((r) => r.status === 'full_day' || r.status === 'half_day');
  const totalDays = records.length;
  return {
    workingDays: totalDays - weeklyOff - holidays,
    presentDays: present,
    absentDays: absent,
    leaveDays: count((r) => Boolean(r.leaveApplied)),
    holidays,
    lwpDays: 0,
    deductionDays: absent,
    totalDays,
    salaryDays: totalDays - absent,
  };
};

/* ------------------------------------------------------------------------- */
/* Month cycles shown on the Attendance tab                                  */
/* ------------------------------------------------------------------------- */

export interface AttendanceMonth {
  label: string;
  range: { from: Date; to: Date };
  kpis: AttendanceKPIs;
}

export const ATTENDANCE_MONTHS: AttendanceMonth[] = [
  {
    label: 'August 2026',
    range: { from: new Date(2026, 6, 26), to: new Date(2026, 7, 25) },
    kpis: kpisFrom(AUGUST_ATTENDANCE_RECORDS),
  },
  {
    label: 'September 2026',
    range: { from: new Date(2026, 7, 26), to: new Date(2026, 8, 23) },
    kpis: INITIAL_KPIS,
  },
];

/* ------------------------------------------------------------------------- */
/* Real-date cycle: the 26th → today                                         */
/* ------------------------------------------------------------------------- */

const atMidnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/**
 * Attendance cycle for the given day: from the 26th (this month once today is the 26th or later,
 * otherwise last month) up to today. E.g. Oct 14 → Sep 26 – Oct 14; Oct 27 → Oct 26 – Oct 27.
 */
export const currentAttendanceCycle = (today: Date = new Date()) => {
  const t = atMidnight(today);
  const from = t.getDate() >= 26 ? new Date(t.getFullYear(), t.getMonth(), 26) : new Date(t.getFullYear(), t.getMonth() - 1, 26);
  return { from, to: t };
};

/** Hand-made + August records, then generated days for every remaining date up to yesterday (today isn't final yet) */
const HANDMADE = [...INITIAL_ATTENDANCE_RECORDS, ...AUGUST_ATTENDANCE_RECORDS];
const yesterday = (() => {
  const d = atMidnight(new Date());
  d.setDate(d.getDate() - 1);
  return d;
})();
const FILLED = buildRecords(new Date(2026, 6, 26), yesterday, {}, new Set(HANDMADE.map((r) => r.date)));

/** Every record (newest first) */
export const ALL_ATTENDANCE_RECORDS: AttendanceRecord[] = [...HANDMADE, ...FILLED].sort((a, b) => b.date.localeCompare(a.date));
