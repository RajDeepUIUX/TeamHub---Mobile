import { WFORecord } from '../types/wfo';

/** The reporting manager who approves WFO days */
export const WFO_MANAGER = 'Naveen Das';

type Owner = Pick<WFORecord, 'staffName' | 'staffCode'>;
const JOHN: Owner = { staffName: 'John Smith', staffCode: 'A03780' };
const NAVEEN: Owner = { staffName: 'Naveen Das', staffCode: 'A01120' };
const ANANYA: Owner = { staffName: 'Ananya Kulkarni', staffCode: 'A03515' };
const KUNAL: Owner = { staffName: 'Kunal Desai', staffCode: 'A02988' };
const NIDHI: Owner = { staffName: 'Nidhi Purohit', staffCode: 'A03211' };

/** Team members whose WFO days the manager reviews */
export const WFO_TEAM = [JOHN, ANANYA, KUNAL, NIDHI].map((o) => o.staffName);

const wfo = (owner: Owner, month: string, days: number, status: WFORecord['status'], submittedAt: string, extra: Partial<WFORecord> = {}): WFORecord => ({
  id: `wfo-${owner.staffCode}-${month.slice(0, 3).toLowerCase()}-2026`,
  month,
  year: 2026,
  monthYear: `${month} 2026`,
  days,
  status,
  submittedAt,
  ...owner,
  ...extra,
});

export const INITIAL_WFO_RECORDS: WFORecord[] = [
  {
    ...JOHN,
    id: 'wfo-2026-09',
    month: 'September',
    year: 2026,
    monthYear: 'September 2026',
    days: 20,
    status: 'Pending',
    submittedAt: 'Sep 01, 2026',
  },
  {
    ...JOHN,
    id: 'wfo-2026-08',
    month: 'August',
    year: 2026,
    monthYear: 'August 2026',
    days: 22,
    status: 'Approved',
    submittedAt: 'Aug 01, 2026',
    review: { by: 'Naveen Das', comment: '', on: '2026-08-03' },
  },
  {
    ...JOHN,
    id: 'wfo-2026-07',
    month: 'July',
    year: 2026,
    monthYear: 'July 2026',
    days: 18,
    status: 'Approved',
    submittedAt: 'Jul 01, 2026',
  },
  {
    ...JOHN,
    id: 'wfo-2026-06',
    month: 'June',
    year: 2026,
    monthYear: 'June 2026',
    days: 22,
    status: 'Approved',
    submittedAt: 'Jun 01, 2026',
  },
];

/** The rest of Naveen's team, plus his own requests (John's come from INITIAL_WFO_RECORDS) */
export const TEAM_WFO_RECORDS_SEED: WFORecord[] = [
  wfo(ANANYA, 'September', 21, 'Pending', 'Sep 02, 2026'),
  wfo(KUNAL, 'September', 19, 'Pending', 'Sep 03, 2026'),
  wfo(NIDHI, 'September', 16, 'Pending', 'Sep 05, 2026'),
  wfo(ANANYA, 'August', 22, 'Approved', 'Aug 01, 2026', { review: { by: 'Naveen Das', comment: '', on: '2026-08-03' } }),
  wfo(KUNAL, 'August', 23, 'Rejected', 'Aug 02, 2026', {
    review: { by: 'Naveen Das', comment: 'August had 21 working days. Please resubmit with the right count.', on: '2026-08-04' },
  }),
  wfo(KUNAL, 'July', 20, 'Approved', 'Jul 01, 2026', { review: { by: 'Naveen Das', comment: '', on: '2026-07-02' } }),
  wfo(NIDHI, 'August', 18, 'Approved', 'Aug 01, 2026', { review: { by: 'Naveen Das', comment: 'Thanks, Nidhi.', on: '2026-08-03' } }),
  // Naveen's own ("My WFO Days" in the Manager role)
  wfo(NAVEEN, 'September', 20, 'Pending', 'Sep 01, 2026'),
  wfo(NAVEEN, 'August', 21, 'Approved', 'Aug 01, 2026', { review: { by: 'Priya Nair', comment: '', on: '2026-08-02' } }),
];

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const YEAR_OPTIONS = [2026, 2025, 2024];

/** Allowance paid to staff for each approved Work-From-Office day (INR) */
export const WFO_DAILY_ALLOWANCE = 90;

export const formatINR = (amount: number) =>
  `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export const wfoAllowanceFor = (days: number) => days * WFO_DAILY_ALLOWANCE;

/** Only staff at this branch receive the WFO allowance */
export const WFO_ALLOWANCE_BRANCH = 'Ahmedabad – Gota Branch';
