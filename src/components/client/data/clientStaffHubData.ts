/**
 * Mock data for Hire New Staff → Talent Marketplace (desktop `staffingMarketplace`, 2026-10 redesign): `index` = Talent
 * Marketplace, `linkedprofile` = Saved Resumes (the "Saved" pill), `ai_search` = AI Smart Search, `viewDetails` = Talent Profile,
 * `likeprofileAjax` / `unlikeprofileAjax` = Save, `profilewise_timesheet_ajax` + `profilerequestinterview` = Request to Hire.
 * Desktop shows the profile name + Resume ID only (no staff name) until the candidate is requested to hire. Profiles the client
 * already requested are hidden from the list (desktop `NOT IN shared staff ids`).
 * All names, resume IDs, companies, locations, insights and scores are dummy data.
 */
import { CLIENT_IS_MOS } from './clientTimesheetsData';
import { CandidateResume, ResumeJob, ShortlistedCandidate, formatExperience, isoOfDate } from './clientInterviewsData';

/* --------------------------------- Types ---------------------------------- */

export type HubWorkMode = 'WFH' | 'WFO' | 'Hybrid';
/** Desktop Work Mode filter order */
export const HUB_WORK_MODES: HubWorkMode[] = ['WFH', 'Hybrid', 'WFO'];

/** Desktop domain groups (`tbltimesheet_domains`, one id per country): icon follows the group */
export type MarketplaceDomain = 'Accounting & Advisory' | 'Audit' | 'Non Technical' | 'Specialized' | 'Tax';

/** Desktop Country filter: work location country; candidates without one are "Not specified" */
export const NOT_SPECIFIED = 'Not specified';

export interface CpeCourse {
  name: string;
  /** ISO date */
  completedOn: string;
  minutes: number;
  /** Desktop `is_ai_upskilled` course flag */
  ai: boolean;
}

export interface HubProfile {
  id: string;
  /** Not shown in the marketplace (desktop shows profile + Resume ID only); used once the candidate is requested to hire */
  name: string;
  /** Desktop "# J0…" (`job_code` / `reg_id`) */
  resumeId: string;
  domain: MarketplaceDomain;
  profile: string;
  workMode: HubWorkMode;
  /** Days to join; 0 = Immediate Joining (desktop `notice_period`) */
  noticeDays: number;
  /** Desktop "Notice Buyout Eligibility" (experienced-hiring resumes only) */
  buyoutDays?: number;
  /** Work location country ('' = Not specified) */
  country: string;
  /** Work location city ('' when unknown) */
  location: string;
  /** Monthly talent cost shown to MOS clients (`client_hub_role == 2`) */
  monthlyCost: number;
  hasPsychometricFile: boolean;
  /** Desktop "Available Till" (end of the candidate's shift, client time zone) */
  availableTill: string;
  /** Desktop Overtime Availability (per week) */
  overtimeRoundYear?: number;
  overtimeSeasonal?: number;
  /** Candidate's available interview ranges in IST */
  slotRangesIST: [string, string][];
  /** Desktop Technical Skills filter = parent skill categories (`tbltag_parent`) */
  skillCategories: string[];
  /** Desktop "AI Insights" bullets; empty → the card shows the Summary instead */
  aiInsights: string[];
  /** myCPE courses (Learning Hours, AI-Upskilled, Courses & Learning) */
  cpeCourses: CpeCourse[];
  /** Desktop "Other Countries" experience */
  otherExperience?: [number, number];
  resume: CandidateResume;
}

/** Desktop `getLevelArr` */
export const HUB_LEVELS = ['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5'];

/** Desktop loads 9 profiles per page ("Load More") */
export const HUB_PAGE_SIZE = 9;

/* ------------------------------ Filter options ----------------------------- */

export interface HubRangeOption {
  value: string;
  label: string;
}

/** Desktop "Availability" (notice period) */
export const AVAILABILITY_OPTIONS: HubRangeOption[] = [
  { value: '0-29', label: 'Under 30 days' },
  { value: '30-45', label: '30 - 45 Days' },
  { value: '46-60', label: '46 - 60 Days' },
  { value: '61-90', label: '61 - 90 Days' },
  { value: '91-99999', label: '90+ Days' },
];

/** Desktop "Talent Cost (USD/Hr)" (MOS clients: "Talent Cost (USD/Mo)") */
export const COST_OPTIONS: HubRangeOption[] = CLIENT_IS_MOS
  ? [
      { value: '0-700', label: 'Under $700' },
      { value: '701-1000', label: '$701 - $1000' },
      { value: '1001-1300', label: '$1001 - $1300' },
      { value: '1301-1500', label: '$1301 - $1500' },
      { value: '1501-1800', label: '$1501 - $1800' },
      { value: '1800-999999', label: '$1800+' },
    ]
  : [
      { value: '0-9', label: 'Under $10' },
      { value: '10-20', label: '$10 - $20' },
      { value: '21-30', label: '$21 - $30' },
      { value: '31-40', label: '$31 - $40' },
      { value: '41-50', label: '$41 - $50' },
      { value: '51-9999', label: '$50+' },
    ];

export const COST_FILTER_TITLE = CLIENT_IS_MOS ? 'Talent Cost (USD/Mo)' : 'Talent Cost (USD/Hr)';

/** Desktop "Experience" (whole years) */
export const EXPERIENCE_OPTIONS: HubRangeOption[] = [
  { value: '0-2', label: '0 - 2 yrs' },
  { value: '3-5', label: '3 - 5 yrs' },
  { value: '6-10', label: '6 - 10 yrs' },
  { value: '11-50', label: '11+ yrs' },
];

export const labelOfRange = (options: HubRangeOption[], value: string) => options.find((o) => o.value === value)?.label ?? value;

/** Every group is multi-select (desktop checkboxes; values in one group are OR'ed) */
export interface MarketplaceFilters {
  countries: string[];
  domains: string[];
  skills: string[];
  availability: string[];
  cost: string[];
  experience: string[];
  qualifications: string[];
  workModes: HubWorkMode[];
}

export const EMPTY_MARKETPLACE_FILTERS: MarketplaceFilters = {
  countries: [],
  domains: [],
  skills: [],
  availability: [],
  cost: [],
  experience: [],
  qualifications: [],
  workModes: [],
};

/** Filter button badge: every ticked box (desktop `updateBadge`) */
export const marketplaceFilterCount = (f: MarketplaceFilters) =>
  f.countries.length + f.domains.length + f.skills.length + f.availability.length + f.cost.length + f.experience.length + f.qualifications.length + f.workModes.length;

/** Desktop "Sort By"; "Best Match" is added (and selected) while an AI Smart Search is active */
export type MarketplaceSort = 'relevance' | 'experience' | 'cost-asc' | 'soonest' | 'cpe';
export const SORT_OPTIONS: { value: MarketplaceSort; label: string }[] = [
  { value: 'experience', label: 'Most Experienced' },
  { value: 'cost-asc', label: 'Lowest Cost' },
  { value: 'soonest', label: 'Soonest Available' },
  { value: 'cpe', label: 'Most CPE Hours' },
];
export const BEST_MATCH_OPTION = { value: 'relevance' as const, label: 'Best Match' };

/** Desktop "Try:" suggested queries */
export const TRY_QUERIES = ['Senior tax reviewer', 'Audit senior', 'Accounting manager', 'FP&A / Advisory'];

/** Desktop rotating search placeholder (typewriter), and the placeholder while the field has focus */
export const SEARCH_PLACEHOLDER_PHRASES = [
  'EA-qualified reviewer for S-corp and partnership returns',
  'Senior tax preparer who can review 1040 and 1065 returns',
  'Audit senior with US GAAP attest experience',
  'Accounting manager for full-cycle close and reporting',
  'Staff accountant to own month-end close',
  'FP&A analyst for forecasting and KPI dashboards',
];
export const SEARCH_FOCUS_PLACEHOLDER = 'Describe who you’re hiring for…';

/** Desktop compare cap */
export const MAX_COMPARE = 3;

/* --------------------------------- Display --------------------------------- */

const inRange = (value: number, range: string) => {
  const [from, to] = range.split('-').map(Number);
  return value >= from && value <= to;
};

/** Cost the filter, sort and card use: monthly talent cost for MOS clients, hourly otherwise */
export const rateValueOf = (p: HubProfile) => (CLIENT_IS_MOS ? p.monthlyCost : p.resume.hourlyRate);

/** Card price split for display: "$17" + "/ hr" (MOS: "USD 1,530" + "/ mo") */
export const priceParts = (p: HubProfile) =>
  CLIENT_IS_MOS ? { amount: `USD ${p.monthlyCost.toLocaleString('en-US')}`, unit: '/ mo' } : { amount: `$${p.resume.hourlyRate}`, unit: '/ hr' };

export const rateLabel = (p: HubProfile) => {
  const { amount, unit } = priceParts(p);
  return `${amount} ${unit}`;
};

const dayWord = (days: number) => `${days} ${days === 1 ? 'Day' : 'Days'}`;

/** Card chip: "Joins in 30 Days" / "Immediate Joining" */
export const joinsLabel = (days: number) => (days > 0 ? `Joins in ${dayWord(days)}` : 'Immediate Joining');

/** Profile: "Joining in 30 Days" / "Immediate Joining" */
export const joiningLabel = (days: number) => (days > 0 ? `Joining in ${dayWord(days)}` : 'Immediate Joining');

const pairMonths = (pair?: [number, number]) => (pair ? pair[0] * 12 + pair[1] : 0);

export const experienceMonths = (p: HubProfile) =>
  Object.values(p.resume.experience).reduce((sum, pair) => sum + pairMonths(pair), 0) + pairMonths(p.otherExperience);

/** Desktop `experience_display` ("23 Years", "22 Years 9 Months"); '' hides the stat */
export const experienceLabel = (p: HubProfile) => {
  const m = experienceMonths(p);
  return formatExperience([Math.floor(m / 12), m % 12]) ?? '';
};

/** Desktop per-country experience pills (Total Experience) */
export const experiencePills = (p: HubProfile) =>
  [
    { country: 'US', pair: p.resume.experience.us },
    { country: 'India', pair: p.resume.experience.india },
    { country: 'UK', pair: p.resume.experience.uk },
    { country: 'Canada', pair: p.resume.experience.canada },
    { country: 'Other Countries', pair: p.otherExperience },
  ]
    .map((e) => ({ country: e.country, value: formatExperience(e.pair) }))
    .filter((e): e is { country: string; value: string } => Boolean(e.value));

export const cpeMinutes = (p: HubProfile) => p.cpeCourses.reduce((sum, c) => sum + c.minutes, 0);

/** Desktop `formatCpeMinutes`: decimal hours ("77.5 hrs", "1 hrs") */
export const cpeLabel = (minutes: number) => {
  if (minutes <= 0) return '0 hrs';
  return `${Number((minutes / 60).toFixed(2))} hrs`;
};

/** "Continuously Upskilling on myCPE" banner: 30+ hours of courses completed this calendar year */
export const UPSKILL_BANNER_MINUTES = 1800;
export const currentYearCpeMinutes = (p: HubProfile, today = new Date()) =>
  p.cpeCourses.filter((c) => c.completedOn.startsWith(String(today.getFullYear()))).reduce((sum, c) => sum + c.minutes, 0);

export const aiCourses = (p: HubProfile) => p.cpeCourses.filter((c) => c.ai);
export const isAiUpskilled = (p: HubProfile) => p.cpeCourses.some((c) => c.ai);

/** Desktop "Avg. assessment" (null hides the stat) */
export const avgAssessment = (p: HubProfile) => {
  const list = p.resume.assessments;
  if (list.length === 0) return null;
  return Math.round(list.reduce((sum, a) => sum + a.scorePct, 0) / list.length);
};

/** Card "Key Skills": technical skills followed by software */
export const cardSkillsOf = (p: HubProfile) => [...new Set([...p.resume.technicalSkills, ...p.resume.softwareSkills])];

/** Chips the desktop card shows before "+N" */
export const CARD_SKILL_LIMIT = 5;

/** Desktop card Summary fallback (`truncate:220`) */
export const summarySnippet = (text: string, limit = 220) => {
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit);
  const space = cut.lastIndexOf(' ');
  return `${space > 0 ? cut.slice(0, space) : cut}...`;
};

/** Desktop MOS "Talent Cost" breakdown: fixed + variable components add up to the compensation package */
export const costBreakdownOf = (p: HubProfile) => {
  const total = p.monthlyCost;
  const night = Math.round(total * 0.06);
  const bonus = Math.round(total * 0.06);
  const pto = Math.round(total * 0.04);
  const ot = Math.round(total * 0.04);
  const variable = night + bonus + pto + ot;
  return { fixed: total - variable, night, bonus, pto, ot, variable, total };
};

/* -------------------------------- Filtering -------------------------------- */

const anyOf = (wanted: string[], have: string[]) => wanted.length === 0 || wanted.some((w) => have.includes(w));
const anyRange = (ranges: string[], value: number) => ranges.length === 0 || ranges.some((r) => inRange(value, r));

export const countryOf = (p: HubProfile) => p.country || NOT_SPECIFIED;

export interface MarketplaceQuery {
  filters: MarketplaceFilters;
  /** Magnifier search: Resume ID contains (desktop `job_code LIKE %…%`) */
  resumeId: string;
  /** Staff Requirement / Pricing link: profile of the requirement (desktop `selected_profile_id`) */
  profile: string | null;
  /** AI-Upskilled pill */
  upskilled: boolean;
}

export const matchesMarketplace = (p: HubProfile, q: MarketplaceQuery) => {
  const f = q.filters;
  const id = q.resumeId.trim().toLowerCase();
  if (id && !p.resumeId.toLowerCase().includes(id)) return false;
  if (q.profile && p.profile !== q.profile) return false;
  if (q.upskilled && !isAiUpskilled(p)) return false;
  if (f.countries.length && !f.countries.includes(countryOf(p))) return false;
  if (f.domains.length && !f.domains.includes(p.domain)) return false;
  if (!anyOf(f.skills, p.skillCategories)) return false;
  if (!anyRange(f.availability, p.noticeDays)) return false;
  if (!anyRange(f.cost, rateValueOf(p))) return false;
  if (!anyRange(f.experience, Math.floor(experienceMonths(p) / 12))) return false;
  if (!anyOf(f.qualifications, p.resume.qualifications)) return false;
  if (f.workModes.length && !f.workModes.includes(p.workMode)) return false;
  return true;
};

/** Desktop `usort`: ties keep the newest profile first */
export const sortProfiles = (list: HubProfile[], sort: MarketplaceSort, scores: Record<string, number> = {}) =>
  [...list].sort((a, b) => {
    let cmp = 0;
    // Equal matches: the more experienced profile first
    if (sort === 'relevance') cmp = (scores[b.id] ?? 0) - (scores[a.id] ?? 0) || experienceMonths(b) - experienceMonths(a);
    else if (sort === 'cost-asc') cmp = rateValueOf(a) - rateValueOf(b);
    else if (sort === 'soonest') cmp = a.noticeDays - b.noticeDays;
    else if (sort === 'cpe') cmp = cpeMinutes(b) - cpeMinutes(a);
    else cmp = experienceMonths(b) - experienceMonths(a);
    return cmp !== 0 ? cmp : Number(b.id.replace(/\D/g, '')) - Number(a.id.replace(/\D/g, ''));
  });

/* ----------------------------- AI Smart Search ----------------------------- */

const STOP_WORDS = new Set(
  'a an the to for and or of with who can in on at by own my our we us need needs looking someone person staff candidate candidates profile profiles that this is are be have has from as into about like experience experienced years year yrs plus more than over least minimum greater under less up between'.split(
    ' ',
  ),
);

/** Words that also match related resume terms */
const TERM_ALIASES: Record<string, string[]> = {
  accountant: ['accountant', 'accounting'],
  accounting: ['accounting', 'accountant', 'bookkeep'],
  bookkeeper: ['bookkeep', 'bookkeeping'],
  bookkeeping: ['bookkeep'],
  reviewer: ['reviewer', 'review'],
  review: ['review'],
  preparer: ['preparer', 'preparation'],
  'fp&a': ['fp&a', 'forecast', 'kpi', 'budget'],
  forecasting: ['forecast'],
  advisory: ['advisory', 'advisor'],
  audit: ['audit'],
  attest: ['audit', 'attest'],
  gaap: ['gaap', 'financial statement', 'audit'],
  close: ['close', 'month-end'],
  'month-end': ['month-end', 'close'],
  va: ['virtual assistant'],
  assistant: ['assistant'],
  'virtual': ['virtual assistant'],
  hr: ['hr', 'human resources', 'onboarding'],
  recruiter: ['recruit', 'talent acquisition'],
  valuation: ['valuation', 'dcf'],
  forensic: ['forensic', 'fraud'],
  erp: ['erp', 'netsuite'],
  'ea-qualified': ['enrolled agent', 'ea'],
  ea: ['enrolled agent'],
  cpa: ['cpa'],
  'partnership': ['1065', 'partnership'],
  's-corp': ['1120-s', 's-corp'],
};

const SENIOR_WORDS = ['senior', 'sr', 'sr.', 'lead', 'experienced'];
const MANAGER_WORDS = ['manager', 'head', 'controller'];
const JUNIOR_WORDS = ['junior', 'associate', 'entry', 'fresher', 'trainee'];

const NEGATION = /\b(not|no|without|doesn't|does not|never|exclude|excluding|avoid)\b/i;

/** Desktop `ai_search`: "more than 8 years", "8+ years", "at least 8 years", "8 years or more" */
const minYearsOf = (q: string) => {
  const m =
    q.match(/\b(?:more than|over|at least|minimum|greater than)\s+(\d+)\s*\+?\s*years?\b/i) ??
    q.match(/\b(\d+)\s*\+\s*years?\b/i) ??
    q.match(/\b(\d+)\s*years?\s+or\s+(?:more|above)\b/i);
  return m ? Number(m[1]) : null;
};

/** "under 3 years", "less than 3 years", "up to 3 years", "between 2 and 6 years", "2 to 6 years", "2-6 years" */
const yearsRangeOf = (q: string): { min: number | null; max: number | null } => {
  const range = q.match(/\bbetween\s+(\d+)\s+and\s+(\d+)\s*years?\b/i) ?? q.match(/\b(\d+)\s*(?:to|-)\s*(\d+)\s*years?\b/i);
  if (range) return { min: Number(range[1]), max: Number(range[2]) };
  const max = q.match(/\b(?:under|less than|below|up to|at most|maximum)\s+(\d+)\s*years?\b/i);
  return { min: minYearsOf(q), max: max ? Number(max[1]) : null };
};

export interface AiSearchResult {
  /** Matched profile id → "% match" */
  scores: Record<string, number>;
  minYears: number | null;
  maxYears: number | null;
  /** Query used "not", "without"… (vector search can't exclude) */
  negation: boolean;
}

const levelOf = (p: HubProfile) => Number(p.resume.level.replace(/\D/g, '')) || 0;

/**
 * Prototype stand-in for desktop AI Smart Search (embeddings + Qdrant ranking): scores each profile against the query words
 * (profile, domain, skills, software, summary, insights, qualifications), seniority words move levels up or down, an exact
 * Resume ID returns that profile alone and numeric year limits are applied as hard filters.
 */
export const runAiSearch = (profiles: HubProfile[], query: string): AiSearchResult => {
  const q = query.trim();
  const { min, max } = yearsRangeOf(q);
  const base = { minYears: min, maxYears: max, negation: NEGATION.test(q) };

  const exact = profiles.find((p) => p.resumeId.toLowerCase() === q.toLowerCase());
  if (exact) return { ...base, scores: { [exact.id]: 100 } };

  const words = q
    .toLowerCase()
    .replace(/[“”"(),]/g, ' ')
    .split(/[\s/]+/)
    .map((w) => w.replace(/^[^a-z0-9&]+|[^a-z0-9&+.-]+$/g, ''))
    .filter(Boolean);
  const terms = words.filter((w) => w.length > 1 && !STOP_WORDS.has(w) && !/^\d+\+?$/.test(w) && !SENIOR_WORDS.includes(w) && !MANAGER_WORDS.includes(w));
  const wantsSenior = words.some((w) => SENIOR_WORDS.includes(w));
  const wantsManager = words.some((w) => MANAGER_WORDS.includes(w));
  const wantsJunior = words.some((w) => JUNIOR_WORDS.includes(w));

  const raw = profiles.map((p) => {
    const name = p.profile.toLowerCase();
    const domain = p.domain.toLowerCase();
    const skills = [...p.resume.technicalSkills, ...p.resume.softwareSkills, ...p.skillCategories].join(' | ').toLowerCase();
    const text = [p.resume.summary, ...p.aiInsights, ...p.resume.jobs.map((j) => `${j.designation} ${j.skills}`)].join(' ').toLowerCase();
    const quals = p.resume.qualifications.join(' ').toLowerCase();
    let score = 0;
    terms.forEach((t) => {
      const needles = TERM_ALIASES[t] ?? [t];
      const hit = (hay: string) => needles.some((n) => hay.includes(n));
      if (hit(name)) score += 3;
      if (hit(domain)) score += 2;
      if (hit(skills)) score += 2;
      if (hit(text)) score += 1;
      if (hit(quals)) score += 1;
    });
    if (score > 0) {
      const level = levelOf(p);
      if (wantsManager) score += level >= 5 ? 3 : level >= 4 ? 1 : -2;
      if (wantsSenior) score += level >= 4 ? 2 : level <= 2 ? -2 : 0;
      if (wantsJunior) score += level <= 2 ? 2 : -1;
    }
    const years = Math.floor(experienceMonths(p) / 12);
    const yearsOk = (min === null || years >= min) && (max === null || years <= max);
    return { id: p.id, score: yearsOk ? score : 0 };
  });

  const top = Math.max(0, ...raw.map((r) => r.score));
  const scores: Record<string, number> = {};
  if (top > 0) {
    raw
      .filter((r) => r.score >= Math.max(2, top * 0.35))
      .forEach((r) => {
        scores[r.id] = Math.min(98, Math.round(62 + (36 * r.score) / top));
      });
  } else if (terms.length === 0 && (min !== null || max !== null)) {
    // Only a years limit ("8+ years"): every profile inside it matches
    profiles.forEach((p) => {
      const years = Math.floor(experienceMonths(p) / 12);
      if ((min === null || years >= min) && (max === null || years <= max)) scores[p.id] = 80;
    });
  }
  return { ...base, scores };
};

/* ---------------------- Request to Hire (marketplace → lists) ---------------------- */

/** Desktop looks for the client's open requirement of the same profile; the Shortlisted list carries one per profile */
export const hasRequirementFor = (candidates: ShortlistedCandidate[], profile: string) =>
  candidates.some((c) => c.source === 'hub' && c.profile === profile);

/** Candidate row created by Request to Hire (shown in Hire New Staff › Shortlisted Candidates) */
export const candidateFromProfile = (p: HubProfile, patch: Partial<ShortlistedCandidate> = {}): ShortlistedCandidate => ({
  id: `sc-${p.id}`,
  source: 'hub',
  name: p.name,
  resumeId: p.resumeId,
  domain: p.domain,
  profile: p.profile,
  status: 'Shortlisted',
  interview: null,
  completedOn: null,
  hasEmail: true,
  replacement: false,
  selfSchedule: true,
  slotRangesIST: p.slotRangesIST,
  feedback: null,
  ownsInterview: false,
  assessments: [],
  resume: p.resume,
  cvFile: null,
  ...patch,
});

/** Requirement details Request to Hire fills in on its own (desktop `rth_waitForPrefillThenSchedule`) */
export interface HubRequirement {
  hoursPerWeek: number;
  /** ISO date (desktop `tentative_date_of_requirement`) */
  startDate: string;
  staffCount: number;
}

/** Mon–Fri only */
export const addWorkingDays = (from: Date, days: number) => {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  let left = days;
  while (left > 0) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) left -= 1;
  }
  return d;
};

/** Desktop defaults: Onboarding 0 – 3 Months, 1 staff, start in 10 working days; hours = the candidate's full week */
export const requestToHireRequirement = (p: HubProfile, today = new Date()): HubRequirement => ({
  hoursPerWeek: p.resume.availableHoursPerDay * 5,
  startDate: isoOfDate(addWorkingDays(today, 10)),
  staffCount: 1,
});

/* ---------------------------------- Seeds ---------------------------------- */

type SkillKit = [skill: string, category: string][];

interface Kit {
  skills: SkillKit;
  software: string[];
  certificates: string[];
  courses: [name: string, minutes: number][];
  assessments: { name: string; type: string }[];
  psychometric: string;
  communication: string;
  technicalNote: string;
}

const KITS: Record<MarketplaceDomain, Kit> = {
  Tax: {
    skills: [
      ['1040 Preparation', '1040'],
      ['1040 Review', '1040'],
      ['1065 Partnership Returns', '1065'],
      ['1120-S S-Corp Returns', '1120'],
      ['1120 C-Corp Returns', '1120'],
      ['1041 Trust & Estate Returns', '1041'],
      ['1099 Reporting', '1099'],
      ['Form 990 Non-Profit Returns', '990'],
      ['State & Local Tax', 'State Tax'],
      ['1040-NR Preparation', '1040'],
      ['FBAR / FinCEN 114', 'International Tax'],
      ['Tax Research Memos', 'Tax Research'],
      ['IRS Notice Response', 'Tax Research'],
      ['1065 Review', '1065'],
    ],
    software: ['CCH Axcess', 'UltraTax CS', 'Drake', 'Lacerte', 'ProSeries', 'GoFileRoom', 'QuickBooks Online', 'Microsoft Excel'],
    certificates: ['Enrolled Agent (EA)', 'Part 1 (Individuals) of EA Examination', 'US Tax Foundations Certificate'],
    courses: [
      ['US Individual Tax Update 2026', 480],
      ['S-Corporation Basis & Distributions', 240],
      ['Partnership Taxation Essentials', 360],
      ['State Nexus Fundamentals', 180],
      ['Tax Research Methods', 300],
      ['Busy Season Review Techniques', 120],
      ['Form 1041 Deep Dive', 240],
    ],
    assessments: [
      { name: 'Individual Tax Fundamentals', type: 'MCQ' },
      { name: 'Business Entity Taxation', type: 'MCQ' },
      { name: 'Tax Return Review Case', type: 'Case Study' },
    ],
    psychometric: 'Strong in accuracy and following process. Prefers structured work with clear deadlines and review checklists.',
    communication: 'Clear written English. Confident on video calls and comfortable asking clarifying questions.',
    technicalNote: 'Scored well on 1040 scenarios, entity basis questions and state apportionment.',
  },
  'Accounting & Advisory': {
    skills: [
      ['Bank Reconciliation', 'Accounting'],
      ['Month-End Close', 'Accounting'],
      ['Journal Entries', 'Accounting'],
      ['Accounts Payable', 'Accounts Payable'],
      ['Accounts Receivable', 'Accounts Receivable'],
      ['Financial Statement Preparation', 'Financial Reporting'],
      ['Budget vs Actual Reporting', 'Financial Reporting'],
      ['Payroll Processing', 'Payroll'],
      ['Sales Tax Filings', 'Sales Tax'],
      ['Multi-entity Consolidation', 'Financial Reporting'],
      ['Cash-flow Forecasting', 'FP&A'],
      ['KPI Dashboards', 'FP&A'],
    ],
    software: ['QuickBooks Online', 'Xero', 'Sage Intacct', 'NetSuite', 'Bill.com', 'Gusto', 'Microsoft Excel', 'Power BI'],
    certificates: ['QuickBooks Online ProAdvisor', 'Xero Advisor Certification', 'Certified Bookkeeper (CB)'],
    courses: [
      ['Month-End Close Masterclass', 360],
      ['Bank Reconciliation Practical', 180],
      ['Accounts Payable Controls', 240],
      ['Revenue Recognition (ASC 606) Basics', 300],
      ['Excel for Financial Reporting', 240],
      ['Management Reporting Essentials', 300],
    ],
    assessments: [
      { name: 'Bookkeeping Essentials', type: 'MCQ' },
      { name: 'Bank Reconciliation Practical', type: 'Practical' },
      { name: 'Financial Statements Review', type: 'MCQ' },
    ],
    psychometric: 'Methodical and dependable. Works best with a documented close checklist and clear ownership.',
    communication: 'Good written communication; explains variances and open items clearly.',
    technicalNote: 'Strong on reconciliations, accruals and month-end journal entries.',
  },
  Audit: {
    skills: [
      ['Audit Planning', 'Audit'],
      ['Risk Assessment', 'Audit'],
      ['Internal Controls Testing', 'Audit'],
      ['Sampling & Substantive Testing', 'Audit'],
      ['Workpaper Documentation', 'Audit'],
      ['Confirmations', 'Audit'],
      ['Single Audit (Uniform Guidance)', 'Audit'],
      ['EBP Audit', 'EBP Audit'],
      ['SOC 1 / SOC 2 Support', 'SOC'],
    ],
    software: ['CaseWare', 'CCH Engagement', 'AuditBoard', 'IDEA', 'Microsoft Excel', 'Power BI'],
    certificates: ['Auditing and Attestation (AUD) Exam for CPA', 'Certified Internal Auditor (CIA) - Part 1'],
    courses: [
      ['Audit Documentation Standards', 300],
      ['Internal Controls Walkthrough', 240],
      ['Audit Sampling Methods', 180],
      ['Single Audit Compliance', 300],
      ['US GAAP Update 2026', 360],
    ],
    assessments: [
      { name: 'Audit Sampling & Testing', type: 'MCQ' },
      { name: 'Internal Controls Walkthrough', type: 'Case Study' },
    ],
    psychometric: 'Concise and structured. Comfortable challenging assumptions in a respectful way.',
    communication: 'Clear and to the point. Comfortable presenting findings to reviewers and client staff.',
    technicalNote: 'Solid on sampling, documentation and control testing.',
  },
  'Non Technical': {
    skills: [
      ['Client Call - Meeting Notes', 'Admin Support'],
      ['Client Meeting Scheduling', 'Admin Support'],
      ['Email Reviewing', 'Admin Support'],
      ['Calendar & Inbox Management', 'Admin Support'],
      ['Data Entry & Indexing', 'Data Processing'],
      ['CRM Updates', 'Data Processing'],
      ['Recruitment Coordination', 'Talent Acquisition'],
      ['Candidate Screening', 'Talent Acquisition'],
      ['Employee Onboarding', 'HR & Operations'],
      ['HR Records Management', 'HR & Operations'],
    ],
    software: ['Microsoft PowerPoint', 'Microsoft Word', 'Microsoft Excel', 'Outlook', 'Google Workspace', 'HubSpot', 'Zoho Recruit', 'Calendly'],
    certificates: ['Microsoft Office Specialist (MOS)', 'Google Workspace Administrator'],
    courses: [
      ['Professional Email Etiquette', 120],
      ['Executive Calendar Management', 90],
      ['Client Service Excellence', 150],
      ['Data Privacy for Support Teams', 120],
      ['Structured Interviewing Basics', 180],
    ],
    assessments: [
      { name: 'Business English Writing', type: 'Written' },
      { name: 'Office Productivity Tools', type: 'MCQ' },
    ],
    psychometric: 'Organised and service-minded. Keeps calm with competing requests and tight turnarounds.',
    communication: 'Polished written and spoken English; handles client-facing calls confidently.',
    technicalNote: 'Fast and accurate on scheduling, document handling and CRM hygiene tasks.',
  },
  Specialized: {
    skills: [
      ['Business Valuation Reports', 'Valuation'],
      ['DCF Modeling', 'Valuation'],
      ['Comparable Company Analysis', 'Valuation'],
      ['Purchase Price Allocation', 'Valuation'],
      ['Forensic Accounting Review', 'Forensic'],
      ['Fraud Risk Assessment', 'Forensic'],
      ['Litigation Support Schedules', 'Forensic'],
      ['ERP Implementation Support', 'ERP'],
      ['Process Documentation (SOP)', 'Process Improvement'],
      ['SOX Controls Testing', 'SOX'],
    ],
    software: ['Microsoft Excel', 'Capital IQ', 'BVR DealStats', 'Power BI', 'NetSuite', 'IDEA', 'Alteryx'],
    certificates: ['CFA Level 1', 'Certified Fraud Examiner (CFE) - in progress', 'NetSuite ERP Consultant'],
    courses: [
      ['DCF Modeling Workshop', 480],
      ['Valuation Report Writing', 240],
      ['Forensic Accounting Foundations', 360],
      ['SOX 404 Testing Essentials', 300],
      ['ERP Data Migration Basics', 240],
    ],
    assessments: [
      { name: 'Excel for Accountants', type: 'MCQ' },
      { name: 'Valuation Modeling Practical', type: 'Practical' },
    ],
    psychometric: 'Analytical and curious. Enjoys working a complex problem end to end.',
    communication: 'Writes clear, well-structured findings; explains assumptions well.',
    technicalNote: 'Strong modelling and analysis in the practical test.',
  },
};

/** myCPE AI & automation courses (desktop `is_ai_upskilled`), most relevant first for each domain */
const AI_COURSES: Record<MarketplaceDomain, [string, number][]> = {
  Tax: [
    ['Prompt Engineering for Tax Professionals', 90],
    ['Generative AI for Accountants', 120],
    ['AI Ethics & Data Privacy', 60],
  ],
  'Accounting & Advisory': [
    ['Automating Month-End Close with AI', 150],
    ['Generative AI for Accountants', 120],
    ['AI Ethics & Data Privacy', 60],
  ],
  Audit: [
    ['AI Tools for Audit Analytics', 120],
    ['Generative AI for Accountants', 120],
    ['AI Ethics & Data Privacy', 60],
  ],
  'Non Technical': [
    ['Copilot for Client Service Teams', 90],
    ['ChatGPT for Everyday Office Work', 90],
    ['AI Ethics & Data Privacy', 60],
  ],
  Specialized: [
    ['Generative AI for Accountants', 120],
    ['AI for Data Analysis & Automation', 150],
    ['AI Ethics & Data Privacy', 60],
  ],
};

const pick = <T,>(list: T[], start: number, count: number) =>
  Array.from({ length: Math.min(count, list.length) }, (_, i) => list[(start + i) % list.length]);

const job = (designation: string, company: string, from: string, to: string | null, skills: string): ResumeJob => ({
  designation,
  company,
  from,
  to,
  skills,
});

interface Spec {
  id: string;
  name: string;
  resumeId: string;
  domain: MarketplaceDomain;
  profile: string;
  level: number;
  gender: 'Male' | 'Female';
  rate: number;
  notice: number;
  buyout?: number;
  country: string;
  city: string;
  mode: HubWorkMode;
  quals: string[];
  us?: [number, number];
  india?: [number, number];
  uk?: [number, number];
  canada?: [number, number];
  other?: [number, number];
  summary: string;
  insights: string[];
  jobs: ResumeJob[];
  /** Rotates the kit lists so profiles of one domain differ */
  seed: number;
  /** Explicit skill picks (kit indexes); default = rotation */
  skills?: number[];
  skillCount?: number;
  /** myCPE courses: regular + AI-focused, completed every `pace` weeks back from Sep 2026 */
  cpe: number;
  ai?: number;
  pace?: number;
  assessments?: number;
  verified?: boolean;
  video?: boolean;
  psychFile?: boolean;
  certificates?: number;
  otRoy?: number;
  otSeasonal?: number;
  till?: string;
  slots?: [string, string][];
}

const SLOT_SETS: [string, string][][] = [
  [['05:00 PM', '10:00 PM']],
  [['04:30 PM', '09:30 PM']],
  [['06:00 PM', '11:30 PM']],
  [['05:00 PM', '08:00 PM'], ['09:00 PM', '11:30 PM']],
];

const AVAILABLE_TILL = ['06:00 PM', '04:30 PM', '05:00 PM', '03:30 PM'];

const LAST_COURSE = new Date(2026, 8, 18);

const courseDate = (index: number, paceWeeks: number) => {
  const d = new Date(LAST_COURSE);
  d.setDate(d.getDate() - index * paceWeeks * 7);
  return isoOfDate(d);
};

const build = (s: Spec): HubProfile => {
  const kit = KITS[s.domain];
  const i = s.seed;
  const skills = s.skills ? s.skills.map((k) => kit.skills[k]) : pick(kit.skills, i, s.skillCount ?? 5 + (i % 4));
  const pace = s.pace ?? 9;
  const regular = pick(kit.courses, i, s.cpe);
  const ai = pick(AI_COURSES[s.domain], 0, s.ai ?? 0);
  // AI courses are the most recent ones, regular courses follow
  const cpeCourses: CpeCourse[] = [
    ...ai.map(([name, minutes]) => ({ name, minutes, ai: true })),
    ...regular.map(([name, minutes]) => ({ name, minutes, ai: false })),
  ].map((c, k) => ({ ...c, completedOn: courseDate(k, pace) }));
  const assessments = pick(kit.assessments, i, s.assessments ?? 1 + (i % 2));
  return {
    id: s.id,
    name: s.name,
    resumeId: s.resumeId,
    domain: s.domain,
    profile: s.profile,
    workMode: s.mode,
    noticeDays: s.notice,
    buyoutDays: s.buyout,
    country: s.country,
    location: s.city,
    monthlyCost: s.rate * 90,
    hasPsychometricFile: Boolean(s.psychFile),
    availableTill: s.till ?? AVAILABLE_TILL[i % AVAILABLE_TILL.length],
    overtimeRoundYear: s.otRoy,
    overtimeSeasonal: s.otSeasonal,
    slotRangesIST: s.slots ?? SLOT_SETS[i % SLOT_SETS.length],
    skillCategories: [...new Set(skills.map(([, category]) => category))],
    aiInsights: s.insights,
    cpeCourses,
    otherExperience: s.other,
    resume: {
      gender: s.gender,
      level: `Level ${s.level}`,
      joining: joiningLabel(s.notice),
      workType: 'Full Time',
      hourlyRate: s.rate,
      availableHoursPerDay: 8,
      hasVideo: s.video !== false,
      qualifications: s.quals,
      summary: s.summary,
      experience: { us: s.us, india: s.india, uk: s.uk, canada: s.canada },
      jobs: s.jobs,
      technicalSkills: skills.map(([skill]) => skill),
      softwareSkills: pick(kit.software, i, 2 + (i % 4)),
      backgroundVerified: s.verified !== false,
      backgroundNote:
        s.verified === false ? 'Employment verification pending from one former employer.' : 'Employment, education and identity verified. No discrepancies found.',
      psychometric: kit.psychometric,
      communication: kit.communication,
      technicalNote: kit.technicalNote,
      certificates: pick(kit.certificates, i, s.certificates ?? 1 + (i % 2)),
      courses: cpeCourses.map((c) => ({ name: c.name, duration: cpeLabel(c.minutes), completedOn: c.completedOn, hasCertificate: true })),
      assessments: assessments.map((a, k) => ({
        name: a.name,
        type: a.type,
        scorePct: 70 + ((i * 7 + k * 11 + s.level * 3) % 27),
        lastAssessedOn: `2026-0${3 + ((i + k) % 6)}-${String(6 + ((i * 3 + k) % 20)).padStart(2, '0')}`,
        hasReport: true,
        hasProctoring: (i + k) % 2 === 0,
      })),
    },
  };
};

const SPECS: Spec[] = [
  {
    id: 'hp1', name: 'Ananya Rao', resumeId: 'J09101', domain: 'Non Technical', profile: 'Consultant - Virtual Assistant', level: 3, gender: 'Female', rate: 12, notice: 30,
    country: 'India', city: 'Pune', mode: 'WFH', quals: ['Bachelor of Business Administration'], us: [16, 0], india: [7, 0], seed: 0, skills: [0, 1, 2, 3, 4],
    cpe: 4, ai: 2, pace: 4, assessments: 2, psychFile: true, otRoy: 5,
    summary: 'Executive and virtual assistant supporting US firm partners with inbox, calendar, client scheduling and meeting follow-ups across time zones.',
    insights: [
      'The candidate has over 23 years of experience in operations support, managing end-to-end scheduling and client communication for busy partner groups.',
      'Proficient in preparing meeting notes and status reports, helping firm leaders keep client follow-ups on time.',
      'Completed AI productivity courses on myCPE and uses Copilot to draft emails and summarise client calls.',
    ],
    jobs: [job('Executive Assistant', 'Harbor Light Advisory', '2015-04-01', null, 'Partner calendar and inbox, client meeting scheduling, call notes, travel planning'), job('Office Coordinator', 'Maple Row Associates', '2003-06-01', '2015-03-01', 'Front office, document handling, vendor coordination')],
  },
  {
    id: 'hp2', name: 'Vikram Desai', resumeId: 'J09102', domain: 'Tax', profile: 'Senior - Tax Reviewer', level: 5, gender: 'Male', rate: 30, notice: 30, buyout: 15,
    country: 'India', city: 'Ahmedabad', mode: 'Hybrid', quals: ['MBA Finance', 'Enrolled Agent'], us: [14, 3], india: [8, 6], seed: 3, skillCount: 9,
    cpe: 6, ai: 1, pace: 3, assessments: 3, psychFile: true, certificates: 2, otRoy: 10, otSeasonal: 15,
    summary: 'Tax manager-level reviewer with 14 busy seasons across individual, partnership, S-corp and trust returns. Owns review queues and trains preparers.',
    insights: [
      'Over 22 years in US and Indian tax practice, including first and second-level review of 1040, 1065 and 1120-S returns.',
      'Builds review checklists and trains preparer teams, reducing review notes per return for the firms he supports.',
      'Enrolled Agent with strong IRS notice and tax research experience.',
    ],
    jobs: [job('Tax Review Manager', 'Summit Ridge CPAs', '2016-02-01', null, 'Review queue ownership, complex entity returns, preparer training, tax research memos'), job('Senior Tax Accountant', 'Brightline Advisors', '2008-07-01', '2016-01-01', 'Partnership and corporate returns, state apportionment')],
  },
  {
    id: 'hp3', name: 'Neha Joshi', resumeId: 'J09103', domain: 'Tax', profile: 'Associate - Tax Preparer', level: 2, gender: 'Female', rate: 13, notice: 0,
    country: 'India', city: 'Ahmedabad', mode: 'Hybrid', quals: ['Bachelor of Commerce', 'Master of Commerce'], us: [2, 6], india: [1, 3], seed: 0, skillCount: 6,
    cpe: 5, ai: 2, pace: 3, psychFile: true,
    summary: 'Tax preparer with two busy seasons of individual and small-business returns for US clients. Comfortable with high volumes and reviewer feedback.',
    insights: [
      'Prepared 1040 and 1120-S returns across two busy seasons with a low reviewer rework rate.',
      'Comfortable with CCH Axcess and UltraTax CS workflows, organisers and e-file rejections.',
      'Active myCPE learner with recent AI courses for tax workflows.',
    ],
    jobs: [job('Associate - Tax Preparer', 'Willow Creek Tax Services', '2023-02-01', null, 'Form 1040 and 1120-S preparation, state returns, extension filings'), job('Tax Intern', 'Maple Row Associates', '2022-01-01', '2023-01-01', 'Organizer review, data entry, e-file support')],
  },
  {
    id: 'hp4', name: 'Rahul Mehra', resumeId: 'J09104', domain: 'Tax', profile: 'Specialist - Tax Accountant', level: 3, gender: 'Male', rate: 17, notice: 30, buyout: 15,
    country: 'India', city: 'Pune', mode: 'WFH', quals: ['Bachelor of Commerce', 'CA Intermediate'], us: [4, 2], india: [1, 6], seed: 1, skillCount: 8,
    cpe: 3, assessments: 2, otSeasonal: 10,
    summary: 'Tax accountant who reviews 1065 and 1120 returns and mentors junior preparers. Strong with multi-state filings and tax research memos.',
    insights: [
      'Handles partnership and corporate returns end to end, including multi-state apportionment.',
      'Mentors two junior preparers and writes clear review notes.',
    ],
    jobs: [job('Tax Accountant', 'Summit Ridge CPAs', '2021-09-01', null, 'Partnership and corporate returns, multi-state apportionment, review notes'), job('Associate - Tax', 'Brightline Advisors', '2020-02-01', '2021-08-01', '1040 and 1120-S preparation, estimates, amended returns')],
  },
  {
    id: 'hp5', name: 'Daniela Ruiz', resumeId: 'J09105', domain: 'Accounting & Advisory', profile: 'Associate - Accountant', level: 3, gender: 'Female', rate: 16, notice: 15,
    country: 'Mexico', city: 'Guadalajara', mode: 'WFH', quals: ['Bachelor of Commerce'], us: [3, 4], other: [2, 0], seed: 1,
    cpe: 4, ai: 1, pace: 6, assessments: 2,
    summary: 'Staff accountant preparing monthly financials and management reports for multi-entity US clients. Comfortable with accruals and consolidations.',
    insights: [
      'Owns month-end close for three multi-entity clients, including accruals, prepaids and intercompany entries.',
      'Bilingual (English / Spanish) and works US Central hours.',
    ],
    jobs: [job('Staff Accountant', 'Silverline Accounting', '2022-07-01', null, 'Month-end close, accruals, financial statements, consolidations'), job('Accounting Analyst', 'Oakmont Financial', '2020-06-01', '2022-06-01', 'AP/AR, reconciliations, reporting packs')],
  },
  {
    id: 'hp6', name: 'Dhruv Shah', resumeId: 'J09106', domain: 'Accounting & Advisory', profile: 'Associate - Bookkeeper', level: 2, gender: 'Male', rate: 10, notice: 0,
    country: 'India', city: 'Indore', mode: 'WFO', quals: ['Bachelor of Commerce'], us: [1, 8], india: [1, 0], seed: 0, skills: [0, 3, 4, 2, 8],
    cpe: 2, pace: 10, assessments: 1, video: false,
    summary: 'Bookkeeper handling AP, AR and reconciliations for small US businesses. Reliable with deadlines and client follow-ups.',
    insights: [],
    jobs: [job('Bookkeeper', 'Harbor Light Books', '2023-03-01', null, 'AP/AR, bank and credit-card reconciliations, month-end close')],
  },
  {
    id: 'hp7', name: 'Siddharth Rao', resumeId: 'J09107', domain: 'Audit', profile: 'Specialist - Audit Associate', level: 3, gender: 'Male', rate: 17, notice: 30,
    country: 'India', city: 'Hyderabad', mode: 'Hybrid', quals: ['Bachelor of Commerce', 'CA Intermediate'], us: [3, 0], india: [1, 2], seed: 0,
    cpe: 4, ai: 1, pace: 5, assessments: 2, psychFile: true,
    summary: 'Audit associate with planning, testing and documentation experience on mid-size US engagements. Strong with workpapers.',
    insights: [
      'Runs risk assessment and substantive testing on mid-size US attest engagements.',
      'Keeps clean CaseWare workpapers that need few reviewer notes.',
      'Uses AI analytics tools for sampling and journal entry testing.',
    ],
    jobs: [job('Audit Associate', 'Redwood Assurance', '2022-09-01', null, 'Risk assessment, sampling, substantive testing, workpaper review'), job('Audit Trainee', 'Lakeside & Co.', '2021-07-01', '2022-08-01', 'Confirmations, vouching, tick-and-tie')],
  },
  {
    id: 'hp8', name: 'Gautam Bose', resumeId: 'J09108', domain: 'Audit', profile: 'Senior - Audit Associate', level: 4, gender: 'Male', rate: 22, notice: 60, buyout: 30,
    country: 'India', city: 'Bengaluru', mode: 'Hybrid', quals: ['Bachelor of Commerce', 'Chartered Accountant', 'Certified Internal Auditor'], us: [5, 0], india: [3, 4], seed: 2, skillCount: 8,
    cpe: 5, pace: 4, assessments: 2, certificates: 2, otSeasonal: 10,
    summary: 'Audit senior who leads fieldwork, reviews junior workpapers and prepares findings for managers. US GAAP attest and SOC support experience.',
    insights: [
      'Audit senior with 8+ years of US GAAP attest work, leading fieldwork for teams of three to five.',
      'Reviews junior workpapers and drafts findings for engagement managers.',
      'Supports SOC 1 and SOC 2 readiness and testing.',
    ],
    jobs: [job('Senior Audit Associate', 'Redwood Assurance', '2019-11-01', null, 'Fieldwork lead, review, SOC support, client walkthroughs'), job('Audit Associate', 'Lakeside & Co.', '2017-06-01', '2019-10-01', 'Testing, documentation, confirmations')],
  },
  {
    id: 'hp9', name: 'Varun Iyer', resumeId: 'J09109', domain: 'Accounting & Advisory', profile: 'Team Lead - Accounting', level: 5, gender: 'Male', rate: 24, notice: 60, buyout: 30,
    country: 'India', city: 'Chennai', mode: 'WFH', quals: ['Bachelor of Commerce', 'CA Intermediate', 'MBA Finance'], us: [7, 6], india: [4, 3], seed: 2, skills: [1, 5, 6, 9, 2, 0, 10],
    cpe: 6, ai: 2, pace: 3, assessments: 3, psychFile: true, otRoy: 5,
    summary: 'Accounting manager-level team lead owning close calendars, reviews and client reporting. Sets up clean workflows and trains new bookkeepers.',
    insights: [
      'Accounting manager for full-cycle close and reporting across eight US clients.',
      'Built a close calendar and review checklist that cut close time from 10 to 6 working days.',
      'Uses AI-assisted reconciliations and variance commentary after completing myCPE AI courses.',
    ],
    jobs: [job('Accounting Team Lead', 'Clearwater Ledger Co.', '2018-10-01', null, 'Close management, review, audit support, process documentation'), job('Senior Accountant', 'Oakmont Financial', '2014-08-01', '2018-09-01', 'Reconciliations, accruals, management reporting')],
  },
  {
    id: 'hp10', name: 'Andrea Santos', resumeId: 'J09110', domain: 'Non Technical', profile: 'Sr. Consultant - Talent Acquisition', level: 3, gender: 'Female', rate: 14, notice: 15,
    country: 'Philippines', city: 'Manila', mode: 'WFH', quals: ['Bachelor of Arts'], us: [4, 0], other: [3, 6], seed: 2, skills: [6, 7, 5, 2, 1],
    cpe: 3, ai: 1, pace: 6, assessments: 1,
    summary: 'Recruitment coordinator sourcing and screening accounting candidates for US firms; manages interview scheduling and ATS updates.',
    insights: [
      'Sourced and screened 400+ accounting candidates for US CPA firms in the last two years.',
      'Keeps the ATS and hiring-manager calendars up to date with same-day follow-ups.',
    ],
    jobs: [job('Talent Acquisition Specialist', 'Bluepeak Staffing', '2021-05-01', null, 'Sourcing, phone screens, interview scheduling, ATS updates'), job('Recruitment Assistant', 'Northgate Advisory', '2019-02-01', '2021-04-01', 'Job postings, candidate follow-ups')],
  },
  {
    id: 'hp11', name: 'Rohan Kulkarni', resumeId: 'J09111', domain: 'Specialized', profile: 'Specialist - Valuation Analyst', level: 3, gender: 'Male', rate: 26, notice: 60, buyout: 30,
    country: 'India', city: 'Pune', mode: 'WFH', quals: ['Bachelor of Commerce', 'CFA Level 1'], us: [4, 0], india: [1, 6], seed: 1, skills: [0, 1, 2, 3],
    cpe: 4, pace: 7, assessments: 2, psychFile: true,
    summary: 'Valuation specialist handling purchase price allocations, 409A work and fairness-opinion support. Reviews junior models.',
    insights: [
      'Builds DCF and market-approach models for small and mid-size business valuations.',
      'Experienced in purchase price allocation and 409A valuation reports.',
    ],
    jobs: [job('Valuation Specialist', 'Northgate Advisory', '2021-08-01', null, 'PPA, 409A valuations, model review, report drafting'), job('Valuation Analyst', 'Oakmont Financial', '2019-09-01', '2021-07-01', 'DCF, guideline companies, industry research')],
  },
  {
    id: 'hp12', name: 'Komal Desai', resumeId: 'J09112', domain: 'Tax', profile: 'Associate - Expatriate Tax Preparer', level: 2, gender: 'Female', rate: 15, notice: 45,
    country: 'India', city: 'Pune', mode: 'WFH', quals: ['Bachelor of Commerce', 'Enrolled Agent'], us: [2, 2], india: [1, 0], seed: 9, skills: [9, 10, 0, 8, 11],
    cpe: 3, ai: 1, pace: 5, assessments: 1,
    summary: 'Prepares non-resident and dual-status returns, treaty claims and FBAR filings. Comfortable with foreign income and credit calculations.',
    insights: [
      'Specialises in 1040-NR, dual-status returns and FBAR / FinCEN 114 filings.',
      'Comfortable with foreign tax credit and treaty-based positions.',
    ],
    jobs: [job('Associate - Expatriate Tax', 'Northgate Advisory', '2023-05-01', null, '1040-NR, dual-status returns, foreign tax credit, FBAR')],
  },
  {
    id: 'hp13', name: 'Meera Nair', resumeId: 'J09113', domain: 'Accounting & Advisory', profile: 'Associate - Bookkeeper', level: 2, gender: 'Female', rate: 11, notice: 15,
    country: 'India', city: 'Jaipur', mode: 'WFH', quals: ['Bachelor of Commerce'], us: [1, 4], india: [1, 6], seed: 3, skills: [0, 3, 4, 7],
    cpe: 2, pace: 8, assessments: 1, verified: false,
    summary: 'Bookkeeper with hands-on QuickBooks Online experience. Keeps clean records and flags unusual items early.',
    insights: [],
    jobs: [job('Bookkeeper', 'Pinecrest Books', '2023-09-01', null, 'AP/AR, bank reconciliations, sales tax filings')],
  },
  {
    id: 'hp14', name: 'Paolo Reyes', resumeId: 'J09114', domain: 'Non Technical', profile: 'Specialist - HR & Operations', level: 4, gender: 'Male', rate: 18, notice: 30,
    country: 'Philippines', city: 'Cebu City', mode: 'Hybrid', quals: ['Bachelor of Business Administration'], us: [5, 0], other: [4, 0], seed: 4, skills: [8, 9, 6, 3, 4],
    cpe: 4, pace: 6, assessments: 2,
    summary: 'HR and operations specialist running onboarding, HR records and policy updates for distributed accounting teams.',
    insights: [
      'Runs onboarding for distributed teams, from offer paperwork to first-week training plans.',
      'Maintains HR records and policy documents with audit-ready version history.',
    ],
    jobs: [job('HR & Operations Specialist', 'Granite Peak Assurance', '2020-03-01', null, 'Onboarding, HR records, policy updates, payroll inputs'), job('HR Assistant', 'Lakeside & Co.', '2017-01-01', '2020-02-01', 'Employee files, leave tracking')],
  },
  {
    id: 'hp15', name: 'Farah Khan', resumeId: 'J09115', domain: 'Audit', profile: 'Associate - Audit Associate', level: 2, gender: 'Female', rate: 14, notice: 0,
    country: 'India', city: 'Pune', mode: 'WFO', quals: ['Bachelor of Commerce'], us: [1, 6], india: [1, 0], seed: 1, skillCount: 5,
    cpe: 3, pace: 8, assessments: 1, verified: false,
    summary: 'Audit associate supporting walkthroughs, control testing and PBC tracking. Organized and quick with documentation.',
    insights: [],
    jobs: [job('Audit Associate', 'Granite Peak Assurance', '2024-02-01', null, 'Control testing, PBC tracking, workpaper tick-and-tie')],
  },
  {
    id: 'hp16', name: 'Arjun Menon', resumeId: 'J09116', domain: 'Tax', profile: 'Specialist - Tax Accountant', level: 3, gender: 'Male', rate: 18, notice: 30,
    country: 'India', city: 'Ahmedabad', mode: 'WFO', quals: ['Bachelor of Commerce', 'Master of Commerce', 'Enrolled Agent'], us: [4, 8], india: [1, 0], seed: 5, skillCount: 7,
    cpe: 5, ai: 2, pace: 4, assessments: 2, psychFile: true,
    summary: 'Enrolled Agent with four years of US tax. Handles trust and estate returns, extensions and IRS notice responses.',
    insights: [
      'Enrolled Agent handling 1041 trust and estate returns, extensions and estimates.',
      'Drafts IRS notice responses and keeps clear tax research files.',
      'Completed AI courses on myCPE for faster tax research.',
    ],
    jobs: [job('Tax Accountant', 'Willow Creek Tax Services', '2021-03-01', null, '1041, 1040, IRS notices, estimates'), job('Associate - Tax', 'Cedarwood Partners', '2019-06-01', '2021-02-01', '1040 and 1120-S preparation')],
  },
  {
    id: 'hp17', name: 'Tanya Sethi', resumeId: 'J09117', domain: 'Specialized', profile: 'Associate - Valuation Analyst', level: 2, gender: 'Female', rate: 18, notice: 30,
    country: '', city: '', mode: 'Hybrid', quals: ['Bachelor of Commerce', 'MBA Finance'], us: [1, 9], india: [1, 3], seed: 2, skills: [1, 2, 0],
    cpe: 2, pace: 9, assessments: 1,
    summary: 'Valuation analyst building DCF and market-approach models for small and mid-size businesses. Writes clear report sections.',
    insights: [],
    jobs: [job('Valuation Analyst', 'Pinecrest Valuation', '2023-06-01', null, 'DCF models, comparable companies, report drafting')],
  },
  {
    id: 'hp18', name: 'Nandini Reddy', resumeId: 'J09118', domain: 'Accounting & Advisory', profile: 'Associate - Business Advisor', level: 3, gender: 'Female', rate: 19, notice: 45,
    country: 'India', city: 'Chennai', mode: 'Hybrid', quals: ['Bachelor of Commerce', 'MBA Finance'], us: [2, 0], india: [1, 8], seed: 4, skills: [10, 11, 6, 5],
    cpe: 4, ai: 1, pace: 5, assessments: 2,
    summary: 'FP&A and advisory associate building forecasts, KPI dashboards and monthly management packs for owner-managed businesses.',
    insights: [
      'FP&A analyst for forecasting and KPI dashboards in Power BI.',
      'Prepares monthly management packs with budget vs actual commentary for business owners.',
    ],
    jobs: [job('Business Advisor', 'Ironbridge Consulting', '2023-04-01', null, 'Cash-flow forecasts, KPI dashboards, client reporting'), job('FP&A Intern', 'Oakmont Financial', '2022-06-01', '2023-03-01', 'Budget models, variance analysis')],
  },
  {
    id: 'hp19', name: 'Carlos Mendoza', resumeId: 'J09119', domain: 'Specialized', profile: 'Specialist - Forensic Accountant', level: 4, gender: 'Male', rate: 28, notice: 60,
    country: 'Mexico', city: 'Monterrey', mode: 'WFH', quals: ['Bachelor of Commerce', 'Certified Internal Auditor'], us: [6, 0], other: [3, 0], seed: 4, skills: [4, 5, 6, 9],
    cpe: 3, ai: 1, pace: 6, assessments: 2, psychFile: true,
    summary: 'Forensic accountant supporting fraud investigations, litigation schedules and SOX controls reviews for US firms.',
    insights: [
      'Supports fraud investigations with transaction tracing and litigation support schedules.',
      'Experienced with SOX controls testing and remediation tracking.',
    ],
    jobs: [job('Forensic Accountant', 'Ironbridge Consulting', '2020-01-01', null, 'Fraud reviews, litigation schedules, SOX testing'), job('Internal Auditor', 'Granite Peak Assurance', '2015-06-01', '2019-12-01', 'Controls testing, audit reports')],
  },
  {
    id: 'hp20', name: 'Mohit Chauhan', resumeId: 'J09120', domain: 'Tax', profile: 'Senior - Tax Reviewer', level: 4, gender: 'Male', rate: 22, notice: 60, buyout: 30,
    country: 'India', city: 'Hyderabad', mode: 'Hybrid', quals: ['Bachelor of Commerce', 'Master of Commerce', 'Certified Management Accountant'], us: [6, 4], india: [2, 0], seed: 3, skillCount: 8,
    cpe: 4, pace: 6, assessments: 2, psychFile: true,
    summary: 'Senior reviewer with six busy seasons across individual, partnership and corporate engagements. Trains preparers and owns quality checks.',
    insights: [
      'Senior tax preparer who can review 1040 and 1065 returns with a structured checklist.',
      'Trains preparers and owns quality checks before partner sign-off.',
    ],
    jobs: [job('Senior Tax Reviewer', 'Ironbridge Consulting', '2020-04-01', null, 'First-level review, planning, staff training, review checklists'), job('Tax Accountant', 'Granite Peak Assurance', '2018-06-01', '2020-03-01', 'Business returns, depreciation schedules, state tax')],
  },
  {
    id: 'hp21', name: 'Pallavi Deshmukh', resumeId: 'J09121', domain: 'Accounting & Advisory', profile: 'Senior - Accountant', level: 4, gender: 'Female', rate: 20, notice: 30,
    country: 'India', city: 'Pune', mode: 'Hybrid', quals: ['Bachelor of Commerce', 'Chartered Accountant'], us: [5, 2], india: [2, 0], seed: 5, skills: [1, 5, 9, 2, 6, 0],
    cpe: 7, ai: 2, pace: 3, assessments: 2, certificates: 2,
    summary: 'Senior accountant owning month-end close, consolidations and audit support for multi-entity US clients.',
    insights: [
      'Staff accountant to own month-end close, consolidations and audit-ready schedules.',
      'Completed 30+ hours of myCPE learning this year, including AI automation for close tasks.',
    ],
    jobs: [job('Senior Accountant', 'Clearwater Ledger Co.', '2021-01-01', null, 'Close, consolidations, audit PBCs, reporting'), job('Accountant', 'Silverline Accounting', '2018-06-01', '2020-12-01', 'Reconciliations, accruals, payroll entries')],
  },
  {
    id: 'hp22', name: 'Ayaan Qureshi', resumeId: 'J09122', domain: 'Specialized', profile: 'Team Lead - Technology & ERP', level: 5, gender: 'Male', rate: 32, notice: 90, buyout: 45,
    country: 'India', city: 'Bengaluru', mode: 'WFH', quals: ['Bachelor of Commerce', 'MBA Finance'], us: [8, 0], india: [4, 6], seed: 3, skills: [7, 8, 9],
    cpe: 3, ai: 3, pace: 4, assessments: 1, certificates: 1,
    summary: 'ERP lead running NetSuite implementations, data migration and SOP documentation for accounting firms and their clients.',
    insights: [
      'Leads NetSuite implementations from design to go-live, including data migration and user training.',
      'Documents finance processes as SOPs and automates hand-offs with AI tools.',
      'Three AI and automation courses completed on myCPE.',
    ],
    jobs: [job('ERP Implementation Lead', 'Northgate Advisory', '2019-03-01', null, 'NetSuite implementations, data migration, SOPs, training'), job('Finance Systems Analyst', 'Oakmont Financial', '2014-01-01', '2019-02-01', 'ERP support, reporting')],
  },
  {
    id: 'hp23', name: 'Isha Trivedi', resumeId: 'J09123', domain: 'Tax', profile: 'Associate - Tax Preparer', level: 1, gender: 'Female', rate: 11, notice: 15,
    country: 'India', city: 'Ahmedabad', mode: 'WFO', quals: ['Bachelor of Commerce'], us: [0, 10], india: [0, 8], seed: 2, skillCount: 5,
    cpe: 2, pace: 8, assessments: 1,
    summary: 'Detail-oriented preparer with experience in individual returns and state filings. Quick learner on new tax software.',
    insights: [],
    jobs: [job('Associate - Tax Preparer', 'Cedarwood Partners', '2025-01-01', null, '1040 preparation, state returns, client organisers')],
  },
  {
    id: 'hp24', name: 'Chirag Solanki', resumeId: 'J09124', domain: 'Audit', profile: 'Specialist - Audit Associate', level: 3, gender: 'Male', rate: 16, notice: 45,
    country: 'India', city: 'Indore', mode: 'WFO', quals: ['Bachelor of Commerce', 'CA Intermediate'], us: [3, 4], india: [1, 0], seed: 4, skillCount: 6,
    cpe: 3, ai: 1, pace: 6, assessments: 2,
    summary: 'Audit associate with solid Excel skills for sampling and tie-outs. Keeps PBC lists and workpapers current.',
    insights: [
      'Single audit and non-profit engagement experience, including Uniform Guidance testing.',
      'Strong Excel and IDEA skills for sampling and tie-outs.',
    ],
    jobs: [job('Audit Associate', 'Lakeside & Co.', '2022-10-01', null, 'Sampling, tie-outs, PBC tracking, single audit testing')],
  },
];

export const HUB_PROFILES_SEED: HubProfile[] = SPECS.map(build);

/** Profiles the client already saved (desktop `tblclient_market_like`) */
export const HUB_SAVED_SEED: string[] = ['hp4', 'hp9', 'hp11'];
