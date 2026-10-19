import { TrainingPerson, personOf } from './trainingRequestData';

/** L&D › Training Need Identification: skill gaps spotted by an assessment, the manager or the staff member */

export const NEED_PRIORITIES = ['High', 'Medium', 'Low'] as const;
export type NeedPriority = (typeof NEED_PRIORITIES)[number];

export const NEED_STATUSES = ['Identified', 'Training Requested', 'Addressed'] as const;
export type NeedStatus = (typeof NEED_STATUSES)[number];

export const NEED_SOURCES = ['Skill Assessment', 'Manager Review', 'Self'] as const;
export type NeedSource = (typeof NEED_SOURCES)[number];

/** Proficiency scale used for both the current and the required level */
export const SKILL_LEVELS = [
  { level: 1, label: 'Beginner', hint: 'New to this; needs step-by-step guidance' },
  { level: 2, label: 'Basic', hint: 'Knows the fundamentals; needs regular review' },
  { level: 3, label: 'Proficient', hint: 'Handles standard work independently' },
  { level: 4, label: 'Advanced', hint: 'Handles complex cases and guides others' },
  { level: 5, label: 'Expert', hint: 'Go-to person; reviews and trains the team' },
] as const;

export const levelLabel = (level: number) => SKILL_LEVELS[level - 1]?.label ?? '';

export interface TrainingNeed extends TrainingPerson {
  id: string;
  /** Programme the skill belongs to */
  mainProgramme: string;
  skill: string;
  currentLevel: number;
  requiredLevel: number;
  priority: NeedPriority;
  source: NeedSource;
  status: NeedStatus;
  identifiedOn: string; // ISO
  targetDate: string; // ISO; when the gap should be closed
  remarks: string;
  /** Who recorded it (the system for assessments) */
  identifiedBy: string;
  /** Training request created from this need */
  requestId?: string;
}

const need = (
  id: string,
  name: string,
  mainProgramme: string,
  skill: string,
  currentLevel: number,
  requiredLevel: number,
  priority: NeedPriority,
  source: NeedSource,
  status: NeedStatus,
  identifiedOn: string,
  targetDate: string,
  remarks: string,
  identifiedBy = source === 'Skill Assessment' ? 'Skill Assessment' : source === 'Self' ? name : 'Naveen Das',
  requestId?: string
): TrainingNeed => ({
  id,
  ...personOf(name),
  mainProgramme,
  skill,
  currentLevel,
  requiredLevel,
  priority,
  source,
  status,
  identifiedOn,
  targetDate,
  remarks,
  identifiedBy,
  requestId,
});

export const TRAINING_NEEDS_SEED: TrainingNeed[] = [
  need(
    'tn-1',
    'John Smith',
    'Staff Training - Partnerships',
    'Partnership Basis',
    2,
    4,
    'High',
    'Skill Assessment',
    'Identified',
    '2026-10-08',
    '2026-12-15',
    'Scored 48% against the 80% benchmark in the Partnership Taxation assessment.'
  ),
  need(
    'tn-2',
    'John Smith',
    'Intermediate Staff Training - Individual',
    'Capital Gains (Schedule D)',
    3,
    4,
    'Medium',
    'Manager Review',
    'Training Requested',
    '2026-09-14',
    '2026-11-30',
    'Handles basic sales well but struggles with wash-sale and basis adjustments on larger portfolios.'
  ),
  need(
    'tn-3',
    'John Smith',
    'Bookkeeping Fundamentals',
    'Bank Reconciliation',
    2,
    3,
    'Low',
    'Self',
    'Addressed',
    '2026-04-22',
    '2026-06-30',
    'Needed the basics to review client books during onboarding.'
  ),
  need(
    'tn-4',
    'John Smith',
    'Advanced Staff Training - Individual',
    'Alternative Minimum Tax',
    1,
    3,
    'Low',
    'Self',
    'Identified',
    '2026-10-12',
    '2027-02-28',
    'Seeing AMT flags on more returns lately and want to understand them before next season.'
  ),
  need(
    'tn-5',
    'Ananya Kulkarni',
    'Intermediate Staff Training - Individual',
    'Rental Income (Schedule E)',
    2,
    4,
    'High',
    'Skill Assessment',
    'Identified',
    '2026-10-05',
    '2026-12-10',
    'Scored 52% against the 80% benchmark; several new clients own rental properties.'
  ),
  need(
    'tn-6',
    'Ananya Kulkarni',
    'Basic Staff Training - Individual',
    'Education Credits',
    3,
    4,
    'Low',
    'Manager Review',
    'Identified',
    '2026-09-26',
    '2027-01-15',
    'Occasionally picks the wrong credit between AOTC and Lifetime Learning.'
  ),
  need(
    'tn-7',
    'Vikram Rao',
    'Basic Staff Training - Individual',
    'Form W-2 Wages',
    1,
    3,
    'High',
    'Manager Review',
    'Training Requested',
    '2026-09-10',
    '2026-11-20',
    'First tax season; needs a structured start on W-2 income and withholding.'
  ),
  need(
    'tn-8',
    'Vikram Rao',
    'Bookkeeping Fundamentals',
    'Chart of Accounts',
    2,
    3,
    'Medium',
    'Skill Assessment',
    'Identified',
    '2026-10-02',
    '2026-12-20',
    'Scored 61% against the 75% benchmark in the Bookkeeping assessment.'
  ),
  need(
    'tn-9',
    'Kunal Desai',
    'Staff Training - S & C Corp',
    'Shareholder Basis',
    3,
    4,
    'Medium',
    'Self',
    'Addressed',
    '2026-07-15',
    '2026-09-30',
    'Moving to the S-Corp review team and need deeper basis tracking.'
  ),
  need(
    'tn-10',
    'Rohan Mehta',
    'Advanced Staff Training - Individual',
    'Foreign Tax Credit',
    1,
    3,
    'High',
    'Manager Review',
    'Identified',
    '2026-10-09',
    '2026-12-05',
    'Two clients with foreign income this year and no prior exposure to Form 1116.'
  ),
  need(
    'tn-11',
    'Rohan Mehta',
    'Staff Training - Partnerships',
    'Guaranteed Payments',
    2,
    3,
    'Low',
    'Skill Assessment',
    'Identified',
    '2026-09-29',
    '2027-01-31',
    'Scored 66% against the 75% benchmark in the Partnership Taxation assessment.'
  ),
  need(
    'tn-12',
    'Farhan Shaikh',
    'Bookkeeping Fundamentals',
    'Accounts Payable & Receivable',
    2,
    4,
    'Medium',
    'Manager Review',
    'Addressed',
    '2026-08-12',
    '2026-09-30',
    'Onboarding for the bookkeeping pod; completed the AP/AR module.'
  ),
  need(
    'tn-13',
    'Siddharth Nair',
    'Staff Training - Partnerships',
    'Partner Capital Accounts',
    2,
    3,
    'Medium',
    'Manager Review',
    'Training Requested',
    '2026-09-08',
    '2026-11-15',
    'Supporting the partnership desk during busy season.'
  ),
  need(
    'tn-14',
    'Pooja Bhatt',
    'Staff Training - S & C Corp',
    'Book-to-Tax Reconciliation (M-1)',
    2,
    4,
    'High',
    'Skill Assessment',
    'Identified',
    '2026-10-10',
    '2026-12-18',
    'Scored 44% against the 80% benchmark in the Corporate Taxation assessment.'
  ),
  need(
    'tn-15',
    'Naveen Das',
    'Staff Training - S & C Corp',
    'Depreciation & Section 179',
    3,
    4,
    'Medium',
    'Self',
    'Identified',
    '2026-10-06',
    '2026-12-31',
    'Reviewing more fixed-asset heavy returns and want a stronger grip on bonus depreciation rules.'
  ),
  need(
    'tn-16',
    'Naveen Das',
    'Advanced Staff Training - Individual',
    'Net Investment Income Tax',
    3,
    5,
    'Low',
    'Skill Assessment',
    'Identified',
    '2026-09-18',
    '2027-02-15',
    'Scored 72% against the 90% benchmark expected of reviewers.'
  ),
];
