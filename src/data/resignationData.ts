import type { ResignationRecord } from '../types/resignation';

export const RESIGNATION_REASONS = [
  'Moving Abroad',
  'Behavioral Issue',
  'Health Issue',
  'Location',
  'Better Opportunity',
  'Changing Industry',
  'Family Medical Reasons',
  'Low Salary',
  'Relocation',
  'Maternity',
  'Late Working',
  'Ask to Leave',
  'Terminated',
  'Relieved Early',
  'Notice Period Served',
  'Policy Violation',
  'Other',
];

/** Notice period in calendar days, counting the resignation date itself */
export const NOTICE_PERIOD_DAYS = 60;

export const REPORTING_MANAGER = 'Naveen Das';

export const ACCEPTED_ATTACHMENTS = '.pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png';

export const TERMS_TEXT =
  'I hereby agree all the Terms and Conditions of the Company remain active Post Cessation as per the Appointment Letter. If you have any queries please email us in writing.';

const pad = (n: number) => String(n).padStart(2, '0');

export const toISODate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const lastWorkingDateFor = (resignationISO: string) => {
  const d = new Date(`${resignationISO}T00:00:00`);
  d.setDate(d.getDate() + NOTICE_PERIOD_DAYS - 1);
  return toISODate(d);
};

/** "2026-09-29" -> "29 Sep 2026" */
export const formatResignationDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export const RESIGNATION_EMAIL_TEMPLATE = (managerName: string, lastDay: string, name: string) =>
  `Dear ${managerName},

Please accept this as formal notice of my resignation. As per my notice period, my last working day will be ${lastDay}.

I'm grateful for the opportunities and support I've received here. I'll do everything I can to ensure a smooth handover of my responsibilities.

Thank you,
${name}`;

/* ------------------------- Team resignations (demo) ------------------------ */

/** The signed-in staff member, attached to resignations they submit */
export const CURRENT_STAFF = {
  staffName: 'Shanker Dey',
  staffCode: 'A03780',
  designation: 'Lead Designer',
  department: 'Product Design',
};

const LETTER = (manager: string, name: string) =>
  `Dear ${manager},\n\nPlease accept this as formal notice of my resignation. I'm grateful for the support and opportunities during my time here, and I'll make sure the handover is smooth.\n\nRegards,\n${name}`;

/** Other team members' resignations visible to the reporting manager */
export const TEAM_RESIGNATIONS_SEED: ResignationRecord[] = [
  {
    id: 'team-resig-1',
    staffName: 'Ananya Kulkarni',
    staffCode: 'A03515',
    designation: 'HR Executive',
    department: 'Client Success Delivery (CSD)',
    resignationDate: '2026-09-29',
    lastWorkingDate: '2026-11-27',
    reasons: ['Health Issue'],
    emailContent: LETTER(REPORTING_MANAGER, 'Ananya Kulkarni'),
    attachments: [],
    status: 'Notice',
    reportingManager: REPORTING_MANAGER,
    managerApproval: 'Pending',
    ctmApproval: 'Pending',
  },
  {
    id: 'team-resig-2',
    staffName: 'Nidhi Purohit',
    staffCode: 'A03211',
    designation: 'Senior Developer',
    department: 'Engineering',
    resignationDate: '2026-09-12',
    lastWorkingDate: '2026-11-10',
    reasons: ['Better Opportunity', 'Relocation'],
    emailContent: LETTER(REPORTING_MANAGER, 'Nidhi Purohit'),
    attachments: ['Offer_Acceptance.pdf'],
    status: 'Notice',
    reportingManager: REPORTING_MANAGER,
    managerApproval: 'Approved',
    managerComment: 'Thank you for your contributions. Wishing you the best.',
    managerReviewedAt: '2026-09-14',
    ctmApproval: 'Pending',
  },
  {
    id: 'team-resig-3',
    staffName: 'Kunal Desai',
    staffCode: 'A02988',
    designation: 'Audit Associate',
    department: 'Audit',
    resignationDate: '2026-08-20',
    lastWorkingDate: '2026-10-18',
    reasons: ['Changing Industry'],
    emailContent: LETTER(REPORTING_MANAGER, 'Kunal Desai'),
    attachments: [],
    status: 'Withdrawn',
    reportingManager: REPORTING_MANAGER,
    managerApproval: 'Pending',
    ctmApproval: 'Pending',
    withdrawReason: 'Discussed growth plans with my manager and decided to stay.',
    withdrawnAt: '2026-08-27',
  },
];
