import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Armchair,
  BadgeCheck,
  Building,
  Check,
  CheckCircle2,
  ChevronRight,
  FileSignature,
  GraduationCap,
  Headset,
  HeartPulse,
  LayoutGrid,
  PartyPopper,
  Scale,
  SearchX,
  Server,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Wallet,
  ScrollText,
} from 'lucide-react';
import { ScreenHeader, Card, DesignVersion, EmptyCard, SearchField, SheetHeader } from '../staff/tabs/StaffTabParts';
import { StaffSkeleton } from '../staff/ClientStaffParts';
import { BottomSheet } from '../../common/BottomSheet';
import { filterInclusions, INCLUSION_SECTIONS, InclusionSection } from '../data/clientInclusionsData';

interface Props {
  /** Header back arrow (Dashboard) */
  onBack?: () => void;
}

const LOAD_MS = 500;
const DESIGN_VERSIONS = ['V1', 'V2'] as const;

const SECTION_ICON: Record<string, React.ElementType> = {
  workspace: Armchair,
  talent: UsersRound,
  'tax-legal': Scale,
  'hr-policies': ScrollText,
  learning: GraduationCap,
  payroll: Wallet,
  'employment-terms': FileSignature,
  'staff-benefits': HeartPulse,
  'ai-hrms': Sparkles,
  administration: Building,
  engagement: PartyPopper,
  it: Server,
  'data-security': ShieldCheck,
  compliance: BadgeCheck,
  support: Headset,
};

const iconOf = (s: InclusionSection) => SECTION_ICON[s.id] ?? BadgeCheck;
const countLabel = (n: number) => `${n} ${n === 1 ? 'inclusion' : 'inclusions'}`;

/** One flat tile style for every area (redesign.md §4: no per-category colour) */
const AreaIcon: React.FC<{ section: InclusionSection; size?: 'sm' | 'md' }> = ({ section, size = 'md' }) => {
  const Icon = iconOf(section);
  return (
    <span
      className={`${size === 'sm' ? 'w-9 h-9' : 'w-11 h-11'} rounded-xl bg-blue-50 border border-blue-100 text-[#2F68FE] flex items-center justify-center shrink-0`}
    >
      <Icon className={size === 'sm' ? 'w-4.5 h-4.5' : 'w-5 h-5'} />
    </span>
  );
};

const ItemList: React.FC<{ items: InclusionSection['items'] }> = ({ items }) => (
  <ul className="divide-y divide-slate-100">
    {items.map((item) => (
      <li key={item.title} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
        <CheckCircle2 className="w-4.5 h-4.5 mt-px shrink-0 text-[#2F68FE]" aria-hidden="true" />
        <div className="min-w-0">
          <h4 className="text-[13px] font-semibold text-[#1E293B] leading-snug">{item.title}</h4>
          <p className="mt-0.5 text-xs text-slate-500 leading-snug">{item.desc}</p>
        </div>
      </li>
    ))}
  </ul>
);

const GridSkeleton: React.FC = () => (
  <div className="space-y-3" aria-busy="true" aria-label="Loading inclusions">
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="bg-white border border-[#EBF0F7] rounded-2xl p-3.5 shadow-2xs flex items-center gap-3">
        <StaffSkeleton className="w-11 h-11 rounded-xl shrink-0" />
        <div className="flex-1 space-y-1.5">
          <StaffSkeleton className="w-40 h-3.5" />
          <StaffSkeleton className="w-20 h-3" />
        </div>
      </div>
    ))}
  </div>
);

const ListSkeleton: React.FC = () => (
  <div className="space-y-3" aria-busy="true" aria-label="Loading inclusions">
    {[0, 1, 2, 3, 4].map((i) => (
      <div key={i} className="bg-white border border-[#EBF0F7] rounded-2xl p-3.5 shadow-2xs flex items-center gap-3">
        <StaffSkeleton className="w-9 h-9 rounded-xl shrink-0" />
        <div className="flex-1 space-y-1.5">
          <StaffSkeleton className="w-32 h-3.5" />
          <StaffSkeleton className="w-20 h-3" />
        </div>
      </div>
    ))}
  </div>
);

/** Search results (both versions): matching items grouped under a compact area header */
const SearchResults: React.FC<{ results: ReturnType<typeof filterInclusions> }> = ({ results }) => (
  <div className="space-y-3 animate-in fade-in duration-200">
    <p className="px-1 text-xs font-semibold text-slate-500">
      {countLabel(results.reduce((n, r) => n + r.items.length, 0))} in {results.length} {results.length === 1 ? 'area' : 'areas'}
    </p>
    {results.map(({ section, items }) => (
      <Card key={section.id} className="p-4">
        <div className="flex items-center gap-2.5 pb-3 mb-3 border-b border-slate-100">
          <AreaIcon section={section} size="sm" />
          <h3 className="flex-1 min-w-0 text-sm font-bold text-[#1E293B] truncate">{section.title}</h3>
          <span className="px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#2F68FE] text-[11px] font-bold tabular-nums">{items.length}</span>
        </div>
        <ItemList items={items} />
      </Card>
    ))}
  </div>
);

/**
 * Human Resources › Inclusions (desktop `inclusions/inclusionlist.tpl`), app layout.
 * V1: one full-width area card per row, tap opens the area's checklist in a bottom sheet.
 * V2: underline area tabs (My Profile style: icon + label, blue bar) + the selected area's card.
 * Both keep the desktop live search (`performSearch`).
 */
export const ClientInclusionsView: React.FC<Props> = ({ onBack }) => {
  const [version, setVersion] = useState<DesignVersion>('V1');
  const v2 = version === 'V2';
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [tab, setTab] = useState<string>(INCLUSION_SECTIONS[0].id);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), LOAD_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    tabRefs.current[tab]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [tab, v2]);

  const results = useMemo(() => filterInclusions(query), [query]);
  const searching = query.trim().length > 0;
  const sheetSection = INCLUSION_SECTIONS.find((s) => s.id === sheetId) ?? null;

  const tabSection = INCLUSION_SECTIONS.find((s) => s.id === tab) ?? INCLUSION_SECTIONS[0];

  const renderV1 = () => (
    <div className="space-y-3 animate-in fade-in duration-200">
      {INCLUSION_SECTIONS.map((section) => (
        <button
          key={section.id}
          type="button"
          onClick={() => setSheetId(section.id)}
          className="w-full flex items-center gap-3 text-left bg-white border border-[#EBF0F7] rounded-2xl p-3.5 shadow-2xs active:bg-slate-50 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2F68FE]"
        >
          <AreaIcon section={section} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#1E293B] leading-tight truncate">{section.title}</p>
            <span className="mt-1 block text-[11px] font-medium text-slate-400 tabular-nums">{countLabel(section.items.length)}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#2F68FE] shrink-0" />
        </button>
      ))}
    </div>
  );

  const renderV2 = () => {
    return (
      <Card key={tabSection.id} className="animate-in fade-in duration-200">
        <div className="p-4">
          <div className="flex items-center gap-3">
            <AreaIcon section={tabSection} />
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-[#1E293B] leading-tight">{tabSection.title}</h2>
              <span className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[11px] font-bold text-[#2F68FE] tabular-nums">
                <CheckCircle2 className="w-3 h-3" /> {countLabel(tabSection.items.length)}
              </span>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500 leading-relaxed">{tabSection.desc}</p>
        </div>
        <div className="px-4 pt-3.5 pb-4 border-t border-slate-100">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">What’s included</p>
          <ul className="mt-3 space-y-2">
            {tabSection.items.map((item) => (
              <li key={item.title} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5">
                <span className="w-7 h-7 rounded-lg bg-[#EEF2FF] text-[#2F68FE] flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4" strokeWidth={2.5} />
                </span>
                <div className="min-w-0 pt-px">
                  <h3 className="text-[13px] font-semibold text-[#1E293B] leading-snug">{item.title}</h3>
                  <p className="mt-0.5 text-xs text-slate-500 leading-snug">{item.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Card>
    );
  };

  return (
    <div className="relative flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      <ScreenHeader title="Inclusions" onBack={onBack} version={{ versions: DESIGN_VERSIONS, value: version, onChange: setVersion }} />
      <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
        <div className={`sticky top-0 z-10 pt-3 bg-[#F8FAFC]/95 backdrop-blur ${v2 && !searching ? '' : 'pb-3'}`}>
          <div className="px-4">
            <SearchField value={query} onChange={setQuery} placeholder="Search inclusions" />
          </div>
          {v2 && !searching && (
            <nav className="mt-3 bg-white border-y border-[#EBF0F7]" aria-label="Service areas">
              <div className="flex gap-1 overflow-x-auto no-scrollbar px-2" role="tablist">
                {INCLUSION_SECTIONS.map((section) => {
                  const Icon = iconOf(section);
                  const on = section.id === tab;
                  return (
                    <button
                      key={section.id}
                      ref={(el) => {
                        tabRefs.current[section.id] = el;
                      }}
                      type="button"
                      role="tab"
                      aria-selected={on}
                      onClick={() => setTab(section.id)}
                      className={`relative h-12 px-3 flex items-center gap-1.5 text-[13px] font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                        on ? 'text-[#2F68FE]' : 'text-slate-500 active:text-[#1E293B]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {section.title}
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
        </div>

        <div className={`px-4 ${v2 && !searching ? 'mt-3' : 'mt-1'}`}>
          {loading ? (
            v2 ? <ListSkeleton /> : <GridSkeleton />
          ) : searching ? (
            results.length === 0 ? (
              <EmptyCard icon={SearchX} title="No results found" text="Try different keywords or check your spelling." />
            ) : (
              <SearchResults results={results} />
            )
          ) : v2 ? (
            renderV2()
          ) : (
            renderV1()
          )}
        </div>
      </div>

      <BottomSheet isOpen={!!sheetSection} onClose={() => setSheetId(null)}>
        {sheetSection && (
          <>
            <SheetHeader title={sheetSection.title} subtitle={countLabel(sheetSection.items.length)} onClose={() => setSheetId(null)} />
            <div className="flex-1 overflow-y-auto no-scrollbar px-5 pt-4 pb-8">
              <div className="flex items-start gap-3">
                <AreaIcon section={sheetSection} />
                <p className="flex-1 text-xs text-slate-500 leading-snug">{sheetSection.desc}</p>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                <LayoutGrid className="w-3.5 h-3.5" /> What’s included
              </div>
              <div className="mt-3">
                <ItemList items={sheetSection.items} />
              </div>
            </div>
          </>
        )}
      </BottomSheet>
    </div>
  );
};
