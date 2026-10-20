import React, { useEffect, useMemo, useState } from 'react';
import {
  Armchair,
  BadgeCheck,
  Building,
  FileSignature,
  GraduationCap,
  Headset,
  HeartPulse,
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
import { ScreenHeader, Card, EmptyCard, SearchField } from '../staff/tabs/StaffTabParts';
import { StaffSkeleton } from '../staff/ClientStaffParts';
import { filterInclusions } from '../data/clientInclusionsData';

interface Props {
  /** Header back arrow (Dashboard) */
  onBack?: () => void;
}

const LOAD_MS = 500;

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

/** Desktop `check_circle.svg` (tinted circle + check, #3A58EF) */
const CheckIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 21 20" fill="none" aria-hidden="true" className="shrink-0 mt-px">
    <circle cx="10.67" cy="10" r="7.5" fill="#3A58EF" opacity="0.2" />
    <circle cx="10.67" cy="10" r="7.5" stroke="#3A58EF" strokeWidth="1.25" />
    <path d="M7.54 10.63l1.88 1.87 4.37-4.37" stroke="#3A58EF" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PageSkeleton: React.FC = () => (
  <div className="space-y-4" aria-busy="true" aria-label="Loading inclusions">
    {[0, 1, 2].map((i) => (
      <div key={i} className="bg-white border border-[#D0D5DD] rounded-2xl overflow-hidden">
        <div className="bg-[#EBEEFD] p-4 flex items-start gap-3">
          <StaffSkeleton className="w-10 h-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <StaffSkeleton className="w-28 h-4" />
            <StaffSkeleton className="w-full h-3" />
          </div>
        </div>
        <div className="p-4 space-y-3">
          {[0, 1, 2].map((j) => (
            <div key={j} className="flex items-start gap-3">
              <StaffSkeleton className="w-5 h-5 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <StaffSkeleton className="w-36 h-3.5" />
                <StaffSkeleton className="w-2/3 h-3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

/**
 * Human Resources › Inclusions (desktop `inclusions/inclusionlist.tpl`): every service area as a card —
 * tinted header (icon, title, description) over its check-listed items — with the desktop live search.
 */
export const ClientInclusionsView: React.FC<Props> = ({ onBack }) => {
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), LOAD_MS);
    return () => clearTimeout(t);
  }, []);

  const results = useMemo(() => filterInclusions(query), [query]);

  return (
    <div className="relative flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      <ScreenHeader title="Inclusions" onBack={onBack} />
      <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
        <div className="sticky top-0 z-10 px-4 pt-3 pb-3 bg-[#F8FAFC]/95 backdrop-blur border-b border-slate-200/60">
          <SearchField value={query} onChange={setQuery} placeholder="Search" />
        </div>

        <div className="px-4 mt-4">
          {loading ? (
            <PageSkeleton />
          ) : results.length === 0 ? (
            <EmptyCard icon={SearchX} title="No results found" text="Try different keywords or check your spelling." />
          ) : (
            <div className="space-y-4 animate-in fade-in duration-200">
              {results.map(({ section, items }) => {
                const Icon = SECTION_ICON[section.id] ?? BadgeCheck;
                return (
                  <Card key={section.id} className="overflow-hidden border-[#D0D5DD]">
                    <div className="bg-[#EBEEFD] px-4 py-4 flex items-start gap-3">
                      <span className="w-10 h-10 rounded-full bg-white text-[#3A58EF] flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-[16px] font-semibold text-[#212529] leading-tight">{section.title}</h2>
                        <p className="mt-1.5 text-[12px] text-[#6C757D] leading-normal">{section.desc}</p>
                      </div>
                    </div>
                    <ul className="p-4 space-y-4">
                      {items.map((item) => (
                        <li key={item.title} className="flex items-start gap-3">
                          <CheckIcon />
                          <div className="min-w-0">
                            <h3 className="text-[13px] font-semibold text-[#212529] leading-snug">{item.title}</h3>
                            <p className="mt-1 text-[12px] text-[#5D667B] leading-snug">{item.desc}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
