import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Info, UserRoundPlus } from 'lucide-react';
import { ScreenHeader, EmptyCard } from '../staff/tabs/StaffTabParts';
import { StaffSkeleton } from '../staff/ClientStaffParts';
import { isoOfDate } from '../data/clientInterviewsData';
import {
  CANCELLATION_POLICY,
  CATEGORY_INTRO,
  HIRING_MODELS,
  HIRING_MODEL_NOTES,
  HIRING_TENURE,
  HIRING_TERMS,
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

const PageSkeleton: React.FC = () => (
  <div className="px-4 mt-4" aria-busy="true" aria-label="Loading pricing">
    <div className="bg-white border border-[#EAECF0] rounded-lg overflow-hidden">
      <StaffSkeleton className="w-full h-10 rounded-none" />
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="p-3.5 space-y-3 border-t border-[#EAECF0]">
          <div className="grid grid-cols-3 gap-3">
            <StaffSkeleton className="w-14 h-3.5" />
            <StaffSkeleton className="w-20 h-3.5" />
            <StaffSkeleton className="w-12 h-3.5" />
          </div>
          <div className="flex flex-wrap gap-2">
            <StaffSkeleton className="w-20 h-7" />
            <StaffSkeleton className="w-28 h-7" />
            <StaffSkeleton className="w-24 h-7" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const SectionHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => <h2 className="text-[15px] font-semibold text-[#101828]">{children}</h2>;

const CheckItem: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <li className="flex items-start gap-2.5 text-[12.5px] text-[#344054] leading-relaxed">
    <span className="w-[18px] h-[18px] mt-px rounded-full bg-[#ECFDF3] text-[#039855] flex items-center justify-center shrink-0">
      <Check className="w-3 h-3" strokeWidth={3} />
    </span>
    <span className="min-w-0">{children}</span>
  </li>
);

/** Desktop pricing table (Level · Designation · Rate/Hr · Roles); roles wrap under each row on mobile */
const PricingTable: React.FC<{ rows: PricingRow[] }> = ({ rows }) => (
  <div className="bg-white border border-[#EAECF0] rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(16,24,40,0.05)]" role="table" aria-label="Pricing">
    <div
      role="row"
      className="grid grid-cols-[76px_1fr_auto] items-center gap-3 px-4 py-2.5 bg-[#F4F3FF] border-b border-[#E4E2FB] text-[11px] font-semibold text-[#5B5FE9]"
    >
      <span role="columnheader">Level</span>
      <span role="columnheader">Designation</span>
      <span role="columnheader" className="text-right">
        Rate/Hr
      </span>
    </div>
    {rows.map((r) => (
      <div key={r.id} role="row" className="px-4 py-3.5 border-b border-[#EAECF0] last:border-b-0">
        <div className="grid grid-cols-[76px_1fr_auto] items-center gap-3">
          <span role="cell">
            <span className="inline-flex items-center h-6 px-2 rounded-md bg-[#EEF0FF] text-[11.5px] font-semibold text-[#4F46E5] whitespace-nowrap">Level {r.level}</span>
          </span>
          <span role="cell" className="min-w-0 text-[13.5px] font-semibold text-[#101828] leading-snug">
            {r.designation}
          </span>
          <span role="cell" className="text-right text-[15px] font-bold text-[#101828] tabular-nums whitespace-nowrap">
            {r.rate}
          </span>
        </div>
        <div role="cell" className="mt-3 rounded-lg bg-[#F9FAFB] border border-[#F2F4F7] p-2.5" aria-label="Roles">
          <span className="block mb-2 text-[11px] font-semibold text-[#98A2B3]">Roles</span>
          <div className="flex flex-wrap gap-1.5">
            {r.roles.map((role) => (
              <span key={role} className="px-2.5 h-[26px] rounded-md bg-white border border-[#E4E7EC] text-[11.5px] font-medium text-[#344054] flex items-center">
                {role}
              </span>
            ))}
          </div>
        </div>
      </div>
    ))}
  </div>
);

const RoleCategory: React.FC<{ category: Exclude<PricingCategory, 'additional'>; rows: PricingRow[] }> = ({ category, rows }) => {
  const intro = CATEGORY_INTRO[category];
  if (!intro) return <PricingTable rows={rows} />;
  return (
    <div className="space-y-4">
      <section className="bg-white border border-[#EAECF0] rounded-xl p-4 shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
        <p className="text-[12.5px] text-[#475467] leading-relaxed">{intro.text}</p>
        <ul className="mt-3.5 pt-3.5 border-t border-dashed border-[#EAECF0] flex flex-wrap gap-2">
          {intro.areas.map((a) => (
            <li key={a} className="inline-flex items-center gap-1.5 min-h-[30px] pl-2 pr-2.5 py-1 rounded-full bg-[#F4F3FF] border border-[#E4E2FB] text-[11.5px] font-medium text-[#344054] leading-snug">
              <span className="w-4 h-4 rounded-full bg-[#5B5FE9] text-white flex items-center justify-center shrink-0">
                <Check className="w-2.5 h-2.5" strokeWidth={3.5} />
              </span>
              {a}
            </li>
          ))}
        </ul>
      </section>
      <SectionHeading>Pricing</SectionHeading>
      <PricingTable rows={rows} />
    </div>
  );
};

/** Desktop "Hiring Models and Pricing" table (one card per model on mobile), notes and terms check-list */
const MODEL_ACCENT: Record<string, string> = { full: 'bg-[#3A58EF]', part: 'bg-[#039855]', demand: 'bg-[#7C3AED]' };

const AdditionalInfo: React.FC = () => {
  const specs: { label: string; value: (m: (typeof HIRING_MODELS)[number]) => React.ReactNode }[] = [
    { label: 'Available Upto (Level)', value: (m) => m.availableUpto },
    { label: 'Minimum Weekly Billing', value: (m) => m.minWeeklyBilling },
    { label: 'Rate', value: (m) => <span className={m.rateAdjusted ? 'text-[#039855]' : undefined}>{m.rate}</span> },
  ];
  return (
    <div className="space-y-4">
      <SectionHeading>Hiring Models and Pricing</SectionHeading>

      <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-[#F4F3FF] border border-[#E4E2FB]">
        <span className="text-[12px] font-semibold text-[#5B5FE9]">Hiring Tenure</span>
        <span className="text-[13px] font-semibold text-[#101828]">{HIRING_TENURE}</span>
      </div>

      <ul className="space-y-3" aria-label="Hiring Model">
        {HIRING_MODELS.map((m) => (
          <li key={m.id} className="relative bg-white border border-[#EAECF0] rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
            <span className={`absolute left-0 top-0 bottom-0 w-1 ${MODEL_ACCENT[m.id] ?? 'bg-[#3A58EF]'}`} aria-hidden="true" />
            <div className="pl-4 pr-3.5 pt-3 pb-2.5 border-b border-[#F2F4F7]">
              <span className="block text-[10.5px] font-medium text-[#98A2B3]">Hiring Model</span>
              <span className="block text-[14px] font-semibold text-[#101828]">{m.name}</span>
            </div>
            <dl className="grid grid-cols-3 divide-x divide-[#F2F4F7]">
              {specs.map((sp) => (
                <div key={sp.label} className="px-3 py-2.5 first:pl-4">
                  <dt className="text-[10.5px] text-[#667085] leading-tight">{sp.label}</dt>
                  <dd className="mt-1 text-[12.5px] font-semibold text-[#101828] leading-snug">{sp.value(m)}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>

      <ul className="space-y-2.5">
        {HIRING_MODEL_NOTES.map((n) => (
          <li key={n.title} className="flex items-start gap-2.5 p-3 rounded-xl bg-[#EFF4FF] border border-[#D1E0FF]">
            <Info className="w-4 h-4 text-[#3A58EF] shrink-0 mt-0.5" />
            <p className="text-[12px] text-[#344054] leading-relaxed">
              <b className="font-semibold text-[#101828]">{n.title}:</b> {n.text}
            </p>
          </li>
        ))}
      </ul>

      <div className="bg-white border border-[#EAECF0] rounded-xl p-4 shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
        <ul className="space-y-3">
          {HIRING_TERMS.map((t) => (
            <CheckItem key={t}>{t}</CheckItem>
          ))}
          <CheckItem>
            Cancellation Policy with
            <ul className="mt-1.5 pl-4 list-disc marker:text-[#98A2B3]">
              <li>{CANCELLATION_POLICY}</li>
            </ul>
          </CheckItem>
        </ul>
      </div>
    </div>
  );
};

/* ---------------------------------- View ---------------------------------- */

/**
 * Hire New Staff › Pricing & Hiring (desktop `hiringpricing`): read-only rate tables per role category, hiring models and terms.
 * Rates follow the firm's country (currency comes from Company Profile). "Add Requirement" opens the requirement form on this page.
 */
export const ClientHiringPricingView: React.FC<Props> = ({ country, onCreateRequirements, defaultLocations = [], onOpenHub, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<PricingCategory>('accounting');
  const [formOpen, setFormOpen] = useState(false);
  const [saved, setSaved] = useState<{ count: number; profile: string } | null>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), LOAD_MS);
    return () => clearTimeout(t);
  }, []);

  const [fades, setFades] = useState({ left: false, right: true });
  const syncFades = () => {
    const el = tabsRef.current;
    if (!el) return;
    setFades({ left: el.scrollLeft > 4, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
  };

  useEffect(() => {
    const strip = tabsRef.current;
    const chip = strip?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (strip && chip) strip.scrollTo({ left: chip.offsetLeft - (strip.clientWidth - chip.offsetWidth) / 2, behavior: 'smooth' });
  }, [tab]);

  useEffect(() => {
    syncFades();
  }, [loading]);

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

  return (
    <div className="relative flex-1 flex flex-col bg-white text-[#101828] overflow-hidden select-none">
      <ScreenHeader title="Pricing & Hiring" onBack={onBack} />
      <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-[#EAECF0]">
          <div
            ref={tabsRef}
            role="tablist"
            aria-label="Pricing category"
            onScroll={syncFades}
            className="flex gap-1.5 overflow-x-auto no-scrollbar px-4 py-2.5 scroll-px-4"
          >
            {PRICING_TABS.map((t) => {
              const active = t.id === tab;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(t.id)}
                  className={`shrink-0 h-9 px-3.5 rounded-full border text-[12.5px] font-semibold whitespace-nowrap flex items-center transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE] ${
                    active
                      ? 'bg-[#2F68FE] border-[#2F68FE] text-white shadow-[0_6px_14px_-6px_rgba(47,104,254,0.65)]'
                      : 'bg-white border-[#E4E7EC] text-[#475467] active:bg-[#EFF6FF] active:text-[#2F68FE]'
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-white to-transparent transition-opacity ${fades.left ? 'opacity-100' : 'opacity-0'}`}
          />
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent transition-opacity ${fades.right ? 'opacity-100' : 'opacity-0'}`}
          />
        </div>

        {loading ? (
          <PageSkeleton />
        ) : (
          <div key={tab} role="tabpanel" className="px-4 mt-4 animate-in fade-in duration-200">
            {tab === 'additional' ? (
              <AdditionalInfo />
            ) : rows.length > 0 ? (
              <RoleCategory category={tab} rows={rows} />
            ) : (
              <EmptyCard icon={Info} title="No Data Found" text="Pricing for this category isn't available yet." />
            )}
          </div>
        )}
      </div>

      {onCreateRequirements && (
        <div className="px-4 py-3 bg-white border-t border-[#EAECF0] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] shrink-0">
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="w-full h-12 rounded-xl bg-[#3A58EF] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-[0_6px_16px_-6px_rgba(58,88,239,0.6)] active:bg-[#2E47CC] cursor-pointer"
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
