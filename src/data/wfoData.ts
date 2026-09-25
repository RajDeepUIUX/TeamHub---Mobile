import { WFORecord } from '../types/wfo';

export const INITIAL_WFO_RECORDS: WFORecord[] = [
  {
    id: 'wfo-2026-09',
    month: 'September',
    year: 2026,
    monthYear: 'September 2026',
    days: 20,
    status: 'Pending',
    submittedAt: 'Sep 01, 2026',
  },
  {
    id: 'wfo-2026-08',
    month: 'August',
    year: 2026,
    monthYear: 'August 2026',
    days: 22,
    status: 'Approved',
    submittedAt: 'Aug 01, 2026',
  },
  {
    id: 'wfo-2026-07',
    month: 'July',
    year: 2026,
    monthYear: 'July 2026',
    days: 18,
    status: 'Approved',
    submittedAt: 'Jul 01, 2026',
  },
  {
    id: 'wfo-2026-06',
    month: 'June',
    year: 2026,
    monthYear: 'June 2026',
    days: 22,
    status: 'Approved',
    submittedAt: 'Jun 01, 2026',
  },
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
