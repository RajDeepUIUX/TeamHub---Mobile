import React, { useEffect, useMemo, useState } from 'react';
import {
  BadgePercent,
  Building2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Headset,
  House,
  Info,
  Landmark,
  Table2,
  UsersRound,
} from 'lucide-react';
import { Card, EmptyCard, Pill } from '../staff/tabs/StaffTabParts';
import { StaffSkeleton } from '../staff/ClientStaffParts';
import {
  ClientMgmtFeeStructure,
  MosFeeStructure,
  OtherFeeStructure,
  bracketIndexFor,
  formatFee,
} from '../data/clientMgmtFeeData';
import { MgmtFeeTableSheet } from './MgmtFeeTableSheet';

interface Props {
  structure: ClientMgmtFeeStructure;
  /** Current staff count (My Staff, everyone except Inactive) */
  teamSize: number;
  /** Current staff per level number */
  staffByLevel: Record<number, number>;
  companyName: string;
  onContactManager: () => void;
  onOpenMyStaff?: () => void;
}

const LOAD_MS = 500;

const PageSkeleton: React.FC = () => (
  <div className="px-4 mt-4 space-y-3" aria-busy="true" aria-label="Loading fee structure">
    <StaffSkeleton className="w-full h-28 rounded-2xl" />
    <div className="flex gap-1.5">
      {[0, 1, 2, 3].map((i) => (
        <StaffSkeleton key={i} className="w-16 h-8 rounded-full" />
      ))}
    </div>
    <div className="bg-white border border-[#EBF0F7] rounded-2xl divide-y divide-slate-100">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="p-3.5 flex items-center gap-3">
          <StaffSkeleton className="w-10 h-10 rounded-xl" />
          <div className="flex-1 space-y-1.5">
            <StaffSkeleton className="w-20 h-3.5" />
            <StaffSkeleton className="w-24 h-3" />
          </div>
          <StaffSkeleton className="w-14 h-4" />
        </div>
      ))}
    </div>
  </div>
);

const SectionTitle: React.FC<{ title: string; subtitle?: string; action?: React.ReactNode }> = ({ title, subtitle, action }) => (
  <div className="flex items-end justify-between gap-3 px-1">
    <div className="min-w-0">
      <h2 className="text-sm font-extrabold text-[#1E293B]">{title}</h2>
      {subtitle && <p className="text-[11px] text-slate-500">{subtitle}</p>}
    </div>
    {action}
  </div>
);

const ContactCard: React.FC<{ onContact: () => void }> = ({ onContact }) => (
  <Card className="p-4 flex items-center gap-3">
    <span className="w-10 h-10 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0">
      <Headset className="w-5 h-5" />
    </span>
    <div className="flex-1 min-w-0">
      <p className="text-[13px] font-bold text-[#1E293B]">Questions about your fees?</p>
      <p className="text-[11px] text-slate-500">Your Account Manager can walk you through it.</p>
    </div>
    <button
      type="button"
      onClick={onContact}
      className="h-9 px-3.5 rounded-xl bg-[#EFF6FF] text-[#2F68FE] text-xs font-bold active:bg-[#DBEAFE] shrink-0 cursor-pointer"
    >
      Contact
    </button>
  </Card>
);

/** Your team (Added by designer): current My Staff count + the team size band it falls in */
const TeamCard: React.FC<{ teamSize: number; sizeLabel: string; onOpenMyStaff?: () => void; children?: React.ReactNode }> = ({
  teamSize,
  sizeLabel,
  onOpenMyStaff,
  children,
}) => (
  <Card className="p-4 border-[#BFDBFE]">
    <div className="flex items-center gap-3">
      <span className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2F68FE] flex items-center justify-center shrink-0">
        <UsersRound className="w-5 h-5" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-[#1E293B]">Your team: {teamSize} current staff</p>
        <p className="text-[11px] text-slate-500">
          Falls in the <span className="font-bold text-[#2F68FE]">{sizeLabel} staff</span> team size
        </p>
      </div>
      {onOpenMyStaff && (
        <button
          type="button"
          onClick={onOpenMyStaff}
          className="h-8 pl-2 pr-1 rounded-lg text-[11px] font-bold text-[#2F68FE] flex items-center gap-0.5 active:bg-[#EFF6FF] shrink-0 cursor-pointer"
        >
          My Staff <ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
    {children}
  </Card>
);

/* ------------------------------- MOS tab ------------------------------- */

const MosTab: React.FC<{
  data: MosFeeStructure;
  teamSize: number;
  staffByLevel: Record<number, number>;
  onOpenMyStaff?: () => void;
  onOpenTable: () => void;
}> = ({ data, teamSize, staffByLevel, onOpenMyStaff, onOpenTable }) => {
  const teamBracket = bracketIndexFor(data.brackets, teamSize);
  const [selected, setSelected] = useState(teamBracket);
  const [openLevel, setOpenLevel] = useState<number | null>(null);
  const [breakdownOpen, setBreakdownOpen] = useState(false);

  const breakdown = data.levels
    .filter((l) => staffByLevel[l.level])
    .map((l) => ({ level: l.level, count: staffByLevel[l.level], fee: l.fees[teamBracket] }));
  const estimate = breakdown.reduce((sum, r) => sum + r.count * r.fee, 0);
  const isOwnBracket = selected === teamBracket;

  return (
    <div className="space-y-4">
      <TeamCard teamSize={teamSize} sizeLabel={data.brackets[teamBracket].label} onOpenMyStaff={onOpenMyStaff}>
        {breakdown.length > 0 && (
          <>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-slate-500">Estimated monthly fee</p>
                <p className="text-2xl font-extrabold text-[#1E293B] tabular-nums leading-tight">
                  {formatFee(estimate)}
                  <span className="ml-1 text-xs font-semibold text-slate-400">/ month</span>
                </p>
              </div>
              <button
                type="button"
                aria-expanded={breakdownOpen}
                onClick={() => setBreakdownOpen((v) => !v)}
                className="h-8 px-2 rounded-lg text-[11px] font-bold text-[#2F68FE] flex items-center gap-1 active:bg-[#EFF6FF] shrink-0 cursor-pointer"
              >
                {breakdownOpen ? 'Hide' : 'Breakdown'}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${breakdownOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>
            {breakdownOpen && (
              <ul className="mt-2.5 rounded-xl bg-slate-50 divide-y divide-slate-100 animate-in fade-in duration-200">
                {breakdown.map((r) => (
                  <li key={r.level} className="px-3 py-2 flex items-center justify-between gap-3 text-[12px] tabular-nums">
                    <span className="text-slate-600">
                      <span className="font-bold text-[#1E293B]">Level {r.level}</span> · {r.count} × {formatFee(r.fee)}
                    </span>
                    <span className="font-bold text-[#1E293B]">{formatFee(r.count * r.fee)}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-[10.5px] text-slate-400 leading-snug">
              Estimate only, based on current staff levels. Your invoice shows the final amount.
            </p>
          </>
        )}
      </TeamCard>

      <section className="space-y-2.5">
        <SectionTitle
          title="Fee per staff member"
          subtitle="Monthly, by level and team size"
          action={
            <button
              type="button"
              onClick={onOpenTable}
              className="h-8 px-2 rounded-lg text-[11px] font-bold text-[#2F68FE] flex items-center gap-1 active:bg-[#EFF6FF] shrink-0 cursor-pointer"
            >
              <Table2 className="w-3.5 h-3.5" /> Full table
            </button>
          }
        />

        <div>
          <p className="px-1 text-[10.5px] font-bold uppercase tracking-wide text-slate-400">Staff Member As Per Team Size</p>
          <div className="-mx-4 mt-1.5 flex gap-1.5 overflow-x-auto no-scrollbar px-4 pb-1" role="group" aria-label="Team size">
            {data.brackets.map((b, i) => {
              const on = i === selected;
              return (
                <button
                  key={b.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setSelected(i)}
                  className={`shrink-0 h-8 px-3 rounded-full text-[11.5px] font-semibold flex items-center gap-1.5 tabular-nums transition-colors cursor-pointer ${
                    on ? 'bg-[#2F68FE] text-white' : 'bg-slate-100 text-slate-600 active:bg-slate-200'
                  }`}
                >
                  {b.label}
                  {i === teamBracket && (
                    <span className={`px-1.5 h-4.5 rounded-full text-[9.5px] font-bold flex items-center ${on ? 'bg-white text-[#2F68FE]' : 'bg-[#EFF6FF] text-[#2F68FE]'}`}>
                      You
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {!isOwnBracket && (
            <p className="mt-1.5 px-1 text-[11px] text-slate-500">
              Showing fees for a {data.brackets[selected].label} team.{' '}
              <button type="button" onClick={() => setSelected(teamBracket)} className="font-bold text-[#2F68FE] cursor-pointer">
                Back to your team
              </button>
            </p>
          )}
        </div>

        <Card className="overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {data.levels.map((row) => {
              const open = openLevel === row.level;
              const staffCount = staffByLevel[row.level] ?? 0;
              const max = Math.max(...row.fees);
              const first = row.fees[0];
              const last = row.fees[row.fees.length - 1];
              const saving = first > 0 ? Math.round(((first - last) / first) * 100) : 0;
              return (
                <li key={row.level}>
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => setOpenLevel(open ? null : row.level)}
                    className="w-full p-3.5 flex items-center gap-3 text-left active:bg-slate-50 cursor-pointer"
                  >
                    <span className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#1D4ED8] text-[12px] font-extrabold flex items-center justify-center shrink-0">
                      L{row.level}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="flex items-center gap-1.5">
                        <span className="text-[13px] font-bold text-[#1E293B]">Level {row.level}</span>
                        {staffCount > 0 && <Pill tone="indigo">{staffCount} staff</Pill>}
                      </span>
                      <span className="block text-[11px] text-slate-500">US experience: {row.usExperience}</span>
                    </span>
                    <span className="text-right shrink-0">
                      <span className="block text-[15px] font-extrabold text-[#1E293B] tabular-nums">{formatFee(row.fees[selected])}</span>
                      <span className="block text-[10px] text-slate-400">/ month</span>
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
                  </button>
                  {open && (
                    <div className="px-3.5 pb-3.5 animate-in fade-in duration-200">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[10.5px] font-bold uppercase tracking-wide text-slate-400">Across team sizes</p>
                        <ul className="mt-2 space-y-1.5">
                          {row.fees.map((fee, i) => (
                            <li key={data.brackets[i].id} className="flex items-center gap-2.5">
                              <span
                                className={`w-12 text-[11px] tabular-nums shrink-0 ${i === selected ? 'font-bold text-[#2F68FE]' : 'font-semibold text-slate-500'}`}
                              >
                                {data.brackets[i].label}
                              </span>
                              <span className="flex-1 h-2 rounded-full bg-slate-200/70 overflow-hidden">
                                <span
                                  className={`block h-full rounded-full ${i === selected ? 'bg-[#2F68FE]' : 'bg-slate-300'}`}
                                  style={{ width: `${(fee / max) * 100}%` }}
                                />
                              </span>
                              <span
                                className={`w-14 text-right text-[11.5px] tabular-nums shrink-0 ${i === selected ? 'font-bold text-[#1E293B]' : 'font-semibold text-slate-600'}`}
                              >
                                {formatFee(fee)}
                              </span>
                            </li>
                          ))}
                        </ul>
                        {saving > 0 && (
                          <p className="mt-2.5 flex items-center gap-1.5 text-[11px] font-semibold text-[#059669]">
                            <BadgePercent className="w-3.5 h-3.5 shrink-0" />
                            {saving}% lower per staff at {data.brackets[data.brackets.length - 1].label} team size
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      </section>

      <Card className="p-4">
        <h2 className="flex items-center gap-1.5 text-[13px] font-bold text-[#1E293B]">
          <Info className="w-4 h-4 text-[#2F68FE]" /> How it works
        </h2>
        <ul className="mt-2 space-y-1.5 text-[11.5px] text-slate-600 leading-relaxed list-disc pl-5">
          <li>A fixed management fee is charged for each staff member every month.</li>
          <li>The fee depends on the staff member's level (US experience).</li>
          <li>The bigger your team, the lower the fee per staff member.</li>
        </ul>
      </Card>
    </div>
  );
};

/* ------------------------------ Other tab ------------------------------ */

const OtherTab: React.FC<{ data: OtherFeeStructure; teamSize: number; onOpenMyStaff?: () => void }> = ({ data, teamSize, onOpenMyStaff }) => {
  const hourlyBracket = data.hourly ? bracketIndexFor(data.hourly.map((h) => h.bracket), teamSize) : -1;
  return (
    <div className="space-y-4">
      {data.hourly && <TeamCard teamSize={teamSize} sizeLabel={data.hourly[hourlyBracket].bracket.label} onOpenMyStaff={onOpenMyStaff} />}
      {data.workMode && (
        <section className="space-y-2.5">
          <SectionTitle title="Fee by work mode" subtitle="Fixed monthly fee per staff member" />
          <div className="grid grid-cols-2 gap-3">
            {data.workMode.map((w) => {
              const office = w.mode === 'Work From Office';
              const Icon = office ? Building2 : House;
              return (
                <Card key={w.mode} className="p-4">
                  <span
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${office ? 'bg-[#EFF6FF] text-[#2F68FE]' : 'bg-[#E8F8F0] text-[#10B981]'}`}
                  >
                    <Icon className="w-5 h-5" />
                  </span>
                  <p className="mt-3 text-[11.5px] font-semibold text-slate-500">{w.mode}</p>
                  <p className="text-xl font-extrabold text-[#1E293B] tabular-nums leading-tight">{formatFee(w.monthlyFee)}</p>
                  <p className="text-[10.5px] text-slate-400">per staff / month</p>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {data.hourly && (
        <section className="space-y-2.5">
          <SectionTitle title="Fee by team size" subtitle="Fixed per hour, by no. of staff" />
          <Card className="overflow-hidden">
            <ul className="divide-y divide-slate-100">
              {data.hourly.map((h, i) => {
                const own = i === hourlyBracket;
                return (
                  <li key={h.bracket.id} className={`p-3.5 flex items-center gap-3 ${own ? 'bg-[#EFF6FF]' : ''}`}>
                    <span
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${own ? 'bg-white text-[#2F68FE]' : 'bg-slate-100 text-slate-500'}`}
                    >
                      <Clock3 className="w-5 h-5" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="flex items-center gap-1.5">
                        <span className="text-[13px] font-bold text-[#1E293B] tabular-nums">{h.bracket.label} staff</span>
                        {own && (
                          <span className="px-2 py-0.5 rounded-md bg-[#2F68FE] text-white text-[10px] font-bold whitespace-nowrap">Your team</span>
                        )}
                      </span>
                      <span className="block text-[11px] text-slate-500">
                        {h.bracket.max === null ? `Teams of ${h.bracket.min} or more staff` : `Teams of ${h.bracket.min} to ${h.bracket.max} staff`}
                      </span>
                    </span>
                    <span className="text-right shrink-0">
                      <span className="block text-[15px] font-extrabold text-[#1E293B] tabular-nums">{formatFee(h.hourlyFee, 2)}</span>
                      <span className="block text-[10px] text-slate-400">/ hour</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>
        </section>
      )}
    </div>
  );
};

/* -------------------------------- View --------------------------------- */

export const ClientMgmtFeeView: React.FC<Props> = ({ structure, teamSize, staffByLevel, companyName, onContactManager, onOpenMyStaff }) => {
  const [loading, setLoading] = useState(true);
  const [tableOpen, setTableOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), LOAD_MS);
    return () => clearTimeout(t);
  }, []);

  const mos = structure.mos;
  const other = structure.other && (structure.other.workMode || structure.other.hourly) ? structure.other : null;
  const teamBracket = useMemo(() => (mos ? bracketIndexFor(mos.brackets, teamSize) : 0), [mos, teamSize]);

  const empty = (
    <EmptyCard
      icon={Landmark}
      title="No Data Found"
      text="Your management fee structure hasn't been shared yet."
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

  return (
    <div className="relative flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
        <div className="px-4 pt-4">
          <p className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
            Human Resources <ChevronRight className="w-3 h-3" /> <span className="text-slate-600">Management Fee Structure</span>
          </p>
          <h1 className="mt-0.5 text-2xl font-extrabold leading-tight">Management Fee Structure</h1>
          <p className="mt-1 text-[11.5px] text-slate-500">
            {companyName} <span className="text-slate-300">·</span> All amounts in USD
          </p>
        </div>

        {loading ? (
          <PageSkeleton />
        ) : (
          <div className="px-4 mt-4 space-y-4 animate-in fade-in duration-200">
            {mos ? (
              <MosTab
                data={mos}
                teamSize={teamSize}
                staffByLevel={staffByLevel}
                onOpenMyStaff={onOpenMyStaff}
                onOpenTable={() => setTableOpen(true)}
              />
            ) : other ? (
              <OtherTab data={other} teamSize={teamSize} onOpenMyStaff={onOpenMyStaff} />
            ) : (
              empty
            )}
            {(mos || other) && <ContactCard onContact={onContactManager} />}
          </div>
        )}
      </div>

      {mos && <MgmtFeeTableSheet isOpen={tableOpen} structure={mos} teamBracket={teamBracket} onClose={() => setTableOpen(false)} />}
    </div>
  );
};
