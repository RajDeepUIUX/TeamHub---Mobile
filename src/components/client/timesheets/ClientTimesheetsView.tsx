import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarClock, Download, Eye, Loader2, SearchX, X } from 'lucide-react';
import { FilterIconButton } from '../../common/TeamFilterSheet';
import { useClientPermission } from '../context/ClientPermissionContext';
import { ScreenHeader, Card, EmptyCard } from '../staff/tabs/StaffTabParts';
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
import { TimesheetExportSheet, TimesheetExportType, TimesheetListSkeleton, useTimesheetNotice } from './TimesheetParts';

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

/** Desktop shows "0" when there are no hours */
const hours = (seconds: number) => (seconds > 0 ? formatHm(seconds) : '0');

/** Desktop table column as a label / value pair */
const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="min-w-0">
    <dt className="text-[10.5px] font-semibold text-slate-400">{label}</dt>
    <dd className="mt-0.5 text-[12.5px] text-[#1E293B] leading-snug break-words">{children}</dd>
  </div>
);

/** Desktop Reports › Timesheets: Date, Staff Name, Available Hours (Hrs), Working Hours (Hrs), Action (View / Download) */
export const ClientTimesheetsView: React.FC<ClientTimesheetsViewProps> = ({ staff, initialStaffIds = [], initialRange, onBack }) => {
  // `is_view` = row View (entries); `is_download` = Export + row CSV
  const { view: canView, download: canDownload } = useClientPermission('timesheets');
  const showAvailable = !CLIENT_IS_MOS;

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

  const actionBtn =
    'h-9 px-3 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] text-[#2F68FE] text-[11.5px] font-bold flex items-center gap-1.5 active:bg-blue-100 shrink-0 cursor-pointer';

  const card = (r: TimesheetRow) => {
    const name = nameOf(r.staffId);
    const date = formatTimesheetDate(r.date);
    return (
      <li key={r.id}>
        <Card className="overflow-hidden">
          <dl className="p-3.5 grid grid-cols-2 gap-x-4 gap-y-3">
            <Field label="Date">
              <span className="tabular-nums">{date}</span>
            </Field>
            <Field label="Staff Name">
              <span className="font-semibold">{name}</span>
            </Field>
            {showAvailable && (
              <Field label="Available Hours (Hrs)">
                <span className="tabular-nums">{hours(r.availableSeconds)}</span>
              </Field>
            )}
            <Field label="Working Hours (Hrs)">
              <span className="tabular-nums font-semibold">{hours(r.workingSeconds)}</span>
            </Field>
          </dl>

          {(canView || canDownload) && (
            <div className="px-3.5 py-2.5 border-t border-slate-100 flex items-center gap-2">
              <span className="flex-1 text-[10.5px] font-semibold text-slate-400">Action</span>
              {canView && (
                <button type="button" onClick={() => openRow(r)} aria-label={`View timesheet of ${name}, ${date}`} className={actionBtn}>
                  <Eye className="w-4 h-4" />
                  View
                </button>
              )}
              {canDownload && (
                <button
                  type="button"
                  onClick={() => downloadDay(r)}
                  aria-label={`Download timesheet of ${name}, ${date}`}
                  className={actionBtn}
                >
                  <Download className="w-4 h-4" />
                  Download
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
      <ScreenHeader title="Timesheets" onBack={onBack} />
      {notice}
      <div ref={listRef} className="flex-1 overflow-y-auto no-scrollbar pb-6">
        <div className="px-4 pt-3">
          <div className="flex items-center gap-2.5">
            <span className="flex-1 min-w-0 truncate text-xs font-semibold text-slate-500 tabular-nums">
              {loading ? '' : `${rows.length} ${rows.length === 1 ? 'record' : 'records'}`}
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
            <FilterIconButton count={filterCount} onClick={() => setFilterOpen(true)} />
          </div>

          {applied.length > 0 && (
            <div className="mt-2.5 flex items-center gap-2">
              <div className="flex-1 min-w-0 flex gap-1.5 overflow-x-auto no-scrollbar" aria-label="Applied filters">
                {applied.map((a) => (
                  <span
                    key={a.key}
                    className="shrink-0 h-7 pl-2.5 pr-1 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[11px] font-semibold text-[#1D4ED8] flex items-center gap-1"
                  >
                    {a.label}
                    <button
                      type="button"
                      onClick={() => applyFilters(a.next)}
                      aria-label={`Remove ${a.label}`}
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[#2F68FE] active:bg-blue-100 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <button type="button" onClick={clearAll} className="shrink-0 text-[11px] font-bold text-[#2F68FE] cursor-pointer">
                Clear All
              </button>
            </div>
          )}
          {!customRange && <p className="mt-2 text-[11px] text-slate-400 tabular-nums">{rangeLabel}</p>}
        </div>

        <div className="px-4 mt-3">
          {loading ? (
            <TimesheetListSkeleton />
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
                    className="mt-4 h-10 px-5 rounded-xl bg-[#EEF2FF] text-[#2F68FE] text-xs font-bold active:bg-[#E0E7FF] cursor-pointer"
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
