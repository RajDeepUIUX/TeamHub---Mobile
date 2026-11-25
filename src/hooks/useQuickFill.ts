import { useEffect, useRef } from 'react';

/** Forms on screen that can be filled; the last one added (e.g. a sheet over a page) is used */
const handlers: { current: () => void }[] = [];

/** Lets the studio's Quick Fill button fill this form. Pass undefined while the form isn't showing (a closed sheet). */
export function useQuickFill(fill: (() => void) | undefined) {
  const ref = useRef<() => void>(() => {});
  ref.current = fill ?? (() => {});
  const active = Boolean(fill);
  useEffect(() => {
    if (!active) return;
    handlers.push(ref);
    return () => {
      handlers.splice(handlers.indexOf(ref), 1);
    };
  }, [active]);
}

/**
 * Fills the form that's showing. HRMS screens have their own Quick Fill button in the app, so that one is pressed.
 * Returns false when there's nothing to fill.
 */
export function runQuickFill(): boolean {
  const top = handlers[handlers.length - 1];
  if (top) {
    top.current();
    return true;
  }
  const inApp = [...document.querySelectorAll<HTMLButtonElement>('[data-app-frame] button')].filter(
    (b) => b.textContent?.trim() === 'Quick Fill' && b.offsetParent !== null
  );
  const button = inApp[inApp.length - 1];
  button?.click();
  return Boolean(button);
}
