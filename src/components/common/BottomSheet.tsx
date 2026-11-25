import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useBottomSheetContext } from '../../context/BottomSheetContext';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxHeight?: string;
  className?: string;
}

/** Same as .sheet-out in index.css */
const OUT_MS = 260;
const OUT_EASE = 'cubic-bezier(0.4, 0, 0.8, 0.4)';

/**
 * The drawer was removed while on screen (its screen changed or its data was cleared), so React can't animate it:
 * a copy slides out in its place.
 */
const slideOutCopy = (root: HTMLElement) => {
  const panel = root.querySelector<HTMLElement>('[data-sheet-panel]');
  const parent = root.parentElement;
  if (!panel || !parent) return;

  const offset = new DOMMatrixReadOnly(getComputedStyle(panel).transform).m42;
  const backdrop = root.querySelector<HTMLElement>('[data-sheet-backdrop]');
  const opacity = backdrop ? getComputedStyle(backdrop).opacity : '1';
  const copy = root.cloneNode(true) as HTMLElement;
  // cloneNode doesn't carry scroll positions or typed values
  const from = root.querySelectorAll<HTMLElement>('*');
  const scrolls = [...from].map((el) => el.scrollTop);
  const values = [...from].map((el) => (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement ? el.value : null));

  // After React has finished: if the drawer is still there (StrictMode's test unmount), there's nothing to do
  queueMicrotask(() => {
    if (root.isConnected || !parent.isConnected) return;
    copy.style.pointerEvents = 'none';
    copy.setAttribute('aria-hidden', 'true');
    copy.removeAttribute('role');
    parent.appendChild(copy);
    copy.querySelectorAll<HTMLElement>('*').forEach((el, i) => {
      if (scrolls[i]) el.scrollTop = scrolls[i];
      if (values[i] !== null && (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) el.value = values[i]!;
    });
    const timing: KeyframeAnimationOptions = { duration: OUT_MS, easing: OUT_EASE, fill: 'forwards' };
    const copyPanel = copy.querySelector<HTMLElement>('[data-sheet-panel]')!;
    const copyBackdrop = copy.querySelector<HTMLElement>('[data-sheet-backdrop]');
    copyPanel.style.animation = 'none';
    if (copyBackdrop) copyBackdrop.style.animation = 'none';
    copyBackdrop?.animate([{ opacity }, { opacity: 0 }], timing);
    copyPanel.animate([{ transform: `translateY(${offset}px)` }, { transform: 'translateY(100%)' }], timing);
    setTimeout(() => copy.remove(), OUT_MS + 20);
  });
};

/** Bottom drawer: always slides in from the bottom and slides back out, however it's opened or closed */
export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  children,
  maxHeight = 'max-h-[92%]',
  className = '',
}) => {
  const sheetId = useId();
  const { registerSheet, unregisterSheet } = useBottomSheetContext();
  const rootRef = useRef<HTMLDivElement>(null);

  const [phase, setPhase] = useState<'closed' | 'open' | 'closing'>(isOpen ? 'open' : 'closed');
  if (isOpen && phase !== 'open') setPhase('open');
  if (!isOpen && phase === 'open') setPhase('closing');

  // While sliding out, keep showing what was there (parents often clear their data as they close)
  const shown = useRef({ children, maxHeight, className });
  if (isOpen) shown.current = { children, maxHeight, className };

  useEffect(() => {
    registerSheet(sheetId, phase === 'open', phase === 'open' ? onClose : undefined);
  }, [phase, sheetId, registerSheet, onClose]);

  useEffect(() => () => unregisterSheet(sheetId), [sheetId, unregisterSheet]);

  useEffect(() => {
    if (phase !== 'closing') return;
    const timer = setTimeout(() => setPhase('closed'), OUT_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  useLayoutEffect(
    () => () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      if (rootRef.current) slideOutCopy(rootRef.current);
    },
    []
  );

  if (phase === 'closed') return null;

  const closing = phase === 'closing';
  const view = shown.current;

  const sheetElement = (
    <div
      ref={rootRef}
      className={`absolute inset-0 z-40 flex flex-col justify-end select-none overflow-hidden ${closing ? 'pointer-events-none' : 'pointer-events-auto'}`}
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop covering the entire phone screen: top notch, header, tabs, and content */}
      <div
        data-sheet-backdrop
        className={`absolute inset-0 bg-slate-900/60 backdrop-blur-xs cursor-pointer ${closing ? 'sheet-backdrop-out' : 'sheet-backdrop-in'}`}
        onClick={onClose}
      />

      {/* Sheet Container contained strictly within mobile screen */}
      <div
        data-sheet-panel
        className={`relative z-10 w-full bg-white rounded-t-[28px] shadow-2xl flex flex-col ${view.maxHeight} translate-y-0 ${
          closing ? 'sheet-out' : 'sheet-in'
        } ${view.className}`}
      >
        {view.children}
      </div>
    </div>
  );

  const target = typeof document !== 'undefined' ? document.getElementById('mobile-sheet-portal') : null;
  return target ? createPortal(sheetElement, target) : sheetElement;
};
