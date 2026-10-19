import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { CalendarRange, ChevronRight, CreditCard, Download, FileArchive, FileDown, FilePlus2, Loader2, ReceiptText, SearchX, X } from 'lucide-react';
import { FilterIconButton } from '../../common/TeamFilterSheet';
import { avatarTint, initialsOf } from '../../home/celebrationUtils';
import { useClientPermission } from '../context/ClientPermissionContext';
import { Card, ChipRow, EmptyCard, SearchField } from '../staff/tabs/StaffTabParts';
import type { ClientStaffMember } from '../data/clientStaffData';
import { TimesheetRange, downloadCsv, parseIso } from '../data/clientTimesheetsData';
import {
  ClientInvoice,
  INVOICE_PAGE_SIZE,
  INVOICE_STATUS_CHIPS,
  InvoiceStatusChip,
  clientInvoicesFor,
  formatInvoiceDate,
  formatMoney,
  inStatusChip,
  invoiceAmountFor,
  invoiceFileNames,
  invoiceListCsv,
  invoicePeriodTitle,
  isOpenInvoice,
} from '../data/clientInvoicesData';
import { EMPTY_INVOICE_FILTERS, InvoiceFilterSheet, InvoiceFilters, invoiceFilterCount } from './InvoiceFilterSheet';
import { FileAction, InvoiceExportSheet, InvoiceListSkeleton, InvoiceStatusPill } from './InvoiceParts';
import { InvoiceDetailView } from './InvoiceDetailView';
import { useTimesheetNotice } from '../timesheets/TimesheetParts';

interface ClientInvoicesViewProps {
  staff: ClientStaffMember[];
  /** Notification deep link: opens this invoice's details */
  initialInvoiceNo?: string | null;
  /** Invoice staff row → Reports › Timesheets (staff + invoice period); hidden without Timesheets access */
  onOpenTimesheets?: (staffIds: string[], range: TimesheetRange) => void;
  onContactManager: () => void;
  /** Billing Details link ("2 banks · 1 card · 15 / 18 staff mapped"); hidden without Billing Details access */
  billingSummary?: string;
  onOpenBilling?: () => void;
}

/** Desktop shows a loader while the table reloads */
const LOAD_MS = 600;

const shortDate = (iso: string) => parseIso(iso).toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
const shortRange = (inv: ClientInvoice) => `${shortDate(inv.period.from)} – ${shortDate(inv.period.to ?? inv.period.from)}`;

const AvatarStack: React.FC<{ names: string[]; tints: number[]; total: number }> = ({ names, tints, total }) => (
  <span className="flex items-center gap-1.5">
    <span className="flex -space-x-1.5" aria-hidden="true">
      {names.map((n, i) => (
        <span
          key={n}
          style={{ zIndex: names.length - i }}
          className={`relative w-7 h-7 rounded-full ring-2 ring-white flex items-center justify-center text-[9px] font-bold ${avatarTint(tints[i])}`}
        >
          {initialsOf(n)}
        </span>
      ))}
    </span>
    <span className="text-[11px] font-semibold text-slate-500 tabular-nums whitespace-nowrap">{total} staff</span>
  </span>
);

/**
 * Invoices › Invoices — MyCPE ONE HRMS invoice tab (desktop `projects&task=invoice` redirects there):
 * search by invoice no., From / To date, Staff, Payment Status; Export CSV / ZIP; Invoice PDF, timesheet ZIP, Invoice Details.
 */
export const ClientInvoicesView: React.FC<ClientInvoicesViewProps> = ({
  staff,
  initialInvoiceNo,
  onOpenTimesheets,
  onContactManager,
  billingSummary,
  onOpenBilling,
}) => {
  // `is_view` = Invoice Details; `is_download` = Export, Invoice PDF, timesheets
  const { view: canView, download: canDownload } = useClientPermission('invoices');

  const invoices = useMemo(() => clientInvoicesFor(staff), [staff]);
  const [openId, setOpenId] = useState<string | null>(
    () => (initialInvoiceNo && invoices.find((i) => i.invoiceNo === initialInvoiceNo)?.id) || null,
  );
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [chip, setChip] = useState<InvoiceStatusChip>('All');
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

  // Account summary (Added by designer)
  const open = invoices.filter(isOpenInvoice);
  const openTotal = open.reduce((s, i) => s + i.total, 0);
  const year = new Date().getFullYear();
  const paidThisYear = invoices.filter((i) => i.status === 'Paid' && parseIso(i.createdOn).getFullYear() === year);
  const paidThisYearTotal = paidThisYear.reduce((s, i) => s + i.total, 0);

  // Desktop filters: invoice no., created date range, staff (`project_ids`), payment status
  const { range, staffIds } = filters;
  const term = query.trim().toLowerCase();
  const base = invoices.filter((inv) => {
    if (term && !inv.invoiceNo.toLowerCase().includes(term)) return false;
    if (range.from && inv.createdOn < range.from) return false;
    if (range.to && inv.createdOn > range.to) return false;
    if (staffIds.length && !inv.lines.some((l) => staffIds.includes(l.staffId))) return false;
    return true;
  });
  const counts = Object.fromEntries(INVOICE_STATUS_CHIPS.map((c) => [c, base.filter((i) => inStatusChip(c, i)).length])) as Record<
    InvoiceStatusChip,
    number
  >;
  const results = base.filter((i) => inStatusChip(chip, i));
  const visible = results.slice(0, pages * INVOICE_PAGE_SIZE);

  // Newest first, grouped by year
  const groups = useMemo(() => {
    const out: { year: number; items: ClientInvoice[] }[] = [];
    visible.forEach((inv) => {
      const y = parseIso(inv.createdOn).getFullYear();
      const last = out[out.length - 1];
      if (last?.year === y) last.items.push(inv);
      else out.push({ year: y, items: [inv] });
    });
    return out;
  }, [visible]);

  const filterCount = invoiceFilterCount(filters);
  const isFiltered = filterCount > 0 || term.length > 0 || chip !== 'All';

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
    setChip('All');
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
          : `Until ${formatInvoiceDate(range.to as string)}`
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
    const amount = invoiceAmountFor(inv, staffIds);
    const stackIds = (staffIds.length ? inv.lines.filter((l) => staffIds.includes(l.staffId)) : inv.lines).slice(0, 3).map((l) => l.staffId);
    return (
      <li key={inv.id}>
        <Card className="overflow-hidden">
          <div
            role={canView ? 'button' : undefined}
            tabIndex={canView ? 0 : undefined}
            onClick={() => openInvoice(inv)}
            onKeyDown={(e) => {
              if (canView && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                openInvoice(inv);
              }
            }}
            aria-label={canView ? `${inv.invoiceNo}, ${formatMoney(amount)}, ${inv.status}. View details` : undefined}
            className={`p-3.5 ${canView ? 'active:bg-slate-50 cursor-pointer' : ''} transition-colors`}
          >
            <div className="flex items-start gap-3">
              <span
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isManual ? 'bg-[#EEF2FF] text-[#4F46E5]' : 'bg-[#EFF6FF] text-[#2F68FE]'
                }`}
                aria-hidden="true"
              >
                {isManual ? <FilePlus2 className="w-[18px] h-[18px]" /> : <ReceiptText className="w-[18px] h-[18px]" />}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[13px] font-bold text-[#1E293B] tabular-nums truncate">{inv.invoiceNo}</span>
                <span className="block text-[11px] text-slate-500 truncate">
                  {isManual ? inv.note ?? 'Manual invoice' : invoicePeriodTitle(inv)}
                </span>
              </span>
              <InvoiceStatusPill status={inv.status} />
            </div>

            <div className="mt-3 flex items-end justify-between gap-3">
              <span className="min-w-0">
                <span className="block text-[19px] leading-none font-extrabold text-[#1E293B] tabular-nums">{formatMoney(amount)}</span>
                {staffIds.length > 0 && !isManual && (
                  <span className="block mt-1 text-[10.5px] font-semibold text-[#1D4ED8]">
                    for {lineCount} of {inv.lines.length} staff
                  </span>
                )}
              </span>
              {!isManual && <AvatarStack names={stackIds.map(nameOf)} tints={stackIds.map(tintOf)} total={lineCount} />}
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-3 text-[11px]">
              <div className="min-w-0">
                <dt className="text-slate-400">Created On</dt>
                <dd className="font-semibold text-slate-700 tabular-nums truncate">{formatInvoiceDate(inv.createdOn)}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-slate-400">{isManual ? 'Type' : 'Period'}</dt>
                <dd className="font-semibold text-slate-700 tabular-nums truncate">{isManual ? 'Manual invoice' : shortRange(inv)}</dd>
              </div>
            </dl>
          </div>

          {(canDownload || canView) && (
            <div className="px-3.5 py-2.5 border-t border-slate-100 flex items-center gap-2">
              {canDownload && inv.hasPdf && (
                <FileAction
                  icon={FileDown}
                  label="Invoice PDF"
                  busy={busy === `pdf-${inv.id}`}
                  disabled={busy !== null}
                  onClick={() => download(`pdf-${inv.id}`, invoiceFileNames.pdf(inv))}
                  ariaLabel={`Download ${inv.invoiceNo} PDF`}
                />
              )}
              {canDownload && !isManual && (
                <FileAction
                  icon={FileArchive}
                  label="Timesheets"
                  busy={busy === `zip-${inv.id}`}
                  disabled={busy !== null}
                  onClick={() => download(`zip-${inv.id}`, invoiceFileNames.timesheetZip(inv))}
                  ariaLabel={`Download all timesheets for ${inv.invoiceNo} (ZIP)`}
                />
              )}
              {canView && (
                <button
                  type="button"
                  onClick={() => openInvoice(inv)}
                  className="ml-auto h-8 pl-2 pr-1 rounded-lg text-[11px] font-bold text-[#2F68FE] flex items-center gap-0.5 active:bg-blue-50 cursor-pointer"
                >
                  Details
                  <ChevronRight className="w-3.5 h-3.5" />
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
      {notice}
      <div ref={listRef} className="flex-1 overflow-y-auto no-scrollbar pb-6">
        <div className="px-4 pt-4">
          <p className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
            Invoices <ChevronRight className="w-3 h-3" /> <span className="text-slate-600">Invoices</span>
          </p>
          <div className="mt-0.5 flex items-center justify-between gap-3">
            <h1 className="text-2xl font-extrabold leading-tight">Invoices</h1>
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

          {/* Account summary */}
          {invoices.length > 0 && (
            <Card className="mt-3 p-4">
              <div className="grid grid-cols-2 divide-x divide-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setChip('Unpaid');
                    reload();
                  }}
                  className="pr-3 text-left cursor-pointer"
                  aria-label={`Awaiting payment ${formatMoney(openTotal)}. Show unpaid invoices`}
                >
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                    <span className={`w-2 h-2 rounded-full ${open.length ? 'bg-[#F59E0B]' : 'bg-[#10B981]'}`} />
                    Awaiting payment
                  </span>
                  <span className="mt-1 block text-[20px] leading-tight font-extrabold tabular-nums text-[#1E293B] truncate">{formatMoney(openTotal)}</span>
                  <span className="mt-0.5 block text-[11px] text-slate-500">
                    {open.length ? `${open.length} open ${open.length === 1 ? 'invoice' : 'invoices'}` : 'All caught up'}
                  </span>
                </button>
                <div className="pl-3.5">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                    Paid in {year}
                  </span>
                  <span className="mt-1 block text-[20px] leading-tight font-extrabold tabular-nums text-[#1E293B] truncate">{formatMoney(paidThisYearTotal)}</span>
                  <span className="mt-0.5 block text-[11px] text-slate-500">
                    {paidThisYear.length} {paidThisYear.length === 1 ? 'invoice' : 'invoices'}
                  </span>
                </div>
              </div>
              <p className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-1.5">
                <CalendarRange className="w-3.5 h-3.5 text-slate-400" />
                Latest invoice generated on <span className="font-bold text-slate-700">{formatInvoiceDate(invoices[0].createdOn)}</span>
              </p>
            </Card>
          )}

          {onOpenBilling && (
            <button
              type="button"
              onClick={onOpenBilling}
              className="mt-2.5 w-full px-3.5 py-3 rounded-2xl bg-white border border-[#EBF0F7] shadow-2xs flex items-center gap-3 text-left active:bg-slate-50 cursor-pointer"
            >
              <span className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0" aria-hidden="true">
                <CreditCard className="w-4 h-4" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[12.5px] font-bold text-[#1E293B]">Billing Details</span>
                <span className="block text-[11px] text-slate-500 truncate">{billingSummary}</span>
              </span>
              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
            </button>
          )}

          {/* Search + filters */}
          <div className="mt-3 flex items-center gap-2.5">
            <div className="flex-1 min-w-0">
              <SearchField
                value={query}
                onChange={(v) => {
                  setQuery(v);
                  setPages(1);
                }}
                placeholder="Search by invoice no."
              />
            </div>
            <FilterIconButton count={filterCount} onClick={() => setFilterOpen(true)} />
          </div>

          {filterCount > 0 && (
            <div className="mt-2.5 flex items-center gap-2">
              <div className="flex-1 min-w-0 flex gap-1.5 overflow-x-auto no-scrollbar">
                {rangeChip && (
                  <span className="shrink-0 h-7 pl-2.5 pr-1 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[11px] font-semibold text-[#1D4ED8] flex items-center gap-1">
                    {rangeChip}
                    <button
                      type="button"
                      onClick={() => applyFilters({ ...filters, range: { from: null, to: null } })}
                      aria-label="Remove date filter"
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[#2F68FE] active:bg-blue-100 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {staffIds.slice(0, 2).map((id) => (
                  <span
                    key={id}
                    className="shrink-0 h-7 pl-2.5 pr-1 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[11px] font-semibold text-[#1D4ED8] flex items-center gap-1"
                  >
                    {nameOf(id)}
                    <button
                      type="button"
                      onClick={() => applyFilters({ ...filters, staffIds: staffIds.filter((x) => x !== id) })}
                      aria-label={`Remove ${nameOf(id)}`}
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[#2F68FE] active:bg-blue-100 cursor-pointer"
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

          <div className="mt-3">
            <ChipRow
              options={INVOICE_STATUS_CHIPS}
              value={chip}
              onChange={(c) => {
                setChip(c);
                reload();
              }}
              counts={counts}
              label="Payment status"
            />
          </div>
        </div>

        <div className="px-4 mt-3">
          {loading ? (
            <InvoiceListSkeleton />
          ) : invoices.length === 0 ? (
            <EmptyCard icon={ReceiptText} title="No invoices yet." text="Invoices for your offshore staff will show up here once they're generated." />
          ) : results.length === 0 ? (
            <EmptyCard
              icon={SearchX}
              title="No invoices found."
              text={chip === 'Unpaid' && !term && !filterCount ? 'Every invoice is paid. Nice work!' : 'Try another invoice number, date range or staff.'}
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
              <div className="space-y-4">
                {groups.map((g) => (
                  <section key={g.year} aria-label={String(g.year)}>
                    <h3 className="mb-2 px-1 text-[12px] font-bold text-slate-400 tabular-nums">{g.year}</h3>
                    <ul className="space-y-3">{g.items.map(card)}</ul>
                  </section>
                ))}
              </div>

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
              {visible.length >= results.length && (
                <p className="mt-4 text-center text-[11px] text-slate-400 tabular-nums">
                  Showing all {results.length} {results.length === 1 ? 'invoice' : 'invoices'}
                </p>
              )}
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
