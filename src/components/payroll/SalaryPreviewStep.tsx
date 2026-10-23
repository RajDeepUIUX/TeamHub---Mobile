import React from 'react';
import { ComponentChoices, PROFESSIONAL_TAX_ANNUAL, estimateTax, salaryStructure } from './SalaryComponentsStep';

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const perMonth = (yearly: number) => Math.round(yearly / 12);

type RowTone = 'plain' | 'subtotal' | 'ctc';

/** Step 3: read-only breakup of the structure picked in Select Components */
export const SalaryPreviewStep: React.FC<{
  ctc: number;
  statutory: number;
  choices: ComponentChoices;
}> = ({ ctc, statutory, choices }) => {
  const s = salaryStructure(ctc, choices);
  const tax = estimateTax(ctc, statutory, choices);
  const deductions = PROFESSIONAL_TAX_ANNUAL + tax;

  const isOld = choices.regime === 'Old';
  // Old regime splits extra exempt allowances out of Other Allowance (Hostel and LTA at 8% of Basic, Children Education
  // ₹3,000/month), each funded from what's left so the rows always add up to Total Salary
  let pool = s.other;
  const take = (want: number) => {
    const got = isOld ? Math.min(pool, want) : 0;
    pool -= got;
    return got;
  };
  const hostel = take(Math.round(s.basic * 0.08));
  const cea = take(36000);
  const lta = take(Math.round(s.basic * 0.08));
  const other = pool;
  // The employee's own PF contribution is deducted from pay (both regimes)
  const pfEmployee = s.pf;
  const allDeductions = deductions + pfEmployee;
  const takeHome = s.totalSalary - allDeductions;

  // Salary rows differ by regime; benefits and deductions are laid out the same way
  const salaryRows: { label: string; yearly: number; tone?: RowTone }[] = isOld
    ? [
        { label: 'Basic', yearly: s.basic },
        { label: 'HRA (Availed and Claimed)', yearly: s.hra },
        { label: 'Conveyance', yearly: s.conveyance },
        { label: 'Hostel Allowance', yearly: hostel },
        { label: 'Children Education Allowance', yearly: cea },
        { label: 'LTA (Availed and Claimed)', yearly: lta },
        { label: 'Other Allowance', yearly: other },
      ]
    : [
        { label: 'Basic Salary', yearly: s.basic },
        { label: 'HRA', yearly: s.hra },
        { label: 'Conveyance', yearly: s.conveyance },
        { label: 'Other Allowance', yearly: s.other },
      ];

  const rows: { label: string; yearly: number; tone?: RowTone }[] = [
    ...salaryRows,
    { label: 'Total Salary (a)', yearly: s.totalSalary, tone: 'subtotal' },
    ...(s.pf ? [{ label: 'Provident Fund - Employer', yearly: s.pf }] : []),
    ...(s.nps ? [{ label: 'NPS - Employer Contribution', yearly: s.nps }] : []),
    { label: 'Gratuity', yearly: s.gratuity },
    { label: 'Total Benefit (b)', yearly: s.totalBenefit, tone: 'subtotal' },
    { label: 'Total CTC (a+b)', yearly: s.totalSalary + s.totalBenefit, tone: 'ctc' },
    { label: 'Professional Tax', yearly: PROFESSIONAL_TAX_ANNUAL },
    ...(pfEmployee ? [{ label: 'Provident Fund - Employee', yearly: pfEmployee }] : []),
    { label: 'Income Tax - Salary (Tentative)', yearly: tax },
    { label: 'Deductions (c)', yearly: allDeductions, tone: 'subtotal' },
  ];

  return (
    <section className="bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs overflow-hidden">
      <h3 className="px-4 py-3.5 border-b border-slate-100 text-sm font-bold text-[#1E293B]">Salary Structure Preview</h3>

      <div className="p-3 space-y-3">
        {/* Headline figures */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="col-span-2 rounded-2xl p-3.5 bg-[#2F68FE] text-white relative overflow-hidden">
            <span className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10" aria-hidden="true" />
            <p className="text-[11px] font-semibold text-blue-100">Total</p>
            <p className="mt-0.5 text-xl font-extrabold tracking-tight tabular-nums">{inr(ctc)}</p>
          </div>
          {[
            { label: 'Prof. Fees', value: s.profFees },
            { label: 'Flexi & Meal Allowance', value: s.flexiMeal },
            { label: 'Main Employee Package', value: s.main },
            { label: 'Tax Liability (Tentative)', value: tax },
          ].map((k) => (
            <div key={k.label} className="rounded-xl p-3 bg-slate-50 border border-slate-100 min-w-0">
              <p className="text-[10.5px] text-slate-500 leading-snug">{k.label}</p>
              <p className="mt-1 text-sm font-bold text-[#1E293B] tabular-nums">{inr(k.value)}</p>
            </div>
          ))}
        </div>

        {/* Breakup */}
        <div className="rounded-xl border border-slate-100 overflow-hidden text-[11px]">
          <table className="w-full table-fixed">
            <colgroup>
              <col className="w-[44%]" />
              <col className="w-[26%]" />
              <col className="w-[30%]" />
            </colgroup>
            <thead>
              <tr className="bg-[#EEF2FF] text-[#1E293B]">
                <th scope="col" className="px-3 py-2.5 text-left font-bold">Salary Components</th>
                <th scope="col" className="px-2 py-2.5 text-right font-bold">Monthly (₹)</th>
                <th scope="col" className="px-3 py-2.5 text-right font-bold">Yearly (₹)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.label}
                  className={
                    r.tone === 'ctc'
                      ? 'bg-[#334155] text-white font-bold'
                      : r.tone === 'subtotal'
                        ? 'bg-blue-50/60 border-t border-slate-100 font-bold'
                        : 'border-t border-slate-100'
                  }
                >
                  <th scope="row" className={`px-3 py-2.5 text-left leading-snug ${r.tone ? 'font-bold' : 'font-normal text-slate-600'}`}>
                    {r.label}
                  </th>
                  <td className={`px-2 py-2.5 text-right tabular-nums ${r.tone === 'subtotal' ? 'text-[#2F68FE]' : r.tone ? '' : 'text-[#1E293B]'}`}>
                    {inr(perMonth(r.yearly))}
                  </td>
                  <td className={`px-3 py-2.5 text-right tabular-nums ${r.tone === 'subtotal' ? 'text-[#2F68FE]' : r.tone ? '' : 'text-[#1E293B]'}`}>
                    {inr(r.yearly)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* In-hand pay */}
        <div className="rounded-xl bg-[#334155] text-white p-3.5">
          <p className="text-[11px] font-semibold text-slate-300">In Hand Salary (a-c)</p>
          <div className="mt-1.5 grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-slate-400">Monthly</p>
              <p className="text-base font-extrabold tabular-nums">{inr(perMonth(takeHome))}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-400">Yearly</p>
              <p className="text-base font-extrabold tabular-nums">{inr(takeHome)}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
