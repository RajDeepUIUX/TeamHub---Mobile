import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Download, FileDown, FolderSearch, Loader2, ReceiptText, SearchX, X } from 'lucide-react';
import { FilterIconButton } from '../../common/TeamFilterSheet';
import { useClientPermission } from '../context/ClientPermissionContext';
import { ScreenHeader, Card, EmptyCard, SearchField } from '../staff/tabs/StaffTabParts';
import type { ClientStaffMember } from '../data/clientStaffData';
import { TimesheetRange, downloadCsv } from '../data/clientTimesheetsData';
import {
  ClientInvoice,
  INVOICE_PAGE_SIZE,
  clientInvoicesFor,
  formatInvoiceDate,
  formatInvoicePeriod,
  formatMoney,
  inStatusChip,
  invoiceAmountFor,
  invoiceFileNames,
  invoiceListCsv,
} from '../data/clientInvoicesData';
import { EMPTY_INVOICE_FILTERS, InvoiceFilterSheet, InvoiceFilters, invoiceFilterCount } from './InvoiceFilterSheet';
import { InvoiceExportSheet, InvoiceListSkeleton, InvoiceStatusPill } from './InvoiceParts';
import { InvoiceDetailView } from './InvoiceDetailView';
import { SubscriptionInvoices } from './SubscriptionInvoices';
import { useTimesheetNotice } from '../timesheets/TimesheetParts';

interface ClientInvoicesViewProps {
  staff: ClientStaffMember[];
  /** Notification deep link: opens this invoice's details */
  initialInvoiceNo?: string | null;
  /** Invoice staff row → Reports › Timesheets (staff + invoice period); hidden without Timesheets access */
  onOpenTimesheets?: (staffIds: string[], range: TimesheetRange) => void;
  onContactManager: () => void;
  /** Header back arrow (Dashboard) */
  onBack?: () => void;
}

/** Desktop shows a loader while the table reloads */
const LOAD_MS = 600;

/** Desktop invoice service tabs (`invoiceServices`); the Client panel redirect lands on `service=hrms` */
type InvoiceService = 'continuing-education' | 'hrms';
const INVOICE_SERVICES: { id: InvoiceService; label: string }[] = [
  { id: 'continuing-education', label: 'Continuing Education' },
  { id: 'hrms', label: 'HRMS 24 × 7 (Offshoring)' },
];

/** Desktop table column as a label / value pair */
const Field: React.FC<{ label: string; className?: string; children: React.ReactNode }> = ({ label, className = '', children }) => (
  <div className={`min-w-0 ${className}`}>
    <dt className="text-[10.5px] font-semibold text-slate-400">{label}</dt>
    <dd className="mt-0.5 text-[12.5px] text-[#1E293B] leading-snug break-words">{children}</dd>
  </div>
);

const chipCls =
  'shrink-0 h-7 pl-2.5 pr-1 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[11px] font-semibold text-[#1D4ED8] flex items-center gap-1';
const chipX = 'w-5 h-5 rounded-full flex items-center justify-center text-[#2F68FE] active:bg-blue-100 cursor-pointer';
const actionBtn =
  'h-9 px-3 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] text-[#2F68FE] text-[11.5px] font-bold flex items-center gap-1.5 active:bg-blue-100 disabled:opacity-60 disabled:cursor-wait shrink-0 cursor-pointer';

/**
 * Invoices › Invoices — MyCPE ONE HRMS invoice tab (desktop `projects&task=invoice` redirects there):
 * search by invoice no., From / To date, Staff, Payment Status; Export CSV / ZIP. Cards follow the desktop columns:
 * Invoice No., Invoice Created On, Period, Employee, Amount, Payment Status, Action (Invoice PDF, Employees → Invoice Details).
 */
export const ClientInvoicesView: React.FC<ClientInvoicesViewProps> = ({
  staff,
  initialInvoiceNo,
  onOpenTimesheets,
  onContactManager,
  onBack,
}) => {
  // `is_view` = Invoice Details; `is_download` = Export, Invoice PDF, timesheets
  const { view: canView, download: canDownload } = useClientPermission('invoices');

  const invoices = useMemo(() => clientInvoicesFor(staff), [staff]);
  const [openId, setOpenId] = useState<string | null>(
    () => (initialInvoiceNo && invoices.find((i) => i.invoiceNo === initialInvoiceNo)?.id) || null,
  );
  const [service, setService] = useState<InvoiceService>('hrms');
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<InvoiceFilters>(EMPTY_INVOICE_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [pages, setPages] = useState(1);
  const [moreLoading, setMoreLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, showNotice] = useTimesheetNotice();
  const listRef = useRef<HTMLDivElement>(null);
  const listScroll = useRef(0);

  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setLoading(false), LOAD_MS);
    return () => clearTimeout(t);
  }, [loading]);

  // Back from Invoice Details returns to the same place in the list
  useLayoutEffect(() => {
    if (!openId && listRef.current) listRef.current.scrollTop = listScroll.current;
  }, [openId]);

  const sortedStaff = useMemo(() => [...staff].sort((a, b) => a.name.localeCompare(b.name)), [staff]);
  const tintOf = (id: string) => sortedStaff.findIndex((s) => s.id === id);
  const memberOf = (id: string) => staff.find((s) => s.id === id);
  const nameOf = (id: string) => memberOf(id)?.name ?? '-';

  // Desktop filters: invoice no., created date range, staff (`project_ids`), payment status
  const { range, staffIds, status } = filters;
  const term = query.trim().toLowerCase();
  const results = invoices.filter((inv) => {
    if (term && !inv.invoiceNo.toLowerCase().includes(term)) return false;
    if (range.from && inv.createdOn < range.from) return false;
    if (range.to && inv.createdOn > range.to) return false;
    if (staffIds.length && !inv.lines.some((l) => staffIds.includes(l.staffId))) return false;
    return inStatusChip(status, inv);
  });
  const visible = results.slice(0, pages * INVOICE_PAGE_SIZE);

  const isHrms = service === 'hrms';
  const filterCount = invoiceFilterCount(filters);
  const isFiltered = filterCount > 0 || term.length > 0;

  const reload = () => {
    setPages(1);
    setLoading(true);
    listRef.current?.scrollTo({ top: 0 });
  };
  const applyFilters = (next: InvoiceFilters) => {
    setFilters(next);
    reload();
  };
  const clearAll = () => {
    setQuery('');
    applyFilters(EMPTY_INVOICE_FILTERS);
  };

  const download = (key: string, fileName: string) => {
    setBusy(key);
    setTimeout(() => {
      setBusy(null);
      showNotice(`${fileName} downloaded`);
    }, 700);
  };

  const openInvoice = (inv: ClientInvoice) => {
    if (!canView) return;
    listScroll.current = listRef.current?.scrollTop ?? 0;
    setOpenId(inv.id);
  };

  const rangeChip =
    range.from || range.to
      ? range.from && range.to
        ? `${formatInvoiceDate(range.from)} – ${formatInvoiceDate(range.to)}`
        : range.from
          ? `From ${formatInvoiceDate(range.from)}`
          : `To ${formatInvoiceDate(range.to as string)}`
      : null;

  const timesheetCount = results.reduce((s, i) => s + (staffIds.length ? i.lines.filter((l) => staffIds.includes(l.staffId)).length : i.lines.length), 0);
  const scopeLabel = `${results.length} ${results.length === 1 ? 'invoice' : 'invoices'}${isFiltered ? ' · current filters' : ''}`;

  /* ---------- Invoice Details ---------- */
  const current = openId ? invoices.find((i) => i.id === openId) : undefined;
  if (current) {
    return (
      <InvoiceDetailView
        invoice={current}
        memberOf={memberOf}
        tintOf={tintOf}
        canDownload={canDownload}
        onBack={() => setOpenId(null)}
        onOpenTimesheets={onOpenTimesheets}
        onContactManager={onContactManager}
      />
    );
  }

  const card = (inv: ClientInvoice) => {
    const isManual = inv.type === 'manual';
    const lineCount = staffIds.length ? inv.lines.filter((l) => staffIds.includes(l.staffId)).length : inv.lines.length;
    const showPdf = canDownload && inv.hasPdf;
    // Desktop folder icon (employees on the invoice) is only on timesheet invoices
    const showEmployees = canView && !isManual;
    return (
      <li key={inv.id}>
        <Card className="overflow-hidden">
          <dl className="p-3.5">
            <div className="flex items-start gap-3">
              <span className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2F68FE] flex items-center justify-center shrink-0" aria-hidden>
                <ReceiptText className="w-5 h-5" />
              </span>
              <div className="flex-1 min-w-0">
                <dt className="text-[10.5px] font-semibold text-slate-400">Invoice No.</dt>
                <dd className="mt-0.5 text-[13.5px] font-bold text-[#1E293B] tabular-nums truncate">{inv.invoiceNo}</dd>
              </div>
              <div className="min-w-0 text-right">
                <dt className="text-[10.5px] font-semibold text-slate-400">Amount</dt>
                <dd className="mt-0.5 text-[15px] font-bold text-[#1E293B] tabular-nums">{formatMoney(invoiceAmountFor(inv, staffIds))}</dd>
              </div>
            </div>

            <div className="mt-3 p-3 rounded-xl bg-[#F8FAFC] border border-slate-100 grid grid-cols-2 gap-x-4 gap-y-3">
            <Field label="Invoice Created On">
              <span className="tabular-nums">{formatInvoiceDate(inv.createdOn)}</span>
            </Field>
            <Field label="Period">
              <span className="tabular-nums">{formatInvoicePeriod(inv)}</span>
            </Field>
            <Field label="Employee">
              {isManual ? (
                '-'
              ) : (
                <span className="flex items-center gap-1.5">
                  <span className="min-w-[30px] h-6 px-2 rounded-full bg-[#2F68FE] text-white text-[11px] font-bold tabular-nums inline-flex items-center justify-center">
                    {lineCount}
                  </span>
                  {staffIds.length > 0 && <span className="text-[11px] text-slate-400 tabular-nums">of {inv.lines.length}</span>}
                </span>
              )}
            </Field>
            <Field label="Payment Status">
              <InvoiceStatusPill status={inv.status} />
            </Field>
            </div>
          </dl>

          {(showPdf || showEmployees) && (
            <div className="px-3.5 pb-3 pt-0.5 flex items-center justify-end gap-2">
              {showPdf && (
                <button
                  type="button"
                  onClick={() => download(`pdf-${inv.id}`, invoiceFileNames.pdf(inv))}
                  disabled={busy !== null}
                  aria-label={`Download invoice ${inv.invoiceNo}`}
                  className={actionBtn}
                >
                  {busy === `pdf-${inv.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                  Invoice
                </button>
              )}
              {showEmployees && (
                <button type="button" onClick={() => openInvoice(inv)} aria-label={`View employees on invoice ${inv.invoiceNo}`} className={actionBtn}>
                  <FolderSearch className="w-4 h-4" />
                  Employees
                </button>
              )}
            </div>
          )}
        </Card>
      </li>
    );
  };

  return (
    <div className="relative flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      <ScreenHeader title="Invoice" onBack={onBack} />
      {notice}
      <div ref={listRef} className="flex-1 overflow-y-auto no-scrollbar pb-6">
        <div className="px-4 pt-4">
          {/* Desktop service tabs */}
          <nav aria-label="Invoice services">
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-4 px-4" role="tablist">
              {INVOICE_SERVICES.map((s) => {
                const on = s.id === service;
                return (
                  <button
                    key={s.id}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    onClick={() => setService(s.id)}
                    className={`h-9 px-3.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                      on ? 'bg-[#2F68FE] text-white shadow-[0_6px_14px_-6px_rgba(47,104,254,0.6)]' : 'bg-white border border-slate-200 text-slate-600'
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </nav>

          {isHrms && (
            <>
              {/* Desktop filter bar: Search By Invoice No + From / To Date, Staff, Payment Status drawer */}
              <div className="mt-3 flex items-center gap-2.5">
                <div className="flex-1 min-w-0">
                  <SearchField
                    value={query}
                    onChange={(v) => {
                      setQuery(v);
                      setPages(1);
                    }}
                    placeholder="Search By Invoice No"
                  />
                </div>
                <FilterIconButton count={filterCount} onClick={() => setFilterOpen(true)} />
              </div>

              {filterCount > 0 && (
                <div className="mt-2.5 flex items-center gap-2">
                  <div className="flex-1 min-w-0 flex gap-1.5 overflow-x-auto no-scrollbar" aria-label="Applied filters">
                    {rangeChip && (
                      <span className={chipCls}>
                        {rangeChip}
                        <button
                          type="button"
                          onClick={() => applyFilters({ ...filters, range: { from: null, to: null } })}
                          aria-label="Remove date filter"
                          className={chipX}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {status !== 'All' && (
                      <span className={chipCls}>
                        {status}
                        <button
                          type="button"
                          onClick={() => applyFilters({ ...filters, status: 'All' })}
                          aria-label="Remove payment status filter"
                          className={chipX}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {staffIds.slice(0, 2).map((id) => (
                      <span key={id} className={chipCls}>
                        {nameOf(id)}
                        <button
                          type="button"
                          onClick={() => applyFilters({ ...filters, staffIds: staffIds.filter((x) => x !== id) })}
                          aria-label={`Remove ${nameOf(id)}`}
                          className={chipX}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    {staffIds.length > 2 && (
                      <button
                        type="button"
                        onClick={() => setFilterOpen(true)}
                        className="shrink-0 h-7 px-2.5 rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600 cursor-pointer"
                      >
                        +{staffIds.length - 2} more
                      </button>
                    )}
                  </div>
                  <button type="button" onClick={clearAll} className="shrink-0 text-[11px] font-bold text-[#2F68FE] cursor-pointer">
                    Clear All
                  </button>
                </div>
              )}

              <div className="mt-3 flex items-center gap-2.5">
                <span className="flex-1 min-w-0 truncate text-xs font-semibold text-slate-500 tabular-nums">
                  {loading ? '' : `${results.length} ${results.length === 1 ? 'record' : 'records'}`}
                </span>
                {canDownload && (
                  <button
                    type="button"
                    onClick={() => setExportOpen(true)}
                    disabled={loading}
                    className="h-9 px-3 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] text-[#2F68FE] text-xs font-bold flex items-center gap-1.5 active:bg-blue-100 disabled:opacity-60 shrink-0 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        <div className="px-4 mt-3">
          {!isHrms ? (
            <SubscriptionInvoices canDownload={canDownload} onNotice={showNotice} />
          ) : loading ? (
            <InvoiceListSkeleton />
          ) : invoices.length === 0 ? (
            <EmptyCard icon={ReceiptText} title="No Data Found" text="Invoices for your offshore staff will show up here once they're generated." />
          ) : results.length === 0 ? (
            <EmptyCard
              icon={SearchX}
              title="No Data Found"
              text="Try another invoice number, date range, staff or payment status."
              action={
                isFiltered && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="mt-4 h-10 px-4 rounded-xl bg-[#EEF2FF] text-[#2F68FE] text-xs font-bold active:bg-[#E0E7FF] cursor-pointer"
                  >
                    Clear All
                  </button>
                )
              }
            />
          ) : (
            <>
              <ul className="space-y-3">{visible.map(card)}</ul>

              {visible.length < results.length && (
                <button
                  type="button"
                  disabled={moreLoading}
                  onClick={() => {
                    setMoreLoading(true);
                    setTimeout(() => {
                      setPages((n) => n + 1);
                      setMoreLoading(false);
                    }, LOAD_MS);
                  }}
                  className="mt-3 w-full h-11 rounded-xl border border-slate-200 bg-white text-xs font-bold text-[#2F68FE] flex items-center justify-center gap-2 active:bg-slate-50 disabled:cursor-wait transition-colors cursor-pointer"
                >
                  {moreLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {moreLoading ? 'Loading…' : `Load More (${results.length - visible.length})`}
                </button>
              )}
              <p className="mt-4 text-center text-[11px] text-slate-400 tabular-nums">
                Showing {visible.length} Of {results.length} Records
              </p>
            </>
          )}
        </div>
      </div>

      <InvoiceFilterSheet
        isOpen={filterOpen}
        filters={filters}
        staff={staff}
        onClose={() => setFilterOpen(false)}
        onApply={(next) => {
          setFilterOpen(false);
          applyFilters(next);
        }}
      />
      <InvoiceExportSheet
        isOpen={exportOpen}
        invoiceCount={results.length}
        timesheetCount={timesheetCount}
        scopeLabel={scopeLabel}
        onClose={() => setExportOpen(false)}
        onCsv={() => {
          const fileName = invoiceFileNames.csv();
          downloadCsv(fileName, invoiceListCsv(results, staffIds));
          setExportOpen(false);
          showNotice(`${fileName} downloaded`);
        }}
        onZip={() => {
          setExportOpen(false);
          showNotice(`${invoiceFileNames.zip()} downloaded`);
        }}
      />
    </div>
  );
};
