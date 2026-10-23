/**
 * Human Resources › Attendance Management › Attendance Amend (desktop `attendancemanagement`, `acceptAttendance`): staff ask to
 * correct a day's attendance and the client approves or rejects it with a comment. The daily Attendance View lives in each
 * staff profile (My Staff › Attendance & Leave). Dummy data only.
 */
import { holidayName, type AttendanceDay } from './clientStaffProfileData';

export const AMEND_STATUSES = ['Pending', 'Approved', 'Rejected'] as const;
export type AmendStatus = (typeof AMEND_STATUSES)[number];

/** Desktop request types */
export const AMEND_REASONS = ['Card Missing', 'Punching Error', 'Punching Machine Error', 'Left Early and Set Off Hours on Other Day', 'Overtime', 'Other'] as const;
export type AmendReason = (typeof AMEND_REASONS)[number];

export const SET_OFF_REASON: AmendReason = 'Left Early and Set Off Hours on Other Day';

export interface AmendRequest {
  id: string;
  /** `ClientStaffMember.id` */
  staffId: string;
  /** ISO date being corrected */
  date: string;
  reason: AmendReason;
  /** Punch times the staff member asks for (null = not given) */
  requestedIn: string | null;
  requestedOut: string | null;
  workMode: 'Office' | 'WFH';
  /** What the system recorded for the day */
  recordedStatus: 'Absent' | 'Half Day' | 'Full day';
  staffNote: string;
  /** ISO date */
  appliedOn: string;
  status: AmendStatus;
  /** ISO date; set once decided */
  decidedOn: string | null;
  clientComment: string;
  /** ISO date; the day the staff member makes up the hours (Left Early request type) */
  setOffDate: string | null;
}

const pad = (n: number) => String(n).padStart(2, '0');
export const isoOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** ISO date `n` working days before today (weekends skipped) */
const workdaysAgo = (n: number) => {
  const d = new Date();
  let left = n;
  while (left > 0) {
    d.setDate(d.getDate() - 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) left -= 1;
  }
  return isoOf(d);
};

const req = (id: number, staffId: string, daysAgo: number, reason: AmendReason, extra: Partial<AmendRequest> = {}): AmendRequest => ({
  id: `am${id}`,
  staffId,
  date: workdaysAgo(daysAgo),
  reason,
  requestedIn: '09:00 AM',
  requestedOut: '06:00 PM',
  workMode: 'Office',
  recordedStatus: 'Absent',
  staffNote: '',
  appliedOn: workdaysAgo(Math.max(daysAgo - 1, 0)),
  status: 'Pending',
  decidedOn: null,
  clientComment: '',
  setOffDate: null,
  ...extra,
});

export const AMEND_SEED: AmendRequest[] = [
  req(1, 'ms10', 2, 'Punching Error', { requestedOut: '06:15 PM', recordedStatus: 'Half Day', staffNote: 'Punched out twice by mistake, so the system closed my day at 01:10 PM. I worked the full shift.' }),
  req(2, 'ms17', 3, 'Card Missing', { workMode: 'WFH', recordedStatus: 'Absent', staffNote: 'My access card was not working so there is no punch for the day. I was online on Teams from 09:00 AM.' }),
  req(3, 'ms16', 1, 'Punching Error', { requestedIn: '09:30 AM', recordedStatus: 'Half Day', staffNote: 'The check-in did not register at the gate. I reached the office at 09:30 AM.' }),
  req(4, 'ms12', 6, SET_OFF_REASON, {
    requestedOut: '03:00 PM',
    recordedStatus: 'Half Day',
    staffNote: 'Left early for a family function; I will make up the hours on the weekend support shift.',
    status: 'Approved',
    decidedOn: workdaysAgo(4),
    clientComment: 'Fine. Please finish the pending review before the shift ends.',
    setOffDate: workdaysAgo(0),
  }),
  req(5, 'ms6', 8, 'Other', { workMode: 'WFH', staffNote: 'Power cut at my place for most of the day, so I could not connect to the VPN.', status: 'Rejected', decidedOn: workdaysAgo(6), clientComment: 'Please raise this as a leave so the balance stays accurate.' }),
  req(6, 'ms7', 9, 'Overtime', { requestedIn: '09:00 AM', requestedOut: '08:30 PM', recordedStatus: 'Full day', staffNote: 'Stayed back to close the quarter-end reconciliations.', status: 'Approved', decidedOn: workdaysAgo(7), clientComment: 'Approved. Thank you for the extra effort.' }),
];

/** "Fri, Oct 16, 2026" */
export const formatAmendDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' });

/** Next office-closed holiday in the next 90 days, e.g. { name: 'Diwali', date: '2026-11-09' } */
export const nextHoliday = (): { name: string; date: string } | null => {
  const d = new Date();
  for (let i = 0; i < 90; i += 1) {
    const iso = isoOf(d);
    const name = holidayName(iso);
    if (name) return { name, date: iso };
    d.setDate(d.getDate() + 1);
  }
  return null;
};

export const pendingAmendCount = (requests: AmendRequest[]) => requests.filter((r) => r.status === 'Pending').length;

/** 09:00 AM → minutes */
export const minutesOf = (time: string | null) => {
  const m = time?.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return null;
  return ((Number(m[1]) % 12) + (m[3].toUpperCase() === 'PM' ? 12 : 0)) * 60 + Number(m[2]);
};
export const hm = (mins: number) => `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;

/** Requested punch times → Total Office Time / Overtime (over a 9h day incl. break) */
export const amendTimes = (r: Pick<AmendRequest, 'requestedIn' | 'requestedOut'>) => {
  const a = minutesOf(r.requestedIn);
  const b = minutesOf(r.requestedOut);
  if (a === null || b === null || b <= a) return { office: null, overtime: null };
  const office = b - a;
  return { office: hm(office), overtime: hm(Math.max(0, office - 9 * 60)) };
};

/** Approved amend requests replace the recorded day (desktop `acceptAttendance` rewrites the attendance row) */
export const withApprovedAmends = (staffId: string, days: AttendanceDay[], requests: AmendRequest[]): AttendanceDay[] => {
  const approved = requests.filter((r) => r.staffId === staffId && r.status === 'Approved');
  if (!approved.length) return days;
  return days.map((d) => {
    const r = approved.find((a) => a.date === d.date);
    if (!r) return d;
    const checkIn = r.requestedIn ?? d.checkIn;
    const checkOut = r.requestedOut ?? d.checkOut;
    const times = amendTimes({ requestedIn: checkIn, requestedOut: checkOut });
    return {
      ...d,
      status: 'Full day',
      checkIn,
      checkOut,
      officeTime: times.office ?? d.officeTime,
      overtime: times.overtime ?? d.overtime,
      workMode: r.workMode,
    };
  });
};
