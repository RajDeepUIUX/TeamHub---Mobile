// Team Member Annual Review — the self-evaluation form opened from Staff Review › Start Evaluation

export const SKILL_LEVELS = ['Basic', 'Average', 'Intermediate', 'Advance', 'Expert'] as const;
export type SkillLevel = (typeof SKILL_LEVELS)[number];

export const QUALIFICATION_STATUSES = ['Enrolled', 'Pursuing', 'Completed'] as const;
export type QualificationStatus = (typeof QUALIFICATION_STATUSES)[number];

export interface SkillRow {
  id: string;
  /** Technical skill, software or domain; unused for communication */
  item: string;
  current: SkillLevel | '';
  future: SkillLevel | '';
  remarks: string;
}

export interface FutureQualification {
  name: string;
  status: QualificationStatus;
  partName: string;
  /** YYYY-MM-DD */
  targetDate: string;
  completionDate: string;
}

export interface AnnualReviewForm {
  technical: SkillRow[];
  software: SkillRow[];
  communication: SkillRow;
  domain: SkillRow[];
  futureQualifications: FutureQualification[];
  additional: AdditionalResponsibilities;
}

/* -------------------------- Additional Responsibilities ------------------------- */

export type ResponsibilityValue = string | string[];

export interface ResponsibilityField {
  key: string;
  label: string;
  kind: 'select' | 'multi' | 'date' | 'number';
  options?: string[];
}

export interface ResponsibilityConfig {
  id: string;
  title: string;
  /** Repeatable rows with "Add More" */
  rowFields?: ResponsibilityField[];
  /** One set of fields */
  fields?: ResponsibilityField[];
  /** Remarks is the only input, so it's required when the answer is Yes */
  remarksOnly?: boolean;
  /** ⓘ help text */
  info?: string;
  /** No Remarks box on this card */
  noRemarks?: boolean;
}

export interface ResponsibilityRow {
  id: string;
  values: Record<string, ResponsibilityValue>;
}

export interface ResponsibilityEntry {
  interested: boolean;
  rows: ResponsibilityRow[];
  values: Record<string, ResponsibilityValue>;
  remarks: string;
}

export interface AdditionalResponsibilities {
  /** Selected responsibility ids, in picker order */
  selected: string[];
  entries: Record<string, ResponsibilityEntry>;
}

export interface ReviewCycle {
  id: string;
  status: 'Open' | 'Submitted';
  /** YYYY-MM-DD */
  submittedOn?: string;
  form: AnnualReviewForm;
}

export const TECHNICAL_SKILLS = [
  'US Individual Tax - Basic',
  'US Individual Tax - Intermediate',
  'US Individual Tax - Advanced',
  'US Accounting - Basic',
  'US Accounting - Intermediate',
  'CA Business Tax - Basic',
  'CA Business Tax - Intermediate',
  'CA Accounting - Basic',
  'CA Audit - Basic',
  'UK Individual Tax - Basic',
  'UK Individual Tax - Intermediate',
  'UK Accounting - Basic',
  'UK Audit - Basic',
  'US Forensic Audit',
  'US Financial Analyst',
  'CA Business Valuation',
  'CA Forensic Audit',
  '1120 H Preparation',
  '1099 Reporting',
  '1040 Preparation',
  '1040 Review',
  '1065 Self-Review',
  'State Returns',
];

/** Software → category (category is filled in automatically once a software is picked) */
export const SOFTWARE: { name: string; category: string }[] = [
  { name: 'Orchestrated Spirit', category: 'Accounting Software' },
  { name: 'Track1099', category: 'Tax Software' },
  { name: 'Icon', category: 'Accounting Software' },
  { name: 'Acumatica Accounting', category: 'Accounting Software' },
  { name: 'Builder Trend', category: 'Construction Management' },
  { name: 'Wagepoint', category: 'Payroll Software' },
  { name: 'Xero', category: 'Accounting Software' },
  { name: 'Saasant', category: 'Data Automation' },
  { name: 'Microsoft Office Suite', category: 'Productivity' },
  { name: 'Microsoft Dynamic', category: 'Accounting Software' },
  { name: 'Quicken', category: 'Accounting Software' },
  { name: 'AccountEdge', category: 'Accounting Software' },
  { name: 'Restaurant365', category: 'Accounting Software' },
  { name: 'Distillx5', category: 'Inventory Management' },
  { name: 'Lightspeed', category: 'Point of Sale' },
  { name: 'Syft', category: 'Reporting & Analytics' },
  { name: 'Unanet', category: 'Project Accounting' },
  { name: 'Reach Reporting', category: 'Reporting & Analytics' },
  { name: 'Freshbooks', category: 'Accounting Software' },
  { name: 'Stripe', category: 'Payments' },
];

export const softwareCategory = (name: string) => SOFTWARE.find((s) => s.name === name)?.category ?? '';

export const DOMAINS = [
  'Accounting & Advisory (United States)',
  'Tax (United States)',
  'Audit (United States)',
  'Accounting & Advisory (Canada)',
  'Tax (Canada)',
  'Audit (Canada)',
  'Accounting & Advisory (United Kingdom)',
  'Tax (United Kingdom)',
  'Audit (United Kingdom)',
  'Non Technical (Canada)',
  'Non Technical (United States)',
  'Non Technical (United Kingdom)',
];

export const QUALIFICATIONS = ['Certified Public Accountant (CPA)', 'CMA India', 'CMA US', 'Enrolled Agent (EA)'];

/** Read from the staff profile; not editable in the review */
export const CURRENT_QUALIFICATIONS = ['EA Pursuing'];

let rowSeq = 0;
export const newSkillRow = (partial: Partial<SkillRow> = {}): SkillRow => ({
  id: `row-${++rowSeq}`,
  item: '',
  current: '',
  future: '',
  remarks: '',
  ...partial,
});

let respRowSeq = 0;
export const newResponsibilityRow = (values: Record<string, ResponsibilityValue> = {}): ResponsibilityRow => ({
  id: `resp-row-${++respRowSeq}`,
  values,
});

export const newResponsibilityEntry = (config: ResponsibilityConfig): ResponsibilityEntry => ({
  interested: true,
  rows: config.rowFields ? [newResponsibilityRow()] : [],
  values: {},
  remarks: '',
});

export const emptyAdditional = (): AdditionalResponsibilities => ({ selected: [], entries: {} });

export const emptyReviewForm = (): AnnualReviewForm => ({
  technical: [newSkillRow()],
  software: [newSkillRow()],
  communication: newSkillRow(),
  domain: [newSkillRow()],
  futureQualifications: [],
  additional: emptyAdditional(),
});

/** Review cycles, oldest first. Past cycles are submitted and view-only. */
export const REVIEW_CYCLES_SEED: ReviewCycle[] = [
  {
    id: 'April-2024',
    status: 'Submitted',
    submittedOn: '2024-04-18',
    form: {
      additional: emptyAdditional(),
      technical: [newSkillRow({ item: '1040 Preparation', current: 'Basic', future: 'Average', remarks: 'Started on individual returns this season.' })],
      software: [newSkillRow({ item: 'Microsoft Office Suite', current: 'Average', future: 'Intermediate', remarks: '' })],
      communication: newSkillRow({ current: 'Basic', future: 'Average', remarks: 'Working on client emails.' }),
      domain: [newSkillRow({ item: 'Tax (United States)', current: 'Basic', future: 'Average', remarks: '' })],
      futureQualifications: [],
    },
  },
  {
    id: 'October-2024',
    status: 'Submitted',
    submittedOn: '2024-10-21',
    form: {
      additional: emptyAdditional(),
      technical: [
        newSkillRow({ item: '1040 Preparation', current: 'Average', future: 'Intermediate', remarks: '' }),
        newSkillRow({ item: 'State Returns', current: 'Basic', future: 'Average', remarks: 'Handled NY and NJ returns.' }),
      ],
      software: [newSkillRow({ item: 'Xero', current: 'Basic', future: 'Average', remarks: '' })],
      communication: newSkillRow({ current: 'Average', future: 'Intermediate', remarks: '' }),
      domain: [newSkillRow({ item: 'Tax (United States)', current: 'Average', future: 'Intermediate', remarks: '' })],
      futureQualifications: [
        { name: 'Enrolled Agent (EA)', status: 'Enrolled', partName: 'Part 1', targetDate: '2025-06-30', completionDate: '' },
      ],
    },
  },
  {
    id: 'April-2025',
    status: 'Submitted',
    submittedOn: '2025-04-15',
    form: {
      additional: emptyAdditional(),
      technical: [
        newSkillRow({ item: '1040 Preparation', current: 'Intermediate', future: 'Advance', remarks: 'Reviewing simple returns for juniors.' }),
        newSkillRow({ item: 'State Returns', current: 'Average', future: 'Intermediate', remarks: '' }),
      ],
      software: [
        newSkillRow({ item: 'Xero', current: 'Average', future: 'Intermediate', remarks: '' }),
        newSkillRow({ item: 'Microsoft Dynamic', current: 'Basic', future: 'Average', remarks: 'New client onboarding.' }),
      ],
      communication: newSkillRow({ current: 'Intermediate', future: 'Advance', remarks: 'Leading weekly client calls.' }),
      domain: [newSkillRow({ item: 'Tax (United States)', current: 'Intermediate', future: 'Advance', remarks: '' })],
      futureQualifications: [
        { name: 'Enrolled Agent (EA)', status: 'Pursuing', partName: 'Part 2', targetDate: '2025-12-31', completionDate: '' },
      ],
    },
  },
  {
    id: 'October-2025',
    status: 'Submitted',
    submittedOn: '2025-10-17',
    form: {
      additional: emptyAdditional(),
      technical: [
        newSkillRow({ item: '1040 Review', current: 'Average', future: 'Intermediate', remarks: '' }),
        newSkillRow({ item: 'US Accounting - Basic', current: 'Average', future: 'Intermediate', remarks: '' }),
      ],
      software: [newSkillRow({ item: 'Microsoft Dynamic', current: 'Average', future: 'Intermediate', remarks: '' })],
      communication: newSkillRow({ current: 'Intermediate', future: 'Advance', remarks: '' }),
      domain: [
        newSkillRow({ item: 'Tax (United States)', current: 'Intermediate', future: 'Advance', remarks: '' }),
        newSkillRow({ item: 'Accounting & Advisory (United States)', current: 'Basic', future: 'Average', remarks: '' }),
      ],
      futureQualifications: [
        { name: 'Enrolled Agent (EA)', status: 'Pursuing', partName: 'Part 3', targetDate: '2026-06-30', completionDate: '' },
      ],
    },
  },
  { id: 'April-2026', status: 'Open', form: emptyReviewForm() },
];

/* -------------------------------- Instructions ------------------------------- */

export const REVIEW_INSTRUCTIONS_INTRO =
  "The annual self-review serves as a valuable opportunity for individuals to reflect on their performance and provide an honest assessment from their own perspective. It's intended to offer insight into one's strengths, areas for improvement, and overall contributions to the organization. In this process, it's imperative that the information provided is truthful and authentic. Exaggerating achievements or fabricating details undermines the integrity of the review and can lead to inaccurate evaluations. Moreover, it hampers the individual's ability to identify genuine areas for growth and development. Submitting exaggerated or false information not only misrepresents the individual's performance but also disrupts the trust and transparency essential within the organization. It can erode credibility and damage professional relationships. Ultimately, the purpose of the self-review is to foster, facilitate constructive dialogue, and support personal and professional growth. By providing genuine and accurate feedback, individuals can better align their goals and aspirations with organizational objectives, contributing to their own advancement and the overall success of the company.";

export const REVIEW_INSTRUCTION_SECTIONS: { title: string; body: string }[] = [
  {
    title: 'Current SkillSet & Work Areas',
    body: 'You need rate yourself as basic, Intermediate, Advance, Expert on the Technical skill, Software expertise, Communication Skills and others. You can put in your remarks if you want to highlight something. You can also add your skill set, and if you find anything missing on skillset, you can directly share that with Gary (gary@my-cpe.com) and he will get that added. You can also update your qualifications.',
  },
  {
    title: 'Future Skillset & Work Areas (in next 12 months)',
    body: 'This is the section via which you can plan your goals for the next year. You can choose what all skill sets you would like to upgrade/acquire. You can put your remarks on how organisation can help you with your goals.',
  },
  {
    title: 'Work Flexibility',
    body: 'Work flexibility module would allow you enter updated hours for your availability and OT during Tax season / Round the Year and your availability to provide overlap to the clients.',
  },
  {
    title: 'Additional Responsibilities',
    body: 'There are plethora of opportunities available within the organisation. The additional responsibilities tab summarises them and within this you can select the additional opportunities you would like to take during this year. It includes branch development, technical manager role, reviewer, team lead, Additional timesheet etc. (You can further inquire the same with your respective Manager and OTC Manager for the same). But this will help us understand how you would like to contribute over and above your timesheet responsibilities that are given to clients.',
  },
  { title: 'Client', body: 'Under client tab more information about you client needs to be shared.' },
  {
    title: 'Others',
    body: 'You can enter your suggestions / remarks for the organisations and anything else you would like to highlight.',
  },
];

export const REVIEW_INSTRUCTIONS_CLOSING =
  'Overall, the staff annual self review form serves as a tool for performance management, employee development, and alignment of individual goals with organizational objectives.';

export const REVIEW_IMPORTANT_NOTES = [
  'The last date to fill in the form by the employees is April 17th.',
  'Please ensure you save the data, before you close the window. The data is not being saved automatically.',
];

const EXPERTISE_LEVELS: Record<SkillLevel, string> = {
  Basic: 'Basic understanding of Data Inputs.',
  Average: 'Can self review the work done and create a set of queries/open items/checklist and prepare reports for client to review.',
  Intermediate: 'Can Do Fairly Complex Work, Prepare & Review Report and also Train New Associate if required',
  Advance:
    'Capable of reviewing the work completed by team members, providing them with training and guidance as needed. Additionally, can effectively handle interactions with end clients and independently manage up to 90% of a project end to end. (Usually a CPA, CMA, EA, or CFA)',
  Expert: 'Capable of managing end-to-end engagement effectively and provide advisory services to end clients of the firm throughout the engagement.',
};

/** "How does Rating Parameters work?" */
export const RATING_PARAMETERS: { title: string; levels: Record<SkillLevel, string> }[] = [
  { title: 'Technical Skills', levels: EXPERTISE_LEVELS },
  {
    title: 'Communication Skills',
    levels: {
      Basic: 'Can Not Communicate with Client over Email/Chat',
      Average: 'Can Communicate with Client over Email/Chat and also over Calls',
      Intermediate: 'Can Communicate with Firm and Also End Clients of Firm over Email/Chat/Calls',
      Advance: 'Can communicate & Guide End Client of the Firm Easily and Participate in End Client Zoom Meetings with Firm members',
      Expert: 'Can Conduct Meeting & Advice End Client of the Firm Independently without help of firm employees.',
    },
  },
  { title: 'Domain Understanding', levels: EXPERTISE_LEVELS },
];

/* ------------------- Additional Responsibilities — options ------------------- */
const RESP_ASSOCIATES = ['With Associate', 'Without Associate'];
const RESP_ADDITIONAL_HOURS = ['40 hours/week'];
const RESP_EXPANSION_HOURS = ['40 hours/week', '30 hours/week', '20 hours/week', '10 hours/week'];
const RESP_COMPLEXITY = [
  'Low Complexity',
  'Low to Moderate Complexity',
  'Moderate Complexity',
  'Moderate to High Complexity',
  'High Complexity',
];
const RESP_EXPANSION_TYPES = ['Temporary', 'Permanent'];
const RESP_VIA = ['Branch(Remotely)', 'In-office', 'Both'];
// Placeholders until the staff member's real clients and timesheets are wired in
const RESP_CLIENTS = ['Brightline CPA Group', 'Harbor & Pine Accounting', 'Northgate Tax Advisors', 'Summit Ledger LLP'];
const RESP_TIMESHEETS = ['Bookkeeping', 'Payroll', 'Tax Preparation', 'Audit Support', 'Advisory'];

export const RESPONSIBILITIES: ResponsibilityConfig[] = [
  {
    id: 'additional-timesheet',
    title: 'Interested in Taking Additional Timesheet',
    noRemarks: true,
    info: 'Indicates your willingness to take on extra timesheets beyond your current responsibilities, possibly with or without associate.',
    rowFields: [
      { key: 'domain', label: 'Domain', kind: 'select', options: DOMAINS },
      { key: 'associate', label: 'Associate', kind: 'select', options: RESP_ASSOCIATES },
      { key: 'hours', label: 'No. of Hours', kind: 'select', options: RESP_ADDITIONAL_HOURS },
      { key: 'complexity', label: 'Timesheet Complexity', kind: 'multi', options: RESP_COMPLEXITY },
      { key: 'date', label: 'Targeted Date', kind: 'date' },
    ],
  },
  {
    id: 'expansion',
    title: 'Expansion In Existing Client',
    info: 'Shows your readiness to contribute to expanding business opportunities with current clients.',
    rowFields: [
      { key: 'client', label: 'Client', kind: 'select', options: RESP_CLIENTS },
      { key: 'timesheets', label: 'Timesheet', kind: 'multi', options: RESP_TIMESHEETS },
      { key: 'type', label: 'Expansion Type', kind: 'select', options: RESP_EXPANSION_TYPES },
      { key: 'hours', label: 'No. of Hours', kind: 'select', options: RESP_EXPANSION_HOURS },
      { key: 'date', label: 'Expected Date', kind: 'date' },
    ],
  },
  {
    id: 'transfer-timesheet',
    title: 'Transfering your existing timesheet to an EA in the branch and managing it Remotely',
    remarksOnly: true,
    info: 'Involves delegating your existing timesheet responsibilities to an associate located in a branch office, while overseeing and managing the process remotely.',
  },
  {
    id: 'sme',
    title: 'Be a Subject Matter expert(SME) In a Existing Client & Expand',
    remarksOnly: true,
    info: 'Indicates your willingness to take on a technical management role with existing clients, with a focus on both maintaining current projects and exploring new opportunities for expansion.',
  },
  {
    id: 'training',
    title: 'Training New Team Member / Helping Team Member in Onboarding Timesheet / Be a Reviewer in Timesheet',
    info: 'Involves assisting new team members with the process of familiarizing themselves with timesheet procedures',
    fields: [
      { key: 'via', label: 'Via', kind: 'select', options: RESP_VIA },
      { key: 'complexity', label: 'Timesheet Complexity', kind: 'multi', options: RESP_COMPLEXITY },
      { key: 'count', label: 'No of Timesheet/Team Member', kind: 'number' },
    ],
  },
  {
    id: 'team-lead',
    title: 'Become Team Lead Expand & Manage Team',
    info: 'Signals your interest in assuming a leadership role within the team, overseeing its growth and managing team members.',
    fields: [
      { key: 'via', label: 'Via', kind: 'select', options: RESP_VIA },
      { key: 'complexity', label: 'Timesheet Complexity', kind: 'multi', options: RESP_COMPLEXITY },
      { key: 'count', label: 'No of Timesheet/Team Member', kind: 'number' },
    ],
  },
  { id: 'ptc-training', title: 'Building PTC Training Material', remarksOnly: true },
  {
    id: 'further',
    title: 'Any Further Responsibilities you would like to take?',
    remarksOnly: true,
    info: 'Invites you to express any additional responsibilities or roles you are interested in taking on, indicating your willingness to contribute further to the team or company.',
  },
];

export const responsibilityById = (id: string) => RESPONSIBILITIES.find((r) => r.id === id);

// A past cycle with responsibilities filled in, so the view-only mode has something to show
REVIEW_CYCLES_SEED.find((c) => c.id === 'April-2025')!.form.additional = {
  selected: ['training', 'ptc-training'],
  entries: {
    training: {
      interested: true,
      rows: [],
      values: { via: 'In-office', complexity: ['Low Complexity', 'Moderate Complexity'], count: '2' },
      remarks: 'Happy to review 1040s for the two new associates.',
    },
    'ptc-training': { interested: false, rows: [], values: {}, remarks: '' },
  },
};

/** ⓘ help for the Personal Skill sections, keyed by section title */
export const SKILL_SECTION_INFO: Record<string, string> = {
  'Technical Skills':
    'Evaluate your proficiency in technical areas relevant in your current role and those needed for future. (You might have basic understanding of 1120 H but in near future you would like to upgrade it to Intermediate or Advanced level so you have to map it accordingly)',
  'Software Expertise':
    'Measure your familiarity and proficiency with specific software applications or essential in your role and those required in near future. (You might have basic understanding of Quickbooks but in near future you would like to upgrade it to Intermediate or Advanced level so you have to map it accordingly)',
  // Same copy as Software Expertise on the web
  'Communication Skills':
    'Measure your familiarity and proficiency with specific software applications or essential in your role and those required in near future. (You might have basic understanding of Quickbooks but in near future you would like to upgrade it to Intermediate or Advanced level so you have to map it accordingly)',
  'Overall Domain Understanding':
    'Assess your understanding of the domain in which you work, including key concepts, trends, and challenges and to what level you would like to upgrade your domain understanding. You can select multiple domains here. (e.g- Your might have a basic understanding of Accounting Domain and you in future you would like to upgrade it with Intermediate or Advanced Level)',
  'Current Qualifications':
    'Review your currently mapped qualifications and add the qualification you are pursuing with targeted date of completion.',
  'Future Qualifications':
    'Review your currently mapped qualifications and add the qualification you are pursuing with targeted date of completion.',
};
