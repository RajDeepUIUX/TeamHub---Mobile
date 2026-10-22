import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarClock, CalendarDays, Clock3, Download, Eye, Hourglass, Loader2, SearchX, SlidersHorizontal, X } from 'lucide-react';
import { FilterIconButton } from '../../common/TeamFilterSheet';
import { useClientPermission } from '../context/ClientPermissionContext';
import { ScreenHeader, DesignVersion, EmptyCard } from '../staff/tabs/StaffTabParts';
import { StaffAvatar, StaffSkeleton } from '../staff/ClientStaffParts';
import type { ClientStaffMember } from '../data/clientStaffData';
import {
  CLIENT_IS_MOS,
  TIMESHEET_PAGE_SIZE,
  TimesheetRange,
  TimesheetRow,
  defaultTimesheetRange,
  downloadCsv,
  formatHm,
  formatTimesheetDate,
  formatTimesheetRange,
  parseIso,
  sameRange,
  timesheetDayCsv,
  timesheetDetailedCsv,
  timesheetFileNames,
  timesheetRowsFor,
  timesheetSummaryCsv,
} from '../data/clientTimesheetsData';
import { TimesheetFilterSheet, TimesheetFilters, timesheetFilterCount } from './TimesheetFilterSheet';
import { TimesheetDaySheet } from './TimesheetDaySheet';
import { TimesheetExportSheet, TimesheetExportType, useTimesheetNotice } from './TimesheetParts';

interface ClientTimesheetsViewProps {
  staff: ClientStaffMember[];
  /** My Staff timesheet icon opens the report for that staff (desktop `task=report&id=`) */
  initialStaffIds?: string[];
  /** Invoice Details "View daily hours" opens the invoice period */
  initialRange?: TimesheetRange;
  /** Header back arrow (Dashboard) */
  onBack?: () => void;
}

/** Desktop reloads the table after every filter change */
const LOAD_MS = 550;
const DESIGN_VERSIONS = ['V1', 'V2'] as const;
const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]';

/** Desktop shows "0" when there are no hours */
const hours = (seconds: number) => (seconds > 0 ? formatHm(seconds) : '0');

/* ------------------------------- V1 pieces -------------------------------- */

/** V1: hours tile (Available / Working) */
const HoursTile: React.FC<{ icon: React.ElementType; label: string; value: string; strong?: boolean }> = ({ icon: Icon, label, value, strong }) => (
  <div
    className={`min-w-0 p-3 rounded-2xl border ${
      strong ? 'bg-linear-to-br from-[#EEF4FF] to-white border-[#D6E4FF]' : 'bg-[#F8FAFC] border-[#EBF0F7]'
    }`}
  >
    <dt className="flex items-center gap-1.5 text-[10.5px] text-slate-500 leading-tight">
      <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${strong ? 'bg-[#2F68FE] text-white' : 'bg-white border border-[#E0E9FF] text-[#2F68FE]'}`}>
        <Icon className="w-3.5 h-3.5" />
      </span>
      <span className="min-w-0">{label}</span>
    </dt>
    <dd className={`mt-2 text-[18px] font-extrabold tabular-nums leading-none ${strong ? 'text-[#2F68FE]' : 'text-[#1E293B]'}`}>{value}</dd>
  </div>
);

/* ------------------------------- V2 pieces -------------------------------- */

/** V2: calendar-leaf date block (Mon · 12 · Oct 2026) */
const DateLeaf: React.FC<{ iso: string; label: string }> = ({ iso, label }) => {
  const d = parseIso(iso);
  return (
    <span className="w-12 shrink-0 rounded-lg border border-[#DBEAFE] bg-white overflow-hidden text-center" aria-label={label}>
      <span className="block py-0.5 bg-[#2F68FE] text-white text-[9.5px] font-bold uppercase tracking-wide">
        {d.toLocaleDateString('en-US', { weekday: 'short' })}
      </span>
      <span className="block pt-1 text-[17px] font-extrabold leading-none tabular-nums text-[#1E293B]">{String(d.getDate()).padStart(2, '0')}</span>
      <span className="block pt-0.5 pb-1 text-[9.5px] font-semibold text-slate-500">
        {d.toLocaleDateString('en-US', { month: 'short' })} {d.getFullYear()}
      </span>
    </span>
  );
};

/** V2: hours stat cell in the card strip */
const StatV2: React.FC<{ icon: React.ElementType; label: string; value: string; accent?: boolean }> = ({ icon: Icon, label, value, accent }) => (
  <div className="min-w-0 px-3 py-2.5">
    <dt className="flex items-center gap-1 text-[10.5px] font-medium text-slate-500 leading-tight">
      <Icon className={`w-3.5 h-3.5 shrink-0 ${accent ? 'text-[#2F68FE]' : 'text-slate-400'}`} />
      <span className="min-w-0 truncate">{label}</span>
    </dt>
    <dd className={`mt-1 text-[16px] font-extrabold tabular-nums leading-none ${accent ? 'text-[#2F68FE]' : 'text-[#1E293B]'}`}>{value}</dd>
  </div>
);

/** Desktop Reports › Timesheets: Date, Staff Name, Available Hours (Hrs), Working Hours (Hrs), Action (View / Download) */
export const ClientTimesheetsView: React.FC<ClientTimesheetsViewProps> = ({ staff, initialStaffIds = [], initialRange, onBack }) => {
  // `is_view` = row View (entries); `is_download` = Export + row CSV
  const { view: canView, download: canDownload } = useClientPermission('timesheets');
  const showAvailable = !CLIENT_IS_MOS;

  const [version, setVersion] = useState<DesignVersion>('V1');
  const v2 = version === 'V2';
  const [filters, setFilters] = useState<TimesheetFilters>(() => ({ range: initialRange ?? defaultTimesheetRange(), staffIds: initialStaffIds }));
  const [loading, setLoading] = useState(true);
  const [pages, setPages] = useState(1);
  const [moreLoading, setMoreLoading] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [sheet, setSheet] = useState<{ rowId: string | null; open: boolean }>({ rowId: null, open: false });
  const [notice, showNotice] = useTimesheetNotice();
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setLoading(false), LOAD_MS);
    return () => clearTimeout(t);
  }, [loading]);

  const sortedStaff = useMemo(() => [...staff].sort((a, b) => a.name.localeCompare(b.name)), [staff]);
  const memberOf = (id: string) => staff.find((s) => s.id === id);
  const nameOf = (id: string) => memberOf(id)?.name ?? '-';
  const tintOf = (id: string) => sortedStaff.findIndex((s) => s.id === id);

  const { range, staffIds } = filters;
  const scopeStaff = useMemo(
    () => (staffIds.length ? sortedStaff.filter((s) => staffIds.includes(s.id)) : sortedStaff),
    [sortedStaff, staffIds],
  );
  // Desktop order: date ASC, then staff
  const rows = useMemo(() => timesheetRowsFor(scopeStaff, range), [scopeStaff, range]);
  const visible = rows.slice(0, pages * TIMESHEET_PAGE_SIZE);
  const entryCount = rows.reduce((s, r) => s + r.entries.length, 0);
  const loggedStaff = new Set(rows.map((r) => r.staffId)).size;
  const rangeLabel = formatTimesheetRange(range);
  const recordsLabel = `${rows.length} ${rows.length === 1 ? 'record' : 'records'}`;

  const filterCount = timesheetFilterCount(filters);
  const defaultRange = defaultTimesheetRange();
  const customRange = !sameRange(range, defaultRange);

  const applyFilters = (next: TimesheetFilters) => {
    setFilters(next);
    setPages(1);
    setLoading(true);
    listRef.current?.scrollTo({ top: 0 });
  };
  const clearAll = () => applyFilters({ range: defaultTimesheetRange(), staffIds: [] });

  const applied: { key: string; label: string; next: TimesheetFilters }[] = [
    ...(customRange ? [{ key: 'range', label: rangeLabel, next: { ...filters, range: defaultRange } }] : []),
    ...staffIds.map((id) => ({ key: id, label: nameOf(id), next: { ...filters, staffIds: staffIds.filter((x) => x !== id) } })),
  ];

  // View sheet + previous / next logged day of the same staff
  const sheetRow = sheet.rowId ? rows.find((r) => r.id === sheet.rowId) ?? null : null;
  const sheetSiblings = sheetRow ? rows.filter((r) => r.staffId === sheetRow.staffId) : [];
  const sheetIdx = sheetRow ? sheetSiblings.findIndex((r) => r.id === sheetRow.id) : -1;
  const openRow = (row: TimesheetRow) => canView && setSheet({ rowId: row.id, open: true });

  const exportReport = (type: TimesheetExportType) => {
    const fileName = type === 'summary_csv' ? timesheetFileNames.summary() : timesheetFileNames.detailed(range);
    downloadCsv(fileName, type === 'summary_csv' ? timesheetSummaryCsv(rows, nameOf, showAvailable) : timesheetDetailedCsv(rows, nameOf));
    setExportOpen(false);
    showNotice(`${fileName} downloaded`);
  };

  const downloadDay = (row: TimesheetRow) => {
    const fileName = timesheetFileNames.day();
    downloadCsv(fileName, timesheetDayCsv(row));
    showNotice(`${fileName} downloaded`);
  };

  const loadMore = () => {
    setMoreLoading(true);
    setTimeout(() => {
      setPages((n) => n + 1);
      setMoreLoading(false);
    }, LOAD_MS);
  };

  /* ---------- Card (V1): soft card, avatar head, hours tiles, pill actions ---------- */
  const cardV1 = (r: TimesheetRow) => {
    const name = nameOf(r.staffId);
    const date = formatTimesheetDate(r.date);
    return (
      <li key={r.id}>
        <article className="bg-white rounded-[20px] border border-[#E6ECF5] shadow-[0_4px_18px_-8px_rgba(15,23,42,0.14)] overflow-hidden">
          <div className="p-4 pb-3 flex items-center gap-3">
            <StaffAvatar name={name} tint={tintOf(r.staffId)} />
            <dl className="flex-1 min-w-0">
              <dt className="text-[11px] text-slate-400 leading-tight">Staff Name</dt>
              <dd className="mt-0.5 text-[14px] font-bold text-[#1E293B] truncate">{name}</dd>
            </dl>
            <dl className="shrink-0 text-right">
              <dt className="text-[10.5px] text-slate-400 leading-tight">Date</dt>
              <dd className="mt-1 inline-flex items-center gap-1 h-6 px-2.5 rounded-full bg-[#EFF6FF] text-[11px] font-bold text-[#2F68FE] tabular-nums">
                <CalendarDays className="w-3 h-3" />
                {date}
              </dd>
            </dl>
          </div>

          <dl className={`px-4 pb-4 grid gap-2 ${showAvailable ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {showAvailable && <HoursTile icon={Hourglass} label="Available Hours (Hrs)" value={hours(r.availableSeconds)} />}
            <HoursTile icon={Clock3} label="Working Hours (Hrs)" value={hours(r.workingSeconds)} strong />
          </dl>

          {(canView || canDownload) && (
            <div className="px-4 pb-4">
              <p className="mb-2 text-[10.5px] text-slate-400">Action</p>
              <div className={`grid gap-2.5 ${canView && canDownload ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {canView && (
                  <button
                    type="button"
                    onClick={() => openRow(r)}
                    aria-label={`View timesheet of ${name}, ${date}`}
                    className={`h-10 rounded-full border border-[#BFDBFE] bg-white text-[#2F68FE] text-xs font-bold flex items-center justify-center gap-1.5 active:bg-[#EFF6FF] cursor-pointer ${FOCUS}`}
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                )}
                {canDownload && (
                  <button
                    type="button"
                    onClick={() => downloadDay(r)}
                    aria-label={`Download timesheet of ${name}, ${date}`}
                    className={`h-10 rounded-full bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-[0_6px_14px_-6px_rgba(47,104,254,0.7)] active:bg-[#1D4ED8] cursor-pointer ${FOCUS}`}
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                )}
              </div>
            </div>
          )}
        </article>
      </li>
    );
  };

  /* ---------- Card (V2): date leaf head, hours stat strip, compact action footer ---------- */
  const cardV2 = (r: TimesheetRow) => {
    const name = nameOf(r.staffId);
    const date = formatTimesheetDate(r.date);
    const act = `h-8 px-3 rounded-lg text-[11.5px] font-bold flex items-center gap-1.5 shrink-0 cursor-pointer ${FOCUS}`;
    return (
      <li key={r.id}>
        <article className="bg-white rounded-xl border border-[#E2E8F0] shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_12px_-6px_rgba(15,23,42,0.10)] overflow-hidden">
          <div className="p-3 flex items-center gap-3">
            <DateLeaf iso={r.date} label={date} />
            <dl className="flex-1 min-w-0">
              <dt className="text-[10.5px] font-medium text-slate-400 leading-tight">Staff Name</dt>
              <dd className="mt-0.5 text-[14px] font-bold text-[#1E293B] truncate">{name}</dd>
              <dt className="sr-only">Date</dt>
              <dd className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 tabular-nums">
                <CalendarDays className="w-3 h-3 text-slate-400" aria-hidden="true" />
                <span aria-hidden="true" className="text-slate-400">Date</span>
                {date}
              </dd>
            </dl>
          </div>

          <dl
            className={`grid border-y border-[#E6EEFB] bg-[#F8FBFF] divide-x divide-[#E6EEFB] ${showAvailable ? 'grid-cols-2' : 'grid-cols-1'}`}
          >
            {showAvailable && <StatV2 icon={Hourglass} label="Available Hours (Hrs)" value={hours(r.availableSeconds)} />}
            <StatV2 icon={Clock3} label="Working Hours (Hrs)" value={hours(r.workingSeconds)} accent />
          </dl>

          {(canView || canDownload) && (
            <div className="h-12 pl-3 pr-2 flex items-center gap-2">
              <span className="flex-1 text-[10.5px] font-medium text-slate-400">Action</span>
              {canView && (
                <button
                  type="button"
                  onClick={() => openRow(r)}
                  aria-label={`View timesheet of ${name}, ${date}`}
                  className={`${act} border border-[#BFDBFE] bg-white text-[#2F68FE] active:bg-[#EFF6FF]`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  View
                </button>
              )}
              {canDownload && (
                <button
                  type="button"
                  onClick={() => downloadDay(r)}
                  aria-label={`Download timesheet of ${name}, ${date}`}
                  className={`${act} bg-[#EFF6FF] text-[#2F68FE] active:bg-[#DBEAFE]`}
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
              )}
            </div>
          )}
        </article>
      </li>
    );
  };

  /* ---------- Toolbar (V1): bold count, Export pill, filter, pill chips ---------- */
  const toolbarV1 = (
    <div className="px-4 pt-4">
      <div className="flex items-center gap-2.5">
        <div className="flex-1 min-w-0">
          {loading ? (
            <span className="block w-24 h-4 rounded-md bg-slate-200/70 animate-pulse" aria-hidden="true" />
          ) : (
            <p className="flex items-baseline gap-1 tabular-nums">
              <span className="text-[15px] font-extrabold text-[#1E293B] leading-none">{rows.length}</span>
              <span className="text-xs font-semibold text-slate-500">{rows.length === 1 ? 'record' : 'records'}</span>
            </p>
          )}
        </div>
        {canDownload && (
          <button
            type="button"
            onClick={() => setExportOpen(true)}
            disabled={loading}
            className={`h-11 px-4 rounded-full bg-[#2F68FE] text-white text-xs font-bold flex items-center gap-1.5 shadow-[0_6px_14px_-6px_rgba(47,104,254,0.7)] active:bg-[#1D4ED8] disabled:opacity-60 shrink-0 cursor-pointer ${FOCUS}`}
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        )}
        <FilterIconButton count={filterCount} onClick={() => setFilterOpen(true)} />
      </div>

      {!customRange && (
        <p className="mt-3 h-9 pl-1 pr-3 inline-flex items-center gap-2 rounded-full bg-white border border-slate-200 shadow-2xs text-[11.5px] font-semibold text-slate-600 tabular-nums">
          <span className="w-7 h-7 rounded-full bg-[#EFF6FF] text-[#2F68FE] flex items-center justify-center shrink-0">
            <CalendarDays className="w-3.5 h-3.5" />
          </span>
          {rangeLabel}
        </p>
      )}

      {applied.length > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 min-w-0 flex gap-1.5 overflow-x-auto no-scrollbar" aria-label="Applied filters">
            {applied.map((a) => (
              <span
                key={a.key}
                className="shrink-0 h-8 pl-3 pr-1 rounded-full bg-white border border-[#BFDBFE] shadow-2xs text-[11px] font-semibold text-[#1D4ED8] flex items-center gap-1"
              >
                {a.label}
                <button
                  type="button"
                  onClick={() => applyFilters(a.next)}
                  aria-label={`Remove ${a.label}`}
                  className={`w-6 h-6 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#2F68FE] active:bg-blue-100 cursor-pointer ${FOCUS}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <button type="button" onClick={clearAll} className={`shrink-0 h-8 px-3 rounded-full bg-[#FEF2F2] text-[11px] font-bold text-rose-600 cursor-pointer ${FOCUS}`}>
            Clear All
          </button>
        </div>
      )}
    </div>
  );

  /* ---------- Toolbar (V2): sticky period field + Filter, count row, wrapped chips ---------- */
  const toolbarV2 = (
    <div className="sticky top-0 z-10 bg-white px-4 pt-3 pb-2.5 border-b border-[#EBF0F7] shadow-[0_6px_12px_-10px_rgba(15,23,42,0.18)]">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          aria-label={`Period ${rangeLabel}`}
          className={`flex-1 min-w-0 h-10 pl-2 pr-3 rounded-lg border border-slate-200 bg-[#F8FAFC] flex items-center gap-2 active:bg-slate-100 cursor-pointer ${FOCUS}`}
        >
          <span className="w-7 h-7 rounded-md bg-[#EFF6FF] text-[#2F68FE] flex items-center justify-center shrink-0">
            <CalendarDays className="w-3.5 h-3.5" />
          </span>
          <span className="min-w-0 truncate text-xs font-semibold text-slate-700 tabular-nums">{rangeLabel}</span>
        </button>
        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          aria-label={filterCount ? `Filters (${filterCount} applied)` : 'Filters'}
          className={`h-10 px-3 rounded-lg border text-xs font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer ${FOCUS} ${
            filterCount ? 'border-[#2F68FE] bg-[#EFF6FF] text-[#2F68FE]' : 'border-slate-200 bg-white text-slate-600 active:bg-slate-50'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filter
          {filterCount > 0 && (
            <span className="min-w-4.5 h-4.5 px-1 rounded bg-[#2F68FE] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
              {filterCount}
            </span>
          )}
        </button>
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500 tabular-nums">
          <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-[#2F68FE]" />
          {loading ? 'Loading…' : recordsLabel}
        </p>
        {canDownload && (
          <button
            type="button"
            onClick={() => setExportOpen(true)}
            disabled={loading}
            className={`h-8 px-2.5 rounded-lg border border-[#BFDBFE] bg-white text-[#2F68FE] text-[11.5px] font-bold flex items-center gap-1.5 active:bg-[#EFF6FF] disabled:opacity-60 shrink-0 cursor-pointer ${FOCUS}`}
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
        )}
      </div>

      {applied.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5" aria-label="Applied filters">
          {applied.map((a) => (
            <span
              key={a.key}
              className="h-7 pl-2 pr-0.5 rounded-lg bg-[#EFF6FF] border border-[#DBEAFE] text-[11px] font-semibold text-[#1D4ED8] flex items-center gap-1"
            >
              {a.label}
              <button
                type="button"
                onClick={() => applyFilters(a.next)}
                aria-label={`Remove ${a.label}`}
                className={`w-6 h-6 rounded-md flex items-center justify-center text-[#2F68FE] active:bg-blue-100 cursor-pointer ${FOCUS}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={clearAll}
            className={`ml-1 text-[11.5px] font-bold text-[#2F68FE] underline underline-offset-2 cursor-pointer ${FOCUS}`}
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );

  const skeleton = v2 ? (
    <div className="space-y-2.5" aria-busy="true" aria-label="Loading timesheets">
      {[0, 1, 2].map((i) => (
        <div key={i} className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
          <div className="p-3 flex items-center gap-3">
            <StaffSkeleton className="w-12 h-[58px] rounded-lg" />
            <div className="flex-1 space-y-2">
              <StaffSkeleton className="w-20 h-2.5" />
              <StaffSkeleton className="w-36 h-3.5" />
              <StaffSkeleton className="w-28 h-3" />
            </div>
          </div>
          <div className="px-3 py-2.5 grid grid-cols-2 gap-3 border-y border-[#E6EEFB] bg-[#F8FBFF]">
            <StaffSkeleton className="h-8" />
            <StaffSkeleton className="h-8" />
          </div>
          <div className="h-12 px-3 flex items-center justify-end gap-2">
            <StaffSkeleton className="w-16 h-8 rounded-lg" />
            <StaffSkeleton className="w-24 h-8 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  ) : (
    <div className="space-y-3" aria-busy="true" aria-label="Loading timesheets">
      {[0, 1, 2].map((i) => (
        <div key={i} className="bg-white border border-[#E6ECF5] rounded-[20px] p-4 space-y-3">
          <div className="flex items-center gap-3">
            <StaffSkeleton className="w-10 h-10 rounded-full" />
            <StaffSkeleton className="flex-1 h-3.5" />
            <StaffSkeleton className="w-20 h-6 rounded-full" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <StaffSkeleton className="h-[68px] rounded-2xl" />
            <StaffSkeleton className="h-[68px] rounded-2xl" />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <StaffSkeleton className="h-10 rounded-full" />
            <StaffSkeleton className="h-10 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="relative flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      <ScreenHeader title="Timesheets" onBack={onBack} version={{ versions: DESIGN_VERSIONS, value: version, onChange: setVersion }} />
      {notice}
      <div ref={listRef} className="flex-1 overflow-y-auto no-scrollbar pb-6">
        {v2 ? toolbarV2 : toolbarV1}

        <div className={`px-4 ${v2 ? 'mt-3' : 'mt-3.5'}`}>
          {loading ? (
            skeleton
          ) : rows.length === 0 ? (
            <EmptyCard
              icon={filterCount > 0 ? SearchX : CalendarClock}
              title="No Data Found"
              text={
                staff.length === 0
                  ? 'Timesheets of your offshore staff will show up here.'
                  : 'No timesheets logged for this period. Try another From / To Date or staff.'
              }
              action={
                filterCount > 0 ? (
                  <button
                    type="button"
                    onClick={clearAll}
                    className={`mt-4 h-10 px-5 text-xs font-bold cursor-pointer ${FOCUS} ${
                      v2 ? 'rounded-lg border border-[#BFDBFE] bg-white text-[#2F68FE] active:bg-[#EFF6FF]' : 'rounded-full bg-[#EEF2FF] text-[#2F68FE] active:bg-[#E0E7FF]'
                    }`}
                  >
                    Clear All
                  </button>
                ) : undefined
              }
            />
          ) : (
            <>
              <ul className={v2 ? 'space-y-2.5' : 'space-y-3'}>{visible.map(v2 ? cardV2 : cardV1)}</ul>

              {visible.length < rows.length && (
                <button
                  type="button"
                  disabled={moreLoading}
                  onClick={loadMore}
                  className={`mt-3 w-full h-11 text-xs font-bold text-[#2F68FE] flex items-center justify-center gap-2 disabled:cursor-wait transition-colors cursor-pointer ${FOCUS} ${
                    v2
                      ? 'rounded-lg border border-dashed border-[#93C5FD] bg-[#F8FBFF] active:bg-[#EFF6FF]'
                      : 'rounded-full bg-white border border-[#DBEAFE] shadow-2xs active:bg-[#EFF6FF]'
                  }`}
                >
                  {moreLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {moreLoading ? 'Loading…' : `Load More (${rows.length - visible.length})`}
                </button>
              )}
              <p className="mt-4 text-center text-[11px] text-slate-400 tabular-nums">
                Showing {visible.length} Of {rows.length} Records
              </p>
            </>
          )}
        </div>
      </div>

      <TimesheetFilterSheet
        isOpen={filterOpen}
        filters={filters}
        staff={staff}
        onClose={() => setFilterOpen(false)}
        onApply={(next) => {
          setFilterOpen(false);
          applyFilters(next);
        }}
      />
      <TimesheetExportSheet
        isOpen={exportOpen}
        rangeLabel={rangeLabel}
        rowCount={rows.length}
        entryCount={entryCount}
        staffCount={loggedStaff}
        onClose={() => setExportOpen(false)}
        onExport={exportReport}
      />
      <TimesheetDaySheet
        isOpen={sheet.open}
        row={sheetRow}
        staffName={sheetRow ? nameOf(sheetRow.staffId) : ''}
        canDownload={canDownload}
        onPrev={sheetIdx > 0 ? () => setSheet({ rowId: sheetSiblings[sheetIdx - 1].id, open: true }) : undefined}
        onNext={sheetIdx >= 0 && sheetIdx < sheetSiblings.length - 1 ? () => setSheet({ rowId: sheetSiblings[sheetIdx + 1].id, open: true }) : undefined}
        onDownload={downloadDay}
        onClose={() => setSheet((s) => ({ ...s, open: false }))}
      />
    </div>
  );
};
