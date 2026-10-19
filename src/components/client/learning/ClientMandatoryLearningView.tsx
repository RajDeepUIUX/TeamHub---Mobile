import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BookMarked, ChevronRight, Clock3, Loader2, SearchX } from 'lucide-react';
import { Card, EmptyCard, SearchField } from '../staff/tabs/StaffTabParts';
import { StaffSkeleton } from '../staff/ClientStaffParts';
import type { ClientStaffMember } from '../data/clientStaffData';
import { MandatoryCourse, countsOf, formatHours, matchesCourseName } from '../data/clientMandatoryLearningData';
import { MandatoryCourseSheet } from './MandatoryCourseSheet';
import { MlProgress } from './MandatoryLearningParts';

interface Props {
  courses: MandatoryCourse[];
  staff: ClientStaffMember[];
}

/** Desktop pages the table 20 at a time; cards are taller, so fewer per page */
const PAGE_SIZE = 6;
/** Desktop loads the table by ajax */
const LOAD_MS = 600;

const ListSkeleton: React.FC = () => (
  <div className="space-y-3" aria-busy="true" aria-label="Loading mandatory courses">
    <div className="grid grid-cols-3 gap-2.5">
      {[0, 1, 2].map((i) => (
        <StaffSkeleton key={i} className="h-16 rounded-2xl" />
      ))}
    </div>
    {[0, 1, 2].map((i) => (
      <div key={i} className="bg-white border border-[#EBF0F7] rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-3">
          <StaffSkeleton className="w-10 h-10 rounded-xl" />
          <div className="flex-1 space-y-1.5">
            <StaffSkeleton className="w-44 h-3.5" />
            <StaffSkeleton className="w-16 h-3" />
          </div>
        </div>
        <StaffSkeleton className="w-full h-2 rounded-full" />
        <StaffSkeleton className="w-full h-14 rounded-xl" />
      </div>
    ))}
  </div>
);

/**
 * Learning & Development › Mandatory Learning (desktop `mandatorylearning`): the mandatory courses assigned to the client's
 * staff with Hours, Total Assigned, Total Completed and a Progress Details panel per course. Read-only; search by course name.
 */
export const ClientMandatoryLearningView: React.FC<Props> = ({ courses, staff }) => {
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
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

  const term = query.trim();
  // Desktop: ORDER BY course name ASC
  const results = courses.filter((c) => !term || matchesCourseName(c, term)).sort((a, b) => a.name.localeCompare(b.name));
  const visible = results.slice(0, pages * PAGE_SIZE);
  const allCounts = countsOf(results.flatMap((c) => c.assignments));

  const reload = () => {
    setPages(1);
    setLoading(true);
    listRef.current?.scrollTo({ top: 0 });
  };
  const clearSearch = () => {
    setQuery('');
    reload();
  };

  const openCourse = (id: string) => {
    setOpenId(id);
    setSheetOpen(true);
  };

  const target = openId ? courses.find((c) => c.id === openId) ?? null : null;

  const stat = (label: string, value: React.ReactNode, tone = 'text-[#1E293B]') => (
    <div className="min-w-0 py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-100">
      <dt className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wide">{label}</dt>
      <dd className={`mt-0.5 text-base font-extrabold tabular-nums ${tone}`}>{value}</dd>
    </div>
  );

  const card = (c: MandatoryCourse) => {
    const k = countsOf(c.assignments);
    const allDone = k.assigned > 0 && k.completed === k.assigned;
    return (
      <li key={c.id}>
        <Card className="overflow-hidden">
          <div className="p-3.5 pb-3 flex items-start gap-3">
            <span className="w-10 h-10 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0" aria-hidden="true">
              <BookMarked className="w-5 h-5" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-[13.5px] font-bold text-[#1E293B] leading-snug break-words">{c.name}</span>
              <span className="mt-0.5 flex items-center gap-1 text-[11.5px] text-slate-500">
                <Clock3 className="w-3.5 h-3.5" />
                {formatHours(c.hours)}
              </span>
            </span>
            {k.assigned > 0 && <span className={`text-[13px] font-extrabold tabular-nums ${allDone ? 'text-[#10B981]' : 'text-[#2F68FE]'}`}>{k.percent}%</span>}
          </div>

          {k.assigned > 0 ? (
            <>
              <div className="px-3.5">
                <MlProgress completed={k.completed} assigned={k.assigned} />
              </div>
              <dl className="mx-3.5 mt-3 grid grid-cols-2 gap-2">
                {stat('Total Assigned', k.assigned)}
                {stat('Total Completed', k.completed, allDone ? 'text-[#10B981]' : 'text-[#1E293B]')}
              </dl>
            </>
          ) : (
            <p className="mx-3.5 py-3 text-xs text-slate-400">Not assigned to any staff yet</p>
          )}

          <div className="mt-3 px-3.5 py-2.5 border-t border-slate-100 flex items-center justify-between gap-3">
            <span className="text-[11px] text-slate-400">
              {k.assigned === 0 ? '-' : allDone ? 'All staff completed' : `${k.assigned - k.completed} pending`}
            </span>
            {k.assigned > 0 && (
              <button
                type="button"
                onClick={() => openCourse(c.id)}
                aria-label={`View progress details for ${c.name}`}
                className="h-9 pl-3 pr-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold flex items-center gap-1 active:bg-slate-50 cursor-pointer"
              >
                Progress Details
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </Card>
      </li>
    );
  };

  return (
    <div className="relative flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      <div ref={listRef} className="flex-1 overflow-y-auto no-scrollbar pb-6">
        <div className="px-4 pt-4">
          <p className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
            Learning &amp; Development <ChevronRight className="w-3 h-3" /> <span className="text-slate-600">Mandatory Learning</span>
          </p>
          <h1 className="mt-0.5 mb-1.5 text-xl font-extrabold leading-tight">Mandatory Learning</h1>

          <div className="mt-3">
            <SearchField
              value={query}
              onChange={(v) => {
                setQuery(v);
                setPages(1);
              }}
              placeholder="Search by course name"
            />
          </div>

          {term && !loading && (
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 tabular-nums">
                {results.length} {results.length === 1 ? 'course' : 'courses'} found
              </span>
              <button type="button" onClick={clearSearch} className="text-[11px] font-bold text-[#2F68FE] cursor-pointer">
                Clear All
              </button>
            </div>
          )}
        </div>

        <div className="px-4 mt-3">
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
                <button type="button" onClick={clearSearch} className="mt-4 h-10 px-5 rounded-xl bg-[#EEF2FF] text-[#2F68FE] text-xs font-bold active:bg-[#E0E7FF] cursor-pointer">
                  Clear All
                </button>
              }
            />
          ) : (
            <>
              <dl className="grid grid-cols-3 gap-2.5">
                {[
                  { label: 'Courses', value: results.length },
                  { label: 'Completed', value: `${allCounts.completed}/${allCounts.assigned}` },
                  { label: 'Completion', value: `${allCounts.percent}%` },
                ].map((t) => (
                  <div key={t.label} className="py-3 px-2 rounded-2xl bg-white border border-[#EBF0F7] shadow-2xs text-center">
                    <dd className="text-lg font-extrabold text-[#1E293B] tabular-nums leading-none">{t.value}</dd>
                    <dt className="mt-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{t.label}</dt>
                  </div>
                ))}
              </dl>
              <ul className="mt-3 space-y-3">{visible.map(card)}</ul>
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
