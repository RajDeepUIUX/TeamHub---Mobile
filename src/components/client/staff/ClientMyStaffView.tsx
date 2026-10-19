import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, Eye, FileText, Loader2, Search, UsersRound, X } from 'lucide-react';
import { FilterIconButton } from '../../common/TeamFilterSheet';
import { useClientPermission } from '../context/ClientPermissionContext';
import {
  CLIENT_STAFF_STATUSES,
  CURRENT_STAFF_STATUSES,
  ClientStaffMember,
  ClientStaffStatus,
  MY_STAFF_PAGE_SIZE,
  StaffProfileTab,
  formatStaffDate,
  hourlyRateOf,
  staffOptions,
} from '../data/clientStaffData';
import type { StaffWorkMode } from '../data/clientStaffProfileData';
import type { TniRequest } from '../data/clientTrainingNeedData';
import { CLIENT_IS_MOS } from '../data/clientTimesheetsData';
import { ClientStaffFilterSheet, ClientStaffFilters, EMPTY_STAFF_FILTERS, staffFilterCount } from './ClientStaffFilterSheet';
import { STATUS_SHORT, StaffAvatar, StaffSkeleton, StaffStatusPill } from './ClientStaffParts';
import { ClientStaffDetailView } from './ClientStaffDetailView';

/** Status chip: "Current" = desktop default (Active, On Notice, Offboarding, Replacement) */
type StatusChip = 'Current' | ClientStaffStatus;
const STATUS_CHIPS: StatusChip[] = ['Current', ...CLIENT_STAFF_STATUSES];

interface ClientMyStaffViewProps {
  staff: ClientStaffMember[];
  /** Signed-in client contact */
  clientName: string;
  /** Desktop "check timesheet info" action → Reports › Timesheets for that staff; hidden without Timesheets access */
  onOpenTimesheets?: (member: ClientStaffMember) => void;
  /** TNI requests raised for staff (shown on the Training & Development tab) */
  tniRequests?: TniRequest[];
  onOpenTrainingNeed?: () => void;
  /** Work mode chosen in Staff Work Flexibility; overrides the default shown in Work Information */
  workModeOf?: (staffId: string) => StaffWorkMode | undefined;
  /** Opens this staff profile straight away (e.g. from a notification), optionally on a given tab */
  focus?: { staffId: string; tab?: StaffProfileTab } | null;
}

/** Desktop shows a loader while the list reloads */
const LOAD_MS = 600;

const ListSkeleton: React.FC = () => (
  <div className="space-y-3" aria-busy="true" aria-label="Loading staff">
    {[0, 1, 2, 3].map((i) => (
      <div key={i} className="bg-white border border-[#EBF0F7] rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-3">
          <StaffSkeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <StaffSkeleton className="w-32 h-3.5" />
            <StaffSkeleton className="w-44 h-3" />
          </div>
        </div>
        <StaffSkeleton className="w-full h-10 rounded-xl" />
      </div>
    ))}
  </div>
);

export const ClientMyStaffView: React.FC<ClientMyStaffViewProps> = ({ staff, clientName, onOpenTimesheets, tniRequests, onOpenTrainingNeed, workModeOf, focus }) => {
  // `is_view` opens Staff Details
  const { view: canView } = useClientPermission('my-staff');
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusChip, setStatusChip] = useState<StatusChip>('Current');
  const [filters, setFilters] = useState<ClientStaffFilters>(EMPTY_STAFF_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [pages, setPages] = useState(1);
  const [moreLoading, setMoreLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(focus?.staffId ?? null);
  const chipsRef = useRef<HTMLDivElement>(null);
  const listTopRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setLoading(false), LOAD_MS);
    return () => clearTimeout(t);
  }, [loading]);

  useEffect(() => {
    chipsRef.current?.querySelector<HTMLElement>('[aria-pressed="true"]')?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [statusChip]);

  const options = useMemo(
    () => ({
      level: staffOptions(staff, (s) => s.level),
      designation: staffOptions(staff, (s) => s.designation),
      engagementType: staffOptions(staff, (s) => s.engagementType),
      location: staffOptions(staff, (s) => s.location),
    }),
    [staff],
  );

  const sorted = useMemo(() => [...staff].sort((a, b) => a.name.localeCompare(b.name)), [staff]);
  const tintOf = (id: string) => sorted.findIndex((s) => s.id === id);

  // Search + filters apply first; status chips then split that result (counts per chip)
  const term = query.trim().toLowerCase();
  const base = sorted.filter((s) => {
    if (term && !s.name.toLowerCase().includes(term)) return false;
    if (filters.joinedFrom && filters.joinedTo && (s.joiningDate < filters.joinedFrom || s.joiningDate > filters.joinedTo)) return false;
    if (filters.level.length && !filters.level.includes(s.level)) return false;
    if (filters.designation.length && !filters.designation.includes(s.designation)) return false;
    if (filters.engagementType.length && !(s.engagementType && filters.engagementType.includes(s.engagementType))) return false;
    if (filters.location.length && !filters.location.includes(s.location)) return false;
    return true;
  });
  const inChip = (chip: StatusChip, s: ClientStaffMember) => (chip === 'Current' ? CURRENT_STAFF_STATUSES.includes(s.status) : s.status === chip);
  const results = base.filter((s) => inChip(statusChip, s));
  const visible = results.slice(0, pages * MY_STAFF_PAGE_SIZE);

  const filterCount = staffFilterCount(filters);
  const isFiltered = filterCount > 0 || term.length > 0 || statusChip !== 'Current';

  const reload = () => {
    setPages(1);
    setLoading(true);
    listTopRef.current?.scrollIntoView({ block: 'start' });
  };

  const clearAll = () => {
    setQuery('');
    setFilters(EMPTY_STAFF_FILTERS);
    setStatusChip('Current');
    reload();
  };

  const selected = selectedId ? staff.find((s) => s.id === selectedId) : undefined;
  if (selected) {
    return (
      <ClientStaffDetailView
        member={selected}
        tint={tintOf(selected.id)}
        clientName={clientName}
        initialTab={focus?.staffId === selected.id ? focus.tab : undefined}
        tniRequests={tniRequests?.filter((r) => r.staffId === selected.id)}
        onOpenTrainingNeed={onOpenTrainingNeed}
        workModeOverride={workModeOf?.(selected.id)}
        onBack={() => setSelectedId(null)}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
        <div ref={listTopRef} className="px-4 pt-4">
          <p className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
            Human Resources <ChevronRight className="w-3 h-3" /> <span className="text-slate-600">My Staff</span>
          </p>
          <div className="mt-0.5 flex items-end justify-between gap-3 mb-1.5">
            <h1 className="text-xl font-extrabold leading-tight">My Staff</h1>
            {!loading && (
              <span className="pb-1 text-xs font-semibold text-slate-500 tabular-nums">
                {results.length} staff
              </span>
            )}
          </div>

          {/* Search + filters */}
          <div className="mt-3 flex items-center gap-2.5">
            <label className="relative flex-1 min-w-0">
              <span className="sr-only">Search by name</span>
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPages(1);
                }}
                placeholder="Search By Name"
                className="w-full h-11 pl-10 pr-9 bg-white border border-slate-200 rounded-xl text-xs font-medium text-[#1E293B] placeholder:text-slate-400 focus:outline-hidden focus:border-[#2F68FE] focus:ring-4 focus:ring-blue-50 shadow-2xs select-text [&::-webkit-search-cancel-button]:hidden"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </label>
            <FilterIconButton count={filterCount} onClick={() => setFilterOpen(true)} />
          </div>
        </div>

        {/* Status chips */}
        <div ref={chipsRef} className="mt-3 flex gap-1.5 overflow-x-auto no-scrollbar px-4 pb-1" role="group" aria-label="Status">
          {STATUS_CHIPS.map((chip) => {
            const on = chip === statusChip;
            const count = base.filter((s) => inChip(chip, s)).length;
            return (
              <button
                key={chip}
                type="button"
                aria-pressed={on}
                onClick={() => {
                  if (on) return;
                  setStatusChip(chip);
                  reload();
                }}
                className={`shrink-0 h-8 pl-3 pr-1.5 rounded-full text-[11.5px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  on ? 'bg-[#2F68FE] text-white' : 'bg-slate-100 text-slate-600 active:bg-slate-200'
                }`}
              >
                {chip === 'Current' ? 'Current' : STATUS_SHORT[chip]}
                <span
                  className={`min-w-5 h-5 px-1 rounded-full text-[10px] font-bold flex items-center justify-center tabular-nums ${
                    on ? 'bg-white text-[#2F68FE]' : 'bg-white text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {isFiltered && !loading && (
          <div className="px-4 mt-2 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              {statusChip === 'Current' ? 'Active, On Notice, Offboarding & Replacement' : statusChip}
              {filterCount > 0 && ` · ${filterCount} ${filterCount === 1 ? 'filter' : 'filters'}`}
            </span>
            <button type="button" onClick={clearAll} className="text-[11px] font-bold text-[#2F68FE] cursor-pointer">
              Clear All
            </button>
          </div>
        )}

        <div className="px-4 mt-3">
          {loading ? (
            <ListSkeleton />
          ) : results.length === 0 ? (
            <div className="py-12 px-6 flex flex-col items-center text-center bg-white border border-[#EBF0F7] rounded-2xl">
              <span className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                <UsersRound className="w-6 h-6" />
              </span>
              <p className="mt-3 text-sm font-bold">{staff.length === 0 ? 'No staff hired yet.' : 'No staff match your search.'}</p>
              <p className="mt-1 text-xs text-slate-500">
                {staff.length === 0 ? 'Hired staff will show up here.' : 'Try a different name, status or filter.'}
              </p>
              {staff.length > 0 && isFiltered && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="mt-4 h-10 px-5 rounded-xl bg-[#EEF2FF] text-[#2F68FE] text-xs font-bold active:bg-[#E0E7FF] cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>
          ) : (
            <ul className="space-y-3">
              {visible.map((s) => (
                <li key={s.id} className="bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setSelectedId(s.id)}
                    disabled={!canView}
                    aria-label={`View ${s.name}`}
                    className="w-full p-3.5 pb-3 flex items-center gap-3 text-left active:bg-slate-50 disabled:active:bg-transparent transition-colors cursor-pointer disabled:cursor-default"
                  >
                    <StaffAvatar name={s.name} tint={tintOf(s.id)} />
                    <span className="flex-1 min-w-0">
                      <span className="block text-[13.5px] font-bold text-[#2F68FE] truncate">{s.name}</span>
                      <span className="block text-[11.5px] text-slate-500 break-words">{s.designation}</span>
                    </span>
                    <StaffStatusPill status={s.status} />
                  </button>

                  <dl className="mx-3.5 grid grid-cols-3 rounded-xl bg-slate-50 border border-slate-100 divide-x divide-slate-100">
                    {[
                      ['Level', s.level],
                      ['Joining Date', formatStaffDate(s.joiningDate)],
                      ['Location', s.location],
                    ].map(([label, value]) => (
                      <div key={label} className="px-2.5 py-2 min-w-0">
                        <dt className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wide truncate">{label}</dt>
                        <dd className="mt-0.5 text-[11.5px] font-semibold text-[#1E293B] truncate tabular-nums">{value}</dd>
                      </div>
                    ))}
                  </dl>
                  {!CLIENT_IS_MOS && (
                    <dl className="mx-3.5 mt-2 grid grid-cols-2 rounded-xl bg-slate-50 border border-slate-100 divide-x divide-slate-100">
                      {[
                        ['Committed Hrs / Week', `${s.committedHours} hrs`],
                        ['Rate / Hr', `$${hourlyRateOf(s).toFixed(2)}`],
                      ].map(([label, value]) => (
                        <div key={label} className="px-2.5 py-2 min-w-0">
                          <dt className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wide truncate">{label}</dt>
                          <dd className="mt-0.5 text-[11.5px] font-semibold text-[#1E293B] truncate tabular-nums">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  )}

                  <div className="px-3.5 py-2.5 flex items-center gap-2">
                    <span className="flex-1 min-w-0 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                      {s.engagementType && (
                        <span className="px-2 py-0.5 rounded-md bg-[#EFF6FF] text-[#1D4ED8] font-semibold inline-flex items-center">{s.engagementType}</span>
                      )}
                      <span className="truncate">
                        Add. availability:{' '}
                        <span className="font-semibold text-slate-600">{s.additionalAvailability ? `${s.additionalAvailability} hrs/week` : '--'}</span>
                      </span>
                    </span>
                    {canView && (
                    <button
                      type="button"
                      onClick={() => setSelectedId(s.id)}
                      aria-label={`View details of ${s.name}`}
                      title="View details"
                      className="w-9 h-9 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] text-[#2F68FE] flex items-center justify-center active:bg-blue-100 shrink-0 cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    )}
                    {onOpenTimesheets && (
                    <button
                      type="button"
                      onClick={() => onOpenTimesheets(s)}
                      aria-label={`Timesheets of ${s.name}`}
                      title="Timesheets"
                      className="w-9 h-9 rounded-xl border border-slate-200 text-slate-500 flex items-center justify-center active:bg-slate-50 shrink-0 cursor-pointer"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {!loading && visible.length < results.length && (
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
        </div>
      </div>

      <ClientStaffFilterSheet
        isOpen={filterOpen}
        filters={filters}
        options={options}
        onClose={() => setFilterOpen(false)}
        onApply={(next) => {
          setFilters(next);
          setFilterOpen(false);
          reload();
        }}
      />
    </div>
  );
};
