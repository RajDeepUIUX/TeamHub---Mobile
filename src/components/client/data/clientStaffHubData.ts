/**
 * Mock data for Hire New Staff → Available Staff Hub (desktop `staffingMarketplace` controller: `index` = Available Resumes,
 * `linkedprofile` = Saved Resumes, `viewDetails` = View Resume, `profilerequestinterview` / `request_for_interview_timing` =
 * Shortlist Candidate → schedule, `likeprofileAjax` / `unlikeprofileAjax` = Save / Remove from Saved Resumes).
 * Desktop shows only the profile name + Resume ID (no staff name) until a candidate is shortlisted. Profiles already shortlisted
 * by the client are hidden from both tabs (desktop `NOT IN shared staff ids`).
 * All names, resume IDs, companies, locations and scores are dummy data.
 */
import { CLIENT_IS_MOS } from './clientTimesheetsData';
import {
  CandidateResume,
  ResumeJob,
  ShortlistedCandidate,
  formatExperience,
} from './clientInterviewsData';

/* --------------------------------- Types ---------------------------------- */

export type HubWorkMode = 'WFH' | 'WFO' | 'Hybrid';
export const HUB_WORK_MODES: HubWorkMode[] = ['WFH', 'WFO', 'Hybrid'];

export interface HubProfile {
  id: string;
  /** Not shown in the Hub (desktop shows profile + Resume ID only); used once the candidate is shortlisted */
  name: string;
  /** Desktop "Resume ID" (`job_code` / `reg_id`) */
  resumeId: string;
  domain: string;
  profile: string;
  workMode: HubWorkMode;
  /** Days to join; 0 = Immediate Joining (desktop `notice_period`) */
  noticeDays: number;
  /** Desktop "Notice Buyout Eligibility" (experienced-hiring resumes only) */
  buyoutDays?: number;
  location: string;
  /** Monthly talent cost shown to MOS clients (`client_hub_role == 2`) */
  monthlyCost: number;
  hasPsychometricFile: boolean;
  /** Candidate's available interview ranges in IST */
  slotRangesIST: [string, string][];
  resume: CandidateResume;
}

/** Desktop `getLevelArr` */
export const HUB_LEVELS = ['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5'];

export const HUB_PAGE_SIZE = 9;

/* ------------------------------ Filter options ----------------------------- */

export interface HubRangeOption {
  value: string;
  label: string;
}

/** Desktop "Select Hourly Rate" (MOS clients: "Select Talent Cost", monthly) */
export const HUB_RATE_OPTIONS: HubRangeOption[] = CLIENT_IS_MOS
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
      { value: '51-9999', label: '$50 +' },
    ];

/** Desktop "Select Joining Days" */
export const HUB_JOINING_OPTIONS: HubRangeOption[] = [
  { value: '0-29', label: 'Under 30 days' },
  { value: '30-45', label: '30 - 45 Days' },
  { value: '46-60', label: '46 - 60 Days' },
  { value: '61-90', label: '61 - 90 Days' },
  { value: '91-99999', label: '90 Days +' },
];

export const labelOfRange = (options: HubRangeOption[], value: string) => options.find((o) => o.value === value)?.label ?? value;

export interface HubFilters {
  /** Single domain ('' = all); choosing one limits the Profile list (desktop `getProfilesDDForFilter`) */
  domain: string;
  profiles: string[];
  levels: string[];
  workModes: HubWorkMode[];
  rate: string;
  joining: string;
  software: string[];
  skills: string[];
  locations: string[];
  qualifications: string[];
}

export const EMPTY_HUB_FILTERS: HubFilters = {
  domain: '',
  profiles: [],
  levels: [],
  workModes: [],
  rate: '',
  joining: '',
  software: [],
  skills: [],
  locations: [],
  qualifications: [],
};

export const hubFilterCount = (f: HubFilters) =>
  (f.domain ? 1 : 0) +
  f.profiles.length +
  f.levels.length +
  f.workModes.length +
  (f.rate ? 1 : 0) +
  (f.joining ? 1 : 0) +
  f.software.length +
  f.skills.length +
  f.locations.length +
  f.qualifications.length;

const inRange = (value: number, range: string) => {
  const [from, to] = range.split('-').map(Number);
  return value >= from && value <= to;
};

/** Rate the filter and card use: monthly talent cost for MOS clients, hourly otherwise */
export const rateValueOf = (p: HubProfile) => (CLIENT_IS_MOS ? p.monthlyCost : p.resume.hourlyRate);

const anyOf = (wanted: string[], have: string[]) => wanted.length === 0 || wanted.some((w) => have.includes(w));

/** Free-text search covers Resume ID (desktop "Resume ID" box), profile, domain and skills */
export const matchesHubProfile = (p: HubProfile, query: string, f: HubFilters) => {
  const q = query.trim().toLowerCase();
  if (q) {
    const hay = `${p.resumeId} ${p.profile} ${p.domain} ${p.resume.technicalSkills.join(' ')} ${p.resume.softwareSkills.join(' ')}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  if (f.domain && p.domain !== f.domain) return false;
  if (f.profiles.length && !f.profiles.includes(p.profile)) return false;
  if (f.levels.length && !f.levels.includes(p.resume.level)) return false;
  if (f.workModes.length && !f.workModes.includes(p.workMode)) return false;
  if (f.rate && !inRange(rateValueOf(p), f.rate)) return false;
  if (f.joining && !inRange(p.noticeDays, f.joining)) return false;
  if (!anyOf(f.software, p.resume.softwareSkills)) return false;
  if (!anyOf(f.skills, p.resume.technicalSkills)) return false;
  if (f.locations.length && !f.locations.includes(p.location)) return false;
  if (!anyOf(f.qualifications, p.resume.qualifications)) return false;
  return true;
};

/* --------------------------------- Display --------------------------------- */

export const joiningLabel = (days: number) => (days > 0 ? `${days} days` : 'Immediate Joining');

export const rateLabel = (p: HubProfile) => (CLIENT_IS_MOS ? `USD ${p.monthlyCost}/Mo.` : `$${p.resume.hourlyRate}/Hr`);

export const totalExperienceMonths = (r: CandidateResume) =>
  Object.values(r.experience).reduce((sum, pair) => sum + (pair ? pair[0] * 12 + pair[1] : 0), 0);

export const totalExperienceLabel = (r: CandidateResume) => {
  const months = totalExperienceMonths(r);
  return formatExperience([Math.floor(months / 12), months % 12]) ?? '-';
};

/** Short form for cards: "3y 9m" */
export const totalExperienceShort = (r: CandidateResume) => {
  const months = totalExperienceMonths(r);
  const y = Math.floor(months / 12);
  const m = months % 12;
  return [y ? `${y}y` : '', m ? `${m}m` : ''].filter(Boolean).join(' ') || '-';
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

/* --------------------------- Shortlisting (hub → list) --------------------------- */

/** Desktop looks for the client's open requirement of the same profile (`tblprojects.profile_id`); the Shortlisted list carries one per profile */
export const hasRequirementFor = (candidates: ShortlistedCandidate[], profile: string) =>
  candidates.some((c) => c.source === 'hub' && c.profile === profile);

/** Candidate row created when a Hub profile is shortlisted (shown in Hire New Staff › Shortlisted Candidates) */
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

/** Details asked when the client has no requirement for the profile yet (desktop "Add Staff Requirement", pre-filled from the resume) */
export interface HubRequirement {
  hoursPerWeek: number;
  /** ISO date (desktop `tentative_date_of_requirement`) */
  startDate: string;
  staffCount: number;
}

export const REQUIREMENT_HOURS = [10, 20, 30, 40];
export const REQUIREMENT_MAX_STAFF = 10;

/* ---------------------------------- Seeds ---------------------------------- */

interface Kit {
  technical: string[];
  software: string[];
  certificates: string[];
  courses: { name: string; duration: string; completedOn: string }[];
  assessments: { name: string; type: string }[];
  psychometric: string;
  communication: string;
  technicalNote: string;
}

const KITS: Record<string, Kit> = {
  Tax: {
    technical: [
      'Individual tax returns (1040)',
      'S-Corporation returns (1120-S)',
      'Partnership returns (1065)',
      'C-Corporation returns (1120)',
      'State & local tax',
      'Extension & estimate filings',
      'Sales & use tax',
      'Tax research',
      'Trust & estate returns (1041)',
    ],
    software: ['CCH Axcess', 'Drake', 'UltraTax', 'Lacerte', 'QuickBooks Online', 'Excel'],
    certificates: ['Enrolled Agent (EA) - Part 1 cleared', 'Enrolled Agent (EA) - Parts 1 and 2 cleared', 'US Tax Foundations Certificate'],
    courses: [
      { name: 'US Individual Tax Update', duration: '8 hrs', completedOn: '2026-03-12' },
      { name: 'S-Corporation Basics', duration: '4 hrs', completedOn: '2025-11-05' },
      { name: 'Partnership Taxation Essentials', duration: '6 hrs', completedOn: '2025-09-22' },
      { name: 'State Nexus Fundamentals', duration: '3 hrs', completedOn: '2025-07-14' },
      { name: 'Tax Research Methods', duration: '5 hrs', completedOn: '2025-05-30' },
      { name: 'Busy Season Review Techniques', duration: '2 hrs', completedOn: '2025-02-10' },
      { name: 'Form 1040 Deep Dive', duration: '10 hrs', completedOn: '2024-12-03' },
    ],
    assessments: [
      { name: 'Individual Tax Fundamentals', type: 'MCQ' },
      { name: 'Business Entity Taxation', type: 'MCQ' },
    ],
    psychometric: 'Strong in accuracy and following process. Prefers structured work with clear deadlines.',
    communication: 'Clear written English. Confident on video calls; comfortable asking clarifying questions.',
    technicalNote: 'Scored well on 1040 scenarios and state apportionment questions.',
  },
  'Accounting & Bookkeeping': {
    technical: [
      'Accounts payable / receivable',
      'Bank reconciliations',
      'Month-end close',
      'Payroll entries',
      'Journal entries',
      'Financial statement preparation',
      'Sales tax filings',
      'Budget vs actual reporting',
    ],
    software: ['QuickBooks Online', 'Xero', 'FreshBooks', 'Sage Intacct', 'Excel'],
    certificates: ['QuickBooks ProAdvisor', 'Xero Advisor Certification', 'Bookkeeping Fundamentals Certificate'],
    courses: [
      { name: 'Month-End Close Masterclass', duration: '6 hrs', completedOn: '2026-01-18' },
      { name: 'Bank Reconciliation Practical', duration: '3 hrs', completedOn: '2025-10-08' },
      { name: 'Accounts Payable Controls', duration: '4 hrs', completedOn: '2025-06-19' },
    ],
    assessments: [
      { name: 'Bookkeeping Essentials', type: 'MCQ' },
      { name: 'Bank Reconciliation Practical', type: 'Practical' },
    ],
    psychometric: 'Methodical and dependable. Works best with a documented checklist.',
    communication: 'Good written communication; explains variances clearly.',
    technicalNote: 'Strong on reconciliations and month-end journal entries.',
  },
  'Audit & Assurance': {
    technical: [
      'Audit planning',
      'Sampling & testing',
      'Internal controls',
      'Workpaper documentation',
      'Risk assessment',
      'Substantive testing',
      'Confirmations',
      'SOC reporting support',
    ],
    software: ['CaseWare', 'Excel', 'Power BI', 'AuditBoard'],
    certificates: ['CPA exam - AUD cleared', 'Certified Internal Auditor (CIA) - Part 1', 'ACL Analytics Certificate'],
    courses: [
      { name: 'Audit Documentation Standards', duration: '5 hrs', completedOn: '2025-09-30' },
      { name: 'Internal Controls Walkthrough', duration: '4 hrs', completedOn: '2025-06-11' },
      { name: 'Sampling Methods', duration: '3 hrs', completedOn: '2025-03-25' },
    ],
    assessments: [
      { name: 'Audit Sampling & Testing', type: 'MCQ' },
      { name: 'Internal Controls Walkthrough', type: 'Case Study' },
    ],
    psychometric: 'Concise and structured. Comfortable challenging assumptions in a respectful way.',
    communication: 'Concise and structured. Comfortable presenting findings to reviewers.',
    technicalNote: 'Solid on sampling, documentation and control testing.',
  },
  'Business Valuation': {
    technical: [
      'Discounted cash flow models',
      'Comparable company analysis',
      'Precedent transactions',
      'Purchase price allocation',
      'Valuation reports',
      'Industry research',
    ],
    software: ['Excel', 'Power BI', 'Capital IQ', 'BVR DealStats'],
    certificates: ['CFA Level 1 cleared', 'Financial Modeling & Valuation Analyst (FMVA)'],
    courses: [
      { name: 'DCF Modeling Workshop', duration: '8 hrs', completedOn: '2025-12-04' },
      { name: 'Valuation Report Writing', duration: '4 hrs', completedOn: '2025-08-21' },
    ],
    assessments: [
      { name: 'Excel for Accountants', type: 'MCQ' },
      { name: 'Valuation Modeling Practical', type: 'Practical' },
    ],
    psychometric: 'Analytical and curious. Enjoys modeling problems end to end.',
    communication: 'Writes clear valuation summaries; explains assumptions well.',
    technicalNote: 'Strong DCF and comparable-company work in the practical test.',
  },
  Advisory: {
    technical: [
      'Cash-flow forecasting',
      'KPI dashboards',
      'Process documentation',
      'Budgeting & planning',
      'Client reporting',
      'Business case analysis',
    ],
    software: ['Excel', 'Power BI', 'QuickBooks Online', 'Fathom'],
    certificates: ['Certified Management Accountant (CMA) - Part 1', 'Power BI Data Analyst'],
    courses: [
      { name: 'Advisory Reporting Basics', duration: '5 hrs', completedOn: '2026-02-09' },
      { name: 'Forecasting with Excel', duration: '4 hrs', completedOn: '2025-10-27' },
    ],
    assessments: [
      { name: 'Excel for Accountants', type: 'MCQ' },
      { name: 'Management Reporting Case', type: 'Case Study' },
    ],
    psychometric: 'Proactive and client-minded. Likes turning numbers into clear recommendations.',
    communication: 'Confident presenter; adapts tone for owners and finance leads.',
    technicalNote: 'Good grasp of forecasting and KPI storytelling.',
  },
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
  domain: string;
  profile: string;
  level: number;
  gender: 'Male' | 'Female';
  rate: number;
  notice: number;
  buyout?: number;
  location: string;
  mode: HubWorkMode;
  quals: string[];
  us: [number, number];
  india?: [number, number];
  uk?: [number, number];
  canada?: [number, number];
  summary: string;
  jobs: ResumeJob[];
  /** Rotates the skill / course / assessment lists so profiles of one domain differ */
  seed: number;
  skillCount?: number;
  verified?: boolean;
  video?: boolean;
  psychFile?: boolean;
  slots?: [string, string][];
}

const SLOT_SETS: [string, string][][] = [
  [['05:00 PM', '10:00 PM']],
  [['04:30 PM', '09:30 PM']],
  [['06:00 PM', '11:30 PM']],
  [['05:00 PM', '08:00 PM'], ['09:00 PM', '11:30 PM']],
];

const build = (s: Spec): HubProfile => {
  const kit = KITS[s.domain];
  const i = s.seed;
  const courses = pick(kit.courses, i, 2 + (i % 4));
  const assessments = pick(kit.assessments, i, 1 + (i % 2));
  return {
    id: s.id,
    name: s.name,
    resumeId: s.resumeId,
    domain: s.domain,
    profile: s.profile,
    workMode: s.mode,
    noticeDays: s.notice,
    buyoutDays: s.buyout,
    location: s.location,
    monthlyCost: s.rate * 90,
    hasPsychometricFile: Boolean(s.psychFile),
    slotRangesIST: s.slots ?? SLOT_SETS[i % SLOT_SETS.length],
    resume: {
      gender: s.gender,
      level: `Level ${s.level}`,
      joining: s.notice > 0 ? `Joining in ${s.notice} days` : 'Immediate Joining',
      workType: 'Full Time',
      hourlyRate: s.rate,
      availableHoursPerDay: 8,
      hasVideo: s.video !== false,
      qualifications: s.quals,
      summary: s.summary,
      experience: { us: s.us, india: s.india, uk: s.uk, canada: s.canada },
      jobs: s.jobs,
      technicalSkills: pick(kit.technical, i, s.skillCount ?? 4 + (i % 5)),
      softwareSkills: pick(kit.software, i, 2 + (i % 3)),
      backgroundVerified: s.verified !== false,
      backgroundNote: s.verified === false ? 'Employment verification pending from one former employer.' : 'Employment and education verified. No discrepancies found.',
      psychometric: kit.psychometric,
      communication: kit.communication,
      technicalNote: kit.technicalNote,
      certificates: pick(kit.certificates, i, 1 + (i % 2)),
      courses: courses.map((c) => ({ ...c, hasCertificate: true })),
      assessments: assessments.map((a, k) => ({
        name: a.name,
        type: a.type,
        scorePct: 68 + ((i * 7 + k * 11) % 28),
        lastAssessedOn: `2026-0${3 + ((i + k) % 5)}-${String(8 + ((i * 3 + k) % 18)).padStart(2, '0')}`,
        hasReport: true,
        hasProctoring: (i + k) % 2 === 0,
      })),
    },
  };
};

const SPECS: Spec[] = [
  {
    id: 'hp1', name: 'Neha Joshi', resumeId: 'RS-2101', domain: 'Tax', profile: 'Associate - Tax Preparer', level: 2, gender: 'Female', rate: 13, notice: 0,
    location: 'Ahmedabad', mode: 'Hybrid', quals: ['B.Com', 'M.Com (Taxation)'], us: [2, 6], india: [1, 3], seed: 0, psychFile: true,
    summary: 'Tax preparer with two busy seasons of individual and small-business returns for US clients. Comfortable with high volumes and reviewer feedback.',
    jobs: [job('Associate - Tax Preparer', 'Willow Creek Tax Services', '2023-02-01', null, 'Form 1040 and 1120-S preparation, state returns, extension filings'), job('Tax Intern', 'Maple Row Associates', '2022-01-01', '2023-01-01', 'Organizer review, data entry, e-file support')],
  },
  {
    id: 'hp2', name: 'Rahul Mehra', resumeId: 'RS-2102', domain: 'Tax', profile: 'Specialist - Tax Accountant', level: 3, gender: 'Male', rate: 17, notice: 30, buyout: 15,
    location: 'Pune', mode: 'WFH', quals: ['B.Com', 'CA Inter'], us: [4, 2], india: [1, 6], seed: 1, skillCount: 7,
    summary: 'Tax accountant who reviews 1065 and 1120 returns and mentors junior preparers. Strong with multi-state filings and tax research memos.',
    jobs: [job('Tax Accountant', 'Summit Ridge CPAs', '2021-09-01', null, 'Partnership and corporate returns, multi-state apportionment, review notes'), job('Associate - Tax', 'Brightline Advisors', '2020-02-01', '2021-08-01', '1040 and 1120-S preparation, estimates, amended returns')],
  },
  {
    id: 'hp3', name: 'Isha Trivedi', resumeId: 'RS-2103', domain: 'Tax', profile: 'Associate - Tax Preparer', level: 2, gender: 'Female', rate: 12, notice: 15,
    location: 'Ahmedabad', mode: 'WFO', quals: ['B.Com'], us: [1, 10], india: [0, 8], seed: 2,
    summary: 'Detail-oriented preparer with experience in individual returns and state filings. Quick learner on new tax software.',
    jobs: [job('Associate - Tax Preparer', 'Cedarwood Partners', '2024-01-01', null, '1040 preparation, state returns, client organizers')],
  },
  {
    id: 'hp4', name: 'Yash Parmar', resumeId: 'RS-2104', domain: 'Tax', profile: 'Senior - Tax Reviewer', level: 4, gender: 'Male', rate: 22, notice: 60, buyout: 30,
    location: 'Hyderabad', mode: 'Hybrid', quals: ['B.Com', 'M.Com', 'CMA'], us: [6, 4], india: [2, 0], seed: 3, skillCount: 8, psychFile: true,
    summary: 'Senior reviewer with six busy seasons across individual, partnership and corporate engagements. Trains preparers and owns quality checks.',
    jobs: [job('Senior Tax Reviewer', 'Ironbridge Consulting', '2020-04-01', null, 'First-level review, planning, staff training, review checklists'), job('Tax Accountant', 'Granite Peak Assurance', '2018-06-01', '2020-03-01', 'Business returns, depreciation schedules, state tax')],
  },
  {
    id: 'hp5', name: 'Komal Desai', resumeId: 'RS-2105', domain: 'Tax', profile: 'Associate - Expatriate Tax Preparer', level: 2, gender: 'Female', rate: 15, notice: 45,
    location: 'Pune', mode: 'WFH', quals: ['B.Com', 'EA (in progress)'], us: [2, 2], india: [1, 0], seed: 4,
    summary: 'Prepares non-resident and dual-status returns, treaty claims and FBAR filings. Comfortable with foreign income and credit calculations.',
    jobs: [job('Associate - Expatriate Tax', 'Northgate Advisory', '2023-05-01', null, '1040-NR, dual-status returns, foreign tax credit, FBAR')],
  },
  {
    id: 'hp6', name: 'Dhruv Shah', resumeId: 'RS-2106', domain: 'Accounting & Bookkeeping', profile: 'Associate - Bookkeeper', level: 2, gender: 'Male', rate: 10, notice: 0,
    location: 'Indore', mode: 'WFO', quals: ['B.Com'], us: [1, 8], india: [1, 0], seed: 0,
    summary: 'Bookkeeper handling AP, AR and reconciliations for small US businesses. Reliable with deadlines and client follow-ups.',
    jobs: [job('Bookkeeper', 'Harbor Light Books', '2023-03-01', null, 'AP/AR, bank and credit-card reconciliations, month-end close')],
  },
  {
    id: 'hp7', name: 'Anjali Kapoor', resumeId: 'RS-2107', domain: 'Accounting & Bookkeeping', profile: 'Associate - Accountant', level: 3, gender: 'Female', rate: 15, notice: 30,
    location: 'Bengaluru', mode: 'Hybrid', quals: ['B.Com', 'M.Com'], us: [3, 3], india: [1, 6], seed: 1, psychFile: true,
    summary: 'Staff accountant preparing monthly financials and management reports for multi-entity clients. Comfortable with accruals and consolidations.',
    jobs: [job('Staff Accountant', 'Silverline Accounting', '2022-07-01', null, 'Month-end close, accruals, financial statements, consolidations'), job('Bookkeeper', 'Bluepeak Books', '2021-01-01', '2022-06-01', 'AP/AR, payroll entries, reconciliations')],
  },
  {
    id: 'hp8', name: 'Varun Iyer', resumeId: 'RS-2108', domain: 'Accounting & Bookkeeping', profile: 'Senior - Accountant', level: 4, gender: 'Male', rate: 20, notice: 60, buyout: 30,
    location: 'Chennai', mode: 'WFH', quals: ['B.Com', 'CA Inter', 'MBA (Finance)'], us: [5, 6], india: [2, 3], seed: 2, skillCount: 8,
    summary: 'Senior accountant owning close calendars, reviews and client reporting. Sets up clean workflows and trains new bookkeepers.',
    jobs: [job('Senior Accountant', 'Clearwater Ledger Co.', '2020-10-01', null, 'Close management, review, audit support, process documentation'), job('Accountant', 'Oakmont Financial', '2018-08-01', '2020-09-01', 'Reconciliations, accruals, management reporting')],
  },
  {
    id: 'hp9', name: 'Meera Nair', resumeId: 'RS-2109', domain: 'Accounting & Bookkeeping', profile: 'Associate - Bookkeeper', level: 2, gender: 'Female', rate: 11, notice: 15,
    location: 'Jaipur', mode: 'WFH', quals: ['B.Com'], us: [1, 4], india: [1, 6], seed: 3, video: false,
    summary: 'Bookkeeper with hands-on QuickBooks Online experience. Keeps clean records and flags unusual items early.',
    jobs: [job('Bookkeeper', 'Pinecrest Valuation', '2023-09-01', null, 'AP/AR, bank reconciliations, sales tax filings')],
  },
  {
    id: 'hp10', name: 'Siddharth Rao', resumeId: 'RS-2110', domain: 'Audit & Assurance', profile: 'Specialist - Audit Associate', level: 3, gender: 'Male', rate: 17, notice: 30,
    location: 'Hyderabad', mode: 'Hybrid', quals: ['B.Com', 'CA Inter'], us: [3, 0], india: [1, 2], seed: 0, psychFile: true,
    summary: 'Audit associate with experience in planning, testing and documentation for mid-size US engagements. Strong with workpapers.',
    jobs: [job('Audit Associate', 'Redwood Assurance', '2022-09-01', null, 'Risk assessment, sampling, substantive testing, workpaper review'), job('Audit Trainee', 'Lakeside & Co.', '2021-07-01', '2022-08-01', 'Confirmations, vouching, tick-and-tie')],
  },
  {
    id: 'hp11', name: 'Farah Khan', resumeId: 'RS-2111', domain: 'Audit & Assurance', profile: 'Associate - Audit Associate', level: 2, gender: 'Female', rate: 14, notice: 0,
    location: 'Pune', mode: 'WFO', quals: ['B.Com'], us: [1, 6], india: [1, 0], seed: 1, verified: false,
    summary: 'Audit associate supporting walkthroughs, control testing and PBC tracking. Organized and quick with documentation.',
    jobs: [job('Audit Associate', 'Granite Peak Assurance', '2024-02-01', null, 'Control testing, PBC tracking, workpaper tick-and-tie')],
  },
  {
    id: 'hp12', name: 'Gautam Bose', resumeId: 'RS-2112', domain: 'Audit & Assurance', profile: 'Senior - Audit Associate', level: 4, gender: 'Male', rate: 23, notice: 90, buyout: 45,
    location: 'Bengaluru', mode: 'Hybrid', quals: ['B.Com', 'CA', 'CIA'], us: [5, 0], india: [3, 4], seed: 2, skillCount: 8,
    summary: 'Senior audit associate who leads fieldwork, reviews junior workpapers and prepares findings for managers. SOC reporting support experience.',
    jobs: [job('Senior Audit Associate', 'Redwood Assurance', '2019-11-01', null, 'Fieldwork lead, review, SOC support, client walkthroughs'), job('Audit Associate', 'Lakeside & Co.', '2017-06-01', '2019-10-01', 'Testing, documentation, confirmations')],
  },
  {
    id: 'hp13', name: 'Tanya Sethi', resumeId: 'RS-2113', domain: 'Business Valuation', profile: 'Associate - Valuation Analyst', level: 2, gender: 'Female', rate: 18, notice: 30,
    location: 'Bengaluru', mode: 'Hybrid', quals: ['B.Com', 'MBA (Finance)'], us: [1, 9], india: [1, 3], seed: 0,
    summary: 'Valuation analyst building DCF and market-approach models for small and mid-size businesses. Writes clear report sections.',
    jobs: [job('Valuation Analyst', 'Pinecrest Valuation', '2023-06-01', null, 'DCF models, comparable companies, report drafting')],
  },
  {
    id: 'hp14', name: 'Rohan Kulkarni', resumeId: 'RS-2114', domain: 'Business Valuation', profile: 'Specialist - Valuation Analyst', level: 3, gender: 'Male', rate: 26, notice: 60, buyout: 30,
    location: 'Pune', mode: 'WFH', quals: ['B.Com', 'CFA Level 2'], us: [4, 0], india: [1, 6], seed: 1, psychFile: true,
    summary: 'Specialist analyst handling purchase price allocations, 409A work and fairness-opinion support. Reviews junior models.',
    jobs: [job('Valuation Specialist', 'Northgate Advisory', '2021-08-01', null, 'PPA, 409A valuations, model review, report drafting'), job('Valuation Analyst', 'Oakmont Financial', '2019-09-01', '2021-07-01', 'DCF, guideline companies, industry research')],
  },
  {
    id: 'hp15', name: 'Nandini Reddy', resumeId: 'RS-2115', domain: 'Advisory', profile: 'Associate - Business Advisor', level: 2, gender: 'Female', rate: 19, notice: 45,
    location: 'Chennai', mode: 'Hybrid', quals: ['B.Com', 'MBA'], us: [2, 0], india: [1, 8], seed: 0,
    summary: 'Advisory associate building forecasts, KPI dashboards and monthly management packs for owner-managed businesses.',
    jobs: [job('Business Advisor', 'Ironbridge Consulting', '2023-04-01', null, 'Cash-flow forecasts, KPI dashboards, client reporting')],
  },
  {
    id: 'hp16', name: 'Arjun Menon', resumeId: 'RS-2116', domain: 'Tax', profile: 'Specialist - Tax Accountant', level: 3, gender: 'Male', rate: 18, notice: 30,
    location: 'Ahmedabad', mode: 'WFO', quals: ['B.Com', 'M.Com', 'EA'], us: [4, 8], india: [1, 0], seed: 5, skillCount: 6, psychFile: true,
    summary: 'Enrolled Agent with four years of US tax. Handles trust and estate returns, extensions and IRS notice responses.',
    jobs: [job('Tax Accountant', 'Willow Creek Tax Services', '2021-03-01', null, '1041, 1040, IRS notices, estimates'), job('Associate - Tax', 'Cedarwood Partners', '2019-06-01', '2021-02-01', '1040 and 1120-S preparation')],
  },
  {
    id: 'hp17', name: 'Sneha Pillai', resumeId: 'RS-2117', domain: 'Accounting & Bookkeeping', profile: 'Associate - Accountant', level: 3, gender: 'Female', rate: 16, notice: 0,
    location: 'Indore', mode: 'WFH', quals: ['B.Com', 'M.Com'], us: [2, 10], india: [1, 2], seed: 4, verified: false,
    summary: 'Accountant covering month-end close, accruals and variance commentary. Experienced with Xero and Sage Intacct clients.',
    jobs: [job('Accountant', 'Bluepeak Books', '2022-05-01', null, 'Close, accruals, variance commentary, sales tax')],
  },
  {
    id: 'hp18', name: 'Kabir Anand', resumeId: 'RS-2118', domain: 'Tax', profile: 'Associate - Tax Preparer', level: 1, gender: 'Male', rate: 9, notice: 0,
    location: 'Jaipur', mode: 'WFO', quals: ['B.Com'], us: [0, 9], india: [0, 6], seed: 6, skillCount: 4,
    summary: 'Early-career preparer trained on 1040 workflows and e-file. Eager to learn and works well with review feedback.',
    jobs: [job('Tax Preparer Trainee', 'Summit Ridge CPAs', '2025-07-01', null, '1040 data entry, e-file, organizer review')],
  },
  {
    id: 'hp19', name: 'Lavanya Gupta', resumeId: 'RS-2119', domain: 'Audit & Assurance', profile: 'Specialist - Audit Associate', level: 3, gender: 'Female', rate: 18, notice: 45,
    location: 'Chennai', mode: 'Hybrid', quals: ['B.Com', 'CA Inter'], us: [3, 4], india: [1, 0], seed: 3,
    summary: 'Audit specialist experienced in revenue and payables testing, sampling and clear workpaper notes for review.',
    jobs: [job('Audit Specialist', 'Redwood Assurance', '2022-03-01', null, 'Revenue testing, sampling, workpaper notes')],
  },
  {
    id: 'hp20', name: 'Mohit Chauhan', resumeId: 'RS-2120', domain: 'Tax', profile: 'Senior - Tax Reviewer', level: 5, gender: 'Male', rate: 32, notice: 90, buyout: 45,
    location: 'Hyderabad', mode: 'WFH', quals: ['B.Com', 'CA', 'EA'], us: [9, 2], india: [3, 0], seed: 7, skillCount: 9, psychFile: true,
    summary: 'Tax manager-level reviewer with nine seasons across entity, trust and multi-state work. Leads review queues and mentors a team of preparers.',
    jobs: [job('Tax Review Manager', 'Ironbridge Consulting', '2018-04-01', null, 'Review queue ownership, planning, training, complex entity returns'), job('Senior Tax Accountant', 'Summit Ridge CPAs', '2015-07-01', '2018-03-01', 'Partnership and corporate returns, tax research')],
  },
  {
    id: 'hp21', name: 'Pallavi Deshmukh', resumeId: 'RS-2121', domain: 'Accounting & Bookkeeping', profile: 'Associate - Bookkeeper', level: 2, gender: 'Female', rate: 11, notice: 30,
    location: 'Pune', mode: 'Hybrid', quals: ['B.Com'], us: [1, 11], india: [0, 10], seed: 5,
    summary: 'Bookkeeper experienced in daily transaction coding, reconciliations and payroll journal entries.',
    jobs: [job('Bookkeeper', 'Harbor Light Books', '2023-11-01', null, 'Transaction coding, reconciliations, payroll journals')],
  },
  {
    id: 'hp22', name: 'Ayaan Qureshi', resumeId: 'RS-2122', domain: 'Advisory', profile: 'Associate - Business Advisor', level: 2, gender: 'Male', rate: 17, notice: 15,
    location: 'Bengaluru', mode: 'WFH', quals: ['B.Com', 'CMA (in progress)'], us: [1, 6], india: [2, 0], seed: 3, video: false,
    summary: 'Advisory associate focused on budgeting, forecasting and dashboard reporting. Good at explaining numbers to non-finance owners.',
    jobs: [job('Business Analyst', 'Northgate Advisory', '2023-01-01', null, 'Budgeting, forecasting, KPI dashboards')],
  },
  {
    id: 'hp23', name: 'Bhumi Thakkar', resumeId: 'RS-2123', domain: 'Business Valuation', profile: 'Associate - Valuation Analyst', level: 2, gender: 'Female', rate: 16, notice: 0,
    location: 'Ahmedabad', mode: 'Hybrid', quals: ['B.Com', 'M.Com'], us: [1, 2], india: [1, 0], seed: 1,
    summary: 'Analyst supporting valuation reports with industry research, comparable selection and model checks.',
    jobs: [job('Valuation Analyst', 'Oakmont Financial', '2024-05-01', null, 'Industry research, comparables, model checks')],
  },
  {
    id: 'hp24', name: 'Chirag Solanki', resumeId: 'RS-2124', domain: 'Audit & Assurance', profile: 'Associate - Audit Associate', level: 2, gender: 'Male', rate: 13, notice: 30,
    location: 'Indore', mode: 'WFO', quals: ['B.Com'], us: [1, 8], india: [0, 8], seed: 4,
    summary: 'Audit associate with solid Excel skills for sampling and tie-outs. Keeps PBC lists and workpapers current.',
    jobs: [job('Audit Associate', 'Lakeside & Co.', '2023-10-01', null, 'Sampling, tie-outs, PBC tracking')],
  },
];

export const HUB_PROFILES_SEED: HubProfile[] = SPECS.map(build);

/** Saved Resumes the client already bookmarked (desktop `tblclient_market_like`) */
export const HUB_SAVED_SEED: string[] = ['hp2', 'hp7', 'hp14'];
