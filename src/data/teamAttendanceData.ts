import { AttendanceRecord } from '../types/attendance';

export const ATTENDANCE_EDIT_REASONS = ['Punching Error', 'Hybrid', 'Work From Home', 'Others'];

/** Signed-in staff member and their reporting manager (reviewer) */
export const ATTENDANCE_STAFF_CODE = 'A03780';
export const ATTENDANCE_REVIEWER = 'Naveen Das';

const base = {
  workplace: 'Ahmedabad - Gota Office',
  workMode: 'Office' as const,
};

/** Hand-written edit requests from earlier cycles (current-cycle ones are generated below) */
const FIXED_TEAM_REQUESTS: AttendanceRecord[] = [
  {
    ...base,
    id: 'team-att-ak-0924',
    date: '2026-09-24',
    dateFormatted: 'Sep 24, 2026',
    dayOfWeek: 'Thursday',
    staffName: 'Ananya Kulkarni',
    staffCode: 'A03515',
    startTime: '10:05',
    endTime: '15:40',
    totalOfficeTime: '05h 35m',
    totalWorkingTime: '05h 10m',
    status: 'half_day',
    statusLabel: 'Half Day',
    reqOfficeHrs: '09h 00m',
    reqWorkHrs: '08h 20m',
    editRequested: true,
    editStatus: 'pending',
    editReason: 'Punching Error',
    editRequestedAt: 'Sep 25, 2026',
    punches: [
      { id: 'tp-ak-1', time: '10:05 AM', type: 'IN', location: 'Gota Main Entrance' },
      { id: 'tp-ak-2', time: '01:30 PM', type: 'OUT', location: 'Gota Right side' },
      { id: 'tp-ak-3', time: '02:05 PM', type: 'IN', location: 'Gota Right side' },
      { id: 'tp-ak-4', time: '03:40 PM', type: 'OUT', location: 'Gota Right side' },
    ],
  },
  {
    ...base,
    id: 'team-att-np-0923',
    date: '2026-09-23',
    dateFormatted: 'Sep 23, 2026',
    dayOfWeek: 'Wednesday',
    staffName: 'Nidhi Purohit',
    staffCode: 'A03211',
    workMode: 'Hybrid',
    startTime: '11:20',
    endTime: '16:05',
    totalOfficeTime: '04h 45m',
    totalWorkingTime: '04h 30m',
    status: 'half_day',
    statusLabel: 'Half Day',
    reqOfficeHrs: '09h 00m',
    reqWorkHrs: '08h 30m',
    editRequested: true,
    editStatus: 'pending',
    editReason: 'Hybrid',
    editNote: 'Client visit at their Prahlad Nagar office in the second half.',
    editRequestedAt: 'Sep 24, 2026',
    punches: [
      { id: 'tp-np-1', time: '11:20 AM', type: 'IN', location: 'Gota Right side' },
      { id: 'tp-np-2', time: '04:05 PM', type: 'OUT', location: 'Gota Main Entrance' },
    ],
  },
  {
    ...base,
    id: 'team-att-kd-0922',
    date: '2026-09-22',
    dateFormatted: 'Sep 22, 2026',
    dayOfWeek: 'Tuesday',
    staffName: 'Kunal Desai',
    staffCode: 'A02988',
    startTime: '',
    endTime: '',
    totalOfficeTime: '00h 00m',
    totalWorkingTime: '00h 00m',
    status: 'absent',
    statusLabel: 'Absent',
    reqOfficeHrs: '09h 00m',
    reqWorkHrs: '08h 00m',
    editRequested: true,
    editStatus: 'pending',
    editReason: 'Work From Home',
    editRequestedAt: 'Sep 23, 2026',
    punches: [],
  },
  {
    ...base,
    id: 'team-att-ak-0918',
    date: '2026-09-18',
    dateFormatted: 'Sep 18, 2026',
    dayOfWeek: 'Friday',
    staffName: 'Ananya Kulkarni',
    staffCode: 'A03515',
    startTime: '12:50',
    endTime: '19:30',
    totalOfficeTime: '06h 40m',
    totalWorkingTime: '06h 05m',
    status: 'full_day',
    statusLabel: 'Full Day (Approved)',
    reqOfficeHrs: '09h 00m',
    reqWorkHrs: '08h 15m',
    editRequested: true,
    editStatus: 'approved',
    editReason: 'Punching Error',
    editRequestedAt: 'Sep 19, 2026',
    editReviewedBy: 'Naveen Das',
    editReviewedAt: 'Sep 19, 2026',
    managerRemark: 'Verified with the security log.',
    punches: [
      { id: 'tp-ak18-1', time: '12:50 PM', type: 'IN', location: 'Gota Right side' },
      { id: 'tp-ak18-2', time: '07:30 PM', type: 'OUT', location: 'Gota Right side' },
    ],
  },
  {
    ...base,
    id: 'team-att-kd-0915',
    date: '2026-09-15',
    dateFormatted: 'Sep 15, 2026',
    dayOfWeek: 'Tuesday',
    staffName: 'Kunal Desai',
    staffCode: 'A02988',
    startTime: '14:10',
    endTime: '18:00',
    totalOfficeTime: '03h 50m',
    totalWorkingTime: '03h 35m',
    status: 'half_day',
    statusLabel: 'Rejected',
    reqOfficeHrs: '09h 00m',
    reqWorkHrs: '08h 00m',
    editRequested: true,
    editStatus: 'rejected',
    editReason: 'Others',
    editNote: 'Was at a family function in the morning.',
    editRequestedAt: 'Sep 16, 2026',
    editReviewedBy: 'Naveen Das',
    editReviewedAt: 'Sep 16, 2026',
    managerRemark: 'Personal time should be applied as leave, not as an attendance correction.',
    punches: [
      { id: 'tp-kd15-1', time: '02:10 PM', type: 'IN', location: 'Gota Main Entrance' },
      { id: 'tp-kd15-2', time: '06:00 PM', type: 'OUT', location: 'Gota Main Entrance' },
    ],
  },
  {
    ...base,
    id: 'team-att-rm-0921',
    date: '2026-09-21',
    dateFormatted: 'Sep 21, 2026',
    dayOfWeek: 'Monday',
    staffName: 'Rohan Mehta',
    staffCode: 'A03458',
    workMode: 'Hybrid',
    startTime: '10:10',
    endTime: '14:25',
    totalOfficeTime: '04h 15m',
    totalWorkingTime: '04h 00m',
    status: 'half_day',
    statusLabel: 'Half Day',
    reqOfficeHrs: '09h 00m',
    reqWorkHrs: '08h 15m',
    editRequested: true,
    editStatus: 'pending',
    editReason: 'Hybrid',
    editNote: 'Worked from the client site at SG Highway after lunch.',
    editRequestedAt: 'Sep 22, 2026',
    punches: [
      { id: 'tp-rm21-1', time: '10:10 AM', type: 'IN', location: 'Gota Main Entrance' },
      { id: 'tp-rm21-2', time: '02:25 PM', type: 'OUT', location: 'Gota Main Entrance' },
    ],
  },
  {
    ...base,
    id: 'team-att-pb-0917',
    date: '2026-09-17',
    dateFormatted: 'Sep 17, 2026',
    dayOfWeek: 'Thursday',
    staffName: 'Pooja Bhatt',
    staffCode: 'A03377',
    startTime: '',
    endTime: '',
    totalOfficeTime: '00h 00m',
    totalWorkingTime: '00h 00m',
    status: 'absent',
    statusLabel: 'Absent',
    reqOfficeHrs: '09h 00m',
    reqWorkHrs: '08h 10m',
    editRequested: true,
    editStatus: 'pending',
    editReason: 'Punching Error',
    editRequestedAt: 'Sep 18, 2026',
    punches: [],
  },
  {
    ...base,
    id: 'team-att-fs-0910',
    date: '2026-09-10',
    dateFormatted: 'Sep 10, 2026',
    dayOfWeek: 'Thursday',
    staffName: 'Farhan Shaikh',
    staffCode: 'A03702',
    workMode: 'Remote',
    startTime: '09:40',
    endTime: '14:05',
    totalOfficeTime: '04h 25m',
    totalWorkingTime: '04h 10m',
    status: 'full_day',
    statusLabel: 'Full Day (Approved)',
    reqOfficeHrs: '09h 00m',
    reqWorkHrs: '08h 20m',
    editRequested: true,
    editStatus: 'approved',
    editReason: 'Work From Home',
    editRequestedAt: 'Sep 11, 2026',
    editReviewedBy: 'Meera Iyer',
    editReviewedAt: 'Sep 11, 2026',
    managerRemark: 'Approved — VPN logs confirm a full day.',
    punches: [
      { id: 'tp-fs10-1', time: '09:40 AM', type: 'IN', location: 'Remote (VPN)' },
      { id: 'tp-fs10-2', time: '02:05 PM', type: 'OUT', location: 'Remote (VPN)' },
    ],
  },
];

/** Only these edit reasons collect a note (mirrors the Request Edit form) */
export const REASONS_WITH_NOTE = ['Hybrid', 'Others'];
export const reasonAllowsNote = (reason?: string) => Boolean(reason && REASONS_WITH_NOTE.includes(reason));

/* ------------------------------------------------------------------------- */
/* Hierarchy: you (main manager) → reporting managers → their staff           */
/* ------------------------------------------------------------------------- */

export interface TeamMember {
  staffName: string;
  staffCode: string;
  workMode: AttendanceRecord['workMode'];
  branch: string;
}

/** Office branches (location - city) */
export const BRANCHES = ['Gota - Ahmedabad', 'Maradia Plaza - Ahmedabad', 'Atulyaksh - Ahmedabad', 'Sadra - Surat'];

export interface ReportingManager {
  name: string;
  code: string;
  members: TeamMember[];
}

/** Everyone under the signed-in manager; they can review requests for all of them */
export const TEAM_REPORTING_MANAGERS: ReportingManager[] = [
  {
    name: 'Naveen Das',
    code: 'ANM00041',
    members: [
      { staffName: 'John Smith', staffCode: 'A03780', workMode: 'Office', branch: 'Gota - Ahmedabad' },
      { staffName: 'Ananya Kulkarni', staffCode: 'A03515', workMode: 'Office', branch: 'Gota - Ahmedabad' },
      { staffName: 'Vikram Rao', staffCode: 'A03642', workMode: 'Office', branch: 'Maradia Plaza - Ahmedabad' },
    ],
  },
  {
    name: 'Aryan Sharma',
    code: 'ANM00076',
    members: [
      { staffName: 'Kunal Desai', staffCode: 'A02988', workMode: 'Office', branch: 'Atulyaksh - Ahmedabad' },
      { staffName: 'Nidhi Purohit', staffCode: 'A03211', workMode: 'Hybrid', branch: 'Maradia Plaza - Ahmedabad' },
      { staffName: 'Pooja Bhatt', staffCode: 'A03377', workMode: 'Office', branch: 'Atulyaksh - Ahmedabad' },
    ],
  },
  {
    name: 'Meera Iyer',
    code: 'ANM00093',
    members: [
      { staffName: 'Rohan Mehta', staffCode: 'A03458', workMode: 'Hybrid', branch: 'Sadra - Surat' },
      { staffName: 'Sneha Joshi', staffCode: 'A03590', workMode: 'Office', branch: 'Sadra - Surat' },
      { staffName: 'Farhan Shaikh', staffCode: 'A03702', workMode: 'Remote', branch: 'Gota - Ahmedabad' },
    ],
  },
];

export const reportingManagerOf = (staffName: string) =>
  TEAM_REPORTING_MANAGERS.find((m) => m.members.some((x) => x.staffName === staffName));

export const branchOf = (staffName: string) =>
  TEAM_REPORTING_MANAGERS.flatMap((m) => m.members).find((x) => x.staffName === staffName)?.branch;

const pad0 = (n: number) => String(n).padStart(2, '0');
const dayKey = (d: Date) => `${d.getFullYear()}-${pad0(d.getMonth() + 1)}-${pad0(d.getDate())}`;

/** Default filter range: same rule as the staff side — the 26th → today (from the real date) */
export const TEAM_CYCLE = (() => {
  const t = new Date();
  const from = t.getDate() >= 26 ? new Date(t.getFullYear(), t.getMonth(), 26) : new Date(t.getFullYear(), t.getMonth() - 1, 26);
  return { from: dayKey(from), to: dayKey(t) };
})();

/** Days that have generated logs: from Aug 26 up to yesterday (today isn't final yet) */
export const TEAM_HISTORY = (() => {
  const y = new Date();
  y.setDate(y.getDate() - 1);
  return { from: '2026-08-26', to: dayKey(y) };
})();

// [start, end] for a full working day; each member starts at a different offset for variety
const DAY_PATTERNS: [string, string][] = [
  ['10:02', '19:12'],
  ['09:48', '18:55'],
  ['10:15', '19:30'],
  ['09:58', '19:05'],
  ['10:05', '19:20'],
  ['09:52', '19:02'],
  ['10:20', '19:35'],
  ['09:45', '18:58'],
  ['10:08', '19:16'],
  ['09:55', '19:05'],
  ['10:11', '19:24'],
];
// Short days (under 6h in office) count as a half day
const HALF_DAY_PATTERNS: [string, string][] = [
  ['13:40', '18:10'],
  ['09:50', '14:05'],
  ['14:10', '19:05'],
];

/** Small stable hash, so the same member and date always get the same day */
const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};

/** Each member's own absence / half-day rates (in %), so team totals differ person to person */
const memberRates = (staffCode: string) => {
  const p = hash(staffCode);
  return { absent: 2 + (p % 9), half: 3 + ((p >>> 4) % 12) };
};

const pad2 = (n: number) => String(n).padStart(2, '0');
const to12 = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return `${pad2(((h + 11) % 12) + 1)}:${pad2(m)} ${h >= 12 ? 'PM' : 'AM'}`;
};
const mins = (s: string, e: string) => {
  const [sh, sm] = s.split(':').map(Number);
  const [eh, em] = e.split(':').map(Number);
  return eh * 60 + em - (sh * 60 + sm);
};
const dur = (m: number) => `${pad2(Math.floor(m / 60))}h ${pad2(m % 60)}m`;
const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** One record per day of the cycle (weekends as weekly off), skipping dates in `skip` */
export const generateMemberDays = (member: TeamMember, offset: number, skip: Set<string>): AttendanceRecord[] => {
  const out: AttendanceRecord[] = [];
  const end = new Date(`${TEAM_HISTORY.to}T00:00:00`);
  const punchLocation = member.workMode === 'Remote' ? 'Remote (VPN)' : 'Gota Main Entrance';
  const rates = memberRates(member.staffCode);
  let i = offset;
  for (let d = new Date(`${TEAM_HISTORY.from}T00:00:00`); d <= end; d.setDate(d.getDate() + 1)) {
    const date = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    if (skip.has(date)) continue;
    const weekday = d.getDay();
    const isWeekend = weekday === 0 || weekday === 6;
    const roll = hash(`${member.staffCode}-${date}`) % 100;
    const [start, end2]: [string, string] = isWeekend
      ? ['', '']
      : roll < rates.absent
        ? ['', '']
        : roll < rates.absent + rates.half
          ? HALF_DAY_PATTERNS[roll % HALF_DAY_PATTERNS.length]
          : DAY_PATTERNS[i++ % DAY_PATTERNS.length];
    const office = start ? mins(start, end2) : 0;
    const status = isWeekend ? 'weekly_off' : !start ? 'absent' : office < 6 * 60 ? 'half_day' : 'full_day';
    out.push({
      ...base,
      workplace: member.branch,
      workMode: member.workMode,
      id: `team-day-${member.staffCode}-${date}`,
      date,
      dateFormatted: `${MONTH_SHORT[d.getMonth()]} ${pad2(d.getDate())}, ${d.getFullYear()}`,
      dayOfWeek: WEEKDAY_NAMES[weekday],
      staffName: member.staffName,
      staffCode: member.staffCode,
      startTime: start,
      endTime: end2,
      totalOfficeTime: dur(office),
      totalWorkingTime: dur(Math.max(0, office - (start ? 32 : 0))),
      status,
      statusLabel: { full_day: 'Full Day', half_day: 'Half Day', absent: 'Absent', weekly_off: 'WO' }[status],
      punches: start
        ? [
            { id: `tp-${member.staffCode}-${date}-1`, time: to12(start), type: 'IN', location: punchLocation },
            { id: `tp-${member.staffCode}-${date}-2`, time: to12(end2), type: 'OUT', location: punchLocation },
          ]
        : [],
    });
  }
  return out;
};

/** Full-cycle daily logs for everyone except the signed-in staff member (their days come from their own records) */
const OTHER_MEMBERS = TEAM_REPORTING_MANAGERS.flatMap((m) => m.members).filter((member) => member.staffCode !== ATTENDANCE_STAFF_CODE);
const fixedDatesOf = (staffName: string) => new Set(FIXED_TEAM_REQUESTS.filter((r) => r.staffName === staffName).map((r) => r.date));

/**
 * Pending edit requests in the current cycle: 0–3 per member (stable per member), raised on their own
 * half days / absences so the Pending counts look lived-in and differ person to person.
 */
/** Pending edit requests this cycle for specific people (everyone else gets 0–3 from a stable hash) */
const PENDING_REQUEST_COUNTS: Record<string, number> = {
  'Nidhi Purohit': 2,
  'Pooja Bhatt': 4,
};

/** A full day turned into a short one, as a missed punch would leave it (used when someone needs more requests) */
const asShortDay = (r: AttendanceRecord): AttendanceRecord => {
  const [start, end] = ['10:04', '14:18'];
  const office = mins(start, end);
  return {
    ...r,
    startTime: start,
    endTime: end,
    totalOfficeTime: dur(office),
    totalWorkingTime: dur(office - 32),
    status: 'half_day',
    statusLabel: 'Half Day',
    punches: [
      { id: `tp-${r.staffCode}-${r.date}-1`, time: to12(start), type: 'IN', location: r.punches[0]?.location ?? 'Gota Main Entrance' },
      { id: `tp-${r.staffCode}-${r.date}-2`, time: to12(end), type: 'OUT', location: r.punches[0]?.location ?? 'Gota Main Entrance' },
    ],
  };
};

const CYCLE_PENDING_REQUESTS: AttendanceRecord[] = OTHER_MEMBERS.flatMap((member, idx) => {
  const fixedCount = PENDING_REQUEST_COUNTS[member.staffName];
  const wanted = fixedCount ?? hash(`${member.staffCode}-pending`) % 4;
  const days = generateMemberDays(member, idx * 3, fixedDatesOf(member.staffName)).filter(
    (r) => r.date >= TEAM_CYCLE.from && r.status !== 'weekly_off'
  );
  // Requests sit on short days and absences; only a pinned count may also use recent full days to reach its number
  const short = days.filter((r) => r.status === 'half_day' || r.status === 'absent');
  const full = fixedCount !== undefined ? days.filter((r) => r.status === 'full_day').reverse().map(asShortDay) : [];
  const picked = (fixedCount !== undefined ? [...short.reverse(), ...full] : short.slice(-wanted || short.length))
    .slice(0, wanted)
    .sort((a, b) => a.date.localeCompare(b.date));
  return picked.map((r) => {
    const raisedOn = new Date(`${r.date}T00:00:00`);
    raisedOn.setDate(raisedOn.getDate() + 1);
    return {
      ...r,
      id: `team-att-${member.staffCode}-${r.date}-req`,
      reqOfficeHrs: '09h 00m',
      reqWorkHrs: '08h 30m',
      editRequested: true,
      editStatus: 'pending' as const,
      editReason: r.status === 'absent' ? 'Work From Home' : 'Punching Error',
      editRequestedAt: `${MONTH_SHORT[raisedOn.getMonth()]} ${pad2(raisedOn.getDate())}, ${raisedOn.getFullYear()}`,
    };
  });
});

/** Attendance edit requests raised by other members of the manager's team */
export const TEAM_ATTENDANCE_REQUESTS_SEED: AttendanceRecord[] = [...CYCLE_PENDING_REQUESTS, ...FIXED_TEAM_REQUESTS];

export const TEAM_DAILY_ATTENDANCE_SEED: AttendanceRecord[] = OTHER_MEMBERS.flatMap((member, idx) =>
  generateMemberDays(
    member,
    idx * 3,
    new Set(TEAM_ATTENDANCE_REQUESTS_SEED.filter((r) => r.staffName === member.staffName).map((r) => r.date))
  )
);
