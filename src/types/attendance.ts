export type AttendanceStatus = 'full_day' | 'half_day' | 'absent' | 'weekly_off' | 'holiday';

export interface PunchRecord {
  id: string;
  time: string;
  type: 'IN' | 'OUT';
  location: string;
  source?: string;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  dateFormatted: string; // e.g. "Sep 22, 2026"
  dayOfWeek: string; // e.g. "Tuesday"
  staffName: string;
  workplace: string; // e.g. "Ahmedabad : Gota Office"
  workMode: 'Office' | 'Hybrid' | 'Remote';
  startTime: string; // e.g. "13:30"
  endTime: string; // e.g. "22:22"
  totalOfficeTime: string; // e.g. "08:52"
  totalWorkingTime: string; // e.g. "08:43"
  status: AttendanceStatus;
  statusLabel: string;
  reqOfficeHrs?: string; // e.g. "09:00"
  reqWorkHrs?: string; // e.g. "08:00"
  editRequested?: boolean;
  editReason?: string;
  editNote?: string;
  editRequestedAt?: string;
  leaveApplied?: boolean;
  leaveType?: string;
  punches: PunchRecord[];
}

export interface AttendanceKPIs {
  workingDays: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  holidays: number;
  lwpDays: number;
  deductionDays: number;
  totalDays: number;
  salaryDays: number;
}
