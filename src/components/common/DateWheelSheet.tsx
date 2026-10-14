import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { BottomSheet } from './BottomSheet';

interface DateWheelSheetProps {
  isOpen: boolean;
  title: string;
  /** YYYY-MM-DD, or '' for none */
  value: string;
  /** Inclusive bounds (YYYY-MM-DD) */
  min?: string;
  max?: string;
  onClose: () => void;
  onApply: (iso: string) => void;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const ITEM_H = 40;
const VISIBLE = 5;
const DEFAULT_MIN = '1940-01-01';

const pad = (n: number) => String(n).padStart(2, '0');
const toIso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const daysIn = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
const parts = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return { y, m: m - 1, d };
};
export const todayIso = () => {
  const t = new Date();
  return toIso(t.getFullYear(), t.getMonth(), t.getDate());
};

/* ------------------------------- Wheel column ------------------------------- */

export interface WheelItem {
  value: number;
  label: string;
}

export const WheelColumn: React.FC<{ items: WheelItem[]; value: number; onChange: (v: number) => void; ariaLabel: string }> = ({
  items,
  value,
  onChange,
  ariaLabel,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const settleTimer = useRef<number | undefined>(undefined);
  const scrolling = useRef(false);
  const ready = useRef(false);
  const latest = useRef({ items, value, onChange });
  latest.current = { items, value, onChange };

  const index = Math.max(0, items.findIndex((i) => i.value === value));

  // Keep the wheel on the selected value (first paint jumps, later changes glide)
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || scrolling.current) return;
    const top = index * ITEM_H;
    if (Math.abs(el.scrollTop - top) > 1) el.scrollTo({ top, behavior: ready.current ? 'smooth' : 'auto' });
    ready.current = true;
  }, [index, items.length]);

  useEffect(() => () => window.clearTimeout(settleTimer.current), []);

  const handleScroll = () => {
    scrolling.current = true;
    window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => {
      scrolling.current = false;
      const el = ref.current;
      if (!el) return;
      const { items: list, value: current, onChange: change } = latest.current;
      const i = Math.min(list.length - 1, Math.max(0, Math.round(el.scrollTop / ITEM_H)));
      if (list[i].value !== current) change(list[i].value);
      else if (Math.abs(el.scrollTop - i * ITEM_H) > 1) el.scrollTo({ top: i * ITEM_H, behavior: 'smooth' });
    }, 90);
  };

  return (
    <div
      ref={ref}
      onScroll={handleScroll}
      role="listbox"
      aria-label={ariaLabel}
      className="relative h-full overflow-y-scroll no-scrollbar snap-y snap-mandatory overscroll-contain"
      style={{
        paddingBlock: ITEM_H * Math.floor(VISIBLE / 2),
        maskImage: 'linear-gradient(to bottom, transparent, #000 32%, #000 68%, transparent)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent, #000 32%, #000 68%, transparent)',
      }}
    >
      {items.map((item, i) => {
        const on = i === index;
        return (
          <button
            key={item.value}
            type="button"
            role="option"
            aria-selected={on}
            onClick={() => ref.current?.scrollTo({ top: i * ITEM_H, behavior: 'smooth' })}
            className={`w-full snap-center flex items-center justify-center tabular-nums transition-colors cursor-pointer ${
              on ? 'text-[15px] font-bold text-[#1E293B]' : 'text-sm font-medium text-slate-400'
            }`}
            style={{ height: ITEM_H }}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
};

/* ---------------------------------- Sheet ---------------------------------- */

/** Day / Month / Year wheels — quick to reach any date, e.g. a date of birth decades back */
export const DateWheelSheet: React.FC<DateWheelSheetProps> = ({ isOpen, title, value, min = DEFAULT_MIN, max = todayIso(), onClose, onApply }) => {
  const initial = () => parts(value && value >= min && value <= max ? value : max);
  const [sel, setSel] = useState(initial);

  useEffect(() => {
    if (isOpen) setSel(initial());
    // Re-seed from the field each time the sheet opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const lo = parts(min);
  const hi = parts(max);

  /** Apply a change, then keep the day valid for the month and the date inside [min, max] */
  const update = (next: Partial<typeof sel>) =>
    setSel((prev) => {
      let { y, m, d } = { ...prev, ...next };
      d = Math.min(d, daysIn(y, m));
      const iso = toIso(y, m, d);
      if (iso > max) ({ y, m, d } = hi);
      else if (iso < min) ({ y, m, d } = lo);
      return { y, m, d };
    });

  const years: WheelItem[] = [];
  for (let y = lo.y; y <= hi.y; y++) years.push({ value: y, label: String(y) });
  const months: WheelItem[] = MONTHS.map((label, m) => ({ value: m, label: label.slice(0, 3) })).filter(
    ({ value: m }) => !(sel.y === hi.y && m > hi.m) && !(sel.y === lo.y && m < lo.m)
  );
  const days: WheelItem[] = [];
  for (let d = 1; d <= daysIn(sel.y, sel.m); d++) {
    const iso = toIso(sel.y, sel.m, d);
    if (iso >= min && iso <= max) days.push({ value: d, label: pad(d) });
  }

  const weekday = new Date(sel.y, sel.m, sel.d).toLocaleDateString('en-US', { weekday: 'long' });

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[80%]">
      <div className="pt-3 pb-1 flex justify-center shrink-0">
        <div className="w-10 h-1 bg-slate-300 rounded-full" />
      </div>
      <div className="flex items-start justify-between px-5 pt-1 pb-3 shrink-0">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{title}</p>
          <p className="mt-0.5 text-lg font-extrabold text-[#1E293B] tabular-nums">
            {pad(sel.d)} {MONTHS[sel.m]} {sel.y}
          </p>
          <p className="text-[11px] text-slate-400">{weekday}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="px-4">
        <div className="grid grid-cols-[1fr_1.3fr_1.2fr] text-center text-[10px] font-bold uppercase tracking-wider text-slate-400 pb-1">
          <span>Day</span>
          <span>Month</span>
          <span>Year</span>
        </div>
        <div className="relative" style={{ height: ITEM_H * VISIBLE }}>
          {/* Selection band */}
          <div
            className="absolute inset-x-0 rounded-xl bg-slate-100 border border-slate-200/70 pointer-events-none"
            style={{ top: ITEM_H * Math.floor(VISIBLE / 2), height: ITEM_H }}
          />
          <div className="relative h-full grid grid-cols-[1fr_1.3fr_1.2fr]">
            <WheelColumn ariaLabel="Day" items={days} value={sel.d} onChange={(d) => update({ d })} />
            <WheelColumn ariaLabel="Month" items={months} value={sel.m} onChange={(m) => update({ m })} />
            <WheelColumn ariaLabel="Year" items={years} value={sel.y} onChange={(y) => update({ y })} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 pt-5 pb-6 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="h-12 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold bg-white active:bg-slate-50 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onApply(toIso(sel.y, sel.m, sel.d))}
          className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] cursor-pointer"
        >
          Set Date
        </button>
      </div>
    </BottomSheet>
  );
};
