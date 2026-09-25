import { LeaveRequest, LeaveBalance } from '../types/leaves';

export const INITIAL_LEAVE_BALANCE: LeaveBalance = {
  ptoAvailable: 16,
  ptoTotal: 18,
  otHours: 0,
  additionalDays: 0,
};

export const INITIAL_LEAVE_REQUESTS: LeaveRequest[] = [
  {
    id: 'leave-1',
    type: 'PTO',
    dateRange: 'Dec 20, 2026 – Dec 23, 2026',
    startDate: '2026-12-20',
    endDate: '2026-12-23',
    daysCount: 4,
    reason: 'Personal vacation',
    managerName: 'Sarah Miller',
    managerRole: 'Reporting Manager',
    appliedOn: 'Dec 10, 2026',
    status: 'Pending',
    dayItems: [
      { date: '20 Dec 2026', dayOfWeek: 'Sunday', duration: 'Full Day' },
      { date: '21 Dec 2026', dayOfWeek: 'Monday', duration: 'Full Day' },
      { date: '22 Dec 2026', dayOfWeek: 'Tuesday', duration: 'Full Day' },
      { date: '23 Dec 2026', dayOfWeek: 'Wednesday', duration: 'Full Day' },
    ],
  },
  {
    id: 'leave-2',
    type: 'PTO',
    dateRange: 'Dec 29, 2025',
    startDate: '2025-12-29',
    endDate: '2025-12-29',
    daysCount: 1,
    reason: 'Year end holiday',
    managerName: 'Michael Chen',
    managerRole: 'Reporting Manager',
    appliedOn: 'Dec 15, 2025',
    status: 'Approved',
    dayItems: [
      { date: '29 Dec 2025', dayOfWeek: 'Monday', duration: 'Full Day' },
    ],
  },
  {
    id: 'leave-3',
    type: 'Additional Leave',
    dateRange: 'Nov 10, 2025 – Nov 12, 2025',
    startDate: '2025-11-10',
    endDate: '2025-11-12',
    daysCount: 3,
    reason: 'Family commitment',
    managerName: 'Jennifer Walsh',
    managerRole: 'Reporting Manager',
    appliedOn: 'Nov 05, 2025',
    status: 'Rejected',
    dayItems: [
      { date: '10 Nov 2025', dayOfWeek: 'Monday', duration: 'Full Day' },
      { date: '11 Nov 2025', dayOfWeek: 'Tuesday', duration: 'Full Day' },
      { date: '12 Nov 2025', dayOfWeek: 'Wednesday', duration: 'Full Day' },
    ],
  },
];
