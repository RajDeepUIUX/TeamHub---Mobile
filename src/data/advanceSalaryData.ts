// Support › Advance Salary & EV Loan
import type { ThreadComment } from '../types/comments';

export const REQUEST_TYPES = ['Advance Salary', 'EV Two-Wheeler Loan', 'EV Car Loan'] as const;
export type AdvanceRequestType = (typeof REQUEST_TYPES)[number];

export const isEvLoan = (t: AdvanceRequestType) => t !== 'Advance Salary';

/** Status list as used by the web filter (typo "CTM Apporved" fixed); "Withdrawn" is set when the staff member withdraws */
export const ADVANCE_STATUSES = [
  'Manager Review Pending',
  'Manager Approved',
  'Manager Rejected',
  'CTM Review Pending',
  'CTM Approved',
  'CTM Rejected',
  'Declaration Sent',
  'Declaration Sign Completed',
  'Processed',
  'Disbursed',
  'Closed',
  'Terminate',
  'Withdrawn',
] as const;
export type AdvanceStatus = (typeof ADVANCE_STATUSES)[number];

export const STATUS_TONE: Record<AdvanceStatus, string> = {
  'Manager Review Pending': 'bg-amber-50 text-amber-600',
  'CTM Review Pending': 'bg-amber-50 text-amber-600',
  'Manager Approved': 'bg-blue-50 text-[#2F68FE]',
  'CTM Approved': 'bg-blue-50 text-[#2F68FE]',
  'Declaration Sent': 'bg-indigo-50 text-[#4F46E5]',
  'Declaration Sign Completed': 'bg-indigo-50 text-[#4F46E5]',
  Processed: 'bg-violet-50 text-violet-600',
  Disbursed: 'bg-emerald-50 text-emerald-600',
  Closed: 'bg-slate-100 text-slate-600',
  Withdrawn: 'bg-slate-100 text-slate-500',
  'Manager Rejected': 'bg-rose-50 text-rose-600',
  'CTM Rejected': 'bg-rose-50 text-rose-600',
  Terminate: 'bg-rose-50 text-rose-600',
};

/** Finished requests — they don't block a new one */
const FINISHED: AdvanceStatus[] = ['Closed', 'Manager Rejected', 'CTM Rejected', 'Terminate', 'Withdrawn'];
export const isActiveRequest = (r: AdvanceRequest) => !FINISHED.includes(r.status);
/** Guideline §12: edit before Reporting Manager / CTM approval */
export const canEditRequest = (r: AdvanceRequest) => r.status === 'Manager Review Pending' || r.status === 'CTM Review Pending';
/** Guideline §12: withdraw before final approval or disbursement */
export const canWithdrawRequest = (r: AdvanceRequest) =>
  ['Manager Review Pending', 'Manager Approved', 'CTM Review Pending', 'CTM Approved'].includes(r.status);

export const ADVANCE_REASONS = ['Medical Emergency', 'Education Expenses', 'Home Repair', 'Family Event', 'Other'];

export const BANKS = [
  'AXIS BANK',
  'BANK OF BARODA',
  'HDFC BANK',
  'ICICI BANK',
  'KOTAK MAHINDRA BANK',
  'PUNJAB NATIONAL BANK',
  'STATE BANK OF INDIA',
  'STATE BANK OF MYSORE',
  'STATE BANK OF PATIALA',
  'STATE BANK OF TRAVANCORE',
  'SYNDICATE BANK',
  'TAMILNAD MERCANTILE BANK LIMITED',
  'UNION BANK OF INDIA',
  'UNITED BANK OF INDIA',
  'VIJAYA BANK',
  'YES BANK',
];

/** Staff details shown read-only on the request form (from ERP) */
export const ADVANCE_STAFF = {
  name: 'John Smith',
  employeeId: 'A03780',
  department: 'Product Design',
  division: 'Offshoring',
  joiningDate: '2024-12-02',
  salaryBank: 'HDFC BANK',
  /** Demo figure used for the "3 months of salary" limit */
  monthlySalary: 48000,
};

export const REQUEST_LIMITS: Record<AdvanceRequestType, { maxAmount: number; maxMonths: number; info: string }> = {
  'Advance Salary': {
    maxAmount: ADVANCE_STAFF.monthlySalary * 3,
    maxMonths: 9,
    info: 'You can request an advance salary up to a maximum of 3 months of your current salary.',
  },
  'EV Two-Wheeler Loan': {
    maxAmount: 30000,
    maxMonths: 6,
    info: 'You can request up to ₹30,000 for a new electric two-wheeler, repayable over up to 6 months.',
  },
  'EV Car Loan': {
    maxAmount: 200000,
    maxMonths: 12,
    info: 'You can request up to ₹2,00,000 for a new electric car, repayable over up to 12 months.',
  },
};

export const formatINR = (n: number, decimals = 0) =>
  `₹${n.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;

export const monthlyDeduction = (amount: number, months: number) => (amount > 0 && months > 0 ? Math.round(amount / months) : 0);

export interface AdvanceCheque {
  number: string;
  file: string;
}

export interface AdvanceRequest {
  id: string;
  /** Who raised it (staff and manager views read one shared list) */
  staffName: string;
  staffCode: string;
  type: AdvanceRequestType;
  amount: number;
  months: number;
  reason: string;
  otherReason: string;
  bank: string;
  /** EV loans only (YYYY-MM-DD) */
  expectedPurchaseDate: string;
  cheques: AdvanceCheque[];
  /** Document label → uploaded file names */
  documents: Record<string, string[]>;
  status: AdvanceStatus;
  submittedOn: string;
  disbursedOn?: string;
  lastEmiDate?: string;
  closedOn?: string;
  /** EV loans: Registration Certificate uploaded after purchase */
  rcUploaded?: boolean;
  comments: ThreadComment[];
}

/** Mandatory uploads per request type (label, allows multiple files) */
export const REQUIRED_DOCUMENTS: Record<'advance' | 'ev', { label: string; multiple?: boolean }[]> = {
  advance: [
    { label: 'Supporting Document (for the reason selected)', multiple: true },
    { label: 'Last 3 months Bank Statement (Salary Account)' },
  ],
  ev: [
    { label: 'EV Loan Application Form' },
    { label: 'Vehicle Quotation (authorized dealer)' },
    { label: 'ID Proof' },
    { label: 'Address Proof' },
    { label: 'Driving Licence' },
  ],
};

export const ADVANCE_REQUESTS_SEED: AdvanceRequest[] = [
  {
    id: 'adv-2025-031',
    staffName: 'John Smith',
    staffCode: 'A03780',
    type: 'Advance Salary',
    amount: 60000,
    months: 6,
    reason: 'Medical Emergency',
    otherReason: '',
    bank: 'HDFC BANK',
    expectedPurchaseDate: '',
    cheques: [
      { number: '104521', file: 'cheque_104521.pdf' },
      { number: '104522', file: 'cheque_104522.pdf' },
      { number: '104523', file: 'cheque_104523.pdf' },
    ],
    documents: {
      'Supporting Document (for the reason selected)': ['hospital_estimate.pdf'],
      'Last 3 months Bank Statement (Salary Account)': ['hdfc_statement_dec_feb.pdf'],
    },
    status: 'Closed',
    submittedOn: '2025-03-10',
    disbursedOn: '2025-03-28',
    lastEmiDate: '2025-09-30',
    closedOn: '2025-10-06',
    comments: [
      {
        id: 'c-1',
        author: 'Naveen Das',
        role: 'Manager',
        text: 'Approved. Hope everything is okay at home, John.',
        createdAt: '2025-03-12T10:24:00+05:30',
      },
      {
        id: 'c-2',
        author: 'HR Team',
        role: 'Support',
        text: 'All EMIs received. Your request is now closed.',
        createdAt: '2025-10-06T16:05:00+05:30',
      },
    ],
  },
];

/** The reporting manager who reviews Advance Salary requests (EV loans go straight to the CTM) */
export const ADVANCE_MANAGER = 'Naveen Das';
/** Team members whose requests the manager can see */
export const ADVANCE_TEAM = ['John Smith', 'Ananya Kulkarni', 'Kunal Desai', 'Nidhi Purohit'];

/** The rest of Naveen's team (John's own requests come from ADVANCE_REQUESTS_SEED) */
export const TEAM_ADVANCE_REQUESTS_SEED: AdvanceRequest[] = [
  {
    id: 'adv-2026-118',
    staffName: 'Kunal Desai',
    staffCode: 'A02988',
    type: 'Advance Salary',
    amount: 45000,
    months: 5,
    reason: 'Home Repair',
    otherReason: '',
    bank: 'ICICI BANK',
    expectedPurchaseDate: '',
    cheques: [
      { number: '220341', file: 'cheque_220341.pdf' },
      { number: '220342', file: 'cheque_220342.pdf' },
    ],
    documents: {
      'Supporting Document (for the reason selected)': ['roof_repair_quote.pdf'],
      'Last 3 months Bank Statement (Salary Account)': ['icici_statement_jun_aug.pdf'],
    },
    status: 'Manager Review Pending',
    submittedOn: '2026-09-28',
    comments: [
      {
        id: 'c-118-1',
        author: 'Kunal Desai',
        role: 'Staff',
        text: 'The monsoon damaged part of our roof. The contractor needs to start before October.',
        createdAt: '2026-09-28T11:40:00+05:30',
      },
    ],
  },
  {
    id: 'adv-2026-114',
    staffName: 'Ananya Kulkarni',
    staffCode: 'A03515',
    type: 'Advance Salary',
    amount: 90000,
    months: 6,
    reason: 'Education Expenses',
    otherReason: '',
    bank: 'HDFC BANK',
    expectedPurchaseDate: '',
    cheques: [
      { number: '318877', file: 'cheque_318877.pdf' },
      { number: '318878', file: 'cheque_318878.pdf' },
    ],
    documents: {
      'Supporting Document (for the reason selected)': ['university_fee_notice.pdf'],
      'Last 3 months Bank Statement (Salary Account)': ['hdfc_statement_jun_aug.pdf'],
    },
    status: 'Manager Review Pending',
    submittedOn: '2026-09-25',
    comments: [],
  },
  {
    id: 'adv-2026-102',
    staffName: 'Nidhi Purohit',
    staffCode: 'A03211',
    type: 'EV Two-Wheeler Loan',
    amount: 30000,
    months: 6,
    reason: '',
    otherReason: '',
    bank: 'KOTAK MAHINDRA BANK',
    expectedPurchaseDate: '2026-10-20',
    cheques: [{ number: '771204', file: 'cheque_771204.pdf' }],
    documents: {
      'EV Loan Application Form': ['ev_application_nidhi.pdf'],
      'Vehicle Quotation (authorized dealer)': ['ather_450s_quote.pdf'],
      'ID Proof': ['aadhaar.pdf'],
      'Address Proof': ['electricity_bill.pdf'],
      'Driving Licence': ['driving_licence.pdf'],
    },
    status: 'CTM Review Pending',
    submittedOn: '2026-09-15',
    rcUploaded: false,
    comments: [],
  },
  {
    id: 'adv-2026-061',
    staffName: 'Kunal Desai',
    staffCode: 'A02988',
    type: 'Advance Salary',
    amount: 30000,
    months: 3,
    reason: 'Family Event',
    otherReason: '',
    bank: 'ICICI BANK',
    expectedPurchaseDate: '',
    cheques: [{ number: '219004', file: 'cheque_219004.pdf' }],
    documents: {
      'Supporting Document (for the reason selected)': ['wedding_invite.pdf'],
      'Last 3 months Bank Statement (Salary Account)': ['icici_statement_feb_apr.pdf'],
    },
    status: 'Closed',
    submittedOn: '2026-05-06',
    disbursedOn: '2026-05-22',
    lastEmiDate: '2026-08-31',
    closedOn: '2026-09-04',
    comments: [
      {
        id: 'c-061-1',
        author: 'Naveen Das',
        role: 'Manager',
        text: 'Approved. Congratulations to your sister, Kunal!',
        createdAt: '2026-05-07T09:15:00+05:30',
      },
    ],
  },
  {
    id: 'adv-2026-044',
    staffName: 'Nidhi Purohit',
    staffCode: 'A03211',
    type: 'Advance Salary',
    amount: 120000,
    months: 9,
    reason: 'Other',
    otherReason: 'Personal travel',
    bank: 'KOTAK MAHINDRA BANK',
    expectedPurchaseDate: '',
    cheques: [],
    documents: {},
    status: 'Manager Rejected',
    submittedOn: '2026-03-18',
    comments: [
      {
        id: 'c-044-1',
        author: 'Naveen Das',
        role: 'Manager',
        text: 'Advances are meant for emergencies, so I can’t approve travel. Happy to talk through other options.',
        createdAt: '2026-03-19T14:02:00+05:30',
      },
    ],
  },
];

/* ------------------------------ User guideline ------------------------------ */
// Text supports **bold**. Tables render as stacked cards on mobile.

export type GuideBlock =
  | { t: 'p'; text: string }
  | { t: 'h'; text: string }
  | { t: 'ul'; items: (string | { text: string; children: string[] })[] }
  | { t: 'ol'; items: string[] }
  | { t: 'path'; text: string }
  | { t: 'code'; text: string }
  | { t: 'table'; head: string[]; rows: string[][] }
  | { t: 'flow'; steps: string[] };

export interface GuideSection {
  id: string;
  title: string;
  blocks: GuideBlock[];
}

const MODULE_PATH = 'Support > Advance Salary & EV Loan';

export const ADVANCE_GUIDELINE: GuideSection[] = [
  {
    id: 'overview',
    title: 'Overview',
    blocks: [
      { t: 'p', text: 'The **Advance Salary & EV Loan** module allows eligible employees to request financial assistance through the MYCPE ONE portal.' },
      { t: 'p', text: 'Employees can apply for:' },
      { t: 'ul', items: ['Advance Salary', 'EV Two-Wheeler Loan', 'EV Car Loan'] },
      { t: 'p', text: 'The module is available under:' },
      { t: 'path', text: MODULE_PATH },
      { t: 'p', text: 'The eligibility limits, repayment tenure, documents, and post-disbursement requirements depend on the selected request type.' },
    ],
  },
  {
    id: 'eligibility',
    title: '1. Eligibility Criteria',
    blocks: [
      { t: 'h', text: 'Common Eligibility Conditions' },
      { t: 'p', text: 'To raise an Advance Salary or EV Loan request, the employee must:' },
      {
        t: 'ul',
        items: [
          'Be a confirmed, full-time employee on the Company payroll.',
          'Have completed at least 12 months of continuous service.',
          'Not be serving a notice period.',
          'Have sufficient repayment capacity based on salary and existing deductions.',
          'Meet all applicable policy and documentation requirements.',
        ],
      },
      { t: 'p', text: 'All requests remain subject to:' },
      { t: 'ul', items: ['Management discretion', 'HR and Finance verification', 'Budget availability', 'Repayment capacity'] },
      { t: 'h', text: 'Existing Loan and Advance Restrictions' },
      { t: 'p', text: 'An employee will not be able to raise a new request when:' },
      {
        t: 'ul',
        items: [
          'An existing company loan is still under repayment.',
          'An existing Advance Salary request is still under repayment.',
          'An existing EV Loan is still active.',
          'The employee has completed an Advance Salary repayment, but the required three-month cooling period has not been completed.',
          'The employee does not have sufficient net salary for EMI deductions.',
          'The employee is serving a notice period.',
        ],
      },
      { t: 'p', text: 'For an EV Loan, employees with two or more active company loans or salary advances will not be eligible.' },
    ],
  },
  {
    id: 'limits',
    title: '2. Request Limits and Repayment Tenure',
    blocks: [
      {
        t: 'table',
        head: ['Request Type', 'Maximum Eligible Amount', 'Maximum Repayment Tenure'],
        rows: [
          ['Advance Salary', "Up to 3 months of the employee's current salary", '9 months'],
          ['EV Two-Wheeler Loan', '₹30,000', '6 months'],
          ['EV Car Loan', '₹2,00,000', '12 months'],
        ],
      },
      { t: 'p', text: 'The system will automatically calculate the monthly EMI based on:' },
      { t: 'ul', items: ['Approved amount', 'Selected repayment duration', 'Applicable request type'] },
      { t: 'p', text: 'The Company may approve the complete amount, partially approve it, or reject the request.' },
    ],
  },
  {
    id: 'cooling',
    title: '3. Advance Salary Cooling Period',
    blocks: [
      { t: 'p', text: 'An employee can raise a new Advance Salary request only after:' },
      {
        t: 'ul',
        items: [
          'All EMIs for the previous request are completed.',
          'The previous request is marked as completed or closed.',
          'Three months have passed from the final EMI date.',
        ],
      },
      { t: 'p', text: 'The three-month cooling period currently applies to Advance Salary requests.' },
    ],
  },
  {
    id: 'ev-scope',
    title: '4. EV Loan Purpose and Scope',
    blocks: [
      { t: 'p', text: 'The EV Loan is an interest-free financial benefit intended to encourage employees to adopt environmentally responsible transportation.' },
      { t: 'h', text: 'Covered under the EV Loan' },
      { t: 'ul', items: ['Purchase of a new electric two-wheeler', 'Purchase of a new electric car', 'Vehicles intended for personal or family commuting'] },
      { t: 'h', text: 'Not covered under the EV Loan' },
      {
        t: 'ul',
        items: [
          'Second-hand electric vehicles',
          'Hybrid vehicles, unless specifically approved by management',
          'Commercial-use vehicles',
          'Petrol, diesel, or other fuel-based vehicles',
        ],
      },
      { t: 'p', text: "The EV Loan benefit can be availed only once during the employee's tenure with the Company." },
      { t: 'p', text: 'An EV Two-Wheeler Loan and EV Car Loan cannot be processed simultaneously.' },
    ],
  },
  {
    id: 'raise',
    title: '5. How to Raise a Request',
    blocks: [
      { t: 'h', text: 'Step 1 - Open the Module' },
      { t: 'p', text: 'Go to:' },
      { t: 'path', text: MODULE_PATH },
      { t: 'p', text: 'Click **Raise Request**.' },
      { t: 'h', text: 'Step 2 - Select the Request Type' },
      { t: 'p', text: 'Select one of the following:' },
      { t: 'ul', items: ['Advance Salary', 'EV Two-Wheeler Loan', 'EV Car Loan'] },
      { t: 'p', text: 'The system will display the applicable fields, limits, tenure, and document requirements based on the selected request type.' },
    ],
  },
  {
    id: 'details',
    title: '6. Request Details',
    blocks: [
      { t: 'h', text: 'A. Requested Amount' },
      { t: 'p', text: 'Enter the amount required.' },
      { t: 'p', text: 'The system will validate the amount against the applicable eligibility limit.' },
      { t: 'p', text: 'Maximum limits:' },
      { t: 'ul', items: ['Advance Salary: Up to 3 months of current salary', 'EV Two-Wheeler Loan: ₹30,000', 'EV Car Loan: ₹2,00,000'] },
      { t: 'p', text: 'If the amount exceeds the eligible limit, the system will display a validation message.' },
      { t: 'h', text: 'B. Repayment Duration' },
      { t: 'p', text: 'Select the repayment duration within the allowed limit:' },
      { t: 'ul', items: ['Advance Salary: Maximum 9 months', 'EV Two-Wheeler Loan: Maximum 6 months', 'EV Car Loan: Maximum 12 months'] },
      { t: 'p', text: 'The estimated monthly EMI will be calculated automatically.' },
      { t: 'h', text: 'C. Reason for Request' },
      { t: 'p', text: 'For Advance Salary:' },
      {
        t: 'ul',
        items: [
          'Select the appropriate reason from the dropdown.',
          'If the reason is unavailable, select **Other**.',
          'Enter the explanation in the description field.',
        ],
      },
      { t: 'p', text: 'For an EV Loan:' },
      {
        t: 'ul',
        items: [
          'Select the vehicle type.',
          'Enter the expected purchase date.',
          'Provide the requested loan amount.',
          'Upload the vehicle quotation from an authorized dealer.',
        ],
      },
      { t: 'h', text: 'D. Salary Bank Account' },
      { t: 'p', text: "The employee's mapped salary bank account will be displayed based on ERP records." },
      { t: 'p', text: 'The approved amount will be transferred to this account, and EMI deductions will be processed through payroll.' },
    ],
  },
  {
    id: 'cheques',
    title: '7. Signed Cheque Requirements',
    blocks: [
      { t: 'p', text: 'The signed cheque requirement applies to both:' },
      { t: 'ul', items: ['Advance Salary', 'EV Loan'] },
      { t: 'p', text: 'The employee must provide details of **3 bank-signed cheques**.' },
      { t: 'p', text: 'The employee must:' },
      {
        t: 'ul',
        items: [
          'Enter the complete six-digit cheque number for each cheque.',
          'Upload scanned copies of all three signed cheques.',
          'Submit all three physical signed cheques to the **HR Cabin or the designated HR representative**.',
        ],
      },
      { t: 'p', text: 'Example of the correct cheque number format:' },
      { t: 'code', text: '000001' },
      { t: 'p', text: 'Do not enter shortened cheque numbers such as:' },
      { t: 'ul', items: ['1', '001', '686'] },
      { t: 'p', text: 'The request cannot be completed unless all required cheque details and scanned copies are provided.' },
    ],
  },
  {
    id: 'documents',
    title: '8. Mandatory Documents',
    blocks: [
      { t: 'h', text: 'Advance Salary Documents' },
      { t: 'p', text: 'The employee must upload:' },
      {
        t: 'ul',
        items: [
          'Supporting documents related to the reason for the request',
          "Last three months' bank statement for the salary account",
          'Scanned copies of three signed cheques',
          'Any additional document requested by HR or Finance',
        ],
      },
      { t: 'p', text: 'Example: For a medical emergency, relevant medical documents must be uploaded.' },
      { t: 'h', text: 'EV Loan Documents at Application Stage' },
      { t: 'p', text: 'The employee must provide:' },
      {
        t: 'ul',
        items: [
          'EV Loan Application Form',
          'Vehicle quotation from an authorized dealer',
          'Expected purchase date',
          'Requested loan amount',
          'ID proof',
          'Address proof',
          'Driving licence copy',
          'Scanned copies of three signed cheques',
        ],
      },
      { t: 'h', text: 'EV Loan Documents After Purchase' },
      { t: 'p', text: 'The employee must provide the following within 10 days of purchasing the vehicle:' },
      {
        t: 'ul',
        items: ['Final vehicle purchase invoice', 'Vehicle Registration Certificate', 'Any other purchase-related document requested by HR or Finance'],
      },
      { t: 'p', text: 'The previously mentioned blank cheque requirement does not apply. It is replaced by the requirement to provide three signed cheques.' },
    ],
  },
  {
    id: 'submission',
    title: '9. Request Submission',
    blocks: [
      { t: 'p', text: 'After completing all mandatory fields and uploading the required documents, click **Submit**.' },
      { t: 'p', text: 'The employee will receive a confirmation email stating that the request has been submitted successfully.' },
    ],
  },
  {
    id: 'workflow',
    title: '10. Approval Workflow',
    blocks: [
      { t: 'h', text: 'Advance Salary Approval Flow' },
      {
        t: 'ol',
        items: [
          'Employee submits the request.',
          'Reporting Manager reviews the request.',
          'CTM reviews the request, where applicable.',
          'HR verifies eligibility and documents.',
          'Finance verifies repayment capacity.',
          'Agreement is generated.',
          'Employee completes the e-signature.',
          'Finance processes the disbursement.',
        ],
      },
      { t: 'p', text: 'Where no CTM is mapped, the request may proceed after Reporting Manager approval, followed by HR and Finance processing.' },
      { t: 'h', text: 'EV Loan Approval Flow' },
      {
        t: 'ol',
        items: [
          'Employee submits the request.',
          'CTM reviews the request.',
          'HR verifies employment and policy eligibility.',
          'Finance verifies salary, deductions, and repayment capacity.',
          'The request is approved, partially approved, or rejected.',
          'Agreement and repayment instructions are generated.',
          'Employee completes the e-signature.',
          'Finance processes the disbursement.',
        ],
      },
      { t: 'p', text: 'The EV policy specifies the workflow as: **Employee > CTM > HR > Finance**.' },
    ],
  },
  {
    id: 'verification',
    title: '11. Eligibility Verification',
    blocks: [
      { t: 'h', text: 'HR will verify:' },
      {
        t: 'ul',
        items: [
          'Employment status',
          'Confirmation status',
          'Continuous service tenure',
          'Notice-period status',
          'Existing loan or advance history',
          'Policy eligibility',
          'Required documents',
        ],
      },
      { t: 'h', text: 'Finance will verify:' },
      { t: 'ul', items: ['Salary structure', 'Existing payroll deductions', 'Net salary availability', 'EMI repayment capacity', 'Budget availability'] },
    ],
  },
  {
    id: 'edit-withdraw',
    title: '12. Edit and Withdrawal',
    blocks: [
      { t: 'p', text: 'The employee may:' },
      { t: 'ul', items: ['Edit the request before Reporting Manager or CTM approval.', 'Withdraw the request before final approval or disbursement.'] },
      { t: 'p', text: 'Editing or withdrawal may be restricted after:' },
      { t: 'ul', items: ['Agreement generation', 'E-sign completion', 'Disbursement processing'] },
    ],
  },
  {
    id: 'agreement',
    title: '13. Agreement and E-Signature',
    blocks: [
      { t: 'p', text: 'Once all required approvals are completed:' },
      {
        t: 'ul',
        items: [
          'HR or Finance will generate the applicable agreement or declaration.',
          "The agreement will be sent to the employee's personal email address.",
          'The employee must complete the e-signature.',
          'The request will proceed to disbursement only after the agreement is successfully signed.',
        ],
      },
    ],
  },
  {
    id: 'disbursement',
    title: '14. Disbursement',
    blocks: [
      { t: 'p', text: 'After approval and agreement signing:' },
      {
        t: 'ul',
        items: [
          'Finance will process the approved amount.',
          "The amount will be transferred to the employee's mapped salary bank account.",
          'The request status will change to **Disbursed**.',
          'The disbursement date will be recorded.',
          'The EMI start date and final EMI date will be recorded.',
        ],
      },
      {
        t: 'p',
        text: 'For an EV Loan, the policy specifies an expected disbursement timeline of three to five business days after final approval and completion of the required formalities.',
      },
    ],
  },
  {
    id: 'emi',
    title: '15. EMI and Repayment',
    blocks: [
      {
        t: 'ul',
        items: [
          'Monthly EMIs will be deducted through payroll.',
          "The deduction will appear as a separate line item in the employee's salary slip.",
          'EV Loan deductions will appear as **EV Loan EMI**.',
          'The employee must maintain sufficient payable salary for the EMI deduction.',
        ],
      },
      { t: 'p', text: 'The employee must avoid repayment disruption due to:' },
      { t: 'ul', items: ['Unpaid leave', 'Salary hold', 'Payroll adjustment', 'Insufficient net salary'] },
      { t: 'p', text: 'The employee and Reporting Manager can track the request under:' },
      { t: 'path', text: MODULE_PATH },
    ],
  },
  {
    id: 'tax',
    title: '16. EV Loan Tax Treatment',
    blocks: [
      { t: 'p', text: 'The EV Loan is provided on an interest-free basis.' },
      { t: 'p', text: 'However:' },
      {
        t: 'ul',
        items: [
          "Notional interest or perquisite value may be added to the employee's taxable income as per applicable income-tax rules.",
          "Any resulting personal tax liability will be the employee's responsibility.",
          'Under the New Income Tax Regime, no tax exemption is available on EV Loan interest.',
        ],
      },
    ],
  },
  {
    id: 'separation',
    title: '17. Resignation or Separation',
    blocks: [
      { t: 'p', text: 'If the employee resigns, is terminated, or otherwise separates from the Company before completing repayment:' },
      {
        t: 'ul',
        items: [
          'The complete outstanding balance may become immediately payable.',
          "The outstanding amount may be recovered through the employee's Full and Final Settlement.",
          'Any balance not covered by the settlement may need to be paid separately by the employee.',
        ],
      },
    ],
  },
  {
    id: 'closure',
    title: '18. Completion and Closure',
    blocks: [
      { t: 'p', text: 'After all EMIs are successfully completed:' },
      {
        t: 'ul',
        items: [
          'The request will be marked as **Completed** or **Closed**.',
          'For an EV Loan, HR will issue a Loan Closure Letter or No Objection Certificate.',
          'For Advance Salary, the three-month cooling period will start from the final EMI date.',
          'A new Advance Salary request can be raised only after the cooling period is completed.',
        ],
      },
    ],
  },
  {
    id: 'compliance',
    title: '19. EV Loan Usage and Compliance',
    blocks: [
      { t: 'p', text: 'The EV Loan must be used only for the approved EV purchase.' },
      { t: 'p', text: 'The following may be treated as misuse:' },
      {
        t: 'ul',
        items: [
          'Submission of false documents',
          'Misrepresentation of vehicle details',
          'Use of funds for a non-EV purchase',
          'Purchase of an ineligible vehicle',
          'Immediate sale or transfer of the vehicle to misuse the benefit',
          'Failure to submit the purchase invoice or Registration Certificate',
          'Use of the amount for any unapproved purpose',
        ],
      },
      { t: 'p', text: 'Misuse may result in:' },
      {
        t: 'ul',
        items: [
          'Immediate recall of the outstanding loan',
          'Disciplinary action',
          'Recovery through payroll or Full and Final Settlement',
          'Future ineligibility for Company benefits',
        ],
      },
      { t: 'p', text: 'Any exception will remain subject to management discretion.' },
    ],
  },
  {
    id: 'tracking',
    title: '20. Communication and Tracking',
    blocks: [
      {
        t: 'ul',
        items: [
          'A comment box will be available for communication.',
          'Comments will be visible to authorized management users.',
          'Email notifications will be sent at important approval and status stages.',
          {
            text: 'Employees can track:',
            children: [
              'Current status',
              'Approval progress',
              'Comments',
              'Agreement status',
              'Disbursement details',
              'EMI duration',
              'Completion status',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'status-flow',
    title: '21. Status Flow',
    blocks: [
      { t: 'h', text: 'Advance Salary' },
      {
        t: 'flow',
        steps: [
          'Requested',
          'Manager Review Pending',
          'Manager Approved',
          'CTM Approval, if applicable',
          'HR Review',
          'Finance Review',
          'Agreement Generated',
          'E-Sign Completed',
          'Disbursed',
          'Active - EMI Running',
          'Completed',
          'Cooling Period Completed',
        ],
      },
      { t: 'h', text: 'EV Loan' },
      {
        t: 'flow',
        steps: [
          'Requested',
          'CTM Approval',
          'HR Verification',
          'Finance Verification',
          'Approved',
          'Agreement Generated',
          'E-Sign Completed',
          'Disbursed',
          'Active - EMI Running',
          'Completed',
          'Closed / NOC Issued',
        ],
      },
    ],
  },
  {
    id: 'summary',
    title: '22. Summary of Key Rules',
    blocks: [
      {
        t: 'table',
        head: ['Rule', 'Advance Salary', 'EV Two-Wheeler Loan', 'EV Car Loan'],
        rows: [
          ['Minimum service', '12 months', '12 months', '12 months'],
          ['Maximum amount', "Up to 3 months' salary", '₹30,000', '₹2,00,000'],
          ['Maximum repayment tenure', '9 months', '6 months', '12 months'],
          ['Three signed cheques required', 'Yes', 'Yes', 'Yes'],
          [
            'Physical cheque submission',
            'HR Cabin or designated HR representative',
            'HR Cabin or designated HR representative',
            'HR Cabin or designated HR representative',
          ],
          ['Complete 6-digit cheque number required', 'Yes', 'Yes', 'Yes'],
          ['E-sign before disbursement', 'Yes', 'Yes', 'Yes'],
          ['Payroll EMI deduction', 'Yes', 'Yes', 'Yes'],
          ['Cooling period', '3 months', 'Not currently specified', 'Not currently specified'],
          ['Interest-free', 'Subject to applicable Advance Salary policy', 'Yes', 'Yes'],
          ['EV benefit frequency', 'Not applicable', 'Once during tenure', 'Once during tenure'],
          ['Closure document', 'As applicable', 'Closure Letter / NOC', 'Closure Letter / NOC'],
        ],
      },
    ],
  },
];

/* -------------------------------- Eligibility -------------------------------- */

const addMonths = (iso: string, months: number) => {
  const d = new Date(`${iso}T00:00:00`);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
};

const monthsOfService = (joining: string, today: string) => {
  const a = new Date(`${joining}T00:00:00`);
  const b = new Date(`${today}T00:00:00`);
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()) - (b.getDate() < a.getDate() ? 1 : 0);
};

export const formatAdvanceDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

/**
 * Why each request type can't be raised right now (null = allowed), per guideline §1, §3 and §4.
 * `ignoreId` lets an edited request skip itself.
 */
export const requestAvailability = (
  requests: AdvanceRequest[],
  today: string,
  ignoreId?: string
): Record<AdvanceRequestType, string | null> => {
  const others = requests.filter((r) => r.id !== ignoreId);
  const blockAll =
    monthsOfService(ADVANCE_STAFF.joiningDate, today) < 12
      ? 'Available after 12 months of continuous service.'
      : others.some(isActiveRequest)
        ? 'You already have a request in progress.'
        : null;

  const lastAdvance = others
    .filter((r) => r.type === 'Advance Salary' && r.status === 'Closed' && r.lastEmiDate)
    .sort((a, b) => (b.lastEmiDate ?? '').localeCompare(a.lastEmiDate ?? ''))[0];
  const coolingEnds = lastAdvance ? addMonths(lastAdvance.lastEmiDate!, 3) : null;
  const cooling = coolingEnds && today < coolingEnds ? `Cooling period ends ${formatAdvanceDate(coolingEnds)}.` : null;

  const evUsed = others.some((r) => isEvLoan(r.type) && !['Manager Rejected', 'CTM Rejected', 'Withdrawn'].includes(r.status))
    ? 'The EV Loan can be availed only once during your tenure.'
    : null;

  return {
    'Advance Salary': blockAll ?? cooling,
    'EV Two-Wheeler Loan': blockAll ?? evUsed,
    'EV Car Loan': blockAll ?? evUsed,
  };
};
