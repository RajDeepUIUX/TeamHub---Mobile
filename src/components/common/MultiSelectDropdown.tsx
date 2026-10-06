import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Search, X } from 'lucide-react';

export interface DropdownOption {
  value: string;
  label: string;
  /** Options with a group are listed under that group's header */
  group?: string;
}

interface MultiSelectDropdownProps {
  label: string;
  placeholder: string;
  options: DropdownOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  /** Shows a search box inside the dropdown (useful for long lists) */
  searchable?: boolean;
  disabled?: boolean;
  /** Shown under the field when disabled */
  disabledHint?: string;
}

const PANEL_HEIGHT = 268;
const GAP = 6;
const SCREEN_MARGIN = 8;

interface PanelPosition {
  left: number;
  width: number;
  top?: number;
  bottom?: number;
  maxHeight: number;
}

/**
 * Field that opens a checkbox list floating over everything (rendered into the device's sheet portal,
 * so it never pushes or gets clipped by the content); flips up near the bottom. Supports select all and search.
 */
export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  label,
  placeholder,
  options,
  selected,
  onChange,
  searchable = false,
  disabled = false,
  disabledHint,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [position, setPosition] = useState<PanelPosition | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const portal = typeof document !== 'undefined' ? document.getElementById('mobile-sheet-portal') : null;

  // Open downward when it fits, otherwise toward the side with more room
  const updatePosition = useCallback(() => {
    const field = fieldRef.current;
    if (!field || !portal) return;
    const portalRect = portal.getBoundingClientRect();
    const rect = field.getBoundingClientRect();
    // The device frame can be CSS-scaled; convert screen px back to layout px
    const scale = portalRect.width / portal.offsetWidth || 1;
    const left = (rect.left - portalRect.left) / scale;
    const width = rect.width / scale;
    const below = (portalRect.bottom - rect.bottom) / scale - GAP - SCREEN_MARGIN;
    const above = (rect.top - portalRect.top) / scale - GAP - SCREEN_MARGIN;
    const needed = Math.min(PANEL_HEIGHT, panelRef.current?.scrollHeight ?? PANEL_HEIGHT);
    if (below >= needed || below >= above) {
      setPosition({ left, width, top: (rect.bottom - portalRect.top) / scale + GAP, maxHeight: Math.min(PANEL_HEIGHT, below) });
    } else {
      setPosition({ left, width, bottom: (portalRect.bottom - rect.top) / scale + GAP, maxHeight: Math.min(PANEL_HEIGHT, above) });
    }
  }, [portal]);

  useLayoutEffect(() => {
    if (!isOpen) return;
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, updatePosition]);

  // Close on outside tap
  useEffect(() => {
    if (!isOpen) return;
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!rootRef.current?.contains(target) && !panelRef.current?.contains(target)) setIsOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [isOpen]);

  const q = query.trim().toLowerCase();
  const visible = options.filter((o) => !q || o.label.toLowerCase().includes(q));
  const allSelected = options.length > 0 && options.every((o) => selected.includes(o.value));
  // Keep the options' order; one block per group (ungrouped options form a single block)
  const groups = visible.reduce<{ name?: string; items: DropdownOption[] }[]>((acc, o) => {
    const last = acc[acc.length - 1];
    if (last && last.name === o.group) last.items.push(o);
    else acc.push({ name: o.group, items: [o] });
    return acc;
  }, []);
  const labelOf = (value: string) => options.find((o) => o.value === value)?.label ?? value;

  const toggle = (value: string) =>
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);

  const summary =
    selected.length === 0
      ? placeholder
      : selected.length === 1
        ? labelOf(selected[0])
        : `${labelOf(selected[0])} +${selected.length - 1} more`;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-[#1E293B]">{label}</span>
        {selected.length > 0 && !disabled && (
          <button type="button" onClick={() => onChange([])} className="text-[11px] font-semibold text-[#2F68FE] cursor-pointer">
            Clear
          </button>
        )}
      </div>

      <div ref={rootRef} className="relative">
      <button
        ref={fieldRef}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((o) => !o)}
        aria-expanded={isOpen}
        className={`w-full h-11 px-3.5 rounded-xl border bg-white flex items-center gap-2 text-left text-xs transition-colors cursor-pointer disabled:cursor-not-allowed disabled:bg-slate-50 ${
          isOpen ? 'border-[#2F68FE] ring-4 ring-blue-50' : 'border-slate-200'
        }`}
      >
        <span className={`flex-1 truncate ${selected.length ? 'font-semibold text-[#1E293B]' : 'font-medium text-slate-400'}`}>
          {summary}
        </span>
        {selected.length > 1 && (
          <span className="px-1.5 py-px rounded-md bg-blue-50 text-[10px] font-bold text-[#2F68FE] shrink-0">{selected.length}</span>
        )}
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && !disabled && portal &&
        createPortal(
        <div
          ref={panelRef}
          className={`absolute z-50 pointer-events-auto flex flex-col rounded-xl border border-slate-200 bg-white shadow-[0_12px_32px_-8px_rgba(15,23,42,0.28)] overflow-hidden animate-in fade-in duration-150 ${
            position?.bottom !== undefined ? 'slide-in-from-bottom-1' : 'slide-in-from-top-1'
          } ${position ? '' : 'invisible'}`}
          style={position ?? { maxHeight: PANEL_HEIGHT }}
        >
          {searchable && (
            <div className="relative shrink-0 border-b border-slate-100">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="w-full h-10 pl-8 pr-8 text-xs font-medium text-[#1E293B] placeholder:text-slate-400 focus:outline-hidden select-text"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
          <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar py-1">
            {!q && options.length > 1 && (
              <OptionRow
                label="Select all"
                checked={allSelected}
                bold
                onClick={() => onChange(allSelected ? [] : options.map((o) => o.value))}
              />
            )}
            {groups.map(({ name, items }) => (
              <div key={name ?? 'ungrouped'}>
                {name && (
                  <p className="px-3.5 pt-2.5 pb-1 text-[10px] font-semibold text-slate-400 truncate">{name}</p>
                )}
                {items.map((o) => (
                  <OptionRow key={o.value} label={o.label} checked={selected.includes(o.value)} onClick={() => toggle(o.value)} />
                ))}
              </div>
            ))}
            {visible.length === 0 && <p className="px-3.5 py-3 text-[11px] text-slate-400">No matches</p>}
          </div>
        </div>,
          portal
        )}
      </div>
      {disabled && disabledHint && <p className="text-[10px] text-slate-400">{disabledHint}</p>}
    </div>
  );
};

const OptionRow: React.FC<{ label: string; checked: boolean; bold?: boolean; onClick: () => void }> = ({
  label,
  checked,
  bold,
  onClick,
}) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={checked}
    onClick={onClick}
    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-xs active:bg-slate-50 cursor-pointer"
  >
    <span
      className={`w-4.5 h-4.5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
        checked ? 'bg-[#2F68FE] border-[#2F68FE] text-white' : 'border-slate-300 bg-white'
      }`}
    >
      {checked && <Check className="w-3 h-3 stroke-[3]" />}
    </span>
    <span className={`truncate ${bold ? 'font-bold text-[#1E293B]' : 'font-medium text-slate-700'}`}>{label}</span>
  </button>
);
