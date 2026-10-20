import React, { useState } from 'react';
import { AlertTriangle, ChevronRight, Info, SlidersHorizontal, X } from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet';

/* ---------------------------------- Model ---------------------------------- */

export type TaxRegime = 'Old' | 'New';
export type ComponentId = 'profFees' | 'flexi' | 'meal' | 'pf' | 'nps';

/** Old regime declared amounts, kept as typed (digits only, '' when empty) */
export interface OldRegimeDeductions {
  hra: string;
  otherAllowance: string;
  sec80c: string;
  sec80ccd1b: string;
  sec80d: string;
  sec80eOther: string;
  homeLoan: string;
}

export interface ComponentChoices {
  regime: TaxRegime;
  optedIn: Record<ComponentId, boolean>;
  /** Set from the professional fees screen; ₹0 until the staff member manages it */
  profFeesAllocation: number;
  oldDeductions: OldRegimeDeductions;
  /** Monthly amounts typed against each opted-in component (digits only) */
  monthly: { flexi: string; meal: string; nps: string };
  uan: string;
  pran: string;
}

export const MEAL_MAX = 8800;
export const OLD_STANDARD_DEDUCTION = 50000;
const HRA_MAX = 300000;
const SEC_80C_MAX = 150000;
const SEC_80CCD1B_MAX = 50000;
const HOME_LOAN_MAX = 200000;

export const DEFAULT_CHOICES: ComponentChoices = {
  regime: 'New',
  optedIn: { profFees: false, flexi: false, meal: false, pf: false, nps: false },
  profFeesAllocation: 0,
  oldDeductions: {
    hra: String(HRA_MAX),
    otherAllowance: '292000',
    sec80c: '',
    sec80ccd1b: '',
    sec80d: '',
    sec80eOther: '',
    homeLoan: '',
  },
  monthly: { flexi: '', meal: '', nps: '' },
  uan: '',
  pran: '',
};

/** Months left in the financial year (Apr–Mar) from an effective month like "Oct 2026" */
export const monthsLeftInFy = (effectiveMonth: string) => {
  const m = new Date(`1 ${effectiveMonth}`).getMonth();
  return Number.isNaN(m) ? 12 : m >= 3 ? 15 - m : 3 - m;
};

interface ComponentMeta {
  id: ComponentId;
  label: string;
  /** Row label in the Live Structure Snapshot */
  snapshotLabel: string;
  note?: string;
  /** (i) text, one string per paragraph */
  info: string[];
  /** Annual amount for a given revised CTC */
  annual: (ctc: number, c: ComponentChoices) => number;
  /** Exempt / deductible under the old regime only, or both */
  taxBreak: 'old' | 'both';
}


export const COMPONENTS: ComponentMeta[] = [
  {
    id: 'profFees',
    label: 'Prof. Fees',
    snapshotLabel: 'Prof. Fees',
    info: [
      '10% TDS will be deducted. Employee cannot withdraw Professional Fees in own name. Maximum per individual is ₹12,00,000 and main employee package can not be lower than ₹10,00,000 annually.',
    ],
    annual: (_, c) => c.profFeesAllocation,
    taxBreak: 'old',
  },
  {
    id: 'flexi',
    label: 'Flexi Expense Reimbursement',
    snapshotLabel: 'Flexi Expense Reimbursement',
    info: ['Monthly flexi amount is auto-filled from annual eligibility and cannot be greater than the eligible monthly amount.'],
    annual: (_, c) => (Number(c.monthly.flexi) || 0) * 12,
    taxBreak: 'old',
  },
  {
    id: 'meal',
    label: 'Meal Allowance',
    snapshotLabel: 'Meal Allowance',
    note: `Maximum allowed: ₹${MEAL_MAX.toLocaleString('en-IN')}/month`,
    info: ['Calculation: ₹200 per meal × 2 meals per day × 22 office days = ₹8,800/month standard maximum.'],
    annual: (_, c) => (Number(c.monthly.meal) || 0) * 12,
    taxBreak: 'old',
  },
  {
    id: 'pf',
    label: 'Provident Fund',
    snapshotLabel: 'Provident Fund',
    info: [
      'To opt in for PF, you must have a valid UAN number. If you do not have one, please download the UMANG app and create your PF account. This usually takes around 5 minutes. For any assistance, please contact HR.',
      'PF is mandatory if you already have a PF account or if your Basic salary is less than ₹15,000 per month.',
    ],
    annual: () => 36000,
    taxBreak: 'both',
  },
  {
    id: 'nps',
    label: 'National Pension System',
    snapshotLabel: 'NPS amount',
    info: [
      'To opt in for NPS, you must have a valid PRAN number. If you do not have a PRAN number or need assistance, please contact HR. NPS is an employer contribution.',
    ],
    annual: (_, c) => (Number(c.monthly.nps) || 0) * 12,
    taxBreak: 'both',
  },
];

/* ------------------------------ Tax estimate ------------------------------ */

const slabTax = (income: number, slabs: [number, number][]) => {
  let tax = 0;
  let prev = 0;
  for (const [upTo, rate] of slabs) {
    if (income <= prev) break;
    tax += (Math.min(income, upTo) - prev) * rate;
    prev = upTo;
  }
  return tax;
};

const amt = (s: string) => Number(s) || 0;

const surchargeRate = (income: number) =>
  income > 50000000 ? 0.37 : income > 20000000 ? 0.25 : income > 10000000 ? 0.15 : income > 5000000 ? 0.1 : 0;

/** Old regime: everything declared below the components, walked down to the final tentative tax */
export const oldRegimeCalc = (ctc: number, statutory: number, c: ComponentChoices) => {
  const d = c.oldDeductions;
  const componentBreaks = COMPONENTS.filter((m) => c.optedIn[m.id]).reduce((n, m) => n + m.annual(ctc, c), 0);
  const gross = Math.max(0, ctc - componentBreaks);
  const hra = amt(d.hra);
  const other = amt(d.otherAllowance);
  const chapter6a = amt(d.sec80c) + amt(d.sec80ccd1b) + amt(d.sec80d) + amt(d.sec80eOther);
  const homeLoan = amt(d.homeLoan);
  const net = Math.max(0, gross - statutory - OLD_STANDARD_DEDUCTION - hra - other - chapter6a - homeLoan);
  const slab = net <= 500000 ? 0 : Math.round(slabTax(net, [[250000, 0], [500000, 0.05], [1000000, 0.2], [Infinity, 0.3]]));
  const surcharge = Math.round(slab * surchargeRate(net));
  const cess = Math.round((slab + surcharge) * 0.04);
  return {
    gross,
    statutory,
    hra,
    other,
    chapter6a,
    homeLoan,
    net,
    slab,
    surcharge,
    cess,
    total: slab + surcharge + cess,
    declared: OLD_STANDARD_DEDUCTION + hra + other + chapter6a + homeLoan,
  };
};

export const PROFESSIONAL_TAX_ANNUAL = 2400;

/**
 * Yearly salary breakup. Prof. Fees, Flexi and Meal are carved out of the total first; what's left is the
 * Main Employee Package, split as Basic 50%, HRA 60% of Basic, Conveyance 10% of Basic, Gratuity 4.81% of Basic,
 * with the remainder (after any PF / NPS) paid as Other Allowance.
 */
export const salaryStructure = (ctc: number, c: ComponentChoices) => {
  const annualOf = (id: ComponentId) => (c.optedIn[id] ? COMPONENTS.find((m) => m.id === id)!.annual(ctc, c) : 0);
  const profFees = annualOf('profFees');
  const flexiMeal = annualOf('flexi') + annualOf('meal');
  const pf = annualOf('pf');
  const nps = annualOf('nps');
  const main = Math.max(0, ctc - profFees - flexiMeal);
  const basic = Math.round(main * 0.5);
  const hra = Math.round(basic * 0.6);
  const conveyance = Math.round(basic * 0.1);
  const gratuity = Math.round(basic * 0.0481);
  const other = Math.max(0, main - basic - hra - conveyance - gratuity - pf - nps);
  const totalSalary = basic + hra + conveyance + other;
  return {
    profFees,
    flexiMeal,
    main,
    basic,
    hra,
    conveyance,
    other,
    totalSalary,
    gratuity,
    pf,
    nps,
    totalBenefit: gratuity + pf + nps,
  };
};

/** Yearly tax incl. 4% cess: old regime from the deductions walk-down, new regime on Total Salary less ₹75,000 */
export const estimateTax = (ctc: number, statutory: number, c: ComponentChoices) => {
  if (c.regime === 'Old') return oldRegimeCalc(ctc, statutory, c).total;
  const taxable = Math.max(0, salaryStructure(ctc, c).totalSalary - 75000);
  if (taxable <= 1200000) return 0;
  return Math.round(
    slabTax(taxable, [
      [400000, 0], [800000, 0.05], [1200000, 0.1], [1600000, 0.15], [2000000, 0.2], [2400000, 0.25], [Infinity, 0.3],
    ]) * 1.04
  );
};

/** Flexible pool that funds the components; whatever isn't used is paid as Other Allowance */
export const otherAllowance = (ctc: number, pool: number, c: ComponentChoices) =>
  Math.max(0, pool - COMPONENTS.filter((m) => c.optedIn[m.id]).reduce((n, m) => n + m.annual(ctc, c), 0));

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

/* --------------------------------- Pieces --------------------------------- */

/** Two-option pill switch, as on the web (selected option is filled blue) */
const PillSwitch = <T extends string | boolean>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { v: T; t: string }[];
  onChange: (v: T) => void;
  label: string;
}) => (
  <div role="radiogroup" aria-label={label} className="flex p-0.5 rounded-full bg-white border border-slate-200 shrink-0">
    {options.map(({ v, t }) => (
      <button
        key={t}
        type="button"
        role="radio"
        aria-checked={value === v}
        onClick={() => onChange(v)}
        className={`h-7 px-2 rounded-full text-[10.5px] font-semibold transition-colors cursor-pointer ${
          value === v ? 'bg-[#2F68FE] text-white shadow-2xs' : 'text-slate-400'
        }`}
      >
        {t}
      </button>
    ))}
  </div>
);

export interface InfoContent {
  title: string;
  paragraphs: React.ReactNode[];
}

/** The (i) next to a heading; opens its explanation in a bottom sheet */
const InfoButton: React.FC<{ label: string; onClick: () => void; className?: string }> = ({ label, onClick, className = 'text-slate-400' }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={`About ${label}`}
    className={`w-6 h-6 -m-1 rounded-full flex items-center justify-center shrink-0 active:bg-slate-200/70 cursor-pointer ${className}`}
  >
    <Info className="w-3.5 h-3.5" />
  </button>
);

const InfoSheet: React.FC<{ content: InfoContent | null; onClose: () => void }> = ({ content, onClose }) => {
  // Keep the last content while the sheet animates out
  const [shown, setShown] = useState<InfoContent | null>(content);
  if (content && content !== shown) setShown(content);

  return (
    <BottomSheet isOpen={Boolean(content)} onClose={onClose} maxHeight="max-h-[80%]">
      <div className="pt-3 pb-1 flex justify-center shrink-0">
        <div className="w-10 h-1 bg-slate-300 rounded-full" />
      </div>
      <div className="flex items-center justify-between gap-3 px-5 pt-1 pb-3 border-b border-slate-100 shrink-0">
        <h2 className="text-base font-bold text-[#1E293B]">{shown?.title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 cursor-pointer shrink-0"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-4 space-y-3 text-[13px] text-slate-600 leading-relaxed">
        {shown?.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
      </div>
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
};

const INVESTMENT_DECLARATION_INFO: InfoContent = {
  title: 'Investment Declaration Required',
  paragraphs: [
    <>
      Old Regime deductions and exemptions are subject to valid investment declaration in{' '}
      <span className="font-bold text-[#1E293B]">Spine HRMS</span>.
    </>,
    'This section is only for trying different deduction amounts and estimating your tentative tax liability. Actual tax benefit will apply only after you declare the investments and submit valid proofs in Spine HRMS before the company deadline. Undeclared or unsupported deductions may be reversed, and tax may be recovered.',
  ],
};

/** Green limit tag on a deduction ("Auto Applied", "Max ₹1,50,000", …) */
const LimitBadge: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-semibold text-emerald-700 whitespace-nowrap shrink-0">
    {children}
  </span>
);

const DeductionHead: React.FC<{ title: string; text: string; badge?: string }> = ({ title, text, badge }) => (
  <div className="flex items-start justify-between gap-2.5">
    <div className="min-w-0">
      <p className="text-xs font-bold text-[#1E293B]">{title}</p>
      <p className="mt-0.5 text-[11px] text-slate-500 leading-relaxed">{text}</p>
    </div>
    {badge && <LimitBadge>{badge}</LimitBadge>}
  </div>
);

/** Rupee amount field; digits only, optionally capped at the statutory limit */
const AmountField: React.FC<{
  id: string;
  label: string;
  value: string;
  onChange?: (v: string) => void;
  max?: number;
  hint?: string;
  readOnlyText?: string;
  placeholder?: string;
  /** Digit count for ID numbers (UAN / PRAN); keeps leading zeros */
  maxLength?: number;
  error?: React.ReactNode;
  /** Red border only, when the message is shown elsewhere */
  invalid?: boolean;
  onBlur?: () => void;
}> = ({ id, label, value, onChange, max, hint, readOnlyText, placeholder = 'Enter Here', maxLength, error, invalid, onBlur }) => (
  <div>
    <label htmlFor={id} className="block text-[11px] font-semibold text-[#1E293B]">
      {label}
    </label>
    {readOnlyText ? (
      <p id={id} className="mt-1.5 h-11 px-3.5 flex items-center rounded-xl bg-slate-100 border border-slate-200 text-sm text-slate-500">
        {readOnlyText}
      </p>
    ) : (
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        aria-invalid={Boolean(error) || invalid}
        onBlur={onBlur}
        onChange={(e) => {
          const raw = e.target.value.replace(/\D/g, '');
          const digits = maxLength ? raw.slice(0, maxLength) : raw.replace(/^0+(?=\d)/, '');
          onChange?.(max !== undefined && Number(digits) > max ? String(max) : digits);
        }}
        className={`mt-1.5 w-full h-11 px-3.5 bg-white border rounded-xl text-sm text-[#1E293B] tabular-nums placeholder:text-slate-400 focus:outline-hidden focus:border-[#2F68FE] focus:ring-4 focus:ring-blue-50 select-text ${
          error || invalid ? 'border-rose-300' : 'border-slate-200'
        }`}
      />
    )}
    {error && <div className="mt-1.5 space-y-1 text-[10.5px] text-rose-500 leading-relaxed">{error}</div>}
    {hint && <p className="mt-1.5 text-[10.5px] text-slate-500 leading-relaxed">{hint}</p>}
  </div>
);

/** Grey read-only figure tile under a component's inputs */
const FigureTile: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-xl p-3 bg-slate-50 border border-slate-100 min-w-0">
    <p className="text-[10.5px] text-slate-500">{label}</p>
    <p className="mt-0.5 text-sm font-bold text-[#1E293B] tabular-nums">{value}</p>
  </div>
);

/** Inputs shown under an opted-in component (both regimes) */
const ComponentPanel: React.FC<{
  id: Exclude<ComponentId, 'profFees'>;
  effectiveMonth: string;
  flexiAnnualMax: number;
  npsMonthlyMax: number;
  choices: ComponentChoices;
  onChange: (next: ComponentChoices) => void;
}> = ({ id, effectiveMonth, flexiAnnualMax, npsMonthlyMax, choices, onChange }) => {
  const [uanTouched, setUanTouched] = useState(false);
  const months = monthsLeftInFy(effectiveMonth);
  const setMonthly = (key: keyof ComponentChoices['monthly']) => (v: string) =>
    onChange({ ...choices, monthly: { ...choices.monthly, [key]: v } });

  if (id === 'flexi') {
    const monthlyMax = Math.floor(flexiAnnualMax / months);
    const over = amt(choices.monthly.flexi) > monthlyMax;
    return (
      <div className="space-y-2.5">
        <AmountField
          id="flexi-monthly"
          label="Monthly Flexi Amount"
          value={choices.monthly.flexi}
          onChange={setMonthly('flexi')}
          error={over && <p>Maximum limit is {inr(monthlyMax)} per month ({inr(flexiAnnualMax)} annual).</p>}
        />
        <div className="grid grid-cols-2 gap-2.5">
          <FigureTile label="Maximum Annual Eligible Amount" value={inr(flexiAnnualMax)} />
          <FigureTile label="Maximum Monthly Amount" value={`${inr(monthlyMax)} / mo`} />
        </div>
      </div>
    );
  }

  if (id === 'meal') {
    const prorated = MEAL_MAX * months;
    const over = amt(choices.monthly.meal) > MEAL_MAX;
    return (
      <div className="space-y-2.5">
        <AmountField
          id="meal-monthly"
          label="Monthly Meal Allowance"
          value={choices.monthly.meal}
          onChange={setMonthly('meal')}
          error={
            over && (
              <>
                <p>
                  Maximum limit is {inr(MEAL_MAX)} per month ({inr(prorated)} prorated annual).
                </p>
                <p>
                  Annual Meal Allowance cannot exceed {inr(prorated)} (prorated for {months} months).
                </p>
              </>
            )
          }
        />
        <div className="grid grid-cols-2 gap-2.5">
          <FigureTile label="Effective Month" value={effectiveMonth} />
          <FigureTile label="Prorated Annual Allowed" value={inr(prorated)} />
        </div>
      </div>
    );
  }

  if (id === 'pf') {
    return (
      <AmountField
        id="pf-uan"
        label="UAN Number"
        value={choices.uan}
        placeholder="Enter UAN Number"
        maxLength={12}
        onChange={(uan) => onChange({ ...choices, uan })}
        onBlur={() => setUanTouched(true)}
        error={uanTouched && !choices.uan && <p>UAN Number is required.</p>}
      />
    );
  }

  const over = amt(choices.monthly.nps) > npsMonthlyMax;
  return (
    <div className="space-y-2.5">
      <AmountField
        id="nps-pran"
        label="PRAN Number"
        value={choices.pran}
        placeholder="Enter PRAN Number"
        maxLength={12}
        onChange={(pran) => onChange({ ...choices, pran })}
      />
      <div className="grid grid-cols-2 gap-2.5">
        <AmountField id="nps-monthly" label="Monthly Contribution" value={choices.monthly.nps} onChange={setMonthly('nps')} invalid={over} />
        <AmountField id="nps-max" label="Max Eligible Limit" value="" readOnlyText={`${inr(npsMonthlyMax)} / mo`} />
      </div>
      {over && (
        <p className="-mt-1 text-[10.5px] text-rose-500 leading-relaxed">
          NPS amount cannot exceed 14% of Basic Salary or the available Other Allowance balance after VPF (if opt-in), whichever is lower.
        </p>
      )}
    </div>
  );
};

const DeductionCard: React.FC<{ head: React.ReactNode; children: React.ReactNode }> = ({ head, children }) => (
  <div className="rounded-xl border border-slate-100 overflow-hidden">
    <div className="px-3.5 py-3 bg-slate-50 border-b border-slate-100">{head}</div>
    <div className="px-3.5 py-3 bg-white">{children}</div>
  </div>
);

const CHAPTER_6A: { key: keyof OldRegimeDeductions; title: string; text: string; badge: string; max?: number }[] = [
  { key: 'sec80c', title: 'Section 80C', text: 'PF + ELSS + LIC + PPF + NSC + 5yr FD + Home Loan Principal etc.', badge: 'Max ₹1,50,000', max: SEC_80C_MAX },
  {
    key: 'sec80ccd1b',
    title: 'Section 80CCD(1B) - Additional NPS',
    text: 'Over and above 80C limit. Self-contribution to NPS Tier 1 account only.',
    badge: 'Max ₹50,000',
    max: SEC_80CCD1B_MAX,
  },
  {
    key: 'sec80d',
    title: 'Section 80D - Health Insurance',
    text: 'Premiums for self + family + parents. Max ₹25K self/family; additional ₹25K for parents (₹50K if senior citizens).',
    badge: 'As Applicable',
  },
  {
    key: 'sec80eOther',
    title: 'Section 80E / 80G / Other',
    text: 'Declare eligible deductions for education loan interest, donations, or other applicable sections.',
    badge: 'As per eligibility',
  },
];

const OldRegimeDeductionsSection: React.FC<{
  ctc: number;
  statutory: number;
  choices: ComponentChoices;
  onChange: (next: ComponentChoices) => void;
  onInfo: (content: InfoContent) => void;
}> = ({ ctc, statutory, choices, onChange, onInfo }) => {
  const d = choices.oldDeductions;
  const set = (key: keyof OldRegimeDeductions) => (v: string) => onChange({ ...choices, oldDeductions: { ...d, [key]: v } });
  const { declared } = oldRegimeCalc(ctc, statutory, choices);

  return (
    <section className="bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs overflow-hidden animate-in fade-in duration-200">
      <div className="px-4 py-3.5 border-b border-slate-100">
        <h3 className="text-sm font-bold text-[#1E293B]">Old Regime - Tax Deductions &amp; Exemptions</h3>
        <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
          Declare your investments and exemptions to reduce your tax liability. Pre-filled with maximum eligible limits.
        </p>
      </div>

      <div className="p-3 space-y-2.5">
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-100 text-[11px] text-amber-700">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span className="font-bold">Investment Declaration Required.</span>
          <InfoButton
            label="Investment Declaration Required"
            onClick={() => onInfo(INVESTMENT_DECLARATION_INFO)}
            className="ml-auto text-amber-600 active:bg-amber-100"
          />
        </div>

        <DeductionCard
          head={<DeductionHead title="Standard Deduction" text="Flat deduction - no investment proof required" badge="Auto Applied" />}
        >
          <AmountField
            id="old-std"
            label="Deduction Amount"
            value=""
            readOnlyText={inr(OLD_STANDARD_DEDUCTION)}
            hint="Fixed as per Sec 16(ia) applicable to all salaried employees"
          />
        </DeductionCard>

        <DeductionCard
          head={
            <DeductionHead
              title="HRA Exemption"
              text="Auto-calculated as Min of 30% of Basic or ₹3,00,000 per year"
              badge="Up to ₹3,00,000"
            />
          }
        >
          <AmountField
            id="old-hra"
            label="HRA Exemption (Annual)"
            value={d.hra}
            onChange={set('hra')}
            max={HRA_MAX}
            hint="Min of: 30% of Basic or ₹3,00,000"
          />
        </DeductionCard>

        <DeductionCard
          head={
            <DeductionHead
              title="Other Allowance Maximum"
              text="As applicable based on your salary structure"
              badge="As Applicable"
            />
          }
        >
          <AmountField
            id="old-other"
            label="Other Allowance (Annual)"
            value={d.otherAllowance}
            onChange={set('otherAllowance')}
            hint="Sum of Conveyance, Hostel Allowance, Children Education Allowance, and LTA (Availed and Claimed)"
          />
        </DeductionCard>

        <DeductionCard head={<DeductionHead title="Chapter VI-A Deductions" text="Investment-linked deductions - proofs required" />}>
          <div className="divide-y divide-slate-100">
            {CHAPTER_6A.map((s) => (
              <div key={s.key} className="py-3 first:pt-0 space-y-2.5">
                <DeductionHead title={s.title} text={s.text} badge={s.badge} />
                <AmountField id={`old-${s.key}`} label="Declared Amount (₹)" value={d[s.key]} onChange={set(s.key)} max={s.max} />
              </div>
            ))}
            <p className="pt-3 text-[10.5px] text-slate-500 leading-relaxed">
              Applicable for Section 80E, Section 80G, and other eligible deductions. Final deduction may depend on proof submission,
              eligibility, and statutory limits.
            </p>
          </div>
        </DeductionCard>

        <DeductionCard
          head={
            <DeductionHead
              title="Home Loan Interest - Section 24(b)"
              text="Deduction on interest paid on home loan for self-occupied property"
              badge="Up to ₹2,00,000/yr"
            />
          }
        >
          <AmountField
            id="old-home-loan"
            label="Annual Interest Paid (₹)"
            value={d.homeLoan}
            onChange={set('homeLoan')}
            max={HOME_LOAN_MAX}
            hint="Enter ₹0 if no home loan. Bank certificate required as proof."
          />
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-start justify-between gap-3 text-[10.5px] text-slate-500">
            <span>Includes: interest on home loan for self-occupied property only</span>
            <span className="shrink-0">Let-out property: no cap</span>
          </div>
        </DeductionCard>

        <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-blue-50 border border-blue-100 text-[#2F68FE]">
          <span className="flex items-center gap-1.5 text-[11px]">
            <Info className="w-3.5 h-3.5 shrink-0" />
            Total Deductions Declared
          </span>
          <span className="text-sm font-bold tabular-nums">{inr(declared)}</span>
        </div>
      </div>
    </section>
  );
};

/** Old regime walk-down shown under the snapshot rows */
const OldRegimeTaxCalc: React.FC<{ ctc: number; statutory: number; choices: ComponentChoices }> = ({ ctc, statutory, choices }) => {
  const t = oldRegimeCalc(ctc, statutory, choices);
  const less = (n: number) => `– ${inr(n)}`;
  const rows: { label: string; value: string; tone?: 'minus' | 'net' | 'final' }[] = [
    { label: 'Gross taxable salary', value: inr(t.gross) },
    { label: 'Statutory Deduction', value: less(t.statutory), tone: 'minus' },
    { label: 'Standard Deduction', value: less(OLD_STANDARD_DEDUCTION), tone: 'minus' },
    { label: 'HRA exemption', value: less(t.hra), tone: 'minus' },
    { label: 'Other Allowance (Annual)', value: less(t.other), tone: 'minus' },
    { label: 'Chap VI-A (80C+CCD+D+Other)', value: less(t.chapter6a), tone: 'minus' },
    { label: 'Home loan (Sec 24b)', value: less(t.homeLoan), tone: 'minus' },
    { label: 'Net taxable income', value: inr(t.net), tone: 'net' },
    { label: 'Tax (slabs 0/5/20/30%)', value: inr(t.slab) },
    { label: 'Surcharge', value: inr(t.surcharge) },
    { label: 'Health & Education Cess @ 4%', value: inr(t.cess) },
    { label: 'Final Tax Liability (Tentative)', value: inr(t.total), tone: 'final' },
  ];

  return (
    <div className="pt-3 mt-1 border-t border-slate-100">
      <p className="px-1 text-[10px] font-bold uppercase tracking-wider text-[#1E293B]">Old Regime Tax Calc</p>
      <dl className="mt-2 space-y-0.5 text-[11px]">
        {rows.map((r) => (
          <div
            key={r.label}
            className={`flex items-center justify-between gap-3 px-2 py-1.5 rounded-lg ${
              r.tone === 'net' ? 'bg-emerald-50 text-emerald-700 font-semibold' : r.tone === 'final' ? 'bg-blue-50 text-[#2F68FE] font-semibold' : 'text-slate-600'
            }`}
          >
            <dt>{r.label}</dt>
            <dd className={`tabular-nums shrink-0 ${r.tone === 'minus' ? 'text-rose-600' : r.tone ? 'font-bold' : 'text-[#1E293B]'}`}>{r.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
};

/* ---------------------------------- Step ---------------------------------- */

export const SalaryComponentsStep: React.FC<{
  ctc: number;
  pool: number;
  /** Yearly statutory deduction used in the old regime calculation */
  statutory: number;
  /** e.g. "Oct 2026"; drives the prorated limits */
  effectiveMonth: string;
  /** Yearly Flexi Expense Reimbursement ceiling for the rest of the year */
  flexiAnnualMax: number;
  /** Fixed monthly NPS ceiling shown as Max Eligible Limit */
  npsMonthlyMax: number;
  choices: ComponentChoices;
  onChange: (next: ComponentChoices) => void;
  /** "click here" in the Prof. Fees panel */
  onManageProfFees: () => void;
}> = ({ ctc, pool, statutory, effectiveMonth, flexiAnnualMax, npsMonthlyMax, choices, onChange, onManageProfFees }) => {
  const setOpt = (id: ComponentId, on: boolean) => onChange({ ...choices, optedIn: { ...choices.optedIn, [id]: on } });
  const [info, setInfo] = useState<InfoContent | null>(null);

  return (
    <>
      {/* Tax Regime */}
      <section className="bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs px-4 py-3.5 flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-[#1E293B]">Tax Regime</h3>
        <PillSwitch<'Old' | 'New'>
          label="Tax Regime"
          value={choices.regime}
          options={[
            { v: 'Old', t: 'Old Regime' },
            { v: 'New', t: 'New Regime' },
          ]}
          onChange={(regime) => onChange({ ...choices, regime })}
        />
      </section>

      {/* Salary Components */}
      <section className="bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs overflow-hidden">
        <h3 className="px-4 py-3.5 border-b border-slate-100 text-sm font-bold text-[#1E293B]">Salary Components</h3>
        <ul className="px-2 py-2.5 space-y-2">
          {COMPONENTS.map((m) => (
            <li key={m.id} className="rounded-xl bg-slate-50 border border-slate-100 overflow-hidden">
              <div className="px-2.5 py-3 flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="flex items-center gap-1.5 text-xs font-bold text-[#1E293B]">
                    <span>{m.label}</span>
                    <InfoButton label={m.label} onClick={() => setInfo({ title: m.label, paragraphs: m.info })} />
                  </p>
                  {m.note && <p className="mt-1 text-[11px] text-slate-600">{m.note}</p>}
                </div>
                <PillSwitch<boolean>
                  label={m.label}
                  value={choices.optedIn[m.id]}
                  options={[
                    { v: true, t: 'Opt in' },
                    { v: false, t: 'Opt out' },
                  ]}
                  onChange={(on) => setOpt(m.id, on)}
                />
              </div>

              {/* Prof. Fees opted in: allocation + link to manage it */}
              {m.id === 'profFees' && choices.optedIn.profFees && (
                <div className="px-2.5 pb-2.5 pt-2.5 bg-white border-t border-slate-100 animate-in fade-in duration-200">
                  <div className="rounded-xl border border-[#DBE6FE] overflow-hidden">
                    <div className="px-3 py-2.5 bg-[#EEF4FF]">
                      <p className="text-[10.5px] text-slate-500">Total Prof. Fees Allocation</p>
                      <p className="mt-0.5 text-base font-extrabold text-[#1E293B] tabular-nums">{inr(choices.profFeesAllocation)}</p>
                    </div>
                    {/* Whole row is the tap target (a tiny inline link is hard to hit on a phone) */}
                    <button
                      type="button"
                      onClick={onManageProfFees}
                      className="w-full min-h-12 px-3 py-2.5 bg-white border-t border-[#DBE6FE] flex items-center gap-2.5 text-left active:bg-blue-50 cursor-pointer"
                    >
                      <span className="w-8 h-8 rounded-lg bg-blue-50 text-[#2F68FE] flex items-center justify-center shrink-0">
                        <SlidersHorizontal className="w-4 h-4" />
                      </span>
                      <span className="flex-1 min-w-0 text-[11.5px] text-slate-600 leading-snug">
                        Please <span className="font-bold text-[#2F68FE]">click here</span> to manage your professional fees.
                      </span>
                      <ChevronRight className="w-4 h-4 text-[#2F68FE] shrink-0" />
                    </button>
                  </div>
                </div>
              )}

              {m.id !== 'profFees' && choices.optedIn[m.id] && (
                <div className="px-2.5 py-3 bg-white border-t border-slate-100 animate-in fade-in duration-200">
                  <ComponentPanel
                    id={m.id}
                    effectiveMonth={effectiveMonth}
                    flexiAnnualMax={flexiAnnualMax}
                    npsMonthlyMax={npsMonthlyMax}
                    choices={choices}
                    onChange={onChange}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      {choices.regime === 'Old' && (
        <OldRegimeDeductionsSection ctc={ctc} statutory={statutory} choices={choices} onChange={onChange} onInfo={setInfo} />
      )}

      {/* Live Structure Snapshot */}
      <section className="bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs overflow-hidden">
        <h3 className="px-4 py-3.5 border-b border-slate-100 text-sm font-bold text-[#1E293B]">Live Structure Snapshot</h3>
        <div className="p-3 space-y-2.5 text-xs">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-xl p-3 bg-slate-50 border border-slate-100 min-w-0">
              <p className="text-[11px] text-slate-500">Main Employee Package</p>
              <p className="mt-1 text-sm font-bold text-[#1E293B] tabular-nums">{inr(salaryStructure(ctc, choices).main)}</p>
            </div>
            <div className="rounded-xl p-3 bg-slate-50 border border-slate-100 min-w-0">
              <p className="text-[11px] text-slate-500">Tax Liability (Tentative)</p>
              <p className="mt-1 text-sm font-bold text-[#1E293B] tabular-nums">{inr(estimateTax(ctc, statutory, choices))}</p>
            </div>
          </div>
          <p className="flex items-start gap-1.5 px-3 py-2 rounded-xl bg-blue-50 border border-blue-100 text-[11px] text-[#2F68FE] leading-relaxed">
            <Info className="w-3.5 h-3.5 shrink-0 mt-px" />
            The snapshot stays in sync as you opt in, opt out, or revisit a completed component.
          </p>
          <ul className="space-y-2">
            {COMPONENTS.map((m) => (
              <li key={m.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-slate-100">
                <span className="text-slate-600">{m.snapshotLabel}</span>
                <span className="font-bold text-[#1E293B] tabular-nums">{inr(choices.optedIn[m.id] ? m.annual(ctc, choices) : 0)}</span>
              </li>
            ))}
            <li className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-slate-100">
              <span className="text-slate-600">Other Allowance (annual)</span>
              <span className="font-bold text-[#1E293B] tabular-nums">{inr(otherAllowance(ctc, pool, choices))}</span>
            </li>
          </ul>
          {choices.regime === 'Old' && <OldRegimeTaxCalc ctc={ctc} statutory={statutory} choices={choices} />}
        </div>
      </section>

      <InfoSheet content={info} onClose={() => setInfo(null)} />
    </>
  );
};
