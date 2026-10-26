import React, { useEffect, useRef } from 'react';
import { useEdgeBounce } from '../../hooks/useEdgeBounce';

export interface UnderlineTabOption<T extends string> {
  id: T;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  /** Optional count (e.g. unread posts) */
  badge?: number;
}

interface UnderlineTabsProps<T extends string> {
  options: UnderlineTabOption<T>[];
  value: T;
  onChange: (id: T) => void;
  ariaLabel?: string;
  className?: string;
  /** A light line under the tabs (blue on the selected one) */
  separated?: boolean;
}

/** Scrolling text tabs with a blue underline on the selected one (as in My Profile: Personal / Professional / …) */
export function UnderlineTabs<T extends string>({ options, value, onChange, ariaLabel, className = '', separated = false }: UnderlineTabsProps<T>) {
  const trackRef = useRef<HTMLDivElement>(null);
  useEdgeBounce(trackRef);

  // Keep the selected tab centred in the strip
  useEffect(() => {
    const track = trackRef.current;
    const tab = track?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (track && tab) track.scrollTo({ left: tab.offsetLeft - (track.clientWidth - tab.offsetWidth) / 2, behavior: 'smooth' });
  }, [value]);

  return (
    <div ref={trackRef} role="tablist" aria-label={ariaLabel} className={`relative flex ${separated ? '' : 'gap-1'} overflow-x-auto overscroll-x-contain no-scrollbar px-2 ${className}`}>
      {options.map(({ id, label, icon: Icon, badge }) => {
        const on = id === value;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => !on && onChange(id)}
            className={`relative h-12 px-3 flex items-center gap-1.5 text-[13px] font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              on ? 'text-[#2F68FE]' : 'text-slate-500 active:text-[#1E293B]'
            }`}
          >
            {Icon && <Icon className="w-4 h-4" />}
            {label}
            {badge ? (
              <span
                className={`min-w-4.5 h-4.5 px-1 rounded-full text-[10px] font-bold flex items-center justify-center tabular-nums ${
                  on ? 'bg-[#2F68FE] text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {badge}
              </span>
            ) : null}
            {/* Full tab width with no gap between tabs, so the lines join into one under the strip */}
            {separated && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-slate-200" />}
            <span
              className={`absolute left-2 right-2 bottom-0 h-[3px] rounded-t-full bg-[#2F68FE] transition-opacity duration-200 ${on ? 'opacity-100' : 'opacity-0'}`}
            />
          </button>
        );
      })}
    </div>
  );
}
