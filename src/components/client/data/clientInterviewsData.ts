/**
 * Mock data for Hire New Staff → Shortlisted Candidates (desktop `interviews` controller, `shortlistedcandidates.tpl`,
 * `viewresume.tpl`, `shortlisted_candidates_list_combined`, `save_shortlisted_candidates_feedback`, SC assessments).
 * Desktop list = Available Staff Hub profiles (`project` source) + recruiter-sourced candidates (`candidate` source, MOS clients).
 * All names, resume IDs, companies, links and scores are dummy data.
 */
import { CLIENT_IS_MOS } from './clientTimesheetsData';

/* --------------------------------- Statuses -------------------------------- */

export type CandidateStatus =
  | 'Shortlisted'
  | 'Interview Scheduled'
  | 'Hired'
  | 'Not Selected'
  | 'Applied'
  | 'In Process'
  | 'Hold'
  | 'Selected'
  | 'Left';

/** Desktop status cards: always these four; MOS clients (recruiter-sourced candidates) also get the rest */
const CORE_STATUSES: CandidateStatus[] = ['Shortlisted', 'Interview Scheduled', 'Hired', 'Not Selected'];
const MOS_STATUSES: CandidateStatus[] = ['Applied', 'In Process', 'Hold', 'Selected', 'Left'];
export const CANDIDATE_STATUSES: CandidateStatus[] = CLIENT_IS_MOS ? [...CORE_STATUSES, ...MOS_STATUSES] : CORE_STATUSES;

export type CandidateStatusChip = 'All' | CandidateStatus;
export const CANDIDATE_STATUS_CHIPS: CandidateStatusChip[] = ['All', ...CANDIDATE_STATUSES];

export type CandidateSource = 'hub' | 'recruiter';

/* ------------------------------ Time zone / slots ------------------------------ */

export type InterviewTz = 'EST' | 'CST' | 'MST' | 'PST' | 'BST';

/** Desktop `sciTimezones` (fixed offsets) */
export const INTERVIEW_TIMEZONES: { value: InterviewTz; label: string; offset: number }[] = [
  { value: 'EST', label: 'EST (Eastern Standard Time)', offset: -5 },
  { value: 'CST', label: 'CST (Central Standard Time)', offset: -6 },
  { value: 'MST', label: 'MST (Mountain Standard Time)', offset: -7 },
  { value: 'PST', label: 'PST (Pacific Standard Time)', offset: -8 },
  { value: 'BST', label: 'BST (British Summer Time)', offset: 1 },
];

/** Time zone of Northwind CPA (Company Profile `America/New_York`) */
export const CLIENT_TZ: InterviewTz = 'EST';

const IST_OFFSET = 5.5;
/** Desktop IST booking window: first slot 04:30 PM, last bookable start 11:45 PM; slots every 15 minutes */
const IST_FIRST_START = 16 * 60 + 30;
const IST_LAST_START = 23 * 60 + 45;
const SLOT_STEP = 15;
export const INTERVIEW_MINUTES = 30;
const HOUR_MS = 3_600_000;
const MINUTE_MS = 60_000;

/** Join opens 15 min before the start; Reschedule closes 5 min before; Cancel closes when the 30-min meeting ends */
const JOIN_OPENS_BEFORE_MIN = 15;
const RESCHEDULE_CLOSES_BEFORE_MIN = 5;

export const tzOffset = (tz: InterviewTz) => INTERVIEW_TIMEZONES.find((t) => t.value === tz)?.offset ?? -5;

const pad = (n: number) => String(n).padStart(2, '0');
export const isoOfDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseDate = (iso: string) => new Date(`${iso}T00:00:00`);

export const parseTime12 = (t: string) => {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(t.trim());
  if (!m) return 0;
  const h = Number(m[1]) % 12;
  return (m[3].toUpperCase() === 'PM' ? h + 12 : h) * 60 + Number(m[2]);
};

export const formatTime12 = (mins: number) => {
  const m = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  return `${pad(h % 12 === 0 ? 12 : h % 12)}:${pad(m % 60)} ${h >= 12 ? 'PM' : 'AM'}`;
};

export interface ScheduledInterview {
  /** ISO date in `tz` */
  date: string;
  /** "10:30 AM" in `tz` */
  time: string;
  tz: InterviewTz;
  /** Zoom link generated on scheduling; missing for interviews set up by the account manager / recruiter */
  zoomUrl: string | null;
  attendees: string[];
}

export const interviewStartMs = (iv: Pick<ScheduledInterview, 'date' | 'time' | 'tz'>) => {
  const [y, m, d] = iv.date.split('-').map(Number);
  return Date.UTC(y, m - 1, d, 0, parseTime12(iv.time)) - tzOffset(iv.tz) * HOUR_MS;
};

export const wallClockOf = (ms: number, tz: InterviewTz) => {
  const d = new Date(ms + tzOffset(tz) * HOUR_MS);
  return {
    date: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`,
    time: formatTime12(d.getUTCHours() * 60 + d.getUTCMinutes()),
  };
};

/** Same interview shown in the client's time zone (desktop converts every interview to the client time zone) */
export const interviewInClientTz = (iv: ScheduledInterview) => ({ ...wallClockOf(interviewStartMs(iv), CLIENT_TZ), tz: CLIENT_TZ });

export interface InterviewWindow {
  join: boolean;
  reschedule: boolean;
  cancel: boolean;
  started: boolean;
}

export const interviewWindow = (iv: ScheduledInterview, now: number): InterviewWindow => {
  const start = interviewStartMs(iv);
  const end = start + INTERVIEW_MINUTES * MINUTE_MS;
  return {
    join: now >= start - JOIN_OPENS_BEFORE_MIN * MINUTE_MS && now <= end,
    reschedule: now < start - RESCHEDULE_CLOSES_BEFORE_MIN * MINUTE_MS,
    cancel: now <= end,
    started: now >= start,
  };
};

/** "Live now" / "In 40 min" / "Today" / "Tomorrow" / "In 3 days"; null once the meeting is over */
export const interviewCountdown = (iv: ScheduledInterview, now: number): { label: string; soon: boolean } | null => {
  const start = interviewStartMs(iv);
  const end = start + INTERVIEW_MINUTES * MINUTE_MS;
  if (now > end) return null;
  if (now >= start) return { label: 'Live now', soon: true };
  const mins = Math.ceil((start - now) / MINUTE_MS);
  if (mins <= 90) return { label: `In ${mins} min`, soon: true };
  const dayOf = (ms: number) => {
    const d = new Date(ms);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  };
  const days = Math.round((dayOf(start) - dayOf(now)) / 86_400_000);
  if (days <= 0) return { label: 'Today', soon: true };
  return { label: days === 1 ? 'Tomorrow' : `In ${days} days`, soon: false };
};

/** Bookable days: tomorrow onwards (no same-day booking), weekdays only, within 60 days */
export const BOOKING_HORIZON_DAYS = 60;
export const isBookableDay = (iso: string, todayIso: string) => {
  const d = parseDate(iso);
  const t = parseDate(todayIso);
  const diff = Math.round((d.getTime() - t.getTime()) / 86_400_000);
  return diff >= 1 && diff <= BOOKING_HORIZON_DAYS && d.getDay() !== 0 && d.getDay() !== 6;
};

/** Zoom availability check: some slots are already booked (dummy, stable per candidate + day + slot) */
const isSlotTaken = (candidateId: string, date: string, slot: string) => {
  let h = 7;
  for (const ch of `${candidateId}|${date}|${slot}`) h = (h * 31 + ch.charCodeAt(0)) % 9973;
  return h % 5 === 0;
};

/** Slot start times in the chosen time zone (candidate's available IST ranges, 15-min steps, the interview must fit inside the range) */
export const slotsFor = (c: ShortlistedCandidate, date: string, tz: InterviewTz) => {
  const shift = (tzOffset(tz) - IST_OFFSET) * 60;
  const out: string[] = [];
  c.slotRangesIST.forEach(([from, to]) => {
    const end = parseTime12(to);
    for (let m = Math.max(parseTime12(from), IST_FIRST_START); m <= IST_LAST_START && m + INTERVIEW_MINUTES <= end; m += SLOT_STEP) {
      const local = m + shift;
      // A booked slot stays booked in every time zone (checked on the IST time)
      if (local < 0 || local >= 1440 || isSlotTaken(c.id, date, formatTime12(m))) continue;
      out.push(formatTime12(local));
    }
  });
  return [...new Set(out)];
};

export const makeZoomUrl = (seed: string) => {
  let h = 11;
  for (const ch of seed) h = (h * 33 + ch.charCodeAt(0)) % 1_000_000_007;
  return `https://zoom.example.com/j/${String(80_000_000_000 + (h % 19_999_999_999))}`;
};

/* --------------------------------- Feedback -------------------------------- */

export interface FeedbackCriterion {
  label: string;
  hint?: string;
}

/** Desktop `getInterviewEvaluationlist` + tooltips (Available Staff Hub candidates) */
export const HUB_FEEDBACK_CRITERIA: FeedbackCriterion[] = [
  {
    label: 'Job-Specific Skills',
    hint: 'Evaluate the candidate’s technical knowledge and functional expertise relevant to the role, including task execution, tools proficiency, and domain understanding.',
  },
  {
    label: 'Personal Attributes',
    hint: 'Assess qualities such as integrity, accountability, adaptability, self-motivation, and the ability to work independently or take initiative.',
  },
  {
    label: 'Behavioral Fit',
    hint: 'Consider how well the candidate’s values, attitude, and work style align with your team culture and the organization’s behavioral expectations.',
  },
  {
    label: 'Soft Skills',
    hint: 'Review interpersonal strengths such as teamwork, emotional intelligence, time management, and collaboration with peers and stakeholders.',
  },
  {
    label: 'Communication Skills',
    hint: 'Rate the candidate’s ability to articulate thoughts clearly, listen actively, and communicate effectively in both written and verbal forms.',
  },
];

/** Recruiter-sourced candidates: 8 questions (`client_interview_ev_1..8`) */
export const RECRUITER_FEEDBACK_CRITERIA: FeedbackCriterion[] = [
  { label: 'Attention to Detail' },
  { label: 'Communication Skills' },
  { label: 'Cultural Fit' },
  { label: 'Job-Specific Skills' },
  { label: 'Personal Attributes' },
  { label: 'Soft Skills' },
  { label: 'Preliminary Assessment' },
  { label: 'Video Assessment' },
];

export const RATING_LABELS = ['Poor', 'Fair', 'Average', 'Good', 'Excellent'];

export type FeedbackResult = 'Hired' | 'Not Selected' | 'Selected' | 'Rejected';
export const HUB_FEEDBACK_RESULTS: FeedbackResult[] = ['Hired', 'Not Selected'];
export const RECRUITER_FEEDBACK_RESULTS: FeedbackResult[] = ['Selected', 'Rejected'];

export interface CandidateFeedback {
  /** One 1–5 rating per criterion, in criteria order */
  ratings: number[];
  comment: string;
  /** Hub candidates: only set once the interview happened (hidden while Interview Scheduled) */
  result: FeedbackResult | null;
  /** ISO date */
  submittedOn: string;
}

export const criteriaFor = (source: CandidateSource) => (source === 'hub' ? HUB_FEEDBACK_CRITERIA : RECRUITER_FEEDBACK_CRITERIA);
export const resultsFor = (source: CandidateSource) => (source === 'hub' ? HUB_FEEDBACK_RESULTS : RECRUITER_FEEDBACK_RESULTS);

/* -------------------------------- Assessments ------------------------------- */

/** Desktop `SC_ASSESSMENT_MAX_PER_CANDIDATE` */
export const ASSESSMENT_MAX = 2;

export interface AssessmentOption {
  id: string;
  name: string;
  level: string[];
  questions: number;
  questionTypes: string;
  duration: string;
  /** Domains it applies to; '*' = every domain */
  domains: string[];
}

export const ASSESSMENT_CATALOG: AssessmentOption[] = [
  { id: 'as-1', name: 'Individual Tax Fundamentals', level: ['Basic', 'Intermediate'], questions: 30, questionTypes: 'MCQ', duration: '45 mins', domains: ['Tax'] },
  { id: 'as-2', name: 'Business Entity Taxation', level: ['Intermediate'], questions: 30, questionTypes: 'MCQ', duration: '50 mins', domains: ['Tax'] },
  { id: 'as-3', name: 'US Federal Return Review', level: ['Advanced'], questions: 25, questionTypes: 'MCQ, Case Study', duration: '60 mins', domains: ['Tax'] },
  { id: 'as-4', name: 'Bookkeeping Essentials', level: ['Basic'], questions: 30, questionTypes: 'MCQ', duration: '40 mins', domains: ['Accounting & Bookkeeping'] },
  { id: 'as-5', name: 'Bank Reconciliation Practical', level: ['Intermediate'], questions: 15, questionTypes: 'Practical', duration: '45 mins', domains: ['Accounting & Bookkeeping'] },
  { id: 'as-6', name: 'Month-End Close & Journal Entries', level: ['Advanced'], questions: 25, questionTypes: 'MCQ, Practical', duration: '60 mins', domains: ['Accounting & Bookkeeping'] },
  { id: 'as-7', name: 'Audit Sampling & Testing', level: ['Intermediate'], questions: 30, questionTypes: 'MCQ', duration: '50 mins', domains: ['Audit & Assurance'] },
  { id: 'as-8', name: 'Internal Controls Walkthrough', level: ['Advanced'], questions: 20, questionTypes: 'Case Study', duration: '60 mins', domains: ['Audit & Assurance'] },
  { id: 'as-9', name: 'Excel for Accountants', level: ['Basic', 'Intermediate'], questions: 25, questionTypes: 'MCQ', duration: '35 mins', domains: ['*'] },
];

export interface AssignedAssessment {
  id: string;
  assessmentId: string;
  name: string;
  /** ISO date */
  assignedOn: string;
  status: 'Pending' | 'Completed';
  /** ISO date; assessments completed more than a year ago no longer use a slot */
  completedOn?: string;
  scorePct?: number;
  result?: 'Pass' | 'Fail';
  hasReport?: boolean;
  hasVideo?: boolean;
}

export const assessmentsForDomain = (domain: string) => ASSESSMENT_CATALOG.filter((a) => a.domains.includes('*') || a.domains.includes(domain));

/** Desktop `sc_active_count`: all assignments except ones completed over a year ago */
export const isActiveAssignment = (a: AssignedAssessment, now = Date.now()) => {
  if (a.status !== 'Completed' || !a.completedOn) return true;
  return parseDate(a.completedOn).getTime() >= now - 365 * 86_400_000;
};

export const activeAssignments = (c: ShortlistedCandidate) => c.assessments.filter((a) => isActiveAssignment(a));
export const remainingAssessmentSlots = (c: ShortlistedCandidate) => Math.max(0, ASSESSMENT_MAX - activeAssignments(c).length);
export const atAssessmentMax = (c: ShortlistedCandidate) => remainingAssessmentSlots(c) === 0;

/* --------------------------------- Resume ---------------------------------- */

export interface ResumeJob {
  designation: string;
  company: string;
  /** ISO month start */
  from: string;
  /** null = working here */
  to: string | null;
  skills: string;
}

export interface ResumeExperience {
  us?: [number, number];
  india?: [number, number];
  uk?: [number, number];
  canada?: [number, number];
}

export interface CandidateResume {
  gender: 'Male' | 'Female';
  level: string;
  /** "Immediate Joining" / "Joining in 15 days" */
  joining: string;
  workType: string;
  hourlyRate: number;
  availableHoursPerDay: number;
  hasVideo: boolean;
  qualifications: string[];
  summary: string;
  experience: ResumeExperience;
  jobs: ResumeJob[];
  technicalSkills: string[];
  softwareSkills: string[];
  backgroundVerified: boolean;
  backgroundNote?: string;
  psychometric?: string;
  communication?: string;
  technicalNote?: string;
  certificates: string[];
  courses: { name: string; duration: string; completedOn: string; hasCertificate: boolean }[];
  assessments: { name: string; type: string; scorePct: number; lastAssessedOn: string; hasReport: boolean; hasProctoring: boolean }[];
}

/* -------------------------------- Candidates ------------------------------- */

export interface ShortlistedCandidate {
  id: string;
  source: CandidateSource;
  /** Hired candidates show the staff name */
  name: string;
  /** Desktop "Resume ID" (`reg_id` / `job_code`); "-" when missing */
  resumeId: string;
  domain: string;
  profile: string;
  status: CandidateStatus;
  interview: ScheduledInterview | null;
  /** ISO date; desktop shows it only for Hired */
  completedOn: string | null;
  /** Candidate has an email on file (needed to assign an assessment) */
  hasEmail: boolean;
  /** Replacement profiles are scheduled by the account manager, not by the client */
  replacement: boolean;
  /** `is_slot_booking_from_client_hub`: client may request / reschedule / cancel the interview */
  selfSchedule: boolean;
  /** Candidate's available interview ranges in IST */
  slotRangesIST: [string, string][];
  feedback: CandidateFeedback | null;
  /** Recruiter-sourced: only the contact who interviewed the candidate can add feedback (`contact_id`) */
  ownsInterview: boolean;
  assessments: AssignedAssessment[];
  resume: CandidateResume | null;
  /** Recruiter-sourced candidates have a CV file instead of a resume page */
  cvFile: string | null;
}

/** "2026-10-19" for a date `days` from today; weekends roll forward to Monday (matches the notification copy) */
export const workdayIso = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  return isoOfDate(d);
};

const daysAgoIso = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return isoOfDate(d);
};

/** Interview on the 15-minute grid at or just before `minutes` from now (EST); 14 min lands inside the Join window */
const interviewFromNow = (minutes: number, extra: Partial<ScheduledInterview> = {}): ScheduledInterview => {
  const grid = SLOT_STEP * MINUTE_MS;
  const ms = Math.floor((Date.now() + minutes * MINUTE_MS) / grid) * grid;
  return { ...wallClockOf(ms, 'EST'), tz: 'EST', zoomUrl: makeZoomUrl(`from-now-${minutes}`), attendees: [], ...extra };
};

const resumeOf = (r: Partial<CandidateResume> & Pick<CandidateResume, 'gender' | 'level' | 'hourlyRate' | 'summary'>): CandidateResume => ({
  joining: 'Immediate Joining',
  workType: 'Full Time',
  availableHoursPerDay: 8,
  hasVideo: true,
  qualifications: [],
  experience: {},
  jobs: [],
  technicalSkills: [],
  softwareSkills: [],
  backgroundVerified: true,
  certificates: [],
  courses: [],
  assessments: [],
  ...r,
});

const TAX_PREPARER_RESUME = resumeOf({
  gender: 'Male',
  level: 'Level 2',
  hourlyRate: 14,
  summary:
    'Detail-oriented tax preparer with experience in individual and small-business returns for US clients. Comfortable with high-volume busy-season workloads and review feedback.',
  qualifications: ['B.Com', 'M.Com (Taxation)'],
  experience: { us: [2, 4], india: [1, 6] },
  jobs: [
    {
      designation: 'Associate - Tax Preparer',
      company: 'Brightline Advisors',
      from: '2023-06-01',
      to: null,
      skills: 'Form 1040 and 1120-S preparation, state returns, extension filings, client organizers',
    },
    {
      designation: 'Junior Accountant',
      company: 'Maple Row Associates',
      from: '2021-04-01',
      to: '2023-05-01',
      skills: 'Bookkeeping, bank reconciliations, sales tax filings',
    },
  ],
  technicalSkills: ['Individual tax returns (1040)', 'S-Corporation returns (1120-S)', 'State & local tax', 'Extension & estimate filings'],
  softwareSkills: ['CCH Axcess', 'Drake', 'QuickBooks Online', 'Excel'],
  backgroundNote: 'Employment and education verified. No discrepancies found.',
  psychometric: 'Strong in accuracy and following process. Prefers structured work with clear deadlines.',
  communication: 'Clear written English. Confident on video calls; comfortable asking clarifying questions.',
  technicalNote: 'Scored well on 1040 scenarios and state apportionment questions.',
  certificates: ['Enrolled Agent (EA) - Part 1 cleared'],
  courses: [
    { name: 'US Individual Tax Update', duration: '8 hrs', completedOn: '2026-03-12', hasCertificate: true },
    { name: 'S-Corporation Basics', duration: '4 hrs', completedOn: '2025-11-05', hasCertificate: true },
  ],
  assessments: [{ name: 'Individual Tax Fundamentals', type: 'MCQ', scorePct: 82, lastAssessedOn: '2026-05-20', hasReport: true, hasProctoring: true }],
});

const BOOKKEEPER_RESUME = resumeOf({
  gender: 'Female',
  level: 'Level 2',
  hourlyRate: 11,
  summary:
    'Bookkeeper with hands-on experience in month-end close, reconciliations and AP/AR for small US firms. Reliable with deadlines and client follow-ups.',
  qualifications: ['B.Com'],
  experience: { us: [1, 8], india: [2, 0] },
  jobs: [
    { designation: 'Bookkeeper', company: 'Harbor Light Books', from: '2022-02-01', to: null, skills: 'AP/AR, bank and credit-card reconciliations, month-end close' },
  ],
  technicalSkills: ['Accounts payable / receivable', 'Bank reconciliations', 'Month-end close', 'Payroll entries'],
  softwareSkills: ['QuickBooks Online', 'Xero', 'Excel'],
  joining: 'Joining in 15 days',
  psychometric: 'Methodical and dependable. Works best with a documented checklist.',
  communication: 'Good written communication; explains variances clearly.',
  certificates: ['QuickBooks ProAdvisor'],
  courses: [{ name: 'Month-End Close Masterclass', duration: '6 hrs', completedOn: '2026-01-18', hasCertificate: true }],
  assessments: [{ name: 'Bookkeeping Essentials', type: 'MCQ', scorePct: 88, lastAssessedOn: '2026-06-02', hasReport: true, hasProctoring: false }],
});

const AUDIT_RESUME = resumeOf({
  gender: 'Male',
  level: 'Level 3',
  hourlyRate: 17,
  summary:
    'Audit associate with experience in planning, testing and documentation for mid-size US engagements. Strong with workpapers and internal-control walkthroughs.',
  qualifications: ['B.Com', 'CA Inter'],
  experience: { us: [3, 0], india: [1, 2] },
  jobs: [
    { designation: 'Audit Associate', company: 'Granite Peak Assurance', from: '2022-08-01', to: null, skills: 'Risk assessment, sampling, substantive testing, workpaper review' },
    { designation: 'Audit Trainee', company: 'Lakeside & Co.', from: '2021-07-01', to: '2022-07-01', skills: 'Confirmations, vouching, tick-and-tie' },
  ],
  technicalSkills: ['Audit planning', 'Sampling & testing', 'Internal controls', 'Workpaper documentation'],
  softwareSkills: ['CaseWare', 'Excel', 'Power BI'],
  backgroundNote: 'Employment verification pending from one former employer.',
  backgroundVerified: false,
  communication: 'Concise and structured. Comfortable presenting findings to reviewers.',
  certificates: ['CPA exam - AUD cleared'],
  courses: [{ name: 'Audit Documentation Standards', duration: '5 hrs', completedOn: '2025-09-30', hasCertificate: true }],
  assessments: [{ name: 'Audit Sampling & Testing', type: 'MCQ', scorePct: 79, lastAssessedOn: '2026-04-14', hasReport: true, hasProctoring: true }],
});

const seed = (
  id: string,
  name: string,
  resumeId: string,
  profile: string,
  domain: string,
  status: CandidateStatus,
  extra: Partial<ShortlistedCandidate> = {},
): ShortlistedCandidate => ({
  id,
  source: 'hub',
  name,
  resumeId,
  domain,
  profile,
  status,
  interview: null,
  completedOn: null,
  hasEmail: true,
  replacement: false,
  selfSchedule: true,
  slotRangesIST: [['05:00 PM', '10:00 PM']],
  feedback: null,
  ownsInterview: false,
  assessments: [],
  resume: null,
  cvFile: null,
  ...extra,
});

const HUB_CANDIDATES: ShortlistedCandidate[] = [
  seed('sc1', 'Sam Patel', 'RS-2041', 'Associate - Tax Preparer', 'Tax', 'Interview Scheduled', {
    interview: { date: workdayIso(1), time: '10:30 AM', tz: 'EST', zoomUrl: makeZoomUrl('sam-patel'), attendees: [] },
    resume: TAX_PREPARER_RESUME,
  }),
  seed('sc2', 'Pooja Rana', 'RS-2047', 'Specialist - Audit Associate', 'Audit & Assurance', 'Interview Scheduled', {
    interview: interviewFromNow(14, { zoomUrl: makeZoomUrl('pooja-rana') }),
    slotRangesIST: [['04:30 PM', '09:30 PM']],
    resume: AUDIT_RESUME,
  }),
  seed('sc3', 'Harsh Vyas', 'RS-2036', 'Associate - Tax Preparer', 'Tax', 'Interview Scheduled', {
    interview: interviewFromNow(-150, { zoomUrl: makeZoomUrl('harsh-vyas') }),
    resume: TAX_PREPARER_RESUME,
    assessments: [
      { id: 'sa1', assessmentId: 'as-1', name: 'Individual Tax Fundamentals', assignedOn: daysAgoIso(6), status: 'Pending' },
    ],
  }),
  seed('sc4', 'Ritika Shah', 'RS-2058', 'Associate - Bookkeeper', 'Accounting & Bookkeeping', 'Shortlisted', {
    replacement: true,
    selfSchedule: false,
    resume: BOOKKEEPER_RESUME,
  }),
  seed('sc5', 'Jay Desai', 'RS-2059', 'Associate - Bookkeeper', 'Accounting & Bookkeeping', 'Shortlisted', {
    replacement: true,
    selfSchedule: false,
    hasEmail: false,
    resume: { ...BOOKKEEPER_RESUME, gender: 'Male', hourlyRate: 10, joining: 'Immediate Joining' },
  }),
  seed('sc6', 'Kunal Bhatia', 'RS-2063', 'Specialist - Tax Accountant', 'Tax', 'Shortlisted', {
    slotRangesIST: [['05:00 PM', '08:00 PM'], ['09:00 PM', '11:30 PM']],
    resume: { ...TAX_PREPARER_RESUME, level: 'Level 3', hourlyRate: 16, joining: 'Joining in 30 days' },
    assessments: [
      {
        id: 'sa2',
        assessmentId: 'as-2',
        name: 'Business Entity Taxation',
        assignedOn: daysAgoIso(2),
        status: 'Pending',
      },
    ],
  }),
  seed('sc7', 'Tanvi Kulkarni', 'RS-1984', 'Specialist - Tax Accountant', 'Tax', 'Hired', {
    completedOn: daysAgoIso(12),
    interview: { date: daysAgoIso(21), time: '09:00 AM', tz: 'EST', zoomUrl: makeZoomUrl('tanvi-kulkarni'), attendees: [] },
    feedback: {
      ratings: [5, 4, 5, 4, 5],
      comment: 'Strong on tax technicals and very clear in communication. Fits our review process well.',
      result: 'Hired',
      submittedOn: daysAgoIso(20),
    },
    assessments: [
      { id: 'sa3', assessmentId: 'as-2', name: 'Business Entity Taxation', assignedOn: daysAgoIso(30), status: 'Completed', completedOn: daysAgoIso(28), scorePct: 86, result: 'Pass', hasReport: true, hasVideo: true },
      { id: 'sa4', assessmentId: 'as-9', name: 'Excel for Accountants', assignedOn: daysAgoIso(30), status: 'Completed', completedOn: daysAgoIso(27), scorePct: 91, result: 'Pass', hasReport: true, hasVideo: false },
    ],
    resume: { ...TAX_PREPARER_RESUME, gender: 'Female', level: 'Level 3', hourlyRate: 16 },
  }),
  seed('sc8', 'Divya Ghosh', 'RS-1991', 'Associate - Bookkeeper', 'Accounting & Bookkeeping', 'Hired', {
    completedOn: daysAgoIso(5),
    interview: { date: daysAgoIso(14), time: '11:00 AM', tz: 'EST', zoomUrl: makeZoomUrl('divya-ghosh'), attendees: [] },
    resume: { ...BOOKKEEPER_RESUME, hourlyRate: 11 },
  }),
  seed('sc9', 'Omkar Naik', 'RS-1962', 'Specialist - Audit Associate', 'Audit & Assurance', 'Not Selected', {
    interview: { date: daysAgoIso(18), time: '10:00 AM', tz: 'EST', zoomUrl: makeZoomUrl('omkar-naik'), attendees: [] },
    feedback: {
      ratings: [2, 3, 3, 3, 2],
      comment: 'Good attitude, but audit documentation and communication were below what this role needs right now.',
      result: 'Not Selected',
      submittedOn: daysAgoIso(17),
    },
    assessments: [
      { id: 'sa5', assessmentId: 'as-7', name: 'Audit Sampling & Testing', assignedOn: daysAgoIso(25), status: 'Completed', completedOn: daysAgoIso(23), scorePct: 48, result: 'Fail', hasReport: true, hasVideo: true },
    ],
    resume: AUDIT_RESUME,
  }),
];

/** Recruiter-sourced candidates (desktop `candidate` source): CV file, no Zoom link, 8-question feedback, MOS clients only */
const RECRUITER_CANDIDATES: ShortlistedCandidate[] = [
  seed('rc1', 'Rhea Fernandes', '-', 'Tax Associate', 'Tax', 'Interview Scheduled', {
    source: 'recruiter',
    interview: { date: workdayIso(2), time: '09:30 AM', tz: 'EST', zoomUrl: null, attendees: [] },
    ownsInterview: true,
    hasEmail: false,
    selfSchedule: false,
    cvFile: 'rhea-fernandes-cv.pdf',
  }),
  seed('rc2', 'Karan Bedi', '-', 'Senior Accountant', 'Accounting & Bookkeeping', 'Selected', {
    source: 'recruiter',
    interview: { date: daysAgoIso(4), time: '11:30 AM', tz: 'EST', zoomUrl: null, attendees: [] },
    ownsInterview: true,
    hasEmail: false,
    selfSchedule: false,
    cvFile: 'karan-bedi-cv.pdf',
    feedback: {
      ratings: [4, 5, 4, 4, 5, 4, 4, 5],
      comment: 'Excellent communication and a very good grasp of month-end close. Happy to proceed to an offer.',
      result: 'Selected',
      submittedOn: daysAgoIso(4),
    },
  }),
  seed('rc3', 'Aman Sethi', '-', 'Tax Associate', 'Tax', 'Applied', {
    source: 'recruiter',
    hasEmail: false,
    selfSchedule: false,
    cvFile: 'aman-sethi-cv.pdf',
  }),
  seed('rc4', 'Vikram Sood', '-', 'Audit Associate', 'Audit & Assurance', 'In Process', {
    source: 'recruiter',
    hasEmail: false,
    selfSchedule: false,
    cvFile: 'vikram-sood-cv.pdf',
  }),
  seed('rc5', 'Lata Menon', '-', 'Senior Accountant', 'Accounting & Bookkeeping', 'Hold', {
    source: 'recruiter',
    hasEmail: false,
    selfSchedule: false,
    cvFile: null,
  }),
  seed('rc6', 'Jignesh Modi', '-', 'Tax Associate', 'Tax', 'Left', {
    source: 'recruiter',
    hasEmail: false,
    selfSchedule: false,
    cvFile: 'jignesh-modi-cv.pdf',
  }),
];

/** Desktop list is `ORDER BY id DESC` — newest first */
export const SHORTLISTED_SEED: ShortlistedCandidate[] = CLIENT_IS_MOS ? [...HUB_CANDIDATES, ...RECRUITER_CANDIDATES] : HUB_CANDIDATES;

export const CANDIDATE_PAGE_SIZE = 8;

/* ------------------------------ Rules and helpers ----------------------------- */

export type AssessmentAction = 'assign' | 'view' | 'none';

/** Desktop assessment column: View / Assign / "-" */
export const assessmentActionOf = (c: ShortlistedCandidate): AssessmentAction => {
  const has = c.assessments.length > 0;
  if (c.status === 'Shortlisted' || c.status === 'Interview Scheduled') {
    if (has) return 'view';
    return c.source === 'hub' && c.hasEmail ? 'assign' : 'none';
  }
  if (c.status === 'Hired' || c.status === 'Not Selected') return has ? 'view' : 'none';
  return 'none';
};

/** Desktop row checkbox: hidden when no assessment action, disabled when the active slots are full */
export const isBulkSelectable = (c: ShortlistedCandidate) => assessmentActionOf(c) !== 'none';
export const canBulkAssign = (c: ShortlistedCandidate) => isBulkSelectable(c) && !atAssessmentMax(c);

export const statusTone = (s: CandidateStatus): 'amber' | 'blue' | 'green' | 'rose' =>
  s === 'Shortlisted' ? 'amber' : s === 'Hired' ? 'green' : s === 'Not Selected' || s === 'Left' ? 'rose' : 'blue';

/** Desktop Feedback button: hub candidates once an interview is scheduled / decided; recruiter candidates only for the contact who interviewed them */
export const feedbackAvailable = (c: ShortlistedCandidate) => {
  if (c.source === 'recruiter') return c.ownsInterview;
  return c.status === 'Interview Scheduled' || c.status === 'Hired' || c.status === 'Not Selected';
};

export const canRequestInterview = (c: ShortlistedCandidate) =>
  c.source === 'hub' && c.status === 'Shortlisted' && !c.interview && c.selfSchedule && !c.replacement;

export const canManageInterview = (c: ShortlistedCandidate) =>
  c.source === 'hub' && c.status === 'Interview Scheduled' && Boolean(c.interview?.zoomUrl) && c.selfSchedule && !c.replacement;

export const formatShortDate = (iso: string) =>
  parseDate(iso).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

export const formatLongDate = (iso: string) =>
  parseDate(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });

export const formatMonthYear = (iso: string) => parseDate(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

export const formatExperience = (pair: [number, number] | undefined) => {
  if (!pair || (pair[0] === 0 && pair[1] === 0)) return null;
  const [y, m] = pair;
  const parts: string[] = [];
  if (y > 0) parts.push(`${y} ${y === 1 ? 'Year' : 'Years'}`);
  if (m > 0) parts.push(`${m} ${m === 1 ? 'Month' : 'Months'}`);
  return parts.join(' ');
};

export interface CandidateFilters {
  profiles: string[];
  domains: string[];
}
export const EMPTY_CANDIDATE_FILTERS: CandidateFilters = { profiles: [], domains: [] };
export const candidateFilterCount = (f: CandidateFilters) => f.profiles.length + f.domains.length;

/** Desktop search boxes: Resume ID and Profile (combined into one search on mobile, plus name and domain) */
export const matchesCandidate = (c: ShortlistedCandidate, query: string, f: CandidateFilters) => {
  const q = query.trim().toLowerCase();
  if (q && !`${c.name} ${c.resumeId} ${c.profile} ${c.domain}`.toLowerCase().includes(q)) return false;
  if (f.profiles.length && !f.profiles.includes(c.profile)) return false;
  if (f.domains.length && !f.domains.includes(c.domain)) return false;
  return true;
};

/** "Oct 19, 2026" + "10:30 AM (EST)" shown in the client's time zone */
export const interviewLabels = (c: ShortlistedCandidate) => {
  if (!c.interview) return null;
  const w = interviewInClientTz(c.interview);
  return { date: formatShortDate(w.date), time: `${w.time} (${w.tz})` };
};
