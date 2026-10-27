import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Briefcase, ChevronRight, Download, FileDown, FolderSearch, GraduationCap, Loader2, ReceiptText, SearchX, X } from 'lucide-react';
import { FilterIconButton } from '../../common/TeamFilterSheet';
import { useClientPermission } from '../context/ClientPermissionContext';
import { ScreenHeader, EmptyCard, SearchField } from '../staff/tabs/StaffTabParts';
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
  onOpenTimesheets?: (staffIds: string[], range: TimesheetRange, invoiceNo: string) => void;
  onContactManager: () => void;
  /** Header back arrow (Dashboard) */
  onBack?: () => void;
}

/** Desktop shows a loader while the table reloads */
const LOAD_MS = 600;

/** Desktop invoice service tabs (`invoiceServices`); the Client panel redirect lands on `service=hrms` */
type InvoiceService = 'continuing-education' | 'hrms';
const INVOICE_SERVICES: { id: InvoiceService; label: string; icon: React.ElementType }[] = [
  { id: 'continuing-education', label: 'Continuing Education', icon: GraduationCap },
  { id: 'hrms', label: 'HRMS 24 × 7 (Offshoring)', icon: Briefcase },
];

const chipCls = 'shrink-0 h-8 pl-3 pr-1 rounded-full bg-white border border-slate-200 text-[11px] font-semibold text-slate-600 flex items-center gap-1.5';
const chipX = 'w-6 h-6 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 cursor-pointer';

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
        onOpenTimesheets={onOpenTimesheets ? (ids, r) => onOpenTimesheets(ids, r, current.invoiceNo) : undefined}
        onContactManager={onContactManager}
      />
    );
  }

  /** Shared per-card values (desktop columns) */
  const cardData = (inv: ClientInvoice) => {
    const isManual = inv.type === 'manual';
    return {
      isManual,
      lineCount: staffIds.length ? inv.lines.filter((l) => staffIds.includes(l.staffId)).length : inv.lines.length,
      showPdf: canDownload && inv.hasPdf,
      // Desktop folder icon (employees on the invoice) is only on timesheet invoices
      showEmployees: canView && !isManual,
    };
  };

  const pdfBusy = (inv: ClientInvoice) => busy === `pdf-${inv.id}`;
  const downloadPdf = (inv: ClientInvoice) => download(`pdf-${inv.id}`, invoiceFileNames.pdf(inv));

  /* ---------- Ledger cards (divided rows, amount footer, segmented actions) ---------- */
  const invoiceCard = (inv: ClientInvoice) => {
    const { isManual, lineCount, showPdf, showEmployees } = cardData(inv);
    return (
      <li key={inv.id} className="bg-white border border-[#EBF0F7] rounded-2xl overflow-hidden shadow-2xs">
        <dl>
          <div className="px-4 pt-3.5 pb-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <dt className="text-[11px] font-semibold text-slate-400">Invoice No.</dt>
              <dd className="mt-0.5 text-sm font-bold text-[#1E293B] tabular-nums truncate">{inv.invoiceNo}</dd>
            </div>
            <div className="shrink-0 self-start">
              <dt className="sr-only">Payment Status</dt>
              <dd>
                <InvoiceStatusPill status={inv.status} />
              </dd>
            </div>
          </div>

          <div className="mx-4 border-t border-slate-100 divide-y divide-slate-100 text-[11px]">
            <div className="flex items-center justify-between gap-3 py-2.5">
              <dt className="text-slate-500 font-medium shrink-0">Invoice Created On</dt>
              <dd className="text-xs font-semibold text-[#1E293B] tabular-nums">{formatInvoiceDate(inv.createdOn)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 py-2.5">
              <dt className="text-slate-500 font-medium shrink-0">Period</dt>
              <dd className="text-xs font-semibold text-[#1E293B] tabular-nums text-right leading-snug">{formatInvoicePeriod(inv)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 py-2.5">
              <dt className="text-slate-500 font-medium shrink-0">Employee</dt>
              <dd className="text-xs font-semibold text-[#1E293B] tabular-nums">
                {isManual ? (
                  '-'
                ) : (
                  <span className="flex items-center gap-1">
                    <span className="min-w-6 h-5 px-1.5 rounded-full bg-[#2F68FE] text-white text-[10px] font-bold inline-flex items-center justify-center">
                      {lineCount}
                    </span>
                    {staffIds.length > 0 && <span className="text-[11px] font-semibold text-slate-400">of {inv.lines.length}</span>}
                  </span>
                )}
              </dd>
            </div>
          </div>

          <div className="mx-4 mt-1 mb-3.5 px-3.5 py-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3">
            <dt className="text-[11px] font-semibold text-slate-500">Amount</dt>
            <dd className="text-lg leading-none font-extrabold text-[#1E293B] tabular-nums truncate">{formatMoney(invoiceAmountFor(inv, staffIds))}</dd>
          </div>
        </dl>

        {(showPdf || showEmployees) && (
          <div className="flex divide-x divide-slate-100 border-t border-slate-100">
            {showPdf && (
              <button
                type="button"
                onClick={() => downloadPdf(inv)}
                disabled={busy !== null}
                aria-label={`Download invoice ${inv.invoiceNo}`}
                className="flex-1 h-11 flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700 active:bg-slate-50 disabled:opacity-60 disabled:cursor-wait transition-colors cursor-pointer"
              >
                {pdfBusy(inv) ? <Loader2 className="w-4 h-4 animate-spin text-[#2F68FE]" /> : <FileDown className="w-4 h-4 text-[#2F68FE]" />}
                Invoice
              </button>
            )}
            {showEmployees && (
              <button
                type="button"
                onClick={() => openInvoice(inv)}
                aria-label={`View employees on invoice ${inv.invoiceNo}`}
                className="flex-1 h-11 flex items-center justify-center gap-1.5 text-xs font-bold text-[#2F68FE] active:bg-blue-50 transition-colors cursor-pointer"
              >
                <FolderSearch className="w-4 h-4" />
                Employees
                <ChevronRight className="w-3.5 h-3.5 -ml-0.5" />
              </button>
            )}
          </div>
        )}
      </li>
    );
  };

  /* ---------- Applied filter chips ---------- */
  const appliedChips = (
    <>
      {rangeChip && (
        <span className={chipCls}>
          {rangeChip}
          <button type="button" onClick={() => applyFilters({ ...filters, range: { from: null, to: null } })} aria-label="Remove date filter" className={chipX}>
            <X className="w-3 h-3" />
          </button>
        </span>
      )}
      {status !== 'All' && (
        <span className={chipCls}>
          {status}
          <button type="button" onClick={() => applyFilters({ ...filters, status: 'All' })} aria-label="Remove payment status filter" className={chipX}>
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
          className="shrink-0 h-8 px-3 rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600 active:bg-slate-200 cursor-pointer"
        >
          +{staffIds.length - 2} more
        </button>
      )}
    </>
  );

  const onSearch = (v: string) => {
    setQuery(v);
    setPages(1);
  };

  /* ---------- Toolbar: underline tabs, search + filter button, wrapped chips, outline Export ---------- */
  const toolbar = (
    <>
      <nav aria-label="Invoice services" className="bg-transparent border-b border-slate-200/80">
        <div className="flex gap-1 overflow-x-auto no-scrollbar px-2" role="tablist">
          {INVOICE_SERVICES.map((s) => {
            const Icon = s.icon;
            const on = s.id === service;
            return (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setService(s.id)}
                className={`relative h-12 px-3 flex items-center gap-1.5 text-[13px] font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  on ? 'text-[#2F68FE]' : 'text-slate-500 active:text-[#1E293B]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {s.label}
                <span
                  className={`absolute left-2 right-2 bottom-0 h-[3px] rounded-t-full bg-[#2F68FE] transition-opacity duration-200 ${on ? 'opacity-100' : 'opacity-0'}`}
                  aria-hidden
                />
              </button>
            );
          })}
        </div>
      </nav>

      {isHrms && (
        <div className="px-4 pt-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex-1 min-w-0">
              <SearchField value={query} onChange={onSearch} placeholder="Search By Invoice No" />
            </div>
            <FilterIconButton count={filterCount} onClick={() => setFilterOpen(true)} />
            {canDownload && (
              <button
                type="button"
                onClick={() => setExportOpen(true)}
                disabled={loading}
                aria-label="Export"
                className="h-11 px-3 rounded-xl border border-[#2F68FE] bg-white text-[#2F68FE] text-[11px] font-bold flex items-center gap-1.5 active:bg-blue-50 disabled:opacity-60 transition-colors shrink-0 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Export
              </button>
            )}
          </div>

          {filterCount > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5" aria-label="Applied filters">
              {appliedChips}
              <button type="button" onClick={clearAll} className="h-8 px-1 text-[11px] font-bold text-[#2F68FE] cursor-pointer">
                Clear All
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );

  return (
    <div className="relative flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      <ScreenHeader title="Invoice" onBack={onBack} />
      {notice}
      <div ref={listRef} className="flex-1 overflow-y-auto no-scrollbar pb-6">
        {toolbar}

        <div className={`px-4 ${!isHrms ? 'mt-3.5' : 'mt-3'}`}>
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
                    className="mt-4 h-10 px-5 rounded-xl border border-[#2F68FE] bg-white text-[#2F68FE] text-xs font-bold active:bg-blue-50 cursor-pointer"
                  >
                    Clear All
                  </button>
                )
              }
            />
          ) : (
            <>
              <ul className="space-y-3">{visible.map(invoiceCard)}</ul>

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
                  className="mt-3 w-full h-11 rounded-xl border border-slate-200 bg-white shadow-2xs text-xs font-bold text-[#2F68FE] flex items-center justify-center gap-2 active:bg-slate-50 disabled:cursor-wait transition-colors cursor-pointer"
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
