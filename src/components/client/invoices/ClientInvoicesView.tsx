import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, CalendarRange, Download, FileDown, FolderSearch, Loader2, ReceiptText, Search, SearchX, SlidersHorizontal, Users, X } from 'lucide-react';
import { FilterIconButton } from '../../common/TeamFilterSheet';
import { useClientPermission } from '../context/ClientPermissionContext';
import { ScreenHeader, DesignVersion, EmptyCard, SearchField } from '../staff/tabs/StaffTabParts';
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
import { INVOICE_STATUS_ACCENT, InvoiceExportSheet, InvoiceListSkeleton, InvoiceStatusPill } from './InvoiceParts';
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

const DESIGN_VERSIONS = ['V1', 'V2'] as const;

const CHIP_CLS = {
  V1: 'shrink-0 h-7 pl-3 pr-1 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[11px] font-semibold text-[#1D4ED8] flex items-center gap-1',
  V2: 'shrink-0 h-7 pl-2.5 pr-1 rounded-lg bg-[#EFF6FF] text-[11px] font-semibold text-[#1D4ED8] flex items-center gap-1',
};
const chipX = 'w-5 h-5 rounded-full flex items-center justify-center text-[#2F68FE] active:bg-blue-100 cursor-pointer';

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
  const [version, setVersion] = useState<DesignVersion>('V1');
  const v2 = version === 'V2';
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

  /* ---------- V1: soft cards (amount panel, icon tiles, pill actions) ---------- */
  const cardV1 = (inv: ClientInvoice) => {
    const { isManual, lineCount, showPdf, showEmployees } = cardData(inv);
    return (
      <li key={inv.id} className="bg-white border border-[#DCE3ED] rounded-[20px] shadow-[0_4px_16px_-6px_rgba(15,23,42,0.12)] p-4">
        <dl>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <dt className="text-[10.5px] font-semibold text-slate-400">Invoice No.</dt>
              <dd className="mt-0.5 text-[14px] font-bold text-[#1E293B] tabular-nums truncate">{inv.invoiceNo}</dd>
            </div>
            <div className="shrink-0">
              <dt className="sr-only">Payment Status</dt>
              <dd>
                <InvoiceStatusPill status={inv.status} />
              </dd>
            </div>
          </div>

          <div className="mt-3 px-3.5 py-3 rounded-2xl bg-gradient-to-br from-[#EFF6FF] to-[#EEF2FF] border border-[#DBEAFE] flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-[#2F68FE] text-white flex items-center justify-center shrink-0 shadow-[0_6px_14px_-6px_rgba(47,104,254,0.7)]" aria-hidden>
              <ReceiptText className="w-5 h-5" />
            </span>
            <div className="flex-1 min-w-0">
              <dt className="text-[10.5px] font-semibold text-slate-500">Amount</dt>
              <dd className="text-[20px] leading-tight font-extrabold text-[#1E293B] tabular-nums truncate">{formatMoney(invoiceAmountFor(inv, staffIds))}</dd>
            </div>
          </div>

          <div className="mt-2.5 grid grid-cols-3 gap-2">
            <div className="min-w-0 p-2.5 rounded-2xl bg-[#F8FAFC] border border-slate-100">
              <dt className="flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                <CalendarDays className="w-3 h-3 text-[#2F68FE] shrink-0" />
                <span className="truncate">Invoice Created On</span>
              </dt>
              <dd className="mt-1 text-[11.5px] font-bold text-[#1E293B] tabular-nums truncate">{formatInvoiceDate(inv.createdOn)}</dd>
            </div>
            <div className="min-w-0 p-2.5 rounded-2xl bg-[#F8FAFC] border border-slate-100">
              <dt className="flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                <CalendarRange className="w-3 h-3 text-[#2F68FE] shrink-0" />
                <span className="truncate">Period</span>
              </dt>
              <dd className="mt-1 text-[11.5px] font-bold text-[#1E293B] tabular-nums leading-snug break-words">{formatInvoicePeriod(inv)}</dd>
            </div>
            <div className="min-w-0 p-2.5 rounded-2xl bg-[#F8FAFC] border border-slate-100">
              <dt className="flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                <Users className="w-3 h-3 text-[#2F68FE] shrink-0" />
                <span className="truncate">Employee</span>
              </dt>
              <dd className="mt-1 text-[11.5px] font-bold text-[#1E293B] tabular-nums">
                {isManual ? (
                  '-'
                ) : (
                  <span className="flex items-center gap-1">
                    <span className="min-w-[26px] h-5 px-1.5 rounded-full bg-[#2F68FE] text-white text-[10.5px] font-bold inline-flex items-center justify-center">
                      {lineCount}
                    </span>
                    {staffIds.length > 0 && <span className="text-[10.5px] font-semibold text-slate-400">of {inv.lines.length}</span>}
                  </span>
                )}
              </dd>
            </div>
          </div>
        </dl>

        {(showPdf || showEmployees) && (
          <div className="mt-3 flex items-center gap-2">
            {showPdf && (
              <button
                type="button"
                onClick={() => downloadPdf(inv)}
                disabled={busy !== null}
                aria-label={`Download invoice ${inv.invoiceNo}`}
                className="flex-1 h-10 rounded-full border border-[#BFDBFE] bg-white text-[11.5px] font-bold text-[#2F68FE] flex items-center justify-center gap-1.5 active:bg-[#EFF6FF] disabled:opacity-60 disabled:cursor-wait transition-colors cursor-pointer"
              >
                {pdfBusy(inv) ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                Invoice
              </button>
            )}
            {showEmployees && (
              <button
                type="button"
                onClick={() => openInvoice(inv)}
                aria-label={`View employees on invoice ${inv.invoiceNo}`}
                className="flex-1 h-10 rounded-full bg-[#2F68FE] text-white text-[11.5px] font-bold flex items-center justify-center gap-1.5 shadow-[0_6px_14px_-6px_rgba(47,104,254,0.7)] active:bg-[#1D4ED8] transition-colors cursor-pointer"
              >
                <FolderSearch className="w-4 h-4" />
                Employees
              </button>
            )}
          </div>
        )}
      </li>
    );
  };

  /* ---------- V2: ledger cards (status rail, dashed rows, amount footer, segmented actions) ---------- */
  const cardV2 = (inv: ClientInvoice) => {
    const { isManual, lineCount, showPdf, showEmployees } = cardData(inv);
    const accent = INVOICE_STATUS_ACCENT[inv.status];
    return (
      <li key={inv.id} className="relative bg-white border border-[#DCE3ED] rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
        <span className={`absolute left-0 inset-y-0 w-1 ${accent.rail}`} aria-hidden />
        <dl>
          <div className="pl-4 pr-3.5 pt-3 pb-2.5 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Invoice No.</dt>
              <dd className="mt-0.5 text-[14px] font-bold text-[#1E293B] tabular-nums truncate">{inv.invoiceNo}</dd>
            </div>
            <div className="shrink-0">
              <dt className="sr-only">Payment Status</dt>
              <dd>
                <InvoiceStatusPill status={inv.status} />
              </dd>
            </div>
          </div>

          <div className="ml-4 mr-3.5 border-t border-dashed border-slate-200 py-1.5 text-[11.5px]">
            <div className="flex items-center justify-between gap-3 py-1.5">
              <dt className="flex items-center gap-1.5 text-slate-400">
                <CalendarDays className="w-3.5 h-3.5" />
                Invoice Created On
              </dt>
              <dd className="font-semibold text-slate-700 tabular-nums">{formatInvoiceDate(inv.createdOn)}</dd>
            </div>
            <div className="flex items-start justify-between gap-3 py-1.5">
              <dt className="flex items-center gap-1.5 text-slate-400 shrink-0">
                <CalendarRange className="w-3.5 h-3.5" />
                Period
              </dt>
              <dd className="font-semibold text-slate-700 tabular-nums text-right">{formatInvoicePeriod(inv)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 py-1.5">
              <dt className="flex items-center gap-1.5 text-slate-400">
                <Users className="w-3.5 h-3.5" />
                Employee
              </dt>
              <dd className="font-semibold text-slate-700 tabular-nums">
                {isManual ? (
                  '-'
                ) : (
                  <span className="flex items-center gap-1">
                    <span className="min-w-[24px] h-5 px-1.5 rounded-md bg-[#EFF6FF] text-[#2F68FE] text-[11px] font-bold inline-flex items-center justify-center">
                      {lineCount}
                    </span>
                    {staffIds.length > 0 && <span className="text-[11px] text-slate-400">of {inv.lines.length}</span>}
                  </span>
                )}
              </dd>
            </div>
          </div>

          <div className={`pl-4 pr-3.5 py-2.5 flex items-center justify-between gap-3 ${accent.soft}`}>
            <dt className={`text-[11px] font-bold ${accent.text}`}>Amount</dt>
            <dd className="text-[17px] font-extrabold text-[#1E293B] tabular-nums">{formatMoney(invoiceAmountFor(inv, staffIds))}</dd>
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
                className="flex-1 h-11 flex items-center justify-center gap-1.5 text-[11.5px] font-bold text-[#2F68FE] active:bg-[#EFF6FF] disabled:opacity-60 disabled:cursor-wait transition-colors cursor-pointer"
              >
                {pdfBusy(inv) ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                Invoice
              </button>
            )}
            {showEmployees && (
              <button
                type="button"
                onClick={() => openInvoice(inv)}
                aria-label={`View employees on invoice ${inv.invoiceNo}`}
                className="flex-1 h-11 flex items-center justify-center gap-1.5 text-[11.5px] font-bold text-[#2F68FE] active:bg-[#EFF6FF] transition-colors cursor-pointer"
              >
                <FolderSearch className="w-4 h-4" />
                Employees
              </button>
            )}
          </div>
        )}
      </li>
    );
  };

  /* ---------- Applied filter chips (both versions) ---------- */
  const chipCls = CHIP_CLS[v2 ? 'V2' : 'V1'];
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
          className={`shrink-0 h-7 px-2.5 bg-slate-100 text-[11px] font-semibold text-slate-600 cursor-pointer ${v2 ? 'rounded-lg' : 'rounded-full'}`}
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
  const recordCount = `${results.length} ${results.length === 1 ? 'record' : 'records'}`;

  /* ---------- V1 toolbar: pill tabs, search + filter, chips, count + Export pill ---------- */
  const toolbarV1 = (
    <div className="px-4 pt-4">
      <nav aria-label="Invoice services">
        <div className="flex p-1 rounded-full bg-white border border-[#DCE3ED] shadow-2xs" role="tablist">
          {INVOICE_SERVICES.map((s) => {
            const on = s.id === service;
            return (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setService(s.id)}
                className={`flex-1 min-w-0 h-9 px-2 rounded-full text-[11.5px] font-semibold truncate transition-colors cursor-pointer ${
                  on ? 'bg-[#2F68FE] text-white shadow-[0_6px_14px_-6px_rgba(47,104,254,0.6)]' : 'text-slate-500'
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
          <div className="mt-3 flex items-center gap-2.5">
            <div className="flex-1 min-w-0 [&_input]:rounded-full">
              <SearchField value={query} onChange={onSearch} placeholder="Search By Invoice No" />
            </div>
            <FilterIconButton count={filterCount} onClick={() => setFilterOpen(true)} />
          </div>

          {filterCount > 0 && (
            <div className="mt-2.5 flex items-center gap-2">
              <div className="flex-1 min-w-0 flex gap-1.5 overflow-x-auto no-scrollbar" aria-label="Applied filters">
                {appliedChips}
              </div>
              <button
                type="button"
                onClick={clearAll}
                className="shrink-0 h-7 px-3 rounded-full bg-[#FFF1F2] text-[11px] font-bold text-[#E11D48] active:bg-[#FFE4E6] cursor-pointer"
              >
                Clear All
              </button>
            </div>
          )}

          <div className="mt-3.5 flex items-center gap-2.5">
            <span className="flex-1 min-w-0 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-[#EFF6FF] text-[#2F68FE] flex items-center justify-center shrink-0" aria-hidden>
                <ReceiptText className="w-4 h-4" />
              </span>
              <span className="truncate text-[13px] font-bold text-[#1E293B] tabular-nums">{loading ? '' : recordCount}</span>
            </span>
            {canDownload && (
              <button
                type="button"
                onClick={() => setExportOpen(true)}
                disabled={loading}
                className="h-9 px-4 rounded-full bg-[#2F68FE] text-white text-xs font-bold flex items-center gap-1.5 shadow-[0_6px_14px_-6px_rgba(47,104,254,0.7)] active:bg-[#1D4ED8] disabled:opacity-60 shrink-0 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );

  /* ---------- V2 toolbar: underline tabs, combined search + Filter field, wrapped chips, count + outline Export ---------- */
  const toolbarV2 = (
    <>
      <nav aria-label="Invoice services" className="bg-white border-b border-slate-200">
        <div className="flex px-4" role="tablist">
          {INVOICE_SERVICES.map((s) => {
            const on = s.id === service;
            return (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setService(s.id)}
                className={`relative flex-1 min-w-0 h-11 px-1 text-[11.5px] font-bold truncate transition-colors cursor-pointer ${on ? 'text-[#2F68FE]' : 'text-slate-400'}`}
              >
                {s.label}
                {on && <span className="absolute left-3 right-3 bottom-0 h-[3px] rounded-t-full bg-[#2F68FE]" aria-hidden />}
              </button>
            );
          })}
        </div>
      </nav>

      {isHrms && (
        <div className="px-4 pt-3.5">
          <div className="h-11 flex items-center bg-white border border-slate-200 rounded-xl shadow-2xs focus-within:border-[#2F68FE] focus-within:ring-4 focus-within:ring-blue-50">
            <Search className="w-4 h-4 text-slate-400 ml-3.5 shrink-0" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search By Invoice No"
              aria-label="Search By Invoice No"
              className="flex-1 min-w-0 h-full px-2.5 bg-transparent text-xs font-medium text-[#1E293B] placeholder:text-slate-400 focus:outline-hidden select-text [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                type="button"
                onClick={() => onSearch('')}
                aria-label="Clear search"
                className="w-5 h-5 mr-2 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center shrink-0 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
            <span className="w-px h-6 bg-slate-200 shrink-0" aria-hidden />
            <button
              type="button"
              onClick={() => setFilterOpen(true)}
              aria-label={filterCount ? `Filters (${filterCount} applied)` : 'Filters'}
              className="h-full px-3 flex items-center gap-1.5 text-xs font-bold text-[#2F68FE] rounded-r-xl active:bg-[#EFF6FF] shrink-0 cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filter
              {filterCount > 0 && (
                <span className="min-w-4.5 h-4.5 px-1 rounded-full bg-[#2F68FE] text-white text-[10px] font-bold flex items-center justify-center">{filterCount}</span>
              )}
            </button>
          </div>

          {filterCount > 0 && (
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5" aria-label="Applied filters">
              {appliedChips}
              <button type="button" onClick={clearAll} className="h-7 px-2 text-[11px] font-bold text-[#2F68FE] underline underline-offset-2 cursor-pointer">
                Clear All
              </button>
            </div>
          )}

          <div className="mt-3 flex items-center gap-2.5">
            <span className="flex-1 min-w-0 truncate text-[10.5px] font-bold uppercase tracking-wide text-slate-400 tabular-nums">{loading ? '' : recordCount}</span>
            {canDownload && (
              <button
                type="button"
                onClick={() => setExportOpen(true)}
                disabled={loading}
                className="h-8 px-3 rounded-lg border border-slate-200 bg-white text-[#2F68FE] text-[11.5px] font-bold flex items-center gap-1.5 active:bg-slate-50 disabled:opacity-60 shrink-0 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Export
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="relative flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      <ScreenHeader title="Invoice" onBack={onBack} version={{ versions: DESIGN_VERSIONS, value: version, onChange: setVersion }} />
      {notice}
      <div ref={listRef} className="flex-1 overflow-y-auto no-scrollbar pb-6">
        {v2 ? toolbarV2 : toolbarV1}

        <div className={`px-4 ${!isHrms && v2 ? 'mt-3.5' : 'mt-3'}`}>
          {!isHrms ? (
            <SubscriptionInvoices canDownload={canDownload} onNotice={showNotice} v2={v2} />
          ) : loading ? (
            <InvoiceListSkeleton v2={v2} />
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
                    className={`mt-4 h-10 px-4 bg-[#EEF2FF] text-[#2F68FE] text-xs font-bold active:bg-[#E0E7FF] cursor-pointer ${v2 ? 'rounded-xl' : 'rounded-full'}`}
                  >
                    Clear All
                  </button>
                )
              }
            />
          ) : (
            <>
              <ul className="space-y-3">{visible.map(v2 ? cardV2 : cardV1)}</ul>

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
                  className={`mt-3 w-full h-11 text-xs font-bold text-[#2F68FE] flex items-center justify-center gap-2 disabled:cursor-wait transition-colors cursor-pointer ${
                    v2 ? 'rounded-xl border border-dashed border-[#93C5FD] bg-white active:bg-[#EFF6FF]' : 'rounded-full border border-[#BFDBFE] bg-white active:bg-slate-50'
                  }`}
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
