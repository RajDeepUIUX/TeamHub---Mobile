import { AttendanceRecord } from '../types/attendance';

export const ATTENDANCE_EDIT_REASONS = ['Punching Error', 'Hybrid', 'Work From Home', 'Others'];

/** Signed-in staff member and their reporting manager (reviewer) */
export const ATTENDANCE_STAFF_CODE = 'A03780';
export const ATTENDANCE_REVIEWER = 'Naveen Das';

const base = {
  workplace: 'Ahmedabad - Gota Office',
  workMode: 'Office' as const,
};

/** Attendance edit requests raised by other members of the manager's team */
export const TEAM_ATTENDANCE_REQUESTS_SEED: AttendanceRecord[] = [
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
}

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
      { staffName: 'John Smith', staffCode: 'A03780', workMode: 'Office' },
      { staffName: 'Ananya Kulkarni', staffCode: 'A03515', workMode: 'Office' },
      { staffName: 'Vikram Rao', staffCode: 'A03642', workMode: 'Office' },
    ],
  },
  {
    name: 'Aryan Sharma',
    code: 'ANM00076',
    members: [
      { staffName: 'Kunal Desai', staffCode: 'A02988', workMode: 'Office' },
      { staffName: 'Nidhi Purohit', staffCode: 'A03211', workMode: 'Hybrid' },
      { staffName: 'Pooja Bhatt', staffCode: 'A03377', workMode: 'Office' },
    ],
  },
  {
    name: 'Meera Iyer',
    code: 'ANM00093',
    members: [
      { staffName: 'Rohan Mehta', staffCode: 'A03458', workMode: 'Hybrid' },
      { staffName: 'Sneha Joshi', staffCode: 'A03590', workMode: 'Office' },
      { staffName: 'Farhan Shaikh', staffCode: 'A03702', workMode: 'Remote' },
    ],
  },
];

export const reportingManagerOf = (staffName: string) =>
  TEAM_REPORTING_MANAGERS.find((m) => m.members.some((x) => x.staffName === staffName));

/** Current attendance cycle (26th → 25th) */
export const TEAM_CYCLE = { from: '2026-08-26', to: '2026-09-25' };

// [start, end] per working day; '' = absent. Each member starts at a different offset for variety
const DAY_PATTERNS: [string, string][] = [
  ['10:02', '19:12'],
  ['09:48', '18:55'],
  ['10:15', '19:30'],
  ['09:58', '19:05'],
  ['13:40', '18:10'],
  ['10:05', '19:20'],
  ['09:52', '19:02'],
  ['10:20', '19:35'],
  ['09:45', '18:58'],
  ['10:08', '19:16'],
  ['', ''],
  ['09:55', '19:05'],
  ['10:11', '19:24'],
];

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
  const end = new Date(`${TEAM_CYCLE.to}T00:00:00`);
  const punchLocation = member.workMode === 'Remote' ? 'Remote (VPN)' : 'Gota Main Entrance';
  let i = offset;
  for (let d = new Date(`${TEAM_CYCLE.from}T00:00:00`); d <= end; d.setDate(d.getDate() + 1)) {
    const date = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    if (skip.has(date)) continue;
    const weekday = d.getDay();
    const isWeekend = weekday === 0 || weekday === 6;
    const [start, end2] = isWeekend ? ['', ''] : DAY_PATTERNS[i++ % DAY_PATTERNS.length];
    const office = start ? mins(start, end2) : 0;
    const status = isWeekend ? 'weekly_off' : !start ? 'absent' : office < 6 * 60 ? 'half_day' : 'full_day';
    out.push({
      ...base,
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
export const TEAM_DAILY_ATTENDANCE_SEED: AttendanceRecord[] = TEAM_REPORTING_MANAGERS.flatMap((m) => m.members)
  .filter((member) => member.staffCode !== ATTENDANCE_STAFF_CODE)
  .flatMap((member, idx) =>
    generateMemberDays(
      member,
      idx * 3,
      new Set(TEAM_ATTENDANCE_REQUESTS_SEED.filter((r) => r.staffName === member.staffName).map((r) => r.date))
    )
  );
