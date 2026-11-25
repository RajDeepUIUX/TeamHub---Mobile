import React, { useRef } from 'react';
import { ChevronLeft } from 'lucide-react';

/** White header with a back arrow and a centred title */
export const McPageHeader: React.FC<{ title: string; onBack: () => void }> = ({ title, onBack }) => (
  <header className="shrink-0 bg-white" style={{ paddingTop: 'var(--safe-top)' }}>
    <div className="relative h-[54px] flex items-center px-4">
      <button type="button" onClick={onBack} className="-ml-2 w-10 h-10 flex items-center justify-center text-mc-text cursor-pointer" aria-label="Back">
        <ChevronLeft className="w-6 h-6 stroke-[1.4]" />
      </button>
      <h1 className="absolute inset-x-14 text-center text-base font-medium text-mc-ink-2 truncate pointer-events-none">{title}</h1>
    </div>
  </header>
);

/** Stand-in for a screen whose design hasn't been provided yet */
export const McPending: React.FC<{ title: string; note?: string }> = ({ title, note }) => (
  <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
    <img src="/brand/Icon.png" alt="" className="w-14 h-16 object-contain" draggable={false} />
    <h2 className="mt-5 text-2xl font-semibold text-mc-ink">{title}</h2>
    {note && <span className="mt-2 px-3 h-7 rounded-full bg-mc-primary-soft text-mc-indigo text-xs font-semibold flex items-center">{note}</span>}
    <p className="mt-2 text-sm text-mc-muted">This screen's design isn't added yet.</p>
  </div>
);

/** Horizontal row that scrolls by touch / trackpad and, on desktop, by dragging a card's image (dragging text selects it) */
export const McRow: React.FC<{ className?: string; children: React.ReactNode }> = ({ className = '', children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);

  return (
    <div
      ref={ref}
      className={`flex overflow-x-auto overscroll-x-contain no-scrollbar ${className}`}
      onPointerDown={(e) => {
        suppressClick.current = false;
        const onImage = e.target instanceof HTMLImageElement || e.target === e.currentTarget;
        if (e.pointerType === 'mouse' && onImage && ref.current) drag.current = { x: e.clientX, left: ref.current.scrollLeft, moved: false };
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d || !ref.current) return;
        // Button released outside the row
        if (e.buttons === 0) {
          drag.current = null;
          return;
        }
        if (Math.abs(e.clientX - d.x) > 4) d.moved = true;
        if (d.moved) window.getSelection()?.removeAllRanges();
        if (d.moved) ref.current.scrollLeft = d.left - (e.clientX - d.x);
      }}
      onPointerUp={() => {
        suppressClick.current = Boolean(drag.current?.moved);
        drag.current = null;
      }}
      onClickCapture={(e) => {
        // A drag isn't a tap on the card under it
        if (!suppressClick.current) return;
        suppressClick.current = false;
        e.stopPropagation();
        e.preventDefault();
      }}
      onDragStart={(e) => e.preventDefault()}
    >
      {children}
    </div>
  );
};
