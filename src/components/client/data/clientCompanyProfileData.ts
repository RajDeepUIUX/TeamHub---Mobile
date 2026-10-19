/**
 * Client Company Profile. Desktop `user_profile&task=companyprofile` now redirects to MyCPE ONE
 * `dashboard/common-comapny-profile` (B `MyCompanyProfileController`), so B's fields and rules apply:
 * `users` (company_name, organization_category, industry_id, phone, address_1/2, country, state_id, city_id,
 * zipcode, website, linkedin/twitter/facebook links, co_emp_size, time_zone, company_image) +
 * `firm_other_information` (ext, fax_number, no_of_onshore_staff, services). Agreements come from A
 * (`getClientAgreementData`). A's own page also listed Contact Persons (now the Client Contacts module).
 */

export interface ClientAgreement {
  id: string;
  fileName: string;
}

export interface ClientFirmContact {
  id: string;
  name: string;
  email: string;
  /** Contact role name; empty = desktop default "Manager" */
  role: string;
  isAdmin: boolean;
  isPrimary: boolean;
}

export interface ClientCompanyProfile {
  companyName: string;
  /** B `organization_category` key */
  businessType: string;
  /** Company email — read-only (B form field is `readonly`) */
  email: string;
  industries: string[];
  /** B mask (999) 999-9999 */
  phone: string;
  ext: string;
  fax: string;
  timeZone: string;
  /** B `no_of_employees` key */
  employees: string;
  onshoreStaff: string;
  address1: string;
  address2: string;
  country: string;
  state: string;
  city: string;
  zipCode: string;
  website: string;
  linkedin: string;
  twitter: string;
  facebook: string;
  services: string[];
  lastSyncedAt: string;
}

export const CLIENT_COMPANY_PROFILE_SEED: ClientCompanyProfile = {
  companyName: 'Northwind CPA',
  businessType: '2',
  email: 'info@northwindcpa.example',
  industries: ['Accounting & Tax', 'Financial Services'],
  phone: '(617) 555-0100',
  ext: '210',
  fax: '6175550199',
  timeZone: 'America/New_York',
  employees: '16-50',
  onshoreStaff: '24',
  address1: '100 Example Avenue, Suite 400',
  address2: '',
  country: 'United States',
  state: 'Massachusetts',
  city: 'Boston',
  zipCode: '02110',
  website: 'https://www.northwindcpa.example',
  linkedin: 'https://www.linkedin.com/company/northwind-cpa',
  twitter: '',
  facebook: '',
  services: ['Tax Preparation', 'Bookkeeping & Accounting', 'Audit & Assurance', 'Payroll Services'],
  lastSyncedAt: '2026-10-14T16:20:00',
};

/** B `config('constants.organization_category')` */
export const BUSINESS_TYPES = [
  { value: '1', label: 'Own Practice/ Firm' },
  { value: '2', label: 'Public Accounting Firm' },
  { value: '3', label: 'Private Corporation' },
  { value: '4', label: 'Government Agency' },
  { value: '5', label: 'Non-Profit Organization' },
  { value: '6', label: 'Educational Institution' },
  { value: '7', label: 'Financial Services' },
  { value: '8', label: 'Consulting Firm' },
  { value: '9', label: 'Other(s)' },
];

export const businessTypeLabel = (value: string) => BUSINESS_TYPES.find((b) => b.value === value)?.label ?? '';

/** B `config('constants.no_of_employees')` */
export const EMPLOYEE_SIZES = ['0-9', '10-15', '16-50', '51-500', '501-1000', '1000+'];

/** B `industries` table (active, show_status 1) — common entries */
export const INDUSTRY_OPTIONS = [
  'Accounting & Tax',
  'Audit & Assurance',
  'Banking',
  'Construction',
  'Education',
  'Financial Services',
  'Government',
  'Healthcare',
  'Hospitality',
  'Insurance',
  'Legal',
  'Manufacturing',
  'Non-Profit',
  'Real Estate',
  'Retail',
  'Technology',
];

/** B `services` table (active) — common entries */
export const SERVICE_OPTIONS = [
  'Advisory & CFO Services',
  'Audit & Assurance',
  'Bookkeeping & Accounting',
  'Business Valuation',
  'Estate & Trust',
  'Forensic Accounting',
  'Internal Audit',
  'IT & Cybersecurity',
  'Payroll Services',
  'Sales & Use Tax',
  'Tax Preparation',
  'Tax Planning',
];

/** A `getClientAgreementData` (PDF files on S3) */
export const CLIENT_AGREEMENTS_SEED: ClientAgreement[] = [
  { id: 'ag-1', fileName: 'Master Services Agreement - Northwind CPA.pdf' },
  { id: 'ag-2', fileName: 'Data Protection Addendum.pdf' },
  { id: 'ag-3', fileName: 'Staffing Order Form 2026.pdf' },
];

/** A Contact Person table (`getContactPersonData`) — full management lives in Client Contacts */
export const CLIENT_FIRM_CONTACTS_SEED: ClientFirmContact[] = [
  { id: 'fc-1', name: 'Taylor Morgan', email: 'taylor.morgan@northwindcpa.example', role: 'Client Admin', isAdmin: true, isPrimary: true },
  { id: 'fc-2', name: 'Alex Rivera', email: 'alex.rivera@northwindcpa.example', role: 'HR Manager', isAdmin: false, isPrimary: false },
  { id: 'fc-3', name: 'Chris Walker', email: 'chris.walker@northwindcpa.example', role: 'Finance & Billing', isAdmin: false, isPrimary: false },
  { id: 'fc-4', name: 'Sam Patel', email: 'sam.patel@northwindcpa.example', role: '', isAdmin: false, isPrimary: false },
];

/** B logo upload: PNG / JPG, max 800 KB, no crop */
export const COMPANY_LOGO_TYPES = ['image/png', 'image/jpeg'];
export const COMPANY_LOGO_MAX_KB = 800;

/** B `limitChar` limits */
export const COMPANY_LIMITS = {
  companyName: 100,
  ext: 10,
  fax: 15,
  onshoreStaff: 5,
  address: 300,
  zip: 6,
  website: 150,
  social: 255,
} as const;

/** 6175550100 → (617) 555-0100 while typing (B `inputmask (999) 999-9999`) */
export const formatCompanyPhone = (raw: string) => {
  const d = raw.replace(/\D/g, '').slice(0, 10);
  if (!d) return '';
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
};

/** jQuery validate `url` — needs a scheme and a host with a dot */
export const isValidUrl = (value: string) => {
  try {
    const u = new URL(value);
    return (u.protocol === 'http:' || u.protocol === 'https:') && u.hostname.includes('.');
  } catch {
    return false;
  }
};

/** https://www.northwindcpa.example/ → northwindcpa.example */
export const shortUrl = (value: string) => value.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '');
