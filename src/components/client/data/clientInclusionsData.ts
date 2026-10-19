export type InclusionTone = 'blue' | 'indigo' | 'violet' | 'green' | 'amber' | 'rose' | 'sky' | 'teal';

export interface InclusionItem {
  title: string;
  desc: string;
}

export interface InclusionSection {
  id: string;
  title: string;
  desc: string;
  tone: InclusionTone;
  items: InclusionItem[];
}

/** Service inclusions of the engagement (desktop `inclusions/inclusionlist.tpl`: 15 static sections, same order) */
export const INCLUSION_SECTIONS: InclusionSection[] = [
  {
    id: 'workspace',
    title: 'Workspace',
    desc: 'Your offshore team gets access to a fully equipped and secure workspace tailored to your firm’s needs.',
    tone: 'blue',
    items: [
      { title: 'Dedicated Workstations', desc: '5×2 sq. ft. desks per staff' },
      { title: 'Meeting & Conference Access', desc: 'Shared access as needed' },
      { title: 'Access to Manager Cabins', desc: 'Enclosed spaces for team leads' },
      { title: 'Break Areas', desc: 'Cafeteria, lunchroom, breakout zones, and dedicated breakout area' },
      { title: 'Mobile & Baggage Storage', desc: 'Dedicated space for staff belongings' },
      { title: 'IT & Connectivity', desc: 'Laptop, Wi-Fi, power backup' },
      { title: 'Secured Wi-Fi', desc: 'High-speed, password-protected access' },
      { title: 'Building Amenities', desc: 'Reception, elevators, storage, and access to common amenities' },
      { title: 'Security & Access Control', desc: 'CCTV surveillance and 24×7 physical security' },
      { title: 'Entry Access', desc: 'Key card or fingerprint-based entry' },
      { title: 'Time Flexibility', desc: 'Flexible working hours as per policy' },
      { title: 'Work Mode', desc: 'WFH or Hybrid Working Flexibility' },
    ],
  },
  {
    id: 'talent',
    title: 'Talent',
    desc: 'We manage the full spectrum of talent sourcing, selection, and documentation, ensuring your offshore team is staffed with top-tier professionals — fully compliant, vetted, and aligned with your firm’s expectations.',
    tone: 'indigo',
    items: [
      { title: 'End-to-End Hiring', desc: '7-step vetting process covering sourcing, screening, testing, and appointment' },
      { title: 'Sr. Recruiter Support', desc: 'Shared Senior Recruiter support throughout the hiring cycle' },
      { title: 'Job Description Support', desc: 'Assistance in documenting detailed job roles and responsibilities' },
      { title: 'Candidate Sourcing', desc: 'Sourcing & pre-screening using internal portals and Available Staff Hub (ASH)' },
      { title: 'Testing & Shortlisting', desc: 'Conducting recruitment tests and submitting resumes to client/staff in-charge' },
      { title: 'Background Verification', desc: 'Complete background and reference checks for shortlisted candidates' },
      { title: 'Offer & Negotiation', desc: 'Communicating terms, issuing offer letters, and securing candidate confirmation' },
      { title: 'Hiring Documentation', desc: 'Offer letters, NDAs, agreements, ID, education, and experience proofs' },
      { title: 'Staff Appointment', desc: 'Formal appointment and joining coordination' },
      { title: 'Onboarding & Induction', desc: 'Structured induction and onboarding for new staff members' },
      { title: 'Custom Agreement Terms', desc: 'Flexibility for working hours, hybrid setup, and notice period' },
      { title: 'Branded Hiring & Tracking', desc: 'Official communication address, dedicated hiring page, job postings, and tracking tools' },
    ],
  },
  {
    id: 'tax-legal',
    title: 'Tax & Legal',
    desc: 'As your Employer of Record, we handle all regulatory responsibilities so you can focus on running your firm with peace of mind.',
    tone: 'violet',
    items: [
      { title: 'EOR Coverage', desc: 'We act as the official employer' },
      { title: 'No Entity Needed', desc: 'No Indian Entity Needed' },
      { title: 'Law Compliance', desc: '30+ Law Compliance' },
      { title: 'No Transfer Pricing', desc: 'No Transfer Pricing Compliance' },
      { title: 'Payroll Compliance', desc: 'End to end Payroll Compliance' },
      { title: 'Compliance Protection', desc: 'No legal compliance exposure' },
      { title: 'Exit Compliance', desc: 'Documentation and legal support' },
      { title: 'Direct Hiring Option', desc: 'Option for direct hiring is available' },
      { title: 'No Admin Cost', desc: 'No Ongoing Compliance & Admin Cost' },
    ],
  },
  {
    id: 'hr-policies',
    title: 'HR Policies & Guidelines',
    desc: 'From payroll to engagement events, we manage your HR operations end-to-end, with customizable playbooks, automation, and team wellbeing at the core.',
    tone: 'sky',
    items: [
      { title: 'HR Playbooks & SOPs', desc: 'Access to 100+ customizable HR Playbooks, SOPs, and review checklists' },
      { title: 'Work Policy Setup', desc: 'Defined policies for hybrid work, overtime, shifts, and early Fridays' },
      { title: 'Designation & Structure', desc: 'Firm’s designation hierarchy, management team intro, and expansion plans' },
      { title: 'Values & Culture', desc: 'Company values, philosophy, and communication norms (HR, Admin, IT, etc.)' },
      { title: 'Hiring & Joining Policies', desc: 'Hiring guidelines, referral policy, notice period buyout, joining documentation' },
      { title: 'New Hire Journey', desc: 'Defined onboarding steps, team allocation, and reallocation process' },
      { title: 'Leave & Attendance', desc: 'Paid time off, leave policy, attendance rules, and public holiday calendar' },
      { title: 'Working Hours & Timing', desc: 'Shift timings, weekend/tax season working, hybrid checklist, and day closing policy' },
      { title: 'Staff Benefits', desc: 'Insurance, bonuses (joining, retention, productivity), loan policy, maternity/paternity' },
      { title: 'Workplace Facilities', desc: 'Drop-off support, car policy, outstation/relocation allowance, and IT setup' },
      { title: 'Safety & Inclusivity', desc: 'Women safety policy, menstrual leave, POSH Act, grievance redressal' },
      { title: 'Performance Management', desc: 'KAPE, staff self-review, structured 30/60-day reviews, Half yearly business reviews' },
    ],
  },
  {
    id: 'learning',
    title: 'Learning & Development',
    desc: 'We embed structured upskilling into your offshore operations with full access to our CPE platform.',
    tone: 'green',
    items: [
      { title: 'CPE & Certification Library', desc: '15,000+ hours of CPE across 500+ subjects and 100+ certification programs' },
      { title: 'CPA, EA & CMA Exam Prep', desc: 'CPA, EA, and CMA prep included at no cost for all offshore staff' },
      { title: 'Centralized Learning Hub', desc: 'Web and mobile-enabled access' },
      { title: 'Smart Learning Dashboard', desc: 'Assign, track, and manage learning progress with dashboards and analytics' },
      { title: 'Personalized Learning Paths', desc: 'Create and assign customized learning plans for teams or individuals' },
      { title: 'Role-Based Access & User Management', desc: 'Group users by teams, assign roles, and access controls' },
      { title: 'In-House Course Hosting', desc: 'Upload firm-specific modules and host live events' },
      { title: 'Reporting & Insights', desc: 'Reporting, feedback collection, and performance insights' },
      { title: 'System Integration', desc: 'Seamless integration with your firm’s HR or internal systems' },
      { title: 'Talent Credentials Snapshot', desc: 'As of May 2025: 115 EAs, 92 CPAs, 45 CMAs deployed; 1,156 EA, 768 CPA, 112 CMA in progress' },
    ],
  },
  {
    id: 'payroll',
    title: 'Payroll Processing',
    desc: 'We handle payroll from end to end—ensuring accuracy, compliance, and transparency across compensation, taxes, and employee entitlements.',
    tone: 'amber',
    items: [
      { title: 'Payroll & Attendance', desc: 'Processing Payroll and Attendance Management' },
      { title: 'Tax Compliance', desc: 'Tax Withholding & Tax Compliances' },
      { title: 'Salary Documentation', desc: 'Issuing Salary Slips and Salary Forms' },
      { title: 'Employee Tax Planning', desc: 'Tax Planning for Employees' },
      { title: 'Tax Optimized Salary Structure', desc: 'Increase Net Pay by 10%-15%' },
      { title: 'Leave Tracking', desc: 'Leave Management' },
      { title: 'Overtime Handling', desc: 'Overtime Management' },
      { title: 'Benefits Management', desc: 'Benefits & Allowance Management' },
    ],
  },
  {
    id: 'employment-terms',
    title: 'Employment Terms Support',
    desc: 'We ensure that all necessary employment terms are clearly defined in the agreement. Based on your advice, we’re happy to incorporate any suggestions you may have. Below are a few key elements we typically include, each of which is fully customizable.',
    tone: 'rose',
    items: [
      { title: 'Compensation Terms', desc: 'Salaries and Allowances' },
      { title: 'Notice Policy', desc: 'Notice Period & Buy Out' },
      { title: 'Work Type', desc: 'Full Time or Part Time' },
      { title: 'Work Model', desc: 'Work From Office/Home/Hybrid' },
      { title: 'Non-Compete Clauses', desc: 'Non-Compete & Non-Solicitation' },
      { title: 'US Indemnification', desc: 'Indemnification to US Company' },
      { title: 'Confidentiality & Security', desc: 'Confidentiality & Data Security Compliance' },
      { title: 'Documentation', desc: 'Employment Agreement & Offer Letter Signing' },
      { title: 'Negotiations', desc: 'Communicating & Negotiating Employment Terms, Joining & Other Formalities' },
    ],
  },
  {
    id: 'staff-benefits',
    title: 'Staff Benefits',
    desc: 'Our benefit suite supports employee wellbeing, financial stability, and long-term growth—covering insurance, health, learning, and lifestyle support.',
    tone: 'teal',
    items: [
      { title: 'Family Insurance', desc: 'Medical Insurance - Family Coverage' },
      { title: 'Parent Insurance', desc: 'Medical Insurance - Parents Coverage' },
      { title: 'Life Insurance', desc: 'Life Insurance (Upto ₹2 Million)' },
      { title: 'Accident Cover', desc: 'Personal Accident Cover (₹2 Million)' },
      { title: 'Scholarship Support', desc: 'CMA / EA / CPA Scholarships' },
      { title: 'Commute Support', desc: 'Shuttle Drop-Off Facility' },
      { title: 'Health Checkups', desc: 'Medical Health Checkup Facility' },
      { title: 'Loan Assistance', desc: 'Interest Free Loan (As per Policy)' },
    ],
  },
  {
    id: 'ai-hrms',
    title: 'AI Powered HRMS 24×7',
    desc: 'Our 100+ feature platform with 15+ modules is designed to manage every stage of your offshore team’s lifecycle—from hiring to payroll, performance, and beyond.',
    tone: 'indigo',
    items: [
      { title: 'Recruitment Tools', desc: 'JD hosting, resume parsing, interview tracking' },
      { title: 'Performance Reviews', desc: 'Goal setting, feedback, evaluation, and appraisal management' },
      { title: 'Payroll & Compliance', desc: 'Tax, salaries, payslips, PF, and payroll reports' },
      { title: 'Time Tracking & Attendance', desc: 'Daily timesheets, leave logs, and attendance management' },
      { title: 'Productivity Monitoring', desc: 'Time logging, idle time, logoff, screen capture, and real-time user activity' },
      { title: 'Project & Team Analytics', desc: 'Productivity reports by project, team analytics, and location tracking' },
      { title: 'App & Web Usage Insights', desc: 'Application usage, URL alerts, and website access tracking' },
      { title: 'Secure Access & Data Controls', desc: 'Screen capture, data security protocols, and controlled access monitoring' },
      { title: 'Reports & Dashboards', desc: 'Learning insights, timesheet reports, invoices, and analytics dashboards' },
    ],
  },
  {
    id: 'administration',
    title: 'Administration',
    desc: 'We offer a fully managed office environment and a culture-rich ecosystem to support productivity and team bonding.',
    tone: 'blue',
    items: [
      { title: '24×7 Office Access', desc: 'Secure entry with CCTV and guards' },
      { title: 'Power Backup Ready', desc: 'No disruption during outages' },
      { title: 'Hygiene & Cleanliness', desc: 'AC, daily cleaning, supplies' },
      { title: 'Pantry & Cafeteria', desc: 'Beverages, snacks, lunch space' },
      { title: 'Reception Assistance', desc: 'Call handling and guest support' },
      { title: 'On-site Admin Support', desc: 'Help for daily operations' },
      { title: 'Secure Parking Space', desc: '2-wheeler and 4-wheeler' },
      { title: 'Access Control System', desc: 'RFID, keycard or biometric' },
      { title: 'Insurance & Tax', desc: 'Includes office insurance, commercial and Property Taxes' },
    ],
  },
  {
    id: 'engagement',
    title: 'Engagement',
    desc: 'We foster a vibrant workplace through celebrations, wellness activities, and team engagement events that increase employee retention.',
    tone: 'rose',
    items: [
      { title: 'Welcome Kit', desc: 'Onboarding essentials for new joiners' },
      { title: 'Festival Celebrations', desc: 'Diwali, Holi, Navratri & more' },
      { title: 'Fun Friday Events', desc: 'Games, quizzes, standups' },
      { title: 'Monthly Awards', desc: 'Staff Recognitions' },
      { title: 'Birthday Celebrations', desc: 'Personalized employee moments' },
      { title: 'Work Anniversary Gifts', desc: 'Tokens for year completions' },
      { title: 'Cricket & League Play', desc: 'Internal sports tournaments' },
      { title: 'Fitness Activities', desc: 'Yoga, Zumba, guided meditation' },
      { title: 'Wellness Initiatives', desc: 'Includes annual Stepathon and mental health counselling support.' },
    ],
  },
  {
    id: 'it',
    title: 'Information Technology',
    desc: 'We provide a fully managed, compliant IT setup with built-in data security, remote support, and infrastructure monitoring—designed to meet U.S. accounting industry standards.',
    tone: 'sky',
    items: [
      { title: 'CCTV & NVR Storage', desc: '24x7 surveillance system' },
      { title: 'KeyCard Office Access', desc: 'Controlled movement across office' },
      { title: 'Dedicated Internet Lines', desc: 'Reliable high-speed connectivity' },
      { title: 'Central Data Storage', desc: 'Secure QNAP NAS setup' },
      { title: 'On-Site IT Support', desc: 'Help for daily tech issues' },
      { title: 'Web Access Firewall', desc: 'Controlled and filtered browsing' },
      { title: 'No Local Storage', desc: 'Central-only file saving enforced' },
      { title: 'WFH Security Setup', desc: 'Protected remote work environment' },
      { title: 'GDPR Compliance', desc: 'No printer/paper access, personal email blocked' },
    ],
  },
  {
    id: 'data-security',
    title: 'Data Security',
    desc: 'We ensure multi-layered protection across systems, users, and data. From real-time detection to end-user training, your environment stays audit-ready and resilient.',
    tone: 'violet',
    items: [
      { title: 'Endpoint Protection', desc: 'Real-Time EDR, Exploit Defense' },
      { title: 'Threat Scanning', desc: 'Scan Scheduling, Continuous Monitoring' },
      { title: 'EDR Deployment', desc: 'Deployment Tools, Security Policy' },
      { title: 'Threat Intelligence', desc: 'Feed Analysis, Actionable Insights' },
      { title: 'Email & Web Security', desc: 'Phishing Protection, DNS Filtering' },
      { title: 'Logs & Storage', desc: 'Log Collection, Retention Compliance' },
      { title: 'Security Training', desc: 'Awareness, Phishing Test, Exposure Check' },
      { title: 'Vulnerability Checks', desc: 'Patch Verification, EOL Software' },
      { title: 'System Protection', desc: 'Auto file isolation and malware quarantine for enhanced endpoint security.' },
    ],
  },
  {
    id: 'compliance',
    title: 'Compliance',
    desc: 'We align with global regulatory standards, including IRS 7216, AICPA, and FTC. Our infrastructure includes real-time response, logging, and data security—designed for audit-readiness.',
    tone: 'green',
    items: [
      { title: 'Regulatory Compliance', desc: 'IRS 7216, AICPA, FTC rules' },
      { title: 'Threat Response', desc: 'Rapid threat containment' },
      { title: 'System Protection', desc: 'Comprehensive protection & enhancements' },
      { title: 'Log Management', desc: 'Collection, configuration & normalization' },
      { title: 'Log Storage & Retention', desc: 'Adheres to log data retention policies for compliance and audit readiness.' },
      { title: 'Security Reporting', desc: 'Monthly report & threat insights' },
      { title: 'Log Storage', desc: 'Scalable storage & indexing' },
      { title: 'Threat Intelligence', desc: 'Feed analysis & vulnerability identification' },
      { title: 'Web Filtering', desc: 'DNS filtering & policy enforcement' },
    ],
  },
  {
    id: 'support',
    title: 'Support Function',
    desc: 'We ensure a smooth day-to-day operational environment with fully equipped amenities, round-the-clock support, and essential office infrastructure.',
    tone: 'amber',
    items: [
      { title: 'Dedicated IT Support', desc: 'On-Site Dedicated IT Support' },
      { title: 'Office Utilities', desc: 'Access to All Office Common Utilities' },
      { title: 'Pantry Access', desc: 'Unlimited Coffee & Tea' },
      { title: 'Power Backup', desc: '24*7 (Power Supply & Power Backup)' },
      { title: 'Facility Services', desc: 'Housekeeping and Security Services' },
      { title: 'Air Conditioning', desc: '24*7 HVAC (Air Conditioner Usage)' },
      { title: 'Vehicle Parking', desc: 'Proper Parking Spaces for Vehicles' },
      { title: 'Dedicated Advisor', desc: 'Support function backed by a Dedicated Advisor for ongoing assistance.' },
      { title: 'Official Address', desc: 'Official Communication Address' },
    ],
  },
];

export const INCLUSION_TOTAL = INCLUSION_SECTIONS.reduce((n, s) => n + s.items.length, 0);

/** Case and hyphen / space insensitive, so “wifi” finds “Wi-Fi” */
export const normInclusion = (v: string) => v.toLowerCase().replace(/[\s-]+/g, '');
const norm = normInclusion;

/** Desktop `performSearch`: item title / description, or section title / description */
export const filterInclusions = (query: string): { section: InclusionSection; items: InclusionItem[] }[] => {
  const q = norm(query.trim());
  if (!q) return INCLUSION_SECTIONS.map((section) => ({ section, items: section.items }));
  return INCLUSION_SECTIONS.flatMap((section) => {
    const sectionHit = norm(section.title).includes(q) || norm(section.desc).includes(q);
    const items = sectionHit ? section.items : section.items.filter((i) => norm(i.title).includes(q) || norm(i.desc).includes(q));
    return items.length > 0 ? [{ section, items }] : [];
  });
};

export const INCLUSION_GROUPS = ['All', 'Workplace', 'Talent & HR', 'Legal & Pay', 'Tech & Security'] as const;
export type InclusionGroup = (typeof INCLUSION_GROUPS)[number];

const GROUP_OF: Record<string, Exclude<InclusionGroup, 'All'>> = {
  workspace: 'Workplace',
  administration: 'Workplace',
  support: 'Workplace',
  engagement: 'Workplace',
  talent: 'Talent & HR',
  'hr-policies': 'Talent & HR',
  learning: 'Talent & HR',
  'staff-benefits': 'Talent & HR',
  'employment-terms': 'Talent & HR',
  'tax-legal': 'Legal & Pay',
  payroll: 'Legal & Pay',
  'ai-hrms': 'Tech & Security',
  it: 'Tech & Security',
  'data-security': 'Tech & Security',
  compliance: 'Tech & Security',
};

export const inGroup = (s: InclusionSection, group: InclusionGroup) => group === 'All' || GROUP_OF[s.id] === group;

export const groupCounts = (): Record<InclusionGroup, number> =>
  Object.fromEntries(INCLUSION_GROUPS.map((g) => [g, INCLUSION_SECTIONS.filter((s) => inGroup(s, g)).length])) as Record<InclusionGroup, number>;
