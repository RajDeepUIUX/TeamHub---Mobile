import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';

export interface DropdownOption<T extends string | number> {
  value: T;
  label: string;
  description?: string;
}

interface DropdownProps<T extends string | number> {
  value: T | null;
  options: ReadonlyArray<T | DropdownOption<T>>;
  onChange: (value: T) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  size?: 'md' | 'lg';
  ariaLabel?: string;
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
const VIEWPORT_MARGIN = 12;

const normalize = <T extends string | number>(opt: T | DropdownOption<T>): DropdownOption<T> =>
  typeof opt === 'object' ? opt : { value: opt, label: String(opt) };

/**
 * Custom select that renders its menu into the device's sheet portal, so it
 * floats above bottom sheets and never gets clipped by scroll containers.
 */
export function Dropdown<T extends string | number>({
  value,
  options,
  onChange,
  placeholder = 'Select',
  icon,
  size = 'lg',
  ariaLabel,
}: DropdownProps<T>) {
  const items = options.map(normalize);
  const selected = items.find((o) => o.value === value);

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

    const left = (rect.left - portalRect.left) / scale;
    const width = rect.width / scale;
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
  }, [portal]);

  useLayoutEffect(() => {
    if (!isOpen) return;
    updatePosition();
    const handler = () => updatePosition();
    window.addEventListener('resize', handler);
    window.addEventListener('scroll', handler, true);
    return () => {
      window.removeEventListener('resize', handler);
      window.removeEventListener('scroll', handler, true);
    };
  }, [isOpen, updatePosition]);

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
      setActiveIndex((i) => Math.min(items.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (items[activeIndex]) choose(items[activeIndex]);
    }
  };

  const height = size === 'lg' ? 'h-12' : 'h-11';

  const menu =
    isOpen && position && portal
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
                    data-index={idx}
                    onClick={() => choose(opt)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`w-full min-h-10 px-3 py-2 rounded-xl flex items-center justify-between gap-3 text-left text-xs transition-colors cursor-pointer ${
                      isSelected
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
    </>
  );
}
