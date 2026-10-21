import React, { useEffect, useState } from 'react';
import { Briefcase, ChevronDown, Info, Landmark, Table2, TrendingDown, Users } from 'lucide-react';
import { ScreenHeader, Card, EmptyCard } from '../staff/tabs/StaffTabParts';
import { StaffSkeleton } from '../staff/ClientStaffParts';
import { ClientMgmtFeeStructure, MosFeeStructure, OtherFeeStructure, formatFee } from '../data/clientMgmtFeeData';

interface Props {
  structure: ClientMgmtFeeStructure;
  onContactManager: () => void;
  /** Header back arrow (Dashboard) */
  onBack?: () => void;
}

const LOAD_MS = 500;

const TH = 'px-2 py-2.5 text-[10.5px] font-bold text-slate-500 whitespace-nowrap';
const TD_BASE = 'px-2 py-3 text-[12px] whitespace-nowrap tabular-nums';
const TD = `${TD_BASE} text-[#1E293B]`;

const PageSkeleton: React.FC = () => (
  <div className="bg-white border border-[#DCE3ED] rounded-2xl divide-y divide-slate-100" aria-busy="true" aria-label="Loading fee structure">
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="p-3 flex items-center gap-3">
        <StaffSkeleton className="w-16 h-4" />
        <div className="flex-1" />
        <StaffSkeleton className="w-12 h-4" />
        <StaffSkeleton className="w-12 h-4" />
      </div>
    ))}
  </div>
);

/** Desktop table 1 (Level · US Experience · "Staff Member As Per Team Size"): pick a team size → per-level fee list; full matrix in a collapsible compare card */
const LevelTable: React.FC<{ data: MosFeeStructure }> = ({ data }) => {
  const [sel, setSel] = useState(0);
  const [compareOpen, setCompareOpen] = useState(false);
  const fees = data.levels.map((l) => l.fees[sel]);
  const min = Math.min(...fees);
  const max = Math.max(...fees);
  const bracket = data.brackets[sel];

  return (
    <>
      <section className="rounded-2xl p-4 text-white bg-gradient-to-br from-[#2F68FE] to-[#1D4ED8] shadow-[0_8px_20px_-8px_rgba(47,104,254,0.55)]">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-100">
          <Users className="w-3.5 h-3.5" />
          Staff Member As Per Team Size
        </div>
        <div className="mt-1.5 flex items-end justify-between gap-3">
          <div>
            <p className="text-[22px] leading-7 font-extrabold tabular-nums">
              {formatFee(min)}
              {min !== max && <span className="text-blue-200 font-bold"> – {formatFee(max)}</span>}
            </p>
            <p className="text-[11px] text-blue-100">per staff member / month</p>
          </div>
          <span className="shrink-0 h-6 px-2.5 rounded-full bg-white/15 text-[11px] font-bold tabular-nums flex items-center">
            {bracket.label} staff
          </span>
        </div>
        <div
          className="mt-3.5 p-1 rounded-xl bg-white/15 grid gap-1"
          style={{ gridTemplateColumns: `repeat(${data.brackets.length}, minmax(0, 1fr))` }}
          role="tablist"
          aria-label="Team size"
        >
          {data.brackets.map((b, i) => {
            const on = i === sel;
            return (
              <button
                key={b.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setSel(i)}
                className={`h-8 rounded-lg text-[11.5px] font-bold tabular-nums transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-white ${
                  on ? 'bg-white text-[#2F68FE] shadow-sm' : 'text-white/90 active:bg-white/10'
                }`}
              >
                {b.label}
              </button>
            );
          })}
        </div>
      </section>

      <Card className="divide-y divide-slate-100 overflow-hidden">
        {data.levels.map((row) => {
          const fee = row.fees[sel];
          const saved = row.fees[0] - fee;
          return (
            <div key={`${bracket.id}-${row.level}`} className="px-3.5 py-3 flex items-center gap-3 animate-in fade-in duration-200">
              <span className="w-9 h-9 rounded-xl bg-[#EEF3FF] text-[#2F68FE] flex flex-col items-center justify-center shrink-0 leading-none">
                <span className="text-[8.5px] font-bold text-[#2F68FE]/70">Lvl</span>
                <span className="text-[14px] font-extrabold mt-0.5">{row.level}</span>
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-[#1E293B]">Level {row.level}</p>
                <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
                  <Briefcase className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{row.usExperience}</span>
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[15px] font-extrabold text-[#1E293B] tabular-nums">
                  {formatFee(fee)}
                  <span className="text-[10.5px] font-semibold text-slate-400">/mo</span>
                </p>
                {saved > 0 && (
                  <span className="mt-0.5 inline-flex items-center gap-0.5 h-[18px] px-1.5 rounded-md bg-emerald-50 text-emerald-600 text-[10px] font-bold tabular-nums">
                    <TrendingDown className="w-3 h-3" />
                    {formatFee(saved)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </Card>

      <Card className="overflow-hidden">
        <button
          type="button"
          aria-expanded={compareOpen}
          aria-controls="mgmt-fee-compare"
          onClick={() => setCompareOpen((o) => !o)}
          className="w-full px-3.5 py-3 flex items-center gap-3 text-left cursor-pointer active:bg-slate-50"
        >
          <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
            <Table2 className="w-4 h-4" />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-[12.5px] font-bold text-[#1E293B]">Compare all team sizes</span>
            <span className="block text-[10.5px] text-slate-500">Full level-wise fee table</span>
          </span>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${compareOpen ? 'rotate-180' : ''}`} />
        </button>
        {compareOpen && (
          <div id="mgmt-fee-compare" className="border-t border-[#EBF0F7] overflow-x-auto no-scrollbar animate-in fade-in duration-200">
            <table className="min-w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-[#EBF0F7]">
                  <th scope="col" className={`${TH} sticky left-0 z-10 bg-slate-50 pl-3.5 border-r border-[#EBF0F7]`}>
                    Level
                  </th>
                  {data.brackets.map((b, i) => (
                    <th
                      key={b.id}
                      scope="col"
                      aria-label={`Team size ${b.label}`}
                      className={`px-2 py-2.5 text-[10.5px] font-bold whitespace-nowrap last:pr-3.5 text-right tabular-nums ${i === sel ? 'bg-[#EAF0FF] text-[#2F68FE]' : 'text-slate-500'}`}
                    >
                      {b.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.levels.map((row) => (
                  <tr key={row.level}>
                    <th scope="row" className="sticky left-0 z-10 bg-white pl-3.5 pr-2 py-2.5 border-r border-[#EBF0F7] text-left font-normal">
                      <span className="block text-[12px] font-bold text-[#1E293B] whitespace-nowrap">Level {row.level}</span>
                      <span className="block text-[10px] text-slate-500 whitespace-nowrap">{row.usExperience}</span>
                    </th>
                    {row.fees.map((fee, i) => (
                      <td
                        key={data.brackets[i].id}
                        className={`${TD_BASE} last:pr-3.5 text-right ${i === sel ? 'bg-[#F4F7FF] text-[#2F68FE] font-bold' : 'text-slate-600 font-medium'}`}
                      >
                        {formatFee(fee)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <p className="px-1 flex gap-1.5 text-[10.5px] leading-relaxed text-slate-400">
        <Info className="w-3.5 h-3.5 shrink-0 mt-px" />
        <span>
          Fixed monthly fee per staff member, based on your total team size. Green tags show the saving vs. the {data.brackets[0].label} rate.
        </span>
      </p>
    </>
  );
};

/** Desktop tables 2 and 3: two plain columns */
const TwoColumnTable: React.FC<{ head: [string, string]; rows: { id: string; label: string; value: string }[] }> = ({ head, rows }) => (
  <Card className="overflow-hidden">
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="bg-slate-50 border-b border-[#EBF0F7]">
          <th scope="col" className={`${TH} pl-3.5`}>{head[0]}</th>
          <th scope="col" className={`${TH} pr-3.5 text-right whitespace-normal`}>{head[1]}</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {rows.map((r) => (
          <tr key={r.id}>
            <th scope="row" className={`${TD} pl-3.5 font-semibold text-left`}>{r.label}</th>
            <td className={`${TD} pr-3.5 text-right font-bold`}>{r.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </Card>
);

const OtherTables: React.FC<{ data: OtherFeeStructure }> = ({ data }) => (
  <>
    {data.workMode && (
      <TwoColumnTable
        head={['Work Mode', 'Fixed Monthly Fee Per Staff Member']}
        rows={data.workMode.map((w) => ({ id: w.mode, label: w.mode, value: formatFee(w.monthlyFee) }))}
      />
    )}
    {data.hourly && (
      <TwoColumnTable
        head={['No. of Staff', 'Fixed Per Hour']}
        rows={data.hourly.map((h) => ({ id: h.bracket.id, label: h.bracket.label, value: formatFee(h.hourlyFee, 2) }))}
      />
    )}
  </>
);

/** Human Resources › Management Fee Structure (desktop `management_fee_structure`): one read-only table per client, else "No Data Found" */
export const ClientMgmtFeeView: React.FC<Props> = ({ structure, onContactManager, onBack }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), LOAD_MS);
    return () => clearTimeout(t);
  }, []);

  const mos = structure.mos;
  const other = structure.other && (structure.other.workMode || structure.other.hourly) ? structure.other : null;

  return (
    <div className="relative flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      <ScreenHeader title="Management Fee Structure" onBack={onBack} />
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-4 pb-6">
        {loading ? (
          <PageSkeleton />
        ) : (
          <div className="space-y-3 animate-in fade-in duration-200">
            {mos ? (
              <LevelTable data={mos} />
            ) : other ? (
              <OtherTables data={other} />
            ) : (
              <EmptyCard
                icon={Landmark}
                title="No Data Found"
                action={
                  <button
                    type="button"
                    onClick={onContactManager}
                    className="mt-4 h-10 px-4 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] cursor-pointer"
                  >
                    Contact Account Manager
                  </button>
                }
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
