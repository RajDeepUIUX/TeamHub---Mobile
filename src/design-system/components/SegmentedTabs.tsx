import React from 'react';

export interface SegmentedTabOption<T extends string> {
  id: T;
  label: string;
  /** Optional count badge (e.g. pending items) */
  badge?: number;
}

interface SegmentedTabsProps<T extends string> {
  options: SegmentedTabOption<T>[];
  value: T;
  onChange: (id: T) => void;
  ariaLabel?: string;
}

/** Pill-style segmented control for switching views within a tab (e.g. My / Team's) */
export function SegmentedTabs<T extends string>({ options, value, onChange, ariaLabel }: SegmentedTabsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="grid gap-1 p-1 rounded-2xl bg-slate-100/90 border border-slate-200/60"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map(({ id, label, badge }) => {
        const isActive = value === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(id)}
            className={`h-9 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              isActive
                ? 'bg-white text-[#1E293B] font-bold shadow-[0_1px_3px_rgba(15,23,42,0.12)]'
                : 'text-slate-500 font-semibold'
            }`}
          >
            <span className="truncate">{label}</span>
            {badge ? (
              <span
                className={`min-w-4.5 h-4.5 px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${
                  isActive ? 'bg-violet-500 text-white' : 'bg-slate-300/70 text-slate-600'
                }`}
              >
                {badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
