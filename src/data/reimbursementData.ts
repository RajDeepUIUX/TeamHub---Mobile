/** Expense Reimbursement (Payroll) — advance requests and reimbursement claims */

export const EXPENSE_CATEGORIES = [
  'Travel Tickets',
  'Food',
  'Cab',
  'Hotel',
  'Others',
  'Team Outing',
  'Events',
  'EA Training',
  'CPA Training',
  'Cash Balance',
  'Cash Expense',
  'Client - Sponsored',
  'Squad Meeting',
  'CMA Training',
];

export const EXPENSE_BRANCHES = [
  'Ahmedabad',
  'Anand',
  'Bangalore',
  'Baroda',
  'Bhubaneswar',
  'Chandigarh',
  'Chennai',
  'Coimbatore',
  'Gandhinagar',
  'Gurugram',
  'Hyderabad',
  'Indore',
  'Jaipur',
  'Kolkata',
  'Mumbai',
  'Noida',
  'Pune',
  'Rajkot',
  'Surat',
  'Udaipur',
  'Vijayawada',
];

/** One line of an advance request */
export interface ExpenseItem {
  id: string;
  category: string | null;
  /** YYYY-MM-DD — reimbursement claims only */
  expenseDate: string | null;
  branch: string | null;
  description: string;
  quantity: string;
  amount: string;
  receiptName: string | null;
}

export const emptyExpenseItem = (): ExpenseItem => ({
  id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  category: null,
  expenseDate: null,
  branch: null,
  description: '',
  quantity: '',
  amount: '',
  receiptName: null,
});

/** ₹ 2,323.00 */
export const formatRupees = (n: number) =>
  `₹ ${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/* ------------------------------------------------------------------------- */
/* Submitted requests (advance or reimbursement) — reviewed by the manager   */
/* ------------------------------------------------------------------------- */

export type ExpenseRequestKind = 'advance' | 'reimbursement';
export type ExpenseRequestStatus = 'Pending' | 'Approved' | 'Rejected';
export type ExpenseDecision = 'Approved' | 'Rejected';

export interface ExpenseRequest {
  id: string;
  /** e.g. AH/14102026/2 — branch code / submission date / running number that day */
  trackingNo: string;
  kind: ExpenseRequestKind;
  staffName: string;
  staffCode: string;
  items: ExpenseItem[];
  total: number;
  status: ExpenseRequestStatus;
  /** ISO timestamp */
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  managerComment?: string;
  /** Set when approved (may differ from the total in future) */
  approvedAmount?: number;
  /** Set once the payout is made */
  paidOn?: string;
  /** Reimbursement claimed against an approved advance */
  advanceId?: string;
}

/** Branch code used in tracking numbers: first two letters, e.g. Ahmedabad → AH */
export const branchCode = (branch: string | null) => (branch ?? 'HQ').replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase();

/** AH/14102026/2 */
export const makeTrackingNo = (branch: string | null, date: Date, seq: number) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${branchCode(branch)}/${pad(date.getDate())}${pad(date.getMonth() + 1)}${date.getFullYear()}/${seq}`;
};

/** Status as shown in the list (pending advances read "Advance Pending", like the web app) */
export const expenseStatusLabel = (r: Pick<ExpenseRequest, 'kind' | 'status'>) =>
  r.kind === 'advance' && r.status !== 'Rejected' ? `Advance ${r.status}` : r.status;

export const EXPENSE_KIND_LABEL: Record<ExpenseRequestKind, string> = {
  advance: 'Advance',
  reimbursement: 'Reimbursement',
};

const item = (category: string, branch: string, description: string, quantity: number, amount: number, expenseDate: string | null = null, receiptName: string | null = null): ExpenseItem => ({
  id: `seed-${category}-${amount}`,
  category,
  expenseDate,
  branch,
  description,
  quantity: String(quantity),
  amount: String(amount),
  receiptName,
});

const sum = (items: ExpenseItem[]) => items.reduce((n, it) => n + (parseFloat(it.amount) || 0), 0);

/** Other team members' requests, as seen by their reporting manager */
export const TEAM_EXPENSE_REQUESTS_SEED: ExpenseRequest[] = (
  [
    {
      id: 'exp-team-1',
      trackingNo: 'AH/10102026/1',
      kind: 'reimbursement',
      staffName: 'Ananya Kulkarni',
      staffCode: 'A03515',
      items: [
        item('Cab', 'Ahmedabad', 'Cab to the client office for the year-end audit kickoff.', 2, 780, '2026-10-08', 'cab-receipt.pdf'),
        item('Food', 'Ahmedabad', 'Team dinner after the late filing night.', 1, 2150, '2026-10-08', 'dinner-bill.jpg'),
      ],
      status: 'Pending',
      submittedAt: '2026-10-10T09:20:00.000Z',
    },
    {
      id: 'exp-team-2',
      trackingNo: 'BA/12102026/1',
      kind: 'advance',
      staffName: 'Kunal Desai',
      staffCode: 'A02988',
      items: [item('Travel Tickets', 'Bangalore', 'Flights for the CPA training batch in Bangalore.', 1, 9200)],
      status: 'Pending',
      submittedAt: '2026-10-12T06:45:00.000Z',
    },
    {
      id: 'exp-team-3',
      trackingNo: 'AH/29092026/1',
      kind: 'reimbursement',
      staffName: 'Nidhi Purohit',
      staffCode: 'A03211',
      items: [item('Team Outing', 'Ahmedabad', 'Snacks and games for the team outing.', 1, 3400, '2026-09-27', 'outing-invoice.pdf')],
      status: 'Approved',
      submittedAt: '2026-09-29T11:10:00.000Z',
      reviewedBy: 'Naveen Das',
      reviewedAt: 'Sep 30, 2026',
      approvedAmount: 3400,
      paidOn: 'Oct 07, 2026',
    },
    {
      id: 'exp-team-4',
      trackingNo: 'AH/22092026/1',
      kind: 'reimbursement',
      staffName: 'Kunal Desai',
      staffCode: 'A02988',
      items: [item('Others', 'Ahmedabad', 'Personal headphones.', 1, 1899, '2026-09-20')],
      status: 'Rejected',
      submittedAt: '2026-09-22T08:00:00.000Z',
      reviewedBy: 'Naveen Das',
      reviewedAt: 'Sep 23, 2026',
      managerComment: 'Personal accessories aren\u2019t covered. Please raise an asset request through IT instead.',
    },
  ] as Omit<ExpenseRequest, 'total'>[]
).map((r) => ({ ...r, total: sum(r.items) }));
