import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { BottomSheet } from '../../components/common/BottomSheet';

export interface DropdownOption<T extends string | number> {
  value: T;
  label: string;
  description?: string;
  /** Shown greyed out and cannot be selected */
  disabled?: boolean;
}

interface DropdownProps<T extends string | number> {
  value: T | null;
  options: ReadonlyArray<T | DropdownOption<T>>;
  onChange: (value: T) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  size?: 'md' | 'lg';
  ariaLabel?: string;
  /** Let the menu grow wider than a narrow trigger (px); it stays inside the screen */
  menuMinWidth?: number;
  /** Title of the search sheet used for long lists (defaults to ariaLabel) */
  sheetTitle?: string;
}

interface MenuPosition {
  left: number;
  width: number;
  top?: number;
  bottom?: number;
  maxHeight: number;
}

const GAP = 6;
const MAX_MENU_HEIGHT = 264;
/** Lists longer than this open a bottom sheet with search instead of the inline menu */
const SHEET_THRESHOLD = 6;
const VIEWPORT_MARGIN = 12;

const normalize = <T extends string | number>(opt: T | DropdownOption<T>): DropdownOption<T> =>
  typeof opt === 'object' ? opt : { value: opt, label: String(opt) };

/* ------------------------- Search sheet (long lists) ------------------------ */

function SearchSelectSheet<T extends string | number>({
  isOpen,
  title,
  items,
  value,
  onClose,
  onChoose,
}: {
  isOpen: boolean;
  title: string;
  items: DropdownOption<T>[];
  value: T | null;
  onClose: () => void;
  onChoose: (opt: DropdownOption<T>) => void;
}) {
  const [query, setQuery] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setQuery('');
    // Start with the current choice in view
    requestAnimationFrame(() => listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'center' }));
  }, [isOpen]);

  const q = query.trim().toLowerCase();
  const shown = q ? items.filter((o) => `${o.label} ${o.description ?? ''}`.toLowerCase().includes(q)) : items;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[80%]">
      <div className="pt-3 pb-1 flex justify-center shrink-0">
        <div className="w-10 h-1 bg-slate-300 rounded-full" />
      </div>
      <div className="flex items-center justify-between px-5 pt-1 pb-3 shrink-0">
        <h2 className="text-base font-bold text-[#1E293B]">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="px-4 pb-2 shrink-0">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${items.length} options`}
            aria-label={`Search ${title}`}
            className="w-full h-11 pl-10 pr-9 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-medium text-[#1E293B] placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:border-[#2F68FE] focus:ring-4 focus:ring-blue-50 select-text [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      <div ref={listRef} role="listbox" aria-label={title} className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-3 pb-6">
        {shown.map((opt) => {
          const isSelected = opt.value === value;
          return (
            <button
              key={String(opt.value)}
              type="button"
              role="option"
              aria-selected={isSelected}
              disabled={opt.disabled}
              onClick={() => onChoose(opt)}
              className={`w-full min-h-12 px-3 py-2.5 rounded-xl flex items-center justify-between gap-3 text-left text-[13px] transition-colors ${
                opt.disabled
                  ? 'text-slate-300 font-medium cursor-not-allowed'
                  : isSelected
                    ? 'bg-blue-50 text-[#2F68FE] font-bold cursor-pointer'
                    : 'text-slate-700 font-medium active:bg-slate-50 cursor-pointer'
              }`}
            >
              <span className="min-w-0 leading-snug">
                {opt.label}
                {opt.description && <span className="block text-[11px] font-normal text-slate-400">{opt.description}</span>}
              </span>
              {isSelected && <Check className="w-4 h-4 shrink-0 stroke-[2.5]" />}
            </button>
          );
        })}
        {shown.length === 0 && (
          <p className="py-10 text-center text-xs text-slate-400">
            Nothing matches “{query.trim()}”. Try a shorter word.
          </p>
        )}
      </div>
    </BottomSheet>
  );
}

/**
 * Custom select that renders its menu into the device's sheet portal, so it
 * floats above bottom sheets and never gets clipped by scroll containers.
 * Long lists (more than 6 options) open a bottom sheet with search instead.
 */
export function Dropdown<T extends string | number>({
  value,
  options,
  onChange,
  placeholder = 'Select',
  icon,
  size = 'lg',
  ariaLabel,
  menuMinWidth = 0,
  sheetTitle,
}: DropdownProps<T>) {
  const items = options.map(normalize);
  const selected = items.find((o) => o.value === value);
  const useSheet = items.length > SHEET_THRESHOLD;

  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<MenuPosition | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const portal = typeof document !== 'undefined' ? document.getElementById('mobile-sheet-portal') : null;

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger || !portal) return;
    const portalRect = portal.getBoundingClientRect();
    const rect = trigger.getBoundingClientRect();
    // The device frame can be CSS-scaled; convert screen px back to layout px.
    const scale = portalRect.width / portal.offsetWidth || 1;

    const portalWidth = portal.offsetWidth;
    const width = Math.min(Math.max(rect.width / scale, menuMinWidth), portalWidth - 2 * VIEWPORT_MARGIN);
    // Keep a widened menu inside the screen
    const left = Math.min(
      Math.max(VIEWPORT_MARGIN, (rect.left - portalRect.left) / scale),
      portalWidth - width - VIEWPORT_MARGIN
    );
    const spaceBelow = (portalRect.bottom - rect.bottom) / scale - GAP - VIEWPORT_MARGIN;
    const spaceAbove = (rect.top - portalRect.top) / scale - GAP - VIEWPORT_MARGIN - 40;

    if (spaceBelow >= Math.min(MAX_MENU_HEIGHT, 160) || spaceBelow >= spaceAbove) {
      setPosition({
        left,
        width,
        top: (rect.bottom - portalRect.top) / scale + GAP,
        maxHeight: Math.min(MAX_MENU_HEIGHT, spaceBelow),
      });
    } else {
      setPosition({
        left,
        width,
        bottom: (portalRect.bottom - rect.top) / scale + GAP,
        maxHeight: Math.min(MAX_MENU_HEIGHT, spaceAbove),
      });
    }
  }, [portal, menuMinWidth]);

  useLayoutEffect(() => {
    if (!isOpen || useSheet) return;
    updatePosition();
    const handler = () => updatePosition();
    window.addEventListener('resize', handler);
    window.addEventListener('scroll', handler, true);
    return () => {
      window.removeEventListener('resize', handler);
      window.removeEventListener('scroll', handler, true);
    };
  }, [isOpen, useSheet, updatePosition]);

  // Bring the selected option into view when the menu opens
  useEffect(() => {
    if (!isOpen || !position) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [isOpen, position, activeIndex]);

  const open = () => {
    setActiveIndex(Math.max(0, items.findIndex((o) => o.value === value)));
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const choose = (opt: DropdownOption<T>) => {
    if (opt.disabled) return;
    onChange(opt.value);
    close();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        open();
      }
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => {
        let next = i + 1;
        while (next < items.length && items[next].disabled) next++;
        return next < items.length ? next : i;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => {
        let next = i - 1;
        while (next >= 0 && items[next].disabled) next--;
        return next >= 0 ? next : i;
      });
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (items[activeIndex]) choose(items[activeIndex]);
    }
  };

  const height = size === 'lg' ? 'h-12' : 'h-11';

  const menu =
    isOpen && position && portal && !useSheet
      ? createPortal(
          <div className="absolute inset-0 z-50 pointer-events-auto" onKeyDown={handleKeyDown}>
            {/* Click-away layer */}
            <div className="absolute inset-0" onClick={close} />
            <div
              ref={listRef}
              role="listbox"
              aria-label={ariaLabel}
              className={`absolute bg-white border border-slate-200/80 rounded-2xl p-1.5 overflow-y-auto no-scrollbar shadow-[0_16px_40px_-12px_rgba(15,23,42,0.28)] animate-in fade-in duration-150 ${
                position.top !== undefined ? 'slide-in-from-top-1' : 'slide-in-from-bottom-1'
              }`}
              style={{
                left: position.left,
                width: position.width,
                top: position.top,
                bottom: position.bottom,
                maxHeight: position.maxHeight,
              }}
            >
              {items.map((opt, idx) => {
                const isSelected = opt.value === value;
                const isActive = idx === activeIndex;
                return (
                  <button
                    key={String(opt.value)}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={opt.disabled || undefined}
                    disabled={opt.disabled}
                    data-index={idx}
                    onClick={() => choose(opt)}
                    onMouseEnter={() => !opt.disabled && setActiveIndex(idx)}
                    className={`w-full min-h-10 px-3 py-2 rounded-xl flex items-center justify-between gap-3 text-left text-xs transition-colors ${
                      opt.disabled
                        ? 'text-slate-300 font-medium cursor-not-allowed'
                        : isSelected
                        ? 'bg-blue-50 text-[#2F68FE] font-bold'
                        : isActive
                          ? 'bg-slate-50 text-[#1E293B] font-medium'
                          : 'text-slate-700 font-medium'
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate">{opt.label}</span>
                      {opt.description && (
                        <span className="block text-[10px] font-normal text-slate-400 truncate">
                          {opt.description}
                        </span>
                      )}
                    </span>
                    {isSelected && <Check className="w-4 h-4 shrink-0 stroke-[2.5]" />}
                  </button>
                );
              })}
            </div>
          </div>,
          portal
        )
      : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        onClick={() => (isOpen ? close() : open())}
        onKeyDown={handleKeyDown}
        className={`w-full ${height} px-3.5 rounded-xl border bg-white flex items-center gap-2.5 text-xs shadow-2xs transition-all cursor-pointer focus:outline-hidden ${
          isOpen
            ? 'border-[#2F68FE] ring-4 ring-blue-50'
            : 'border-slate-200 hover:border-slate-300 focus-visible:border-[#2F68FE] focus-visible:ring-4 focus-visible:ring-blue-50'
        }`}
      >
        {icon && <span className="text-slate-400 shrink-0 flex">{icon}</span>}
        <span
          className={`flex-1 min-w-0 truncate text-left ${
            selected ? 'font-semibold text-[#1E293B]' : 'font-medium text-slate-400'
          }`}
        >
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#2F68FE]' : 'text-slate-400'
          }`}
        />
      </button>
      {menu}
      {useSheet && (
        <SearchSelectSheet
          isOpen={isOpen}
          title={sheetTitle ?? ariaLabel ?? placeholder}
          items={items}
          value={value}
          onClose={close}
          onChoose={choose}
        />
      )}
    </>
  );
}
