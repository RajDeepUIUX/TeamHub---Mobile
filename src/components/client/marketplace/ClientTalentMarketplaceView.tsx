import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDownUp,
  Bookmark,
  BookmarkCheck,
  Briefcase,
  Check,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  CircleCheckBig,
  FileText,
  Filter,
  GraduationCap,
  Headset,
  IdCard,
  Loader2,
  Search,
  SearchX,
  Store,
  WandSparkles,
  Wrench,
  X,
} from 'lucide-react';
import { BottomSheet } from '../../common/BottomSheet';
import { useClientPermission } from '../context/ClientPermissionContext';
import { EmptyCard, ScreenHeader, SheetHeader } from '../staff/tabs/StaffTabParts';
import { useTimesheetNotice } from '../timesheets/TimesheetParts';
import { InterviewScheduleSheet, InterviewScheduledSheet } from '../interviews/InterviewScheduleSheet';
import { ScheduledInterview, ShortlistedCandidate, formatShortDate, isoOfDate } from '../data/clientInterviewsData';
import { StaffRequirement, TIMELINE_OPTIONS, hasOpenRequirementFor, requirementsFromHub } from '../data/clientRequirementsData';
import {
  AVAILABILITY_OPTIONS,
  AiSearchResult,
  BEST_MATCH_OPTION,
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
  // Card whose AI Insights or Key Skills sheet is open
  const [detail, setDetail] = useState<{ id: string; kind: 'insights' | 'skills' } | null>(null);
  const [entryProfileId] = useState(canView ? (initialProfileId ?? null) : null);
  const [openId, setOpenId] = useState<string | null>(entryProfileId);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [sortOpen, setSortOpen] = useState(false);
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
    const hasInsights = p.aiInsights.length > 0 || Boolean(r.summary);
    const price = priceParts(p);
    const match = aiActive ? scores[p.id] : undefined;
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

            {(hasInsights || skills.length > 0) && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {hasInsights && (
                  <button
                    type="button"
                    onClick={() => setDetail({ id: p.id, kind: 'insights' })}
                    aria-haspopup="dialog"
                    aria-label={p.aiInsights.length ? `AI Insights for ${p.resumeId} (${p.aiInsights.length})` : `Summary of ${p.resumeId}`}
                    className={`h-10 pl-2.5 pr-1.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-1.5 text-left active:bg-slate-100 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2F68FE] ${
                      skills.length ? '' : 'col-span-2'
                    }`}
                  >
                    {p.aiInsights.length ? (
                      <WandSparkles className="w-4 h-4 text-[#7C3AED] shrink-0" aria-hidden="true" />
                    ) : (
                      <FileText className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                    )}
                    <span className={`flex-1 min-w-0 truncate text-[11px] font-bold ${p.aiInsights.length ? 'text-[#7C3AED]' : 'text-slate-600'}`}>
                      {p.aiInsights.length ? 'AI Insights' : 'Summary'}
                    </span>
                    {p.aiInsights.length > 0 && (
                      <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#F5F3FF] text-[10px] font-bold text-[#7C3AED] flex items-center justify-center tabular-nums">
                        {p.aiInsights.length}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                  </button>
                )}
                {skills.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setDetail({ id: p.id, kind: 'skills' })}
                    aria-haspopup="dialog"
                    aria-label={`Key skills of ${p.resumeId} (${skills.length})`}
                    className={`h-10 pl-2.5 pr-1.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-1.5 text-left active:bg-slate-100 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2F68FE] ${
                      hasInsights ? '' : 'col-span-2'
                    }`}
                  >
                    <Wrench className="w-4 h-4 text-[#2F68FE] shrink-0" aria-hidden="true" />
                    <span className="flex-1 min-w-0 truncate text-[11px] font-bold text-[#1E293B]">Key Skills</span>
                    <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-blue-50 text-[10px] font-bold text-[#2F68FE] flex items-center justify-center tabular-nums">
                      {skills.length}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                  </button>
                )}
              </div>
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
      className={`shrink-0 h-7 pl-2.5 pr-1 rounded-full border text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE] ${
        on ? 'bg-[#2F68FE] border-[#2F68FE] text-white' : 'bg-white border-slate-200 text-slate-600 active:bg-slate-50'
      }`}
    >
      {icon}
      {label}
      <span className={`min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center tabular-nums ${on ? 'bg-white text-[#2F68FE]' : 'bg-slate-100 text-slate-500'}`}>
        {count}
      </span>
    </button>
  );

  const sortOptions = aiActive ? [BEST_MATCH_OPTION, ...SORT_OPTIONS] : SORT_OPTIONS;
  const sortLabel = sortOptions.find((o) => o.value === effectiveSort)?.label;
  const detailProfile = profileOf(detail?.id ?? null);
  const detailSkills = detailProfile ? cardSkillsOf(detailProfile) : [];
  const closeDetail = () => setDetail(null);
  const detailFooter =
    canView && detailProfile ? (
      <div className="p-4 pt-3 pb-6 border-t border-slate-100 shrink-0">
        <button
          type="button"
          onClick={() => {
            closeDetail();
            open(detailProfile);
          }}
          className="w-full h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold shadow-xs active:bg-[#1D4ED8] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]"
        >
          View Profile
        </button>
      </div>
    ) : null;

  return (
    <div className="relative flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      <ScreenHeader title={saved ? 'Saved Resumes' : 'Talent Marketplace'} onBack={onBack} />
      {notice}

      <div ref={listRef} inert={Boolean(openProfile)} className="flex-1 overflow-y-auto no-scrollbar pb-6">
        <div className="px-4 pt-3">
          <p className="text-[11px] text-slate-500 leading-snug">
            Browse pre-vetted offshore tax, audit &amp; accounting talent, filter by domain, skills, cost &amp; availability.
          </p>

          <div
            role="search"
            aria-label="Search talent"
            className="mt-2.5 h-11 flex items-center gap-1 pr-1 rounded-xl bg-white border border-slate-200 shadow-2xs focus-within:border-[#2F68FE] focus-within:ring-4 focus-within:ring-blue-50 transition-colors"
          >
            <button
              type="button"
              onClick={searchResumeId}
              aria-label="Search by Resume ID"
              className="w-9 h-9 ml-0.5 rounded-lg flex items-center justify-center text-[#2F68FE] active:bg-blue-50 shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2F68FE]"
            >
              <Search className="w-4 h-4" />
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
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            {!saved && (
              <button
                type="button"
                onClick={() => runAi(input)}
                disabled={loading === 'Searching…'}
                className="h-8 px-2.5 rounded-lg bg-[#2F68FE] text-white text-[11px] font-bold flex items-center gap-1.5 shrink-0 active:bg-[#1D4ED8] transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-wait focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]"
              >
                {loading === 'Searching…' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <WandSparkles className="w-3.5 h-3.5" />}
                AI Smart Search
              </button>
            )}
          </div>

          {!saved && !aiActive && (
            <div className="mt-2 -mx-4 px-4 flex items-center gap-1.5 overflow-x-auto no-scrollbar" role="group" aria-label="Try a search">
              <span className="shrink-0 text-[10px] font-semibold text-slate-400">Try:</span>
              {TRY_QUERIES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => runAi(t)}
                  className="shrink-0 h-7 px-2.5 rounded-full border border-blue-100 bg-blue-50 text-[11px] font-semibold text-[#2F68FE] active:bg-blue-100 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]"
                >
                  {t}
                </button>
              ))}
            </div>
          )}

          {chips.length > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <span className="shrink-0 text-[10px] font-semibold text-slate-400">Applied:</span>
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

        <div className="sticky top-0 z-10 mt-2.5 px-4 py-2 bg-[#F8FAFC]/95 backdrop-blur-sm border-b border-[#EBF0F7] flex items-center gap-2">
          <div className="flex-1 min-w-0 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {pill(saved, toggleSavedView, saved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />, 'Saved', savedPool.length)}
            {!saved && pill(upskilled, toggleUpskilled, <WandSparkles className={`w-3.5 h-3.5 ${upskilled ? '' : 'text-[#7C3AED]'}`} />, 'AI-Upskilled', upskilledCount)}
          </div>
          <button
            type="button"
            onClick={() => setSheet('filter')}
            aria-label={filterCount ? `Filters (${filterCount} applied)` : 'Filters'}
            className={`relative w-9 h-9 rounded-xl border flex items-center justify-center shadow-2xs transition-colors shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE] ${
              filterCount ? 'bg-blue-50 border-[#2F68FE] text-[#2F68FE]' : 'bg-white border-slate-200 text-[#2F68FE] active:bg-slate-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            {filterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-4.5 h-4.5 px-1 rounded-full bg-[#2F68FE] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-[#F8FAFC] tabular-nums">
                {filterCount}
              </span>
            )}
          </button>
        </div>

        <div className="px-4 pt-2 flex items-center gap-2">
          <p className="flex-1 min-w-0 text-[11px] text-slate-500 tabular-nums" aria-live="polite">
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
          <button
            type="button"
            onClick={() => setSortOpen(true)}
            aria-haspopup="dialog"
            aria-label={`Sort By: ${sortLabel}`}
            className="h-8 -mr-1.5 px-1.5 rounded-lg flex items-center gap-1 text-[11px] text-slate-500 active:bg-slate-100 shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2F68FE]"
          >
            <ArrowDownUp className="w-3.5 h-3.5 text-slate-400" />
            Sort:
            <span className="font-bold text-[#1E293B]">{sortLabel}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

        <div className="px-4 mt-2.5">
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

      <BottomSheet isOpen={sortOpen} onClose={() => setSortOpen(false)} maxHeight="max-h-[70%]">
        <SheetHeader title="Sort By" onClose={() => setSortOpen(false)} />
        <ul className="px-3 py-3 pb-6 space-y-1" role="radiogroup" aria-label="Sort By">
          {sortOptions.map((o) => {
            const on = o.value === effectiveSort;
            return (
              <li key={o.value}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => {
                    setSortOpen(false);
                    changeSort(o.value);
                  }}
                  className={`w-full min-h-11 px-3 rounded-xl flex items-center justify-between gap-3 text-left text-[13px] transition-colors cursor-pointer ${
                    on ? 'bg-blue-50 text-[#2F68FE] font-bold' : 'text-slate-700 font-medium active:bg-slate-50'
                  }`}
                >
                  {o.label}
                  {on && <Check className="w-4 h-4" />}
                </button>
              </li>
            );
          })}
        </ul>
      </BottomSheet>

      <BottomSheet isOpen={detail?.kind === 'insights' && detailProfile !== null} onClose={closeDetail} maxHeight="max-h-[80%]">
        <SheetHeader
          title={detailProfile?.aiInsights.length ? `AI Insights (${detailProfile.aiInsights.length})` : 'Summary'}
          subtitle={detailProfile ? `${detailProfile.profile} · # ${detailProfile.resumeId}` : undefined}
          onClose={closeDetail}
        />
        {detailProfile && (
          <>
            <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-4">
              {detailProfile.aiInsights.length > 0 ? (
                <ul className="space-y-2.5" aria-label="AI Insights">
                  {detailProfile.aiInsights.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed">
                      <Check className="w-3.5 h-3.5 mt-0.5 text-[#7C3AED] shrink-0" aria-hidden="true" />
                      {b}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-600 leading-relaxed">{summarySnippet(detailProfile.resume.summary)}</p>
              )}
            </div>
            {detailFooter}
          </>
        )}
      </BottomSheet>

      <BottomSheet isOpen={detail?.kind === 'skills' && detailProfile !== null} onClose={closeDetail} maxHeight="max-h-[80%]">
        <SheetHeader
          title={`Key Skills (${detailSkills.length})`}
          subtitle={detailProfile ? `${detailProfile.profile} · # ${detailProfile.resumeId}` : undefined}
          onClose={closeDetail}
        />
        {detailProfile && (
          <>
            <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-4">
              <ul className="flex flex-wrap gap-1.5" aria-label="Key skills">
                {detailSkills.map((sk) => (
                  <li key={sk} className="px-2.5 py-1 rounded-lg bg-slate-100 text-[11px] font-semibold text-slate-600 leading-snug">
                    {sk}
                  </li>
                ))}
              </ul>
            </div>
            {detailFooter}
          </>
        )}
      </BottomSheet>

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
