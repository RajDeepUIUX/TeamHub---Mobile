import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BriefcaseBusiness, CalendarDays, Clock, Eye, FileText, Layers, Loader2, MapPin, Search, UsersRound, X } from 'lucide-react';
import { FilterIconButton } from '../../common/TeamFilterSheet';
import { useClientPermission } from '../context/ClientPermissionContext';
import {
  ClientStaffMember,
  MY_STAFF_PAGE_SIZE,
  StaffProfileTab,
  formatStaffDate,
  staffOptions,
} from '../data/clientStaffData';
import type { StaffWorkMode } from '../data/clientStaffProfileData';
import type { TniRequest } from '../data/clientTrainingNeedData';
import { ClientStaffFilterSheet, ClientStaffFilters, EMPTY_STAFF_FILTERS, staffFilterCount } from './ClientStaffFilterSheet';
import { StaffAvatar, StaffSkeleton, StaffStatusPill } from './ClientStaffParts';
import { ClientStaffDetailView, StaffProfileEdits } from './ClientStaffDetailView';
import type { AmendRequest } from '../data/clientAttendanceData';
import { DesignVersion, ScreenHeader } from './tabs/StaffTabParts';

const DESIGN_VERSIONS = ['V1', 'V2'] as const;

type ListKey = 'level' | 'designation' | 'engagementType' | 'location';
const LIST_LABELS: Record<ListKey, string> = { level: 'Level', designation: 'Designation', engagementType: 'Engagement Type', location: 'Location' };

interface ClientMyStaffViewProps {
  staff: ClientStaffMember[];
  /** Signed-in client contact */
  clientName: string;
  /** Desktop "check timesheet info" action → Reports › Timesheets for that staff; hidden without Timesheets access */
  onOpenTimesheets?: (member: ClientStaffMember) => void;
  /** TNI requests raised for staff (shown on the Training & Development tab) */
  tniRequests?: TniRequest[];
  /** Training Need Identification, opened from this staff profile (Back returns to it) */
  onOpenTrainingNeed?: (staffId: string) => void;
  /** Work mode chosen in Staff Work Flexibility; overrides the default shown in Work Information */
  workModeOf?: (staffId: string) => StaffWorkMode | undefined;
  /** Opens this staff profile straight away (e.g. from a notification), optionally on a given tab */
  focus?: { staffId: string; tab?: StaffProfileTab } | null;
  /** Attendance Amend requests (approved ones show in Staff Details › Attendance & Leave) */
  amends?: AmendRequest[];
  /** Reporting To / SOP changes per staff id, kept in ClientApp */
  staffEdits?: Record<string, StaffProfileEdits>;
  onStaffEdit?: (staffId: string, patch: StaffProfileEdits) => void;
  /** Header back arrow (Dashboard) */
  onBack?: () => void;
}

/** Desktop shows a loader while the list reloads */
const LOAD_MS = 600;

const ListSkeleton: React.FC = () => (
  <div className="space-y-3" aria-busy="true" aria-label="Loading staff">
    {[0, 1, 2, 3].map((i) => (
      <div key={i} className="bg-white border border-[#EBF0F7] rounded-2xl p-4 space-y-3 shadow-2xs">
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

export const ClientMyStaffView: React.FC<ClientMyStaffViewProps> = ({ staff, clientName, onOpenTimesheets, tniRequests, onOpenTrainingNeed, workModeOf, focus, amends, staffEdits, onStaffEdit, onBack }) => {
  // `is_view` opens Staff Details
  const { view: canView } = useClientPermission('my-staff');
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<ClientStaffFilters>(EMPTY_STAFF_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [pages, setPages] = useState(1);
  const [moreLoading, setMoreLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(focus?.staffId ?? null);
  // Shared by the list and Staff Details
  const [version, setVersion] = useState<DesignVersion>('V1');
  const v2 = version === 'V2';
  const listTopRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setLoading(false), LOAD_MS);
    return () => clearTimeout(t);
  }, [loading]);

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

  const term = query.trim().toLowerCase();
  const base = sorted.filter((s) => {
    if (term && !s.name.toLowerCase().includes(term)) return false;
    if (filters.joinedFrom && filters.joinedTo && (s.joiningDate < filters.joinedFrom || s.joiningDate > filters.joinedTo)) return false;
    if (filters.level.length && !filters.level.includes(s.level)) return false;
    if (filters.designation.length && !filters.designation.includes(s.designation)) return false;
    if (filters.engagementType.length && !(s.engagementType && filters.engagementType.includes(s.engagementType))) return false;
    if (filters.location.length && !filters.location.includes(s.location)) return false;
    return filters.status.includes(s.status);
  });
  const results = base;
  const visible = results.slice(0, pages * MY_STAFF_PAGE_SIZE);

  const filterCount = staffFilterCount(filters);
  const isFiltered = filterCount > 0 || term.length > 0;

  // Applied filter values shown under the search bar, like the desktop filter bar
  const applied: { key: string; label: string; remove: () => void }[] = [
    ...(filters.joinedFrom && filters.joinedTo
      ? [{ key: 'date', label: `Joining Date: ${formatStaffDate(filters.joinedFrom)} – ${formatStaffDate(filters.joinedTo)}`, remove: () => setFilters((f) => ({ ...f, joinedFrom: null, joinedTo: null })) }]
      : []),
    ...(Object.keys(LIST_LABELS) as ListKey[]).flatMap((k) =>
      filters[k].map((v) => ({ key: `${k}-${v}`, label: `${LIST_LABELS[k]}: ${v}`, remove: () => setFilters((f) => ({ ...f, [k]: f[k].filter((x) => x !== v) })) })),
    ),
    // Status only shows when it differs from the desktop default (current staff)
    ...(staffFilterCount({ ...EMPTY_STAFF_FILTERS, status: filters.status }) > 0
      ? [{ key: 'status', label: `Status: ${filters.status.join(', ')}`, remove: () => setFilters((f) => ({ ...f, status: EMPTY_STAFF_FILTERS.status })) }]
      : []),
  ];

  const reload = () => {
    setPages(1);
    setLoading(true);
    listTopRef.current?.scrollIntoView({ block: 'start' });
  };

  const clearAll = () => {
    setQuery('');
    setFilters(EMPTY_STAFF_FILTERS);
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
        onOpenTrainingNeed={onOpenTrainingNeed ? () => onOpenTrainingNeed(selected.id) : undefined}
        workModeOverride={workModeOf?.(selected.id)}
        amends={amends}
        edits={staffEdits?.[selected.id]}
        onEdit={onStaffEdit ? (patch) => onStaffEdit(selected.id, patch) : undefined}
        onBack={() => setSelectedId(null)}
      />
    );
  }

  const searchBox = (
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
        className={`w-full h-11 pl-10 pr-9 border rounded-xl text-xs font-medium text-[#1E293B] placeholder:text-slate-400 focus:outline-hidden focus:border-[#2F68FE] focus:ring-4 focus:ring-blue-50 select-text [&::-webkit-search-cancel-button]:hidden ${
          'bg-slate-50 border-slate-200 focus:bg-white'
        }`}
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
  );

  // Applied filters (desktop filter bar values)
  const appliedRow = (applied.length > 0 || isFiltered) && (
    <div className="mt-3 px-4 flex items-start gap-2">
      <div className="flex-1 min-w-0 flex gap-1.5 overflow-x-auto no-scrollbar pb-1" aria-label="Applied filters">
        {applied.map((a) => (
          <span
            key={a.key}
            className="shrink-0 h-7 pl-2.5 pr-1.5 rounded-full bg-[#EEF2FF] text-[11px] font-semibold text-[#2F68FE] flex items-center gap-1 max-w-[260px]"
          >
            <span className="truncate">{a.label}</span>
            <button
              type="button"
              onClick={() => {
                a.remove();
                reload();
              }}
              aria-label={`Remove ${a.label}`}
              className="w-4 h-4 rounded-full bg-white/80 flex items-center justify-center cursor-pointer"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        ))}
      </div>
      {isFiltered && (
        <button type="button" onClick={clearAll} className="shrink-0 h-7 text-[11px] font-bold text-[#2F68FE] cursor-pointer">
          Clear All
        </button>
      )}
    </div>
  );

  const emptyState = (
    <div className="py-12 px-6 flex flex-col items-center text-center bg-white border border-[#EBF0F7] rounded-2xl">
      <span className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
        <UsersRound className="w-6 h-6" />
      </span>
      <p className="mt-3 text-sm font-bold">{staff.length === 0 ? 'No staff hired yet.' : 'No staff match your search.'}</p>
      <p className="mt-1 text-xs text-slate-500">{staff.length === 0 ? 'Hired staff will show up here.' : 'Try a different name, status or filter.'}</p>
      {staff.length > 0 && isFiltered && (
        <button
          type="button"
          onClick={clearAll}
          className={`mt-4 h-10 px-5 rounded-xl text-[#2F68FE] text-xs font-bold cursor-pointer ${
            v2 ? 'bg-[#EEF2FF] active:bg-[#E0E7FF]' : 'active:bg-blue-50/50'
          }`}
        >
          Clear All
        </button>
      )}
    </div>
  );

  const loadMore = !loading && visible.length < results.length && (
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
      className="mt-3 w-full h-11 rounded-xl border border-slate-200 bg-white text-xs font-bold text-[#2F68FE] flex items-center justify-center gap-2 disabled:cursor-wait active:bg-slate-50 transition-colors cursor-pointer"
    >
      {moreLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {moreLoading ? 'Loading…' : `Load More (${results.length - visible.length})`}
    </button>
  );

  /* ---------- Card (V1) ---------- */

  const card = (s: ClientStaffMember) => (
    <li key={s.id} className="bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs overflow-hidden">
      <div className="p-3.5 space-y-3">
        <button
          type="button"
          onClick={() => setSelectedId(s.id)}
          disabled={!canView}
          aria-label={`View ${s.name}`}
          className="w-full rounded-xl flex items-start gap-3 text-left active:opacity-80 transition-opacity cursor-pointer disabled:cursor-default disabled:active:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]"
        >
          <span className="shrink-0">
            <StaffAvatar name={s.name} tint={tintOf(s.id)} />
          </span>
          <span className="flex-1 min-w-0 pt-0.5">
            <span className="block text-[13px] font-bold text-[#1E293B] leading-5 truncate">{s.name}</span>
            <span className="block text-[11.5px] text-slate-500 leading-4 break-words">{s.designation}</span>
          </span>
          <span className="shrink-0 pt-0.5">
            <StaffStatusPill status={s.status} full />
          </span>
        </button>

        {/* Desktop table columns */}
        <dl className="grid grid-cols-2 gap-2">
          {[
            ['Level', s.level],
            ['Joining Date', formatStaffDate(s.joiningDate)],
            ['Engagement Type', s.engagementType ?? '--'],
            ['Location', s.location],
            ['Additional Availability (Per Week)', s.additionalAvailability ? `${s.additionalAvailability} hrs` : '--'],
          ].map(([label, value], idx) => {
            const lead = idx === 0;
            return (
              <div
                key={label}
                className={`px-2.5 py-2 rounded-xl min-w-0 border ${idx === 4 ? 'col-span-2' : ''} ${
                  lead ? 'bg-[#EEF4FF] border-[#DBE6FE]' : 'bg-slate-50 border-slate-100'
                }`}
              >
                <dt className="text-[10px] font-semibold text-slate-500 truncate">{label}</dt>
                <dd className={`mt-0.5 text-xs font-bold tabular-nums truncate ${lead ? 'text-[#2F68FE]' : 'text-[#1E293B]'}`}>{value}</dd>
              </div>
            );
          })}
        </dl>
      </div>

      {(canView || onOpenTimesheets) && (
        <div className="flex items-center gap-2 px-3.5 pb-3.5">
          {canView && (
            <button
              type="button"
              onClick={() => setSelectedId(s.id)}
              aria-label={`View details of ${s.name}`}
              className="flex-1 min-w-0 h-9 px-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-700 flex items-center justify-center gap-1.5 active:bg-slate-100 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]"
            >
              <Eye className="w-3.5 h-3.5 shrink-0 text-[#2F68FE]" />
              <span className="truncate">View Details</span>
            </button>
          )}
          {onOpenTimesheets && (
            <button
              type="button"
              onClick={() => onOpenTimesheets(s)}
              aria-label={`Timesheets of ${s.name}`}
              className="flex-1 min-w-0 h-9 px-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-700 flex items-center justify-center gap-1.5 active:bg-slate-100 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]"
            >
              <FileText className="w-3.5 h-3.5 shrink-0 text-[#2F68FE]" />
              <span className="truncate">Timesheets</span>
            </button>
          )}
        </div>
      )}
    </li>
  );

  /* ---------- Card (V2): accent rail, identity row, 3-up fact strip, chip row, icon action pair ---------- */

  const cardV2 = (s: ClientStaffMember) => (
    <li key={s.id}>
      <article className="relative bg-white rounded-[20px] border border-[#EBF0F7] shadow-[0_2px_8px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="px-3.5 pt-3.5 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSelectedId(s.id)}
            disabled={!canView}
            aria-label={`View ${s.name}`}
            className="flex-1 min-w-0 flex items-center gap-3 text-left rounded-xl active:opacity-70 disabled:active:opacity-100 cursor-pointer disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]"
          >
            <StaffAvatar name={s.name} tint={tintOf(s.id)} />
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-bold text-[#1E293B] leading-snug truncate">{s.name}</span>
              <span className="block text-[11px] text-slate-400 leading-snug break-words">{s.designation}</span>
            </span>
          </button>
          <StaffStatusPill status={s.status} />
        </div>

        {/* Desktop table columns */}
        <dl className="mt-3 mx-3.5 grid grid-cols-3 rounded-xl bg-slate-50/80 border border-slate-100 divide-x divide-slate-100">
          {[
            { icon: Layers, tint: 'bg-[#EEF2FF] text-[#2F68FE]', label: 'Level', value: s.level },
            { icon: CalendarDays, tint: 'bg-[#EEF2FF] text-[#2F68FE]', label: 'Joining Date', value: formatStaffDate(s.joiningDate) },
            { icon: MapPin, tint: 'bg-[#EEF2FF] text-[#2F68FE]', label: 'Location', value: s.location },
          ].map(({ icon: Icon, tint, label, value }) => (
            <div key={label} className="px-2 py-2.5 min-w-0 flex flex-col items-center text-center">
              <span className={`w-7 h-7 rounded-full flex items-center justify-center ${tint}`} aria-hidden="true">
                <Icon className="w-3.5 h-3.5" />
              </span>
              <dt className="mt-1.5 max-w-full text-[10px] font-semibold text-slate-400 truncate">{label}</dt>
              <dd className="mt-0.5 max-w-full text-xs font-bold text-[#1E293B] truncate tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>

        <dl className="px-3.5 pt-2.5 flex flex-wrap gap-1.5">
          <div className="max-w-full h-7 px-2.5 rounded-full bg-[#EFF6FF] text-[#2F68FE] flex items-center gap-1.5 min-w-0">
            <BriefcaseBusiness className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <dt className="text-[11px] font-medium truncate">Engagement Type:</dt>
            <dd className="text-[11px] font-bold shrink-0">{s.engagementType ?? '--'}</dd>
          </div>
          <div className="max-w-full h-7 px-2.5 rounded-full bg-[#EFF6FF] text-[#2F68FE] flex items-center gap-1.5 min-w-0">
            <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <dt className="text-[11px] font-medium truncate">Additional Availability (Per Week):</dt>
            <dd className="text-[11px] font-bold shrink-0 tabular-nums">{s.additionalAvailability ? `${s.additionalAvailability} hrs` : '--'}</dd>
          </div>
        </dl>

        {(canView || onOpenTimesheets) ? (
          <div className="px-3.5 py-3 mt-3 border-t border-slate-100 flex items-center gap-2">
            {onOpenTimesheets && (
              <button
                type="button"
                onClick={() => onOpenTimesheets(s)}
                aria-label={`Timesheets of ${s.name}`}
                className="flex-1 h-9 rounded-xl border border-[#2F68FE] bg-white text-[#2F68FE] text-[11px] font-bold flex items-center justify-center gap-1.5 active:bg-blue-50 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]"
              >
                <FileText className="w-4 h-4 shrink-0" />
                Timesheets
              </button>
            )}
            {canView && (
              <button
                type="button"
                onClick={() => setSelectedId(s.id)}
                aria-label={`View details of ${s.name}`}
                className="flex-1 h-9 rounded-xl bg-[#2F68FE] text-white text-[11px] font-bold flex items-center justify-center gap-1.5 active:bg-[#1D4ED8] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]"
              >
                <Eye className="w-4 h-4 shrink-0" />
                View Details
              </button>
            )}
          </div>
        ) : (
          <div className="pb-3.5" />
        )}
      </article>
    </li>
  );

  const list = loading ? (
    <ListSkeleton />
  ) : results.length === 0 ? (
    emptyState
  ) : (
    <ul className="space-y-3">{visible.map((s) => (v2 ? cardV2(s) : card(s)))}</ul>
  );

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      <ScreenHeader title="My Staff" onBack={onBack} version={{ versions: DESIGN_VERSIONS, value: version, onChange: setVersion }} />
      {v2 ? (
        <>
          {/* Search toolbar pinned under the header */}
          <div className="shrink-0 bg-white px-4 py-3 border-b border-[#EBF0F7] flex items-center gap-2.5">
            {searchBox}
            <FilterIconButton count={filterCount} onClick={() => setFilterOpen(true)} />
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
            <div ref={listTopRef} />
            {appliedRow}
            <div className="px-4 mt-3.5">
              {list}
              {loadMore}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Search + filters pinned under the header */}
          <div className="shrink-0 bg-white px-4 py-3 border-b border-[#EBF0F7] flex items-center gap-2.5">
            {searchBox}
            <FilterIconButton count={filterCount} onClick={() => setFilterOpen(true)} />
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
            <div ref={listTopRef} />
            {appliedRow}
            <div className="px-4 mt-3.5">
              {list}
              {loadMore}
            </div>
          </div>
        </>
      )}

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
