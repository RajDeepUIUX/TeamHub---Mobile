import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BookMarked, ChevronRight, Loader2, SearchX, Users } from 'lucide-react';
import { ScreenHeader, EmptyCard, SearchField } from '../staff/tabs/StaffTabParts';
import { StaffSkeleton } from '../staff/ClientStaffParts';
import type { ClientStaffMember } from '../data/clientStaffData';
import { MandatoryCourse, countsOf, matchesCourseName } from '../data/clientMandatoryLearningData';
import { MandatoryCourseSheet } from './MandatoryCourseSheet';
import { CompletionRing } from './MandatoryLearningParts';

interface Props {
  courses: MandatoryCourse[];
  staff: ClientStaffMember[];
  /** Header back arrow (Dashboard) */
  onBack?: () => void;
}

/** Desktop pages the table 20 at a time; cards are taller, so fewer per page */
const PAGE_SIZE = 6;
/** Desktop loads the table by ajax */
const LOAD_MS = 600;

const TICKET = 'bg-white border border-[#EBF0F7] rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.03)] overflow-hidden';
/** Hours stub; callers add the flex direction */
const STUB = 'w-[76px] shrink-0 bg-slate-50 border-r border-slate-100 flex items-center justify-center gap-1 px-1 py-4 text-center';

const ListSkeleton: React.FC = () => (
  <div className="space-y-3" aria-busy="true" aria-label="Loading mandatory courses">
    {[0, 1, 2].map((i) => (
      <div key={i} className={TICKET}>
        <div className="flex">
          <div className={`${STUB} flex-col`}>
            <StaffSkeleton className="w-6 h-5" />
            <StaffSkeleton className="w-12 h-2" />
          </div>
          <div className="flex-1 p-3.5 space-y-1.5">
            <StaffSkeleton className="w-20 h-2.5" />
            <StaffSkeleton className="w-40 h-3.5" />
            <div className="pt-2 flex items-center gap-3">
              <StaffSkeleton className="w-12 h-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <StaffSkeleton className="w-full h-2.5" />
                <StaffSkeleton className="w-full h-2.5" />
              </div>
            </div>
          </div>
        </div>
        <div className="h-11 px-4 border-t border-slate-100 flex items-center justify-between">
          <StaffSkeleton className="w-24 h-2.5" />
          <StaffSkeleton className="w-10 h-2.5" />
        </div>
      </div>
    ))}
  </div>
);

/**
 * Learning & Development › Mandatory Learning (desktop `mandatorylearning`): the mandatory courses assigned to the client's
 * staff with Hours (hrs), Total Assigned, Total Completed and a Progress details panel per course. Read-only; search by course name.
 */
export const ClientMandatoryLearningView: React.FC<Props> = ({ courses, staff, onBack }) => {
  const [loading, setLoading] = useState(true);
  /** Typed text; desktop only filters once Search is pressed */
  const [draft, setDraft] = useState('');
  const [term, setTerm] = useState('');
  const [pages, setPages] = useState(1);
  const [moreLoading, setMoreLoading] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setLoading(false), LOAD_MS);
    return () => clearTimeout(t);
  }, [loading]);

  // Same avatar colour as My Staff
  const tintOf = useMemo(() => {
    const sorted = [...staff].sort((a, b) => a.name.localeCompare(b.name));
    return (id: string) => sorted.findIndex((s) => s.id === id);
  }, [staff]);

  // Desktop: ORDER BY course name ASC
  const results = courses.filter((c) => !term || matchesCourseName(c, term)).sort((a, b) => a.name.localeCompare(b.name));
  const visible = results.slice(0, pages * PAGE_SIZE);

  const reload = () => {
    setPages(1);
    setLoading(true);
    listRef.current?.scrollTo({ top: 0 });
  };
  const search = () => {
    setTerm(draft.trim());
    reload();
  };
  const clearAll = () => {
    setDraft('');
    setTerm('');
    reload();
  };

  const openCourse = (id: string) => {
    setOpenId(id);
    setSheetOpen(true);
  };

  const target = openId ? courses.find((c) => c.id === openId) ?? null : null;

  const count = (label: string, value: number) => (
    <div className="py-1.5 first:pt-0 last:pb-0 flex items-center justify-between gap-2">
      <dt className="text-[11px] font-medium text-slate-500 truncate">{label}</dt>
      <dd className="text-xs font-bold text-[#1E293B] tabular-nums">{value}</dd>
    </div>
  );

  const card = (c: MandatoryCourse) => {
    const k = countsOf(c.assignments);
    return (
      <li key={c.id}>
        <section className={TICKET}>
          <div className="flex">
            <dl className={`${STUB} flex-col-reverse`}>
              <dt className="text-[10px] font-semibold text-slate-400 leading-tight">Hours (hrs)</dt>
              <dd className="text-lg font-extrabold text-[#2F68FE] tabular-nums leading-none">{c.hours}</dd>
            </dl>
            <div className="flex-1 min-w-0 p-3.5">
              <dl>
                <dt className="text-[11px] font-medium text-slate-400">Course Name</dt>
                <dd className="mt-0.5 text-sm font-bold text-[#1E293B] leading-snug break-words">{c.name}</dd>
              </dl>
              <div className="mt-3 flex items-center gap-3">
                <CompletionRing completed={k.completed} assigned={k.assigned} />
                <dl className="flex-1 min-w-0 divide-y divide-slate-100">
                  {count('Total Assigned', k.assigned)}
                  {count('Total Completed', k.completed)}
                </dl>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => openCourse(c.id)}
            aria-label={`View progress details for ${c.name}`}
            className="w-full h-11 px-4 border-t border-slate-100 flex items-center justify-between gap-3 text-left active:bg-slate-50 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#2F68FE]"
          >
            <span className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
              <Users className="w-4 h-4 text-slate-400" aria-hidden="true" />
              Progress details
            </span>
            <span className="flex items-center gap-0.5 text-xs font-bold text-[#2F68FE]">
              View
              <ChevronRight className="w-4 h-4" />
            </span>
          </button>
        </section>
      </li>
    );
  };

  return (
    <div className="relative flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      <ScreenHeader title="Mandatory Learning" onBack={onBack} />
      <div ref={listRef} className="flex-1 overflow-y-auto no-scrollbar pb-6">
        <form
          className="sticky top-0 z-10 px-4 py-3 bg-white border-b border-[#EBF0F7] flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            search();
          }}
        >
          <div className="flex-1 min-w-0">
            <SearchField value={draft} onChange={setDraft} placeholder="Search By Course Name" variant="sheet" />
          </div>
          <button type="submit" className="shrink-0 h-11 px-3.5 rounded-xl bg-[#2F68FE] text-white text-xs font-bold shadow-xs active:bg-[#1D4ED8] transition-colors cursor-pointer">
            Search
          </button>
          <button type="button" onClick={clearAll} className="shrink-0 h-11 px-3 rounded-xl border border-[#2F68FE] bg-white text-[#2F68FE] text-xs font-bold whitespace-nowrap active:bg-blue-50 transition-colors cursor-pointer">
            Clear All
          </button>
        </form>

        <div className="px-4 mt-4">
          {loading ? (
            <ListSkeleton />
          ) : courses.length === 0 ? (
            <EmptyCard icon={BookMarked} title="No mandatory courses found." text="Mandatory courses assigned to your staff will show up here." />
          ) : results.length === 0 ? (
            <EmptyCard
              icon={SearchX}
              title="No mandatory courses found."
              text="Try a different course name."
              action={
                <button type="button" onClick={clearAll} className="mt-4 h-10 px-4 rounded-xl border border-[#2F68FE] bg-white text-[#2F68FE] text-xs font-bold active:bg-blue-50 transition-colors cursor-pointer">
                  Clear All
                </button>
              }
            />
          ) : (
            <>
              <ul className="space-y-3">{visible.map(card)}</ul>
              <p className="mt-3 text-center text-xs text-slate-500 tabular-nums">
                Showing <span className="font-bold text-[#1E293B]">{visible.length}</span> Of <span className="font-bold text-[#1E293B]">{results.length}</span> Records
              </p>
            </>
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

      <MandatoryCourseSheet isOpen={sheetOpen} course={target} staff={staff} tintOf={tintOf} onClose={() => setSheetOpen(false)} />
    </div>
  );
};
