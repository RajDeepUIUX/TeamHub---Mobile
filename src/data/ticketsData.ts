import { Ticket, TicketPriority, TicketStatus } from '../types/tickets';

export const TICKET_DEPARTMENTS = [
  'HR/Finance',
  'HR/Admin',
  'IT & Networking',
  'Client & Team Success Management (CTM)',
];

export const TICKET_PRIORITIES: TicketPriority[] = ['High', 'Medium', 'Low'];

/** Statuses grouped into stages so 11 statuses stay readable on a phone */
export interface TicketStatusGroup {
  id: 'active' | 'review' | 'payment' | 'done';
  label: string;
  statuses: TicketStatus[];
  /** Tile tint + accent */
  tint: string;
  accent: string;
}

export const TICKET_STATUS_GROUPS: TicketStatusGroup[] = [
  {
    id: 'active',
    label: 'Active',
    statuses: ['Open', 'In Progress', 'Answered', 'On Hold'],
    tint: 'bg-blue-50/70 border-blue-100',
    accent: 'text-[#2F68FE]',
  },
  {
    id: 'review',
    label: 'Under Review',
    statuses: ['Review by HR', 'Review by Admin', 'Review by Finance'],
    tint: 'bg-violet-50/70 border-violet-100',
    accent: 'text-violet-600',
  },
  {
    id: 'payment',
    label: 'Payment',
    statuses: ['Payment Initiated', 'Paid'],
    tint: 'bg-amber-50/70 border-amber-100',
    accent: 'text-amber-600',
  },
  {
    id: 'done',
    label: 'Completed',
    statuses: ['Closed', 'Acknowledged'],
    tint: 'bg-emerald-50/70 border-emerald-100',
    accent: 'text-emerald-600',
  },
];

export const TICKET_STATUSES: TicketStatus[] = TICKET_STATUS_GROUPS.flatMap((g) => g.statuses);

export const PRIORITY_STYLES: Record<TicketPriority, { chip: string; dot: string }> = {
  High: { chip: 'bg-rose-50 text-rose-600', dot: 'bg-rose-500' },
  Medium: { chip: 'bg-amber-50 text-amber-600', dot: 'bg-amber-500' },
  Low: { chip: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' },
};

export const STATUS_STYLES: Record<TicketStatus, { chip: string; dot: string }> = {
  Open: { chip: 'bg-blue-50 text-[#2F68FE]', dot: 'bg-[#2F68FE]' },
  'In Progress': { chip: 'bg-indigo-50 text-indigo-600', dot: 'bg-indigo-500' },
  Answered: { chip: 'bg-sky-50 text-sky-600', dot: 'bg-sky-500' },
  'On Hold': { chip: 'bg-orange-50 text-orange-600', dot: 'bg-orange-500' },
  'Review by HR': { chip: 'bg-violet-50 text-violet-600', dot: 'bg-violet-500' },
  'Review by Admin': { chip: 'bg-purple-50 text-purple-600', dot: 'bg-purple-500' },
  'Review by Finance': { chip: 'bg-fuchsia-50 text-fuchsia-600', dot: 'bg-fuchsia-500' },
  'Payment Initiated': { chip: 'bg-amber-50 text-amber-600', dot: 'bg-amber-500' },
  Paid: { chip: 'bg-lime-50 text-lime-700', dot: 'bg-lime-500' },
  Closed: { chip: 'bg-slate-100 text-slate-500', dot: 'bg-slate-400' },
  Acknowledged: { chip: 'bg-emerald-50 text-emerald-600', dot: 'bg-emerald-500' },
};

export const formatTicketDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export const formatTicketDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

/* ----------------------- Rich text helpers (editor) ----------------------- */

const ALLOWED_TAGS = new Set(['P', 'DIV', 'BR', 'B', 'STRONG', 'I', 'EM', 'U', 'UL', 'OL', 'LI', 'H2', 'H3']);

/** Keep only simple formatting tags and drop every attribute (no scripts, links or styles) */
export const sanitizeTicketHtml = (html: string) => {
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
  const root = doc.body.firstElementChild as HTMLElement;

  const clean = (node: Node): Node | null => {
    if (node.nodeType === Node.TEXT_NODE) return doc.createTextNode(node.textContent ?? '');
    if (node.nodeType !== Node.ELEMENT_NODE) return null;
    const el = node as HTMLElement;
    const children = Array.from(el.childNodes).map(clean).filter(Boolean) as Node[];
    if (!ALLOWED_TAGS.has(el.tagName)) {
      // Unwrap unknown tags but keep their text
      const frag = doc.createDocumentFragment();
      children.forEach((c) => frag.appendChild(c));
      return frag;
    }
    const safe = doc.createElement(el.tagName.toLowerCase());
    children.forEach((c) => safe.appendChild(c));
    return safe;
  };

  const out = doc.createElement('div');
  Array.from(root.childNodes).forEach((n) => {
    const c = clean(n);
    if (c) out.appendChild(c);
  });
  return out.innerHTML;
};

/** Plain-text preview of editor HTML, for cards */
export const htmlToText = (html: string) => {
  const doc = new DOMParser().parseFromString(html.replace(/<(br|\/p|\/div|\/li)>/gi, ' $&'), 'text/html');
  return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim();
};

/* ------------------------------- Demo tickets ------------------------------ */

const at = (date: string, time = '10:30') => new Date(`${date}T${time}:00`).toISOString();

/** Tickets already raised by the signed-in staff member (John Smith) */
export const STAFF_TICKETS_SEED: Ticket[] = [
  {
    id: '93349',
    staffName: 'John Smith',
    staffCode: 'A03780',
    subject: 'EPFO Balance Not Transferred from Entigrity to MyCPE One Solutions',
    department: 'HR/Finance',
    priority: 'High',
    descriptionHtml:
      '<p>My EPFO balance from the previous entity has not been transferred to the MyCPE One Solutions account.</p><ul><li>UAN is linked to both entities</li><li>Transfer claim submitted in August</li></ul>',
    status: 'Review by Finance',
    createdAt: at('2026-09-08', '11:15'),
    comments: [
      {
        id: 'c-93349-1',
        author: 'HR Support',
        role: 'Support',
        text: 'Thanks John, we have forwarded this to the Finance team for review.',
        createdAt: at('2026-09-09', '10:05'),
      },
    ],
  },
  {
    id: '93263',
    staffName: 'John Smith',
    staffCode: 'A03780',
    subject: 'Salary Credit Difference of ₹1,944 and ₹3,645 - Request for Review',
    department: 'HR/Finance',
    priority: 'High',
    descriptionHtml: '<p>There is a difference of <b>₹1,944</b> and <b>₹3,645</b> in my last two salary credits. Please review.</p>',
    status: 'Closed',
    createdAt: at('2026-09-01', '09:40'),
    comments: [
      {
        id: 'c-93263-1',
        author: 'Finance Team',
        role: 'Support',
        text: 'The difference was due to a revised tax deduction. The corrected amount is reflected in the September payroll.',
        createdAt: at('2026-09-04', '16:20'),
      },
    ],
  },
  {
    id: '85644',
    staffName: 'John Smith',
    staffCode: 'A03780',
    subject: 'Opt Out from PF',
    department: 'HR/Finance',
    priority: 'High',
    descriptionHtml: '<p>I would like to opt out of the PF contribution from next month. Please let me know the process.</p>',
    status: 'Closed',
    createdAt: at('2025-09-05', '12:00'),
    comments: [],
  },
];

/** Tickets raised by other members of the manager's team */
export const TEAM_TICKETS_SEED: Ticket[] = [
  {
    id: '93377',
    staffName: 'Ananya Kulkarni',
    staffCode: 'A03515',
    subject: 'Access card not working at the main entrance',
    department: 'HR/Admin',
    priority: 'Medium',
    descriptionHtml: '<p>My access card stopped working at the Gota main entrance since Monday.</p>',
    status: 'Open',
    createdAt: at('2026-09-26', '09:10'),
    comments: [],
  },
  {
    id: '93358',
    staffName: 'Nidhi Purohit',
    staffCode: 'A03211',
    subject: 'VPN keeps disconnecting while working from client site',
    department: 'IT & Networking',
    priority: 'High',
    descriptionHtml: '<p>The VPN drops every 10–15 minutes on the client network.</p><ol><li>Tried re-installing the client</li><li>Issue persists on mobile hotspot too</li></ol>',
    status: 'In Progress',
    createdAt: at('2026-09-18', '14:25'),
    comments: [
      {
        id: 'c-93358-1',
        author: 'IT Support',
        role: 'Support',
        text: 'We have pushed a new VPN profile. Please restart and confirm.',
        createdAt: at('2026-09-19', '11:00'),
      },
    ],
  },
  {
    id: '93301',
    staffName: 'Kunal Desai',
    staffCode: 'A02988',
    subject: 'Reimbursement for client visit travel',
    department: 'HR/Finance',
    priority: 'Low',
    descriptionHtml: '<p>Submitting cab bills for the client visit on 10 Sep for reimbursement.</p>',
    status: 'Payment Initiated',
    createdAt: at('2026-09-11', '17:45'),
    comments: [],
  },
];
