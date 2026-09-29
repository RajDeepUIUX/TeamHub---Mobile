export type LeaveType = 'PTO' | 'OT' | 'Additional Leave' | 'Sick Leave';

export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';

export type LeaveDurationType = 'Full Day' | '2 Hours' | '4 Hours' | '6 Hours';

export interface LeaveDayItem {
  date: string;
  dayOfWeek: string;
  duration: LeaveDurationType;
}

export interface LeaveRequest {
  id: string;
  /** Who applied (shown in the manager's team view) */
  staffName?: string;
  staffCode?: string;
  type: LeaveType;
  dateRange: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  description?: string;
  managerName: string;
  managerRole: string;
  appliedOn: string;
  status: LeaveStatus;
  dayItems?: LeaveDayItem[];
  attachmentName?: string;
  /** Reporting manager's note on approval / reason on rejection */
  managerComment?: string;
  reviewedAt?: string; // e.g. "Sep 29, 2026"
}

export interface LeaveBalance {
  ptoAvailable: number;
  ptoTotal: number;
  otHours: number;
  additionalDays: number;
}
