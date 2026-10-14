/** Policies & Guidelines — company policy documents (same for every role) */

export const POLICY_CATEGORIES = [
  'About Us',
  'Attendance Leave OT Productivity',
  'Benefits & Allowances',
  'Customer Success',
  'Events & Activities',
  'Growth & Development Guidelines',
  'Guidelines',
  'HR & Admin Guidelines',
  'Information Security Policies',
  'IT Policy & Data Security',
  'Learning & Development',
  'Operations & Team Connect Guidelines',
  'Our Social Impact Initiatives',
  'Recruitment & Onboarding',
  'Salary & Compensation',
  'Tax Planning',
] as const;

export type PolicyCategory = (typeof POLICY_CATEGORIES)[number];

export interface Policy {
  id: string;
  title: string;
  category: PolicyCategory;
  year: number;
  /** Opens in the browser (a new tab) */
  fileUrl: string;
}

// Placeholder document until the real policy files are wired up
const SAMPLE_PDF = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

const p = (id: string, title: string, category: PolicyCategory, year = 2026): Policy => ({ id, title, category, year, fileUrl: SAMPLE_PDF });

export const POLICIES: Policy[] = [
  p('pol-01', 'Annual Learning Framework', 'Learning & Development'),
  p('pol-02', 'Voicing Your Concern, Feedback & Suggestions', 'HR & Admin Guidelines'),
  p('pol-03', 'Housekeeping & Support Staff Welfare Guidelines', 'HR & Admin Guidelines'),
  p('pol-04', 'Electric Vehicle Adoption & Interest-free Loan Guidelines', 'Benefits & Allowances'),
  p('pol-05', 'CSD - Staff Referral Bonus Guidelines', 'Benefits & Allowances'),
  p('pol-06', 'Flexi Benefits Card - Zaggle Onboarding & Usage Guidelines', 'Salary & Compensation'),
  p('pol-07', 'New Income Tax Changes', 'Salary & Compensation'),
  p('pol-08', 'ESIC - Coverage, Contribution & Benefits', 'Salary & Compensation'),
  p('pol-09', 'National Pension Scheme', 'Salary & Compensation'),
  p('pol-10', 'Provident Fund', 'Salary & Compensation'),
  p('pol-11', 'Information Security Awareness Program', 'IT Policy & Data Security'),
  p('pol-12', 'Maternity & Paternity Leave', 'Benefits & Allowances'),
  p('pol-13', 'Gratuity Guidelines', 'Salary & Compensation'),
  p('pol-14', 'Annual Appraisal Cycle', 'Benefits & Allowances'),
  p('pol-15', 'Team Outing/Get Together Reimbursement', 'Benefits & Allowances'),
  p('pol-16', 'Resignation & FNF Guidelines', 'HR & Admin Guidelines'),
  p('pol-17', "Why You Shouldn't Join MYCPE One", 'Recruitment & Onboarding'),
  // Previous year (shows up with the 2025 filter)
  p('pol-18', 'Work From Home & Hybrid Work Policy', 'HR & Admin Guidelines', 2025),
  p('pol-19', 'Leave & Attendance Policy', 'Attendance Leave OT Productivity', 2025),
  p('pol-20', 'Acceptable Use of IT Assets', 'Information Security Policies', 2025),
];

export const POLICY_YEARS = Array.from(new Set(POLICIES.map((x) => x.year))).sort((a, b) => b - a);
