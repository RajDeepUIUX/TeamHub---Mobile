/**
 * Mock data for Hire New Staff → Staff Requirements (desktop `demands` controller: `index` = list, `demands_list` = table,
 * `savedemand` / `updatedemand` = Add / Edit Requirement, `getDemandDetailAjax` = View Requirement, `filter_data` = filters).
 * Desktop saves one row per head (No. of Staff = 3 creates 3 requirements). Edit is allowed while the requirement has no project
 * or the project is still at stage 1-2. All names, rates and notes are dummy data.
 */
import type { ThreadComment } from '../../../types/comments';
import { hourlyRateForLevel } from './clientHiringPricingData';
import type { HubProfile, HubRequirement } from './clientStaffHubData';
import type { ShortlistedCandidate } from './clientInterviewsData';

/* --------------------------------- Types ---------------------------------- */

export type RequirementStatus = 'In Progress' | 'Completed' | 'Not Required';
export const REQUIREMENT_STATUSES: RequirementStatus[] = ['In Progress', 'Completed', 'Not Required'];
/** Desktop opens with In Progress + Completed selected */
export const DEFAULT_REQUIREMENT_STATUSES: RequirementStatus[] = ['In Progress', 'Completed'];

export type YesNo = 'Yes' | 'No' | '';
export type YesNoMaybe = 'Yes' | 'No' | 'Maybe' | '';
export type RequirementWorkMode = 'Hybrid' | 'WFO' | 'WFH';
export type Overtime = '10 hours/week' | '20 hours/week' | '';
export type ReportingTo = 'One Person' | 'Multiple Persons' | '';

export interface StaffRequirement {
  id: string;
  hiringType: string;
  domain: string;
  profile: string;
  /** Empty when the profile has no level (desktop level is optional) */
  level: string;
  hoursPerWeek: number;
  /** Desktop "Tentative Price", e.g. "$13 / Hr" or "$14 - $17 / Hr" */
  pricing: string;
  budgetRate: string;
  timeline: string;
  startDate: string;
  staffCount: number;
  timezone: string;
  /** "HH:MM" 24h (desktop "Preferred Available Upto Time") */
  availableUpto: string;
  workMode: RequirementWorkMode;
  locations: string[];
  endClientComm: YesNo;
  overtimeSeasonal: Overtime;
  overtimeRoy: Overtime;
  interviewRequired: YesNo;
  reportingTo: ReportingTo;
  communication: string[];
  tasks: string[];
  travelUS: YesNoMaybe;
  technicalAssessment: YesNo;
  signTaxReturn: YesNo;
  signAuditReport: YesNo;
  software: string[];
  skills: string[];
  qualifications: string[];
  additionalNotes: string;
  jobDescription: string;
  status: RequirementStatus;
  /** Desktop `canEditDemand`: no project yet, or project stage 1-2 */
  editable: boolean;
  createdOn: string;
  comments: ThreadComment[];
}

/** Everything the Add / Edit form collects */
export type RequirementDraft = Omit<StaffRequirement, 'id' | 'status' | 'editable' | 'createdOn' | 'comments'>;

/* ------------------------------- Master data ------------------------------- */

export const HIRING_TYPE = 'Regular Staffing';
export const HOURS_OPTIONS = [10, 20, 30, 40];
export const BUDGET_RATE_MIN = 11;
export const REQUIREMENT_STAFF_MAX = 10;
export const REQUIREMENT_PAGE_SIZE = 8;

export const TIMELINE_OPTIONS = ['0 - 3 Months', '3 - 6 Months', '6 - 12 Months', 'Above 12 Months'];
export const WORK_MODE_OPTIONS: RequirementWorkMode[] = ['Hybrid', 'WFO', 'WFH'];
export const OFFSHORE_LOCATIONS = ['Ahmedabad', 'Bengaluru', 'Chennai', 'Hyderabad', 'Indore', 'Jaipur', 'Pune'];
export const TIMEZONES = ['EST', 'EDT', 'CST', 'CDT', 'MST', 'MDT', 'PST', 'PDT', 'AKST', 'HST'];
export const OVERTIME_OPTIONS: Exclude<Overtime, ''>[] = ['10 hours/week', '20 hours/week'];
export const REPORTING_OPTIONS: Exclude<ReportingTo, ''>[] = ['One Person', 'Multiple Persons'];
export const COMMUNICATION_OPTIONS = [
  'Low Internal Communication (Written)',
  'High Internal Communication (Written + Meetings)',
  'Low Client Communication (Written)',
  'High Client Communication (Written + Meetings)',
];
export const TASK_OPTIONS = [
  'Preparation Tasks',
  'Review & Train – Offshore Staff Work',
  'Review & Train – Onshore Staff Work',
  'Assisting Partner or Director in Client Delivery',
  'Direct Client Handling with Partner Oversight',
];
export const QUALIFICATION_OPTIONS = ['B.Com', 'M.Com', 'MBA (Finance)', 'CA Inter', 'CA', 'CMA', 'CFA', 'Enrolled Agent (EA)', 'CPA'];

interface PricingProfile {
  name: string;
  levels: number[];
}

interface DomainSpec {
  name: string;
  /** Desktop `is_tax_return` / `is_audit_report`: show the "required to sign" questions */
  signsTaxReturn?: boolean;
  signsAuditReport?: boolean;
  profiles: PricingProfile[];
  software: string[];
  skills: string[];
}

/** Desktop domain → profile → level pricing (`tblprofile_pricing`), software and skills lists */
export const REQUIREMENT_DOMAINS: DomainSpec[] = [
  {
    name: 'Tax',
    signsTaxReturn: true,
    profiles: [
      { name: 'Associate - Tax Preparer', levels: [1, 2] },
      { name: 'Associate - Expatriate Tax Preparer', levels: [2] },
      { name: 'Specialist - Tax Accountant', levels: [3] },
      { name: 'Senior - Tax Reviewer', levels: [4, 5] },
    ],
    software: ['CCH Axcess', 'Drake', 'UltraTax', 'Lacerte', 'QuickBooks Online', 'Excel'],
    skills: ['Individual tax returns (1040)', 'S-Corporation returns (1120-S)', 'Partnership returns (1065)', 'C-Corporation returns (1120)', 'State & local tax', 'Extension & estimate filings', 'Trust & estate returns (1041)', 'Tax research'],
  },
  {
    name: 'Accounting & Bookkeeping',
    profiles: [
      { name: 'Associate - Bookkeeper', levels: [1, 2] },
      { name: 'Associate - Accountant', levels: [2, 3] },
      { name: 'Senior - Accountant', levels: [4] },
    ],
    software: ['QuickBooks Online', 'Xero', 'FreshBooks', 'Sage Intacct', 'Excel'],
    skills: ['Accounts payable / receivable', 'Bank reconciliations', 'Month-end close', 'Payroll entries', 'Journal entries', 'Financial statement preparation', 'Sales tax filings', 'Budget vs actual reporting'],
  },
  {
    name: 'Audit & Assurance',
    signsAuditReport: true,
    profiles: [
      { name: 'Associate - Audit Associate', levels: [2] },
      { name: 'Specialist - Audit Associate', levels: [3] },
      { name: 'Senior - Audit Associate', levels: [4] },
    ],
    software: ['CaseWare', 'Excel', 'Power BI', 'AuditBoard'],
    skills: ['Audit planning', 'Sampling & testing', 'Internal controls', 'Workpaper documentation', 'Risk assessment', 'Substantive testing', 'Confirmations', 'SOC reporting support'],
  },
  {
    name: 'Business Valuation',
    profiles: [
      { name: 'Associate - Valuation Analyst', levels: [2] },
      { name: 'Specialist - Valuation Analyst', levels: [3] },
    ],
    software: ['Excel', 'Power BI', 'Capital IQ', 'BVR DealStats'],
    skills: ['Discounted cash flow models', 'Comparable company analysis', 'Precedent transactions', 'Purchase price allocation', 'Valuation reports', 'Industry research'],
  },
  {
    name: 'Advisory',
    profiles: [{ name: 'Associate - Business Advisor', levels: [2, 3] }],
    software: ['Excel', 'Power BI', 'QuickBooks Online', 'Fathom'],
    skills: ['Cash-flow forecasting', 'KPI dashboards', 'Process documentation', 'Budgeting & planning', 'Client reporting', 'Business case analysis'],
  },
];

export const domainSpecOf = (domain: string) => REQUIREMENT_DOMAINS.find((d) => d.name === domain);
export const profilesOfDomain = (domain: string) => domainSpecOf(domain)?.profiles ?? [];
export const levelsOfProfile = (domain: string, profile: string) =>
  (profilesOfDomain(domain).find((p) => p.name === profile)?.levels ?? []).map((n) => `Level ${n}`);

/** Desktop "Tentative Price" shown once the level is known: the same per-level rate as Hiring Pricing (USD) */
export const tentativePricing = (_domain: string, level: string) => {
  const rate = hourlyRateForLevel(Number(level.replace(/\D/g, '')));
  return rate ? `${rate} / Hr` : '';
};

/* ------------------------------- Form helpers ------------------------------- */

export const EMPTY_REQUIREMENT_DRAFT: RequirementDraft = {
  hiringType: HIRING_TYPE,
  domain: '',
  profile: '',
  level: '',
  hoursPerWeek: 0,
  pricing: '',
  budgetRate: '',
  timeline: '',
  startDate: '',
  staffCount: 1,
  timezone: 'EST',
  availableUpto: '',
  workMode: 'WFO',
  locations: [],
  endClientComm: '',
  overtimeSeasonal: '',
  overtimeRoy: '',
  interviewRequired: '',
  reportingTo: '',
  communication: [],
  tasks: [],
  travelUS: '',
  technicalAssessment: '',
  signTaxReturn: '',
  signAuditReport: '',
  software: [],
  skills: [],
  qualifications: [],
  additionalNotes: '',
  jobDescription: '',
};

export const draftOf = (r: StaffRequirement): RequirementDraft => {
  const { id: _id, status: _s, editable: _e, createdOn: _c, comments: _m, ...draft } = r;
  return draft;
};

/** Desktop "Add Requirement" opens with Hiring Type / No. of Staff on "Select" and Available Upto at 22:00 */
export const newRequirementDraft = (locations: string[]): RequirementDraft => ({
  ...EMPTY_REQUIREMENT_DRAFT,
  hiringType: '',
  staffCount: 0,
  availableUpto: '22:00',
  locations,
});

/** Desktop saves one requirement per head */
export const requirementsFromDraft = (draft: RequirementDraft, createdOn: string): StaffRequirement[] => {
  const stamp = Date.now();
  return Array.from({ length: draft.staffCount }, (_, i) => ({
    ...draft,
    id: `rq-${stamp}-${i}`,
    staffCount: 1,
    status: 'In Progress',
    editable: true,
    createdOn,
    comments: [],
  }));
};

/** Onboarding Timeline that fits a start date (months from today) */
const timelineFor = (startDate: string, today: string) => {
  const months = (new Date(`${startDate}T00:00:00`).getTime() - new Date(`${today}T00:00:00`).getTime()) / (30 * 86_400_000);
  return months <= 3 ? TIMELINE_OPTIONS[0] : months <= 6 ? TIMELINE_OPTIONS[1] : months <= 12 ? TIMELINE_OPTIONS[2] : TIMELINE_OPTIONS[3];
};

/** Available Staff Hub "Add Staff Requirement": domain / profile / level / work mode / location come from the resume */
export const requirementsFromHub = (p: HubProfile, req: HubRequirement, createdOn: string): StaffRequirement[] =>
  requirementsFromDraft(
    {
      ...EMPTY_REQUIREMENT_DRAFT,
      domain: p.domain,
      profile: p.profile,
      level: p.resume.level,
      pricing: tentativePricing(p.domain, p.resume.level),
      hoursPerWeek: req.hoursPerWeek,
      timeline: timelineFor(req.startDate, createdOn),
      startDate: req.startDate,
      staffCount: req.staffCount,
      availableUpto: '22:00',
      workMode: p.workMode,
      locations: [p.location],
    },
    createdOn,
  );

/** Desktop `profilewise_timesheet_ajax`: an open requirement for the profile skips "Add Staff Requirement" */
export const hasOpenRequirementFor = (requirements: StaffRequirement[], profile: string) =>
  requirements.some((r) => r.status === 'In Progress' && r.profile === profile);

export type DraftErrors = Partial<Record<keyof RequirementDraft, string>>;

/** Step 1 (Core Details) required fields: desktop jQuery-validate rules */
export const validateCore = (d: RequirementDraft): DraftErrors => {
  const e: DraftErrors = {};
  if (!d.hiringType) e.hiringType = 'Hiring Type is required.';
  if (!d.domain) e.domain = 'Domain is required.';
  if (!d.profile) e.profile = 'Profile is required.';
  if (!d.hoursPerWeek) e.hoursPerWeek = 'Hours/Week is required.';
  if (d.budgetRate.trim()) {
    const n = Number(d.budgetRate);
    if (!Number.isFinite(n) || n < BUDGET_RATE_MIN) e.budgetRate = `Budget Hourly Rate must be at least $${BUDGET_RATE_MIN}.`;
  }
  if (!d.timeline) e.timeline = 'Onboarding Timeline is required.';
  if (!d.startDate) e.startDate = 'Expected Start Date is required.';
  if (!d.staffCount) e.staffCount = 'No. of Staff is required.';
  if (!d.timezone) e.timezone = 'Time zone is required.';
  if (!d.availableUpto) e.availableUpto = 'Preferred Available Upto Time is required.';
  return e;
};

/** Desktop "Generate with AI" asks for these before it will run */
export const missingForAi = (d: RequirementDraft): string[] => {
  const missing: string[] = [];
  if (!d.staffCount) missing.push('No. of Staff');
  if (!d.domain) missing.push('Domain');
  const levelNo = Number(d.level.replace(/\D/g, ''));
  if (levelNo >= 4 && d.qualifications.length === 0) missing.push('Qualification');
  if (!d.workMode) missing.push('Work Mode Preference');
  if (d.skills.length === 0) missing.push('Technical Skills');
  if (d.software.length === 0) missing.push('Software Skills');
  return missing;
};

/** Mock of the desktop AI job description (`generate_job_description`) */
export const generateJobDescription = (d: RequirementDraft) => {
  const title = d.level ? `${d.profile} (${d.level})` : d.profile;
  const lines = [
    `Job Title: ${title}`,
    `Domain: ${d.domain}`,
    `Positions: ${d.staffCount}`,
    `Work Mode: ${d.workMode}${d.locations.length ? ` · ${d.locations.join(', ')}` : ''}`,
    '',
    'Responsibilities:',
    ...(d.tasks.length ? d.tasks : ['Preparation Tasks']).map((t) => `- ${t}`),
    ...d.skills.slice(0, 5).map((s) => `- ${s}`),
    '',
    `Software: ${d.software.join(', ')}`,
  ];
  if (d.qualifications.length) lines.push(`Qualifications: ${d.qualifications.join(', ')}`);
  lines.push(`Availability: until ${formatTime12(d.availableUpto)} ${d.timezone}, ${d.hoursPerWeek} hours/week.`);
  return lines.join('\n');
};

/* ---------------------------- Display + filtering ---------------------------- */

const pad = (n: number) => String(n).padStart(2, '0');
export const formatTime12 = (hhmm: string) => {
  if (!hhmm) return '-';
  const [h, m] = hhmm.split(':').map(Number);
  return `${pad(h % 12 || 12)}:${pad(m)} ${h >= 12 ? 'PM' : 'AM'}`;
};

export const statusTone = (s: RequirementStatus) => (s === 'Completed' ? 'green' : s === 'Not Required' ? 'slate' : 'amber') as 'green' | 'slate' | 'amber';

export interface RequirementFilters {
  /** ISO date; desktop matches the exact tentative date */
  date: string;
  profiles: string[];
  locations: string[];
  statuses: RequirementStatus[];
}

export const EMPTY_REQUIREMENT_FILTERS: RequirementFilters = {
  date: '',
  profiles: [],
  locations: [],
  statuses: DEFAULT_REQUIREMENT_STATUSES,
};

const sameStatuses = (a: RequirementStatus[]) =>
  a.length === DEFAULT_REQUIREMENT_STATUSES.length && DEFAULT_REQUIREMENT_STATUSES.every((s) => a.includes(s));

/** Badge count: the default status selection does not count as a filter */
export const requirementFilterCount = (f: RequirementFilters) =>
  (f.date ? 1 : 0) + f.profiles.length + f.locations.length + (sameStatuses(f.statuses) ? 0 : 1);

export const matchesRequirement = (r: StaffRequirement, query: string, f: RequirementFilters) => {
  const q = query.trim().toLowerCase();
  if (q && !`${r.profile} ${r.domain} ${r.level} ${r.locations.join(' ')}`.toLowerCase().includes(q)) return false;
  if (f.date && r.startDate !== f.date) return false;
  if (f.profiles.length && !f.profiles.includes(r.profile)) return false;
  // Desktop: every chosen location must be on the requirement (find_in_set per location)
  if (f.locations.length && !f.locations.every((l) => r.locations.includes(l))) return false;
  if (f.statuses.length && !f.statuses.includes(r.status)) return false;
  return true;
};

/** Desktop "Available Resumes": Hub profiles of the same profile the client has not shortlisted yet */
export const availableResumesFor = (r: StaffRequirement, hub: HubProfile[], candidates: ShortlistedCandidate[]) =>
  hub.filter((p) => p.profile === r.profile && !candidates.some((c) => c.resumeId === p.resumeId)).length;

/** Desktop "Shortlisted Candidates": candidates added for the requirement's profile */
export const shortlistedFor = (r: StaffRequirement, candidates: ShortlistedCandidate[]) =>
  candidates.filter((c) => c.profile === r.profile).length;

/* ------------------------- Dashboard › Staff Requirement ------------------------- */

export const REQUIREMENT_PREVIEW_COUNT = 3;

/** Open (In Progress) requirements, soonest expected start first; no start date last */
export const openRequirementsOf = (requirements: StaffRequirement[]) =>
  requirements
    .filter((r) => r.status === 'In Progress')
    .sort((a, b) => (a.startDate || '9999').localeCompare(b.startDate || '9999'));

/** Totals across the open requirements' profiles (each resume / candidate counted once) */
export const openRequirementTotals = (open: StaffRequirement[], hub: HubProfile[], candidates: ShortlistedCandidate[]) => {
  const profiles = new Set(open.map((r) => r.profile));
  return {
    resumes: hub.filter((p) => profiles.has(p.profile) && !candidates.some((c) => c.resumeId === p.resumeId)).length,
    shortlisted: candidates.filter((c) => profiles.has(c.profile)).length,
  };
};

/* ---------------------------------- Seeds ---------------------------------- */

const base = (patch: Partial<StaffRequirement> & Pick<StaffRequirement, 'id' | 'domain' | 'profile' | 'level'>): StaffRequirement => ({
  ...EMPTY_REQUIREMENT_DRAFT,
  hoursPerWeek: 40,
  pricing: tentativePricing(patch.domain, patch.level),
  timeline: '0 - 3 Months',
  startDate: '2026-11-16',
  status: 'In Progress',
  editable: true,
  createdOn: '2026-10-05',
  comments: [],
  ...patch,
});


export const REQUIREMENTS_SEED: StaffRequirement[] = [
  base({
    id: 'rq1', domain: 'Tax', profile: 'Associate - Tax Preparer', level: 'Level 2', pricing: tentativePricing('Tax', 'Level 2'),
    timeline: '0 - 3 Months', startDate: '2026-11-16', budgetRate: '14', availableUpto: '13:00', workMode: 'Hybrid',
    locations: ['Ahmedabad', 'Pune'], endClientComm: 'Yes', overtimeSeasonal: '20 hours/week', overtimeRoy: '10 hours/week', interviewRequired: 'Yes',
    reportingTo: 'One Person', communication: ['Low Client Communication (Written)'], tasks: ['Preparation Tasks'], travelUS: 'No',
    technicalAssessment: 'Yes', signTaxReturn: 'No', software: ['CCH Axcess', 'Drake'], skills: ['Individual tax returns (1040)', 'State & local tax'],
    qualifications: ['B.Com'], additionalNotes: 'Busy season support from January. Prior experience with 1040 e-file preferred.',
    jobDescription: 'Prepare individual and small-business returns for US clients, respond to reviewer notes and keep organizers up to date.',
    createdOn: '2026-10-05',
    comments: [
      { id: 'c1', author: 'Priya Desai', role: 'Support', text: 'Thanks for the requirement. We have shared 4 matching resumes in the Available Staff Hub.', createdAt: '2026-10-06T09:40:00' },
    ],
  }),
  base({
    id: 'rq2', domain: 'Tax', profile: 'Specialist - Tax Accountant', level: 'Level 3', timeline: '3 - 6 Months', startDate: '2026-12-01',
    budgetRate: '', availableUpto: '12:30', workMode: 'WFH', locations: ['Pune'], endClientComm: 'No', interviewRequired: 'Yes',
    reportingTo: 'Multiple Persons', communication: ['High Client Communication (Written + Meetings)', 'Low Internal Communication (Written)'],
    tasks: ['Review & Train – Offshore Staff Work', 'Preparation Tasks'], travelUS: 'Maybe', technicalAssessment: 'Yes', signTaxReturn: 'Yes',
    software: ['UltraTax', 'Lacerte'], skills: ['Partnership returns (1065)', 'C-Corporation returns (1120)', 'Tax research'], qualifications: ['B.Com', 'CA Inter'],
    additionalNotes: '', jobDescription: 'Review and prepare partnership and corporate returns and mentor two junior preparers.', createdOn: '2026-10-08',
  }),
  base({
    id: 'rq3', domain: 'Accounting & Bookkeeping', profile: 'Associate - Bookkeeper', level: 'Level 2', hoursPerWeek: 20, timeline: '0 - 3 Months',
    startDate: '2026-11-02', budgetRate: '12', availableUpto: '14:00', workMode: 'WFO', locations: ['Indore', 'Jaipur', 'Ahmedabad'], endClientComm: 'No',
    interviewRequired: 'No', reportingTo: 'One Person', communication: ['Low Internal Communication (Written)'], tasks: ['Preparation Tasks'],
    technicalAssessment: 'No', software: ['QuickBooks Online'], skills: ['Bank reconciliations', 'Accounts payable / receivable'], qualifications: ['B.Com'],
    additionalNotes: 'Part-time. Daily transaction coding for three small clients.', jobDescription: 'Code daily transactions, reconcile bank and card accounts and close the month by the 5th.',
    createdOn: '2026-09-28', editable: false,
    comments: [
      { id: 'c2', author: 'Taylor Morgan', role: 'Staff', text: 'Can we interview two candidates for this?', createdAt: '2026-10-02T16:10:00' },
      { id: 'c3', author: 'Priya Desai', role: 'Support', text: 'Yes. Both are shortlisted. Please pick a slot from Shortlisted Candidates.', createdAt: '2026-10-03T10:05:00' },
    ],
  }),
  base({
    id: 'rq4', domain: 'Audit & Assurance', profile: 'Specialist - Audit Associate', level: 'Level 3', timeline: '6 - 12 Months', startDate: '2027-01-11',
    budgetRate: '18', availableUpto: '15:00', workMode: 'Hybrid', locations: ['Hyderabad'], endClientComm: 'Yes', interviewRequired: 'Yes',
    reportingTo: 'One Person', communication: ['High Internal Communication (Written + Meetings)'], tasks: ['Assisting Partner or Director in Client Delivery'],
    travelUS: 'No', technicalAssessment: 'Yes', signAuditReport: 'No', software: ['CaseWare', 'Excel'], skills: ['Audit planning', 'Sampling & testing', 'Internal controls'],
    qualifications: ['B.Com', 'CA Inter'], additionalNotes: 'Fieldwork support for year-end audits.', jobDescription: 'Plan and perform testing for mid-size audits and keep workpapers review-ready.',
    createdOn: '2026-10-10',
  }),
  base({
    id: 'rq5', domain: 'Business Valuation', profile: 'Associate - Valuation Analyst', level: 'Level 2', hoursPerWeek: 30, timeline: '3 - 6 Months',
    startDate: '2026-12-14', budgetRate: '', availableUpto: '11:00', workMode: 'WFH', locations: ['Bengaluru'], endClientComm: 'No', interviewRequired: 'Yes',
    reportingTo: 'One Person', communication: ['Low Client Communication (Written)'], tasks: ['Preparation Tasks', 'Assisting Partner or Director in Client Delivery'],
    technicalAssessment: 'Yes', software: ['Excel', 'Capital IQ'], skills: ['Discounted cash flow models', 'Comparable company analysis'], qualifications: ['B.Com', 'MBA (Finance)'],
    additionalNotes: '', jobDescription: 'Build DCF and market-approach models and draft report sections.', createdOn: '2026-10-12',
  }),
  base({
    id: 'rq6', domain: 'Accounting & Bookkeeping', profile: 'Senior - Accountant', level: 'Level 4', timeline: 'Above 12 Months', startDate: '2026-10-26',
    budgetRate: '24', availableUpto: '13:30', workMode: 'Hybrid', locations: ['Chennai', 'Bengaluru'], endClientComm: 'Yes', interviewRequired: 'Yes',
    reportingTo: 'Multiple Persons', communication: ['High Internal Communication (Written + Meetings)', 'High Client Communication (Written + Meetings)'],
    tasks: ['Review & Train – Offshore Staff Work', 'Direct Client Handling with Partner Oversight'], travelUS: 'No', technicalAssessment: 'Yes',
    software: ['QuickBooks Online', 'Sage Intacct', 'Excel'], skills: ['Month-end close', 'Financial statement preparation', 'Budget vs actual reporting'],
    qualifications: ['B.Com', 'CA Inter', 'MBA (Finance)'], additionalNotes: 'Owns the close calendar for six entities.',
    jobDescription: 'Own month-end close, review junior work and prepare management reports for owners.', status: 'Completed', editable: false, createdOn: '2026-08-18',
    comments: [{ id: 'c4', author: 'Priya Desai', role: 'System', text: 'Requirement completed. Candidate hired.', createdAt: '2026-09-22T12:00:00' }],
  }),
  base({
    id: 'rq7', domain: 'Advisory', profile: 'Associate - Business Advisor', level: 'Level 2', hoursPerWeek: 10, timeline: '0 - 3 Months', startDate: '2026-11-23',
    budgetRate: '', availableUpto: '12:00', workMode: 'WFO', locations: ['Chennai'], endClientComm: 'No', interviewRequired: 'No', reportingTo: 'One Person',
    communication: ['Low Internal Communication (Written)'], tasks: ['Preparation Tasks'], technicalAssessment: 'No', software: ['Excel', 'Power BI'],
    skills: ['KPI dashboards', 'Client reporting'], qualifications: ['B.Com'], additionalNotes: '', jobDescription: 'Monthly KPI dashboards and client reporting packs.',
    status: 'Not Required', editable: false, createdOn: '2026-09-02',
  }),
  base({
    id: 'rq8', domain: 'Tax', profile: 'Senior - Tax Reviewer', level: 'Level 4', timeline: '3 - 6 Months', startDate: '2027-01-04', budgetRate: '25',
    availableUpto: '16:00', workMode: 'WFH', locations: ['Hyderabad', 'Pune'], endClientComm: 'Yes', interviewRequired: 'Yes', reportingTo: 'One Person',
    communication: ['High Client Communication (Written + Meetings)'], tasks: ['Review & Train – Offshore Staff Work', 'Review & Train – Onshore Staff Work'],
    travelUS: 'No', technicalAssessment: 'Yes', signTaxReturn: 'No', software: ['CCH Axcess', 'UltraTax'], skills: ['S-Corporation returns (1120-S)', 'Partnership returns (1065)', 'Tax research'],
    qualifications: ['B.Com', 'CA', 'Enrolled Agent (EA)'], additionalNotes: 'Will lead a team of four preparers during busy season.',
    jobDescription: 'First-level review of entity returns, review checklists and preparer training.', createdOn: '2026-10-14',
  }),
];
