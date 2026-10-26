import React, { useLayoutEffect, useRef, useState } from 'react';
import { Briefcase, Calculator, BookOpenCheck, Lightbulb, Scale, ShieldCheck } from 'lucide-react';
import { StaffSkeleton } from '../staff/ClientStaffParts';

/** Domain icon tile (desktop shows a small document icon before the domain) */
const DOMAIN_ICON: Record<string, React.ElementType> = {
  Tax: Calculator,
  'Accounting & Bookkeeping': BookOpenCheck,
  'Audit & Assurance': ShieldCheck,
  'Business Valuation': Scale,
  Advisory: Lightbulb,
};

/** One flat tile for every domain (redesign.md §4: no per-category colour); domains differ by icon only */
export const DomainTile: React.FC<{ domain: string }> = ({ domain }) => {
  const Icon = DOMAIN_ICON[domain] ?? Briefcase;
  return (
    <span className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 text-[#2F68FE] flex items-center justify-center shrink-0" aria-hidden="true">
      <Icon className="w-5 h-5" />
    </span>
  );
};

const SKILL_CHIP = 'shrink-0 px-2.5 py-1 rounded-full bg-white ring-1 ring-inset ring-slate-200 text-[11px] font-semibold text-slate-600 leading-snug whitespace-nowrap';
const SKILL_MORE =
  'shrink-0 px-2.5 py-1 rounded-full bg-blue-50 ring-1 ring-inset ring-blue-100 text-[11px] font-bold text-[#2F68FE] leading-snug whitespace-nowrap active:bg-blue-100 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2F68FE]';
const SKILL_GAP = 6;

/** Skills on a single line: as many chips as fit, then "Show More (n)" which opens the full list (bottom sheet) */
export const SkillLine: React.FC<{ skills: string[]; onMore: () => void }> = ({ skills, onMore }) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(skills.length);

  useLayoutEffect(() => {
    const box = boxRef.current;
    const measure = measureRef.current;
    if (!box || !measure) return;
    const calc = () => {
      const width = box.clientWidth;
      const nodes = Array.from(measure.children) as HTMLElement[];
      const chipWidths = nodes.slice(0, skills.length).map((n) => n.offsetWidth);
      const moreWidth = nodes[skills.length]?.offsetWidth ?? 0;
      const total = chipWidths.reduce((sum, w, i) => sum + w + (i ? SKILL_GAP : 0), 0);
      if (total <= width) {
        setFit(skills.length);
        return;
      }
      let used = moreWidth;
      let count = 0;
      for (const w of chipWidths) {
        if (used + SKILL_GAP + w > width) break;
        used += SKILL_GAP + w;
        count += 1;
      }
      setFit(Math.max(1, count));
    };
    calc();
    const ro = new ResizeObserver(calc);
    ro.observe(box);
    return () => ro.disconnect();
  }, [skills]);

  const hidden = skills.length - fit;
  const shown = skills.slice(0, fit);

  return (
    <div ref={boxRef} className="relative">
      <div ref={measureRef} aria-hidden="true" className="absolute left-0 top-0 flex gap-1.5 invisible pointer-events-none">
        {skills.map((s) => (
          <span key={s} className={SKILL_CHIP}>
            {s}
          </span>
        ))}
        <span className={SKILL_MORE}>Show More ({skills.length})</span>
      </div>
      <ul className="flex flex-nowrap gap-1.5 overflow-hidden" aria-label="Skills">
        {shown.map((s) => (
          <li key={s} className={`${SKILL_CHIP} min-w-0 truncate`}>
            {s}
          </li>
        ))}
        {hidden > 0 && (
          <li className="shrink-0">
            <button type="button" onClick={onMore} aria-haspopup="dialog" className={SKILL_MORE}>
              Show More ({hidden})
            </button>
          </li>
        )}
      </ul>
    </div>
  );
};

export const HubListSkeleton: React.FC = () => (
  <div className="space-y-3" aria-busy="true" aria-label="Loading resumes">
    {[0, 1, 2].map((i) => (
      <div key={i} className="bg-white border border-[#EBF0F7] rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex items-center gap-2">
          <StaffSkeleton className="w-11 h-11 rounded-xl" />
          <StaffSkeleton className="w-32 h-3" />
        </div>
        <div className="flex items-center justify-between gap-3">
          <StaffSkeleton className="w-44 h-4" />
          <StaffSkeleton className="w-14 h-5" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <StaffSkeleton className="h-8" />
          <StaffSkeleton className="h-8" />
          <StaffSkeleton className="h-8" />
        </div>
        <StaffSkeleton className="w-full h-10" />
        <div className="flex gap-1.5">
          <StaffSkeleton className="w-20 h-6" />
          <StaffSkeleton className="w-24 h-6" />
          <StaffSkeleton className="w-16 h-6" />
        </div>
        <div className="flex items-center justify-between">
          <StaffSkeleton className="w-16 h-5" />
          <StaffSkeleton className="w-28 h-9" />
        </div>
      </div>
    ))}
  </div>
);
