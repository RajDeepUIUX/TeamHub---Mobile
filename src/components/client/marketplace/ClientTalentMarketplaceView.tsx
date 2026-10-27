import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bookmark,
  BookmarkCheck,
  Briefcase,
  Check,
  CircleCheck,
  CircleCheckBig,
  FileText,
  GraduationCap,
  Headset,
  IdCard,
  Loader2,
  Search,
  SearchX,
  Store,
  WandSparkles,
  X,
} from 'lucide-react';
import { Dropdown } from '../../../design-system/components/Dropdown';
import { FilterIconButton } from '../../common/TeamFilterSheet';
import { useClientPermission } from '../context/ClientPermissionContext';
import { EmptyCard, ScreenHeader } from '../staff/tabs/StaffTabParts';
import { useTimesheetNotice } from '../timesheets/TimesheetParts';
import { InterviewScheduleSheet, InterviewScheduledSheet } from '../interviews/InterviewScheduleSheet';
import { ScheduledInterview, ShortlistedCandidate, formatShortDate, isoOfDate } from '../data/clientInterviewsData';
import { StaffRequirement, TIMELINE_OPTIONS, hasOpenRequirementFor, requirementsFromHub } from '../data/clientRequirementsData';
import {
  AVAILABILITY_OPTIONS,
  AiSearchResult,
  BEST_MATCH_OPTION,
  CARD_SKILL_LIMIT,
  COST_OPTIONS,
  EMPTY_MARKETPLACE_FILTERS,
  EXPERIENCE_OPTIONS,
  HUB_PAGE_SIZE,
  HubProfile,
  MAX_COMPARE,
  MarketplaceFilters,
  MarketplaceSort,
  NOT_SPECIFIED,
  SEARCH_FOCUS_PLACEHOLDER,
  SEARCH_PLACEHOLDER_PHRASES,
  SORT_OPTIONS,
  TRY_QUERIES,
  avgAssessment,
  candidateFromProfile,
  cardSkillsOf,
  countryOf,
  cpeLabel,
  cpeMinutes,
  experienceLabel,
  hasRequirementFor,
  isAiUpskilled,
  labelOfRange,
  marketplaceFilterCount,
  matchesMarketplace,
  priceParts,
  requestToHireRequirement,
  runAiSearch,
  sortProfiles,
  summarySnippet,
} from '../data/clientStaffHubData';
import { CompareBar, CompareSheet } from './CompareSheet';
import { MarketplaceFilterOptions, MarketplaceFilterSheet } from './MarketplaceFilterSheet';
import { AiUpskilledChip, CheckMark, CountryFlag, DomainTile, JoinsChip, MarketplaceSkeleton, MatchBadge } from './MarketplaceParts';
import { TalentProfileView } from './TalentProfileView';

interface Props {
  profiles: HubProfile[];
  /** Shortlisted Candidates live in ClientApp; Request to Hire adds a row there */
  candidates: ShortlistedCandidate[];
  /** Saved Resumes (profile ids) live in ClientApp so they're kept while switching modules */
  savedIds: string[];
  onToggleSave: (profileId: string) => void;
  /** Compare selection (desktop keeps it for the session) */
  compareIds: string[];
  onCompareChange: (ids: string[]) => void;
  onRequestToHire: (candidate: ShortlistedCandidate) => void;
  onUpdateCandidate: (id: string, patch: Partial<ShortlistedCandidate>) => void;
  /** Staff Requirements: an open one for the profile books the interview straight away; otherwise Request to Hire creates one */
  requirements: StaffRequirement[];
  onCreateRequirements: (created: StaffRequirement[]) => void;
  /** Opens Hire New Staff › Shortlisted Candidates (needs access to that module) */
  onOpenShortlisted?: () => void;
  onContactManager: () => void;
  /** Staff Requirement / Pricing "Available Resumes" opens the list on that profile (desktop `selected_profile_id`) */
  initialProfile?: string | null;
  /** Dashboard › Previously Saved Profiles: Saved Resumes, optionally straight on one profile (its Back returns to the Dashboard) */
  initialSaved?: boolean;
  initialProfileId?: string | null;
  /** Header back arrow */
  onBack?: () => void;
}

type View = 'available' | 'saved';
type Sheet = 'filter' | 'compare' | 'schedule' | 'scheduled' | null;

/** Desktop loads by ajax ("Applying filters…" / "Searching…") */
const LOAD_MS = 600;
const SEARCH_MS = 900;

const sortedUnique = (values: string[]) => [...new Set(values)].sort((a, b) => a.localeCompare(b));

const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Search box with the desktop typewriter placeholder (idle + empty only; static when reduced motion is on) */
const SmartSearchInput: React.FC<{
  value: string;
  onChange: (v: string) => void;
  onEnter: () => void;
  animate: boolean;
  staticPlaceholder: string;
}> = ({ value, onChange, onEnter, animate, staticPlaceholder }) => {
  const [focused, setFocused] = useState(false);
  const [typed, setTyped] = useState('');
  const running = animate && !focused && value === '' && !prefersReducedMotion();

  useEffect(() => {
    if (!running) return;
    let phrase = 0;
    let chars = 0;
    let deleting = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const full = SEARCH_PLACEHOLDER_PHRASES[phrase];
      if (!deleting) {
        chars += 1;
        setTyped(full.slice(0, chars));
        if (chars === full.length) {
          deleting = true;
          timer = setTimeout(tick, 2000);
          return;
        }
        timer = setTimeout(tick, 50);
      } else {
        chars -= 1;
        setTyped(full.slice(0, chars));
        if (chars === 0) {
          deleting = false;
          phrase = (phrase + 1) % SEARCH_PLACEHOLDER_PHRASES.length;
          timer = setTimeout(tick, 450);
          return;
        }
        timer = setTimeout(tick, 25);
      }
    };
    timer = setTimeout(tick, 600);
    return () => clearTimeout(timer);
  }, [running]);

  const placeholder = focused || !animate ? (animate ? SEARCH_FOCUS_PLACEHOLDER : staticPlaceholder) : running ? typed : SEARCH_FOCUS_PLACEHOLDER;

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          onEnter();
        }
      }}
      enterKeyHint="search"
      placeholder={placeholder}
      aria-label={animate ? 'Search talent by Resume ID or AI query' : 'Search by Resume ID'}
      className="flex-1 min-w-0 h-11 bg-transparent text-[13px] font-medium text-[#1E293B] placeholder:text-slate-400 text-ellipsis focus:outline-hidden select-text"
    />
  );
};

/**
 * Hire New Staff › Talent Marketplace (desktop `staffingMarketplace`, 2026-10 redesign): search by Resume ID or AI Smart Search
 * (+ "Try:" queries), filters (Country, Domain, Technical Skills, Availability, Talent Cost, Experience, Qualifications, Work
 * Mode), Applied chips, Saved and AI-Upskilled pills, Sort By, profile cards (AI Insights, Compare), Load More, Compare
 * Side-by-Side, Talent Profile and Request to Hire (an open requirement → interview scheduler; none → requirement created and
 * the interview scheduled in one step).
 */
export const ClientTalentMarketplaceView: React.FC<Props> = ({
  profiles,
  candidates,
  savedIds,
  onToggleSave,
  compareIds,
  onCompareChange,
  onRequestToHire,
  onUpdateCandidate,
  requirements,
  onCreateRequirements,
  onOpenShortlisted,
  onContactManager,
  initialProfile,
  initialSaved = false,
  initialProfileId,
  onBack,
}) => {
  // view = Talent Profile; add = Request to Hire + Save; download = resume, psychometric test, reports
  const { view: canView, add: canAdd, download: canDownload } = useClientPermission('staff-hub');

  const [view, setView] = useState<View>(initialSaved ? 'saved' : 'available');
  const [filters, setFilters] = useState<MarketplaceFilters>(() => {
    const domain = initialProfile ? profiles.find((p) => p.profile === initialProfile)?.domain : undefined;
    return domain ? { ...EMPTY_MARKETPLACE_FILTERS, domains: [domain] } : EMPTY_MARKETPLACE_FILTERS;
  });
  const [profileLock, setProfileLock] = useState<string | null>(initialProfile ?? null);
  const [input, setInput] = useState('');
  const [resumeQuery, setResumeQuery] = useState('');
  const [aiQuery, setAiQuery] = useState('');
  const [aiResult, setAiResult] = useState<AiSearchResult | null>(null);
  const [upskilled, setUpskilled] = useState(false);
  const [sort, setSort] = useState<MarketplaceSort>('experience');
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState<string | null>('Loading profiles…');
  const [moreLoading, setMoreLoading] = useState(false);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [entryProfileId] = useState(canView ? (initialProfileId ?? null) : null);
  const [openId, setOpenId] = useState<string | null>(entryProfileId);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [hireId, setHireId] = useState<string | null>(null);
  const [hireCreatesRequirement, setHireCreatesRequirement] = useState(false);
  const [scheduledCandidateId, setScheduledCandidateId] = useState<string | null>(null);
  const [notice, showNotice] = useTimesheetNotice();
  const listRef = useRef<HTMLDivElement>(null);
  const loadTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    loadTimer.current = setTimeout(() => setLoading(null), LOAD_MS);
    return () => {
      clearTimeout(loadTimer.current);
      clearTimeout(noticeTimer.current);
    };
  }, []);

  /** Desktop redraws page 1 after every filter / sort / search change */
  const reload = (text: string, ms = LOAD_MS, then?: () => void) => {
    clearTimeout(loadTimer.current);
    setLoading(text);
    setPages(1);
    listRef.current?.scrollTo({ top: 0 });
    loadTimer.current = setTimeout(() => {
      then?.();
      setLoading(null);
    }, ms);
  };

  /* ---------- Data ---------- */

  // Desktop hides profiles the client already requested to hire (shared staff)
  const requestedResumeIds = useMemo(() => new Set(candidates.map((c) => c.resumeId)), [candidates]);
  const pool = useMemo(() => profiles.filter((p) => !requestedResumeIds.has(p.resumeId)), [profiles, requestedResumeIds]);
  const savedPool = useMemo(() => pool.filter((p) => savedIds.includes(p.id)), [pool, savedIds]);
  const saved = view === 'saved';
  const source = saved ? savedPool : pool;

  // AI Smart Search and AI-Upskilled only work on the Talent Marketplace view (desktop: Saved Resumes never wired them)
  const aiActive = !saved && aiQuery !== '' && aiResult !== null;
  const scores = aiActive && aiResult ? aiResult.scores : {};
  const lock = saved ? null : profileLock;

  const queryFor = (f: MarketplaceFilters, withUpskilled = !saved && upskilled) => ({ filters: f, resumeId: resumeQuery, profile: lock, upskilled: withUpskilled });
  const inSearch = (p: HubProfile) => !aiActive || scores[p.id] !== undefined;

  const effectiveSort: MarketplaceSort = sort === 'relevance' && !aiActive ? 'experience' : sort;
  const results = sortProfiles(
    source.filter((p) => inSearch(p) && matchesMarketplace(p, queryFor(filters))),
    effectiveSort,
    scores,
  );
  const visible = results.slice(0, pages * HUB_PAGE_SIZE);

  // AI-Upskilled pill count follows every other active filter (desktop `ai_upskilled_total_count`)
  const upskilledCount = pool.filter((p) => isAiUpskilled(p) && inSearch(p) && matchesMarketplace(p, queryFor(filters, false))).length;

  const options = useMemo<MarketplaceFilterOptions>(() => {
    const countries = sortedUnique(pool.map(countryOf).filter((c) => c !== NOT_SPECIFIED));
    return {
      countries: pool.some((p) => !p.country) ? [...countries, NOT_SPECIFIED] : countries,
      domains: sortedUnique(pool.map((p) => p.domain)),
      skills: [...new Set(pool.flatMap((p) => p.skillCategories))].sort(),
      qualifications: sortedUnique(pool.flatMap((p) => p.resume.qualifications)),
    };
  }, [pool]);

  const countOf = (draft: MarketplaceFilters) => source.filter((p) => inSearch(p) && matchesMarketplace(p, queryFor(draft))).length;

  const profileOf = (id: string | null) => profiles.find((p) => p.id === id) ?? null;
  const openProfile = profileOf(openId);
  const hireProfile = profileOf(hireId);
  const scheduledCandidate = candidates.find((c) => c.id === scheduledCandidateId) ?? null;
  const compareProfiles = compareIds.map((id) => profileOf(id)).filter((p): p is HubProfile => p !== null);
  const filterCount = marketplaceFilterCount(filters);

  /* ---------- Actions ---------- */

  const applyFilters = (next: MarketplaceFilters) => {
    setFilters(next);
    reload('Applying filters…');
  };

  const clearAll = () => {
    setFilters(EMPTY_MARKETPLACE_FILTERS);
    setProfileLock(null);
    setResumeQuery('');
    setInput('');
    setAiQuery('');
    setAiResult(null);
    setUpskilled(false);
    // Desktop `task=clear` resets the whole search, sort included
    setSort('experience');
    reload('Applying filters…');
  };

  const showNotices = (texts: string[]) => {
    clearTimeout(noticeTimer.current);
    texts.forEach((t, i) => {
      if (i === 0) showNotice(t);
      else noticeTimer.current = setTimeout(() => showNotice(t), i * 3000);
    });
  };

  /** Desktop AI Smart Search: ranks profiles for the query; "Best Match" sort while it is on; empty query clears it */
  const runAi = (raw: string) => {
    const q = raw.trim();
    setInput(q);
    if (!q) {
      if (!aiQuery) return;
      setAiQuery('');
      setAiResult(null);
      if (sort === 'relevance') setSort('experience');
      reload('Applying filters…');
      return;
    }
    const result = runAiSearch(pool, q);
    reload('Searching…', SEARCH_MS, () => {
      setAiQuery(q);
      setAiResult(result);
      setSort('relevance');
      const tips: string[] = [];
      if (result.negation)
        tips.push('Search tip: "not", "without" and similar words are not supported. AI search matches what the query mentions and cannot exclude it.');
      if (result.minYears !== null) tips.push(`Years filter applied: "${result.minYears}+ years of experience" enforced on AI results.`);
      else if (result.maxYears !== null) tips.push(`Years filter applied: up to ${result.maxYears} years of experience enforced on AI results.`);
      if (tips.length) showNotices(tips);
    });
  };

  /** Magnifier: Resume ID contains (desktop `resume_id` filter) */
  const searchResumeId = () => {
    const id = input.trim();
    if (id === resumeQuery) return;
    setResumeQuery(id);
    reload('Applying filters…');
  };

  const changeSort = (next: MarketplaceSort) => {
    if (next === sort) return;
    setSort(next);
    reload('Applying filters…');
  };

  const toggleSavedView = () => {
    setView((v) => (v === 'saved' ? 'available' : 'saved'));
    reload('Loading profiles…');
  };

  const toggleUpskilled = () => {
    setUpskilled((u) => !u);
    reload('Applying filters…');
  };

  const toggleSave = (p: HubProfile) => {
    const wasSaved = savedIds.includes(p.id);
    onToggleSave(p.id);
    showNotice(wasSaved ? 'Profile removed from your saved list.' : 'Profile added to your saved list.');
  };

  const toggleCompare = (p: HubProfile) => {
    if (compareIds.includes(p.id)) {
      onCompareChange(compareIds.filter((id) => id !== p.id));
      return;
    }
    if (compareIds.length >= MAX_COMPARE) {
      showNotice(`You can compare up to ${MAX_COMPARE} profiles at a time.`, true);
      return;
    }
    onCompareChange([...compareIds, p.id]);
  };

  const open = (p: HubProfile) => {
    if (canView) setOpenId(p.id);
  };

  /** Desktop `profilewise_timesheet_ajax`: open requirement → Request Interview; none → requirement made for you + Schedule */
  const startRequestToHire = (p: HubProfile) => {
    if (!canAdd) return;
    setHireId(p.id);
    setHireCreatesRequirement(!(hasOpenRequirementFor(requirements, p.profile) || hasRequirementFor(candidates, p.profile)));
    setSheet('schedule');
  };

  const schedule = (_pendingId: string, interview: ScheduledInterview) => {
    const p = hireProfile;
    if (!p) return;
    if (hireCreatesRequirement) onCreateRequirements(requirementsFromHub(p, requestToHireRequirement(p), isoOfDate(new Date())));
    const candidate = candidateFromProfile(p, { status: 'Interview Scheduled', interview });
    onRequestToHire(candidate);
    onCompareChange(compareIds.filter((id) => id !== p.id));
    setScheduledCandidateId(candidate.id);
    setSheet('scheduled');
  };

  const finishScheduled = (id: string, attendees: string[]) => {
    const c = candidates.find((x) => x.id === id);
    if (c?.interview) onUpdateCandidate(id, { interview: { ...c.interview, attendees } });
    setSheet(null);
    const created = hireCreatesRequirement ? 'Requirement created. ' : '';
    showNotice(
      attendees.length
        ? `${created}Calendar invites sent to you and ${attendees.length} more ${attendees.length === 1 ? 'attendee' : 'attendees'}.`
        : `${created}Interview scheduled. A calendar invite was sent to you.`,
    );
  };

  // Candidate shown in the scheduler before it exists in the list: the name stays hidden, only the Resume ID is shown
  const pendingCandidate = useMemo(() => (hireProfile ? candidateFromProfile(hireProfile, { name: `Resume ${hireProfile.resumeId}` }) : null), [hireProfile]);
  const hireRequirement = hireProfile ? requestToHireRequirement(hireProfile) : null;

  /* ---------- Applied chips (desktop "Applied:" row) ---------- */

  const without = (key: keyof MarketplaceFilters, value: string) => applyFilters({ ...filters, [key]: (filters[key] as string[]).filter((v) => v !== value) });
  const clearProfileLock = () => {
    setProfileLock(null);
    reload('Applying filters…');
  };
  const clearResumeQuery = () => {
    setResumeQuery('');
    setInput('');
    reload('Applying filters…');
  };
  const chips: { key: string; group: string; label: string; clear: () => void }[] = [
    ...(aiActive ? [{ key: 'ai', group: 'AI Search', label: aiQuery, clear: () => runAi('') }] : []),
    ...(!saved && upskilled ? [{ key: 'up', group: 'Filter', label: 'AI-Upskilled', clear: toggleUpskilled }] : []),
    ...(lock ? [{ key: 'profile', group: 'Profile', label: lock, clear: clearProfileLock }] : []),
    ...(resumeQuery ? [{ key: 'rid', group: 'Resume ID', label: resumeQuery, clear: clearResumeQuery }] : []),
    ...filters.countries.map((v) => ({ key: `c-${v}`, group: 'Country', label: v, clear: () => without('countries', v) })),
    ...filters.domains.map((v) => ({ key: `d-${v}`, group: 'Domain', label: v, clear: () => without('domains', v) })),
    ...filters.skills.map((v) => ({ key: `s-${v}`, group: 'Skill', label: v, clear: () => without('skills', v) })),
    ...filters.availability.map((v) => ({ key: `a-${v}`, group: 'Availability', label: labelOfRange(AVAILABILITY_OPTIONS, v), clear: () => without('availability', v) })),
    ...filters.cost.map((v) => ({ key: `$-${v}`, group: 'Cost', label: labelOfRange(COST_OPTIONS, v), clear: () => without('cost', v) })),
    ...filters.experience.map((v) => ({ key: `e-${v}`, group: 'Experience', label: labelOfRange(EXPERIENCE_OPTIONS, v), clear: () => without('experience', v) })),
    ...filters.qualifications.map((v) => ({ key: `q-${v}`, group: 'Qualification', label: v, clear: () => without('qualifications', v) })),
    ...filters.workModes.map((v) => ({ key: `w-${v}`, group: 'Work mode', label: v, clear: () => without('workModes', v) })),
  ];

  /* ---------- Card ---------- */

  const card = (p: HubProfile) => {
    const r = p.resume;
    const isSaved = savedIds.includes(p.id);
    const inCompare = compareIds.includes(p.id);
    const compareLocked = !inCompare && compareIds.length >= MAX_COMPARE;
    const experience = experienceLabel(p);
    const minutes = cpeMinutes(p);
    const assessment = avgAssessment(p);
    const qualification = r.qualifications.join(', ');
    const skills = cardSkillsOf(p);
    const more = skills.length - CARD_SKILL_LIMIT;
    const price = priceParts(p);
    const match = aiActive ? scores[p.id] : undefined;
    const isExpanded = expanded.includes(p.id);
    const longInsights = p.aiInsights.some((b) => b.length > 95);
    const stats = [
      ...(experience ? [{ key: 'exp', icon: Briefcase, label: 'Experience', value: experience }] : []),
      ...(minutes > 0 ? [{ key: 'cpe', icon: GraduationCap, label: 'Learning Hours', value: cpeLabel(minutes) }] : []),
      ...(assessment !== null ? [{ key: 'avg', icon: CircleCheck, label: 'Avg. assessment', value: `${assessment}%` }] : []),
      ...(qualification ? [{ key: 'qual', icon: IdCard, label: 'Qualification', value: qualification }] : []),
    ];

    return (
      <li key={p.id}>
        <article
          className={`bg-white rounded-2xl shadow-2xs border transition-colors ${inCompare ? 'border-[#2F68FE] ring-1 ring-[#2F68FE]' : 'border-[#EBF0F7]'}`}
          aria-label={`${p.profile} (${p.resumeId})`}
        >
          <div className="p-4">
            <div className="flex items-start gap-2">
              <button
                type="button"
                onClick={() => open(p)}
                disabled={!canView}
                aria-label={canView ? `${p.profile} (${p.resumeId}). View profile` : undefined}
                className="flex-1 min-w-0 flex items-start gap-3 text-left rounded-xl -m-1 p-1 enabled:active:bg-slate-50 enabled:cursor-pointer disabled:cursor-default transition-colors focus-visible:outline-2 focus-visible:outline-[#2F68FE]"
              >
                <DomainTile domain={p.domain} vetted={r.backgroundVerified} />
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-bold text-[#1E293B] leading-snug">{p.profile}</span>
                  <span className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-600">{p.domain}</span>
                    <span className="text-slate-300" aria-hidden="true">•</span>
                    <span>{r.level}</span>
                    <span className="text-slate-300" aria-hidden="true">•</span>
                    <span className="inline-flex items-center gap-1">
                      <CountryFlag country={p.country} />
                      {p.country || NOT_SPECIFIED}
                    </span>
                    <span className="text-slate-300" aria-hidden="true">•</span>
                    <span className="text-slate-400 tabular-nums"># {p.resumeId}</span>
                  </span>
                  {match !== undefined && (
                    <span className="mt-1.5 flex">
                      <MatchBadge pct={match} />
                    </span>
                  )}
                </span>
              </button>
              {canAdd && (
                <button
                  type="button"
                  onClick={() => toggleSave(p)}
                  aria-pressed={isSaved}
                  aria-label={isSaved ? `Remove ${p.resumeId} from saved profiles` : `Save profile ${p.resumeId}`}
                  className={`w-9 h-9 -mt-0.5 -mr-1 rounded-xl border flex items-center justify-center shrink-0 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2F68FE] ${
                    isSaved ? 'text-[#2F68FE] bg-blue-50 border-blue-100' : 'text-slate-400 bg-white border-slate-200 active:bg-slate-100'
                  }`}
                >
                  {isSaved ? <BookmarkCheck className="w-[18px] h-[18px]" /> : <Bookmark className="w-[18px] h-[18px]" />}
                </button>
              )}
            </div>

            {stats.length > 0 && (
              <dl className="mt-3.5 grid grid-cols-2 gap-x-3 gap-y-3">
                {stats.map((s, i) => {
                  const Icon = s.icon;
                  // An odd last stat takes the whole row; long qualifications stay on two lines (full list on the profile)
                  const wide = stats.length % 2 === 1 && i === stats.length - 1;
                  return (
                    <div key={s.key} className={`min-w-0 flex items-center gap-2 ${wide ? 'col-span-2' : ''}`}>
                      <span className="w-8 h-8 rounded-lg bg-[#EEF2FF] text-[#2F68FE] flex items-center justify-center shrink-0" aria-hidden="true">
                        <Icon className="w-4 h-4" />
                      </span>
                      <span className="min-w-0">
                        <dt className="text-[10px] font-medium text-slate-400 leading-tight">{s.label}</dt>
                        <dd className={`text-xs font-bold text-[#1E293B] leading-snug tabular-nums break-words ${wide ? '' : 'line-clamp-2'}`} title={s.value}>
                          {s.value}
                        </dd>
                      </span>
                    </div>
                  );
                })}
              </dl>
            )}

            <div className="mt-3 flex flex-wrap gap-1.5">
              <JoinsChip days={p.noticeDays} />
              {isAiUpskilled(p) && <AiUpskilledChip />}
            </div>

            {p.aiInsights.length > 0 ? (
              <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[#7C3AED]">
                  <WandSparkles className="w-3.5 h-3.5" aria-hidden="true" />
                  AI Insights
                </p>
                <ul className="mt-2 space-y-1.5" id={`tm-insights-${p.id}`}>
                  {p.aiInsights.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-[11px] text-slate-600 leading-snug">
                      <Check className="w-3.5 h-3.5 mt-px text-[#7C3AED] shrink-0" aria-hidden="true" />
                      <span className={isExpanded ? '' : 'line-clamp-2'}>{b}</span>
                    </li>
                  ))}
                </ul>
                {longInsights && (
                  <button
                    type="button"
                    onClick={() => setExpanded((e) => (e.includes(p.id) ? e.filter((x) => x !== p.id) : [...e, p.id]))}
                    aria-expanded={isExpanded}
                    aria-controls={`tm-insights-${p.id}`}
                    className="mt-1.5 h-7 px-1 -ml-1 rounded-md text-[11px] font-bold text-[#2F68FE] active:bg-blue-50/50 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2F68FE]"
                  >
                    {isExpanded ? 'Show less' : 'Show more'}
                  </button>
                )}
              </div>
            ) : (
              r.summary && (
                <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                    Summary
                  </p>
                  <p className="mt-1.5 text-[11px] text-slate-600 leading-snug line-clamp-3">{summarySnippet(r.summary)}</p>
                </div>
              )
            )}

            {skills.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Key skills">
                {skills.slice(0, CARD_SKILL_LIMIT).map((s) => (
                  <li key={s} className="max-w-full px-2.5 py-1 rounded-lg bg-slate-100 text-[11px] font-semibold text-slate-600 leading-snug truncate">
                    {s}
                  </li>
                ))}
                {more > 0 && (
                  <li>
                    <button
                      type="button"
                      onClick={() => open(p)}
                      disabled={!canView}
                      aria-label={`View all ${skills.length} skills`}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 text-[11px] font-bold text-[#2F68FE] leading-snug enabled:active:bg-blue-100 enabled:cursor-pointer disabled:cursor-default focus-visible:outline-2 focus-visible:outline-[#2F68FE]"
                    >
                      +{more}
                    </button>
                  </li>
                )}
              </ul>
            )}
          </div>

          <div className="px-4 py-3 border-t border-slate-100 flex items-center gap-2">
            <p className="flex-1 min-w-0 tabular-nums">
              <span className="text-base font-extrabold text-[#1E293B]">{price.amount}</span> <span className="text-[11px] font-semibold text-slate-400">{price.unit}</span>
            </p>
            <button
              type="button"
              role="checkbox"
              aria-checked={inCompare}
              aria-label={`Compare ${p.profile} (${p.resumeId})`}
              onClick={() => toggleCompare(p)}
              className={`h-9 px-2 rounded-xl flex items-center gap-1.5 text-[11px] font-semibold active:bg-slate-50 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2F68FE] ${
                compareLocked ? 'text-slate-400' : 'text-slate-600'
              }`}
            >
              <CheckMark on={inCompare} muted={compareLocked} />
              Compare
            </button>
            {canView && (
              <button
                type="button"
                onClick={() => open(p)}
                aria-label={`View profile ${p.resumeId}`}
                className="h-9 px-3.5 rounded-xl bg-[#2F68FE] text-white text-xs font-bold shadow-xs active:bg-[#1D4ED8] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]"
              >
                View Profile
              </button>
            )}
          </div>
        </article>
      </li>
    );
  };

  const pill = (on: boolean, onClick: () => void, icon: React.ReactNode, label: string, count: number) => (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`shrink-0 h-8 pl-3 pr-1.5 rounded-full border text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE] ${
        on ? 'bg-[#2F68FE] border-[#2F68FE] text-white' : 'bg-white border-slate-200 text-slate-600 active:bg-slate-50'
      }`}
    >
      {icon}
      {label}
      <span className={`min-w-5 h-5 px-1 rounded-full text-[10px] font-bold flex items-center justify-center tabular-nums ${on ? 'bg-white text-[#2F68FE]' : 'bg-slate-100 text-slate-500'}`}>
        {count}
      </span>
    </button>
  );

  const sortOptions = aiActive ? [BEST_MATCH_OPTION, ...SORT_OPTIONS] : SORT_OPTIONS;

  return (
    <div className="relative flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      <ScreenHeader title={saved ? 'Saved Resumes' : 'Talent Marketplace'} onBack={onBack} />
      {notice}

      <div ref={listRef} inert={Boolean(openProfile)} className="flex-1 overflow-y-auto no-scrollbar pb-6">
        <div className="px-4 pt-3.5">
          <p className="text-xs text-slate-500 leading-relaxed">
            Browse pre-vetted offshore tax, audit &amp; accounting talent, filter by domain, skills, cost &amp; availability.
          </p>

          <section className="mt-3 p-2 rounded-2xl bg-white border border-[#EBF0F7] shadow-2xs" aria-label="Search talent">
            <div role="search" className="flex items-center gap-1 pr-1 rounded-xl bg-slate-50 border border-slate-200 focus-within:bg-white focus-within:border-[#2F68FE] focus-within:ring-4 focus-within:ring-blue-50 transition-colors">
              <button
                type="button"
                onClick={searchResumeId}
                aria-label="Search by Resume ID"
                className="w-11 h-11 rounded-xl flex items-center justify-center text-[#2F68FE] active:bg-blue-50 shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2F68FE]"
              >
                <Search className="w-[18px] h-[18px]" />
              </button>
              <SmartSearchInput
                value={input}
                onChange={setInput}
                onEnter={() => (saved ? searchResumeId() : runAi(input))}
                animate={!saved}
                staticPlaceholder="Search by Resume ID"
              />
              {input && (
                <button
                  type="button"
                  onClick={() => setInput('')}
                  aria-label="Clear search text"
                  className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 shrink-0 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {!saved && (
              <button
                type="button"
                onClick={() => runAi(input)}
                disabled={loading === 'Searching…'}
                className="mt-2 w-full h-11 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs active:bg-[#1D4ED8] transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-wait focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]"
              >
                {loading === 'Searching…' ? <Loader2 className="w-4 h-4 animate-spin" /> : <WandSparkles className="w-4 h-4" />}
                AI Smart Search
              </button>
            )}
          </section>

          {!saved && !aiActive && (
            <div className="mt-3 -mx-4 px-4 flex items-center gap-1.5 overflow-x-auto no-scrollbar" role="group" aria-label="Try a search">
              <span className="shrink-0 text-[11px] font-semibold text-slate-400">Try:</span>
              {TRY_QUERIES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => runAi(t)}
                  className="shrink-0 h-8 px-3 rounded-full border border-blue-100 bg-blue-50 text-[11px] font-semibold text-[#2F68FE] active:bg-blue-100 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]"
                >
                  {t}
                </button>
              ))}
            </div>
          )}

          {chips.length > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <span className="shrink-0 text-[11px] font-semibold text-slate-400">Applied:</span>
              <ul className="flex-1 min-w-0 flex gap-1.5 overflow-x-auto no-scrollbar" aria-label="Applied filters">
                {chips.map((c) => (
                  <li key={c.key} className="shrink-0">
                    <span className="h-7 pl-2.5 pr-0.5 rounded-full bg-blue-50 border border-blue-100 text-[11px] text-[#2F68FE] flex items-center gap-1 max-w-[240px]">
                      <span className="font-medium text-[#2F68FE]/70 shrink-0">{c.group}:</span>
                      <span className="font-semibold truncate">{c.label}</span>
                      <button
                        type="button"
                        onClick={c.clear}
                        aria-label={`Remove filter ${c.group}: ${c.label}`}
                        className="w-6 h-6 rounded-full flex items-center justify-center active:bg-blue-100 shrink-0 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
              <button type="button" onClick={clearAll} className="shrink-0 h-7 px-1 text-[11px] font-bold text-[#2F68FE] cursor-pointer">
                Clear all
              </button>
            </div>
          )}
        </div>

        <div className="sticky top-0 z-10 mt-3 px-4 py-2.5 bg-[#F8FAFC]/95 backdrop-blur-sm border-b border-[#EBF0F7] flex items-center gap-2">
          <div className="flex-1 min-w-0 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {pill(saved, toggleSavedView, saved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />, 'Saved', savedPool.length)}
            {!saved && pill(upskilled, toggleUpskilled, <WandSparkles className={`w-3.5 h-3.5 ${upskilled ? '' : 'text-[#7C3AED]'}`} />, 'AI-Upskilled', upskilledCount)}
          </div>
          <FilterIconButton count={filterCount} onClick={() => setSheet('filter')} />
        </div>

        <div className="px-4 pt-3 flex items-center gap-3">
          <p className="flex-1 min-w-0 text-xs text-slate-500 tabular-nums" aria-live="polite">
            {loading ? (
              <span className="inline-flex items-center gap-1.5 font-semibold text-[#2F68FE]">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {loading}
              </span>
            ) : (
              <>
                Showing <strong className="font-bold text-[#1E293B]">{visible.length}</strong> of {results.length} profiles
              </>
            )}
          </p>
          <div className="w-[168px] shrink-0">
            <Dropdown
              ariaLabel="Sort By"
              sheetTitle="Sort By"
              value={effectiveSort}
              options={sortOptions}
              onChange={(v) => changeSort(v as MarketplaceSort)}
            />
          </div>
        </div>

        <div className="px-4 mt-3">
          {loading ? (
            <MarketplaceSkeleton label={loading} />
          ) : !saved && pool.length === 0 ? (
            <EmptyCard
              icon={Store}
              title="No profiles available right now"
              text="New profiles are added regularly. Your account manager can also share profiles that match your needs."
              action={
                <button
                  type="button"
                  onClick={onContactManager}
                  className="mt-4 h-10 px-4 rounded-xl border border-[#2F68FE] bg-white text-[#2F68FE] text-xs font-bold flex items-center gap-1.5 active:bg-blue-50 cursor-pointer"
                >
                  <Headset className="w-4 h-4" />
                  Contact Account Manager
                </button>
              }
            />
          ) : saved && savedPool.length === 0 ? (
            <EmptyCard
              icon={Bookmark}
              title="No saved profiles yet"
              text="Tap the bookmark on a profile to keep it here for later."
              action={
                <button
                  type="button"
                  onClick={toggleSavedView}
                  className="mt-4 h-10 px-4 rounded-xl border border-[#2F68FE] bg-white text-[#2F68FE] text-xs font-bold active:bg-blue-50 cursor-pointer"
                >
                  Browse Talent Marketplace
                </button>
              }
            />
          ) : results.length === 0 ? (
            <EmptyCard
              icon={SearchX}
              title="No profiles match your filters"
              text="Try removing a filter or widening your cost and experience range."
              action={
                !saved && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="mt-4 h-10 px-4 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] cursor-pointer"
                  >
                    Clear all filters
                  </button>
                )
              }
            />
          ) : (
            <>
              <ul className="space-y-3">{visible.map(card)}</ul>

              {visible.length < results.length ? (
                <button
                  type="button"
                  disabled={moreLoading}
                  onClick={() => {
                    setMoreLoading(true);
                    setTimeout(() => {
                      setPages((n) => n + 1);
                      setMoreLoading(false);
                    }, LOAD_MS);
                  }}
                  className="mt-3 w-full h-11 rounded-xl border border-slate-200 bg-white shadow-2xs text-xs font-bold text-[#2F68FE] flex items-center justify-center gap-2 active:bg-slate-50 disabled:cursor-wait transition-colors cursor-pointer"
                >
                  {moreLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {moreLoading ? 'Loading more profiles…' : 'Load More'}
                </button>
              ) : (
                <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                  <CircleCheckBig className="w-3.5 h-3.5" aria-hidden="true" />
                  You&apos;ve reached the end of the results.
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {compareIds.length > 0 && !openProfile && <CompareBar count={compareIds.length} onClear={() => onCompareChange([])} onOpen={() => setSheet('compare')} />}

      {openProfile && (
        <TalentProfileView
          key={openProfile.id}
          profile={openProfile}
          backLabel={openId === entryProfileId && onBack ? 'Dashboard' : saved ? 'Saved Resumes' : 'Talent Marketplace'}
          shortlisted={requestedResumeIds.has(openProfile.resumeId)}
          saved={savedIds.includes(openProfile.id)}
          aiMatch={aiActive ? scores[openProfile.id] : null}
          canAdd={canAdd}
          canDownload={canDownload}
          compareCount={compareIds.length}
          inCompare={compareIds.includes(openProfile.id)}
          onToggleCompare={() => toggleCompare(openProfile)}
          onOpenCompare={() => setSheet('compare')}
          onClearCompare={() => onCompareChange([])}
          onBack={() => (openId === entryProfileId && onBack ? onBack() : setOpenId(null))}
          onToggleSave={() => toggleSave(openProfile)}
          onRequestToHire={() => startRequestToHire(openProfile)}
          onOpenShortlisted={onOpenShortlisted}
          onNotice={(text, error) => showNotice(text, error)}
        />
      )}

      <MarketplaceFilterSheet
        isOpen={sheet === 'filter'}
        filters={filters}
        options={options}
        countOf={countOf}
        onClose={() => setSheet(null)}
        onApply={(next) => {
          setSheet(null);
          applyFilters(next);
        }}
      />

      <CompareSheet
        isOpen={sheet === 'compare'}
        profiles={compareProfiles}
        currentId={openProfile?.id ?? null}
        canView={canView}
        onView={(id) => {
          setSheet(null);
          setOpenId(id);
        }}
        onClose={() => setSheet(null)}
      />

      <InterviewScheduleSheet
        isOpen={sheet === 'schedule'}
        candidate={pendingCandidate}
        mode="request"
        title={hireCreatesRequirement ? 'Request to Hire' : undefined}
        notice={
          hireCreatesRequirement && hireProfile && hireRequirement ? (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 leading-relaxed">
              <p className="font-bold text-[#1E293B]">A staff requirement will be created for you</p>
              <p className="mt-1">
                {hireProfile.profile} ({hireProfile.resume.level}) · {hireRequirement.hoursPerWeek} Hours/Week · {TIMELINE_OPTIONS[0]} · {hireRequirement.staffCount} staff ·
                Expected start {formatShortDate(hireRequirement.startDate)}
              </p>
            </div>
          ) : undefined
        }
        onClose={() => setSheet(null)}
        onSchedule={schedule}
      />

      <InterviewScheduledSheet isOpen={sheet === 'scheduled'} candidate={scheduledCandidate} onDone={finishScheduled} />
    </div>
  );
};
