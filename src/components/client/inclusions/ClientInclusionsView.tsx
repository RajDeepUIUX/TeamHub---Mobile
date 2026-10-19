import React, { useEffect, useMemo, useState } from 'react';
import {
  Armchair,
  BadgeCheck,
  Building,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
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
import { Card, ChipRow, EmptyCard, SearchField } from '../staff/tabs/StaffTabParts';
import { StaffSkeleton } from '../staff/ClientStaffParts';
import {
  INCLUSION_GROUPS,
  INCLUSION_SECTIONS,
  InclusionGroup,
  InclusionTone,
  filterInclusions,
  groupCounts,
  inGroup,
} from '../data/clientInclusionsData';

interface Props {
  companyName: string;
  onContactManager: () => void;
}

const LOAD_MS = 500;
const PREVIEW_ITEMS = 5;

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

const TONE: Record<InclusionTone, { tile: string; count: string; accent: string }> = {
  blue: { tile: 'bg-[#EFF6FF] text-[#2F68FE]', count: 'bg-[#EFF6FF] text-[#1D4ED8]', accent: 'bg-[#2F68FE]' },
  indigo: { tile: 'bg-[#EEF2FF] text-[#4F46E5]', count: 'bg-[#EEF2FF] text-[#4F46E5]', accent: 'bg-[#4F46E5]' },
  violet: { tile: 'bg-[#F5F3FF] text-[#7C3AED]', count: 'bg-[#F5F3FF] text-[#7C3AED]', accent: 'bg-[#7C3AED]' },
  green: { tile: 'bg-[#E8F8F0] text-[#059669]', count: 'bg-[#E8F8F0] text-[#059669]', accent: 'bg-[#10B981]' },
  amber: { tile: 'bg-[#FEF8E7] text-[#D97706]', count: 'bg-[#FEF8E7] text-[#D97706]', accent: 'bg-[#F59E0B]' },
  rose: { tile: 'bg-[#FEF2F2] text-rose-600', count: 'bg-[#FEF2F2] text-rose-600', accent: 'bg-[#F43F5E]' },
  sky: { tile: 'bg-[#F0F9FF] text-[#0284C7]', count: 'bg-[#F0F9FF] text-[#0284C7]', accent: 'bg-[#0EA5E9]' },
  teal: { tile: 'bg-[#F0FDFA] text-[#0D9488]', count: 'bg-[#F0FDFA] text-[#0D9488]', accent: 'bg-[#14B8A6]' },
};

const escapeRegExp = (v: string) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Matches the typed text even when the source has a hyphen or space between letters (wifi → Wi-Fi) */
const highlightPattern = (q: string) =>
  new RegExp(`(${Array.from(q.replace(/[\s-]+/g, '')).map(escapeRegExp).join('[\\s-]*')})`, 'ig');

const Highlight: React.FC<{ text: string; query: string }> = ({ text, query }) => {
  const q = query.trim();
  if (!q) return <>{text}</>;
  if (!q.replace(/[\s-]+/g, '')) return <>{text}</>;
  const parts = text.split(highlightPattern(q));
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="bg-[#FEF08A] text-inherit rounded-xs px-px">
            {p}
          </mark>
        ) : (
          <React.Fragment key={i}>{p}</React.Fragment>
        ),
      )}
    </>
  );
};

const PageSkeleton: React.FC = () => (
  <div className="px-4 mt-4 space-y-3" aria-busy="true" aria-label="Loading inclusions">
    <StaffSkeleton className="w-full h-28 rounded-3xl" />
    {[0, 1, 2, 3].map((i) => (
      <div key={i} className="bg-white border border-[#EBF0F7] rounded-2xl p-4 flex items-start gap-3">
        <StaffSkeleton className="w-11 h-11 rounded-2xl shrink-0" />
        <div className="flex-1 space-y-2">
          <StaffSkeleton className="w-32 h-3.5" />
          <StaffSkeleton className="w-full h-3" />
          <StaffSkeleton className="w-2/3 h-3" />
        </div>
      </div>
    ))}
  </div>
);

/**
 * Invoices › Inclusions (desktop `inclusions`): read-only list of everything the engagement includes,
 * grouped into 15 service areas, with the desktop live search (item / area title and description).
 */
export const ClientInclusionsView: React.FC<Props> = ({ companyName, onContactManager }) => {
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<string[]>([INCLUSION_SECTIONS[0].id]);
  const [group, setGroup] = useState<InclusionGroup>('All');
  const [showAll, setShowAll] = useState<string[]>([]);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), LOAD_MS);
    return () => clearTimeout(t);
  }, []);

  const searching = query.trim().length > 0;
  const results = useMemo(
    () => filterInclusions(query).filter((r) => searching || inGroup(r.section, group)),
    [query, group, searching],
  );
  const matchCount = results.reduce((n, r) => n + r.items.length, 0);
  const counts = useMemo(groupCounts, []);
  const visibleIds = results.map((r) => r.section.id);
  const allOpen = visibleIds.every((id) => open.includes(id));

  const toggle = (id: string) => setOpen((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <div className="relative flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
        <div className="px-4 pt-4">
          <p className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
            Invoices <ChevronRight className="w-3 h-3" /> <span className="text-slate-600">Inclusions</span>
          </p>
          <h1 className="mt-0.5 mb-1.5 text-xl font-extrabold leading-tight">Inclusions</h1>
          <p className="mt-1 text-[11.5px] text-slate-500">What your {companyName} engagement covers, area by area.</p>
        </div>

        <div className="sticky top-0 z-10 mt-3 px-4 pt-1 pb-2 bg-[#F8FAFC]/95 backdrop-blur border-b border-slate-200/60">
          <SearchField value={query} onChange={setQuery} placeholder="Search inclusions" />
          {!searching && (
            <div className="mt-2">
              <ChipRow options={INCLUSION_GROUPS} value={group} onChange={setGroup} counts={counts} label="Inclusion group" />
            </div>
          )}
        </div>

        {loading ? (
          <PageSkeleton />
        ) : (
          <div className="px-4 mt-4 space-y-4 animate-in fade-in duration-200">
            {!searching && (
              <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#1D4ED8] via-[#2F68FE] to-[#6366F1] p-4 text-white">
                <span className="absolute -right-8 -top-10 w-36 h-36 rounded-full bg-white/10" aria-hidden="true" />
                <span className="absolute right-10 -bottom-12 w-28 h-28 rounded-full bg-white/10" aria-hidden="true" />
                <div className="relative">
                  <p className="text-[10.5px] font-bold uppercase tracking-wider text-white/70">
                    {group === 'All' ? 'Included in your plan' : group}
                  </p>
                  <h2 className="mt-0.5 text-xl font-extrabold leading-tight">
                    {group === 'All' ? 'Everything your offshore team gets' : 'What this covers for your team'}
                  </h2>
                  <div className="mt-3.5 grid grid-cols-2 gap-2">
                    <div className="rounded-2xl bg-white/15 px-3 py-2 backdrop-blur-sm">
                      <p className="text-[18px] font-extrabold tabular-nums leading-tight">{results.length}</p>
                      <p className="text-[10px] font-semibold text-white/70">Service areas</p>
                    </div>
                    <div className="rounded-2xl bg-white/15 px-3 py-2 backdrop-blur-sm">
                      <p className="text-[18px] font-extrabold tabular-nums leading-tight">{matchCount}</p>
                      <p className="text-[10px] font-semibold text-white/70">Inclusions</p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {(!searching || results.length > 0) && (
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-extrabold text-[#1E293B]">
                {searching ? (
                  <>
                    {matchCount} {matchCount === 1 ? 'result' : 'results'}
                    <span className="font-semibold text-slate-400"> · {results.length} {results.length === 1 ? 'area' : 'areas'}</span>
                  </>
                ) : (
                  'Service areas'
                )}
              </h2>
              {!searching && (
                <button
                  type="button"
                  onClick={() => setOpen((prev) => (allOpen ? prev.filter((id) => !visibleIds.includes(id)) : Array.from(new Set([...prev, ...visibleIds]))))}
                  className="h-8 px-2 -mr-2 rounded-lg text-xs font-bold text-[#2F68FE] active:bg-[#EFF6FF] cursor-pointer"
                >
                  {allOpen ? 'Collapse all' : 'Expand all'}
                </button>
              )}
            </div>
            )}

            {results.length === 0 ? (
              <EmptyCard
                icon={SearchX}
                title="No inclusions found"
                text={`Nothing matches “${query.trim()}”. Try a different word.`}
                action={
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="mt-4 h-10 px-4 rounded-xl bg-[#EFF6FF] text-[#2F68FE] text-xs font-bold active:bg-[#DBEAFE] cursor-pointer"
                  >
                    Clear search
                  </button>
                }
              />
            ) : (
              <div className="space-y-3">
                {results.map(({ section, items }) => {
                  const Icon = SECTION_ICON[section.id] ?? BadgeCheck;
                  const tone = TONE[section.tone];
                  const expanded = searching || open.includes(section.id);
                  const panelId = `inclusion-${section.id}`;
                  return (
                    <Card key={section.id} className="overflow-hidden">
                      <span className={`block h-1 ${tone.accent}`} aria-hidden="true" />
                      <button
                        type="button"
                        aria-expanded={expanded}
                        aria-controls={panelId}
                        disabled={searching}
                        onClick={() => toggle(section.id)}
                        className="w-full p-4 flex items-start gap-3 text-left active:bg-slate-50 disabled:active:bg-transparent cursor-pointer disabled:cursor-default"
                      >
                        <span className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${tone.tile}`}>
                          <Icon className="w-5 h-5" />
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="flex items-center gap-2">
                            <span className="text-[14px] font-extrabold text-[#1E293B] leading-tight">
                              <Highlight text={section.title} query={query} />
                            </span>
                            <span className={`px-2 h-5 rounded-full text-[10.5px] font-bold flex items-center shrink-0 tabular-nums ${tone.count}`}>
                              {searching ? `${items.length} of ${section.items.length}` : section.items.length}
                            </span>
                          </span>
                          <span className={`mt-1 block text-[11.5px] text-slate-500 leading-snug ${expanded ? '' : 'line-clamp-2'}`}>
                            <Highlight text={section.desc} query={query} />
                          </span>
                          {!expanded && (
                            <span className="mt-2.5 flex flex-wrap gap-1.5">
                              {section.items.slice(0, 3).map((i) => (
                                <span key={i.title} className="px-2 h-5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold flex items-center max-w-full truncate">
                                  {i.title}
                                </span>
                              ))}
                              <span className="px-2 h-5 rounded-full text-[10px] font-bold text-slate-400 flex items-center">
                                +{section.items.length - 3} more
                              </span>
                            </span>
                          )}
                        </span>
                        {!searching && (
                          <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 mt-1 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                        )}
                      </button>

                      {expanded && (
                        <ul id={panelId} className="border-t border-slate-100 divide-y divide-slate-100 animate-in fade-in duration-200">
                          {(searching || showAll.includes(section.id) ? items : items.slice(0, PREVIEW_ITEMS)).map((item) => (
                            <li key={item.title} className="px-4 py-3 flex items-start gap-3">
                              <span className="w-6 h-6 rounded-full bg-[#E8F8F0] text-[#10B981] flex items-center justify-center shrink-0 mt-px">
                                <CheckCircle2 className="w-4 h-4" />
                              </span>
                              <span className="min-w-0">
                                <span className="block text-[12.5px] font-bold text-[#1E293B] leading-tight">
                                  <Highlight text={item.title} query={query} />
                                </span>
                                <span className="mt-0.5 block text-[11.5px] text-slate-500 leading-snug">
                                  <Highlight text={item.desc} query={query} />
                                </span>
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {expanded && !searching && items.length > PREVIEW_ITEMS && (
                        <button
                          type="button"
                          onClick={() => setShowAll((prev) => (prev.includes(section.id) ? prev.filter((x) => x !== section.id) : [...prev, section.id]))}
                          className={`w-full h-11 border-t border-slate-100 text-xs font-bold flex items-center justify-center gap-1 active:bg-slate-50 cursor-pointer ${tone.tile.split(' ')[1]}`}
                        >
                          {showAll.includes(section.id) ? 'Show fewer' : `Show all ${items.length}`}
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAll.includes(section.id) ? 'rotate-180' : ''}`} />
                        </button>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}

            <Card className="p-4 flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0">
                <Headset className="w-5 h-5" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-[#1E293B]">Something missing?</p>
                <p className="text-[11px] text-slate-500">Ask your Account Manager about anything not listed.</p>
              </div>
              <button
                type="button"
                onClick={onContactManager}
                className="h-9 px-3.5 rounded-xl bg-[#EFF6FF] text-[#2F68FE] text-xs font-bold active:bg-[#DBEAFE] shrink-0 cursor-pointer"
              >
                Contact
              </button>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
