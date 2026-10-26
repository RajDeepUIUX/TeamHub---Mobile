import { RefObject, useEffect } from 'react';

const MAX_PULL = 56; // px the strip can be dragged past its end
const RESISTANCE = 0.4; // share of the finger movement the pull follows at the edge
const STIFFNESS = 260; // spring back strength
const DAMPING = 24; // ~critically damped: settles with just a hint of overshoot
const WHEEL_KICK = 16; // initial velocity per px of wheel delta when a wheel / trackpad hits the end
const MIN_KICK = 420; // px/s: even a light trackpad flick shows a visible (~10px) bounce
const MAX_KICK = 1100; // px/s: ~25px at most
const WHEEL_IDLE_MS = 180; // a wheel gesture (incl. trackpad momentum) is over after this long without events

/**
 * Small rubber-band bounce when a horizontal strip (e.g. tabs) is scrolled past either end.
 * Touch: the strip follows the finger with resistance and springs back on release.
 * Wheel / trackpad: one short bounce per gesture; trailing momentum events are ignored so it never sticks.
 * Animated with a per-frame spring on the GPU (translate3d), so it stays smooth.
 */
export function useEdgeBounce(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let x = 0; // current offset
    let v = 0; // velocity, px/s
    let raf = 0;
    let last = 0;
    let lastTouchX: number | null = null;
    let wheelLocked = false; // this wheel gesture already bounced
    let wheelTimer: number | undefined;

    const atStart = () => el.scrollLeft <= 0;
    const atEnd = () => el.scrollLeft >= el.scrollWidth - el.clientWidth - 1;
    const paint = () => {
      el.style.transform = Math.abs(x) < 0.1 ? '' : `translate3d(${x.toFixed(2)}px,0,0)`;
    };

    const step = (t: number) => {
      const dt = Math.min(0.032, (t - last) / 1000 || 0.016);
      last = t;
      const a = -STIFFNESS * x - DAMPING * v;
      v += a * dt;
      x += v * dt;
      if (Math.abs(x) < 0.1 && Math.abs(v) < 5) {
        x = 0;
        v = 0;
        paint();
        el.style.willChange = '';
        raf = 0;
        return;
      }
      paint();
      raf = requestAnimationFrame(step);
    };
    const spring = () => {
      if (raf) return;
      el.style.willChange = 'transform';
      last = performance.now();
      raf = requestAnimationFrame(step);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    /* Touch: follow the finger past the end */
    const onTouchStart = (e: TouchEvent) => {
      lastTouchX = e.touches[0].clientX;
      if (raf) {
        stop();
        v = 0;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (lastTouchX === null) return;
      const cx = e.touches[0].clientX;
      const dx = cx - lastTouchX; // + = dragging right (towards the start)
      lastTouchX = cx;
      if (x === 0 && !(dx > 0 ? atStart() : dx < 0 ? atEnd() : false)) return;
      if (x !== 0 && Math.sign(dx) !== Math.sign(x)) {
        // Easing back in: give the slack back 1:1 before scrolling resumes
        x = Math.abs(dx) >= Math.abs(x) ? 0 : x + dx;
      } else {
        x = Math.max(-MAX_PULL, Math.min(MAX_PULL, x + dx * RESISTANCE * (1 - Math.abs(x) / MAX_PULL)));
      }
      el.style.willChange = 'transform';
      paint();
    };
    const onTouchEnd = () => {
      lastTouchX = null;
      if (x !== 0) spring();
    };

    /* Wheel / trackpad: a single kick when the gesture runs into the end */
    const onWheel = (e: WheelEvent) => {
      const d = Math.abs(e.deltaX) >= Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0;
      if (!d) return;
      window.clearTimeout(wheelTimer);
      wheelTimer = window.setTimeout(() => (wheelLocked = false), WHEEL_IDLE_MS);
      if (wheelLocked) return;
      const hitsEdge = d < 0 ? atStart() : atEnd();
      if (!hitsEdge) return;
      wheelLocked = true;
      // Scrolling right (d > 0) at the end pushes the strip left, and vice versa
      v = -Math.sign(d) * Math.min(MAX_KICK, Math.max(MIN_KICK, Math.abs(d) * WHEEL_KICK));
      spring();
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd);
    el.addEventListener('touchcancel', onTouchEnd);
    el.addEventListener('wheel', onWheel, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
      el.removeEventListener('wheel', onWheel);
      window.clearTimeout(wheelTimer);
      stop();
      el.style.transform = '';
      el.style.willChange = '';
    };
  }, [ref]);
}
