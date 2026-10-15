import React from 'react';
import { Info } from 'lucide-react';

/* ---------------------------------- Model ---------------------------------- */

export type TaxRegime = 'Old' | 'New';
export type ComponentId = 'profFees' | 'flexi' | 'meal' | 'pf' | 'nps';

export interface ComponentChoices {
  regime: TaxRegime;
  optedIn: Record<ComponentId, boolean>;
  /** Set from the professional fees screen; ₹0 until the staff member manages it */
  profFeesAllocation: number;
}

export const MEAL_MAX = 8800;

export const DEFAULT_CHOICES: ComponentChoices = {
  regime: 'New',
  optedIn: { profFees: false, flexi: false, meal: false, pf: false, nps: false },
  profFeesAllocation: 0,
};

interface ComponentMeta {
  id: ComponentId;
  label: string;
  /** Row label in the Live Structure Snapshot */
  snapshotLabel: string;
  note?: string;
  /** Annual amount for a given revised CTC */
  annual: (ctc: number, c: ComponentChoices) => number;
  /** Exempt / deductible under the old regime only, or both */
  taxBreak: 'old' | 'both';
}

const basicOf = (ctc: number) => Math.round(ctc * 0.4);

export const COMPONENTS: ComponentMeta[] = [
  { id: 'profFees', label: 'Prof. Fees', snapshotLabel: 'Prof. Fees', annual: (_, c) => c.profFeesAllocation, taxBreak: 'old' },
  { id: 'flexi', label: 'Flexi Expense Reimbursement', snapshotLabel: 'Flexi Expense Reimbursement', annual: () => 48000, taxBreak: 'old' },
  {
    id: 'meal',
    label: 'Meal Allowance',
    snapshotLabel: 'Meal Allowance',
    note: `Maximum allowed: ₹${MEAL_MAX.toLocaleString('en-IN')}/month`,
    annual: () => MEAL_MAX * 12,
    taxBreak: 'old',
  },
  { id: 'pf', label: 'Provident Fund', snapshotLabel: 'Provident Fund', annual: () => 21600, taxBreak: 'both' },
  { id: 'nps', label: 'National Pension System', snapshotLabel: 'NPS amount', annual: (ctc) => Math.round(basicOf(ctc) * 0.1), taxBreak: 'both' },
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

/** Rough yearly tax incl. 4% cess, for the snapshot only */
export const estimateTax = (ctc: number, c: ComponentChoices) => {
  const breaks = COMPONENTS.filter((m) => c.optedIn[m.id]).reduce(
    (n, m) => n + (m.taxBreak === 'both' || c.regime === 'Old' ? m.annual(ctc, c) : 0),
    0
  );
  if (c.regime === 'New') {
    const taxable = Math.max(0, ctc - 75000 - breaks);
    if (taxable <= 1200000) return 0;
    return Math.round(
      slabTax(taxable, [
        [400000, 0], [800000, 0.05], [1200000, 0.1], [1600000, 0.15], [2000000, 0.2], [2400000, 0.25], [Infinity, 0.3],
      ]) * 1.04
    );
  }
  const taxable = Math.max(0, ctc - 50000 - breaks);
  if (taxable <= 500000) return 0;
  return Math.round(slabTax(taxable, [[250000, 0], [500000, 0.05], [1000000, 0.2], [Infinity, 0.3]]) * 1.04);
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
        className={`h-7 px-2.5 rounded-full text-[10.5px] font-semibold transition-colors cursor-pointer ${
          value === v ? 'bg-[#2F68FE] text-white shadow-2xs' : 'text-slate-400'
        }`}
      >
        {t}
      </button>
    ))}
  </div>
);

/* ---------------------------------- Step ---------------------------------- */

export const SalaryComponentsStep: React.FC<{
  ctc: number;
  pool: number;
  choices: ComponentChoices;
  onChange: (next: ComponentChoices) => void;
  /** "click here" in the Prof. Fees panel */
  onManageProfFees: () => void;
}> = ({ ctc, pool, choices, onChange, onManageProfFees }) => {
  const setOpt = (id: ComponentId, on: boolean) => onChange({ ...choices, optedIn: { ...choices.optedIn, [id]: on } });

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
        <ul className="p-3 space-y-2.5">
          {COMPONENTS.map((m) => (
            <li key={m.id} className="rounded-xl bg-slate-50 border border-slate-100 overflow-hidden">
              <div className="px-3.5 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="flex items-center gap-1.5 text-xs font-bold text-[#1E293B]">
                    <span>{m.label}</span>
                    <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
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
                <div className="px-3 pb-3 pt-0.5 space-y-2 bg-white border-t border-slate-100 animate-in fade-in duration-200">
                  <div className="mt-2.5 px-3 py-2.5 rounded-xl bg-[#EEF4FF] border border-[#DBE6FE]">
                    <p className="text-[10.5px] text-slate-500">Total Prof. Fees Allocation</p>
                    <p className="mt-0.5 text-sm font-bold text-[#1E293B] tabular-nums">{inr(choices.profFeesAllocation)}</p>
                  </div>
                  <p className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 text-center leading-relaxed">
                    Please{' '}
                    <button
                      type="button"
                      onClick={onManageProfFees}
                      className="font-semibold text-[#2F68FE] underline underline-offset-2 cursor-pointer"
                    >
                      click here
                    </button>{' '}
                    to manage your professional fees.
                  </p>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* Live Structure Snapshot */}
      <section className="bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs overflow-hidden">
        <h3 className="px-4 py-3.5 border-b border-slate-100 text-sm font-bold text-[#1E293B]">Live Structure Snapshot</h3>
        <div className="p-3 space-y-2.5 text-xs">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-xl p-3 bg-slate-50 border border-slate-100 min-w-0">
              <p className="text-[11px] text-slate-500">Main Employee Package</p>
              <p className="mt-1 text-sm font-bold text-[#1E293B] tabular-nums">{inr(ctc)}</p>
            </div>
            <div className="rounded-xl p-3 bg-slate-50 border border-slate-100 min-w-0">
              <p className="text-[11px] text-slate-500">Tax Liability (Tentative)</p>
              <p className="mt-1 text-sm font-bold text-[#1E293B] tabular-nums">{inr(estimateTax(ctc, choices))}</p>
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
        </div>
      </section>
    </>
  );
};
