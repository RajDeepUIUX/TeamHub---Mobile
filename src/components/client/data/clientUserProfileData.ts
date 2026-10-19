/**
 * Client User Profile (desktop "Update Profile" modal, `bottom.tpl` + `user_profile&task=updateProfileContact`;
 * desktop now opens MyCPE ONE `dashboard/common-profile`, so B's rules apply on top: name change by request,
 * email locked for ERP clients, time zone, photo crop). Field names follow A `tblcontacts`.
 */

export type NameChangeStatus = 'Pending' | 'Approved' | 'Rejected';

export interface ClientNameChangeRequest {
  firstName: string;
  lastName: string;
  reason: string;
  files: string[];
  submittedAt: string;
  status: NameChangeStatus;
}

/** B `licenseDetails` row (Qualification Details tab) */
export interface ClientQualification {
  id: string;
  type: QualificationType;
  /** Licensing state — CPA (US) only */
  state: string;
  licenseNumber: string;
  /** ISO dates; expiry empty for PCAOB */
  issueDate: string;
  expiryDate: string;
  cycleStartDate: string;
  cycleEndDate: string;
  /** null when the qualification has no reciprocal question */
  reciprocalExemption: boolean | null;
}

export interface FollowedSpeaker {
  id: string;
  name: string;
  qualification: string;
  company: string;
}

export interface ClientUserProfile {
  firstName: string;
  lastName: string;
  email: string;
  /** US format (999) 999-9999 (B input mask); mobile optional, phone required */
  mobile: string;
  phone: string;
  /** ISO yyyy-mm-dd, empty when not set */
  birthDate: string;
  address: string;
  country: string;
  state: string;
  city: string;
  zipCode: string;
  timeZone: string;
  designation: string;
  organizationCategory: string;
  industries: string[];
  qualifications: ClientQualification[];
  /** Learning Preference › Topics (B `topics_of_interest`) */
  topics: string[];
  followedSpeakers: FollowedSpeaker[];
  memberSince: string;
  lastSyncedAt: string;
  nameChange: ClientNameChangeRequest | null;
}

export const CLIENT_USER_PROFILE_SEED: ClientUserProfile = {
  firstName: 'Taylor',
  lastName: 'Morgan',
  email: 'taylor.morgan@northwindcpa.example',
  mobile: '',
  phone: '(617) 555-0148',
  birthDate: '1985-06-12',
  address: '100 Example Avenue, Suite 400',
  country: 'United States',
  state: 'Massachusetts',
  city: 'Boston',
  zipCode: '02110',
  timeZone: 'America/New_York',
  designation: 'Managing Partner',
  organizationCategory: '',
  industries: ['Accounting & Tax'],
  qualifications: [
    {
      id: 'q-1',
      type: 'CPA (US)',
      state: 'Massachusetts',
      licenseNumber: '48213',
      issueDate: '2025-06-30',
      expiryDate: '2027-06-30',
      cycleStartDate: '2025-07-01',
      cycleEndDate: '2027-06-30',
      reciprocalExemption: false,
    },
    {
      id: 'q-2',
      type: 'EA',
      state: '',
      licenseNumber: 'P01234567',
      issueDate: '2024-01-15',
      expiryDate: '2027-03-31',
      cycleStartDate: '2024-01-01',
      cycleEndDate: '2026-12-31',
      reciprocalExemption: null,
    },
    {
      id: 'q-3',
      type: 'CMA',
      state: '',
      licenseNumber: 'CMA-50771',
      issueDate: '2023-02-01',
      expiryDate: '2025-12-31',
      cycleStartDate: '2025-01-01',
      cycleEndDate: '2025-12-31',
      reciprocalExemption: null,
    },
  ],
  topics: ['Taxation', 'Ethics', 'Data Analytics'],
  followedSpeakers: [
    { id: 'sp-1', name: 'Jordan Ellis', qualification: 'CPA', company: 'Example Learning Co.' },
    { id: 'sp-2', name: 'Priya Raman', qualification: 'EA', company: 'Sample Tax Advisors' },
    { id: 'sp-3', name: 'Marcus Hale', qualification: '', company: 'Demo Wealth Partners' },
  ],
  memberSince: '2021-03-08',
  lastSyncedAt: '2026-10-15T09:42:00',
  nameChange: null,
};

/** Country → State → City (desktop cascades `getStatesByCountryAjax` → `getCitiesByStateAjax`) */
export const CLIENT_LOCATIONS: Record<string, Record<string, string[]>> = {
  'United States': {
    California: ['Irvine', 'Los Angeles', 'Sacramento', 'San Diego', 'San Francisco', 'San Jose'],
    Florida: ['Jacksonville', 'Miami', 'Orlando', 'Tampa'],
    Georgia: ['Atlanta', 'Augusta', 'Savannah'],
    Illinois: ['Chicago', 'Naperville', 'Springfield'],
    Massachusetts: ['Boston', 'Cambridge', 'Springfield', 'Worcester'],
    'New Jersey': ['Edison', 'Jersey City', 'Newark', 'Princeton'],
    'New York': ['Albany', 'Buffalo', 'New York City', 'Rochester'],
    Texas: ['Austin', 'Dallas', 'Houston', 'San Antonio'],
    Washington: ['Bellevue', 'Seattle', 'Spokane', 'Tacoma'],
  },
  Canada: {
    'British Columbia': ['Vancouver', 'Victoria'],
    Ontario: ['Mississauga', 'Ottawa', 'Toronto'],
    Quebec: ['Montreal', 'Quebec City'],
  },
  India: {
    Gujarat: ['Ahmedabad', 'Surat', 'Vadodara'],
    Maharashtra: ['Mumbai', 'Pune'],
  },
  'United Kingdom': {
    England: ['London', 'Manchester'],
    Scotland: ['Edinburgh', 'Glasgow'],
  },
};

export const CLIENT_COUNTRIES = Object.keys(CLIENT_LOCATIONS);
export const statesOf = (country: string) => Object.keys(CLIENT_LOCATIONS[country] ?? {});
export const citiesOf = (country: string, state: string) => CLIENT_LOCATIONS[country]?.[state] ?? [];

/** MyCPE ONE timezone list (B `timezones`, PHP identifiers) — common client zones */
export const CLIENT_TIME_ZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Phoenix', label: 'Arizona (MST)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)' },
  { value: 'America/Toronto', label: 'Toronto (ET)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Asia/Kolkata', label: 'India (IST)' },
] as const;

export const timeZoneLabel = (value: string) => CLIENT_TIME_ZONES.find((t) => t.value === value)?.label ?? value;

/** Desktop rules: JPG / PNG only, cropped to a 400 × 400 square */
export const PROFILE_PHOTO_TYPES = ['image/jpeg', 'image/png'];
export const PROFILE_PHOTO_MAX_MB = 5;
export const PROFILE_PHOTO_SIZE = 400;

/** B `submitNameChangeRequest`: letters + spaces, ≤50 chars, reason ≤512, ID proof required */
export const NAME_MAX = 50;
export const NAME_REASON_MAX = 512;
export const ID_PROOF_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
export const ID_PROOF_MAX_FILES = 3;
export const ID_PROOF_MAX_MB = 5;

/** Field limits from B (`limitChar`) */
export const ADDRESS_MAX = 300;
export const ZIP_MAX = 10;

/** 6175550148 → (617) 555-0148 while typing (B `inputmask (999) 999-9999` on Mobile / Phone Number) */
export const formatUsPhone = (raw: string) => {
  const d = raw.replace(/\D/g, '').slice(0, 10);
  if (!d) return '';
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
};

/** B `config/constants.php` `organization_category` */
export const ORGANIZATION_CATEGORIES = [
  'Own Practice/ Firm',
  'Public Accounting Firm',
  'Private Corporation',
  'Government Agency',
  'Non-Profit Organization',
  'Educational Institution',
  'Financial Services',
  'Consulting Firm',
  'Other(s)',
];

/** B `designation` (job titles table) — common entries */
export const DESIGNATIONS = [
  'Owner',
  'Managing Partner',
  'Partner',
  'Director',
  'Controller',
  'Chief Financial Officer',
  'Manager',
  'Senior Accountant',
  'Staff Accountant',
  'Tax Preparer',
  'Bookkeeper',
  'Other',
];

/* ---------------------------- Qualification Details ---------------------------- */

export type QualificationType =
  | 'CPA (US)'
  | 'EA'
  | 'AFSP'
  | 'CTEC'
  | 'CFP'
  | 'CMA'
  | 'CIA'
  | 'AICPA Regular Member'
  | 'PCAOB-Registered Firm Professional';

/** B `audiences` (qualification list): what each one asks for and which Basic Details number it fills */
export const QUALIFICATION_TYPES: {
  value: QualificationType;
  label: string;
  regulator: string;
  needsState?: boolean;
  noExpiry?: boolean;
  reciprocal?: boolean;
  /** B copies the license number to PTIN (IRS), CTEC No. or CFP Board No. */
  syncsTo?: 'ptin' | 'ctec' | 'cfp';
}[] = [
  { value: 'CPA (US)', label: 'CPA (US)', regulator: 'State Board of Accountancy', needsState: true, reciprocal: true },
  { value: 'EA', label: 'Enrolled Agent (EA)', regulator: 'IRS', syncsTo: 'ptin' },
  { value: 'AFSP', label: 'Annual Filing Season Program (AFSP)', regulator: 'IRS', syncsTo: 'ptin' },
  { value: 'CTEC', label: 'CTEC Registered Tax Preparer', regulator: 'CTEC', syncsTo: 'ctec' },
  { value: 'CFP', label: 'Certified Financial Planner (CFP)', regulator: 'CFP Board', syncsTo: 'cfp' },
  { value: 'CMA', label: 'Certified Management Accountant (CMA)', regulator: 'IMA' },
  { value: 'CIA', label: 'Certified Internal Auditor (CIA)', regulator: 'IIA' },
  { value: 'AICPA Regular Member', label: 'AICPA Regular Member', regulator: 'AICPA' },
  { value: 'PCAOB-Registered Firm Professional', label: 'PCAOB-Registered Firm Professional', regulator: 'PCAOB', noExpiry: true },
];

export const qualificationMeta = (type: QualificationType) => QUALIFICATION_TYPES.find((q) => q.value === type)!;

/** Card title like B: "<State> - CPA(US)" for state licenses, the qualification name otherwise */
export const qualificationTitle = (q: ClientQualification) =>
  q.type === 'CPA (US)' && q.state ? `${q.state} - CPA(US)` : qualificationMeta(q.type).label;

/** B: Active while the CPE cycle hasn't ended */
export const isQualificationActive = (q: ClientQualification) => q.cycleEndDate >= new Date().toISOString().slice(0, 10);

export const LICENSE_NUMBER_MAX = 20;

/** PTIN / CTEC / CFP Board No. shown read-only in Basic Details (B strips the P / A prefix and shows it in a box) */
export const syncedLicenseIds = (quals: ClientQualification[]) => {
  const find = (key: 'ptin' | 'ctec' | 'cfp') => quals.find((q) => qualificationMeta(q.type).syncsTo === key)?.licenseNumber ?? '';
  return {
    ptin: find('ptin').replace(/\D/g, '').slice(0, 8),
    ctec: find('ctec').replace(/^A/i, ''),
    cfp: find('cfp'),
  };
};

/* ---------------------------- Learning Preference ---------------------------- */

/** B `topics_of_interests` — common keywords */
export const TOPIC_OPTIONS = [
  'Accounting',
  'Auditing',
  'Taxation',
  'Ethics',
  'Finance',
  'Payroll',
  'Estate Planning',
  'Fraud',
  'Data Analytics',
  'AI in Accounting',
  'Cybersecurity',
  'Leadership',
  'Communication',
  'Practice Management',
  'Not-for-Profit',
  'Governmental Accounting',
  'Retirement Planning',
  'Excel',
];
