/** My Profile: schema-driven tabs, mirroring the web profile. Tabs without a schema yet show a placeholder. */

export type ProfileFieldType =
  | 'text'
  | 'email'
  | 'tel'
  | 'date'
  | 'year'
  | 'select'
  | 'radio'
  /** Two-option switch (e.g. Yes / No) */
  | 'toggle'
  | 'checkbox'
  | 'number'
  | 'textarea'
  /** Uploaded document; the value is the file name */
  | 'file'
  /** Several picks from a searchable list; the value is a string[] */
  | 'multiselect'
  /** Weekday chips with an "All" shortcut; options are the days; the value is a string[] */
  | 'days'
  /** Hourly time-slot chips; options are "HH:MM-HH:MM"; the value is a string[] */
  | 'slots'
  /** "HH:MM" picked on hour / minute wheels */
  | 'time'
  /** Calculated from other values; never edited */
  | 'auto';

export type ProfileValue = string | boolean | string[];
export type ProfileValues = Record<string, ProfileValue>;

export interface ProfileField {
  key: string;
  label: string;
  type: ProfileFieldType;
  /** Managed by HR — shown as "View only" in edit mode */
  locked?: boolean;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  /** Takes the full row in the 2-column grid */
  full?: boolean;
  /** Only shown when this returns true (gets the section's values, or the list item's) */
  showIf?: (values: ProfileValues) => boolean;
  /** Consecutive fields with the same group render together under a sub-heading (e.g. Father / Mother) */
  group?: string;
  /** Checkbox text in edit mode (the label is used in view mode) */
  checkboxText?: string;
  /** For 'auto' fields */
  compute?: (values: ProfileValues) => string;
  /** Date can't be earlier than another date field in the same values */
  minFrom?: { key: string; label: string };
  /** Small info line shown under the value */
  hint?: string;
  /** Must differ from another field (e.g. Secondary vs Primary Domain) */
  notEqual?: { key: string; label: string };
  /** Renders as a question card: bold label, this text, then the answer */
  question?: string;
  /** Text shown in view mode when there's no value */
  emptyText?: string;
  /** Question fields: extra single-choice asked when the answer is "Yes" */
  followUp?: { key: string; label: string; options: { value: string; hint: string }[] };
}

/** A repeatable list inside a section (Family Members, Qualifications, Experience) */
export interface ProfileListConfig {
  key: string;
  /** "Qualification" → "Qualification 1", "New qualification" */
  itemLabel: string;
  addLabel: string;
  emptyText: string;
  fields: ProfileField[];
  /** Stat tiles shown above the items */
  summary?: (items: ProfileListItem[]) => { label: string; value: string; highlight?: boolean }[];
}

/** Pick items from a master list and rate each one (Software / Technical Skills) */
export interface ProfileSkillsConfig {
  key: string;
  /** "software" / "skill" — used in button and empty-state copy */
  noun: string;
  addLabel: string;
  emptyText: string;
  options: { name: string; category?: string }[];
}

export const PROFICIENCY_LEVELS = ['Basic', 'Average', 'Intermediate', 'Advance', 'Expert'];

export interface ProfileSection {
  title: string;
  fields?: ProfileField[];
  list?: ProfileListConfig;
  skills?: ProfileSkillsConfig;
  /** Line of small print under the section */
  note?: string;
  /** Tag on the right of the section title (replaces per-field tags, e.g. "Auto") */
  badge?: string;
  /** Short explanation under the section title */
  description?: string;
}

export type ProfileTabId = 'personal' | 'professional' | 'skills' | 'learning' | 'clients' | 'availability' | 'video';

export interface ProfileTab {
  id: ProfileTabId;
  label: string;
  /** Empty until the tab's design is shared */
  sections: ProfileSection[];
}

export type ProfileListItem = ProfileValues & { id: string };

export interface MyProfileData {
  values: ProfileValues;
  lists: Record<string, ProfileListItem[]>;
}

/* --------------------------------- Helpers --------------------------------- */

const pad = (n: number) => String(n).padStart(2, '0');
const isoToday = () => {
  const t = new Date();
  return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
};

/** Whole months between two YYYY-MM-DD dates */
export const monthsBetween = (from: string, to: string) => {
  if (!from || !to || to < from) return 0;
  const a = new Date(`${from}T00:00:00`);
  const b = new Date(`${to}T00:00:00`);
  let months = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
  if (b.getDate() < a.getDate()) months -= 1;
  return Math.max(0, months);
};

/** 21 → "1 Year 9 Months" */
export const formatMonths = (total: number) => {
  const y = Math.floor(total / 12);
  const m = total % 12;
  const part = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'}`;
  return [y ? part(y, 'Year') : '', m || !y ? part(m, 'Month') : ''].filter(Boolean).join(' ');
};

/** Tenure from a YYYY-MM-DD joining date, e.g. "1 Year 9 Months" */
export const tenureFrom = (joining: string) => formatMonths(monthsBetween(joining, isoToday()));

/** Months worked in one experience entry (a current organisation counts until today) */
const experienceMonths = (v: ProfileValues) =>
  monthsBetween(v.joiningDate as string, v.currentOrg === 'Yes' ? isoToday() : (v.lastWorkingDate as string));

/* ---------------------------------- Options --------------------------------- */

const YES_NO = ['Yes', 'No'];
export const FAMILY_RELATIONS = ['Sister', 'Brother', 'Friend', 'Father in Law', 'Mother in Law', 'Brother in Law', 'Sister in Law'];

// Education master list (web app), sorted A–Z for the searchable sheet
const EDUCATION_OPTIONS = [
  // From the web dropdown
  '12th Pass',
  '2 Yrs+ Exp. in CA Firm',
  'ACCA',
  'ACCA Pursuing',
  'Bachelor of Arts',
  'Bachelor of Business Administration (BBA)',
  'Bachelor of Commerce',
  'Bachelor of Computer Applications (BCA)',
  'Bachelor of Engineering',
  'Bachelor of Engineering (BEng) / Bachelor of Technology (BTech)',
  'Bachelor of Laws (LLB)',
  'Bachelor of Science (BSC)',
  'BBA Finance',
  'BSC',
  'CA',
  'CA Pursuing - Articleship > 2Yrs',
  'CA Pursuing - Final - Group 1',
  'CA Pursuing - Final - Group 2',
  'CA Pursuing - Intermediate - Group 1',
  'CA Pursuing - Intermediate - Group 2',
  'CA-Intermediate',
  'CFA Pursuing',
  'CMA - Intermediate',
  'CMA India Pursuing - Final',
  'CMA Pursuing',
  'CMA US',
  'CMA US Pursuing - Part 1',
  'Cost and Management Accountant (CMA)',
  'CPA Pursuing',
  'CS',
  'CS - Intermediate',
  'EA',
  'EA Pursuing',
  'EA Pursuing - Part 1',
  'Enrolled Agent',
  'Master of Business Administration (MBA)',
  'Master of Commerce',
  'Master of Commerce (MCom)',
  'MBA Finance',
  'Postgraduate Diploma in Management (PGDM)',
  // Added to complete the series / common qualifications not in the shared screenshots
  'Bachelor of Design (BDes)',
  'CFA',
  'CMA India Pursuing - Intermediate',
  'CMA US Pursuing - Part 2',
  'CPA',
  'Diploma',
  'EA Pursuing - Part 2',
  'EA Pursuing - Part 3',
  'Master of Computer Applications (MCA)',
  'Master of Design (MDes)',
  'Master of Science (MSc)',
  'Other',
].sort((a, b) => (a === 'Other' ? 1 : b === 'Other' ? -1 : a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' })));
// TODO: replace with the web app's master lists
const SUBJECT_OPTIONS = [
  'Accounting',
  'Bachelor of Commerce',
  'Computer Engineering',
  'Finance',
  'Information Technology',
  'Interaction Design',
  'Taxation',
  'Visual Communication',
  'Other',
];
const COUNTRY_OPTIONS = ['India', 'United States', 'Canada', 'United Kingdom', 'Other'];
const COMPANY_TYPE_OPTIONS = ['CPA Firm', 'Accounting / KPO', 'IT / Software', 'Other'];
const DESIGNATION_OPTIONS = ['Designer', 'Senior Designer', 'Lead Designer', 'Developer', 'Accountant', 'Senior Accountant', 'Others'];

// Skill Set master lists (from the web app)
const DOMAIN_OPTIONS = [
  'Accounting & Advisory',
  'Admin',
  'Audit',
  'Customer Service',
  'Human Resources',
  'Non Technical',
  'Recruitment',
  'Sales',
  'Specialized',
  'Tax',
  'Technology',
];
// TODO: confirm the full lists with the web app (only part of each was visible)
const INDUSTRY_OPTIONS = [
  'Cannabis',
  'Construction',
  'Creative Agencies',
  'Dental Practices',
  'E-Commerce',
  'Law Firms',
  'Medical Practitioners',
  'Not for Profits',
  'Real Estate',
  'Restaurant',
];
const SOFTWARE_OPTIONS = [
  { name: 'Quickbooks', category: 'Accounting' },
  { name: 'Quickbooks Online', category: 'Accounting' },
  { name: 'Xero', category: 'Accounting' },
  { name: 'bill.com', category: 'Accounting' },
  { name: 'AuditFile', category: 'Audit' },
  { name: 'ActiveData', category: 'Audit' },
  { name: 'SOX Hub', category: 'Audit' },
  { name: 'Drake', category: 'Tax' },
  { name: 'CCH Axcess', category: 'Tax' },
];
const TECHNICAL_SKILL_OPTIONS = [
  { name: 'Accounting & Bookkeeping' },
  { name: '1040 Preparation' },
  { name: 'US Payroll' },
  { name: 'Month End Closing' },
  { name: 'S Corp/1120S' },
  { name: 'Financial statement prep' },
  { name: 'Financial statement review' },
  { name: 'W-2 Payroll' },
  { name: 'Financial reporting and presentation' },
];

/** Hourly interview slots, 1 PM – 11 PM IST */
const INTERVIEW_SLOTS = Array.from({ length: 10 }, (_, i) => `${13 + i}:00-${14 + i}:00`);

/* ---------------------------------- Schema ---------------------------------- */

const usingGuardian = (v: ProfileValues) => v.guardianInstead === 'Yes';
const usingParents = (v: ProfileValues) => v.guardianInstead !== 'Yes';

export const PROFILE_TABS: ProfileTab[] = [
  {
    id: 'personal',
    label: 'Personal Details',
    sections: [
      {
        title: 'My Information',
        fields: [
          { key: 'employeeId', label: 'Employee ID', type: 'text', locked: true },
          { key: 'fullName', label: 'Full Name', type: 'text', locked: true },
          { key: 'officialEmail', label: 'Official Email', type: 'email', locked: true, full: true },
          { key: 'personalEmail', label: 'Personal Email', type: 'email', required: true, full: true },
          { key: 'dob', label: 'Date of Birth', type: 'date', locked: true },
          { key: 'mobile', label: 'Mobile', type: 'tel', required: true },
          { key: 'location', label: 'Location', type: 'text', locked: true, full: true },
        ],
      },
      {
        title: 'Family Details',
        fields: [
          {
            key: 'guardianInstead',
            label: 'Would you like to provide Guardian details instead of parent details?',
            type: 'radio',
            options: YES_NO,
            full: true,
          },
          { key: 'fatherName', label: 'Full Name', type: 'text', required: true, full: true, group: 'Father', showIf: usingParents },
          { key: 'fatherDob', label: 'Date of Birth', type: 'date', required: true, group: 'Father', showIf: usingParents },
          { key: 'fatherPhone', label: 'Phone', type: 'tel', required: true, group: 'Father', showIf: usingParents },
          {
            key: 'fatherInsurance',
            label: 'Insurance',
            checkboxText: 'Opt-in for Insurance',
            type: 'checkbox',
            full: true,
            group: 'Father',
            showIf: usingParents,
          },
          { key: 'motherName', label: 'Full Name', type: 'text', full: true, group: 'Mother', showIf: usingParents },
          { key: 'motherDob', label: 'Date of Birth', type: 'date', group: 'Mother', showIf: usingParents },
          { key: 'motherPhone', label: 'Phone', type: 'tel', group: 'Mother', showIf: usingParents },
          {
            key: 'motherInsurance',
            label: 'Insurance',
            checkboxText: 'Opt-in for Insurance',
            type: 'checkbox',
            full: true,
            group: 'Mother',
            showIf: usingParents,
          },
          { key: 'guardianName', label: 'Full Name', type: 'text', required: true, full: true, group: 'Guardian', showIf: usingGuardian },
          { key: 'guardianRelation', label: 'Relation', type: 'text', required: true, group: 'Guardian', showIf: usingGuardian },
          { key: 'guardianPhone', label: 'Phone', type: 'tel', required: true, group: 'Guardian', showIf: usingGuardian },
          { key: 'maritalStatus', label: 'Marital Status', type: 'select', required: true, options: ['Single', 'Married', 'Divorced', 'Widowed'] },
          { key: 'children', label: 'Number of Children', type: 'number', showIf: (v) => v.maritalStatus !== 'Single' },
        ],
      },
      {
        title: 'Family Members',
        list: {
          key: 'familyMembers',
          itemLabel: 'Member',
          addLabel: 'Add Member',
          emptyText: 'No family members added',
          fields: [
            { key: 'name', label: 'Name', type: 'text', required: true, full: true, placeholder: 'Enter full name' },
            { key: 'relation', label: 'Relation', type: 'select', required: true, options: FAMILY_RELATIONS },
            { key: 'dob', label: 'Date of Birth', type: 'date', required: true },
            { key: 'gender', label: 'Gender', type: 'select', required: true, options: ['Male', 'Female', 'Other'] },
            { key: 'phone', label: 'Phone Number', type: 'tel', required: true, placeholder: 'Enter here' },
            { key: 'dependent', label: 'Dependent', type: 'toggle', required: true, options: YES_NO },
          ],
        },
      },
    ],
  },
  {
    id: 'professional',
    label: 'Professional Details',
    sections: [
      {
        title: 'Organization Details',
        fields: [
          { key: 'designation', label: 'Role / Designation', type: 'text', locked: true },
          { key: 'department', label: 'Department', type: 'text', locked: true },
          { key: 'reportingManager', label: 'Reporting Manager', type: 'text', locked: true },
          { key: 'employmentType', label: 'Employment Type', type: 'text', locked: true },
          { key: 'joiningDate', label: 'Date of Joining', type: 'date', locked: true },
          {
            key: 'mycpeExperience',
            label: 'Years at MYCPE',
            type: 'auto',
            compute: (v) => tenureFrom(v.joiningDate as string),
          },
        ],
      },
      {
        title: 'Academic Qualification',
        list: {
          key: 'qualifications',
          itemLabel: 'Qualification',
          addLabel: 'Add Qualification',
          emptyText: 'No qualifications added',
          fields: [
            { key: 'education', label: 'Education', type: 'select', required: true, full: true, options: EDUCATION_OPTIONS },
            { key: 'subject', label: 'Subject / Specialization', type: 'select', required: true, full: true, options: SUBJECT_OPTIONS },
            { key: 'school', label: 'School / College Name', type: 'text', full: true },
            { key: 'board', label: 'University Board', type: 'text' },
            { key: 'country', label: 'Country', type: 'select', options: COUNTRY_OPTIONS },
            { key: 'state', label: 'State', type: 'text' },
            { key: 'city', label: 'City', type: 'text' },
            { key: 'year', label: 'Year of Completion', type: 'year' },
            { key: 'certificate', label: 'Education Certificate', type: 'file', full: true },
          ],
        },
      },
      {
        title: 'PTIN Details',
        fields: [
          { key: 'ptinStatus', label: 'PTIN Status', type: 'text', locked: true },
          { key: 'ptinNumber', label: 'PTIN Number', type: 'text', locked: true, hint: 'Preparer Tax Identification Number (IRS)' },
        ],
      },
      {
        title: 'Professional Qualification (EA / CPA / CMA)',
        fields: [
          { key: 'pursuingEA', label: 'Pursuing EA', type: 'toggle', locked: true, options: YES_NO },
          { key: 'pursuingCPA', label: 'Pursuing CPA', type: 'toggle', locked: true, options: YES_NO },
          { key: 'pursuingCMA', label: 'Pursuing CMA', type: 'toggle', locked: true, options: YES_NO },
        ],
      },
      {
        title: 'Experience',
        list: {
          key: 'experiences',
          itemLabel: 'Experience',
          addLabel: 'Add Experience',
          emptyText: 'No previous experience added',
          summary: (items) => {
            const sum = (pick: (v: ProfileValues) => boolean) =>
              formatMonths(items.filter(pick).reduce((n, v) => n + experienceMonths(v), 0));
            const known = ['India', 'United States', 'Canada'];
            return [
              { label: 'Total Experience', value: sum(() => true), highlight: true },
              { label: 'India', value: sum((v) => v.country === 'India') },
              { label: 'US', value: sum((v) => v.country === 'United States') },
              { label: 'Canada', value: sum((v) => v.country === 'Canada') },
              { label: 'Other Country', value: sum((v) => !known.includes(v.country as string)) },
            ];
          },
          fields: [
            { key: 'companyType', label: 'Type of Company', type: 'select', required: true, options: COMPANY_TYPE_OPTIONS },
            { key: 'country', label: 'Country', type: 'select', options: COUNTRY_OPTIONS },
            { key: 'otherCompanyType', label: 'Other Company Type', type: 'text', full: true, showIf: (v) => v.companyType === 'Other' },
            { key: 'company', label: 'Name of the Company', type: 'text', required: true, full: true },
            { key: 'designation', label: 'Designation', type: 'select', required: true, options: DESIGNATION_OPTIONS },
            { key: 'currentOrg', label: 'Current Organization', type: 'toggle', options: YES_NO },
            { key: 'otherDesignation', label: 'Other Designation', type: 'text', full: true, showIf: (v) => v.designation === 'Others' },
            { key: 'joiningDate', label: 'Joining Date', type: 'date', required: true },
            {
              key: 'lastWorkingDate',
              label: 'Last Working Date',
              type: 'date',
              required: true,
              minFrom: { key: 'joiningDate', label: 'Joining Date' },
              showIf: (v) => v.currentOrg !== 'Yes',
            },
            { key: 'experience', label: 'Experience', type: 'auto', compute: (v) => formatMonths(experienceMonths(v)) },
            { key: 'workType', label: 'Type of Work Done', type: 'text', full: true },
            { key: 'responsibilities', label: 'Roles and Responsibility', type: 'textarea', full: true },
            { key: 'letter', label: 'Experience Letter', type: 'file', full: true },
          ],
        },
      },
    ],
  },
  {
    id: 'skills',
    label: 'Skill Set',
    sections: [
      {
        title: 'Domain Expertise',
        fields: [
          { key: 'primaryDomain', label: 'Primary Domain', type: 'select', required: true, options: DOMAIN_OPTIONS },
          {
            key: 'secondaryDomain',
            label: 'Secondary Domain',
            type: 'select',
            required: true,
            options: DOMAIN_OPTIONS,
            notEqual: { key: 'primaryDomain', label: 'Primary Domain' },
          },
          { key: 'industries', label: 'Industry Served', type: 'multiselect', full: true, options: INDUSTRY_OPTIONS, placeholder: 'Select industries' },
        ],
      },
      {
        title: 'Software Skills',
        skills: { key: 'software', noun: 'software', addLabel: 'Add Software', emptyText: 'No software added', options: SOFTWARE_OPTIONS },
      },
      {
        title: 'Technical Skills',
        skills: {
          key: 'technicalSkills',
          noun: 'skill',
          addLabel: 'Add Skills',
          emptyText: 'No technical skills added',
          options: TECHNICAL_SKILL_OPTIONS,
        },
      },
      {
        title: 'Capacity & Availability',
        fields: [
          { key: 'additionalProfileHandling', label: 'Additional Profile Handling', type: 'text', locked: true },
          { key: 'timesheetLevel', label: 'Timesheet Level Handled', type: 'text', locked: true, hint: 'Up to which level a timesheet can be handled' },
          { key: 'additionalResponsibility', label: 'Additional Responsibility', type: 'text', locked: true, full: true },
        ],
      },
      {
        title: 'Quality, Risk & Performance Signals',
        badge: 'Auto',
        note: 'Escalations, Appreciations, Replacements and Terminations are computed from operational data.',
        fields: [
          { key: 'mentorJuniors', label: 'Suitable to Mentor Juniors', type: 'text', locked: true, full: true },
          { key: 'escalations', label: 'No. of Escalations', type: 'auto', compute: (v) => String(v.escalations ?? 0) },
          { key: 'appreciations', label: 'No. of Appreciations', type: 'auto', compute: (v) => String(v.appreciations ?? 0) },
          { key: 'replacements', label: 'Replacements', type: 'auto', compute: (v) => String(v.replacements ?? 0) },
          { key: 'terminations', label: 'Timesheet Terminations', type: 'auto', compute: (v) => String(v.terminations ?? 0) },
        ],
      },
    ],
  },
  { id: 'learning', label: 'Learning & Growth', sections: [] },
  {
    id: 'clients',
    label: 'Client Exposure',
    sections: [
      {
        title: 'Client Exposure & Communication Readiness',
        description: 'Set by your manager or taken from system records, so they can’t be edited here.',
        fields: [
          { key: 'clientTypes', label: 'Type of Clients Worked With', type: 'text', locked: true },
          { key: 'workedAs', label: 'Worked As', type: 'text', locked: true },
          { key: 'communicationSkills', label: 'Communication Skills', type: 'text', locked: true },
          { key: 'eligibleAssociate', label: 'Eligible for Associate', type: 'text', locked: true },
          { key: 'eligibleFace', label: 'Eligible for Face', type: 'text', locked: true },
          {
            key: 'clientInterviewRejections',
            label: 'Rejections in Client Interview',
            type: 'auto',
            compute: (v) => String(v.clientInterviewRejections ?? 0),
          },
          { key: 'managingEndClients', label: 'Managing End Clients', type: 'text', locked: true },
          { key: 'endClientInteractionQuality', label: 'End Client Interaction Quality', type: 'text', locked: true },
          { key: 'endClientInteraction', label: 'End Client Interaction', type: 'text', locked: true },
          { key: 'smootherOnboarding', label: 'Helped Smoother Onboarding', type: 'text', locked: true },
        ],
      },
    ],
  },
  {
    id: 'availability',
    label: 'Availability & Work Preferences',
    sections: [
      {
        title: 'Interview Availability',
        fields: [
          {
            key: 'interviewDays',
            label: 'Days',
            type: 'days',
            full: true,
            options: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
            emptyText: 'No interview days selected',
          },
          {
            key: 'interviewSlots',
            label: 'Time Slots (IST)',
            type: 'slots',
            full: true,
            options: INTERVIEW_SLOTS,
            emptyText: 'No time slots selected',
          },
        ],
      },
      {
        title: 'Current Shift & Work Mode',
        fields: [
          { key: 'currentWorkMode', label: 'Current Work Mode', type: 'text', locked: true },
          { key: 'shiftTiming', label: 'Shift Timing', type: 'text', locked: true },
          { key: 'availableUptoRoy', label: 'Available Up To (ROY)', type: 'time', required: true },
          { key: 'availableUptoSeasonal', label: 'Available Up To (Seasonal)', type: 'time', required: true },
        ],
      },
      {
        title: 'Work Flexibility Preferences',
        fields: [
          {
            key: 'prefHybrid',
            label: 'Hybrid Working',
            type: 'toggle',
            options: YES_NO,
            question: 'Do you prefer a hybrid working arrangement — splitting your time between the office and home?',
            followUp: {
              key: 'prefHybridApplies',
              label: 'When does this apply?',
              options: [
                { value: 'Permanent', hint: 'Year-round, regardless of season' },
                { value: 'Seasonal', hint: 'Peak / busy seasons only' },
                { value: 'Non-Seasonal', hint: 'Off-season periods only' },
                { value: 'Upon Request', hint: 'Approved per staff request, case-by-case' },
              ],
            },
          },
          {
            key: 'prefWfh',
            label: 'Work From Home',
            type: 'toggle',
            options: YES_NO,
            question: 'Do you prefer working from home, either fully or on certain days?',
          },
        ],
      },
      {
        title: 'Additional Flexibilities',
        description:
          'Extra preferences you can opt into. They apply whatever your main working mode is (office, hybrid or from home).',
        fields: [
          {
            key: 'prefEarlyShift',
            label: 'Early Shift Timing',
            type: 'toggle',
            options: YES_NO,
            question: 'During the off-season, would you prefer to come in early and leave early instead of following the standard shift timing?',
          },
          {
            key: 'prefLateAvailability',
            label: 'Late Availability',
            type: 'toggle',
            options: YES_NO,
            question:
              'If a client call, team meeting or other business need comes up outside office hours, are you comfortable joining remotely from home using your assigned laptop?',
            followUp: {
              key: 'prefLateApplies',
              label: 'When does this apply?',
              options: [
                { value: 'All Year, regardless of season', hint: 'Available any time it is needed' },
                { value: 'Peak / Busy Seasons Only', hint: 'Tax season, audit season or other peak periods' },
              ],
            },
          },
          {
            key: 'prefEarlyFridays',
            label: 'Early Fridays',
            type: 'toggle',
            options: YES_NO,
            question: 'During the off-season, would you prefer to come in early and leave early on Fridays, giving you more time with your family in the evening?',
          },
        ],
      },
      {
        title: 'Overtime Availability',
        fields: [
          { key: 'otHours', label: 'Hours', type: 'text', locked: true },
          { key: 'otClientType', label: 'Preferred Client Type', type: 'text', locked: true },
          { key: 'otAvailabilityType', label: 'Type of Availability', type: 'text', locked: true, full: true },
          { key: 'otEaSupport', label: 'EA Support Needed', type: 'text', locked: true },
        ],
      },
    ],
  },
  { id: 'video', label: 'Profile Introduction Video', sections: [] },
];

/** Short tab labels for the mobile tab strip */
export const PROFILE_TAB_SHORT: Record<ProfileTabId, string> = {
  personal: 'Personal',
  professional: 'Professional',
  skills: 'Skill Set',
  learning: 'Learning',
  clients: 'Clients',
  availability: 'Availability',
  video: 'Intro Video',
};

/* ----------------------------------- Seed ----------------------------------- */

export const MY_PROFILE_SEED: MyProfileData = {
  values: {
    // Organization (from HR records)
    designation: 'Lead Designer',
    department: 'Product Design',
    reportingManager: 'Naveen Das',
    employmentType: 'Full Time',
    joiningDate: '2024-12-02',
    // Skill Set
    primaryDomain: 'Technology',
    secondaryDomain: 'Accounting & Advisory',
    industries: ['E-Commerce', 'Dental Practices'],
    additionalProfileHandling: 'No',
    timesheetLevel: '',
    additionalResponsibility: '',
    mentorJuniors: 'Yes',
    escalations: '0',
    appreciations: '3',
    replacements: '0',
    terminations: '0',

    // Availability & Work Preferences
    interviewDays: ['Tue', 'Thu'],
    interviewSlots: ['14:00-15:00', '15:00-16:00', '16:00-17:00', '19:00-20:00'],
    currentWorkMode: 'Hybrid',
    shiftTiming: '12:00 - 21:00',
    availableUptoRoy: '21:00',
    availableUptoSeasonal: '22:30',
    prefHybrid: 'Yes',
    prefHybridApplies: 'Permanent',
    prefWfh: 'No',
    prefEarlyShift: '',
    prefLateAvailability: 'Yes',
    prefLateApplies: 'Peak / Busy Seasons Only',
    prefEarlyFridays: 'Yes',
    otHours: '',
    otClientType: '',
    otAvailabilityType: '',
    otEaSupport: '',

    // Client Exposure (manager / system managed)
    clientTypes: '',
    workedAs: '',
    communicationSkills: '',
    eligibleAssociate: '',
    eligibleFace: '',
    clientInterviewRejections: '0',
    managingEndClients: '',
    endClientInteractionQuality: '',
    endClientInteraction: '',
    smootherOnboarding: '',

    ptinStatus: '',
    ptinNumber: '',
    pursuingEA: 'No',
    pursuingCPA: 'No',
    pursuingCMA: 'No',

    // Personal Details
    employeeId: 'A03780',
    fullName: 'John Smith',
    officialEmail: 'john.smith@my-cpe.com',
    personalEmail: 'johnsmith.design@gmail.com',
    dob: '1995-03-14',
    mobile: '9876543210',
    location: 'Ahmedabad, India',
    guardianInstead: 'No',
    fatherName: 'Robert Smith',
    fatherDob: '1964-07-09',
    fatherPhone: '9824012345',
    fatherInsurance: true,
    motherName: 'Linda Smith',
    motherDob: '1968-11-21',
    motherPhone: '9824067890',
    motherInsurance: true,
    guardianName: '',
    guardianRelation: '',
    guardianPhone: '',
    maritalStatus: 'Single',
    children: '',
  },
  lists: {
    software: [
      { id: 'sw-1', name: 'Quickbooks Online', category: 'Accounting', level: 'Average' },
      { id: 'sw-2', name: 'bill.com', category: 'Accounting', level: 'Basic' },
    ],
    technicalSkills: [{ id: 'ts-1', name: 'Financial reporting and presentation', level: 'Intermediate' }],
    familyMembers: [
      { id: 'fm-1', name: 'Emma Smith', relation: 'Sister', dob: '1998-06-02', gender: 'Female', phone: '9824055512', dependent: 'No' },
    ],
    qualifications: [
      {
        id: 'q-1',
        education: 'Bachelor of Design (BDes)',
        subject: 'Interaction Design',
        school: 'Gujarat University',
        board: 'Gujarat University',
        country: 'India',
        state: 'Gujarat',
        city: 'Ahmedabad',
        year: '2017',
        certificate: 'BDes-degree-certificate.pdf',
      },
    ],
    experiences: [
      {
        id: 'ex-1',
        companyType: 'IT / Software',
        otherCompanyType: '',
        country: 'India',
        company: 'Infostretch Solutions',
        designation: 'Senior Designer',
        otherDesignation: '',
        currentOrg: 'No',
        joiningDate: '2021-04-05',
        lastWorkingDate: '2024-11-22',
        workType: 'Product & UX design',
        responsibilities: 'Owned design for client onboarding and billing flows; ran usability tests and maintained the design system.',
        letter: 'Infostretch-experience-letter.pdf',
      },
      {
        id: 'ex-2',
        companyType: 'Other',
        otherCompanyType: 'Design studio',
        country: 'India',
        company: 'Pixel Orbit Studio',
        designation: 'Designer',
        otherDesignation: '',
        currentOrg: 'No',
        joiningDate: '2017-07-03',
        lastWorkingDate: '2021-03-31',
        workType: 'Web & brand design',
        responsibilities: '',
        letter: 'PixelOrbit-relieving-letter.pdf',
      },
    ],
  },
};
