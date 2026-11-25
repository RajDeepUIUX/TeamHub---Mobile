import { useEffect } from 'react';

const DRAG_PX = 4;

/**
 * Studio mockup only: text can be dragged over, double-clicked and copied (see [data-app-frame='studio'] in index.css).
 * Dragging across a button's text selects it instead of pressing the button; plain clicks work as usual.
 */
export function useTextSelection(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    let start: { x: number; y: number } | null = null;

    const inFrame = (t: EventTarget | null) => t instanceof Element && t.closest("[data-app-frame='studio']") !== null;
    const onDown = (e: MouseEvent) => {
      start = e.button === 0 && inFrame(e.target) ? { x: e.clientX, y: e.clientY } : null;
    };
    const onClick = (e: MouseEvent) => {
      const from = start;
      start = null;
      if (!from || Math.hypot(e.clientX - from.x, e.clientY - from.y) < DRAG_PX) return;
      if (!window.getSelection()?.toString().trim()) return;
      e.stopPropagation();
      e.preventDefault();
    };
    // Images and links would otherwise be picked up and dragged
    const onDragStart = (e: DragEvent) => inFrame(e.target) && e.preventDefault();

    window.addEventListener('mousedown', onDown, true);
    window.addEventListener('click', onClick, true);
    window.addEventListener('dragstart', onDragStart, true);
    return () => {
      window.removeEventListener('mousedown', onDown, true);
      window.removeEventListener('click', onClick, true);
      window.removeEventListener('dragstart', onDragStart, true);
    };
  }, [enabled]);
}
