import React from 'react';
import { ArrowUpRight, Check, FileText, Loader2, UserCircle2, Users, X } from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet';

export type LetterStatus = 'none' | 'generating' | 'ready';

const AFTER_SIGNING = [
  'Employee receives the appraisal letter for e-signature.',
  'After employee signature, authorized signatory status becomes pending.',
  'Once both parties sign, the appraisal status becomes completed.',
  'Payroll can use the finalized salary structure for processing.',
];

/** Step 4: generate the appraisal letter and send it for e-signature */
export const SignatureStep: React.FC<{
  staffName: string;
  letter: LetterStatus;
  /** How many times the letter has been generated; each one is a version */
  letterVersions: number;
  isConfirmOpen: boolean;
  isLettersOpen: boolean;
  onGenerate: () => void;
  onCloseConfirm: () => void;
  onViewLetters: () => void;
  onCloseLetters: () => void;
  onSendForESign: () => void;
}> = ({
  staffName,
  letter,
  letterVersions,
  isConfirmOpen,
  isLettersOpen,
  onGenerate,
  onCloseConfirm,
  onViewLetters,
  onCloseLetters,
  onSendForESign,
}) => (
  <>
    <section className="bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs overflow-hidden">
      <h3 className="px-4 py-3.5 border-b border-slate-100 text-sm font-bold text-[#1E293B]">What happens after signing?</h3>
      <ul className="p-3 space-y-2">
        {AFTER_SIGNING.map((t) => (
          <li key={t} className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11.5px] text-slate-700 leading-relaxed">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1E293B] shrink-0 mt-[7px]" aria-hidden="true" />
            {t}
          </li>
        ))}
      </ul>
    </section>

    <section className="bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3.5 border-b border-slate-100">
        <h3 className="text-sm font-bold text-[#1E293B]">Details</h3>
        {letter === 'ready' && (
          <button
            type="button"
            onClick={onViewLetters}
            className="flex items-center gap-1 -mr-1 px-1 py-0.5 rounded-md text-xs font-semibold text-[#1E293B] underline underline-offset-2 active:bg-slate-100 cursor-pointer"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            View Letters
          </button>
        )}
      </div>

      <ol className="p-3 space-y-2.5">
        {/* Employee */}
        <li className="rounded-xl border border-slate-100 p-3">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-lg bg-blue-50 text-[#2F68FE] flex items-center justify-center shrink-0">
              <UserCircle2 className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[10.5px] text-slate-500">Employee Signature</p>
              <p className="mt-0.5 text-[13px] font-bold text-[#1E293B] truncate">{staffName}</p>
            </div>
          </div>
          <div className={`mt-3 grid gap-2 ${letter === 'ready' ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {letter === 'ready' ? (
              <>
                <button
                  type="button"
                  onClick={onGenerate}
                  className="h-10 rounded-xl border border-[#2F68FE] text-[#2F68FE] bg-white text-xs font-bold active:bg-blue-50 cursor-pointer"
                >
                  Re-Generate Letter
                </button>
                <button
                  type="button"
                  onClick={onSendForESign}
                  className="h-10 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] cursor-pointer"
                >
                  Send for E-Sign
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onGenerate}
                disabled={letter === 'generating'}
                className="h-10 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-1.5 active:bg-[#1D4ED8] disabled:opacity-80 cursor-pointer disabled:cursor-wait"
              >
                {letter === 'generating' && <Loader2 className="w-4 h-4 animate-spin" />}
                {letter === 'generating' ? 'Generating...' : 'Generate Letter'}
              </button>
            )}
          </div>
        </li>

        {/* Authorized signatory */}
        <li className="rounded-xl border border-slate-100 p-3 flex items-center gap-3">
          <span className="w-9 h-9 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </span>
          <p className="flex-1 min-w-0 text-[11.5px] text-slate-600">Authorized Signatory</p>
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" aria-hidden="true" />
            Not Sent
          </span>
        </li>
      </ol>
    </section>

    <BottomSheet isOpen={isLettersOpen} onClose={onCloseLetters} maxHeight="max-h-[70%]">
      <div className="pt-3 pb-1 flex justify-center shrink-0">
        <div className="w-10 h-1 bg-slate-300 rounded-full" />
      </div>
      <div className="flex items-center justify-between gap-3 px-5 pt-1 pb-3 border-b border-slate-100 shrink-0">
        <h2 className="text-base font-bold text-[#1E293B]">View Letters</h2>
        <button
          type="button"
          onClick={onCloseLetters}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 cursor-pointer shrink-0"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <ul className="flex-1 min-h-0 overflow-y-auto no-scrollbar p-4 pb-8 space-y-2.5">
        {Array.from({ length: letterVersions }, (_, i) => letterVersions - i).map((v) => (
          <li key={v}>
            {/* Demo only: the letter doesn't open */}
            <button
              type="button"
              className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border border-slate-200 bg-white text-left active:bg-slate-50 cursor-pointer"
            >
              <span className="w-9 h-9 rounded-lg bg-blue-50 text-[#2F68FE] flex items-center justify-center shrink-0">
                <FileText className="w-4.5 h-4.5" />
              </span>
              <span className="flex-1 min-w-0 text-[13px] font-semibold text-[#1E293B]">Appraisal Letter - Version {v}</span>
              <ArrowUpRight className="w-4.5 h-4.5 text-[#2F68FE] shrink-0" />
            </button>
          </li>
        ))}
      </ul>
    </BottomSheet>

    <BottomSheet isOpen={isConfirmOpen} onClose={onCloseConfirm} maxHeight="max-h-[60%]">
      <div className="pt-3 pb-1 flex justify-center shrink-0">
        <div className="w-10 h-1 bg-slate-300 rounded-full" />
      </div>
      <div className="px-5 pt-3 pb-5 flex flex-col items-center text-center">
        <span className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <Check className="w-6 h-6 stroke-[2.5]" />
        </span>
        <h2 className="mt-3 text-base font-bold text-[#1E293B]">Letter Generated</h2>
        <p className="mt-1.5 text-[13px] text-slate-500 leading-relaxed">
          Your appraisal letter is ready. You can view it or send it for e-signature.
        </p>
      </div>
      <div className="p-4 pt-0 pb-8 shrink-0">
        <button
          type="button"
          onClick={onCloseConfirm}
          className="w-full h-12 rounded-xl bg-[#2F68FE] text-white font-semibold text-sm shadow-xs active:bg-[#1D4ED8] cursor-pointer"
        >
          OK
        </button>
      </div>
    </BottomSheet>
  </>
);
