import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { Check, X } from 'lucide-react';
import { McButton } from '../common/McUi';
import { MYCPE_PLANS, MyCpePlanId } from '../data/mycpeAuthData';

/** Outline with the step cut out of the top-right corner; open at the bottom, where it fades away */
const outline = (w: number, h: number, inset: number, stepX: number, stepY: number) => {
  const r = 16;
  const right = w - inset;
  return `M${inset} ${h}V${inset + r}A${r} ${r} 0 0 1 ${inset + r} ${inset}H${stepX - r}A${r} ${r} 0 0 1 ${stepX} ${inset + r}V${stepY - r}A${r} ${r} 0 0 0 ${stepX + r} ${stepY}H${right - r}A${r} ${r} 0 0 1 ${right} ${stepY + r}V${h}`;
};

const PlanCard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { w, h } = size;
  return (
    <div ref={ref} className="relative flex-1 min-h-0 flex flex-col">
      {w > 0 && (
        <svg className="absolute inset-0 pointer-events-none" width={w} height={h} aria-hidden="true">
          <defs>
            <linearGradient id={`${id}-line`} x1="0" y1="0" x2="0" y2={h} gradientUnits="userSpaceOnUse">
              <stop offset="0.45" stopColor="#6B34C5" />
              <stop offset="1" stopColor="#6B34C5" stopOpacity="0" />
            </linearGradient>
            <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ECE9FB" />
              <stop offset="1" stopColor="#FFFFFF" />
            </linearGradient>
          </defs>
          <path d={`${outline(w, h, 8, w - 87, 48)}Z`} fill={`url(#${id}-fill)`} />
          <path d={outline(w, h, 0.5, w - 79, 39.5)} fill="none" stroke={`url(#${id}-line)`} />
        </svg>
      )}
      {children}
    </div>
  );
};

/** Feature list with the thin purple scroll bar from the design (only when there's more to scroll) */
const FeatureList: React.FC<{ features: string[] }> = ({ features }) => {
  const ref = useRef<HTMLUListElement>(null);
  const [bar, setBar] = useState<{ size: number; pos: number } | null>(null);

  const update = () => {
    const el = ref.current;
    if (!el) return;
    if (el.scrollHeight <= el.clientHeight + 1) return setBar(null);
    const size = el.clientHeight / el.scrollHeight;
    setBar({ size, pos: (el.scrollTop / (el.scrollHeight - el.clientHeight)) * (1 - size) });
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTop = 0;
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [features]);

  return (
    <div className="relative mt-5 flex-1 min-h-0">
      <ul ref={ref} onScroll={update} className="h-full overflow-y-auto no-scrollbar pl-[25px] pr-9 pb-3 space-y-2.5">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5">
            <span className="w-[22px] h-[22px] rounded-full bg-mc-primary-soft text-mc-primary flex items-center justify-center shrink-0">
              <Check className="w-3 h-3 stroke-[2.5]" />
            </span>
            <span className="pt-px text-[15px] leading-[22px] text-mc-text font-medium">{f}</span>
          </li>
        ))}
      </ul>
      {bar && (
        <span className="absolute right-[14px] top-0 bottom-3 w-1 rounded-full bg-mc-primary-soft overflow-hidden" aria-hidden="true">
          <span className="absolute inset-x-0 rounded-full bg-mc-primary" style={{ top: `${bar.pos * 100}%`, height: `${bar.size * 100}%` }} />
        </span>
      )}
    </div>
  );
};

export const McSubscribe: React.FC<{ initialPlan?: MyCpePlanId; onClose: () => void; onSubscribe: (plan: MyCpePlanId) => void }> = ({
  initialPlan = 'Gold',
  onClose,
  onSubscribe,
}) => {
  const [planId, setPlanId] = useState<MyCpePlanId>(initialPlan);
  const plan = MYCPE_PLANS.find((p) => p.id === planId)!;

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-white px-4" style={{ paddingTop: 'calc(var(--safe-top) + 11px)', paddingBottom: 'calc(var(--safe-bottom) + 40px)' }}>
      <button
        type="button"
        onClick={onClose}
        className="self-end w-8 h-8 rounded-full bg-mc-line text-mc-ink-2 flex items-center justify-center shrink-0 active:bg-mc-line-strong cursor-pointer"
        aria-label="Close"
      >
        <X className="w-4.5 h-4.5" />
      </button>
      <h1 className="mt-5 text-center text-[30px] leading-[38px] font-semibold text-mc-ink shrink-0">
        Get Started with
        <br />
        Unlimited Learning
      </h1>
      <div role="tablist" aria-label="Plan" className="mt-4 mx-auto w-[250px] h-[42px] p-0.5 rounded-full bg-mc-line grid grid-cols-2 shrink-0">
        {MYCPE_PLANS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={p.id === planId}
            onClick={() => setPlanId(p.id)}
            className={`rounded-full text-sm font-medium transition-colors cursor-pointer ${p.id === planId ? 'bg-mc-night text-white' : 'text-mc-ink-2'}`}
          >
            {p.id}
          </button>
        ))}
      </div>
      <div className="mt-4 flex-1 min-h-0 flex flex-col">
        <PlanCard>
          <div className="relative shrink-0 pl-[25px] pt-5">
            <p className="text-lg leading-6 text-mc-indigo">{plan.id}</p>
            <p className="mt-0.5 flex items-baseline gap-2">
              <span className="text-4xl leading-11 font-medium text-mc-indigo">{plan.price}</span>
              <span className="text-base text-mc-text">/ year</span>
            </p>
          </div>
          <FeatureList features={plan.features} />
        </PlanCard>
      </div>
      <McButton onClick={() => onSubscribe(plan.id)} className="mt-8 shrink-0">
        Subscribe @ {plan.price}/yr
      </McButton>
    </div>
  );
};
