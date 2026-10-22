import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Award,
  BadgeCheck,
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
import { ScreenHeader, Card, DesignVersion, EmptyCard } from '../staff/tabs/StaffTabParts';
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
const DESIGN_VERSIONS = ['V1', 'V2'] as const;
type RoleCategoryId = Exclude<PricingCategory, 'additional'>;

const TAB_ICON: Record<PricingCategory, React.ElementType> = {
  accounting: Calculator,
  tax: Receipt,
  audit: ClipboardCheck,
  'non-technical': UsersRound,
  specialized: Award,
  additional: Info,
};

const MODEL_STYLE: Record<string, { icon: React.ElementType; tile: string; text: string; bar: string }> = {
  full: { icon: Briefcase, tile: 'bg-[#EFF6FF]', text: 'text-[#2F68FE]', bar: 'bg-[#2F68FE]' },
  part: { icon: Clock3, tile: 'bg-[#EFF6FF]', text: 'text-[#2F68FE]', bar: 'bg-[#2F68FE]' },
  demand: { icon: Zap, tile: 'bg-[#EFF6FF]', text: 'text-[#2F68FE]', bar: 'bg-[#2F68FE]' },
};
const modelStyle = (m: HiringModel) => MODEL_STYLE[m.id] ?? MODEL_STYLE.full;

const MODEL_SPECS: { label: string; value: (m: HiringModel) => React.ReactNode }[] = [
  { label: 'Available Upto (Level)', value: (m) => m.availableUpto },
  { label: 'Minimum Weekly Billing', value: (m) => m.minWeeklyBilling },
  { label: 'Rate', value: (m) => <span className={m.rateAdjusted ? 'text-[#16A34A]' : undefined}>{m.rate}</span> },
];

/* --------------------------------- Shared --------------------------------- */

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="px-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">{children}</h2>
);

const RoleChips: React.FC<{ roles: string[]; tone?: 'slate' | 'blue' }> = ({ roles, tone = 'slate' }) => (
  <ul className="flex flex-wrap gap-1.5" aria-label="Roles">
    {roles.map((role) => (
      <li
        key={role}
        className={`px-2.5 py-1 rounded-lg text-[11.5px] font-medium leading-snug ${
          tone === 'blue' ? 'bg-[#EFF6FF] text-[#1E3A8A]' : 'bg-slate-50 border border-slate-200/80 text-slate-600'
        }`}
      >
        {role}
      </li>
    ))}
  </ul>
);

/** Intro text + role areas above the Non-technical / Specialized tables */
const CategoryIntro: React.FC<{ category: RoleCategoryId; variant: DesignVersion }> = ({ category, variant }) => {
  const intro = CATEGORY_INTRO[category];
  if (!intro) return null;
  if (variant === 'V2') {
    return (
      <Card className="overflow-hidden">
        <div className="px-4 py-3.5 bg-gradient-to-br from-[#EFF6FF] to-white border-b border-slate-100">
          <p className="text-[12.5px] text-slate-600 leading-relaxed">{intro.text}</p>
        </div>
        <ul className="px-4 py-3.5 grid grid-cols-2 gap-x-3 gap-y-2.5">
          {intro.areas.map((a) => (
            <li key={a} className="flex items-start gap-2 text-[12px] font-medium text-[#1E293B] leading-snug">
              <BadgeCheck className="w-4 h-4 mt-px text-[#2F68FE] shrink-0" aria-hidden="true" />
              <span className="min-w-0">{a}</span>
            </li>
          ))}
        </ul>
      </Card>
    );
  }
  return (
    <Card className="p-4">
      <p className="text-[12.5px] text-slate-600 leading-relaxed">{intro.text}</p>
      <ul className="mt-3 flex flex-wrap gap-1.5">
        {intro.areas.map((a) => (
          <li key={a} className="inline-flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full bg-[#EFF6FF] border border-[#DBEAFE] text-[11.5px] font-medium text-[#1E293B] leading-snug">
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

const TermsList: React.FC<{ numbered?: boolean }> = ({ numbered }) => {
  const marker = (i: number) =>
    numbered ? (
      <span className="w-6 h-6 rounded-lg bg-[#EFF6FF] text-[#2F68FE] text-[11px] font-bold tabular-nums flex items-center justify-center shrink-0">{i + 1}</span>
    ) : (
      <span className="w-[18px] h-[18px] mt-px rounded-full bg-[#EFF6FF] text-[#2F68FE] flex items-center justify-center shrink-0">
        <Check className="w-3 h-3" strokeWidth={3} />
      </span>
    );
  return (
    <ul className={numbered ? 'divide-y divide-slate-100' : 'space-y-3'}>
      {HIRING_TERMS.map((t, i) => (
        <li key={t} className={`flex items-start gap-2.5 text-[12.5px] text-slate-600 leading-relaxed ${numbered ? 'py-2.5 first:pt-0 last:pb-0' : ''}`}>
          {marker(i)}
          <span className="min-w-0">{t}</span>
        </li>
      ))}
    </ul>
  );
};

const CancellationCard: React.FC = () => (
  <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#EFF6FF] border border-[#DBEAFE]">
    <span className="w-9 h-9 rounded-xl bg-white text-[#2F68FE] flex items-center justify-center shrink-0">
      <ShieldAlert className="w-[18px] h-[18px]" />
    </span>
    <div className="min-w-0">
      <p className="text-[13px] font-bold text-[#1E293B]">Cancellation Policy with</p>
      <p className="mt-0.5 text-[12px] text-slate-600 leading-relaxed">{CANCELLATION_POLICY}</p>
    </div>
  </div>
);

const ModelNotes: React.FC = () => (
  <ul className="space-y-2.5">
    {HIRING_MODEL_NOTES.map((n) => (
      <li key={n.title} className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-[#EFF6FF] border border-[#DBEAFE]">
        <Info className="w-4 h-4 text-[#2F68FE] shrink-0 mt-0.5" />
        <p className="text-[12px] text-slate-600 leading-relaxed">
          <b className="font-semibold text-[#1E293B]">{n.title}:</b> {n.text}
        </p>
      </li>
    ))}
  </ul>
);

/* ----------------------------------- V1 ----------------------------------- */

/** V1: one rate card per row — level medallion, designation, big rate, roles */
const RateCardsV1: React.FC<{ rows: PricingRow[] }> = ({ rows }) => (
  <ul className="space-y-3" aria-label="Pricing">
    {rows.map((r) => (
      <li key={r.id}>
        <Card className="p-3.5">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-2xl bg-[#EFF6FF] text-[#2F68FE] flex flex-col items-center justify-center shrink-0 leading-none">
              <span className="text-[10px] font-bold uppercase tracking-wide opacity-70">Level</span>
              <span className="mt-0.5 text-[16px] font-extrabold tabular-nums">{r.level}</span>
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-slate-400">Designation</p>
              <p className="text-[14px] font-bold text-[#1E293B] leading-snug">{r.designation}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[11px] font-medium text-slate-400">Rate/Hr</p>
              <p className="text-[15px] font-extrabold text-[#2F68FE] tabular-nums whitespace-nowrap">{r.rate}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-dashed border-slate-200">
            <p className="mb-2 text-[11px] font-semibold text-slate-400">Roles</p>
            <RoleChips roles={r.roles} />
          </div>
        </Card>
      </li>
    ))}
  </ul>
);

const AdditionalV1: React.FC = () => (
  <div className="space-y-4">
    <Card className="p-3.5 flex items-center gap-3">
      <span className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2F68FE] flex items-center justify-center shrink-0">
        <Briefcase className="w-5 h-5" />
      </span>
      <div className="flex-1 min-w-0">
        <h2 className="text-[14px] font-bold text-[#1E293B] leading-snug">Hiring Models and Pricing</h2>
        <p className="mt-0.5 text-[11.5px] text-slate-500">{HIRING_MODELS.length} models available</p>
      </div>
      <div className="pl-3 border-l border-slate-100 text-right shrink-0">
        <p className="flex items-center justify-end gap-1 text-[10.5px] font-medium text-slate-400">
          <CalendarClock className="w-3 h-3" /> Hiring Tenure
        </p>
        <p className="mt-0.5 text-[12.5px] font-bold text-[#2F68FE] whitespace-nowrap">{HIRING_TENURE}</p>
      </div>
    </Card>

    <ul className="space-y-3" aria-label="Hiring Model">
      {HIRING_MODELS.map((m) => {
        const s = modelStyle(m);
        const Icon = s.icon;
        return (
          <li key={m.id}>
            <Card className="p-3.5">
              <div className="flex items-center gap-3">
                <span className={`w-10 h-10 rounded-xl ${s.tile} ${s.text} flex items-center justify-center shrink-0`}>
                  <Icon className="w-5 h-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-slate-400">Hiring Model</p>
                  <p className="text-[14px] font-bold text-[#1E293B]">{m.name}</p>
                </div>
              </div>
              <dl className="mt-3 grid grid-cols-3 gap-2">
                {MODEL_SPECS.map((sp) => (
                  <div key={sp.label} className="rounded-xl bg-slate-50 px-2.5 py-2">
                    <dt className="text-[10.5px] text-slate-500 leading-tight">{sp.label}</dt>
                    <dd className="mt-1 text-[12.5px] font-bold text-[#1E293B] leading-snug">{sp.value(m)}</dd>
                  </div>
                ))}
              </dl>
            </Card>
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

/* ----------------------------------- V2 ----------------------------------- */

/** V2: level ladder — rows hang off a vertical rail, rate shown as a blue tag */
const LadderV2: React.FC<{ rows: PricingRow[] }> = ({ rows }) => (
  <ol className="relative" aria-label="Pricing">
    <span className="absolute left-[17px] top-3 bottom-3 w-0.5 bg-gradient-to-b from-[#2F68FE]/40 via-[#DCE3ED] to-[#DCE3ED]" aria-hidden="true" />
    {rows.map((r, i) => {
      const firstOfLevel = i === 0 || rows[i - 1].level !== r.level;
      return (
        <li key={r.id} className={`relative flex gap-3 ${firstOfLevel && i > 0 ? 'mt-4' : 'mt-2.5'} first:mt-0`}>
          <span className="w-9 shrink-0 flex justify-center pt-3.5">
            {firstOfLevel ? (
              <span className="relative z-[1] w-9 h-9 rounded-full bg-[#2F68FE] text-white text-[13px] font-extrabold tabular-nums flex items-center justify-center ring-4 ring-[#F8FAFC] shadow-[0_6px_14px_-6px_rgba(47,104,254,0.7)]">
                L{r.level}
              </span>
            ) : (
              <span className="relative z-[1] mt-3 w-2.5 h-2.5 rounded-full bg-white border-2 border-[#2F68FE] ring-4 ring-[#F8FAFC]" aria-hidden="true" />
            )}
          </span>
          <Card className="flex-1 min-w-0 overflow-hidden">
            <div className="flex items-start justify-between gap-2 px-3.5 pt-3 pb-2.5">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-slate-400">Level {r.level}</p>
                <p className="text-[14px] font-bold text-[#1E293B] leading-snug">{r.designation}</p>
              </div>
              <span className="shrink-0 rounded-xl bg-[#EFF6FF] px-2.5 py-1.5 text-right">
                <span className="block text-[10px] font-bold uppercase tracking-wide text-[#2F68FE]/70">Rate/Hr</span>
                <span className="block text-[14px] font-extrabold text-[#2F68FE] tabular-nums whitespace-nowrap">{r.rate}</span>
              </span>
            </div>
            <div className="px-3.5 pb-3.5">
              <RoleChips roles={r.roles} tone="blue" />
            </div>
          </Card>
        </li>
      );
    })}
  </ol>
);

const AdditionalV2: React.FC = () => (
  <div className="space-y-4">
    <Card className="overflow-hidden">
      <div className="relative px-4 py-4 bg-[#2F68FE] text-white overflow-hidden">
        <CalendarClock className="absolute -right-3 -bottom-4 w-20 h-20 opacity-[0.12]" aria-hidden="true" />
        <p className="relative text-[11px] font-semibold uppercase tracking-wide text-white/70">Hiring Models and Pricing</p>
        <p className="relative mt-1 text-[12px] text-white/80">
          Hiring Tenure · <b className="font-bold text-white">{HIRING_TENURE}</b>
        </p>
      </div>
      <div role="table" aria-label="Hiring Model" className="divide-y divide-slate-100">
        <div role="row" className="grid grid-cols-[1fr_repeat(3,64px)] items-end gap-2 px-4 py-2 bg-slate-50 text-[10px] font-semibold leading-tight text-slate-500">
          <span role="columnheader">Hiring Model</span>
          {MODEL_SPECS.map((sp) => (
            <span key={sp.label} role="columnheader" className="text-center">
              {sp.label}
            </span>
          ))}
        </div>
        {HIRING_MODELS.map((m) => {
          const s = modelStyle(m);
          return (
            <div key={m.id} role="row" className="relative grid grid-cols-[1fr_repeat(3,64px)] items-center gap-2 px-4 py-3">
              <span className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${s.bar}`} aria-hidden="true" />
              <span role="cell" className="text-[13px] font-bold text-[#1E293B] leading-snug">
                {m.name}
              </span>
              {MODEL_SPECS.map((sp) => (
                <span key={sp.label} role="cell" aria-label={sp.label} className="text-center text-[11.5px] font-semibold text-[#1E293B] leading-snug">
                  {sp.value(m)}
                </span>
              ))}
            </div>
          );
        })}
      </div>
    </Card>

    <ModelNotes />

    <SectionLabel>Terms</SectionLabel>
    <Card className="p-4">
      <TermsList numbered />
    </Card>
    <CancellationCard />
  </div>
);

/* ---------------------------------- Skeletons ---------------------------------- */

const SkeletonV1: React.FC = () => (
  <div className="space-y-3" aria-busy="true" aria-label="Loading pricing">
    {[0, 1, 2, 3].map((i) => (
      <div key={i} className="bg-white border border-[#DCE3ED] rounded-2xl p-3.5">
        <div className="flex items-center gap-3">
          <StaffSkeleton className="w-11 h-11 rounded-2xl" />
          <div className="flex-1 space-y-1.5">
            <StaffSkeleton className="w-16 h-3" />
            <StaffSkeleton className="w-28 h-3.5" />
          </div>
          <StaffSkeleton className="w-14 h-5" />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <StaffSkeleton className="w-20 h-6" />
          <StaffSkeleton className="w-24 h-6" />
          <StaffSkeleton className="w-16 h-6" />
        </div>
      </div>
    ))}
  </div>
);

const SkeletonV2: React.FC = () => (
  <div className="space-y-2.5" aria-busy="true" aria-label="Loading pricing">
    {[0, 1, 2, 3].map((i) => (
      <div key={i} className="flex gap-3">
        <StaffSkeleton className="w-9 h-9 rounded-full mt-3 shrink-0" />
        <div className="flex-1 bg-white border border-[#DCE3ED] rounded-2xl p-3.5 space-y-2.5">
          <div className="flex justify-between">
            <StaffSkeleton className="w-28 h-3.5" />
            <StaffSkeleton className="w-14 h-8 rounded-xl" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <StaffSkeleton className="w-20 h-6" />
            <StaffSkeleton className="w-24 h-6" />
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
 * V1: Manager My Profile underline icon tabs + one rate card per row. V2: soft-tint chip tabs + level ladder; Additional tab as a model comparison table.
 */
export const ClientHiringPricingView: React.FC<Props> = ({ country, onCreateRequirements, defaultLocations = [], onOpenHub, onBack }) => {
  const [version, setVersion] = useState<DesignVersion>('V1');
  const v2 = version === 'V2';
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
  }, [tab, v2]);

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

  /** V1: Manager My Profile underline icon tabs. V2: soft-tint chips — active chip tinted blue with a filled icon badge */
  const renderTabs = () => (
    <div className={`flex overflow-x-auto no-scrollbar ${v2 ? 'gap-2 px-4 py-2.5' : 'gap-1 px-2'}`} role="tablist" aria-label="Pricing category">
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
            className={
              v2
                ? `shrink-0 h-10 pl-1 pr-3.5 rounded-full border flex items-center gap-2 text-[12.5px] font-semibold whitespace-nowrap transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE] ${
                    on ? 'bg-[#EFF6FF] border-[#BFD3FF] text-[#2F68FE]' : 'bg-white border-[#E6ECF5] text-slate-600 active:bg-slate-50'
                  }`
                : `relative h-12 px-3 flex items-center gap-1.5 text-[13px] font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#2F68FE] ${
                    on ? 'text-[#2F68FE]' : 'text-slate-500 active:text-[#1E293B]'
                  }`
            }
          >
            {v2 ? (
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  on ? 'bg-[#2F68FE] text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                <Icon className="w-4 h-4" />
              </span>
            ) : (
              <Icon className="w-4 h-4" />
            )}
            {t.label}
            {!v2 && (
              <span
                className={`absolute left-2 right-2 bottom-0 h-[3px] rounded-t-full bg-[#2F68FE] transition-opacity duration-200 ${on ? 'opacity-100' : 'opacity-0'}`}
              />
            )}
          </button>
        );
      })}
    </div>
  );

  const renderPanel = () => {
    if (tab === 'additional') return v2 ? <AdditionalV2 /> : <AdditionalV1 />;
    if (rows.length === 0) return <EmptyCard icon={Info} title="No Data Found" text="Pricing for this category isn't available yet." />;
    const hasIntro = Boolean(CATEGORY_INTRO[tab]);
    return (
      <div className="space-y-4">
        {hasIntro && <CategoryIntro category={tab} variant={version} />}
        {hasIntro && <SectionLabel>Pricing</SectionLabel>}
        {v2 ? <LadderV2 rows={rows} /> : <RateCardsV1 rows={rows} />}
      </div>
    );
  };

  return (
    <div className="relative flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      <ScreenHeader title="Pricing & Hiring" onBack={onBack} version={{ versions: DESIGN_VERSIONS, value: version, onChange: setVersion }} />
      <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
        <nav className="sticky top-0 z-10 bg-[#F8FAFC]/95 backdrop-blur-md border-b border-slate-200/80" aria-label="Pricing category">
          {renderTabs()}
        </nav>

        <div className="px-4 mt-4">
          {loading ? (
            v2 ? <SkeletonV2 /> : <SkeletonV1 />
          ) : (
            <div key={`${version}-${tab}`} role="tabpanel" className="animate-in fade-in duration-200">
              {renderPanel()}
            </div>
          )}
        </div>
      </div>

      {onCreateRequirements && (
        <div className="px-4 py-3 bg-white border-t border-[#EBF0F7] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] shrink-0">
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="w-full h-12 rounded-xl bg-[#2F68FE] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-[0_6px_16px_-6px_rgba(47,104,254,0.6)] active:bg-[#1F56E6] cursor-pointer"
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
