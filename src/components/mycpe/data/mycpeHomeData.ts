// MyCPE Home + Profile (Non Subscriber): text and courses exactly as in the mobile designs

export type CourseType = 'On-Demand' | 'Podcasts' | 'E-Books' | 'Upcoming Webinar';

export interface McCourse {
  id: string;
  type: CourseType;
  title: string;
  image: string;
  /** Not shown on Continue learning cards */
  credits?: string;
  rating?: string;
  /** Qualifications it's approved for; the rest are counted in "+N More" */
  approvedFor?: string[];
  approvedMore?: number;
  /** Continue learning: % done and the bar's colour */
  progress?: number;
  progressTone?: 'grey' | 'gold';
}

const img = (name: string) => `/mycpe/courses/${name}.jpg`;

export const CONTINUE_LEARNING: McCourse[] = [
  { id: 'power-bi', type: 'On-Demand', title: 'Power BI Dashboards: Building Interactive Data Visualizations', image: img('business-retirement'), progress: 5, progressTone: 'grey' },
  { id: 'tax-advisory-continue', type: 'Podcasts', title: 'Figuring Out: Transform Tax Advisory with AI', image: img('bridging-skill-gaps'), progress: 82, progressTone: 'gold' },
];

export const FREE_COURSES: McCourse[] = [
  { id: 'payroll-obbb', type: 'On-Demand', title: 'Payroll After the OBBB: Tax Withholding & Compliance...', image: img('payroll-obbb'), credits: '1', rating: '4.6' },
  { id: 'planning-bbb', type: 'On-Demand', title: 'Financial Planning After the BBB: Tax Law Changes Yo...', image: img('bbb-tax-update'), credits: '1', rating: '4.6' },
];

const WAGES_1040: McCourse = {
  id: 'wages-1040',
  type: 'Upcoming Webinar',
  title: 'Wages & Income (Non-Schedule C) in 1040',
  image: img('lacerte-1040'),
  credits: '2',
  rating: '4.8',
  approvedFor: ['CPE (US)', 'EA'],
};

export const PERSONALIZED_TOPICS = ['Business Management', 'Accounting', 'Text', 'Cyber Security'];
export const PERSONALIZED_COURSES: McCourse[] = [
  {
    id: 'qdros',
    type: 'On-Demand',
    title: 'Qualified Domestic Relations Order (QDROs) – What you...',
    image: img('qdros'),
    credits: '1.5',
    rating: '4.8',
    approvedFor: ['CPE (US)', 'EA'],
    approvedMore: 2,
  },
  WAGES_1040,
];

/** The section's own cards aren't readable in the designs; this is the one webinar that is */
export const UPCOMING_WEBINARS: McCourse[] = [WAGES_1040];

export const TRENDING_NOW: McCourse[] = [
  { id: 'tech-driven-growth', type: 'Podcasts', title: 'Figuring Out: Tech-Driven Growth in Accounting Firms', image: img('tech-driven-growth'), credits: '8', rating: '4.8' },
  { id: 'hr-next', type: 'E-Books', title: 'HR Next: Balancing Skill Disruption & Well-Being', image: img('balancing-skill'), credits: '8', rating: '4.8' },
];

export const NEWLY_ADDED: McCourse[] = [
  { id: 'storytelling', type: 'On-Demand', title: 'The Power of Storytelling for Project Professionals - Part 3', image: img('impact-of-tech'), credits: '8', rating: '4.8' },
  { id: 'tax-advisory', type: 'Podcasts', title: 'Figuring Out: Transform Tax Advisory with AI', image: img('transform-tax'), credits: '8', rating: '4.8' },
];

/** Signed-in person. A new account uses the name and email from Create account. */
export interface McAccount {
  firstName: string;
  lastName: string;
  email: string;
}
export const DEFAULT_ACCOUNT: McAccount = { firstName: 'Olivia', lastName: 'Joe', email: 'oliviajoe@gmail.com' };
export const MYCPE_AVATAR = '/mycpe/avatar.jpg';

/**
 * Where this person is on Home.
 * New account: "+ Add Compliance" and the personalization question. Returning: compliance % and the subscribe card.
 */
export interface McHomeState {
  personalization: 'ask' | 'on' | 'off';
  complianceAdded: boolean;
  hasStartedCourses: boolean;
  subscribeCardDismissed: boolean;
}
export const NEW_HOME: McHomeState = { personalization: 'ask', complianceAdded: false, hasStartedCourses: false, subscribeCardDismissed: false };
export const RETURNING_HOME: McHomeState = { personalization: 'on', complianceAdded: true, hasStartedCourses: true, subscribeCardDismissed: false };

export const COMPLIANCE_PERCENT = 27;

/** Profile: licences with no details yet */
export const LICENSE_STATES = [
  { qualification: 'CPA (US)', state: 'Massachusetts' },
  { qualification: 'CPA (US)', state: 'California' },
];
