import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BookMarked, ChevronRight, Loader2, SearchX } from 'lucide-react';
import { ScreenHeader, Card, EmptyCard, SearchField } from '../staff/tabs/StaffTabParts';
import { StaffSkeleton } from '../staff/ClientStaffParts';
import type { ClientStaffMember } from '../data/clientStaffData';
import { MandatoryCourse, countsOf, matchesCourseName } from '../data/clientMandatoryLearningData';
import { MandatoryCourseSheet } from './MandatoryCourseSheet';

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

const ListSkeleton: React.FC = () => (
  <div className="space-y-3" aria-busy="true" aria-label="Loading mandatory courses">
    {[0, 1, 2].map((i) => (
      <div key={i} className="bg-white border border-[#DCE3ED] rounded-2xl p-4 space-y-3">
        <div className="space-y-1.5">
          <StaffSkeleton className="w-20 h-2.5" />
          <StaffSkeleton className="w-48 h-3.5" />
        </div>
        <StaffSkeleton className="w-full h-14 rounded-xl" />
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

  const stat = (label: string, value: React.ReactNode) => (
    <div className="min-w-0 py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-100">
      <dt className="text-[11px] font-semibold text-slate-400 truncate">{label}</dt>
      <dd className="mt-0.5 text-base font-extrabold text-[#1E293B] tabular-nums">{value}</dd>
    </div>
  );

  const card = (c: MandatoryCourse) => {
    const k = countsOf(c.assignments);
    return (
      <li key={c.id}>
        <Card className="overflow-hidden">
          <div className="p-3.5 pb-3 flex items-start gap-3">
            <span className="w-10 h-10 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0" aria-hidden="true">
              <BookMarked className="w-5 h-5" />
            </span>
            <dl className="flex-1 min-w-0">
              <dt className="text-[11px] font-semibold text-slate-400">Course Name</dt>
              <dd className="mt-0.5 text-[13.5px] font-bold text-[#1E293B] leading-snug break-words">{c.name}</dd>
            </dl>
          </div>

          <dl className="mx-3.5 grid grid-cols-3 gap-2">
            {stat('Hours (hrs)', c.hours)}
            {stat('Total Assigned', k.assigned)}
            {stat('Total Completed', k.completed)}
          </dl>

          <div className="mt-3 px-3.5 py-2.5 border-t border-slate-100 flex items-center justify-between gap-3">
            <span className="text-[11px] font-semibold text-slate-400">Progress details</span>
            <button
              type="button"
              onClick={() => openCourse(c.id)}
              aria-label={`View progress details for ${c.name}`}
              className="h-9 pl-3 pr-2 rounded-xl border border-slate-200 text-[#2F68FE] text-xs font-bold flex items-center gap-1 active:bg-slate-50 cursor-pointer"
            >
              View
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </Card>
      </li>
    );
  };

  return (
    <div className="relative flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      <ScreenHeader title="Mandatory Learning" onBack={onBack} />
      <div ref={listRef} className="flex-1 overflow-y-auto no-scrollbar pb-6">
        <form
          className="px-4 pt-4"
          onSubmit={(e) => {
            e.preventDefault();
            search();
          }}
        >
          <SearchField value={draft} onChange={setDraft} placeholder="Search By Course Name" />
          <div className="mt-2.5 grid grid-cols-2 gap-2.5">
            <button type="submit" className="h-10 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#2557DB] cursor-pointer">
              Search
            </button>
            <button type="button" onClick={clearAll} className="h-10 rounded-xl border border-[#2F68FE] bg-white text-[#2F68FE] text-xs font-bold active:bg-[#EEF2FF] cursor-pointer">
              Clear All
            </button>
          </div>
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
                <button type="button" onClick={clearAll} className="mt-4 h-10 px-5 rounded-xl bg-[#EEF2FF] text-[#2F68FE] text-xs font-bold active:bg-[#E0E7FF] cursor-pointer">
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
