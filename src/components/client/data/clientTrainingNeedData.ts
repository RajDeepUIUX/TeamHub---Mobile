/**
 * Learning & Development › Training Need Identification (Client). Desktop: `controller/learnings.php` (`trainingrequest`,
 * `training_requests_list`, `SaveTrainingRequest`, `training_requests_feedback`, `save_training_requests_feedback`,
 * `get_software_lists`) + `templates/learnings/trainingrequest.tpl`. The client raises TNI Requests for staff (main / sub
 * programme, free-text topics, software, a message); the L&D team moves each one Pending → Assigned → Completed and
 * talks to the client through Notes. B (MyCPE ONE) has nothing for this page.
 */
import type { ClientStaffMember } from './clientStaffData';

/** Desktop `get_tni_status_list`: stored value → label shown to the client */
export const TNI_STATUSES = ['Pending', 'In-Progress', 'Completed'] as const;
export type TniStatus = (typeof TNI_STATUSES)[number];
export const TNI_STATUS_LABEL: Record<TniStatus, string> = { Pending: 'Pending', 'In-Progress': 'Assigned', Completed: 'Completed' };

/** Sub programmes always end with "Other" (desktop stores id 0 for it) */
export const TNI_OTHER = 'Other';

/** Main training programme → sub training programmes (dummy; desktop reads `tbltraining_programme_category`) */
export const TNI_PROGRAMMES: Record<string, string[]> = {
  'Basic Staff Training - Individual': ['Form 1040', 'Form W-2 Wages', 'Schedule A', 'Schedule C - Sole Proprietorship', 'Education Credits', TNI_OTHER],
  'Intermediate Staff Training - Individual': ['Rental Income (Schedule E)', 'Capital Gains (Schedule D)', 'Self-Employment Tax', 'Estimated Tax Payments', TNI_OTHER],
  'Advanced Staff Training - Individual': ['Alternative Minimum Tax', 'Foreign Tax Credit', 'Net Investment Income Tax', TNI_OTHER],
  'Real Estate Taxes': ['Interest Deductions', 'Rental Property Basics', 'Depreciation Schedules', TNI_OTHER],
  'Staff Training - S & C Corp': ['Form 1120-S', 'Form 1120', 'Shareholder Basis', 'Book-to-Tax Reconciliation (M-1)', TNI_OTHER],
  'Staff Training - Partnerships': ['Form 1065', 'Schedule K-1 (1065)', 'Partner Capital Accounts', TNI_OTHER],
  'Bookkeeping Fundamentals': ['Chart of Accounts', 'Bank Reconciliation', 'Accounts Payable & Receivable', 'Month-end Close', TNI_OTHER],
};

export const TNI_MAIN_PROGRAMMES = Object.keys(TNI_PROGRAMMES);

/** Desktop `getAllSoftwareList` (tax, accounting and practice software tags) */
export const TNI_SOFTWARE = ['Lacerte', 'Drake', 'ProSeries', 'CCH Axcess', 'UltraTax CS', 'TaxSlayer Pro', 'Pro System fx', 'QuickBooks Online', 'Xero'];

export interface TniNote {
  id: string;
  /** Contact who wrote it, or the L&D team member */
  author: string;
  /** Written by the signed-in client contact (desktop shows "You") */
  mine: boolean;
  text: string;
  /** ISO timestamp */
  createdAt: string;
}

export interface TniRequest {
  id: string;
  /** `ClientStaffMember.id` */
  staffId: string;
  /** Free-text topics (desktop `client_suggested_training`, joined by "~~") */
  trainingNames: string[];
  mainProgramme: string;
  subProgrammes: string[];
  software: string[];
  /** ISO date */
  requestedOn: string;
  status: TniStatus;
  /** ISO date; only set once Completed */
  completedOn: string | null;
  /** Newest first, like the desktop Notes panel */
  notes: TniNote[];
}

export interface TniDraft {
  /** One request is created per staff member */
  staffIds: string[];
  mainProgramme: string;
  subProgrammes: string[];
  trainingNames: string[];
  software: string[];
  message: string;
}

export const EMPTY_TNI_DRAFT: TniDraft = { staffIds: [], mainProgramme: '', subProgrammes: [], trainingNames: [], software: [], message: '' };

export type TniDraftErrors = Partial<Record<'staffIds' | 'mainProgramme' | 'subProgrammes' | 'trainingNames' | 'software', string>>;

/** Desktop validation: staff always; then at least one of topic, main programme (+ sub programmes) or software */
export const validateTniDraft = (d: TniDraft): TniDraftErrors => {
  const e: TniDraftErrors = {};
  if (d.staffIds.length === 0) e.staffIds = 'Staff is required.';
  if (d.trainingNames.length === 0 && !d.mainProgramme && d.software.length === 0) {
    e.trainingNames = 'Training Name (Topic) is required.';
    e.mainProgramme = 'Main Training Programme is required.';
    e.software = 'Software is required.';
  }
  if (d.mainProgramme && d.subProgrammes.length === 0) e.subProgrammes = 'Sub Training Programme is required.';
  return e;
};

export const TNI_MAX_MESSAGE = 500;

export interface TniFilters {
  staff: string[];
  /** ISO date, exact match (desktop `request_date = ?`) */
  requestedOn: string;
  /** ISO date (desktop `DATE(crm_status_updated_on) = ?`) */
  completedOn: string;
}

export const EMPTY_TNI_FILTERS: TniFilters = { staff: [], requestedOn: '', completedOn: '' };

export const tniFilterCount = (f: TniFilters) => f.staff.length + (f.requestedOn ? 1 : 0) + (f.completedOn ? 1 : 0);

export const formatTniDate = (iso: string | null) =>
  iso ? new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '-';

export const formatTniNoteDate = (iso: string) => formatTniDate(iso);

const note = (id: string, author: string, mine: boolean, text: string, createdAt: string): TniNote => ({ id, author, mine, text, createdAt });

const request = (
  id: number,
  staffId: string,
  requestedOn: string,
  status: TniStatus,
  completedOn: string | null,
  fields: Pick<TniRequest, 'trainingNames' | 'mainProgramme' | 'subProgrammes' | 'software'>,
  notes: TniNote[] = [],
): TniRequest => ({ id: `tr${id}`, staffId, requestedOn, status, completedOn, notes, ...fields });

/** Staff ids match `MY_STAFF_SEED` (ms1 = Aarav Mehta …); dummy data only */
export const TNI_REQUESTS_SEED: TniRequest[] = [
  request(
    1,
    'ms6',
    '2026-10-12',
    'Pending',
    null,
    { trainingNames: ['Cost segregation basics'], mainProgramme: 'Real Estate Taxes', subProgrammes: ['Rental Property Basics', 'Depreciation Schedules'], software: ['Lacerte'] },
    [note('n1', 'Taylor Morgan', true, 'Charvi will own the rental property clients from this season, so we would like this before December.', '2026-10-12T09:40:00')],
  ),
  request(
    2,
    'ms10',
    '2026-10-08',
    'In-Progress',
    null,
    { trainingNames: [], mainProgramme: 'Staff Training - Partnerships', subProgrammes: ['Form 1065', 'Schedule K-1 (1065)'], software: ['CCH Axcess', 'Drake'] },
    [
      note('n2', 'Neha Kapoor', false, 'Assigned to our partnership trainer. First session is planned for the week of Oct 19. We will share the schedule here.', '2026-10-10T14:05:00'),
      note('n3', 'Taylor Morgan', true, 'Please keep the sessions to the morning so they do not clash with the review calls.', '2026-10-09T11:20:00'),
    ],
  ),
  request(
    3,
    'ms14',
    '2026-10-05',
    'Pending',
    null,
    { trainingNames: ['Season readiness walkthrough'], mainProgramme: 'Basic Staff Training - Individual', subProgrammes: ['Form 1040', 'Form W-2 Wages'], software: [] },
  ),
  request(4, 'ms16', '2026-09-24', 'Pending', null, { trainingNames: ['M-1 adjustments', 'Schedule M-3 overview'], mainProgramme: '', subProgrammes: [], software: [] }),
  request(
    5,
    'ms5',
    '2026-09-18',
    'In-Progress',
    null,
    { trainingNames: [], mainProgramme: '', subProgrammes: [], software: ['QuickBooks Online', 'Xero'] },
    [note('n4', 'Neha Kapoor', false, 'Software sessions are booked for next week. Both tools are covered by the same trainer.', '2026-09-20T10:15:00')],
  ),
  request(
    6,
    'ms7',
    '2026-09-10',
    'Completed',
    '2026-10-02',
    { trainingNames: [], mainProgramme: 'Advanced Staff Training - Individual', subProgrammes: ['Foreign Tax Credit', 'Alternative Minimum Tax'], software: ['Lacerte'] },
    [
      note('n5', 'Neha Kapoor', false, 'Training is complete. Dev passed the final assessment with 86%.', '2026-10-02T16:30:00'),
      note('n6', 'Taylor Morgan', true, 'Thank you, we have already seen the difference in his review notes.', '2026-10-03T08:55:00'),
    ],
  ),
  request(
    7,
    'ms12',
    '2026-08-21',
    'Completed',
    '2026-09-12',
    { trainingNames: ['Basis tracking'], mainProgramme: 'Staff Training - S & C Corp', subProgrammes: ['Form 1120-S', 'Shareholder Basis'], software: ['UltraTax CS'] },
  ),
  request(8, 'ms17', '2026-08-04', 'Completed', '2026-08-29', { trainingNames: [], mainProgramme: 'Bookkeeping Fundamentals', subProgrammes: ['Bank Reconciliation', 'Month-end Close'], software: ['QuickBooks Online'] }),
];

/** Staff who can be picked for a new request (everyone except Inactive) */
export const tniPickableStaff = (staff: ClientStaffMember[]) =>
  staff.filter((s) => s.status !== 'Inactive').sort((a, b) => a.name.localeCompare(b.name));
