/**
 * Mock data for Reports → Timesheets (desktop `projects&task=report`, `timesheet_list`, `get_timesheet_details_data`).
 * Desktop list = one row per day per staff (`GROUP BY input_date, project_id`, reportable entries only):
 * Date, Staff Name, Available Hours (non-MOS clients), Working Hours. View = that day's entries.
 * All clients, descriptions and hours are dummy data.
 */
import type { ClientStaffMember } from './clientStaffData';

export interface TimesheetEntry {
  id: string;
  /** 24h "HH:MM"; an end before the start runs past midnight (desktop adds a day) */
  start: string;
  end: string;
  /** Client of the client (`tblclients_of_client`); null = internal work, desktop shows "-" */
  client: string | null;
  workType: string | null;
  description: string;
}

export interface TimesheetRow {
  id: string;
  staffId: string;
  /** ISO date (input_date) */
  date: string;
  workingSeconds: number;
  /** Desktop: weekly estimated hours / 5 */
  availableSeconds: number;
  entries: TimesheetEntry[];
}

export interface TimesheetRange {
  from: string;
  to: string;
}

/** Desktop hides "Available Hours" for MOS clients (`client_hub_role == 2`); Northwind CPA is not MOS */
export const CLIENT_IS_MOS = false;

/** Rows per page on the By Date view, staff per page on By Staff (desktop pages the table) */
export const TIMESHEET_PAGE_SIZE = 15;

/* ---------------------------------- Dates --------------------------------- */

const pad = (n: number) => String(n).padStart(2, '0');
export const isoOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseIso = (iso: string) => new Date(`${iso}T00:00:00`);
export const addDays = (iso: string, days: number) => {
  const d = parseIso(iso);
  d.setDate(d.getDate() + days);
  return isoOf(d);
};
export const daysBetween = (from: string, to: string) => Math.round((parseIso(to).getTime() - parseIso(from).getTime()) / 86_400_000) + 1;
export const datesInRange = ({ from, to }: TimesheetRange) =>
  Array.from({ length: Math.max(0, daysBetween(from, to)) }, (_, i) => addDays(from, i));

/** Desktop From-date limit: second-last Sunday (start of the last completed Sun–Sat week) */
export const latestTimesheetStart = (today = new Date()) => {
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  d.setDate(d.getDate() - (d.getDay() + 7));
  return isoOf(d);
};

/** Desktop default filter: last completed week, Sunday → Saturday */
export const defaultTimesheetRange = (today = new Date()): TimesheetRange => {
  const from = latestTimesheetStart(today);
  return { from, to: addDays(from, 6) };
};

export const sameRange = (a: TimesheetRange, b: TimesheetRange) => a.from === b.from && a.to === b.to;

/** "Oct 04 – Oct 10, 2026" (year once when both dates share it) */
export const formatTimesheetRange = ({ from, to }: TimesheetRange) => {
  const a = parseIso(from);
  const b = parseIso(to);
  const md = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
  return a.getFullYear() === b.getFullYear()
    ? `${md(a)} – ${md(b)}, ${b.getFullYear()}`
    : `${md(a)}, ${a.getFullYear()} – ${md(b)}, ${b.getFullYear()}`;
};

/** Desktop list date "Oct 05, 2026" */
export const formatTimesheetDate = (iso: string) =>
  parseIso(iso).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

/* ---------------------------------- Hours --------------------------------- */

const toMinutes = (hm: string) => {
  const [h, m] = hm.split(':').map(Number);
  return h * 60 + m;
};

/** Entry length; end earlier than start = ends the next day (desktop `get_timesheet_details_data`) */
export const entrySeconds = (e: TimesheetEntry) => {
  const diff = toMinutes(e.end) - toMinutes(e.start);
  return (diff < 0 ? diff + 24 * 60 : diff) * 60;
};

export const endsNextDay = (e: TimesheetEntry) => toMinutes(e.end) < toMinutes(e.start);

/** Desktop "HH:MM" (`TIME_FORMAT(SEC_TO_TIME())`); totals may pass 99 hours */
export const formatHm = (seconds: number) => {
  const mins = Math.round(seconds / 60);
  return `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;
};

/** "09:30 AM" */
export const formatClock = (hm: string) => {
  const [h, m] = hm.split(':').map(Number);
  return `${pad(h % 12 === 0 ? 12 : h % 12)}:${pad(m)} ${h < 12 ? 'AM' : 'PM'}`;
};

/* ------------------------------- Mock entries ------------------------------ */

const hash = (key: string) => {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619);
  // Final avalanche so keys that differ only in the last character still spread out
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

const CLIENTS = [
  'Acme Bakery LLC',
  'Blue Harbor Dental',
  'Cedar Ridge Farms',
  'Maple Street Realty',
  'Summit Auto Repair',
  'Willow Creek Café',
  'Pinecrest Logistics',
];

const WORK: { type: string; internal?: boolean; notes: string[] }[] = [
  {
    type: 'Tax Preparation',
    notes: [
      'Prepared 1040 draft with Schedule C and flagged two missing 1099-NEC forms.',
      'Updated Q3 estimated tax workpapers and listed open questions for the reviewer.',
      'Entered K-1 details and rolled forward depreciation schedules.',
    ],
  },
  {
    type: 'Bookkeeping',
    notes: [
      'Categorized September card transactions and posted accruals.',
      'Recorded vendor bills and matched payments in the ledger.',
      'Cleaned up uncategorized expenses and updated the chart of accounts.',
    ],
  },
  {
    type: 'Bank Reconciliation',
    notes: [
      'Reconciled operating account for September; cleared 14 outstanding items.',
      'Reconciled payroll account and noted one unmatched deposit for follow-up.',
    ],
  },
  {
    type: 'Payroll',
    notes: ['Processed bi-weekly payroll and reviewed overtime entries.', 'Prepared payroll tax liability report for the quarter.'],
  },
  {
    type: 'Review',
    notes: [
      'Reviewed 1120-S draft and left comments on officer compensation.',
      'Second-level review of sales tax returns before filing.',
    ],
  },
  {
    type: 'Audit Support',
    notes: ['Pulled supporting documents for fixed asset additions.', 'Prepared lead schedules for the year-end audit binder.'],
  },
  {
    type: 'Client Communication',
    notes: ['Weekly call with the client team on open items.', 'Emailed document request list and tracked responses.'],
  },
  { type: 'Internal Meeting', internal: true, notes: ['Team stand-up and task planning for the week.', 'Process review with the team lead.'] },
  { type: 'Training', internal: true, notes: ['Completed CPE module on lease accounting (ASC 842).', 'Software training on the new practice tool.'] },
];

/** Splits `total` minutes into `n` 15-minute-ish blocks */
const splitMinutes = (total: number, n: number, key: string) => {
  const weights = Array.from({ length: n }, (_, i) => 0.6 + hash(`${key}w${i}`));
  const sum = weights.reduce((a, b) => a + b, 0);
  const parts = weights.map((w) => Math.max(15, Math.round(((w / sum) * total) / 5) * 5));
  parts[n - 1] += total - parts.reduce((a, b) => a + b, 0);
  return parts;
};

const clockOf = (minutes: number) => {
  const m = ((minutes % 1440) + 1440) % 1440;
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
};

const buildEntries = (key: string, startMin: number, totalMin: number, n: number): TimesheetEntry[] => {
  const parts = splitMinutes(totalMin, n, key);
  let cursor = startMin;
  return parts.map((len, i) => {
    // 30 min lunch after the second block on full days
    if (i === 2 && totalMin > 300) cursor += 30;
    const work = WORK[Math.floor(hash(`${key}t${i}`) * WORK.length)];
    const entry: TimesheetEntry = {
      id: `${key}-e${i}`,
      start: clockOf(cursor),
      end: clockOf(cursor + len),
      client: work.internal ? null : CLIENTS[Math.floor(hash(`${key}c${i}`) * CLIENTS.length)],
      workType: work.type,
      description: work.notes[Math.floor(hash(`${key}n${i}`) * work.notes.length)],
    };
    cursor += len;
    return entry;
  });
};

/** One staff member's timesheet for a day, or null (weekend, leave, not employed yet / any more) */
const rowFor = (member: ClientStaffMember, date: string, todayKey: string): TimesheetRow | null => {
  if (date >= todayKey || date < member.joiningDate || (member.lastWorkingDay && date > member.lastWorkingDay)) return null;
  const key = `${member.id}_${date}`;
  const weekday = parseIso(date).getDay();
  const availableSeconds = Math.round((member.committedHours / 5) * 3600);
  let entries: TimesheetEntry[];
  if (weekday === 0) return null;
  if (weekday === 6) {
    // Occasional Saturday extra hours, evening shift that can run past midnight
    if (hash(`${key}sat`) > 0.12) return null;
    const total = 120 + Math.round((hash(`${key}len`) * 120) / 15) * 15;
    entries = buildEntries(key, 20 * 60 + Math.round(hash(`${key}st`) * 8) * 15, total, 2);
  } else {
    if (hash(`${key}off`) < 0.06) return null;
    const total = Math.max(240, availableSeconds / 60 + Math.round((hash(`${key}len`) * 150 - 95) / 5) * 5);
    const n = 2 + Math.floor(hash(`${key}n`) * 4);
    entries = buildEntries(key, 9 * 60 + Math.floor(hash(`${key}st`) * 5) * 15, total, n);
  }
  return {
    id: key,
    staffId: member.id,
    date,
    workingSeconds: entries.reduce((s, e) => s + entrySeconds(e), 0),
    availableSeconds,
    entries,
  };
};

/** Desktop list rows: date ASC, then staff A–Z */
export const timesheetRowsFor = (staff: ClientStaffMember[], range: TimesheetRange, today = new Date()): TimesheetRow[] => {
  const todayKey = isoOf(today);
  const byName = [...staff].sort((a, b) => a.name.localeCompare(b.name));
  return datesInRange(range).flatMap((date) =>
    byName.map((m) => rowFor(m, date, todayKey)).filter((r): r is TimesheetRow => r !== null),
  );
};

/* ----------------------------------- CSV ----------------------------------- */

const stamp = (d = new Date()) =>
  `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
const dmy = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return `${d}-${m}-${y}`;
};

/** Desktop file names (`/` in d/m/Y dates swapped for `-`) */
export const timesheetFileNames = {
  summary: () => `timesheet_report_${stamp()}.csv`,
  detailed: (range: TimesheetRange) => `${dmy(range.from)}-${dmy(range.to)}-Timesheet-Detailed-Report.csv`,
  day: () => `report_${stamp()}.csv`,
};

const csvCell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
const csv = (rows: string[][]) => rows.map((r) => r.map(csvCell).join(',')).join('\r\n');

/** "Download report as CSV": Date, Staff Name, [Available Hours (Hrs)], Working Hours (Hrs) */
export const timesheetSummaryCsv = (rows: TimesheetRow[], nameOf: (id: string) => string, showAvailable: boolean) =>
  csv([
    ['Date', 'Staff Name', ...(showAvailable ? ['Available Hours (Hrs)'] : []), 'Working Hours (Hrs)'],
    ...rows.map((r) => [
      formatTimesheetDate(r.date),
      nameOf(r.staffId),
      ...(showAvailable ? [formatHm(r.availableSeconds)] : []),
      formatHm(r.workingSeconds),
    ]),
  ]);

/** "Download detailed report as CSV": every entry */
export const timesheetDetailedCsv = (rows: TimesheetRow[], nameOf: (id: string) => string) =>
  csv([
    ['Date', 'Staff Name', 'Client', 'Type of Work', 'Total Time', 'Description'],
    ...rows.flatMap((r) =>
      r.entries.map((e) => [
        formatTimesheetDate(r.date),
        nameOf(r.staffId),
        e.client ?? '-',
        e.workType ?? '-',
        `${formatHm(entrySeconds(e))} Hrs`,
        e.description || '-',
      ]),
    ),
  ]);

/** Row download icon / View modal (desktop `exportTimesheetDetailsData`) */
export const timesheetDayCsv = (row: TimesheetRow) =>
  csv([
    ['Date', 'Client', 'Type of Work', 'Total Time', 'Description'],
    ...row.entries.map((e) => [
      formatTimesheetDate(row.date),
      e.client ?? '-',
      e.workType ?? '-',
      `${formatHm(entrySeconds(e))} Hrs`,
      e.description || '-',
    ]),
  ]);

/** Saves a CSV in the browser (the prototype's stand-in for the desktop download) */
export const downloadCsv = (fileName: string, content: string) => {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
