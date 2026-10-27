import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ClipboardList, GraduationCap, Loader2, MessageSquareText, MonitorCog, Plus, SearchX, X } from 'lucide-react';
import { FilterIconButton } from '../../common/TeamFilterSheet';
import { useClientPermission } from '../context/ClientPermissionContext';
import { ScreenHeader, Card, EmptyCard, SearchField } from '../staff/tabs/StaffTabParts';
import { StaffAvatar, StaffSkeleton } from '../staff/ClientStaffParts';
import { useTimesheetNotice } from '../timesheets/TimesheetParts';
import { isoOfDate } from '../data/clientInterviewsData';
import type { ClientStaffMember } from '../data/clientStaffData';
import {
  EMPTY_TNI_FILTERS,
  TNI_STATUS_LABEL,
  TniDraft,
  TniFilters,
  TniRequest,
  formatTniDate,
  tniFilterCount,
  tniPickableStaff,
} from '../data/clientTrainingNeedData';
import { TrainingNeedFilterSheet } from './TrainingNeedFilterSheet';
import { TrainingNeedFormView } from './TrainingNeedFormView';
import { TniStatusPill } from './TrainingNeedParts';
import { TrainingNeedNotesSheet, TrainingNeedSoftwareSheet } from './TrainingNeedSheets';

interface Props {
  requests: TniRequest[];
  staff: ClientStaffMember[];
  /** Requests live in ClientApp so changes are kept while switching modules */
  onChange: (next: TniRequest[]) => void;
  /** Header back arrow (Dashboard) */
  onBack?: () => void;
}

const PAGE_SIZE = 10;
/** Desktop loads the table by ajax */
const LOAD_MS = 600;

type Sheet = 'filter' | 'software' | 'notes' | null;

const ListSkeleton: React.FC = () => (
  <div className="space-y-3" aria-busy="true" aria-label="Loading TNI requests">
    {[0, 1, 2].map((i) => (
      <div key={i} className="bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs overflow-hidden">
        <div className="p-4 space-y-3.5">
          <div className="flex items-center gap-3">
            <StaffSkeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <StaffSkeleton className="w-32 h-3.5" />
              <StaffSkeleton className="w-44 h-3" />
            </div>
          </div>
          <StaffSkeleton className="w-full h-24 rounded-xl" />
        </div>
        <div className="h-11 border-t border-slate-100" />
      </div>
    ))}
  </div>
);

/** Desktop table column label */
const LABEL = 'text-[11px] font-medium text-slate-400';

/** Programme / topic summary used for the Notes header */
const trainingLabel = (r: TniRequest) => r.mainProgramme || r.trainingNames[0] || r.software[0] || 'TNI Request';

/**
 * Learning & Development › Training Need Identification (desktop `learnings&task=trainingrequest`): the client's TNI
 * Requests for staff with the desktop filter bar (Staff Name, Requested On, Status, Completed On) in a drawer, cards
 * labelled like the desktop table, the software list, Notes with the L&D team, and the Add TNI Request form.
 */
export const ClientTrainingNeedView: React.FC<Props> = ({ requests, staff, onChange, onBack }) => {
  // `cls-add` = TNI Request button, `cls-comment` = sending a note; the rest is read-only
  const { add: canAdd, edit: canNote } = useClientPermission('training-need');
  const [notice, showNotice] = useTimesheetNotice();
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<TniFilters>(EMPTY_TNI_FILTERS);
  const [query, setQuery] = useState('');
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
  const results = requests
    .filter((r) => {
      const m = memberOf(r.staffId);
      if (term && ![m?.name ?? '', r.mainProgramme, ...r.subProgrammes, ...r.trainingNames, ...r.software].some((v) => v.toLowerCase().includes(term))) return false;
      if (filters.staff.length && !(m && filters.staff.includes(m.name))) return false;
      if (filters.requestedOn && r.requestedOn !== filters.requestedOn) return false;
      if (filters.status && r.status !== filters.status) return false;
      if (filters.completedOn && r.completedOn !== filters.completedOn) return false;
      return true;
    })
    // Desktop: newest request first
    .sort((a, b) => b.requestedOn.localeCompare(a.requestedOn) || b.id.localeCompare(a.id));
  const visible = results.slice(0, pages * PAGE_SIZE);

  const filterCount = tniFilterCount(filters);
  const isFiltered = filterCount > 0 || term !== '';
  const applied: { key: string; label: string; next: TniFilters }[] = [
    ...filters.staff.map((n) => ({ key: `s-${n}`, label: n, next: { ...filters, staff: filters.staff.filter((x) => x !== n) } })),
    ...(filters.requestedOn ? [{ key: 'req', label: `Requested ${formatTniDate(filters.requestedOn)}`, next: { ...filters, requestedOn: '' } }] : []),
    ...(filters.status ? [{ key: 'status', label: TNI_STATUS_LABEL[filters.status], next: { ...filters, status: '' as const } }] : []),
    ...(filters.completedOn ? [{ key: 'done', label: `Completed ${formatTniDate(filters.completedOn)}`, next: { ...filters, completedOn: '' } }] : []),
  ];

  const reload = () => {
    setPages(1);
    setLoading(true);
    listRef.current?.scrollTo({ top: 0 });
  };
  const applyFilters = (next: TniFilters) => {
    setFilters(next);
    reload();
  };
  const clearAll = () => applyFilters(EMPTY_TNI_FILTERS);
  const onSearch = (v: string) => {
    setQuery(v);
    setPages(1);
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

  const card = (r: TniRequest) => {
    const m = memberOf(r.staffId);
    const name = m?.name ?? 'Staff';
    const footerBtn = 'h-11 flex items-center justify-center gap-1.5 text-xs font-bold transition-colors';
    const bubble = 'min-w-4.5 h-4.5 px-1 rounded-full bg-[#2F68FE] text-white text-[10px] font-bold flex items-center justify-center tabular-nums';
    return (
      <li key={r.id}>
        <Card className="overflow-hidden">
          <div className="p-4 space-y-3.5">
            <div className="flex items-start gap-3">
              {m && <StaffAvatar name={m.name} tint={tintOf(m.id)} />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#1E293B] truncate">{name}</p>
                <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400 tabular-nums">
                  <CalendarDays className="w-3 h-3 shrink-0" />
                  Requested On {formatTniDate(r.requestedOn)}
                </p>
              </div>
              <span className="shrink-0">
                <TniStatusPill status={r.status} />
              </span>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#2F68FE] flex items-center justify-center shrink-0">
                  <GraduationCap className="w-4.5 h-4.5" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className={LABEL}>Main Training Programme</p>
                  <p className="text-[13px] font-bold text-[#1E293B] leading-snug break-words">{r.mainProgramme || '-'}</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-200/70 space-y-2.5">
                <div>
                  <p className={LABEL}>Sub Training Programme</p>
                  <p className="mt-0.5 text-xs font-semibold text-[#1E293B] leading-relaxed break-words">{r.subProgrammes.length ? r.subProgrammes.join(', ') : '-'}</p>
                </div>
                <div>
                  <p className={LABEL}>Training Name</p>
                  {r.trainingNames.length ? (
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {r.trainingNames.map((t) => (
                        <span key={t} className="px-2 py-0.5 rounded-md bg-blue-50 text-[11px] font-semibold text-[#2F68FE] leading-snug break-words">
                          {t}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-0.5 text-xs text-slate-400">-</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 border-t border-slate-100 divide-x divide-slate-100">
            <button
              type="button"
              disabled={!r.software.length}
              onClick={() => openSheet('software', r.id)}
              aria-label={r.software.length ? `View ${r.software.length} software for ${name}` : `No software for ${name}`}
              className={`${footerBtn} text-slate-700 active:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed cursor-pointer`}
            >
              <MonitorCog className={`w-4 h-4 ${r.software.length ? 'text-[#2F68FE]' : 'text-slate-300'}`} />
              Software
              {r.software.length > 0 && <span className={bubble}>{r.software.length}</span>}
            </button>
            <button type="button" onClick={() => openSheet('notes', r.id)} aria-label={`Notes for ${name}`} className={`${footerBtn} text-slate-700 active:bg-slate-50 cursor-pointer`}>
              <MessageSquareText className="w-4 h-4 text-[#2F68FE]" />
              Notes
              {r.notes.length > 0 && <span className={bubble}>{r.notes.length}</span>}
            </button>
          </div>
        </Card>
      </li>
    );
  };

  return (
    <div className="relative flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      <ScreenHeader title="Training Need Identification" onBack={onBack} />
      {notice}
      <div ref={listRef} className="flex-1 overflow-y-auto no-scrollbar pb-6">
        <div className="px-4 pt-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex-1 min-w-0">
              <SearchField value={query} onChange={onSearch} placeholder="Search Staff, Programme, Training Or Software" />
            </div>
            <FilterIconButton count={filterCount} onClick={() => openSheet('filter')} />
          </div>

          {applied.length > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 min-w-0 flex gap-1.5 overflow-x-auto no-scrollbar" aria-label="Applied filters">
                {applied.map((a) => (
                  <span
                    key={a.key}
                    className="shrink-0 h-8 pl-3 pr-1 rounded-full bg-white border border-slate-200 text-[11px] font-semibold text-slate-600 flex items-center gap-1.5"
                  >
                    {a.label}
                    <button
                      type="button"
                      onClick={() => applyFilters(a.next)}
                      aria-label={`Remove ${a.label}`}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <button type="button" onClick={clearAll} className="shrink-0 h-8 px-1 text-[11px] font-bold text-[#2F68FE] cursor-pointer">
                Clear All
              </button>
            </div>
          )}
        </div>

        <div className="px-4 mt-4">
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
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      clearAll();
                    }}
                    className="mt-4 h-10 px-5 rounded-xl border border-[#2F68FE] bg-white text-[#2F68FE] text-xs font-bold active:bg-blue-50 cursor-pointer"
                  >
                    Clear All
                  </button>
                ) : undefined
              }
            />
          ) : (
            <>
              <ul className="space-y-3">{visible.map(card)}</ul>

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

      {canAdd && (
        <div className="shrink-0 p-4 pb-5 bg-white/95 backdrop-blur-md border-t border-[#EBF0F7] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">
          <button
            type="button"
            onClick={openAdd}
            className="w-full h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs active:bg-[#1D4ED8] transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            TNI Request
          </button>
        </div>
      )}

      <TrainingNeedFilterSheet
        isOpen={sheet === 'filter'}
        filters={filters}
        staffOptions={Array.from(new Set(requests.map((r) => memberOf(r.staffId)?.name).filter((v): v is string => Boolean(v)))).sort((a, b) => a.localeCompare(b))}
        onClose={() => setSheet(null)}
        onApply={(next) => {
          setSheet(null);
          applyFilters(next);
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
