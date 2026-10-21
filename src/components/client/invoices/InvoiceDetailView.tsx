import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CalendarClock,
  ChevronRight,
  FileArchive,
  FileDown,
  FilePlus2,
  Headset,
  Info,
  ReceiptText,
  UsersRound,
} from 'lucide-react';
import { MultiSelectDropdown } from '../../common/MultiSelectDropdown';
import { Card, FieldGrid } from '../staff/tabs/StaffTabParts';
import { StaffAvatar } from '../staff/ClientStaffParts';
import type { ClientStaffMember } from '../data/clientStaffData';
import { TimesheetRange, formatHm } from '../data/clientTimesheetsData';
import {
  ClientInvoice,
  InvoiceStaffLine,
  formatHours,
  formatInvoiceDate,
  formatInvoicePeriod,
  formatMoney,
  invoiceFileNames,
  invoicePeriodTitle,
} from '../data/clientInvoicesData';
import { InvoiceDetailSkeleton, InvoiceStatusPill } from './InvoiceParts';
import { useTimesheetNotice } from '../timesheets/TimesheetParts';

interface InvoiceDetailViewProps {
  invoice: ClientInvoice;
  memberOf: (id: string) => ClientStaffMember | undefined;
  tintOf: (id: string) => number;
  canDownload: boolean;
  onBack: () => void;
  /** Reports › Timesheets for one staff over the invoice period; hidden without Timesheets access */
  onOpenTimesheets?: (staffIds: string[], range: TimesheetRange) => void;
  onContactManager: () => void;
}

/** Desktop drawer loads employees by ajax ("Loading employee details...") */
const LOAD_MS = 450;

const SummaryRow: React.FC<{ label: string; value: string; strong?: boolean; hint?: string }> = ({ label, value, strong, hint }) => (
  <div className={`flex items-baseline justify-between gap-3 ${strong ? 'pt-2.5 mt-1 border-t border-dashed border-slate-200' : ''}`}>
    <dt className={strong ? 'text-[13px] font-bold text-[#1E293B]' : 'text-[12px] text-slate-500'}>
      {label}
      {hint && <span className="block text-[10.5px] font-medium text-slate-400">{hint}</span>}
    </dt>
    <dd className={`tabular-nums whitespace-nowrap ${strong ? 'text-[16px] font-extrabold text-[#1E293B]' : 'text-[12.5px] font-bold text-slate-700'}`}>{value}</dd>
  </div>
);

/** MyCPE ONE "Invoice Details" drawer (Invoice Number, Generated On, Period, staff table, Subtotal / Gateway Charges / Total Charges) */
export const InvoiceDetailView: React.FC<InvoiceDetailViewProps> = ({
  invoice,
  memberOf,
  tintOf,
  canDownload,
  onBack,
  onOpenTimesheets,
  onContactManager,
}) => {
  const [loading, setLoading] = useState(true);
  const [staffFilter, setStaffFilter] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, showNotice] = useTimesheetNotice();

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), LOAD_MS);
    return () => clearTimeout(t);
  }, []);

  const isManual = invoice.type === 'manual';
  const lines = invoice.lines;
  const shownLines = staffFilter.length ? lines.filter((l) => staffFilter.includes(l.staffId)) : lines;
  const logged = lines.reduce((s, l) => s + l.loggedSeconds, 0);
  const billed = lines.reduce((s, l) => s + l.billedSeconds, 0);
  const notBilled = Math.max(0, logged - billed);
  const shownAmount = shownLines.reduce((s, l) => s + l.amount, 0);
  const range: TimesheetRange | null = invoice.period.to ? { from: invoice.period.from, to: invoice.period.to } : null;

  const staffOptions = useMemo(
    () => lines.map((l) => ({ value: l.staffId, label: memberOf(l.staffId)?.name ?? '-' })),
    [lines, memberOf],
  );

  // Prototype download: short spinner, then the success banner (desktop opens the file in a new tab)
  const download = (key: string, fileName: string) => {
    setBusy(key);
    setTimeout(() => {
      setBusy(null);
      showNotice(`${fileName} downloaded`);
    }, 700);
  };

  const lineRow = (l: InvoiceStaffLine) => {
    const m = memberOf(l.staffId);
    const name = m?.name ?? '-';
    const notCharged = l.loggedSeconds - l.billedSeconds;
    const canOpenHours = Boolean(onOpenTimesheets && range);
    return (
      <li key={l.staffId} className="p-3.5">
        <div className="flex items-start gap-3">
          <StaffAvatar name={name} tint={tintOf(l.staffId)} />
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[13px] font-bold text-[#1E293B] truncate">{name}</span>
              <span className="text-[13px] font-extrabold text-[#1E293B] tabular-nums whitespace-nowrap">{formatMoney(l.amount)}</span>
            </div>
            <div className="mt-0.5 flex items-center justify-between gap-2 text-[11px] text-slate-500">
              <span className="truncate">{m?.designation}</span>
              <span className="whitespace-nowrap tabular-nums">{formatMoney(l.rate)}/hr</span>
            </div>
            <div className="mt-2.5 flex items-stretch gap-2">
              <div className="flex-1 min-w-0 grid grid-cols-2 rounded-xl bg-slate-50 border border-slate-100 divide-x divide-slate-100 overflow-hidden">
                {/* Timesheet Hours opens that staff's daily hours for the invoice period */}
                <button
                  type="button"
                  onClick={() => canOpenHours && range && onOpenTimesheets?.([l.staffId], range)}
                  disabled={!canOpenHours}
                  aria-label={`Timesheet hours ${formatHm(l.loggedSeconds)}${canOpenHours ? '. View daily hours' : ''}`}
                  className="px-2.5 py-1.5 min-w-0 text-left active:bg-slate-100 disabled:active:bg-transparent cursor-pointer disabled:cursor-default"
                >
                  <span className="flex items-center gap-0.5 text-[11px] font-semibold text-slate-400">
                    Timesheet Hrs
                    {canOpenHours && <ChevronRight className="w-3 h-3 text-[#2F68FE]" />}
                  </span>
                  <span className={`block text-[12.5px] font-bold tabular-nums ${canOpenHours ? 'text-[#2F68FE]' : 'text-[#1E293B]'}`}>
                    {formatHm(l.loggedSeconds)}
                  </span>
                </button>
                <div className="px-2.5 py-1.5 min-w-0">
                  <span className="block text-[11px] font-semibold text-slate-400">Invoice Hrs</span>
                  <span className="flex items-baseline gap-1 text-[12.5px] font-bold text-[#1E293B] tabular-nums">
                    {formatHm(l.billedSeconds)}
                    {notCharged > 0 && <span className="text-[10px] font-semibold text-slate-400">-{formatHm(notCharged)}</span>}
                  </span>
                </div>
              </div>
              {canDownload && l.hasTimesheetPdf && (
                <button
                  type="button"
                  onClick={() => download(`ts-${l.staffId}`, invoiceFileNames.timesheetPdf(invoice, name))}
                  disabled={busy !== null}
                  aria-label={`Download ${name}'s timesheet PDF`}
                  title="Timesheet PDF"
                  className="w-11 rounded-xl border border-slate-200 bg-white text-[#2F68FE] flex flex-col items-center justify-center gap-0.5 active:bg-slate-50 disabled:opacity-60 shrink-0 cursor-pointer"
                >
                  <FileDown className={`w-4 h-4 ${busy === `ts-${l.staffId}` ? 'animate-pulse' : ''}`} />
                  <span className="text-[8.5px] font-bold text-slate-500">PDF</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </li>
    );
  };

  return (
    <div className="relative flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none animate-in fade-in slide-in-from-right-4 duration-200">
      <header className="shrink-0 bg-white h-14 px-4 flex items-center border-b border-[#EBF0F7] relative">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to Invoices"
          className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-[#1E293B] active:bg-slate-100 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-bold screen-title">Invoice Details</h1>
      </header>
      {notice}

      {loading ? (
        <InvoiceDetailSkeleton />
      ) : (
        <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
          <div className="px-4 pt-3">
            {/* Invoice summary */}
            <Card className="p-4">
              <div className="flex items-start gap-3">
                <span
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    isManual ? 'bg-[#EEF2FF] text-[#4F46E5]' : 'bg-[#EFF6FF] text-[#2F68FE]'
                  }`}
                >
                  {isManual ? <FilePlus2 className="w-5 h-5" /> : <ReceiptText className="w-5 h-5" />}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-extrabold text-[#1E293B] tabular-nums truncate">{invoice.invoiceNo}</p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {isManual ? 'Manual invoice' : `Timesheet invoice · ${invoicePeriodTitle(invoice)}`}
                  </p>
                </div>
                <InvoiceStatusPill status={invoice.status} />
              </div>

              <p className="mt-4 text-[11px] font-semibold text-slate-500">Total Charges</p>
              <p className="mt-0.5 text-[28px] leading-none font-extrabold tabular-nums text-[#1E293B]">{formatMoney(invoice.total)}</p>

              <FieldGrid
                compact
                fields={[
                  { label: 'Generated On', value: formatInvoiceDate(invoice.createdOn) },
                  { label: isManual ? 'Invoice Date' : 'Staff', value: isManual ? formatInvoiceDate(invoice.period.from) : `${lines.length} staff` },
                  ...(isManual ? [] : [{ label: 'Period', value: formatInvoicePeriod(invoice), wide: true }]),
                ]}
              />

              {canDownload && (
                <div className={`mt-4 grid gap-2.5 ${isManual ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  <button
                    type="button"
                    onClick={() => download('pdf', invoiceFileNames.pdf(invoice))}
                    disabled={busy !== null || !invoice.hasPdf}
                    className="h-11 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-1.5 active:bg-[#1D4ED8] disabled:opacity-60 cursor-pointer"
                  >
                    <FileDown className={`w-4 h-4 ${busy === 'pdf' ? 'animate-pulse' : ''}`} />
                    {busy === 'pdf' ? 'Downloading…' : 'Invoice PDF'}
                  </button>
                  {!isManual && (
                    <button
                      type="button"
                      onClick={() => download('zip', invoiceFileNames.timesheetZip(invoice))}
                      disabled={busy !== null}
                      className="h-11 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] text-[#2F68FE] text-xs font-bold flex items-center justify-center gap-1.5 active:bg-blue-100 disabled:opacity-60 cursor-pointer"
                    >
                      <FileArchive className={`w-4 h-4 ${busy === 'zip' ? 'animate-pulse' : ''}`} />
                      {busy === 'zip' ? 'Preparing…' : 'All Timesheets'}
                    </button>
                  )}
                </div>
              )}
            </Card>

            {invoice.status !== 'Paid' && (
              <p
                className={`mt-3 flex items-start gap-2 px-3 py-2.5 rounded-xl border text-[11.5px] font-medium leading-snug ${
                  invoice.status === 'Unpaid'
                    ? 'bg-[#FEF8E7] border-[#FDE68A] text-amber-800'
                    : 'bg-[#EEF2FF] border-[#C7D2FE] text-[#3730A3]'
                }`}
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
                {invoice.status === 'Unpaid'
                  ? 'This invoice is awaiting payment.'
                  : 'Part of this invoice has been paid; the rest is awaiting payment.'}
              </p>
            )}

            {isManual ? (
              <>
                {invoice.note && (
                  <Card className="mt-3 p-4">
                    <h3 className="text-sm font-bold text-[#1D4ED8]">Description</h3>
                    <p className="mt-1.5 text-[13px] text-[#1E293B] leading-snug">{invoice.note}</p>
                  </Card>
                )}
                <p className="mt-3 flex items-start gap-2 px-3 py-2.5 rounded-xl bg-white border border-[#EBF0F7] text-[11.5px] text-slate-500 leading-snug">
                  <Info className="w-4 h-4 shrink-0 mt-px text-slate-400" />
                  One-off charge — no staff timesheets are attached to this invoice.
                </p>
              </>
            ) : (
              <>
                {/* Logged vs charged hours (desktop Timesheet Hours / Invoice Hours, totals = Added by designer) */}
                <Card className="mt-3 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-[#1E293B] flex items-center gap-1.5">
                      <CalendarClock className="w-4 h-4 text-[#2F68FE]" />
                      Hours
                    </h3>
                    <span className="text-[11px] text-slate-500 tabular-nums">{formatHours(billed)} charged</span>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <dt className="text-[10.5px] text-slate-400">Timesheet Hours</dt>
                      <dd className="text-[17px] font-extrabold tabular-nums text-[#1E293B]">{formatHm(logged)}</dd>
                    </div>
                    <div>
                      <dt className="text-[10.5px] text-slate-400">Invoice Hours</dt>
                      <dd className="text-[17px] font-extrabold tabular-nums text-[#2F68FE]">{formatHm(billed)}</dd>
                    </div>
                  </dl>
                  <span className="mt-2.5 flex h-1.5 rounded-full bg-slate-100 overflow-hidden" aria-hidden="true">
                    <span className="h-full bg-[#2F68FE]" style={{ width: `${logged ? (billed / logged) * 100 : 0}%` }} />
                    {notBilled > 0 && <span className="h-full bg-[#F59E0B] border-l border-white" style={{ width: `${(notBilled / logged) * 100}%` }} />}
                  </span>
                  <p className="mt-2 text-[10.5px] text-slate-500">
                    {notBilled > 0 ? (
                      <>
                        <span className="font-bold text-[#D97706] tabular-nums">{formatHm(notBilled)}</span> hrs logged above daily available hours were not charged.
                      </>
                    ) : (
                      'Every logged hour was charged.'
                    )}
                  </p>
                </Card>

                {/* Staff on the invoice */}
                <div className="mt-5 px-1 flex items-center justify-between gap-2">
                  <h3 className="text-base font-extrabold text-[#1E293B] flex items-center gap-1.5">
                    <UsersRound className="w-4 h-4 text-slate-400" />
                    Staff
                    <span className="text-[12px] font-bold text-slate-400 tabular-nums">({lines.length})</span>
                  </h3>
                  {staffFilter.length > 0 && (
                    <span className="text-[11px] text-slate-500 tabular-nums">
                      Showing {shownLines.length} of {lines.length}
                    </span>
                  )}
                </div>
                {lines.length > 3 && (
                  <div className="mt-2">
                    <MultiSelectDropdown
                      label="Filter by staff"
                      placeholder="All staff"
                      options={staffOptions}
                      selected={staffFilter}
                      onChange={setStaffFilter}
                      searchable
                    />
                  </div>
                )}
                <Card className="mt-2.5 overflow-hidden">
                  <ul className="divide-y divide-slate-100">{shownLines.map(lineRow)}</ul>
                </Card>
              </>
            )}

            {/* Desktop summary: Subtotal / Gateway Charges / Total Charges */}
            <Card className="mt-3 p-4">
              <dl className="space-y-2">
                {staffFilter.length > 0 && (
                  <SummaryRow
                    label={`Selected staff (${shownLines.length})`}
                    hint="Before gateway charges"
                    value={formatMoney(shownAmount)}
                  />
                )}
                <SummaryRow label="Subtotal" value={formatMoney(invoice.subtotal)} />
                <SummaryRow label="Gateway Charges" value={formatMoney(invoice.gatewayCharges)} />
                <SummaryRow label="Total Charges" value={formatMoney(invoice.total)} strong />
              </dl>
            </Card>

            <button
              type="button"
              onClick={onContactManager}
              className="mt-3 w-full p-3.5 rounded-2xl bg-white border border-[#DCE3ED] shadow-[0_2px_10px_-2px_rgba(15,23,42,0.10)] flex items-center gap-3 text-left active:bg-slate-50 cursor-pointer"
            >
              <span className="w-10 h-10 rounded-xl bg-[#E8F8F0] text-[#10B981] flex items-center justify-center shrink-0">
                <Headset className="w-5 h-5" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[13px] font-bold text-[#1E293B]">Questions about this invoice?</span>
                <span className="block text-[11px] text-slate-500">Contact your Account Manager</span>
              </span>
              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
