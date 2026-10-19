import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, ClipboardList, GraduationCap, Laptop, Loader2, MessageSquareText, Plus, SearchX } from 'lucide-react';
import { FilterIconButton } from '../../common/TeamFilterSheet';
import { useClientPermission } from '../context/ClientPermissionContext';
import { Card, EmptyCard, SearchField } from '../staff/tabs/StaffTabParts';
import { StaffAvatar, StaffSkeleton } from '../staff/ClientStaffParts';
import { useTimesheetNotice } from '../timesheets/TimesheetParts';
import { isoOfDate } from '../data/clientInterviewsData';
import type { ClientStaffMember } from '../data/clientStaffData';
import {
  EMPTY_TNI_FILTERS,
  TNI_STATUSES,
  TNI_STATUS_LABEL,
  TniDraft,
  TniFilters,
  TniRequest,
  TniStatus,
  formatTniDate,
  tniFilterCount,
  tniPickableStaff,
} from '../data/clientTrainingNeedData';
import { TrainingNeedFilterSheet } from './TrainingNeedFilterSheet';
import { TrainingNeedFormView } from './TrainingNeedFormView';
import { TniChips, TniProgress, TniStatusChips, TniStatusPill } from './TrainingNeedParts';
import { TrainingNeedNotesSheet, TrainingNeedSoftwareSheet } from './TrainingNeedSheets';

interface Props {
  requests: TniRequest[];
  staff: ClientStaffMember[];
  /** Requests live in ClientApp so changes are kept while switching modules */
  onChange: (next: TniRequest[]) => void;
}

type StatusChip = 'All' | TniStatus;
const STATUS_CHIPS: StatusChip[] = ['All', ...TNI_STATUSES];
const chipLabel = (c: StatusChip) => (c === 'All' ? 'All' : TNI_STATUS_LABEL[c]);

const PAGE_SIZE = 10;
/** Desktop loads the table by ajax */
const LOAD_MS = 600;

type Sheet = 'filter' | 'software' | 'notes' | null;

const ListSkeleton: React.FC = () => (
  <div className="space-y-3" aria-busy="true" aria-label="Loading TNI requests">
    {[0, 1, 2].map((i) => (
      <div key={i} className="bg-white border border-[#EBF0F7] rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-3">
          <StaffSkeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <StaffSkeleton className="w-32 h-3.5" />
            <StaffSkeleton className="w-44 h-3" />
          </div>
        </div>
        <StaffSkeleton className="w-full h-20 rounded-xl" />
      </div>
    ))}
  </div>
);

/** Programme / topic summary used for the card title and the Notes header */
const trainingLabel = (r: TniRequest) => r.mainProgramme || r.trainingNames[0] || r.software[0] || 'TNI Request';

/**
 * Learning & Development › Training Need Identification (desktop `learnings&task=trainingrequest`): the client's TNI
 * Requests for staff with Staff Name / Requested On / Status / Completed On filters, the software list, Notes with the
 * L&D team, and the Add TNI Request form.
 */
export const ClientTrainingNeedView: React.FC<Props> = ({ requests, staff, onChange }) => {
  // `cls-add` = TNI Request button, `cls-comment` = sending a note; the rest is read-only
  const { add: canAdd, edit: canNote } = useClientPermission('training-need');
  const [notice, showNotice] = useTimesheetNotice();
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [chip, setChip] = useState<StatusChip>('All');
  const [filters, setFilters] = useState<TniFilters>(EMPTY_TNI_FILTERS);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [pages, setPages] = useState(1);
  const [moreLoading, setMoreLoading] = useState(false);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const listScroll = useRef(0);

  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setLoading(false), LOAD_MS);
    return () => clearTimeout(t);
  }, [loading]);

  useEffect(() => {
    if (!adding && listRef.current) listRef.current.scrollTop = listScroll.current;
  }, [adding]);

  const sortedStaff = useMemo(() => [...staff].sort((a, b) => a.name.localeCompare(b.name)), [staff]);
  const memberOf = (id: string) => staff.find((s) => s.id === id);
  // Same avatar colour as My Staff
  const tintOf = (id: string) => sortedStaff.findIndex((s) => s.id === id);

  const term = query.trim().toLowerCase();
  const base = requests.filter((r) => {
    const m = memberOf(r.staffId);
    if (term) {
      const haystack = [m?.name, r.mainProgramme, ...r.trainingNames, ...r.subProgrammes, ...r.software].join(' ').toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    if (filters.staff.length && !(m && filters.staff.includes(m.name))) return false;
    if (filters.requestedOn && r.requestedOn !== filters.requestedOn) return false;
    if (filters.completedOn && r.completedOn !== filters.completedOn) return false;
    return true;
  });
  const inChip = (c: StatusChip, r: TniRequest) => c === 'All' || r.status === c;
  // Desktop: newest request first
  const results = base.filter((r) => inChip(chip, r)).sort((a, b) => b.requestedOn.localeCompare(a.requestedOn) || b.id.localeCompare(a.id));
  const visible = results.slice(0, pages * PAGE_SIZE);

  const filterCount = tniFilterCount(filters);
  const isFiltered = filterCount > 0 || term.length > 0 || chip !== 'All';

  const reload = () => {
    setPages(1);
    setLoading(true);
    listRef.current?.scrollTo({ top: 0 });
  };
  const clearAll = () => {
    setQuery('');
    setFilters(EMPTY_TNI_FILTERS);
    setChip('All');
    reload();
  };

  const openAdd = () => {
    listScroll.current = listRef.current?.scrollTop ?? 0;
    setAdding(true);
  };

  const submit = (draft: TniDraft) => {
    const stamp = Date.now();
    const today = isoOfDate(new Date());
    // Desktop saves one request per selected staff; the message becomes the first note
    const created: TniRequest[] = draft.staffIds.map((staffId, i) => ({
      id: `tr-${stamp}-${i}`,
      staffId,
      trainingNames: draft.trainingNames,
      mainProgramme: draft.mainProgramme,
      subProgrammes: draft.subProgrammes,
      software: draft.software,
      requestedOn: today,
      status: 'Pending',
      completedOn: null,
      notes: draft.message ? [{ id: `n-${stamp}-${i}`, author: 'You', mine: true, text: draft.message, createdAt: new Date().toISOString() }] : [],
    }));
    onChange([...created, ...requests]);
    setAdding(false);
    setChip('All');
    showNotice('TNI Request Added Successfully!');
    reload();
  };

  const sendNote = (text: string) => {
    if (!targetId) return;
    const entry = { id: `n-${Date.now()}`, author: 'You', mine: true, text, createdAt: new Date().toISOString() };
    onChange(requests.map((r) => (r.id === targetId ? { ...r, notes: [entry, ...r.notes] } : r)));
  };

  const openSheet = (next: Exclude<Sheet, null>, id: string | null = null) => {
    setTargetId(id);
    setSheet(next);
  };

  /* ---------- Add TNI Request ---------- */
  if (adding) {
    return <TrainingNeedFormView staff={tniPickableStaff(staff)} onBack={() => setAdding(false)} onSubmit={submit} />;
  }

  const target = targetId ? requests.find((r) => r.id === targetId) ?? null : null;
  const targetMember = target ? memberOf(target.staffId) : undefined;

  const group = (label: string, children: React.ReactNode) => (
    <div className="min-w-0">
      <p className="mb-1.5 text-[9.5px] font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
      {children}
    </div>
  );

  const card = (r: TniRequest) => {
    const m = memberOf(r.staffId);
    return (
      <li key={r.id}>
        <Card className="overflow-hidden">
          <div className="p-3.5 flex items-center gap-3">
            {m && <StaffAvatar name={m.name} tint={tintOf(m.id)} />}
            <span className="flex-1 min-w-0">
              <span className="block text-[13.5px] font-bold text-[#1E293B] truncate">{m?.name ?? 'Staff'}</span>
              <span className="block text-[11.5px] text-slate-500 truncate">{m?.designation}</span>
            </span>
            <TniStatusPill status={r.status} />
          </div>

          <div className="px-3.5 pb-3.5 pt-3 border-t border-slate-100 space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-[#EFF6FF] text-[#2F68FE] flex items-center justify-center shrink-0">
                <GraduationCap className="w-[18px] h-[18px]" />
              </span>
              <span className="min-w-0">
                <span className="block text-[9.5px] font-semibold text-slate-400 uppercase tracking-wide">Main Training Programme</span>
                <span className="block text-[13px] font-bold leading-snug">{r.mainProgramme || <span className="text-slate-400">-</span>}</span>
              </span>
            </div>
            {r.subProgrammes.length > 0 && group('Sub Training Programme', <TniChips values={r.subProgrammes} />)}
            {r.trainingNames.length > 0 && group('Training Name', <TniChips values={r.trainingNames} tone="blue" />)}
          </div>

          <div className="mx-3.5 mb-3.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <TniProgress status={r.status} requestedOn={r.requestedOn} completedOn={r.completedOn} formatDate={formatTniDate} />
          </div>

          <div className="px-3.5 py-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
            {r.software.length ? (
              <button
                type="button"
                onClick={() => openSheet('software', r.id)}
                aria-label={`View ${r.software.length} software for ${m?.name ?? 'staff'}`}
                className="h-9 px-3 rounded-xl bg-[#EFF6FF] text-[#2F68FE] text-xs font-bold flex items-center gap-1.5 active:bg-[#DBEAFE] cursor-pointer"
              >
                <Laptop className="w-4 h-4" />
                {r.software.length} Software
              </button>
            ) : (
              <span className="text-[11px] text-slate-400">No software</span>
            )}
            <button
              type="button"
              onClick={() => openSheet('notes', r.id)}
              aria-label={`Notes for ${m?.name ?? 'staff'}`}
              className="h-9 px-3 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold flex items-center gap-1.5 active:bg-slate-50 cursor-pointer"
            >
              <MessageSquareText className="w-4 h-4" />
              Notes
              {r.notes.length > 0 && (
                <span className="min-w-5 h-5 px-1 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 flex items-center justify-center tabular-nums">{r.notes.length}</span>
              )}
            </button>
          </div>
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
            Learning &amp; Development <ChevronRight className="w-3 h-3" /> <span className="text-slate-600">Training Need Identification</span>
          </p>
          <h1 className="mt-0.5 text-2xl font-extrabold leading-tight">Training Need Identification</h1>

          <div className="mt-2 flex items-center justify-between gap-3 min-h-9">
            <span className="text-xs font-semibold text-slate-500 tabular-nums">{loading ? '' : `${results.length} request${results.length === 1 ? '' : 's'}`}</span>
            {canAdd && (
              <button
                type="button"
                onClick={openAdd}
                className="h-9 px-3 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center gap-1.5 active:bg-[#1D4ED8] shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                TNI Request
              </button>
            )}
          </div>

          <div className="mt-2 flex items-center gap-2.5">
            <div className="flex-1 min-w-0">
              <SearchField
                value={query}
                onChange={(v) => {
                  setQuery(v);
                  setPages(1);
                }}
                placeholder="Search by staff, programme or software"
              />
            </div>
            <FilterIconButton count={filterCount} onClick={() => openSheet('filter')} />
          </div>

          <div className="mt-3">
            <TniStatusChips
              options={STATUS_CHIPS}
              value={chip}
              onChange={(c) => {
                if (c === chip) return;
                setChip(c);
                reload();
              }}
              labelOf={chipLabel}
              counts={Object.fromEntries(STATUS_CHIPS.map((c) => [c, base.filter((r) => inChip(c, r)).length])) as Record<StatusChip, number>}
            />
          </div>

          {isFiltered && !loading && (
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                {chip === 'All' ? 'All statuses' : chipLabel(chip)}
                {filterCount > 0 && ` · ${filterCount} ${filterCount === 1 ? 'filter' : 'filters'}`}
              </span>
              <button type="button" onClick={clearAll} className="text-[11px] font-bold text-[#2F68FE] cursor-pointer">
                Clear All
              </button>
            </div>
          )}
        </div>

        <div className="px-4 mt-3">
          {loading ? (
            <ListSkeleton />
          ) : requests.length === 0 ? (
            <EmptyCard
              icon={ClipboardList}
              title="No Data Found"
              text="TNI requests you raise for your staff will show up here."
              action={
                canAdd ? (
                  <button type="button" onClick={openAdd} className="mt-4 h-10 px-4 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] cursor-pointer">
                    TNI Request
                  </button>
                ) : undefined
              }
            />
          ) : results.length === 0 ? (
            <EmptyCard
              icon={SearchX}
              title="No Data Found"
              text="Try a different staff, status or date."
              action={
                isFiltered ? (
                  <button type="button" onClick={clearAll} className="mt-4 h-10 px-5 rounded-xl bg-[#EEF2FF] text-[#2F68FE] text-xs font-bold active:bg-[#E0E7FF] cursor-pointer">
                    Clear All
                  </button>
                ) : undefined
              }
            />
          ) : (
            <ul className="space-y-3">{visible.map(card)}</ul>
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

      <TrainingNeedFilterSheet
        isOpen={sheet === 'filter'}
        filters={filters}
        staffOptions={Array.from(new Set(requests.map((r) => memberOf(r.staffId)?.name).filter((v): v is string => Boolean(v)))).sort((a, b) => a.localeCompare(b))}
        onClose={() => setSheet(null)}
        onApply={(next) => {
          setFilters(next);
          setSheet(null);
          reload();
        }}
      />
      <TrainingNeedSoftwareSheet isOpen={sheet === 'software'} staffName={targetMember?.name ?? ''} software={target?.software ?? []} onClose={() => setSheet(null)} />
      <TrainingNeedNotesSheet
        isOpen={sheet === 'notes'}
        staffName={targetMember?.name ?? ''}
        trainingLabel={target ? trainingLabel(target) : ''}
        notes={target?.notes ?? []}
        canSend={canNote}
        onSend={sendNote}
        onClose={() => setSheet(null)}
      />
    </div>
  );
};
