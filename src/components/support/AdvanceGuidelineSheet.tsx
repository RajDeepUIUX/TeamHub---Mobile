import React, { useEffect, useRef, useState } from 'react';
import { ArrowUp, Check, ChevronDown, ListOrdered, X } from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet';
import { ADVANCE_GUIDELINE, GuideBlock } from '../../data/advanceSalaryData';

/** Renders **bold** spans */
const Rich: React.FC<{ text: string }> = ({ text }) => (
  <>
    {text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
      i % 2 ? (
        <strong key={i} className="font-semibold text-[#1E293B]">
          {part}
        </strong>
      ) : (
        part
      )
    )}
  </>
);

const Bullet: React.FC<{ children: React.ReactNode; hollow?: boolean }> = ({ children, hollow }) => (
  <li className="flex gap-2">
    <span
      className={`w-1.5 h-1.5 rounded-full mt-[7px] shrink-0 ${hollow ? 'border border-slate-400' : 'bg-[#2F68FE]'}`}
    />
    <span className="min-w-0">{children}</span>
  </li>
);

const Block: React.FC<{ block: GuideBlock }> = ({ block }) => {
  switch (block.t) {
    case 'p':
      return (
        <p>
          <Rich text={block.text} />
        </p>
      );
    case 'h':
      return <h4 className="pt-1 text-[12.5px] font-bold text-[#1E293B]">{block.text}</h4>;
    case 'ul':
      return (
        <ul className="space-y-1.5">
          {block.items.map((item) =>
            typeof item === 'string' ? (
              <Bullet key={item}>
                <Rich text={item} />
              </Bullet>
            ) : (
              <Bullet key={item.text}>
                <Rich text={item.text} />
                <ul className="mt-1.5 space-y-1">
                  {item.children.map((c) => (
                    <Bullet key={c} hollow>
                      {c}
                    </Bullet>
                  ))}
                </ul>
              </Bullet>
            )
          )}
        </ul>
      );
    case 'ol':
      return (
        <ol className="space-y-1.5">
          {block.items.map((item, i) => (
            <li key={item} className="flex gap-2.5">
              <span className="w-5 h-5 rounded-full bg-blue-50 text-[#2F68FE] text-[10px] font-bold flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <span className="min-w-0 pt-px">{item}</span>
            </li>
          ))}
        </ol>
      );
    case 'path':
      return (
        <span className="inline-block px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-[11.5px] font-bold text-[#1E293B]">
          {block.text}
        </span>
      );
    case 'code':
      return (
        <code className="inline-block px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-mono text-[12px] font-bold text-[#1E293B] tracking-wider">
          {block.text}
        </code>
      );
    case 'table':
      // Stacked cards read better than a wide table on a phone
      return (
        <div className="space-y-2">
          {block.rows.map((row) => (
            <div key={row[0]} className="rounded-xl bg-white border border-slate-200/80 overflow-hidden">
              <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 text-[12px] font-bold text-[#1E293B]">{row[0]}</div>
              <dl className="px-3 py-2 space-y-1.5">
                {row.slice(1).map((cell, i) => (
                  <div key={block.head[i + 1]} className="flex items-start justify-between gap-3">
                    <dt className="text-[11px] text-slate-400 shrink-0 max-w-[45%]">{block.head[i + 1]}</dt>
                    <dd className="text-[11.5px] font-semibold text-slate-700 text-right">{cell}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      );
    case 'flow':
      return (
        <ol className="rounded-xl bg-white border border-slate-200/80 p-3">
          {block.steps.map((step, i) => {
            const last = i === block.steps.length - 1;
            return (
              <li key={step} className="flex gap-2.5">
                <span className="flex flex-col items-center">
                  <span className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${last ? 'bg-emerald-500' : 'bg-[#2F68FE]'}`} />
                  {!last && <span className="w-px flex-1 bg-slate-200 my-0.5" />}
                </span>
                <span className={`text-[11.5px] font-semibold text-slate-700 ${last ? '' : 'pb-2'}`}>{step}</span>
              </li>
            );
          })}
        </ol>
      );
  }
};

interface AdvanceGuidelineSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdvanceGuidelineSheet: React.FC<AdvanceGuidelineSheetProps> = ({ isOpen, onClose }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const [active, setActive] = useState(ADVANCE_GUIDELINE[0].id);
  const [indexOpen, setIndexOpen] = useState(false);
  const [showTop, setShowTop] = useState(false);

  // Start at the top each time the sheet opens
  useEffect(() => {
    if (!isOpen) return;
    setIndexOpen(false);
    setActive(ADVANCE_GUIDELINE[0].id);
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: 0 }));
  }, [isOpen]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowTop(el.scrollTop > 480);
    // The section whose heading was passed last is the one being read
    let current = ADVANCE_GUIDELINE[0].id;
    for (const s of ADVANCE_GUIDELINE) {
      const node = sectionRefs.current[s.id];
      if (node && node.offsetTop - 24 <= el.scrollTop) current = s.id;
    }
    setActive(current);
  };

  const jumpTo = (id: string) => {
    setIndexOpen(false);
    const node = sectionRefs.current[id];
    if (node) scrollRef.current?.scrollTo({ top: node.offsetTop - 12, behavior: 'smooth' });
  };

  const activeSection = ADVANCE_GUIDELINE.find((s) => s.id === active) ?? ADVANCE_GUIDELINE[0];

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[92%]">
      <div className="pt-3 pb-1 flex justify-center shrink-0">
        <div className="w-10 h-1 bg-slate-300 rounded-full" />
      </div>
      <div className="px-5 pt-2 pb-3 shrink-0 border-b border-slate-100 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#1E293B]">User Guideline</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Advance Salary & EV Loan</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 -mr-1 rounded-full flex items-center justify-center text-slate-500 active:bg-slate-100 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Index */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIndexOpen((v) => !v)}
            aria-expanded={indexOpen}
            className={`w-full h-11 px-3.5 rounded-xl border bg-white flex items-center gap-2.5 text-xs shadow-2xs cursor-pointer transition-all ${
              indexOpen ? 'border-[#2F68FE] ring-4 ring-blue-50' : 'border-slate-200'
            }`}
          >
            <ListOrdered className="w-4 h-4 text-[#2F68FE] shrink-0" />
            <span className="flex-1 min-w-0 text-left truncate">
              <span className="text-slate-400 font-medium">Jump to · </span>
              <span className="font-semibold text-[#1E293B]">{activeSection.title}</span>
            </span>
            <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${indexOpen ? 'rotate-180' : ''}`} />
          </button>

          {indexOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIndexOpen(false)} />
              <div
                role="listbox"
                aria-label="Guideline sections"
                className="absolute left-0 right-0 top-full mt-1.5 z-20 max-h-72 overflow-y-auto no-scrollbar bg-white border border-slate-200/80 rounded-2xl p-1.5 shadow-[0_16px_40px_-12px_rgba(15,23,42,0.28)]"
              >
                {ADVANCE_GUIDELINE.map((s) => {
                  const selected = s.id === active;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => jumpTo(s.id)}
                      className={`w-full min-h-9 px-3 py-2 rounded-xl flex items-center justify-between gap-3 text-left text-xs cursor-pointer ${
                        selected ? 'bg-blue-50 text-[#2F68FE] font-bold' : 'text-slate-700 font-medium active:bg-slate-50'
                      }`}
                    >
                      <span className="min-w-0">{s.title}</span>
                      {selected && <Check className="w-4 h-4 shrink-0 stroke-[2.5]" />}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="relative flex-1 min-h-0 flex flex-col">
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="relative flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-4 bg-slate-50/60 text-[12.5px] text-slate-600 leading-relaxed"
        >
          {ADVANCE_GUIDELINE.map((s, i) => (
            <section
              key={s.id}
              ref={(el) => {
                sectionRefs.current[s.id] = el;
              }}
              className={`space-y-2.5 ${i > 0 ? 'mt-5 pt-5 border-t border-slate-200/80' : ''}`}
            >
              <h3 className="pl-2.5 border-l-[3px] border-[#2F68FE] text-[14px] font-bold text-[#1E293B] leading-snug">{s.title}</h3>
              {s.blocks.map((b, bi) => (
                <Block key={bi} block={b} />
              ))}
            </section>
          ))}
          <div className="h-4" />
        </div>

        {showTop && (
          <button
            type="button"
            onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
            className="absolute right-4 bottom-4 w-10 h-10 rounded-full bg-white border border-slate-200 shadow-md text-[#2F68FE] flex items-center justify-center cursor-pointer active:bg-slate-50"
            aria-label="Back to top"
          >
            <ArrowUp className="w-4.5 h-4.5" />
          </button>
        )}
      </div>

      <div className="shrink-0 p-4 pb-5 border-t border-slate-100">
        <button
          type="button"
          onClick={onClose}
          className="w-full h-11 rounded-xl border border-[#2F68FE] text-[#2F68FE] text-xs font-bold active:bg-blue-50 cursor-pointer"
        >
          Got it
        </button>
      </div>
    </BottomSheet>
  );
};
