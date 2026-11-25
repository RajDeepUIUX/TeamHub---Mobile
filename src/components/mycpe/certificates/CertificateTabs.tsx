import React, { useEffect, useRef } from 'react';
import { CircleAlert, CircleCheck, CircleDashed, CircleX, Eye } from 'lucide-react';
import { ReviewStatus } from './certModel';

const STATUS: Record<ReviewStatus, { icon: React.ComponentType<{ className?: string }>; cls: string }> = {
  'Needs Review': { icon: CircleDashed, cls: 'text-[#B54708]' },
  Incomplete: { icon: CircleAlert, cls: 'text-[#B42318]' },
  Reviewed: { icon: CircleCheck, cls: 'text-[#067647]' },
  'Analysis Failed': { icon: CircleX, cls: 'text-[#B42318]' },
};

export const StatusText: React.FC<{ status: ReviewStatus }> = ({ status }) => {
  const { icon: Icon, cls } = STATUS[status];
  return (
    <span className={`flex items-center gap-1 text-xs leading-4 font-semibold ${cls}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      {status}
    </span>
  );
};

export interface CertificateTab {
  id: string;
  title: string;
  status: ReviewStatus;
}

/** One tab per certificate: which course it is and where its review stands */
export const CertificateTabs: React.FC<{ tabs: CertificateTab[]; activeId: string; panelId: string; onSelect: (id: string) => void }> = ({ tabs, activeId, panelId, onSelect }) => {
  const row = useRef<HTMLDivElement>(null);

  // The active tab moves to the middle, so its neighbours can be seen
  useEffect(() => {
    const box = row.current;
    const el = box?.querySelector<HTMLElement>('[aria-selected=true]');
    if (!box || !el) return;
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    box.scrollTo({ left: el.offsetLeft - (box.clientWidth - el.offsetWidth) / 2, behavior: calm ? 'auto' : 'smooth' });
  }, [activeId]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    const next = step && tabs[tabs.findIndex((t) => t.id === activeId) + step];
    if (!next) return;
    e.preventDefault();
    onSelect(next.id);
    row.current?.querySelector<HTMLElement>(`[data-tab="${CSS.escape(next.id)}"]`)?.focus({ preventScroll: true });
  };

  return (
    <div
      ref={row}
      role="tablist"
      aria-label="Certificates"
      onKeyDown={onKeyDown}
      onWheel={(e) => {
        if (row.current && e.deltaY) row.current.scrollLeft += e.deltaY;
      }}
      className="relative shrink-0 px-3 pt-2 flex bg-[#E9EBF0] shadow-[inset_0_-1px_0_var(--color-mc-line-strong)] overflow-x-auto overscroll-x-contain no-scrollbar"
    >
      {tabs.map((t, i) => {
        const on = t.id === activeId;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`${panelId}-${t.id}`}
            data-tab={t.id}
            aria-selected={on}
            aria-controls={panelId}
            tabIndex={on ? 0 : -1}
            onClick={() => onSelect(t.id)}
            className={`relative flex-1 min-w-36 px-3 pt-3 pb-2.5 text-left cursor-pointer transition-colors ${
              on
                ? 'z-10 rounded-t-xl bg-white border-x border-t border-mc-line-strong overflow-hidden'
                : 'border-x border-t border-transparent rounded-t-xl active:bg-mc-line'
            }`}
          >
            {on && <span className="absolute inset-x-0 top-0 h-[3px] bg-mc-primary" aria-hidden="true" />}
            {/* Divider between two tabs that aren't selected */}
            {!on && i > 0 && tabs[i - 1].id !== activeId && <span className="absolute -left-px inset-y-4 w-px bg-mc-line-strong" aria-hidden="true" />}
            <span className={`block text-[13px] leading-[18px] font-semibold ${on ? 'text-mc-primary' : 'text-mc-text'}`}>Certificate {i + 1}</span>
            <span className={`mb-1 block text-xs leading-4 truncate ${on ? 'text-mc-ink-2' : 'text-mc-muted'}`}>{t.title}</span>
            <StatusText status={t.status} />
          </button>
        );
      })}
    </div>
  );
};

/** Which course is being edited; stays in place while the form scrolls */
export const CourseHeader: React.FC<{
  title: string;
  meta?: string;
  /** Continues the selected tab above it */
  joined?: boolean;
  onView: () => void;
}> = ({ title, meta, joined, onView }) => (
  <div className={`shrink-0 pl-4 pr-2 py-2 flex items-center gap-1 border-mc-line ${joined ? 'bg-white border-b' : 'bg-mc-page border-y'}`}>
    <div className="flex-1 min-w-0">
      <h2 className="text-[15px] leading-5 font-semibold text-mc-ink line-clamp-2 [overflow-wrap:anywhere]">{title}</h2>
      {meta && <p className="text-[13px] leading-[18px] text-mc-text">{meta}</p>}
    </div>
    <button type="button" onClick={onView} className="shrink-0 w-12 h-12 flex items-center justify-center text-mc-primary cursor-pointer" aria-label="View Certificate">
      <Eye className="w-[22px] h-[22px] stroke-[1.7]" />
    </button>
  </div>
);
