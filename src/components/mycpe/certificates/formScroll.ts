import React, { useEffect } from 'react';

/** Scrolls only this container; the delay lets a newly shown field render first */
export const scrollToError = (ref: React.RefObject<HTMLElement | null>, key: string) =>
  window.setTimeout(() => {
    const box = ref.current;
    const el = box?.querySelector<HTMLElement>(`[data-error-key="${CSS.escape(key)}"]`);
    if (!box || !el) return;
    // The studio's phone may be scaled
    const zoom = box.getBoundingClientRect().height / box.clientHeight || 1;
    const top = box.scrollTop + (el.getBoundingClientRect().top - box.getBoundingClientRect().top) / zoom - 90;
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    box.scrollTo({ top: Math.max(0, top), behavior: calm ? 'auto' : 'smooth' });
  }, 60);

/** On a phone, the keyboard shouldn't cover the field being typed in */
export const useKeyboardRoom = (ref: React.RefObject<HTMLElement | null>) =>
  useEffect(() => {
    const box = ref.current;
    if (!box || !window.matchMedia('(pointer: coarse)').matches) return;
    const onFocus = (e: FocusEvent) => {
      const el = e.target as HTMLElement;
      if (!el.matches('input, textarea')) return;
      setTimeout(() => {
        const b = box.getBoundingClientRect();
        const r = el.getBoundingClientRect();
        if (r.top < b.top + 24 || r.bottom > b.bottom - 24) box.scrollBy({ top: r.top - b.top - b.height / 3, behavior: 'smooth' });
      }, 320);
    };
    box.addEventListener('focusin', onFocus);
    return () => box.removeEventListener('focusin', onFocus);
  }, [ref]);
