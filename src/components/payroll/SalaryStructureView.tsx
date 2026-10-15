import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  HelpCircle,
  Lock,
  ShieldCheck,
  X,
} from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet';
import { SalaryComponentsStep, ComponentChoices, DEFAULT_CHOICES } from './SalaryComponentsStep';
import { FamilyMember, ProfFeeAccount, ProfFeesView, totalProfFees } from './ProfFeesView';
import { SalaryPreviewStep } from './SalaryPreviewStep';

/* ---------------------------------- Data ---------------------------------- */

export interface SalaryDeclaration {
  id: string;
  staffName: string;
  staffCode: string;
  effectiveMonth: string; // e.g. "Oct 2026"
  reportingManager: string;
  ctm: string;
  currentCtc: number;
  revisedCtc: number;
  /** Yearly Other Allowance when no component is opted in */
  otherAllowanceBase: number;
  /** Yearly statutory deduction applied in the old regime tax calc */
  statutoryDeduction: number;
  /** Yearly Flexi Expense Reimbursement ceiling for the rest of the year */
  flexiAnnualMax: number;
  /** Fixed monthly NPS ceiling (Max Eligible Limit) */
  npsMonthlyMax: number;
  joiningDate: string; // e.g. "16 Jul, 2024"
  /** Family members who can be set up as Prof. Fees accounts */
  familyMembers: FamilyMember[];
}

const STEPS = ['Details', 'Select Components', 'Preview', 'Signature'] as const;
const COMPONENT_CHIPS = ['Flexi Allowance', 'Meal Allowance', 'PF/VPF', 'NPS'];
const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
/** Pre-filled for the demo so Verify works straight away */
const DEMO_PAN = 'BKXPS4821M';

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

/* -------------------------------- PAN sheet -------------------------------- */

const PanVerifySheet: React.FC<{ isOpen: boolean; onClose: () => void; onVerified: () => void }> = ({
  isOpen,
  onClose,
  onVerified,
}) => {
  const [pan, setPan] = useState('');
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPan(DEMO_PAN);
      setVisible(false);
      setError('');
      setVerifying(false);
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [isOpen]);

  const verify = () => {
    if (!PAN_PATTERN.test(pan)) {
      setError("That doesn't look like a PAN. It should be 5 letters, 4 numbers and 1 letter, like ABCDE1234F.");
      return;
    }
    setVerifying(true);
    setTimeout(onVerified, 700);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[80%]">
      <div className="pt-3 pb-1 flex justify-center shrink-0">
        <div className="w-10 h-1 bg-slate-300 rounded-full" />
      </div>
      <div className="flex items-start justify-between px-5 pt-1 pb-3 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-blue-50 text-[#2F68FE] flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-base font-bold text-[#1E293B]">Enter Your PAN Number</h2>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 cursor-pointer shrink-0"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form
        className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-4 space-y-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          if (pan.length === 10 && !verifying) verify();
        }}
      >
        <label htmlFor="pan-input" className="block text-xs font-bold text-[#1E293B]">
          PAN Number<span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <input
            id="pan-input"
            ref={inputRef}
            type={visible ? 'text' : 'password'}
            inputMode="text"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={10}
            value={pan}
            onChange={(e) => {
              setPan(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10));
              if (error) setError('');
            }}
            placeholder="Enter your PAN number"
            className={`w-full h-12 pl-3.5 pr-12 bg-white border rounded-xl text-sm font-semibold tracking-[0.18em] text-[#1E293B] placeholder:text-xs placeholder:font-medium placeholder:tracking-normal placeholder:text-slate-400 focus:outline-hidden focus:border-[#2F68FE] focus:ring-4 focus:ring-blue-50 select-text ${
              error ? 'border-rose-300' : 'border-slate-200'
            }`}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 active:bg-slate-100 cursor-pointer"
            aria-label={visible ? 'Hide PAN' : 'Show PAN'}
          >
            {visible ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
          </button>
        </div>
        {error && <p className="px-0.5 text-[11px] font-medium text-rose-500 leading-relaxed">{error}</p>}
      </form>

      <div className="grid grid-cols-2 gap-3 p-4 pt-3 pb-6 border-t border-slate-100 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="h-12 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold bg-white active:bg-slate-50 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={verify}
          disabled={pan.length !== 10 || verifying}
          className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-40 active:bg-[#1D4ED8] cursor-pointer disabled:cursor-not-allowed"
        >
          <ShieldCheck className="w-4 h-4" />
          {verifying ? 'Verifying…' : 'Verify'}
        </button>
      </div>
    </BottomSheet>
  );
};

/* ----------------------------- How it works sheet ----------------------------- */

const HOW_IT_WORKS: { title: string; text: string }[] = [
  { title: 'Details', text: 'Check your current and revised CTC and the month the new structure starts.' },
  { title: 'Select Components', text: 'Pick your tax regime and opt in to Flexi Allowance, Meal Allowance, PF / VPF and NPS.' },
  { title: 'Preview', text: 'See your monthly take-home and taxable salary with the choices you made.' },
  { title: 'Signature', text: 'Sign to confirm. Payroll then freezes your final salary breakup.' },
];

const HowItWorksSheet: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => (
  <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[85%]">
    <div className="pt-3 pb-1 flex justify-center shrink-0">
      <div className="w-10 h-1 bg-slate-300 rounded-full" />
    </div>
    <div className="flex items-center justify-between px-5 pt-1 pb-3 border-b border-slate-100 shrink-0">
      <h2 className="text-base font-bold text-[#1E293B]">How it works</h2>
      <button
        type="button"
        onClick={onClose}
        className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 cursor-pointer"
        aria-label="Close"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
    <ol className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-4">
      {HOW_IT_WORKS.map((s, i) => (
        <li key={s.title} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span className="w-7 h-7 rounded-full bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center shrink-0">
              {i + 1}
            </span>
            {i < HOW_IT_WORKS.length - 1 && <span className="flex-1 w-px bg-blue-100 my-1" />}
          </div>
          <div className="pb-4">
            <p className="text-sm font-bold text-[#1E293B]">{s.title}</p>
            <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">{s.text}</p>
          </div>
        </li>
      ))}
    </ol>
    <div className="p-4 pt-2 pb-8 border-t border-slate-100 shrink-0">
      <button
        type="button"
        onClick={onClose}
        className="w-full h-12 rounded-xl bg-[#2F68FE] text-white font-semibold text-sm shadow-xs active:bg-[#1D4ED8] cursor-pointer"
      >
        Got it
      </button>
    </div>
  </BottomSheet>
);

/* --------------------------------- Stepper --------------------------------- */

const Stepper: React.FC<{ current: number }> = ({ current }) => (
  <div className="bg-white border border-[#EBF0F7] rounded-2xl px-3 py-3.5 shadow-2xs">
    <ol className="grid grid-cols-4">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="relative flex flex-col items-center text-center">
            {/* Connector to the next step */}
            {i < STEPS.length - 1 && (
              <span
                className={`absolute top-3.5 left-[calc(50%+18px)] right-[calc(-50%+18px)] border-t-2 ${
                  done ? 'border-solid border-emerald-500' : 'border-dashed border-slate-200'
                }`}
                aria-hidden="true"
              />
            )}
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                done ? 'bg-emerald-500 text-white' : active ? 'bg-[#2F68FE] text-white' : 'bg-white border-2 border-slate-200 text-slate-400'
              } ${active ? 'ring-4 ring-blue-100' : ''}`}
            >
              {done ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : i + 1}
            </span>
            <span
              className={`mt-1.5 text-[10px] leading-tight px-0.5 ${
                active ? 'font-bold text-[#2F68FE]' : done ? 'font-semibold text-slate-600' : 'font-medium text-slate-400'
              }`}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  </div>
);

/* ------------------------------- Wizard screen ------------------------------- */

const DeclarationWizard: React.FC<{
  declaration: SalaryDeclaration;
  onBack: () => void;
  onComingSoon: (step: string) => void;
}> = ({ declaration: d, onBack, onComingSoon }) => {
  const [step, setStep] = useState(0);
  const [choices, setChoices] = useState<ComponentChoices>(DEFAULT_CHOICES);
  const scrollRef = useRef<HTMLDivElement>(null);
  const goTo = (s: number) => {
    setStep(s);
    scrollRef.current?.scrollTo({ top: 0 });
  };
  const [isHowOpen, setIsHowOpen] = useState(false);
  const [profAccounts, setProfAccounts] = useState<ProfFeeAccount[]>([]);
  const [isProfFeesOpen, setIsProfFeesOpen] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>(d.familyMembers);

  if (isProfFeesOpen) {
    return (
      <ProfFeesView
        staffName={d.staffName}
        joiningDate={d.joiningDate}
        grossPackage={d.revisedCtc}
        mainPackage={d.revisedCtc}
        members={familyMembers}
        initialAccounts={profAccounts}
        onCancel={() => setIsProfFeesOpen(false)}
        onSave={(accounts) => {
          setProfAccounts(accounts);
          setChoices((c) => ({ ...c, profFeesAllocation: totalProfFees(accounts) }));
          setIsProfFeesOpen(false);
        }}
        onAddMember={(m) => setFamilyMembers((prev) => [...prev, m])}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      <header className="shrink-0 bg-white border-b border-[#EBF0F7]">
        <div className="flex items-center h-14 px-4 relative">
          <button
            type="button"
            onClick={() => (step > 0 ? goTo(step - 1) : onBack())}
            className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-[#1E293B] active:bg-slate-100 cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
          <div className="screen-title">
            <h1 className="text-base font-bold leading-tight">Salary Structure Declaration</h1>
          </div>
          <button
            type="button"
            onClick={() => setIsHowOpen(true)}
            aria-label="How it works"
            className="ml-auto w-9 h-9 -mr-1 rounded-full text-[#2F68FE] flex items-center justify-center active:bg-blue-50 cursor-pointer"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar px-4 pt-4 pb-6 space-y-3.5">
        <Stepper current={step} />

        {step === 2 && <SalaryPreviewStep ctc={d.revisedCtc} statutory={d.statutoryDeduction} choices={choices} />}

        {step === 1 && <SalaryComponentsStep
            ctc={d.revisedCtc}
            pool={d.otherAllowanceBase}
            statutory={d.statutoryDeduction}
            effectiveMonth={d.effectiveMonth}
            flexiAnnualMax={d.flexiAnnualMax}
            npsMonthlyMax={d.npsMonthlyMax}
            choices={choices}
            onChange={setChoices}
            onManageProfFees={() => setIsProfFeesOpen(true)}
          />}

        {step === 0 && (
        <>
        {/* Intro */}
        <div className="rounded-2xl p-4 bg-gradient-to-br from-[#EEF4FF] to-white border border-[#DBE6FE]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#2F68FE]">Your Appraisal Flow</p>
          <h2 className="mt-1 text-sm font-bold text-[#1E293B] leading-snug">
            Choose the salary structure that fits your tax planning and savings.
          </h2>
          <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
            This flow helps you select the regime and other allocation that can be opt-in before payroll freezes the final breakup.
          </p>
        </div>

        {/* Appraisal details */}
        <section className="bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs overflow-hidden">
          <h3 className="px-4 pt-4 text-sm font-bold text-[#1E293B]">Your Appraisal Details</h3>

          <div className="p-4 space-y-2.5">
            {/* Revised CTC leads */}
            <div className="rounded-2xl p-3.5 bg-[#2F68FE] text-white relative overflow-hidden">
              <span className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10" aria-hidden="true" />
              <p className="text-[11px] font-semibold text-blue-100">Revised CTC</p>
              <p className="mt-0.5 text-2xl font-extrabold tracking-tight tabular-nums">{inr(d.revisedCtc)}</p>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-xl p-3 bg-slate-50 border border-slate-100">
                <p className="text-[10.5px] font-semibold text-slate-400">Current CTC</p>
                <p className="mt-0.5 text-sm font-bold text-[#1E293B] tabular-nums">{inr(d.currentCtc)}</p>
              </div>
              <div className="rounded-xl p-3 bg-slate-50 border border-slate-100">
                <p className="text-[10.5px] font-semibold text-slate-400">Effective From</p>
                <p className="mt-0.5 text-sm font-bold text-[#1E293B] flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                  {d.effectiveMonth}
                </p>
              </div>
            </div>
          </div>

          <div className="mx-4 mb-4 p-3.5 rounded-xl bg-amber-50/60 border border-amber-100">
            <p className="text-xs font-bold text-[#1E293B]">Why this matters</p>
            <p className="mt-1 text-[11px] text-slate-600 leading-relaxed">
              Every choice affects your take-home pay, taxable salary, and savings-linked benefits. The workflow keeps the experience
              simple while enforcing the rules in the background.
            </p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {COMPONENT_CHIPS.map((c) => (
                <span key={c} className="px-2 py-0.5 rounded-md bg-white border border-amber-200/70 text-[10.5px] font-semibold text-amber-700">
                  {c}
                </span>
              ))}
            </div>
          </div>
        </section>
        </>
        )}
      </div>

      {/* Back / Next */}
      <div className="shrink-0 p-4 bg-white/95 backdrop-blur-md border-t border-[#EBF0F7] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] grid grid-cols-[1fr_2fr] gap-3">
        <button
          type="button"
          disabled={step === 0}
          onClick={() => goTo(step - 1)}
          className="h-12 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-bold disabled:opacity-40 active:bg-slate-50 cursor-pointer disabled:cursor-not-allowed"
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => (step < 2 ? goTo(step + 1) : onComingSoon(STEPS[step + 1]))}
          className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs active:bg-[#1D4ED8] cursor-pointer"
        >
          {step === 0 ? 'Next' : 'Save & Next'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <HowItWorksSheet isOpen={isHowOpen} onClose={() => setIsHowOpen(false)} />
    </div>
  );
};

/* -------------------------------- List screen -------------------------------- */

export const SalaryStructureView: React.FC<{
  declarations: SalaryDeclaration[];
  onBack: () => void;
  onToast: (msg: string) => void;
}> = ({ declarations, onBack, onToast }) => {
  const [panFor, setPanFor] = useState<SalaryDeclaration | null>(null);
  const [open, setOpen] = useState<SalaryDeclaration | null>(null);

  if (open) {
    return (
      <DeclarationWizard
        declaration={open}
        onBack={() => setOpen(null)}
        onComingSoon={(s) => onToast(`${s} is coming soon.`)}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      <header className="shrink-0 bg-white border-b border-[#EBF0F7]">
        <div className="flex items-center h-14 px-4 relative">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-[#1E293B] active:bg-slate-100 cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
          <h1 className="screen-title text-base font-bold leading-tight">Salary Structure Declarations</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-4 pb-8 space-y-3.5">
        {declarations.map((d) => (
          <article
            key={d.id}
            onClick={() => setPanFor(d)}
            className="bg-white border border-[#EBF0F7] rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.03)] overflow-hidden active:scale-[0.99] transition-transform cursor-pointer"
          >
            <div className="p-3.5 pb-3">
              <p className="text-[10.5px] text-slate-500">Staff Name</p>
              <h3 className="mt-0.5 text-sm font-bold text-[#1E293B]">
                {d.staffName}
              </h3>
            </div>

            <dl className="mx-3.5 grid grid-cols-2 gap-2 text-xs">
              {[
                { label: 'Effective Month & Year', value: d.effectiveMonth, wide: true },
                { label: 'Reporting Manager', value: d.reportingManager },
                { label: 'CTM', value: d.ctm },
              ].map((x) => (
                <div key={x.label} className={`px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 min-w-0 ${x.wide ? 'col-span-2' : ''}`}>
                  <dt className="text-[10.5px] text-slate-500">{x.label}</dt>
                  <dd className="mt-0.5 font-bold text-[#1E293B] truncate">{x.value}</dd>
                </div>
              ))}
            </dl>

            <div className="p-3.5 pt-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPanFor(d);
                }}
                className="w-full h-11 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-1.5 active:bg-[#1D4ED8] cursor-pointer"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </article>
        ))}
      </div>

      <PanVerifySheet
        isOpen={Boolean(panFor)}
        onClose={() => setPanFor(null)}
        onVerified={() => {
          setOpen(panFor);
          setPanFor(null);
        }}
      />
    </div>
  );
};
