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
}

export interface LeaveBalance {
  ptoAvailable: number;
  ptoTotal: number;
  otHours: number;
  additionalDays: number;
}
