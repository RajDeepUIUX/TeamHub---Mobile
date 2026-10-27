import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarClock, CalendarDays, Clock3, Download, Eye, Hourglass, Loader2, SearchX, X } from 'lucide-react';
import { FilterIconButton } from '../../common/TeamFilterSheet';
import { useClientPermission } from '../context/ClientPermissionContext';
import { ScreenHeader, EmptyCard, SearchField } from '../staff/tabs/StaffTabParts';
import { StaffSkeleton } from '../staff/ClientStaffParts';
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
const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]';

/** Desktop shows "0" when there are no hours */
const hours = (seconds: number) => (seconds > 0 ? formatHm(seconds) : '0');

/** Hours stat (Available / Working) inside the card's hours strip */
const HoursStat: React.FC<{ icon: React.ElementType; label: string; value: string }> = ({ icon: Icon, label, value }) => (
  <div className="min-w-0 px-3 py-2">
    <dt className="flex items-center gap-1 text-[10px] font-medium text-slate-500 leading-tight">
      <Icon className="w-3 h-3 shrink-0 text-[#2F68FE]" />
      <span className="truncate">{label}</span>
    </dt>
    <dd className="mt-1 text-sm font-extrabold tabular-nums leading-none text-[#1E293B]">{value}</dd>
  </div>
);

/** Desktop Reports › Timesheets: Date, Staff Name, Available Hours (Hrs), Working Hours (Hrs), Action (View / Download) */
export const ClientTimesheetsView: React.FC<ClientTimesheetsViewProps> = ({ staff, initialStaffIds = [], initialRange, onBack }) => {
  // `is_view` = row View (entries); `is_download` = Export + row CSV
  const { view: canView, download: canDownload } = useClientPermission('timesheets');
  const showAvailable = !CLIENT_IS_MOS;

  const [filters, setFilters] = useState<TimesheetFilters>(() => ({ range: initialRange ?? defaultTimesheetRange(), staffIds: initialStaffIds }));
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
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

  const { range, staffIds } = filters;
  const scopeStaff = useMemo(
    () => (staffIds.length ? sortedStaff.filter((s) => staffIds.includes(s.id)) : sortedStaff),
    [sortedStaff, staffIds],
  );
  // Desktop order: date ASC, then staff
  const rangeRows = useMemo(() => timesheetRowsFor(scopeStaff, range), [scopeStaff, range]);
  const q = query.trim().toLowerCase();
  const rows = q ? rangeRows.filter((r) => nameOf(r.staffId).toLowerCase().includes(q)) : rangeRows;
  const visible = rows.slice(0, pages * TIMESHEET_PAGE_SIZE);
  const entryCount = rows.reduce((s, r) => s + r.entries.length, 0);
  const loggedStaff = new Set(rows.map((r) => r.staffId)).size;
  const rangeLabel = formatTimesheetRange(range);

  const filterCount = timesheetFilterCount(filters);
  const defaultRange = defaultTimesheetRange();
  const customRange = !sameRange(range, defaultRange);

  const applyFilters = (next: TimesheetFilters) => {
    setFilters(next);
    setPages(1);
    setLoading(true);
    listRef.current?.scrollTo({ top: 0 });
  };
  const clearAll = () => {
    setQuery('');
    applyFilters({ range: defaultTimesheetRange(), staffIds: [] });
  };

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

  /* ---------- Card: avatar + name/date, hours strip, actions ---------- */
  const card = (r: TimesheetRow) => {
    const name = nameOf(r.staffId);
    const date = formatTimesheetDate(r.date);
    return (
      <li key={r.id}>
        <article className="bg-white rounded-2xl border border-[#EBF0F7] shadow-2xs p-3">
          <div className="flex items-center gap-2.5">
            <p className="flex-1 min-w-0 text-sm font-bold text-[#1E293B] truncate">{name}</p>
            <p className="shrink-0 flex items-center gap-1 text-[11px] font-semibold text-slate-500 tabular-nums">
              <CalendarDays className="w-3 h-3 text-[#2F68FE] shrink-0" />
              {date}
            </p>
          </div>

          <dl className={`mt-2.5 grid rounded-xl bg-slate-50 border border-slate-100 divide-x divide-slate-200 ${showAvailable ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {showAvailable && <HoursStat icon={Hourglass} label="Available Hours (Hrs)" value={hours(r.availableSeconds)} />}
            <HoursStat icon={Clock3} label="Working Hours (Hrs)" value={hours(r.workingSeconds)} />
          </dl>

          {(canView || canDownload) && (
            <div
              className={`-mx-3 -mb-3 mt-3 grid divide-x divide-slate-100 border-t border-slate-100 rounded-b-2xl overflow-hidden ${
                canView && canDownload ? 'grid-cols-2' : 'grid-cols-1'
              }`}
            >
              {canView && (
                <button
                  type="button"
                  onClick={() => openRow(r)}
                  aria-label={`View timesheet of ${name}, ${date}`}
                  className={`h-11 flex items-center justify-center gap-1.5 text-xs font-bold text-[#2F68FE] hover:bg-blue-50/60 active:bg-blue-50 cursor-pointer transition-colors ${FOCUS}`}
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
                  className={`h-11 flex items-center justify-center gap-1.5 text-xs font-bold text-[#2F68FE] hover:bg-blue-50/60 active:bg-blue-50 cursor-pointer transition-colors ${FOCUS}`}
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

  /* ---------- Toolbar: search, filter, date range, Export, applied chips ---------- */
  const toolbar = (
    <div className="px-4 pt-4">
      <div className="flex items-center gap-2.5">
        <div className="flex-1 min-w-0">
          <SearchField
            value={query}
            onChange={(v) => {
              setQuery(v);
              setPages(1);
            }}
            placeholder="Search by staff name"
          />
        </div>
        <FilterIconButton count={filterCount} onClick={() => setFilterOpen(true)} />
      </div>

      {(!customRange || canDownload) && (
        <div className="mt-3 flex items-center gap-2.5">
          {!customRange && (
            <p className="h-9 pl-1 pr-3 inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 shadow-2xs text-[11px] font-semibold text-slate-600 tabular-nums min-w-0">
              <span className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#2F68FE] flex items-center justify-center shrink-0">
                <CalendarDays className="w-3.5 h-3.5" />
              </span>
              <span className="truncate">{rangeLabel}</span>
            </p>
          )}
          {canDownload && (
            <button
              type="button"
              onClick={() => setExportOpen(true)}
              disabled={loading}
              className={`ml-auto h-9 px-4 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs active:bg-[#1D4ED8] disabled:opacity-60 transition-colors shrink-0 cursor-pointer ${FOCUS}`}
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          )}
        </div>
      )}

      {applied.length > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 min-w-0 flex gap-1.5 overflow-x-auto no-scrollbar" aria-label="Applied filters">
            {applied.map((a) => (
              <span
                key={a.key}
                className="shrink-0 h-8 pl-3 pr-1 rounded-full bg-blue-50 border border-blue-100 text-[11px] font-semibold text-[#2F68FE] flex items-center gap-1"
              >
                {a.label}
                <button
                  type="button"
                  onClick={() => applyFilters(a.next)}
                  aria-label={`Remove ${a.label}`}
                  className={`w-6 h-6 rounded-full bg-white flex items-center justify-center text-[#2F68FE] active:bg-blue-100 cursor-pointer ${FOCUS}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <button type="button" onClick={clearAll} className={`shrink-0 h-8 px-3 rounded-full text-[11px] font-bold text-[#2F68FE] active:bg-blue-50 transition-colors cursor-pointer ${FOCUS}`}>
            Clear All
          </button>
        </div>
      )}
    </div>
  );

  const skeleton = (
    <div className="space-y-3" aria-busy="true" aria-label="Loading timesheets">
      {[0, 1, 2].map((i) => (
        <div key={i} className="bg-white border border-[#EBF0F7] rounded-2xl p-3 shadow-2xs space-y-2.5">
          <div className="flex items-center gap-2.5">
            <StaffSkeleton className="w-32 h-3.5" />
            <StaffSkeleton className="ml-auto w-20 h-3" />
          </div>
          <StaffSkeleton className="h-[50px] rounded-xl" />
          <div className="grid grid-cols-2 gap-2">
            <StaffSkeleton className="h-9 rounded-xl" />
            <StaffSkeleton className="h-9 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="relative flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      <ScreenHeader title="Timesheets" onBack={onBack} />
      {notice}
      <div ref={listRef} className="flex-1 overflow-y-auto no-scrollbar pb-6">
        {toolbar}

        <div className="px-4 mt-3.5">
          {loading ? (
            skeleton
          ) : rows.length === 0 ? (
            <EmptyCard
              icon={filterCount > 0 || q ? SearchX : CalendarClock}
              title="No Data Found"
              text={
                staff.length === 0
                  ? 'Timesheets of your offshore staff will show up here.'
                  : q
                    ? `No staff matching "${query.trim()}" in this period.`
                    : 'No timesheets logged for this period. Try another From / To Date or staff.'
              }
              action={
                filterCount > 0 || q ? (
                  <button
                    type="button"
                    onClick={clearAll}
                    className={`mt-4 h-10 px-5 rounded-xl border border-[#2F68FE] bg-white text-[#2F68FE] text-xs font-bold active:bg-blue-50 transition-colors cursor-pointer ${FOCUS}`}
                  >
                    Clear All
                  </button>
                ) : undefined
              }
            />
          ) : (
            <>
              <ul className="space-y-3">{visible.map(card)}</ul>

              {visible.length < rows.length && (
                <button
                  type="button"
                  disabled={moreLoading}
                  onClick={loadMore}
                  className={`mt-3 w-full h-11 rounded-xl bg-white border border-slate-200 shadow-2xs text-xs font-bold text-[#2F68FE] flex items-center justify-center gap-2 active:bg-blue-50 disabled:cursor-wait transition-colors cursor-pointer ${FOCUS}`}
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
