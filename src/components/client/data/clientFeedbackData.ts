import { MY_STAFF_SEED } from './clientStaffData';

/** Desktop `tblclient_review.client_survey_form_id`: 1 Service, 2 Staff, 3 Sixty, 5 Thirty, 4 Consolidated HBR */
export type SurveyType = 'service' | 'staff' | 'thirty' | 'sixty' | 'hbr';

export const SURVEY_TYPES: SurveyType[] = ['service', 'staff', 'thirty', 'sixty', 'hbr'];

export const SURVEY_TYPE_LABEL: Record<SurveyType, string> = {
  service: 'Service Improvement Survey',
  staff: 'Staff Improvement Survey',
  thirty: '30-Days Staff Check-In Survey',
  sixty: '60-Days Staff Check-In Survey',
  hbr: 'Consolidated HBR',
};

export const SURVEY_TYPE_SHORT: Record<SurveyType, string> = {
  service: 'Service Improvement',
  staff: 'Staff Improvement',
  thirty: '30-Day Check-In',
  sixty: '60-Day Check-In',
  hbr: 'Consolidated HBR',
};

/** Start button label on the intro page (desktop) */
export const SURVEY_START_LABEL: Record<SurveyType, string> = {
  service: 'Start Service Improvement Survey',
  staff: 'Start Staff Survey',
  thirty: 'Start 30-Days Check-In Survey',
  sixty: 'Start 60-Days Check-In Survey',
  hbr: '',
};

/** Days a survey stays open after it is assigned (desktop: 30 half-yearly, 20 check-ins) */
export const SURVEY_VALIDITY_DAYS: Record<SurveyType, number> = { service: 30, staff: 30, thirty: 20, sixty: 20, hbr: 0 };

export type SurveyStatus = 'Not Started' | 'In Progress' | 'Completed' | 'Expired';
export const SURVEY_STATUSES: SurveyStatus[] = ['Not Started', 'In Progress', 'Completed', 'Expired'];

/** Desktop 5-point scale; 0 = Not Applicable */
export const RATING_SCALE = [
  { value: 1, label: 'Does not meet expectations' },
  { value: 2, label: 'Partially meets expectations' },
  { value: 3, label: 'Meets expectations' },
  { value: 4, label: 'Partially exceeds expectations' },
  { value: 5, label: 'Exceeds expectations' },
] as const;
export const NOT_APPLICABLE = 0;

export type SurveyAnswerValue = number | string | string[] | boolean;
export type SurveyAnswers = Record<string, SurveyAnswerValue>;

export type SurveyQuestion =
  | { kind: 'rating'; id: string; title: string; bullets?: string[]; allowNA?: boolean }
  | { kind: 'ratingGroup'; id: string; title: string; items: { id: string; label: string }[] }
  | { kind: 'text'; id: string; title: string; hint?: string }
  | { kind: 'textGroup'; id: string; title: string; items: { id: string; label: string }[] }
  | { kind: 'nps'; id: string; title: string }
  | { kind: 'tags'; id: string; title: string; options: string[] };

export interface SurveySection {
  id: string;
  title?: string;
  prompt?: string;
  /** Desktop "Not Applicable" checkbox that hides the whole section */
  naToggle?: { id: string; hint: string };
  questions: SurveyQuestion[];
}

export interface SurveyIntro {
  purpose: string;
  /** Half-yearly surveys mention the period they cover */
  halfYearly: boolean;
}

export const SURVEY_CONFIDENTIALITY =
  'Your responses will remain confidential and will be used only for internal review, shared with client and staff and for development purposes.';

export const SURVEY_INTRO: Record<Exclude<SurveyType, 'hbr'>, SurveyIntro> = {
  service: {
    purpose:
      'This survey is intended to gather your honest feedback on the overall quality, value, and effectiveness of our services. Your input will help us improve satisfaction, enhance service delivery, and better meet your expectations.',
    halfYearly: true,
  },
  staff: {
    purpose:
      'This survey is designed to gather your honest feedback on the performance, professionalism, and communication of the staff member assigned to your engagement and understand your expectation.',
    halfYearly: true,
  },
  thirty: {
    purpose:
      'This survey is designed to gather your feedback on your overall experience during the first 30 days of our engagement. It covers your interactions with our Sales and Onboarding teams, as well as the performance, communication, and integration of your assigned offshore staff member. Your input will help us ensure a smooth start, address any gaps early on, and strengthen our partnership moving forward.',
    halfYearly: false,
  },
  sixty: {
    purpose:
      'This survey is designed to gather your feedback on your overall experience during the first 60 days of our engagement. It covers your interactions with our Sales and Onboarding teams, as well as the performance, communication, and integration of your assigned offshore staff member. Your input will help us ensure a smooth start, address any gaps early on, and strengthen our partnership moving forward.',
    halfYearly: false,
  },
};

const r = (id: string, title: string, bullets?: string[], allowNA?: boolean): SurveyQuestion => ({ kind: 'rating', id, title, bullets, allowNA });

/* ---------- Service Improvement Survey (current version, from Apr 2026) ---------- */
export const SERVICE_SUPPORT_TAGS = [
  'Additional staff for tax season',
  'Audit & assurance support',
  'Advisory / CFO services',
  'Technology & automation (AI)',
  'Staff training & upskilling',
  'Marketing & practice growth',
  'Cybersecurity & IT support',
];

const SERVICE_FORM: SurveySection[] = [
  {
    id: 'satisfaction',
    title: 'Overall Satisfaction & Experience',
    prompt: 'How would you rate us based on the following service standards? (Rating from 1 to 5)',
    questions: [
      r('engagement_with_csa', 'Engagement with Client & Team Success Advisor', [
        'Accessibility, responsiveness, and ongoing support provided by your assigned Client & Team Success Advisor.',
      ]),
      r('quality_of_exp_staff_hiring', 'Quality of Experienced Staff Hiring', ['Alignment of recruited staff with required skills, expertise, and job expectations.'], true),
      r('staff_replacement_process', 'Staff Replacement Process', ['Efficiency in handling replacements due to performance issues, resignations, or other quality concerns.'], true),
      r('client_hub_usability', 'Client Portal (HRMS) Usability & Functionality', ['Ease of use, accessibility, and effectiveness of features available in the Client Portal (HRMS).']),
      r('it_infrastructure_workplace', 'IT Infrastructure & Workplace Support', ['Adequacy of data security measures, hardware, and peripheral support provided to your offshore team.']),
    ],
  },
  {
    id: 'value',
    title: 'Value & ROI',
    prompt: 'Do you feel that our staffing services provide good value for your investment? (Rating from 1 to 5)',
    questions: [
      r('overall_workload_reduction', 'Overall Workload Reduction', ['The extent to which our offshore staffing services have helped lighten your onshore team’s workload.']),
      r('productivity_improvement', 'Productivity Improvement', ['The impact of offshore staffing engagement in streamlining processes and enhancing team efficiency.']),
      r('increased_facetime', 'Increased Facetime of Onshore Team with Clients', ['How offshoring has enabled your onshore team to dedicate more time to client interactions.']),
      r('more_service_offerings', 'Adding More Service Offerings', ['The role offshoring has played in expanding your firm’s capabilities and service offerings.']),
      r('operational_efficiency', 'Improved Operational Efficiency', ['The effectiveness of offshoring in optimizing workflows and overall firm’s performance.']),
    ],
  },
  {
    id: 'benchmark',
    title: 'Competitive Benchmarking',
    prompt:
      'If you have previously or are currently working with other staffing agencies, how would you compare MYCPE ONE to your other staffing provider(s)?',
    naToggle: {
      id: 'offshoring_provider_not_applicable',
      hint: 'If you have not used or are not using other offshoring providers, please select “Not Applicable”.',
    },
    questions: [
      r('quality_of_staff', 'Quality of Staff', ['The overall competency, professionalism, and performance of the staff provided.']),
      r('effective_onboarding', 'Effective Onboarding', ['The efficiency and smoothness of the onboarding process for new staff members.']),
      r('skills_matching', 'Skills Matching with Requirements', ['How well the assigned staff’s skills align with your specific needs.']),
      r('skilled_staff_fair_price', 'Skilled Staff at Fair Price', ['The fairness between staff expertise and cost-effectiveness of the offshore staff.']),
      r('staff_retention', 'Longevity of Staff / Staff Retention', ['The consistency and retention rate of staff assigned to your firm.']),
    ],
  },
  {
    id: 'nps',
    title: 'Net Promoter Score (NPS)',
    questions: [
      { kind: 'nps', id: 'recommend_to_our_staff_service', title: 'On a scale of 0-10, how likely are you to recommend our staffing services to another CPA firm?' },
      { kind: 'text', id: 'primary_reason_for_your_score', title: 'What is the primary reason for your score?' },
    ],
  },
  {
    id: 'future',
    title: 'Future Needs & Suggestions',
    questions: [
      { kind: 'tags', id: 'additional_support_services', title: 'What additional support or services would you like to see from us?', options: SERVICE_SUPPORT_TAGS },
      { kind: 'text', id: 'experience_with_our_staff_services', title: 'Is there anything else you would like to share about your experience with our staffing services?' },
    ],
  },
];

/* ---------- Staff Improvement Survey (current version, from Apr 2026) ---------- */
const STAFF_FORM: SurveySection[] = [
  {
    id: 'staff',
    questions: [
      r('quality_of_work', 'Quality of work', [
        'Demonstrates improvement in quality of work over time.',
        'Shows a decreasing trend in errors over time and actively works on improving accuracy.',
        'Consistency in work quality.',
      ]),
      r(
        'ability_to_work_endclient',
        'Ability to work with end client',
        [
          'Whether staff member Independently communicate with clients via email or chat or calls.',
          'Whether staff member can Independently deal with client in managing engagement.',
        ],
        true,
      ),
      r(
        'technical_competency',
        'Technical Competency in managing engagements',
        [
          'Staff member’s ability to handle complex projects and client engagements.',
          'Performing detailed review work to ensure high-quality outcomes.',
          'Ability to produce high quality work for clients and deliver client value.',
        ],
        true,
      ),
      r('review_and_supervision', 'Review and Supervision Level', [
        'Demonstrates a habit of thoroughly self reviewing work before submission.',
        'Catching and correcting mistakes proactively.',
        'Ability to deliver work with minimal supervision.',
      ]),
      r('communication_and_engagement', 'Communication & Engagement', [
        'Communicates clearly with both the client and/or internal team members.',
        'Contributes to discussions in meetings, shares insights & recommendations.',
        'Proactive in asking questions, resolving doubts rather, responds to queries etc.',
        'Proactive in giving feedback in a timely manner.',
      ]),
      r('accountability_and_reporting', 'Accountability and Reporting', [
        'Ensures accurate Time tracking for projects and submits error-free timesheets.',
        'Effectively communicates workload status, updates on deadlines.',
        'Sends daily or regular status updates, ensuring visibility on open tasks and progress.',
      ]),
      r('productivity_and_timemanagement', 'Productivity and Time management', [
        'Effectively manages workload.',
        'Completes assigned projects within the allocated budgeted hours.',
        'Effective in completing task within deadlines.',
        'Reports whether delays were due to missing information or inefficiencies.',
        'Proactively communicates while running out of work and seeks additional assignments.',
      ]),
      r(
        'adaptability_to_ai_tools',
        'Adaptability to Automation (AI) Tools & Systems',
        [
          'Willingness and ability to adopt new tools/systems implemented by the firm.',
          'Openness to learning and working with automation and AI-driven processes.',
          'Ability to quickly adapt to changes in workflows due to new technologies.',
          'Proactiveness in upskilling to align with the firm’s automation strategy.',
        ],
        true,
      ),
      r('time_flexibilities_availability', 'Time Flexibility & Availability', [
        'Availability for required crossover (overlap) hours with the team.',
        'Flexibility to extend working hours during peak periods.',
        'Availability to work additional hours for time-sensitive tasks.',
        'Willingness to adjust schedule as needed to meet business requirements.',
        'Availability to attend important meetings and discussions.',
      ]),
      r('leave_management', 'Leave management & Planning', [
        'Staff member is planning leaves in advance as per your guidelines.',
        'Balances between leave management and work responsibilities.',
        'Not taking excessive leave during peak time or during deadlines.',
      ]),
      r('leaning_development', 'Learning & Development', [
        'Staff commitment to learning across multiple areas.',
        'Proactive in reporting the learning initiatives.',
        'Visibility of learning in staff member’s work and performance.',
      ]),
      { kind: 'text', id: 'overall_feedback', title: 'Overall Feedback', hint: 'Overall experience with your firm since onboarding' },
    ],
  },
];

/* ---------- 30 / 60-Days Staff Check-In (Level 1–4 and Level 5+ sets) ---------- */
const CSA_SUPPORT: SurveyQuestion = {
  kind: 'ratingGroup',
  id: 'csa_support',
  title: 'Client Success Advisor Support',
  items: [
    { id: 'csa_informed', label: 'You were well informed about the onboarding steps, timeline, and next actions.' },
    { id: 'csa_supported', label: 'You felt adequately supported during the onboarding process.' },
    { id: 'csa_consistent', label: 'You experienced consistent and timely interactions throughout the onboarding process.' },
    { id: 'csa_education', label: 'You were provided with relevant education and resources on the offshoring journey.' },
    { id: 'csa_communication', label: 'Onboarding communication was proactive, transparent, and timely.' },
  ],
};

const nextSteps = (lastLabel: string): SurveyQuestion => ({
  kind: 'textGroup',
  id: 'next_steps',
  title: 'Additional Comments & Next Steps',
  items: [
    { id: 'working_effectively', label: 'What has been working effectively with the newly onboarded offshore staff?' },
    { id: 'needs_improvement', label: 'What areas do you think the new hire needs further improvement or training in?' },
    { id: 'additional_feedback', label: lastLabel },
  ],
});

const THIRTY_JUNIOR: SurveySection[] = [
  {
    id: 'thirty',
    questions: [
      r('onboarding_experience', 'Onboarding Experience', [
        'Received profiles aligned with the required skill set.',
        'Faced no significant challenges during the interview scheduling process.',
        'Team effectively identified and provided suitable candidates.',
      ]),
      CSA_SUPPORT,
      r('skillset', 'Skillset', [
        'Matches the skill level presented in the resume and hiring discussions.',
        'Demonstrates technical skills aligned with initial expectations.',
        'Applies functional knowledge effectively in assigned tasks.',
      ]),
      r('software_knowledge', 'Software Knowledge', [
        'Possesses the software proficiency presented during interviews.',
        'Effectively uses required tools and applications for task execution.',
        'Demonstrates growth and quickly adapts to new tools or software not listed in the resume.',
      ]),
      r('process_adherence', 'Instruction and process adherence', [
        'Follows established procedures and workflows accurately.',
        'Adheres to instructions and guidelines with consistency.',
        'Shows attention to detail in completing tasks as directed.',
      ]),
      r('communication', 'Communication', [
        'Communicates clearly and effectively in daily interactions.',
        'Receptive to feedback and applies suggestions constructively.',
        'Proactively raises and addresses concerns when needed.',
      ]),
      r('reporting', 'Reporting', [
        'Sends regular updates and end-of-day task status emails / via Messages.',
        'Communicates delays or issues proactively and transparently.',
        'Submits accurate and timely daily timesheets.',
      ]),
      r('time_overlap', 'Time Overlap', [
        'Adheres to the committed crossover hours communicated during the interview.',
        'Remains available and responsive during agreed time windows.',
        'Current time overlap is sufficient to support collaboration needs.',
      ]),
      r('self_review', 'Self Review & Supervision', [
        'Reviews work thoroughly to minimize basic errors.',
        'Balances speed with accuracy while reducing the need for onshore staff supervision.',
        'Demonstrates growing independence and accountability in task execution.',
      ]),
      r('accountability', 'Accountability', [
        'Provides regular updates and communicates task progress proactively.',
        'Takes ownership of responsibilities and meets deadlines.',
        'Responds positively to feedback and demonstrates improvement.',
      ]),
      r('quality_of_work', 'Quality of work', [
        'Understands task requirements and delivers accurate, reliable output.',
        'Shows improvement over time by applying feedback and reducing errors.',
        'Demonstrates growth in handling complexity with consistent learning.',
      ]),
      r('productivity', 'Productivity', [
        'Manages workload efficiently and meets deadlines.',
        'Completes tasks within allocated budgeted hours.',
        'Communicates proactively about delays or lack of work.',
      ]),
      nextSteps('Do you have any additional feedback on anything?'),
    ],
  },
];

const THIRTY_SENIOR: SurveySection[] = [
  {
    id: 'thirty',
    questions: [
      r('onboarding_experience', 'Onboarding Experience', [
        'Received candidate profiles aligned with the required skill set.',
        'Faced no significant challenges during the interview scheduling process.',
        'Team effectively identified and provided suitable candidates.',
      ]),
      CSA_SUPPORT,
      r('skillset', 'Skillset', [
        'Matches the skill level presented in the resume and hiring discussions.',
        'Demonstrates technical skills aligned with initial expectations.',
        'Shows attention to detail in completing tasks as directed.',
        'Applies functional knowledge effectively in assigned tasks.',
      ]),
      r('ownership_clarity', 'Ownership and Clarity', [
        'Understands the role and firm’s overall objectives.',
        'Seeks clarity and direction when expectations are not clearly defined.',
        'Begins to take ownership of role responsibilities with a focus on long-term impact.',
      ]),
      r('reporting', 'Reporting', [
        'Maintains consistency in sending task updates and end-of-day status reports.',
        'Shows increased transparency in communicating delays or blockers.',
        'Demonstrates continued accuracy and timeliness in submitting daily timesheets.',
      ]),
      r('communication', 'Communication', [
        'Communicates clearly and effectively in daily interactions.',
        'Sends regular task updates, including end-of-day status emails / messages.',
        'Proactively communicates delays, issues, or availability gaps.',
      ]),
      r('productivity', 'Productivity', [
        'Manages workload efficiently and meet project deadlines.',
        'Shows accuracy in tracking and adhering to budgeted task hours.',
        'Proactively communicates about delays, bandwidth, or upcoming availability.',
      ]),
      r('team_collaboration', 'Internal Team Collaboration & Accountability', [
        'Collaborates effectively with both onshore and offshore teams.',
        'Collaborates effectively to support team goals and shared responsibilities.',
        'Begins to influence team dynamics through proactive engagement and support.',
      ]),
      r('roles_responsibilities', 'Roles & Responsibilities', [
        'Understands the scope and expectations of the assigned role.',
        'Aligns daily activities with the responsibilities defined during onboarding.',
        'Seeks clarification when needed to ensure accurate execution.',
        'Demonstrates capability at a level comparable to an onshore manager.',
      ]),
      nextSteps('Do you have any additional feedback on anything?'),
    ],
  },
];

const SIXTY_JUNIOR: SurveySection[] = [
  {
    id: 'sixty',
    questions: [
      r('process_adherence', 'Instruction and process adherence', [
        'Demonstrates improved consistency in following established processes and workflows.',
        'Applies instructions with increased accuracy and minimal need for follow-up.',
        'Shows enhanced attention to detail and a proactive approach in task execution.',
      ]),
      r('communication', 'Communication', [
        'Communicates with greater clarity and confidence in daily interactions.',
        'Responds to feedback with increased maturity and applies it consistently.',
        'Proactively engages in discussions and addresses concerns more independently.',
      ]),
      r('reporting', 'Reporting', [
        'Maintains consistency in sending task updates and end-of-day status reports.',
        'Shows increased transparency in communicating delays or blockers.',
        'Demonstrates continued accuracy and timeliness in submitting daily timesheets.',
      ]),
      r('time_overlap', 'Time Overlap', [
        'Continues to honor the crossover hours committed during the interview.',
        'Maintains consistent availability and responsiveness during agreed time slots.',
      ]),
      r('self_review', 'Self Review & Supervision', [
        'Shows improved accuracy with fewer basic errors through thorough self-review.',
        'Demonstrates stronger balance between efficiency and quality with minimal supervision.',
        'Operates more independently while taking full accountability for task outcomes.',
      ]),
      r('accountability', 'Accountability', [
        'Maintains consistency in proactively providing task updates and progress reports.',
        'Demonstrates stronger ownership of responsibilities and timely task completion.',
        'Shows visible improvement in response to feedback and greater accountability.',
      ]),
      r('quality_of_work', 'Quality of work', [
        'Consistently delivers accurate outputs with a solid understanding of task requirements.',
        'Applies feedback effectively, showing continued improvement in work quality.',
        'Handles complex tasks more confidently, demonstrating ongoing learning and adaptability.',
      ]),
      r('productivity', 'Productivity', [
        'Continues to manage workload efficiently and meet project deadlines.',
        'Shows improved accuracy in tracking and adhering to budgeted task hours.',
        'Proactively communicates about delays, bandwidth, or upcoming availability.',
      ]),
      r('long_term_fit', 'Long-term fit / Role alignment', [
        'Appears to be a suitable long-term fit for your team or firm.',
        'Current responsibilities align with the staff’s strengths and capabilities.',
        'Shows promise for future growth and contribution in the role.',
      ]),
      nextSteps('Do you have any additional feedback or concerns regarding the new hire?'),
    ],
  },
];

const SIXTY_SENIOR: SurveySection[] = [
  {
    id: 'sixty',
    questions: [
      r('ownership_clarity', 'Ownership and Clarity', [
        'Understands the role and firm’s overall objectives.',
        'Seeks clarity and direction when expectations are not clearly defined.',
        'Begins to take ownership of role responsibilities with a focus on long-term impact.',
      ]),
      r('reporting', 'Reporting', [
        'Maintains consistency in sending task updates and end-of-day status reports.',
        'Shows increased transparency in communicating delays or blockers.',
        'Demonstrates continued accuracy and timeliness in submitting daily timesheets.',
      ]),
      r('communication', 'Communication', [
        'Communicates clearly and effectively in daily interactions.',
        'Sends regular task updates, including end-of-day status emails / messages.',
        'Proactively communicates delays, issues, or availability gaps.',
      ]),
      r('productivity', 'Productivity', [
        'Continues to manage workload efficiently and meet project deadlines.',
        'Shows improved accuracy in tracking and adhering to budgeted task hours.',
        'Proactively communicates about delays, bandwidth, or upcoming availability.',
      ]),
      r('team_collaboration', 'Internal Team Collaboration & Accountability', [
        'Collaborates effectively with both onshore and offshore teams.',
        'Collaborates effectively to support team goals and shared responsibilities.',
        'Begins to influence team dynamics through proactive engagement and support.',
      ]),
      r('operational_efficiency', 'Process Involvements / Operational Efficiency', [
        'Identifies and addresses process inefficiencies proactively.',
        'Contributes to workflow improvements and SOP documentation.',
        'Shares ideas that enhance team productivity and operational output.',
      ]),
      r('initiative', 'Initiative & Critical Thinking', [
        'Begins to take initiative in areas beyond assigned tasks.',
        'Demonstrates early problem-solving ability with minimal guidance.',
        'Approaches challenges with a solutions-oriented mindset.',
        'Shows curiosity and asks thoughtful questions to understand the bigger picture.',
      ]),
      r('self_sufficiency', 'Self-Sufficiency', [
        'Operates independently with minimal supervision.',
        'Trusted to manage crucial client-related tasks with confidence.',
        'Have the capacity to handle end-client communication.',
      ]),
      r('leadership', 'Leadership Skills', [
        'Exhibits strong leadership qualities through guidance, decision-making, and team influence.',
        'Inspires confidence and trust while supporting peers and junior staff.',
        'Takes initiative in leading discussions, setting direction, and driving results.',
      ]),
      r('talent_management', 'Talent Management', [
        'Trusted to support the identification and hiring of additional team members.',
        'Provides valuable input in future hiring and team expansion decisions.',
        'Capable in training, mentoring, and supporting new team members during periods of team growth and expansion.',
      ]),
      nextSteps('Do you have any additional feedback on anything?'),
    ],
  },
];

export interface ClientSurvey {
  id: string;
  type: SurveyType;
  staffId: string | null;
  staffName: string | null;
  /** Desktop `level_id`: Level 1–4 and Level 5+ get different check-in questions */
  staffLevel: number | null;
  /** Client contact who must fill it (non-assignees can only view) */
  assignedTo: string;
  /** Half-yearly period, e.g. "Apr 2026 - Sep 2026"; check-ins have none */
  period: string | null;
  assignedOn: string;
  submittedOn: string | null;
  /** Desktop status 2 = started (In Progress) */
  started: boolean;
  completed: boolean;
  answers: SurveyAnswers;
}

/** Question set for a survey (by type and, for check-ins, by staff level) */
export const surveySections = (s: ClientSurvey): SurveySection[] => {
  const senior = (s.staffLevel ?? 0) >= 5;
  switch (s.type) {
    case 'service':
      return SERVICE_FORM;
    case 'staff':
      return STAFF_FORM;
    case 'thirty':
      return senior ? THIRTY_SENIOR : THIRTY_JUNIOR;
    case 'sixty':
      return senior ? SIXTY_SENIOR : SIXTY_JUNIOR;
    default:
      return [];
  }
};

export const isAnswered = (v: SurveyAnswerValue | undefined) =>
  v !== undefined && (typeof v === 'string' ? v.trim().length > 0 : Array.isArray(v) ? v.length > 0 : true);

/** Answer keys that must be filled (a section switched to "Not Applicable" drops out) */
export const requiredKeys = (sections: SurveySection[], answers: SurveyAnswers) =>
  sections.flatMap((sec) =>
    sec.naToggle && answers[sec.naToggle.id] === true
      ? []
      : sec.questions.flatMap((q) => (q.kind === 'ratingGroup' || q.kind === 'textGroup' ? q.items.map((i) => i.id) : [q.id])),
  );

export const surveyProgress = (s: ClientSurvey) => {
  const keys = requiredKeys(surveySections(s), s.answers);
  return { done: keys.filter((k) => isAnswered(s.answers[k])).length, total: keys.length };
};

/* ---------- Dates & status ---------- */
const DAY_MS = 86_400_000;
const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};
const toIso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const daysAgo = (n: number) => toIso(new Date(startOfToday().getTime() - n * DAY_MS));
export const todayIso = () => toIso(startOfToday());

/** Days left before the survey closes (desktop "Expires In") */
export const daysLeft = (s: ClientSurvey) => {
  const assigned = new Date(`${s.assignedOn}T00:00:00`).getTime();
  return SURVEY_VALIDITY_DAYS[s.type] - Math.round((startOfToday().getTime() - assigned) / DAY_MS);
};

export const expiryDate = (s: ClientSurvey) =>
  toIso(new Date(new Date(`${s.assignedOn}T00:00:00`).getTime() + SURVEY_VALIDITY_DAYS[s.type] * DAY_MS));

export const surveyStatus = (s: ClientSurvey): SurveyStatus => {
  if (s.completed) return 'Completed';
  if (daysLeft(s) <= 0) return 'Expired';
  return s.started ? 'In Progress' : 'Not Started';
};

/** Card-sized period: "Apr 2026 - Sep 2026" → "Apr–Sep 2026", "Oct 2025 - Mar 2026" → "Oct 25–Mar 26" */
export const shortPeriod = (period: string) => {
  const m = period.match(/^(\w{3}) (\d{4}) - (\w{3}) (\d{4})$/);
  if (!m) return period;
  const [, m1, y1, m2, y2] = m;
  return y1 === y2 ? `${m1}–${m2} ${y2}` : `${m1} ${y1.slice(2)}–${m2} ${y2.slice(2)}`;
};

/** "Oct 02, 2026" */
export const formatSurveyDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

/* ---------- Seeds ---------- */
/** Primary client contact sees every survey; other contacts see their own only */
export const OTHER_CLIENT_CONTACT = 'Jordan Ellis';
const ME = 'Taylor Morgan';

const staffById = (id: string) => MY_STAFF_SEED.find((m) => m.id === id)!;
const levelOf = (id: string) => Number(staffById(id).level.replace(/\D/g, ''));

/** Deterministic answers for submitted / half-filled seeds */
const fill = (s: ClientSurvey, seed: number, upTo = Infinity): SurveyAnswers => {
  const answers: SurveyAnswers = {};
  let n = 0;
  surveySections(s).forEach((sec) =>
    sec.questions.forEach((q) => {
      const ids = q.kind === 'ratingGroup' || q.kind === 'textGroup' ? q.items.map((i) => i.id) : [q.id];
      if (n >= upTo) return;
      ids.forEach((id) => {
        if (n >= upTo) return;
        n += 1;
        const k = (seed + n * 7) % 10;
        if (q.kind === 'rating' || q.kind === 'ratingGroup') answers[id] = k < 2 ? 5 : k < 7 ? 4 : 3;
        else if (q.kind === 'nps') answers[id] = 9;
        else if (q.kind === 'tags') answers[id] = [SERVICE_SUPPORT_TAGS[0], SERVICE_SUPPORT_TAGS[3]];
        else answers[id] = SAMPLE_TEXT[(seed + n) % SAMPLE_TEXT.length];
      });
      if (q.kind === 'rating' && n % 4 === 1) answers[`${q.id}_comment`] = 'Consistent improvement this period, keep it up.';
    }),
  );
  return answers;
};

const SAMPLE_TEXT = [
  'Turnaround on monthly closes has improved a lot and reviews need fewer changes.',
  'More confidence on client calls would help, especially during tax season.',
  'Overall a great experience so far — the team is responsive and easy to work with.',
  'Clear daily updates and timesheets are always on time.',
];

const make = (
  id: number,
  type: SurveyType,
  opts: {
    staffId?: string;
    assignedTo?: string;
    period?: string;
    assignedDaysAgo: number;
    submittedDaysAgo?: number;
    started?: boolean;
    answered?: number;
  },
): ClientSurvey => {
  const base: ClientSurvey = {
    id: `sv${id}`,
    type,
    staffId: opts.staffId ?? null,
    staffName: opts.staffId ? staffById(opts.staffId).name : null,
    staffLevel: opts.staffId ? levelOf(opts.staffId) : null,
    assignedTo: opts.assignedTo ?? ME,
    period: opts.period ?? null,
    assignedOn: daysAgo(opts.assignedDaysAgo),
    submittedOn: opts.submittedDaysAgo !== undefined ? daysAgo(opts.submittedDaysAgo) : null,
    started: Boolean(opts.started || opts.submittedDaysAgo !== undefined),
    completed: opts.submittedDaysAgo !== undefined,
    answers: {},
  };
  if (base.completed) base.answers = fill(base, id);
  else if (opts.answered) base.answers = fill(base, id, opts.answered);
  return base;
};

const CURRENT_PERIOD = 'Apr 2026 - Sep 2026';
const PREVIOUS_PERIOD = 'Oct 2025 - Mar 2026';

export const FEEDBACK_SURVEYS_SEED: ClientSurvey[] = [
  make(1, 'thirty', { staffId: 'ms14', assignedDaysAgo: 6 }),
  make(2, 'sixty', { staffId: 'ms5', assignedDaysAgo: 17, started: true, answered: 4 }),
  make(3, 'service', { period: CURRENT_PERIOD, assignedDaysAgo: 4 }),
  make(4, 'staff', { staffId: 'ms1', period: CURRENT_PERIOD, assignedDaysAgo: 9, started: true, answered: 5 }),
  make(5, 'staff', { staffId: 'ms12', period: CURRENT_PERIOD, assignedDaysAgo: 4 }),
  make(6, 'staff', { staffId: 'ms7', period: CURRENT_PERIOD, assignedDaysAgo: 4, assignedTo: OTHER_CLIENT_CONTACT }),
  make(7, 'thirty', { staffId: 'ms15', assignedDaysAgo: 41 }),
  make(8, 'thirty', { staffId: 'ms5', assignedDaysAgo: 47, submittedDaysAgo: 40 }),
  make(9, 'hbr', { period: PREVIOUS_PERIOD, assignedDaysAgo: 160, submittedDaysAgo: 160 }),
  make(10, 'service', { period: PREVIOUS_PERIOD, assignedDaysAgo: 196, submittedDaysAgo: 188 }),
  make(11, 'staff', { staffId: 'ms16', period: PREVIOUS_PERIOD, assignedDaysAgo: 196, submittedDaysAgo: 185 }),
  make(12, 'staff', { staffId: 'ms17', period: PREVIOUS_PERIOD, assignedDaysAgo: 196, started: true, answered: 3 }),
  make(13, 'staff', { staffId: 'ms6', period: PREVIOUS_PERIOD, assignedDaysAgo: 196, submittedDaysAgo: 179, assignedTo: OTHER_CLIENT_CONTACT }),
];

export const FEEDBACK_PAGE_SIZE = 8;
