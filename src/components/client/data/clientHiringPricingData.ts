/**
 * Mock data for Hire New Staff → Pricing & Hiring (desktop `hiringpricing`, static reference tables).
 * Rates and roles vary by the firm's country (desktop `client_country`: 1 = Canada, 2 = United States, 3 = United Kingdom;
 * anything else shows US rates). Read-only; no amounts here are client specific.
 */

export type PricingCurrency = 'USD' | 'CAD' | 'GBP';

export type PricingCategory = 'accounting' | 'tax' | 'audit' | 'non-technical' | 'specialized' | 'additional';

export const PRICING_TABS: { id: PricingCategory; label: string }[] = [
  { id: 'accounting', label: 'Accounting & Advisory' },
  { id: 'tax', label: 'Tax' },
  { id: 'audit', label: 'Audit & Assurance' },
  { id: 'non-technical', label: 'Non-technical Roles' },
  { id: 'specialized', label: 'Specialized Roles' },
  { id: 'additional', label: 'Additional Information' },
];

export const currencyForCountry = (country: string): PricingCurrency => {
  const c = country.trim().toLowerCase();
  if (c === 'canada') return 'CAD';
  if (c === 'united kingdom' || c === 'uk') return 'GBP';
  return 'USD';
};

export const CURRENCY_LABEL: Record<PricingCurrency, string> = {
  USD: 'US dollars (USD)',
  CAD: 'Canadian dollars (CAD)',
  GBP: 'British pounds (GBP)',
};

/** Hourly rate per pricing tier (1-8) in each currency */
const RATE_TIERS: Record<number, Record<PricingCurrency, string>> = {
  1: { CAD: 'CA$ 15', USD: '$11', GBP: '£ 9' },
  2: { CAD: 'CA$ 18', USD: '$13', GBP: '£ 10' },
  3: { CAD: 'CA$ 20 - CA$ 24', USD: '$14 - $17', GBP: '£ 11 - £ 13' },
  4: { CAD: 'CA$ 25 - CA$ 30', USD: '$18 - $22', GBP: '£ 14 - £ 16' },
  5: { CAD: 'CA$ 31 - CA$ 42', USD: '$23 - $30', GBP: '£ 17 - £ 22' },
  6: { CAD: 'CA$ 43 - CA$ 55', USD: '$31 - $40', GBP: '£ 23 - £ 30' },
  7: { CAD: 'CA$ 55+', USD: '$40+', GBP: '£ 30+' },
  8: { CAD: 'CA$ 70+', USD: '$50+', GBP: '£ 38+' },
};

/** Hourly rate for a level (rate tier = level), as listed on Hiring Pricing; '' for levels outside 1-8 */
export const hourlyRateForLevel = (level: number, currency: PricingCurrency = 'USD') => RATE_TIERS[level]?.[currency] ?? '';

export const DESIGNATIONS: Record<number, string> = {
  1: 'Consultant',
  2: 'Sr. Consultant',
  3: 'Specialist',
  4: 'Team Lead',
  5: 'Assistant Manager',
  6: 'Manager',
  7: 'Senior Manager',
  8: 'Director / Practice Lead',
};

interface PricingRowSpec {
  level: number;
  /** Rate tier (a role group can be priced a tier above its level) */
  tier: number;
  roles: string[];
  /** Only shown for these currencies (desktop country conditions) */
  only?: PricingCurrency[];
}

export interface PricingRow {
  id: string;
  level: number;
  designation: string;
  rate: string;
  roles: string[];
}

const BOOKKEEPING_JUNIOR = ['Bookkeeper', 'Payroll Associate', 'Billing Associate', 'Accountant', 'AR/AP Assistant', 'Business Analyst'];
const BOOKKEEPING_SENIOR = ['Bookkeeper', 'Payroll Specialist', 'Billing Associate', 'Accountant', 'AR/AP Assistant', 'Business Analyst'];
const REVIEW_ROLES = ['Financial Review & Reporting', 'Data & Financial Analytics', 'Management Accountant', 'Accounting', 'Controller'];
const TAX_PREPARERS = ['Tax Preparer (Individual)', 'Tax Preparer (Business)'];
const TAX_ASSISTANTS = ['Tax Accountant', 'Sales & Use Tax Assistant'];
const TAX_SPECIALIST = [...TAX_PREPARERS, 'Tax Accountant', 'International Tax (Individual)', 'International Tax (Business)', 'Sales & Use Tax Assistant'];
const TAX_REVIEW = ['Tax Reviewer', 'Taxation', 'Tax Advisor/Planner'];
const AUDIT_ROLES = ['Financial Audit', 'EBP Audit', 'Internal Audit', 'Financials Statement'];
const NON_PROFIT = ['Non-Profit/Single Audit'];
const NON_TECH_ROLES = [
  'Virtual Assistant',
  'Business Development',
  'Talent Acquisition',
  'HR & Operations',
  'Client Relationship Management',
  'Onboarding & Transition',
  'Training & L&D',
];
const SPECIAL_ROLES = [
  'Forensic Accountant',
  'M&A',
  'Due Diligence',
  'Litigation Support',
  'Technology & ERP',
  'Process Improvement / SOP',
  'Risk & Compliance',
  'Estate & Trust Planning',
  'SOX Audit',
];

const CAD_GBP: PricingCurrency[] = ['CAD', 'GBP'];
const CAD_USD: PricingCurrency[] = ['CAD', 'USD'];
const USD_ONLY: PricingCurrency[] = ['USD'];
const GBP_ONLY: PricingCurrency[] = ['GBP'];

const SPECS: Record<Exclude<PricingCategory, 'additional'>, PricingRowSpec[]> = {
  accounting: [
    { level: 1, tier: 1, roles: BOOKKEEPING_JUNIOR },
    { level: 2, tier: 2, roles: BOOKKEEPING_JUNIOR },
    { level: 3, tier: 3, roles: BOOKKEEPING_SENIOR },
    { level: 4, tier: 4, roles: BOOKKEEPING_SENIOR },
    { level: 5, tier: 5, roles: REVIEW_ROLES },
    { level: 5, tier: 6, roles: ['Advisor to CFO'] },
    { level: 6, tier: 6, roles: REVIEW_ROLES },
    { level: 6, tier: 7, roles: ['Advisor to CFO'] },
    { level: 7, tier: 7, roles: ['Controller', 'Accounting & Advisory'] },
    { level: 7, tier: 8, roles: ['Virtual CFO'] },
    { level: 8, tier: 8, roles: ['Controller', 'Accounting & Advisory', 'Virtual CFO'] },
  ],
  tax: [
    { level: 1, tier: 1, roles: TAX_PREPARERS },
    { level: 1, tier: 1, roles: TAX_ASSISTANTS, only: USD_ONLY },
    { level: 1, tier: 2, roles: ['Tax Accountant'], only: CAD_GBP },
    { level: 2, tier: 2, roles: TAX_PREPARERS },
    { level: 2, tier: 2, roles: TAX_ASSISTANTS, only: CAD_USD },
    { level: 2, tier: 3, roles: ['Tax Accountant'], only: GBP_ONLY },
    { level: 3, tier: 3, roles: TAX_SPECIALIST },
    { level: 4, tier: 4, roles: [...TAX_SPECIALIST.slice(0, 5), 'Tax Credits & Incentives', 'Sales & Use Tax Assistant'] },
    { level: 5, tier: 5, roles: TAX_REVIEW },
    { level: 6, tier: 6, roles: TAX_REVIEW },
    { level: 7, tier: 7, roles: ['Taxation', 'Tax Practice Lead (6–8 Years)'] },
    { level: 8, tier: 8, roles: ['Taxation', 'Tax Practice Lead'] },
  ],
  audit: [
    { level: 1, tier: 1, roles: AUDIT_ROLES },
    { level: 1, tier: 2, roles: NON_PROFIT },
    { level: 2, tier: 2, roles: [...AUDIT_ROLES, ...NON_PROFIT], only: USD_ONLY },
    { level: 2, tier: 2, roles: AUDIT_ROLES, only: CAD_GBP },
    { level: 2, tier: 3, roles: NON_PROFIT, only: CAD_GBP },
    { level: 3, tier: 3, roles: [...AUDIT_ROLES, ...NON_PROFIT], only: USD_ONLY },
    { level: 3, tier: 3, roles: AUDIT_ROLES, only: CAD_GBP },
    { level: 3, tier: 4, roles: NON_PROFIT, only: CAD_GBP },
    { level: 4, tier: 4, roles: [...AUDIT_ROLES, ...NON_PROFIT], only: USD_ONLY },
    { level: 4, tier: 4, roles: AUDIT_ROLES, only: CAD_GBP },
    { level: 4, tier: 5, roles: NON_PROFIT, only: CAD_GBP },
    { level: 5, tier: 5, roles: [...AUDIT_ROLES, ...NON_PROFIT] },
    { level: 6, tier: 6, roles: AUDIT_ROLES },
    { level: 6, tier: 7, roles: NON_PROFIT },
    { level: 7, tier: 7, roles: AUDIT_ROLES },
    { level: 7, tier: 8, roles: NON_PROFIT },
    { level: 8, tier: 8, roles: [...AUDIT_ROLES, ...NON_PROFIT] },
  ],
  'non-technical': [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({ level: n, tier: n, roles: NON_TECH_ROLES })),
  specialized: [3, 4, 5, 6, 7, 8].map((n) => ({ level: n, tier: n, roles: SPECIAL_ROLES })),
};

export const pricingRowsFor = (category: Exclude<PricingCategory, 'additional'>, currency: PricingCurrency): PricingRow[] =>
  SPECS[category]
    .filter((s) => !s.only || s.only.includes(currency))
    .map((s, i) => ({
      id: `${category}-${s.level}-${i}`,
      level: s.level,
      designation: DESIGNATIONS[s.level],
      rate: RATE_TIERS[s.tier][currency],
      roles: s.roles,
    }));

/** Role areas listed above the Non-technical / Specialized tables */
export const CATEGORY_INTRO: Partial<Record<PricingCategory, { text: string; areas: string[] }>> = {
  'non-technical': {
    text: 'Pricing for non-technical roles. Each role is grouped into levels with a designation and an hourly rate.',
    areas: [
      'HR & Related Support',
      'Talent Acquisition',
      'Recruitment Support',
      'Admin & Customer Support',
      'Virtual Assistant',
      'Customer Support',
      'Data Processing',
      'SEO Specialist',
      'Video Editing',
      'Content Writing',
      'Digital Marketing - Specialist',
      'Social Media Marketing',
      'Digital Marketing – Ecommerce Specialist',
    ],
  },
  specialized: {
    text: 'Pricing for specialized roles. Each role is grouped into levels with a designation and an hourly rate.',
    areas: [
      'Business Valuation',
      'M & A & Transaction Advisory',
      'Internal Audit',
      'FP & A',
      'IFRS',
      'EBP Audit',
      'Fraud & Forensic Advisory',
      'SOC Examination',
      'SOX Audit',
      'SEC Audit & Compliances',
      'Tax Planning & Representation',
      'Digital Marketing - Specialist',
      'Social Media Marketing',
      'Content Writing',
      'Business Development',
      'Cybersecurity & Privacy',
      'IT & Related Support',
      'Digital Marketing – Ecommerce Specialist',
    ],
  },
};

/* ---------------------------- Additional Information ---------------------------- */

export interface HiringModel {
  id: string;
  name: string;
  availableUpto: string;
  minWeeklyBilling: string;
  rate: string;
  /** Rate adjustment vs. the listed rate (shown green on desktop) */
  rateAdjusted: boolean;
  note?: string;
}

export const HIRING_MODELS: HiringModel[] = [
  { id: 'full', name: 'Full Time', availableUpto: 'All levels', minWeeklyBilling: '40 hrs × Rate', rate: 'As mentioned', rateAdjusted: false },
  { id: 'part', name: 'Part Time / Temporary', availableUpto: 'Levels 1 to 4', minWeeklyBilling: '20 hrs × Rate', rate: '25% extra', rateAdjusted: true },
  { id: 'demand', name: 'On-Demand', availableUpto: 'All levels', minWeeklyBilling: '$100', rate: '50% extra', rateAdjusted: true },
];

export const HIRING_MODEL_NOTES: { title: string; text: string }[] = [
  {
    title: 'Part-Time / On-Demand / Temporary',
    text: 'If you later decide to convert the engagement or staff to full-time, we will try to align the same staff member, but the same staff member may or may not be available.',
  },
  {
    title: 'On-Demand',
    text: 'We directly assign you a dedicated staff member (instead of a formal interview and selection process) with a manager as the point of contact. The manager reviews their tasks and work performed by the staff.',
  },
];

export interface TermGroup {
  id: string;
  title: string;
  items: string[];
}

export const HIRING_TERM_GROUPS: TermGroup[] = [
  {
    id: 'billing',
    title: 'Billing & terms',
    items: [
      'Weekly billing will be in USD.',
      'No additional set-up fees or charges',
      'Notice period of 9 weeks for each hire',
      'Daily timesheet will be provided',
      '18 paid days and 10 public holidays for team members',
      'Overtime rate remains same (Not 1.5 times)',
      'Staff Replacement Tentative Time 2 to 3 weeks',
      '3% Credit Card charges applicable.',
    ],
  },
  {
    id: 'certification',
    title: 'Certification rates',
    items: [
      'If Staff clears 2 subjects of CPA (Minimum hourly rate $17/hour)',
      'If Staff becomes CPA (Minimum hourly rate $22/hour)',
      'If Staff clears 2 parts of EA (Minimum hourly rate $15/hour)',
      'If Staff becomes EA (Minimum hourly rate $20/hour)',
    ],
  },
  {
    id: 'onboarding',
    title: 'Onboarding & support',
    items: [
      'Onboarding Time for Level 1 to 4 shall be 2 to 3 weeks.',
      'Onboarding Time for Level 5+ Profiles shall be anywhere from 2 weeks to 9 weeks.',
      'You will be given a Dedicated “Offshoring Strategic Advisor”, who is responsible for managing and scaling your offshoring journey and is your central point of contact.',
      'For Level 1 to 4 staff, the Subject Matter Expert will work closely with the team for the first 9 weeks to review their work and ensure smooth onboarding and efficient training. This helps them catch up to tasks more quickly than usual.',
      "After this period, the Subject Matter Expert will continue to provide ongoing support and guidance, focusing on broader oversight rather than involvement in detailed reviews of the staff's work. With over 6 years of experience, the Subject Matter Expert assists with complex tasks and offers expert guidance as needed.",
    ],
  },
];

export const CANCELLATION_POLICY = 'Free Look-In Period: Levels 1-4 are eligible for a full refund if canceled within the first two weeks after hiring.';
