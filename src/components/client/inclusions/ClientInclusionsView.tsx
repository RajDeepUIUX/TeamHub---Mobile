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
import { filterInclusions, INCLUSION_SECTIONS, InclusionSection, InclusionTone } from '../data/clientInclusionsData';

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

/** Area accent: icon tile background / icon colour / check colour */
const TONE: Record<InclusionTone, { tile: string; icon: string; check: string }> = {
  blue: { tile: 'bg-[#EAF0FF]', icon: 'text-[#2F68FE]', check: 'text-[#2F68FE]' },
  indigo: { tile: 'bg-[#EEF0FF]', icon: 'text-[#4F46E5]', check: 'text-[#4F46E5]' },
  violet: { tile: 'bg-[#F3EEFF]', icon: 'text-[#7C3AED]', check: 'text-[#7C3AED]' },
  green: { tile: 'bg-[#E8F8EF]', icon: 'text-[#16A34A]', check: 'text-[#16A34A]' },
  amber: { tile: 'bg-[#FFF5E5]', icon: 'text-[#D97706]', check: 'text-[#D97706]' },
  rose: { tile: 'bg-[#FFEEF1]', icon: 'text-[#E11D48]', check: 'text-[#E11D48]' },
  sky: { tile: 'bg-[#E6F6FD]', icon: 'text-[#0284C7]', check: 'text-[#0284C7]' },
  teal: { tile: 'bg-[#E6F7F5]', icon: 'text-[#0D9488]', check: 'text-[#0D9488]' },
};

const iconOf = (s: InclusionSection) => SECTION_ICON[s.id] ?? BadgeCheck;
const countLabel = (n: number) => `${n} ${n === 1 ? 'inclusion' : 'inclusions'}`;

const AreaIcon: React.FC<{ section: InclusionSection; size?: 'sm' | 'md' }> = ({ section, size = 'md' }) => {
  const Icon = iconOf(section);
  const t = TONE[section.tone];
  return (
    <span className={`${size === 'sm' ? 'w-9 h-9 rounded-xl' : 'w-11 h-11 rounded-2xl'} ${t.tile} ${t.icon} flex items-center justify-center shrink-0`}>
      <Icon className={size === 'sm' ? 'w-[18px] h-[18px]' : 'w-5 h-5'} />
    </span>
  );
};

const ItemList: React.FC<{ section: InclusionSection; items: InclusionSection['items'] }> = ({ section, items }) => (
  <ul className="divide-y divide-slate-100">
    {items.map((item) => (
      <li key={item.title} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
        <CheckCircle2 className={`w-[18px] h-[18px] mt-px shrink-0 ${TONE[section.tone].check}`} aria-hidden="true" />
        <div className="min-w-0">
          <h4 className="text-[13px] font-semibold text-[#1E293B] leading-snug">{item.title}</h4>
          <p className="mt-0.5 text-[12px] text-slate-500 leading-snug">{item.desc}</p>
        </div>
      </li>
    ))}
  </ul>
);

const GridSkeleton: React.FC = () => (
  <div className="grid grid-cols-2 gap-3" aria-busy="true" aria-label="Loading inclusions">
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="bg-white border border-[#DCE3ED] rounded-2xl p-3.5 space-y-3">
        <StaffSkeleton className="w-11 h-11 rounded-2xl" />
        <StaffSkeleton className="w-24 h-3.5" />
        <StaffSkeleton className="w-16 h-3" />
      </div>
    ))}
  </div>
);

const ListSkeleton: React.FC = () => (
  <div className="space-y-3" aria-busy="true" aria-label="Loading inclusions">
    {[0, 1, 2, 3, 4].map((i) => (
      <div key={i} className="bg-white border border-[#DCE3ED] rounded-2xl p-3.5 flex items-center gap-3">
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
    <p className="px-1 text-[12px] font-semibold text-slate-500">
      {countLabel(results.reduce((n, r) => n + r.items.length, 0))} in {results.length} {results.length === 1 ? 'area' : 'areas'}
    </p>
    {results.map(({ section, items }) => (
      <Card key={section.id} className="p-3.5">
        <div className="flex items-center gap-2.5 pb-3 mb-3 border-b border-slate-100">
          <AreaIcon section={section} size="sm" />
          <h3 className="flex-1 min-w-0 text-[14px] font-bold text-[#1E293B] truncate">{section.title}</h3>
          <span className="text-[11px] font-semibold text-slate-400 tabular-nums">{items.length}</span>
        </div>
        <ItemList section={section} items={items} />
      </Card>
    ))}
  </div>
);

/**
 * Human Resources › Inclusions (desktop `inclusions/inclusionlist.tpl`), app layout.
 * V1: 2-column area tiles, tap opens the area's checklist in a bottom sheet.
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
    <div className="grid grid-cols-2 gap-3 animate-in fade-in duration-200">
      {INCLUSION_SECTIONS.map((section) => (
        <button
          key={section.id}
          type="button"
          onClick={() => setSheetId(section.id)}
          className="text-left bg-white border border-[#DCE3ED] rounded-2xl p-3.5 shadow-[0_2px_10px_-2px_rgba(15,23,42,0.10)] active:scale-[0.98] transition-transform cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2F68FE]"
        >
          <AreaIcon section={section} />
          <p className="mt-3 text-[13.5px] font-bold text-[#1E293B] leading-tight line-clamp-2 min-h-[34px]">{section.title}</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[11.5px] font-medium text-slate-500 tabular-nums">{countLabel(section.items.length)}</span>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </div>
        </button>
      ))}
    </div>
  );

  const renderV2 = () => {
    const t = TONE[tabSection.tone];
    const Icon = iconOf(tabSection);
    return (
      <Card key={tabSection.id} className="overflow-hidden animate-in fade-in duration-200">
        <div className={`relative ${t.tile} px-4 pt-4 pb-4 overflow-hidden`}>
          <Icon className={`absolute -right-4 -bottom-5 w-24 h-24 ${t.icon} opacity-[0.08]`} aria-hidden="true" />
          <div className="relative flex items-center gap-3">
            <span className={`w-12 h-12 rounded-2xl bg-white ${t.icon} flex items-center justify-center shrink-0 shadow-[0_4px_12px_-4px_rgba(15,23,42,0.18)]`}>
              <Icon className="w-6 h-6" />
            </span>
            <div className="flex-1 min-w-0">
              <h2 className="text-[16px] font-bold text-[#1E293B] leading-tight">{tabSection.title}</h2>
              <span className={`mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/80 text-[11px] font-bold ${t.icon} tabular-nums`}>
                <CheckCircle2 className="w-3 h-3" /> {countLabel(tabSection.items.length)}
              </span>
            </div>
          </div>
          <p className="relative mt-3 text-[12.5px] text-slate-600 leading-relaxed">{tabSection.desc}</p>
        </div>
        <div className="px-4 pt-3.5 pb-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">What’s included</p>
          <ul className="mt-3 space-y-2">
            {tabSection.items.map((item) => (
              <li key={item.title} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5">
                <span className={`w-7 h-7 rounded-lg ${t.tile} ${t.icon} flex items-center justify-center shrink-0`}>
                  <Check className="w-4 h-4" strokeWidth={2.5} />
                </span>
                <div className="min-w-0 pt-px">
                  <h3 className="text-[13px] font-semibold text-[#1E293B] leading-snug">{item.title}</h3>
                  <p className="mt-0.5 text-[12px] text-slate-500 leading-snug">{item.desc}</p>
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
            <nav className="mt-2 border-b border-slate-200/80" aria-label="Service areas">
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
                <p className="flex-1 text-[12.5px] text-slate-500 leading-snug">{sheetSection.desc}</p>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                <LayoutGrid className="w-3.5 h-3.5" /> What’s included
              </div>
              <div className="mt-3">
                <ItemList section={sheetSection} items={sheetSection.items} />
              </div>
            </div>
          </>
        )}
      </BottomSheet>
    </div>
  );
};
