import { TEAM_REPORTING_MANAGERS } from './teamAttendanceData';

/** L&D › Training Request: staff (or their manager) ask the L&D team for training on a programme */

export const TRAINING_STATUSES = ['Pending', 'In-Progress', 'Completed'] as const;
export type TrainingStatus = (typeof TRAINING_STATUSES)[number];

export interface TrainingRequest {
  id: string;
  staffName: string;
  staffCode: string;
  reportingManager: string;
  branch: string;
  mainProgramme: string;
  subProgrammes: string[];
  /** Optional; empty when the training isn't tied to a software */
  software: string[];
  requestedOn: string; // ISO
  remarks: string;
  /** Staff's progress through the training */
  learningStatus: TrainingStatus;
  /** L&D team's handling of the request */
  ldStatus: TrainingStatus;
  /** Who raised it (the staff member, or their manager on their behalf) */
  raisedBy: string;
}

export interface TrainingPerson {
  staffName: string;
  staffCode: string;
  reportingManager: string;
  branch: string;
}

/** Main programme → its sub programmes */
export const TRAINING_PROGRAMMES: Record<string, string[]> = {
  'Basic Staff Training - Individual': [
    '1099-DIV',
    '1099-INT',
    'Charitable Contributions (Itemized Deduction)',
    'Child Tax Credit and Other Dependents Tax Credits',
    'Choice #1: Standard Deduction',
    'Education Credits',
    'Form W-2 Wages',
    'Schedule C - Sole Proprietorship',
  ],
  'Staff Training - S & C Corp': [
    'Form 1120-S Overview',
    'Shareholder Basis',
    'Schedule K-1 (1120-S)',
    'Form 1120 Overview',
    'Book-to-Tax Reconciliation (M-1)',
    'Depreciation & Section 179',
  ],
  'Staff Training - Partnerships': ['Form 1065 Overview', 'Partner Capital Accounts', 'Schedule K-1 (1065)', 'Guaranteed Payments', 'Partnership Basis'],
  'Intermediate Staff Training - Individual': [
    'Rental Income (Schedule E)',
    'Capital Gains (Schedule D)',
    'Self-Employment Tax',
    'Qualified Business Income Deduction',
    'Estimated Tax Payments',
  ],
  'Advanced Staff Training - Individual': ['Passive Activity Loss Rules', 'Alternative Minimum Tax', 'Foreign Tax Credit', 'Net Investment Income Tax'],
  'Bookkeeping Fundamentals': ['Chart of Accounts', 'Bank Reconciliation', 'Accounts Payable & Receivable', 'Month-end Close'],
};

export const MAIN_PROGRAMMES = Object.keys(TRAINING_PROGRAMMES);

export const TRAINING_SOFTWARE = [
  'Lacerte',
  'Taxslayer',
  'Ultra Tax',
  'CCH Axcess',
  'Pro System Fx',
  'ProSeries',
  'Drake',
  'QuickBooks Online',
  'Xero',
];

/** Branch of the signed-in staff and manager logins */
export const TRAINING_BRANCH = 'Gota - Ahmedabad';

/** Everyone in a manager's hierarchy (manager login: Team tab + "raise for" picker) */
export const TRAINING_TEAM: TrainingPerson[] = TEAM_REPORTING_MANAGERS.flatMap((m) =>
  m.members.map((x) => ({ staffName: x.staffName, staffCode: x.staffCode, reportingManager: m.name, branch: x.branch }))
);

const BRANCH_ONLY: TrainingPerson[] = [
  { staffName: 'Siddharth Nair', staffCode: 'A03128', reportingManager: 'Harsh Trivedi', branch: TRAINING_BRANCH },
  { staffName: 'Komal Parmar', staffCode: 'A03366', reportingManager: 'Harsh Trivedi', branch: TRAINING_BRANCH },
];

const NAVEEN: TrainingPerson = { staffName: 'Naveen Das', staffCode: 'A01120', reportingManager: 'Priya Nair', branch: TRAINING_BRANCH };

const personOf = (name: string): TrainingPerson =>
  [...TRAINING_TEAM, ...BRANCH_ONLY, NAVEEN].find((p) => p.staffName === name)!;

const req = (
  id: string,
  name: string,
  mainProgramme: string,
  subProgrammes: string[],
  software: string[],
  requestedOn: string,
  learningStatus: TrainingStatus,
  ldStatus: TrainingStatus,
  remarks: string,
  raisedBy = name
): TrainingRequest => {
  const p = personOf(name);
  return { id, ...p, mainProgramme, subProgrammes, software, requestedOn, learningStatus, ldStatus, remarks, raisedBy };
};

export const TRAINING_REQUESTS_SEED: TrainingRequest[] = [
  req(
    'tr-1',
    'John Smith',
    'Staff Training - Partnerships',
    ['Form 1065 Overview', 'Schedule K-1 (1065)'],
    ['Lacerte'],
    '2026-10-01',
    'Pending',
    'Pending',
    'Picking up two partnership clients next quarter and want to be ready for 1065 season.'
  ),
  req(
    'tr-2',
    'John Smith',
    'Basic Staff Training - Individual',
    ['1099-DIV', '1099-INT', 'Choice #1: Standard Deduction'],
    ['ProSeries', 'Drake'],
    '2026-08-18',
    'In-Progress',
    'In-Progress',
    'Refresher on individual returns before the extension deadline.'
  ),
  req(
    'tr-3',
    'John Smith',
    'Bookkeeping Fundamentals',
    ['Bank Reconciliation', 'Month-end Close'],
    ['QuickBooks Online'],
    '2026-05-06',
    'Completed',
    'Completed',
    'Need the basics to review client books during onboarding.'
  ),
  req(
    'tr-4',
    'Ananya Kulkarni',
    'Intermediate Staff Training - Individual',
    ['Rental Income (Schedule E)', 'Capital Gains (Schedule D)'],
    ['CCH Axcess'],
    '2026-09-24',
    'Pending',
    'In-Progress',
    'Several new clients have rental properties.',
    'Naveen Das'
  ),
  req(
    'tr-5',
    'Vikram Rao',
    'Basic Staff Training - Individual',
    ['Form W-2 Wages', 'Education Credits', 'Child Tax Credit and Other Dependents Tax Credits'],
    [],
    '2026-09-12',
    'In-Progress',
    'In-Progress',
    'First tax season; wants a structured start.'
  ),
  req(
    'tr-6',
    'Kunal Desai',
    'Staff Training - S & C Corp',
    ['Form 1120-S Overview', 'Shareholder Basis'],
    ['Ultra Tax'],
    '2026-07-29',
    'Completed',
    'Completed',
    'Moving to the S-Corp review team.'
  ),
  req(
    'tr-7',
    'Rohan Mehta',
    'Advanced Staff Training - Individual',
    ['Alternative Minimum Tax', 'Foreign Tax Credit'],
    ['Lacerte'],
    '2026-09-30',
    'Pending',
    'Pending',
    'Two clients with foreign income this year.'
  ),
  req(
    'tr-8',
    'Farhan Shaikh',
    'Bookkeeping Fundamentals',
    ['Chart of Accounts', 'Accounts Payable & Receivable'],
    ['Xero'],
    '2026-09-03',
    'In-Progress',
    'Completed',
    'Onboarding training for the bookkeeping pod.'
  ),
  req(
    'tr-9',
    'Siddharth Nair',
    'Staff Training - Partnerships',
    ['Partner Capital Accounts', 'Guaranteed Payments'],
    ['CCH Axcess'],
    '2026-09-16',
    'Pending',
    'In-Progress',
    'Supporting the partnership desk during busy season.'
  ),
  req(
    'tr-10',
    'Komal Parmar',
    'Basic Staff Training - Individual',
    ['Schedule C - Sole Proprietorship'],
    ['Taxslayer'],
    '2026-08-07',
    'Completed',
    'Completed',
    'Freelancer clients filing Schedule C.'
  ),
  req(
    'tr-11',
    'Naveen Das',
    'Staff Training - S & C Corp',
    ['Book-to-Tax Reconciliation (M-1)', 'Depreciation & Section 179'],
    ['Pro System Fx'],
    '2026-09-20',
    'Pending',
    'Pending',
    'Want to review M-1 adjustments with more confidence.'
  ),
].sort((a, b) => b.requestedOn.localeCompare(a.requestedOn));
