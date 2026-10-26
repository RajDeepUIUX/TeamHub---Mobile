import React, { useEffect, useState } from 'react';
import { Building2, Clock, House, Landmark, Layers, Users } from 'lucide-react';
import { ScreenHeader, EmptyCard } from '../staff/tabs/StaffTabParts';
import { StaffSkeleton } from '../staff/ClientStaffParts';
import { ClientMgmtFeeStructure, HourlyFeeRow, MgmtFeeChart, MosFeeStructure, WorkModeFeeRow, formatFee } from '../data/clientMgmtFeeData';

interface Props {
  /** One chart per client login; tabs preview each */
  charts: MgmtFeeChart[];
  /** Tab opened first (the signed-in client's chart) */
  initialChartId?: MgmtFeeChart['id'];
  onContactManager: () => void;
  /** Header back arrow (Dashboard) */
  onBack?: () => void;
}

const LOAD_MS = 500;

const TAB_ICONS: Record<MgmtFeeChart['id'], React.ElementType> = {
  'level-wise': Layers,
  'per-hour': Clock,
  'work-mode': Building2,
};

const CARD = 'bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs';

const PageSkeleton: React.FC = () => (
  <div className="space-y-3" aria-busy="true" aria-label="Loading fee structure">
    <StaffSkeleton className="w-full h-16 rounded-2xl" />
    <div className={`${CARD} divide-y divide-slate-100`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="p-3.5 flex items-center gap-3">
          <StaffSkeleton className="w-9 h-9 rounded-xl" />
          <div className="flex-1 space-y-1.5">
            <StaffSkeleton className="w-20 h-3.5" />
            <StaffSkeleton className="w-14 h-3" />
          </div>
          <StaffSkeleton className="w-14 h-4" />
        </div>
      ))}
    </div>
  </div>
);

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="px-1 text-sm font-bold text-[#1E293B]">{children}</p>
);

/** Desktop table 1 (Level · US Experience × "Staff Member As Per Team Size"): pick a team size → fee per level */
const LevelWise: React.FC<{ data: MosFeeStructure }> = ({ data }) => {
  const [sel, setSel] = useState(0);
  const bracket = data.brackets[sel];

  return (
    <>
      <div className={`${CARD} p-4`}>
        <p className="flex items-center gap-1.5 text-xs font-bold text-[#1E293B]">
          <Users className="w-4 h-4 text-[#2F68FE]" />
          Staff Member As Per Team Size
        </p>
        <div
          className="mt-3 p-1 rounded-2xl bg-slate-100/90 border border-slate-200/60 grid gap-1"
          style={{ gridTemplateColumns: `repeat(${data.brackets.length}, minmax(0, 1fr))` }}
          role="radiogroup"
          aria-label="Team size"
        >
          {data.brackets.map((b, i) => {
            const on = i === sel;
            return (
              <button
                key={b.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setSel(i)}
                className={`h-9 rounded-xl text-xs tabular-nums transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2F68FE] ${
                  on ? 'bg-white text-[#1E293B] font-bold shadow-[0_1px_3px_rgba(15,23,42,0.12)]' : 'text-slate-500 font-semibold active:bg-white/60'
                }`}
              >
                {b.label}
              </button>
            );
          })}
        </div>
      </div>

      <SectionLabel>Fee per staff member · {bracket.label} team</SectionLabel>
      <div className={`${CARD} divide-y divide-slate-100 overflow-hidden`}>
        {data.levels.map((row) => (
          <div key={`${bracket.id}-${row.level}`} className="px-3.5 py-3 flex items-center gap-3 animate-in fade-in duration-200">
            <span className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#2F68FE] text-sm font-extrabold flex items-center justify-center shrink-0">
              L{row.level}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-[#1E293B]">Level {row.level}</p>
              <p className="text-[11px] text-slate-500 truncate">{row.usExperience}</p>
            </div>
            <p className="text-sm font-bold text-[#1E293B] tabular-nums shrink-0">
              {formatFee(row.fees[sel])}
              <span className="text-[11px] font-medium text-slate-400">/mo</span>
            </p>
          </div>
        ))}
      </div>
    </>
  );
};

/** Desktop table 2: Work Mode · Fixed Monthly Fee Per Staff Member */
const WorkMode: React.FC<{ rows: WorkModeFeeRow[] }> = ({ rows }) => (
  <>
    <SectionLabel>Fixed monthly fee per staff member</SectionLabel>
    <div className="grid grid-cols-2 gap-3">
      {rows.map((r) => {
        const Icon = r.mode === 'Work From Home' ? House : Building2;
        return (
          <div key={r.mode} className={`${CARD} p-4`}>
            <span className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#2F68FE] flex items-center justify-center">
              <Icon className="w-5 h-5" />
            </span>
            <p className="mt-3 text-xs font-semibold text-slate-500">{r.mode}</p>
            <p className="mt-0.5 text-lg font-extrabold text-[#1E293B] tabular-nums">{formatFee(r.monthlyFee)}</p>
            <p className="text-[11px] text-slate-400">per staff / month</p>
          </div>
        );
      })}
    </div>
  </>
);

/** Desktop table 3: No. of Staff · Fixed Per Hour */
const PerHour: React.FC<{ rows: HourlyFeeRow[] }> = ({ rows }) => (
  <>
    <SectionLabel>Fixed fee per hour by no. of staff</SectionLabel>
    <div className={`${CARD} divide-y divide-slate-100 overflow-hidden`}>
      {rows.map((r) => (
        <div key={r.bracket.id} className="px-3.5 py-3 flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#2F68FE] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-[#1E293B] tabular-nums">{r.bracket.label} Staff</p>
            <p className="text-[11px] text-slate-500">No. of staff</p>
          </div>
          <p className="text-sm font-bold text-[#1E293B] tabular-nums shrink-0">
            {formatFee(r.hourlyFee, 2)}
            <span className="text-[11px] font-medium text-slate-400">/hr</span>
          </p>
        </div>
      ))}
    </div>
  </>
);

const ChartBody: React.FC<{ structure: ClientMgmtFeeStructure; onContactManager: () => void }> = ({ structure, onContactManager }) => {
  const { mos, other } = structure;
  if (mos) return <LevelWise data={mos} />;
  if (other?.workMode) return <WorkMode rows={other.workMode} />;
  if (other?.hourly) return <PerHour rows={other.hourly} />;
  return (
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
  );
};

/** Human Resources › Management Fee Structure (desktop `management_fee_structure`): one read-only chart per client login, tab-wise */
export const ClientMgmtFeeView: React.FC<Props> = ({ charts, initialChartId, onContactManager, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<MgmtFeeChart['id'] | undefined>(initialChartId ?? charts[0]?.id);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), LOAD_MS);
    return () => clearTimeout(t);
  }, []);

  const chart = charts.find((c) => c.id === tab) ?? charts[0];

  return (
    <div className="relative flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      <ScreenHeader title="Management Fee Structure" onBack={onBack} />
      <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
        {charts.length > 1 && (
          <nav className="sticky top-0 z-10 bg-white border-b border-[#EBF0F7]" aria-label="Fee chart">
            <div role="tablist" className="flex gap-1 overflow-x-auto no-scrollbar px-2">
              {charts.map((c) => {
                const on = c.id === chart.id;
                const Icon = TAB_ICONS[c.id];
                return (
                  <button
                    key={c.id}
                    type="button"
                    role="tab"
                    id={`mgmt-fee-tab-${c.id}`}
                    aria-selected={on}
                    aria-controls="mgmt-fee-panel"
                    onClick={() => setTab(c.id)}
                    className={`relative h-12 px-3 flex items-center gap-1.5 text-[13px] font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#2F68FE] ${
                      on ? 'text-[#2F68FE]' : 'text-slate-500 active:text-[#1E293B]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {c.tabLabel}
                    <span
                      className={`absolute left-2 right-2 bottom-0 h-[3px] rounded-t-full bg-[#2F68FE] transition-opacity duration-200 ${
                        on ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </nav>
        )}
        <div className="px-4 pt-3.5">
          {loading ? (
            <PageSkeleton />
          ) : !chart ? (
            <ChartBody structure={{ mos: null, other: null }} onContactManager={onContactManager} />
          ) : (
            <div
              key={chart.id}
              id="mgmt-fee-panel"
              role="tabpanel"
              aria-labelledby={`mgmt-fee-tab-${chart.id}`}
              className="space-y-4 animate-in fade-in duration-200"
            >
              <div className={`${CARD} p-4 flex items-center gap-3`}>
                <span className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 text-[#2F68FE] flex items-center justify-center shrink-0">
                  <Landmark className="w-5 h-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">Management Fee Chart</p>
                  <p className="text-base font-bold text-[#1E293B] truncate">{chart.firmName}</p>
                </div>
              </div>
              <ChartBody structure={chart.structure} onContactManager={onContactManager} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
