import React, { useEffect, useMemo, useState } from 'react';
import { FileArchive, FileDown } from 'lucide-react';
import { Card, FieldGrid, ScreenHeader } from '../staff/tabs/StaffTabParts';
import { StaffAvatar } from '../staff/ClientStaffParts';
import type { ClientStaffMember } from '../data/clientStaffData';
import { MultiSelectDropdown } from '../../common/MultiSelectDropdown';
import {
  ClientInvoice,
  InvoiceStaffLine,
  formatInvoiceDate,
  formatInvoicePeriod,
  formatMoney,
  invoiceAmountFor,
  invoiceFileNames,
} from '../data/clientInvoicesData';
import { InvoiceDetailSkeleton } from './InvoiceParts';
import { useTimesheetNotice } from '../timesheets/TimesheetParts';

interface InvoiceDetailViewProps {
  invoice: ClientInvoice;
  memberOf: (id: string) => ClientStaffMember | undefined;
  tintOf: (id: string) => number;
  canDownload: boolean;
  onBack: () => void;
}

/** Desktop drawer loads employees by ajax ("Loading employee details...") */
const LOAD_MS = 450;

const SummaryRow: React.FC<{ label: string; value: string; strong?: boolean }> = ({ label, value, strong }) => (
  <div className={`flex items-baseline justify-between gap-3 ${strong ? 'pt-2.5 mt-1 border-t border-slate-100' : ''}`}>
    <dt className={strong ? 'text-sm font-bold text-[#1E293B]' : 'text-xs font-medium text-slate-500'}>{label}</dt>
    <dd className={`tabular-nums whitespace-nowrap ${strong ? 'text-base font-extrabold text-[#1E293B]' : 'text-xs font-semibold text-[#1E293B]'}`}>{value}</dd>
  </div>
);

/** MyCPE ONE "Invoice Details" drawer — desktop fields only (Invoice Number, Generated On, Period, staff table, Subtotal / Gateway Charges / Total Charges) */
export const InvoiceDetailView: React.FC<InvoiceDetailViewProps> = ({
  invoice,
  memberOf,
  tintOf,
  canDownload,
  onBack,
}) => {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, showNotice] = useTimesheetNotice();

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), LOAD_MS);
    return () => clearTimeout(t);
  }, []);

  const isManual = invoice.type === 'manual';
  const lines = invoice.lines;
  // Desktop Staff multi-select: every staff on the invoice selected by default; rows and summary follow the selection
  const [staffIds, setStaffIds] = useState<string[]>(() => lines.map((l) => l.staffId));
  const staffOptions = useMemo(
    () => lines.map((l) => ({ value: l.staffId, label: memberOf(l.staffId)?.name ?? '-' })),
    [lines, memberOf],
  );
  const shownLines = lines.filter((l) => staffIds.includes(l.staffId));
  const allShown = shownLines.length === lines.length;
  const subtotal = allShown ? invoice.subtotal : shownLines.reduce((s, l) => s + l.amount, 0);
  const total = allShown ? invoice.total : staffIds.length ? invoiceAmountFor(invoice, staffIds) : 0;

  // Prototype download: short spinner, then the success banner (desktop opens the file in a new tab)
  const download = (key: string, fileName: string) => {
    setBusy(key);
    setTimeout(() => {
      setBusy(null);
      showNotice(`${fileName} downloaded`);
    }, 700);
  };

  const lineRow = (l: InvoiceStaffLine) => {
    const name = memberOf(l.staffId)?.name ?? '-';
    return (
      <li key={l.staffId} className="px-3.5 py-3 flex items-center gap-3">
        <StaffAvatar name={name} tint={tintOf(l.staffId)} />
        <div className="flex-1 min-w-0">
          <span className="block text-[13px] font-bold text-[#1E293B] truncate">{name}</span>
          <span className="block text-xs font-semibold text-slate-500 tabular-nums">{formatMoney(l.amount)}</span>
        </div>
        {canDownload && l.hasTimesheetPdf && (
          <button
            type="button"
            onClick={() => download(`ts-${l.staffId}`, invoiceFileNames.timesheetPdf(invoice, name))}
            disabled={busy !== null}
            aria-label={`Download ${name}'s timesheet PDF`}
            title="Timesheet PDF"
            className="w-11 h-11 rounded-xl border border-slate-200 bg-white shadow-2xs text-[#2F68FE] flex flex-col items-center justify-center gap-0.5 active:bg-slate-50 disabled:opacity-60 shrink-0 cursor-pointer"
          >
            <FileDown className={`w-4 h-4 ${busy === `ts-${l.staffId}` ? 'animate-pulse' : ''}`} />
            <span className="text-[10px] font-bold text-slate-500">PDF</span>
          </button>
        )}
      </li>
    );
  };

  return (
    <div className="relative flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none animate-in fade-in slide-in-from-right-4 duration-200">
      <ScreenHeader title="Invoice Details" onBack={onBack} backLabel="Back to Invoices" />
      {notice}

      {loading ? (
        <InvoiceDetailSkeleton />
      ) : (
        <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
          <div className="px-4 pt-3.5">
            {/* Desktop header: Invoice Number / Generated On / Period */}
            <Card className="p-4 pt-1">
              <FieldGrid
                compact
                fields={[
                  { label: 'Invoice Number', value: invoice.invoiceNo },
                  { label: 'Generated On', value: formatInvoiceDate(invoice.createdOn) },
                  { label: 'Period', value: formatInvoicePeriod(invoice), wide: true },
                ]}
              />
            </Card>

            {!isManual && (
              <>
                <div className="mt-3">
                  <MultiSelectDropdown
                    label="Staff"
                    placeholder="Nothing selected"
                    options={staffOptions}
                    selected={staffIds}
                    onChange={setStaffIds}
                    searchable
                  />
                </div>
                <Card className="mt-3 overflow-hidden">
                  {shownLines.length ? (
                    <ul className="divide-y divide-slate-100">{shownLines.map(lineRow)}</ul>
                  ) : (
                    <p className="p-6 text-center text-xs font-medium text-slate-400">No Data Found</p>
                  )}
                </Card>
              </>
            )}

            {/* Desktop summary: Subtotal / Gateway Charges / Total Charges */}
            <Card className="mt-3 p-4">
              <dl className="space-y-2">
                <SummaryRow label="Subtotal" value={formatMoney(subtotal)} />
                <SummaryRow label="Gateway Charges" value={formatMoney(total - subtotal)} />
                <SummaryRow label="Total Charges" value={formatMoney(total)} strong />
              </dl>
            </Card>

          </div>
        </div>
      )}

      {!loading && canDownload && (
        <div
          className={`shrink-0 grid gap-3 p-4 bg-white/95 backdrop-blur-md border-t border-[#EBF0F7] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20 ${
            isManual ? 'grid-cols-1' : 'grid-cols-2'
          }`}
        >
          {!isManual && (
            <button
              type="button"
              onClick={() => download('zip', invoiceFileNames.timesheetZip(invoice))}
              disabled={busy !== null}
              className="h-12 rounded-xl border border-[#2F68FE] bg-white text-[#2F68FE] text-xs font-bold flex items-center justify-center gap-1.5 active:bg-blue-50 disabled:opacity-60 transition-colors cursor-pointer"
            >
              <FileArchive className={`w-4 h-4 ${busy === 'zip' ? 'animate-pulse' : ''}`} />
              {busy === 'zip' ? 'Preparing…' : 'All Timesheets'}
            </button>
          )}
          <button
            type="button"
            onClick={() => download('pdf', invoiceFileNames.pdf(invoice))}
            disabled={busy !== null || !invoice.hasPdf}
            className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs active:bg-[#1D4ED8] disabled:opacity-60 transition-colors cursor-pointer"
          >
            <FileDown className={`w-4 h-4 ${busy === 'pdf' ? 'animate-pulse' : ''}`} />
            {busy === 'pdf' ? 'Downloading…' : 'Invoice PDF'}
          </button>
        </div>
      )}
    </div>
  );
};
