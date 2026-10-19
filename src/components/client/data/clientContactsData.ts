import type { ClientFirmContact } from './clientCompanyProfileData';

/**
 * Account › Client Contacts (desktop `contacts`, table `tblcontacts`): the firm's other contacts. The signed-in contact is
 * not listed (desktop `id != login_id`); only Partner Portal Admins can open it. List columns: Full Name, Username,
 * Email, Designation, Mobile. Row actions: Edit, and Send Partner Portal Credential while the contact has no username.
 */
export interface ClientContact {
  id: string;
  /** The signed-in contact — kept for the Company Profile list, hidden here */
  isSelf?: boolean;
  title: '' | 'Mr.' | 'Mrs.' | 'Ms.';
  firstName: string;
  lastName: string;
  designation: string;
  /** ISO yyyy-mm-dd or '' */
  birthDate: string;
  qualification: string[];
  businessEmail: string;
  personalEmail: string;
  secondEmail: string;
  /** US mask 999-999-9999 */
  mobile: string;
  directPhone: string;
  phone: string;
  ext: string;
  address: string;
  city: string;
  zipCode: string;
  country: string;
  state: string;
  linkedin: string;
  facebook: string;
  instagram: string;
  twitter: string;
  skype: string;
  notes: string;
  /** Desktop checkboxes */
  invoices: boolean;
  isPrimary: boolean;
  decisionMaker: boolean;
  reportingManager: boolean;
  /** Desktop label "Op Out" (`mass_email_campign`) */
  optOutEmails: boolean;
  timesheet: boolean;
  iMessage: boolean;
  isAdmin: boolean;
  /** Contact Role name (assigned in Contact Roles); empty = desktop default "Manager" */
  role: string;
  /** Empty until Partner Portal credentials are sent */
  username: string;
  credentialsSentAt: string | null;
  createdAt: string;
}

export type ClientContactDraft = Omit<ClientContact, 'id' | 'isSelf' | 'role' | 'username' | 'credentialsSentAt' | 'createdAt'> & {
  /** "Send Partner Portal Credentials" checkbox (add / edit while no credentials were sent) */
  sendCredentials: boolean;
};

export type ClientContactErrors = Partial<Record<keyof ClientContactDraft, string>>;

export const CONTACT_TITLES = ['Mr.', 'Mrs.', 'Ms.'] as const;
export const CONTACT_QUALIFICATIONS = ['CPA', 'EA'] as const;
/** Desktop `tbldesignation` (active) */
export const CONTACT_DESIGNATIONS = [
  'Managing Partner',
  'Partner',
  'Director',
  'Controller',
  'Finance Manager',
  'HR Manager',
  'Operations Manager',
  'Office Manager',
  'Senior Accountant',
  'Administrator',
] as const;

export const CONTACT_LIMITS = { name: 50, address: 300, zip: 10, ext: 4, social: 255, notes: 500 } as const;
export const CONTACT_LOAD_MS = 600;
export const CONTACT_SAVE_MS = 800;

export const EMPTY_CONTACT_DRAFT: ClientContactDraft = {
  title: '',
  firstName: '',
  lastName: '',
  designation: '',
  birthDate: '',
  qualification: [],
  businessEmail: '',
  personalEmail: '',
  secondEmail: '',
  mobile: '',
  directPhone: '',
  phone: '',
  ext: '',
  address: '',
  city: '',
  zipCode: '',
  country: '',
  state: '',
  linkedin: '',
  facebook: '',
  instagram: '',
  twitter: '',
  skype: '',
  notes: '',
  invoices: false,
  isPrimary: false,
  decisionMaker: false,
  reportingManager: false,
  optOutEmails: false,
  timesheet: false,
  iMessage: false,
  isAdmin: false,
  sendCredentials: false,
};

export const draftOfContact = (c: ClientContact): ClientContactDraft => {
  const { id: _id, isSelf: _self, role: _role, username: _username, credentialsSentAt: _sent, createdAt: _created, ...rest } = c;
  return { ...rest, sendCredentials: false };
};

const { sendCredentials: _noCredentials, ...BLANK_CONTACT } = EMPTY_CONTACT_DRAFT;

const contact = (id: string, c: Partial<ClientContact> & Pick<ClientContact, 'firstName' | 'lastName' | 'businessEmail'>): ClientContact => ({
  ...BLANK_CONTACT,
  id,
  role: '',
  username: '',
  credentialsSentAt: null,
  createdAt: '2025-01-15',
  ...c,
});

/** Dummy firm contacts (Northwind CPA); the first row is the signed-in contact */
export const CLIENT_CONTACTS_SEED: ClientContact[] = [
  contact('fc-1', {
    isSelf: true,
    title: 'Mr.',
    firstName: 'Taylor',
    lastName: 'Morgan',
    designation: 'Managing Partner',
    businessEmail: 'taylor.morgan@northwindcpa.example',
    mobile: '617-555-0148',
    isPrimary: true,
    isAdmin: true,
    decisionMaker: true,
    invoices: true,
    role: 'Client Admin',
    username: 'taylor_morgan',
    credentialsSentAt: '2021-03-08',
    createdAt: '2021-03-08',
  }),
  contact('fc-2', {
    title: 'Ms.',
    firstName: 'Alex',
    lastName: 'Rivera',
    designation: 'HR Manager',
    qualification: ['CPA'],
    businessEmail: 'alex.rivera@northwindcpa.example',
    personalEmail: 'alex.rivera@example.com',
    mobile: '617-555-0121',
    phone: '617-555-0100',
    ext: '2104',
    address: '100 Example Avenue, Suite 400',
    city: 'Boston',
    state: 'Massachusetts',
    country: 'United States',
    zipCode: '02110',
    linkedin: 'https://www.linkedin.com/in/alex-rivera-example',
    reportingManager: true,
    timesheet: true,
    role: 'HR Manager',
    username: 'alex_rivera',
    credentialsSentAt: '2024-02-20',
    createdAt: '2024-02-20',
  }),
  contact('fc-3', {
    title: 'Mr.',
    firstName: 'Chris',
    lastName: 'Walker',
    designation: 'Finance Manager',
    qualification: ['CPA', 'EA'],
    businessEmail: 'chris.walker@northwindcpa.example',
    mobile: '617-555-0133',
    directPhone: '617-555-0134',
    address: '100 Example Avenue, Suite 400',
    city: 'Boston',
    state: 'Massachusetts',
    country: 'United States',
    zipCode: '02110',
    invoices: true,
    role: 'Finance & Billing',
    username: 'chris_walker',
    credentialsSentAt: '2024-06-03',
    createdAt: '2024-06-03',
  }),
  contact('fc-4', {
    title: 'Mr.',
    firstName: 'Sam',
    lastName: 'Patel',
    designation: 'Operations Manager',
    businessEmail: 'sam.patel@northwindcpa.example',
    mobile: '617-555-0166',
    iMessage: true,
    createdAt: '2026-09-28',
  }),
  contact('fc-5', {
    title: 'Ms.',
    firstName: 'Jordan',
    lastName: 'Lee',
    designation: 'Senior Accountant',
    businessEmail: 'jordan.lee@northwindcpa.example',
    mobile: '617-555-0172',
    decisionMaker: true,
    createdAt: '2026-10-05',
  }),
];

export const firmContactOf = (c: ClientContact): ClientFirmContact => ({
  id: c.id,
  name: `${c.firstName} ${c.lastName}`,
  email: c.businessEmail,
  role: c.role,
  isAdmin: c.isAdmin,
  isPrimary: c.isPrimary,
});

export const contactName = (c: Pick<ClientContact, 'firstName' | 'lastName'>) => `${c.firstName} ${c.lastName}`.trim();

/** Desktop `userName` = first_last lowercase; an existing match appends `_<count>` */
export const usernameFor = (firstName: string, lastName: string, existing: string[]) => {
  const base = `${firstName.trim()}_${lastName.trim()}`.toLowerCase().replace(/\s+/g, '');
  const taken = existing.filter((u) => u.includes(base)).length;
  return taken ? `${base}_${taken}` : base;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const isValidEmail = (v: string) => EMAIL.test(v.trim());

/** 6175550148 → 617-555-0148 while typing (desktop `inputmask 999-999-9999`) */
export const formatContactPhone = (raw: string) => {
  const d = raw.replace(/\D/g, '').slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
};

const isValidUrl = (v: string) => {
  try {
    const u = new URL(v);
    return (u.protocol === 'http:' || u.protocol === 'https:') && u.hostname.includes('.');
  } catch {
    return false;
  }
};

/** Desktop jQuery validate (first / last name, business email required; other emails valid) + mobile checks (mask, 4-digit ext, duplicate email) */
export const validateContactDraft = (d: ClientContactDraft, others: ClientContact[]): ClientContactErrors => {
  const e: ClientContactErrors = {};
  if (!d.firstName.trim()) e.firstName = 'First name is required.';
  if (!d.lastName.trim()) e.lastName = 'Last name is required.';
  const biz = d.businessEmail.trim();
  if (!biz) e.businessEmail = 'Business email is required.';
  else if (!isValidEmail(biz)) e.businessEmail = 'Please enter a valid business email.';
  else if (others.some((o) => o.businessEmail.toLowerCase() === biz.toLowerCase())) e.businessEmail = 'A contact with this email already exists.';
  if (d.personalEmail.trim() && !isValidEmail(d.personalEmail)) e.personalEmail = 'Please enter a valid personal email.';
  if (d.secondEmail.trim() && !isValidEmail(d.secondEmail)) e.secondEmail = 'Please enter a valid second email.';
  (['mobile', 'directPhone', 'phone'] as const).forEach((k) => {
    if (d[k] && d[k].replace(/\D/g, '').length !== 10) e[k] = 'Enter a 10-digit number.';
  });
  if (d.ext && d.ext.length !== CONTACT_LIMITS.ext) e.ext = 'Ext must be 4 digits.';
  (['linkedin', 'facebook', 'instagram', 'twitter'] as const).forEach((k) => {
    if (d[k].trim() && !isValidUrl(d[k].trim())) e[k] = 'Enter a full link, e.g. https://…';
  });
  return e;
};

export const formatContactDate = (iso: string) =>
  new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
