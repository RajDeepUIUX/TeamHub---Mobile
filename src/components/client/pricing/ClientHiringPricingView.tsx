import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Award,
  Briefcase,
  Calculator,
  CalendarClock,
  Check,
  ClipboardCheck,
  Clock3,
  Info,
  Receipt,
  ShieldAlert,
  UserRoundPlus,
  UsersRound,
  Zap,
} from 'lucide-react';
import { ScreenHeader, Card, EmptyCard } from '../staff/tabs/StaffTabParts';
import { StaffSkeleton } from '../staff/ClientStaffParts';
import { isoOfDate } from '../data/clientInterviewsData';
import {
  CANCELLATION_POLICY,
  CATEGORY_INTRO,
  HIRING_MODELS,
  HIRING_MODEL_NOTES,
  HIRING_TENURE,
  HIRING_TERMS,
  HiringModel,
  PRICING_TABS,
  PricingCategory,
  PricingRow,
  currencyForCountry,
  pricingRowsFor,
} from '../data/clientHiringPricingData';
import { RequirementDraft, StaffRequirement, newRequirementDraft, requirementsFromDraft } from '../data/clientRequirementsData';
import { RequirementFormView } from '../requirements/RequirementFormView';
import { RequirementSavedSheet } from '../requirements/RequirementParts';

interface Props {
  /** Firm country (Company Profile); decides the currency and which rates apply */
  country: string;
  /** Present when the role can add a requirement: opens the desktop Add Requirement offcanvas on this page */
  onCreateRequirements?: (created: StaffRequirement[]) => void;
  /** Offshore locations preselected in a new requirement */
  defaultLocations?: string[];
  /** "View Available Resumes" after a requirement is saved (filtered to its profile) */
  onOpenHub?: (profile?: string) => void;
  /** Header back arrow (Dashboard) */
  onBack?: () => void;
}

const LOAD_MS = 500;
type RoleCategoryId = Exclude<PricingCategory, 'additional'>;

const TAB_ICON: Record<PricingCategory, React.ElementType> = {
  accounting: Calculator,
  tax: Receipt,
  audit: ClipboardCheck,
  'non-technical': UsersRound,
  specialized: Award,
  additional: Info,
};

const MODEL_ICON: Record<string, React.ElementType> = { full: Briefcase, part: Clock3, demand: Zap };
const modelIcon = (m: HiringModel) => MODEL_ICON[m.id] ?? Briefcase;

const MODEL_SPECS: { label: string; value: (m: HiringModel) => React.ReactNode }[] = [
  { label: 'Available Upto (Level)', value: (m) => m.availableUpto },
  { label: 'Minimum Weekly Billing', value: (m) => m.minWeeklyBilling },
  { label: 'Rate', value: (m) => <span className={m.rateAdjusted ? 'text-[#10B981]' : undefined}>{m.rate}</span> },
];

/** Consecutive rows of the same level, in table order */
const groupByLevel = (rows: PricingRow[]) =>
  rows.reduce<{ level: number; designation: string; rows: PricingRow[] }[]>((groups, r) => {
    const last = groups[groups.length - 1];
    if (last && last.level === r.level) last.rows.push(r);
    else groups.push({ level: r.level, designation: r.designation, rows: [r] });
    return groups;
  }, []);

/* --------------------------------- Shared --------------------------------- */

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="px-1 text-sm font-bold text-[#1E293B]">{children}</h2>
);

const RoleChips: React.FC<{ roles: string[]; tone?: 'slate' | 'blue' }> = ({ roles, tone = 'slate' }) => (
  <ul className="flex flex-wrap gap-1.5" aria-label="Roles">
    {roles.map((role) => (
      <li
        key={role}
        className={`px-2 py-1 rounded-md text-[11px] leading-snug ${
          tone === 'blue' ? 'bg-blue-50 text-[#2F68FE] font-semibold' : 'bg-white border border-slate-200 text-slate-600 font-medium'
        }`}
      >
        {role}
      </li>
    ))}
  </ul>
);

/** Intro text + role areas above the Non-technical / Specialized tables */
const CategoryIntro: React.FC<{ category: RoleCategoryId }> = ({ category }) => {
  const intro = CATEGORY_INTRO[category];
  if (!intro) return null;
  return (
    <Card className="p-4 space-y-3">
      <p className="text-xs text-slate-600 leading-relaxed">{intro.text}</p>
      <ul className="pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
        {intro.areas.map((a) => (
          <li key={a} className="inline-flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-[11px] font-semibold text-[#1E293B] leading-snug">
            <span className="w-4 h-4 rounded-full bg-[#2F68FE] text-white flex items-center justify-center shrink-0">
              <Check className="w-2.5 h-2.5" strokeWidth={3.5} />
            </span>
            {a}
          </li>
        ))}
      </ul>
    </Card>
  );
};

const TermsList: React.FC = () => (
  <ul className="space-y-3">
    {HIRING_TERMS.map((t) => (
      <li key={t} className="flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed">
        <span className="w-[18px] h-[18px] mt-px rounded-full bg-[#2F68FE] text-white flex items-center justify-center shrink-0">
          <Check className="w-3 h-3" strokeWidth={3} />
        </span>
        <span className="min-w-0">{t}</span>
      </li>
    ))}
  </ul>
);

const CancellationCard: React.FC = () => (
  <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-blue-50 border border-blue-100">
    <span className="w-9 h-9 rounded-xl bg-white border border-blue-100 text-[#2F68FE] flex items-center justify-center shrink-0">
      <ShieldAlert className="w-[18px] h-[18px]" />
    </span>
    <div className="min-w-0">
      <p className="text-[13px] font-bold text-[#1E293B]">Cancellation Policy with</p>
      <p className="mt-0.5 text-xs text-slate-600 leading-relaxed">{CANCELLATION_POLICY}</p>
    </div>
  </div>
);

const ModelNotes: React.FC = () => (
  <ul className="space-y-2.5">
    {HIRING_MODEL_NOTES.map((n) => (
      <li key={n.title} className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80">
        <Info className="w-4 h-4 text-[#2F68FE] shrink-0 mt-0.5" />
        <p className="text-xs text-slate-600 leading-relaxed">
          <b className="font-semibold text-[#1E293B]">{n.title}:</b> {n.text}
        </p>
      </li>
    ))}
  </ul>
);

/* --------------------------------- Pricing --------------------------------- */

/** Ticket card: muted stub on the left, content on the right (team-card radius and shadow) */
const TicketCard: React.FC<{ stub: React.ReactNode; children: React.ReactNode }> = ({ stub, children }) => (
  <section className="flex bg-white border border-[#EBF0F7] rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.03)] overflow-hidden">
    <div className="w-[68px] shrink-0 bg-slate-50 border-r border-slate-100 flex flex-col items-center justify-center gap-1 px-1 py-4 text-center">{stub}</div>
    <div className="flex-1 min-w-0 p-3.5">{children}</div>
  </section>
);

/** One ticket per level — Level stub, designation, each rate option as a blue price tag over its roles */
const LevelCards: React.FC<{ rows: PricingRow[] }> = ({ rows }) => (
  <ul className="space-y-3" aria-label="Pricing">
    {groupByLevel(rows).map((g) => (
      <li key={g.level}>
        <TicketCard
          stub={
            <>
              <span className="text-[10px] font-semibold text-slate-400">Level</span>
              <span className="text-lg font-extrabold text-[#2F68FE] tabular-nums leading-none">{g.level}</span>
            </>
          }
        >
          <p className="text-sm font-bold text-[#1E293B] leading-snug">{g.designation}</p>
          <ul className="mt-1 divide-y divide-slate-100">
            {g.rows.map((r) => (
              <li key={r.id} className="py-3 last:pb-0 space-y-2">
                <span className="inline-flex items-baseline gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-100">
                  <span className="text-[10px] font-semibold text-slate-500">Rate/Hr</span>
                  <span className="text-sm font-extrabold text-[#2F68FE] tabular-nums whitespace-nowrap">{r.rate}</span>
                </span>
                <RoleChips roles={r.roles} tone="blue" />
              </li>
            ))}
          </ul>
        </TicketCard>
      </li>
    ))}
  </ul>
);

const Additional: React.FC = () => (
  <div className="space-y-4">
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <span className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 text-[#2F68FE] flex items-center justify-center shrink-0">
          <Briefcase className="w-5 h-5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-bold text-[#1E293B] leading-snug">Hiring Models and Pricing</h2>
          <p className="mt-0.5 text-xs text-slate-500">{HIRING_MODELS.length} models available</p>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
        <span className="flex items-center gap-1.5 font-medium text-slate-500">
          <CalendarClock className="w-4 h-4 text-slate-400" /> Hiring Tenure
        </span>
        <span className="font-bold text-[#2F68FE] whitespace-nowrap">{HIRING_TENURE}</span>
      </div>
    </Card>

    <ul className="space-y-3" aria-label="Hiring Model">
      {HIRING_MODELS.map((m) => {
        const Icon = modelIcon(m);
        return (
          <li key={m.id}>
            <TicketCard
              stub={
                <span className="w-10 h-10 rounded-xl bg-white border border-blue-100 text-[#2F68FE] flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </span>
              }
            >
              <p className="text-[11px] font-medium text-slate-400">Hiring Model</p>
              <p className="text-sm font-bold text-[#1E293B]">{m.name}</p>
              <dl className="mt-2 divide-y divide-slate-100">
                {MODEL_SPECS.map((sp) => (
                  <div key={sp.label} className="flex items-center justify-between gap-3 py-2 last:pb-0">
                    <dt className="text-[11px] font-medium text-slate-500">{sp.label}</dt>
                    <dd className="text-xs font-semibold text-[#1E293B] tabular-nums text-right">{sp.value(m)}</dd>
                  </div>
                ))}
              </dl>
            </TicketCard>
          </li>
        );
      })}
    </ul>

    <ModelNotes />

    <Card className="p-4">
      <TermsList />
    </Card>
    <CancellationCard />
  </div>
);

/* ---------------------------------- Skeletons ---------------------------------- */

const Skeleton: React.FC = () => (
  <div className="space-y-3" aria-busy="true" aria-label="Loading pricing">
    {[0, 1, 2].map((i) => (
      <div key={i} className="flex bg-white border border-[#EBF0F7] rounded-[20px] overflow-hidden">
        <div className="w-[68px] shrink-0 bg-slate-50 border-r border-slate-100 flex flex-col items-center justify-center gap-1.5 py-4">
          <StaffSkeleton className="w-8 h-2.5" />
          <StaffSkeleton className="w-5 h-5" />
        </div>
        <div className="flex-1 p-3.5 space-y-2.5">
          <StaffSkeleton className="w-28 h-3.5" />
          <StaffSkeleton className="w-24 h-7 rounded-lg" />
          <div className="flex flex-wrap gap-1.5">
            <StaffSkeleton className="w-20 h-6" />
            <StaffSkeleton className="w-24 h-6" />
            <StaffSkeleton className="w-16 h-6" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

/* ---------------------------------- View ---------------------------------- */

/**
 * Hire New Staff › Pricing & Hiring (desktop `hiringpricing`): read-only rate tables per role category, hiring models and terms.
 * Rates follow the firm's country (currency comes from Company Profile). "Add Requirement" opens the requirement form on this page.
 * Underline icon tabs + ticket cards (Level / model-icon stub on the left, rate as a blue price tag); Additional tab as model tickets.
 */
export const ClientHiringPricingView: React.FC<Props> = ({ country, onCreateRequirements, defaultLocations = [], onOpenHub, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<PricingCategory>('accounting');
  const [formOpen, setFormOpen] = useState(false);
  const [saved, setSaved] = useState<{ count: number; profile: string } | null>(null);
  const tabRefs = useRef<Partial<Record<PricingCategory, HTMLButtonElement | null>>>({});

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), LOAD_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    tabRefs.current[tab]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [tab]);

  const currency = currencyForCountry(country);
  const rows = useMemo(() => (tab === 'additional' ? [] : pricingRowsFor(tab, currency)), [tab, currency]);

  const submit = (draft: RequirementDraft) => {
    const created = requirementsFromDraft(draft, isoOfDate(new Date()));
    onCreateRequirements?.(created);
    setFormOpen(false);
    setSaved({ count: created.length, profile: draft.profile });
  };

  if (formOpen) {
    return <RequirementFormView editing={null} initial={newRequirementDraft(defaultLocations)} onBack={() => setFormOpen(false)} onSubmit={submit} />;
  }

  /** Manager My Profile underline icon tabs, scroll sideways */
  const renderTabs = () => (
    <div
      className="flex gap-1 px-2 overflow-x-auto no-scrollbar"
      role="tablist"
      aria-label="Pricing category"
    >
      {PRICING_TABS.map((t) => {
        const Icon = TAB_ICON[t.id];
        const on = t.id === tab;
        return (
          <button
            key={t.id}
            ref={(el) => {
              tabRefs.current[t.id] = el;
            }}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => setTab(t.id)}
            className={`relative h-12 px-3 flex items-center gap-1.5 text-[13px] font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#2F68FE] ${
              on ? 'text-[#2F68FE]' : 'text-slate-500 active:text-[#1E293B]'
            }`}
          >
            <Icon className="w-4 h-4" />
            {t.label}
            <span
              className={`absolute left-2 right-2 bottom-0 h-[3px] rounded-t-full bg-[#2F68FE] transition-opacity duration-200 ${on ? 'opacity-100' : 'opacity-0'}`}
            />
          </button>
        );
      })}
    </div>
  );

  const renderPanel = () => {
    if (tab === 'additional') return <Additional />;
    if (rows.length === 0) return <EmptyCard icon={Info} title="No Data Found" text="Pricing for this category isn't available yet." />;
    const hasIntro = Boolean(CATEGORY_INTRO[tab]);
    return (
      <div className="space-y-4">
        {hasIntro && <CategoryIntro category={tab} />}
        {hasIntro && <SectionLabel>Pricing</SectionLabel>}
        <LevelCards rows={rows} />
      </div>
    );
  };

  return (
    <div className="relative flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      <ScreenHeader title="Pricing & Hiring" onBack={onBack} />
      <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
        <nav className="sticky top-0 z-10 bg-white border-b border-[#EBF0F7]" aria-label="Pricing category">
          {renderTabs()}
        </nav>

        <div className="px-4 pt-4">
          {loading ? (
            <Skeleton />
          ) : (
            <div key={tab} role="tabpanel" className="animate-in fade-in duration-200">
              {renderPanel()}
            </div>
          )}
        </div>
      </div>

      {onCreateRequirements && (
        <div className="p-4 bg-white/95 backdrop-blur-md border-t border-[#EBF0F7] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] shrink-0 z-20">
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="w-full h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs active:bg-[#1D4ED8] transition-colors cursor-pointer"
          >
            <UserRoundPlus className="w-4 h-4" /> Add Requirement
          </button>
        </div>
      )}

      <RequirementSavedSheet
        isOpen={Boolean(saved)}
        mode="create"
        count={saved?.count ?? 1}
        profile={saved?.profile ?? ''}
        onDone={() => setSaved(null)}
        onViewResumes={
          onOpenHub
            ? () => {
                setSaved(null);
                onOpenHub(saved?.profile);
              }
            : undefined
        }
      />
    </div>
  );
};
