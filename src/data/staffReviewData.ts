// Staff Review — performance report shown before the reviewer starts the evaluation form

/** Help shown in the ⓘ bottom sheet. Text supports **bold** spans. */
export interface ReviewInfo {
  summary: string;
  rows?: { label: string; text: string }[];
  /** Use \n for multiple source lines */
  source?: string;
  updatedBy?: string;
  /** Extra footer line shown before Applicability (e.g. Filter Logic, Calculation Logic) */
  logic?: { label: string; text: string };
  applicability?: string;
}

export interface ReviewMetric {
  label: string;
  /** Empty string renders as "—" (not rated yet) */
  value: string;
  info?: ReviewInfo;
}

/** A titled card with side-by-side tiles (e.g. Escalations: Client / Manager / Staff) */
export interface ReviewMetricGroup {
  title: string;
  info?: ReviewInfo;
  items: ReviewMetric[];
}

export interface ReviewSection {
  id: string;
  title: string;
  groups?: ReviewMetricGroup[];
  metrics?: ReviewMetric[];
}

const IN_RANGE = 'This is calculated based on the selected **From** and **To** date range.';
const LIFETIME = 'This is a lifetime / current-profile value and is not calculated based on the selected date range.';

export const REVIEW_PERIOD = {
  label: 'April 2025 - March 2026',
  from: '2025-04-01',
  to: '2026-03-31',
};

export const REVIEW_SECTIONS: ReviewSection[] = [
  {
    id: 'client',
    title: 'Client & Profiling',
    groups: [
      {
        title: 'Escalations',
        info: {
          summary: 'This section shows the number of escalations recorded for the selected staff member during the selected report period.',
          rows: [
            { label: 'Client', text: 'Shows the count of client escalations recorded in Timesheet Events for the selected staff member during the selected date range.' },
            { label: 'Manager', text: 'Shows the count of internal escalations raised by the manager in Timesheet Events during the selected date range.' },
            { label: 'Staff', text: 'Shows the count of escalations raised by users other than the client or manager during the selected date range.' },
          ],
          source: 'Timesheet Events',
          applicability: IN_RANGE,
        },
        items: [
          { label: 'Client', value: '0' },
          { label: 'Manager', value: '0' },
          { label: 'Staff', value: '0' },
        ],
      },
      {
        title: 'Appreciations',
        info: {
          summary: 'This section shows the number of appreciations received by the selected staff member during the selected report period.',
          rows: [
            { label: 'Client', text: 'Shows the count of client appreciations recorded through Timesheet Events during the selected date range.' },
            { label: 'Manager', text: 'Shows the count of appreciations logged by the manager for the staff member in the Feedback module during the selected date range.' },
            { label: 'Team', text: 'Shows the count of appreciations received from users other than the manager, recorded in the Feedback module during the selected date range.' },
          ],
          source:
            'Client appreciation is fetched from **Timesheet Events**.\nManager and Team appreciations are fetched from the **Feedback module**.',
          applicability: IN_RANGE,
        },
        items: [
          { label: 'Client', value: '0' },
          { label: 'Manager', value: '0' },
          { label: 'Team', value: '1' },
        ],
      },
      {
        title: 'Overall Billing',
        info: {
          summary: 'This section shows the billing and productive work contribution of the selected staff member during the selected report period.',
          rows: [
            {
              label: 'Total Billed Hours',
              text: 'Shows the total billed hours recorded for the selected staff member across all applicable timesheets during the selected date range. If the staff member is mapped to multiple timesheets, billed hours from all applicable timesheets are considered.',
            },
            {
              label: 'Total Productive Hours',
              text: 'Shows how many hours out of the total billed hours were productive. For example, if the staff member has 50 billed hours and 40 of those hours are productive, the report will show 40 productive hours.',
            },
          ],
          applicability: IN_RANGE,
        },
        items: [
          { label: 'Total Billed Hours', value: '1,642:30' },
          { label: 'Total Productive Hours', value: '1,868:15' },
        ],
      },
      {
        title: 'Expansions / Reductions in Same Profile (ROY/Seasonal)',
        items: [
          { label: 'Expansion', value: '0' },
          { label: 'Reduction', value: '0' },
        ],
      },
    ],
    metrics: [
      { label: 'Active Involvement in Expansions', value: '0' },
      {
        label: 'Managing End Clients (Extent)',
        value: '',
        info: {
          summary: 'This field shows whether the selected staff member manages end clients directly.',
          rows: [
            {
              label: 'Managing End Clients (Extent)',
              text: 'Shows the value selected by the staff member in their Staff Profile. If the staff member has selected **Yes**, the report will show **Yes**. If the staff member has selected **No**, the report will show **No**.',
            },
          ],
          source: 'Staff Profile > Skill Set > Capacity & Availability > Managing End Clients',
          updatedBy: 'Staff member',
          applicability: LIFETIME,
        },
      },
      {
        label: 'Helped Smoother Onboarding?',
        value: '',
        info: {
          summary: 'This field shows whether the selected staff member has helped in smoother onboarding.',
          rows: [
            {
              label: 'Helped Smoother Onboarding?',
              text: "Shows the value added by the manager in the staff member's profile. If the manager has selected **Yes**, the report will show **Yes**. If the manager has selected **No**, the report will show **No**.",
            },
          ],
          source: 'Staff Profile > Skill Set > Capacity & Availability > Helped Smoother Onboarding',
          updatedBy: 'Manager only',
          applicability: LIFETIME,
        },
      },
      {
        label: 'Profile Upgrade',
        value: '0',
        info: {
          summary: "This field shows how many times the selected staff member's profile was upgraded during the selected report period.",
          rows: [
            {
              label: 'Profile Upgrade',
              text: 'Shows the count of profile upgrade events recorded for the staff member. If a **Change in Profile** event is triggered in Timesheet Events during the selected date range, it is counted here.',
            },
          ],
          source: 'Timesheet Events > Change in Profile',
          applicability: IN_RANGE,
        },
      },
      {
        label: 'Timesheet Terminations',
        value: '0',
        info: {
          summary: 'This field shows how many times timesheet termination events were recorded for the selected staff member during the selected report period.',
          rows: [
            {
              label: 'Timesheet Terminations',
              text: 'Shows the total count of termination events recorded in Timesheet Events during the selected date range. If the staff member is linked to multiple timesheets and termination events are recorded for those timesheets, all applicable termination events within the selected date range are counted.',
            },
          ],
          source: 'Timesheet Events > Termination Event',
          applicability: IN_RANGE,
        },
      },
      {
        label: 'Client Leaves',
        value: '0',
        info: {
          summary: 'This field shows the total number of client leaves applied by the selected staff member during the selected report period.',
          rows: [
            {
              label: 'Client Leaves',
              text: 'Shows the count of client leave applications submitted by the staff member within the selected date range. If the staff member has applied for client leave through the Apply Timesheet module, it is counted here.',
            },
          ],
          source: 'Apply Timesheet Module > Client Leave',
          applicability: IN_RANGE,
        },
      },
      {
        label: 'End Client Interaction Quality',
        value: '',
        info: {
          summary: "This field shows the selected staff member's end-client interaction quality and communication type as maintained in the Staff Profile.",
          rows: [
            {
              label: 'End Client Interaction Quality',
              text: 'Shows the end-client interaction quality selected in the Staff Profile. Possible values are **Strong**, **Average**, and **Poor**. The interaction type may also indicate whether the staff member has **No Communication**, **Verbal Only**, **Written Only**, or **Verbal + Written** communication with the end client.',
            },
          ],
          source: 'Staff Profile > Skill Set > Capacity & Availability',
          updatedBy: 'Staff member can fill this information, and the manager can edit it.',
          applicability: LIFETIME,
        },
      },
      {
        label: 'Profile Hours Lost – Due to qualitative reasons',
        value: '0',
        info: {
          summary: 'Shows the count of reduction events where the staff member was the EA or Holder on the timesheet, and the reduction was caused by a qualitative issue.',
          rows: [
            {
              label: 'Profile Hours Lost',
              text: 'Counted issue types: **Quality-related concerns**, **Poor Communication**, **Performance concerns**. Only reduction events with status **Received** are counted.',
            },
          ],
          source: 'Timesheet Events > Reduction Events',
          applicability: IN_RANGE,
        },
      },
    ],
  },
  {
    id: 'experience',
    title: 'Experience',
    groups: [
      {
        title: 'Tenure with MyCPE One',
        info: {
          summary: 'This field shows the total tenure of the selected staff member with MyCPE One.',
          rows: [
            {
              label: 'Organizational Tenure (In Years)',
              text: "Shows how long the staff member has been associated with MyCPE One from their date of joining. The value is calculated from the staff member's joining date until the current date.",
            },
          ],
          source: 'Staff joining date',
          applicability: LIFETIME,
        },
        items: [{ label: 'Organizational Tenure', value: '3 Years 8 Months' }],
      },
      {
        title: 'Summary of Experience',
        info: {
          summary: "This section shows the selected staff member's professional experience by region.",
          rows: [
            { label: 'India Experience (In Years)', text: 'Shows the India-specific professional experience added by the staff member in their profile.' },
            { label: 'US Experience (In Years)', text: 'Shows the US-specific professional experience added by the staff member in their profile.' },
            { label: 'Canada Experience (In Years)', text: 'Shows the Canada-specific professional experience added by the staff member in their profile.' },
          ],
          source: 'Staff Profile > Professional Details',
          applicability: 'This is lifetime / current-profile data and is not calculated based on the selected date range.',
        },
        items: [
          { label: 'India', value: '1 Year 11 Months' },
          { label: 'US', value: '0' },
          { label: 'Canada', value: '0 Years 0 Months' },
        ],
      },
    ],
  },
  {
    id: 'availability',
    title: 'Availability',
    groups: [
      {
        title: 'Work Mode',
        info: {
          summary: 'This section shows how many days the selected staff member worked in different work modes during the selected report period.',
          rows: [
            {
              label: 'Home',
              text: "Shows the number of days the staff member worked from home during the selected date range. For **Temporary** records, days are calculated using the approved from and to dates intersected with the filter range. For **Permanent** records (no end date), days are calculated from the record's created date up to the current date, intersected with the filter range.",
            },
            {
              label: 'Hybrid',
              text: "Shows the number of days the staff member worked in hybrid mode during the selected date range. For **Temporary** records, days are calculated using the approved from and to dates intersected with the filter range. For **Permanent** records (no end date), days are calculated from the record's created date up to the current date, intersected with the filter range.",
            },
          ],
          source: 'Work Flexibility Report',
          applicability:
            'Calculated based on the selected **From** and **To** date range. If a staff member had multiple permanent or temporary periods within the range, all overlapping days are summed.',
        },
        items: [
          { label: 'Home', value: '365 Days' },
          { label: 'Hybrid', value: '730 Days' },
        ],
      },
      {
        title: 'OT Contributed',
        info: {
          summary: 'This section shows the overtime contribution of the selected staff member during the selected report period.',
          rows: [
            {
              label: 'Automatically',
              text: 'Shows the OT credited automatically by the ERP system. This includes OT accumulated through weekend working or extra hours worked during the week, which is credited through the weekly OT process.',
            },
            { label: 'Manually', text: 'Shows the OT credited manually for the staff member for any other reason or manual adjustment.' },
          ],
          source: 'ERP > Manage OT / Track OT module',
          applicability: IN_RANGE,
        },
        items: [
          { label: 'Automatically', value: '0 Days' },
          { label: 'Manually', value: '0 Days' },
        ],
      },
      {
        title: 'Availability & Flexibility',
        info: {
          summary: "This section shows the selected staff member's availability details as maintained in the Staff Profile.",
          rows: [
            { label: 'Available Up To', text: 'Shows the normal availability time updated in the Staff Profile.' },
            { label: 'Tax Season Available Up To', text: 'Shows the tax season availability time updated in the Staff Profile.' },
          ],
          source: 'Staff Profile',
          applicability: LIFETIME,
        },
        items: [
          { label: 'Available Up To', value: '' },
          { label: 'Tax Season Available Up To', value: '' },
        ],
      },
    ],
  },
  {
    id: 'skills',
    title: 'Skill Set',
    metrics: [
      {
        label: 'Communication Skills',
        value: '',
        info: {
          summary: "This field shows the selected staff member's communication skill level as maintained in the Staff Profile.",
          rows: [
            {
              label: 'Communication Skills',
              text: 'Shows the communication skill value updated for the staff member in the Staff Profile. Possible values include **Strong**, **Average**, **Poor**, and **Advanced**.',
            },
          ],
          source: 'Staff Profile',
          updatedBy: 'I&D Team and Manager',
          applicability: LIFETIME,
        },
      },
      {
        label: 'Process Improvements – Automation & Workflow Enhancements',
        value: 'No',
        info: {
          summary:
            "Shows whether the staff member's productive timesheet hours exceeded their office hours by at least 1 hour during the selected report period, indicating possible automation or workflow efficiency gains.",
          rows: [
            {
              label: 'Process Improvements',
              text: 'Shows **Yes** when Productive Timesheet Hours minus Office Hours is 1 hour or more for the selected period; otherwise **No**.',
            },
          ],
          source: 'Attendance & Timesheet Modules',
          applicability: IN_RANGE,
        },
      },
    ],
  },
  {
    id: 'behavioral',
    title: 'Overall (Behavioral & Operational Factors)',
    metrics: [
      {
        label: 'Support Dependency – Level of review/onboarding support required',
        value: 'No',
        info: {
          summary:
            'Shows whether the selected staff member required review/onboarding support from a reviewer on their own timesheet entries during the selected report period.',
          rows: [
            {
              label: 'Support Dependency',
              text: 'Shows **Yes** when an Internal Work timesheet entry with Type of Work "Review of TS" or "Cross Reviews of TS" was logged by a reviewer on the staff member\'s own entries within the selected date range; otherwise **No**.',
            },
          ],
          source: 'Project Timesheets Module',
          applicability: IN_RANGE,
        },
      },
      {
        label: 'Mentoring & Guiding – Review or onboarding support to team',
        value: 'No',
        info: {
          summary:
            'Shows whether the selected staff member provided review/onboarding support to a different EA. This is the opposite perspective of Support Dependency — here the staff member acts as the reviewer helping someone else, not the one being reviewed.',
          rows: [
            {
              label: 'Mentoring & Guiding',
              text: 'Shows **Yes** when the staff member logged an Internal Work entry as a reviewer with Type of Work "Review of TS" or "Cross Reviews of TS" for a different EA\'s timesheet within the selected date range (self-review excluded); otherwise **No**.',
            },
          ],
          source: 'Project Timesheets Module',
          applicability: IN_RANGE,
        },
      },
      {
        label: 'Branch Growth Support – Including cross-team collaboration',
        value: 'No',
        info: {
          summary:
            'Shows **Yes** if, during the selected period: (1) the staff member was assigned as EA or Holder on a client, (2) a new timesheet was started for that same client during the period with a different EA and Holder, and (3) both the new EA\'s and new Holder\'s work location are different from the selected staff member\'s location at that time. Otherwise shows **No**.',
          rows: [
            {
              label: 'Branch Growth Support',
              text: 'Shows **Yes** when a cross-location branch growth scenario is detected for the selected staff during the date range; otherwise **No**.',
            },
          ],
          source: 'Timesheet Data & Staff Location History',
          applicability: IN_RANGE,
        },
      },
      {
        label: 'Managerial Flexibility – Ability to work across different managers',
        value: '',
        info: {
          summary:
            'Shows **Yes** if the staff profile indicates the staff member has the ability to work across different managers. Shows **No** if explicitly marked otherwise. Shows **-** if no information is available.',
          rows: [
            {
              label: 'Managerial Flexibility',
              text: 'Shows **Yes** (manager_flexibility = 1) or **No** (manager_flexibility = 2) based on the staff profile; **-** if no data available.',
            },
          ],
          source: 'Staff Profile > Additional Details',
          applicability: LIFETIME,
        },
      },
    ],
  },
  {
    id: 'learning',
    title: 'KAPE - L & D, Upskilling & Qualifications',
    groups: [
      {
        title: 'Certifications',
        info: {
          summary: 'This section shows the total certifications earned or uploaded by the selected staff member.',
          rows: [
            { label: 'Internal (CPE)', text: 'Shows the count of certificates earned by the staff member through the internal education platform.' },
            {
              label: 'External',
              text: 'Shows the count of certificates uploaded by the staff member in the Staff Profile for certifications earned from external or third-party platforms.',
            },
          ],
          source:
            'Internal (CPE) certificates are fetched from the internal education platform.\nExternal certificates are fetched from **Staff Profile > Skill Set Module > Uploaded Certificates**.',
          applicability: 'This is lifetime / current-profile data and is not calculated based on the selected date range.',
        },
        items: [
          { label: 'Internal (CPE)', value: '0' },
          { label: 'External', value: '7' },
        ],
      },
    ],
  },
  {
    id: 'conduct',
    title: 'KAPE - Conduct & Compliance',
    groups: [
      {
        title: 'Leaves',
        info: {
          summary: 'This section shows the leave count of the selected staff member during the selected report period.',
          rows: [
            { label: 'Total Leaves', text: 'Shows the total number of leaves applied by the staff member within the selected date range.' },
            { label: 'Unplanned Leaves', text: 'Shows how many leaves out of the total applied leaves were marked as unplanned.' },
          ],
          source: 'Leave Module',
        },
        items: [
          { label: 'Total Leaves', value: '0.00' },
          { label: 'Unplanned Leaves', value: '0.00' },
        ],
      },
      {
        title: 'SOPs',
        info: {
          summary: 'This section shows the SOP contribution and approval status of the selected staff member during the selected report period.',
          rows: [
            { label: 'SOPs Created', text: 'Shows the total number of SOPs created by the staff member within the selected date range.' },
            { label: 'SOPs Approved', text: 'Shows how many of the created SOPs were approved by the client within the selected date range.' },
          ],
        },
        items: [
          { label: 'SOPs Created', value: '0' },
          { label: 'SOPs Approved', value: '0' },
        ],
      },
    ],
    metrics: [
      {
        label: 'Warnings',
        value: '0',
        info: {
          summary: 'This field shows the total number of warnings issued to the selected staff member during the selected report period.',
          rows: [{ label: 'Warnings', text: 'Shows the count of warnings issued to the staff member within the selected date range.' }],
          source: 'Warning Report and Feedback Module',
          applicability: IN_RANGE,
        },
      },
      {
        label: 'Attendance Edit Requests',
        value: '3',
        info: {
          summary: 'This field shows how many times the selected staff member raised an attendance edit request during the selected report period.',
          rows: [
            {
              label: 'Attendance Edit Requests',
              text: 'Shows the count of attendance edit requests raised by the staff member within the selected date range.',
            },
          ],
          applicability: IN_RANGE,
        },
      },
      {
        label: 'Late Timesheet Submission (Week)',
        value: '0',
        info: {
          summary: 'This field shows how many times the selected staff member submitted timesheets late during the selected report period.',
          rows: [
            {
              label: 'Late Timesheet Submission (Week)',
              text: 'Shows the count of weekly or bi-weekly timesheet periods where the staff member submitted the timesheet late within the selected date range.',
            },
          ],
          logic: {
            label: 'Calculation Logic',
            text: 'The system counts each week or bi-weekly timesheet cycle where late submission occurred for the selected staff member.',
          },
          applicability: IN_RANGE,
        },
      },
    ],
  },
];

/** Learning hours completed per calendar year (KAPE - L & D) */
export const LEARNING_HOURS_BY_YEAR: Record<number, number> = {
  2020: 0,
  2021: 0,
  2022: 14,
  2023: 22,
  2024: 18,
  2025: 9,
  2026: 0,
};

export const LEARNING_HOURS_INFO: ReviewInfo = {
  summary:
    'This field shows the total number of learning hours completed by the selected staff member through the Continuing Education platform.',
  rows: [{ label: 'Learning Hours Completed', text: 'Shows the total learning hours completed by the staff member for the selected year.' }],
  source: 'Continuing Education platform',
  logic: {
    label: 'Filter Logic',
    text: 'This field uses its own year filter. Users can change the year to view learning hours completed for that specific year.',
  },
  applicability: 'This is year-based data and is not calculated using the main report **From** and **To** dates.',
};

export const TRAINING_CONTRIBUTIONS = [{ role: 'Resource Curator', count: 7 }];

/** Headline numbers for the snapshot card at the top of the report */
export const REVIEW_SNAPSHOT = [
  { label: 'Appreciations', value: '1', tone: 'emerald' as const },
  { label: 'Certifications', value: '7', tone: 'indigo' as const },
  { label: 'Escalations', value: '0', tone: 'rose' as const },
];
