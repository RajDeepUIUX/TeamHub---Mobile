import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { BottomSheet } from './BottomSheet';
import { WheelColumn, WheelItem } from './DateWheelSheet';

interface TimeWheelSheetProps {
  isOpen: boolean;
  title: string;
  /** "HH:MM" (24h), or '' for none */
  value: string;
  /** Minute step, e.g. 15 → 00 / 15 / 30 / 45 */
  step?: number;
  onClose: () => void;
  onApply: (value: string) => void;
}

const ITEM_H = 40;
const VISIBLE = 5;
const pad = (n: number) => String(n).padStart(2, '0');

const HOURS: WheelItem[] = Array.from({ length: 24 }, (_, h) => ({ value: h, label: pad(h) }));

/** Hour / minute wheels — faster than scrolling a 96-item list of times */
export const TimeWheelSheet: React.FC<TimeWheelSheetProps> = ({ isOpen, title, value, step = 15, onClose, onApply }) => {
  const minutes: WheelItem[] = Array.from({ length: 60 / step }, (_, i) => ({ value: i * step, label: pad(i * step) }));
  const parse = () => {
    const [h, m] = (value || '00:00').split(':').map(Number);
    return { h: h || 0, m: Math.floor((m || 0) / step) * step };
  };
  const [sel, setSel] = useState(parse);

  useEffect(() => {
    if (isOpen) setSel(parse());
    // Re-seed from the field each time the sheet opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const h12 = sel.h % 12 || 12;
  const meridiem = sel.h < 12 ? 'AM' : 'PM';

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[80%]">
      <div className="pt-3 pb-1 flex justify-center shrink-0">
        <div className="w-10 h-1 bg-slate-300 rounded-full" />
      </div>
      <div className="flex items-start justify-between px-5 pt-1 pb-3 shrink-0">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{title}</p>
          <p className="mt-0.5 text-lg font-extrabold text-[#1E293B] tabular-nums">
            {pad(sel.h)}:{pad(sel.m)}
          </p>
          <p className="text-[11px] text-slate-400 tabular-nums">
            {h12}:{pad(sel.m)} {meridiem}
          </p>
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

      <div className="px-10">
        <div className="grid grid-cols-2 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400 pb-1">
          <span>Hour</span>
          <span>Minute</span>
        </div>
        <div className="relative" style={{ height: ITEM_H * VISIBLE }}>
          <div
            className="absolute inset-x-0 rounded-xl bg-slate-100 border border-slate-200/70 pointer-events-none"
            style={{ top: ITEM_H * Math.floor(VISIBLE / 2), height: ITEM_H }}
          />
          <span
            className="absolute left-1/2 -translate-x-1/2 text-[15px] font-bold text-[#1E293B] pointer-events-none"
            style={{ top: ITEM_H * Math.floor(VISIBLE / 2), lineHeight: `${ITEM_H}px` }}
          >
            :
          </span>
          <div className="relative h-full grid grid-cols-2">
            <WheelColumn ariaLabel="Hour" items={HOURS} value={sel.h} onChange={(h) => setSel((s) => ({ ...s, h }))} />
            <WheelColumn ariaLabel="Minute" items={minutes} value={sel.m} onChange={(m) => setSel((s) => ({ ...s, m }))} />
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
          onClick={() => onApply(`${pad(sel.h)}:${pad(sel.m)}`)}
          className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] cursor-pointer"
        >
          Set Time
        </button>
      </div>
    </BottomSheet>
  );
};
