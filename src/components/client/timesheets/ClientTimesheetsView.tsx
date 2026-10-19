import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarClock, ChevronLeft, ChevronRight, Download, Loader2, X } from 'lucide-react';
import { FilterIconButton } from '../../common/TeamFilterSheet';
import { SegmentedTabs } from '../../../design-system/components/SegmentedTabs';
import { useClientPermission } from '../context/ClientPermissionContext';
import { Card, EmptyCard } from '../staff/tabs/StaffTabParts';
import { StaffAvatar } from '../staff/ClientStaffParts';
import type { ClientStaffMember } from '../data/clientStaffData';
import {
  CLIENT_IS_MOS,
  TIMESHEET_PAGE_SIZE,
  TIMESHEET_STAFF_PAGE_SIZE,
  TimesheetRange,
  TimesheetRow,
  addDays,
  datesInRange,
  daysBetween,
  defaultTimesheetRange,
  downloadCsv,
  formatHm,
  formatTimesheetRange,
  isoOf,
  latestTimesheetStart,
  parseIso,
  sameRange,
  timesheetDayCsv,
  timesheetDetailedCsv,
  timesheetFileNames,
  timesheetPresets,
  timesheetRowsFor,
  timesheetSummaryCsv,
} from '../data/clientTimesheetsData';
import { TimesheetFilterSheet, TimesheetFilters, timesheetFilterCount } from './TimesheetFilterSheet';
import { TimesheetDaySheet } from './TimesheetDaySheet';
import {
  HoursBar,
  TimesheetExportSheet,
  TimesheetExportType,
  TimesheetListSkeleton,
  UtilizationRing,
  useTimesheetNotice,
  utilizationPct,
  utilizationTone,
} from './TimesheetParts';

interface ClientTimesheetsViewProps {
  staff: ClientStaffMember[];
  /** My Staff timesheet icon opens the report for that staff (desktop `task=report&id=`) */
  initialStaffIds?: string[];
  /** Invoice Details "View daily hours" opens the invoice period */
  initialRange?: TimesheetRange;
}

type ViewMode = 'date' | 'staff';

const VIEW_OPTIONS: { id: ViewMode; label: string }[] = [
  { id: 'date', label: 'By Date' },
  { id: 'staff', label: 'By Staff' },
];

/** Desktop reloads the table after every filter change */
const LOAD_MS = 550;

const weekdayShort = (iso: string) => parseIso(iso).toLocaleDateString('en-US', { weekday: 'short' });
const dayHeading = (iso: string) => parseIso(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit' });
const sum = (rows: TimesheetRow[], key: 'workingSeconds' | 'availableSeconds') => rows.reduce((s, r) => s + r[key], 0);

const SummaryStat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="px-2.5 py-2 min-w-0">
    <dt className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wide truncate">{label}</dt>
    <dd className="mt-0.5 text-[12.5px] font-bold text-[#1E293B] truncate tabular-nums">{value}</dd>
  </div>
);

export const ClientTimesheetsView: React.FC<ClientTimesheetsViewProps> = ({ staff, initialStaffIds = [], initialRange }) => {
  // `is_view` = row View (entries); `is_download` = Export + row CSV
  const { view: canView, download: canDownload } = useClientPermission('timesheets');
  const showAvailable = !CLIENT_IS_MOS;

  const [filters, setFilters] = useState<TimesheetFilters>(() => ({ range: initialRange ?? defaultTimesheetRange(), staffIds: initialStaffIds }));
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<ViewMode>('date');
  const [pages, setPages] = useState(1);
  const [moreLoading, setMoreLoading] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [sheet, setSheet] = useState<{ rowId: string | null; open: boolean }>({ rowId: null, open: false });
  const [notice, showNotice] = useTimesheetNotice();
  const listTopRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setLoading(false), LOAD_MS);
    return () => clearTimeout(t);
  }, [loading]);

  const sortedStaff = useMemo(() => [...staff].sort((a, b) => a.name.localeCompare(b.name)), [staff]);
  const tintOf = (id: string) => sortedStaff.findIndex((s) => s.id === id);
  const memberOf = (id: string) => staff.find((s) => s.id === id);
  const nameOf = (id: string) => memberOf(id)?.name ?? '-';

  const { range, staffIds } = filters;
  const scopeStaff = useMemo(
    () => (staffIds.length ? sortedStaff.filter((s) => staffIds.includes(s.id)) : sortedStaff),
    [sortedStaff, staffIds],
  );
  const rows = useMemo(() => timesheetRowsFor(scopeStaff, range), [scopeStaff, range]);

  // Summary (Added by designer)
  const working = sum(rows, 'workingSeconds');
  const available = sum(rows, 'availableSeconds');
  const pct = utilizationPct(working, available);
  const loggedStaff = new Set(rows.map((r) => r.staffId)).size;
  const loggedDays = new Set(rows.map((r) => r.date)).size;
  const entryCount = rows.reduce((s, r) => s + r.entries.length, 0);

  // Range stepper moves by the period length; From can't pass the last completed week (desktop datepicker limit)
  const len = daysBetween(range.from, range.to);
  const latestStart = latestTimesheetStart();
  const todayKey = isoOf(new Date());
  const shiftRange = (dir: -1 | 1): TimesheetRange => {
    const from = addDays(range.from, dir * len);
    const to = addDays(range.to, dir * len);
    return { from, to: to > todayKey ? todayKey : to };
  };
  const canNext = addDays(range.from, len) <= latestStart;
  const preset = timesheetPresets().find((p) => sameRange(p, range));
  const rangeLabel = formatTimesheetRange(range);

  const filterCount = timesheetFilterCount(filters);

  const applyFilters = (next: TimesheetFilters) => {
    setFilters(next);
    setPages(1);
    setLoading(true);
    listTopRef.current?.scrollIntoView({ block: 'start' });
  };

  // By Date: desktop rows (date ASC, staff A–Z), grouped per day
  const visibleRows = rows.slice(0, pages * TIMESHEET_PAGE_SIZE);
  const dayGroups = useMemo(() => {
    const groups: { date: string; rows: TimesheetRow[] }[] = [];
    visibleRows.forEach((r) => {
      const last = groups[groups.length - 1];
      if (last?.date === r.date) last.rows.push(r);
      else groups.push({ date: r.date, rows: [r] });
    });
    return groups;
  }, [visibleRows]);
  const dayTotals = useMemo(() => {
    const map = new Map<string, { staff: number; seconds: number }>();
    rows.forEach((r) => {
      const t = map.get(r.date) ?? { staff: 0, seconds: 0 };
      map.set(r.date, { staff: t.staff + 1, seconds: t.seconds + r.workingSeconds });
    });
    return map;
  }, [rows]);

  // By Staff: everyone employed during the period, incl. those with no hours (Added by designer)
  const rangeDates = useMemo(() => datesInRange(range), [range]);
  const staffCards = useMemo(
    () =>
      scopeStaff
        .filter((s) => s.joiningDate <= range.to && (!s.lastWorkingDay || s.lastWorkingDay >= range.from))
        .map((s) => {
          const own = rows.filter((r) => r.staffId === s.id);
          return { member: s, rows: own, byDate: new Map(own.map((r) => [r.date, r])) };
        }),
    [scopeStaff, rows, range],
  );
  const visibleStaff = staffCards.slice(0, pages * TIMESHEET_STAFF_PAGE_SIZE);

  const total = mode === 'date' ? rows.length : staffCards.length;
  const shown = mode === 'date' ? visibleRows.length : visibleStaff.length;

  // Day sheet + previous / next logged day of the same staff
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

  const selectedNames = staffIds.map((id) => ({ id, name: nameOf(id) }));

  return (
    <div className="relative flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      {notice}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
        <div ref={listTopRef} className="px-4 pt-4">
          <p className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
            Reports <ChevronRight className="w-3 h-3" /> <span className="text-slate-600">Timesheets</span>
          </p>
          <div className="mt-0.5 flex items-center justify-between gap-3">
            <h1 className="text-2xl font-extrabold leading-tight">Timesheets</h1>
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

          {/* Period stepper + filters */}
          <div className="mt-3 flex items-center gap-2.5">
            <div className="flex-1 min-w-0 h-11 bg-white border border-slate-200 rounded-xl shadow-2xs flex items-center">
              <button
                type="button"
                onClick={() => applyFilters({ ...filters, range: shiftRange(-1) })}
                aria-label="Previous period"
                className="w-10 h-full flex items-center justify-center text-slate-500 active:bg-slate-50 rounded-l-xl shrink-0 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setFilterOpen(true)}
                className="flex-1 min-w-0 h-full flex flex-col items-center justify-center border-x border-slate-100 active:bg-slate-50 cursor-pointer"
                aria-label={`Period ${rangeLabel}. Change period`}
              >
                <span className="text-[12px] font-bold text-[#1E293B] tabular-nums truncate max-w-full px-1">{rangeLabel}</span>
                <span className="text-[10px] font-semibold text-slate-400 truncate max-w-full px-1">
                  {preset ? preset.label : `${len} days`} · {weekdayShort(range.from)} – {weekdayShort(range.to)}
                </span>
              </button>
              <button
                type="button"
                onClick={() => applyFilters({ ...filters, range: shiftRange(1) })}
                disabled={!canNext}
                aria-label="Next period"
                className="w-10 h-full flex items-center justify-center text-slate-500 active:bg-slate-50 rounded-r-xl disabled:text-slate-200 disabled:cursor-not-allowed shrink-0 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <FilterIconButton count={filterCount} onClick={() => setFilterOpen(true)} />
          </div>

          {filterCount > 0 && (
            <div className="mt-2.5 flex items-center gap-2">
              <div className="flex-1 min-w-0 flex gap-1.5 overflow-x-auto no-scrollbar">
                {selectedNames.length === 0 ? (
                  <span className="text-[11px] text-slate-500 py-1">Custom period · all staff</span>
                ) : (
                  <>
                    {selectedNames.slice(0, 3).map(({ id, name }) => (
                      <span key={id} className="shrink-0 h-7 pl-2.5 pr-1 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[11px] font-semibold text-[#1D4ED8] flex items-center gap-1">
                        {name}
                        <button
                          type="button"
                          onClick={() => applyFilters({ ...filters, staffIds: staffIds.filter((x) => x !== id) })}
                          aria-label={`Remove ${name}`}
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[#2F68FE] active:bg-blue-100 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    {selectedNames.length > 3 && (
                      <button
                        type="button"
                        onClick={() => setFilterOpen(true)}
                        className="shrink-0 h-7 px-2.5 rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600 cursor-pointer"
                      >
                        +{selectedNames.length - 3} more
                      </button>
                    )}
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => applyFilters({ range: defaultTimesheetRange(), staffIds: [] })}
                className="shrink-0 text-[11px] font-bold text-[#2F68FE] cursor-pointer"
              >
                Clear All
              </button>
            </div>
          )}
        </div>

        <div className="px-4 mt-4">
          {loading ? (
            <TimesheetListSkeleton />
          ) : rows.length === 0 ? (
            <EmptyCard
              icon={CalendarClock}
              title={staff.length === 0 ? 'No staff hired yet.' : 'No timesheets for this period.'}
              text={
                staff.length === 0
                  ? 'Timesheets of your offshore staff will show up here.'
                  : 'Hours show up once staff log their timesheets. Try an earlier period or other staff.'
              }
              action={
                staff.length > 0 && (
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => applyFilters({ ...filters, range: shiftRange(-1) })}
                      className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-bold active:bg-slate-50 cursor-pointer"
                    >
                      Previous Period
                    </button>
                    {filterCount > 0 && (
                      <button
                        type="button"
                        onClick={() => applyFilters({ range: defaultTimesheetRange(), staffIds: [] })}
                        className="h-10 px-4 rounded-xl bg-[#EEF2FF] text-[#2F68FE] text-xs font-bold active:bg-[#E0E7FF] cursor-pointer"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                )
              }
            />
          ) : (
            <>
              {/* Period summary */}
              <Card className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-slate-500">Working Hours</p>
                    <p className="mt-0.5 leading-none">
                      <span className="text-[26px] font-extrabold tabular-nums text-[#1E293B]">{formatHm(working)}</span>
                      <span className="ml-1 text-xs font-semibold text-slate-400">hrs</span>
                    </p>
                    {showAvailable ? (
                      <p className="mt-1.5 text-[11px] text-slate-500">
                        of <span className="font-bold text-slate-700 tabular-nums">{formatHm(available)}</span> available hrs
                        {available > 0 && (
                          <span className={`ml-1.5 font-bold ${working >= available ? 'text-[#D97706]' : 'text-slate-400'}`}>
                            {working >= available ? `+${formatHm(working - available)} extra` : `${formatHm(available - working)} under`}
                          </span>
                        )}
                      </p>
                    ) : (
                      <p className="mt-1.5 text-[11px] text-slate-500">{rangeLabel}</p>
                    )}
                  </div>
                  {showAvailable && <UtilizationRing pct={pct} />}
                </div>
                <dl className="mt-3.5 grid grid-cols-3 rounded-xl bg-slate-50 border border-slate-100 divide-x divide-slate-100">
                  <SummaryStat label="Staff" value={String(loggedStaff)} />
                  <SummaryStat label="Days Logged" value={String(loggedDays)} />
                  <SummaryStat label="Avg / Day" value={`${formatHm(rows.length ? working / rows.length : 0)}`} />
                </dl>
              </Card>

              <div className="mt-4">
                <SegmentedTabs
                  options={VIEW_OPTIONS}
                  value={mode}
                  onChange={(m) => {
                    setMode(m);
                    setPages(1);
                  }}
                  ariaLabel="Group timesheets"
                />
              </div>

              {mode === 'date' ? (
                <div className="mt-4 space-y-4">
                  {dayGroups.map((g) => {
                    const t = dayTotals.get(g.date);
                    return (
                      <section key={g.date} aria-label={dayHeading(g.date)}>
                        <div className="mb-2 px-1 flex items-center justify-between gap-2">
                          <h3 className="text-[13px] font-bold text-[#1E293B]">{dayHeading(g.date)}</h3>
                          <span className="text-[11px] text-slate-500 tabular-nums">
                            {t?.staff} staff · <span className="font-bold text-slate-700">{formatHm(t?.seconds ?? 0)}</span> hrs
                          </span>
                        </div>
                        <Card className="divide-y divide-slate-100 overflow-hidden">
                          {g.rows.map((r) => {
                            const m = memberOf(r.staffId);
                            return (
                              <button
                                key={r.id}
                                type="button"
                                onClick={() => openRow(r)}
                                disabled={!canView}
                                aria-label={`${m?.name}, ${formatHm(r.workingSeconds)} working hours. View entries`}
                                className="w-full p-3.5 flex items-center gap-3 text-left active:bg-slate-50 disabled:active:bg-transparent transition-colors cursor-pointer disabled:cursor-default"
                              >
                                <StaffAvatar name={m?.name ?? '?'} tint={tintOf(r.staffId)} />
                                <span className="flex-1 min-w-0">
                                  <span className="flex items-baseline justify-between gap-2">
                                    <span className="text-[13px] font-bold text-[#1E293B] truncate">{m?.name}</span>
                                    <span className="text-[13px] font-extrabold text-[#1E293B] tabular-nums whitespace-nowrap">
                                      {formatHm(r.workingSeconds)}
                                      {showAvailable && (
                                        <span className="text-[11px] font-medium text-slate-400"> / {formatHm(r.availableSeconds)}</span>
                                      )}
                                    </span>
                                  </span>
                                  <span className="mt-0.5 flex items-center justify-between gap-2 text-[11px] text-slate-500">
                                    <span className="truncate">{m?.designation}</span>
                                    <span className="whitespace-nowrap">
                                      {r.entries.length} {r.entries.length === 1 ? 'entry' : 'entries'}
                                    </span>
                                  </span>
                                  {showAvailable && <HoursBar working={r.workingSeconds} available={r.availableSeconds} className="mt-2" />}
                                </span>
                                {canView && <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />}
                              </button>
                            );
                          })}
                        </Card>
                      </section>
                    );
                  })}
                </div>
              ) : (
                <ul className="mt-4 space-y-3">
                  {visibleStaff.map(({ member: m, rows: own, byDate }) => {
                    const w = sum(own, 'workingSeconds');
                    const a = sum(own, 'availableSeconds');
                    const p = utilizationPct(w, a);
                    return (
                      <li key={m.id}>
                        <Card className="p-3.5">
                          <div className="flex items-center gap-3">
                            <StaffAvatar name={m.name} tint={tintOf(m.id)} />
                            <span className="flex-1 min-w-0">
                              <span className="block text-[13px] font-bold text-[#1E293B] truncate">{m.name}</span>
                              <span className="block text-[11px] text-slate-500 truncate">{m.designation}</span>
                            </span>
                            {showAvailable && own.length > 0 && (
                              <span className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold tabular-nums ${utilizationTone(p).pill}`}>{p}%</span>
                            )}
                          </div>

                          {own.length === 0 ? (
                            <p className="mt-3 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11.5px] text-slate-500">
                              No timesheets logged in this period.
                            </p>
                          ) : (
                            <>
                              <div className="mt-3 flex items-baseline justify-between gap-2">
                                <span className="text-[11px] text-slate-500">
                                  Working <span className="text-[13px] font-extrabold text-[#1E293B] tabular-nums">{formatHm(w)}</span> hrs
                                </span>
                                {showAvailable && (
                                  <span className="text-[11px] text-slate-500 tabular-nums">
                                    of <span className="font-bold text-slate-700">{formatHm(a)}</span> available
                                  </span>
                                )}
                              </div>
                              {showAvailable && <HoursBar working={w} available={a} className="mt-1.5" />}
                              <div className="mt-3 grid grid-cols-7 gap-1.5">
                                {rangeDates.map((date) => {
                                  const r = byDate.get(date);
                                  const d = parseIso(date);
                                  const head = (
                                    <>
                                      <span className="text-[9px] font-semibold uppercase opacity-70">{weekdayShort(date).slice(0, 2)}</span>
                                      <span className="text-[12px] font-extrabold leading-none tabular-nums">{String(d.getDate()).padStart(2, '0')}</span>
                                    </>
                                  );
                                  if (!r) {
                                    return (
                                      <span
                                        key={date}
                                        className="h-[54px] rounded-lg bg-slate-50 border border-dashed border-slate-200 text-slate-300 flex flex-col items-center justify-center gap-0.5"
                                        aria-label={`${dayHeading(date)}: no timesheet`}
                                      >
                                        {head}
                                        <span className="text-[9.5px] font-semibold">–</span>
                                      </span>
                                    );
                                  }
                                  const over = showAvailable && r.workingSeconds > r.availableSeconds;
                                  return (
                                    <button
                                      key={date}
                                      type="button"
                                      onClick={() => openRow(r)}
                                      disabled={!canView}
                                      aria-label={`${dayHeading(date)}: ${formatHm(r.workingSeconds)} hours`}
                                      className={`h-[54px] rounded-lg border flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer disabled:cursor-default ${
                                        over
                                          ? 'bg-[#FEF8E7] border-[#FDE68A] text-[#B45309] active:bg-amber-100'
                                          : 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1D4ED8] active:bg-blue-100'
                                      }`}
                                    >
                                      {head}
                                      <span className="text-[9.5px] font-bold tabular-nums">{formatHm(r.workingSeconds)}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </>
                          )}
                        </Card>
                      </li>
                    );
                  })}
                </ul>
              )}

              {mode === 'staff' && showAvailable && staffCards.length > 0 && (
                <p className="mt-3 px-1 flex items-center gap-3 text-[10.5px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#EFF6FF] border border-[#BFDBFE]" /> Logged
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#FEF8E7] border border-[#FDE68A]" /> Extra hours
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-slate-50 border border-dashed border-slate-300" /> No timesheet
                  </span>
                </p>
              )}

              {shown < total && (
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
                  {moreLoading ? 'Loading…' : `Load More (${total - shown})`}
                </button>
              )}

              {shown >= total && total > 0 && (
                <p className="mt-4 text-center text-[11px] text-slate-400 tabular-nums">
                  Showing all {total} {mode === 'date' ? (total === 1 ? 'record' : 'records') : 'staff'}
                </p>
              )}
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
        member={sheetRow ? memberOf(sheetRow.staffId) : undefined}
        tint={sheetRow ? tintOf(sheetRow.staffId) : 0}
        showAvailable={showAvailable}
        canDownload={canDownload}
        onPrev={sheetIdx > 0 ? () => setSheet({ rowId: sheetSiblings[sheetIdx - 1].id, open: true }) : undefined}
        onNext={sheetIdx >= 0 && sheetIdx < sheetSiblings.length - 1 ? () => setSheet({ rowId: sheetSiblings[sheetIdx + 1].id, open: true }) : undefined}
        onDownload={downloadDay}
        onClose={() => setSheet((s) => ({ ...s, open: false }))}
      />
    </div>
  );
};
