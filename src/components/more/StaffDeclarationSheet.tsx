import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X, ArrowDown, Check } from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet';
import {
  DECLARATION_CLAUSES,
  DECLARATION_COMPANY,
  DECLARATION_FINAL,
  Declarant,
  declarationIntro,
  formatDeclarationDate,
} from '../../data/staffDeclaration';

interface StaffDeclarationSheetProps {
  isOpen: boolean;
  declarant: Declarant;
  /** Staff member's residential address (from the request form) */
  address: string;
  onClose: () => void;
  onAgree: () => void;
}

/** Full WFH/Hybrid Staff Declaration; the CTA scrolls to the end first, then becomes "Yes, I agree" */
export const StaffDeclarationSheet: React.FC<StaffDeclarationSheetProps> = ({ isOpen, declarant, address, onClose, onAgree }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [reachedEnd, setReachedEnd] = useState(false);
  const [signedAt, setSignedAt] = useState(() => new Date());

  const checkEnd = useCallback(() => {
    const el = scrollRef.current;
    if (el && el.scrollTop + el.clientHeight >= el.scrollHeight - 24) setReachedEnd(true);
  }, []);

  // Each opening starts at the top with a fresh timestamp (and counts as read if it all fits)
  useEffect(() => {
    if (!isOpen) return;
    setReachedEnd(false);
    setSignedAt(new Date());
    scrollRef.current?.scrollTo({ top: 0 });
    const id = requestAnimationFrame(checkEnd);
    return () => cancelAnimationFrame(id);
  }, [isOpen, checkEnd]);

  const scrollToBottom = () => {
    const el = scrollRef.current;
    el?.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[92%]">
      <div className="pt-3 pb-1 flex justify-center shrink-0">
        <div className="w-10 h-1 bg-slate-300 rounded-full" />
      </div>
      <div className="flex items-center justify-between px-5 pt-1 pb-3 border-b border-slate-100 shrink-0">
        <div>
          <h2 className="text-base font-bold text-[#1E293B]">Staff Declaration</h2>
          <p className="text-[11px] text-slate-400">Work-from-Home (WFH) or Hybrid Work Arrangement</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div
        ref={scrollRef}
        onScroll={checkEnd}
        className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-4 text-[12px] leading-relaxed text-slate-700 select-text"
      >
        {/* From / To */}
        <div className="space-y-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">From</p>
          <p className="font-semibold text-[#1E293B]">{declarant.name}</p>
          <p>{declarant.personalEmail}</p>
          <p>{address}</p>
        </div>
        <div className="mt-4 space-y-0.5 text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">To</p>
          <p className="font-semibold text-[#1E293B]">{DECLARATION_COMPANY.name}</p>
          <p>{DECLARATION_COMPANY.address}</p>
          <p>Email: {declarant.officialEmail}</p>
        </div>

        <p className="mt-4">{declarationIntro(declarant.name)}</p>

        {DECLARATION_CLAUSES.map((clause, i) => (
          <section key={clause.title} className="mt-5">
            <h3 className="text-[13px] font-bold text-[#1E293B]">
              {i + 1}. {clause.title}
            </h3>
            <ul className="mt-1.5 space-y-1.5 list-disc pl-4 marker:text-slate-400">
              {clause.points.map((pt) => (
                <li key={pt.text}>
                  {pt.label && <strong className="font-semibold text-[#1E293B]">{pt.label} </strong>}
                  {pt.text}
                  {pt.items && (
                    <ul className="mt-1 space-y-1 list-[circle] pl-4">
                      {pt.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}

        <section className="mt-5">
          <h3 className="text-[13px] font-bold text-[#1E293B]">Final Declaration &amp; Acceptance</h3>
          <p className="mt-1.5">{DECLARATION_FINAL}</p>
        </section>

        {/* Signed details */}
        <dl className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-100 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[11.5px]">
          {[
            ['Staff Name', declarant.name],
            ['Staff ID', declarant.staffCode],
            ['Staff Email', declarant.personalEmail],
            ['Designation', declarant.designation],
            ['Department', declarant.department],
            ['Date', formatDeclarationDate(signedAt)],
          ].map(([k, v]) => (
            <React.Fragment key={k}>
              <dt className="text-slate-400">{k}</dt>
              <dd className="font-semibold text-[#1E293B] break-all">{v}</dd>
            </React.Fragment>
          ))}
        </dl>
        <div className="mt-4 mb-2 flex items-end gap-3">
          <span className="text-[11px] text-slate-400">Staff Signature</span>
          <span className="text-2xl leading-none text-[#1E1B4B] border-b border-dashed border-slate-300 pb-0.5" style={{ fontFamily: "'Caveat', cursive" }}>
            {declarant.name}
          </span>
        </div>
      </div>

      <div className="p-4 pt-3 pb-6 border-t border-slate-100 shrink-0">
        {reachedEnd ? (
          <button
            type="button"
            onClick={onAgree}
            className="w-full h-12 rounded-xl bg-[#2F68FE] text-white text-sm font-bold flex items-center justify-center gap-2 active:bg-[#1D4ED8] cursor-pointer animate-in fade-in duration-200"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            Yes, I agree
          </button>
        ) : (
          <button
            type="button"
            onClick={scrollToBottom}
            className="w-full h-12 rounded-xl border border-[#2F68FE] bg-white text-[#2F68FE] text-sm font-bold flex items-center justify-center gap-2 active:bg-blue-50 cursor-pointer"
          >
            <ArrowDown className="w-4 h-4 stroke-[2.5]" />
            Scroll to bottom
          </button>
        )}
      </div>
    </BottomSheet>
  );
};
