/**
 * Mock data for Invoices › Invoices.
 * Desktop `projects&task=invoice` now redirects to MyCPE ONE (my-team-profile-new?tab=invoice&service=hrms), which reads
 * the client panel through `get_invoice_list_for_mycpe_profile` / `get_invoice_employees_for_mycpe_profile` (Part F #2-#7).
 * Northwind CPA is billed as a consolidated (club) client: one invoice per billing period with every staff on it
 * (`show_employee_column`), staff lines carry Timesheet Hours + Invoice Hours, plus one-off manual invoices.
 * Hours come from the Timesheets mock so both modules agree. Rates, amounts and invoice numbers are dummy data.
 */
import { hourlyRateOf } from './clientStaffData';
import type { ClientStaffMember } from './clientStaffData';
import { TimesheetRange, addDays, formatTimesheetDate, isoOf, parseIso, timesheetRowsFor } from './clientTimesheetsData';

/** Desktop: timesheet invoices are Paid (4) / Unpaid (1); manual invoices also Partially Paid (2) */
export type InvoicePaymentStatus = 'Paid' | 'Unpaid' | 'Partially Paid';
export type InvoiceType = 'timesheet' | 'manual';

/** Payment Status filter: desktop "Unpaid" also matches partially paid manual invoices (`status IN (1,2)`) */
export type InvoiceStatusChip = 'All' | 'Unpaid' | 'Paid';
export const INVOICE_STATUS_CHIPS: InvoiceStatusChip[] = ['All', 'Unpaid', 'Paid'];

export interface InvoiceStaffLine {
  staffId: string;
  /** Timesheet Hours (logged) */
  loggedSeconds: number;
  /** Invoice Hours (charged) */
  billedSeconds: number;
  /** USD per hour */
  rate: number;
  amount: number;
  /** Desktop "Timesheet PDF" per staff */
  hasTimesheetPdf: boolean;
}

export interface ClientInvoice {
  id: string;
  invoiceNo: string;
  type: InvoiceType;
  /** Invoice Created On (ISO) */
  createdOn: string;
  /** Timesheet invoices cover a period; manual invoices show one date */
  period: { from: string; to: string | null };
  status: InvoicePaymentStatus;
  /** Empty for manual invoices (no staff breakdown on desktop) */
  lines: InvoiceStaffLine[];
  subtotal: number;
  gatewayCharges: number;
  total: number;
  hasPdf: boolean;
  /** Manual invoice reason (Added by designer — desktop list shows no description) */
  note?: string;
}

/** Desktop pages the table (10 / 25 / 50 / 100); mobile loads 10 at a time */
export const INVOICE_PAGE_SIZE = 10;
export const INVOICE_CURRENCY = '$';

/** Dummy card processing fee on timesheet invoices */
const GATEWAY_RATE = 0.01;

const round2 = (n: number) => Math.round(n * 100) / 100;
const pad = (n: number) => String(n).padStart(2, '0');

/* ------------------------------- Formatting ------------------------------- */

export const formatMoney = (amount: number) =>
  `${INVOICE_CURRENCY}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Desktop "Oct 03, 2026" */
export const formatInvoiceDate = formatTimesheetDate;

/** Desktop period: "Sep 01, 2026 - Sep 30, 2026" (manual = one date) */
export const formatInvoicePeriod = (inv: ClientInvoice) =>
  inv.period.to ? `${formatInvoiceDate(inv.period.from)} - ${formatInvoiceDate(inv.period.to)}` : formatInvoiceDate(inv.period.from);

/** Short card label: "September 2026" for a full month */
export const invoicePeriodTitle = (inv: ClientInvoice) => {
  if (!inv.period.to) return 'One-off charge';
  const a = parseIso(inv.period.from);
  const b = parseIso(inv.period.to);
  const fullMonth = a.getDate() === 1 && addDays(inv.period.to, 1).slice(8) === '01' && a.getMonth() === b.getMonth();
  return fullMonth
    ? a.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : `${a.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })} – ${b.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}`;
};

/** Invoice Hours as decimal hours for the summary ("2,960.5 hrs") */
export const formatHours = (seconds: number) =>
  `${(seconds / 3600).toLocaleString('en-US', { maximumFractionDigits: 1 })} hrs`;

export const isOpenInvoice = (inv: ClientInvoice) => inv.status !== 'Paid';
export const inStatusChip = (chip: InvoiceStatusChip, inv: ClientInvoice) =>
  chip === 'All' || (chip === 'Paid' ? inv.status === 'Paid' : isOpenInvoice(inv));

/** Desktop staff filter keeps invoices with those staff and sums only their rows (`project_id IN (...)`) */
export const invoiceAmountFor = (inv: ClientInvoice, staffIds: string[]) => {
  if (!staffIds.length) return inv.total;
  const sub = inv.lines.filter((l) => staffIds.includes(l.staffId)).reduce((s, l) => s + l.amount, 0);
  return round2(sub + (inv.subtotal > 0 ? (sub / inv.subtotal) * inv.gatewayCharges : 0));
};

/* --------------------------------- Seeds --------------------------------- */

/** Desktop billing cycle: 26th of one month to the 25th of the next ("Aug 26, 2026 - Sep 25, 2026") */
const cycleRange = (year: number, month: number): TimesheetRange => ({
  from: isoOf(new Date(year, month, 26)),
  to: isoOf(new Date(year, month + 1, 25)),
});

/**
 * Billing rule (assumed): hours up to the daily available hours are charged; staff with additional availability
 * are also charged for their extra hours.
 */
const linesFor = (staff: ClientStaffMember[], range: TimesheetRange, today: Date): InvoiceStaffLine[] => {
  const rows = timesheetRowsFor(staff, range, today);
  return [...staff]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((m) => {
      const own = rows.filter((r) => r.staffId === m.id);
      if (!own.length) return null;
      const logged = own.reduce((s, r) => s + r.workingSeconds, 0);
      const billed = own.reduce(
        (s, r) => s + (m.additionalAvailability ? r.workingSeconds : Math.min(r.workingSeconds, r.availableSeconds)),
        0,
      );
      const rate = hourlyRateOf(m);
      return {
        staffId: m.id,
        loggedSeconds: logged,
        billedSeconds: billed,
        rate,
        amount: round2((billed / 3600) * rate),
        hasTimesheetPdf: true,
      };
    })
    .filter((l): l is InvoiceStaffLine => l !== null);
};

const MANUAL_SEED: { daysAgo: number; seq: number; amount: number; status: InvoicePaymentStatus; note: string }[] = [
  { daysAgo: 5, seq: 2418, amount: 18.64, status: 'Unpaid', note: 'Additional software license' },
  { daysAgo: 38, seq: 2291, amount: 245.5, status: 'Partially Paid', note: 'Onboarding & system setup for 2 new staff' },
  { daysAgo: 56, seq: 2264, amount: 12.36, status: 'Paid', note: 'Payment gateway adjustment' },
  { daysAgo: 172, seq: 1873, amount: 1240, status: 'Paid', note: 'Tax season overtime adjustment' },
];

/** Desktop invoice numbers: timesheet "E2608005986", manual "M2608-002376" (YY + MM, dummy sequence) */
const yymm = (iso: string) => `${iso.slice(2, 4)}${iso.slice(5, 7)}`;

let cache: { key: string; invoices: ClientInvoice[] } | null = null;

/** Last 12 timesheet invoices (26th–25th cycle, created on the 6th after the cycle ends) + manual invoices, newest first */
export const clientInvoicesFor = (staff: ClientStaffMember[], today = new Date()): ClientInvoice[] => {
  const key = `${isoOf(today)}-${staff.length}`;
  if (cache?.key === key) return cache.invoices;

  const todayKey = isoOf(today);
  const timesheet: ClientInvoice[] = [];
  for (let i = 1; i <= 13 && timesheet.length < 12; i++) {
    const start = new Date(today.getFullYear(), today.getMonth() - i - 1, 1);
    const range = cycleRange(start.getFullYear(), start.getMonth());
    const createdOn = isoOf(new Date(start.getFullYear(), start.getMonth() + 2, 6));
    if (createdOn > todayKey) continue;
    const lines = linesFor(staff, range, today);
    if (!lines.length) continue;
    const subtotal = round2(lines.reduce((s, l) => s + l.amount, 0));
    const gatewayCharges = round2(subtotal * GATEWAY_RATE);
    timesheet.push({
      id: `inv-${range.from}`,
      // Stable per billing month (doesn't change as time passes)
      invoiceNo: `E${yymm(range.from)}00${4000 + ((start.getMonth() * 379 + start.getFullYear()) % 2000)}`,
      type: 'timesheet',
      createdOn,
      period: { from: range.from, to: range.to },
      status: timesheet.length === 0 ? 'Unpaid' : 'Paid',
      lines,
      subtotal,
      gatewayCharges,
      total: round2(subtotal + gatewayCharges),
      hasPdf: true,
    });
  }

  const manual: ClientInvoice[] = MANUAL_SEED.map((m) => {
    const date = addDays(todayKey, -m.daysAgo);
    return {
      id: `inv-m${m.seq}`,
      invoiceNo: `M${yymm(date)}-00${m.seq}`,
      type: 'manual',
      createdOn: date,
      period: { from: date, to: null },
      status: m.status,
      lines: [],
      subtotal: m.amount,
      gatewayCharges: 0,
      total: m.amount,
      hasPdf: true,
      note: m.note,
    };
  });

  const invoices = [...timesheet, ...manual].sort((a, b) => b.createdOn.localeCompare(a.createdOn));
  cache = { key, invoices };
  return invoices;
};

/** Default filter = no dates (desktop shows every invoice) */
export interface InvoiceDateRange {
  from: string | null;
  to: string | null;
}

/* ----------------------------------- Files ---------------------------------- */

const stamp = (d = new Date()) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;

export const invoiceFileNames = {
  /** MyCPE ONE `export_invoice_csv_for_mycpe_profile` */
  csv: (d = new Date()) => `invoice_${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.csv`,
  /** Client panel `export_invoice_pdf` */
  zip: () => `Invoices_${stamp()}.zip`,
  pdf: (inv: ClientInvoice) => `${inv.invoiceNo}.pdf`,
  timesheetZip: (inv: ClientInvoice) => `Timesheets_${inv.invoiceNo}.zip`,
  timesheetPdf: (inv: ClientInvoice, staffName: string) => `Timesheet_${inv.invoiceNo}_${staffName.replace(/\s+/g, '_')}.pdf`,
};

const csvCell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

/** Desktop CSV: Invoice No, Invoice Created On, Period, Employee, Amount, Payment Status */
export const invoiceListCsv = (invoices: ClientInvoice[], staffIds: string[]) =>
  [
    ['Invoice No', 'Invoice Created On', 'Period', 'Employee', 'Amount', 'Payment Status'],
    ...invoices.map((inv) => {
      const count = staffIds.length ? inv.lines.filter((l) => staffIds.includes(l.staffId)).length : inv.lines.length;
      return [
        inv.invoiceNo,
        `\t${formatInvoiceDate(inv.createdOn)}`,
        formatInvoicePeriod(inv),
        count ? String(count) : '-',
        `${INVOICE_CURRENCY}${invoiceAmountFor(inv, staffIds).toFixed(2)}`,
        inv.status,
      ];
    }),
  ]
    .map((r) => r.map(csvCell).join(','))
    .join('\r\n');
