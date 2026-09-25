export interface Holiday {
  id: string;
  date: string; // YYYY-MM-DD
  dayNumber: string; // "01", "14"
  dayOfWeek: string; // "Thu", "Wed"
  monthName: string; // "January", "August"
  monthYear: string; // "JANUARY 2026"
  year: number; // 2026
  name: string; // "New Year"
}

export const HOLIDAYS_DATA: Holiday[] = [
  {
    id: 'hol-20251226',
    date: '2025-12-26',
    dayNumber: '26',
    dayOfWeek: 'Fri',
    monthName: 'December',
    monthYear: 'DECEMBER 2025',
    year: 2025,
    name: 'Boxing day',
  },
  {
    id: 'hol-20260101',
    date: '2026-01-01',
    dayNumber: '01',
    dayOfWeek: 'Thu',
    monthName: 'January',
    monthYear: 'JANUARY 2026',
    year: 2026,
    name: 'New Year',
  },
  {
    id: 'hol-20260114',
    date: '2026-01-14',
    dayNumber: '14',
    dayOfWeek: 'Wed',
    monthName: 'January',
    monthYear: 'JANUARY 2026',
    year: 2026,
    name: 'Makar Sankrati - Pongal',
  },
  {
    id: 'hol-20260115',
    date: '2026-01-15',
    dayNumber: '15',
    dayOfWeek: 'Thu',
    monthName: 'January',
    monthYear: 'JANUARY 2026',
    year: 2026,
    name: 'Makar Sankranti',
  },
  {
    id: 'hol-20260828',
    date: '2026-08-28',
    dayNumber: '28',
    dayOfWeek: 'Fri',
    monthName: 'August',
    monthYear: 'AUGUST 2026',
    year: 2026,
    name: 'Rakshabandhan',
  },
  {
    id: 'hol-20260904',
    date: '2026-09-04',
    dayNumber: '04',
    dayOfWeek: 'Fri',
    monthName: 'September',
    monthYear: 'SEPTEMBER 2026',
    year: 2026,
    name: 'Janmasthmi',
  },
  {
    id: 'hol-20261002',
    date: '2026-10-02',
    dayNumber: '02',
    dayOfWeek: 'Fri',
    monthName: 'October',
    monthYear: 'OCTOBER 2026',
    year: 2026,
    name: 'Mahatma Gandhi’s Birthday (Gandhi Jayanti)',
  },
  {
    id: 'hol-20261109',
    date: '2026-11-09',
    dayNumber: '09',
    dayOfWeek: 'Mon',
    monthName: 'November',
    monthYear: 'NOVEMBER 2026',
    year: 2026,
    name: 'New Year',
  },
  {
    id: 'hol-20261110',
    date: '2026-11-10',
    dayNumber: '10',
    dayOfWeek: 'Tue',
    monthName: 'November',
    monthYear: 'NOVEMBER 2026',
    year: 2026,
    name: 'Additional Diwali Leave',
  },
  {
    id: 'hol-20261111',
    date: '2026-11-11',
    dayNumber: '11',
    dayOfWeek: 'Wed',
    monthName: 'November',
    monthYear: 'NOVEMBER 2026',
    year: 2026,
    name: 'Bhai Duj',
  },
  {
    id: 'hol-20261225',
    date: '2026-12-25',
    dayNumber: '25',
    dayOfWeek: 'Fri',
    monthName: 'December',
    monthYear: 'DECEMBER 2026',
    year: 2026,
    name: 'Christmas Day',
  },
];
